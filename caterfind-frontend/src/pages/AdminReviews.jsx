import React, { useEffect, useState } from 'react';
import { adminAPI } from '../services/api';
import '../styles/Table.css';

const AdminReviews = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [updatingId, setUpdatingId] = useState(null);

    useEffect(() => { load(); }, []);

    const load = async () => {
        setLoading(true); setError('');
        try {
            const data = await adminAPI.getReviews();
            setReviews(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            setError(err.message || 'Failed to load reviews');
        } finally { setLoading(false); }
    };

    const toggleVisibility = async (id, visible) => {
        setUpdatingId(id);
        try {
            await adminAPI.setReviewVisibility(id, visible);
            setReviews(prev => prev.map(r => r.id === id ? { ...r, visible } : r));
        } catch (err) {
            console.error(err);
            alert(err.message || 'Failed to update');
        } finally { setUpdatingId(null); }
    };

    if (loading) return <div className="page-shell">Loading reviews...</div>;

    return (
        <div className="page-shell">
            <header className="page-header">
                <h1 className="page-title">Admin — Reviews</h1>
                <p className="page-subtitle">List and manage user reviews</p>
            </header>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-6">{error}</div>}

            <div className="surface-card p-4">
                {reviews.length === 0 ? (
                    <div className="text-center py-12">No reviews found</div>
                ) : (
                    <ul className="space-y-3">
                        {reviews.map(r => (
                            <li key={r.id} className="border rounded-lg p-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="font-semibold">{r.title || '(no title)'}</div>
                                        <div className="text-sm text-slate-600">{r.body}</div>
                                        <div className="text-xs text-muted-foreground mt-2">by {r.userId || 'unknown'} • {new Date(r.createdAt).toLocaleString()}</div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <div className={`px-2 py-1 rounded-full text-sm ${r.visible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{r.visible ? 'Visible' : 'Hidden'}</div>
                                        <div>
                                            <button disabled={updatingId===r.id} onClick={() => toggleVisibility(r.id, !r.visible)} className="px-3 py-1 bg-primary text-white rounded-lg">{r.visible ? 'Hide' : 'Make Visible'}</button>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default AdminReviews;
