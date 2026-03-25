import React, { useEffect, useState } from "react";
import { ClipboardList, Home, LogOut, Menu, MessageCircle, User } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { authAPI } from "@/services/api";
import RoleSidebar from '@/components/layouts/RoleSidebar';
import { useLocation } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import { clientHeaderConfig, findHeaderForPath } from '@/lib/headerConfig';

const ClientLayout = ({ user, children, onLogout }) => {
    const fallbackName = user?.displayName || user?.name || (user?.email ? user.email.split('@')[0] : 'Client');
    const [clientName, setClientName] = useState(fallbackName);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { path: '/client/home', icon: Home, label: 'Home' },
        { path: '/client/requests', icon: ClipboardList, label: 'Requests' },
        { path: '/client/messages', icon: MessageCircle, label: 'Messages' },
        { path: '/client/profile', icon: User, label: 'Profile' },
    ];

    useEffect(() => {
        let isMounted = true;

        const loadProfileName = async () => {
            try {
                const profile = await authAPI.getProfile();
                if (!isMounted) return;

                const resolvedName = profile?.name?.trim();
                if (resolvedName) {
                    setClientName(resolvedName);
                } else {
                    setClientName(fallbackName);
                }
            } catch {
                if (isMounted) {
                    setClientName(fallbackName);
                }
            }
        };

        loadProfileName();

        return () => {
            isMounted = false;
        };
    }, [fallbackName]);

    return (
        <div className="min-h-screen bg-slate-50 flex overflow-x-hidden">
            <RoleSidebar
                menuItems={menuItems}
                roleSubtitle="Client Panel"
                onLogout={onLogout}
                mobileOpen={mobileNavOpen}
                onMobileOpenChange={setMobileNavOpen}
                onDesktopCollapseChange={setSidebarCollapsed}
                storageKey="caterfind:sidebar:client-collapsed"
            />

            {/* Navbar */}
            <div className={`flex-1 flex flex-col min-w-0 transition-[margin] duration-300 ${sidebarCollapsed ? 'lg:ml-[76px]' : 'lg:ml-[250px]'}`}>
                <nav className="h-14 border-b border-slate-200 bg-white px-4 flex items-center justify-between sticky top-0 z-30">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setMobileNavOpen(true)}
                            className="lg:hidden p-2 -ml-2 rounded-md text-slate-600 hover:bg-slate-100"
                            aria-label="Open navigation"
                        >
                            <Menu size={20} />
                        </button>
                        {/* Dynamic page header */}
                        <div className="min-w-0">
                            {(() => {
                                const header = findHeaderForPath(clientHeaderConfig, location.pathname) || { title: 'Dashboard', subtitle: 'Welcome to your workspace' };
                                return <PageHeader title={header.title} subtitle={header.subtitle} />;
                            })()}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/client/profile')}
                            className="flex items-center gap-3 focus:outline-none"
                            aria-label="Open profile"
                        >
                            <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center text-secondary-foreground">
                                <User size={18} />
                            </div>
                            <span className="text-sm font-medium hidden md:block text-slate-700">
                                {clientName}
                            </span>
                        </button>

                        <button
                            onClick={onLogout}
                            className="p-2 hover:bg-secondary rounded-full transition-colors text-slate-500 hover:text-slate-800"
                            title="Logout"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </nav>

                {/* Main Content */}
                <main className="flex-1 page-shell py-4 md:py-6 overflow-x-hidden">
                    {children}
                </main>
            </div>

        </div>
    );
};

export default ClientLayout;
