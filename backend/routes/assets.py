from fastapi import APIRouter, HTTPException, status
from datetime import datetime
from bson import ObjectId

from database import get_db
from models import (
    AssetCreate,
    AssetResponse,
    AssetsListResponse,
    serialize_doc
)

router = APIRouter(tags=["assets"])


@router.get("/projects/{project_id}/assets", response_model=AssetsListResponse)
async def list_assets(project_id: str):
    """Get all assets for a project."""
    db = get_db()
    
    # Validate project exists
    try:
        project = await db.projects.find_one({"_id": ObjectId(project_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid project ID format")
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    cursor = db.assets.find({"project_id": project_id}).sort("created_at", -1)
    assets = await cursor.to_list(length=1000)
    
    return {
        "assets": [serialize_doc(a) for a in assets]
    }


@router.post("/projects/{project_id}/assets", response_model=AssetResponse, status_code=status.HTTP_201_CREATED)
async def create_asset(project_id: str, asset: AssetCreate):
    """Create a new asset for a project."""
    db = get_db()
    
    # Validate project exists
    try:
        project = await db.projects.find_one({"_id": ObjectId(project_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid project ID format")
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    doc = {
        "project_id": project_id,  # String reference to parent
        "type": asset.type,
        "title": asset.title,
        "created_at": datetime.utcnow()
    }
    
    result = await db.assets.insert_one(doc)
    doc["_id"] = result.inserted_id
    
    return serialize_doc(doc)


@router.get("/assets/{asset_id}", response_model=AssetResponse)
async def get_asset(asset_id: str):
    """Get an asset by ID."""
    db = get_db()
    
    try:
        asset = await db.assets.find_one({"_id": ObjectId(asset_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid asset ID format")
    
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    return serialize_doc(asset)


@router.delete("/assets/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_asset(asset_id: str):
    """Delete an asset and all its versions and comments."""
    db = get_db()
    
    try:
        oid = ObjectId(asset_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid asset ID format")
    
    # Check asset exists
    asset = await db.assets.find_one({"_id": oid})
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    # Get all versions for this asset
    versions = await db.versions.find({"asset_id": asset_id}).to_list(length=10000)
    version_id_strs = [str(v["_id"]) for v in versions]
    
    # Get all comments for these versions
    comments = await db.comments.find({"version_id": {"$in": version_id_strs}}).to_list(length=100000)
    comment_id_strs = [str(c["_id"]) for c in comments]
    
    # Delete in order: replies -> comments -> versions -> asset
    if comment_id_strs:
        await db.replies.delete_many({"comment_id": {"$in": comment_id_strs}})
    if version_id_strs:
        await db.comments.delete_many({"version_id": {"$in": version_id_strs}})
    
    await db.versions.delete_many({"asset_id": asset_id})
    await db.assets.delete_one({"_id": oid})
    
    return None
