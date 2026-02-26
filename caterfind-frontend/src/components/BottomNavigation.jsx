import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Calendar, MessageCircle, User } from 'lucide-react';

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
            id: 'trials',
            label: 'Trials', 
            icon: Calendar, 
            path: '/client/trials' 
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
        <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-around h-16">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);
                        
                        return (
                            <button
                                key={item.id}
                                onClick={() => navigate(item.path)}
                                className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-all ${
                                    active 
                                        ? 'text-primary' 
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <Icon 
                                    size={22} 
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
