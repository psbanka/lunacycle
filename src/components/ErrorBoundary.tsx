import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";


interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

function Content() {
  return (
    <div>
      <h1>Something went wrong.</h1>
      <Button onClick={() => localStorage.clear()}>Try this</Button>
    </div>
  );
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return <Content />
    }

    return this.props.children;
  }
}

export default ErrorBoundary;