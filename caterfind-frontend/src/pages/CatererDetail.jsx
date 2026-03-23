import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Phone, Mail, Calendar, MessageCircle, Building, Compass, ChefHat, Sparkles, Images, MessageSquareText, UserCircle2, UtensilsCrossed } from 'lucide-react';
import { profileAPI, fileAPI, dishAPI, reviewsAPI, moderationAPI } from '../services/api';
import MeetingRequestModal from '../components/MeetingRequestModal';
import ReportModal from '../components/ReportModal';
import { useToast } from '../components/ToastProvider';
import '../styles/Table.css';

const DishCard = React.memo(function DishCard({ dish, imageUrl }) {
    return (
        <div className="surface-card overflow-hidden text-center border border-slate-200">
            <img
                src={imageUrl}
                alt={dish.name}
                className="w-full h-28 object-cover"
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://via.placeholder.com/400x240?text=Dish'; }}
            />
            <div className="p-2">
                <h4 className="font-bold text-slate-800 truncate text-sm">{dish.name}</h4>
                <p className="text-xs text-slate-500">{dish.category}</p>
            </div>
        </div>
    );
});

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

    const sectionTitleClass = 'inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-sky-200 bg-sky-50 text-slate-900 font-extrabold tracking-tight';

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

    const resolveImageUrl = useCallback((imageUrl) => {
        const raw = String(imageUrl || '').trim().replace(/^"|"$/g, '');
        if (!raw) return 'https://via.placeholder.com/800x400?text=Caterer';

        if (/^data:image\//i.test(raw) || /^https?:\/\//i.test(raw)) {
            return raw;
        }

        if (raw.startsWith('/uploads/')) {
            return fileAPI.getImageUrl(raw);
        }

        if (raw.startsWith('uploads/')) {
            return fileAPI.getImageUrl(`/${raw}`);
        }

        if (/^[^/\\]+\.(jpg|jpeg|png|webp|gif|jfif|svg)$/i.test(raw)) {
            return fileAPI.getImageUrl(`/uploads/images/${raw}`);
        }

        return fileAPI.getImageUrl(raw.startsWith('/') ? raw : `/${raw}`);
    }, []);

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
                .map(url => resolveImageUrl(url));
        }
        return [];
    }, [caterer, resolveImageUrl]);

    if (loading) {
        return <div className="page-shell justify-center items-center">Loading...</div>;
    }

    if (!caterer) {
        return <div className="page-shell justify-center items-center text-red-600">Caterer not found.</div>;
    }

    const hasRatings = Number(ratingSummary?.count || 0) > 0;
    const ratingValue = hasRatings
        ? Number(ratingSummary?.average || 0).toFixed(1)
        : (caterer.averageRating ? Number(caterer.averageRating).toFixed(1) : null);
    const ratingLabel = ratingValue ? `${ratingValue}/5` : 'New';

    return (
        <div className="bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Header and Back Button */}
                <header className="py-6 px-3 sm:px-4 lg:px-6">
                    <button onClick={() => navigate(-1)} className="secondary-button-sm flex items-center gap-2">
                        <ArrowLeft size={16} />
                        Back to Discovery
                    </button>
                </header>

                {/* Main Content Grid */}
                <main className="grid grid-cols-1 xl:grid-cols-12 gap-5 px-3 sm:px-4 lg:px-6 pb-16">
                    {/* Left Column */}
                    <div className="xl:col-span-8 space-y-5">
                        {/* Hero Image */}
                        <div className="surface-card p-0 overflow-hidden">
                            <div className="relative">
                                <img
                                    src={resolveImageUrl(caterer.imageUrl)}
                                    alt={caterer.businessName}
                                    className="w-full h-80 object-cover"
                                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://via.placeholder.com/800x400?text=Caterer'; }}
                                />
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/85 via-slate-900/55 to-transparent p-5">
                                    <div className="flex flex-wrap items-end justify-between gap-4">
                                        <div className="min-w-0">
                                            <h1 className="text-3xl font-extrabold text-white leading-tight">{caterer.businessName}</h1>
                                            <p className="text-slate-100/90 mt-2 leading-relaxed max-w-2xl">{caterer.description || 'Trusted catering services for memorable events.'}</p>
                                        </div>
                                        <div className="rounded-xl border border-white/30 bg-white/15 backdrop-blur px-4 py-2 shrink-0">
                                            <div className="flex items-center gap-2 text-white">
                                                <Star size={16} className="text-amber-300" fill="currentColor" />
                                                <span className="font-extrabold text-lg">{ratingLabel}</span>
                                            </div>
                                            <p className="text-xs text-slate-100/90 mt-0.5">{ratingSummary.count || 0} review{(ratingSummary.count || 0) === 1 ? '' : 's'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Details (moved up for better hierarchy) */}
                        <div className="surface-card border border-slate-200">
                            <div className="p-4 border-b border-slate-100">
                                <h2 className={sectionTitleClass}><Building size={18} /> Details</h2>
                            </div>
                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-start gap-3">
                                    <div className="icon-wrapper"><Building size={18} /></div>
                                    <div>
                                        <h4 className="font-semibold text-slate-800">Location</h4>
                                        <p className="text-slate-600">{caterer.area}, {caterer.city}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="icon-wrapper"><Compass size={18} /></div>
                                    <div>
                                        <h4 className="font-semibold text-slate-800">Service Radius</h4>
                                        <p className="text-slate-600">{caterer.serviceRadius} km</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="icon-wrapper"><ChefHat size={18} /></div>
                                    <div>
                                        <h4 className="font-semibold text-slate-800">Specialty</h4>
                                        <p className="text-slate-600">{caterer.specialty || 'Not specified'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="icon-wrapper"><Phone size={18} /></div>
                                    <div>
                                        <h4 className="font-semibold text-slate-800">Phone</h4>
                                        <p className="text-slate-600">{caterer.primaryPhone}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 md:col-span-2">
                                    <div className="icon-wrapper"><Mail size={18} /></div>
                                    <div>
                                        <h4 className="font-semibold text-slate-800">Email</h4>
                                        <p className="text-slate-600 break-all">{caterer.email}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Trending Dishes */}
                        <div className="surface-card border border-slate-200">
                            <div className="p-4 border-b border-slate-100">
                                <h2 className={sectionTitleClass}><UtensilsCrossed size={18} /> Trending Dishes</h2>
                            </div>
                            {loadingDishes ? (
                                <p className="p-6">Loading dishes...</p>
                            ) : trendingDishes.length > 0 ? (
                                <div className="p-4 dense-grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                                    {trendingDishes.map(dish => (
                                        <DishCard
                                            key={dish.id}
                                            dish={dish}
                                            imageUrl={resolveImageUrl(dish.imageUrl)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <p className="p-6 text-slate-500">No dishes found for this caterer.</p>
                            )}
                        </div>

                        {/* Photo Gallery */}
                        {galleryImages.length > 0 && (
                            <div className="surface-card border border-slate-200">
                                <div className="p-4 border-b border-slate-100">
                                    <h2 className={sectionTitleClass}><Images size={18} /> Gallery</h2>
                                </div>
                                <div className="p-4 dense-grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                                    {galleryImages.map((url, index) => (
                                        <div key={index} className="aspect-w-1 aspect-h-1">
                                            <img
                                                src={url}
                                                alt={`Gallery image ${index + 1}`}
                                                className="w-full h-full object-cover rounded-lg"
                                                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://via.placeholder.com/480x320?text=Gallery'; }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Reviews */}
                        <div className="surface-card border border-slate-200">
                            <div className="p-4 border-b border-slate-100">
                                <h2 className={sectionTitleClass}><MessageSquareText size={18} /> Reviews</h2>
                            </div>
                            <div className="p-4">
                                {reviews.length === 0 ? (
                                    <p className="text-slate-500">No reviews yet. Be the first to review this caterer.</p>
                                ) : (
                                    <ul className="space-y-4">
                                        {reviews.map((r) => (
                                            <li key={r.id} className="border border-slate-200 bg-slate-50 rounded-lg p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="space-y-2 min-w-0">
                                                        <div className="flex items-center gap-2 text-slate-700">
                                                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-sky-100 text-sky-700">
                                                                <UserCircle2 size={14} />
                                                            </span>
                                                            <span className="font-semibold text-sm truncate">Reviewer {r.userId ? `#${r.userId}` : 'Guest'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            {[1,2,3,4,5].map((s)=> (
                                                                <Star key={s} size={14} className={s <= r.rating ? 'text-amber-500' : 'text-slate-300'} />
                                                            ))}
                                                            {r.title && <strong className="ml-2 text-slate-800 text-sm">{r.title}</strong>}
                                                        </div>
                                                    </div>
                                                    <small className="text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</small>
                                                </div>
                                                {r.body && <p className="text-slate-700 mt-3 leading-relaxed">{r.body}</p>}
                                                <div className="mt-2 flex justify-end">
                                                    <button className="text-xs text-red-600 hover:underline" onClick={() => {
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
                    <div className="xl:col-span-4">
                        <div className="sticky top-6 space-y-5">
                            {/* Connect Card */}
                            <div className="surface-card border border-slate-200">
                                <div className="p-4 border-b border-slate-100">
                                    <h3 className="font-bold text-slate-800">Connect with {caterer.businessName}</h3>
                                    <p className="text-sm text-slate-500 mt-1">Quick actions for booking and chat</p>
                                </div>
                                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <button onClick={() => setShowMeetingModal(true)} className="primary-button w-full inline-flex items-center justify-center">
                                        <Calendar size={16} className="mr-2" />
                                        Request Meeting
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
                                        Send Message
                                    </button>
                                </div>
                                <div className="px-4 pb-4 pt-1 text-sm text-slate-600 flex items-center gap-2">
                                    <Star size={14} className="text-amber-500" fill="currentColor" />
                                    <span className="font-semibold text-slate-800">{ratingLabel}</span>
                                    <span className="text-slate-500">({ratingSummary.count || 0} reviews)</span>
                                </div>
                            </div>

                            {/* Review submission (kept, but as lighter secondary card) */}
                            <div className="surface-card border border-slate-200">
                                <div className="p-4 border-b border-slate-100">
                                    <h3 className="font-bold text-slate-800 flex items-center gap-2"><Sparkles size={16} /> Leave a Review</h3>
                                </div>
                                <div className="p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        {[1,2,3,4,5].map((s) => (
                                            <button key={s} onClick={() => setNewReview(prev => ({...prev, rating: s}))} className={`text-${s <= newReview.rating ? 'amber' : 'gray'}-500`} aria-label={`${s} stars`}>
                                                <Star size={18} className={s <= newReview.rating ? 'text-amber-500' : 'text-slate-300'} />
                                            </button>
                                        ))}
                                    </div>
                                    <input type="text" placeholder="Title (optional)" value={newReview.title} onChange={(e)=>setNewReview(prev=>({...prev,title:e.target.value}))} className="form-input mb-2" />
                                    <textarea placeholder="Share your experience" value={newReview.body} onChange={(e)=>setNewReview(prev=>({...prev,body:e.target.value}))} className="form-input mb-3" rows={3} />
                                    <button className="primary-button w-full" disabled={submittingReview} onClick={async ()=>{
                                        if (!newReview.rating) { toast.show('Please select a rating', { type: 'error' }); return; }
                                        try {
                                            setSubmittingReview(true);
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
