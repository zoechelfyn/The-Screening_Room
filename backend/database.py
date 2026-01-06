from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional
import os
import logging

logger = logging.getLogger(__name__)

class Database:
    client: Optional[AsyncIOMotorClient] = None
    db = None

db_instance = Database()

async def connect_db():
    """Connect to MongoDB and setup indexes."""
    mongo_url = os.environ.get('MONGO_URL')
    db_name = os.environ.get('DB_NAME', 'review_studio')
    
    db_instance.client = AsyncIOMotorClient(mongo_url)
    db_instance.db = db_instance.client[db_name]
    
    # Create indexes for foreign key relationships
    await setup_indexes()
    
    logger.info(f"Connected to MongoDB: {db_name}")
    return db_instance.db

async def setup_indexes():
    """Setup indexes for foreign key fields to ensure fast lookups."""
    db = db_instance.db
    
    # Projects collection - index on name for search
    await db.projects.create_index("name")
    await db.projects.create_index("created_at")
    
    # Assets collection - index on project_id (foreign key)
    await db.assets.create_index("project_id")
    await db.assets.create_index([("project_id", 1), ("created_at", -1)])
    
    # Versions collection - index on asset_id (foreign key)
    await db.versions.create_index("asset_id")
    await db.versions.create_index([("asset_id", 1), ("created_at", -1)])
    
    # Comments collection - compound index on asset_id + version_id
    await db.comments.create_index("asset_id")
    await db.comments.create_index("version_id")
    await db.comments.create_index([("asset_id", 1), ("version_id", 1)])
    await db.comments.create_index([("asset_id", 1), ("version_id", 1), ("created_at", 1)])
    
    # Replies collection - index on comment_id (foreign key)
    await db.replies.create_index("comment_id")
    await db.replies.create_index([("comment_id", 1), ("created_at", 1)])
    
    logger.info("Database indexes created successfully")

async def close_db():
    """Close MongoDB connection."""
    if db_instance.client:
        db_instance.client.close()
        logger.info("MongoDB connection closed")

def get_db():
    """Get database instance."""
    return db_instance.db
