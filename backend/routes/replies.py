from fastapi import APIRouter, HTTPException, status
from datetime import datetime
from bson import ObjectId

from database import get_db
from models import (
    ReplyCreate,
    ReplyResponse,
    RepliesListResponse,
    serialize_doc
)

router = APIRouter(prefix="/comments", tags=["replies"])


@router.get("/{comment_id}/replies", response_model=RepliesListResponse)
async def list_replies(comment_id: str):
    """Get all replies for a comment."""
    db = get_db()
    
    # Validate comment exists
    try:
        comment = await db.comments.find_one({"_id": ObjectId(comment_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid comment ID format")
    
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    cursor = db.replies.find({"comment_id": comment_id}).sort("created_at", 1)
    replies = await cursor.to_list(length=1000)
    
    return {
        "replies": [serialize_doc(r) for r in replies]
    }


@router.post("/{comment_id}/replies", response_model=ReplyResponse, status_code=status.HTTP_201_CREATED)
async def create_reply(comment_id: str, reply: ReplyCreate):
    """Create a reply to a comment."""
    db = get_db()
    
    # Validate comment exists
    try:
        comment = await db.comments.find_one({"_id": ObjectId(comment_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid comment ID format")
    
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    doc = {
        "comment_id": comment_id,  # String reference to parent
        "author": reply.author.model_dump(),
        "created_at": datetime.utcnow(),
        "body": reply.body
    }
    
    result = await db.replies.insert_one(doc)
    doc["_id"] = result.inserted_id
    
    return serialize_doc(doc)


@router.delete("/{comment_id}/replies/{reply_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_reply(comment_id: str, reply_id: str):
    """Delete a reply."""
    db = get_db()
    
    try:
        oid = ObjectId(reply_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid reply ID format")
    
    # Check reply exists and belongs to comment
    reply = await db.replies.find_one({"_id": oid, "comment_id": comment_id})
    if not reply:
        raise HTTPException(status_code=404, detail="Reply not found")
    
    await db.replies.delete_one({"_id": oid})
    
    return None
