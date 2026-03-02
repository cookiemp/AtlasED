import { useState, useEffect } from "react";
import { Key, ExternalLink, Sparkles, ArrowRight, Check, AlertCircle } from "lucide-react";

interface ApiKeySetupModalProps {
    onComplete: () => void;
}

export function ApiKeySetupModal({ onComplete }: ApiKeySetupModalProps) {
    const [apiKey, setApiKey] = useState("");
    const [isValidating, setIsValidating] = useState(false);
    const [validationResult, setValidationResult] = useState<"idle" | "valid" | "invalid">("idle");
    const [errorMsg, setErrorMsg] = useState("");

    const handleValidateAndSave = async () => {
        if (!apiKey.trim()) return;
        setIsValidating(true);
        setValidationResult("idle");
        setErrorMsg("");

        try {
            if (window.atlased) {
                const result = await window.atlased.ai.validateApiKey(apiKey.trim());
                if (result.valid) {
                    await window.atlased.settings.set("gemini_api_key", apiKey.trim());
                    setValidationResult("valid");
                    // Auto-close after success animation
                    setTimeout(() => onComplete(), 1200);
                } else {
                    setValidationResult("invalid");
                    setErrorMsg(result.error || "Invalid API key");
                }
            }
        } catch (e) {
            setValidationResult("invalid");
            setErrorMsg("Failed to validate key. Check your connection.");
        } finally {
            setIsValidating(false);
        }
    };

    const handleSkip = () => {
        onComplete();
    };

    const handleGetKey = () => {
        if (window.atlased?.openExternal) {
            window.atlased.openExternal("https://aistudio.google.com/app/apikey");
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

            {/* Modal */}
            <div className="relative w-full max-w-lg mx-4 animate-fade-in">
                <div className="bg-atlas-bg-secondary border border-atlas-border rounded-2xl shadow-2xl overflow-hidden">
                    {/* Header with gradient */}
                    <div className="p-8 pb-6 text-center bg-gradient-to-b from-atlas-gold/5 to-transparent">
                        <div className="w-16 h-16 rounded-2xl bg-atlas-gold/10 border border-atlas-gold/30 flex items-center justify-center mx-auto mb-5">
                            <Sparkles className="w-8 h-8 text-atlas-gold" />
                        </div>
                        <h2 className="font-display font-bold text-2xl text-atlas-text-primary mb-2">
                            Welcome to AtlasED
                        </h2>
                        <p className="text-atlas-text-secondary text-sm leading-relaxed max-w-sm mx-auto">
                            To unlock AI-powered features like field guides, quizzes, and smart summaries,
                            add your Gemini API key.
                        </p>
                    </div>

                    {/* Body */}
                    <div className="px-8 pb-8">
                        {/* API Key Input */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-atlas-text-secondary mb-2">
                                Gemini API Key
                            </label>
                            <div className="relative">
                                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-atlas-text-muted" />
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => {
                                        setApiKey(e.target.value);
                                        setValidationResult("idle");
                                        setErrorMsg("");
                                    }}
                                    placeholder="Paste your API key here..."
                                    className="w-full bg-atlas-bg-tertiary border border-atlas-border rounded-xl pl-10 pr-4 py-3 text-sm text-atlas-text-primary placeholder:text-atlas-text-muted focus:outline-none focus:border-atlas-gold/50 transition-colors"
                                    onKeyDown={(e) => e.key === "Enter" && handleValidateAndSave()}
                                />
                            </div>

                            {/* Validation Feedback */}
                            {validationResult === "valid" && (
                                <div className="flex items-center gap-2 mt-2 text-atlas-success text-sm animate-fade-in">
                                    <Check className="w-4 h-4" />
                                    <span>API key verified — you're all set!</span>
                                </div>
                            )}
                            {validationResult === "invalid" && (
                                <div className="flex items-center gap-2 mt-2 text-atlas-error text-sm animate-fade-in">
                                    <AlertCircle className="w-4 h-4" />
                                    <span>{errorMsg}</span>
                                </div>
                            )}
                        </div>

                        {/* Get API Key Link */}
                        <button
                            onClick={handleGetKey}
                            className="flex items-center gap-2 text-sm text-atlas-gold hover:text-atlas-gold-hover transition-colors mb-6 group"
                        >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Get a free API key from Google AI Studio</span>
                            <ArrowRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                        </button>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={handleSkip}
                                className="flex-1 px-4 py-3 rounded-xl text-sm font-medium text-atlas-text-secondary hover:text-atlas-text-primary hover:bg-atlas-bg-tertiary border border-atlas-border transition-all"
                            >
                                Skip for Now
                            </button>
                            <button
                                onClick={handleValidateAndSave}
                                disabled={!apiKey.trim() || isValidating || validationResult === "valid"}
                                className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold bg-atlas-gold hover:bg-atlas-gold-hover text-atlas-bg-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-atlas-gold/20"
                            >
                                {isValidating ? "Validating..." : validationResult === "valid" ? "✓ Saved!" : "Verify & Save"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
