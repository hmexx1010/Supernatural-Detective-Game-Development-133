import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React Error Boundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return React.createElement('div', {
        style: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: '#1e293b',
          color: '#e2e8f0',
          fontFamily: 'system-ui',
          padding: '2rem'
        }
      }, React.createElement('div', {
        style: { textAlign: 'center', maxWidth: '600px' }
      }, [
        React.createElement('h1', {
          key: 'title',
          style: { color: '#fbbf24', marginBottom: '1rem' }
        }, '🕵️ Supernatural Detective'),
        React.createElement('h2', {
          key: 'subtitle',
          style: { color: '#ef4444', marginBottom: '1rem' }
        }, 'Something went wrong'),
        React.createElement('p', {
          key: 'description',
          style: { marginBottom: '2rem' }
        }, 'The application encountered an unexpected error.'),
        React.createElement('button', {
          key: 'reload',
          onClick: () => window.location.reload(),
          style: {
            background: '#fbbf24',
            color: '#1e293b',
            padding: '0.75rem 1.5rem',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontWeight: 'bold',
            marginRight: '1rem'
          }
        }, 'Reload Page'),
        React.createElement('button', {
          key: 'clear',
          onClick: () => {
            localStorage.clear();
            sessionStorage.clear();
            window.location.reload();
          },
          style: {
            background: '#6366f1',
            color: 'white',
            padding: '0.75rem 1.5rem',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontWeight: 'bold'
          }
        }, 'Clear Cache & Reload')
      ]));
    }

    return this.props.children;
  }
}

// Initialize the app
const initializeApp = () => {
  try {
    const rootElement = document.getElementById('root');
    
    if (!rootElement) {
      console.error('Root element not found');
      return;
    }

    console.log('Initializing Supernatural Detective app...');

    const root = createRoot(rootElement);
    
    root.render(
      React.createElement(StrictMode, null,
        React.createElement(ErrorBoundary, null,
          React.createElement(App)
        )
      )
    );

    console.log('✅ Supernatural Detective app initialized successfully');

  } catch (error) {
    console.error('App initialization error:', error);
    
    // Fallback UI
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #1e293b; color: #e2e8f0; font-family: system-ui; padding: 2rem;">
          <div style="text-align: center; max-width: 600px;">
            <h1 style="color: #fbbf24; margin-bottom: 1rem;">🕵️ Supernatural Detective</h1>
            <h2 style="color: #ef4444; margin-bottom: 1rem;">Initialization Error</h2>
            <p style="margin-bottom: 1rem;">${error.message}</p>
            <p style="margin-bottom: 2rem;">Please try refreshing the page or check the browser console for more details.</p>
            <button onclick="window.location.reload()" style="background: #fbbf24; color: #1e293b; padding: 0.75rem 1.5rem; border: none; border-radius: 0.5rem; cursor: pointer; font-weight: bold;">
              Reload Application
            </button>
          </div>
        </div>
      `;
    }
  }
};

// Global error handlers
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  event.preventDefault();
});

window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}