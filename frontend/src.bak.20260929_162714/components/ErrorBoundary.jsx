// ============================================================
// ErrorBoundary.jsx — catches render-time errors so the whole
// SPA does not go blank.
// ============================================================
import React from "react";
import { COLORS } from "../pages/dashboard/components/shared.js";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary] Render error:", error, info);
  }

  handleReload = () => {
    window.location.href = "/";
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{ background: COLORS.sand, minHeight: "100vh" }}
        className="flex items-center justify-center p-6"
      >
        <div className="max-w-md w-full text-center bg-white rounded-2xl border border-gray-100 p-8">
          <div
            style={{ background: `${COLORS.rust}15` }}
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <span style={{ color: COLORS.rust }} className="text-2xl font-bold">
              !
            </span>
          </div>
          <h1 className="text-xl font-bold text-primary mb-2">
            Kuna hitilafu imetokea / Something went wrong
          </h1>
          <p className="text-sm text-secondary mb-5 leading-relaxed">
            Samahani kwa usumbufu. Jaribu kurudisha ukurasa.
            <br />
            Sorry for the trouble. Try reloading the page.
          </p>

          {this.state.error?.message && (
            <pre
              style={{
                background: COLORS.sand,
                color: COLORS.rust,
                fontSize: "11px",
              }}
              className="text-left p-3 rounded-lg overflow-auto max-h-32 mb-4 whitespace-pre-wrap break-words"
            >
              {this.state.error.message}
            </pre>
          )}

          <div className="flex gap-2">
            <button
              onClick={this.handleReset}
              className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-secondary"
            >
              Jaribu tena / Retry
            </button>
            <button
              onClick={this.handleReload}
              style={{ background: COLORS.gold, color: COLORS.night }}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold"
            >
              Rudi Nyumbani / Home
            </button>
          </div>
        </div>
      </div>
    );
  }
}
