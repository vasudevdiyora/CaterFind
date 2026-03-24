import React, { useEffect, useState } from "react";
import { LogOut, Menu, User } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import BottomNavigation from "@/components/BottomNavigation";
import { authAPI } from "@/services/api";

const ClientLayout = ({ user, children, onLogout }) => {
    const fallbackName = user?.displayName || user?.name || (user?.email ? user.email.split('@')[0] : 'Client');
    const [clientName, setClientName] = useState(fallbackName);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const navigate = useNavigate();

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
            <BottomNavigation
                userName={clientName}
                mobileOpen={mobileNavOpen}
                onClose={() => setMobileNavOpen(false)}
                onLogout={onLogout}
            />

            {/* Navbar */}
            <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
                <nav className="h-14 border-b border-slate-200 bg-white px-4 flex items-center justify-between sticky top-0 z-30">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setMobileNavOpen(true)}
                            className="lg:hidden p-2 -ml-2 rounded-md text-slate-600 hover:bg-slate-100"
                            aria-label="Open navigation"
                        >
                            <Menu size={20} />
                        </button>
                    <span className="text-2xl">🍽️</span>
                    <span className="font-bold text-lg text-slate-900">CaterFind</span>
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
