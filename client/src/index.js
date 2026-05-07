// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/calendar/sw.js').then(
            (registration) => {
                console.log('✅ ServiceWorker 등록 성공!', registration.scope);
            },
            (err) => {
                console.log('🚨 ServiceWorker 등록 실패: ', err);
            }
        );
    });
}