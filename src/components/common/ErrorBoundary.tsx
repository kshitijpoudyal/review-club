import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

// Without this, an uncaught render error (e.g. a hook thrown outside its
// provider) unmounts the whole tree with no visible feedback — React's dev
// server keeps retrying the render in a tight loop, which looks exactly like
// a reload loop from the outside but is actually a silent crash. See the
// VendorsProvider/PaymentMethodsProvider fix in OnboardingPage.tsx for a real
// case this would have surfaced immediately instead of hours of guessing.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Uncaught render error:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#fbf9f3] px-4">
          <div className="max-w-md text-center space-y-3">
            <h1 className="text-lg font-semibold text-[#1b1c19]">Something went wrong</h1>
            <p className="text-sm text-[#74777f]">{this.state.error.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg bg-[#022448] text-white text-sm font-medium"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
