from pydantic import BaseModel, Field, field_validator
from typing import Optional, Literal, Union, List
from datetime import datetime
from bson import ObjectId


# Helper to convert ObjectId to string
def str_object_id(v):
    if isinstance(v, ObjectId):
        return str(v)
    return v


# ============== Author Model ==============
class Author(BaseModel):
    name: str
    role: Literal["client", "internal"]


# ============== Anchor Models ==============
class VideoTimeAnchor(BaseModel):
    type: Literal["video_time"] = "video_time"
    timeMs: int = Field(..., ge=0, description="Timestamp in milliseconds")


class ImagePinAnchor(BaseModel):
    type: Literal["image_pin"] = "image_pin"
    xNorm: float = Field(..., ge=0, le=1, description="Normalized X coordinate (0-1)")
    yNorm: float = Field(..., ge=0, le=1, description="Normalized Y coordinate (0-1)")


Anchor = Union[VideoTimeAnchor, ImagePinAnchor]


# ============== Media Models ==============
class VideoMedia(BaseModel):
    kind: Literal["video"] = "video"
    url: str
    durationMs: Optional[int] = None


class ImageMedia(BaseModel):
    kind: Literal["image"] = "image"
    url: str
    width: Optional[int] = None
    height: Optional[int] = None


Media = Union[VideoMedia, ImageMedia]


# ============== Project Models ==============
class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    client_name: Optional[str] = Field(None, max_length=200)


class ProjectResponse(BaseModel):
    id: str
    name: str
    client_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ProjectsListResponse(BaseModel):
    projects: List[ProjectResponse]


# ============== Asset Models ==============
class AssetCreate(BaseModel):
    type: Literal["video", "image"]
    title: str = Field(..., min_length=1, max_length=200)


class AssetResponse(BaseModel):
    id: str
    project_id: str
    type: Literal["video", "image"]
    title: str
    created_at: datetime

    class Config:
        from_attributes = True


class AssetsListResponse(BaseModel):
    assets: List[AssetResponse]


# ============== Version Models ==============
class VersionCreate(BaseModel):
    label: str = Field(..., min_length=1, max_length=50)
    media: Media


class VersionResponse(BaseModel):
    id: str
    asset_id: str
    label: str
    created_at: datetime
    media: Media

    class Config:
        from_attributes = True


class VersionsListResponse(BaseModel):
    versions: List[VersionResponse]


# ============== Comment Models ==============
class CommentCreate(BaseModel):
    asset_id: str = Field(..., min_length=1)
    version_id: str = Field(..., min_length=1)
    body: str = Field(..., min_length=1, max_length=5000)
    anchor: Anchor
    author: Author


class CommentUpdate(BaseModel):
    body: Optional[str] = Field(None, min_length=1, max_length=5000)
    status: Optional[Literal["open", "resolved"]] = None


class CommentResponse(BaseModel):
    id: str
    asset_id: str
    version_id: str
    author: Author
    created_at: datetime
    status: Literal["open", "resolved"]
    body: str
    anchor: Anchor

    class Config:
        from_attributes = True


class CommentsListResponse(BaseModel):
    comments: List[CommentResponse]


# ============== Reply Models ==============
class ReplyCreate(BaseModel):
    body: str = Field(..., min_length=1, max_length=5000)
    author: Author


class ReplyResponse(BaseModel):
    id: str
    comment_id: str
    author: Author
    created_at: datetime
    body: str

    class Config:
        from_attributes = True


class RepliesListResponse(BaseModel):
    replies: List[ReplyResponse]


# ============== Helper Functions ==============
def serialize_doc(doc: dict) -> dict:
    """Convert MongoDB document to API response format.
    Converts _id to id string and handles nested ObjectIds.
    """
    if doc is None:
        return None
    
    result = {}
    for key, value in doc.items():
        if key == "_id":
            result["id"] = str(value)
        elif isinstance(value, ObjectId):
            result[key] = str(value)
        elif isinstance(value, datetime):
            result[key] = value
        elif isinstance(value, dict):
            result[key] = serialize_doc(value)
        elif isinstance(value, list):
            result[key] = [serialize_doc(item) if isinstance(item, dict) else item for item in value]
        else:
            result[key] = value
    
    return result
