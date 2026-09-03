import { Component, type ReactNode } from "react";

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 20, fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
          <h1 style={{ color: "#f4212e" }}>App crashed</h1>
          <p style={{ color: "#e7e9ea" }}>{this.state.error.message}</p>
          <p style={{ color: "#71767b", fontSize: 12 }}>{this.state.error.stack}</p>
        </div>
      );
    }
    return this.props.children;
  }
}
