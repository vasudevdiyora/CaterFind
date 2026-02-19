import React, { useState, useEffect } from 'react';
import {
    Users, Calendar, Package, ChevronRight,
    ArrowUpRight, Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { dashboardAPI } from '../services/api';

/**
 * Dashboard Component (Tailwind v4 + Loveable Style)
 * 
 * Provides an overview of business operations:
 * - Stats cards with trend indicators
 * - Recent Activity list
 * - Quick Actions
 */
function Dashboard({ user }) {
    const [stats, setStats] = useState({
        pendingRequests: 0,
        upcomingEvents: 0,
        lowStockItems: 0,
        recentActivity: []
    });

    useEffect(() => {
        const fetchStats = async () => {
            if (!user?.userId) return;
            try {
                // Fetch summary from backend
                const data = await dashboardAPI.getSummary(user.userId);
                setStats(prev => ({
                    ...prev,
                    lowStockItems: data.lowStockItemsCount,
                    totalContacts: data.totalContacts,
                    totalMessages: data.totalMessagesSent
                    // pendingRequests and upcomingEvents are not yet real in backend, keep mocked or add fields later
                }));
            } catch (error) {
                // Error fetching dashboard stats
            }
        };

        // Initial Mock Data for things not yet in backend
        setStats(prev => ({
            ...prev,
            pendingRequests: 2,
            upcomingEvents: 0,
            recentActivity: [
                { id: 1, type: 'meeting', title: 'Rajesh Kumar', subtitle: 'Wedding • 500 guests', status: 'pending', time: '10 mins ago' },
                { id: 2, type: 'event', title: 'Priya Sharma', subtitle: 'Birthday Party • 100 guests', status: 'pending', time: '2 hours ago' }
            ]
        }));

        fetchStats();
    }, [user]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 text-left">
            {/* Header Section */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
                <p className="text-muted-foreground mt-1">Welcome back! Here's what's happening today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Pending Requests */}
                <div className="group relative overflow-hidden rounded-xl border bg-card p-6 transition-all hover:shadow-lg hover:shadow-primary/5 cursor-pointer">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-left">Meeting Requests</p>
                            <h3 className="text-4xl font-bold mt-2 text-left">{stats.pendingRequests}</h3>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary transition-transform group-hover:scale-110">
                            <Users className="h-6 w-6" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-green-500 font-medium">
                        <ArrowUpRight className="h-4 w-4 mr-1" />
                        <span>+12% from last week</span>
                    </div>
                    <ChevronRight className="absolute bottom-4 right-4 h-5 w-5 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1" />
                </div>

                {/* Upcoming Events */}
                <div className="group relative overflow-hidden rounded-xl border bg-card p-6 transition-all hover:shadow-lg hover:shadow-primary/5 cursor-pointer">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-left">Upcoming Events</p>
                            <h3 className="text-4xl font-bold mt-2 text-left">{stats.upcomingEvents}</h3>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary transition-transform group-hover:scale-110">
                            <Calendar className="h-6 w-6" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>No events scheduled today</span>
                    </div>
                    <ChevronRight className="absolute bottom-4 right-4 h-5 w-5 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1" />
                </div>

                {/* Low Stock */}
                <div className="group relative overflow-hidden rounded-xl border bg-card p-6 transition-all hover:shadow-lg hover:shadow-primary/5 lg:col-span-1 md:col-span-2 cursor-pointer">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-left">Low Stock Items</p>
                            <h3 className="text-4xl font-bold mt-2 text-destructive text-left">{stats.lowStockItems}</h3>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive transition-transform group-hover:scale-110">
                            <Package className="h-6 w-6" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-muted-foreground">
                        <span>Inventory is fully stocked</span>
                    </div>
                    <ChevronRight className="absolute bottom-4 right-4 h-5 w-5 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1" />
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Recent Activity */}
                <div className="rounded-xl border bg-card overflow-hidden">
                    <div className="border-b bg-card/50 p-6 flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Recent Meeting Requests</h3>
                        <button className="text-sm font-medium text-primary hover:underline">View All</button>
                    </div>
                    <div className="divide-y border-border">
                        {stats.recentActivity.map((activity) => (
                            <div key={activity.id} className="p-6 flex items-center justify-between hover:bg-muted/5 transition-colors group text-left">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center font-bold text-secondary-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors uppercase">
                                        {activity.title.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-semibold">{activity.title}</p>
                                        <p className="text-sm text-muted-foreground">{activity.subtitle}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary capitalize">
                                        {activity.status}
                                    </span>
                                    <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Shortcuts / Info */}
                <div className="space-y-6">
                    <div className="rounded-xl border bg-primary/5 p-8 border-primary/20 text-left">
                        <h3 className="text-xl font-bold text-primary">Grow Your Business</h3>
                        <p className="text-muted-foreground mt-2 leading-relaxed">
                            Complete your business profile to get higher visibility.
                            Caterers with complete profiles receive 3x more trial requests.
                        </p>
                        <button className="mt-6 inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:scale-105">
                            Complete Profile
                            <ArrowUpRight className="ml-2 h-4 w-4" />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-xl border bg-card p-4 hover:border-primary/30 transition-colors cursor-pointer group">
                            <p className="text-sm font-medium flex items-center text-muted-foreground group-hover:text-primary transition-colors">
                                <Calendar className="h-4 w-4 mr-2" />
                                View Calendar
                            </p>
                        </div>
                        <div className="rounded-xl border bg-card p-4 hover:border-primary/30 transition-colors cursor-pointer group">
                            <p className="text-sm font-medium flex items-center text-muted-foreground group-hover:text-primary transition-colors">
                                <Package className="h-4 w-4 mr-2" />
                                Check Inventory
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
