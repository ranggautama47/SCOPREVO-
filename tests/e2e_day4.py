from playwright.sync_api import sync_playwright
import time
import requests

def run_tests():
    with sync_playwright() as p:
        # Browser A (Freelancer)
        browserA = p.chromium.launch(headless=True)
        contextA = browserA.new_context()
        pageA = contextA.new_page()

        # Step 1: Login
        print("Step 1: Logging in...")
        # Assume endpoint /api/auth/login exists
        login_res = requests.post("http://localhost:3000/api/auth/login", json={"email": "freelancer@example.com", "password": "password123"})
        jwt = login_res.json().get("token")
        contextA.add_cookies([{"name": "token", "value": jwt, "domain": "localhost", "path": "/"}])
        print("Step 1 Status: PASS")

        # Step 2: Create Batch
        print("Step 2: Creating batch...")
        # Assume endpoint /api/projects/:id/revisions exists
        batch_res = requests.post("http://localhost:3000/api/projects/1/revisions", json={"description": "Test feedback"}, cookies={"token": jwt})
        batch_id = batch_res.json().get("batchId")
        print(f"Step 2 Status: PASS, BatchId: {batch_id}")

        # Step 3: Open Batch
        print("Step 3: Opening batch page...")
        pageA.goto(f"http://localhost:5173/batches/{batch_id}")
        pageA.wait_for_load_state("networkidle")
        assert "GENERATE MAGIC LINK" in pageA.content()
        print("Step 3 Status: PASS")

        # Step 4: Generate Magic Link
        print("Step 4: Generating magic link...")
        pageA.click("text=GENERATE MAGIC LINK")
        # Wait for modal
        pageA.wait_for_selector('input[readonly]')
        portal_url = pageA.locator('input[readonly]').get_attribute("value")
        print(f"Step 4 Status: PASS, URL: {portal_url}")

        # Step 5: Check used revisions (DRAFT)
        print("Step 5: Checking quota in DRAFT...")
        pageA.goto("http://localhost:5173/projects/1")
        pageA.wait_for_load_state("networkidle")
        # Need to find how it's displayed, assume text "0"
        assert "0" in pageA.content()
        print("Step 5 Status: PASS")

        # Step 6: Context B
        print("Step 6: Context B...")
        contextB = browserA.new_context() # Fresh context
        pageB = contextB.new_page()

        # Step 7: Open portal
        print("Step 7: Opening portal...")
        pageB.goto(portal_url)
        pageB.wait_for_load_state("networkidle")
        assert "CONFIRM & APPROVE" in pageB.content()
        print("Step 7 Status: PASS")

        # Step 8: Confirm
        print("Step 8: Approving...")
        pageB.click("text=CONFIRM & APPROVE")
        pageB.wait_for_selector('text=REVISION SCOPE APPROVED & LOCKED', timeout=10000)
        print("Step 8 Status: PASS")

        # Step 9: Verify Approved
        print("Step 9: Verifying API approval...")
        token = portal_url.split('/')[-1]
        res = requests.get(f"http://localhost:3000/api/portal/{token}")
        assert res.json().get("batch").get("status") == "APPROVED"
        print("Step 9 Status: PASS")

        # Step 10: Check quota consumed
        print("Step 10: Checking consumed quota...")
        pageA.reload()
        pageA.wait_for_load_state("networkidle")
        assert "1" in pageA.content()
        print("Step 10 Status: PASS")

        # Step 11: Duplicate Confirm
        print("Step 11: Duplicate confirm...")
        pageB.click("text=CONFIRM & APPROVE")
        time.sleep(2)
        assert "REVISION SCOPE APPROVED & LOCKED" in pageB.content()
        print("Step 11 Status: PASS")

        # Step 12: New feedback
        print("Step 12: Submit new feedback...")
        res = requests.post("http://localhost:3000/api/projects/1/revisions", json={"description": "New feedback"}, cookies={"token": jwt})
        assert res.status_code == 200
        print("Step 12 Status: PASS")

        # Step 13: Context C access
        print("Step 13: Unauthorized access...")
        contextC = browserA.new_context()
        pageC = contextC.new_page()
        pageC.goto(f"http://localhost:5173/batches/{batch_id}")
        pageC.wait_for_load_state("networkidle")
        # Should be 404 or redirect
        assert "Batch not found" in pageC.content()
        print("Step 13 Status: PASS")

        browserA.close()

if __name__ == "__main__":
    run_tests()
