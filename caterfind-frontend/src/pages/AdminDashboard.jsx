import React, { useState, useEffect } from 'react';
import { 
    Users, UserCheck, MessageSquare, Calendar, 
    TrendingUp, Activity, AlertCircle, Clock3, Sparkles, ArrowUpRight
} from 'lucide-react';
import { adminAPI } from '../services/api';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalCaterers: 0,
        totalClients: 0,
        activeConversations: 0,
        scheduledTrials: 0,
        newRegistrations: 0,
        pendingApprovals: 0,
        flaggedContent: 0
    });

    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let isMounted = true;

        const loadDashboard = async () => {
            setLoading(true);
            setError('');
            try {
                const data = await adminAPI.getDashboard();
                if (!isMounted) return;
                setStats(prev => ({ ...prev, ...(data.stats || {}) }));
                setRecentActivity(data.recentActivity || []);
            } catch (err) {
                if (!isMounted) return;
                setError(err.message || 'Failed to load admin dashboard');
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadDashboard();

        return () => {
            isMounted = false;
        };
    }, []);

    const statCards = [
        {
            title: 'Total Accounts',
            value: stats.totalUsers,
            icon: Users,
            color: 'text-blue-600 bg-blue-50 border-blue-100',
            change: '+12%'
        },
        {
            title: 'Caterers',
            value: stats.totalCaterers,
            icon: UserCheck,
            color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
            change: '+8%'
        },
        {
            title: 'Clients',
            value: stats.totalClients,
            icon: Users,
            color: 'text-violet-600 bg-violet-50 border-violet-100',
            change: '+15%'
        },
        {
            title: 'Active Conversations',
            value: stats.activeConversations,
            icon: MessageSquare,
            color: 'text-sky-600 bg-sky-50 border-sky-100',
            change: '+5%'
        },
        {
            title: 'Scheduled Trials',
            value: stats.scheduledTrials,
            icon: Calendar,
            color: 'text-rose-600 bg-rose-50 border-rose-100',
            change: '+20%'
        },
        {
            title: 'New Registrations',
            value: stats.newRegistrations,
            icon: TrendingUp,
            color: 'text-sky-600 bg-sky-50 border-sky-100',
            subtitle: 'This week'
        },
        {
            title: 'Pending Approvals',
            value: stats.pendingApprovals,
            icon: AlertCircle,
            color: 'text-yellow-700 bg-yellow-50 border-yellow-200',
            urgent: true
        },
        {
            title: 'Flagged Content',
            value: stats.flaggedContent,
            icon: AlertCircle,
            color: 'text-red-600 bg-red-50 border-red-100',
            urgent: true
        },
    ];

    return (
        <div className="page-shell space-y-6">
            {/* Header */}
            <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-white via-sky-50/40 to-white p-5 md:p-6 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
                        <p className="mt-1 text-sm sm:text-base text-slate-600">Monitor platform health, growth, and daily operations.</p>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm">
                        <Clock3 size={16} className="text-slate-500" />
                        Last updated: {new Date().toLocaleString()}
                    </div>
                </div>
            </div>

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                    {error}
                </div>
            )}

            {loading && (
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                    Loading dashboard data...
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {statCards.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div 
                            key={index}
                            className={`rounded-2xl border bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                                stat.urgent ? 'border-red-200 ring-1 ring-red-100' : 'border-slate-200'
                            }`}
                        >
                            <div className="mb-4 flex items-center justify-between">
                                <div className={`rounded-xl border p-3 ${stat.color}`}>
                                    <Icon size={20} />
                                </div>
                                {stat.change && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                                        <ArrowUpRight size={12} />
                                        {stat.change}
                                    </span>
                                )}
                            </div>
                            <h3 className="mb-1 text-2xl font-bold text-slate-900">
                                {stat.value}
                            </h3>
                            <p className="text-sm font-medium text-slate-600">
                                {stat.title}
                            </p>
                            {stat.subtitle && (
                                <p className="mt-1 text-xs text-slate-500">
                                    {stat.subtitle}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Growth Chart Placeholder */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-xl font-semibold text-slate-900">Platform Growth</h2>
                    <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center">
                        <Sparkles size={22} className="mb-2 text-slate-400" />
                        <p className="text-sm font-medium text-slate-600">Chart coming soon</p>
                        <p className="text-xs text-slate-500">Daily signups, engagement, and retention trends.</p>
                    </div>
                </div>

                {/* Activity Chart Placeholder */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-xl font-semibold text-slate-900">Platform Activity</h2>
                    <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center">
                        <Sparkles size={22} className="mb-2 text-slate-400" />
                        <p className="text-sm font-medium text-slate-600">Chart coming soon</p>
                        <p className="text-xs text-slate-500">Messages, trials, and requests over time.</p>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-xl font-semibold text-slate-900">Recent Activity</h2>
                <div className="space-y-3">
                    {recentActivity.length === 0 && !loading && (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                            No recent activity to display.
                        </div>
                    )}

                    {recentActivity.map((activity) => (
                        <div
                            key={activity.id}
                            className="flex items-center gap-4 rounded-xl border border-slate-200 px-4 py-3 transition-colors hover:bg-slate-50"
                        >
                            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                                activity.type === 'registration' ? 'bg-emerald-100 text-emerald-700' :
                                activity.type === 'trial' ? 'bg-sky-100 text-sky-700' :
                                activity.type === 'message' ? 'bg-sky-100 text-sky-700' :
                                'bg-violet-100 text-violet-700'
                            }`}>
                                <Activity size={18} />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-slate-800">{activity.user}</p>
                                <p className="text-xs text-slate-500">{activity.time}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <button className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-left transition-colors hover:bg-sky-100">
                    <h3 className="mb-1 text-sm font-semibold text-sky-900">Review Pending Approvals</h3>
                    <p className="text-sm text-sky-800">{stats.pendingApprovals} caterers waiting</p>
                </button>
                <button className="rounded-2xl border border-red-200 bg-red-50 p-4 text-left transition-colors hover:bg-red-100">
                    <h3 className="mb-1 text-sm font-semibold text-red-900">Check Flagged Content</h3>
                    <p className="text-sm text-red-800">{stats.flaggedContent} items need review</p>
                </button>
                <button className="rounded-2xl border border-slate-200 bg-white p-4 text-left transition-colors hover:bg-slate-50">
                    <h3 className="mb-1 text-sm font-semibold text-slate-900">View All Accounts</h3>
                    <p className="text-sm text-slate-600">{stats.totalUsers} total accounts</p>
                </button>
            </div>
        </div>
    );
};

export default AdminDashboard;
