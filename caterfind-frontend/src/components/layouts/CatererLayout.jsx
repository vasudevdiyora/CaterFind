/**
 * Caterer Layout Component
 * Provides sidebar navigation for caterer pages
 * Matches Loveable's OwnerLayout structure
 */
import { useState } from 'react';
import { NavLink } from '@/components/NavLink';
import {
    LayoutDashboard, Building2, Users, MessageSquare,
    Package, Menu, X, LogOut, Contact, Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';

const CatererLayout = ({ children, user, onLogout, onNavigate, currentPage }) => {
    // Mobile sidebar toggle state
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Handle logout action
    const handleLogout = () => {
        if (onLogout) onLogout();
    };

    // Handle navigation (for non-React Router setup)
    const handleNavClick = (pageId) => {
        if (onNavigate) {
            onNavigate(pageId);
        }
        setSidebarOpen(false);
    };

    // Navigation menu items
    const navItems = [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { id: 'business', icon: Building2, label: 'My Business' },
        { id: 'availability', icon: Calendar, label: 'Availability' },
        { id: 'contacts', icon: Contact, label: 'Contacts' },
        { id: 'inventory', icon: Package, label: 'Inventory' },
        { id: 'messages', icon: MessageSquare, label: 'Messages' },
    ];

    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar Overlay (Mobile) */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-background/80 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border",
                "transform transition-transform duration-200 ease-in-out",
                sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            )}>
                <div className="flex flex-col h-full">
                    {/* Sidebar Header */}
                    <div className="p-4 border-b border-sidebar-border">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                                    <span className="text-primary-foreground font-bold text-lg">
                                        🍴
                                    </span>
                                </div>
                                <div>
                                    <p className="font-semibold text-sidebar-foreground">Caterer Panel</p>
                                    <p className="text-xs text-muted-foreground">{user?.name || 'admin'}</p>
                                </div>
                            </div>
                            {/* Close button (mobile only) */}
                            <button className="lg:hidden p-2" onClick={() => setSidebarOpen(false)}>
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                        {navItems.map(({ id, icon: Icon, label }) => (
                            <button
                                key={id}
                                onClick={() => handleNavClick(id)}
                                className={cn(
                                    "flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors",
                                    currentPage === id && "bg-sidebar-accent text-primary"
                                )}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="font-medium">{label}</span>
                            </button>
                        ))}
                    </nav>

                    {/* Logout Button */}
                    <div className="p-4 border-t border-sidebar-border">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                            <span className="font-medium">Logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile Header */}
                <header className="lg:hidden sticky top-0 z-30 bg-card border-b border-border px-4 py-3">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2">
                            <Menu className="w-6 h-6" />
                        </button>
                        <h1 className="font-semibold text-lg">Caterer Panel</h1>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 lg:p-6 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default CatererLayout;
