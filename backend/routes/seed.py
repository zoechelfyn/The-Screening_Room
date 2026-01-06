from fastapi import APIRouter, HTTPException, status
from datetime import datetime
from bson import ObjectId

from database import get_db
from models import (
    ProjectCreate,
    AssetCreate,
    VersionCreate,
    CommentCreate,
    serialize_doc
)

router = APIRouter(prefix="/seed", tags=["seed"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def seed_database():
    """Seed the database with sample data for demo purposes."""
    db = get_db()
    
    # Clear existing data
    await db.replies.delete_many({})
    await db.comments.delete_many({})
    await db.versions.delete_many({})
    await db.assets.delete_many({})
    await db.projects.delete_many({})
    
    # Create projects
    projects_data = [
        {"name": "Client X - Product Launch", "client_name": "Client X", "created_at": datetime(2025, 7, 1, 10, 0, 0)},
        {"name": "Brand Y - Campaign 2025", "client_name": "Brand Y", "created_at": datetime(2025, 6, 15, 14, 30, 0)},
        {"name": "Studio Z - Promo Video", "client_name": "Studio Z", "created_at": datetime(2025, 5, 20, 9, 0, 0)},
    ]
    
    project_ids = []
    for p in projects_data:
        result = await db.projects.insert_one(p)
        project_ids.append(str(result.inserted_id))
    
    # Create assets
    assets_data = [
        {"project_id": project_ids[0], "type": "video", "title": "Launch Promo - Main Cut", "created_at": datetime(2025, 7, 2, 10, 0, 0)},
        {"project_id": project_ids[0], "type": "image", "title": "Hero Banner Design", "created_at": datetime(2025, 7, 2, 11, 0, 0)},
        {"project_id": project_ids[0], "type": "video", "title": "Social Media Teaser", "created_at": datetime(2025, 7, 3, 10, 0, 0)},
        {"project_id": project_ids[1], "type": "image", "title": "Campaign Key Visual", "created_at": datetime(2025, 6, 16, 10, 0, 0)},
        {"project_id": project_ids[1], "type": "video", "title": "TV Commercial Draft", "created_at": datetime(2025, 6, 18, 10, 0, 0)},
    ]
    
    asset_ids = []
    for a in assets_data:
        result = await db.assets.insert_one(a)
        asset_ids.append(str(result.inserted_id))
    
    # Create versions
    versions_data = [
        # Asset 0 (video) versions
        {
            "asset_id": asset_ids[0], "label": "v1", "created_at": datetime(2025, 7, 2, 10, 0, 0),
            "media": {"kind": "video", "url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", "durationMs": 596000}
        },
        {
            "asset_id": asset_ids[0], "label": "v2", "created_at": datetime(2025, 7, 3, 14, 0, 0),
            "media": {"kind": "video", "url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4", "durationMs": 653000}
        },
        # Asset 1 (image) versions
        {
            "asset_id": asset_ids[1], "label": "v1", "created_at": datetime(2025, 7, 2, 11, 0, 0),
            "media": {"kind": "image", "url": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1920&q=80", "width": 1920, "height": 1080}
        },
        {
            "asset_id": asset_ids[1], "label": "v2", "created_at": datetime(2025, 7, 3, 16, 0, 0),
            "media": {"kind": "image", "url": "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=1920&q=80", "width": 1920, "height": 1080}
        },
        {
            "asset_id": asset_ids[1], "label": "v3", "created_at": datetime(2025, 7, 4, 9, 0, 0),
            "media": {"kind": "image", "url": "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1920&q=80", "width": 1920, "height": 1080}
        },
        # Asset 2 (video) versions
        {
            "asset_id": asset_ids[2], "label": "v1", "created_at": datetime(2025, 7, 3, 10, 0, 0),
            "media": {"kind": "video", "url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", "durationMs": 15000}
        },
        # Asset 3 (image) versions
        {
            "asset_id": asset_ids[3], "label": "v1", "created_at": datetime(2025, 6, 16, 10, 0, 0),
            "media": {"kind": "image", "url": "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1920&q=80", "width": 1920, "height": 1080}
        },
        {
            "asset_id": asset_ids[3], "label": "v2", "created_at": datetime(2025, 6, 17, 14, 0, 0),
            "media": {"kind": "image", "url": "https://images.unsplash.com/photo-1557683316-973673baf926?w=1920&q=80", "width": 1920, "height": 1080}
        },
        # Asset 4 (video) versions
        {
            "asset_id": asset_ids[4], "label": "v1", "created_at": datetime(2025, 6, 18, 10, 0, 0),
            "media": {"kind": "video", "url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4", "durationMs": 887000}
        },
    ]
    
    version_ids = []
    for v in versions_data:
        result = await db.versions.insert_one(v)
        version_ids.append(str(result.inserted_id))
    
    # Create comments
    comments_data = [
        # Comments for video asset 0, version 0 (v1)
        {
            "asset_id": asset_ids[0], "version_id": version_ids[0],
            "author": {"name": "Sarah Chen", "role": "client"},
            "created_at": datetime(2025, 7, 2, 12, 0, 0),
            "status": "open",
            "body": "The logo animation feels too fast here. Can we slow it down by about 20%?",
            "anchor": {"type": "video_time", "timeMs": 5200}
        },
        {
            "asset_id": asset_ids[0], "version_id": version_ids[0],
            "author": {"name": "Mike Johnson", "role": "internal"},
            "created_at": datetime(2025, 7, 2, 12, 30, 0),
            "status": "resolved",
            "body": "Color grading looks perfect in this section. Great work!",
            "anchor": {"type": "video_time", "timeMs": 15000}
        },
        {
            "asset_id": asset_ids[0], "version_id": version_ids[0],
            "author": {"name": "Sarah Chen", "role": "client"},
            "created_at": datetime(2025, 7, 2, 14, 0, 0),
            "status": "open",
            "body": "Can we add a subtle sound effect when the product appears?",
            "anchor": {"type": "video_time", "timeMs": 28500}
        },
        # Comments for video asset 0, version 1 (v2)
        {
            "asset_id": asset_ids[0], "version_id": version_ids[1],
            "author": {"name": "Sarah Chen", "role": "client"},
            "created_at": datetime(2025, 7, 3, 15, 0, 0),
            "status": "open",
            "body": "Much better pacing now! But the transition at this point feels abrupt.",
            "anchor": {"type": "video_time", "timeMs": 42000}
        },
        {
            "asset_id": asset_ids[0], "version_id": version_ids[1],
            "author": {"name": "Alex Kim", "role": "internal"},
            "created_at": datetime(2025, 7, 3, 16, 0, 0),
            "status": "open",
            "body": "The audio mix needs adjustment here - music is too loud over the voiceover.",
            "anchor": {"type": "video_time", "timeMs": 78000}
        },
        # Comments for image asset 1, version 2 (v1)
        {
            "asset_id": asset_ids[1], "version_id": version_ids[2],
            "author": {"name": "Sarah Chen", "role": "client"},
            "created_at": datetime(2025, 7, 2, 13, 0, 0),
            "status": "open",
            "body": "Can we make the headline more prominent? It gets lost in the background.",
            "anchor": {"type": "image_pin", "xNorm": 0.5, "yNorm": 0.2}
        },
        {
            "asset_id": asset_ids[1], "version_id": version_ids[2],
            "author": {"name": "Emily Park", "role": "internal"},
            "created_at": datetime(2025, 7, 2, 14, 30, 0),
            "status": "resolved",
            "body": "This button needs more contrast for accessibility.",
            "anchor": {"type": "image_pin", "xNorm": 0.35, "yNorm": 0.75}
        },
        # Comments for image asset 1, version 3 (v2)
        {
            "asset_id": asset_ids[1], "version_id": version_ids[3],
            "author": {"name": "Sarah Chen", "role": "client"},
            "created_at": datetime(2025, 7, 3, 17, 0, 0),
            "status": "open",
            "body": "Love the new color palette! This aligns perfectly with our brand.",
            "anchor": {"type": "image_pin", "xNorm": 0.7, "yNorm": 0.4}
        },
        # Comments for image asset 1, version 4 (v3)
        {
            "asset_id": asset_ids[1], "version_id": version_ids[4],
            "author": {"name": "Sarah Chen", "role": "client"},
            "created_at": datetime(2025, 7, 4, 10, 0, 0),
            "status": "open",
            "body": "Final version looks great! Just need a small tweak to the footer text.",
            "anchor": {"type": "image_pin", "xNorm": 0.5, "yNorm": 0.9}
        },
    ]
    
    comment_ids = []
    for c in comments_data:
        result = await db.comments.insert_one(c)
        comment_ids.append(str(result.inserted_id))
    
    # Create replies
    replies_data = [
        {
            "comment_id": comment_ids[0],
            "author": {"name": "Mike Johnson", "role": "internal"},
            "created_at": datetime(2025, 7, 2, 12, 15, 0),
            "body": "Sure, I can slow it down. Would 25% slower work for you?"
        },
        {
            "comment_id": comment_ids[0],
            "author": {"name": "Sarah Chen", "role": "client"},
            "created_at": datetime(2025, 7, 2, 12, 20, 0),
            "body": "Yes, that sounds perfect!"
        },
        {
            "comment_id": comment_ids[2],
            "author": {"name": "Alex Kim", "role": "internal"},
            "created_at": datetime(2025, 7, 2, 14, 30, 0),
            "body": "I have a few options for the sound effect. Will send samples shortly."
        },
    ]
    
    for r in replies_data:
        await db.replies.insert_one(r)
    
    return {
        "message": "Database seeded successfully",
        "counts": {
            "projects": len(project_ids),
            "assets": len(asset_ids),
            "versions": len(version_ids),
            "comments": len(comment_ids),
            "replies": len(replies_data)
        }
    }
