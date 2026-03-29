import requests
import sys
import json
from datetime import datetime
import io
from PIL import Image

class QRRestaurantAPITester:
    def __init__(self, base_url="https://qr-menu-order-10.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.admin_user = None
        self.restaurant_id = None
        self.category_id = None
        self.menu_item_id = None
        self.order_id = None
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        
        # Remove Content-Type for file uploads
        if files:
            headers.pop('Content-Type', None)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                if files:
                    response = requests.post(url, headers=headers, data=data, files=files, timeout=30)
                else:
                    response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                if files:
                    response = requests.put(url, headers=headers, data=data, files=files, timeout=30)
                else:
                    response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json() if response.content else {}
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_admin_registration(self):
        """Test admin user registration"""
        admin_data = {
            "email": "admin@restaurant.com",
            "password": "admin123",
            "name": "Admin User"
        }
        success, response = self.run_test(
            "Admin Registration",
            "POST",
            "auth/register",
            200,
            data=admin_data
        )
        if success:
            self.admin_user = response
            return True
        return False

    def test_admin_login(self):
        """Test admin login and get token"""
        login_data = {
            "email": "admin@restaurant.com",
            "password": "admin123"
        }
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        if success and 'token' in response:
            self.token = response['token']
            self.admin_user = response.get('user')
            return True
        return False

    def test_create_restaurant(self):
        """Test creating a restaurant"""
        restaurant_data = {
            "name": "Test Restaurant",
            "location": "123 Test Street, Test City",
            "contact": "+1234567890"
        }
        success, response = self.run_test(
            "Create Restaurant",
            "POST",
            "restaurants",
            200,
            data=restaurant_data
        )
        if success and 'id' in response:
            self.restaurant_id = response['id']
            return True
        return False

    def test_get_restaurants(self):
        """Test getting all restaurants"""
        success, response = self.run_test(
            "Get Restaurants",
            "GET",
            "restaurants",
            200
        )
        return success and isinstance(response, list)

    def test_get_restaurant_qr(self):
        """Test getting restaurant QR code"""
        if not self.restaurant_id:
            print("❌ No restaurant ID available for QR test")
            return False
        
        success, _ = self.run_test(
            "Get Restaurant QR Code",
            "GET",
            f"restaurants/{self.restaurant_id}/qr",
            200
        )
        return success

    def test_create_category(self):
        """Test creating a menu category"""
        if not self.restaurant_id:
            print("❌ No restaurant ID available for category test")
            return False
            
        category_data = {
            "restaurant_id": self.restaurant_id,
            "name": "Main Dishes",
            "display_order": 1
        }
        success, response = self.run_test(
            "Create Category",
            "POST",
            "categories",
            200,
            data=category_data
        )
        if success and 'id' in response:
            self.category_id = response['id']
            return True
        return False

    def test_get_categories(self):
        """Test getting categories for a restaurant"""
        if not self.restaurant_id:
            print("❌ No restaurant ID available for categories test")
            return False
            
        success, response = self.run_test(
            "Get Categories",
            "GET",
            f"categories?restaurant_id={self.restaurant_id}",
            200
        )
        return success and isinstance(response, list)

    def test_create_menu_item(self):
        """Test creating a menu item"""
        if not self.restaurant_id or not self.category_id:
            print("❌ No restaurant/category ID available for menu item test")
            return False
            
        item_data = {
            "restaurant_id": self.restaurant_id,
            "category_id": self.category_id,
            "name": "Test Burger",
            "description": "Delicious test burger with all the fixings",
            "price": 12.99
        }
        success, response = self.run_test(
            "Create Menu Item",
            "POST",
            "menu-items",
            200,
            data=item_data
        )
        if success and 'id' in response:
            self.menu_item_id = response['id']
            return True
        return False

    def test_upload_menu_item_image(self):
        """Test uploading an image for a menu item"""
        if not self.menu_item_id:
            print("❌ No menu item ID available for image upload test")
            return False
            
        # Create a simple test image
        img = Image.new('RGB', (100, 100), color='red')
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='JPEG')
        img_bytes.seek(0)
        
        files = {'file': ('test_image.jpg', img_bytes, 'image/jpeg')}
        success, response = self.run_test(
            "Upload Menu Item Image",
            "POST",
            f"menu-items/{self.menu_item_id}/upload-image",
            200,
            files=files
        )
        return success

    def test_get_menu_items(self):
        """Test getting menu items for a restaurant"""
        if not self.restaurant_id:
            print("❌ No restaurant ID available for menu items test")
            return False
            
        success, response = self.run_test(
            "Get Menu Items",
            "GET",
            f"menu-items?restaurant_id={self.restaurant_id}",
            200
        )
        return success and isinstance(response, list)

    def test_update_menu_item_availability(self):
        """Test updating menu item availability"""
        if not self.menu_item_id:
            print("❌ No menu item ID available for availability test")
            return False
            
        update_data = {"is_available": False}
        success, response = self.run_test(
            "Update Menu Item Availability",
            "PUT",
            f"menu-items/{self.menu_item_id}",
            200,
            data=update_data
        )
        return success

    def test_create_order(self):
        """Test creating a customer order"""
        if not self.restaurant_id or not self.menu_item_id:
            print("❌ No restaurant/menu item ID available for order test")
            return False
            
        order_data = {
            "restaurant_id": self.restaurant_id,
            "table_number": "5",
            "items": [
                {
                    "menu_item_id": self.menu_item_id,
                    "name": "Test Burger",
                    "price": 12.99,
                    "quantity": 2
                }
            ],
            "customer_notes": "Extra sauce please"
        }
        success, response = self.run_test(
            "Create Order",
            "POST",
            "orders",
            200,
            data=order_data
        )
        if success and 'id' in response:
            self.order_id = response['id']
            return True
        return False

    def test_get_orders(self):
        """Test getting orders for a restaurant"""
        if not self.restaurant_id:
            print("❌ No restaurant ID available for orders test")
            return False
            
        success, response = self.run_test(
            "Get Orders",
            "GET",
            f"orders?restaurant_id={self.restaurant_id}",
            200
        )
        return success and isinstance(response, list)

    def test_get_order_by_id(self):
        """Test getting a specific order"""
        if not self.order_id:
            print("❌ No order ID available for order retrieval test")
            return False
            
        success, response = self.run_test(
            "Get Order by ID",
            "GET",
            f"orders/{self.order_id}",
            200
        )
        return success

    def test_update_order_status(self):
        """Test updating order status"""
        if not self.order_id:
            print("❌ No order ID available for status update test")
            return False
            
        status_data = {
            "status": "preparing",
            "waiting_time": 15
        }
        success, response = self.run_test(
            "Update Order Status",
            "PUT",
            f"orders/{self.order_id}/status",
            200,
            data=status_data
        )
        return success

    def test_dashboard_stats(self):
        """Test getting dashboard statistics"""
        if not self.restaurant_id:
            print("❌ No restaurant ID available for dashboard stats test")
            return False
            
        success, response = self.run_test(
            "Get Dashboard Stats",
            "GET",
            f"dashboard/stats?restaurant_id={self.restaurant_id}",
            200
        )
        return success and 'total_orders' in response

    def test_root_endpoint(self):
        """Test the root API endpoint"""
        success, response = self.run_test(
            "Root Endpoint",
            "GET",
            "",
            200
        )
        return success

def main():
    print("🚀 Starting QR Restaurant API Tests")
    print("=" * 50)
    
    tester = QRRestaurantAPITester()
    
    # Test sequence
    test_sequence = [
        ("Root Endpoint", tester.test_root_endpoint),
        ("Admin Registration", tester.test_admin_registration),
        ("Admin Login", tester.test_admin_login),
        ("Create Restaurant", tester.test_create_restaurant),
        ("Get Restaurants", tester.test_get_restaurants),
        ("Get Restaurant QR", tester.test_get_restaurant_qr),
        ("Create Category", tester.test_create_category),
        ("Get Categories", tester.test_get_categories),
        ("Create Menu Item", tester.test_create_menu_item),
        ("Upload Menu Item Image", tester.test_upload_menu_item_image),
        ("Get Menu Items", tester.test_get_menu_items),
        ("Update Menu Item Availability", tester.test_update_menu_item_availability),
        ("Create Order", tester.test_create_order),
        ("Get Orders", tester.test_get_orders),
        ("Get Order by ID", tester.test_get_order_by_id),
        ("Update Order Status", tester.test_update_order_status),
        ("Dashboard Stats", tester.test_dashboard_stats),
    ]
    
    failed_tests = []
    
    for test_name, test_func in test_sequence:
        try:
            if not test_func():
                failed_tests.append(test_name)
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {str(e)}")
            failed_tests.append(test_name)
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if failed_tests:
        print(f"\n❌ Failed Tests ({len(failed_tests)}):")
        for test in failed_tests:
            print(f"   - {test}")
    else:
        print("\n🎉 All tests passed!")
    
    print(f"\n📋 Test Summary:")
    print(f"   Admin Token: {'✅' if tester.token else '❌'}")
    print(f"   Restaurant ID: {'✅' if tester.restaurant_id else '❌'}")
    print(f"   Category ID: {'✅' if tester.category_id else '❌'}")
    print(f"   Menu Item ID: {'✅' if tester.menu_item_id else '❌'}")
    print(f"   Order ID: {'✅' if tester.order_id else '❌'}")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())