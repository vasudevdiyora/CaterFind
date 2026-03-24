import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users, Calendar, Package, ChevronRight,
    ArrowUpRight, Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { dashboardAPI, meetingRequestAPI, calendarAPI, chatAPI } from '../services/api';

/**
 * Dashboard Component (Tailwind v4 + Loveable Style)
 * 
 * Provides an overview of business operations:
 * - Stats cards with trend indicators
 * - Recent Activity list
 * - Quick Actions
 */
function Dashboard({ user }) {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        pendingRequests: 0,
        upcomingEvents: 0,
        lowStockItems: 0,
        recentActivity: []
    });
    const [messagesUnread, setMessagesUnread] = useState(0);
    const [recentUnreadConvs, setRecentUnreadConvs] = useState([]);

    useEffect(() => {
        const fetchStats = async () => {
            if (!user?.userId) return;
            try {
                // Fetch summary from backend
                const today = new Date().toISOString().split('T')[0];
                const futureDate = '2100-12-31';
                const [summary, pendingCount, pendingRequests, calendarEvents] = await Promise.all([
                    dashboardAPI.getSummary(user.userId),
                    meetingRequestAPI.getPendingCount(),
                    meetingRequestAPI.getCatererRequests('pending'),
                    calendarAPI.getByRange(user.userId, today, futureDate)
                ]);

                const recentActivity = (pendingRequests || []).slice(0, 5).map((request) => ({
                    id: request.id,
                    type: 'meeting',
                    title: request.clientName,
                    subtitle: `${request.eventType} • ${request.numberOfGuests} guests`,
                    status: request.status,
                    time: request.createdAt ? new Date(request.createdAt).toLocaleString() : 'Just now'
                }));

                setStats(prev => ({
                    ...prev,
                    pendingRequests: pendingCount?.count || 0,
                    upcomingEvents: Array.isArray(calendarEvents) ? calendarEvents.length : 0,
                    lowStockItems: summary.lowStockItemsCount,
                    totalContacts: summary.totalContacts,
                    totalMessages: summary.totalMessagesSent,
                    recentActivity
                }));
            } catch {
                // Error fetching dashboard stats
            }
        };

        fetchStats();
        // load unread conversations for dashboard widget
        let mounted = true;
        const loadConvs = async () => {
            try {
                const convs = await chatAPI.getConversations();
                if (!mounted) return;
                const unreadConvs = (convs || []).filter(c => Number(c.unreadCount || 0) > 0);
                setMessagesUnread(unreadConvs.reduce((acc, c) => acc + Number(c.unreadCount || 0), 0));
                // keep up to 3 previews
                setRecentUnreadConvs(unreadConvs.slice(0,3));
            } catch {
                // ignore
            }
        };
        loadConvs();
        const id = setInterval(loadConvs, 10000);
        const cleanup = () => { mounted = false; clearInterval(id); };
        return () => { cleanup(); };
    }, [user]);

    return (
        <div className="page-shell space-y-6 pb-2">
            {/* Header Section */}
            <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between py-1">
                <div className="space-y-1">
                    <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
                    <p className="text-sm sm:text-base text-slate-600">Welcome back to your catering command center.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full sm:w-auto">
                    <button 
                        onClick={() => navigate('/owner/calendar')}
                        className="secondary-button w-full sm:w-auto"
                    >
                        <Calendar className="w-4 h-4 mr-2 text-slate-500" />
                        Availability
                    </button>
                    <button 
                        onClick={() => navigate('/owner/clients')}
                        className="primary-button w-full sm:w-auto"
                    >
                        <Users className="w-4 h-4 mr-2" />
                        New Request
                    </button>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Pending Requests */}
                <div 
                    onClick={() => navigate('/owner/requests')}
                    className="surface-card p-5 cursor-pointer hover:border-sky-200 group relative overflow-hidden"
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Pending Requests</p>
                            <div className="mt-2 flex items-baseline gap-2">
                                <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{stats.pendingRequests}</h3>
                                {stats.pendingRequests > 0 && <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">+New</span>}
                            </div>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-sky-50 transition-colors">
                            <Users className="h-5 w-5 text-slate-400 group-hover:text-sky-600" />
                        </div>
                    </div>
                </div>

                {/* Upcoming Events */}
                <div 
                    onClick={() => navigate('/owner/calendar')}
                    className="surface-card p-5 cursor-pointer hover:border-sky-200 group relative overflow-hidden"
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Upcoming Events</p>
                            <div className="mt-2 flex items-baseline gap-2">
                                <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{stats.upcomingEvents}</h3>
                            </div>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-sky-50 transition-colors">
                            <Calendar className="h-5 w-5 text-slate-400 group-hover:text-sky-600" />
                        </div>
                    </div>
                </div>

                {/* Low Stock */}
                <div 
                    onClick={() => navigate('/owner/inventory')}
                    className="surface-card p-5 cursor-pointer hover:border-rose-200 group relative overflow-hidden"
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Low Stock Items</p>
                            <div className="mt-2 flex items-baseline gap-2">
                                <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{stats.lowStockItems}</h3>
                                {stats.lowStockItems > 0 && <span className="text-xs font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded">Action needed</span>}
                            </div>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-rose-50 transition-colors">
                            <Package className="h-5 w-5 text-slate-400 group-hover:text-rose-500" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activity */}
                <div className="lg:col-span-2 surface-card flex flex-col h-full">
                    <div className="border-b border-slate-100 p-5 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Recent Activity</h3>
                        <button 
                            onClick={() => navigate('/owner/requests')}
                            className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
                        >
                            View All
                        </button>
                    </div>
                    <div className="flex-1 divide-y divide-slate-50">
                        {stats.recentActivity.length > 0 ? (
                            stats.recentActivity.map((activity) => (
                            <div key={activity.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs border border-slate-200 uppercase">
                                        {activity.title.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">{activity.title}</p>
                                        <p className="text-xs text-slate-500">{activity.subtitle}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={cn(
                                        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium capitalize",
                                        activity.status === 'pending' ? "bg-sky-50 text-sky-700 border border-sky-100" :
                                        activity.status === 'accepted' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                                        "bg-slate-100 text-slate-600 border border-slate-200"
                                    )}>
                                        {activity.status}
                                    </span>
                                    <p className="text-[10px] text-slate-400 mt-1">{activity.time}</p>
                                </div>
                            </div>
                            ))
                        ) : (
                            <div className="p-8 text-center text-slate-500 text-sm">
                                No recent activity found.
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Actions & Promo */}
                <div className="space-y-4">
                    {/* Grow Business Promo - Subtle Version */}
                    <div className="surface-card p-5 border-sky-200/70 bg-sky-50/40">
                        <div className="flex items-start justify-between mb-4">
                            <h3 className="text-base font-bold text-slate-900">Grow Your Business</h3>
                            <div className="bg-sky-100 text-sky-700 p-1.5 rounded-md">
                                <ArrowUpRight className="h-4 w-4" />
                            </div>
                        </div>
                        <p className="text-sm text-slate-600 mb-5 leading-relaxed">
                            Complete your profile to unlock 3x more visibility. High-quality profiles attract verified clients.
                        </p>
                        <button
                            onClick={() => navigate('/owner/profile')}
                            className="primary-button w-full">
                            Complete Profile
                        </button>
                    </div>

                    {/* Simple Actions */}
                    {/* Unread Messages Widget */}
                    <div className="surface-card p-5 mb-4">
                        <div className="flex items-start justify-between mb-3">
                            <h3 className="text-sm font-semibold text-slate-900">Messages</h3>
                            {messagesUnread > 0 ? (
                                <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold leading-none text-white bg-rose-600 rounded-full">{messagesUnread}</span>
                            ) : (
                                <span className="text-xs text-slate-400">No unread</span>
                            )}
                        </div>
                        {recentUnreadConvs.length === 0 ? (
                            <div className="text-sm text-slate-500">No unread messages</div>
                        ) : (
                            <div className="space-y-2">
                                {recentUnreadConvs.map(conv => (
                                    <button key={conv.id} onClick={() => navigate('/owner/messages', { state: { openConversationWith: conv.participantId, clientName: conv.participantName } })} className="w-full text-left p-3 rounded-lg hover:bg-slate-50 transition-colors flex items-start justify-between border border-transparent hover:border-slate-200">
                                        <div>
                                            <div className="font-medium text-slate-800">{conv.participantName}</div>
                                            <div className="text-xs text-slate-500 truncate max-w-[220px]">{conv.lastMessage || '—'}</div>
                                        </div>
                                        <div className="text-xs text-slate-400">{new Date(conv.lastMessageTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                                    </button>
                                ))}
                                <div className="mt-2">
                                    <button onClick={() => navigate('/owner/messages')} className="text-xs font-medium text-slate-600 hover:underline">View all messages</button>
                                </div>
                            </div>
                        )}
                    </div>

                        <div className="surface-card p-0 overflow-hidden divide-y divide-slate-100">
                         <button 
                            onClick={() => navigate('/owner/calendar')}
                            className="w-full p-5 flex items-center justify-between hover:bg-slate-50 transition-colors group text-left"
                        >
                            <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">View Calendar</span>
                            <Calendar className="h-4 w-4 text-slate-400 group-hover:text-slate-600" />
                        </button>
                        <button 
                            onClick={() => navigate('/owner/inventory')}
                            className="w-full p-5 flex items-center justify-between hover:bg-slate-50 transition-colors group text-left"
                        >
                            <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Waitlist Inventory</span>
                            <Package className="h-4 w-4 text-slate-400 group-hover:text-slate-600" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
