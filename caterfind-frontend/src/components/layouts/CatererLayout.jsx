/**
 * Caterer Layout Component
 * Provides sidebar navigation for caterer pages
 * Matches Loveable's OwnerLayout structure
 */
import { useEffect, useState, useRef } from 'react';
import { NavLink as RouterNavLink, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Building2, Users, MessageSquare,
    Package, Menu, X, LogOut, Contact, Calendar, UtensilsCrossed, ClipboardList
} from 'lucide-react';
import logo from '@/assets/logo.png';

import { cn } from '@/lib/utils';
import Modal from '../Modal';
import { authAPI, profileAPI } from '@/services/api';
import '../../styles/CatererLayout.css';

const CatererLayout = ({ children, user, onLogout }) => {
    // Mobile sidebar toggle state
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const fallbackCateringName = user?.displayName || user?.name || (user?.email ? user.email.split('@')[0] : 'Caterer');
    const [cateringName, setCateringName] = useState(fallbackCateringName);
    const location = useLocation();
    const navigate = useNavigate();
    const lastLocationRef = useRef(location.pathname);
    const [unsavedModalOpen, setUnsavedModalOpen] = useState(false);
    const [pendingNavPath, setPendingNavPath] = useState(null);

    useEffect(() => {
        let isMounted = true;

        const loadCatererProfile = async () => {
            try {
                const catererId = user?.userId || user?.id;

                // Primary source: caterer business profile (contains businessName shown in My Business)
                if (catererId) {
                    const businessProfile = await profileAPI.get(catererId);
                    const businessName = businessProfile?.businessName?.trim();
                    if (isMounted && businessName) {
                        setCateringName(businessName);
                        return;
                    }
                }

                // Fallback source: auth profile/name/email
                const profile = await authAPI.getProfile();
                if (!isMounted) return;

                const resolvedName = profile?.name?.trim() || fallbackCateringName;
                setCateringName(resolvedName);
            } catch {
                if (isMounted) setCateringName(fallbackCateringName);
            }
        };

        loadCatererProfile();

        return () => {
            isMounted = false;
        };
    }, [fallbackCateringName, user?.id, user?.userId]);

    // Keep track of last location and intercept browser back/forward (popstate)
    useEffect(() => {
        lastLocationRef.current = location.pathname;
    }, [location.pathname]);

    useEffect(() => {
        const onPopState = (e) => {
            try {
                if (typeof window !== 'undefined' && window.__hasUnsavedMenu) {
                    const attempted = window.location.pathname;
                    if (attempted !== lastLocationRef.current) {
                        // Revert URL and show modal with pending path
                        window.history.pushState(null, '', lastLocationRef.current);
                        setPendingNavPath(attempted);
                        setUnsavedModalOpen(true);
                    }
                }
            } catch (err) {
                // ignore
            }
        };

        window.addEventListener('popstate', onPopState);
        return () => window.removeEventListener('popstate', onPopState);
    }, []);

    const handleConfirmSaveDraft = async () => {
        setUnsavedModalOpen(false);
        try {
            if (typeof window !== 'undefined' && typeof window.__saveMenuDraft === 'function') {
                await window.__saveMenuDraft();
            }
        } catch (err) {
            console.error('Failed to save draft:', err);
        }
        if (pendingNavPath) navigate(pendingNavPath);
        setPendingNavPath(null);
    };

    const handleConfirmDiscard = () => {
        setUnsavedModalOpen(false);
        if (typeof window !== 'undefined') {
            window.__hasUnsavedMenu = false;
            window.__saveMenuDraft = null;
        }
        if (pendingNavPath) navigate(pendingNavPath);
        setPendingNavPath(null);
    };

    const handleCancelNav = () => {
        setUnsavedModalOpen(false);
        setPendingNavPath(null);
    };

    const handleNavClick = (e, path) => {
        if (typeof window !== 'undefined' && window.__hasUnsavedMenu) {
            e.preventDefault && e.preventDefault();
            setPendingNavPath(path);
            setUnsavedModalOpen(true);
            return;
        }
        setSidebarOpen(false);
    };

    // Handle logout action
    const handleLogout = () => {
        if (onLogout) onLogout();
    };

    // Handle menu button click (desktop vs mobile behavior)
    const handleMenuClick = () => {
        if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
            // Desktop: toggle collapsed / expanded sidebar like YouTube
            setSidebarCollapsed((prev) => !prev);
        } else {
            // Mobile / tablet: open slide-in sidebar
            setSidebarOpen(true);
        }
    };

    // Navigation menu items
    const navItems = [
        { path: '/owner/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/owner/profile', icon: Building2, label: 'My Business' },
        { path: '/owner/calendar', icon: Calendar, label: 'Availability' },
        { path: '/owner/clients', icon: Users, label: 'Clients' },
        { path: '/owner/dish-library', icon: UtensilsCrossed, label: 'Dish Library' },
        { path: '/owner/menu-builder', icon: UtensilsCrossed, label: 'Menu Builder' },
        { path: '/owner/menu-history', icon: ClipboardList, label: 'Menus' },
        { path: '/owner/contacts', icon: Contact, label: 'Contacts' },
        { path: '/owner/inventory', icon: Package, label: 'Inventory' },
        { path: '/owner/broadcast', icon: MessageSquare, label: 'Messages' },
    ];

    const activeNavItem = navItems.find((item) => location.pathname.startsWith(item.path));
    const activeTitle = activeNavItem?.label || 'Workspace';

    return (
        <div className="flex app-height bg-slate-50 overflow-hidden">
            {/* If caterer not approved, show review message instead of full layout */}
            {user?.accountStatus && user?.accountStatus !== 'ACTIVE' ? (
                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="surface-card p-8 max-w-lg text-center">
                        <h2 className="text-xl font-bold mb-2">Account Under Review</h2>
                        <p className="text-sm text-slate-600 mb-4">Your account is currently under admin review. You will be notified once an administrator approves your account.</p>
                        <div className="flex items-center justify-center gap-2">
                            <button onClick={onLogout} className="secondary-button">Logout</button>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    {/* Desktop Sidebar (visible on lg and up) */}
                    <aside style={{ zIndex: 1200 }} className={cn(
                        "hidden lg:flex fixed inset-y-0 left-0 bg-white border-r border-slate-200 flex-col h-full caterer-sidebar",
                        sidebarCollapsed ? "caterer-sidebar-collapsed" : "caterer-sidebar-expanded"
                    )}>
                        <div className="flex flex-col h-full">
                            {/* Sidebar Header */}
                            <div className={cn(
                                "h-16 border-b border-slate-100 flex items-center",
                                sidebarCollapsed ? "justify-center px-2" : "justify-between px-6"
                            )}>
                                {sidebarCollapsed ? (
                                    <button onClick={handleMenuClick} className="inline-flex lg:inline-flex p-2 rounded-md text-slate-600 hover:bg-slate-100 transition-colors" aria-label="Expand sidebar">
                                        <div className="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center shadow-sm">
                                            <img src={logo} alt="CaterFind Logo" className="w-5 h-5 object-contain" />
                                        </div>
                                    </button>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center shadow-sm">
                                                    <img src={logo} alt="CaterFind Logo" className="w-5 h-5 object-contain" />
                                                </div>
                                            <div>
                                                <p className="font-bold text-slate-900 text-sm">{cateringName}</p>
                                                <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">Caterer</p>
                                            </div>
                                        </div>

                                        <button onClick={handleMenuClick} className="hidden lg:inline-flex p-2 rounded-md text-slate-600 hover:bg-slate-100 transition-colors" aria-label="Collapse sidebar">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
                                                <path d="M4 5h16" />
                                                <path d="M4 12h16" />
                                                <path d="M4 19h16" />
                                            </svg>
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Collapse button removed per request */}

                            {/* Navigation Links */}
                            <nav className={cn(
                                "flex-1 min-h-0 overflow-y-auto custom-scrollbar",
                                sidebarCollapsed ? "px-2 py-4 space-y-2" : "p-4 space-y-1"
                            )}>
                                {navItems.map(({ path, icon, label }) => {
                                    const NavIcon = icon;

                                    return (
                                    <RouterNavLink
                                        key={path}
                                        to={path}
                                        onClick={(e) => handleNavClick(e, path)}
                                        className={({ isActive }) => cn(
                                            "group w-full rounded-lg font-medium transition-all duration-150 caterer-nav-item",
                                            sidebarCollapsed ? "flex justify-center items-center px-2 py-3" : "flex items-center gap-3 px-3 py-2 text-sm",
                                            isActive
                                                ? "bg-sky-50 text-slate-900 shadow-sm border border-sky-200"
                                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                        )}
                                    >
                                        {({ isActive }) => (
                                            <>
                                                <NavIcon className={cn(
                                                    "transition-colors",
                                                    sidebarCollapsed ? "w-6 h-6" : "w-4 h-4",
                                                    isActive ? "text-sky-600" : "text-slate-400 group-hover:text-slate-600"
                                                )} />
                                                {!sidebarCollapsed && <span>{label}</span>}
                                            </>
                                        )}
                                    </RouterNavLink>
                                    );
                                })}
                            </nav>

                            {/* Logout Button */}
                            <div className={cn("border-t border-slate-100", sidebarCollapsed ? "p-2" : "p-4")}>
                                <button
                                    onClick={handleLogout}
                                    className={cn(
                                        "w-full rounded-lg font-medium text-slate-600 hover:bg-slate-50 hover:text-red-600 transition-colors",
                                        sidebarCollapsed ? "flex justify-center items-center px-2 py-3" : "flex items-center gap-3 px-3 py-2 text-sm"
                                    )}
                                >
                                    <LogOut className={sidebarCollapsed ? "w-6 h-6" : "w-4 h-4"} />
                                    {!sidebarCollapsed && <span>Logout</span>}
                                </button>
                            </div>
                        </div>
                    </aside>

                    {/* Mobile Sidebar (side-panel Modal) */}
                    <Modal isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} side="left" className="p-0 bg-transparent !max-w-none">
                        <aside className={cn(
                            "lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200",
                            "mobile-drawer-height",
                            "transform transition-transform duration-200 ease-in-out",
                            "translate-x-0"
                        )}>
                            <div className="flex flex-col h-full">
                                {/* Sidebar Header */}
                                <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center shadow-sm">
                                            <img src={logo} alt="CaterFind Logo" className="w-5 h-5 object-contain" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 text-sm">{cateringName}</p>
                                            <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">Caterer</p>
                                        </div>
                                    </div>
                                    {/* Close button (mobile only) */}
                                        <button className="lg:hidden p-2 text-slate-400 hover:text-slate-600" onClick={() => setSidebarOpen(false)}>
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Navigation Links */}
                                <nav className="flex-1 min-h-0 p-4 space-y-1 overflow-y-auto custom-scrollbar">
                                    {navItems.map(({ path, icon, label }) => {
                                        const NavIcon = icon;

                                        return (
                                        <RouterNavLink
                                            key={path}
                                            to={path}
                                            onClick={(e) => handleNavClick(e, path)}
                                            className={({ isActive }) => cn(
                                                "group flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                                                isActive
                                                    ? "bg-sky-50 text-slate-900 shadow-sm border border-sky-200"
                                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                            )}
                                        >
                                            {({ isActive }) => (
                                                <>
                                                    <NavIcon className={cn("w-4 h-4 transition-colors", isActive ? "text-sky-600" : "text-slate-400 group-hover:text-slate-600")} />
                                                    <span>{label}</span>
                                                </>
                                            )}
                                        </RouterNavLink>
                                        );
                                    })}
                                </nav>

                                {/* Logout Button */}
                                <div className="p-4 border-t border-slate-100">
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-red-600 transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        <span>Logout</span>
                                    </button>
                                </div>
                            </div>
                        </aside>
                    </Modal>

                    {/* Main Content Area */}
                    <div className={cn(
                        "flex-1 flex flex-col min-w-0 caterer-main-content",
                        sidebarCollapsed ? "lg:ml-[76px]" : "lg:ml-[250px]"
                    )}>
                        {/* Top Header */}
                        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3">
                            <div className="flex items-center gap-4">
                                <button
                                    type="button"
                                    onClick={handleMenuClick}
                                    className="lg:hidden inline-flex items-center justify-center p-2 rounded-md text-slate-600 hover:bg-slate-100 transition-colors"
                                    aria-label="Open sidebar"
                                >
                                    <Menu className="w-5 h-5" />
                                </button>
                                <div className="min-w-0">
                                    <h1 className="font-extrabold text-lg truncate tracking-tight">{activeTitle}</h1>
                                    <p className="text-xs text-slate-500 truncate hidden sm:block">Manage faster with denser, readable controls</p>
                                </div>
                                <div className="ml-auto hidden md:flex items-center gap-2 text-xs">
                                    <span className="px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200 font-semibold">Caterer</span>
                                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">{cateringName}</span>
                                </div>
                            </div>
                        </header>

                        {/* Page Content (scroll container) */}
                        <main className="flex-1 page-shell py-4 lg:py-6 overflow-y-auto overflow-x-hidden touch-scroll">
                            {children}
                        </main>
                        <Modal isOpen={unsavedModalOpen} onClose={handleCancelNav} title="Unsaved changes">
                            <p className="text-sm text-slate-600 mb-4">You have unsaved changes in the menu builder. Save as draft or discard your changes before leaving.</p>
                            <div className="flex items-center gap-3 justify-end">
                                <button className="secondary-button" onClick={handleCancelNav}>Cancel</button>
                                <button className="secondary-button" onClick={handleConfirmDiscard}>Discard</button>
                                <button className="primary-button" onClick={handleConfirmSaveDraft}>Save Draft</button>
                            </div>
                        </Modal>
                    </div>
                </>
            )}
        </div>
    );
};

export default CatererLayout;
