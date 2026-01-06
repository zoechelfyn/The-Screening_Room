import React from 'react';
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

const LOGO_URL = 'https://customer-assets.emergentagent.com/job_0e9ae12c-37f6-45b0-9294-867981caa4b0/artifacts/qfz62m16_zoechelfyn_logo.png';

const AppLayout = ({ 
  projects, 
  assets, 
  selectedProjectId, 
  selectedAssetId, 
  onProjectSelect, 
  onAssetSelect,
  children 
}) => {
  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const projectAssets = assets.filter(a => a.projectId === selectedProjectId);

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
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-content-muted hover:text-content hover:bg-surface-hover">
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
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-content-muted hover:text-content hover:bg-surface-hover">
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
          <button className="w-full px-3 py-2 rounded-lg text-left text-content-secondary hover:bg-surface-hover hover:text-content transition-colors flex items-center gap-2 text-sm">
            <Settings className="w-4 h-4" />
            Settings
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
    </div>
  );
};

export default AppLayout;
