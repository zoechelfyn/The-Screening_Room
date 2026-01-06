from fastapi import APIRouter, HTTPException, Query, status
from datetime import datetime
from bson import ObjectId
from typing import Optional

from database import get_db
from models import (
    CommentCreate,
    CommentUpdate,
    CommentResponse,
    CommentsListResponse,
    serialize_doc
)

router = APIRouter(prefix="/comments", tags=["comments"])


@router.get("", response_model=CommentsListResponse)
async def list_comments(
    asset_id: str = Query(..., description="Asset ID to filter comments"),
    version_id: str = Query(..., description="Version ID to filter comments")
):
    """Get comments for a specific asset and version."""
    db = get_db()
    
    # Validate asset exists
    try:
        asset = await db.assets.find_one({"_id": ObjectId(asset_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid asset ID format")
    
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    # Validate version exists and belongs to asset
    try:
        version = await db.versions.find_one({
            "_id": ObjectId(version_id),
            "asset_id": asset_id
        })
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid version ID format")
    
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    
    # Get comments - sort by timeMs for video, created_at for image
    cursor = db.comments.find({
        "asset_id": asset_id,
        "version_id": version_id
    })
    
    comments = await cursor.to_list(length=10000)
    
    # Sort: video by timeMs, image by created_at
    if asset["type"] == "video":
        comments.sort(key=lambda c: c.get("anchor", {}).get("timeMs", 0))
    else:
        comments.sort(key=lambda c: c.get("created_at", datetime.min))
    
    return {
        "comments": [serialize_doc(c) for c in comments]
    }


@router.post("", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
async def create_comment(comment: CommentCreate):
    """Create a new comment."""
    db = get_db()
    
    # Validate asset exists
    try:
        asset = await db.assets.find_one({"_id": ObjectId(comment.asset_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid asset ID format")
    
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    # Validate version exists and belongs to asset
    try:
        version = await db.versions.find_one({
            "_id": ObjectId(comment.version_id),
            "asset_id": comment.asset_id
        })
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid version ID format")
    
    if not version:
        raise HTTPException(
            status_code=404, 
            detail="Version not found or does not belong to the specified asset"
        )
    
    # Validate anchor type matches asset type
    if asset["type"] == "video" and comment.anchor.type != "video_time":
        raise HTTPException(
            status_code=400,
            detail="Video assets require 'video_time' anchor type"
        )
    if asset["type"] == "image" and comment.anchor.type != "image_pin":
        raise HTTPException(
            status_code=400,
            detail="Image assets require 'image_pin' anchor type"
        )
    
    doc = {
        "asset_id": comment.asset_id,
        "version_id": comment.version_id,
        "author": comment.author.model_dump(),
        "created_at": datetime.utcnow(),
        "status": "open",
        "body": comment.body,
        "anchor": comment.anchor.model_dump()
    }
    
    result = await db.comments.insert_one(doc)
    doc["_id"] = result.inserted_id
    
    return serialize_doc(doc)


@router.get("/{comment_id}", response_model=CommentResponse)
async def get_comment(comment_id: str):
    """Get a comment by ID."""
    db = get_db()
    
    try:
        comment = await db.comments.find_one({"_id": ObjectId(comment_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid comment ID format")
    
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    return serialize_doc(comment)


@router.patch("/{comment_id}", response_model=CommentResponse)
async def update_comment(comment_id: str, update: CommentUpdate):
    """Update a comment's body or status."""
    db = get_db()
    
    try:
        oid = ObjectId(comment_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid comment ID format")
    
    # Check comment exists
    comment = await db.comments.find_one({"_id": oid})
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    # Build update dict
    update_dict = {}
    if update.body is not None:
        update_dict["body"] = update.body
    if update.status is not None:
        update_dict["status"] = update.status
    
    if not update_dict:
        return serialize_doc(comment)
    
    await db.comments.update_one({"_id": oid}, {"$set": update_dict})
    
    # Fetch updated document
    comment = await db.comments.find_one({"_id": oid})
    return serialize_doc(comment)


@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(comment_id: str):
    """Delete a comment and all its replies."""
    db = get_db()
    
    try:
        oid = ObjectId(comment_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid comment ID format")
    
    # Check comment exists
    comment = await db.comments.find_one({"_id": oid})
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    # Delete replies first
    await db.replies.delete_many({"comment_id": comment_id})
    await db.comments.delete_one({"_id": oid})
    
    return None
