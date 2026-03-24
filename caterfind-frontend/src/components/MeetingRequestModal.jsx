import React, { useState } from 'react';
import { Calendar, Users, MapPin, MessageCircle } from 'lucide-react';
import Modal from './Modal';
import { meetingRequestAPI } from '../services/api';

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
    const [error, setError] = useState('');

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
        setError(''); // Clear error on input change
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            // Prepare request data
            const requestData = {
                catererId: catererId,
                eventDate: formData.date,
                numberOfGuests: parseInt(formData.guests),
                eventLocation: formData.location,
                eventType: formData.eventType,
                message: formData.message || null
            };

            await meetingRequestAPI.create(requestData);
            
            // Show success message
            alert(`Meeting request sent successfully to ${catererName}!`);
            
            // Reset form and close modal
            setFormData({
                date: '',
                guests: '',
                location: '',
                eventType: '',
                message: '',
            });
            onClose();
        } catch (error) {
            console.error('Error submitting request:', error);
            setError(error.message || 'Failed to send request. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={<div><h2 className="text-2xl font-bold text-foreground">Request Meeting</h2><p className="text-sm text-muted-foreground mt-1">Send a request to {catererName}</p></div>} className="max-w-2xl">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500 rounded-lg p-3">
                            <p className="text-sm text-red-500">{error}</p>
                        </div>
                    )}

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
                            Approx Number of Guest *
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
                            className="secondary-button flex-1"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="primary-button flex-1"
                        >
                            {submitting ? 'Sending...' : 'Send Request'}
                        </button>
                    </div>
                </form>
        </Modal>
    );
};

export default MeetingRequestModal;
