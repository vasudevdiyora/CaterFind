import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, MessageCircle, User, ClipboardList, X, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import { chatAPI } from '../services/api';

const BottomNavigation = ({ userName = 'Client', mobileOpen = false, onClose = () => {}, onLogout = () => {} }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [unreadTotal, setUnreadTotal] = useState(0);

    const navItems = [
        { 
            id: 'home',
            label: 'Home', 
            icon: Home, 
            path: '/client/home' 
        },
        { 
            id: 'requests',
            label: 'Requests', 
            icon: ClipboardList, 
            path: '/client/requests' 
        },
        { 
            id: 'messages',
            label: 'Messages', 
            icon: MessageCircle, 
            path: '/client/messages' 
        },
        { 
            id: 'profile',
            label: 'Profile', 
            icon: User, 
            path: '/client/profile' 
        },
    ];

    const isActive = (path) => location.pathname === path;

    useEffect(() => {
        let mounted = true;
        const load = async () => {
                try {
                const convs = await chatAPI.getConversations();
                // debug logs removed for production
                if (!mounted) return;
                const total = (convs || []).reduce((acc, c) => acc + (Number(c.unreadCount || c.unread || c.unread_count || 0) || 0), 0);
                setUnreadTotal(total);
            } catch {
                // ignore
            }
        };
        load();
        const id = setInterval(load, 10000);
        return () => { mounted = false; clearInterval(id); };
    }, []);

    return (
        <>
            {/* Desktop sidebar */}
            <aside className="hidden lg:block fixed top-0 left-0 h-screen w-64 bg-white border-r border-slate-200 z-40">
                <div className="h-14 border-b border-slate-200 px-4 flex items-center">
                    <span className="text-2xl">🍽️</span>
                    <span className="ml-2 font-bold text-lg text-slate-900">CaterFind</span>
                </div>

                <div className="p-4 space-y-1.5">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);

                        return (
                            <div key={item.id} className="relative">
                                <button
                                    onClick={() => navigate(item.path)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                                        active
                                            ? 'bg-sky-50 text-sky-700 border border-sky-200 font-semibold'
                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                    }`}
                                    aria-current={active ? 'page' : undefined}
                                >
                                    <Icon size={18} className={active ? 'stroke-[2.4]' : 'stroke-[2]'} />
                                    <span>{item.label}</span>
                                </button>

                                {item.id === 'messages' && unreadTotal > 0 && (
                                    <span className="absolute right-2 top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-rose-600 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white shadow-sm">
                                        {unreadTotal > 99 ? '99+' : unreadTotal}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="absolute bottom-0 left-0 w-full p-4 border-t border-slate-100">
                    <button
                        onClick={() => onLogout()}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    >
                        <LogOut size={18} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Mobile backdrop */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/30 z-40 lg:hidden"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            {/* Mobile drawer */}
            <aside
                className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-50 transform transition-transform duration-200 lg:hidden flex flex-col ${
                    mobileOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
                aria-hidden={!mobileOpen}
            >
                <div className="h-14 border-b border-slate-200 px-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                        <span className="text-2xl">🍽️</span>
                        <span className="font-bold text-lg text-slate-900 truncate">CaterFind</span>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Close navigation"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="px-4 py-3 border-b border-slate-100 text-sm text-slate-600 truncate">
                    {userName}
                </div>

                <div className="p-4 space-y-1.5 overflow-y-auto flex-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);

                        return (
                            <div key={item.id} className="relative">
                                <button
                                    onClick={() => {
                                        navigate(item.path);
                                        onClose();
                                    }}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                                        active
                                            ? 'bg-sky-50 text-sky-700 border border-sky-200 font-semibold'
                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                    }`}
                                    aria-current={active ? 'page' : undefined}
                                >
                                    <Icon size={18} className={active ? 'stroke-[2.4]' : 'stroke-[2]'} />
                                    <span>{item.label}</span>
                                </button>

                                {item.id === 'messages' && unreadTotal > 0 && (
                                    <span className="absolute right-2 top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-rose-600 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white shadow-sm">
                                        {unreadTotal > 99 ? '99+' : unreadTotal}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="p-4 border-t border-slate-100">
                    <button
                        onClick={() => { onLogout(); onClose(); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    >
                        <LogOut size={18} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default BottomNavigation;
