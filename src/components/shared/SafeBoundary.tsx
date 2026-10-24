import { Component, type ReactNode } from 'react';

/**
 * Isolates an optional visual layer. If it fails, the rest of the page still renders.
 */
export class SafeBoundary extends Component<{ children: ReactNode; fallback?: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    const root = typeof document !== 'undefined' ? document.body : null;
    root?.classList.remove('overflow-hidden');
    if (root) root.style.overflow = '';
  }

  render() {
    if (this.state.failed) return this.props.fallback ?? null;
    return this.props.children;
  }
}
