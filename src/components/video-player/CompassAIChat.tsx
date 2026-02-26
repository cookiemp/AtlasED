import React from "react";
import { Compass, Loader2, Send } from "lucide-react";
import { cn } from "@/lib/utils";

// Simple, safe markdown renderer for chat messages
function renderMarkdown(text: string) {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let currentList: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeContent = '';
    let codeLanguage = '';

    function renderInline(text: string): React.ReactNode[] {
        const parts: React.ReactNode[] = [];
        let remaining = text;
        let keyIdx = 0;

        while (remaining.length > 0) {
            // Bold
            const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
            if (boldMatch && boldMatch.index !== undefined) {
                if (boldMatch.index > 0) {
                    parts.push(remaining.slice(0, boldMatch.index));
                }
                parts.push(
                    <strong key={`b-${keyIdx++}`} className="font-semibold text-atlas-text-primary">
                        {boldMatch[1]}
                    </strong>
                );
                remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
                continue;
            }

            // Inline code
            const codeMatch = remaining.match(/`([^`]+)`/);
            if (codeMatch && codeMatch.index !== undefined) {
                if (codeMatch.index > 0) {
                    parts.push(remaining.slice(0, codeMatch.index));
                }
                parts.push(
                    <code key={`c-${keyIdx++}`} className="px-1.5 py-0.5 bg-atlas-bg-tertiary rounded text-atlas-gold text-xs font-mono">
                        {codeMatch[1]}
                    </code>
                );
                remaining = remaining.slice(codeMatch.index + codeMatch[0].length);
                continue;
            }

            // Italic
            const italicMatch = remaining.match(/\*(.+?)\*/);
            if (italicMatch && italicMatch.index !== undefined) {
                if (italicMatch.index > 0) {
                    parts.push(remaining.slice(0, italicMatch.index));
                }
                parts.push(<em key={`i-${keyIdx++}`}>{italicMatch[1]}</em>);
                remaining = remaining.slice(italicMatch.index + italicMatch[0].length);
                continue;
            }

            parts.push(remaining);
            break;
        }
        return parts;
    }

    function flushList() {
        if (currentList.length > 0) {
            elements.push(
                <ul key={`list-${elements.length}`} className="space-y-1 my-1.5 pl-4">
                    {currentList.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                            <span className="text-atlas-gold mt-1 text-xs">•</span>
                            <span>{item}</span>
                        </li>
                    ))}
                </ul>
            );
            currentList = [];
        }
    }

    for (const line of lines) {
        // Code block toggle
        if (line.trim().startsWith('```')) {
            if (inCodeBlock) {
                elements.push(
                    <div key={`code-${elements.length}`} className="my-2 rounded-lg bg-atlas-bg-tertiary/80 border border-atlas-border/50 p-3 overflow-x-auto">
                        {codeLanguage && (
                            <span className="text-[10px] text-atlas-text-muted uppercase mb-1 block">{codeLanguage}</span>
                        )}
                        <pre className="text-xs font-mono text-atlas-text-secondary whitespace-pre-wrap"><code>{codeContent.trim()}</code></pre>
                    </div>
                );
                codeContent = '';
                codeLanguage = '';
                inCodeBlock = false;
            } else {
                flushList();
                codeLanguage = line.trim().slice(3).trim();
                inCodeBlock = true;
            }
            continue;
        }

        if (inCodeBlock) {
            codeContent += line + '\n';
            continue;
        }

        // Heading
        const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
        if (headingMatch) {
            flushList();
            const level = headingMatch[1].length;
            const className = level === 1
                ? "text-base font-bold text-atlas-text-primary mt-3 mb-1.5"
                : level === 2
                    ? "text-sm font-bold text-atlas-text-primary mt-2.5 mb-1"
                    : "text-sm font-semibold text-atlas-text-primary mt-2 mb-1";
            elements.push(<div key={`h-${elements.length}`} className={className}>{renderInline(headingMatch[2])}</div>);
            continue;
        }

        // Numbered list
        const numberedMatch = line.match(/^\s*(\d+)[\.\)]\s+(.+)/);
        if (numberedMatch) {
            currentList.push(<span>{renderInline(numberedMatch[2])}</span>);
            continue;
        }

        // Bullet list
        const bulletMatch = line.match(/^\s*[-*]\s+(.+)/);
        if (bulletMatch) {
            currentList.push(<span>{renderInline(bulletMatch[1])}</span>);
            continue;
        }

        // Empty line
        if (line.trim() === '') {
            flushList();
            continue;
        }

        // Regular paragraph
        flushList();
        elements.push(<p key={`p-${elements.length}`} className="my-1">{renderInline(line)}</p>);
    }

    flushList();

    return <div className="space-y-0.5">{elements}</div>;
}

interface ChatMessage {
    type: 'ai' | 'user';
    content: string;
    id: string;
}

interface CompassAIChatProps {
    messages: ChatMessage[];
    isSending: boolean;
    chatInput: string;
    hasTranscript: boolean;
    onInputChange: (value: string) => void;
    onSend: () => void;
}

export function CompassAIChat({
    messages,
    isSending,
    chatInput,
    hasTranscript,
    onInputChange,
    onSend,
}: CompassAIChatProps) {
    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Chat Messages */}
            <div className="flex-1 overflow-auto p-6 space-y-4">
                {messages.map((msg) => (
                    <div key={msg.id} className={cn(
                        "flex gap-3",
                        msg.type === 'user' && "justify-end"
                    )}>
                        {msg.type === 'ai' && (
                            <div className="w-8 h-8 rounded-full bg-atlas-gold/10 border border-atlas-gold/30 flex items-center justify-center flex-shrink-0">
                                <Compass className="w-4 h-4 text-atlas-gold" />
                            </div>
                        )}
                        <div className={cn(
                            "rounded-2xl px-4 py-3 max-w-[85%]",
                            msg.type === 'ai'
                                ? "chat-bubble-ai rounded-tl-sm"
                                : "chat-bubble-user rounded-tr-sm"
                        )}>
                            <div className="text-sm text-atlas-text-secondary leading-relaxed">{renderMarkdown(msg.content)}</div>
                        </div>
                    </div>
                ))}
                {isSending && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-atlas-gold/10 border border-atlas-gold/30 flex items-center justify-center flex-shrink-0">
                            <Compass className="w-4 h-4 text-atlas-gold" />
                        </div>
                        <div className="chat-bubble-ai rounded-2xl rounded-tl-sm px-4 py-3">
                            <Loader2 className="w-4 h-4 animate-spin text-atlas-gold" />
                        </div>
                    </div>
                )}
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-atlas-border bg-atlas-bg-secondary">
                <form
                    onSubmit={(e) => { e.preventDefault(); onSend(); }}
                    className="flex gap-3"
                >
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={chatInput}
                            onChange={(e) => onInputChange(e.target.value)}
                            placeholder="Ask Compass about this video..."
                            disabled={isSending}
                            className="w-full bg-atlas-bg-tertiary border border-atlas-border rounded-xl px-4 py-3 text-sm text-atlas-text-primary placeholder-atlas-text-muted focus:outline-none focus:border-atlas-gold/50 focus:ring-1 focus:ring-atlas-gold/50 transition-all disabled:opacity-50"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isSending || !chatInput.trim()}
                        className="w-11 h-11 bg-atlas-gold hover:bg-atlas-gold-hover rounded-xl flex items-center justify-center transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send className="w-[18px] h-[18px] text-atlas-bg-primary" />
                    </button>
                </form>
                <p className="text-xs text-atlas-text-muted mt-2 text-center">
                    {hasTranscript
                        ? "Compass AI may produce inaccurate information. Always verify important concepts."
                        : "Generate a Field Guide first to enable Compass AI chat."
                    }
                </p>
            </div>
        </div>
    );
}
