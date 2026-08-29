import requests
import time

def test_setup():
    unique = int(time.time())
    user_payload = {
        "name": f"QA User {unique}",
        "email": f"qa_user_{unique}@scoprevo.com",
        "password": "Password123!"
    }

    # 1. Register User
    print("Registering user...")
    res = requests.post("http://localhost:3000/api/auth/register", json=user_payload)
    print("Status:", res.status_code)
    print("Response:", res.json())
    token = res.json().get("token")
    assert token is not None

    # 2. Create Project
    headers = {"Authorization": f"Bearer {token}"}
    project_payload = {
        "name": "E2E Test Project",
        "clientName": "Test Client",
        "totalAllowedRevisions": 3
    }
    print("Creating project...")
    res = requests.post("http://localhost:3000/api/projects", json=project_payload, headers=headers)
    print("Status:", res.status_code)
    print("Response:", res.json())
    project_id = res.json().get("project").get("id")
    assert project_id is not None

    # 3. Create Revision Batch
    revision_payload = {
        "rawInput": "Halo mas, tolong ganti warna tombol login jadi biru dong!"
    }
    print("Creating revision batch...")
    res = requests.post(f"http://localhost:3000/api/projects/{project_id}/revisions", json=revision_payload, headers=headers)
    print("Status:", res.status_code)
    print("Response:", res.json())
    batch_id = res.json().get("batch").get("id")
    assert batch_id is not None

    print("Setup works perfectly!")
    return token, project_id, batch_id

if __name__ == "__main__":
    test_setup()
