import React, { useEffect, useState } from "react";
import { LogOut, User, Menu } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import { authAPI } from "@/services/api";

const ClientLayout = ({ user, children, onLogout }) => {
    const fallbackName = user?.displayName || user?.name || (user?.email ? user.email.split('@')[0] : 'Client');
    const [clientName, setClientName] = useState(fallbackName);

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
        <div className="min-h-screen bg-background flex flex-col">
            {/* Navbar */}
            <nav className="h-14 md:h-16 border-b border-border bg-card/90 backdrop-blur px-4 md:px-6 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">🍽️</span>
                    <span className="font-bold text-lg text-foreground">CaterFind</span>
                </div>

                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center text-secondary-foreground">
                        <User size={18} />
                    </div>
                    <span className="text-sm font-medium hidden md:block text-foreground">
                        {clientName}
                    </span>
                    <button
                        onClick={onLogout}
                        className="p-2 hover:bg-secondary rounded-full transition-colors text-muted-foreground hover:text-foreground"
                        title="Logout"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-1 page-shell py-3 md:py-4 pb-20">
                {children}
            </main>

            {/* Bottom Navigation */}
            <BottomNavigation />
        </div>
    );
};

export default ClientLayout;
