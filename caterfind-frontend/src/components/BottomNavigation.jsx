import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Calendar, MessageCircle, User, ClipboardList } from 'lucide-react';

const BottomNavigation = () => {
    const navigate = useNavigate();
    const location = useLocation();

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

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur border-t border-border shadow-[0_-8px_20px_rgba(15,23,42,0.08)]">
            <div className="page-shell">
                <div className="flex items-center justify-around h-14 md:h-16">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);
                        
                        return (
                            <button
                                key={item.id}
                                onClick={() => navigate(item.path)}
                                className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-[64px] ${
                                    active 
                                        ? 'text-primary bg-sky-50 border border-sky-200' 
                                        : 'text-muted-foreground hover:text-foreground hover:bg-slate-100'
                                }`}
                            >
                                <Icon 
                                    size={20} 
                                    className={active ? 'stroke-[2.5]' : 'stroke-[2]'} 
                                />
                                <span className={`text-xs font-medium ${
                                    active ? 'font-semibold' : ''
                                }`}>
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
};

export default BottomNavigation;
