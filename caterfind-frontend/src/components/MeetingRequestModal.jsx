import React, { useState } from 'react';
import { X, Calendar, Users, MapPin, MessageCircle } from 'lucide-react';

/**
 * Meeting Request Modal - Client Side
 * Allows clients to send meeting/event requests to caterers
 */
const MeetingRequestModal = ({ isOpen, onClose, catererName, catererId }) => {
    const [formData, setFormData] = useState({
        date: '',
        guests: '',
        location: '',
        eventType: '',
        message: '',
    });
    const [submitting, setSubmitting] = useState(false);

    const eventTypes = [
        'Wedding',
        'Birthday Party',
        'Corporate Event',
        'Engagement',
        'Anniversary',
        'Baby Shower',
        'Housewarming',
        'Other',
    ];

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            // TODO: API call to submit meeting request
            console.log('Meeting request:', { ...formData, catererId });
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Show success message
            alert('Meeting request sent successfully!');
            onClose();
            
            // Reset form
            setFormData({
                date: '',
                guests: '',
                location: '',
                eventType: '',
                message: '',
            });
        } catch (error) {
            console.error('Error submitting request:', error);
            alert('Failed to send request. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-card rounded-xl border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div>
                        <h2 className="text-2xl font-bold text-foreground">Fix Meeting</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Send a request to {catererName}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                    >
                        <X size={24} className="text-muted-foreground" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Event Date */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                            <Calendar size={16} />
                            Event Date *
                        </label>
                        <input
                            type="date"
                            required
                            value={formData.date}
                            onChange={(e) => handleChange('date', e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>

                    {/* Number of Guests */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                            <Users size={16} />
                            Number of Guests *
                        </label>
                        <input
                            type="number"
                            required
                            min="1"
                            placeholder="e.g., 100"
                            value={formData.guests}
                            onChange={(e) => handleChange('guests', e.target.value)}
                            className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>

                    {/* Location */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                            <MapPin size={16} />
                            Event Location *
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="e.g., Janakpuri, Delhi"
                            value={formData.location}
                            onChange={(e) => handleChange('location', e.target.value)}
                            className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>

                    {/* Event Type */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                            Event Type *
                        </label>
                        <select
                            required
                            value={formData.eventType}
                            onChange={(e) => handleChange('eventType', e.target.value)}
                            className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                            <option value="">Select event type</option>
                            {eventTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>

                    {/* Message */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                            <MessageCircle size={16} />
                            Additional Message (Optional)
                        </label>
                        <textarea
                            rows="4"
                            placeholder="Any special requirements or preferences..."
                            value={formData.message}
                            onChange={(e) => handleChange('message', e.target.value)}
                            className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="flex-1 px-6 py-3 bg-card border border-border hover:bg-secondary text-foreground rounded-lg transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'Sending...' : 'Send Request'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MeetingRequestModal;
