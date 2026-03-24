import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, MessageSquare, User, Clock } from 'lucide-react';
import { adminAPI } from '../services/api';

const AdminModeration = () => {
    const [flaggedItems, setFlaggedItems] = useState([]);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [updatingId, setUpdatingId] = useState(null);

    useEffect(() => {
        let isMounted = true;

        const loadReports = async () => {
            setLoading(true);
            setError('');
            try {
                const data = await adminAPI.getModeration('all');
                if (!isMounted) return;
                setFlaggedItems(Array.isArray(data) ? data : []);
            } catch (err) {
                if (!isMounted) return;
                setError(err.message || 'Failed to load moderation reports');
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadReports();

        return () => {
            isMounted = false;
        };
    }, []);

    const handleAction = async (itemId, action) => {
        setUpdatingId(itemId);
        setError('');
        try {
            const updated = await adminAPI.updateModerationStatus(itemId, action);
            setFlaggedItems(prev => prev.map(item => 
                item.id === itemId ? { ...item, ...updated } : item
            ));
        } catch (err) {
            setError(err.message || 'Failed to update moderation item');
        } finally {
            setUpdatingId(null);
        }
    };

    const formatTimestamp = (value) => {
        const date = value ? new Date(value) : null;
        if (!date || Number.isNaN(date.getTime())) {
            return 'N/A';
        }
        return date.toLocaleString();
    };

    const filteredItems = flaggedItems.filter(item => {
        if (filter === 'all') return true;
        return item.status === filter;
    });

    const getStatusBadge = (status) => {
        const styles = {
            pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
            resolved: 'bg-green-500/10 text-green-500 border-green-500/20',
            removed: 'bg-red-500/10 text-red-500 border-red-500/20',
        };
        return styles[status] || styles.pending;
    };

    const getReasonColor = (reason) => {
        const colors = {
            'Spam': 'text-sky-500',
            'Harassment': 'text-red-500',
            'Inappropriate Content': 'text-purple-500',
            'Fraud': 'text-red-600',
        };
        return colors[reason] || 'text-gray-500';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Content Moderation</h1>
                <p className="text-sm sm:text-base text-slate-600 mt-1">Review and manage flagged content and reports</p>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
                    {error}
                </div>
            )}

            {loading && (
                <div className="bg-white border border-slate-200 rounded-lg p-4 text-sm text-slate-500 shadow-sm">
                    Loading moderation reports...
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="text-2xl font-bold text-foreground">
                        {flaggedItems.length}
                    </div>
                    <div className="text-sm text-slate-600">Total Reports</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="text-2xl font-bold text-yellow-500">
                        {flaggedItems.filter(i => i.status === 'pending').length}
                    </div>
                    <div className="text-sm text-slate-600">Pending Review</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="text-2xl font-bold text-green-500">
                        {flaggedItems.filter(i => i.status === 'resolved').length}
                    </div>
                    <div className="text-sm text-slate-600">Resolved</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="text-2xl font-bold text-red-500">
                        {flaggedItems.filter(i => i.status === 'removed').length}
                    </div>
                    <div className="text-sm text-slate-600">Content Removed</div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`h-9 px-4 rounded-lg text-sm font-medium transition-colors ${
                            filter === 'all' 
                                ? 'bg-sky-500 text-white' 
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter('pending')}
                        className={`h-9 px-4 rounded-lg text-sm font-medium transition-colors ${
                            filter === 'pending' 
                                ? 'bg-sky-500 text-white' 
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                    >
                        Pending
                    </button>
                    <button
                        onClick={() => setFilter('resolved')}
                        className={`h-9 px-4 rounded-lg text-sm font-medium transition-colors ${
                            filter === 'resolved' 
                                ? 'bg-sky-500 text-white' 
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                    >
                        Resolved
                    </button>
                    <button
                        onClick={() => setFilter('removed')}
                        className={`h-9 px-4 rounded-lg text-sm font-medium transition-colors ${
                            filter === 'removed' 
                                ? 'bg-sky-500 text-white' 
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                    >
                        Removed
                    </button>
                </div>
            </div>

            {/* Flagged Items */}
            <div className="space-y-4">
                {filteredItems.map((item) => (
                    <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-1">
                            <div className="flex items-start gap-4 flex-1 min-w-0">
                                <div className={`p-3 rounded-lg ${
                                    item.type === 'message' ? 'bg-sky-500/10' : 'bg-slate-200/80'
                                }`}>
                                    {item.type === 'message' ? (
                                        <MessageSquare className="text-sky-500" size={20} />
                                    ) : (
                                        <User className="text-slate-600" size={20} />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="font-semibold text-foreground">
                                            {item.type === 'message' ? 'Flagged Message' : 'Flagged Profile'}
                                        </h3>
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadge(item.status)}`}>
                                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                        </span>
                                        <span className={`text-sm font-semibold ${getReasonColor(item.reason)}`}>
                                            {item.reason}
                                        </span>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-3">
                                        <p className="text-sm text-foreground">{item.content}</p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <User size={14} />
                                            <span>Reported User: <span className="text-foreground">{item.reportedUser}</span></span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <AlertTriangle size={14} />
                                            <span>Reported By: <span className="text-foreground">{item.reportedBy}</span></span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock size={14} />
                                            <span>{formatTimestamp(item.timestamp)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {item.status === 'pending' && (
                                <div className="grid grid-cols-2 gap-2 lg:ml-4 w-full lg:w-auto">
                                    <button
                                        onClick={() => handleAction(item.id, 'approve')}
                                        disabled={updatingId === item.id}
                                        className="secondary-button w-full"
                                    >
                                        <CheckCircle size={18} />
                                        <span>Dismiss</span>
                                    </button>
                                    <button
                                        onClick={() => handleAction(item.id, 'remove')}
                                        disabled={updatingId === item.id}
                                        className="secondary-button w-full"
                                    >
                                        <XCircle size={18} />
                                        <span>Remove</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {filteredItems.length === 0 && (
                    <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
                        <AlertTriangle className="mx-auto text-muted-foreground mb-4" size={48} />
                        <h3 className="text-lg font-semibold text-foreground mb-2">No flagged content</h3>
                        <p className="text-muted-foreground">
                            {filter === 'all' 
                                ? 'There are no reports to review'
                                : `No ${filter} reports found`
                            }
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminModeration;
