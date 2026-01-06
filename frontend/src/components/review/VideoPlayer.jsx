import React, { useRef, useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward,
  MessageSquarePlus, ChevronLeft, ChevronRight
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
import { formatTime } from '@/services/api';

const VideoPlayer = ({ 
  version,
  comments,
  highlightedCommentId,
  onTimeUpdate,
  onAddComment,
  onMarkerClick,
  onSeekToTime
}) => {
  const videoRef = useRef(null);
  const timelineRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState('1');
  const [hoveredMarker, setHoveredMarker] = useState(null);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef(null);

  const videoUrl = version?.media?.url;
  const videoDuration = duration || (version?.media?.durationMs / 1000) || 0;

  // Seek to time from external trigger
  useEffect(() => {
    if (onSeekToTime && videoRef.current) {
      // This will be triggered by parent
    }
  }, [onSeekToTime]);

  const seekToTime = useCallback((timeMs) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timeMs / 1000;
      setCurrentTime(timeMs / 1000);
    }
  }, []);

  // Expose seekToTime to parent
  useEffect(() => {
    if (onSeekToTime) {
      onSeekToTime.current = seekToTime;
    }
  }, [seekToTime, onSeekToTime]);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (onTimeUpdate) {
        onTimeUpdate(videoRef.current.currentTime * 1000);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (value) => {
    const time = (value[0] / 100) * videoDuration;
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleTimelineClick = (e) => {
    if (timelineRef.current && videoRef.current) {
      const rect = timelineRef.current.getBoundingClientRect();
      const clickPosition = (e.clientX - rect.left) / rect.width;
      const newTime = clickPosition * videoDuration;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (value) => {
    const newVolume = value[0] / 100;
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      setIsMuted(newMuted);
      videoRef.current.muted = newMuted;
    }
  };

  const handlePlaybackRateChange = (value) => {
    setPlaybackRate(value);
    if (videoRef.current) {
      videoRef.current.playbackRate = parseFloat(value);
    }
  };

  const skipTime = (seconds) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(videoDuration, currentTime + seconds));
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const handleAddCommentAtTime = () => {
    if (onAddComment) {
      onAddComment(currentTime * 1000);
    }
  };

  const handleMarkerClick = (comment) => {
    if (comment.anchor.type === 'video_time') {
      seekToTime(comment.anchor.timeMs);
      if (onMarkerClick) {
        onMarkerClick(comment.id);
      }
    }
  };

  // Auto-hide controls
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      if (isPlaying) {
        controlsTimeoutRef.current = setTimeout(() => {
          setShowControls(false);
        }, 3000);
      }
    };

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying]);

  // Get highlighted marker
  const highlightedComment = comments.find(c => c.id === highlightedCommentId);

  if (!version) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black/50 text-white/50">
        <p>Select a version to review</p>
      </div>
    );
  }

  return (
    <div 
      className="flex-1 flex flex-col bg-black relative group"
      onMouseMove={() => setShowControls(true)}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Video Container */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          src={videoUrl}
          className="max-h-full max-w-full object-contain"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          onClick={handlePlayPause}
        />

        {/* Play/Pause Overlay */}
        <div 
          className={cn(
            'absolute inset-0 flex items-center justify-center transition-opacity duration-300',
            showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
          )}
        >
          <button
            onClick={handlePlayPause}
            className={cn(
              'w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center',
              'hover:bg-white/20 transition-all duration-300 hover:scale-110',
              isPlaying && 'opacity-0 hover:opacity-100'
            )}
          >
            {isPlaying ? (
              <Pause className="w-10 h-10 text-white" />
            ) : (
              <Play className="w-10 h-10 text-white ml-1" />
            )}
          </button>
        </div>
      </div>

      {/* Controls Bar */}
      <div 
        className={cn(
          'absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent',
          'transition-opacity duration-300 pt-16 pb-4 px-4',
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
        )}
      >
        {/* Timeline with markers */}
        <div 
          ref={timelineRef}
          className="relative h-10 mb-3 cursor-pointer group/timeline"
          onClick={handleTimelineClick}
        >
          {/* Progress track */}
          <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-brand-orange rounded-full transition-all duration-100"
              style={{ width: `${(currentTime / videoDuration) * 100}%` }}
            />
          </div>

          {/* Markers */}
          {comments.map((comment) => {
            if (comment.anchor.type !== 'video_time') return null;
            const position = (comment.anchor.timeMs / 1000 / videoDuration) * 100;
            const isHighlighted = comment.id === highlightedCommentId;
            
            return (
              <TooltipProvider key={comment.id}>
                <Tooltip open={hoveredMarker === comment.id}>
                  <TooltipTrigger asChild>
                    <button
                      className={cn(
                        'absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full',
                        'transition-all duration-200 z-10',
                        isHighlighted 
                          ? 'bg-violet-400 scale-150 ring-4 ring-violet-400/30' 
                          : 'bg-amber-400 hover:scale-125',
                        comment.status === 'resolved' && !isHighlighted && 'bg-emerald-400'
                      )}
                      style={{ left: `${position}%` }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkerClick(comment);
                      }}
                      onMouseEnter={() => setHoveredMarker(comment.id)}
                      onMouseLeave={() => setHoveredMarker(null)}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs bg-[#1a1a1c] border-white/10">
                    <p className="text-xs text-white/60 mb-1">{formatTime(comment.anchor.timeMs)}</p>
                    <p className="text-sm line-clamp-2">{comment.body}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}

          {/* Hover time indicator */}
          <div className="absolute top-0 left-0 right-0 h-full opacity-0 group-hover/timeline:opacity-100 transition-opacity">
            {/* Time tooltip would appear here */}
          </div>
        </div>

        {/* Control buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Skip back */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-white/80 hover:text-white hover:bg-white/10"
              onClick={() => skipTime(-10)}
            >
              <SkipBack className="w-4 h-4" />
            </Button>

            {/* Play/Pause */}
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-white hover:bg-white/10"
              onClick={handlePlayPause}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </Button>

            {/* Skip forward */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-white/80 hover:text-white hover:bg-white/10"
              onClick={() => skipTime(10)}
            >
              <SkipForward className="w-4 h-4" />
            </Button>

            {/* Volume */}
            <div className="flex items-center gap-2 ml-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-white/80 hover:text-white hover:bg-white/10"
                onClick={toggleMute}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </Button>
              <div className="w-20">
                <Slider
                  value={[isMuted ? 0 : volume * 100]}
                  onValueChange={handleVolumeChange}
                  max={100}
                  step={1}
                  className="[&_[role=slider]]:h-3 [&_[role=slider]]:w-3"
                />
              </div>
            </div>

            {/* Time display */}
            <span className="text-sm text-white/80 ml-4 font-mono">
              {formatTime(currentTime * 1000)} / {formatTime(videoDuration * 1000)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Add comment */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white/80 hover:text-white hover:bg-white/10 gap-2"
                    onClick={handleAddCommentAtTime}
                  >
                    <MessageSquarePlus className="w-4 h-4" />
                    <span className="text-sm">Add Comment</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add comment at current time</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Playback speed */}
            <Select value={playbackRate} onValueChange={handlePlaybackRateChange}>
              <SelectTrigger className="w-20 h-8 bg-transparent border-white/20 text-white text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1c] border-white/10">
                <SelectItem value="0.5">0.5x</SelectItem>
                <SelectItem value="0.75">0.75x</SelectItem>
                <SelectItem value="1">1x</SelectItem>
                <SelectItem value="1.25">1.25x</SelectItem>
                <SelectItem value="1.5">1.5x</SelectItem>
                <SelectItem value="2">2x</SelectItem>
              </SelectContent>
            </Select>

            {/* Fullscreen */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-white/80 hover:text-white hover:bg-white/10"
              onClick={handleFullscreen}
            >
              <Maximize className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
