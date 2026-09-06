import React from 'react';
import {createRoot} from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import App from './App';
import './style.css';
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App/>
    <Analytics/>
  </React.StrictMode>
);
