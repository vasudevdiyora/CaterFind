import React, { useState } from "react";
import { User, Menu, LayoutDashboard, Users, MessageSquare, Settings, UserCog, ShieldCheck, Star } from "lucide-react";
import RoleSidebar from '@/components/layouts/RoleSidebar';
import { useLocation } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import { adminHeaderConfig, findHeaderForPath } from '@/lib/headerConfig';

const AdminLayout = ({ user, children, onLogout }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const menuItems = [
        { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/admin/caterers', label: 'Caterers', icon: UserCog },
        { path: '/admin/clients', label: 'Clients', icon: Users },
        { path: '/admin/reviews', label: 'Reviews', icon: Star },
        { path: '/admin/moderation', label: 'Moderation', icon: ShieldCheck },
        { path: '/admin/messages', label: 'Messages', icon: MessageSquare },
        { path: '/admin/settings', label: 'Settings', icon: Settings },
    ];

    return (
        <div className="app-min-height bg-slate-50 flex overflow-x-hidden">
            <RoleSidebar
                menuItems={menuItems}
                roleSubtitle="Admin Portal"
                onLogout={onLogout}
                mobileOpen={sidebarOpen}
                onMobileOpenChange={setSidebarOpen}
                onDesktopCollapseChange={setSidebarCollapsed}
                storageKey="caterfind:sidebar:admin-collapsed"
            />

            {/* Main Content (offset on md+ to accommodate fixed sidebar) */}
            <div className={`flex-1 flex flex-col min-w-0 transition-[margin] duration-300 ${sidebarCollapsed ? 'lg:ml-[76px]' : 'lg:ml-[250px]'}`}>
                {/* Top Navbar */}
                <nav className="h-14 md:h-16 border-b border-slate-200 bg-white/95 backdrop-blur px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden p-2 hover:bg-secondary rounded-lg transition-colors"
                    >
                        <Menu size={20} />
                    </button>

                    <div className="flex-1 md:flex items-center">
                        <div className="hidden md:block">
                            {(() => {
                                const header = findHeaderForPath(adminHeaderConfig, location.pathname) || { title: 'Dashboard', subtitle: 'Welcome to your workspace' };
                                return <PageHeader title={header.title} subtitle={header.subtitle} />;
                            })()}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground">
                                <User size={18} />
                            </div>
                            {user?.email && (
                                <span className="text-sm font-medium hidden md:block text-slate-700">
                                    {user.email}
                                </span>
                            )}
                        </div>
                    </div>
                </nav>

                {/* Page Content */}
                <main className="flex-1 page-shell py-4 md:py-6 overflow-y-auto overflow-x-hidden">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
