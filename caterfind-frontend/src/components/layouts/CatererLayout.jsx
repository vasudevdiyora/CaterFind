/**
 * Caterer Layout Component
 * Provides sidebar navigation for caterer pages
 * Matches Loveable's OwnerLayout structure
 */
import { useEffect, useState } from 'react';
import { NavLink as RouterNavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Building2, Users, MessageSquare,
    Package, Menu, X, LogOut, Contact, Calendar, UtensilsCrossed, ClipboardList
} from 'lucide-react';

import { cn } from '@/lib/utils';
import Modal from '../Modal';
import { authAPI, profileAPI } from '@/services/api';

const CatererLayout = ({ children, user, onLogout }) => {
    // Mobile sidebar toggle state
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const fallbackCateringName = user?.displayName || user?.name || (user?.email ? user.email.split('@')[0] : 'Caterer');
    const [cateringName, setCateringName] = useState(fallbackCateringName);
    const location = useLocation();

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

    // Handle logout action
    const handleLogout = () => {
        if (onLogout) onLogout();
    };

    // Navigation menu items
    const navItems = [
        { path: '/owner/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/owner/profile', icon: Building2, label: 'My Business' },
        { path: '/owner/calendar', icon: Calendar, label: 'Availability' },
        { path: '/owner/clients', icon: Users, label: 'Clients' },
        { path: '/owner/dish-library', icon: UtensilsCrossed, label: 'Dish Library' },
        { path: '/owner/menu-builder', icon: UtensilsCrossed, label: 'Menu Builder' },
        { path: '/owner/menu-history', icon: ClipboardList, label: 'Menu History' },
        { path: '/owner/contacts', icon: Contact, label: 'Contacts' },
        { path: '/owner/inventory', icon: Package, label: 'Inventory' },
        { path: '/owner/broadcast', icon: MessageSquare, label: 'Messages' },
    ];

    const activeNavItem = navItems.find((item) => location.pathname.startsWith(item.path));
    const activeTitle = activeNavItem?.label || 'Workspace';

    return (
        <div className="flex h-screen bg-background overflow-hidden">
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
                        "hidden lg:flex fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200",
                        "flex-col h-full"
                    )}>
                        <div className="flex flex-col h-full">
                            {/* Sidebar Header */}
                            <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center shadow-sm">
                                        <UtensilsCrossed className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 text-sm">{cateringName}</p>
                                        <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">Caterer</p>
                                    </div>
                                </div>
                            </div>

                            {/* Navigation Links */}
                            <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
                                {navItems.map(({ path, icon: Icon, label }) => (
                                    <RouterNavLink
                                        key={path}
                                        to={path}
                                        onClick={() => setSidebarOpen(false)}
                                        className={({ isActive }) => cn(
                                            "group flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                                            isActive
                                                ? "bg-sky-50 text-slate-900 shadow-sm border border-sky-200"
                                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                        )}
                                    >
                                        {({ isActive }) => (
                                            <>
                                                <Icon className={cn("w-4 h-4 transition-colors", isActive ? "text-sky-600" : "text-slate-400 group-hover:text-slate-600")} />
                                                <span>{label}</span>
                                            </>
                                        )}
                                    </RouterNavLink>
                                ))}
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

                    {/* Mobile Sidebar (side-panel Modal) */}
                    <Modal isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} side="left" className="p-0 bg-transparent !max-w-none">
                        <aside className={cn(
                            "lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200",
                            "transform transition-transform duration-200 ease-in-out",
                            "translate-x-0"
                        )}>
                            <div className="flex flex-col h-full">
                                {/* Sidebar Header */}
                                <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center shadow-sm">
                                            <UtensilsCrossed className="w-5 h-5" />
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
                                <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
                                    {navItems.map(({ path, icon: Icon, label }) => (
                                        <RouterNavLink
                                            key={path}
                                            to={path}
                                            onClick={() => setSidebarOpen(false)}
                                            className={({ isActive }) => cn(
                                                "group flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                                                isActive
                                                    ? "bg-sky-50 text-slate-900 shadow-sm border border-sky-200"
                                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                            )}
                                        >
                                            {({ isActive }) => (
                                                <>
                                                    <Icon className={cn("w-4 h-4 transition-colors", isActive ? "text-sky-600" : "text-slate-400 group-hover:text-slate-600")} />
                                                    <span>{label}</span>
                                                </>
                                            )}
                                        </RouterNavLink>
                                    ))}
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
                    <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
                        {/* Top Header */}
                        <header className="sticky top-0 z-30 bg-card/90 backdrop-blur border-b border-border px-4 lg:px-6 py-3">
                            <div className="flex items-center gap-4">
                                <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 lg:hidden">
                                    <Menu className="w-6 h-6" />
                                </button>
                                <div className="min-w-0">
                                    <h1 className="font-extrabold text-lg truncate tracking-tight">{activeTitle}</h1>
                                    <p className="text-xs text-muted-foreground truncate hidden sm:block">Manage faster with denser, readable controls</p>
                                </div>
                                <div className="ml-auto hidden md:flex items-center gap-2 text-xs">
                                    <span className="px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200 font-semibold">Caterer</span>
                                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">{cateringName}</span>
                                </div>
                            </div>
                        </header>

                        {/* Page Content (scroll container) */}
                        <main className="flex-1 page-shell py-3 lg:py-4 overflow-y-auto overflow-x-hidden touch-scroll">
                            {children}
                        </main>
                    </div>
                </>
            )}
        </div>
    );
};

export default CatererLayout;
