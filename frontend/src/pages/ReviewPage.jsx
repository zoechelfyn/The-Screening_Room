import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, Layers, Film, Image as ImageIcon } from 'lucide-react';
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
  mockProjects,
  mockAssets,
  getAssetById,
  getVersionsByAssetId,
  getCommentsByAssetAndVersion,
  mockComments
} from '@/data/mock';

const ReviewPage = () => {
  const [selectedProjectId, setSelectedProjectId] = useState(mockProjects[0]?.id);
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [selectedVersionId, setSelectedVersionId] = useState(null);
  const [highlightedCommentId, setHighlightedCommentId] = useState(null);
  const [newCommentAnchor, setNewCommentAnchor] = useState(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareVersionId, setCompareVersionId] = useState(null);
  const [comments, setComments] = useState([]);
  
  const seekToTimeRef = useRef(null);

  const selectedAsset = selectedAssetId ? getAssetById(selectedAssetId) : null;
  const versions = selectedAssetId ? getVersionsByAssetId(selectedAssetId) : [];
  const selectedVersion = versions.find(v => v.id === selectedVersionId);

  // Auto-select first asset when project changes
  useEffect(() => {
    if (selectedProjectId) {
      const projectAssets = mockAssets.filter(a => a.projectId === selectedProjectId);
      if (projectAssets.length > 0) {
        setSelectedAssetId(projectAssets[0].id);
      } else {
        setSelectedAssetId(null);
      }
    }
  }, [selectedProjectId]);

  // Auto-select latest version when asset changes
  useEffect(() => {
    if (selectedAssetId) {
      const assetVersions = getVersionsByAssetId(selectedAssetId);
      if (assetVersions.length > 0) {
        // Select latest version
        const latest = assetVersions[assetVersions.length - 1];
        setSelectedVersionId(latest.id);
        
        // Reset compare mode
        setCompareMode(false);
        if (assetVersions.length > 1) {
          setCompareVersionId(assetVersions[assetVersions.length - 2].id);
        }
      } else {
        setSelectedVersionId(null);
      }
      setHighlightedCommentId(null);
      setNewCommentAnchor(null);
    }
  }, [selectedAssetId]);

  // Load comments when version changes
  useEffect(() => {
    if (selectedAssetId && selectedVersionId) {
      const versionComments = getCommentsByAssetAndVersion(selectedAssetId, selectedVersionId);
      setComments(versionComments);
      setHighlightedCommentId(null);
    } else {
      setComments([]);
    }
  }, [selectedAssetId, selectedVersionId]);

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

  const handleSubmitComment = useCallback((data) => {
    // Create new comment (mock - in real app would call API)
    const newComment = {
      id: `c_${Date.now()}`,
      assetId: selectedAssetId,
      versionId: selectedVersionId,
      author: { name: 'You', role: 'internal' },
      createdAt: new Date().toISOString(),
      status: 'open',
      body: data.body,
      anchor: data.anchor
    };
    
    setComments(prev => [...prev, newComment]);
    setNewCommentAnchor(null);
    setHighlightedCommentId(newComment.id);
  }, [selectedAssetId, selectedVersionId]);

  const handleResolveComment = useCallback((commentId) => {
    setComments(prev => prev.map(c => 
      c.id === commentId 
        ? { ...c, status: c.status === 'resolved' ? 'open' : 'resolved' }
        : c
    ));
  }, []);

  const handleToggleCompareMode = useCallback(() => {
    setCompareMode(prev => !prev);
  }, []);

  return (
    <AppLayout
      projects={mockProjects}
      assets={mockAssets}
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
                  {mockProjects.find(p => p.id === selectedProjectId)?.name}
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
            <h2 className="text-xl font-medium text-white mb-2">Select an asset to review</h2>
            <p className="text-white/50">Choose a video or image from the sidebar to start reviewing</p>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default ReviewPage;
