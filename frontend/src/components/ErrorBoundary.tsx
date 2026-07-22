'use client'

import { Component, ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean; message: string }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(err: Error): State {
    return { hasError: true, message: err?.message || 'Something went wrong.' }
  }

  componentDidCatch(err: Error, info: any) {
    console.error('[ErrorBoundary]', err, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', fontFamily: 'sans-serif', background: '#f8faf8' }}>
          <div style={{ maxWidth: 480, textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🌿</div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a2e1a', marginBottom: 8 }}>Something went wrong</h1>
            <p style={{ color: '#666', fontSize: 14, marginBottom: 24 }}>We hit an unexpected error. Please refresh the page or go back to shopping.</p>
            <button
              onClick={() => window.location.reload()}
              style={{ background: 'linear-gradient(135deg,#1a3a2a,#3d7a5a)', color: '#fff', border: 'none', borderRadius: 50, padding: '12px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginRight: 8 }}
            >
              Refresh Page
            </button>
            <a
              href="/"
              style={{ display: 'inline-block', background: '#f0f7f0', color: '#1a2e1a', borderRadius: 50, padding: '12px 28px', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}
            >
              Go Home
            </a>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
