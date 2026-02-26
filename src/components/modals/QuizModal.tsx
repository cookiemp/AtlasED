import { useState, useEffect } from "react";
import { X, BrainCircuit, Check, ArrowRight, SkipForward, CheckCircle, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogOverlay, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface QuizQuestion {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
  timestamp_seconds?: number;
}

export interface QuizResult {
  selectedIndex: number;
  isCorrect: boolean;
}

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (score: number, total: number) => void;
  /** Called when a single question is answered — used to track per-question results */
  onQuestionAnswered?: (question: QuizQuestion, selectedIndex: number, isCorrect: boolean) => void;
  questions: QuizQuestion[];
  waypointTitle?: string;
  /** If true, show the answer immediately (for reviewing completed quizzes) */
  reviewMode?: boolean;
  /** The previously selected answer index (for review mode) */
  previousAnswer?: number;
}

export function QuizModal({
  isOpen, onClose, onComplete, onQuestionAnswered,
  questions, waypointTitle, reviewMode = false, previousAnswer
}: QuizModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // Reset ALL state when the modal opens or questions change
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setIsCorrect(false);
      setCorrectCount(0);
      setIsFinished(false);

      if (reviewMode) {
        // In review mode, show the previous answer (which may be wrong)
        const prevIdx = previousAnswer ?? questions[0]?.correct_index ?? null;
        setSelectedOption(prevIdx);
        setAnswered(true);
        setIsCorrect(prevIdx === questions[0]?.correct_index);
      } else {
        setSelectedOption(null);
        setAnswered(false);
      }
    }
  }, [isOpen, questions, reviewMode, previousAnswer]);

  const question = questions[currentIndex];
  const totalQuestions = questions.length;
  const isSingleQuestion = totalQuestions === 1;
  const answeredCount = answered ? currentIndex + 1 : currentIndex;
  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  if (!question) return null;

  const handleSelectOption = (index: number) => {
    if (answered || reviewMode) return;
    setSelectedOption(index);
  };

  const handleSubmit = () => {
    if (selectedOption === null || answered) return;
    const correct = selectedOption === question.correct_index;
    setAnswered(true);
    setIsCorrect(correct);
    if (correct) setCorrectCount((prev) => prev + 1);
    // Report per-question result
    onQuestionAnswered?.(question, selectedOption, correct);
  };

  const handleNext = () => {
    if (currentIndex >= totalQuestions - 1) {
      if (isSingleQuestion) {
        onComplete?.(correctCount, totalQuestions);
        onClose();
      } else {
        setIsFinished(true);
        onComplete?.(correctCount, totalQuestions);
      }
    } else {
      setSelectedOption(null);
      setAnswered(false);
      setIsCorrect(false);
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleSkip = () => {
    if (currentIndex >= totalQuestions - 1) {
      if (isSingleQuestion) {
        onComplete?.(correctCount, totalQuestions);
        onClose();
      } else {
        setIsFinished(true);
        onComplete?.(correctCount, totalQuestions);
      }
    } else {
      setSelectedOption(null);
      setAnswered(false);
      setIsCorrect(false);
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleDismiss = () => {
    onClose();
  };

  const optionLabels = ["A", "B", "C", "D", "E", "F"];

  // In review mode, determine if the previous answer was correct
  const reviewWasCorrect = reviewMode && previousAnswer !== undefined && previousAnswer === question.correct_index;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogOverlay className="bg-black/60 backdrop-blur-sm" />
      <DialogContent
        className="animate-modal-enter max-w-2xl max-h-[85vh] p-0 bg-atlas-bg-secondary border-atlas-border rounded-2xl overflow-hidden flex flex-col"
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">Comprehension Quiz</DialogTitle>

        {isFinished ? (
          /* ── Completion Summary Screen ── */
          <div className="px-8 py-12 flex flex-col items-center text-center animate-fade-in">
            <div className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center mb-6",
              correctCount === totalQuestions ? "bg-atlas-success/10" : correctCount > 0 ? "bg-atlas-gold/10" : "bg-atlas-error/10"
            )}>
              {correctCount === totalQuestions ? (
                <CheckCircle className="w-10 h-10 text-atlas-success" />
              ) : (
                <BrainCircuit className="w-10 h-10 text-atlas-gold" />
              )}
            </div>
            <h2 className="font-display font-bold text-2xl text-atlas-text-primary mb-2">
              {correctCount === totalQuestions ? "Perfect Score!" : "Quiz Complete"}
            </h2>
            <p className="font-body text-lg text-atlas-text-secondary mb-2">
              You scored <span className="font-semibold text-atlas-gold">{correctCount}/{totalQuestions}</span>
            </p>
            <p className="font-body text-sm text-atlas-text-muted mb-8">
              {correctCount === totalQuestions
                ? "Outstanding! You've mastered this material."
                : correctCount > totalQuestions / 2
                  ? "Good work! Keep reviewing to improve."
                  : "Consider re-watching the relevant sections."}
            </p>
            <button
              onClick={onClose}
              className="px-8 py-3 bg-atlas-gold hover:bg-atlas-gold-hover text-atlas-bg-primary font-display font-semibold text-sm rounded-xl transition-all"
            >
              Continue Learning
            </button>
          </div>
        ) : (
          /* ── Quiz Question Screen ── */
          <>
            {/* Header - Fixed */}
            <div className="px-8 pt-8 pb-6 border-b border-atlas-border flex-shrink-0">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    reviewMode
                      ? reviewWasCorrect ? "bg-atlas-success/10" : "bg-atlas-error/10"
                      : "bg-atlas-gold/10"
                  )}>
                    {reviewMode ? (
                      reviewWasCorrect
                        ? <CheckCircle className="w-5 h-5 text-atlas-success" />
                        : <XCircle className="w-5 h-5 text-atlas-error" />
                    ) : (
                      <BrainCircuit className="w-5 h-5 text-atlas-gold" />
                    )}
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-xl text-atlas-text-primary">
                      {reviewMode ? "Quiz Review" : "Comprehension Quiz"}
                    </h2>
                    <p className="font-body text-sm text-atlas-text-muted">
                      {reviewMode
                        ? reviewWasCorrect ? "You answered this correctly!" : "You answered this incorrectly"
                        : waypointTitle ? `Testing: ${waypointTitle}` : "Test your understanding"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDismiss}
                  className="w-8 h-8 rounded-lg hover:bg-atlas-bg-tertiary flex items-center justify-center transition-colors"
                >
                  <X className="w-[18px] h-[18px] text-atlas-text-secondary" />
                </button>
              </div>

              {/* Progress Bar — hide for single question */}
              {!isSingleQuestion && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-display font-medium text-sm text-atlas-gold">
                      Question {currentIndex + 1}/{totalQuestions}
                    </span>
                    <span className="font-body text-sm text-atlas-text-muted">{Math.round(progress)}% complete</span>
                  </div>
                  <div className="h-1.5 bg-atlas-bg-tertiary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-atlas-gold rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Quiz Content - Scrollable */}
            <div className="px-8 py-6 animate-fade-in flex-1 overflow-y-auto modal-scrollbar">
              <h3 className="font-display font-semibold text-lg text-atlas-text-primary leading-relaxed mb-6">
                {question.question}
              </h3>

              {/* Options */}
              <div className="space-y-3 mb-6">
                {question.options.map((optionText, index) => {
                  const isSelected = selectedOption === index;
                  const isCorrectOption = index === question.correct_index;
                  const showCorrect = answered && isCorrectOption;
                  const showIncorrect = answered && isSelected && !isCorrectOption;

                  return (
                    <button
                      key={`${optionLabels[index]}-${optionText.slice(0, 30)}`}
                      onClick={() => handleSelectOption(index)}
                      disabled={answered || reviewMode}
                      className={cn(
                        "quiz-option w-full text-left p-4 rounded-xl border bg-atlas-bg-primary flex items-center gap-4 disabled:cursor-not-allowed transition-all",
                        isSelected && !answered && "selected",
                        showCorrect && "correct",
                        showIncorrect && "incorrect",
                        !isSelected && !showCorrect && !showIncorrect && "border-atlas-border"
                      )}
                    >
                      <div className={cn(
                        "relative w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all",
                        isSelected && !answered && "border-atlas-gold bg-atlas-gold",
                        showCorrect && "border-atlas-success bg-atlas-success",
                        showIncorrect && "border-atlas-error bg-atlas-error",
                        !isSelected && !showCorrect && !showIncorrect && "border-atlas-text-muted"
                      )}>
                        {(isSelected || showCorrect) && (
                          <span className="absolute inset-0 flex items-center justify-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-atlas-bg-primary" />
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <span className="font-mono text-sm text-atlas-gold font-medium mr-2">{optionLabels[index]}.</span>
                        <span className="font-body text-atlas-text-primary">{optionText}</span>
                      </div>
                      {showCorrect && <Check className="w-[18px] h-[18px] text-atlas-success" />}
                      {showIncorrect && <X className="w-[18px] h-[18px] text-atlas-error" />}
                    </button>
                  );
                })}
              </div>

              {/* Explanation Panel */}
              {answered && (
                <div className="mb-6 animate-fade-in">
                  <div className="bg-atlas-bg-primary rounded-xl p-5 border border-atlas-border">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
                        isCorrect || (reviewMode && reviewWasCorrect) ? "bg-atlas-success/10" : "bg-atlas-error/10"
                      )}>
                        {isCorrect || (reviewMode && reviewWasCorrect) ? (
                          <CheckCircle className="w-5 h-5 text-atlas-success" />
                        ) : (
                          <XCircle className="w-5 h-5 text-atlas-error" />
                        )}
                      </div>
                      <div>
                        <h4 className={cn(
                          "font-display font-semibold mb-2",
                          isCorrect || (reviewMode && reviewWasCorrect) ? "text-atlas-success" : "text-atlas-error"
                        )}>
                          {reviewMode
                            ? reviewWasCorrect ? "You got this right!" : "You got this wrong"
                            : isCorrect ? "Correct!" : "Not quite right"}
                        </h4>
                        <p className="font-body text-sm text-atlas-text-secondary leading-relaxed">
                          {question.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer - Fixed */}
            <div className="px-8 py-5 border-t border-atlas-border flex items-center justify-between flex-shrink-0">
              {reviewMode ? (
                <>
                  <div />
                  <button
                    onClick={onClose}
                    className="px-6 py-2.5 bg-atlas-bg-tertiary hover:bg-atlas-border text-atlas-text-primary font-display font-semibold text-sm rounded-xl transition-all flex items-center gap-2"
                  >
                    <span>Close</span>
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleSkip}
                    className="font-body text-sm text-atlas-text-muted hover:text-atlas-text-secondary transition-colors flex items-center gap-2"
                  >
                    <SkipForward className="w-4 h-4" />
                    Skip Question
                  </button>

                  <div className="flex items-center gap-3">
                    {!answered ? (
                      <button
                        onClick={handleSubmit}
                        disabled={selectedOption === null}
                        className="px-6 py-2.5 bg-atlas-gold hover:bg-atlas-gold-hover disabled:bg-atlas-bg-tertiary disabled:text-atlas-text-muted text-atlas-bg-primary font-display font-semibold text-sm rounded-xl transition-all disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <span>Submit Answer</span>
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={handleNext}
                        className="px-6 py-2.5 bg-atlas-gold hover:bg-atlas-gold-hover text-atlas-bg-primary font-display font-semibold text-sm rounded-xl transition-all flex items-center gap-2"
                      >
                        <span>{isSingleQuestion ? "Done" : currentIndex >= totalQuestions - 1 ? "See Results" : "Next Question"}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
