import React, { useState } from "react";
import Modal from '../Modal';
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
            id: 'reviews',
            label: 'Reviews',
            icon: User,
            path: '/admin/reviews'
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
        <div className="min-h-screen bg-background flex overflow-x-hidden">
            {/* Sidebar for Desktop (fixed so Logout stays visible) */}
            <aside style={{ zIndex: 1200 }} className="hidden md:flex fixed inset-y-0 left-0 w-[272px] flex-col bg-card border-r border-border h-full">
                <div className="p-6 border-b border-border">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🍽️</span>
                        <div>
                            <span className="font-bold text-lg text-foreground block">CaterFind</span>
                            <span className="text-xs text-muted-foreground">Admin Panel</span>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-3 space-y-1.5">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);
                        
                        return (
                            <button
                                key={item.id}
                                onClick={() => navigate(item.path)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] transition-all ${
                                    active 
                                        ? 'bg-sky-50 text-sky-700 border border-sky-200 font-semibold' 
                                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                                }`}
                            >
                                <Icon size={18} />
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-border">
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                    >
                        <LogOut size={18} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Mobile Sidebar (side-panel Modal) */}
            <Modal isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} side="left" className="p-0 bg-transparent !max-w-none">
                <aside className={`fixed left-0 top-0 bottom-0 w-[272px] bg-card z-50 md:hidden transition-transform translate-x-0`}>
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

                    <nav className="p-3 space-y-1.5">
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
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] transition-all ${
                                        active 
                                            ? 'bg-sky-50 text-sky-700 border border-sky-200 font-semibold' 
                                            : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                                    }`}
                                >
                                    <Icon size={18} />
                                    <span>{item.label}</span>
                                </button>
                            );
                        })}
                    </nav>

                    <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
                        <button
                            onClick={onLogout}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                        >
                            <LogOut size={18} />
                            <span>Logout</span>
                        </button>
                    </div>
                </aside>
            </Modal>

            {/* Main Content (offset on md+ to accommodate fixed sidebar) */}
            <div className="flex-1 flex flex-col min-w-0 md:ml-[272px]">
                {/* Top Navbar */}
                <nav className="h-14 md:h-16 border-b border-border bg-card/90 backdrop-blur px-4 md:px-6 flex items-center justify-between sticky top-0 z-30">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="md:hidden p-2 hover:bg-secondary rounded-lg transition-colors"
                    >
                        <Menu size={20} />
                    </button>

                    <div className="flex-1 md:flex items-center">
                        <h1 className="hidden md:block font-extrabold text-lg tracking-tight">Admin Workspace</h1>
                    </div>

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
                <main className="flex-1 page-shell py-3 md:py-4 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
