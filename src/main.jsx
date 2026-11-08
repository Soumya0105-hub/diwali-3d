import React from 'react'
import {createRoot} from 'react-dom/client'
import App from './App.jsx'
import './styles.css'

class AppErrorBoundary extends React.Component {
  state = { error: null }
  static getDerivedStateFromError(error) { return { error } }
  componentDidCatch(error) { console.error('Diwali experience failed to render', error) }
  render() {
    if (this.state.error) {
      return <div className="error-screen" role="alert">
        <h1>We could not start the celebration</h1>
        <p>Please reload the page to try again.</p>
        <button type="button" onClick={() => location.reload()}>Reload celebration</button>
      </div>
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')).render(<AppErrorBoundary><App /></AppErrorBoundary>)
