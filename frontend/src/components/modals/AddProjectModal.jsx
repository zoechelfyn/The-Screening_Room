import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { X, FolderPlus } from 'lucide-react';
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

const AddProjectModal = ({ open, onOpenChange, onSubmit }) => {
  const [name, setName] = useState('');
  const [clientName, setClientName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        client_name: clientName.trim() || null
      });
      setName('');
      setClientName('');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setName('');
    setClientName('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-surface-elevated border-white/10 text-content sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-content">
            <FolderPlus className="w-5 h-5 text-brand-orange" />
            Create New Project
          </DialogTitle>
          <DialogDescription className="text-content-muted">
            Add a new project to organize your review assets.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name" className="text-content-secondary">
              Project Name <span className="text-brand-orange">*</span>
            </Label>
            <Input
              id="project-name"
              placeholder="e.g., Brand X - Product Launch"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-surface-hover border-white/10 text-content placeholder:text-content-muted focus:border-brand-orange focus:ring-brand-orange/20"
              autoFocus
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="client-name" className="text-content-secondary">
              Client Name <span className="text-content-muted">(optional)</span>
            </Label>
            <Input
              id="client-name"
              placeholder="e.g., Brand X"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="bg-surface-hover border-white/10 text-content placeholder:text-content-muted focus:border-brand-orange focus:ring-brand-orange/20"
            />
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
              disabled={!name.trim() || isSubmitting}
              className="bg-brand-orange hover:bg-brand-orange-light text-content-inverse"
            >
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddProjectModal;
