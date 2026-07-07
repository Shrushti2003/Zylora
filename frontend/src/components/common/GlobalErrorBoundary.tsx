import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

type GlobalErrorBoundaryState = {
  hasError: boolean;
};

export class GlobalErrorBoundary extends Component<{ children: ReactNode }, GlobalErrorBoundaryState> {
  state: GlobalErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Zylora render error", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="botanical-page error-page-shell">
          <section className="organic-shell error-state-card">
            <AlertTriangle className="h-10 w-10 text-secondary" />
            <span className="botanical-eyebrow">500</span>
            <h1>Something went wrong.</h1>
            <p>Refresh the page or return home. If this continues, report a technical issue from the Support Center.</p>
            <a className="organic-button primary" href="/">Return home</a>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
