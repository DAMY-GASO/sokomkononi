import React from "react";
import { Button } from "./ui";

export default class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null, clearing: false }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error("[ErrorBoundary]", error, info); }
  handleReload = () => { window.location.href = "/"; };
  handleRetry  = () => { window.location.reload(); };
  handleClear  = () => {
    this.setState({ clearing: true });
    try {
      const kill = [];
      for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith("sokomkononi_")) kill.push(k); }
      kill.forEach((k) => localStorage.removeItem(k));
      sessionStorage.clear();
    } catch {}
    window.location.href = "/";
  };
  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen grid place-items-center p-6 bg-[color:rgb(var(--c-page))]">
        <div className="max-w-md w-full text-center card p-8">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-[rgb(193,80,46,0.12)]">
            <span className="text-2xl font-bold text-[#C1502E]">!</span>
          </div>
          <h1 className="text-[17px] font-semibold text-primary mb-2">Kuna hitilafu imetokea / Something went wrong</h1>
          <p className="text-sm text-secondary mb-5 leading-relaxed">Samahani kwa usumbufu. Jaribu kurudisha ukurasa, au safisha data ya mfumo.<br />Sorry for the trouble. Reload, or clear app data.</p>
          {this.state.error?.message && (
            <pre className="text-left p-3 rounded-lg overflow-auto max-h-32 mb-4 whitespace-pre-wrap break-words bg-[color:rgb(var(--c-page))] text-[11px] text-[#C1502E]">{this.state.error.message}</pre>
          )}
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={this.handleRetry}>Jaribu tena / Retry</Button>
              <Button variant="primary" className="flex-1" onClick={this.handleReload}>Rudi Nyumbani</Button>
            </div>
            <Button variant="ghost" className="w-full text-xs" onClick={this.handleClear} disabled={this.state.clearing}>
              {this.state.clearing ? "Inasafisha…" : "Safisha data na anza upya"}
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
