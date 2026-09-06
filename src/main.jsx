import React from 'react';
import { createRoot } from 'react-dom/client';
import Vector from './Vector.jsx';
import './vector.css';
import './audit.css';

class Boundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error) { console.error('VECTOR rendering error:', error); }
  render() {
    if (this.state.failed) return <LoadError message="The interface could not render this dataset." />;
    return this.props.children;
  }
}
function LoadError({ message }) {
  return <main className="audit-load-error" role="alert"><h1>Solthara could not start</h1><p>{message}</p><p>Keep index.html, all-configs.js and assets/ together, or open Solthara-VECTOR-v2.html for the standalone edition.</p><button onClick={() => window.location.reload()}>Reload</button></main>;
}
function AuditNotice({ audit }) {
  if (!audit) return null;
  return <aside className="audit-notice" aria-label="Dataset review scope"><strong>Scoped data corrections · {audit.checked_on}</strong><span> Only documented fields were reviewed. This is not a fully verified catalog; original raw configurations are preserved.</span></aside>;
}
function App() {
  const data = window.__LLM_DATA__;
  const models = Array.isArray(data?.models) ? data.models : (data?.models && typeof data.models === 'object' ? Object.values(data.models) : []);
  if (!data || !models.length) return <LoadError message="The dataset is missing, invalid, or empty. No models have been silently substituted." />;
  return <><AuditNotice audit={data._solthara_audit} /><Vector data={data} /></>;
}
const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element.');
createRoot(root).render(<Boundary><App /></Boundary>);
