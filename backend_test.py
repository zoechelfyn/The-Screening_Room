#!/usr/bin/env python3
"""
Backend API Test Suite for Review Studio
Tests all CRUD operations and validation logic for the Review Studio API.
"""

import asyncio
import aiohttp
import json
import os
from datetime import datetime
from typing import Dict, List, Optional

# Get backend URL from environment
BACKEND_URL = "https://feedback-hub-121.preview.emergentagent.com/api"

class ReviewStudioAPITester:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.session = None
        self.test_data = {}
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def make_request(self, method: str, endpoint: str, data: dict = None, params: dict = None) -> tuple:
        """Make HTTP request and return (status, response_data, error)"""
        url = f"{self.base_url}{endpoint}"
        
        try:
            kwargs = {}
            if data:
                kwargs['json'] = data
            if params:
                kwargs['params'] = params
                
            async with self.session.request(method, url, **kwargs) as response:
                try:
                    response_data = await response.json()
                except:
                    response_data = await response.text()
                
                return response.status, response_data, None
                
        except Exception as e:
            return None, None, str(e)
    
    def log_test(self, test_name: str, status: str, details: str = ""):
        """Log test results"""
        status_symbol = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
        print(f"{status_symbol} {test_name}: {status}")
        if details:
            print(f"   {details}")
    
    async def test_health_check(self):
        """Test basic health endpoints"""
        print("\n=== HEALTH CHECK TESTS ===")
        
        # Test root endpoint
        status, data, error = await self.make_request("GET", "/")
        if status == 200 and data.get("message"):
            self.log_test("Root endpoint", "PASS", f"Message: {data['message']}")
        else:
            self.log_test("Root endpoint", "FAIL", f"Status: {status}, Error: {error}")
        
        # Test health endpoint
        status, data, error = await self.make_request("GET", "/health")
        if status == 200 and data.get("status") == "healthy":
            self.log_test("Health endpoint", "PASS", f"Service: {data.get('service')}")
        else:
            self.log_test("Health endpoint", "FAIL", f"Status: {status}, Error: {error}")
    
    async def test_seed_api(self):
        """Test seed API to populate database"""
        print("\n=== SEED API TEST ===")
        
        status, data, error = await self.make_request("POST", "/seed")
        if status == 201 and data.get("message") == "Database seeded successfully":
            counts = data.get("counts", {})
            self.log_test("Seed database", "PASS", 
                         f"Created: {counts.get('projects')} projects, {counts.get('assets')} assets, "
                         f"{counts.get('versions')} versions, {counts.get('comments')} comments, "
                         f"{counts.get('replies')} replies")
            return True
        else:
            self.log_test("Seed database", "FAIL", f"Status: {status}, Error: {error}")
            return False
    
    async def test_projects_api(self):
        """Test Projects CRUD operations"""
        print("\n=== PROJECTS API TESTS ===")
        
        # Test GET /projects (list)
        status, data, error = await self.make_request("GET", "/projects")
        if status == 200 and "projects" in data:
            projects = data["projects"]
            self.log_test("List projects", "PASS", f"Found {len(projects)} projects")
            if projects:
                self.test_data["project_id"] = projects[0]["id"]
        else:
            self.log_test("List projects", "FAIL", f"Status: {status}, Error: {error}")
        
        # Test POST /projects (create)
        project_data = {
            "name": "Test Project - API Testing",
            "client_name": "Test Client Corp"
        }
        status, data, error = await self.make_request("POST", "/projects", project_data)
        if status == 201 and data.get("name") == project_data["name"]:
            self.test_data["created_project_id"] = data["id"]
            self.log_test("Create project", "PASS", f"Created project ID: {data['id']}")
        else:
            self.log_test("Create project", "FAIL", f"Status: {status}, Error: {error}")
        
        # Test GET /projects/{id} (get specific)
        if "created_project_id" in self.test_data:
            project_id = self.test_data["created_project_id"]
            status, data, error = await self.make_request("GET", f"/projects/{project_id}")
            if status == 200 and data.get("id") == project_id:
                self.log_test("Get project by ID", "PASS", f"Retrieved project: {data['name']}")
            else:
                self.log_test("Get project by ID", "FAIL", f"Status: {status}, Error: {error}")
        
        # Test invalid project ID
        status, data, error = await self.make_request("GET", "/projects/invalid_id")
        if status == 400:
            self.log_test("Invalid project ID validation", "PASS", "Correctly rejected invalid ID")
        else:
            self.log_test("Invalid project ID validation", "FAIL", f"Expected 400, got {status}")
        
        # Test non-existent project ID
        status, data, error = await self.make_request("GET", "/projects/507f1f77bcf86cd799439011")
        if status == 404:
            self.log_test("Non-existent project validation", "PASS", "Correctly returned 404")
        else:
            self.log_test("Non-existent project validation", "FAIL", f"Expected 404, got {status}")
    
    async def test_assets_api(self):
        """Test Assets CRUD operations"""
        print("\n=== ASSETS API TESTS ===")
        
        project_id = self.test_data.get("project_id")
        if not project_id:
            self.log_test("Assets API", "SKIP", "No project ID available")
            return
        
        # Test GET /projects/{id}/assets (list)
        status, data, error = await self.make_request("GET", f"/projects/{project_id}/assets")
        if status == 200 and "assets" in data:
            assets = data["assets"]
            self.log_test("List assets", "PASS", f"Found {len(assets)} assets for project")
            if assets:
                self.test_data["asset_id"] = assets[0]["id"]
                self.test_data["asset_type"] = assets[0]["type"]
        else:
            self.log_test("List assets", "FAIL", f"Status: {status}, Error: {error}")
        
        # Test POST /projects/{id}/assets (create video asset)
        video_asset_data = {
            "type": "video",
            "title": "Test Video Asset - API Testing"
        }
        status, data, error = await self.make_request("POST", f"/projects/{project_id}/assets", video_asset_data)
        if status == 201 and data.get("type") == "video":
            self.test_data["created_video_asset_id"] = data["id"]
            self.log_test("Create video asset", "PASS", f"Created asset ID: {data['id']}")
        else:
            self.log_test("Create video asset", "FAIL", f"Status: {status}, Error: {error}")
        
        # Test POST /projects/{id}/assets (create image asset)
        image_asset_data = {
            "type": "image",
            "title": "Test Image Asset - API Testing"
        }
        status, data, error = await self.make_request("POST", f"/projects/{project_id}/assets", image_asset_data)
        if status == 201 and data.get("type") == "image":
            self.test_data["created_image_asset_id"] = data["id"]
            self.log_test("Create image asset", "PASS", f"Created asset ID: {data['id']}")
        else:
            self.log_test("Create image asset", "FAIL", f"Status: {status}, Error: {error}")
        
        # Test GET /assets/{id} (get specific)
        if "created_video_asset_id" in self.test_data:
            asset_id = self.test_data["created_video_asset_id"]
            status, data, error = await self.make_request("GET", f"/assets/{asset_id}")
            if status == 200 and data.get("id") == asset_id:
                self.log_test("Get asset by ID", "PASS", f"Retrieved asset: {data['title']}")
            else:
                self.log_test("Get asset by ID", "FAIL", f"Status: {status}, Error: {error}")
        
        # Test invalid asset ID
        status, data, error = await self.make_request("GET", "/assets/invalid_id")
        if status == 400:
            self.log_test("Invalid asset ID validation", "PASS", "Correctly rejected invalid ID")
        else:
            self.log_test("Invalid asset ID validation", "FAIL", f"Expected 400, got {status}")
        
        # Test creating asset for non-existent project
        status, data, error = await self.make_request("POST", "/projects/507f1f77bcf86cd799439011/assets", video_asset_data)
        if status == 404:
            self.log_test("Asset creation for non-existent project", "PASS", "Correctly returned 404")
        else:
            self.log_test("Asset creation for non-existent project", "FAIL", f"Expected 404, got {status}")
    
    async def test_versions_api(self):
        """Test Versions CRUD operations"""
        print("\n=== VERSIONS API TESTS ===")
        
        video_asset_id = self.test_data.get("created_video_asset_id")
        image_asset_id = self.test_data.get("created_image_asset_id")
        
        if not video_asset_id or not image_asset_id:
            self.log_test("Versions API", "SKIP", "No asset IDs available")
            return
        
        # Test GET /assets/{id}/versions (list for video asset)
        status, data, error = await self.make_request("GET", f"/assets/{video_asset_id}/versions")
        if status == 200 and "versions" in data:
            versions = data["versions"]
            self.log_test("List versions for video asset", "PASS", f"Found {len(versions)} versions")
        else:
            self.log_test("List versions for video asset", "FAIL", f"Status: {status}, Error: {error}")
        
        # Test POST /assets/{id}/versions (create video version)
        video_version_data = {
            "label": "v1-test",
            "media": {
                "kind": "video",
                "url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
                "durationMs": 596000
            }
        }
        status, data, error = await self.make_request("POST", f"/assets/{video_asset_id}/versions", video_version_data)
        if status == 201 and data.get("label") == "v1-test":
            self.test_data["created_video_version_id"] = data["id"]
            self.log_test("Create video version", "PASS", f"Created version ID: {data['id']}")
        else:
            self.log_test("Create video version", "FAIL", f"Status: {status}, Error: {error}")
        
        # Test POST /assets/{id}/versions (create image version)
        image_version_data = {
            "label": "v1-test",
            "media": {
                "kind": "image",
                "url": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1920&q=80",
                "width": 1920,
                "height": 1080
            }
        }
        status, data, error = await self.make_request("POST", f"/assets/{image_asset_id}/versions", image_version_data)
        if status == 201 and data.get("label") == "v1-test":
            self.test_data["created_image_version_id"] = data["id"]
            self.log_test("Create image version", "PASS", f"Created version ID: {data['id']}")
        else:
            self.log_test("Create image version", "FAIL", f"Status: {status}, Error: {error}")
        
        # Test media kind validation (try to create video media for image asset)
        invalid_version_data = {
            "label": "invalid-test",
            "media": {
                "kind": "video",
                "url": "https://example.com/video.mp4",
                "durationMs": 30000
            }
        }
        status, data, error = await self.make_request("POST", f"/assets/{image_asset_id}/versions", invalid_version_data)
        if status == 400:
            self.log_test("Media kind validation", "PASS", "Correctly rejected video media for image asset")
        else:
            self.log_test("Media kind validation", "FAIL", f"Expected 400, got {status}")
        
        # Test GET /assets/{id}/versions/{vid} (get specific version)
        if "created_video_version_id" in self.test_data:
            version_id = self.test_data["created_video_version_id"]
            status, data, error = await self.make_request("GET", f"/assets/{video_asset_id}/versions/{version_id}")
            if status == 200 and data.get("id") == version_id:
                self.log_test("Get version by ID", "PASS", f"Retrieved version: {data['label']}")
            else:
                self.log_test("Get version by ID", "FAIL", f"Status: {status}, Error: {error}")
    
    async def test_comments_api(self):
        """Test Comments CRUD operations with validation"""
        print("\n=== COMMENTS API TESTS ===")
        
        video_asset_id = self.test_data.get("created_video_asset_id")
        video_version_id = self.test_data.get("created_video_version_id")
        image_asset_id = self.test_data.get("created_image_asset_id")
        image_version_id = self.test_data.get("created_image_version_id")
        
        if not all([video_asset_id, video_version_id, image_asset_id, image_version_id]):
            self.log_test("Comments API", "SKIP", "Missing required asset/version IDs")
            return
        
        # Test GET /comments?asset_id&version_id (list for video)
        params = {"asset_id": video_asset_id, "version_id": video_version_id}
        status, data, error = await self.make_request("GET", "/comments", params=params)
        if status == 200 and "comments" in data:
            comments = data["comments"]
            self.log_test("List comments for video", "PASS", f"Found {len(comments)} comments")
        else:
            self.log_test("List comments for video", "FAIL", f"Status: {status}, Error: {error}")
        
        # Test POST /comments (create video comment)
        video_comment_data = {
            "asset_id": video_asset_id,
            "version_id": video_version_id,
            "body": "Test comment for video at 30 seconds",
            "anchor": {
                "type": "video_time",
                "timeMs": 30000
            },
            "author": {
                "name": "Test User",
                "role": "client"
            }
        }
        status, data, error = await self.make_request("POST", "/comments", video_comment_data)
        if status == 201 and data.get("body") == video_comment_data["body"]:
            self.test_data["created_video_comment_id"] = data["id"]
            self.log_test("Create video comment", "PASS", f"Created comment ID: {data['id']}")
        else:
            self.log_test("Create video comment", "FAIL", f"Status: {status}, Error: {error}")
        
        # Test POST /comments (create image comment)
        image_comment_data = {
            "asset_id": image_asset_id,
            "version_id": image_version_id,
            "body": "Test comment for image at center",
            "anchor": {
                "type": "image_pin",
                "xNorm": 0.5,
                "yNorm": 0.5
            },
            "author": {
                "name": "Test Designer",
                "role": "internal"
            }
        }
        status, data, error = await self.make_request("POST", "/comments", image_comment_data)
        if status == 201 and data.get("body") == image_comment_data["body"]:
            self.test_data["created_image_comment_id"] = data["id"]
            self.log_test("Create image comment", "PASS", f"Created comment ID: {data['id']}")
        else:
            self.log_test("Create image comment", "FAIL", f"Status: {status}, Error: {error}")
        
        # Test anchor type validation (try video_time anchor on image asset)
        invalid_comment_data = {
            "asset_id": image_asset_id,
            "version_id": image_version_id,
            "body": "Invalid anchor type test",
            "anchor": {
                "type": "video_time",
                "timeMs": 15000
            },
            "author": {
                "name": "Test User",
                "role": "client"
            }
        }
        status, data, error = await self.make_request("POST", "/comments", invalid_comment_data)
        if status == 400:
            self.log_test("Anchor type validation", "PASS", "Correctly rejected video_time anchor for image asset")
        else:
            self.log_test("Anchor type validation", "FAIL", f"Expected 400, got {status}")
        
        # Test GET /comments/{id} (get specific comment)
        if "created_video_comment_id" in self.test_data:
            comment_id = self.test_data["created_video_comment_id"]
            status, data, error = await self.make_request("GET", f"/comments/{comment_id}")
            if status == 200 and data.get("id") == comment_id:
                self.log_test("Get comment by ID", "PASS", f"Retrieved comment: {data['body'][:50]}...")
            else:
                self.log_test("Get comment by ID", "FAIL", f"Status: {status}, Error: {error}")
        
        # Test PATCH /comments/{id} (update comment)
        if "created_video_comment_id" in self.test_data:
            comment_id = self.test_data["created_video_comment_id"]
            update_data = {
                "body": "Updated test comment for video",
                "status": "resolved"
            }
            status, data, error = await self.make_request("PATCH", f"/comments/{comment_id}", update_data)
            if status == 200 and data.get("body") == update_data["body"] and data.get("status") == "resolved":
                self.log_test("Update comment", "PASS", "Successfully updated comment body and status")
            else:
                self.log_test("Update comment", "FAIL", f"Status: {status}, Error: {error}")
    
    async def test_replies_api(self):
        """Test Replies CRUD operations"""
        print("\n=== REPLIES API TESTS ===")
        
        comment_id = self.test_data.get("created_video_comment_id")
        if not comment_id:
            self.log_test("Replies API", "SKIP", "No comment ID available")
            return
        
        # Test GET /comments/{id}/replies (list)
        status, data, error = await self.make_request("GET", f"/comments/{comment_id}/replies")
        if status == 200 and "replies" in data:
            replies = data["replies"]
            self.log_test("List replies", "PASS", f"Found {len(replies)} replies")
        else:
            self.log_test("List replies", "FAIL", f"Status: {status}, Error: {error}")
        
        # Test POST /comments/{id}/replies (create)
        reply_data = {
            "body": "Test reply to the comment",
            "author": {
                "name": "Test Reviewer",
                "role": "internal"
            }
        }
        status, data, error = await self.make_request("POST", f"/comments/{comment_id}/replies", reply_data)
        if status == 201 and data.get("body") == reply_data["body"]:
            self.test_data["created_reply_id"] = data["id"]
            self.log_test("Create reply", "PASS", f"Created reply ID: {data['id']}")
        else:
            self.log_test("Create reply", "FAIL", f"Status: {status}, Error: {error}")
        
        # Test creating reply for non-existent comment
        status, data, error = await self.make_request("POST", "/comments/507f1f77bcf86cd799439011/replies", reply_data)
        if status == 404:
            self.log_test("Reply for non-existent comment", "PASS", "Correctly returned 404")
        else:
            self.log_test("Reply for non-existent comment", "FAIL", f"Expected 404, got {status}")
    
    async def test_cascade_deletes(self):
        """Test cascade delete operations"""
        print("\n=== CASCADE DELETE TESTS ===")
        
        # Test DELETE /comments/{id} (should delete replies)
        comment_id = self.test_data.get("created_video_comment_id")
        reply_id = self.test_data.get("created_reply_id")
        
        if comment_id and reply_id:
            # First verify reply exists
            status, data, error = await self.make_request("GET", f"/comments/{comment_id}/replies")
            if status == 200 and len(data.get("replies", [])) > 0:
                # Delete comment (should cascade to replies)
                status, data, error = await self.make_request("DELETE", f"/comments/{comment_id}")
                if status == 204:
                    self.log_test("Delete comment (cascade to replies)", "PASS", "Comment deleted successfully")
                    
                    # Verify comment is gone
                    status, data, error = await self.make_request("GET", f"/comments/{comment_id}")
                    if status == 404:
                        self.log_test("Verify comment deletion", "PASS", "Comment no longer exists")
                    else:
                        self.log_test("Verify comment deletion", "FAIL", f"Comment still exists: {status}")
                else:
                    self.log_test("Delete comment (cascade to replies)", "FAIL", f"Status: {status}, Error: {error}")
        
        # Test DELETE /assets/{id} (should cascade to versions and comments)
        video_asset_id = self.test_data.get("created_video_asset_id")
        if video_asset_id:
            status, data, error = await self.make_request("DELETE", f"/assets/{video_asset_id}")
            if status == 204:
                self.log_test("Delete asset (cascade to versions/comments)", "PASS", "Asset deleted successfully")
                
                # Verify asset is gone
                status, data, error = await self.make_request("GET", f"/assets/{video_asset_id}")
                if status == 404:
                    self.log_test("Verify asset deletion", "PASS", "Asset no longer exists")
                else:
                    self.log_test("Verify asset deletion", "FAIL", f"Asset still exists: {status}")
            else:
                self.log_test("Delete asset (cascade to versions/comments)", "FAIL", f"Status: {status}, Error: {error}")
        
        # Test DELETE /projects/{id} (should cascade to everything)
        project_id = self.test_data.get("created_project_id")
        if project_id:
            status, data, error = await self.make_request("DELETE", f"/projects/{project_id}")
            if status == 204:
                self.log_test("Delete project (cascade to all)", "PASS", "Project deleted successfully")
                
                # Verify project is gone
                status, data, error = await self.make_request("GET", f"/projects/{project_id}")
                if status == 404:
                    self.log_test("Verify project deletion", "PASS", "Project no longer exists")
                else:
                    self.log_test("Verify project deletion", "FAIL", f"Project still exists: {status}")
            else:
                self.log_test("Delete project (cascade to all)", "FAIL", f"Status: {status}, Error: {error}")
    
    async def run_all_tests(self):
        """Run all test suites"""
        print("🚀 Starting Review Studio Backend API Tests")
        print(f"Testing against: {self.base_url}")
        
        # Run tests in order
        await self.test_health_check()
        
        # Seed database first
        seed_success = await self.test_seed_api()
        if not seed_success:
            print("\n❌ Seed failed - cannot continue with other tests")
            return
        
        await self.test_projects_api()
        await self.test_assets_api()
        await self.test_versions_api()
        await self.test_comments_api()
        await self.test_replies_api()
        await self.test_cascade_deletes()
        
        print("\n🏁 All tests completed!")


async def main():
    """Main test runner"""
    async with ReviewStudioAPITester(BACKEND_URL) as tester:
        await tester.run_all_tests()


if __name__ == "__main__":
    asyncio.run(main())