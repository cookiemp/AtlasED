import { Component, type ReactNode } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("[ErrorBoundary] Caught error:", error, errorInfo);
    }

    handleReload = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    handleGoHome = () => {
        this.setState({ hasError: false, error: null });
        window.location.hash = "/";
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            return (
                <div className="h-screen bg-atlas-bg-primary text-atlas-text-primary flex items-center justify-center">
                    <div className="max-w-md text-center space-y-6">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-atlas-error/10 flex items-center justify-center">
                            <AlertCircle className="w-8 h-8 text-atlas-error" />
                        </div>
                        <div>
                            <h1 className="font-display text-2xl font-bold mb-2">Something went wrong</h1>
                            <p className="text-atlas-text-secondary text-sm leading-relaxed">
                                An unexpected error occurred. You can try reloading the page or going back to the dashboard.
                            </p>
                        </div>
                        {this.state.error && (
                            <div className="bg-atlas-bg-secondary border border-atlas-border rounded-xl p-4 text-left">
                                <p className="font-mono text-xs text-atlas-error break-all">
                                    {this.state.error.message}
                                </p>
                            </div>
                        )}
                        <div className="flex items-center justify-center gap-3">
                            <button
                                onClick={this.handleGoHome}
                                className="flex items-center gap-2 px-4 py-2.5 bg-atlas-bg-tertiary hover:bg-atlas-border text-atlas-text-secondary rounded-xl transition-colors text-sm font-medium"
                            >
                                <Home className="w-4 h-4" />
                                Dashboard
                            </button>
                            <button
                                onClick={this.handleReload}
                                className="flex items-center gap-2 px-4 py-2.5 bg-atlas-gold hover:bg-atlas-gold-hover text-atlas-bg-primary rounded-xl transition-colors text-sm font-bold"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Reload
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
