import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, MapPin, Phone, Mail, Calendar, Utensils, MessageCircle, Building, Compass, ChefHat } from 'lucide-react';
import { profileAPI, fileAPI, dishAPI } from '../services/api';
import MeetingRequestModal from '../components/MeetingRequestModal';
import '../styles/Table.css';

const CatererDetail = ({ user }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const catererId = id;

    const [caterer, setCaterer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dishes, setDishes] = useState([]);
    const [loadingDishes, setLoadingDishes] = useState(true);
    const [showMeetingModal, setShowMeetingModal] = useState(false);

    useEffect(() => {
        if (catererId) {
            loadCaterer();
            loadDishes();
        }
    }, [catererId]);

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
                    </div>

                    {/* Right Column (Sticky) */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-8 space-y-8">
                            {/* Action Card */}
                            <div className="surface-card text-center">
                                <div className="p-6">
                                    <div className="flex justify-center items-center gap-2 text-sky-500 mb-4">
                                        <Star size={24} fill="currentColor" />
                                        <span className="text-3xl font-bold text-slate-800">{caterer.averageRating?.toFixed(1) || 'New'}</span>
                                    </div>
                                    <p className="text-slate-500 mb-6">Based on user reviews</p>
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
        </div>
    );
};

export default CatererDetail;
