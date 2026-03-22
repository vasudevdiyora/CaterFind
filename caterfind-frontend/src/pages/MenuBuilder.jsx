import React, { useState, useEffect, useRef } from 'react';
import { dishAPI, fileAPI, menuAPI } from '@/services/api';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus, Search, X, Trash2, Save, Send, Edit3, Utensils, Calendar, Users, Building, Info, Mail, Phone, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import Modal from '@/components/Modal';
import '../styles/Table.css'; // Reusing modal and table styles
import '../styles/Contacts.css'; // Reusing filter pills

/**
 * Menu Builder Component (Dense Light Theme)
 * Three-step process: Client Details -> Build Menu -> Review & Send
 */
function MenuBuilder({ user }) {
    const FALLBACK_DISH_IMAGE = '/vite.svg';
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
    const [labelFilter, setLabelFilter] = useState('All Labels');
    const [frequentDishes, setFrequentDishes] = useState([]);
    const [frequentLoading, setFrequentLoading] = useState(false);
    const [draggedDishIndex, setDraggedDishIndex] = useState(null);
    const [dragOverDishIndex, setDragOverDishIndex] = useState(null);

    // Loading state
    const [loading, setLoading] = useState(false);
    const eventDateInputRef = useRef(null);
    const finalMenuListRef = useRef(null);
    const autoScrollFrameRef = useRef(null);
    const autoScrollVelocityRef = useRef(0);

    // Load dishes from library
    useEffect(() => {
        loadDishes();
    }, []);

    // Build quick-selection suggestions from dish frequency in previous menus
    useEffect(() => {
        const loadFrequentDishes = async () => {
            if (!user?.userId) {
                setFrequentDishes([]);
                return;
            }

            try {
                setFrequentLoading(true);
                const menus = await menuAPI.getAll(user.userId);
                const menuList = Array.isArray(menus) ? menus : [];
                const dishStats = new Map();

                menuList.forEach((menu) => {
                    const dishesByCategory = menu?.dishesByCategory || {};
                    Object.entries(dishesByCategory).forEach(([categoryName, dishes]) => {
                        (dishes || []).forEach((dish) => {
                            const rawId = dish?.dishId ?? dish?.id;
                            const normalizedName = (dish?.dishName || dish?.name || '').trim();
                            if (!rawId && !normalizedName) return;

                            const key = rawId ? `id:${rawId}` : `name:${normalizedName.toLowerCase()}`;
                            const existing = dishStats.get(key) || {
                                id: rawId ?? null,
                                name: normalizedName || 'Unnamed Dish',
                                category: dish?.dishCategory || categoryName || 'Uncategorized',
                                imageUrl: dish?.dishImageUrl || dish?.imageUrl || '',
                                count: 0
                            };

                            existing.count += 1;

                            if (!existing.imageUrl) {
                                existing.imageUrl = dish?.dishImageUrl || dish?.imageUrl || '';
                            }

                            if (!existing.category) {
                                existing.category = dish?.dishCategory || categoryName || 'Uncategorized';
                            }

                            dishStats.set(key, existing);
                        });
                    });
                });

                const allDishById = new Map(
                    (allDishes || [])
                        .filter(d => d?.id != null)
                        .map(d => [d.id, d])
                );
                const allDishByName = new Map(
                    (allDishes || [])
                        .filter(d => d?.name)
                        .map(d => [String(d.name).trim().toLowerCase(), d])
                );

                const topFrequent = Array.from(dishStats.values())
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 8)
                    .map((stat) => {
                        const fromLibrary = (stat.id != null && allDishById.get(stat.id))
                            || allDishByName.get(String(stat.name).toLowerCase());

                        return {
                            id: fromLibrary?.id ?? stat.id,
                            name: fromLibrary?.name || stat.name,
                            category: fromLibrary?.category || stat.category || 'Uncategorized',
                            imageUrl: fromLibrary?.imageUrl || stat.imageUrl || '',
                            labels: fromLibrary?.labels || '',
                            count: stat.count,
                            menuCategory: fromLibrary?.category || stat.category || 'Uncategorized'
                        };
                    });

                setFrequentDishes(topFrequent);
            } catch (error) {
                console.error('Error loading frequent dishes:', error);
                setFrequentDishes([]);
            } finally {
                setFrequentLoading(false);
            }
        };

        loadFrequentDishes();
    }, [user?.userId, allDishes]);

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

        // Single label filter via dropdown
        if (labelFilter !== 'All Labels') {
            filtered = filtered.filter(dish => {
                const dishLabels = new Set(
                    (dish.labels || '')
                    .split(',')
                    .map(label => label.trim().toLowerCase())
                    .filter(Boolean)
                );

                return dishLabels.has(labelFilter.toLowerCase());
            });
        }

        setFilteredDishes(filtered);
    }, [searchQuery, categoryFilter, labelFilter, allDishes]);

    // Get unique categories and labels
    const categories = ['All Categories', ...new Set(allDishes.map(d => d.category).filter(Boolean))];
    const labels = ['All Labels', ...new Set(
        allDishes.flatMap(d => d.labels ? d.labels.split(',').map(l => l.trim()) : []).filter(Boolean)
    )].sort((a, b) => {
        if (a === 'All Labels') return -1;
        if (b === 'All Labels') return 1;
        return a.localeCompare(b);
    });

    const getDishImageSrc = (imageUrl) => {
        const raw = String(imageUrl || '').trim();
        if (!raw) return FALLBACK_DISH_IMAGE;

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
    };

    const getDishLabels = (labelsText) => {
        return String(labelsText || '')
            .split(',')
            .map(label => label.trim())
            .filter(Boolean);
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
            if (selectedDishes.length === 0) {
                alert('Please add at least one dish before continuing.');
                return;
            }
            setCurrentStep(3);
        }
    };

    const handlePrevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const addDishToMenu = (dish) => {
        const duplicateIndex = selectedDishes.findIndex(selected => {
            const selectedId = selected?.id;
            const incomingId = dish?.id;

            if (selectedId != null && incomingId != null) {
                return selectedId === incomingId;
            }

            return String(selected?.name || '').trim().toLowerCase() === String(dish?.name || '').trim().toLowerCase();
        });

        if (duplicateIndex !== -1) {
            alert('This dish is already in the selected menu.');
            return;
        }

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

    const removeDishByIdentity = (dish) => {
        setSelectedDishes((prev) => prev.filter((selected) => {
            if (selected?.id != null && dish?.id != null) {
                return selected.id !== dish.id;
            }

            return String(selected?.name || '').trim().toLowerCase() !== String(dish?.name || '').trim().toLowerCase();
        }));
    };

    const reorderSelectedDishes = (fromIndex, toIndex) => {
        if (fromIndex === toIndex || fromIndex == null || toIndex == null) return;

        setSelectedDishes((prev) => {
            const next = [...prev];
            const [movedDish] = next.splice(fromIndex, 1);
            next.splice(toIndex, 0, movedDish);
            return next.map((dish, index) => ({ ...dish, displayOrder: index }));
        });
    };

    const stopAutoScroll = () => {
        if (autoScrollFrameRef.current) {
            cancelAnimationFrame(autoScrollFrameRef.current);
            autoScrollFrameRef.current = null;
        }
        autoScrollVelocityRef.current = 0;
    };

    const startAutoScroll = (velocity) => {
        autoScrollVelocityRef.current = velocity;
        if (autoScrollFrameRef.current) return;

        const tick = () => {
            const listEl = finalMenuListRef.current;
            if (!listEl || autoScrollVelocityRef.current === 0) {
                autoScrollFrameRef.current = null;
                return;
            }

            listEl.scrollTop += autoScrollVelocityRef.current;
            autoScrollFrameRef.current = requestAnimationFrame(tick);
        };

        autoScrollFrameRef.current = requestAnimationFrame(tick);
    };

    const handleDishDragStart = (event, index) => {
        if (event?.dataTransfer) {
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.dropEffect = 'move';
            // Some browsers need explicit data to initiate drag reliably.
            event.dataTransfer.setData('text/plain', String(index));
        }

        setDraggedDishIndex(index);
        setDragOverDishIndex(index);
    };

    const handleDishDragOver = (event, index) => {
        event.preventDefault();

        const listEl = finalMenuListRef.current;
        if (listEl) {
            const rect = listEl.getBoundingClientRect();
            const edgeThreshold = 96;

            if (event.clientY < rect.top + edgeThreshold) {
                const intensity = (rect.top + edgeThreshold - event.clientY) / edgeThreshold;
                startAutoScroll(-Math.max(2, Math.min(18, intensity * 18)));
            } else if (event.clientY > rect.bottom - edgeThreshold) {
                const intensity = (event.clientY - (rect.bottom - edgeThreshold)) / edgeThreshold;
                startAutoScroll(Math.max(2, Math.min(18, intensity * 18)));
            } else {
                stopAutoScroll();
            }
        }

        if (dragOverDishIndex !== index) {
            setDragOverDishIndex(index);
        }
    };

    const handleDishDragEnter = (index) => {
        if (draggedDishIndex == null || draggedDishIndex === index) return;
        reorderSelectedDishes(draggedDishIndex, index);
        setDraggedDishIndex(index);
        setDragOverDishIndex(index);
    };

    const handleDishDrop = (index) => {
        reorderSelectedDishes(draggedDishIndex, index);
        stopAutoScroll();
        setDraggedDishIndex(null);
        setDragOverDishIndex(null);
    };

    const handleDishDragEnd = () => {
        stopAutoScroll();
        setDraggedDishIndex(null);
        setDragOverDishIndex(null);
    };

    const handleDropAtTop = () => {
        if (draggedDishIndex == null) return;
        reorderSelectedDishes(draggedDishIndex, 0);
        stopAutoScroll();
        setDraggedDishIndex(null);
        setDragOverDishIndex(null);
    };

    const handleDropAtBottom = () => {
        if (draggedDishIndex == null || selectedDishes.length === 0) return;
        reorderSelectedDishes(draggedDishIndex, selectedDishes.length - 1);
        stopAutoScroll();
        setDraggedDishIndex(null);
        setDragOverDishIndex(null);
    };

    useEffect(() => {
        return () => {
            stopAutoScroll();
        };
    }, []);

    const reorderCategoryBlocks = (fromIndex, toIndex) => {
        if (fromIndex === toIndex || fromIndex == null || toIndex == null) return;

        setSelectedDishes((prev) => {
            const grouped = new Map();

            prev.forEach((dish) => {
                const category = dish.menuCategory || 'Uncategorized';
                if (!grouped.has(category)) grouped.set(category, []);
                grouped.get(category).push(dish);
            });

            const categories = Array.from(grouped.keys());
            if (fromIndex < 0 || fromIndex >= categories.length || toIndex < 0 || toIndex >= categories.length) {
                return prev;
            }

            const nextCategories = [...categories];
            const [moved] = nextCategories.splice(fromIndex, 1);
            nextCategories.splice(toIndex, 0, moved);

            const flattened = nextCategories.flatMap((category) => grouped.get(category) || []);
            return flattened.map((dish, index) => ({ ...dish, displayOrder: index }));
        });
    };

    const isDishSelected = (dish) => {
        return selectedDishes.some((selected) => {
            if (selected?.id != null && dish?.id != null) {
                return selected.id === dish.id;
            }

            return String(selected?.name || '').trim().toLowerCase() === String(dish?.name || '').trim().toLowerCase();
        });
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

        const normalizedClientEmail = String(clientDetails.clientEmail || '').trim().toLowerCase();
        if (status === 'SENT') {
            if (!normalizedClientEmail) {
                alert('Client email is required to send the menu.');
                return;
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedClientEmail)) {
                alert('Please enter a valid client email before sending the menu.');
                return;
            }
        }

        // Backend expects MenuRequest: flat list of dishes + core details
        const dishes = selectedDishes.map((dish, index) => ({
            dishId: dish.id,
            menuCategory: dish.menuCategory || 'Uncategorized',
            displayOrder: index,
            note: dish.note || ''
        }));

        const payload = {
            clientName: clientDetails.clientName,
            eventType: clientDetails.eventType,
            mealTime: clientDetails.mealTime,
            eventLocation: `${clientDetails.venueName}, ${clientDetails.venueAddress}`.trim(),
            eventDate: clientDetails.eventDate,
            numberOfGuests: Number(clientDetails.numberOfGuests),
            // Service will normalize and prepend +91; we send raw 10-digit number
            contactNumber: clientDetails.contactNumber,
            clientEmail: normalizedClientEmail,
            dishes,
        };

        let savedMenu = null;

        try {
            setLoading(true);

            // Create or update the menu first so it is always stored in history.
            savedMenu = editingMenuId
                ? await menuAPI.update(editingMenuId, payload)
                : await menuAPI.create(user.userId, payload);

            // If user chose to send, call explicit send endpoint.
            // If sending fails, keep the saved menu and still route to history.
            if (status === 'SENT' && savedMenu?.id) {
                try {
                    await menuAPI.sendToClient(savedMenu.id);
                    alert('Menu saved and sent to client!');
                } catch (sendError) {
                    console.error('Error sending menu to client:', sendError);
                    alert(`Menu is saved in history, but sending failed: ${sendError.message || 'Unknown error'}`);
                }
            } else {
                alert('Menu saved successfully!');
            }

            navigate('/owner/menu-history');
        } catch (error) {
            console.error('Error saving menu:', error);
            alert(error.message || 'Failed to save menu.');
        } finally {
            setLoading(false);
        }
    };

    const renderStepper = () => (
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

    const renderStep1ClientDetails = () => (
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
                        <option value="Brunch">Brunch</option>
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
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex w-12 items-center justify-center text-slate-500">+91</span>
                        <input id="contactNumber" name="contactNumber" type="tel" className={`form-input !pl-14 ${formErrors.contactNumber ? 'error' : ''}`} value={clientDetails.contactNumber} onChange={handleInputChange} placeholder="98765 43210" />
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

    const renderStep2BuildMenu = () => (
        <div className="space-y-6">
            <div className="surface-card p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                    <h3 className="text-lg font-bold text-slate-800">Dish Library</h3>
                    <button
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-sky-200 bg-sky-50 text-sky-700 text-sm font-semibold hover:bg-sky-100 transition-colors"
                        aria-label="Open selected dishes list"
                    >
                        <Utensils size={15} />
                        Selected: {selectedDishes.length}
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                        <div className="relative lg:col-span-6">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search dishes..."
                                className="form-input !py-2.5 !pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="lg:col-span-3">
                            <select className="form-select !py-2.5" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="lg:col-span-3">
                            <select className="form-select !py-2.5" value={labelFilter} onChange={(e) => setLabelFilter(e.target.value)}>
                                {labels.map(label => <option key={label} value={label}>{label}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="mt-4 h-[420px] overflow-y-auto pr-2 -mr-2">
                    {filteredDishes.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-sm text-slate-500">
                            No dishes match these filters.
                        </div>
                    ) : (
                        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                            {filteredDishes.map((dish) => {
                                const selected = isDishSelected(dish);

                                return (
                                <li
                                    key={dish.id}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => selected ? removeDishByIdentity(dish) : addDishToMenu(dish)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            selected ? removeDishByIdentity(dish) : addDishToMenu(dish);
                                        }
                                    }}
                                    className={`rounded-xl border p-3 transition-all cursor-pointer ${selected ? 'border-sky-400 bg-sky-50 shadow-sm' : 'border-slate-200 bg-white hover:shadow-sm'}`}
                                    aria-label={`${selected ? 'Deselect' : 'Select'} ${dish.name}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={getDishImageSrc(dish.imageUrl)}
                                            alt={dish.name}
                                            className="w-14 h-14 object-cover rounded-md flex-shrink-0"
                                            onError={(e) => {
                                                e.currentTarget.onerror = null;
                                                e.currentTarget.src = FALLBACK_DISH_IMAGE;
                                            }}
                                        />
                                        <div className="min-w-0">
                                            <p className="font-semibold text-slate-800 truncate">{dish.name}</p>
                                        </div>
                                    </div>

                                    <p className="text-sm text-slate-500 mt-2 truncate">{dish.category || 'Uncategorized'}</p>

                                    <div className="mt-2 min-h-6 flex flex-wrap gap-1.5">
                                        {getDishLabels(dish.labels).slice(0, 3).map((label) => (
                                            <span key={`${dish.id}-${label}`} className="inline-flex items-center rounded-md border border-slate-300 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                                                {label}
                                            </span>
                                        ))}
                                    </div>

                                    <p className={`mt-3 text-xs font-semibold ${selected ? 'text-sky-700' : 'text-slate-500'}`}>
                                        {selected ? 'Selected (click again to remove)' : 'Click card to select'}
                                    </p>
                                </li>
                            )})}
                        </ul>
                    )}
                </div>
            </div>

            <div className="surface-card p-4 md:p-5">
                <div className="flex items-center justify-between gap-3 mb-3">
                    <h4 className="font-bold text-slate-800">Quick Selection View</h4>
                    <p className="text-sm text-slate-500">Most-used dishes from your previous menus.</p>
                </div>

                {frequentLoading ? (
                    <p className="text-sm text-slate-500">Loading frequent dishes...</p>
                ) : frequentDishes.length === 0 ? (
                    <p className="text-sm text-slate-500">No frequent dishes found yet. Build a few menus to auto-generate quick picks.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        {frequentDishes.map((dish, index) => {
                            const alreadySelected = isDishSelected(dish);

                            return (
                            <div key={`${dish.id || dish.name}-${index}`} className="rounded-lg border border-slate-200 bg-white p-3">
                                <div className="flex items-center gap-3">
                                    <img
                                        src={getDishImageSrc(dish.imageUrl)}
                                        alt={dish.name}
                                        className="w-10 h-10 rounded-md object-cover"
                                        onError={(e) => {
                                            e.currentTarget.onerror = null;
                                            e.currentTarget.src = FALLBACK_DISH_IMAGE;
                                        }}
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-slate-800 truncate">{dish.name}</p>
                                        <p className="text-xs text-slate-500 truncate">{dish.category || 'Uncategorized'}</p>
                                    </div>
                                </div>

                                <div className="mt-2 min-h-5 flex flex-wrap gap-1.5">
                                    {getDishLabels(dish.labels).slice(0, 2).map((label) => (
                                        <span key={`${dish.id || dish.name}-${label}`} className="inline-flex items-center rounded-md border border-slate-300 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                                            {label}
                                        </span>
                                    ))}
                                </div>

                                <p className="text-xs text-slate-500 mt-2">Used {dish.count} times</p>

                                <button
                                    type="button"
                                    className="secondary-button w-full mt-3 !py-1.5"
                                    onClick={() => alreadySelected ? removeDishByIdentity(dish) : addDishToMenu(dish)}
                                    aria-label={`Add ${dish.name}`}
                                >
                                    {alreadySelected ? 'Added (Click to remove)' : <><Plus size={14} className="mr-1" /> Quick Add</>}
                                </button>
                            </div>
                        )})}
                    </div>
                )}
            </div>
        </div>
    );

    const renderStep3ReviewSend = () => {
        const dishesByCategory = selectedDishes.reduce((acc, dish) => {
            const category = dish.menuCategory || 'Uncategorized';
            if (!acc[category]) acc[category] = [];
            acc[category].push(dish);
            return acc;
        }, {});

        const categoryEntries = Object.entries(dishesByCategory);

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
                    {selectedDishes.length === 0 ? (
                        <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                            <p className="text-sm text-amber-800">No dishes selected. Go back to Step 2 and add dishes.</p>
                            <button className="secondary-button" onClick={() => setCurrentStep(2)}>Go To Step 2</button>
                        </div>
                    ) : (
                        <div
                            ref={finalMenuListRef}
                            className="space-y-6 max-h-[560px] overflow-y-auto pr-1 pt-1 pb-2"
                            onDragOver={(e) => {
                                if (draggedDishIndex == null) return;
                                handleDishDragOver(e, dragOverDishIndex ?? draggedDishIndex);
                            }}
                        >
                            {draggedDishIndex != null && (
                                <div
                                    className="rounded-lg border-2 border-dashed border-sky-300 bg-sky-50/60 px-3 py-2 text-xs text-sky-700"
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        handleDishDragOver(e, 0);
                                    }}
                                    onDrop={handleDropAtTop}
                                >
                                    Drop here to move to top
                                </div>
                            )}

                            {categoryEntries.map(([category, dishes], categoryIndex) => (
                                <div key={category}>
                                    <div className="flex items-center justify-between gap-3 mb-3 pb-2 border-b-2 border-slate-200">
                                        <h4 className="font-bold text-slate-600 text-md">{category}</h4>
                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                className="table-icon-button"
                                                onClick={() => reorderCategoryBlocks(categoryIndex, categoryIndex - 1)}
                                                disabled={categoryIndex === 0}
                                                aria-label={`Move ${category} up`}
                                            >
                                                <ArrowUp size={14} />
                                            </button>
                                            <button
                                                type="button"
                                                className="table-icon-button"
                                                onClick={() => reorderCategoryBlocks(categoryIndex, categoryIndex + 1)}
                                                disabled={categoryIndex === categoryEntries.length - 1}
                                                aria-label={`Move ${category} down`}
                                            >
                                                <ArrowDown size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <ul className="space-y-3">
                                        {dishes.map((dish, index) => {
                                            const selectedIndex = selectedDishes.findIndex((d) => {
                                                if (d?.id != null && dish?.id != null) {
                                                    return d.id === dish.id;
                                                }

                                                return String(d?.name || '').trim().toLowerCase() === String(dish?.name || '').trim().toLowerCase();
                                            });

                                            return (
                                                <li
                                                    key={`${dish.id}-${index}`}
                                                    draggable={selectedIndex !== -1}
                                                    onDragStart={(e) => selectedIndex !== -1 && handleDishDragStart(e, selectedIndex)}
                                                    onDragEnter={() => selectedIndex !== -1 && handleDishDragEnter(selectedIndex)}
                                                    onDragOver={(e) => selectedIndex !== -1 && handleDishDragOver(e, selectedIndex)}
                                                    onDrop={() => selectedIndex !== -1 && handleDishDrop(selectedIndex)}
                                                    onDragEnd={handleDishDragEnd}
                                                    className={`grid grid-cols-1 md:grid-cols-[auto_1fr_1fr_auto] gap-3 items-center rounded-lg border p-3 bg-slate-50/60 transition-all duration-150 ${dragOverDishIndex === selectedIndex ? 'border-sky-400 bg-sky-50/70 scale-[1.005]' : 'border-slate-200'} ${draggedDishIndex === selectedIndex ? 'opacity-60' : ''}`}
                                                >
                                                    <div className="hidden md:flex items-center justify-center text-slate-400 cursor-grab active:cursor-grabbing">
                                                        <GripVertical size={16} />
                                                    </div>
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <img
                                                            src={getDishImageSrc(dish.imageUrl)}
                                                            alt={dish.name}
                                                            className="w-14 h-14 object-cover rounded-lg"
                                                            onError={(e) => {
                                                                e.currentTarget.onerror = null;
                                                                e.currentTarget.src = FALLBACK_DISH_IMAGE;
                                                            }}
                                                        />
                                                        <div className="min-w-0">
                                                            <p className="font-semibold text-slate-800 truncate">{dish.name}</p>
                                                            <p className="text-xs text-slate-500 truncate">Category: {dish.menuCategory || category}</p>
                                                        </div>
                                                    </div>

                                                    <input
                                                        type="text"
                                                        value={dish.note || ''}
                                                        onChange={(e) => selectedIndex !== -1 && updateSelectedDish(selectedIndex, 'note', e.target.value)}
                                                        className="form-input"
                                                        placeholder="Optional note"
                                                    />

                                                    <button
                                                        className="table-icon-button danger"
                                                        onClick={() => selectedIndex !== -1 && removeDishFromMenu(dish.id, selectedIndex)}
                                                        aria-label={`Remove ${dish.name}`}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            ))}

                            {draggedDishIndex != null && (
                                <div
                                    className="rounded-lg border-2 border-dashed border-sky-300 bg-sky-50/60 px-3 py-2 text-xs text-sky-700"
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        handleDishDragOver(e, selectedDishes.length - 1);
                                    }}
                                    onDrop={handleDropAtBottom}
                                >
                                    Drop here to move to bottom
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    };


    return (
        <div className="page-shell py-8">
            <h1 className="text-3xl font-extrabold text-slate-800 text-center mb-2">Menu Builder</h1>
            <p className="text-center text-slate-500 mb-8">{editingMenuId ? `You are editing a menu.` : 'Create a new menu for your client.'}</p>

            {renderStepper()}

            {currentStep === 1 && renderStep1ClientDetails()}
            {currentStep === 2 && renderStep2BuildMenu()}
            {currentStep === 3 && renderStep3ReviewSend()}

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

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Selected Dishes (${selectedDishes.length})`}>
                {selectedDishes.length === 0 ? (
                    <p className="text-sm text-slate-500">No dishes selected yet.</p>
                ) : (
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                        {selectedDishes.map((dish, index) => (
                            <div key={`${dish.id || dish.name}-${index}`} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 bg-slate-50/50">
                                <img
                                    src={getDishImageSrc(dish.imageUrl)}
                                    alt={dish.name}
                                    className="w-12 h-12 rounded-md object-cover"
                                    onError={(e) => {
                                        e.currentTarget.onerror = null;
                                        e.currentTarget.src = FALLBACK_DISH_IMAGE;
                                    }}
                                />
                                <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-slate-800 truncate">{dish.name}</p>
                                    <p className="text-sm text-slate-500 truncate">{dish.menuCategory || dish.category || 'Uncategorized'}</p>
                                </div>
                                <button
                                    type="button"
                                    className="table-icon-button danger"
                                    onClick={() => removeDishFromMenu(dish.id, index)}
                                    aria-label={`Remove ${dish.name}`}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </Modal>
        </div>
    );
}

export default MenuBuilder;
