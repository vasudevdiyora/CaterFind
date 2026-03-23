import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, MapPin, Phone, Mail, Calendar, Utensils, MessageCircle, Building, Compass, ChefHat } from 'lucide-react';
import { profileAPI, fileAPI, dishAPI, reviewsAPI, moderationAPI } from '../services/api';
import MeetingRequestModal from '../components/MeetingRequestModal';
import ReportModal from '../components/ReportModal';
import { useToast } from '../components/ToastProvider';
import '../styles/Table.css';

const CatererDetail = ({ user }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const catererId = id;

    const [caterer, setCaterer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dishes, setDishes] = useState([]);
    const [loadingDishes, setLoadingDishes] = useState(true);
    const [reviews, setReviews] = useState([]);
    const [ratingSummary, setRatingSummary] = useState({ average: 0, count: 0, distribution: {} });
    const [submittingReview, setSubmittingReview] = useState(false);
    const [newReview, setNewReview] = useState({ rating: 0, title: '', body: '' });
    const [showMeetingModal, setShowMeetingModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportTarget, setReportTarget] = useState(null);
    const toast = useToast();

    useEffect(() => {
        if (catererId) {
            loadCaterer();
            loadDishes();
            loadReviews();
            loadRatingSummary();
        }
    }, [catererId]);

    const loadReviews = async () => {
        try {
            const data = await reviewsAPI.list(catererId);
            setReviews(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error loading reviews:', error);
            setReviews([]);
        }
    };

    const loadRatingSummary = async () => {
        try {
            const data = await reviewsAPI.summary(catererId);
            setRatingSummary(data || { average: 0, count: 0, distribution: {} });
        } catch (error) {
            console.error('Error loading rating summary:', error);
            setRatingSummary({ average: 0, count: 0, distribution: {} });
        }
    };

    const loadCaterer = async () => {
        try {
            const data = await profileAPI.get(catererId);
            setCaterer(data);
        } catch (error) {
            console.error('Error loading caterer:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadDishes = async () => {
        try {
            setLoadingDishes(true);
            const data = await dishAPI.getAll(catererId);
            setDishes(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error loading dishes:', error);
            setDishes([]);
        } finally {
            setLoadingDishes(false);
        }
    };

    const trendingDishes = useMemo(() => {
        if (!dishes || dishes.length === 0) return [];
        // Simple sort for now, can be enhanced with view counts or ratings later
        return dishes.slice(0, 8);
    }, [dishes]);

    const galleryImages = useMemo(() => {
        if (caterer?.businessPhotos) {
            return caterer.businessPhotos.split(',')
                .map(url => url.trim())
                .filter(Boolean)
                .map(url => fileAPI.getImageUrl(url));
        }
        return [];
    }, [caterer]);

    if (loading) {
        return <div className="page-shell justify-center items-center">Loading...</div>;
    }

    if (!caterer) {
        return <div className="page-shell justify-center items-center text-red-600">Caterer not found.</div>;
    }

    const DishCard = ({ dish }) => (
        <div className="surface-card overflow-hidden text-center">
            <img src={fileAPI.getImageUrl(dish.imageUrl)} alt={dish.name} className="w-full h-32 object-cover" />
            <div className="p-3">
                <h4 className="font-bold text-slate-800 truncate">{dish.name}</h4>
                <p className="text-sm text-slate-500">{dish.category}</p>
            </div>
        </div>
    );

    return (
        <div className="bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Header and Back Button */}
                <header className="py-6 px-4 sm:px-6 lg:px-8">
                    <button onClick={() => navigate(-1)} className="secondary-button-sm flex items-center gap-2">
                        <ArrowLeft size={16} />
                        Back to Discovery
                    </button>
                </header>

                {/* Main Content Grid */}
                <main className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-4 sm:px-6 lg:px-8 pb-16">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Hero Image */}
                        <div className="surface-card p-0 overflow-hidden">
                            <img
                                src={fileAPI.getImageUrl(caterer.imageUrl) || 'https://via.placeholder.com/800x400'}
                                alt={caterer.businessName}
                                className="w-full h-64 object-cover"
                            />
                            <div className="p-6">
                                <h1 className="text-3xl font-extrabold text-slate-900">{caterer.businessName}</h1>
                                <p className="text-slate-600 mt-2">{caterer.description}</p>
                            </div>
                        </div>

                        {/* Trending Dishes */}
                        <div className="surface-card">
                            <h2 className="card-header">Trending Dishes</h2>
                            {loadingDishes ? (
                                <p className="p-6">Loading dishes...</p>
                            ) : trendingDishes.length > 0 ? (
                                <div className="p-6 dense-grid grid-cols-2 md:grid-cols-4">
                                    {trendingDishes.map(dish => <DishCard key={dish.id} dish={dish} />)}
                                </div>
                            ) : (
                                <p className="p-6 text-slate-500">No dishes found for this caterer.</p>
                            )}
                        </div>

                        {/* Photo Gallery */}
                        {galleryImages.length > 0 && (
                            <div className="surface-card">
                                <h2 className="card-header">Gallery</h2>
                                <div className="p-6 dense-grid grid-cols-2 md:grid-cols-3">
                                    {galleryImages.map((url, index) => (
                                        <div key={index} className="aspect-w-1 aspect-h-1">
                                            <img src={url} alt={`Gallery image ${index + 1}`} className="w-full h-full object-cover rounded-lg" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Reviews */}
                        <div className="surface-card">
                            <h2 className="card-header">Reviews</h2>
                            <div className="p-6">
                                {reviews.length === 0 ? (
                                    <p className="text-slate-500">No reviews yet. Be the first to review this caterer.</p>
                                ) : (
                                    <ul className="space-y-4">
                                        {reviews.map((r) => (
                                            <li key={r.id} className="border rounded-lg p-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        {[1,2,3,4,5].map((s)=> (
                                                            <Star key={s} size={14} className={s <= r.rating ? 'text-amber-500' : 'text-slate-300'} />
                                                        ))}
                                                        <strong className="ml-2">{r.title || ''}</strong>
                                                    </div>
                                                    <small className="text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</small>
                                                </div>
                                                            {r.body && <p className="text-slate-700 mt-2">{r.body}</p>}
                                                            <div className="mt-2 flex justify-end">
                                                                <button className="text-sm text-red-600 hover:underline" onClick={() => {
                                                                    setReportTarget(r);
                                                                    setShowReportModal(true);
                                                                }}>Report</button>
                                                            </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column (Sticky) */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-8 space-y-8">
                            {/* Action Card */}
                            <div className="surface-card text-center">
                                <div className="p-6">
                                    <div className="flex justify-center items-center gap-2 text-sky-500 mb-4">
                                        <Star size={24} fill="currentColor" />
                                            <span className="text-3xl font-bold text-slate-800">{(ratingSummary?.average && ratingSummary.count>0) ? Number(ratingSummary.average).toFixed(1) : (caterer.averageRating?.toFixed(1) || 'New')}</span>
                                    </div>
                                        <p className="text-slate-500 mb-6">{ratingSummary.count || 0} reviews</p>
                                    <div className="space-y-3">
                                        <button onClick={() => setShowMeetingModal(true)} className="primary-button w-full">
                                            <Calendar size={16} className="mr-2" />
                                            Request a Meeting
                                        </button>
                                        <button 
                                            onClick={() => navigate('/client/messages', { 
                                                state: { 
                                                    openConversationWith: catererId,
                                                    catererName: caterer.businessName 
                                                } 
                                            })} 
                                            className="secondary-button w-full flex items-center justify-center"
                                        >
                                            <MessageCircle size={16} className="mr-2" />
                                            Send a Message
                                        </button>
                                    </div>
                                        {/* Review submission (clients only) */}
                                        <div className="mt-4 pt-4 border-t">
                                            <h4 className="font-semibold mb-2">Leave a review</h4>
                                            <div className="flex items-center gap-2 mb-2">
                                                {[1,2,3,4,5].map((s) => (
                                                    <button key={s} onClick={() => setNewReview(prev => ({...prev, rating: s}))} className={`text-${s <= newReview.rating ? 'amber' : 'gray'}-500`} aria-label={`${s} stars`}>
                                                        <Star size={18} className={s <= newReview.rating ? 'text-amber-500' : 'text-slate-300'} />
                                                    </button>
                                                ))}
                                            </div>
                                            <input type="text" placeholder="Title (optional)" value={newReview.title} onChange={(e)=>setNewReview(prev=>({...prev,title:e.target.value}))} className="form-input mb-2" />
                                            <textarea placeholder="Share your experience" value={newReview.body} onChange={(e)=>setNewReview(prev=>({...prev,body:e.target.value}))} className="form-input mb-2" rows={3} />
                                            <button className="primary-button w-full" disabled={submittingReview} onClick={async ()=>{
                                                if (!newReview.rating) { toast.show('Please select a rating', { type: 'error' }); return; }
                                                try {
                                                    setSubmittingReview(true);
                                                    // include user id if available
                                                    const payload = { ...newReview, userId: user?.userId || null };
                                                    await reviewsAPI.create(catererId, payload);
                                                    setNewReview({ rating:0, title:'', body:'' });
                                                    await loadReviews();
                                                    await loadRatingSummary();
                                                    toast.show('Thanks for your review!', { type: 'success' });
                                                } catch (err) {
                                                    console.error('Error submitting review', err);
                                                    toast.show(err.message || 'Failed to submit review', { type: 'error' });
                                                } finally { setSubmittingReview(false); }
                                            }}>Submit Review</button>
                                        </div>
                                </div>
                            </div>

                            {/* Details Card */}
                            <div className="surface-card">
                                <h2 className="card-header">Details</h2>
                                <div className="p-6 space-y-4">
                                    <div className="flex items-start gap-4">
                                        <div className="icon-wrapper"><Building size={18} /></div>
                                        <div>
                                            <h4 className="font-semibold text-slate-800">Location</h4>
                                            <p className="text-slate-600">{caterer.area}, {caterer.city}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="icon-wrapper"><Compass size={18} /></div>
                                        <div>
                                            <h4 className="font-semibold text-slate-800">Service Radius</h4>
                                            <p className="text-slate-600">{caterer.serviceRadius} km</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="icon-wrapper"><ChefHat size={18} /></div>
                                        <div>
                                            <h4 className="font-semibold text-slate-800">Specialty</h4>
                                            <p className="text-slate-600">{caterer.specialty || 'Not specified'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="icon-wrapper"><Phone size={18} /></div>
                                        <div>
                                            <h4 className="font-semibold text-slate-800">Phone</h4>
                                            <p className="text-slate-600">{caterer.primaryPhone}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="icon-wrapper"><Mail size={18} /></div>
                                        <div>
                                            <h4 className="font-semibold text-slate-800">Email</h4>
                                            <p className="text-slate-600 break-all">{caterer.email}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {showMeetingModal && (
                <MeetingRequestModal
                    isOpen={showMeetingModal}
                    onClose={() => setShowMeetingModal(false)}
                    catererId={catererId}
                    clientId={user?.userId}
                />
            )}
            {showReportModal && (
                <ReportModal
                    isOpen={showReportModal}
                    onClose={() => { setShowReportModal(false); setReportTarget(null); }}
                    content={reportTarget?.body || reportTarget?.title}
                    contentId={reportTarget?.id}
                    contentType={'review'}
                />
            )}
        </div>
    );
};

export default CatererDetail;
