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

    if (loading) return <div className="page-shell"><div className="surface-card p-5 text-sm text-slate-500">Loading reviews...</div></div>;

    return (
        <div className="page-shell space-y-6">
            <header className="rounded-2xl border border-slate-200 bg-gradient-to-r from-white via-sky-50/35 to-white p-5 sm:p-6 shadow-sm">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Admin Reviews</h1>
                <p className="text-sm sm:text-base text-slate-600 mt-1">List and manage user reviews</p>
            </header>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-6">{error}</div>}

            <div className="surface-card p-5 sm:p-6">
                {reviews.length === 0 ? (
                    <div className="text-center py-12">No reviews found</div>
                ) : (
                    <ul className="space-y-3">
                        {reviews.map(r => (
                            <li key={r.id} className="border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                    <div>
                                        <div className="font-semibold text-slate-900">{r.title || '(no title)'}</div>
                                        <div className="text-sm text-slate-600">{r.body}</div>
                                        <div className="text-xs text-muted-foreground mt-2">by {r.userId || 'unknown'} • {new Date(r.createdAt).toLocaleString()}</div>
                                    </div>
                                    <div className="flex flex-col sm:items-end gap-2">
                                        <div className={`px-2 py-1 rounded-full text-sm ${r.visible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{r.visible ? 'Visible' : 'Hidden'}</div>
                                        <div>
                                            <button disabled={updatingId===r.id} onClick={() => toggleVisibility(r.id, !r.visible)} className="primary-button">{r.visible ? 'Hide' : 'Make Visible'}</button>
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
