// Mock Data for Review Studio

export const mockProjects = [
  {
    id: 'p_1',
    name: 'Client X - Product Launch',
    clientName: 'Client X',
    createdAt: '2025-07-01T10:00:00Z'
  },
  {
    id: 'p_2',
    name: 'Brand Y - Campaign 2025',
    clientName: 'Brand Y',
    createdAt: '2025-06-15T14:30:00Z'
  },
  {
    id: 'p_3',
    name: 'Studio Z - Promo Video',
    clientName: 'Studio Z',
    createdAt: '2025-05-20T09:00:00Z'
  }
];

export const mockAssets = [
  {
    id: 'a_1',
    projectId: 'p_1',
    type: 'video',
    title: 'Launch Promo - Main Cut'
  },
  {
    id: 'a_2',
    projectId: 'p_1',
    type: 'image',
    title: 'Hero Banner Design'
  },
  {
    id: 'a_3',
    projectId: 'p_1',
    type: 'video',
    title: 'Social Media Teaser'
  },
  {
    id: 'a_4',
    projectId: 'p_2',
    type: 'image',
    title: 'Campaign Key Visual'
  },
  {
    id: 'a_5',
    projectId: 'p_2',
    type: 'video',
    title: 'TV Commercial Draft'
  }
];

export const mockVersions = [
  // Asset a_1 versions (video)
  {
    id: 'v_1',
    assetId: 'a_1',
    label: 'v1',
    createdAt: '2025-07-02T10:00:00Z',
    media: {
      kind: 'video',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      durationMs: 596000
    }
  },
  {
    id: 'v_2',
    assetId: 'a_1',
    label: 'v2',
    createdAt: '2025-07-03T14:00:00Z',
    media: {
      kind: 'video',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      durationMs: 653000
    }
  },
  // Asset a_2 versions (image)
  {
    id: 'v_3',
    assetId: 'a_2',
    label: 'v1',
    createdAt: '2025-07-02T11:00:00Z',
    media: {
      kind: 'image',
      url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1920&q=80',
      width: 1920,
      height: 1080
    }
  },
  {
    id: 'v_4',
    assetId: 'a_2',
    label: 'v2',
    createdAt: '2025-07-03T16:00:00Z',
    media: {
      kind: 'image',
      url: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=1920&q=80',
      width: 1920,
      height: 1080
    }
  },
  {
    id: 'v_5',
    assetId: 'a_2',
    label: 'v3',
    createdAt: '2025-07-04T09:00:00Z',
    media: {
      kind: 'image',
      url: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1920&q=80',
      width: 1920,
      height: 1080
    }
  },
  // Asset a_3 versions (video)
  {
    id: 'v_6',
    assetId: 'a_3',
    label: 'v1',
    createdAt: '2025-07-03T10:00:00Z',
    media: {
      kind: 'video',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      durationMs: 15000
    }
  },
  // Asset a_4 versions (image)
  {
    id: 'v_7',
    assetId: 'a_4',
    label: 'v1',
    createdAt: '2025-06-16T10:00:00Z',
    media: {
      kind: 'image',
      url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1920&q=80',
      width: 1920,
      height: 1080
    }
  },
  {
    id: 'v_8',
    assetId: 'a_4',
    label: 'v2',
    createdAt: '2025-06-17T14:00:00Z',
    media: {
      kind: 'image',
      url: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1920&q=80',
      width: 1920,
      height: 1080
    }
  },
  // Asset a_5 versions (video)
  {
    id: 'v_9',
    assetId: 'a_5',
    label: 'v1',
    createdAt: '2025-06-18T10:00:00Z',
    media: {
      kind: 'video',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
      durationMs: 887000
    }
  }
];

export const mockComments = [
  // Comments for video a_1, version v_1
  {
    id: 'c_1',
    assetId: 'a_1',
    versionId: 'v_1',
    author: { name: 'Sarah Chen', role: 'client' },
    createdAt: '2025-07-02T12:00:00Z',
    status: 'open',
    body: 'The logo animation feels too fast here. Can we slow it down by about 20%?',
    anchor: { type: 'video_time', timeMs: 5200 }
  },
  {
    id: 'c_2',
    assetId: 'a_1',
    versionId: 'v_1',
    author: { name: 'Mike Johnson', role: 'internal' },
    createdAt: '2025-07-02T12:30:00Z',
    status: 'resolved',
    body: 'Color grading looks perfect in this section. Great work!',
    anchor: { type: 'video_time', timeMs: 15000 }
  },
  {
    id: 'c_3',
    assetId: 'a_1',
    versionId: 'v_1',
    author: { name: 'Sarah Chen', role: 'client' },
    createdAt: '2025-07-02T14:00:00Z',
    status: 'open',
    body: 'Can we add a subtle sound effect when the product appears?',
    anchor: { type: 'video_time', timeMs: 28500 }
  },
  // Comments for video a_1, version v_2
  {
    id: 'c_4',
    assetId: 'a_1',
    versionId: 'v_2',
    author: { name: 'Sarah Chen', role: 'client' },
    createdAt: '2025-07-03T15:00:00Z',
    status: 'open',
    body: 'Much better pacing now! But the transition at this point feels abrupt.',
    anchor: { type: 'video_time', timeMs: 42000 }
  },
  {
    id: 'c_5',
    assetId: 'a_1',
    versionId: 'v_2',
    author: { name: 'Alex Kim', role: 'internal' },
    createdAt: '2025-07-03T16:00:00Z',
    status: 'open',
    body: 'The audio mix needs adjustment here - music is too loud over the voiceover.',
    anchor: { type: 'video_time', timeMs: 78000 }
  },
  // Comments for image a_2, version v_3
  {
    id: 'c_6',
    assetId: 'a_2',
    versionId: 'v_3',
    author: { name: 'Sarah Chen', role: 'client' },
    createdAt: '2025-07-02T13:00:00Z',
    status: 'open',
    body: 'Can we make the headline more prominent? It gets lost in the background.',
    anchor: { type: 'image_pin', xNorm: 0.5, yNorm: 0.2 }
  },
  {
    id: 'c_7',
    assetId: 'a_2',
    versionId: 'v_3',
    author: { name: 'Emily Park', role: 'internal' },
    createdAt: '2025-07-02T14:30:00Z',
    status: 'resolved',
    body: 'This button needs more contrast for accessibility.',
    anchor: { type: 'image_pin', xNorm: 0.35, yNorm: 0.75 }
  },
  // Comments for image a_2, version v_4
  {
    id: 'c_8',
    assetId: 'a_2',
    versionId: 'v_4',
    author: { name: 'Sarah Chen', role: 'client' },
    createdAt: '2025-07-03T17:00:00Z',
    status: 'open',
    body: 'Love the new color palette! This aligns perfectly with our brand.',
    anchor: { type: 'image_pin', xNorm: 0.7, yNorm: 0.4 }
  },
  // Comments for image a_2, version v_5
  {
    id: 'c_9',
    assetId: 'a_2',
    versionId: 'v_5',
    author: { name: 'Sarah Chen', role: 'client' },
    createdAt: '2025-07-04T10:00:00Z',
    status: 'open',
    body: 'Final version looks great! Just need a small tweak to the footer text.',
    anchor: { type: 'image_pin', xNorm: 0.5, yNorm: 0.9 }
  }
];

export const mockReplies = [
  {
    id: 'r_1',
    commentId: 'c_1',
    author: { name: 'Mike Johnson', role: 'internal' },
    createdAt: '2025-07-02T12:15:00Z',
    body: 'Sure, I can slow it down. Would 25% slower work for you?'
  },
  {
    id: 'r_2',
    commentId: 'c_1',
    author: { name: 'Sarah Chen', role: 'client' },
    createdAt: '2025-07-02T12:20:00Z',
    body: 'Yes, that sounds perfect!'
  },
  {
    id: 'r_3',
    commentId: 'c_3',
    author: { name: 'Alex Kim', role: 'internal' },
    createdAt: '2025-07-02T14:30:00Z',
    body: 'I have a few options for the sound effect. Will send samples shortly.'
  }
];

// Helper functions
export const getProjectById = (id) => mockProjects.find(p => p.id === id);

export const getAssetsByProjectId = (projectId) => mockAssets.filter(a => a.projectId === projectId);

export const getAssetById = (id) => mockAssets.find(a => a.id === id);

export const getVersionsByAssetId = (assetId) => mockVersions.filter(v => v.assetId === assetId);

export const getVersionById = (id) => mockVersions.find(v => v.id === id);

export const getCommentsByAssetAndVersion = (assetId, versionId) => 
  mockComments.filter(c => c.assetId === assetId && c.versionId === versionId);

export const getRepliesByCommentId = (commentId) => 
  mockReplies.filter(r => r.commentId === commentId);

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
