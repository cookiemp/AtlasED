import { useState } from 'react';
import './QuizSection.css';

function QuizSection({ quiz, onComplete, onClose }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [results, setResults] = useState([]);
    const [showComplete, setShowComplete] = useState(false);

    const questions = quiz?.questions || [];
    const currentQuestion = questions[currentIndex];
    const totalQuestions = questions.length;
    const progress = Math.round(((currentIndex + 1) / totalQuestions) * 100);

    function handleOptionSelect(index) {
        if (isAnswered) return;
        setSelectedOption(index);
    }

    function handleSubmit() {
        if (selectedOption === null || isAnswered) return;

        const isCorrect = selectedOption === currentQuestion.correctAnswer;
        setIsAnswered(true);
        setResults(prev => [...prev, {
            questionIndex: currentIndex,
            isCorrect,
            selectedOption
        }]);
    }

    function handleNext() {
        if (currentIndex < totalQuestions - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedOption(null);
            setIsAnswered(false);
        } else {
            setShowComplete(true);
        }
    }

    function handleSkip() {
        setResults(prev => [...prev, {
            questionIndex: currentIndex,
            isCorrect: false,
            skipped: true
        }]);
        handleNext();
    }

    function getOptionClass(index) {
        let className = 'quiz-option';

        if (selectedOption === index && !isAnswered) {
            className += ' selected';
        }

        if (isAnswered) {
            className += ' disabled';
            if (index === currentQuestion.correctAnswer) {
                className += ' correct';
            } else if (selectedOption === index) {
                className += ' incorrect';
            }
        }

        return className;
    }

    function getCorrectCount() {
        return results.filter(r => r.isCorrect).length;
    }

    if (!quiz || questions.length === 0) {
        return (
            <div className="quiz-container">
                <div className="quiz-header">
                    <div className="quiz-header-top">
                        <div className="quiz-header-left">
                            <div className="quiz-header-icon">
                                <iconify-icon icon="lucide:brain-circuit"></iconify-icon>
                            </div>
                            <div>
                                <h2 className="quiz-header-title">Quiz Unavailable</h2>
                                <p className="quiz-header-subtitle">No questions available</p>
                            </div>
                        </div>
                        <button className="quiz-close-btn" onClick={onClose}>
                            <iconify-icon icon="lucide:x"></iconify-icon>
                        </button>
                    </div>
                </div>
                <div className="quiz-content" style={{ textAlign: 'center', padding: '3rem' }}>
                    <p style={{ color: '#a3a3a3' }}>Unable to load quiz questions.</p>
                </div>
            </div>
        );
    }

    if (showComplete) {
        const correctCount = getCorrectCount();
        const percentage = Math.round((correctCount / totalQuestions) * 100);

        return (
            <div className="quiz-container">
                <div className="quiz-complete">
                    <div className="quiz-complete-icon">
                        <iconify-icon icon="lucide:trophy"></iconify-icon>
                    </div>
                    <h2 className="quiz-complete-title">Quiz Complete!</h2>
                    <p className="quiz-complete-subtitle">You've finished the comprehension quiz</p>

                    <div className="quiz-score">
                        <div className="quiz-score-item">
                            <div className="quiz-score-value">{correctCount}/{totalQuestions}</div>
                            <div className="quiz-score-label">Correct</div>
                        </div>
                        <div className="quiz-score-item">
                            <div className="quiz-score-value">{percentage}%</div>
                            <div className="quiz-score-label">Score</div>
                        </div>
                    </div>

                    <div className="quiz-complete-actions">
                        <button className="quiz-retry-btn" onClick={() => {
                            setCurrentIndex(0);
                            setSelectedOption(null);
                            setIsAnswered(false);
                            setResults([]);
                            setShowComplete(false);
                        }}>
                            <iconify-icon icon="lucide:refresh-ccw"></iconify-icon>
                            Retry Quiz
                        </button>
                        <button className="quiz-done-btn" onClick={() => onComplete?.(results)}>
                            <iconify-icon icon="lucide:check"></iconify-icon>
                            Done
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

    return (
        <div className="quiz-container">
            {/* Header */}
            <div className="quiz-header">
                <div className="quiz-header-top">
                    <div className="quiz-header-left">
                        <div className="quiz-header-icon">
                            <iconify-icon icon="lucide:brain-circuit"></iconify-icon>
                        </div>
                        <div>
                            <h2 className="quiz-header-title">Comprehension Quiz</h2>
                            <p className="quiz-header-subtitle">Test your understanding</p>
                        </div>
                    </div>
                    <button className="quiz-close-btn" onClick={onClose}>
                        <iconify-icon icon="lucide:x"></iconify-icon>
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="quiz-progress">
                    <div className="quiz-progress-header">
                        <span className="quiz-progress-counter">
                            Question {currentIndex + 1}/{totalQuestions}
                        </span>
                        <span className="quiz-progress-percent">{progress}% complete</span>
                    </div>
                    <div className="quiz-progress-track">
                        <div
                            className="quiz-progress-fill"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Quiz Content */}
            <div className="quiz-content" key={currentIndex}>
                {/* Question Text */}
                <h3 className="quiz-question">{currentQuestion.question}</h3>

                {/* Code Context (if any) */}
                {currentQuestion.codeContext && (
                    <div className="quiz-code-context">
                        <div className="quiz-code-header">
                            <iconify-icon icon="lucide:code-2"></iconify-icon>
                            <span>Context</span>
                        </div>
                        <pre className="quiz-code-content">{currentQuestion.codeContext}</pre>
                    </div>
                )}

                {/* Options */}
                <div className="quiz-options">
                    {currentQuestion.options.map((option, index) => (
                        <button
                            key={index}
                            className={getOptionClass(index)}
                            onClick={() => handleOptionSelect(index)}
                            disabled={isAnswered}
                        >
                            <div className="quiz-radio"></div>
                            <div className="quiz-option-content">
                                <span className="quiz-option-letter">{letters[index]}.</span>
                                <span className="quiz-option-text">{option}</span>
                            </div>
                            {isAnswered && index === currentQuestion.correctAnswer && (
                                <iconify-icon icon="lucide:check" className="quiz-option-icon check"></iconify-icon>
                            )}
                            {isAnswered && selectedOption === index && index !== currentQuestion.correctAnswer && (
                                <iconify-icon icon="lucide:x" className="quiz-option-icon x"></iconify-icon>
                            )}
                        </button>
                    ))}
                </div>

                {/* Explanation Panel */}
                <div className={`quiz-explanation ${isAnswered ? 'visible' : ''}`}>
                    <div className="quiz-explanation-inner">
                        <div className="quiz-explanation-content">
                            <div className={`quiz-explanation-icon ${selectedOption === currentQuestion.correctAnswer ? 'correct' : 'incorrect'}`}>
                                <iconify-icon icon={selectedOption === currentQuestion.correctAnswer ? 'lucide:check-circle-2' : 'lucide:x-circle'}></iconify-icon>
                            </div>
                            <div>
                                <h4 className="quiz-explanation-title">
                                    {selectedOption === currentQuestion.correctAnswer ? 'Correct!' : 'Incorrect'}
                                </h4>
                                <p className="quiz-explanation-text">
                                    {currentQuestion.explanation ||
                                        (selectedOption === currentQuestion.correctAnswer
                                            ? 'Great job! You got it right.'
                                            : `The correct answer was ${letters[currentQuestion.correctAnswer]}. ${currentQuestion.options[currentQuestion.correctAnswer]}`
                                        )
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="quiz-footer">
                <button className="quiz-skip-btn" onClick={handleSkip} disabled={isAnswered}>
                    <iconify-icon icon="lucide:skip-forward"></iconify-icon>
                    Skip Question
                </button>

                <div className="quiz-footer-actions">
                    {!isAnswered ? (
                        <button
                            className="quiz-submit-btn"
                            onClick={handleSubmit}
                            disabled={selectedOption === null}
                        >
                            <span>Submit Answer</span>
                            <iconify-icon icon="lucide:check-circle"></iconify-icon>
                        </button>
                    ) : (
                        <button className="quiz-next-btn" onClick={handleNext}>
                            <span>{currentIndex < totalQuestions - 1 ? 'Next Question' : 'See Results'}</span>
                            <iconify-icon icon="lucide:arrow-right"></iconify-icon>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default QuizSection;
