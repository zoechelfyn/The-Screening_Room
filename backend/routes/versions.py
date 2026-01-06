from fastapi import APIRouter, HTTPException, status
from datetime import datetime
from bson import ObjectId

from database import get_db
from models import (
    VersionCreate,
    VersionResponse,
    VersionsListResponse,
    serialize_doc
)

router = APIRouter(prefix="/assets", tags=["versions"])


@router.get("/{asset_id}/versions", response_model=VersionsListResponse)
async def list_versions(asset_id: str):
    """Get all versions for an asset."""
    db = get_db()
    
    # Validate asset exists
    try:
        asset = await db.assets.find_one({"_id": ObjectId(asset_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid asset ID format")
    
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    cursor = db.versions.find({"asset_id": asset_id}).sort("created_at", 1)
    versions = await cursor.to_list(length=1000)
    
    return {
        "versions": [serialize_doc(v) for v in versions]
    }


@router.post("/{asset_id}/versions", response_model=VersionResponse, status_code=status.HTTP_201_CREATED)
async def create_version(asset_id: str, version: VersionCreate):
    """Create a new version for an asset."""
    db = get_db()
    
    # Validate asset exists
    try:
        asset = await db.assets.find_one({"_id": ObjectId(asset_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid asset ID format")
    
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    # Validate media kind matches asset type
    if asset["type"] == "video" and version.media.kind != "video":
        raise HTTPException(
            status_code=400, 
            detail="Media kind must be 'video' for video assets"
        )
    if asset["type"] == "image" and version.media.kind != "image":
        raise HTTPException(
            status_code=400, 
            detail="Media kind must be 'image' for image assets"
        )
    
    doc = {
        "asset_id": asset_id,  # String reference to parent
        "label": version.label,
        "created_at": datetime.utcnow(),
        "media": version.media.model_dump()
    }
    
    result = await db.versions.insert_one(doc)
    doc["_id"] = result.inserted_id
    
    return serialize_doc(doc)


@router.get("/{asset_id}/versions/{version_id}", response_model=VersionResponse)
async def get_version(asset_id: str, version_id: str):
    """Get a specific version."""
    db = get_db()
    
    try:
        version = await db.versions.find_one({
            "_id": ObjectId(version_id),
            "asset_id": asset_id
        })
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    
    return serialize_doc(version)


@router.delete("/{asset_id}/versions/{version_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_version(asset_id: str, version_id: str):
    """Delete a version and all its comments."""
    db = get_db()
    
    try:
        oid = ObjectId(version_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid version ID format")
    
    # Check version exists and belongs to asset
    version = await db.versions.find_one({"_id": oid, "asset_id": asset_id})
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    
    # Get all comments for this version
    comments = await db.comments.find({"version_id": version_id}).to_list(length=100000)
    comment_id_strs = [str(c["_id"]) for c in comments]
    
    # Delete replies and comments
    if comment_id_strs:
        await db.replies.delete_many({"comment_id": {"$in": comment_id_strs}})
    
    await db.comments.delete_many({"version_id": version_id})
    await db.versions.delete_one({"_id": oid})
    
    return None
