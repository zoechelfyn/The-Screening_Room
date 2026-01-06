from fastapi import APIRouter, HTTPException, status
from datetime import datetime
from bson import ObjectId
from typing import List

from database import get_db
from models import (
    ProjectCreate, 
    ProjectResponse, 
    ProjectsListResponse,
    serialize_doc
)

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=ProjectsListResponse)
async def list_projects():
    """Get all projects."""
    db = get_db()
    cursor = db.projects.find().sort("created_at", -1)
    projects = await cursor.to_list(length=1000)
    
    return {
        "projects": [serialize_doc(p) for p in projects]
    }


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(project: ProjectCreate):
    """Create a new project."""
    db = get_db()
    
    doc = {
        "name": project.name,
        "client_name": project.client_name,
        "created_at": datetime.utcnow()
    }
    
    result = await db.projects.insert_one(doc)
    doc["_id"] = result.inserted_id
    
    return serialize_doc(doc)


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: str):
    """Get a project by ID."""
    db = get_db()
    
    try:
        project = await db.projects.find_one({"_id": ObjectId(project_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid project ID format")
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return serialize_doc(project)


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(project_id: str, project: ProjectCreate):
    """Update a project's name and/or client name."""
    db = get_db()
    
    try:
        oid = ObjectId(project_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid project ID format")
    
    # Check project exists
    existing = await db.projects.find_one({"_id": oid})
    if not existing:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Build update dict
    update_dict = {}
    if project.name:
        update_dict["name"] = project.name
    if project.client_name is not None:
        update_dict["client_name"] = project.client_name
    
    if update_dict:
        await db.projects.update_one({"_id": oid}, {"$set": update_dict})
    
    # Fetch updated document
    updated = await db.projects.find_one({"_id": oid})
    return serialize_doc(updated)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(project_id: str):
    """Delete a project and all its assets, versions, and comments."""
    db = get_db()
    
    try:
        oid = ObjectId(project_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid project ID format")
    
    # Check project exists
    project = await db.projects.find_one({"_id": oid})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get all assets for this project
    assets = await db.assets.find({"project_id": project_id}).to_list(length=10000)
    asset_ids = [a["_id"] for a in assets]
    asset_id_strs = [str(a["_id"]) for a in assets]
    
    # Get all versions for these assets
    versions = await db.versions.find({"asset_id": {"$in": asset_id_strs}}).to_list(length=10000)
    version_id_strs = [str(v["_id"]) for v in versions]
    
    # Get all comments for these versions
    comments = await db.comments.find({"version_id": {"$in": version_id_strs}}).to_list(length=100000)
    comment_id_strs = [str(c["_id"]) for c in comments]
    
    # Delete in order: replies -> comments -> versions -> assets -> project
    if comment_id_strs:
        await db.replies.delete_many({"comment_id": {"$in": comment_id_strs}})
    if version_id_strs:
        await db.comments.delete_many({"version_id": {"$in": version_id_strs}})
    if asset_id_strs:
        await db.versions.delete_many({"asset_id": {"$in": asset_id_strs}})
    
    await db.assets.delete_many({"project_id": project_id})
    await db.projects.delete_one({"_id": oid})
    
    return None
