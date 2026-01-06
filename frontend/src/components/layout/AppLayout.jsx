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
    <div className="h-screen flex bg-[#0a0a0b] text-white overflow-hidden">
      {/* Left Sidebar - Projects & Assets */}
      <aside className="w-64 border-r border-white/10 flex flex-col bg-[#111113]">
        {/* Logo */}
        <div className="h-14 px-4 flex items-center border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Film className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-lg">ReviewStudio</span>
          </div>
        </div>

        {/* Projects List */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-3 py-3 flex items-center justify-between">
            <span className="text-xs font-medium text-white/50 uppercase tracking-wider">Projects</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-white/50 hover:text-white hover:bg-white/10">
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
                      ? 'bg-white/10 text-white' 
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <FolderOpen className={cn(
                    'w-4 h-4 flex-shrink-0 transition-colors',
                    selectedProjectId === project.id ? 'text-violet-400' : 'text-white/40 group-hover:text-white/60'
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
                <span className="text-xs font-medium text-white/50 uppercase tracking-wider">Assets</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-white/50 hover:text-white hover:bg-white/10">
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
                          ? 'bg-violet-500/20 text-white border border-violet-500/30' 
                          : 'text-white/70 hover:bg-white/5 hover:text-white'
                      )}
                    >
                      {asset.type === 'video' ? (
                        <Film className={cn(
                          'w-4 h-4 flex-shrink-0',
                          selectedAssetId === asset.id ? 'text-violet-400' : 'text-blue-400/70'
                        )} />
                      ) : (
                        <Image className={cn(
                          'w-4 h-4 flex-shrink-0',
                          selectedAssetId === asset.id ? 'text-violet-400' : 'text-emerald-400/70'
                        )} />
                      )}
                      <span className="truncate text-sm">{asset.title}</span>
                      {selectedAssetId === asset.id && (
                        <ChevronRight className="w-4 h-4 ml-auto text-violet-400" />
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
          <button className="w-full px-3 py-2 rounded-lg text-left text-white/60 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2 text-sm">
            <Settings className="w-4 h-4" />
            Settings
          </button>
          <button className="w-full px-3 py-2 rounded-lg text-left text-white/60 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2 text-sm">
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
