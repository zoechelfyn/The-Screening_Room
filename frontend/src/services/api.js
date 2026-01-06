import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============== Projects API ==============
export const projectsApi = {
  list: async () => {
    const response = await apiClient.get('/projects');
    return response.data.projects;
  },
  
  create: async (data) => {
    const response = await apiClient.post('/projects', data);
    return response.data;
  },
  
  get: async (projectId) => {
    const response = await apiClient.get(`/projects/${projectId}`);
    return response.data;
  },
  
  update: async (projectId, data) => {
    const response = await apiClient.patch(`/projects/${projectId}`, data);
    return response.data;
  },
  
  delete: async (projectId) => {
    await apiClient.delete(`/projects/${projectId}`);
  },
};

// ============== Assets API ==============
export const assetsApi = {
  list: async (projectId) => {
    const response = await apiClient.get(`/projects/${projectId}/assets`);
    return response.data.assets;
  },
  
  create: async (projectId, data) => {
    const response = await apiClient.post(`/projects/${projectId}/assets`, data);
    return response.data;
  },
  
  get: async (assetId) => {
    const response = await apiClient.get(`/assets/${assetId}`);
    return response.data;
  },
  
  delete: async (assetId) => {
    await apiClient.delete(`/assets/${assetId}`);
  },
};

// ============== Versions API ==============
export const versionsApi = {
  list: async (assetId) => {
    const response = await apiClient.get(`/assets/${assetId}/versions`);
    return response.data.versions;
  },
  
  create: async (assetId, data) => {
    const response = await apiClient.post(`/assets/${assetId}/versions`, data);
    return response.data;
  },
  
  get: async (assetId, versionId) => {
    const response = await apiClient.get(`/assets/${assetId}/versions/${versionId}`);
    return response.data;
  },
  
  delete: async (assetId, versionId) => {
    await apiClient.delete(`/assets/${assetId}/versions/${versionId}`);
  },
};

// ============== Comments API ==============
export const commentsApi = {
  list: async (assetId, versionId) => {
    const response = await apiClient.get('/comments', {
      params: { asset_id: assetId, version_id: versionId }
    });
    return response.data.comments;
  },
  
  create: async (data) => {
    // Transform frontend format to API format
    const payload = {
      asset_id: data.assetId,
      version_id: data.versionId,
      body: data.body,
      anchor: data.anchor,
      author: data.author,
    };
    const response = await apiClient.post('/comments', payload);
    return response.data;
  },
  
  get: async (commentId) => {
    const response = await apiClient.get(`/comments/${commentId}`);
    return response.data;
  },
  
  update: async (commentId, data) => {
    const response = await apiClient.patch(`/comments/${commentId}`, data);
    return response.data;
  },
  
  delete: async (commentId) => {
    await apiClient.delete(`/comments/${commentId}`);
  },
};

// ============== Replies API ==============
export const repliesApi = {
  list: async (commentId) => {
    const response = await apiClient.get(`/comments/${commentId}/replies`);
    return response.data.replies;
  },
  
  create: async (commentId, data) => {
    const response = await apiClient.post(`/comments/${commentId}/replies`, data);
    return response.data;
  },
  
  delete: async (commentId, replyId) => {
    await apiClient.delete(`/comments/${commentId}/replies/${replyId}`);
  },
};

// ============== Seed API (for demo) ==============
export const seedApi = {
  seed: async () => {
    const response = await apiClient.post('/seed');
    return response.data;
  },
};

// ============== Helper Functions ==============
export const formatTime = (ms) => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Transform API response to frontend format (snake_case to camelCase)
export const transformProject = (p) => ({
  id: p.id,
  name: p.name,
  clientName: p.client_name,
  createdAt: p.created_at,
});

export const transformAsset = (a) => ({
  id: a.id,
  projectId: a.project_id,
  type: a.type,
  title: a.title,
  createdAt: a.created_at,
});

export const transformVersion = (v) => ({
  id: v.id,
  assetId: v.asset_id,
  label: v.label,
  createdAt: v.created_at,
  media: v.media,
});

export const transformComment = (c) => ({
  id: c.id,
  assetId: c.asset_id,
  versionId: c.version_id,
  author: c.author,
  createdAt: c.created_at,
  status: c.status,
  body: c.body,
  anchor: c.anchor,
});

export const transformReply = (r) => ({
  id: r.id,
  commentId: r.comment_id,
  author: r.author,
  createdAt: r.created_at,
  body: r.body,
});

export default apiClient;
