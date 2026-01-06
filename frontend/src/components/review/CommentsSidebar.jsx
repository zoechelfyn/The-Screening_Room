import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { 
  MessageSquare, CheckCircle2, Circle, Send, Clock, User, X,
  ChevronDown, ChevronUp, MoreHorizontal, Pencil, Trash2, Flag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
    <aside className="w-96 border-l border-white/10 flex flex-col bg-[#111113]">
      {/* Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-violet-400" />
          <span className="font-medium">Comments</span>
          <Badge variant="secondary" className="bg-white/10 text-white/80">
            {comments.length}
          </Badge>
        </div>

        {/* Version selector */}
        {versions && versions.length > 0 && (
          <Select value={version?.id} onValueChange={onVersionChange}>
            <SelectTrigger className="w-24 h-8 bg-transparent border-white/20 text-white text-sm">
              <SelectValue placeholder="Version" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1c] border-white/10">
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
        <div className="p-4 border-b border-white/10 bg-violet-500/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-violet-300">
              New comment at {getAnchorLabel(newCommentAnchor)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-white/50 hover:text-white"
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
            className="bg-white/5 border-white/10 text-white placeholder:text-white/40 min-h-[80px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleSubmitNewComment();
              }
            }}
          />
          <div className="flex justify-end mt-2">
            <Button
              size="sm"
              className="bg-violet-500 hover:bg-violet-600 text-white"
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
            <div className="text-center py-12 text-white/40">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No comments yet</p>
              <p className="text-sm mt-1">Add a marker or pin to start reviewing</p>
            </div>
          ) : (
            sortedComments.map((comment) => {
              const replies = getRepliesByCommentId(comment.id);
              const isExpanded = expandedComments[comment.id];
              const isHighlighted = comment.id === highlightedCommentId;

              return (
                <div
                  key={comment.id}
                  ref={el => commentRefs.current[comment.id] = el}
                  className={cn(
                    'rounded-lg border transition-all duration-300',
                    isHighlighted
                      ? 'border-violet-500/50 bg-violet-500/10 ring-2 ring-violet-500/20'
                      : 'border-white/10 bg-white/5 hover:bg-white/[0.07]'
                  )}
                >
                  {/* Comment header */}
                  <button
                    className="w-full p-3 text-left"
                    onClick={() => onCommentClick && onCommentClick(comment)}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className={cn(
                          'text-xs font-medium',
                          comment.author.role === 'client' 
                            ? 'bg-amber-500/20 text-amber-300' 
                            : 'bg-blue-500/20 text-blue-300'
                        )}>
                          {getInitials(comment.author.name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-white">
                            {comment.author.name}
                          </span>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              'text-[10px] px-1.5 py-0 h-4',
                              comment.author.role === 'client'
                                ? 'border-amber-500/30 text-amber-400'
                                : 'border-blue-500/30 text-blue-400'
                            )}
                          >
                            {comment.author.role}
                          </Badge>
                          {comment.status === 'resolved' && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-white/50 mb-2">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(comment.createdAt)}</span>
                          <span className="text-violet-400 font-mono">
                            {getAnchorLabel(comment.anchor)}
                          </span>
                        </div>

                        <p className="text-sm text-white/80 leading-relaxed">
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
                        className="h-7 text-xs text-white/50 hover:text-white hover:bg-white/10"
                        onClick={() => toggleReplyInput(comment.id)}
                      >
                        Reply
                      </Button>

                      {replies.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-white/50 hover:text-white hover:bg-white/10 gap-1"
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
                            ? 'text-emerald-400 hover:text-emerald-300'
                            : 'text-white/50 hover:text-emerald-400'
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
                            className="h-7 w-7 text-white/50 hover:text-white"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-[#1a1a1c] border-white/10">
                          <DropdownMenuItem className="text-white/80 hover:text-white focus:text-white focus:bg-white/10">
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-white/80 hover:text-white focus:text-white focus:bg-white/10">
                            <Flag className="w-4 h-4 mr-2" />
                            Flag
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-400 hover:text-red-300 focus:text-red-300 focus:bg-red-500/10">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Replies */}
                  {isExpanded && replies.length > 0 && (
                    <div className="border-t border-white/10 px-3 py-3 space-y-3 bg-black/20">
                      {replies.map((reply) => (
                        <div key={reply.id} className="flex gap-3 pl-6">
                          <Avatar className="h-6 w-6 flex-shrink-0">
                            <AvatarFallback className={cn(
                              'text-[10px] font-medium',
                              reply.author.role === 'client' 
                                ? 'bg-amber-500/20 text-amber-300' 
                                : 'bg-blue-500/20 text-blue-300'
                            )}>
                              {getInitials(reply.author.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-xs text-white">
                                {reply.author.name}
                              </span>
                              <span className="text-[10px] text-white/40">
                                {formatDate(reply.createdAt)}
                              </span>
                            </div>
                            <p className="text-xs text-white/70">{reply.body}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply input */}
                  {showReplyInput[comment.id] && (
                    <div className="border-t border-white/10 p-3 bg-black/20">
                      <Textarea
                        placeholder="Write a reply..."
                        value={replyTexts[comment.id] || ''}
                        onChange={(e) => setReplyTexts(prev => ({
                          ...prev,
                          [comment.id]: e.target.value
                        }))}
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/40 min-h-[60px] resize-none text-sm"
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-white/50 hover:text-white"
                          onClick={() => toggleReplyInput(comment.id)}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          className="bg-violet-500 hover:bg-violet-600 text-white"
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
