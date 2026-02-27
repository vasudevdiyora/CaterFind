import React, { useState } from "react";
import { LogOut, User, Menu, X, LayoutDashboard, Users, MessageSquare, Settings, UserCog, ShieldCheck } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const AdminLayout = ({ user, children, onLogout }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { 
            id: 'dashboard',
            label: 'Dashboard', 
            icon: LayoutDashboard, 
            path: '/admin/dashboard' 
        },
        { 
            id: 'caterers',
            label: 'Caterers', 
            icon: UserCog, 
            path: '/admin/caterers' 
        },
        { 
            id: 'clients',
            label: 'Clients', 
            icon: Users, 
            path: '/admin/clients' 
        },
        { 
            id: 'moderation',
            label: 'Moderation', 
            icon: ShieldCheck, 
            path: '/admin/moderation' 
        },
        { 
            id: 'messages',
            label: 'Messages', 
            icon: MessageSquare, 
            path: '/admin/messages' 
        },
        { 
            id: 'settings',
            label: 'Settings', 
            icon: Settings, 
            path: '/admin/settings' 
        },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar for Desktop */}
            <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card">
                <div className="p-6 border-b border-border">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🍽️</span>
                        <div>
                            <span className="font-bold text-lg text-foreground block">CaterFind</span>
                            <span className="text-xs text-muted-foreground">Admin Panel</span>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);
                        
                        return (
                            <button
                                key={item.id}
                                onClick={() => navigate(item.path)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                                    active 
                                        ? 'bg-primary text-primary-foreground font-semibold' 
                                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                                }`}
                            >
                                <Icon size={20} />
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-border">
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                    >
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Mobile Sidebar */}
            <div className={`fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity ${
                sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`} onClick={() => setSidebarOpen(false)} />
            
            <aside className={`fixed left-0 top-0 bottom-0 w-64 bg-card z-50 md:hidden transition-transform ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}>
                <div className="p-6 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🍽️</span>
                        <div>
                            <span className="font-bold text-lg text-foreground block">CaterFind</span>
                            <span className="text-xs text-muted-foreground">Admin Panel</span>
                        </div>
                    </div>
                    <button onClick={() => setSidebarOpen(false)}>
                        <X size={20} />
                    </button>
                </div>

                <nav className="p-4 space-y-2">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);
                        
                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    navigate(item.path);
                                    setSidebarOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                                    active 
                                        ? 'bg-primary text-primary-foreground font-semibold' 
                                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                                }`}
                            >
                                <Icon size={20} />
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                    >
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Top Navbar */}
                <nav className="h-16 border-b border-border bg-card px-4 md:px-6 flex items-center justify-between sticky top-0 z-30">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="md:hidden p-2 hover:bg-secondary rounded-lg transition-colors"
                    >
                        <Menu size={20} />
                    </button>

                    <div className="flex-1 md:flex-none" />

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground">
                                <User size={18} />
                            </div>
                            {user?.email && (
                                <span className="text-sm font-medium hidden md:block text-foreground">
                                    {user.email}
                                </span>
                            )}
                        </div>
                    </div>
                </nav>

                {/* Page Content */}
                <main className="flex-1 p-4 md:p-6 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
