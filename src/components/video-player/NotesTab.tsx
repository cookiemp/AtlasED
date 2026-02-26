import { StickyNote } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotesTabProps {
    noteContent: string;
    noteSaveStatus: 'saved' | 'saving' | 'idle';
    onNoteChange: (value: string) => void;
}

export function NotesTab({ noteContent, noteSaveStatus, onNoteChange }: NotesTabProps) {
    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Notes Header */}
            <div className="px-6 py-4 border-b border-atlas-border bg-atlas-bg-secondary/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <StickyNote className="w-4 h-4 text-atlas-gold" />
                    <h3 className="font-display font-semibold text-sm text-atlas-text-primary">Personal Notes</h3>
                </div>
                <span className={cn(
                    "text-[10px] font-medium px-2 py-0.5 rounded-full transition-all",
                    noteSaveStatus === 'saving' && "bg-atlas-gold/10 text-atlas-gold",
                    noteSaveStatus === 'saved' && "bg-atlas-success/10 text-atlas-success",
                    noteSaveStatus === 'idle' && "opacity-0"
                )}>
                    {noteSaveStatus === 'saving' ? 'Saving...' : noteSaveStatus === 'saved' ? '✓ Saved' : ''}
                </span>
            </div>
            {/* Notes Textarea */}
            <div className="flex-1 p-4 overflow-hidden">
                <textarea
                    value={noteContent}
                    onChange={(e) => onNoteChange(e.target.value)}
                    placeholder={"Write your notes about this video here...\n\nTips:\n• Summarize key points in your own words\n• Note timestamps for important sections\n• Write down questions to revisit later"}
                    className="w-full h-full bg-atlas-bg-tertiary/50 border border-atlas-border/50 rounded-xl p-4 text-sm text-atlas-text-primary placeholder-atlas-text-muted/50 focus:outline-none focus:border-atlas-gold/30 focus:ring-1 focus:ring-atlas-gold/20 transition-all resize-none font-body leading-relaxed"
                />
            </div>
        </div>
    );
}
