import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// Safely guard window.fetch to prevent TypeError: Cannot set property fetch of #<Window> which has only a getter
try {
  const fetchDesc = Object.getOwnPropertyDescriptor(window, 'fetch') || Object.getOwnPropertyDescriptor(Window.prototype, 'fetch');
  if (fetchDesc && (!fetchDesc.set || !fetchDesc.writable) && fetchDesc.configurable) {
    let internalFetch = window.fetch;
    Object.defineProperty(window, 'fetch', {
      get() {
        return internalFetch;
      },
      set(newFetch) {
        internalFetch = newFetch;
      },
      configurable: true,
      enumerable: true
    });
  }
} catch (e) {
  console.warn("Could not define fetch property setter guard:", e);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
