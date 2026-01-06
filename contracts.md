# Review Studio - API Contracts & Integration Plan

## API Contracts

### 1. Projects

#### GET /api/projects
Returns list of all projects.
```json
{
  "projects": [
    { "id": "p_123", "name": "Client X - Launch", "clientName": "Client X", "createdAt": "2025-07-01T10:00:00Z" }
  ]
}
```

#### POST /api/projects
Create a new project.
Request:
```json
{ "name": "Client X - Launch", "clientName": "Client X" }
```
Response:
```json
{ "id": "p_123", "name": "Client X - Launch", "clientName": "Client X", "createdAt": "..." }
```

### 2. Assets

#### GET /api/projects/{projectId}/assets
Returns assets for a project.
```json
{
  "assets": [
    { "id": "a_1", "projectId": "p_123", "type": "video", "title": "Launch Cut" }
  ]
}
```

#### POST /api/projects/{projectId}/assets
Create an asset.
Request:
```json
{ "type": "video", "title": "Launch Cut" }
```

### 3. Versions

#### GET /api/assets/{assetId}/versions
Returns versions for an asset.
```json
{
  "versions": [
    {
      "id": "v_1",
      "assetId": "a_1",
      "label": "v1",
      "createdAt": "2025-07-02T10:00:00Z",
      "media": {
        "kind": "video",
        "url": "https://...",
        "durationMs": 183000
      }
    }
  ]
}
```

#### POST /api/assets/{assetId}/versions
Create a version.
Request:
```json
{
  "label": "v2",
  "media": { "kind": "video", "url": "https://...", "durationMs": 183000 }
}
```

### 4. Comments

#### GET /api/comments?assetId={assetId}&versionId={versionId}
Returns comments for asset + version.
```json
{
  "comments": [
    {
      "id": "c_1",
      "assetId": "a_1",
      "versionId": "v_2",
      "author": { "name": "Client", "role": "client" },
      "createdAt": "2025-07-02T12:00:00Z",
      "status": "open",
      "body": "Can we make the logo bigger?",
      "anchor": { "type": "video_time", "timeMs": 83450 }
    }
  ]
}
```

#### POST /api/comments
Create a comment.
Request (video):
```json
{
  "assetId": "a_1",
  "versionId": "v_2",
  "body": "This beat feels late",
  "anchor": { "type": "video_time", "timeMs": 91234 },
  "author": { "name": "You", "role": "internal" }
}
```

Request (image):
```json
{
  "assetId": "a_2",
  "versionId": "v_5",
  "body": "Needs more contrast",
  "anchor": { "type": "image_pin", "xNorm": 0.42, "yNorm": 0.58 },
  "author": { "name": "You", "role": "internal" }
}
```

#### PATCH /api/comments/{commentId}
Update comment.
Request:
```json
{ "body": "Updated note", "status": "resolved" }
```

### 5. Replies

#### GET /api/comments/{commentId}/replies
Returns replies for a comment.

#### POST /api/comments/{commentId}/replies
Create a reply.
Request:
```json
{ "body": "Let's do +15%", "author": { "name": "You", "role": "internal" } }
```

---

## Mock Data to Replace

Location: `/app/frontend/src/data/mock.js`

| Mock Variable | API Endpoint | Notes |
|--------------|--------------|-------|
| mockProjects | GET /api/projects | Full replacement |
| mockAssets | GET /api/projects/{id}/assets | Filter by projectId |
| mockVersions | GET /api/assets/{id}/versions | Filter by assetId |
| mockComments | GET /api/comments?assetId&versionId | Filter by both |
| mockReplies | GET /api/comments/{id}/replies | Filter by commentId |

---

## Backend Implementation

### MongoDB Collections
1. `projects` - Project documents
2. `assets` - Asset documents with projectId reference
3. `versions` - Version documents with assetId reference
4. `comments` - Comment documents with assetId + versionId
5. `replies` - Reply documents with commentId reference

### Files to Create
- `/app/backend/models.py` - Pydantic models
- `/app/backend/routes/projects.py` - Project endpoints
- `/app/backend/routes/assets.py` - Asset endpoints
- `/app/backend/routes/versions.py` - Version endpoints
- `/app/backend/routes/comments.py` - Comment endpoints
- `/app/backend/routes/replies.py` - Reply endpoints

---

## Frontend Integration

### Files to Modify
1. `/app/frontend/src/data/mock.js` → Convert to API service
2. `/app/frontend/src/pages/ReviewPage.jsx` → Use API calls
3. `/app/frontend/src/components/review/CommentsSidebar.jsx` → Add API calls

### API Service Pattern
```javascript
const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const projectsApi = {
  list: () => axios.get(`${API}/projects`),
  create: (data) => axios.post(`${API}/projects`, data)
};
```
