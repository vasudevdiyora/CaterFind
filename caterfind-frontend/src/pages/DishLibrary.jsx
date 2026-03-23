import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, Plus, Pencil, Trash2, X, Check, Utensils, Info, Upload, UtensilsCrossed } from 'lucide-react';
import Modal from '../components/Modal';
import { dishAPI, fileAPI } from '../services/api';
import { useDialog } from '../components/DialogProvider';
import '../styles/Table.css';
import '../styles/Contacts.css'; // Re-using filter pills

/**
 * Dish Library Page Component (Dense Light Theme)
 */
function DishLibrary({ user }) {
    const { showConfirm } = useDialog();
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
        const shouldDelete = await showConfirm('Are you sure you want to delete this dish?', {
            title: 'Delete Dish',
            confirmText: 'Delete'
        });

        if (!shouldDelete) return;

        try {
            await dishAPI.delete(id);
            fetchDishes();
        } catch (error) {
            // Error deleting dish
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
            const exists = prev.labels.includes(label);
            return {
                ...prev,
                labels: exists
                    ? prev.labels.filter(l => l !== label)
                    : [...prev.labels, label]
            };
        });
    };

    const addCustomLabel = () => {
        const raw = (formData.customLabel || '').trim();
        if (!raw) return;

        const labelToAdd = raw;

        const existsInDish = formData.labels.some(
            l => l.trim().toLowerCase() === labelToAdd.toLowerCase()
        );
        const existsInOptions = availableLabels.some(
            l => l.trim().toLowerCase() === labelToAdd.toLowerCase()
        );

        setFormData(prev => ({
            ...prev,
            labels: existsInDish ? prev.labels : [...prev.labels, labelToAdd],
            customLabel: ''
        }));

        if (!existsInOptions) {
            setAvailableLabels(prev => [...prev, labelToAdd]);
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
        <div className="page-shell">
            <div className="contacts-header">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                        <Utensils className="w-6 h-6" />
                        Dish Library
                    </h1>
                    <button className="primary-button" onClick={handleAddDish}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Dish
                    </button>
                </div>
                <div className="mt-4 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search dishes by name or description..."
                            className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg w-full focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-4">
                        <select
                            className="form-select"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            <option>All Categories</option>
                            {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <select
                            className="form-select"
                            value={selectedLabel}
                            onChange={(e) => setSelectedLabel(e.target.value)}
                        >
                            <option>All Labels</option>
                            {availableLabels.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="mt-6">
                {loading ? (
                    <div className="text-center p-8">Loading dishes...</div>
                ) : filteredDishes.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {filteredDishes.map(dish => (
                            <div key={dish.id} className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
                                    <div className="h-40 w-full bg-slate-100 overflow-hidden">
                                    <img src={fileAPI.getImageUrl(dish.imageUrl) || 'https://via.placeholder.com/400x300'} alt={dish.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="p-4 flex-1 flex flex-col">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-slate-800 truncate">{dish.name}</div>
                                            <div className="text-sm text-slate-500 truncate">{dish.description}</div>
                                        </div>
                                        <div className="ml-2 text-right">
                                            <div className={`text-sm font-semibold ${dish.type === 'Veg' ? 'text-green-600' : 'text-red-600'}`}>{dish.type}</div>
                                            <div className="text-xs text-slate-400">{dish.category}</div>
                                        </div>
                                    </div>

                                    <div className="mt-3 flex-1">
                                        <div className="flex flex-wrap gap-2">
                                            {dish.labels ? dish.labels.split(',').map(label => (
                                                <span key={label} className="label-tag">{label}</span>
                                            )) : <span className="text-slate-500 text-sm italic">No labels</span>}
                                        </div>
                                    </div>

                                    <div className="mt-4 flex items-center justify-end gap-2">
                                        <button className="table-icon-button" onClick={() => handleEditDish(dish)}>
                                            <Pencil size={16} />
                                        </button>
                                        <button className="table-icon-button danger" onClick={() => handleDeleteDish(dish.id)}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center p-8">
                        <div className="flex flex-col items-center gap-2 text-slate-500">
                            <UtensilsCrossed className="w-10 h-10" />
                            <span className="font-semibold">No Dishes Found</span>
                            <span>Clear filters or add a new dish to get started.</span>
                        </div>
                    </div>
                )}
            </div>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingDish ? 'Edit Dish' : 'Add New Dish'} className="">
                <form className="item-form" onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="md:col-span-1">
                                    <label>Dish Image</label>
                                    <div
                                        className="mt-1 w-full h-40 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400 bg-slate-50/50 hover:border-sky-500 hover:bg-sky-50 transition-colors cursor-pointer"
                                        onClick={triggerImageUpload}
                                    >
                                        {uploadingImage ? (
                                            <span>Uploading...</span>
                                        ) : formData.imageUrl ? (
                                            <img src={fileAPI.getImageUrl(formData.imageUrl)} alt="Dish" className="w-full h-full object-cover rounded-lg" />
                                        ) : (
                                            <div className="text-center">
                                                <Upload className="mx-auto h-8 w-8" />
                                                <span>Click to upload</span>
                                            </div>
                                        )}
                                    </div>
                                    <input type="file" ref={imageInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                                </div>
                                <div className="md:col-span-2 space-y-4">
                                    <div className="form-group">
                                        <label>Dish Name</label>
                                        <input type="text" className="form-input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Description</label>
                                        <textarea className="form-input" rows="3" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}></textarea>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div className="form-group">
                                    <label>Category</label>
                                    <select className="form-select" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value, customCategory: '' })}>
                                        <option value="">Select a category</option>
                                        {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                        <option value="custom">-- Add New Category --</option>
                                    </select>
                                    {formData.category === 'custom' && (
                                        <input type="text" placeholder="Enter new category name" className="form-input mt-2" value={formData.customCategory} onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })} />
                                    )}
                                </div>
                                <div className="form-group">
                                    <label>Type</label>
                                    <select className="form-select" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                                        <option value="Veg">Veg</option>
                                        <option value="Non-Veg">Non-Veg</option>
                                        <option value="Jain">Jain</option>
                                        <option value="Swaminarayan">Swaminarayan</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group mt-4">
                                <label>Labels</label>
                                <div className="flex flex-wrap gap-2 p-2 border border-slate-200 rounded-lg bg-slate-50/50">
                                    {availableLabels.map(label => (
                                        <div
                                            key={label}
                                            className={`label-checkbox ${formData.labels.includes(label) ? 'selected' : ''}`}
                                            onClick={() => toggleLabel(label)}
                                        >
                                            {label}
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-2 flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Add a new label"
                                        className="form-input flex-grow"
                                        value={formData.customLabel}
                                        onChange={(e) => setFormData({ ...formData, customLabel: e.target.value })}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addCustomLabel();
                                            }
                                        }}
                                    />
                                    <button type="button" className="secondary-button" onClick={addCustomLabel}>Add</button>
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="cancel-button" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="submit-button">{editingDish ? 'Save Changes' : 'Create Dish'}</button>
                            </div>
                </form>
            </Modal>
        </div>
    );
}

export default DishLibrary;
