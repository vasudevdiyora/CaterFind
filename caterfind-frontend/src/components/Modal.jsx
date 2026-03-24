import React, { useEffect, useRef, useState } from 'react';
import './Modal.css';
import { X } from 'lucide-react';

const Modal = ({
    isOpen = true,
    onClose = () => {},
    title = null,
    children,
    className = '',
    side = null,
    showHeader = true,
    applyDesktopSidebarOffset = false
}) => {
    const overlayRef = useRef(null);
    const CLOSE_ANIMATION_MS = 240;

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') onClose();
        };

        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    // NOTE: hooks must be called in the same order every render.
    // Don't early-return before all hooks are declared — check `isOpen` after hooks.

    // Side panel variant (used for slide-in sidebars)
    const [isMobile, setIsMobile] = useState(() => {
        try { return window.innerWidth < 1024; } catch { return false; }
    });

    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const [shouldRender, setShouldRender] = useState(isOpen);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        let closeTimer;

        if (isOpen) {
            // Schedule render state change to avoid synchronous setState in effect
            requestAnimationFrame(() => {
                setShouldRender(true);
                requestAnimationFrame(() => setIsVisible(true));
            });
        } else {
            // Schedule hiding to avoid synchronous setState in effect
            requestAnimationFrame(() => setIsVisible(false));
            closeTimer = setTimeout(() => setShouldRender(false), CLOSE_ANIMATION_MS);
        }

        return () => {
            if (closeTimer) clearTimeout(closeTimer);
        };
    }, [isOpen]);

    const overlayClass = 'modal-overlay';

    // Compute overlay left offset on desktop so it doesn't cover the persistent sidebar.
    const [overlayStyle, setOverlayStyle] = useState(null);

    useEffect(() => {
        if (isMobile || !applyDesktopSidebarOffset) {
            const t = setTimeout(() => setOverlayStyle(null), 0);
            return () => clearTimeout(t);
        }

        try {
            const aside = document.querySelector('aside');
            const width = aside ? Math.round(aside.getBoundingClientRect().width) : 256;
            const t = setTimeout(() => setOverlayStyle({ left: `${width}px` }), 0);
            return () => clearTimeout(t);
        } catch {
            const t = setTimeout(() => setOverlayStyle({ left: '256px' }), 0);
            return () => clearTimeout(t);
        }
    }, [isMobile, applyDesktopSidebarOffset]);

    if (!shouldRender) return null;

    // Side panels are intended for mobile; don't render overlay/panel on desktop
    if (side === 'left' || side === 'right') {
        if (!isMobile) return null;

        return (
            <div
                className={`${overlayClass} ${isVisible ? 'is-open' : ''}`}
                ref={overlayRef}
                style={overlayStyle || undefined}
                onMouseDown={(e) => { if (e.target === overlayRef.current) onClose(); }}
            >
                <div
                    className={`${className} modal-side ${side === 'left' ? 'side-left' : 'side-right'} ${isVisible ? 'is-open' : ''}`}
                    role="dialog"
                    aria-modal="true"
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    {children}
                </div>
            </div>
        );
    }

    return (
        <div
            className={`${overlayClass} ${isVisible ? 'is-open' : ''}`}
            ref={overlayRef}
            style={overlayStyle || undefined}
            onMouseDown={(e) => { if (e.target === overlayRef.current) onClose(); }}
        >
            <div className={`modal-content ${className} ${isVisible ? 'is-open' : ''}`} role="dialog" aria-modal="true">
                {showHeader && (
                    <div className="modal-header">
                        {title ? (
                            typeof title === 'string' ? <h2>{title}</h2> : <div>{title}</div>
                        ) : null}
                        <button type="button" className="close-btn" onClick={onClose} aria-label="Close">
                            <X size={20} />
                        </button>
                    </div>
                )}

                <div className="modal-body">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
