from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'workforce-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Security
security = HTTPBearer()

# Create the main app
app = FastAPI(title="Workforce Portal API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ============== MODELS ==============

class UserBase(BaseModel):
    email: EmailStr
    name: str
    phone: Optional[str] = None
    role: str = "employee"  # "admin" or "employee"

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    password: Optional[str] = None

class User(UserBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    token: str
    user: dict

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    start_date: Optional[str] = None  # ISO date string - start date
    due_date: Optional[str] = None  # ISO date string - end/deadline date
    priority: str = "medium"  # low, medium, high
    status: str = "pending"  # pending, in_progress, completed
    assigned_to: List[str] = []  # list of user ids

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[str] = None
    due_date: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    assigned_to: Optional[List[str]] = None

class Task(TaskBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_by: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class NoteBase(BaseModel):
    title: str
    content: str
    color: str = "default"  # default, yellow, green, blue, red

class NoteCreate(NoteBase):
    pass

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    color: Optional[str] = None

class Note(NoteBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_by: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ClientBase(BaseModel):
    company_name: str
    project_type: str
    budget: float
    monthly_fee: Optional[float] = None  # For maintenance contracts
    status: str = "activ"  # activ, inactiv, finalizat
    contact_person: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    notes: Optional[str] = None

class ClientCreate(ClientBase):
    pass

class ClientUpdate(BaseModel):
    company_name: Optional[str] = None
    project_type: Optional[str] = None
    budget: Optional[float] = None
    monthly_fee: Optional[float] = None
    status: Optional[str] = None
    contact_person: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    notes: Optional[str] = None

class Client(ClientBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_by: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ============== FOLDER & DOCUMENT MODELS ==============

class FolderBase(BaseModel):
    name: str
    client_id: str  # Associated with a client

class FolderCreate(FolderBase):
    pass

class Folder(FolderBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_by: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DocumentBase(BaseModel):
    name: str
    file_data: str  # Base64 encoded file data
    file_type: str  # mime type
    folder_id: str

class DocumentCreate(DocumentBase):
    pass

class Document(DocumentBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    uploaded_by: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ============== REPORT MODELS ==============

class ReportBase(BaseModel):
    date: str  # ISO date string YYYY-MM-DD
    content: str

class ReportCreate(ReportBase):
    pass

class ReportUpdate(BaseModel):
    content: Optional[str] = None

class Report(ReportBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ============== HELPERS ==============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirat")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token invalid")

async def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Acces interzis. Doar administratorii pot efectua această acțiune.")
    return current_user

# ============== AUTH ROUTES ==============

@api_router.post("/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    user = await db.users.find_one({"email": request.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Email sau parolă incorectă")
    
    if not verify_password(request.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Email sau parolă incorectă")
    
    token = create_token(user["id"], user["email"], user["role"])
    
    # Remove password from response
    user_response = {k: v for k, v in user.items() if k != "password_hash"}
    
    return {"token": token, "user": user_response}

@api_router.post("/auth/register", response_model=dict)
async def register_admin(request: UserCreate):
    # Check if any admin exists
    admin_exists = await db.users.find_one({"role": "admin"})
    if admin_exists:
        raise HTTPException(status_code=400, detail="Admin deja existent. Contactați administratorul.")
    
    # Check if email exists
    existing = await db.users.find_one({"email": request.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email deja utilizat")
    
    user = User(
        email=request.email,
        name=request.name,
        phone=request.phone,
        role="admin"
    )
    
    doc = user.model_dump()
    doc["password_hash"] = hash_password(request.password)
    doc["created_at"] = doc["created_at"].isoformat()
    
    await db.users.insert_one(doc)
    
    return {"message": "Admin creat cu succes", "user_id": user.id}

@api_router.get("/auth/me", response_model=dict)
async def get_me(current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user["user_id"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Utilizator negăsit")
    return user

# ============== USER/EMPLOYEE ROUTES ==============

@api_router.get("/users", response_model=List[dict])
async def get_users(current_user: dict = Depends(require_admin)):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return users

@api_router.get("/users/{user_id}", response_model=dict)
async def get_user(user_id: str, current_user: dict = Depends(require_admin)):
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Utilizator negăsit")
    return user

@api_router.post("/users", response_model=dict)
async def create_user(request: UserCreate, current_user: dict = Depends(require_admin)):
    existing = await db.users.find_one({"email": request.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email deja utilizat")
    
    user = User(
        email=request.email,
        name=request.name,
        phone=request.phone,
        role=request.role
    )
    
    doc = user.model_dump()
    doc["password_hash"] = hash_password(request.password)
    doc["created_at"] = doc["created_at"].isoformat()
    
    await db.users.insert_one(doc)
    
    return {"message": "Utilizator creat cu succes", "user_id": user.id}

@api_router.put("/users/{user_id}", response_model=dict)
async def update_user(user_id: str, request: UserUpdate, current_user: dict = Depends(require_admin)):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="Utilizator negăsit")
    
    update_data = {k: v for k, v in request.model_dump().items() if v is not None}
    
    if "password" in update_data:
        update_data["password_hash"] = hash_password(update_data.pop("password"))
    
    if update_data:
        await db.users.update_one({"id": user_id}, {"$set": update_data})
    
    return {"message": "Utilizator actualizat cu succes"}

@api_router.delete("/users/{user_id}", response_model=dict)
async def delete_user(user_id: str, current_user: dict = Depends(require_admin)):
    # Prevent self-deletion
    if user_id == current_user["user_id"]:
        raise HTTPException(status_code=400, detail="Nu vă puteți șterge propriul cont")
    
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Utilizator negăsit")
    
    return {"message": "Utilizator șters cu succes"}

# ============== TASK ROUTES ==============

@api_router.get("/tasks", response_model=List[dict])
async def get_tasks(current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "admin":
        tasks = await db.tasks.find({}, {"_id": 0}).to_list(1000)
    else:
        # Employee sees tasks where they are in assigned_to list
        tasks = await db.tasks.find({"assigned_to": current_user["user_id"]}, {"_id": 0}).to_list(1000)
    
    # Add assignees info
    for task in tasks:
        assignees = []
        if task.get("assigned_to"):
            for user_id in task["assigned_to"]:
                assignee = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
                if assignee:
                    assignees.append(assignee)
        task["assignees"] = assignees
    
    return tasks

@api_router.get("/tasks/{task_id}", response_model=dict)
async def get_task(task_id: str, current_user: dict = Depends(get_current_user)):
    task = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Sarcină negăsită")
    
    # Employees can only see their own tasks
    if current_user["role"] != "admin" and current_user["user_id"] not in task.get("assigned_to", []):
        raise HTTPException(status_code=403, detail="Acces interzis")
    
    return task

@api_router.post("/tasks", response_model=dict)
async def create_task(request: TaskCreate, current_user: dict = Depends(require_admin)):
    task = Task(
        title=request.title,
        description=request.description,
        due_date=request.due_date,
        priority=request.priority,
        status=request.status,
        assigned_to=request.assigned_to,
        created_by=current_user["user_id"]
    )
    
    doc = task.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    
    await db.tasks.insert_one(doc)
    
    return {"message": "Sarcină creată cu succes", "task_id": task.id}

@api_router.put("/tasks/{task_id}", response_model=dict)
async def update_task(task_id: str, request: TaskUpdate, current_user: dict = Depends(get_current_user)):
    task = await db.tasks.find_one({"id": task_id})
    if not task:
        raise HTTPException(status_code=404, detail="Sarcină negăsită")
    
    # Employees can only update status of their own tasks
    if current_user["role"] != "admin":
        if current_user["user_id"] not in task.get("assigned_to", []):
            raise HTTPException(status_code=403, detail="Acces interzis")
        # Employees can only update status
        update_data = {}
        if request.status:
            update_data["status"] = request.status
    else:
        update_data = {k: v for k, v in request.model_dump().items() if v is not None}
    
    if update_data:
        await db.tasks.update_one({"id": task_id}, {"$set": update_data})
    
    return {"message": "Sarcină actualizată cu succes"}

@api_router.delete("/tasks/{task_id}", response_model=dict)
async def delete_task(task_id: str, current_user: dict = Depends(require_admin)):
    result = await db.tasks.delete_one({"id": task_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Sarcină negăsită")
    
    return {"message": "Sarcină ștearsă cu succes"}

# ============== NOTE ROUTES ==============

@api_router.get("/notes", response_model=List[dict])
async def get_notes(current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "admin":
        notes = await db.notes.find({}, {"_id": 0}).to_list(1000)
    else:
        # Employees see notes created by them or shared (created_by admin)
        notes = await db.notes.find({}, {"_id": 0}).to_list(1000)
    return notes

@api_router.get("/notes/{note_id}", response_model=dict)
async def get_note(note_id: str, current_user: dict = Depends(get_current_user)):
    note = await db.notes.find_one({"id": note_id}, {"_id": 0})
    if not note:
        raise HTTPException(status_code=404, detail="Notiță negăsită")
    return note

@api_router.post("/notes", response_model=dict)
async def create_note(request: NoteCreate, current_user: dict = Depends(get_current_user)):
    note = Note(
        title=request.title,
        content=request.content,
        color=request.color,
        created_by=current_user["user_id"]
    )
    
    doc = note.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    
    await db.notes.insert_one(doc)
    
    return {"message": "Notiță creată cu succes", "note_id": note.id}

@api_router.put("/notes/{note_id}", response_model=dict)
async def update_note(note_id: str, request: NoteUpdate, current_user: dict = Depends(get_current_user)):
    note = await db.notes.find_one({"id": note_id})
    if not note:
        raise HTTPException(status_code=404, detail="Notiță negăsită")
    
    # Only creator or admin can update
    if current_user["role"] != "admin" and note.get("created_by") != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Acces interzis")
    
    update_data = {k: v for k, v in request.model_dump().items() if v is not None}
    
    if update_data:
        await db.notes.update_one({"id": note_id}, {"$set": update_data})
    
    return {"message": "Notiță actualizată cu succes"}

@api_router.delete("/notes/{note_id}", response_model=dict)
async def delete_note(note_id: str, current_user: dict = Depends(get_current_user)):
    note = await db.notes.find_one({"id": note_id})
    if not note:
        raise HTTPException(status_code=404, detail="Notiță negăsită")
    
    # Only creator or admin can delete
    if current_user["role"] != "admin" and note.get("created_by") != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Acces interzis")
    
    await db.notes.delete_one({"id": note_id})
    
    return {"message": "Notiță ștearsă cu succes"}

# ============== CLIENT ROUTES ==============

@api_router.get("/clients", response_model=List[dict])
async def get_clients(current_user: dict = Depends(require_admin)):
    clients = await db.clients.find({}, {"_id": 0}).to_list(1000)
    return clients

@api_router.get("/clients/{client_id}", response_model=dict)
async def get_client(client_id: str, current_user: dict = Depends(require_admin)):
    client = await db.clients.find_one({"id": client_id}, {"_id": 0})
    if not client:
        raise HTTPException(status_code=404, detail="Client negăsit")
    return client

@api_router.post("/clients", response_model=dict)
async def create_client(request: ClientCreate, current_user: dict = Depends(require_admin)):
    client = Client(
        company_name=request.company_name,
        project_type=request.project_type,
        budget=request.budget,
        status=request.status,
        contact_person=request.contact_person,
        contact_email=request.contact_email,
        contact_phone=request.contact_phone,
        notes=request.notes,
        created_by=current_user["user_id"]
    )
    
    doc = client.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    
    await db.clients.insert_one(doc)
    
    return {"message": "Client creat cu succes", "client_id": client.id}

@api_router.put("/clients/{client_id}", response_model=dict)
async def update_client(client_id: str, request: ClientUpdate, current_user: dict = Depends(require_admin)):
    client = await db.clients.find_one({"id": client_id})
    if not client:
        raise HTTPException(status_code=404, detail="Client negăsit")
    
    update_data = {k: v for k, v in request.model_dump().items() if v is not None}
    
    if update_data:
        await db.clients.update_one({"id": client_id}, {"$set": update_data})
    
    return {"message": "Client actualizat cu succes"}

@api_router.delete("/clients/{client_id}", response_model=dict)
async def delete_client(client_id: str, current_user: dict = Depends(require_admin)):
    result = await db.clients.delete_one({"id": client_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Client negăsit")
    
    return {"message": "Client șters cu succes"}

# ============== FOLDER ROUTES ==============

@api_router.get("/folders", response_model=List[dict])
async def get_folders(client_id: Optional[str] = None, current_user: dict = Depends(require_admin)):
    query = {}
    if client_id:
        query["client_id"] = client_id
    folders = await db.folders.find(query, {"_id": 0}).to_list(1000)
    
    # Add client info to each folder
    for folder in folders:
        client = await db.clients.find_one({"id": folder["client_id"]}, {"_id": 0, "company_name": 1})
        folder["client"] = client
        # Count documents in folder
        doc_count = await db.documents.count_documents({"folder_id": folder["id"]})
        folder["document_count"] = doc_count
    
    return folders

@api_router.post("/folders", response_model=dict)
async def create_folder(request: FolderCreate, current_user: dict = Depends(require_admin)):
    # Check if client exists
    client = await db.clients.find_one({"id": request.client_id})
    if not client:
        raise HTTPException(status_code=404, detail="Client negăsit")
    
    folder = Folder(
        name=request.name,
        client_id=request.client_id,
        created_by=current_user["user_id"]
    )
    
    doc = folder.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    
    await db.folders.insert_one(doc)
    
    return {"message": "Folder creat cu succes", "folder_id": folder.id}

@api_router.delete("/folders/{folder_id}", response_model=dict)
async def delete_folder(folder_id: str, current_user: dict = Depends(require_admin)):
    # Delete all documents in folder first
    await db.documents.delete_many({"folder_id": folder_id})
    
    result = await db.folders.delete_one({"id": folder_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Folder negăsit")
    
    return {"message": "Folder șters cu succes"}

# ============== DOCUMENT ROUTES ==============

@api_router.get("/documents", response_model=List[dict])
async def get_documents(folder_id: Optional[str] = None, current_user: dict = Depends(require_admin)):
    query = {}
    if folder_id:
        query["folder_id"] = folder_id
    # Don't return file_data in list view (too large)
    documents = await db.documents.find(query, {"_id": 0, "file_data": 0}).to_list(1000)
    return documents

@api_router.get("/documents/{document_id}", response_model=dict)
async def get_document(document_id: str, current_user: dict = Depends(require_admin)):
    document = await db.documents.find_one({"id": document_id}, {"_id": 0})
    if not document:
        raise HTTPException(status_code=404, detail="Document negăsit")
    return document

@api_router.post("/documents", response_model=dict)
async def create_document(request: DocumentCreate, current_user: dict = Depends(require_admin)):
    # Check if folder exists
    folder = await db.folders.find_one({"id": request.folder_id})
    if not folder:
        raise HTTPException(status_code=404, detail="Folder negăsit")
    
    document = Document(
        name=request.name,
        file_data=request.file_data,
        file_type=request.file_type,
        folder_id=request.folder_id,
        uploaded_by=current_user["user_id"]
    )
    
    doc = document.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    
    await db.documents.insert_one(doc)
    
    return {"message": "Document încărcat cu succes", "document_id": document.id}

@api_router.delete("/documents/{document_id}", response_model=dict)
async def delete_document(document_id: str, current_user: dict = Depends(require_admin)):
    result = await db.documents.delete_one({"id": document_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Document negăsit")
    
    return {"message": "Document șters cu succes"}

# ============== REPORT ROUTES ==============

@api_router.get("/reports", response_model=List[dict])
async def get_reports(user_id: Optional[str] = None, date: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    
    if current_user["role"] == "admin":
        # Admin can filter by user_id
        if user_id:
            query["user_id"] = user_id
    else:
        # Employees can only see their own reports
        query["user_id"] = current_user["user_id"]
    
    if date:
        query["date"] = date
    
    reports = await db.reports.find(query, {"_id": 0}).sort("date", -1).to_list(1000)
    
    # Add user info
    for report in reports:
        user = await db.users.find_one({"id": report["user_id"]}, {"_id": 0, "password_hash": 0})
        report["user"] = user
    
    return reports

@api_router.get("/reports/{report_id}", response_model=dict)
async def get_report(report_id: str, current_user: dict = Depends(get_current_user)):
    report = await db.reports.find_one({"id": report_id}, {"_id": 0})
    if not report:
        raise HTTPException(status_code=404, detail="Raport negăsit")
    
    # Check access
    if current_user["role"] != "admin" and report["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Acces interzis")
    
    return report

@api_router.post("/reports", response_model=dict)
async def create_report(request: ReportCreate, current_user: dict = Depends(get_current_user)):
    # Check if report for this date already exists
    existing = await db.reports.find_one({
        "user_id": current_user["user_id"],
        "date": request.date
    })
    
    if existing:
        # Update existing report
        await db.reports.update_one(
            {"id": existing["id"]},
            {"$set": {
                "content": request.content,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        return {"message": "Raport actualizat cu succes", "report_id": existing["id"]}
    
    report = Report(
        date=request.date,
        content=request.content,
        user_id=current_user["user_id"]
    )
    
    doc = report.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["updated_at"] = doc["updated_at"].isoformat()
    
    await db.reports.insert_one(doc)
    
    return {"message": "Raport creat cu succes", "report_id": report.id}

@api_router.put("/reports/{report_id}", response_model=dict)
async def update_report(report_id: str, request: ReportUpdate, current_user: dict = Depends(get_current_user)):
    report = await db.reports.find_one({"id": report_id})
    if not report:
        raise HTTPException(status_code=404, detail="Raport negăsit")
    
    # Check access - only owner can update
    if report["user_id"] != current_user["user_id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Acces interzis")
    
    update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if request.content is not None:
        update_data["content"] = request.content
    
    await db.reports.update_one({"id": report_id}, {"$set": update_data})
    
    return {"message": "Raport actualizat cu succes"}

@api_router.delete("/reports/{report_id}", response_model=dict)
async def delete_report(report_id: str, current_user: dict = Depends(get_current_user)):
    report = await db.reports.find_one({"id": report_id})
    if not report:
        raise HTTPException(status_code=404, detail="Raport negăsit")
    
    # Check access - only owner or admin can delete
    if report["user_id"] != current_user["user_id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Acces interzis")
    
    await db.reports.delete_one({"id": report_id})
    
    return {"message": "Raport șters cu succes"}

# ============== DASHBOARD STATS ==============

@api_router.get("/dashboard/stats", response_model=dict)
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "admin":
        total_employees = await db.users.count_documents({"role": "employee"})
        total_tasks = await db.tasks.count_documents({})
        pending_tasks = await db.tasks.count_documents({"status": "pending"})
        in_progress_tasks = await db.tasks.count_documents({"status": "in_progress"})
        completed_tasks = await db.tasks.count_documents({"status": "completed"})
        total_clients = await db.clients.count_documents({})
        active_clients = await db.clients.count_documents({"status": "activ"})
        
        # Calculate total budget and monthly revenue
        clients = await db.clients.find({}, {"_id": 0, "budget": 1, "monthly_fee": 1, "project_type": 1, "status": 1}).to_list(1000)
        total_budget = sum(c.get("budget", 0) for c in clients)
        monthly_revenue = sum(c.get("monthly_fee", 0) or 0 for c in clients if c.get("status") == "activ")
        
        # Get employees list
        employees = await db.users.find({"role": "employee"}, {"_id": 0, "password_hash": 0}).to_list(100)
        
        # Get recent tasks
        recent_tasks = await db.tasks.find({}, {"_id": 0}).sort("created_at", -1).to_list(5)
        for task in recent_tasks:
            assignees = []
            if task.get("assigned_to"):
                for user_id in task["assigned_to"]:
                    assignee = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
                    if assignee:
                        assignees.append(assignee)
            task["assignees"] = assignees
        
        # Revenue by project type
        revenue_by_type = {}
        for c in clients:
            ptype = c.get("project_type", "Altele")
            if ptype not in revenue_by_type:
                revenue_by_type[ptype] = 0
            revenue_by_type[ptype] += c.get("budget", 0)
        
        return {
            "total_employees": total_employees,
            "total_tasks": total_tasks,
            "pending_tasks": pending_tasks,
            "in_progress_tasks": in_progress_tasks,
            "completed_tasks": completed_tasks,
            "total_clients": total_clients,
            "active_clients": active_clients,
            "total_budget": total_budget,
            "monthly_revenue": monthly_revenue,
            "employees": employees,
            "recent_tasks": recent_tasks,
            "revenue_by_type": revenue_by_type
        }
    else:
        # Employee stats
        my_tasks = await db.tasks.count_documents({"assigned_to": current_user["user_id"]})
        my_pending = await db.tasks.count_documents({"assigned_to": current_user["user_id"], "status": "pending"})
        my_in_progress = await db.tasks.count_documents({"assigned_to": current_user["user_id"], "status": "in_progress"})
        my_completed = await db.tasks.count_documents({"assigned_to": current_user["user_id"], "status": "completed"})
        
        return {
            "my_tasks": my_tasks,
            "my_pending": my_pending,
            "my_in_progress": my_in_progress,
            "my_completed": my_completed
        }

# ============== HEALTH CHECK ==============

@api_router.get("/")
async def root():
    return {"message": "Workforce Portal API", "status": "running"}

@api_router.get("/health")
async def health():
    return {"status": "healthy"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
