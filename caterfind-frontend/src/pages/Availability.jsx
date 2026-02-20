import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X, AlertCircle } from 'lucide-react';
import { calendarAPI, availabilityAPI } from '../services/api';


/**
 * Availability Page
 * 
 * Allows caterers to manage their availability on a calendar.
 * - Displays a monthly calendar view.
 * - Allows toggling dates between Available, Busy, and Neutral.
 * - Side panel for adding calendar events.
 * - Prevents modifications to past dates.
 * - Events older than 30 days are automatically cleaned up.
 */
const Availability = ({ user }) => {
    // Current date for calendar navigation
    const [currentDate, setCurrentDate] = useState(new Date());
    
    // State to store status of dates. Format: "YYYY-MM-DD": "available" | "busy"
    const [availabilityMap, setAvailabilityMap] = useState({});
    
    // Selected date (for visual focus and event form)
    const [selectedDate, setSelectedDate] = useState(null);
    
    // Events data
    const [events, setEvents] = useState([]);
    const [eventsForSelectedDate, setEventsForSelectedDate] = useState([]);
    
    // Form state
    const [formData, setFormData] = useState({
        eventHostName: '',
        managedBy: '',
        location: ''
    });
    
    // UI state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const catererId = user?.userId || user?.id;

    // Load events and availability on mount
    useEffect(() => {
        if (catererId) {
            loadEvents();
            loadAvailabilityForMonth(currentDate);
        }
    }, [catererId]);

    useEffect(() => {
        if (catererId) {
            loadAvailabilityForMonth(currentDate);
        }
    }, [catererId, currentDate]);

    // Update events for selected date when date changes or events change
    useEffect(() => {
        if (selectedDate) {
            const dateKey = formatDateKey(selectedDate.getDate(), selectedDate.getMonth(), selectedDate.getFullYear());
            const eventsOnDate = events.filter(e => e.eventDate === dateKey);
            setEventsForSelectedDate(eventsOnDate);
        }
    }, [selectedDate, events]);

    const loadEvents = async () => {
        try {
            const data = await calendarAPI.getAll(catererId);
            setEvents(data);
        } catch (error) {
            console.error('Failed to load events', error);
        }
    };

    const loadAvailabilityForMonth = async (date) => {
        try {
            const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
            const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
            const startKey = formatDateKey(startDate.getDate(), startDate.getMonth(), startDate.getFullYear());
            const endKey = formatDateKey(endDate.getDate(), endDate.getMonth(), endDate.getFullYear());

            const data = await availabilityAPI.getByRange(catererId, startKey, endKey);
            const map = data.reduce((acc, item) => {
                acc[item.date] = item.status;
                return acc;
            }, {});
            setAvailabilityMap(map);
        } catch (error) {
            console.error('Failed to load availability', error);
        }
    };

    // Calendar helpers
    const daysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const goToPrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const generateCalendarDays = () => {
        const days = [];
        const totalDays = daysInMonth(currentDate);
        const startDay = firstDayOfMonth(currentDate);

        // Padding for previous month
        for (let i = 0; i < startDay; i++) {
            days.push(null);
        }

        // Days of current month
        for (let i = 1; i <= totalDays; i++) {
            days.push(i);
        }

        return days;
    };

    const formatDateKey = (day, month, year) => {
        if (!day) return null;
        const y = year || currentDate.getFullYear();
        const m = String((month !== undefined ? month : currentDate.getMonth()) + 1).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const isPastDate = (day) => {
        if (!day) return false;
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);
        return date < today;
    };

    const handleDateClick = (day) => {
        if (!day) return;
        
        // Prevent clicking on past dates
        if (isPastDate(day)) {
            setError('Cannot add events to past dates');
            setTimeout(() => setError(''), 3000);
            return;
        }

        const key = formatDateKey(day);
        const currentStatus = availabilityMap[key];
        const nextStatus = !currentStatus ? 'available' : (currentStatus === 'available' ? 'busy' : null);

        // Update selected date
        const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        setSelectedDate(clickedDate);

        // Toggle availability status: Neutral -> Available -> Busy -> Neutral
        setAvailabilityMap(prev => {
            const newMap = { ...prev };
            if (!nextStatus) {
                delete newMap[key];
            } else {
                newMap[key] = nextStatus;
            }
            return newMap;
        });

        // Persist availability to backend
        availabilityAPI.setStatus(catererId, { date: key, status: nextStatus })
            .catch((error) => {
                // Revert on error
                setAvailabilityMap(prev => {
                    const newMap = { ...prev };
                    if (!currentStatus) {
                        delete newMap[key];
                    } else {
                        newMap[key] = currentStatus;
                    }
                    return newMap;
                });
                setError(error.message || 'Failed to update availability');
                setTimeout(() => setError(''), 3000);
            });

        // Reset form
        setFormData({
            eventHostName: '',
            managedBy: '',
            location: ''
        });
        setError('');
        setSuccess('');
    };

    const getDayClass = (day) => {
        if (!day) return "invisible";
        const key = formatDateKey(day);
        const status = availabilityMap[key];
        const isSelected = selectedDate &&
            selectedDate.getDate() === day &&
            selectedDate.getMonth() === currentDate.getMonth() &&
            selectedDate.getFullYear() === currentDate.getFullYear();
        const past = isPastDate(day);
        const hasEvent = events.some(e => e.eventDate === key);

        let baseClass = "h-10 w-10 flex items-center justify-center rounded-lg text-sm transition-colors relative";

        if (past) {
            baseClass += " bg-slate-900/30 text-slate-600 cursor-not-allowed opacity-50";
        } else {
            baseClass += " cursor-pointer";
            if (status === 'available') {
                baseClass += " bg-emerald-800 text-emerald-100 hover:bg-emerald-700";
            } else if (status === 'busy') {
                baseClass += " bg-red-900/50 text-red-100 hover:bg-red-800/50";
            } else {
                baseClass += " bg-slate-800 text-slate-200 hover:bg-slate-700";
            }
        }

        if (isSelected && !past) {
            baseClass += " ring-2 ring-amber-400";
        }

        return baseClass;
    };

    const hasEventIndicator = (day) => {
        if (!day) return false;
        const key = formatDateKey(day);
        return events.some(e => e.eventDate === key);
    };

    const handleFormChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveEvent = async () => {
        // Validate
        if (!formData.eventHostName.trim()) {
            setError('Event host name is required');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const eventData = {
                eventDate: formatDateKey(selectedDate.getDate(), selectedDate.getMonth(), selectedDate.getFullYear()),
                eventHostName: formData.eventHostName.trim(),
                managedBy: formData.managedBy.trim() || null,
                location: formData.location.trim() || null
            };

            await calendarAPI.create(catererId, eventData);
            
            // Reload events
            await loadEvents();
            
            // Reset form
            setFormData({
                eventHostName: '',
                managedBy: '',
                location: ''
            });
            
            setSuccess('Event added successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            setError(error.message || 'Failed to create event');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteEvent = async (eventId) => {
        if (!confirm('Delete this event?')) return;
        
        try {
            await calendarAPI.delete(eventId);
            await loadEvents();
            setSuccess('Event deleted');
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            setError('Failed to delete event');
        }
    };

    const closePanel = () => {
        setSelectedDate(null);
        setFormData({
            eventHostName: '',
            managedBy: '',
            location: ''
        });
        setError('');
        setSuccess('');
    };

    return (
        <div className="p-8 text-white min-h-screen bg-transparent">
            <div className="mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <span className="text-amber-500"><CalendarIcon className="h-6 w-6" /></span> Availability Calendar
                </h1>
                <p className="text-slate-400 mt-1">Tap dates to mark as busy or available, and add events</p>
            </div>

            {/* Side-by-side layout */}
            <div className="flex gap-8 items-start">
                {/* Left side - Calendar */}
                <div className="flex-shrink-0 bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-sm" style={{ width: '500px' }}>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <button
                            onClick={goToPrevMonth}
                            className="p-2 hover:bg-slate-800 rounded-full transition-colors"
                            title="Previous Month"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <h2 className="text-lg font-semibold min-w-[150px] text-center">
                            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </h2>
                        <button
                            onClick={goToNextMonth}
                            className="p-2 hover:bg-slate-800 rounded-full transition-colors"
                            title="Next Month"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Days of Week */}
                    <div className="grid grid-cols-7 gap-2 mb-2 text-center">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                            <div key={day} className="text-xs text-slate-500 font-medium">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-2">
                        {generateCalendarDays().map((day, index) => (
                            <div
                                key={index}
                                className="flex justify-center"
                            >
                                {day ? (
                                    <button
                                        onClick={() => handleDateClick(day)}
                                        className={getDayClass(day)}
                                        disabled={isPastDate(day)}
                                    >
                                        {day}
                                        {hasEventIndicator(day) && (
                                            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-400"></div>
                                        )}
                                    </button>
                                ) : (
                                    <div className="h-10 w-10" />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Legend */}
                    <div className="flex items-center justify-center gap-6 mt-8">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                            <span className="text-sm text-slate-300">Available</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <span className="text-sm text-slate-300">Busy</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                            <span className="text-sm text-slate-300">Has Event</span>
                        </div>
                    </div>
                </div>

                {/* Right side - Event Form */}
                <div className="flex-1">
                    {selectedDate ? (
                        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-sm">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-amber-400">Add Event to Calendar</h2>
                                <button
                                    onClick={closePanel}
                                    className="p-2 hover:bg-slate-800 rounded-full transition-colors"
                                    title="Close"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Selected Date Display */}
                            <div className="mb-6 p-4 bg-slate-800/50 rounded-lg">
                                <p className="text-sm text-slate-400 mb-1">Selected Date</p>
                                <p className="text-lg font-semibold">
                                    {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>

                            {/* Error/Success Messages */}
                            {error && (
                                <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg flex items-start gap-2 text-red-200">
                                    <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                    <span className="text-sm">{error}</span>
                                </div>
                            )}
                            {success && (
                                <div className="mb-4 p-3 bg-green-900/30 border border-green-500/50 rounded-lg text-green-200 text-sm">
                                    {success}
                                </div>
                            )}

                            {/* Form */}
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Event Host Name <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.eventHostName}
                                        onChange={(e) => handleFormChange('eventHostName', e.target.value)}
                                        placeholder="e.g., John's Wedding"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Managed By <span className="text-slate-500 text-xs">(Optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.managedBy}
                                        onChange={(e) => handleFormChange('managedBy', e.target.value)}
                                        placeholder="e.g., Sarah Johnson"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Location <span className="text-slate-500 text-xs">(Optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.location}
                                        onChange={(e) => handleFormChange('location', e.target.value)}
                                        placeholder="e.g., Grand Hotel, Mumbai"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
                                    />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={handleSaveEvent}
                                    disabled={loading}
                                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-semibold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Saving...' : 'Save Event'}
                                </button>
                                <button
                                    onClick={closePanel}
                                    className="px-6 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2.5 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>

                            {/* Existing Events for Selected Date */}
                            {eventsForSelectedDate.length > 0 && (
                                <div className="mt-6 pt-6 border-t border-slate-700">
                                    <h3 className="text-sm font-semibold text-slate-400 mb-3">Events on this date:</h3>
                                    <div className="space-y-2">
                                        {eventsForSelectedDate.map(event => (
                                            <div key={event.id} className="p-3 bg-slate-800 rounded-lg flex justify-between items-start">
                                                <div>
                                                    <p className="font-medium text-white">{event.eventHostName}</p>
                                                    {event.managedBy && <p className="text-sm text-slate-400">Managed by: {event.managedBy}</p>}
                                                    {event.location && <p className="text-sm text-slate-400">Location: {event.location}</p>}
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteEvent(event.id)}
                                                    className="text-red-400 hover:text-red-300 text-sm"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-slate-900/30 p-12 rounded-2xl border border-slate-800 border-dashed flex flex-col items-center justify-center text-center min-h-[400px]">
                            <CalendarIcon className="h-16 w-16 text-slate-600 mb-4" />
                            <p className="text-slate-500 text-lg">Select a date to add an event</p>
                            <p className="text-slate-600 text-sm mt-2">Click on any future date in the calendar</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Availability;
