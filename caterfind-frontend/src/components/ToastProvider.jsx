import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export const useToast = () => {
    return useContext(ToastContext);
};

let idCounter = 1;

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const show = useCallback((message, opts = {}) => {
        const id = idCounter++;
        const toast = { id, message, type: opts.type || 'info' };
        setToasts(t => [...t, toast]);
        const timeout = opts.duration || 4000;
        setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), timeout);
    }, []);

    const value = { show };

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div style={{ position: 'fixed', right: 16, top: 16, zIndex: 9999 }}>
                {toasts.map(t => (
                    <div key={t.id} style={{ marginBottom: 8, minWidth: 240, padding: '10px 14px', borderRadius: 8, background: t.type === 'error' ? '#fee2e2' : (t.type === 'success' ? '#d1fae5' : '#e6f0ff'), color: t.type === 'error' ? '#9b1c1c' : (t.type === 'success' ? '#065f46' : '#0f172a'), boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                        <div style={{ fontSize: 14 }}>{t.message}</div>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export default ToastProvider;
