import React from "react";
import {
    BookOpen, Key, Code2, AlertCircle, CheckCircle, RefreshCw, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuizQuestion } from "@/components/modals/QuizModal";

interface KeyConcept {
    title: string;
    explanation: string;
    tags?: string[];
}

interface CodeExample {
    language: string;
    code: string;
    explanation: string;
}

interface FieldGuideData {
    executive_summary?: string;
    key_concepts: KeyConcept[];
    code_examples: CodeExample[];
    key_takeaways: string[];
    markdown_content?: string;
}

interface FieldGuidePanelProps {
    fieldGuide: FieldGuideData | null;
    isGenerating: boolean;
    quizQuestions: QuizQuestion[];
    onGenerate: () => void;
    onOpenQuiz: () => void;
    showQuizButton?: boolean; // controlled by auto_quiz setting
}

export function FieldGuidePanel({
    fieldGuide,
    isGenerating,
    quizQuestions,
    onGenerate,
    onOpenQuiz,
    showQuizButton = true,
}: FieldGuidePanelProps) {
    if (isGenerating) {
        return (
            <div className="flex-1 overflow-auto p-6">
                <div className="flex flex-col items-center justify-center h-full gap-4">
                    <Loader2 className="w-8 h-8 text-atlas-gold animate-spin" />
                    <p className="text-atlas-text-secondary">Generating Field Guide...</p>
                    <p className="text-xs text-atlas-text-muted">This may take a minute</p>
                </div>
            </div>
        );
    }

    if (!fieldGuide) {
        return (
            <div className="flex-1 overflow-auto p-6">
                <div className="flex flex-col items-center justify-center h-full gap-4">
                    <div className="w-16 h-16 rounded-full bg-atlas-gold/10 border border-atlas-gold/30 flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-atlas-gold" />
                    </div>
                    <h3 className="font-display font-bold text-atlas-text-primary">No Field Guide Yet</h3>
                    <p className="text-sm text-atlas-text-secondary text-center max-w-xs">
                        Generate an AI-powered field guide with key concepts, code examples, and important notes.
                    </p>
                    <button
                        onClick={onGenerate}
                        className="px-6 py-3 bg-atlas-gold hover:bg-atlas-gold-hover text-atlas-bg-primary font-bold rounded-xl transition-all"
                    >
                        Generate Field Guide
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-auto p-6">
            {/* Executive Summary */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-display font-bold text-atlas-text-primary flex items-center gap-2">
                        <svg className="w-5 h-5 text-atlas-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <path d="M14 2v6h6" />
                            <path d="M16 13H8" />
                            <path d="M16 17H8" />
                        </svg>
                        Summary
                    </h3>
                    <button
                        onClick={onGenerate}
                        disabled={isGenerating}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-atlas-text-secondary hover:text-atlas-gold bg-atlas-bg-tertiary hover:bg-atlas-bg-tertiary/80 border border-atlas-border rounded-lg transition-all disabled:opacity-50"
                        title="Regenerate Field Guide"
                    >
                        <RefreshCw className={cn("w-3.5 h-3.5", isGenerating && "animate-spin")} />
                        Regenerate
                    </button>
                </div>
                <p className="text-sm text-atlas-text-secondary leading-relaxed">
                    {fieldGuide.executive_summary}
                </p>
            </div>

            {/* Key Concepts */}
            {fieldGuide.key_concepts && fieldGuide.key_concepts.length > 0 && (
                <div className="mb-6">
                    <h3 className="font-display font-bold text-atlas-text-primary mb-3 flex items-center gap-2">
                        <Key className="w-5 h-5 text-atlas-gold" />
                        Key Concepts
                    </h3>
                    <ul className="space-y-3">
                        {fieldGuide.key_concepts.map((concept, idx) => (
                            <li key={concept.title} className="flex items-start gap-3 text-sm">
                                <span className="w-5 h-5 rounded bg-atlas-gold/10 border border-atlas-gold/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-atlas-gold text-xs font-bold">{idx + 1}</span>
                                </span>
                                <div>
                                    <p className="text-atlas-text-primary font-medium">{concept.title}</p>
                                    <p className="text-atlas-text-secondary mt-0.5">{concept.explanation}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Code Examples */}
            {fieldGuide.code_examples && fieldGuide.code_examples.length > 0 && (
                <div className="mb-6">
                    <h3 className="font-display font-bold text-atlas-text-primary mb-3 flex items-center gap-2">
                        <Code2 className="w-5 h-5 text-atlas-gold" />
                        Code Examples
                    </h3>
                    {fieldGuide.code_examples.map((example) => (
                        <div key={`${example.language}-${example.code.slice(0, 30)}`} className="mb-4">
                            <div className="code-block rounded-lg p-4 overflow-x-auto">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-atlas-text-muted uppercase">{example.language}</span>
                                </div>
                                <pre className="text-xs text-atlas-text-secondary leading-relaxed font-mono">
                                    <code>{example.code}</code>
                                </pre>
                            </div>
                            {example.explanation && (
                                <p className="text-xs text-atlas-text-muted mt-2 px-1">{example.explanation}</p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Key Takeaways */}
            {fieldGuide.key_takeaways && fieldGuide.key_takeaways.length > 0 && (
                <div className="bg-atlas-gold/5 border border-atlas-gold/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-[18px] h-[18px] text-atlas-gold flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-bold text-atlas-text-primary text-sm mb-2">Key Takeaways</h4>
                            <ul className="space-y-1">
                                {fieldGuide.key_takeaways.map((takeaway) => (
                                    <li key={takeaway.slice(0, 50)} className="text-sm text-atlas-text-secondary flex items-start gap-2">
                                        <span className="text-atlas-gold mt-1">•</span>
                                        <span>{takeaway}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Take Quiz Button */}
            {showQuizButton && quizQuestions.length > 0 && (
                <div className="pt-4 border-t border-atlas-border">
                    <button
                        onClick={onOpenQuiz}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-atlas-gold/10 hover:bg-atlas-gold/20 border border-atlas-gold/30 text-atlas-gold font-semibold rounded-xl transition-all"
                    >
                        <CheckCircle className="w-4 h-4" />
                        Take Comprehension Quiz ({quizQuestions.length} questions)
                    </button>
                </div>
            )}
        </div>
    );
}
