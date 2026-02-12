import React, { useState, useEffect } from 'react';
import '../styles/MyBusiness.css';

/**
 * My Business Page Component (Loveable Design)
 * 
 * Comprehensive business profile management with:
 * - Basic Information (name, description)
 * - Contact Details (phones, email)
 * - Address (street, area, city, landmark)
 * - Service Area (radius in km)
 * - Photos & Media upload
 */
function MyBusiness({ user }) {
    const [formData, setFormData] = useState({
        businessName: '',
        description: '',
        primaryPhone: '',
        alternatePhone: '',
        email: '',
        streetAddress: '',
        area: '',
        city: '',
        landmark: '',
        serviceRadius: 50
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadBusinessProfile();
    }, []);

    const loadBusinessProfile = async () => {
        try {
            // In production, fetch from backend API
            // For now, use mock data or user's catering profile
            setFormData({
                businessName: 'Sharma Catering Services',
                description: 'Authentic North Indian cuisine with 25+ years of experience. Specializing in traditional wedding feasts.',
                primaryPhone: '+91 98765 43210',
                alternatePhone: '+91 98765 43211',
                email: 'sharma@catering.com',
                streetAddress: '45, Lajpat Nagar',
                area: 'Lajpat Nagar Market',
                city: 'New Delhi',
                landmark: 'Near Central Market',
                serviceRadius: 50
            });
        } catch (error) {
            console.error('Failed to load business profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            // In production, save to backend API
            console.log('Saving business profile:', formData);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
            alert('Business profile updated successfully!');
        } catch (error) {
            console.error('Failed to save business profile:', error);
            alert('Failed to save changes. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handlePhotoUpload = () => {
        alert('Photo upload functionality - In production, this would open a file picker');
    };

    const handleVideoUpload = () => {
        alert('Video upload functionality - In production, this would open a file picker');
    };

    if (loading) {
        return (
            <div className="business-container">
                <div className="loading-state">Loading business profile...</div>
            </div>
        );
    }

    return (
        <div className="business-container">
            <div className="business-header">
                <h1 className="business-title">👤 Business Profile</h1>
            </div>

            <form className="business-form" onSubmit={handleSave}>
                {/* Basic Information */}
                <div className="form-section">
                    <h2 className="section-heading">Basic Information</h2>

                    <div className="form-field">
                        <label className="field-label">Business Name</label>
                        <input
                            type="text"
                            className="field-input"
                            value={formData.businessName}
                            onChange={(e) => handleChange('businessName', e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-field">
                        <label className="field-label">Description</label>
                        <textarea
                            className="field-textarea"
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            rows={4}
                            placeholder="Describe your catering services..."
                        />
                    </div>
                </div>

                {/* Contact Details */}
                <div className="form-section">
                    <h2 className="section-heading">📞 Contact Details</h2>

                    <div className="form-row">
                        <div className="form-field">
                            <label className="field-label">Primary Phone</label>
                            <div className="input-with-icon">
                                <span className="input-icon">📞</span>
                                <input
                                    type="tel"
                                    className="field-input with-icon"
                                    value={formData.primaryPhone}
                                    onChange={(e) => handleChange('primaryPhone', e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-field">
                            <label className="field-label">Alternate Phone</label>
                            <div className="input-with-icon">
                                <span className="input-icon">📞</span>
                                <input
                                    type="tel"
                                    className="field-input with-icon"
                                    value={formData.alternatePhone}
                                    onChange={(e) => handleChange('alternatePhone', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-field">
                        <label className="field-label">Email</label>
                        <div className="input-with-icon">
                            <span className="input-icon">📧</span>
                            <input
                                type="email"
                                className="field-input with-icon"
                                value={formData.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Address */}
                <div className="form-section">
                    <h2 className="section-heading">📍 Address</h2>

                    <div className="form-field">
                        <label className="field-label">Street Address</label>
                        <input
                            type="text"
                            className="field-input"
                            value={formData.streetAddress}
                            onChange={(e) => handleChange('streetAddress', e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-field">
                            <label className="field-label">Area / Locality</label>
                            <input
                                type="text"
                                className="field-input"
                                value={formData.area}
                                onChange={(e) => handleChange('area', e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-field">
                            <label className="field-label">City</label>
                            <input
                                type="text"
                                className="field-input"
                                value={formData.city}
                                onChange={(e) => handleChange('city', e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-field">
                        <label className="field-label">Landmark (Optional)</label>
                        <input
                            type="text"
                            className="field-input"
                            value={formData.landmark}
                            onChange={(e) => handleChange('landmark', e.target.value)}
                            placeholder="e.g., Near Central Market"
                        />
                    </div>
                </div>

                {/* Service Area */}
                <div className="form-section">
                    <h2 className="section-heading">✈️ Service Area</h2>

                    <div className="form-field">
                        <label className="field-label">Service Radius (in km)</label>
                        <div className="radius-input-group">
                            <input
                                type="number"
                                className="field-input radius-input"
                                value={formData.serviceRadius}
                                onChange={(e) => handleChange('serviceRadius', parseInt(e.target.value))}
                                min="1"
                                max="500"
                                required
                            />
                            <span className="radius-hint">kilometers from your location</span>
                        </div>
                    </div>
                </div>

                {/* Photos & Media */}
                <div className="form-section">
                    <h2 className="section-heading">📸 Photos & Media</h2>

                    <div className="form-field">
                        <label className="field-label">Business Photos</label>
                        <button
                            type="button"
                            className="upload-button"
                            onClick={handlePhotoUpload}
                        >
                            <span className="upload-icon">⬆️</span>
                            Upload Photos
                        </button>
                        <p className="field-hint">Upload photos of your kitchen, dishes, and events</p>
                    </div>

                    <div className="form-field">
                        <label className="field-label">Videos (Optional)</label>
                        <button
                            type="button"
                            className="upload-button"
                            onClick={handleVideoUpload}
                        >
                            <span className="upload-icon">⬆️</span>
                            Upload Videos
                        </button>
                        <p className="field-hint">Showcase your catering services with videos</p>
                    </div>
                </div>

                {/* Save Button */}
                <div className="form-actions">
                    <button
                        type="submit"
                        className="save-button"
                        disabled={saving}
                    >
                        <span className="save-icon">💾</span>
                        {saving ? 'Saving Changes...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default MyBusiness;
