// global error handlers added as soon as possible, before React initialization
const setStaticText = (msg: string) => {
  const el = document.getElementById('static-debug');
  if (el) el.textContent = msg;
};
// indicate module execution
setStaticText('main.tsx executing');
console.debug('main.tsx loaded');

window.addEventListener('error', e => {
  const msg = 'Global runtime error: ' + (e.error || e.message);
  console.error(msg);
  setStaticText(msg as string);
});
window.addEventListener('unhandledrejection', e => {
  const msg = 'Unhandled promise rejection: ' + (e.reason ?? 'unknown');
  console.error(msg);
  setStaticText(msg as string);
});

import {StrictMode, Component, ErrorInfo, ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// simple error boundary to catch render-time errors and display them
class ErrorBoundary extends Component<{children: ReactNode}, {error: Error | null}> {
  // explicitly declare props so TypeScript knows they exist on instances
  props!: {children: ReactNode};
  // initialize state directly rather than in constructor to keep typings simple
  state: {error: Error | null} = { error: null };

  static getDerivedStateFromError(error: Error) {
    return {error};
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex items-center justify-center h-screen bg-zinc-950 text-white">
          <div className="p-8 bg-red-800 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Application Error</h2>
            <pre className="whitespace-pre-wrap">{this.state.error.toString()}</pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

try {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
  const staticEl = document.getElementById('static-debug');
  if (staticEl) staticEl.textContent = '';
} catch (err) {
  console.error('Error during React render:', err);
  const staticEl = document.getElementById('static-debug');
  if (staticEl) staticEl.textContent = 'React render error: ' + String(err);
}