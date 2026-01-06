import React from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Film, Image, MessageSquare, Layers, ArrowRight, Play, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

const LOGO_URL = 'https://customer-assets.emergentagent.com/job_0e9ae12c-37f6-45b0-9294-867981caa4b0/artifacts/qfz62m16_zoechelfyn_logo.png';

const HomePage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Film,
      title: 'Video Review',
      description: 'Frame-accurate comments with timeline markers. Click to seek, hover to preview.',
      color: 'text-brand-orange',
      bgColor: 'bg-brand-orange/10'
    },
    {
      icon: Image,
      title: 'Image Review',
      description: 'Zoom, pan, and pin comments directly on images. Compare versions with a slider.',
      color: 'text-brand-purple',
      bgColor: 'bg-brand-purple/10'
    },
    {
      icon: Layers,
      title: 'Version Control',
      description: 'Track changes across versions. Comments stay tied to their specific version.',
      color: 'text-brand-orange',
      bgColor: 'bg-brand-orange/10'
    },
    {
      icon: MessageSquare,
      title: 'Threaded Comments',
      description: 'Keep conversations organized with threaded replies and status tracking.',
      color: 'text-brand-purple',
      bgColor: 'bg-brand-purple/10'
    }
  ];

  const stats = [
    { value: '50%', label: 'Faster Reviews' },
    { value: '100%', label: 'Accurate Feedback' },
    { value: '0', label: 'Missed Comments' }
  ];

  return (
    <div className="min-h-screen bg-surface text-content">
      {/* Navigation */}
      <nav className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src={LOGO_URL} 
              alt="Zoechelfyn" 
              className="h-10 w-auto"
            />
            <span className="font-semibold text-lg text-content">The Screening Room</span>
          </div>
          <Button 
            className="bg-brand-orange hover:bg-brand-orange-light text-content-inverse"
            onClick={() => navigate('/review')}
          >
            Open Studio
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient with brand colors */}
        <div className="absolute inset-0 bg-gradient-to-b from-brand-purple/5 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-brand-orange/5 rounded-full blur-3xl" />
        <div className="absolute top-20 right-1/4 w-[500px] h-[400px] bg-brand-purple/10 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-6 pt-24 pb-32">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-purple/10 border border-brand-purple/20 text-brand-purple-light text-sm mb-8">
              <Zap className="w-4 h-4" />
              Client-Friendly Review Platform
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6 text-content">
              Review video & images
              <span className="block mt-2 bg-gradient-to-r from-brand-orange via-brand-orange-light to-brand-purple bg-clip-text text-transparent">
                with precision
              </span>
            </h1>
            
            <p className="text-xl text-content-secondary mb-10 leading-relaxed">
              Timestamped comments, version control, and seamless collaboration.
              Get feedback exactly where it matters.
            </p>
            
            <div className="flex items-center justify-center gap-4">
              <Button 
                size="lg"
                className="bg-brand-orange hover:bg-brand-orange-light text-content-inverse h-12 px-8 text-base font-medium"
                onClick={() => navigate('/review')}
              >
                <Play className="w-5 h-5 mr-2" />
                Start Reviewing
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="border-white/20 text-content hover:bg-surface-hover h-12 px-8 text-base"
              >
                Watch Demo
              </Button>
            </div>
          </div>

          {/* Preview mockup */}
          <div className="mt-20 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent z-10" />
            <div className="rounded-xl overflow-hidden border border-white/10 shadow-2xl shadow-brand-purple/10">
              <div className="bg-surface-elevated h-8 flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="bg-surface aspect-[16/9] flex items-center justify-center relative overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1536240478700-b869070f9279?w=1600&q=80" 
                  alt="Video editing preview"
                  className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-white/20 transition-colors">
                    <Play className="w-8 h-8 text-content ml-1" />
                  </div>
                </div>
                {/* Mock timeline with brand colors */}
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/90 to-transparent px-4 pt-6">
                  <div className="h-1 bg-white/20 rounded-full relative">
                    <div className="absolute left-0 top-0 h-full w-1/3 bg-brand-orange rounded-full" />
                    <div className="absolute left-[15%] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-brand-orange" />
                    <div className="absolute left-[28%] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-brand-purple" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-white/10 bg-surface-elevated/50">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-brand-orange mb-2">{stat.value}</div>
                <div className="text-content-secondary">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 text-content">Everything you need for efficient reviews</h2>
            <p className="text-content-secondary text-lg">Powerful tools designed for creative teams and their clients</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group p-6 rounded-2xl border border-white/10 bg-surface-elevated/50 hover:bg-surface-hover transition-colors"
              >
                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-4', feature.bgColor)}>
                  <feature.icon className={cn('w-6 h-6', feature.color)} />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-content">{feature.title}</h3>
                <p className="text-content-secondary leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-orange/5 via-brand-purple/10 to-brand-orange/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-brand-purple/10 rounded-full blur-3xl" />
        
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6 text-content">Ready to streamline your review process?</h2>
          <p className="text-xl text-content-secondary mb-10">
            Start reviewing your creative assets with precision and clarity.
          </p>
          <Button 
            size="lg"
            className="bg-brand-orange hover:bg-brand-orange-light text-content-inverse h-14 px-10 text-lg font-medium"
            onClick={() => navigate('/review')}
          >
            Get Started Now
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src={LOGO_URL} 
              alt="Zoechelfyn" 
              className="h-8 w-auto"
            />
            <span className="font-medium text-content">The Screening Room</span>
          </div>
          <p className="text-content-muted text-sm">Built by Zoechelfyn</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
