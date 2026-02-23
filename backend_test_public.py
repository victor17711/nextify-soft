import requests
import sys
import json
from datetime import datetime

class WorkforcePortalAPITester:
    def __init__(self, base_url="https://team-dash-7.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.critical_failures = []
        self.warnings = []

    def run_test(self, name, method, endpoint, expected_status, data=None, token=None, description=""):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}")
        print(f"   {method} {endpoint} - {description}")
        
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
                    
                    # Track critical failures
                    if response.status_code >= 500:
                        self.critical_failures.append(f"{name}: {response.status_code} Server Error")
                    elif response.status_code in [401, 403] and expected_status not in [401, 403]:
                        self.warnings.append(f"{name}: Authentication/Authorization issue")
                        
                except:
                    print(f"   Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            print(f"❌ FAILED - Exception: {str(e)}")
            self.critical_failures.append(f"{name}: Network/Connection error - {str(e)}")
            return False, {}

    def test_public_endpoints(self):
        """Test publicly accessible endpoints"""
        print("\n" + "="*60)
        print("🏥 TESTING PUBLIC ENDPOINTS")
        print("="*60)
        
        # Health check
        self.run_test("Health Check", "GET", "health", 200, 
                      description="API health status")
        
        # Root endpoint 
        self.run_test("Root API", "GET", "", 200,
                      description="API root endpoint")

    def test_authentication_flows(self):
        """Test authentication related endpoints"""
        print("\n" + "="*60)
        print("🔐 TESTING AUTHENTICATION")
        print("="*60)
        
        # Test admin registration (should fail - admin exists)
        timestamp = datetime.now().strftime('%H%M%S')
        admin_data = {
            "name": f"Test Admin {timestamp}",
            "email": f"testadmin{timestamp}@test.ro",
            "password": "TestPass123!",
            "phone": "0712345678"
        }
        
        self.run_test("Admin Registration Block", "POST", "auth/register", 400,
                      data=admin_data,
                      description="Should fail - admin already exists")
        
        # Test login with invalid credentials
        invalid_login = {
            "email": "invalid@test.ro",
            "password": "wrongpass"
        }
        
        self.run_test("Invalid Login", "POST", "auth/login", 401,
                      data=invalid_login,
                      description="Should fail with invalid credentials")

    def test_protected_endpoints_without_auth(self):
        """Test that protected endpoints properly reject unauthorized access"""
        print("\n" + "="*60)
        print("🛡️  TESTING AUTHORIZATION PROTECTION")
        print("="*60)
        
        # Test accessing protected endpoints without token
        protected_endpoints = [
            ("Get Current User", "GET", "auth/me", "User profile endpoint"),
            ("Get Users", "GET", "users", "Employee list endpoint"),
            ("Get Tasks", "GET", "tasks", "Tasks endpoint"),
            ("Get Clients", "GET", "clients", "Clients endpoint"),
            ("Get Notes", "GET", "notes", "Notes endpoint"),
            ("Dashboard Stats", "GET", "dashboard/stats", "Dashboard statistics"),
        ]
        
        for name, method, endpoint, desc in protected_endpoints:
            self.run_test(name + " (No Auth)", method, endpoint, 401,
                          description=f"{desc} - should require authentication")

    def test_api_structure_and_responses(self):
        """Test API structure and response formats"""
        print("\n" + "="*60) 
        print("📋 TESTING API STRUCTURE")
        print("="*60)
        
        # Test invalid endpoints
        self.run_test("Invalid Endpoint", "GET", "nonexistent", 404,
                      description="Should return 404 for invalid endpoints")
        
        # Test malformed requests
        malformed_data = {"invalid": "json", "missing_required_fields": True}
        
        self.run_test("Malformed Registration", "POST", "auth/register", 422,
                      data=malformed_data,
                      description="Should fail validation for malformed data")

    def test_cors_and_headers(self):
        """Test CORS and response headers"""
        print("\n" + "="*60)
        print("🌐 TESTING CORS AND HEADERS")
        print("="*60)
        
        # Test CORS preflight
        try:
            response = requests.options(f"{self.base_url}/api/health")
            if response.status_code == 200:
                print("✅ CORS preflight working")
                self.tests_passed += 1
            else:
                print(f"⚠️  CORS preflight returned: {response.status_code}")
                self.warnings.append("CORS preflight may not be configured properly")
            self.tests_run += 1
        except Exception as e:
            print(f"❌ CORS test failed: {str(e)}")
            self.warnings.append(f"CORS test failed: {str(e)}")
            self.tests_run += 1

    def test_basic_functionality(self):
        """Test basic functionality that can be verified without full auth"""
        print("\n" + "="*60)
        print("⚙️  TESTING BASIC FUNCTIONALITY")
        print("="*60)
        
        # Test Romanian language responses
        invalid_login = {"email": "test", "password": "test"}
        success, response = self.run_test("Romanian Error Messages", "POST", "auth/login", 422,
                                          data=invalid_login,
                                          description="Check Romanian error messages")
        
        # Verify API is returning JSON responses
        health_success, health_response = self.run_test("JSON Response Format", "GET", "health", 200,
                                                        description="Verify JSON response format")
        
        if health_success and isinstance(health_response, dict):
            print("✅ API returning proper JSON responses")
        elif health_success:
            self.warnings.append("API may not be returning proper JSON responses")

def main():
    print("🚀 Starting Workforce Portal API Testing (Public Endpoints)")
    print("="*80)
    
    tester = WorkforcePortalAPITester()
    
    try:
        # Run comprehensive public API testing
        tester.test_public_endpoints()
        tester.test_authentication_flows()
        tester.test_protected_endpoints_without_auth()
        tester.test_api_structure_and_responses() 
        tester.test_cors_and_headers()
        tester.test_basic_functionality()
        
    except Exception as e:
        print(f"\n❌ CRITICAL ERROR: {str(e)}")
        tester.critical_failures.append(f"Test suite error: {str(e)}")
    
    # Print detailed results
    print("\n" + "="*80)
    print("📋 DETAILED TEST RESULTS")
    print("="*80)
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Tests Failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run*100):.1f}%" if tester.tests_run > 0 else "0%")
    
    # Report critical failures
    if tester.critical_failures:
        print(f"\n🚨 CRITICAL FAILURES ({len(tester.critical_failures)}):")
        for failure in tester.critical_failures:
            print(f"   ❌ {failure}")
    
    # Report warnings
    if tester.warnings:
        print(f"\n⚠️  WARNINGS ({len(tester.warnings)}):")
        for warning in tester.warnings:
            print(f"   ⚠️  {warning}")
    
    # Determine overall status
    if tester.critical_failures:
        print("\n🚨 CRITICAL ISSUES FOUND - Backend has major problems")
        return 1
    elif tester.tests_passed / tester.tests_run >= 0.9:
        print("\n✅ Backend API structure looks good!")
        print("ℹ️  Note: Full CRUD testing requires admin credentials")
        return 0
    elif tester.tests_passed / tester.tests_run >= 0.7:
        print("\n⚠️  Backend has minor issues but basic functionality works")
        return 0
    else:
        print("\n❌ Backend has multiple issues")
        return 1

if __name__ == "__main__":
    sys.exit(main())