import React from "react";
import { LogOut, User, Menu } from "lucide-react";

const ClientLayout = ({ user, children, onLogout }) => {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Navbar */}
            <nav className="h-16 border-b border-border bg-card px-4 md:px-6 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">🍽️</span>
                    <span className="font-bold text-lg text-foreground">CaterFind</span>
                </div>

                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground">
                        <User size={18} />
                    </div>
                    {user?.email && (
                        <span className="text-sm font-medium hidden md:block text-foreground">
                            {user.email}
                        </span>
                    )}
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
            <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6">
                {children}
            </main>
        </div>
    );
};

export default ClientLayout;
