import React, { useState, useEffect } from 'react';
import { Settings, Trash2 } from 'lucide-react';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const ProjectSettingsModal = ({ open, onOpenChange, project, onUpdate, onDelete }) => {
  const [name, setName] = useState('');
  const [clientName, setClientName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (project) {
      setName(project.name || '');
      setClientName(project.clientName || '');
    }
  }, [project]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onUpdate(project.id, {
        name: name.trim(),
        client_name: clientName.trim() || null
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update project:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await onDelete(project.id);
      setShowDeleteConfirm(false);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-surface-elevated border-white/10 text-content sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-content">
            <Settings className="w-5 h-5 text-brand-orange" />
            Project Settings
          </DialogTitle>
          <DialogDescription className="text-content-muted">
            Update project details or delete this project.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-project-name" className="text-content-secondary">
              Project Name <span className="text-brand-orange">*</span>
            </Label>
            <Input
              id="edit-project-name"
              placeholder="e.g., Brand X - Product Launch"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-surface-hover border-white/10 text-content placeholder:text-content-muted focus:border-brand-orange focus:ring-brand-orange/20"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit-client-name" className="text-content-secondary">
              Client Name <span className="text-content-muted">(optional)</span>
            </Label>
            <Input
              id="edit-client-name"
              placeholder="e.g., Brand X"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="bg-surface-hover border-white/10 text-content placeholder:text-content-muted focus:border-brand-orange focus:ring-brand-orange/20"
            />
          </div>

          <div className="pt-4 border-t border-white/10">
            <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full justify-start text-status-error hover:text-status-error hover:bg-status-error/10"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Project
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-surface-elevated border-white/10">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-content">Delete Project?</AlertDialogTitle>
                  <AlertDialogDescription className="text-content-muted">
                    This will permanently delete "{project.name}" and all its assets, versions, and comments. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-surface-hover border-white/10 text-content hover:bg-surface-hover hover:text-content">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-status-error hover:bg-status-error/90 text-content"
                  >
                    Delete Project
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectSettingsModal;
