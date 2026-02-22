import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, MapPin, Phone, Mail } from 'lucide-react';
import { profileAPI, fileAPI, dishAPI } from '../services/api';
import ClientAvailability from './ClientAvailability';

/**
 * Caterer Detail Page (Loveable Design)
 * 
 * Shows full information about a caterer including:
 * - Hero image with business info
 * - Description and pricing
 * - Photo gallery
 * - Trending dishes with View More
 * - Contact details
 */
const CatererDetail = () => {
    const { id } = useParams(); // Get caterer ID from URL
    const navigate = useNavigate();
    const catererId = id;
    
    const [caterer, setCaterer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dishes, setDishes] = useState([]);
    const [showAllDishes, setShowAllDishes] = useState(false);
    const [loadingDishes, setLoadingDishes] = useState(true);

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
            // Error loading caterer
        } finally {
            setLoading(false);
        }
    };

    const loadDishes = async () => {
        try {
            setLoadingDishes(true);
            const data = await dishAPI.getAll(catererId);
            setDishes(data);
        } catch (error) {
            console.error('Error loading dishes:', error);
        } finally {
            setLoadingDishes(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
                <div className="text-gray-400 text-lg">Loading caterer details...</div>
            </div>
        );
    }

    if (!caterer) {
        return (
            <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
                <div className="text-red-400 text-lg">Caterer not found</div>
            </div>
        );
    }

    // Parse business photos from caterer profile (comma-separated string)
    console.log('Caterer businessPhotos:', caterer.businessPhotos);
    const galleryImages = caterer.businessPhotos && caterer.businessPhotos.trim().length > 0
        ? caterer.businessPhotos.split(',').filter(url => url.trim()).map(url => fileAPI.getImageUrl(url.trim()))
        : [
            // Fallback to mock images if no photos uploaded
            "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=80"
        ];
    console.log('Gallery images:', galleryImages);

    return (
        <div className="min-h-screen bg-[#1a1a1a] text-white">
            {/* Back Button */}
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 px-6 py-4 text-gray-400 hover:text-white transition-colors"
            >
                <ArrowLeft size={20} />
                <span className="text-lg">Back to Caterers</span>
            </button>

            {/* Hero Section */}
            <div className="relative">
                {/* Hero Image */}
                <div className="h-[400px] overflow-hidden">
                    <img
                        src={fileAPI.getImageUrl(caterer.imageUrl) || "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1600&q=80"}
                        alt={caterer.businessName}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-transparent to-transparent"></div>
                </div>

                {/* Business Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 px-8 pb-8">
                    {/* Veg/Non-Veg Badges */}
                    <div className="flex gap-3 mb-4">
                        <span className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg">
                            <span className="text-lg">🥬</span> Veg
                        </span>
                        <span className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg">
                            <span className="text-lg">🍖</span> Non-Veg
                        </span>
                    </div>

                    {/* Business Name */}
                    <h1 className="text-5xl font-extrabold mb-3 drop-shadow-lg">
                        {caterer.businessName}
                    </h1>

                    {/* Rating & Location */}
                    <div className="flex items-center gap-6 text-lg">
                        <div className="flex items-center gap-2 text-orange-400">
                            <Star size={24} fill="currentColor" />
                            <span className="font-bold text-2xl">{caterer.rating || '4.8'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-300">
                            <MapPin size={20} />
                            <span>{caterer.city || 'South Delhi'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="max-w-7xl mx-auto px-8 py-8">
                {/* Description & Pricing */}
                <div className="bg-[#2a2a2a] rounded-2xl p-8 mb-8 border border-gray-700/50">
                    <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                        {caterer.description || 'Authentic North Indian cuisine with 25+ years of experience.'}
                    </p>
                    <div className="text-orange-400 text-xl font-bold">
                        ₹800 - ₹1500 <span className="text-gray-400 font-normal">per plate</span>
                    </div>
                </div>

                {/* Gallery Section */}
                <div className="mb-8">
                    <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                        <span className="text-orange-400">✨</span> Gallery
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {galleryImages.map((img, index) => (
                            <div
                                key={index}
                                className="h-64 rounded-2xl overflow-hidden hover:transform hover:scale-105 transition-all duration-300 shadow-xl"
                            >
                                <img
                                    src={img}
                                    alt={`Gallery ${index + 1}`}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Trending Dishes Section */}
                <div className="mb-8">
                    <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                        <span className="text-orange-400">🍽️</span> Trending Dishes
                    </h2>
                    
                    {loadingDishes ? (
                        <div className="text-center text-gray-400 py-8">Loading dishes...</div>
                    ) : dishes.length === 0 ? (
                        <div className="bg-[#2a2a2a] rounded-2xl p-8 text-center text-gray-400 border border-gray-700/50">
                            No dishes available yet
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {(showAllDishes ? dishes : dishes.slice(0, 4)).map((dish, index) => (
                                    <div
                                        key={dish.id}
                                        className="bg-[#2a2a2a] rounded-2xl overflow-hidden border border-gray-700/50 hover:border-orange-500/50 transition-all duration-300 hover:transform hover:scale-[1.02] shadow-xl"
                                    >
                                        <div className="relative">
                                            {/* Dish Image */}
                                            <div className="h-56 overflow-hidden">
                                                <img
                                                    src={fileAPI.getImageUrl(dish.imageUrl) || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80"}
                                                    alt={dish.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            
                                            {/* Trending Badge */}
                                            {(showAllDishes ? index < 4 : true) && (
                                                <div className="absolute top-4 right-4">
                                                    <span className="bg-orange-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg">
                                                        Trending
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Dish Info */}
                                        <div className="p-6">
                                            <h3 className="text-2xl font-bold mb-2">{dish.name}</h3>
                                            <p className="text-gray-400 text-sm mb-3">
                                                {dish.category || 'Main Course'}
                                            </p>
                                            {dish.description && (
                                                <p className="text-gray-300 text-sm leading-relaxed">
                                                    {dish.description}
                                                </p>
                                            )}
                                            {/* Labels/Tags */}
                                            {dish.labels && (
                                                <div className="flex flex-wrap gap-2 mt-4">
                                                    {(Array.isArray(dish.labels) ? dish.labels : dish.labels.split(',')).map((label, idx) => (
                                                        <span
                                                            key={`${dish.id}-label-${idx}-${label.trim()}`}
                                                            className="bg-gray-700/50 text-gray-300 px-3 py-1 rounded-full text-xs"
                                                        >
                                                            {label.trim()}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            {/* Veg/Non-Veg Badge */}
                                            {dish.type && (
                                                <div className="mt-4">
                                                    <span
                                                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                                                            dish.type === 'VEG'
                                                                ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                                                                : 'bg-red-500/20 text-red-400 border border-red-500/50'
                                                        }`}
                                                    >
                                                        <span className="w-2 h-2 rounded-full bg-current"></span>
                                                        {dish.type}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* View More Button */}
                            {dishes.length > 4 && (
                                <div className="flex justify-center mt-8">
                                    <button
                                        onClick={() => setShowAllDishes(!showAllDishes)}
                                        className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg px-10 py-3 rounded-xl shadow-lg hover:shadow-orange-500/50 transition-all transform hover:scale-105"
                                    >
                                        {showAllDishes ? 'Show Less' : 'View More'}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Availability Section */}
                <div className="mb-8">
                    <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                        <span className="text-orange-400">📅</span> Availability
                    </h2>
                    <ClientAvailability
                        catererId={catererId}
                        embedded={true}
                        showBack={false}
                    />
                </div>

                {/* Contact Information */}
                <div className="bg-[#2a2a2a] rounded-2xl p-8 border border-gray-700/50">
                    <h2 className="text-2xl font-bold mb-6">Contact Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center">
                                <Phone className="text-orange-400" size={20} />
                            </div>
                            <div>
                                <div className="text-sm text-gray-400">Primary Phone</div>
                                <div className="text-lg font-medium">{caterer.primaryPhone || '+91 98765 43210'}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center">
                                <Mail className="text-orange-400" size={20} />
                            </div>
                            <div>
                                <div className="text-sm text-gray-400">Email</div>
                                <div className="text-lg font-medium">{caterer.email || 'contact@example.com'}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center">
                                <MapPin className="text-orange-400" size={20} />
                            </div>
                            <div>
                                <div className="text-sm text-gray-400">Address</div>
                                <div className="text-lg font-medium">
                                    {caterer.streetAddress || caterer.area}, {caterer.city}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center">
                                <span className="text-orange-400 text-xl">🎯</span>
                            </div>
                            <div>
                                <div className="text-sm text-gray-400">Service Radius</div>
                                <div className="text-lg font-medium">{caterer.serviceRadius || 50} km</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Book Now Button */}
                <div className="mt-8 flex justify-center">
                    <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xl px-12 py-4 rounded-xl shadow-2xl hover:shadow-orange-500/50 transition-all transform hover:scale-105">
                        Book Now
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CatererDetail;
