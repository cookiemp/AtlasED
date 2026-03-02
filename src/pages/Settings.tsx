import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Key, Eye, EyeOff, Check, AlertCircle, SlidersHorizontal,
  Play, Shield, Download, Trash2, ChevronRight, Loader2
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { Settings as SettingsType } from "@/types/electron";

export default function Settings() {
  const navigate = useNavigate();

  // ── Core state ──
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [validationState, setValidationState] = useState<'idle' | 'success' | 'error'>('idle');
  const [isValidating, setIsValidating] = useState(false);
  const [isSavingApiKey, setIsSavingApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState('1');

  // Toggle preferences — each auto-saves independently
  const [autoFieldGuide, setAutoFieldGuide] = useState(true);
  const [autoQuiz, setAutoQuiz] = useState(true);
  const [srsEnabled, setSrsEnabled] = useState(true);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'danger' | 'default';
    confirmLabel?: string;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ── Helper: save a single setting with error handling ──
  const saveSetting = useCallback(async (key: keyof SettingsType, value: unknown): Promise<boolean> => {
    try {
      if (!window.atlased) return false;
      const result = await window.atlased.settings.set(key, value as any);
      console.log(`[Settings] Saved ${key} =`, value, result);
      return true;
    } catch (error) {
      console.error(`[Settings] Failed to save ${key}:`, error);
      return false;
    }
  }, []);

  // ── Helper: load a single setting with error handling ──
  const loadSetting = useCallback(async <T,>(key: keyof SettingsType, fallback: T): Promise<T> => {
    try {
      if (!window.atlased) return fallback;
      const value = await window.atlased.settings.get(key);
      console.log(`[Settings] Loaded ${key} =`, value);
      // Return fallback if value is null/undefined
      return (value !== null && value !== undefined) ? value as T : fallback;
    } catch (error) {
      console.error(`[Settings] Failed to load ${key}:`, error);
      return fallback;
    }
  }, []);

  // ── Load all settings on mount ──
  useEffect(() => {
    async function loadAllSettings() {
      try {
        // Load each setting independently — one failure doesn't block others
        const [key, speed, quiz, fieldGuide, srs] = await Promise.all([
          loadSetting('gemini_api_key', ''),
          loadSetting('playback_speed', 1),
          loadSetting('auto_quiz', true),
          loadSetting('auto_field_guide', true),
          loadSetting('srs_enabled', true),
        ]);

        setApiKey(key);
        setPlaybackSpeed(String(speed));
        setAutoQuiz(quiz);
        setAutoFieldGuide(fieldGuide);
        setSrsEnabled(srs);
      } catch (error) {
        console.error("[Settings] Unexpected error loading settings:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadAllSettings();
  }, [loadSetting]);

  // ── API Key: Validate ──
  const handleValidate = async () => {
    if (!apiKey) {
      setValidationState('error');
      return;
    }

    setIsValidating(true);
    try {
      if (window.atlased) {
        const result = await window.atlased.ai.validateApiKey(apiKey);
        setValidationState(result.valid ? 'success' : 'error');
      }
    } catch (error) {
      console.error("API key validation error:", error);
      setValidationState('error');
    } finally {
      setIsValidating(false);
    }
  };

  // ── API Key: Save ──
  const handleSaveApiKey = async () => {
    setIsSavingApiKey(true);
    const success = await saveSetting('gemini_api_key', apiKey);
    setIsSavingApiKey(false);
    if (success) {
      showToast("API key saved");
    } else {
      showToast("Failed to save API key", "error");
    }
  };

  // ── Toggle handlers: auto-save immediately ──
  const handleToggleAutoFieldGuide = async () => {
    const newValue = !autoFieldGuide;
    setAutoFieldGuide(newValue);
    const success = await saveSetting('auto_field_guide', newValue);
    if (!success) {
      setAutoFieldGuide(!newValue); // revert on failure
      showToast("Failed to save setting", "error");
    }
  };

  const handleToggleAutoQuiz = async () => {
    const newValue = !autoQuiz;
    setAutoQuiz(newValue);
    const success = await saveSetting('auto_quiz', newValue);
    if (!success) {
      setAutoQuiz(!newValue);
      showToast("Failed to save setting", "error");
    }
  };

  const handleToggleSrs = async () => {
    const newValue = !srsEnabled;
    setSrsEnabled(newValue);
    const success = await saveSetting('srs_enabled', newValue);
    if (!success) {
      setSrsEnabled(!newValue);
      showToast("Failed to save setting", "error");
    }
  };

  // ── Playback speed: auto-save on change ──
  const handleSetPlaybackSpeed = async (speed: string) => {
    setPlaybackSpeed(speed);
    const success = await saveSetting('playback_speed', parseFloat(speed));
    if (success) {
      showToast(`Playback speed set to ${speed}x`);
    } else {
      showToast("Failed to save playback speed", "error");
    }
  };

  // ── Export data ──
  const handleExportData = async () => {
    if (!window.atlased) return;
    try {
      const expeditions = await window.atlased.expeditions.getAll();
      const allData: Record<string, unknown> = { expeditions: [] };

      for (const exp of expeditions || []) {
        const waypoints = await window.atlased.waypoints.getAll(exp.id);
        const waypointData = [];

        for (const wp of waypoints || []) {
          const fieldGuide = await window.atlased.fieldGuides.get(wp.id);
          const note = await window.atlased.notes.get(wp.id);
          const bookmarks = await window.atlased.bookmarks.getAll(wp.id);
          waypointData.push({
            ...wp,
            fieldGuide: fieldGuide || null,
            note: note?.content || null,
            bookmarks: bookmarks || [],
          });
        }

        (allData.expeditions as unknown[]).push({
          ...exp,
          waypoints: waypointData,
        });
      }

      allData.exportedAt = new Date().toISOString();
      allData.version = "1.0.0";

      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `atlased-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast("Data exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      showToast("Failed to export data", "error");
    }
  };

  // ── Clear cache ──
  const handleClearCache = async () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Clear Cache',
      message: 'This will clear all cached transcripts. Your expeditions, notes, and progress will NOT be deleted.',
      confirmLabel: 'Clear Cache',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        try {
          if (window.atlased) {
            const expeditions = await window.atlased.expeditions.getAll();
            let cleared = 0;
            for (const exp of expeditions || []) {
              const waypoints = await window.atlased.waypoints.getAll(exp.id);
              for (const wp of waypoints || []) {
                if (wp.transcript_text) {
                  await window.atlased.waypoints.updateTranscript(wp.id, '');
                  cleared++;
                }
              }
            }
            showToast(`Cleared cached data from ${cleared} waypoint${cleared !== 1 ? 's' : ''}`);
          }
        } catch (error) {
          console.error("Clear cache error:", error);
          showToast("Failed to clear cache", "error");
        }
      }
    });
  };

  // ── Loading state ──
  if (isLoading) {
    return (
      <AppLayout headerProps={{ showBack: true, backLabel: "Back" }}>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-atlas-gold animate-spin" />
            <p className="text-atlas-text-secondary">Loading settings...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // ── Toggle items config ──
  const toggleItems = [
    {
      title: "Auto-generate Field Guides",
      desc: "Automatically create comprehensive notes from video content",
      value: autoFieldGuide,
      onToggle: handleToggleAutoFieldGuide,
    },
    {
      title: "Show Comprehension Quizzes",
      desc: "Pause videos to test understanding at key moments",
      value: autoQuiz,
      onToggle: handleToggleAutoQuiz,
    },
    {
      title: "Enable Spaced Repetition",
      desc: "Schedule Memory Checkpoints for optimal retention",
      value: srsEnabled,
      onToggle: handleToggleSrs,
    },
  ];

  return (
    <AppLayout
      headerProps={{ showBack: true, backLabel: "Back" }}
    >
      <main className="max-w-4xl mx-auto px-8 py-10 w-full">
        {/* Page Header */}
        <div className="mb-10">
          <h1 className="font-display font-bold text-3xl tracking-tight mb-2 text-atlas-text-primary">Settings</h1>
          <p className="text-atlas-text-secondary text-base">Configure your AtlasED experience and learning preferences</p>
        </div>

        <div className="space-y-6">
          {/* API Configuration */}
          <section className="bg-atlas-bg-secondary rounded-xl border border-atlas-border overflow-hidden">
            <div className="px-6 py-5 border-b border-atlas-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-atlas-gold/10 flex items-center justify-center">
                  <Key className="w-5 h-5 text-atlas-gold" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-lg text-atlas-text-primary">API Configuration</h2>
                  <p className="text-atlas-text-muted text-sm">Connect to Gemini AI for enhanced learning features</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label htmlFor="gemini-api-key" className="block text-atlas-text-secondary text-sm uppercase tracking-wide font-medium mb-3">
                  Gemini API Key
                </label>
                <div className="relative">
                  <input
                    id="gemini-api-key"
                    type={showApiKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => {
                      setApiKey(e.target.value);
                      setValidationState('idle');
                    }}
                    placeholder="Enter your Gemini API key"
                    className="w-full bg-atlas-bg-tertiary border border-atlas-border rounded-xl px-4 py-3.5 pr-32 text-atlas-text-primary placeholder-atlas-text-muted focus:outline-none focus:border-atlas-gold/50 input-glow transition-all duration-200 font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-[6.5rem] top-1/2 -translate-y-1/2 p-2 text-atlas-text-muted hover:text-atlas-text-primary transition-colors"
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={handleValidate}
                    disabled={isValidating}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 min-w-[5.5rem] text-center bg-atlas-bg-secondary border border-atlas-border rounded-lg text-xs font-medium text-atlas-text-secondary hover:text-atlas-gold hover:border-atlas-gold/50 transition-all duration-200 disabled:opacity-50"
                  >
                    {isValidating ? "Validating..." : "Validate"}
                  </button>
                </div>
                <p className="text-atlas-text-muted text-xs mt-2">
                  Your API key is stored locally and encrypted.{" "}
                  <button
                    type="button"
                    onClick={() => window.atlased?.openExternal('https://aistudio.google.com/apikey')}
                    className="text-atlas-gold hover:underline"
                  >Get an API key</button>
                </p>

                {/* Validation States */}
                {validationState === 'success' && (
                  <div className="mt-3 flex items-center gap-2 text-atlas-success text-sm">
                    <Check className="w-4 h-4" />
                    <span>API key validated successfully</span>
                  </div>
                )}
                {validationState === 'error' && (
                  <div className="mt-3 flex items-center gap-2 text-atlas-error text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>Invalid API key. Please check and try again.</span>
                  </div>
                )}

                {/* Save API Key Button */}
                <button
                  type="button"
                  onClick={handleSaveApiKey}
                  disabled={isSavingApiKey}
                  className="mt-4 px-5 py-2 rounded-lg bg-atlas-gold text-atlas-bg-primary font-display font-bold text-sm hover:bg-atlas-gold-hover transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  {isSavingApiKey ? "Saving..." : "Save API Key"}
                </button>
              </div>
            </div>
          </section>

          {/* Learning Preferences — toggles auto-save */}
          <section className="bg-atlas-bg-secondary rounded-xl border border-atlas-border overflow-hidden">
            <div className="px-6 py-5 border-b border-atlas-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-atlas-gold/10 flex items-center justify-center">
                  <SlidersHorizontal className="w-5 h-5 text-atlas-gold" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-lg text-atlas-text-primary">Learning Preferences</h2>
                  <p className="text-atlas-text-muted text-sm">Changes are saved automatically</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {toggleItems.map((item, index) => (
                <div key={item.title}>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <h3 className="font-medium text-atlas-text-primary">{item.title}</h3>
                      <p className="text-atlas-text-muted text-sm mt-0.5">{item.desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={item.onToggle}
                      className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                        item.value ? "bg-atlas-gold" : "bg-atlas-bg-tertiary border border-atlas-border"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block h-5 w-5 transform rounded-full transition-transform",
                          item.value
                            ? "translate-x-[22px] bg-atlas-text-primary"
                            : "translate-x-[2px] bg-atlas-text-secondary"
                        )}
                      />
                    </button>
                  </div>
                  {index < toggleItems.length - 1 && <div className="h-px bg-atlas-border" />}
                </div>
              ))}
            </div>
          </section>

          {/* Playback Speed — auto-saves on click */}
          <section className="bg-atlas-bg-secondary rounded-xl border border-atlas-border overflow-hidden">
            <div className="px-6 py-5 border-b border-atlas-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-atlas-gold/10 flex items-center justify-center">
                  <Play className="w-5 h-5 text-atlas-gold" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-lg text-atlas-text-primary">Default Playback Speed</h2>
                  <p className="text-atlas-text-muted text-sm">Applied to all new videos automatically</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-4 gap-3">
                {["0.75", "1", "1.25", "1.5"].map((speed) => (
                  <button
                    key={speed}
                    type="button"
                    onClick={() => handleSetPlaybackSpeed(speed)}
                    className={cn(
                      "flex flex-col items-center justify-center py-4 px-4 rounded-xl transition-all duration-200",
                      playbackSpeed === speed
                        ? "bg-atlas-gold/10 border border-atlas-gold"
                        : "bg-atlas-bg-tertiary border border-atlas-border hover:border-atlas-text-muted"
                    )}
                  >
                    <span className="font-display font-bold text-lg text-atlas-text-primary">{speed}x</span>
                    <div className={cn(
                      "w-2 h-2 rounded-full bg-atlas-gold mt-2 transition-opacity duration-200",
                      playbackSpeed === speed ? "opacity-100" : "opacity-0"
                    )} />
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Data & Privacy */}
          <section className="bg-atlas-bg-secondary rounded-xl border border-atlas-border overflow-hidden">
            <div className="px-6 py-5 border-b border-atlas-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-atlas-gold/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-atlas-gold" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-lg text-atlas-text-primary">Data & Privacy</h2>
                  <p className="text-atlas-text-muted text-sm">Manage your learning data and privacy settings</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <button
                type="button"
                onClick={handleExportData}
                className="w-full flex items-center justify-between p-4 bg-atlas-bg-tertiary border border-atlas-border rounded-xl hover:border-atlas-gold/50 hover:bg-atlas-bg-tertiary/80 transition-all duration-200 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-atlas-bg-secondary flex items-center justify-center group-hover:bg-atlas-gold/10 transition-colors">
                    <Download className="w-5 h-5 text-atlas-text-secondary group-hover:text-atlas-gold transition-colors" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium text-atlas-text-primary">Export Learning Data</h3>
                    <p className="text-atlas-text-muted text-sm">Download all your expeditions, notes, and progress</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-atlas-text-muted" />
              </button>

              <button
                type="button"
                onClick={handleClearCache}
                className="w-full flex items-center justify-between p-4 bg-atlas-bg-tertiary border border-atlas-border rounded-xl hover:border-atlas-gold/50 hover:bg-atlas-bg-tertiary/80 transition-all duration-200 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-atlas-bg-secondary flex items-center justify-center group-hover:bg-atlas-gold/10 transition-colors">
                    <Trash2 className="w-5 h-5 text-atlas-text-secondary group-hover:text-atlas-gold transition-colors" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium text-atlas-text-primary">Clear Cache</h3>
                    <p className="text-atlas-text-muted text-sm">Remove cached transcripts to free up space</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-atlas-text-muted" />
              </button>

              <div className="flex items-center justify-center gap-2 py-3 text-atlas-text-muted text-xs">
                <Shield className="w-3.5 h-3.5" />
                <span>All data is stored locally on your device. Nothing is sent to external servers except AI API calls.</span>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-atlas-border">
          <div className="flex items-center justify-between text-atlas-text-muted text-sm">
            <p>AtlasED v1.0.0</p>
            <div className="flex items-center gap-4">
              <button type="button" onClick={() => window.atlased?.openExternal('https://github.com/cookiemp/AtlasED')} className="hover:text-atlas-gold transition-colors">GitHub</button>
            </div>
          </div>
        </footer>
      </main>

      {/* Toast Notification */}
      {toast && (
        <div className={cn(
          "fixed bottom-6 right-6 px-5 py-3 rounded-xl shadow-2xl border flex items-center gap-3 z-50",
          toast.type === 'success'
            ? "bg-atlas-bg-secondary border-atlas-success/30 text-atlas-success"
            : "bg-atlas-bg-secondary border-atlas-error/30 text-atlas-error"
        )}>
          {toast.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}
      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </AppLayout>
  );
}
