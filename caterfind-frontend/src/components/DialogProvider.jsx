import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BadgeCheck, Sparkles, X } from 'lucide-react';
import Modal from './Modal';

const DialogContext = createContext({
  showAlert: async () => {},
  showConfirm: async () => false
});

export function DialogProvider({ children }) {
  const [queue, setQueue] = useState([]);
  const [activeDialog, setActiveDialog] = useState(null);

  const enqueueDialog = useCallback((dialog) => {
    return new Promise((resolve) => {
      setQueue((prev) => [...prev, { ...dialog, resolve }]);
    });
  }, []);

  useEffect(() => {
    if (activeDialog || queue.length === 0) {
      return;
    }

    const [nextDialog, ...restQueue] = queue;
    setActiveDialog(nextDialog);
    setQueue(restQueue);
  }, [activeDialog, queue]);

  const closeDialog = useCallback((result) => {
    if (activeDialog?.resolve) {
      activeDialog.resolve(result);
    }
    setActiveDialog(null);
  }, [activeDialog]);

  const showAlert = useCallback((message, options = {}) => {
    return enqueueDialog({
      type: 'alert',
      title: options.title || 'Notice',
      message: String(message || ''),
      confirmText: options.confirmText || 'OK'
    });
  }, [enqueueDialog]);

  const showConfirm = useCallback((message, options = {}) => {
    return enqueueDialog({
      type: 'confirm',
      title: options.title || 'Confirm Action',
      message: String(message || ''),
      confirmText: options.confirmText || 'Confirm',
      cancelText: options.cancelText || 'Cancel'
    });
  }, [enqueueDialog]);

  useEffect(() => {
    const nativeAlert = window.alert;
    const nativeConfirm = window.confirm;

    window.alert = (message) => {
      showAlert(message, { title: 'Notice', confirmText: 'OK' });
    };

    // confirm() is synchronous by browser design. Route legacy calls to async themed dialog and return false.
    window.confirm = (message) => {
      showConfirm(message, { title: 'Confirm Action', confirmText: 'Confirm', cancelText: 'Cancel' });
      return false;
    };

    return () => {
      window.alert = nativeAlert;
      window.confirm = nativeConfirm;
    };
  }, [showAlert, showConfirm]);

  const value = useMemo(() => ({ showAlert, showConfirm }), [showAlert, showConfirm]);
  const isConfirmDialog = activeDialog?.type === 'confirm';
  const dialogIcon = isConfirmDialog ? AlertTriangle : BadgeCheck;
  const dialogAccent = {
    iconWrap: 'bg-sky-50 text-sky-600 border-sky-200',
    primaryButton: 'bg-sky-500 hover:bg-sky-600 focus-visible:ring-sky-400',
    ribbon: 'from-sky-50 via-transparent to-transparent'
  };

  // When a dialog is active, allow Enter to confirm the dialog (useful for keyboard users)
  useEffect(() => {
    if (!activeDialog) return;
    const onKey = (e) => {
      if (e.key === 'Enter') {
        // Confirm by default on Enter
        closeDialog(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeDialog, closeDialog]);

  return (
    <DialogContext.Provider value={value}>
      {children}

      <Modal
        isOpen={Boolean(activeDialog)}
        onClose={() => closeDialog(false)}
        title={null}
        showHeader={false}
        applyDesktopSidebarOffset={false}
        className="max-w-xl w-full !bg-transparent !border-0 !shadow-none !p-0 overflow-visible"
      >
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_70px_rgba(2,6,23,0.18)]">
          <div className={`absolute inset-x-0 top-0 h-16 bg-gradient-to-r ${dialogAccent.ribbon} pointer-events-none`} />
          <div className="absolute -top-10 -right-10 h-28 w-28 rounded-full bg-slate-100/70 blur-xl pointer-events-none" />

          <button
            type="button"
            className="absolute top-4 right-4 h-9 w-9 rounded-full border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors flex items-center justify-center z-20 pointer-events-auto"
            onClick={() => closeDialog(false)}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>

          <div className="relative px-6 pt-6 pb-2 flex items-start gap-4">
            <div className={`h-12 w-12 rounded-xl border flex items-center justify-center ${dialogAccent.iconWrap}`}>
              {React.createElement(dialogIcon, { size: 24, strokeWidth: 2.2 })}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs tracking-[0.18em] uppercase font-semibold text-slate-500 flex items-center gap-1.5">
                <Sparkles size={12} />
                CaterFind
              </p>
              <h3 className="text-2xl font-extrabold text-slate-900 leading-tight mt-1">
                {activeDialog?.title || 'Notice'}
              </h3>
            </div>
          </div>

          <div className="relative px-6 pb-6">
            <p className="text-slate-700 text-base leading-relaxed mb-6">
              {activeDialog?.message || ''}
            </p>

            <div className="flex items-center justify-end gap-3">
            {activeDialog?.type === 'confirm' && (
              <button
                type="button"
                className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold shadow-sm hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                onClick={() => closeDialog(false)}
              >
                {activeDialog?.cancelText || 'Cancel'}
              </button>
            )}
            <button
              type="button"
              className={`px-5 py-2.5 rounded-xl text-white font-semibold shadow-sm transition-colors focus:outline-none focus-visible:ring-2 ${dialogAccent.primaryButton}`}
              onClick={() => closeDialog(true)}
            >
              {activeDialog?.confirmText || 'OK'}
            </button>
            </div>
          </div>
        </div>
      </Modal>
    </DialogContext.Provider>
  );
}

export function useDialog() {
  return useContext(DialogContext);
}
