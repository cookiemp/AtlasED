import { useState } from 'react';

const KeyIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
);

const SparkleIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l1.912 5.813L20 10.5l-6.088 1.687L12 18l-1.912-5.813L4 10.5l6.088-1.687z" />
        <path d="M5 3l.7 2.1L8 6l-2.3.9L5 9l-.7-2.1L2 6l2.3-.9z" />
        <path d="M19 17l.7 2.1L22 20l-2.3.9-.7 2.1-.7-2.1L16 20l2.3-.9z" />
    </svg>
);

const CheckCircleIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
);

const LoaderIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
);

function ApiKeyModal({ onClose, onSaved, isRequired = false }) {
    const [apiKey, setApiKey] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [error, setError] = useState('');
    const [isValid, setIsValid] = useState(false);

    async function validateApiKey(key) {
        // Simple validation: test the API with a minimal request
        try {
            const response = await fetch(
                'https://generativelanguage.googleapis.com/v1beta/models',
                {
                    headers: {
                        'x-goog-api-key': key,
                    }
                }
            );
            return response.ok;
        } catch {
            return false;
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (!apiKey.trim()) {
            setError('Please enter an API key');
            return;
        }

        setIsValidating(true);
        setError('');

        try {
            const valid = await validateApiKey(apiKey);

            if (valid) {
                setIsValid(true);
                // Save the API key
                if (window.atlased) {
                    await window.atlased.settings.set('gemini_api_key', apiKey);
                }
                // Wait a moment to show success state
                setTimeout(() => {
                    onSaved();
                }, 1000);
            } else {
                setError('Invalid API key. Please check and try again.');
            }
        } catch {
            setError('Failed to validate API key. Please check your internet connection.');
        } finally {
            setIsValidating(false);
        }
    }

    return (
        <div className="modal-overlay">
            <div className="modal" style={{ maxWidth: '450px' }}>
                <div className="modal__body" style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
                    {/* Icon */}
                    <div style={{
                        width: 80,
                        height: 80,
                        borderRadius: 'var(--radius-full)',
                        background: 'linear-gradient(135deg, rgba(245, 166, 35, 0.2), rgba(245, 166, 35, 0.05))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto var(--space-lg)',
                        color: 'var(--accent-gold)'
                    }}>
                        {isValid ? <CheckCircleIcon /> : <SparkleIcon />}
                    </div>

                    {/* Title */}
                    <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, marginBottom: 'var(--space-sm)' }}>
                        {isValid ? 'You\'re All Set!' : 'Welcome to Atlased'}
                    </h2>

                    <p className="text-secondary" style={{ marginBottom: 'var(--space-xl)' }}>
                        {isValid
                            ? 'Your API key has been verified. Let\'s start learning!'
                            : 'To unlock AI-powered learning features, please add your free Gemini API key.'
                        }
                    </p>

                    {!isValid && (
                        <form onSubmit={handleSubmit}>
                            <div className="input-group mb-lg" style={{ textAlign: 'left' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <KeyIcon style={{ width: 16, height: 16 }} />
                                    Gemini API Key
                                </label>
                                <input
                                    type="password"
                                    className="input input--lg"
                                    placeholder="AIza..."
                                    value={apiKey}
                                    onChange={e => setApiKey(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            {error && (
                                <div style={{
                                    padding: 'var(--space-sm) var(--space-md)',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    borderRadius: 'var(--radius-md)',
                                    color: 'var(--accent-red)',
                                    fontSize: 'var(--font-size-sm)',
                                    marginBottom: 'var(--space-lg)'
                                }}>
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                className="btn btn--primary btn--lg"
                                style={{ width: '100%' }}
                                disabled={isValidating}
                            >
                                {isValidating ? (
                                    <>
                                        <LoaderIcon />
                                        Validating...
                                    </>
                                ) : (
                                    'Continue'
                                )}
                            </button>

                            <p style={{
                                fontSize: 'var(--font-size-xs)',
                                color: 'var(--text-tertiary)',
                                marginTop: 'var(--space-lg)'
                            }}>
                                Don't have an API key?{' '}
                                <a
                                    href="https://aistudio.google.com/apikey"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: 'var(--accent-gold)' }}
                                >
                                    Get one free from Google AI Studio
                                </a>
                            </p>

                            {!isRequired && (
                                <button
                                    type="button"
                                    className="btn btn--ghost mt-md"
                                    onClick={onClose}
                                    style={{ width: '100%' }}
                                >
                                    Skip for now
                                </button>
                            )}
                        </form>
                    )}
                </div>
            </div>

            <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}

export default ApiKeyModal;
