import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, Plus, Pencil, Trash2, X, Check, UtensilsCrossed, Info, Upload } from 'lucide-react';
import { dishAPI, fileAPI } from '../services/api';
import '../styles/Table.css'; // Reuse table/modal styles

/**
 * Dish Library Page Component
 * 
 * Allows caterers to manage their repertoire of dishes.
 * Features: Search, Category/Label filtering, and Add/Edit/Delete functionality.
 */
function DishLibrary({ user }) {
    const [dishes, setDishes] = useState([]);
    const [filteredDishes, setFilteredDishes] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All Categories');
    const [selectedLabel, setSelectedLabel] = useState('All Labels');

    const [showModal, setShowModal] = useState(false);
    const [editingDish, setEditingDish] = useState(null);
    const [loading, setLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    const imageInputRef = useRef(null);

    const [formData, setFormData] = useState({
        name: '',
        category: '',
        imageUrl: '',
        description: '',
        type: 'Veg',
        labels: [],
        customCategory: '',
        customLabel: ''
    });

    const defaultCategories = ['Soup', 'Starter', 'Main Course', 'Dessert', 'Beverage', 'Snacks', 'Salad', 'Bread'];
    const defaultLabels = ['Spicy', 'Healthy', 'Luxury', 'Ice Cream', 'Kulfi', 'Cupcake', 'Hot Beverage', 'Vegan', 'Gluten-Free'];

    // Derived unique categories and labels from existing dishes + defaults
    const [availableCategories, setAvailableCategories] = useState(defaultCategories);
    const [availableLabels, setAvailableLabels] = useState(defaultLabels);

    useEffect(() => {
        fetchDishes();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [dishes, searchTerm, selectedCategory, selectedLabel]);

    const fetchDishes = async () => {
        try {
            setLoading(true);
            const data = await dishAPI.getAll(user.userId);
            setDishes(data);

            // Extract unique categories and labels from existing dishes
            const dishCategories = [...new Set(data.map(d => d.category))];
            const dishLabels = [...new Set(data.flatMap(d => d.labels ? d.labels.split(',') : []))];

            setAvailableCategories([...new Set([...defaultCategories, ...dishCategories])]);
            setAvailableLabels([...new Set([...defaultLabels, ...dishLabels])]);
        } catch (error) {
            // Error fetching dishes
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let result = dishes;

        if (searchTerm) {
            result = result.filter(d =>
                d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                d.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (selectedCategory !== 'All Categories') {
            result = result.filter(d => d.category === selectedCategory);
        }

        if (selectedLabel !== 'All Labels') {
            result = result.filter(d => d.labels && d.labels.split(',').includes(selectedLabel));
        }

        setFilteredDishes(result);
    };

    const handleAddDish = () => {
        setEditingDish(null);
        setFormData({
            name: '',
            category: '',
            imageUrl: '',
            description: '',
            type: 'Veg',
            labels: [],
            customCategory: '',
            customLabel: ''
        });
        setShowModal(true);
    };

    const handleEditDish = (dish) => {
        setEditingDish(dish);
        setFormData({
            name: dish.name,
            category: dish.category,
            imageUrl: dish.imageUrl || '',
            description: dish.description || '',
            type: dish.type,
            labels: dish.labels ? dish.labels.split(',') : [],
            customCategory: '',
            customLabel: ''
        });
        setShowModal(true);
    };

    const handleDeleteDish = async (id) => {
        if (window.confirm('Are you sure you want to delete this dish?')) {
            try {
                await dishAPI.delete(id);
                fetchDishes();
            } catch (error) {
                // Error deleting dish
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        let finalCategory = formData.category;
        if (formData.customCategory) {
            finalCategory = formData.customCategory;
        }

        const payload = {
            ...formData,
            category: finalCategory,
            labels: formData.labels.join(','),
            userId: user.userId
        };

        try {
            if (editingDish) {
                await dishAPI.update(editingDish.id, payload);
            } else {
                await dishAPI.create(payload);
            }
            setShowModal(false);
            fetchDishes();
        } catch (error) {
            // Error saving dish
        }
    };

    const toggleLabel = (label) => {
        setFormData(prev => {
            const labels = prev.labels.includes(label)
                ? prev.labels.filter(l => l !== label)
                : [...prev.labels, label];
            return { ...prev, labels };
        });
    };

    const addCustomLabel = () => {
        if (formData.customLabel && !formData.labels.includes(formData.customLabel)) {
            setFormData(prev => ({
                ...prev,
                labels: [...prev.labels, prev.customLabel],
                customLabel: ''
            }));
            // Update available labels for the session
            if (!availableLabels.includes(formData.customLabel)) {
                setAvailableLabels(prev => [...prev, formData.customLabel]);
            }
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingImage(true);
        try {
            const result = await fileAPI.upload(file);
            setFormData(prev => ({ ...prev, imageUrl: result.url }));
        } catch (error) {
            alert('Failed to upload image: ' + error.message);
        } finally {
            setUploadingImage(false);
            e.target.value = ''; // Reset input
        }
    };

    const triggerImageUpload = () => {
        imageInputRef.current?.click();
    };

    return (
        <div className="p-8 text-white min-h-screen">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-extrabold flex items-center gap-2">
                    <UtensilsCrossed className="text-primary h-8 w-8" />
                    Dish Library
                </h1>
                <button
                    onClick={handleAddDish}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                >
                    <Plus className="h-5 w-5" />
                    Add Dish
                </button>
            </div>

            {/* Filters Section */}
            <div className="flex flex-col md:flex-row gap-4 mb-8 bg-card border border-border/50 p-6 rounded-2xl shadow-xl">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
                    <input
                        type="text"
                        placeholder="Search dishes..."
                        className="w-full bg-input/50 border border-border/50 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-4">
                    <select
                        className="bg-input/50 border border-border/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                        <option>All Categories</option>
                        {availableCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    <select
                        className="bg-input/50 border border-border/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer"
                        value={selectedLabel}
                        onChange={(e) => setSelectedLabel(e.target.value)}
                    >
                        <option>All Labels</option>
                        {availableLabels.map(label => <option key={label} value={label}>{label}</option>)}
                    </select>
                </div>
            </div>

            {/* Grid View */}
            {loading ? (
                <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-border/50">
                    <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading dishes...</p>
                </div>
            ) : filteredDishes.length === 0 ? (
                <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-border/50">
                    <UtensilsCrossed className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-20" />
                    <p className="text-muted-foreground italic text-lg">No dishes found matching your search</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredDishes.map((dish) => (
                        <div key={dish.id} className="group bg-card border border-border/50 rounded-2xl overflow-hidden hover:border-primary/50 transition-all shadow-xl hover:-translate-y-1">
                            {/* Image Section */}
                            <div className="relative h-48 bg-muted overflow-hidden">
                                {dish.imageUrl ? (
                                    <img
                                        src={dish.imageUrl.startsWith('http') ? dish.imageUrl : fileAPI.getImageUrl(dish.imageUrl)}
                                        alt={dish.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-800">
                                        <UtensilsCrossed className="h-12 w-12 text-slate-700" />
                                    </div>
                                )}
                                <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold shadow-lg backdrop-blur-md ${dish.type === 'Veg' ? 'bg-emerald-500/80 text-white' : 'bg-red-500/80 text-white'
                                    }`}>
                                    {dish.type === 'Veg' ? '🥬 Veg' : '🍖 Non-Veg'}
                                </div>
                            </div>

                            {/* Info Section */}
                            <div className="p-6 space-y-4">
                                <div>
                                    <h3 className="text-xl font-bold line-clamp-1">{dish.name}</h3>
                                    <p className="text-primary text-sm font-medium">{dish.category}</p>
                                </div>

                                <p className="text-muted-foreground text-sm line-clamp-2 min-h-[40px]">
                                    {dish.description || 'No description provided.'}
                                </p>

                                {/* Labels */}
                                <div className="flex flex-wrap gap-2">
                                    {(dish.labels ? dish.labels.split(',') : []).map((label, idx) => (
                                        <span key={idx} className="bg-muted px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                                            {label}
                                        </span>
                                    ))}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 pt-2 border-t border-border/30">
                                    <button
                                        onClick={() => handleEditDish(dish)}
                                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-800/50 hover:bg-slate-700 border border-border/50 rounded-lg text-sm transition-all"
                                    >
                                        <Pencil className="h-4 w-4" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteDish(dish.id)}
                                        className="p-2 border border-border/50 hover:bg-red-950/30 hover:border-red-500/50 rounded-lg text-red-500 transition-all"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-card border border-border/50 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="sticky top-0 bg-card p-6 border-b border-border/50 flex items-center justify-between z-10">
                            <h2 className="text-2xl font-bold">{editingDish ? 'Edit Dish' : 'Add New Dish'}</h2>
                            <button onClick={() => setShowModal(false)} className="p-2 rounded-full hover:bg-muted transition-colors">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            {/* Base Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Dish Name *</label>
                                    <input
                                        type="text"
                                        className="w-full bg-input border border-border/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        placeholder="e.g., Butter Chicken"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Category *</label>
                                    <div className="flex gap-2">
                                        <select
                                            className="flex-1 bg-input border border-border/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value, customCategory: '' })}
                                            required={!formData.customCategory}
                                        >
                                            <option value="">Select category</option>
                                            {availableCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex gap-2 mt-2">
                                        <input
                                            type="text"
                                            className="flex-1 bg-input border border-border/50 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                                            placeholder="Add custom category..."
                                            value={formData.customCategory}
                                            onChange={(e) => setFormData({ ...formData, customCategory: e.target.value, category: '' })}
                                        />
                                        <div className="bg-primary text-black p-2 rounded-lg flex items-center justify-center">
                                            <Plus className="h-4 w-4" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Dish Photo</label>
                                <input
                                    ref={imageInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    style={{ display: 'none' }}
                                />
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        className="flex-1 bg-input border border-border/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        placeholder="Paste image URL or upload..."
                                        value={formData.imageUrl}
                                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={triggerImageUpload}
                                        disabled={uploadingImage}
                                        className="px-4 py-3 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-xl transition-all flex items-center gap-2 disabled:opacity-50"
                                    >
                                        <Upload className="h-4 w-4" />
                                        {uploadingImage ? 'Uploading...' : 'Upload'}
                                    </button>
                                </div>
                                {formData.imageUrl && (
                                    <div className="mt-2 relative inline-block">
                                        <img 
                                            src={formData.imageUrl.startsWith('http') ? formData.imageUrl : fileAPI.getImageUrl(formData.imageUrl)}
                                            alt="Preview" 
                                            className="h-32 w-32 object-cover rounded-lg border-2 border-border/50"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, imageUrl: '' })}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Description / Ingredients</label>
                                <textarea
                                    className="w-full bg-input border border-border/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[100px]"
                                    placeholder="Describe the dish and list main ingredients..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            {/* Labels Selection */}
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-muted-foreground">Labels (Tap to select)</label>
                                <div className="flex flex-wrap gap-2">
                                    {availableLabels.map(label => (
                                        <button
                                            key={label}
                                            type="button"
                                            onClick={() => toggleLabel(label)}
                                            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all border ${formData.labels.includes(label)
                                                    ? 'bg-primary border-primary text-black shadow-lg shadow-primary/20'
                                                    : 'bg-muted border-border/50 text-muted-foreground hover:border-slate-500'
                                                }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex gap-2 max-w-xs">
                                    <input
                                        type="text"
                                        className="flex-1 bg-input border border-border/50 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        placeholder="Add custom label..."
                                        value={formData.customLabel}
                                        onChange={(e) => setFormData({ ...formData, customLabel: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={addCustomLabel}
                                        className="bg-slate-800 p-2 rounded-lg hover:bg-slate-700 transition-colors"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Type Selection */}
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-muted-foreground">Type</label>
                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: 'Veg' })}
                                        className={`flex-1 py-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${formData.type === 'Veg'
                                                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500 shadow-lg shadow-emerald-500/10'
                                                : 'bg-muted border-border/50 text-muted-foreground grayscale hover:grayscale-0'
                                            }`}
                                    >
                                        <span className="text-xl">🥬</span> Veg
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: 'Non-Veg' })}
                                        className={`flex-1 py-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${formData.type === 'Non-Veg'
                                                ? 'bg-red-500/10 border-red-500 text-red-500 shadow-lg shadow-red-500/10'
                                                : 'bg-muted border-border/50 text-muted-foreground grayscale hover:grayscale-0'
                                            }`}
                                    >
                                        <span className="text-xl">🍖</span> Non-Veg
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-primary text-black font-extrabold py-4 rounded-xl text-lg hover:bg-primary/90 hover:scale-[1.01] active:scale-[0.99] transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
                            >
                                <Check className="h-5 w-5" />
                                Save Dish
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DishLibrary;
