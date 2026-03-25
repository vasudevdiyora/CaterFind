import { useEffect, useState } from 'react';
import { NavLink as RouterNavLink, useLocation } from 'react-router-dom';
import { Menu, X, LogOut } from 'lucide-react';
import logo from '@/assets/logo.png';

import { cn } from '@/lib/utils';
import Modal from '@/components/Modal';
import '../../styles/CatererLayout.css';

const RoleSidebar = ({
    menuItems,
    roleSubtitle,
    onLogout,
    mobileOpen,
    onMobileOpenChange,
    onDesktopCollapseChange,
    appName = 'CaterFind',
    storageKey,
    BrandIcon = null,
}) => {
    const location = useLocation();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    useEffect(() => {
        if (!storageKey) return;

        try {
            const saved = window.localStorage.getItem(storageKey);
            if (saved === 'true') {
                setSidebarCollapsed(true);
            }
        } catch {
            // Ignore storage read errors.
        }
    }, [storageKey]);

    useEffect(() => {
        onDesktopCollapseChange?.(sidebarCollapsed);

        if (!storageKey) return;

        try {
            window.localStorage.setItem(storageKey, String(sidebarCollapsed));
        } catch {
            // Ignore storage write errors.
        }
    }, [onDesktopCollapseChange, sidebarCollapsed, storageKey]);

    const toggleDesktopCollapse = () => {
        setSidebarCollapsed((prev) => !prev);
    };

    const closeMobileSidebar = () => {
        onMobileOpenChange?.(false);
    };

    const isItemActive = (path) => {
        if (location.pathname === path) {
            return true;
        }

        return location.pathname.startsWith(`${path}/`);
    };

    const renderNavItem = ({ path, icon: Icon, label }, isMobile = false) => {
        const isActive = isItemActive(path);

        return (
            <RouterNavLink
                key={path}
                to={path}
                onClick={() => {
                    if (isMobile) {
                        closeMobileSidebar();
                    }
                }}
                className={cn(
                    'group w-full rounded-lg font-medium transition-all duration-150 caterer-nav-item',
                    sidebarCollapsed && !isMobile ? 'flex justify-center items-center px-2 py-3' : 'flex items-center gap-3 px-3 py-2 text-sm',
                    isActive
                        ? 'bg-sky-50 text-slate-900 shadow-sm border border-sky-200'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
            >
                <Icon
                    className={cn(
                        'transition-colors',
                        sidebarCollapsed && !isMobile ? 'w-6 h-6' : 'w-4 h-4',
                        isActive ? 'text-sky-600' : 'text-slate-400 group-hover:text-slate-600'
                    )}
                />
                {(!sidebarCollapsed || isMobile) && <span>{label}</span>}
            </RouterNavLink>
        );
    };

    return (
        <>
            <aside
                style={{ zIndex: 1200 }}
                className={cn(
                    'hidden lg:flex fixed inset-y-0 left-0 bg-white border-r border-slate-200 flex-col h-full caterer-sidebar',
                    sidebarCollapsed ? 'caterer-sidebar-collapsed' : 'caterer-sidebar-expanded'
                )}
            >
                <div className="flex flex-col h-full">
                    <div
                        className={cn(
                            'h-16 border-b border-slate-100 flex items-center',
                            sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-6'
                        )}
                    >
                        {sidebarCollapsed ? (
                            <button
                                onClick={toggleDesktopCollapse}
                                className="inline-flex lg:inline-flex p-2 rounded-md text-slate-600 hover:bg-slate-100 transition-colors"
                                aria-label="Expand sidebar"
                            >
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
                                        <p className="font-bold text-slate-900 text-sm">{appName}</p>
                                        <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">{roleSubtitle}</p>
                                    </div>
                                </div>

                                <button
                                    onClick={toggleDesktopCollapse}
                                    className="hidden lg:inline-flex p-2 rounded-md text-slate-600 hover:bg-slate-100 transition-colors"
                                    aria-label="Collapse sidebar"
                                >
                                    <Menu className="w-5 h-5" />
                                </button>
                            </>
                        )}
                    </div>

                    <nav
                        className={cn(
                            'flex-1 overflow-y-auto custom-scrollbar',
                            sidebarCollapsed ? 'px-2 py-4 space-y-2' : 'p-4 space-y-1'
                        )}
                    >
                        {menuItems.map((item) => renderNavItem(item))}
                    </nav>

                    <div className={cn('border-t border-slate-100', sidebarCollapsed ? 'p-2' : 'p-4')}>
                        <button
                            onClick={onLogout}
                            className={cn(
                                'w-full rounded-lg font-medium text-slate-600 hover:bg-slate-50 hover:text-red-600 transition-colors',
                                sidebarCollapsed ? 'flex justify-center items-center px-2 py-3' : 'flex items-center gap-3 px-3 py-2 text-sm'
                            )}
                        >
                            <LogOut className={sidebarCollapsed ? 'w-6 h-6' : 'w-4 h-4'} />
                            {!sidebarCollapsed && <span>Logout</span>}
                        </button>
                    </div>
                </div>
            </aside>

            <Modal isOpen={Boolean(mobileOpen)} onClose={closeMobileSidebar} side="left" className="p-0 bg-transparent !max-w-none">
                <aside className="lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out translate-x-0">
                    <div className="flex flex-col h-full">
                        <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center shadow-sm">
                                    <img src={logo} alt="CaterFind Logo" className="w-5 h-5 object-contain" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900 text-sm">{appName}</p>
                                    <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">{roleSubtitle}</p>
                                </div>
                            </div>

                            <button
                                className="lg:hidden p-2 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                                onClick={closeMobileSidebar}
                                aria-label="Close sidebar"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
                            {menuItems.map((item) => renderNavItem(item, true))}
                        </nav>

                        <div className="border-t border-slate-100 p-4">
                            <button
                                onClick={() => {
                                    onLogout?.();
                                    closeMobileSidebar();
                                }}
                                className="w-full rounded-lg font-medium text-slate-600 hover:bg-slate-50 hover:text-red-600 transition-colors flex items-center gap-3 px-3 py-2 text-sm"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>
                </aside>
            </Modal>
        </>
    );
};

export default RoleSidebar;
