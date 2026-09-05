import React from 'react';
import { createRoot } from 'react-dom/client';
import Vector from './Vector.jsx';
class Boundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error) {
    console.error('VECTOR rendering error:', error);
  }
  render() {
    return this.state.failed ? (
      <main className="boot-error">
        <h1>The view could not be rendered.</h1>
        <p>
          The source data has not been changed. Reload the page, or use index-original.html from the
          archive.
        </p>
      </main>
    ) : (
      this.props.children
    );
  }
}
const data = window.__LLM_DATA__;
createRoot(document.getElementById('root')).render(
  <Boundary>
    <Vector data={data} />
  </Boundary>,
);
