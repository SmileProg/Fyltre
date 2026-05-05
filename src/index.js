import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import Landing from './Landing';
import Setup from './Setup';
import Legal from './Legal';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/setup" element={<Setup />} />
      <Route path="/mentions-legales" element={<Legal />} />
      <Route path="/cgv" element={<Legal />} />
      <Route path="/confidentialite" element={<Legal />} />
      <Route path="/*" element={<App />} />
    </Routes>
  </BrowserRouter>
);
