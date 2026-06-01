from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Header, Query, Depends, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import qrcode
from io import BytesIO
import bcrypt
import jwt
import cloudinary
import cloudinary.uploader

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

JWT_SECRET = os.environ.get("JWT_SECRET", "change-me")
JWT_ALGORITHM = "HS256"
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@ezeserve.com")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin123")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "")

cloudinary.config(
    cloud_name=os.environ.get("CLOUDINARY_CLOUD_NAME", ""),
    api_key=os.environ.get("CLOUDINARY_API_KEY", ""),
    api_secret=os.environ.get("CLOUDINARY_API_SECRET", "")
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ===================== MODELS =====================

class AdminUserCreate(BaseModel):
    email: str
    password: str
    name: str
    role: str = "restaurant_admin"
    restaurant_id: Optional[str] = None

class AdminUserUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    restaurant_id: Optional[str] = None
    password: Optional[str] = None

class AdminUserLogin(BaseModel):
    email: str
    password: str

class RestaurantCreate(BaseModel):
    name: str
    location: str
    contact: Optional[str] = None
    tax_percent: float = 5.0
    gst_number: Optional[str] = None
    tax_enabled: bool = True

class CategoryCreate(BaseModel):
    restaurant_id: str
    name: str
    display_order: int = 0

class MenuItemCreate(BaseModel):
    restaurant_id: str
    category_id: str
    name: str
    description: Optional[str] = None
    price: float

class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    is_available: Optional[bool] = None
    category_id: Optional[str] = None

class OrderItem(BaseModel):
    menu_item_id: str
    name: str
    price: float
    quantity: int

class OrderCreate(BaseModel):
    restaurant_id: str
    table_number: Optional[str] = None
    items: List[OrderItem]
    customer_notes: Optional[str] = None

class ManualOrderCreate(BaseModel):
    restaurant_id: str
    table_number: str
    items: List[OrderItem]
    customer_notes: Optional[str] = None

class OrderStatusUpdate(BaseModel):
    status: str
    waiting_time: Optional[int] = None

class OrderItemsUpdate(BaseModel):
    items: List[OrderItem]

class TableCreate(BaseModel):
    restaurant_id: str
    table_number: str
    capacity: int

class BillCreate(BaseModel):
    order_id: str
    discount_amount: float = 0.0
    tax_enabled: Optional[bool] = None
    tax_percent_override: Optional[float] = None

class BillPayment(BaseModel):
    payment_method: str

# ===================== AUTH HELPERS =====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str, role: str, restaurant_id: Optional[str] = None) -> str:
    return jwt.encode({"user_id": user_id, "email": email, "role": role, "restaurant_id": restaurant_id}, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        return jwt.decode(authorization[7:], JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def require_super_admin(authorization: str = Header(None)):
    user = await get_current_user(authorization)
    if user.get("role") != "super_admin":
        raise HTTPException(status_code=403, detail="Super admin access required")
    return user

def check_restaurant_access(user: dict, restaurant_id: str):
    if user["role"] == "super_admin":
        return
    if user.get("restaurant_id") != restaurant_id:
        raise HTTPException(status_code=403, detail="Access denied")

def get_restaurant_scope(user: dict, requested_id: Optional[str] = None) -> Optional[str]:
    if user["role"] == "super_admin":
        return requested_id
    return user.get("restaurant_id")

# ===================== WEBSOCKET MANAGER =====================

class ConnectionManager:
    def __init__(self):
        self.restaurant_conns: dict = {}
        self.order_conns: dict = {}

    async def connect_restaurant(self, ws: WebSocket, rid: str):
        await ws.accept()
        self.restaurant_conns.setdefault(rid, []).append(ws)

    async def connect_order(self, ws: WebSocket, oid: str):
        await ws.accept()
        self.order_conns.setdefault(oid, []).append(ws)

    def disconnect_restaurant(self, ws: WebSocket, rid: str):
        if rid in self.restaurant_conns:
            self.restaurant_conns[rid] = [c for c in self.restaurant_conns[rid] if c != ws]

    def disconnect_order(self, ws: WebSocket, oid: str):
        if oid in self.order_conns:
            self.order_conns[oid] = [c for c in self.order_conns[oid] if c != ws]

    async def broadcast_restaurant(self, rid: str, data: dict):
        dead = []
        for conn in self.restaurant_conns.get(rid, []):
            try:
                await conn.send_json(data)
            except Exception:
                dead.append(conn)
        for d in dead:
            self.restaurant_conns.get(rid, []).remove(d) if d in self.restaurant_conns.get(rid, []) else None

    async def broadcast_order(self, oid: str, data: dict):
        dead = []
        for conn in self.order_conns.get(oid, []):
            try:
                await conn.send_json(data)
            except Exception:
                dead.append(conn)
        for d in dead:
            self.order_conns.get(oid, []).remove(d) if d in self.order_conns.get(oid, []) else None

ws_manager = ConnectionManager()

@app.websocket("/api/ws/restaurant/{restaurant_id}")
async def ws_restaurant(websocket: WebSocket, restaurant_id: str):
    await ws_manager.connect_restaurant(websocket, restaurant_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect_restaurant(websocket, restaurant_id)

@app.websocket("/api/ws/order/{order_id}")
async def ws_order(websocket: WebSocket, order_id: str):
    await ws_manager.connect_order(websocket, order_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect_order(websocket, order_id)

# ===================== AUTH ENDPOINTS =====================

@api_router.post("/auth/login")
async def login(creds: AdminUserLogin):
    admin = await db.admin_users.find_one({"email": creds.email.lower()}, {"_id": 0})
    if not admin or not verify_password(creds.password, admin["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(admin["id"], admin["email"], admin["role"], admin.get("restaurant_id"))
    return {"token": token, "user": {k: v for k, v in admin.items() if k != "password"}}

@api_router.get("/auth/me")
async def get_me(user=Depends(get_current_user)):
    admin = await db.admin_users.find_one({"id": user["user_id"]}, {"_id": 0, "password": 0})
    if not admin:
        raise HTTPException(status_code=404, detail="User not found")
    return admin

# ===================== ADMIN USER MANAGEMENT =====================

@api_router.post("/admin/users")
async def create_admin_user(data: AdminUserCreate, user=Depends(require_super_admin)):
    if await db.admin_users.find_one({"email": data.email.lower()}, {"_id": 0}):
        raise HTTPException(status_code=400, detail="Email already registered")
    if data.role == "restaurant_admin" and not data.restaurant_id:
        raise HTTPException(status_code=400, detail="Restaurant ID required for restaurant admin")
    doc = {
        "id": str(uuid.uuid4()), "email": data.email.lower(), "password": hash_password(data.password),
        "name": data.name, "role": data.role,
        "restaurant_id": data.restaurant_id if data.role == "restaurant_admin" else None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.admin_users.insert_one(doc)
    resp = {k: v for k, v in doc.items() if k not in ("password", "_id")}
    if resp.get("restaurant_id"):
        rest = await db.restaurants.find_one({"id": resp["restaurant_id"]}, {"_id": 0})
        resp["restaurant_name"] = rest["name"] if rest else None
    return resp

@api_router.get("/admin/users")
async def list_admin_users(user=Depends(require_super_admin)):
    users = await db.admin_users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    for u in users:
        if u.get("restaurant_id"):
            rest = await db.restaurants.find_one({"id": u["restaurant_id"]}, {"_id": 0})
            u["restaurant_name"] = rest["name"] if rest else None
        else:
            u["restaurant_name"] = None
    return users

@api_router.delete("/admin/users/{user_id}")
async def delete_admin_user(user_id: str, user=Depends(require_super_admin)):
    if user_id == user["user_id"]:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    result = await db.admin_users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted"}

# ===================== RESTAURANT ENDPOINTS =====================

@api_router.post("/restaurants")
async def create_restaurant(data: RestaurantCreate, user=Depends(require_super_admin)):
    doc = {"id": str(uuid.uuid4()), **data.model_dump(), "created_at": datetime.now(timezone.utc).isoformat()}
    await db.restaurants.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}

@api_router.get("/restaurants")
async def get_restaurants(user=Depends(get_current_user)):
    if user["role"] == "super_admin":
        return await db.restaurants.find({}, {"_id": 0}).to_list(1000)
    return await db.restaurants.find({"id": user.get("restaurant_id")}, {"_id": 0}).to_list(10)

@api_router.get("/restaurants/{restaurant_id}")
async def get_restaurant(restaurant_id: str):
    r = await db.restaurants.find_one({"id": restaurant_id}, {"_id": 0})
    if not r:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return r

@api_router.put("/restaurants/{restaurant_id}")
async def update_restaurant(restaurant_id: str, data: RestaurantCreate, user=Depends(get_current_user)):
    check_restaurant_access(user, restaurant_id)
    await db.restaurants.update_one({"id": restaurant_id}, {"$set": data.model_dump()})
    return await db.restaurants.find_one({"id": restaurant_id}, {"_id": 0})

@api_router.delete("/restaurants/{restaurant_id}")
async def delete_restaurant(restaurant_id: str, user=Depends(require_super_admin)):
    await db.restaurants.delete_one({"id": restaurant_id})
    return {"message": "Restaurant deleted"}

@api_router.get("/restaurants/{restaurant_id}/qr")
async def get_restaurant_qr(restaurant_id: str):
    r = await db.restaurants.find_one({"id": restaurant_id}, {"_id": 0})
    if not r:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    menu_url = f"{FRONTEND_URL}/menu/{restaurant_id}"
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(menu_url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = BytesIO()
    img.save(buf, format='PNG')
    buf.seek(0)
    return StreamingResponse(buf, media_type="image/png")

# ===================== CATEGORY ENDPOINTS =====================

@api_router.post("/categories")
async def create_category(data: CategoryCreate, user=Depends(get_current_user)):
    check_restaurant_access(user, data.restaurant_id)
    doc = {"id": str(uuid.uuid4()), **data.model_dump(), "created_at": datetime.now(timezone.utc).isoformat()}
    await db.categories.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}

@api_router.get("/categories")
async def get_categories(restaurant_id: Optional[str] = None):
    query = {"restaurant_id": restaurant_id} if restaurant_id else {}
    return await db.categories.find(query, {"_id": 0}).sort("display_order", 1).to_list(1000)

@api_router.put("/categories/{category_id}")
async def update_category(category_id: str, data: CategoryCreate, user=Depends(get_current_user)):
    check_restaurant_access(user, data.restaurant_id)
    await db.categories.update_one({"id": category_id}, {"$set": data.model_dump()})
    return await db.categories.find_one({"id": category_id}, {"_id": 0})

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str, user=Depends(get_current_user)):
    cat = await db.categories.find_one({"id": category_id}, {"_id": 0})
    if not cat:
        raise HTTPException(status_code=404, detail="Not found")
    check_restaurant_access(user, cat["restaurant_id"])
    await db.categories.delete_one({"id": category_id})
    return {"message": "Deleted"}

# ===================== MENU ITEM ENDPOINTS =====================

@api_router.post("/menu-items")
async def create_menu_item(data: MenuItemCreate, user=Depends(get_current_user)):
    check_restaurant_access(user, data.restaurant_id)
    doc = {"id": str(uuid.uuid4()), **data.model_dump(), "image_path": None, "is_available": True, "created_at": datetime.now(timezone.utc).isoformat()}
    await db.menu_items.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}

@api_router.get("/menu-items")
async def get_menu_items(restaurant_id: Optional[str] = None, category_id: Optional[str] = None):
    query = {}
    if restaurant_id: query["restaurant_id"] = restaurant_id
    if category_id: query["category_id"] = category_id
    return await db.menu_items.find(query, {"_id": 0}).to_list(1000)

@api_router.put("/menu-items/{item_id}")
async def update_menu_item(item_id: str, data: MenuItemUpdate, user=Depends(get_current_user)):
    item = await db.menu_items.find_one({"id": item_id}, {"_id": 0})
    if not item: raise HTTPException(status_code=404, detail="Not found")
    check_restaurant_access(user, item["restaurant_id"])
    update = {k: v for k, v in data.model_dump().items() if v is not None}
    if update: await db.menu_items.update_one({"id": item_id}, {"$set": update})
    return await db.menu_items.find_one({"id": item_id}, {"_id": 0})

@api_router.delete("/menu-items/{item_id}")
async def delete_menu_item(item_id: str, user=Depends(get_current_user)):
    item = await db.menu_items.find_one({"id": item_id}, {"_id": 0})
    if not item: raise HTTPException(status_code=404, detail="Not found")
    check_restaurant_access(user, item["restaurant_id"])
    await db.menu_items.delete_one({"id": item_id})
    return {"message": "Deleted"}

@api_router.post("/menu-items/{item_id}/upload-image")
async def upload_menu_item_image(item_id: str, file: UploadFile = File(...), user=Depends(get_current_user)):
    item = await db.menu_items.find_one({"id": item_id}, {"_id": 0})
    if not item: raise HTTPException(status_code=404, detail="Not found")
    check_restaurant_access(user, item["restaurant_id"])
    try:
        file_data = await file.read()
        result = cloudinary.uploader.upload(file_data, folder=f"ezeserve/menu-items/{item_id}", resource_type="auto")
        image_url = result.get("secure_url")
        await db.menu_items.update_one({"id": item_id}, {"$set": {"image_path": image_url}})
        return {"image_path": image_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

# ===================== ORDER ENDPOINTS =====================

@api_router.post("/orders")
async def create_order(data: OrderCreate):
    total = sum(i.price * i.quantity for i in data.items)
    doc = {
        "id": str(uuid.uuid4()), "restaurant_id": data.restaurant_id, "table_number": data.table_number,
        "items": [i.model_dump() for i in data.items], "total_amount": total,
        "status": "pending", "waiting_time": None, "customer_notes": data.customer_notes,
        "created_by": "customer", "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.orders.insert_one(doc)
    resp = {k: v for k, v in doc.items() if k != "_id"}
    await ws_manager.broadcast_restaurant(data.restaurant_id, {"type": "new_order", "order": resp})
    return resp

@api_router.post("/orders/manual")
async def create_manual_order(data: ManualOrderCreate, user=Depends(get_current_user)):
    check_restaurant_access(user, data.restaurant_id)
    total = sum(i.price * i.quantity for i in data.items)
    doc = {
        "id": str(uuid.uuid4()), "restaurant_id": data.restaurant_id, "table_number": data.table_number,
        "items": [i.model_dump() for i in data.items], "total_amount": total,
        "status": "pending", "waiting_time": None, "customer_notes": data.customer_notes,
        "created_by": "admin", "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.orders.insert_one(doc)
    resp = {k: v for k, v in doc.items() if k != "_id"}
    await ws_manager.broadcast_restaurant(data.restaurant_id, {"type": "new_order", "order": resp})
    return resp

@api_router.get("/orders")
async def get_orders(restaurant_id: Optional[str] = None, status: Optional[str] = None, user=Depends(get_current_user)):
    rid = get_restaurant_scope(user, restaurant_id)
    query = {}
    if rid: query["restaurant_id"] = rid
    if status: query["status"] = status
    return await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order: raise HTTPException(status_code=404, detail="Not found")
    return order

@api_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, data: OrderStatusUpdate, user=Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order: raise HTTPException(status_code=404, detail="Not found")
    check_restaurant_access(user, order["restaurant_id"])
    update = {"status": data.status, "updated_at": datetime.now(timezone.utc).isoformat()}
    if data.waiting_time is not None: update["waiting_time"] = data.waiting_time
    await db.orders.update_one({"id": order_id}, {"$set": update})
    updated = await db.orders.find_one({"id": order_id}, {"_id": 0})
    await ws_manager.broadcast_restaurant(order["restaurant_id"], {"type": "order_updated", "order": updated})
    await ws_manager.broadcast_order(order_id, {"type": "status_update", "order": updated})
    return updated

@api_router.put("/orders/{order_id}/items")
async def update_order_items(order_id: str, data: OrderItemsUpdate, user=Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order: raise HTTPException(status_code=404, detail="Not found")
    check_restaurant_access(user, order["restaurant_id"])
    new_total = sum(i.price * i.quantity for i in data.items)
    await db.orders.update_one({"id": order_id}, {"$set": {"items": [i.model_dump() for i in data.items], "total_amount": new_total, "updated_at": datetime.now(timezone.utc).isoformat()}})
    updated = await db.orders.find_one({"id": order_id}, {"_id": 0})
    await ws_manager.broadcast_restaurant(order["restaurant_id"], {"type": "order_updated", "order": updated})
    await ws_manager.broadcast_order(order_id, {"type": "order_updated", "order": updated})
    return updated

# ===================== TABLE ENDPOINTS =====================

@api_router.post("/tables")
async def create_table(data: TableCreate, user=Depends(get_current_user)):
    check_restaurant_access(user, data.restaurant_id)
    doc = {"id": str(uuid.uuid4()), **data.model_dump(), "status": "available", "created_at": datetime.now(timezone.utc).isoformat()}
    await db.tables.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}

@api_router.get("/tables")
async def get_tables(restaurant_id: Optional[str] = None, user=Depends(get_current_user)):
    rid = get_restaurant_scope(user, restaurant_id)
    query = {"restaurant_id": rid} if rid else {}
    return await db.tables.find(query, {"_id": 0}).to_list(1000)

@api_router.put("/tables/{table_id}/status")
async def update_table_status(table_id: str, status: str = Query(...), user=Depends(get_current_user)):
    table = await db.tables.find_one({"id": table_id}, {"_id": 0})
    if not table: raise HTTPException(status_code=404, detail="Not found")
    check_restaurant_access(user, table["restaurant_id"])
    await db.tables.update_one({"id": table_id}, {"$set": {"status": status}})
    return {"message": "Updated"}

@api_router.delete("/tables/{table_id}")
async def delete_table(table_id: str, user=Depends(get_current_user)):
    table = await db.tables.find_one({"id": table_id}, {"_id": 0})
    if not table: raise HTTPException(status_code=404, detail="Not found")
    check_restaurant_access(user, table["restaurant_id"])
    await db.tables.delete_one({"id": table_id})
    return {"message": "Deleted"}

@api_router.get("/tables/{table_id}/qr")
async def get_table_qr(table_id: str):
    table = await db.tables.find_one({"id": table_id}, {"_id": 0})
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    menu_url = f"{FRONTEND_URL}/menu/{table['restaurant_id']}?table={table['table_number']}"
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(menu_url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = BytesIO()
    img.save(buf, format='PNG')
    buf.seek(0)
    return StreamingResponse(buf, media_type="image/png")

# ===================== BILLING ENDPOINTS =====================

@api_router.post("/bills")
async def create_bill(data: BillCreate, user=Depends(get_current_user)):
    order = await db.orders.find_one({"id": data.order_id}, {"_id": 0})
    if not order: raise HTTPException(status_code=404, detail="Order not found")
    check_restaurant_access(user, order["restaurant_id"])
    if await db.bills.find_one({"order_id": data.order_id}, {"_id": 0}):
        raise HTTPException(status_code=400, detail="Bill already exists for this order")
    restaurant = await db.restaurants.find_one({"id": order["restaurant_id"]}, {"_id": 0})
    default_tax = restaurant.get("tax_percent", 5.0) if restaurant else 5.0
    default_enabled = restaurant.get("tax_enabled", True) if restaurant else True
    gst_number = restaurant.get("gst_number") if restaurant else None
    tax_enabled = data.tax_enabled if data.tax_enabled is not None else default_enabled
    tax_pct = data.tax_percent_override if data.tax_percent_override is not None else default_tax
    if not tax_enabled:
        tax_pct = 0.0
    subtotal = order["total_amount"]
    tax_amt = round(subtotal * tax_pct / 100, 2)
    total = round(subtotal + tax_amt - data.discount_amount, 2)
    bill_count = await db.bills.count_documents({"restaurant_id": order["restaurant_id"]})
    doc = {
        "id": str(uuid.uuid4()), "bill_number": bill_count + 1, "order_id": order["id"],
        "restaurant_id": order["restaurant_id"], "table_number": order.get("table_number"),
        "items": order["items"], "subtotal": subtotal, "tax_percent": tax_pct,
        "tax_amount": tax_amt, "tax_enabled": tax_enabled, "gst_number": gst_number,
        "discount_amount": data.discount_amount, "total": total,
        "payment_method": None, "payment_status": "unpaid",
        "created_at": datetime.now(timezone.utc).isoformat(), "paid_at": None
    }
    await db.bills.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}

@api_router.get("/bills")
async def get_bills(restaurant_id: Optional[str] = None, payment_status: Optional[str] = None, user=Depends(get_current_user)):
    rid = get_restaurant_scope(user, restaurant_id)
    query = {}
    if rid: query["restaurant_id"] = rid
    if payment_status: query["payment_status"] = payment_status
    return await db.bills.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)

@api_router.get("/bills/order/{order_id}")
async def get_bill_by_order(order_id: str):
    bill = await db.bills.find_one({"order_id": order_id}, {"_id": 0})
    if not bill: raise HTTPException(status_code=404, detail="No bill for this order")
    return bill

@api_router.get("/bills/{bill_id}")
async def get_bill(bill_id: str, user=Depends(get_current_user)):
    bill = await db.bills.find_one({"id": bill_id}, {"_id": 0})
    if not bill: raise HTTPException(status_code=404, detail="Not found")
    check_restaurant_access(user, bill["restaurant_id"])
    return bill

@api_router.put("/bills/{bill_id}/pay")
async def pay_bill(bill_id: str, data: BillPayment, user=Depends(get_current_user)):
    bill = await db.bills.find_one({"id": bill_id}, {"_id": 0})
    if not bill: raise HTTPException(status_code=404, detail="Not found")
    check_restaurant_access(user, bill["restaurant_id"])
    await db.bills.update_one({"id": bill_id}, {"$set": {"payment_method": data.payment_method, "payment_status": "paid", "paid_at": datetime.now(timezone.utc).isoformat()}})
    return await db.bills.find_one({"id": bill_id}, {"_id": 0})

# ===================== DASHBOARD =====================

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(restaurant_id: Optional[str] = None, user=Depends(get_current_user)):
    rid = get_restaurant_scope(user, restaurant_id)
    query = {"restaurant_id": rid} if rid else {}
    orders = await db.orders.find(query, {"_id": 0}).to_list(10000)
    bills = await db.bills.find(query, {"_id": 0}).to_list(10000)
    return {
        "total_orders": len(orders),
        "pending_orders": len([o for o in orders if o["status"] == "pending"]),
        "preparing_orders": len([o for o in orders if o["status"] == "preparing"]),
        "ready_orders": len([o for o in orders if o["status"] == "ready"]),
        "completed_orders": len([o for o in orders if o["status"] == "completed"]),
        "total_revenue": sum(b["total"] for b in bills if b["payment_status"] == "paid"),
        "total_bills": len(bills),
        "paid_bills": len([b for b in bills if b["payment_status"] == "paid"]),
        "unpaid_bills": len([b for b in bills if b["payment_status"] == "unpaid"])
    }

@api_router.get("/")
async def root():
    return {"message": "ezeserve API v2"}

# ===================== APP SETUP =====================

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware, allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"], allow_headers=["*"],
)

async def seed_super_admin():
    existing = await db.admin_users.find_one({"email": ADMIN_EMAIL.lower()}, {"_id": 0})
    if not existing:
        doc = {
            "id": str(uuid.uuid4()), "email": ADMIN_EMAIL.lower(),
            "password": hash_password(ADMIN_PASSWORD), "name": "Super Admin",
            "role": "super_admin", "restaurant_id": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.admin_users.insert_one(doc)
        logger.info(f"Super admin seeded: {ADMIN_EMAIL}")

@app.on_event("startup")
async def startup():
    await seed_super_admin()
    await db.admin_users.create_index("email", unique=True)
    logger.info("ezeserve API started")

@app.on_event("shutdown")
async def shutdown():
    client.close()
