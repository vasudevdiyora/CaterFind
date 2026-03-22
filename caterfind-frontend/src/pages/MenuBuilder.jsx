import React, { useState, useEffect, useRef } from 'react';
import { dishAPI, menuAPI } from '@/services/api';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus, Search, X, Trash2, Save, Send, Edit3, Utensils, Calendar, Users, Building, Info, Mail, Phone } from 'lucide-react';
import '../styles/Table.css'; // Reusing modal and table styles
import '../styles/Contacts.css'; // Reusing filter pills

/**
 * Menu Builder Component (Dense Light Theme)
 * Three-step process: Client Details -> Build Menu -> Review & Send
 */
function MenuBuilder({ user }) {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [currentStep, setCurrentStep] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMenuId, setEditingMenuId] = useState(null);

    // Client details (Step 1)
    const [clientDetails, setClientDetails] = useState({
        clientName: '',
        eventType: '',
        mealTime: '',
        venueName: '',
        venueAddress: '',
        eventDate: '',
        numberOfGuests: '',
        contactNumber: '',
        clientEmail: ''
    });

    const [formErrors, setFormErrors] = useState({});

    // Menu dishes (Step 2)
    const [selectedDishes, setSelectedDishes] = useState([]);

    // All available dishes from library
    const [allDishes, setAllDishes] = useState([]);
    const [filteredDishes, setFilteredDishes] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All Categories');
    const [selectedLabels, setSelectedLabels] = useState([]);

    // Loading state
    const [loading, setLoading] = useState(false);
    const eventDateInputRef = useRef(null);

    // Load dishes from library
    useEffect(() => {
        loadDishes();
    }, []);

    // Load menu when editing from history
    useEffect(() => {
        const menuId = searchParams.get('menuId');
        if (!menuId) {
            setEditingMenuId(null);
            return;
        }

        setEditingMenuId(Number(menuId));
        loadMenuForEdit(menuId);
    }, [searchParams]);

    const loadDishes = async () => {
        try {
            const dishes = await dishAPI.getAll(user.userId);
            setAllDishes(dishes);
            setFilteredDishes(dishes);
        } catch (error) {
            console.error('Error loading dishes:', error);
            alert('Failed to load dishes');
        }
    };

    const loadMenuForEdit = async (menuId) => {
        try {
            setLoading(true);
            const menu = await menuAPI.getById(menuId);

            const rawEventLocation = (menu.eventLocation || '').trim();
            const [parsedVenueName, ...parsedAddressParts] = rawEventLocation
                ? rawEventLocation.split(',')
                : [''];
            const parsedVenueAddress = parsedAddressParts.join(',').trim();

            setClientDetails({
                clientName: menu.clientName || '',
                eventType: menu.eventType || '',
                mealTime: menu.mealTime || '',
                venueName: (menu.venueName || parsedVenueName || '').trim(),
                venueAddress: (menu.venueAddress || parsedVenueAddress || '').trim(),
                eventDate: menu.eventDate || '',
                numberOfGuests: menu.numberOfGuests ? String(menu.numberOfGuests) : '',
                contactNumber: (menu.contactNumber || '').replace(/^\+91/, ''),
                clientEmail: menu.clientEmail || ''
            });

            const flattenedDishes = Object.entries(menu.dishesByCategory || {})
                .flatMap(([category, dishes]) =>
                    (dishes || []).map((dish, index) => ({
                        id: dish.dishId,
                        name: dish.dishName,
                        category: dish.dishCategory,
                        imageUrl: dish.dishImageUrl,
                        type: dish.dishType,
                        labels: dish.dishLabels,
                        menuCategory: category,
                        note: dish.note || '',
                        displayOrder: Number.isFinite(dish.displayOrder) ? dish.displayOrder : index
                    }))
                )
                .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

            setSelectedDishes(flattenedDishes);
            setCurrentStep(1);
        } catch (error) {
            console.error('Error loading menu for edit:', error);
            alert('Failed to load selected menu');
        } finally {
            setLoading(false);
        }
    };

    // Filter dishes based on search and filters
    useEffect(() => {
        let filtered = [...allDishes];

        // Search filter
        if (searchQuery) {
            filtered = filtered.filter(dish =>
                dish.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Category filter
        if (categoryFilter !== 'All Categories') {
            filtered = filtered.filter(dish => dish.category === categoryFilter);
        }

        // All selected labels must be present in dish labels
        if (selectedLabels.length > 0) {
            filtered = filtered.filter(dish => {
                const dishLabels = new Set(
                    (dish.labels || '')
                    .split(',')
                    .map(label => label.trim().toLowerCase())
                    .filter(Boolean)
                );

                return selectedLabels.every(label => dishLabels.has(label.toLowerCase()));
            });
        }

        setFilteredDishes(filtered);
    }, [searchQuery, categoryFilter, selectedLabels, allDishes]);

    // Get unique categories and labels
    const categories = ['All Categories', ...new Set(allDishes.map(d => d.category))];
    const labels = [...new Set(
        allDishes.flatMap(d => d.labels ? d.labels.split(',').map(l => l.trim()) : [])
    )];

    const toggleLabel = (label) => {
        setSelectedLabels(prev => {
            if (prev.includes(label)) {
                return prev.filter(item => item !== label);
            }
            return [...prev, label];
        });
    };

    // Handle client details form change
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        const normalizedValue = name === 'contactNumber' ?
            value.replace(/\D/g, '').slice(0, 10) :
            value;

        setClientDetails(prev => ({ ...prev, [name]: normalizedValue }));

        setFormErrors(prev => {
            if (!prev[name]) {
                return prev;
            }

            const nextErrors = { ...prev };
            delete nextErrors[name];
            return nextErrors;
        });
    };

    const getTodayDateString = () => new Date().toISOString().split('T')[0];

    const validateStep1 = () => {
        const errors = {};
        if (!clientDetails.clientName) errors.clientName = 'Client name is required';
        if (!clientDetails.eventType) errors.eventType = 'Event type is required';
        if (!clientDetails.eventDate) errors.eventDate = 'Event date is required';
        if (!clientDetails.numberOfGuests) errors.numberOfGuests = 'Number of guests is required';
        if (clientDetails.contactNumber && !/^\d{10}$/.test(clientDetails.contactNumber)) {
            errors.contactNumber = 'Must be a 10-digit phone number';
        }
        if (clientDetails.clientEmail && !/\S+@\S+\.\S+/.test(clientDetails.clientEmail)) {
            errors.clientEmail = 'Must be a valid email address';
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleNextStep = () => {
        if (currentStep === 1 && validateStep1()) {
            setCurrentStep(2);
        } else if (currentStep === 2) {
            setCurrentStep(3);
        }
    };

    const handlePrevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const addDishToMenu = (dish) => {
        const defaultMenuCategory = dish.category || 'Uncategorized';
        const newDish = {
            ...dish,
            menuCategory: defaultMenuCategory,
            note: '',
            displayOrder: selectedDishes.length
        };
        setSelectedDishes([...selectedDishes, newDish]);
    };

    const removeDishFromMenu = (dishId, index) => {
        setSelectedDishes(selectedDishes.filter((_, i) => i !== index));
    };

    const updateSelectedDish = (index, field, value) => {
        const updated = [...selectedDishes];
        updated[index][field] = value;
        setSelectedDishes(updated);
    };

    const handleSaveMenu = async (status = 'DRAFT') => {
        if (currentStep === 1 && !validateStep1()) return;
        if (selectedDishes.length === 0) {
            alert('Please add at least one dish to the menu.');
            return;
        }

        const dishesByCategory = selectedDishes.reduce((acc, dish) => {
            const category = dish.menuCategory || 'Uncategorized';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push({
                dishId: dish.id,
                dishName: dish.name,
                dishCategory: dish.category,
                dishImageUrl: dish.imageUrl,
                dishType: dish.type,
                dishLabels: dish.labels,
                note: dish.note,
                displayOrder: dish.displayOrder
            });
            return acc;
        }, {});

        const payload = {
            userId: user.userId,
            clientName: clientDetails.clientName,
            eventType: clientDetails.eventType,
            mealTime: clientDetails.mealTime,
            venueName: clientDetails.venueName,
            venueAddress: clientDetails.venueAddress,
            eventLocation: `${clientDetails.venueName}, ${clientDetails.venueAddress}`,
            eventDate: clientDetails.eventDate,
            numberOfGuests: Number(clientDetails.numberOfGuests),
            contactNumber: `+91${clientDetails.contactNumber}`,
            clientEmail: clientDetails.clientEmail,
            status: status,
            dishesByCategory: dishesByCategory,
        };

        try {
            setLoading(true);
            if (editingMenuId) {
                await menuAPI.update(editingMenuId, payload);
            } else {
                await menuAPI.create(payload);
            }
            alert(`Menu successfully ${status === 'DRAFT' ? 'saved' : 'sent'}!`);
            navigate('/caterer/menu-history');
        } catch (error) {
            console.error('Error saving menu:', error);
            alert('Failed to save menu.');
        } finally {
            setLoading(false);
        }
    };

    const Stepper = () => (
        <div className="w-full max-w-2xl mx-auto mb-8">
            <div className="flex items-center justify-center">
                {['Client Details', 'Build Menu', 'Review & Send'].map((step, index) => (
                    <React.Fragment key={index}>
                        <div className="flex flex-col items-center">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                                    currentStep > index + 1 ? 'bg-green-500 border-green-500 text-white' :
                                    currentStep === index + 1 ? 'bg-sky-500 border-sky-500 text-white' :
                                    'bg-white border-slate-300 text-slate-500'
                                }`}
                            >
                                {index + 1}
                            </div>
                            <p className={`mt-2 text-sm text-center ${currentStep >= index + 1 ? 'font-semibold text-slate-700' : 'text-slate-500'}`}>
                                {step}
                            </p>
                        </div>
                        {index < 2 && <div className={`flex-auto border-t-2 mx-4 transition-all duration-300 ${currentStep > index + 1 ? 'border-green-500' : 'border-slate-300'}`}></div>}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );

    const Step1_ClientDetails = () => (
        <div className="surface-card p-6 md:p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Step 1: Client & Event Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="form-group">
                    <label htmlFor="clientName">Client Name</label>
                    <input id="clientName" name="clientName" type="text" className={`form-input ${formErrors.clientName ? 'error' : ''}`} value={clientDetails.clientName} onChange={handleInputChange} placeholder="e.g., John Doe" />
                    {formErrors.clientName && <p className="form-error-text">{formErrors.clientName}</p>}
                </div>
                <div className="form-group">
                    <label htmlFor="eventType">Event Type</label>
                    <input id="eventType" name="eventType" type="text" className={`form-input ${formErrors.eventType ? 'error' : ''}`} value={clientDetails.eventType} onChange={handleInputChange} placeholder="e.g., Wedding, Birthday Party" />
                    {formErrors.eventType && <p className="form-error-text">{formErrors.eventType}</p>}
                </div>
                <div className="form-group">
                    <label htmlFor="eventDate">Event Date</label>
                    <input id="eventDate" name="eventDate" type="date" className={`form-input ${formErrors.eventDate ? 'error' : ''}`} value={clientDetails.eventDate} onChange={handleInputChange} min={getTodayDateString()} />
                    {formErrors.eventDate && <p className="form-error-text">{formErrors.eventDate}</p>}
                </div>
                <div className="form-group">
                    <label htmlFor="numberOfGuests">Number of Guests</label>
                    <input id="numberOfGuests" name="numberOfGuests" type="number" className={`form-input ${formErrors.numberOfGuests ? 'error' : ''}`} value={clientDetails.numberOfGuests} onChange={handleInputChange} placeholder="e.g., 150" />
                    {formErrors.numberOfGuests && <p className="form-error-text">{formErrors.numberOfGuests}</p>}
                </div>
                <div className="form-group">
                    <label htmlFor="mealTime">Meal Time</label>
                    <select id="mealTime" name="mealTime" className="form-select" value={clientDetails.mealTime} onChange={handleInputChange}>
                        <option value="">Select meal time</option>
                        <option value="Breakfast">Breakfast</option>
                        <option value="Lunch">Lunch</option>
                        <option value="Dinner">Dinner</option>
                        <option value="High-Tea">High-Tea</option>
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor="venueName">Venue Name</label>
                    <input id="venueName" name="venueName" type="text" className="form-input" value={clientDetails.venueName} onChange={handleInputChange} placeholder="e.g., Grand Palace Hall" />
                </div>
                <div className="form-group md:col-span-2">
                    <label htmlFor="venueAddress">Venue Address</label>
                    <input id="venueAddress" name="venueAddress" type="text" className="form-input" value={clientDetails.venueAddress} onChange={handleInputChange} placeholder="Full address of the event location" />
                </div>
                <div className="form-group">
                    <label htmlFor="contactNumber">Contact Number</label>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">+91</span>
                        <input id="contactNumber" name="contactNumber" type="tel" className={`form-input pl-10 ${formErrors.contactNumber ? 'error' : ''}`} value={clientDetails.contactNumber} onChange={handleInputChange} placeholder="98765 43210" />
                    </div>
                    {formErrors.contactNumber && <p className="form-error-text">{formErrors.contactNumber}</p>}
                </div>
                <div className="form-group">
                    <label htmlFor="clientEmail">Client Email</label>
                    <input id="clientEmail" name="clientEmail" type="email" className={`form-input ${formErrors.clientEmail ? 'error' : ''}`} value={clientDetails.clientEmail} onChange={handleInputChange} placeholder="e.g., john.doe@example.com" />
                    {formErrors.clientEmail && <p className="form-error-text">{formErrors.clientEmail}</p>}
                </div>
            </div>
        </div>
    );

    const Step2_BuildMenu = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Side: Dish Library */}
            <div className="surface-card p-4 md:p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Dish Library</h3>
                <div className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search dishes..."
                            className="form-input pl-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-4">
                        <select className="form-select flex-grow" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="filter-pills small">
                        {labels.map(label => (
                            <button
                                key={label}
                                className={`filter-pill ${selectedLabels.includes(label) ? 'active' : ''}`}
                                onClick={() => toggleLabel(label)}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="mt-4 h-[400px] overflow-y-auto pr-2 -mr-2">
                    <ul className="space-y-2">
                        {filteredDishes.map(dish => (
                            <li key={dish.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50">
                                <img src={dish.imageUrl || 'https://via.placeholder.com/100'} alt={dish.name} className="w-12 h-12 object-cover rounded-md" />
                                <div className="flex-grow">
                                    <p className="font-semibold text-slate-700">{dish.name}</p>
                                    <p className="text-sm text-slate-500">{dish.category}</p>
                                </div>
                                <button className="add-dish-button" onClick={() => addDishToMenu(dish)}>
                                    <Plus size={16} />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Right Side: Selected Dishes */}
            <div className="surface-card p-4 md:p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Selected Menu ({selectedDishes.length})</h3>
                <div className="h-[550px] overflow-y-auto pr-2 -mr-2">
                    {selectedDishes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500">
                            <Utensils size={40} className="mb-2" />
                            <p>Add dishes from the library to build your menu.</p>
                        </div>
                    ) : (
                        <ul className="space-y-3">
                            {selectedDishes.map((dish, index) => (
                                <li key={`${dish.id}-${index}`} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                                    <img src={dish.imageUrl || 'https://via.placeholder.com/100'} alt={dish.name} className="w-14 h-14 object-cover rounded-md" />
                                    <div className="flex-grow space-y-2">
                                        <p className="font-bold text-slate-800">{dish.name}</p>
                                        <div className="flex items-center gap-2">
                                            <label className="text-xs font-medium text-slate-500">Category:</label>
                                            <input
                                                type="text"
                                                value={dish.menuCategory}
                                                onChange={(e) => updateSelectedDish(index, 'menuCategory', e.target.value)}
                                                className="form-input form-input-sm"
                                                placeholder="e.g., Starters"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <label className="text-xs font-medium text-slate-500">Note:</label>
                                            <input
                                                type="text"
                                                value={dish.note}
                                                onChange={(e) => updateSelectedDish(index, 'note', e.target.value)}
                                                className="form-input form-input-sm"
                                                placeholder="Optional note (e.g., less spicy)"
                                            />
                                        </div>
                                    </div>
                                    <button className="table-icon-button danger" onClick={() => removeDishFromMenu(dish.id, index)}>
                                        <Trash2 size={16} />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );

    const Step3_ReviewSend = () => {
        const dishesByCategory = selectedDishes.reduce((acc, dish) => {
            const category = dish.menuCategory || 'Uncategorized';
            if (!acc[category]) acc[category] = [];
            acc[category].push(dish);
            return acc;
        }, {});

        return (
            <div className="surface-card p-6 md:p-8">
                <div className="flex justify-between items-start">
                    <h2 className="text-xl font-bold text-slate-800 mb-6">Step 3: Review & Send</h2>
                    <button className="secondary-button-sm" onClick={() => setCurrentStep(1)}>
                        <Edit3 size={14} className="mr-2" /> Edit Details
                    </button>
                </div>

                {/* Client Details Review */}
                <div className="mb-8 p-4 border border-slate-200 rounded-lg bg-slate-50/50">
                    <h3 className="font-bold text-lg text-slate-700 mb-3">Event Information</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-start gap-2"><Users size={16} className="text-slate-500 mt-0.5" /><p><strong className="font-semibold text-slate-600">Client:</strong> {clientDetails.clientName}</p></div>
                        <div className="flex items-start gap-2"><Info size={16} className="text-slate-500 mt-0.5" /><p><strong className="font-semibold text-slate-600">Event:</strong> {clientDetails.eventType}</p></div>
                        <div className="flex items-start gap-2"><Calendar size={16} className="text-slate-500 mt-0.5" /><p><strong className="font-semibold text-slate-600">Date:</strong> {clientDetails.eventDate}</p></div>
                        <div className="flex items-start gap-2"><Users size={16} className="text-slate-500 mt-0.5" /><p><strong className="font-semibold text-slate-600">Guests:</strong> {clientDetails.numberOfGuests}</p></div>
                        <div className="flex items-start gap-2"><Building size={16} className="text-slate-500 mt-0.5" /><p><strong className="font-semibold text-slate-600">Venue:</strong> {clientDetails.venueName}</p></div>
                        <div className="flex items-start gap-2"><Mail size={16} className="text-slate-500 mt-0.5" /><p><strong className="font-semibold text-slate-600">Email:</strong> {clientDetails.clientEmail}</p></div>
                        <div className="flex items-start gap-2"><Phone size={16} className="text-slate-500 mt-0.5" /><p><strong className="font-semibold text-slate-600">Phone:</strong> {clientDetails.contactNumber}</p></div>
                    </div>
                </div>

                {/* Menu Review */}
                <div>
                    <h3 className="font-bold text-lg text-slate-700 mb-4">Final Menu</h3>
                    <div className="space-y-6">
                        {Object.entries(dishesByCategory).map(([category, dishes]) => (
                            <div key={category}>
                                <h4 className="font-bold text-slate-600 text-md mb-3 pb-2 border-b-2 border-slate-200">{category}</h4>
                                <ul className="space-y-3">
                                    {dishes.map((dish, index) => (
                                        <li key={`${dish.id}-${index}`} className="flex items-center gap-4">
                                            <img src={dish.imageUrl || 'https://via.placeholder.com/100'} alt={dish.name} className="w-16 h-16 object-cover rounded-lg" />
                                            <div>
                                                <p className="font-semibold text-slate-800">{dish.name}</p>
                                                {dish.note && <p className="text-sm text-slate-500 italic">Note: {dish.note}</p>}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };


    return (
        <div className="page-shell py-8">
            <h1 className="text-3xl font-extrabold text-slate-800 text-center mb-2">Menu Builder</h1>
            <p className="text-center text-slate-500 mb-8">{editingMenuId ? `You are editing a menu.` : 'Create a new menu for your client.'}</p>

            <Stepper />

            {currentStep === 1 && <Step1_ClientDetails />}
            {currentStep === 2 && <Step2_BuildMenu />}
            {currentStep === 3 && <Step3_ReviewSend />}

            {/* Navigation Buttons */}
            <div className="mt-8 flex justify-between items-center gap-4">
                <div>
                    {currentStep > 1 && (
                        <button className="secondary-button" onClick={handlePrevStep}>
                            <ChevronLeft size={16} className="mr-2" /> Previous
                        </button>
                    )}
                </div>
                <div className="flex gap-4">
                    {currentStep === 3 && (
                        <button className="secondary-button" onClick={() => handleSaveMenu('DRAFT')} disabled={loading}>
                            <Save size={16} className="mr-2" /> Save as Draft
                        </button>
                    )}
                    {currentStep < 3 ? (
                        <button className="primary-button" onClick={handleNextStep}>
                            Next <ChevronRight size={16} className="ml-2" />
                        </button>
                    ) : (
                        <button className="primary-button" onClick={() => handleSaveMenu('SENT')} disabled={loading}>
                            <Send size={16} className="mr-2" /> {loading ? 'Sending...' : 'Save & Send to Client'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default MenuBuilder;
