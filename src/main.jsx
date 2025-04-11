// index.js or main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, HashRouter } from 'react-router-dom';
import App from './App';
import UpdateResolution from './UpdateResolution'; // you'll create this
import Steps from './Steps';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <HashRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/update-resolution" element={<UpdateResolution />} />
      <Route path='/update-resolution/json-steps' element={<Steps />} />
    </Routes>
  </HashRouter>
);
