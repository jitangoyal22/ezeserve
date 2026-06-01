"""
ezeserve backend tests - covers auth, RBAC, restaurants, orders, bills, dashboard, websocket.
"""
import os
import uuid
import asyncio
import json
import pytest
import requests
import websockets

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://agent-connect-89.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"
WS_BASE = BASE_URL.replace("https://", "wss://").replace("http://", "ws://")

SUPER_EMAIL = "admin@ezeserve.com"
SUPER_PASS = "admin123"


# ===================== Fixtures =====================
@pytest.fixture(scope="session")
def super_token():
    r = requests.post(f"{API}/auth/login", json={"email": SUPER_EMAIL, "password": SUPER_PASS}, timeout=15)
    assert r.status_code == 200, f"Super admin login failed: {r.status_code} {r.text}"
    data = r.json()
    assert data["user"]["role"] == "super_admin"
    return data["token"]


@pytest.fixture(scope="session")
def super_headers(super_token):
    return {"Authorization": f"Bearer {super_token}"}


@pytest.fixture(scope="session")
def restaurant(super_headers):
    payload = {"name": f"TEST_Resto_{uuid.uuid4().hex[:6]}", "location": "Test Loc", "contact": "12345", "tax_percent": 10.0}
    r = requests.post(f"{API}/restaurants", json=payload, headers=super_headers, timeout=15)
    assert r.status_code == 200, r.text
    return r.json()


@pytest.fixture(scope="session")
def restaurant2(super_headers):
    payload = {"name": f"TEST_Resto2_{uuid.uuid4().hex[:6]}", "location": "Other", "tax_percent": 5.0}
    r = requests.post(f"{API}/restaurants", json=payload, headers=super_headers, timeout=15)
    assert r.status_code == 200, r.text
    return r.json()


@pytest.fixture(scope="session")
def restaurant_admin(super_headers, restaurant):
    email = f"test_radmin_{uuid.uuid4().hex[:6]}@example.com"
    password = "TestPass123"
    payload = {"email": email, "password": password, "name": "Test RAdmin", "role": "restaurant_admin", "restaurant_id": restaurant["id"]}
    r = requests.post(f"{API}/admin/users", json=payload, headers=super_headers, timeout=15)
    assert r.status_code == 200, r.text
    return {"email": email, "password": password, "id": r.json()["id"], "restaurant_id": restaurant["id"]}


@pytest.fixture(scope="session")
def restaurant_admin_headers(restaurant_admin):
    r = requests.post(f"{API}/auth/login", json={"email": restaurant_admin["email"], "password": restaurant_admin["password"]}, timeout=15)
    assert r.status_code == 200
    return {"Authorization": f"Bearer {r.json()['token']}"}


# ===================== Auth =====================
class TestAuth:
    def test_super_admin_login(self):
        r = requests.post(f"{API}/auth/login", json={"email": SUPER_EMAIL, "password": SUPER_PASS}, timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert "token" in data and len(data["token"]) > 0
        assert data["user"]["role"] == "super_admin"
        assert data["user"]["email"] == SUPER_EMAIL
        assert "password" not in data["user"]

    def test_login_invalid(self):
        r = requests.post(f"{API}/auth/login", json={"email": SUPER_EMAIL, "password": "wrong"}, timeout=15)
        assert r.status_code == 401

    def test_auth_me(self, super_headers):
        r = requests.get(f"{API}/auth/me", headers=super_headers, timeout=15)
        assert r.status_code == 200
        assert r.json()["email"] == SUPER_EMAIL
        assert r.json()["role"] == "super_admin"

    def test_auth_me_no_token(self):
        r = requests.get(f"{API}/auth/me", timeout=15)
        assert r.status_code == 401


# ===================== Admin users / RBAC =====================
class TestAdminUsers:
    def test_create_restaurant_admin(self, restaurant_admin):
        # fixture already created; verify login works
        r = requests.post(f"{API}/auth/login", json={"email": restaurant_admin["email"], "password": restaurant_admin["password"]}, timeout=15)
        assert r.status_code == 200
        assert r.json()["user"]["role"] == "restaurant_admin"
        assert r.json()["user"]["restaurant_id"] == restaurant_admin["restaurant_id"]

    def test_list_admin_users_requires_super(self, super_headers, restaurant_admin_headers):
        r = requests.get(f"{API}/admin/users", headers=super_headers, timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), list)
        # restaurant admin should get 403
        r2 = requests.get(f"{API}/admin/users", headers=restaurant_admin_headers, timeout=15)
        assert r2.status_code == 403

    def test_restaurant_admin_cannot_create_restaurant(self, restaurant_admin_headers):
        r = requests.post(f"{API}/restaurants", json={"name": "X", "location": "X"}, headers=restaurant_admin_headers, timeout=15)
        assert r.status_code == 403


# ===================== Restaurants =====================
class TestRestaurants:
    def test_super_admin_sees_all(self, super_headers, restaurant, restaurant2):
        r = requests.get(f"{API}/restaurants", headers=super_headers, timeout=15)
        assert r.status_code == 200
        ids = [x["id"] for x in r.json()]
        assert restaurant["id"] in ids and restaurant2["id"] in ids

    def test_restaurant_admin_scoped(self, restaurant_admin_headers, restaurant, restaurant2):
        r = requests.get(f"{API}/restaurants", headers=restaurant_admin_headers, timeout=15)
        assert r.status_code == 200
        ids = [x["id"] for x in r.json()]
        assert ids == [restaurant["id"]]
        assert restaurant2["id"] not in ids


# ===================== Orders =====================
class TestOrders:
    def test_public_order_creation(self, restaurant):
        payload = {
            "restaurant_id": restaurant["id"], "table_number": "5",
            "items": [{"menu_item_id": "m1", "name": "Pizza", "price": 10.0, "quantity": 2}],
            "customer_notes": "extra cheese"
        }
        r = requests.post(f"{API}/orders", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        o = r.json()
        assert o["total_amount"] == 20.0
        assert o["status"] == "pending"
        assert o["created_by"] == "customer"
        # Verify GET persistence
        r2 = requests.get(f"{API}/orders/{o['id']}", timeout=15)
        assert r2.status_code == 200
        assert r2.json()["id"] == o["id"]

    def test_manual_order_requires_auth(self, restaurant):
        r = requests.post(f"{API}/orders/manual", json={
            "restaurant_id": restaurant["id"], "table_number": "1",
            "items": [{"menu_item_id": "m", "name": "Soda", "price": 3.0, "quantity": 1}]
        }, timeout=15)
        assert r.status_code == 401

    def test_manual_order_creation(self, super_headers, restaurant):
        payload = {
            "restaurant_id": restaurant["id"], "table_number": "9",
            "items": [{"menu_item_id": "m2", "name": "Burger", "price": 8.0, "quantity": 1}]
        }
        r = requests.post(f"{API}/orders/manual", json=payload, headers=super_headers, timeout=15)
        assert r.status_code == 200
        assert r.json()["created_by"] == "admin"
        assert r.json()["total_amount"] == 8.0

    def test_update_status(self, super_headers, restaurant):
        # Create order
        c = requests.post(f"{API}/orders", json={
            "restaurant_id": restaurant["id"], "table_number": "3",
            "items": [{"menu_item_id": "x", "name": "Tea", "price": 2.0, "quantity": 1}]
        }, timeout=15).json()
        r = requests.put(f"{API}/orders/{c['id']}/status", json={"status": "preparing", "waiting_time": 15}, headers=super_headers, timeout=15)
        assert r.status_code == 200
        assert r.json()["status"] == "preparing"
        assert r.json()["waiting_time"] == 15
        # Verify persisted
        g = requests.get(f"{API}/orders/{c['id']}", timeout=15).json()
        assert g["status"] == "preparing"

    def test_restaurant_admin_cannot_access_other_restaurant_order(self, restaurant_admin_headers, super_headers, restaurant2):
        # Order in restaurant2
        o = requests.post(f"{API}/orders", json={
            "restaurant_id": restaurant2["id"], "table_number": "1",
            "items": [{"menu_item_id": "x", "name": "Item", "price": 5.0, "quantity": 1}]
        }, timeout=15).json()
        # Try to update from restaurant_admin (assigned to restaurant1)
        r = requests.put(f"{API}/orders/{o['id']}/status", json={"status": "preparing"}, headers=restaurant_admin_headers, timeout=15)
        assert r.status_code == 403

    def test_orders_list_scoped(self, restaurant_admin_headers, restaurant, restaurant2):
        # Create orders in both
        requests.post(f"{API}/orders", json={"restaurant_id": restaurant["id"], "table_number": "1", "items": [{"menu_item_id": "x", "name": "a", "price": 1.0, "quantity": 1}]}, timeout=15)
        requests.post(f"{API}/orders", json={"restaurant_id": restaurant2["id"], "table_number": "1", "items": [{"menu_item_id": "x", "name": "a", "price": 1.0, "quantity": 1}]}, timeout=15)
        r = requests.get(f"{API}/orders", headers=restaurant_admin_headers, timeout=15)
        assert r.status_code == 200
        for o in r.json():
            assert o["restaurant_id"] == restaurant["id"]


# ===================== Bills =====================
class TestBills:
    def test_create_bill_with_tax_and_pay(self, super_headers, restaurant):
        # Create order
        order = requests.post(f"{API}/orders", json={
            "restaurant_id": restaurant["id"], "table_number": "7",
            "items": [{"menu_item_id": "x", "name": "Meal", "price": 100.0, "quantity": 1}]
        }, timeout=15).json()
        # Mark completed
        requests.put(f"{API}/orders/{order['id']}/status", json={"status": "completed"}, headers=super_headers, timeout=15)
        # Create bill - tax_percent on restaurant = 10
        r = requests.post(f"{API}/bills", json={"order_id": order["id"], "discount_amount": 5.0}, headers=super_headers, timeout=15)
        assert r.status_code == 200, r.text
        b = r.json()
        assert b["subtotal"] == 100.0
        assert b["tax_percent"] == 10.0
        assert b["tax_amount"] == 10.0
        assert b["total"] == 105.0  # 100 + 10 - 5
        assert b["payment_status"] == "unpaid"
        # Duplicate bill
        dup = requests.post(f"{API}/bills", json={"order_id": order["id"]}, headers=super_headers, timeout=15)
        assert dup.status_code == 400
        # Mark paid
        p = requests.put(f"{API}/bills/{b['id']}/pay", json={"payment_method": "cash"}, headers=super_headers, timeout=15)
        assert p.status_code == 200
        assert p.json()["payment_status"] == "paid"
        assert p.json()["payment_method"] == "cash"
        assert p.json()["paid_at"] is not None

    def test_list_bills_filtered(self, super_headers, restaurant):
        r = requests.get(f"{API}/bills?restaurant_id={restaurant['id']}&payment_status=paid", headers=super_headers, timeout=15)
        assert r.status_code == 200
        for b in r.json():
            assert b["payment_status"] == "paid"


# ===================== Dashboard =====================
class TestDashboard:
    def test_super_admin_stats(self, super_headers):
        r = requests.get(f"{API}/dashboard/stats", headers=super_headers, timeout=15)
        assert r.status_code == 200
        d = r.json()
        for k in ["total_orders", "pending_orders", "preparing_orders", "ready_orders", "completed_orders", "total_revenue", "total_bills", "paid_bills", "unpaid_bills"]:
            assert k in d

    def test_restaurant_admin_stats_scoped(self, restaurant_admin_headers):
        r = requests.get(f"{API}/dashboard/stats", headers=restaurant_admin_headers, timeout=15)
        assert r.status_code == 200


# ===================== WebSocket =====================
class TestWebSocket:
    def test_ws_restaurant_connect(self, restaurant):
        async def _run():
            url = f"{WS_BASE}/api/ws/restaurant/{restaurant['id']}"
            async with websockets.connect(url, ping_interval=None) as ws:
                # Trigger an order; should receive a broadcast
                resp = requests.post(f"{API}/orders", json={
                    "restaurant_id": restaurant["id"], "table_number": "ws",
                    "items": [{"menu_item_id": "x", "name": "wsItem", "price": 1.0, "quantity": 1}]
                }, timeout=15)
                assert resp.status_code == 200
                try:
                    msg = await asyncio.wait_for(ws.recv(), timeout=8)
                    data = json.loads(msg)
                    assert data.get("type") == "new_order"
                    assert data["order"]["restaurant_id"] == restaurant["id"]
                except asyncio.TimeoutError:
                    pytest.fail("Did not receive websocket broadcast within timeout")
        asyncio.run(_run())
