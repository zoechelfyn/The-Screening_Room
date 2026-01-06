from fastapi import FastAPI
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
import logging
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Import database functions
from database import connect_db, close_db

# Import route modules
from routes.projects import router as projects_router
from routes.assets import router as assets_router
from routes.versions import router as versions_router
from routes.comments import router as comments_router
from routes.replies import router as replies_router
from routes.seed import router as seed_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for startup/shutdown events."""
    # Startup
    logger.info("Starting up Review Studio API...")
    await connect_db()
    logger.info("Database connected successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Review Studio API...")
    await close_db()
    logger.info("Database connection closed")


# Create FastAPI app
app = FastAPI(
    title="Review Studio API",
    description="Client-Friendly Review Studio for video and image assets",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/api/")
async def root():
    return {"message": "Review Studio API is running"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "review-studio-api"}

# Include all routers with /api prefix
app.include_router(projects_router, prefix="/api")
app.include_router(assets_router, prefix="/api")
app.include_router(versions_router, prefix="/api")
app.include_router(comments_router, prefix="/api")
app.include_router(replies_router, prefix="/api")
app.include_router(seed_router, prefix="/api")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
