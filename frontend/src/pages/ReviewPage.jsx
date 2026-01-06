import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Film, Image as ImageIcon, Layers, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/components/layout/AppLayout';
import VideoPlayer from '@/components/review/VideoPlayer';
import ImageViewer from '@/components/review/ImageViewer';
import CommentsSidebar from '@/components/review/CommentsSidebar';
import {
  projectsApi,
  assetsApi,
  versionsApi,
  commentsApi,
  repliesApi,
  seedApi,
  transformProject,
  transformAsset,
  transformVersion,
  transformComment,
} from '@/services/api';

const ReviewPage = () => {
  const [projects, setProjects] = useState([]);
  const [assets, setAssets] = useState([]);
  const [versions, setVersions] = useState([]);
  const [comments, setComments] = useState([]);
  
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [selectedVersionId, setSelectedVersionId] = useState(null);
  const [highlightedCommentId, setHighlightedCommentId] = useState(null);
  const [newCommentAnchor, setNewCommentAnchor] = useState(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareVersionId, setCompareVersionId] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const seekToTimeRef = useRef(null);

  const selectedAsset = assets.find(a => a.id === selectedAssetId);
  const selectedVersion = versions.find(v => v.id === selectedVersionId);
  const selectedProject = projects.find(p => p.id === selectedProjectId);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await projectsApi.list();
      const transformed = data.map(transformProject);
      setProjects(transformed);
      
      if (transformed.length > 0) {
        setSelectedProjectId(transformed[0].id);
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  // Load assets when project changes
  useEffect(() => {
    if (selectedProjectId) {
      loadAssets(selectedProjectId);
    } else {
      setAssets([]);
      setSelectedAssetId(null);
    }
  }, [selectedProjectId]);

  const loadAssets = async (projectId) => {
    try {
      const data = await assetsApi.list(projectId);
      const transformed = data.map(transformAsset);
      setAssets(transformed);
      
      if (transformed.length > 0) {
        setSelectedAssetId(transformed[0].id);
      } else {
        setSelectedAssetId(null);
      }
    } catch (err) {
      console.error('Failed to load assets:', err);
    }
  };

  // Load versions when asset changes
  useEffect(() => {
    if (selectedAssetId) {
      loadVersions(selectedAssetId);
    } else {
      setVersions([]);
      setSelectedVersionId(null);
    }
  }, [selectedAssetId]);

  const loadVersions = async (assetId) => {
    try {
      const data = await versionsApi.list(assetId);
      const transformed = data.map(transformVersion);
      setVersions(transformed);
      
      if (transformed.length > 0) {
        // Select latest version
        const latest = transformed[transformed.length - 1];
        setSelectedVersionId(latest.id);
        
        // Setup compare mode default
        setCompareMode(false);
        if (transformed.length > 1) {
          setCompareVersionId(transformed[transformed.length - 2].id);
        }
      } else {
        setSelectedVersionId(null);
      }
      
      setHighlightedCommentId(null);
      setNewCommentAnchor(null);
    } catch (err) {
      console.error('Failed to load versions:', err);
    }
  };

  // Load comments when version changes
  useEffect(() => {
    if (selectedAssetId && selectedVersionId) {
      loadComments(selectedAssetId, selectedVersionId);
    } else {
      setComments([]);
    }
  }, [selectedAssetId, selectedVersionId]);

  const loadComments = async (assetId, versionId) => {
    try {
      const data = await commentsApi.list(assetId, versionId);
      const transformed = data.map(transformComment);
      setComments(transformed);
      setHighlightedCommentId(null);
    } catch (err) {
      console.error('Failed to load comments:', err);
    }
  };

  const handleVersionChange = (versionId) => {
    setSelectedVersionId(versionId);
    setNewCommentAnchor(null);
  };

  const handleCommentClick = useCallback((comment) => {
    setHighlightedCommentId(comment.id);
    
    if (comment.anchor.type === 'video_time' && seekToTimeRef.current) {
      seekToTimeRef.current(comment.anchor.timeMs);
    }
  }, []);

  const handleMarkerClick = useCallback((commentId) => {
    setHighlightedCommentId(commentId);
  }, []);

  const handlePinClick = useCallback((commentId) => {
    setHighlightedCommentId(commentId);
  }, []);

  const handleAddVideoComment = useCallback((timeMs) => {
    setNewCommentAnchor({
      type: 'video_time',
      timeMs: Math.round(timeMs)
    });
  }, []);

  const handleAddImageComment = useCallback((coords) => {
    setNewCommentAnchor({
      type: 'image_pin',
      xNorm: coords.xNorm,
      yNorm: coords.yNorm
    });
  }, []);

  const handleSubmitComment = useCallback(async (data) => {
    try {
      const newComment = await commentsApi.create({
        assetId: selectedAssetId,
        versionId: selectedVersionId,
        body: data.body,
        anchor: data.anchor,
        author: { name: 'You', role: 'internal' }
      });
      
      const transformed = transformComment(newComment);
      setComments(prev => [...prev, transformed]);
      setNewCommentAnchor(null);
      setHighlightedCommentId(transformed.id);
    } catch (err) {
      console.error('Failed to create comment:', err);
    }
  }, [selectedAssetId, selectedVersionId]);

  const handleResolveComment = useCallback(async (commentId) => {
    try {
      const comment = comments.find(c => c.id === commentId);
      const newStatus = comment.status === 'resolved' ? 'open' : 'resolved';
      
      await commentsApi.update(commentId, { status: newStatus });
      
      setComments(prev => prev.map(c => 
        c.id === commentId ? { ...c, status: newStatus } : c
      ));
    } catch (err) {
      console.error('Failed to update comment:', err);
    }
  }, [comments]);

  const handleToggleCompareMode = useCallback(() => {
    setCompareMode(prev => !prev);
  }, []);

  const handleSeedDatabase = async () => {
    try {
      setLoading(true);
      await seedApi.seed();
      await loadProjects();
    } catch (err) {
      console.error('Failed to seed database:', err);
      setError('Failed to seed database');
    } finally {
      setLoading(false);
    }
  };

  if (loading && projects.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0a0a0b] text-white">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-violet-400" />
          <p>Loading Review Studio...</p>
        </div>
      </div>
    );
  }

  return (
    <AppLayout
      projects={projects}
      assets={assets}
      selectedProjectId={selectedProjectId}
      selectedAssetId={selectedAssetId}
      onProjectSelect={setSelectedProjectId}
      onAssetSelect={setSelectedAssetId}
    >
      {selectedAsset ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar with asset info and version selector */}
          <header className="h-14 border-b border-white/10 flex items-center justify-between px-4 bg-[#0d0d0e]">
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center',
                selectedAsset.type === 'video' ? 'bg-blue-500/20' : 'bg-emerald-500/20'
              )}>
                {selectedAsset.type === 'video' ? (
                  <Film className="w-4 h-4 text-blue-400" />
                ) : (
                  <ImageIcon className="w-4 h-4 text-emerald-400" />
                )}
              </div>
              <div>
                <h1 className="font-medium text-white">{selectedAsset.title}</h1>
                <p className="text-xs text-white/50">
                  {selectedProject?.name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Version indicator */}
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-white/50" />
                <Select value={selectedVersionId || ''} onValueChange={handleVersionChange}>
                  <SelectTrigger className="w-28 h-9 bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Version" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1c] border-white/10">
                    {versions.map(v => (
                      <SelectItem key={v.id} value={v.id}>
                        <div className="flex items-center gap-2">
                          <span>{v.label}</span>
                          {v.id === versions[versions.length - 1]?.id && (
                            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-emerald-500/30 text-emerald-400">
                              Latest
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Comment count */}
              <Badge variant="secondary" className="bg-violet-500/20 text-violet-300">
                {comments.length} comments
              </Badge>
            </div>
          </header>

          {/* Main content area */}
          <div className="flex-1 flex overflow-hidden">
            {/* Media viewer */}
            {selectedAsset.type === 'video' ? (
              <VideoPlayer
                version={selectedVersion}
                comments={comments}
                highlightedCommentId={highlightedCommentId}
                onAddComment={handleAddVideoComment}
                onMarkerClick={handleMarkerClick}
                onSeekToTime={seekToTimeRef}
              />
            ) : (
              <ImageViewer
                version={selectedVersion}
                versions={versions}
                comments={comments}
                highlightedCommentId={highlightedCommentId}
                compareMode={compareMode}
                compareVersionId={compareVersionId}
                onCompareVersionChange={setCompareVersionId}
                onToggleCompareMode={handleToggleCompareMode}
                onAddComment={handleAddImageComment}
                onPinClick={handlePinClick}
              />
            )}

            {/* Comments sidebar */}
            <CommentsSidebar
              asset={selectedAsset}
              version={selectedVersion}
              versions={versions}
              comments={comments}
              highlightedCommentId={highlightedCommentId}
              onVersionChange={handleVersionChange}
              onCommentClick={handleCommentClick}
              onAddComment={handleSubmitComment}
              onResolveComment={handleResolveComment}
              newCommentAnchor={newCommentAnchor}
              onClearNewComment={() => setNewCommentAnchor(null)}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-[#0a0a0b]">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Film className="w-8 h-8 text-white/30" />
            </div>
            <h2 className="text-xl font-medium text-white mb-2">
              {projects.length === 0 ? 'No projects found' : 'Select an asset to review'}
            </h2>
            <p className="text-white/50 mb-6">
              {projects.length === 0 
                ? 'Seed the database to get started with sample data'
                : 'Choose a video or image from the sidebar to start reviewing'}
            </p>
            {projects.length === 0 && (
              <Button 
                onClick={handleSeedDatabase}
                className="bg-violet-500 hover:bg-violet-600 text-white"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Seeding...
                  </>
                ) : (
                  'Seed Sample Data'
                )}
              </Button>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default ReviewPage;
