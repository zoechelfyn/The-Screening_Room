import React, { useRef, useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { 
  ZoomIn, ZoomOut, RotateCcw, MessageSquarePlus, Move,
  Columns2, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ImageViewer = ({
  version,
  versions,
  comments,
  highlightedCommentId,
  compareMode,
  compareVersionId,
  onCompareVersionChange,
  onToggleCompareMode,
  onAddComment,
  onPinClick
}) => {
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isAddingPin, setIsAddingPin] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  const imageUrl = version?.media?.url;
  const compareVersion = versions?.find(v => v.id === compareVersionId);
  const compareImageUrl = compareVersion?.media?.url;

  // Reset view when version changes
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setImageLoaded(false);
  }, [version?.id]);

  const handleWheel = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(prev => Math.max(0.5, Math.min(4, prev + delta)));
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  const handleMouseDown = (e) => {
    if (isAddingPin) return;
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && !isAddingPin) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleImageClick = (e) => {
    if (isAddingPin && containerRef.current && imageRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const imageRect = imageRef.current.getBoundingClientRect();
      
      // Calculate click position relative to image
      const clickX = e.clientX - imageRect.left;
      const clickY = e.clientY - imageRect.top;
      
      // Normalize to 0-1 range
      const xNorm = clickX / imageRect.width;
      const yNorm = clickY / imageRect.height;
      
      if (xNorm >= 0 && xNorm <= 1 && yNorm >= 0 && yNorm <= 1) {
        if (onAddComment) {
          onAddComment({ xNorm, yNorm });
        }
        setIsAddingPin(false);
      }
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(4, prev + 0.25));
  const handleZoomOut = () => setZoom(prev => Math.max(0.5, prev - 0.25));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handlePinClick = (comment, e) => {
    e.stopPropagation();
    if (onPinClick) {
      onPinClick(comment.id);
    }
  };

  const handleImageLoad = (e) => {
    setImageLoaded(true);
    setImageDimensions({
      width: e.target.naturalWidth,
      height: e.target.naturalHeight
    });
  };

  if (!version) {
    return (
      <div className="flex-1 flex items-center justify-center bg-surface text-content-muted">
        <p>Select a version to review</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-surface">
      {/* Toolbar */}
      <div className="h-12 border-b border-white/10 flex items-center justify-between px-4 bg-surface-elevated">
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
                  onClick={handleZoomOut}
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom Out</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <span className="text-sm text-white/60 w-14 text-center">
            {Math.round(zoom * 100)}%
          </span>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
                  onClick={handleZoomIn}
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom In</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
                  onClick={handleReset}
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reset View</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="w-px h-6 bg-white/10 mx-2" />

          {/* Add pin button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isAddingPin ? 'secondary' : 'ghost'}
                  size="sm"
                  className={cn(
                    'gap-2',
                    isAddingPin 
                      ? 'bg-brand-purple/20 text-brand-purple-light hover:bg-brand-purple/30' 
                      : 'text-content-secondary hover:text-content hover:bg-surface-hover'
                  )}
                  onClick={() => setIsAddingPin(!isAddingPin)}
                >
                  <MessageSquarePlus className="w-4 h-4" />
                  <span className="text-sm">Add Pin</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Click on image to add a comment pin</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex items-center gap-2">
          {/* Compare mode toggle */}
          {versions && versions.length > 1 && (
            <>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={compareMode ? 'secondary' : 'ghost'}
                      size="sm"
                      className={cn(
                        'gap-2',
                        compareMode 
                          ? 'bg-brand-orange/20 text-brand-orange-light hover:bg-brand-orange/30' 
                          : 'text-content-secondary hover:text-content hover:bg-surface-hover'
                      )}
                      onClick={onToggleCompareMode}
                    >
                      <Columns2 className="w-4 h-4" />
                      <span className="text-sm">Compare</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Toggle version comparison</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {compareMode && (
                <Select value={compareVersionId} onValueChange={onCompareVersionChange}>
                  <SelectTrigger className="w-24 h-8 bg-transparent border-white/20 text-content text-sm">
                    <SelectValue placeholder="vs" />
                  </SelectTrigger>
                  <SelectContent className="bg-surface-overlay border-white/10">
                    {versions
                      .filter(v => v.id !== version.id)
                      .map(v => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            </>
          )}
        </div>
      </div>

      {/* Image Container */}
      <div
        ref={containerRef}
        className={cn(
          'flex-1 overflow-hidden relative',
          isDragging ? 'cursor-grabbing' : isAddingPin ? 'cursor-crosshair' : 'cursor-grab'
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleImageClick}
      >
        {/* Image(s) */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out'
          }}
        >
          {compareMode && compareImageUrl ? (
            // Compare mode view
            <div className="relative" style={{ width: imageDimensions.width, height: imageDimensions.height }}>
              {/* Base image (Version B - right side) */}
              <img
                src={compareImageUrl}
                alt="Compare version"
                className="absolute inset-0 w-full h-full object-contain select-none"
                draggable={false}
              />
              
              {/* Clipped image (Version A - left side) */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${sliderPosition}%` }}
              >
                <img
                  ref={imageRef}
                  src={imageUrl}
                  alt="Current version"
                  className="w-full h-full object-contain select-none"
                  style={{ width: `${100 / (sliderPosition / 100)}%`, maxWidth: 'none' }}
                  draggable={false}
                  onLoad={handleImageLoad}
                />
              </div>
              
              {/* Slider line */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-white/80 cursor-ew-resize z-20"
                style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  const handleSliderDrag = (moveEvent) => {
                    if (containerRef.current) {
                      const rect = containerRef.current.getBoundingClientRect();
                      const newPos = ((moveEvent.clientX - rect.left) / rect.width) * 100;
                      setSliderPosition(Math.max(0, Math.min(100, newPos)));
                    }
                  };
                  const handleSliderUp = () => {
                    document.removeEventListener('mousemove', handleSliderDrag);
                    document.removeEventListener('mouseup', handleSliderUp);
                  };
                  document.addEventListener('mousemove', handleSliderDrag);
                  document.addEventListener('mouseup', handleSliderUp);
                }}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center">
                  <Move className="w-4 h-4 text-gray-700 rotate-90" />
                </div>
              </div>

              {/* Version labels */}
              <div className="absolute top-4 left-4 px-2 py-1 bg-black/60 rounded text-white text-xs z-10">
                {version.label}
              </div>
              <div className="absolute top-4 right-4 px-2 py-1 bg-black/60 rounded text-white text-xs z-10">
                {compareVersion?.label}
              </div>
            </div>
          ) : (
            // Single image view
            <div className="relative">
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Review asset"
                className="max-w-full max-h-full object-contain select-none"
                draggable={false}
                onLoad={handleImageLoad}
              />

              {/* Comment pins */}
              {imageLoaded && comments.map((comment) => {
                if (comment.anchor.type !== 'image_pin') return null;
                const isHighlighted = comment.id === highlightedCommentId;
                
                return (
                  <TooltipProvider key={comment.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          className={cn(
                            'absolute w-6 h-6 -translate-x-1/2 -translate-y-full',
                            'transition-all duration-200 z-10'
                          )}
                          style={{
                            left: `${comment.anchor.xNorm * 100}%`,
                            top: `${comment.anchor.yNorm * 100}%`
                          }}
                          onClick={(e) => handlePinClick(comment, e)}
                        >
                          <svg
                            viewBox="0 0 24 32"
                            className={cn(
                              'w-full h-full drop-shadow-lg transition-transform duration-200',
                              isHighlighted ? 'scale-125' : 'hover:scale-110'
                            )}
                          >
                            <path
                              d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20c0-6.6-5.4-12-12-12z"
                              fill={isHighlighted ? '#7B4BA0' : comment.status === 'resolved' ? '#34d399' : '#F5A623'}
                            />
                            <circle cx="12" cy="12" r="4" fill="white" />
                          </svg>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs bg-surface-overlay border-white/10">
                        <p className="text-sm line-clamp-2">{comment.body}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          )}
        </div>

        {/* Add pin instruction overlay */}
        {isAddingPin && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-violet-500/90 rounded-full text-white text-sm">
            Click anywhere on the image to add a comment pin
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageViewer;
