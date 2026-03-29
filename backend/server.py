from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Header, Query, Depends
from fastapi.responses import Response, StreamingResponse
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
import requests
import qrcode
from io import BytesIO
import bcrypt
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "qr-restaurant"
storage_key = None

JWT_SECRET = os.environ.get("JWT_SECRET", "your-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"

def init_storage():
    global storage_key
    if storage_key:
        return storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
    resp.raise_for_status()
    storage_key = resp.json()["storage_key"]
    return storage_key

def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120
    )
    resp.raise_for_status()
    return resp.json()

def get_object(path: str) -> tuple:
    key = init_storage()
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key}, timeout=60
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

class AdminUserCreate(BaseModel):
    email: str
    password: str
    name: str

class AdminUserLogin(BaseModel):
    email: str
    password: str

class AdminUser(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str
    created_at: str

class Restaurant(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    location: str
    contact: Optional[str] = None
    created_at: str

class RestaurantCreate(BaseModel):
    name: str
    location: str
    contact: Optional[str] = None

class Category(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    restaurant_id: str
    name: str
    display_order: int = 0
    created_at: str

class CategoryCreate(BaseModel):
    restaurant_id: str
    name: str
    display_order: int = 0

class MenuItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    restaurant_id: str
    category_id: str
    name: str
    description: Optional[str] = None
    price: float
    image_path: Optional[str] = None
    is_available: bool = True
    created_at: str

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

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    restaurant_id: str
    table_number: Optional[str] = None
    items: List[OrderItem]
    total_amount: float
    status: str
    waiting_time: Optional[int] = None
    customer_notes: Optional[str] = None
    created_at: str
    updated_at: str

class OrderCreate(BaseModel):
    restaurant_id: str
    table_number: Optional[str] = None
    items: List[OrderItem]
    customer_notes: Optional[str] = None

class OrderStatusUpdate(BaseModel):
    status: str
    waiting_time: Optional[int] = None

class DashboardStats(BaseModel):
    total_orders: int
    pending_orders: int
    completed_orders: int
    total_revenue: float

def verify_token(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    token = authorization.replace("Bearer ", "")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

@api_router.post("/auth/register", response_model=AdminUser)
async def register_admin(user: AdminUserCreate):
    existing = await db.admin_users.find_one({"email": user.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt())
    admin_doc = {
        "id": str(uuid.uuid4()),
        "email": user.email,
        "password": hashed.decode('utf-8'),
        "name": user.name,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.admin_users.insert_one(admin_doc)
    return AdminUser(**{k: v for k, v in admin_doc.items() if k != "password"})

@api_router.post("/auth/login")
async def login_admin(credentials: AdminUserLogin):
    admin = await db.admin_users.find_one({"email": credentials.email}, {"_id": 0})
    if not admin or not bcrypt.checkpw(credentials.password.encode('utf-8'), admin["password"].encode('utf-8')):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = jwt.encode({
        "user_id": admin["id"],
        "email": admin["email"]
    }, JWT_SECRET, algorithm=JWT_ALGORITHM)
    
    return {"token": token, "user": {"id": admin["id"], "email": admin["email"], "name": admin["name"]}}

@api_router.post("/restaurants", response_model=Restaurant)
async def create_restaurant(restaurant: RestaurantCreate, user=Depends(verify_token)):
    doc = {
        "id": str(uuid.uuid4()),
        **restaurant.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.restaurants.insert_one(doc)
    return Restaurant(**doc)

@api_router.get("/restaurants", response_model=List[Restaurant])
async def get_restaurants():
    restaurants = await db.restaurants.find({}, {"_id": 0}).to_list(1000)
    return restaurants

@api_router.get("/restaurants/{restaurant_id}", response_model=Restaurant)
async def get_restaurant(restaurant_id: str):
    restaurant = await db.restaurants.find_one({"id": restaurant_id}, {"_id": 0})
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return restaurant

@api_router.put("/restaurants/{restaurant_id}", response_model=Restaurant)
async def update_restaurant(restaurant_id: str, restaurant: RestaurantCreate, user=Depends(verify_token)):
    result = await db.restaurants.update_one(
        {"id": restaurant_id},
        {"$set": restaurant.model_dump()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    updated = await db.restaurants.find_one({"id": restaurant_id}, {"_id": 0})
    return updated

@api_router.delete("/restaurants/{restaurant_id}")
async def delete_restaurant(restaurant_id: str, user=Depends(verify_token)):
    result = await db.restaurants.delete_one({"id": restaurant_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return {"message": "Restaurant deleted successfully"}

@api_router.get("/restaurants/{restaurant_id}/qr")
async def get_restaurant_qr(restaurant_id: str):
    restaurant = await db.restaurants.find_one({"id": restaurant_id}, {"_id": 0})
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    frontend_url = os.environ.get("FRONTEND_URL", "https://qr-menu-order-10.preview.emergentagent.com")
    menu_url = f"{frontend_url}/menu/{restaurant_id}"
    
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(menu_url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    buf = BytesIO()
    img.save(buf, format='PNG')
    buf.seek(0)
    
    return StreamingResponse(buf, media_type="image/png")

@api_router.post("/categories", response_model=Category)
async def create_category(category: CategoryCreate, user=Depends(verify_token)):
    doc = {
        "id": str(uuid.uuid4()),
        **category.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.categories.insert_one(doc)
    return Category(**doc)

@api_router.get("/categories", response_model=List[Category])
async def get_categories(restaurant_id: Optional[str] = None):
    query = {"restaurant_id": restaurant_id} if restaurant_id else {}
    categories = await db.categories.find(query, {"_id": 0}).sort("display_order", 1).to_list(1000)
    return categories

@api_router.put("/categories/{category_id}", response_model=Category)
async def update_category(category_id: str, category: CategoryCreate, user=Depends(verify_token)):
    result = await db.categories.update_one(
        {"id": category_id},
        {"$set": category.model_dump()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    updated = await db.categories.find_one({"id": category_id}, {"_id": 0})
    return updated

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str, user=Depends(verify_token)):
    result = await db.categories.delete_one({"id": category_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted successfully"}

@api_router.post("/menu-items", response_model=MenuItem)
async def create_menu_item(item: MenuItemCreate, user=Depends(verify_token)):
    doc = {
        "id": str(uuid.uuid4()),
        **item.model_dump(),
        "image_path": None,
        "is_available": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.menu_items.insert_one(doc)
    return MenuItem(**doc)

@api_router.get("/menu-items", response_model=List[MenuItem])
async def get_menu_items(restaurant_id: Optional[str] = None, category_id: Optional[str] = None):
    query = {}
    if restaurant_id:
        query["restaurant_id"] = restaurant_id
    if category_id:
        query["category_id"] = category_id
    items = await db.menu_items.find(query, {"_id": 0}).to_list(1000)
    return items

@api_router.put("/menu-items/{item_id}", response_model=MenuItem)
async def update_menu_item(item_id: str, item: MenuItemUpdate, user=Depends(verify_token)):
    update_data = {k: v for k, v in item.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.menu_items.update_one(
        {"id": item_id},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Menu item not found")
    updated = await db.menu_items.find_one({"id": item_id}, {"_id": 0})
    return updated

@api_router.delete("/menu-items/{item_id}")
async def delete_menu_item(item_id: str, user=Depends(verify_token)):
    result = await db.menu_items.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return {"message": "Menu item deleted successfully"}

@api_router.post("/menu-items/{item_id}/upload-image")
async def upload_menu_item_image(item_id: str, file: UploadFile = File(...), user=Depends(verify_token)):
    menu_item = await db.menu_items.find_one({"id": item_id}, {"_id": 0})
    if not menu_item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    path = f"{APP_NAME}/menu-items/{item_id}/{uuid.uuid4()}.{ext}"
    data = await file.read()
    result = put_object(path, data, file.content_type or "image/jpeg")
    
    await db.menu_items.update_one(
        {"id": item_id},
        {"$set": {"image_path": result["path"]}}
    )
    
    return {"image_path": result["path"], "message": "Image uploaded successfully"}

@api_router.get("/images/{path:path}")
async def get_image(path: str):
    try:
        data, content_type = get_object(path)
        return Response(content=data, media_type=content_type)
    except Exception:
        raise HTTPException(status_code=404, detail="Image not found")

@api_router.post("/orders", response_model=Order)
async def create_order(order: OrderCreate):
    total = sum(item.price * item.quantity for item in order.items)
    doc = {
        "id": str(uuid.uuid4()),
        **order.model_dump(),
        "total_amount": total,
        "status": "pending",
        "waiting_time": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.orders.insert_one(doc)
    return Order(**doc)

@api_router.get("/orders", response_model=List[Order])
async def get_orders(restaurant_id: Optional[str] = None, status: Optional[str] = None):
    query = {}
    if restaurant_id:
        query["restaurant_id"] = restaurant_id
    if status:
        query["status"] = status
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return orders

@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@api_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, status_update: OrderStatusUpdate, user=Depends(verify_token)):
    update_data = {
        "status": status_update.status,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    if status_update.waiting_time is not None:
        update_data["waiting_time"] = status_update.waiting_time
    
    result = await db.orders.update_one(
        {"id": order_id},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    updated = await db.orders.find_one({"id": order_id}, {"_id": 0})
    return updated

@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(restaurant_id: Optional[str] = None, user=Depends(verify_token)):
    query = {"restaurant_id": restaurant_id} if restaurant_id else {}
    
    all_orders = await db.orders.find(query, {"_id": 0}).to_list(10000)
    
    total_orders = len(all_orders)
    pending_orders = len([o for o in all_orders if o["status"] == "pending"])
    completed_orders = len([o for o in all_orders if o["status"] == "completed"])
    total_revenue = sum(o["total_amount"] for o in all_orders if o["status"] == "completed")
    
    return DashboardStats(
        total_orders=total_orders,
        pending_orders=pending_orders,
        completed_orders=completed_orders,
        total_revenue=total_revenue
    )

@api_router.get("/")
async def root():
    return {"message": "QR Restaurant Ordering API"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup():
    try:
        init_storage()
        logger.info("Storage initialized")
    except Exception as e:
        logger.error(f"Storage init failed: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()