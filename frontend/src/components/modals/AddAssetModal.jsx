import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Film, Image, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const AddAssetModal = ({ open, onOpenChange, onSubmit, projectName }) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('video');
  const [mediaUrl, setMediaUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        type,
        mediaUrl: mediaUrl.trim() || null
      });
      setTitle('');
      setType('video');
      setMediaUrl('');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create asset:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setType('video');
    setMediaUrl('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-surface-elevated border-white/10 text-content sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-content">
            <Upload className="w-5 h-5 text-brand-purple" />
            Add New Asset
          </DialogTitle>
          <DialogDescription className="text-content-muted">
            Add a video or image asset to {projectName || 'this project'}.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="asset-title" className="text-content-secondary">
              Asset Title <span className="text-brand-orange">*</span>
            </Label>
            <Input
              id="asset-title"
              placeholder="e.g., Hero Video - Final Cut"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-surface-hover border-white/10 text-content placeholder:text-content-muted focus:border-brand-purple focus:ring-brand-purple/20"
              autoFocus
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-content-secondary">Asset Type</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('video')}
                className={cn(
                  'flex items-center justify-center gap-2 p-3 rounded-lg border transition-all',
                  type === 'video'
                    ? 'border-brand-orange bg-brand-orange/10 text-brand-orange'
                    : 'border-white/10 text-content-secondary hover:border-white/20 hover:bg-surface-hover'
                )}
              >
                <Film className="w-5 h-5" />
                <span>Video</span>
              </button>
              <button
                type="button"
                onClick={() => setType('image')}
                className={cn(
                  'flex items-center justify-center gap-2 p-3 rounded-lg border transition-all',
                  type === 'image'
                    ? 'border-brand-purple bg-brand-purple/10 text-brand-purple-light'
                    : 'border-white/10 text-content-secondary hover:border-white/20 hover:bg-surface-hover'
                )}
              >
                <Image className="w-5 h-5" />
                <span>Image</span>
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="media-url" className="text-content-secondary">
              Media URL <span className="text-content-muted">(optional - can add version later)</span>
            </Label>
            <Input
              id="media-url"
              placeholder={type === 'video' ? 'https://example.com/video.mp4' : 'https://example.com/image.jpg'}
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              className="bg-surface-hover border-white/10 text-content placeholder:text-content-muted focus:border-brand-purple focus:ring-brand-purple/20"
            />
            <p className="text-xs text-content-muted">
              You can add or update media versions after creating the asset.
            </p>
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              className="text-content-muted hover:text-content hover:bg-surface-hover"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || isSubmitting}
              className="bg-brand-purple hover:bg-brand-purple-light text-content"
            >
              {isSubmitting ? 'Creating...' : 'Add Asset'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddAssetModal;
