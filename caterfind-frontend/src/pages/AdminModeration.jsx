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
            'Spam': 'text-orange-500',
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
                <h1 className="text-3xl font-bold text-foreground">Content Moderation</h1>
                <p className="text-muted-foreground mt-1">Review and manage flagged content and reports</p>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg p-4">
                    {error}
                </div>
            )}

            {loading && (
                <div className="bg-card border border-border rounded-lg p-4 text-sm text-muted-foreground">
                    Loading moderation reports...
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-card border border-border rounded-lg p-4">
                    <div className="text-2xl font-bold text-foreground">
                        {flaggedItems.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Reports</div>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                    <div className="text-2xl font-bold text-yellow-500">
                        {flaggedItems.filter(i => i.status === 'pending').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Pending Review</div>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-500">
                        {flaggedItems.filter(i => i.status === 'resolved').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Resolved</div>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                    <div className="text-2xl font-bold text-red-500">
                        {flaggedItems.filter(i => i.status === 'removed').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Content Removed</div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                            filter === 'all' 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-secondary text-foreground hover:bg-secondary/80'
                        }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter('pending')}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                            filter === 'pending' 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-secondary text-foreground hover:bg-secondary/80'
                        }`}
                    >
                        Pending
                    </button>
                    <button
                        onClick={() => setFilter('resolved')}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                            filter === 'resolved' 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-secondary text-foreground hover:bg-secondary/80'
                        }`}
                    >
                        Resolved
                    </button>
                    <button
                        onClick={() => setFilter('removed')}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                            filter === 'removed' 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-secondary text-foreground hover:bg-secondary/80'
                        }`}
                    >
                        Removed
                    </button>
                </div>
            </div>

            {/* Flagged Items */}
            <div className="space-y-4">
                {filteredItems.map((item) => (
                    <div key={item.id} className="bg-card border border-border rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start gap-4 flex-1">
                                <div className={`p-3 rounded-lg ${
                                    item.type === 'message' ? 'bg-blue-500/10' : 'bg-purple-500/10'
                                }`}>
                                    {item.type === 'message' ? (
                                        <MessageSquare className="text-blue-500" size={24} />
                                    ) : (
                                        <User className="text-purple-500" size={24} />
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
                                    <div className="bg-secondary/50 border border-border rounded p-3 mb-3">
                                        <p className="text-sm text-foreground">{item.content}</p>
                                    </div>
                                    <div className="flex items-center gap-6 text-xs text-muted-foreground">
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
                                <div className="flex gap-2 ml-4">
                                    <button
                                        onClick={() => handleAction(item.id, 'approve')}
                                        disabled={updatingId === item.id}
                                        className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                                    >
                                        <CheckCircle size={18} />
                                        <span>Dismiss</span>
                                    </button>
                                    <button
                                        onClick={() => handleAction(item.id, 'remove')}
                                        disabled={updatingId === item.id}
                                        className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
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
                    <div className="bg-card border border-border rounded-lg p-12 text-center">
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
