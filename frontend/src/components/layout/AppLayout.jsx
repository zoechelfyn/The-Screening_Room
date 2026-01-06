import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { FolderOpen, Film, Image, ChevronRight, Plus, Settings, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AddProjectModal, AddAssetModal, ProjectSettingsModal } from '@/components/modals';

const LOGO_URL = 'https://customer-assets.emergentagent.com/job_0e9ae12c-37f6-45b0-9294-867981caa4b0/artifacts/qfz62m16_zoechelfyn_logo.png';

const AppLayout = ({ 
  projects, 
  assets, 
  selectedProjectId, 
  selectedAssetId, 
  onProjectSelect, 
  onAssetSelect,
  onProjectCreate,
  onProjectUpdate,
  onProjectDelete,
  onAssetCreate,
  children 
}) => {
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showAddAssetModal, setShowAddAssetModal] = useState(false);
  const [showProjectSettingsModal, setShowProjectSettingsModal] = useState(false);

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const projectAssets = assets.filter(a => a.projectId === selectedProjectId);

  const handleCreateProject = async (data) => {
    if (onProjectCreate) {
      const newProject = await onProjectCreate(data);
      return newProject;
    }
  };

  const handleUpdateProject = async (projectId, data) => {
    if (onProjectUpdate) {
      await onProjectUpdate(projectId, data);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (onProjectDelete) {
      await onProjectDelete(projectId);
    }
  };

  const handleCreateAsset = async (data) => {
    if (onAssetCreate && selectedProjectId) {
      const newAsset = await onAssetCreate(selectedProjectId, data);
      return newAsset;
    }
  };

  return (
    <div className="h-screen flex bg-surface text-content overflow-hidden">
      {/* Left Sidebar - Projects & Assets */}
      <aside className="w-64 border-r border-white/10 flex flex-col bg-surface-elevated">
        {/* Logo */}
        <div className="h-14 px-4 flex items-center border-b border-white/10">
          <div className="flex items-center gap-3">
            <img 
              src={LOGO_URL} 
              alt="Zoechelfyn" 
              className="h-9 w-auto"
            />
            <span className="font-semibold text-base text-content">The Screening Room</span>
          </div>
        </div>

        {/* Projects List */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-3 py-3 flex items-center justify-between">
            <span className="text-xs font-medium text-content-muted uppercase tracking-wider">Projects</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 text-content-muted hover:text-content hover:bg-surface-hover"
                    onClick={() => setShowAddProjectModal(true)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>New Project</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <ScrollArea className="flex-1 px-2">
            <div className="space-y-1">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => onProjectSelect(project.id)}
                  className={cn(
                    'w-full px-3 py-2 rounded-lg text-left transition-all duration-200',
                    'flex items-center gap-2 group',
                    selectedProjectId === project.id 
                      ? 'bg-brand-orange/15 text-content border border-brand-orange/30' 
                      : 'text-content-secondary hover:bg-surface-hover hover:text-content'
                  )}
                >
                  <FolderOpen className={cn(
                    'w-4 h-4 flex-shrink-0 transition-colors',
                    selectedProjectId === project.id ? 'text-brand-orange' : 'text-content-muted group-hover:text-content-secondary'
                  )} />
                  <span className="truncate text-sm">{project.name}</span>
                </button>
              ))}
            </div>
          </ScrollArea>

          {/* Assets for selected project */}
          {selectedProject && (
            <>
              <div className="px-3 py-3 flex items-center justify-between border-t border-white/10">
                <span className="text-xs font-medium text-content-muted uppercase tracking-wider">Assets</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-content-muted hover:text-content hover:bg-surface-hover"
                        onClick={() => setShowAddAssetModal(true)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>Upload Asset</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <ScrollArea className="flex-1 px-2 pb-2 max-h-64">
                <div className="space-y-1">
                  {projectAssets.map((asset) => (
                    <button
                      key={asset.id}
                      onClick={() => onAssetSelect(asset.id)}
                      className={cn(
                        'w-full px-3 py-2 rounded-lg text-left transition-all duration-200',
                        'flex items-center gap-2 group',
                        selectedAssetId === asset.id 
                          ? 'bg-brand-purple/20 text-content border border-brand-purple/30' 
                          : 'text-content-secondary hover:bg-surface-hover hover:text-content'
                      )}
                    >
                      {asset.type === 'video' ? (
                        <Film className={cn(
                          'w-4 h-4 flex-shrink-0',
                          selectedAssetId === asset.id ? 'text-brand-orange' : 'text-brand-orange/70'
                        )} />
                      ) : (
                        <Image className={cn(
                          'w-4 h-4 flex-shrink-0',
                          selectedAssetId === asset.id ? 'text-brand-purple' : 'text-brand-purple/70'
                        )} />
                      )}
                      <span className="truncate text-sm">{asset.title}</span>
                      {selectedAssetId === asset.id && (
                        <ChevronRight className="w-4 h-4 ml-auto text-brand-purple" />
                      )}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}
        </div>

        {/* Bottom actions */}
        <div className="border-t border-white/10 p-3 space-y-1">
          <button 
            onClick={() => selectedProject && setShowProjectSettingsModal(true)}
            disabled={!selectedProject}
            className={cn(
              "w-full px-3 py-2 rounded-lg text-left transition-colors flex items-center gap-2 text-sm",
              selectedProject 
                ? "text-content-secondary hover:bg-surface-hover hover:text-content"
                : "text-content-muted cursor-not-allowed"
            )}
          >
            <Settings className="w-4 h-4" />
            Project Settings
          </button>
          <button className="w-full px-3 py-2 rounded-lg text-left text-content-secondary hover:bg-surface-hover hover:text-content transition-colors flex items-center gap-2 text-sm">
            <HelpCircle className="w-4 h-4" />
            Help & Support
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>

      {/* Modals */}
      <AddProjectModal
        open={showAddProjectModal}
        onOpenChange={setShowAddProjectModal}
        onSubmit={handleCreateProject}
      />

      <AddAssetModal
        open={showAddAssetModal}
        onOpenChange={setShowAddAssetModal}
        onSubmit={handleCreateAsset}
        projectName={selectedProject?.name}
      />

      <ProjectSettingsModal
        open={showProjectSettingsModal}
        onOpenChange={setShowProjectSettingsModal}
        project={selectedProject}
        onUpdate={handleUpdateProject}
        onDelete={handleDeleteProject}
      />
    </div>
  );
};

export default AppLayout;
