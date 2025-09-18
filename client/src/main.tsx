/**
 * Application Entry Point
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { SocketProvider } from '@/contexts/SocketContext';
import { store } from '@/store/store';
import { App } from './App';
import 'react-toastify/dist/ReactToastify.css';
import './globals.css';
// Ensure analytics service initializes early
import { analyticsService } from '@/services/analyticsService';

// Touch the service to trigger constructor side-effects (load + autosave)
void analyticsService;

// Get the root element
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find the root element');
}

// Create React root
const root = ReactDOM.createRoot(rootElement);

// Render the application with all providers
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <SocketProvider autoConnect={false}>
          <App />
        </SocketProvider>
      </ThemeProvider>
    </Provider>
  </React.StrictMode>
);
