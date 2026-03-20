import React, { useState, useEffect } from 'react';
import { 
    Users, UserCheck, MessageSquare, Calendar, 
    TrendingUp, Activity, AlertCircle 
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
            title: 'Total Users',
            value: stats.totalUsers,
            icon: Users,
            color: 'bg-blue-500',
            change: '+12%'
        },
        {
            title: 'Caterers',
            value: stats.totalCaterers,
            icon: UserCheck,
            color: 'bg-green-500',
            change: '+8%'
        },
        {
            title: 'Clients',
            value: stats.totalClients,
            icon: Users,
            color: 'bg-purple-500',
            change: '+15%'
        },
        {
            title: 'Active Conversations',
            value: stats.activeConversations,
            icon: MessageSquare,
            color: 'bg-orange-500',
            change: '+5%'
        },
        {
            title: 'Scheduled Trials',
            value: stats.scheduledTrials,
            icon: Calendar,
            color: 'bg-pink-500',
            change: '+20%'
        },
        {
            title: 'New Registrations',
            value: stats.newRegistrations,
            icon: TrendingUp,
            color: 'bg-cyan-500',
            subtitle: 'This week'
        },
        {
            title: 'Pending Approvals',
            value: stats.pendingApprovals,
            icon: AlertCircle,
            color: 'bg-yellow-500',
            urgent: true
        },
        {
            title: 'Flagged Content',
            value: stats.flaggedContent,
            icon: AlertCircle,
            color: 'bg-red-500',
            urgent: true
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
                    <p className="text-muted-foreground mt-1">Welcome to CaterFind Admin Panel</p>
                </div>
                <div className="text-sm text-muted-foreground">
                    Last updated: {new Date().toLocaleString()}
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg p-4">
                    {error}
                </div>
            )}

            {loading && (
                <div className="bg-card border border-border rounded-lg p-4 text-sm text-muted-foreground">
                    Loading dashboard data...
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div 
                            key={index}
                            className={`bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow ${
                                stat.urgent ? 'ring-2 ring-red-400' : ''
                            }`}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-lg ${stat.color} bg-opacity-10`}>
                                    <Icon className={`${stat.color.replace('bg-', 'text-')}`} size={24} />
                                </div>
                                {stat.change && (
                                    <span className="text-sm text-green-500 font-semibold">
                                        {stat.change}
                                    </span>
                                )}
                            </div>
                            <h3 className="text-2xl font-bold text-foreground mb-1">
                                {stat.value}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                {stat.title}
                            </p>
                            {stat.subtitle && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    {stat.subtitle}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Growth Chart Placeholder */}
                <div className="bg-card border border-border rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-foreground mb-4">User Growth</h2>
                    <div className="h-64 flex items-center justify-center bg-secondary/20 rounded-lg">
                        <p className="text-muted-foreground">Chart Coming Soon</p>
                    </div>
                </div>

                {/* Activity Chart Placeholder */}
                <div className="bg-card border border-border rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-foreground mb-4">Platform Activity</h2>
                    <div className="h-64 flex items-center justify-center bg-secondary/20 rounded-lg">
                        <p className="text-muted-foreground">Chart Coming Soon</p>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4">Recent Activity</h2>
                <div className="space-y-4">
                    {recentActivity.map((activity) => (
                        <div 
                            key={activity.id}
                            className="flex items-center gap-4 p-3 hover:bg-secondary/50 rounded-lg transition-colors"
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                activity.type === 'registration' ? 'bg-green-500/10 text-green-500' :
                                activity.type === 'trial' ? 'bg-blue-500/10 text-blue-500' :
                                activity.type === 'message' ? 'bg-orange-500/10 text-orange-500' :
                                'bg-purple-500/10 text-purple-500'
                            }`}>
                                <Activity size={20} />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-foreground">{activity.user}</p>
                                <p className="text-xs text-muted-foreground">{activity.time}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="bg-primary text-primary-foreground p-4 rounded-lg hover:bg-primary/90 transition-colors">
                    <h3 className="font-semibold mb-1">Review Pending Approvals</h3>
                    <p className="text-sm opacity-90">{stats.pendingApprovals} caterers waiting</p>
                </button>
                <button className="bg-orange-500 text-white p-4 rounded-lg hover:bg-orange-600 transition-colors">
                    <h3 className="font-semibold mb-1">Check Flagged Content</h3>
                    <p className="text-sm opacity-90">{stats.flaggedContent} items need review</p>
                </button>
                <button className="bg-green-500 text-white p-4 rounded-lg hover:bg-green-600 transition-colors">
                    <h3 className="font-semibold mb-1">View All Users</h3>
                    <p className="text-sm opacity-90">{stats.totalUsers} total users</p>
                </button>
            </div>
        </div>
    );
};

export default AdminDashboard;
