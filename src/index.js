import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import Landing from './Landing';
import Setup from './Setup';
import Legal from './Legal';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    this.setState({ info });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight:"100vh", background:"#060608", display:"flex", alignItems:"center", justifyContent:"center", padding:24, fontFamily:"monospace" }}>
          <div style={{ maxWidth:680, width:"100%", background:"rgba(200,60,60,0.07)", border:"1px solid rgba(200,60,60,0.3)", borderRadius:12, padding:24 }}>
            <div style={{ color:"#ff7070", fontWeight:700, fontSize:16, marginBottom:8 }}>Erreur de rendu</div>
            <div style={{ color:"rgba(255,255,255,0.5)", fontSize:12, marginBottom:12 }}>Copie ce message et envoie-le pour corriger le bug :</div>
            <pre style={{ color:"#ff9999", fontSize:11, overflowX:"auto", whiteSpace:"pre-wrap", lineHeight:1.6, background:"rgba(0,0,0,0.3)", padding:12, borderRadius:8 }}>
              {String(this.state.error)}
              {this.state.info?.componentStack ? "\n\nComponent Stack:" + this.state.info.componentStack : ""}
            </pre>
            <button onClick={() => window.location.reload()} style={{ marginTop:16, padding:"10px 20px", borderRadius:8, border:"none", background:"rgba(255,255,255,0.1)", color:"#fff", cursor:"pointer", fontSize:12 }}>
              Recharger
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/setup" element={<Setup />} />
        <Route path="/mentions-legales" element={<Legal />} />
        <Route path="/cgv" element={<Legal />} />
        <Route path="/confidentialite" element={<Legal />} />
        <Route path="/*" element={<App />} />
      </Routes>
    </ErrorBoundary>
  </BrowserRouter>
);
