import { useNavigate, useLocation } from 'react-router-dom';

// Icons as simple SVG components
const CompassIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88" />
    </svg>
);

const MinimizeIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

const MaximizeIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="5" y="5" width="14" height="14" rx="1" />
    </svg>
);

const CloseIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="6" y1="6" x2="18" y2="18" />
        <line x1="6" y1="18" x2="18" y2="6" />
    </svg>
);

const SettingsIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
);

const HomeIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
);

function TitleBar() {
    const navigate = useNavigate();
    const location = useLocation();

    async function handleMinimize() {
        if (window.atlased) {
            await window.atlased.window.minimize();
        }
    }

    async function handleMaximize() {
        if (window.atlased) {
            await window.atlased.window.maximize();
        }
    }

    async function handleClose() {
        if (window.atlased) {
            await window.atlased.window.close();
        }
    }

    return (
        <div className="titlebar">
            <div className="titlebar__logo" onClick={() => navigate('/')}>
                <CompassIcon />
                <span>ATLASED</span>
            </div>

            <div className="flex items-center gap-md" style={{ WebkitAppRegion: 'no-drag' }}>
                {/* Navigation */}
                <button
                    className={`btn btn--ghost btn--icon ${location.pathname === '/' ? 'text-gold' : ''}`}
                    onClick={() => navigate('/')}
                    title="Dashboard"
                >
                    <HomeIcon />
                </button>
                <button
                    className={`btn btn--ghost btn--icon ${location.pathname === '/settings' ? 'text-gold' : ''}`}
                    onClick={() => navigate('/settings')}
                    title="Settings"
                >
                    <SettingsIcon />
                </button>

                {/* Separator */}
                <div style={{ width: 1, height: 20, background: 'var(--border-color)', margin: '0 8px' }} />

                {/* Window Controls */}
                <div className="titlebar__controls">
                    <button className="titlebar__btn" onClick={handleMinimize} title="Minimize">
                        <MinimizeIcon />
                    </button>
                    <button className="titlebar__btn" onClick={handleMaximize} title="Maximize">
                        <MaximizeIcon />
                    </button>
                    <button className="titlebar__btn titlebar__btn--close" onClick={handleClose} title="Close">
                        <CloseIcon />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default TitleBar;
