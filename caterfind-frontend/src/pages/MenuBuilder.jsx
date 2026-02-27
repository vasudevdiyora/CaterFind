import React, { useState, useEffect } from 'react';
import { dishAPI, menuAPI } from '@/services/api';

/**
 * Menu Builder Component
 * Three-step process: Client Details -> Build Menu -> Review & Send
 */
function MenuBuilder({ user }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Client details (Step 1)
  const [clientDetails, setClientDetails] = useState({
    clientName: '',
    eventLocation: '',
    eventDate: '',
    numberOfGuests: '',
    contactNumber: '',
    clientEmail: ''
  });

  // Menu dishes (Step 2)
  const [selectedDishes, setSelectedDishes] = useState([]);
  
  // All available dishes from library
  const [allDishes, setAllDishes] = useState([]);
  const [filteredDishes, setFilteredDishes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [labelFilter, setLabelFilter] = useState('All Labels');

  // Loading state
  const [loading, setLoading] = useState(false);

  // Load dishes from library
  useEffect(() => {
    loadDishes();
  }, []);

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

    // Label filter
    if (labelFilter !== 'All Labels') {
      filtered = filtered.filter(dish => 
        dish.labels && dish.labels.toLowerCase().includes(labelFilter.toLowerCase())
      );
    }

    setFilteredDishes(filtered);
  }, [searchQuery, categoryFilter, labelFilter, allDishes]);

  // Get unique categories and labels
  const categories = ['All Categories', ...new Set(allDishes.map(d => d.category))];
  const labels = ['All Labels', ...new Set(
    allDishes.flatMap(d => d.labels ? d.labels.split(',').map(l => l.trim()) : [])
  )];

  // Handle client details form change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setClientDetails(prev => ({ ...prev, [name]: value }));
  };

  // Step 1: Validate and proceed to Step 2
  const handleStep1Next = () => {
    if (!clientDetails.clientName || !clientDetails.eventLocation || 
        !clientDetails.eventDate || !clientDetails.numberOfGuests || 
        !clientDetails.contactNumber || !clientDetails.clientEmail) {
      alert('Please fill all fields');
      return;
    }
    setCurrentStep(2);
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
    
    if (category.includes('starter') || category.includes('appetizer')) {
      menuCategory = 'Starter';
    } else if (category.includes('dessert') || category.includes('sweet')) {
      menuCategory = 'Dessert';
    } else if (category.includes('drink') || category.includes('beverage')) {
      menuCategory = 'Beverage';
    }

    setSelectedDishes(prev => [...prev, { ...dish, menuCategory }]);
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
        clientName: clientDetails.clientName,
        eventLocation: clientDetails.eventLocation,
        eventDate: clientDetails.eventDate,
        numberOfGuests: parseInt(clientDetails.numberOfGuests),
        contactNumber: clientDetails.contactNumber,
        clientEmail: clientDetails.clientEmail,
        dishes: selectedDishes.map((dish, index) => ({
          dishId: dish.id,
          menuCategory: dish.menuCategory,
          displayOrder: index
        }))
      };

      await menuAPI.create(user.userId, menuData);
      alert('Menu draft saved successfully!');
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
        clientName: clientDetails.clientName,
        eventLocation: clientDetails.eventLocation,
        eventDate: clientDetails.eventDate,
        numberOfGuests: parseInt(clientDetails.numberOfGuests),
        contactNumber: clientDetails.contactNumber,
        clientEmail: clientDetails.clientEmail,
        dishes: selectedDishes.map((dish, index) => ({
          dishId: dish.id,
          menuCategory: dish.menuCategory,
          displayOrder: index
        }))
      };

      const menu = await menuAPI.create(user.userId, menuData);
      await menuAPI.sendToClient(menu.id);
      
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
      eventLocation: '',
      eventDate: '',
      numberOfGuests: '',
      contactNumber: '',
      clientEmail: ''
    });
    setSelectedDishes([]);
  };

  // Group dishes by menu category for review
  const dishesByCategory = selectedDishes.reduce((acc, dish) => {
    if (!acc[dish.menuCategory]) {
      acc[dish.menuCategory] = [];
    }
    acc[dish.menuCategory].push(dish);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="text-3xl">🍴</div>
          <h1 className="text-3xl font-bold">Menu Builder</h1>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-between mb-8 max-w-2xl mx-auto">
          {/* Step 1 */}
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
              currentStep === 1 ? 'bg-[#f59e0b] text-black' : 
              currentStep > 1 ? 'bg-[#f59e0b] text-black' : 'bg-gray-700 text-gray-400'
            }`}>
              {currentStep > 1 ? '✓' : '1'}
            </div>
            <span className={currentStep >= 1 ? 'text-white' : 'text-gray-500'}>Client Details</span>
          </div>

          {/* Connector */}
          <div className={`flex-1 h-1 mx-4 ${currentStep > 1 ? 'bg-[#f59e0b]' : 'bg-gray-700'}`}></div>

          {/* Step 2 */}
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
              currentStep === 2 ? 'bg-[#f59e0b] text-black' : 
              currentStep > 2 ? 'bg-[#f59e0b] text-black' : 'bg-gray-700 text-gray-400'
            }`}>
              {currentStep > 2 ? '✓' : '2'}
            </div>
            <span className={currentStep >= 2 ? 'text-white' : 'text-gray-500'}>Build Menu</span>
          </div>

          {/* Connector */}
          <div className={`flex-1 h-1 mx-4 ${currentStep > 2 ? 'bg-[#f59e0b]' : 'bg-gray-700'}`}></div>

          {/* Step 3 */}
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
              currentStep === 3 ? 'bg-[#f59e0b] text-black' : 'bg-gray-700 text-gray-400'
            }`}>
              3
            </div>
            <span className={currentStep === 3 ? 'text-white' : 'text-gray-500'}>Review & Send</span>
          </div>
        </div>

        {/* Step 1: Client Details */}
        {currentStep === 1 && (
          <div className="bg-[#1a1a1a] rounded-lg p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Client Details</h2>
            
            <div className="space-y-4">
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
                <input
                  type="date"
                  name="eventDate"
                  value={clientDetails.eventDate}
                  onChange={handleInputChange}
                  className="w-full bg-[#2a2a2a] border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-[#f59e0b]"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm">Number of Guests</label>
                <input
                  type="number"
                  name="numberOfGuests"
                  value={clientDetails.numberOfGuests}
                  onChange={handleInputChange}
                  placeholder="e.g., 200"
                  className="w-full bg-[#2a2a2a] border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-[#f59e0b]"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm">Contact Number</label>
                <input
                  type="tel"
                  name="contactNumber"
                  value={clientDetails.contactNumber}
                  onChange={handleInputChange}
                  placeholder="+91..."
                  className="w-full bg-[#2a2a2a] border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-[#f59e0b]"
                />
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

              <button
                onClick={handleStep1Next}
                className="w-full bg-[#f59e0b] text-black font-semibold py-3 rounded-lg hover:bg-[#d97706] transition mt-6"
              >
                Next: Build Menu →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Build Menu */}
        {currentStep === 2 && (
          <div className="bg-[#1a1a1a] rounded-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Build Menu</h2>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-[#f59e0b] text-black px-6 py-2 rounded-lg font-semibold hover:bg-[#d97706] transition"
              >
                + Add from Library
              </button>
            </div>

            {/* Selected Dishes */}
            {selectedDishes.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <div className="text-6xl mb-4">🍴</div>
                <p className="text-lg">No dishes added yet.</p>
                <p className="text-sm">Click "Add from Library" to select dishes.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(dishesByCategory).map(([category, dishes]) => (
                  <div key={category}>
                    <h3 className="text-xl font-semibold mb-3">{category}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {dishes.map(dish => (
                        <div key={dish.id} className="bg-[#2a2a2a] rounded-lg p-4 flex gap-4">
                          {dish.imageUrl && (
                            <img
                              src={`http://localhost:8080${dish.imageUrl}`}
                              alt={dish.name}
                              className="w-20 h-20 rounded-lg object-cover"
                            />
                          )}
                          <div className="flex-1">
                            <h4 className="font-semibold">{dish.name}</h4>
                            <p className="text-sm text-gray-400">{dish.category}</p>
                            {dish.labels && (
                              <div className="flex gap-1 mt-1">
                                {dish.labels.split(',').map((label, i) => (
                                  <span key={i} className="text-xs bg-gray-700 px-2 py-1 rounded">
                                    {label.trim()}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => handleRemoveDish(dish.id)}
                            className="text-red-500 hover:text-red-400"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setCurrentStep(1)}
                className="flex-1 bg-gray-700 text-white py-3 rounded-lg hover:bg-gray-600 transition"
              >
                ← Back
              </button>
              <button
                onClick={() => setCurrentStep(3)}
                className="flex-1 bg-[#a67c52] text-white py-3 rounded-lg hover:bg-[#8b6642] transition"
              >
                Review Menu →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Send */}
        {currentStep === 3 && (
          <div className="bg-[#1a1a1a] rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Review Menu</h2>

            {/* Client Info Summary */}
            <div className="bg-[#2a2a2a] rounded-lg p-6 mb-6">
              <p className="mb-2"><span className="font-semibold">Client:</span> {clientDetails.clientName}</p>
              <p className="mb-2"><span className="font-semibold">Event:</span> {clientDetails.eventDate} at {clientDetails.eventLocation}</p>
              <p className="mb-2"><span className="font-semibold">Guests:</span> {clientDetails.numberOfGuests}</p>
              <p><span className="font-semibold">Contact:</span> {clientDetails.contactNumber}</p>
            </div>

            {/* Dishes by Category */}
            <div className="space-y-6 mb-8">
              {Object.entries(dishesByCategory).map(([category, dishes]) => (
                <div key={category}>
                  <h3 className="text-xl font-semibold mb-3">{category}</h3>
                  <ul className="list-disc list-inside pl-4 space-y-1">
                    {dishes.map(dish => (
                      <li key={dish.id}>{dish.name}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <button
                onClick={() => setCurrentStep(2)}
                className="w-full bg-gray-700 text-white py-3 rounded-lg hover:bg-gray-600 transition flex items-center justify-center gap-2"
              >
                ← Edit Menu
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
            </div>
          </div>
        )}

        {/* Modal: Select Dishes from Library */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-6">
            <div className="bg-[#1a1a1a] rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b border-gray-700">
                <h3 className="text-2xl font-bold">Select Dishes from Library</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-2xl hover:text-gray-400"
                >
                  ✕
                </button>
              </div>

              {/* Search and Filters */}
              <div className="p-6 border-b border-gray-700">
                <input
                  type="text"
                  placeholder="Search dishes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#2a2a2a] border border-gray-700 rounded-lg px-4 py-2 mb-4 focus:outline-none focus:border-[#f59e0b]"
                />

                <div className="flex gap-4">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="flex-1 bg-[#2a2a2a] border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-[#f59e0b]"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>

                  <select
                    value={labelFilter}
                    onChange={(e) => setLabelFilter(e.target.value)}
                    className="flex-1 bg-[#2a2a2a] border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-[#f59e0b]"
                  >
                    {labels.map(label => (
                      <option key={label} value={label}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dishes List */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  {filteredDishes.map(dish => (
                    <div key={dish.id} className="bg-[#2a2a2a] rounded-lg p-4 flex gap-4 items-center">
                      {dish.imageUrl && (
                        <img
                          src={`http://localhost:8080${dish.imageUrl}`}
                          alt={dish.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">{dish.name}</h4>
                        <p className="text-sm text-gray-400">{dish.category}</p>
                        {dish.labels && (
                          <div className="flex gap-1 mt-1">
                            {dish.labels.split(',').map((label, i) => (
                              <span key={i} className="text-xs bg-gray-700 px-2 py-1 rounded">
                                {label.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleAddDish(dish)}
                        disabled={selectedDishes.find(d => d.id === dish.id)}
                        className={`px-4 py-2 rounded-lg font-semibold ${
                          selectedDishes.find(d => d.id === dish.id)
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : 'bg-[#f59e0b] text-black hover:bg-[#d97706]'
                        }`}
                      >
                        {selectedDishes.find(d => d.id === dish.id) ? 'Added' : '+ Add'}
                      </button>
                    </div>
                  ))}

                  {filteredDishes.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      No dishes found
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-700">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-full bg-[#f59e0b] text-black font-semibold py-3 rounded-lg hover:bg-[#d97706] transition"
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
