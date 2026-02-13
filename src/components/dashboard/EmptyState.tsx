import { Compass, MapPin, ArrowRight } from "lucide-react";

interface EmptyStateProps {
  onCreateExpedition: () => void;
}

export function EmptyState({ onCreateExpedition }: EmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 py-16">
      <div className="relative mb-8">
        {/* Map Pattern Background */}
        <div className="w-48 h-48 rounded-3xl bg-atlas-bg-secondary border border-atlas-border map-pattern flex items-center justify-center">
          <div className="w-20 h-20 rounded-2xl bg-atlas-gold/10 border border-atlas-gold/30 flex items-center justify-center glow-gold">
            <Compass className="w-10 h-10 text-atlas-gold" />
          </div>
        </div>
        {/* Floating Elements */}
        <div className="absolute -top-2 -right-2 w-10 h-10 rounded-xl bg-atlas-bg-tertiary border border-atlas-border flex items-center justify-center animate-fade-in">
          <MapPin className="w-5 h-5 text-atlas-text-muted" />
        </div>
      </div>

      <h2 className="font-display font-bold text-2xl text-atlas-text-primary mb-3 text-center">
        No Expeditions Yet
      </h2>
      <p className="text-atlas-text-secondary text-center max-w-md mb-8 leading-relaxed">
        Transform any YouTube playlist into a structured learning journey. Add waypoints, 
        track your progress, and master new topics efficiently.
      </p>

      <button
        onClick={onCreateExpedition}
        className="group flex items-center gap-3 bg-atlas-gold hover:bg-atlas-gold-hover text-atlas-bg-primary font-semibold px-8 py-4 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-atlas-gold/20 hover:-translate-y-0.5"
      >
        <span>Start Your First Expedition</span>
        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
      </button>

      {/* Tips */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl">
        <div className="text-center p-4">
          <div className="w-10 h-10 rounded-lg bg-atlas-gold/10 border border-atlas-gold/20 flex items-center justify-center mx-auto mb-3">
            <span className="text-atlas-gold font-display font-bold">1</span>
          </div>
          <p className="text-sm text-atlas-text-muted">Paste a YouTube playlist URL</p>
        </div>
        <div className="text-center p-4">
          <div className="w-10 h-10 rounded-lg bg-atlas-gold/10 border border-atlas-gold/20 flex items-center justify-center mx-auto mb-3">
            <span className="text-atlas-gold font-display font-bold">2</span>
          </div>
          <p className="text-sm text-atlas-text-muted">Videos become waypoints on your map</p>
        </div>
        <div className="text-center p-4">
          <div className="w-10 h-10 rounded-lg bg-atlas-gold/10 border border-atlas-gold/20 flex items-center justify-center mx-auto mb-3">
            <span className="text-atlas-gold font-display font-bold">3</span>
          </div>
          <p className="text-sm text-atlas-text-muted">Learn with AI guides and quizzes</p>
        </div>
      </div>
    </div>
  );
}
