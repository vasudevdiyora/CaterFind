import React, { useState, useEffect, useRef } from 'react';
import { dishAPI, menuAPI } from '@/services/api';
import { useNavigate, useSearchParams } from 'react-router-dom';

/**
 * Menu Builder Component
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
    eventLocation: '',
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

      setClientDetails({
        clientName: menu.clientName || '',
        eventType: menu.eventType || '',
        eventLocation: menu.eventLocation || '',
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
    const normalizedValue = name === 'contactNumber'
      ? value.replace(/\D/g, '').slice(0, 10)
      : value;

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
    const today = getTodayDateString();

    if (!clientDetails.eventType) {
      errors.eventType = 'Event Type is required';
    }

    if (clientDetails.eventDate && clientDetails.eventDate < today) {
      errors.eventDate = 'Event Date cannot be in the past';
    }

    const guestCount = Number(clientDetails.numberOfGuests);
    if (clientDetails.numberOfGuests !== '' && (!Number.isFinite(guestCount) || guestCount < 1)) {
      errors.numberOfGuests = 'Guest Count must be at least 1';
    }

    if (!/^[6-9]\d{9}$/.test(clientDetails.contactNumber || '')) {
      errors.contactNumber = 'Enter a valid 10-digit Indian mobile number';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Step 1: Validate and proceed to Step 2
  const handleStep1Next = () => {
    if (!validateStep1()) {
      return;
    }

    setCurrentStep(2);
  };

  const handleBack = () => {
    if (currentStep === 1) {
      navigate(-1);
      return;
    }

    if (currentStep === 2) {
      setCurrentStep(1);
      return;
    }

    setCurrentStep(2);
  };

  const openEventDatePicker = () => {
    const input = eventDateInputRef.current;
    if (!input) {
      return;
    }

    if (typeof input.showPicker === 'function') {
      input.showPicker();
    } else {
      input.focus();
    }
  };

  // Step 2: Add dish to menu
  const handleAddDish = (dish) => {
    // Check if already added
    if (selectedDishes.find(d => d.id === dish.id)) {
      alert('Dish already added');
      return;
    }

    // Automatically assign to category based on dish category
    let menuCategory = 'Main Course';
    const category = dish.category.toLowerCase();
    const name = dish.name.toLowerCase();
    
    // Check for Juice/Beverages
    if (category.includes('juice') || category.includes('shake') || category.includes('drink') || category.includes('beverage') ||
        name.includes('juice') || name.includes('shake') || name.includes('smoothie')) {
      menuCategory = 'Juice/Beverages';
    }
    // Check for Soup
    else if (category.includes('soup') || name.includes('soup')) {
      menuCategory = 'Soup';
    }
    // Check for Starter
    else if (category.includes('starter') || category.includes('appetizer')) {
      menuCategory = 'Starter';
    }
    // Check for Italian
    else if (category.includes('italian') || category.includes('pizza') || category.includes('pasta') ||
             name.includes('pizza') || name.includes('pasta') || name.includes('lasagna') || name.includes('risotto')) {
      menuCategory = 'Italian';
    }
    // Check for Mexican
    else if (category.includes('mexican') || category.includes('taco') || category.includes('burrito') ||
             name.includes('taco') || name.includes('burrito') || name.includes('quesadilla') || name.includes('nacho')) {
      menuCategory = 'Mexican';
    }
    // Check for Dessert
    else if (category.includes('dessert') || category.includes('sweet') || category.includes('cake') ||
             name.includes('cake') || name.includes('ice cream') || name.includes('pudding')) {
      menuCategory = 'Dessert';
    }

    setSelectedDishes(prev => [...prev, { ...dish, menuCategory, note: '' }]);
  };

  const handleDishNoteChange = (dishId, note) => {
    setSelectedDishes(prev => prev.map(dish => (
      dish.id === dishId ? { ...dish, note } : dish
    )));
  };

  // Remove dish from selection
  const handleRemoveDish = (dishId) => {
    setSelectedDishes(prev => prev.filter(d => d.id !== dishId));
  };

  // Step 3: Save draft
  const handleSaveDraft = async () => {
    try {
      setLoading(true);
      const menuData = {
        clientName: clientDetails.clientName || null,
        eventType: clientDetails.eventType || null,
        eventLocation: clientDetails.eventLocation || null,
        eventDate: clientDetails.eventDate || null,
        numberOfGuests: clientDetails.numberOfGuests ? parseInt(clientDetails.numberOfGuests, 10) : null,
        contactNumber: clientDetails.contactNumber ? clientDetails.contactNumber.trim() : null,
        clientEmail: clientDetails.clientEmail || null,
        dishes: selectedDishes.map((dish, index) => ({
          dishId: dish.id,
          menuCategory: dish.menuCategory,
          displayOrder: index,
          note: dish.note || null
        }))
      };

      if (editingMenuId) {
        await menuAPI.update(editingMenuId, menuData);
        alert('Menu updated successfully!');
      } else {
        await menuAPI.create(user.userId, menuData);
        alert('Menu draft saved successfully!');
      }
      resetForm();
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('Failed to save draft');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Send to client
  const handleSendToClient = async () => {
    if (selectedDishes.length === 0) {
      alert('Please add at least one dish to the menu');
      return;
    }

    try {
      setLoading(true);
      const menuData = {
        clientName: clientDetails.clientName || null,
        eventType: clientDetails.eventType || null,
        eventLocation: clientDetails.eventLocation || null,
        eventDate: clientDetails.eventDate || null,
        numberOfGuests: clientDetails.numberOfGuests ? parseInt(clientDetails.numberOfGuests, 10) : null,
        contactNumber: clientDetails.contactNumber ? clientDetails.contactNumber.trim() : null,
        clientEmail: clientDetails.clientEmail || null,
        dishes: selectedDishes.map((dish, index) => ({
          dishId: dish.id,
          menuCategory: dish.menuCategory,
          displayOrder: index,
          note: dish.note || null
        }))
      };

      const menuIdToSend = editingMenuId
        ? editingMenuId
        : (await menuAPI.create(user.userId, menuData)).id;

      if (editingMenuId) {
        await menuAPI.update(editingMenuId, menuData);
      }

      await menuAPI.sendToClient(menuIdToSend);
      
      alert('Menu sent to client successfully!');
      resetForm();
    } catch (error) {
      console.error('Error sending menu:', error);
      alert('Failed to send menu to client');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setClientDetails({
      clientName: '',
      eventType: '',
      eventLocation: '',
      eventDate: '',
      numberOfGuests: '',
      contactNumber: '',
      clientEmail: ''
    });
    setFormErrors({});
    setSelectedDishes([]);
    setSelectedLabels([]);
    setEditingMenuId(null);
    navigate('/owner/menu-builder', { replace: true });
  };

  // Define category order
  const categoryOrder = [
    'Juice/Beverages',
    'Soup',
    'Starter',
    'Italian',
    'Mexican',
    'Main Course',
    'Dessert'
  ];

  // Group dishes by menu category for review
  const dishesByCategory = selectedDishes.reduce((acc, dish) => {
    if (!acc[dish.menuCategory]) {
      acc[dish.menuCategory] = [];
    }
    acc[dish.menuCategory].push(dish);
    return acc;
  }, {});

  // Get ordered categories
  const orderedCategories = categoryOrder.filter(cat => dishesByCategory[cat]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-2 md:p-3">
      <div className="max-w-7xl mx-auto">
        {/* Header + Step Indicators */}
        <div className="flex items-center gap-2 mb-2 pl-1">
          <div className="flex items-center gap-2 shrink-0">
            <div className="text-lg">🍴</div>
            <h1 className="text-lg font-bold">Menu Builder</h1>
          </div>
          <div className="flex-1 overflow-x-auto">
            <div className="min-w-[500px] flex items-center justify-end">
          {/* Step 1 */}
          <div className="flex items-center gap-1.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              currentStep === 1 ? 'bg-[#f59e0b] text-black' : 
              currentStep > 1 ? 'bg-[#f59e0b] text-black' : 'bg-gray-700 text-gray-400'
            }`}>
              {currentStep > 1 ? '✓' : '1'}
            </div>
            <span className={`text-xs ${currentStep >= 1 ? 'text-white' : 'text-gray-500'}`}>Client Details</span>
          </div>

          {/* Connector */}
          <div className={`w-8 h-0.5 mx-2 ${currentStep > 1 ? 'bg-[#f59e0b]' : 'bg-gray-700'}`}></div>

          {/* Step 2 */}
          <div className="flex items-center gap-1.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              currentStep === 2 ? 'bg-[#f59e0b] text-black' : 
              currentStep > 2 ? 'bg-[#f59e0b] text-black' : 'bg-gray-700 text-gray-400'
            }`}>
              {currentStep > 2 ? '✓' : '2'}
            </div>
            <span className={`text-xs ${currentStep >= 2 ? 'text-white' : 'text-gray-500'}`}>Build Menu</span>
          </div>

          {/* Connector */}
          <div className={`w-8 h-0.5 mx-2 ${currentStep > 2 ? 'bg-[#f59e0b]' : 'bg-gray-700'}`}></div>

          {/* Step 3 */}
          <div className="flex items-center gap-1.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              currentStep === 3 ? 'bg-[#f59e0b] text-black' : 'bg-gray-700 text-gray-400'
            }`}>
              3
            </div>
            <span className={`text-xs ${currentStep === 3 ? 'text-white' : 'text-gray-500'}`}>Review & Send</span>
          </div>
            </div>
          </div>
        </div>

        {/* Step 1: Client Details */}
        {currentStep === 1 && (
          <div className="bg-[#1a1a1a] rounded-lg p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Client Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm">Event Type *</label>
                <select
                  name="eventType"
                  value={clientDetails.eventType}
                  onChange={handleInputChange}
                  className={`w-full bg-[#2a2a2a] border rounded-lg px-4 py-3 focus:outline-none focus:border-[#f59e0b] ${
                    formErrors.eventType ? 'border-red-500' : 'border-gray-700'
                  }`}
                >
                  <option value="">Select event type</option>
                  <option value="Wedding">Wedding</option>
                  <option value="Birthday">Birthday</option>
                  <option value="Corporate Event">Corporate Event</option>
                  <option value="Engagement">Engagement</option>
                  <option value="Party">Party</option>
                  <option value="Other">Other</option>
                </select>
                {formErrors.eventType && (
                  <p className="text-red-400 text-xs mt-1">{formErrors.eventType}</p>
                )}
              </div>

              <div>
                <label className="block mb-2 text-sm">Client Name</label>
                <input
                  type="text"
                  name="clientName"
                  value={clientDetails.clientName}
                  onChange={handleInputChange}
                  placeholder="Enter client name"
                  className="w-full bg-[#2a2a2a] border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-[#f59e0b]"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm">Event Location</label>
                <input
                  type="text"
                  name="eventLocation"
                  value={clientDetails.eventLocation}
                  onChange={handleInputChange}
                  placeholder="Enter venue address"
                  className="w-full bg-[#2a2a2a] border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-[#f59e0b]"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm">Event Date</label>
                <div className="relative">
                  <input
                    ref={eventDateInputRef}
                    type="date"
                    name="eventDate"
                    value={clientDetails.eventDate}
                    onChange={handleInputChange}
                    min={getTodayDateString()}
                    className={`w-full bg-[#2a2a2a] border rounded-lg px-4 py-3 focus:outline-none focus:border-[#f59e0b] ${
                      formErrors.eventDate ? 'border-red-500' : 'border-gray-700'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={openEventDatePicker}
                    className="absolute top-0 right-0 h-full w-[65%] rounded-r-lg"
                    aria-label="Open calendar"
                  />
                </div>
                {formErrors.eventDate && (
                  <p className="text-red-400 text-xs mt-1">{formErrors.eventDate}</p>
                )}
              </div>

              <div>
                <label className="block mb-2 text-sm">Number of Guests</label>
                <input
                  type="number"
                  name="numberOfGuests"
                  value={clientDetails.numberOfGuests}
                  onChange={handleInputChange}
                  min="1"
                  step="1"
                  placeholder="e.g., 200"
                  className={`w-full bg-[#2a2a2a] border rounded-lg px-4 py-3 focus:outline-none focus:border-[#f59e0b] ${
                    formErrors.numberOfGuests ? 'border-red-500' : 'border-gray-700'
                  }`}
                />
                {formErrors.numberOfGuests && (
                  <p className="text-red-400 text-xs mt-1">{formErrors.numberOfGuests}</p>
                )}
              </div>

              <div>
                <label className="block mb-2 text-sm">Contact Number</label>
                <input
                  type="tel"
                  name="contactNumber"
                  value={clientDetails.contactNumber}
                  onChange={handleInputChange}
                  placeholder="10-digit mobile number"
                  inputMode="numeric"
                  maxLength={10}
                  className={`w-full bg-[#2a2a2a] border rounded-lg px-4 py-3 focus:outline-none focus:border-[#f59e0b] ${
                    formErrors.contactNumber ? 'border-red-500' : 'border-gray-700'
                  }`}
                />
                {formErrors.contactNumber && (
                  <p className="text-red-400 text-xs mt-1">{formErrors.contactNumber}</p>
                )}
              </div>

              <div>
                <label className="block mb-2 text-sm">Client Email</label>
                <input
                  type="email"
                  name="clientEmail"
                  value={clientDetails.clientEmail}
                  onChange={handleInputChange}
                  placeholder="client@example.com"
                  className="w-full bg-[#2a2a2a] border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-[#f59e0b]"
                />
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleBack}
                  className="flex-1 bg-gray-700 text-white font-semibold py-3 rounded-lg hover:bg-gray-600 transition"
                >
                  ← Back
                </button>
                <button
                  onClick={resetForm}
                  className="flex-1 bg-[#3a3a3a] text-white font-semibold py-3 rounded-lg hover:bg-[#2a2a2a] transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStep1Next}
                  className="flex-1 bg-[#f59e0b] text-black font-semibold py-3 rounded-lg hover:bg-[#d97706] transition"
                >
                  Next: Build Menu →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Build Menu */}
        {currentStep === 2 && (
          <div className="bg-[#1a1a1a] rounded-lg w-full max-w-none mx-auto overflow-hidden flex flex-col" style={{ height: '88vh' }}>
            {/* Header */}
            <div className="flex justify-between items-center px-4 py-3 border-b border-gray-700">
              <h2 className="text-xl font-bold">{editingMenuId ? 'Edit Menu - Selected Dishes' : 'Build Menu - Selected Dishes'}</h2>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-[#f59e0b] text-black px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-[#d97706] transition"
              >
                + Add from Library
              </button>
            </div>

            {/* Selected Dishes List */}
            {selectedDishes.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                <div className="text-6xl mb-4">🍴</div>
                <p className="text-lg">No dishes added yet.</p>
                <p className="text-sm">Click "Add from Library" to select dishes.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-3">
                  {selectedDishes.map(dish => (
                    <div key={dish.id} className="bg-[#2a2a2a] rounded-lg p-3 flex gap-3 items-start hover:bg-[#323232] transition">
                      {dish.imageUrl && (
                        <img
                          src={`http://localhost:8080${dish.imageUrl}`}
                          alt={dish.name}
                          className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-1.5">
                          <div className="min-w-0 max-w-[52%]">
                            <h4 className="font-semibold text-base leading-tight truncate">{dish.name}</h4>
                            <p className="text-xs text-gray-400">{dish.category}</p>
                          </div>
                          <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap pr-1 max-w-[48%]">
                            <span className="px-2 py-0.5 bg-blue-600/30 text-blue-300 rounded text-[11px] font-medium shrink-0">
                              {dish.menuCategory}
                            </span>
                            {dish.labels && dish.labels.split(',').map((label, i) => (
                              <span key={i} className="text-[11px] bg-gray-700 px-1.5 py-0.5 rounded shrink-0">
                                {label.trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <label className="text-xs text-gray-400 shrink-0">Dish Note (optional)</label>
                          <input
                            type="text"
                            value={dish.note || ''}
                            onChange={(e) => handleDishNoteChange(dish.id, e.target.value)}
                            placeholder="e.g., Less spicy, serve hot"
                            className="w-full max-w-md bg-[#1f1f1f] border border-gray-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#f59e0b]"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveDish(dish.id)}
                        className="px-3 py-1 rounded-lg font-semibold text-xs bg-green-600 text-white hover:bg-green-700 transition self-center"
                        title="Click to remove from menu"
                      >
                        ✓ Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-700 flex gap-3">
              <button
                onClick={handleBack}
                className="flex-1 bg-gray-700 text-white py-2 rounded-lg text-sm hover:bg-gray-600 transition"
              >
                ← Back
              </button>
              <button
                onClick={resetForm}
                className="flex-1 bg-[#3a3a3a] text-white py-2 rounded-lg text-sm hover:bg-[#2a2a2a] transition"
              >
                Cancel
              </button>
              <button
                onClick={() => setCurrentStep(3)}
                className="flex-1 bg-[#a67c52] text-white py-2 rounded-lg text-sm hover:bg-[#8b6642] transition"
              >
                Review Menu →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Send */}
        {currentStep === 3 && (
          <div className="bg-[#1a1a1a] rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-6">{editingMenuId ? 'Review & Update Menu' : 'Review Menu'}</h2>

            {/* Client Info Summary */}
            <div className="bg-[#2a2a2a] rounded-lg p-6 mb-6">
              <p className="mb-2"><span className="font-semibold">Client:</span> {clientDetails.clientName}</p>
              <p className="mb-2"><span className="font-semibold">Event Type:</span> {clientDetails.eventType}</p>
              <p className="mb-2"><span className="font-semibold">Event:</span> {clientDetails.eventDate} at {clientDetails.eventLocation}</p>
              <p className="mb-2"><span className="font-semibold">Guests:</span> {clientDetails.numberOfGuests}</p>
              <p><span className="font-semibold">Contact:</span> {clientDetails.contactNumber}</p>
            </div>

            {/* Dishes by Category */}
            <div className="space-y-6 mb-8">
              {orderedCategories.map(category => (
                <div key={category}>
                  <h3 className="text-xl font-semibold mb-3">{category}</h3>
                  <ul className="list-disc list-inside pl-4 space-y-1">
                    {dishesByCategory[category].map(dish => (
                      <li key={dish.id}>
                        {dish.name}
                        {dish.note ? <span className="text-gray-400"> - Note: {dish.note}</span> : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <button
                onClick={handleBack}
                className="w-full bg-gray-700 text-white py-3 rounded-lg hover:bg-gray-600 transition flex items-center justify-center gap-2"
              >
                ← Back
              </button>

              <button
                onClick={handleSaveDraft}
                disabled={loading}
                className="w-full bg-[#4a4a4a] text-white py-3 rounded-lg hover:bg-[#3a3a3a] transition flex items-center justify-center gap-2"
              >
                💾 Save Draft
              </button>

              <button
                onClick={handleSendToClient}
                disabled={loading}
                className="w-full bg-[#f59e0b] text-black font-semibold py-3 rounded-lg hover:bg-[#d97706] transition flex items-center justify-center gap-2"
              >
                📤 Send to Client
              </button>

              <button
                onClick={resetForm}
                className="w-full bg-[#3a3a3a] text-white py-3 rounded-lg hover:bg-[#2a2a2a] transition flex items-center justify-center gap-2"
              >
                ✕ Cancel
              </button>
            </div>
          </div>
        )}

        {/* Modal: Select Dishes from Library */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1a1a] rounded-lg w-[97vw] h-[95vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="flex justify-between items-center px-4 py-3 border-b border-gray-700">
                <h3 className="text-xl font-bold">Select Dishes from Library</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-xl hover:text-gray-400"
                >
                  ✕
                </button>
              </div>

              {/* Search and Filters */}
              <div className="px-4 py-3 border-b border-gray-700">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    placeholder="Search dishes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-52 sm:w-64 bg-[#2a2a2a] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f59e0b]"
                  />

                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-40 sm:w-48 bg-[#2a2a2a] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f59e0b]"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>

                  <details className="relative">
                    <summary className="list-none cursor-pointer w-40 sm:w-48 bg-[#2a2a2a] border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 hover:border-[#f59e0b]">
                      {selectedLabels.length > 0 ? `Labels (${selectedLabels.length})` : 'Labels'}
                    </summary>
                    <div className="absolute z-20 mt-2 w-56 max-h-56 overflow-y-auto bg-[#1f1f1f] border border-gray-700 rounded-lg p-2 shadow-xl">
                      {labels.length === 0 && (
                        <div className="text-xs text-gray-400 px-2 py-1">No labels available</div>
                      )}
                      {labels.map(label => (
                        <label key={label} className="flex items-center gap-2 px-2 py-1.5 rounded text-xs hover:bg-[#2a2a2a]">
                          <input
                            type="checkbox"
                            checked={selectedLabels.includes(label)}
                            onChange={() => toggleLabel(label)}
                          />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                  </details>

                  {selectedLabels.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedLabels([])}
                      className="px-2.5 py-2 text-xs rounded-lg border border-gray-700 hover:border-[#f59e0b] text-gray-300"
                    >
                      Clear Labels
                    </button>
                  )}
                </div>
                <div className="text-[11px] text-gray-400 mt-2">Label filter matches all selected labels</div>
              </div>

              {/* Dishes List */}
              <div className="flex-1 overflow-y-auto px-4 py-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {filteredDishes.map(dish => (
                    <div key={dish.id} className="bg-[#2a2a2a] rounded-lg p-3 border border-gray-700 hover:border-[#f59e0b] transition flex flex-col h-full min-h-[260px]">
                      <div className="w-full h-24 rounded-lg overflow-hidden bg-[#1f1f1f] mb-2 flex items-center justify-center">
                        {dish.imageUrl ? (
                          <img
                            src={`http://localhost:8080${dish.imageUrl}`}
                            alt={dish.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-2xl">🍽️</span>
                        )}
                      </div>
                      <div className="flex items-start gap-1 mt-0.5 min-h-[2.4rem]">
                        <h4 className="font-semibold text-sm leading-tight line-clamp-2 max-w-[52%]">{dish.name}</h4>
                        {dish.labels && (
                          <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap pr-1 max-w-[45%]">
                            {dish.labels.split(',').map((label, i) => (
                              <span key={i} className="text-[10px] bg-gray-700 px-1.5 py-0.5 rounded shrink-0">
                                {label.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{dish.category}</p>
                      <button
                        onClick={() => {
                          const isAdded = selectedDishes.find(d => d.id === dish.id);
                          if (isAdded) {
                            handleRemoveDish(dish.id);
                          } else {
                            handleAddDish(dish);
                          }
                        }}
                        className={`w-full mt-auto px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                          selectedDishes.find(d => d.id === dish.id)
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-[#f59e0b] text-black hover:bg-[#d97706]'
                        }`}
                        title={selectedDishes.find(d => d.id === dish.id) ? 'Click to remove from menu' : 'Click to add to menu'}
                      >
                        {selectedDishes.find(d => d.id === dish.id) ? '✓ Remove' : '+ Add'}
                      </button>
                    </div>
                  ))}

                  {filteredDishes.length === 0 && (
                    <div className="text-center py-8 text-gray-400 col-span-full">
                      No dishes found
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-4 py-3 border-t border-gray-700">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-full bg-[#f59e0b] text-black font-semibold py-2.5 rounded-lg hover:bg-[#d97706] transition"
                >
                  Done ({selectedDishes.length} dishes selected)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MenuBuilder;
