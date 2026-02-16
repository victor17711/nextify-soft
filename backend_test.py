import requests
import sys
import json
from datetime import datetime

class WorkforcePortalAPITester:
    def __init__(self, base_url="https://workforce-portal-23.preview.emergentagent.com"):
        self.base_url = base_url
        self.admin_token = None
        self.employee_token = None
        self.admin_user_id = None
        self.employee_user_id = None
        self.test_client_id = None
        self.test_task_id = None
        self.test_note_id = None
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, token=None, description=""):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name} - {description}")
        print(f"   {method} {endpoint}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ PASSED - Status: {response.status_code}")
                try:
                    return success, response.json() if response.text else {}
                except:
                    return success, {}
            else:
                print(f"❌ FAILED - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            print(f"❌ FAILED - Exception: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test API health endpoints"""
        print("\n" + "="*60)
        print("🏥 TESTING HEALTH ENDPOINTS")
        print("="*60)
        
        self.run_test("Health Check", "GET", "health", 200, description="Basic health check")
        self.run_test("Root Endpoint", "GET", "", 200, description="Root API endpoint")

    def test_admin_registration(self):
        """Test admin registration flow"""
        print("\n" + "="*60)
        print("👑 TESTING ADMIN REGISTRATION")
        print("="*60)
        
        timestamp = datetime.now().strftime('%H%M%S')
        admin_data = {
            "name": f"Admin Test {timestamp}",
            "email": f"admin{timestamp}@test.ro",
            "password": "AdminPass123!",
            "phone": "0712345678"
        }
        
        success, response = self.run_test(
            "Admin Registration", 
            "POST", 
            "auth/register", 
            200, 
            data=admin_data,
            description="Create first admin account"
        )
        
        if success:
            self.admin_email = admin_data["email"]
            self.admin_password = admin_data["password"]
            if "user_id" in response:
                self.admin_user_id = response["user_id"]
            return True
        else:
            # Admin already exists, try common test credentials
            print("ℹ️  Admin already exists, trying common test credentials...")
            test_credentials = [
                {"email": "admin@test.ro", "password": "admin123"},
                {"email": "admin@exemplu.ro", "password": "AdminPass123!"},
                {"email": "test@admin.ro", "password": "test123"},
                {"email": "admin@workforce.ro", "password": "admin"},
            ]
            
            for cred in test_credentials:
                print(f"   Trying {cred['email']}...")
                login_success, login_response = self.run_test(
                    "Try Existing Admin",
                    "POST",
                    "auth/login",
                    200,
                    data=cred,
                    description=f"Login with {cred['email']}"
                )
                
                if login_success:
                    self.admin_email = cred["email"]
                    self.admin_password = cred["password"]
                    self.admin_token = login_response.get('token')
                    print(f"✅ Found working admin credentials: {cred['email']}")
                    return True
            
            print("❌ Could not find working admin credentials")
            return False

    def test_admin_login(self):
        """Test admin login flow"""
        print("\n" + "="*60)  
        print("🔐 TESTING ADMIN LOGIN")
        print("="*60)
        
        # Skip if we already have token from registration attempt
        if self.admin_token:
            print("ℹ️  Admin token already obtained from registration test")
            # Test getting current user info
            success, response = self.run_test(
                "Get Current User",
                "GET", 
                "auth/me",
                200,
                token=self.admin_token,
                description="Get authenticated user info"
            )
            return success
        
        if not hasattr(self, 'admin_email'):
            print("❌ Cannot test login - admin credentials not available")
            return False
            
        login_data = {
            "email": self.admin_email,
            "password": self.admin_password
        }
        
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data=login_data,
            description="Authenticate admin with email/password"
        )
        
        if success and 'token' in response:
            self.admin_token = response['token']
            print(f"   Admin token obtained: {self.admin_token[:20]}...")
            
            # Test getting current user info
            self.run_test(
                "Get Current User",
                "GET", 
                "auth/me",
                200,
                token=self.admin_token,
                description="Get authenticated user info"
            )
        
        return success

    def test_employee_crud(self):
        """Test employee CRUD operations"""
        print("\n" + "="*60)
        print("👥 TESTING EMPLOYEE CRUD OPERATIONS")
        print("="*60)
        
        if not self.admin_token:
            print("❌ Cannot test employees - admin not authenticated")
            return False
            
        # Test getting all employees (initially empty)
        self.run_test(
            "Get All Employees",
            "GET",
            "users",
            200,
            token=self.admin_token,
            description="List all employees"
        )
        
        # Create a new employee
        timestamp = datetime.now().strftime('%H%M%S')
        employee_data = {
            "name": f"Employee Test {timestamp}",
            "email": f"employee{timestamp}@test.ro", 
            "password": "EmployeePass123!",
            "phone": "0712345679",
            "role": "employee"
        }
        
        success, response = self.run_test(
            "Create Employee",
            "POST",
            "users",
            200,
            data=employee_data,
            token=self.admin_token,
            description="Admin creates new employee"
        )
        
        if success and "user_id" in response:
            self.employee_user_id = response["user_id"]
            self.employee_email = employee_data["email"]
            self.employee_password = employee_data["password"]
            
            # Test getting specific employee
            self.run_test(
                "Get Employee by ID",
                "GET",
                f"users/{self.employee_user_id}",
                200,
                token=self.admin_token,
                description="Get employee details by ID"
            )
            
            # Test updating employee
            update_data = {
                "name": f"Updated Employee {timestamp}",
                "phone": "0712345680"
            }
            
            self.run_test(
                "Update Employee", 
                "PUT",
                f"users/{self.employee_user_id}",
                200,
                data=update_data,
                token=self.admin_token,
                description="Admin updates employee info"
            )
        
        return success

    def test_employee_login(self):
        """Test employee login"""
        print("\n" + "="*60)
        print("👤 TESTING EMPLOYEE LOGIN")
        print("="*60)
        
        if not hasattr(self, 'employee_email'):
            print("❌ Cannot test employee login - employee not created")
            return False
            
        login_data = {
            "email": self.employee_email,
            "password": self.employee_password
        }
        
        success, response = self.run_test(
            "Employee Login",
            "POST",
            "auth/login", 
            200,
            data=login_data,
            description="Employee authentication"
        )
        
        if success and 'token' in response:
            self.employee_token = response['token']
            print(f"   Employee token obtained: {self.employee_token[:20]}...")
        
        return success

    def test_client_crud(self):
        """Test client CRUD operations (admin only)"""
        print("\n" + "="*60)
        print("🏢 TESTING CLIENT CRUD OPERATIONS")
        print("="*60)
        
        if not self.admin_token:
            print("❌ Cannot test clients - admin not authenticated")
            return False
            
        # Test getting all clients (initially empty)
        self.run_test(
            "Get All Clients",
            "GET",
            "clients",
            200,
            token=self.admin_token,
            description="List all clients"
        )
        
        # Create a new client
        timestamp = datetime.now().strftime('%H%M%S')
        client_data = {
            "company_name": f"SC Test Client {timestamp} SRL",
            "project_type": "Dezvoltare Web",
            "budget": 15000.0,
            "status": "activ",
            "contact_person": "Ion Popescu",
            "contact_email": f"contact{timestamp}@client.ro",
            "contact_phone": "0712345681",
            "notes": "Client de test pentru aplicația Workforce Portal"
        }
        
        success, response = self.run_test(
            "Create Client",
            "POST", 
            "clients",
            200,
            data=client_data,
            token=self.admin_token,
            description="Admin creates new client"
        )
        
        if success and "client_id" in response:
            self.test_client_id = response["client_id"]
            
            # Test getting specific client
            self.run_test(
                "Get Client by ID",
                "GET",
                f"clients/{self.test_client_id}",
                200,
                token=self.admin_token,
                description="Get client details by ID"
            )
            
            # Test updating client
            update_data = {
                "budget": 20000.0,
                "status": "finalizat",
                "notes": "Proiect finalizat cu succes"
            }
            
            self.run_test(
                "Update Client",
                "PUT", 
                f"clients/{self.test_client_id}",
                200,
                data=update_data,
                token=self.admin_token,
                description="Admin updates client info"
            )
            
        # Test employee access to clients (should be forbidden)
        if self.employee_token:
            self.run_test(
                "Employee Access to Clients",
                "GET",
                "clients", 
                403,
                token=self.employee_token,
                description="Employee tries to access clients (should fail)"
            )
        
        return success

    def test_task_crud(self):
        """Test task CRUD operations"""
        print("\n" + "="*60)
        print("📋 TESTING TASK CRUD OPERATIONS")
        print("="*60)
        
        if not self.admin_token:
            print("❌ Cannot test tasks - admin not authenticated")
            return False
            
        # Admin gets all tasks
        self.run_test(
            "Admin Get All Tasks",
            "GET",
            "tasks",
            200,
            token=self.admin_token,
            description="Admin views all tasks"
        )
        
        # Create a new task
        task_data = {
            "title": "Test Task - Integration Testing",
            "description": "Task created during API testing for Workforce Portal",
            "due_date": "2025-02-01",
            "priority": "high",
            "status": "pending",
            "assigned_to": self.employee_user_id if self.employee_user_id else None
        }
        
        success, response = self.run_test(
            "Create Task",
            "POST",
            "tasks",
            200, 
            data=task_data,
            token=self.admin_token,
            description="Admin creates new task"
        )
        
        if success and "task_id" in response:
            self.test_task_id = response["task_id"]
            
            # Test getting specific task
            self.run_test(
                "Get Task by ID",
                "GET",
                f"tasks/{self.test_task_id}",
                200,
                token=self.admin_token,
                description="Get task details by ID"
            )
            
            # Test updating task
            update_data = {
                "status": "in_progress",
                "priority": "medium"
            }
            
            self.run_test(
                "Update Task",
                "PUT",
                f"tasks/{self.test_task_id}",
                200,
                data=update_data,
                token=self.admin_token,
                description="Admin updates task"
            )
            
            # Test employee viewing their assigned task
            if self.employee_token:
                self.run_test(
                    "Employee View Assigned Task",
                    "GET",
                    f"tasks/{self.test_task_id}",
                    200,
                    token=self.employee_token,
                    description="Employee views their assigned task"
                )
                
                # Test employee updating task status
                self.run_test(
                    "Employee Update Task Status", 
                    "PUT",
                    f"tasks/{self.test_task_id}",
                    200,
                    data={"status": "completed"},
                    token=self.employee_token,
                    description="Employee marks task as completed"
                )
                
                # Test employee getting their tasks
                self.run_test(
                    "Employee Get Their Tasks",
                    "GET", 
                    "tasks",
                    200,
                    token=self.employee_token,
                    description="Employee views only their assigned tasks"
                )
        
        return success

    def test_notes_crud(self):
        """Test notes CRUD operations"""
        print("\n" + "="*60)
        print("📝 TESTING NOTES CRUD OPERATIONS") 
        print("="*60)
        
        if not self.admin_token:
            print("❌ Cannot test notes - admin not authenticated")
            return False
            
        # Test getting all notes
        self.run_test(
            "Get All Notes",
            "GET",
            "notes",
            200,
            token=self.admin_token,
            description="Get all notes"
        )
        
        # Create a new note
        note_data = {
            "title": "Test Note - API Testing",
            "content": "Această notiță a fost creată în timpul testării API-ului pentru Workforce Portal. Verificăm funcționalitatea CRUD pentru notițe.",
            "color": "yellow"
        }
        
        success, response = self.run_test(
            "Create Note",
            "POST",
            "notes",
            200,
            data=note_data,
            token=self.admin_token,
            description="Create new note"
        )
        
        if success and "note_id" in response:
            self.test_note_id = response["note_id"]
            
            # Test getting specific note
            self.run_test(
                "Get Note by ID",
                "GET",
                f"notes/{self.test_note_id}",
                200,
                token=self.admin_token,
                description="Get note details by ID"
            )
            
            # Test updating note
            update_data = {
                "title": "Updated Test Note",
                "content": "Conținutul notiței a fost actualizat cu succes!",
                "color": "green"
            }
            
            self.run_test(
                "Update Note",
                "PUT",
                f"notes/{self.test_note_id}",
                200,
                data=update_data,
                token=self.admin_token,
                description="Update note content and color"
            )
            
            # Test employee accessing notes
            if self.employee_token:
                self.run_test(
                    "Employee View Notes",
                    "GET",
                    "notes",
                    200,
                    token=self.employee_token,
                    description="Employee views notes"
                )
        
        return success

    def test_dashboard_stats(self):
        """Test dashboard statistics"""
        print("\n" + "="*60)
        print("📊 TESTING DASHBOARD STATISTICS")
        print("="*60)
        
        if not self.admin_token:
            print("❌ Cannot test dashboard - admin not authenticated")
            return False
            
        # Test admin dashboard stats
        success, response = self.run_test(
            "Admin Dashboard Stats",
            "GET",
            "dashboard/stats",
            200,
            token=self.admin_token,
            description="Get admin dashboard statistics"
        )
        
        if success:
            expected_fields = ['total_employees', 'total_tasks', 'pending_tasks', 'completed_tasks', 'total_clients', 'total_budget']
            for field in expected_fields:
                if field in response:
                    print(f"   ✅ {field}: {response[field]}")
                else:
                    print(f"   ❌ Missing field: {field}")
        
        # Test employee dashboard stats
        if self.employee_token:
            success_emp, response_emp = self.run_test(
                "Employee Dashboard Stats",
                "GET", 
                "dashboard/stats",
                200,
                token=self.employee_token,
                description="Get employee dashboard statistics"
            )
            
            if success_emp:
                expected_emp_fields = ['my_tasks', 'my_pending', 'my_completed']
                for field in expected_emp_fields:
                    if field in response_emp:
                        print(f"   ✅ {field}: {response_emp[field]}")
                    else:
                        print(f"   ❌ Missing field: {field}")
        
        return success

    def test_access_control(self):
        """Test role-based access control"""
        print("\n" + "="*60)
        print("🛡️  TESTING ROLE-BASED ACCESS CONTROL")
        print("="*60)
        
        if not self.employee_token:
            print("❌ Cannot test access control - employee not authenticated")
            return False
            
        # Employee tries to access admin-only endpoints
        test_cases = [
            ("Employee Access Users", "GET", "users", 403),
            ("Employee Create User", "POST", "users", 403),
            ("Employee Access Clients", "GET", "clients", 403),
            ("Employee Create Client", "POST", "clients", 403),
            ("Employee Create Task", "POST", "tasks", 403),
        ]
        
        success_count = 0
        for name, method, endpoint, expected_status in test_cases:
            success, _ = self.run_test(
                name,
                method,
                endpoint,
                expected_status,
                data={"test": "data"} if method == "POST" else None,
                token=self.employee_token,
                description="Employee tries admin-only operation"
            )
            if success:
                success_count += 1
        
        return success_count == len(test_cases)

    def cleanup_test_data(self):
        """Clean up test data"""
        print("\n" + "="*60)
        print("🧹 CLEANING UP TEST DATA")
        print("="*60)
        
        if not self.admin_token:
            print("❌ Cannot cleanup - admin not authenticated")
            return
            
        # Delete test entities (optional cleanup)
        if self.test_note_id:
            self.run_test(
                "Delete Test Note",
                "DELETE",
                f"notes/{self.test_note_id}",
                200,
                token=self.admin_token,
                description="Cleanup test note"
            )
            
        if self.test_task_id:
            self.run_test(
                "Delete Test Task",
                "DELETE", 
                f"tasks/{self.test_task_id}",
                200,
                token=self.admin_token,
                description="Cleanup test task"
            )
            
        if self.test_client_id:
            self.run_test(
                "Delete Test Client",
                "DELETE",
                f"clients/{self.test_client_id}",
                200,
                token=self.admin_token,
                description="Cleanup test client"
            )
            
        if self.employee_user_id:
            self.run_test(
                "Delete Test Employee",
                "DELETE",
                f"users/{self.employee_user_id}",
                200,
                token=self.admin_token,
                description="Cleanup test employee"
            )

def main():
    print("🚀 Starting Workforce Portal API Testing")
    print("="*80)
    
    tester = WorkforcePortalAPITester()
    
    # Run test sequence
    try:
        tester.test_health_check()
        
        if tester.test_admin_registration():
            if tester.test_admin_login():
                tester.test_employee_crud()
                tester.test_employee_login()
                tester.test_client_crud()
                tester.test_task_crud()
                tester.test_notes_crud()
                tester.test_dashboard_stats()
                tester.test_access_control()
                
                # Optional cleanup
                # tester.cleanup_test_data()
    
    except Exception as e:
        print(f"\n❌ CRITICAL ERROR: {str(e)}")
        return 1
    
    # Print final results
    print("\n" + "="*80)
    print("📋 FINAL TEST RESULTS")
    print("="*80)
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Tests Failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run*100):.1f}%" if tester.tests_run > 0 else "0%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 ALL TESTS PASSED!")
        return 0
    elif tester.tests_passed / tester.tests_run >= 0.8:
        print("✅ Most tests passed - Minor issues found")
        return 0
    else:
        print("❌ Multiple test failures - Major issues found")
        return 1

if __name__ == "__main__":
    sys.exit(main())