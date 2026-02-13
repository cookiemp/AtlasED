import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Settings.css';

function Settings() {
    const navigate = useNavigate();
    const [settings, setSettings] = useState({
        apiKey: '',
        autoFieldGuide: true,
        autoQuiz: true,
        enableSRS: true,
        darkMode: true,
        playbackSpeed: 1.0
    });
    const [showApiKey, setShowApiKey] = useState(false);
    const [validationStatus, setValidationStatus] = useState(null); // 'success', 'error', null
    const [isValidating, setIsValidating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    async function loadSettings() {
        try {
            if (window.atlased) {
                const saved = await window.atlased.settings.get();
                if (saved) {
                    setSettings(prev => ({
                        ...prev,
                        ...saved
                    }));
                }
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    function handleChange(key, value) {
        setSettings(prev => ({
            ...prev,
            [key]: value
        }));
        setHasChanges(true);
    }

    async function validateApiKey() {
        if (!settings.apiKey) {
            setValidationStatus('error');
            return;
        }

        setIsValidating(true);
        setValidationStatus(null);

        try {
            if (window.atlased) {
                const isValid = await window.atlased.ai.validateApiKey(settings.apiKey);
                setValidationStatus(isValid ? 'success' : 'error');
            }
        } catch (error) {
            console.error('Error validating API key:', error);
            setValidationStatus('error');
        } finally {
            setIsValidating(false);
        }
    }

    async function saveSettings() {
        setIsSaving(true);
        try {
            if (window.atlased) {
                await window.atlased.settings.save(settings);
                setHasChanges(false);
            }
        } catch (error) {
            console.error('Error saving settings:', error);
        } finally {
            setIsSaving(false);
        }
    }

    const playbackSpeeds = [0.75, 1.0, 1.25, 1.5];

    return (
        <div className="settings-page">
            {/* Header / Title Bar */}
            <header className="settings-header">
                <div className="settings-header-left">
                    <button className="back-btn" onClick={() => navigate(-1)}>
                        <iconify-icon icon="lucide:arrow-left"></iconify-icon>
                    </button>
                    <div className="settings-logo">
                        <div className="settings-logo-icon">
                            <iconify-icon icon="lucide:compass"></iconify-icon>
                        </div>
                        <span className="settings-logo-text">AtlasED</span>
                    </div>
                </div>
                <div className="settings-header-right">
                    <div className="settings-icon-active">
                        <iconify-icon icon="lucide:settings"></iconify-icon>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="settings-main">
                {/* Page Header */}
                <div className="settings-page-header">
                    <h1 className="settings-title">Settings</h1>
                    <p className="settings-subtitle">Configure your AtlasED experience and learning preferences</p>
                </div>

                <form className="settings-form" onSubmit={(e) => e.preventDefault()}>
                    {/* API Configuration Section */}
                    <section className="settings-section">
                        <div className="section-header">
                            <div className="section-header-content">
                                <div className="section-icon">
                                    <iconify-icon icon="lucide:key"></iconify-icon>
                                </div>
                                <div>
                                    <h2 className="section-title">API Configuration</h2>
                                    <p className="section-subtitle">Connect to Gemini AI for enhanced learning features</p>
                                </div>
                            </div>
                        </div>
                        <div className="section-content">
                            <div className="input-group">
                                <label className="input-label">Gemini API Key</label>
                                <div className="input-wrapper">
                                    <input
                                        type={showApiKey ? 'text' : 'password'}
                                        className="input-field"
                                        placeholder="Enter your Gemini API key"
                                        value={settings.apiKey}
                                        onChange={(e) => handleChange('apiKey', e.target.value)}
                                    />
                                    <div className="input-actions">
                                        <button
                                            type="button"
                                            className="input-btn"
                                            onClick={() => setShowApiKey(!showApiKey)}
                                        >
                                            <iconify-icon icon={showApiKey ? 'lucide:eye-off' : 'lucide:eye'}></iconify-icon>
                                        </button>
                                        <button
                                            type="button"
                                            className="validate-btn"
                                            onClick={validateApiKey}
                                            disabled={isValidating}
                                        >
                                            {isValidating ? 'Checking...' : 'Validate'}
                                        </button>
                                    </div>
                                </div>
                                <p className="input-hint">
                                    Your API key is stored locally and never shared. <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer">Get an API key</a>
                                </p>

                                {validationStatus === 'success' && (
                                    <div className="validation-message success">
                                        <iconify-icon icon="lucide:check-circle"></iconify-icon>
                                        <span>API key validated successfully</span>
                                    </div>
                                )}
                                {validationStatus === 'error' && (
                                    <div className="validation-message error">
                                        <iconify-icon icon="lucide:alert-circle"></iconify-icon>
                                        <span>Invalid API key. Please check and try again.</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Learning Preferences Section */}
                    <section className="settings-section">
                        <div className="section-header">
                            <div className="section-header-content">
                                <div className="section-icon">
                                    <iconify-icon icon="lucide:sliders-horizontal"></iconify-icon>
                                </div>
                                <div>
                                    <h2 className="section-title">Learning Preferences</h2>
                                    <p className="section-subtitle">Customize how AtlasED enhances your learning</p>
                                </div>
                            </div>
                        </div>
                        <div className="section-content">
                            <div className="toggle-list">
                                <div className="toggle-item">
                                    <div className="toggle-info">
                                        <h3 className="toggle-title">Auto-generate Field Guides</h3>
                                        <p className="toggle-description">Automatically create comprehensive notes from video content</p>
                                    </div>
                                    <div
                                        className={`toggle-switch ${settings.autoFieldGuide ? 'active' : ''}`}
                                        onClick={() => handleChange('autoFieldGuide', !settings.autoFieldGuide)}
                                    >
                                        <div className="toggle-switch-handle"></div>
                                    </div>
                                </div>

                                <div className="toggle-divider"></div>

                                <div className="toggle-item">
                                    <div className="toggle-info">
                                        <h3 className="toggle-title">Show Comprehension Quizzes</h3>
                                        <p className="toggle-description">Pause videos to test understanding at key moments</p>
                                    </div>
                                    <div
                                        className={`toggle-switch ${settings.autoQuiz ? 'active' : ''}`}
                                        onClick={() => handleChange('autoQuiz', !settings.autoQuiz)}
                                    >
                                        <div className="toggle-switch-handle"></div>
                                    </div>
                                </div>

                                <div className="toggle-divider"></div>

                                <div className="toggle-item">
                                    <div className="toggle-info">
                                        <h3 className="toggle-title">Enable Spaced Repetition</h3>
                                        <p className="toggle-description">Schedule Memory Checkpoints for optimal retention</p>
                                    </div>
                                    <div
                                        className={`toggle-switch ${settings.enableSRS ? 'active' : ''}`}
                                        onClick={() => handleChange('enableSRS', !settings.enableSRS)}
                                    >
                                        <div className="toggle-switch-handle"></div>
                                    </div>
                                </div>

                                <div className="toggle-divider"></div>

                                <div className="toggle-item">
                                    <div className="toggle-info">
                                        <h3 className="toggle-title">Dark Mode</h3>
                                        <p className="toggle-description">Use dark theme throughout the application</p>
                                    </div>
                                    <div
                                        className={`toggle-switch ${settings.darkMode ? 'active' : ''}`}
                                        onClick={() => handleChange('darkMode', !settings.darkMode)}
                                    >
                                        <div className="toggle-switch-handle"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Playback Speed Section */}
                    <section className="settings-section">
                        <div className="section-header">
                            <div className="section-header-content">
                                <div className="section-icon">
                                    <iconify-icon icon="lucide:play"></iconify-icon>
                                </div>
                                <div>
                                    <h2 className="section-title">Default Playback Speed</h2>
                                    <p className="section-subtitle">Set your preferred video playback speed</p>
                                </div>
                            </div>
                        </div>
                        <div className="section-content">
                            <div className="radio-grid">
                                {playbackSpeeds.map((speed) => (
                                    <div
                                        key={speed}
                                        className={`radio-option ${settings.playbackSpeed === speed ? 'selected' : ''}`}
                                        onClick={() => handleChange('playbackSpeed', speed)}
                                    >
                                        <div className="radio-option-content">
                                            <span className="radio-option-value">{speed}x</span>
                                            <div className="radio-option-dot"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Data & Privacy Section */}
                    <section className="settings-section">
                        <div className="section-header">
                            <div className="section-header-content">
                                <div className="section-icon">
                                    <iconify-icon icon="lucide:shield"></iconify-icon>
                                </div>
                                <div>
                                    <h2 className="section-title">Data & Privacy</h2>
                                    <p className="section-subtitle">Manage your data and account settings</p>
                                </div>
                            </div>
                        </div>
                        <div className="section-content">
                            <div className="data-actions">
                                <button type="button" className="data-action-btn">
                                    <div className="data-action-left">
                                        <div className="data-action-icon">
                                            <iconify-icon icon="lucide:download"></iconify-icon>
                                        </div>
                                        <span className="data-action-title">Export Learning Data</span>
                                    </div>
                                    <iconify-icon icon="lucide:chevron-right" className="data-action-arrow"></iconify-icon>
                                </button>

                                <button type="button" className="data-action-btn">
                                    <div className="data-action-left">
                                        <div className="data-action-icon">
                                            <iconify-icon icon="lucide:rotate-ccw"></iconify-icon>
                                        </div>
                                        <span className="data-action-title">Reset All Progress</span>
                                    </div>
                                    <iconify-icon icon="lucide:chevron-right" className="data-action-arrow"></iconify-icon>
                                </button>

                                <button type="button" className="data-action-btn danger">
                                    <div className="data-action-left">
                                        <div className="data-action-icon danger">
                                            <iconify-icon icon="lucide:trash-2"></iconify-icon>
                                        </div>
                                        <span className="data-action-title">Delete All Data</span>
                                    </div>
                                    <iconify-icon icon="lucide:chevron-right" className="data-action-arrow"></iconify-icon>
                                </button>
                            </div>
                        </div>
                    </section>
                </form>
            </main>

            {/* Footer */}
            <footer className="settings-footer">
                <button
                    type="button"
                    className="footer-btn secondary"
                    onClick={() => navigate(-1)}
                >
                    Cancel
                </button>
                <button
                    type="button"
                    className="footer-btn primary"
                    onClick={saveSettings}
                    disabled={!hasChanges || isSaving}
                >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
            </footer>
        </div>
    );
}

export default Settings;
