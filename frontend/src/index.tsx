import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Amplify } from 'aws-amplify';
import outputs from './amplify_outputs.json';

// Configure Amplify with Cognito authentication
Amplify.configure(outputs);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
