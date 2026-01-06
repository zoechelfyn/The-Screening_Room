import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { 
  MessageSquare, CheckCircle2, Circle, Send, Clock, User, X,
  ChevronDown, ChevronUp, MoreHorizontal, Pencil, Trash2, Flag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatTime, formatDate } from '@/services/api';
import { repliesApi, transformReply } from '@/services/api';

const LOGO_URL = 'https://customer-assets.emergentagent.com/job_0e9ae12c-37f6-45b0-9294-867981caa4b0/artifacts/qfz62m16_zoechelfyn_logo.png';

// Helper to check if author is internal (Mohawk Media)
const isInternalAuthor = (author) => {
  return author.role === 'internal' || author.name === 'Mohawk Media' || author.name === 'You';
};

// Get display name - show "Mohawk Media" for internal users
const getDisplayName = (author) => {
  if (isInternalAuthor(author)) {
    return 'Mohawk Media';
  }
  return author.name;
};

const CommentsSidebar = ({
  asset,
  version,
  versions,
  comments,
  highlightedCommentId,
  onVersionChange,
  onCommentClick,
  onAddComment,
  onResolveComment,
  newCommentAnchor,
  onClearNewComment
}) => {
  const [expandedComments, setExpandedComments] = useState({});
  const [commentReplies, setCommentReplies] = useState({});
  const [newCommentText, setNewCommentText] = useState('');
  const [replyTexts, setReplyTexts] = useState({});
  const [showReplyInput, setShowReplyInput] = useState({});
  const commentRefs = useRef({});
  const newCommentInputRef = useRef(null);

  // Scroll to highlighted comment
  useEffect(() => {
    if (highlightedCommentId && commentRefs.current[highlightedCommentId]) {
      commentRefs.current[highlightedCommentId].scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [highlightedCommentId]);

  // Focus new comment input when anchor is set
  useEffect(() => {
    if (newCommentAnchor && newCommentInputRef.current) {
      newCommentInputRef.current.focus();
    }
  }, [newCommentAnchor]);

  // Load replies when expanding a comment
  const loadReplies = async (commentId) => {
    if (!commentReplies[commentId]) {
      try {
        const data = await repliesApi.list(commentId);
        const transformed = data.map(transformReply);
        setCommentReplies(prev => ({ ...prev, [commentId]: transformed }));
      } catch (err) {
        console.error('Failed to load replies:', err);
      }
    }
  };

  const toggleExpand = async (commentId) => {
    const willExpand = !expandedComments[commentId];
    if (willExpand) {
      await loadReplies(commentId);
    }
    setExpandedComments(prev => ({
      ...prev,
      [commentId]: willExpand
    }));
  };

  const toggleReplyInput = (commentId) => {
    setShowReplyInput(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  const handleSubmitNewComment = () => {
    if (newCommentText.trim() && onAddComment) {
      onAddComment({
        body: newCommentText.trim(),
        anchor: newCommentAnchor
      });
      setNewCommentText('');
      if (onClearNewComment) {
        onClearNewComment();
      }
    }
  };

  const handleSubmitReply = async (commentId) => {
    const text = replyTexts[commentId];
    if (text?.trim()) {
      try {
        const newReply = await repliesApi.create(commentId, {
          body: text.trim(),
          author: { name: 'You', role: 'internal' }
        });
        const transformed = transformReply(newReply);
        setCommentReplies(prev => ({
          ...prev,
          [commentId]: [...(prev[commentId] || []), transformed]
        }));
        setReplyTexts(prev => ({ ...prev, [commentId]: '' }));
        setShowReplyInput(prev => ({ ...prev, [commentId]: false }));
        // Auto-expand to show the new reply
        setExpandedComments(prev => ({ ...prev, [commentId]: true }));
      } catch (err) {
        console.error('Failed to create reply:', err);
      }
    }
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getAnchorLabel = (anchor) => {
    if (anchor.type === 'video_time') {
      return formatTime(anchor.timeMs);
    } else if (anchor.type === 'image_pin') {
      return `Pin (${Math.round(anchor.xNorm * 100)}%, ${Math.round(anchor.yNorm * 100)}%)`;
    }
    return '';
  };

  const sortedComments = [...comments].sort((a, b) => {
    if (asset?.type === 'video' && a.anchor.type === 'video_time' && b.anchor.type === 'video_time') {
      return a.anchor.timeMs - b.anchor.timeMs;
    }
    return new Date(a.createdAt) - new Date(b.createdAt);
  });

  return (
    <aside className="w-96 border-l border-white/10 flex flex-col bg-surface-elevated">
      {/* Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-brand-purple" />
          <span className="font-medium text-content">Comments</span>
          <Badge variant="secondary" className="bg-white/10 text-content-secondary">
            {comments.length}
          </Badge>
        </div>

        {/* Version selector */}
        {versions && versions.length > 0 && (
          <Select value={version?.id} onValueChange={onVersionChange}>
            <SelectTrigger className="w-24 h-8 bg-transparent border-white/20 text-content text-sm">
              <SelectValue placeholder="Version" />
            </SelectTrigger>
            <SelectContent className="bg-surface-overlay border-white/10">
              {versions.map(v => (
                <SelectItem key={v.id} value={v.id}>
                  {v.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* New comment input (when adding) */}
      {newCommentAnchor && (
        <div className="p-4 border-b border-white/10 bg-brand-purple/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-brand-purple-light">
              New comment at {getAnchorLabel(newCommentAnchor)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-content-muted hover:text-content"
              onClick={onClearNewComment}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <Textarea
            ref={newCommentInputRef}
            placeholder="Add your comment..."
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            className="bg-surface-hover border-white/10 text-content placeholder:text-content-muted min-h-[80px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleSubmitNewComment();
              }
            }}
          />
          <div className="flex justify-end mt-2">
            <Button
              size="sm"
              className="bg-brand-orange hover:bg-brand-orange-light text-content-inverse"
              onClick={handleSubmitNewComment}
              disabled={!newCommentText.trim()}
            >
              <Send className="w-4 h-4 mr-2" />
              Post
            </Button>
          </div>
        </div>
      )}

      {/* Comments list */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {sortedComments.length === 0 ? (
            <div className="text-center py-12 text-content-muted">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No comments yet</p>
              <p className="text-sm mt-1">Add a marker or pin to start reviewing</p>
            </div>
          ) : (
            sortedComments.map((comment) => {
              const replies = commentReplies[comment.id] || [];
              const isExpanded = expandedComments[comment.id];
              const isHighlighted = comment.id === highlightedCommentId;

              return (
                <div
                  key={comment.id}
                  ref={el => commentRefs.current[comment.id] = el}
                  className={cn(
                    'rounded-lg border transition-all duration-300',
                    isHighlighted
                      ? 'border-brand-purple/50 bg-brand-purple/10 ring-2 ring-brand-purple/20'
                      : 'border-white/10 bg-surface-hover/50 hover:bg-surface-hover'
                  )}
                >
                  {/* Comment header */}
                  <button
                    className="w-full p-3 text-left"
                    onClick={() => onCommentClick && onCommentClick(comment)}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        {isInternalAuthor(comment.author) ? (
                          <AvatarImage src={LOGO_URL} alt="Mohawk Media" className="object-cover" />
                        ) : null}
                        <AvatarFallback className={cn(
                          'text-xs font-medium',
                          isInternalAuthor(comment.author)
                            ? 'bg-brand-orange/20 text-brand-orange' 
                            : 'bg-surface-hover text-content-muted'
                        )}>
                          {isInternalAuthor(comment.author) ? 'MM' : <User className="w-4 h-4" />}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn(
                            "font-medium text-sm",
                            isInternalAuthor(comment.author) ? "text-brand-orange" : "text-content"
                          )}>
                            {getDisplayName(comment.author)}
                          </span>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              'text-[10px] px-1.5 py-0 h-4',
                              isInternalAuthor(comment.author)
                                ? 'border-brand-orange/30 text-brand-orange'
                                : 'border-content-muted/30 text-content-muted'
                            )}
                          >
                            {isInternalAuthor(comment.author) ? 'internal' : 'client'}
                          </Badge>
                          {comment.status === 'resolved' && (
                            <CheckCircle2 className="w-4 h-4 text-status-success" />
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-content-muted mb-2">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(comment.createdAt)}</span>
                          <span className="text-brand-purple-light font-mono">
                            {getAnchorLabel(comment.anchor)}
                          </span>
                        </div>

                        <p className="text-sm text-content-secondary leading-relaxed">
                          {comment.body}
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Comment actions */}
                  <div className="px-3 pb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-content-muted hover:text-content hover:bg-surface-hover"
                        onClick={() => toggleReplyInput(comment.id)}
                      >
                        Reply
                      </Button>

                      {replies.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-content-muted hover:text-content hover:bg-surface-hover gap-1"
                          onClick={() => toggleExpand(comment.id)}
                        >
                          {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                          {isExpanded ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          'h-7 w-7',
                          comment.status === 'resolved'
                            ? 'text-status-success hover:text-status-success'
                            : 'text-content-muted hover:text-status-success'
                        )}
                        onClick={() => onResolveComment && onResolveComment(comment.id)}
                      >
                        {comment.status === 'resolved' ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-content-muted hover:text-content"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-surface-overlay border-white/10">
                          <DropdownMenuItem className="text-content-secondary hover:text-content focus:text-content focus:bg-surface-hover">
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-content-secondary hover:text-content focus:text-content focus:bg-surface-hover">
                            <Flag className="w-4 h-4 mr-2" />
                            Flag
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-status-error hover:text-status-error focus:text-status-error focus:bg-status-error/10">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Replies */}
                  {isExpanded && replies.length > 0 && (
                    <div className="border-t border-white/10 px-3 py-3 space-y-3 bg-surface/50">
                      {replies.map((reply) => (
                        <div key={reply.id} className="flex gap-3 pl-6">
                          <Avatar className="h-6 w-6 flex-shrink-0">
                            {isInternalAuthor(reply.author) ? (
                              <AvatarImage src={LOGO_URL} alt="Mohawk Media" className="object-cover" />
                            ) : null}
                            <AvatarFallback className={cn(
                              'text-[10px] font-medium',
                              isInternalAuthor(reply.author)
                                ? 'bg-brand-orange/20 text-brand-orange' 
                                : 'bg-surface-hover text-content-muted'
                            )}>
                              {isInternalAuthor(reply.author) ? 'MM' : <User className="w-3 h-3" />}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={cn(
                                "font-medium text-xs",
                                isInternalAuthor(reply.author) ? "text-brand-orange" : "text-content"
                              )}>
                                {getDisplayName(reply.author)}
                              </span>
                              <span className="text-[10px] text-content-muted">
                                {formatDate(reply.createdAt)}
                              </span>
                            </div>
                            <p className="text-xs text-content-secondary">{reply.body}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply input */}
                  {showReplyInput[comment.id] && (
                    <div className="border-t border-white/10 p-3 bg-surface/50">
                      <Textarea
                        placeholder="Write a reply..."
                        value={replyTexts[comment.id] || ''}
                        onChange={(e) => setReplyTexts(prev => ({
                          ...prev,
                          [comment.id]: e.target.value
                        }))}
                        className="bg-surface-hover border-white/10 text-content placeholder:text-content-muted min-h-[60px] resize-none text-sm"
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-content-muted hover:text-content"
                          onClick={() => toggleReplyInput(comment.id)}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          className="bg-brand-orange hover:bg-brand-orange-light text-content-inverse"
                          onClick={() => handleSubmitReply(comment.id)}
                          disabled={!replyTexts[comment.id]?.trim()}
                        >
                          Reply
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </aside>
  );
};

export default CommentsSidebar;
