import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X, AlertCircle, Trash2 } from 'lucide-react';
import { calendarAPI, availabilityAPI } from '../services/api';
import { useDialog } from '../components/DialogProvider';


/**
 * Availability Page
 * 
 * Allows caterers to manage their availability on a calendar.
 * - Displays a monthly calendar view.
 * - Allows explicitly setting dates to Available, Busy, or Neutral (future dates only).
 * - Side panel for viewing/adding calendar events.
 * - Can view events from past 30 days (read-only).
 * - Can add/modify events for future dates only.
 * - Events older than 30 days are automatically cleaned up.
 */
const Availability = ({ user }) => {
    const { showConfirm } = useDialog();
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

    // Refresh events & availability when menus change elsewhere (e.g., menu deleted)
    useEffect(() => {
        const onMenusUpdated = () => {
            if (!catererId) return;
            loadEvents();
            loadAvailabilityForMonth(currentDate);
        };

        window.addEventListener('menusUpdated', onMenusUpdated);
        return () => window.removeEventListener('menusUpdated', onMenusUpdated);
    }, [catererId, currentDate]);

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

    const isViewableDate = (day) => {
        if (!day) return false;
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);
        
        // Allow viewing dates from last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        thirtyDaysAgo.setHours(0, 0, 0, 0);
        
        return date >= thirtyDaysAgo;
    };

    const canAddEvent = (day) => {
        // Only allow adding events to future dates
        return !isPastDate(day);
    };

    const handleDateClick = (day) => {
        if (!day) return;
        
        // Only allow viewing dates from last 30 days, or future dates
        if (!isViewableDate(day)) {
            setError('Only past 30 days and future dates are available for viewing');
            setTimeout(() => setError(''), 3000);
            return;
        }

        // Update selected date
        const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        setSelectedDate(clickedDate);

        // Reset form
        setFormData({
            eventHostName: '',
            managedBy: '',
            location: ''
        });
        setError('');
        setSuccess('');
    };

    const updateAvailabilityStatus = async (status) => {
        if (!selectedDate || !canAddEvent(selectedDate.getDate())) return;

        const key = formatDateKey(selectedDate.getDate(), selectedDate.getMonth(), selectedDate.getFullYear());
        const currentStatus = availabilityMap[key];

        setAvailabilityMap(prev => {
            const newMap = { ...prev };
            if (!status) {
                delete newMap[key];
            } else {
                newMap[key] = status;
            }
            return newMap;
        });

        try {
            await availabilityAPI.setStatus(catererId, { date: key, status });
            setSuccess(status ? `Date marked as ${status}` : 'Availability cleared for selected date');
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
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
        }
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
        const viewable = isViewableDate(day);
        const editable = canAddEvent(day);

        let baseClass = "h-10 w-10 flex items-center justify-center rounded-lg text-sm transition-colors relative font-medium";

        if (!viewable) {
            // Dates outside the last 30 days (and past)
            baseClass += " bg-slate-50 text-slate-300 cursor-not-allowed opacity-50";
        } else if (past && !editable) {
            // Past dates within last 30 days - viewable but not editable
            baseClass += " cursor-pointer bg-slate-100 text-slate-400 hover:bg-slate-200";
        } else {
            // Future dates or today
            baseClass += " cursor-pointer";
            if (status === 'available') {
                baseClass += " bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200";
            } else if (status === 'busy') {
                baseClass += " bg-red-100 text-red-800 border border-red-200 hover:bg-red-200";
            } else {
                baseClass += " bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300";
            }
        }

        if (isSelected && viewable) {
            baseClass += " ring-2 ring-sky-500 ring-offset-2";
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
        const shouldDelete = await showConfirm('Delete this event?', {
            title: 'Delete Event',
            confirmText: 'Delete'
        });

        if (!shouldDelete) return;
        
        try {
            await calendarAPI.delete(eventId);
            await loadEvents();
            setSuccess('Event deleted');
            setTimeout(() => setSuccess(''), 3000);
        } catch {
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
        <div className="page-shell space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-slate-900">
                        <span className="text-sky-600"><CalendarIcon className="h-6 w-6" /></span> Availability Calendar
                    </h1>
                    <p className="text-sm sm:text-base text-slate-600 mt-1">Select a date to manage availability or add events</p>
                </div>
            </div>

            {/* Side-by-side layout */}
            <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">
                {/* Left side - Calendar */}
                <div className="surface-card p-6 bg-white border border-slate-200 shadow-sm relative z-0">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <button
                            onClick={goToPrevMonth}
                            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
                            title="Previous Month"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <h2 className="text-lg font-bold min-w-[150px] text-center text-slate-900">
                            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </h2>
                        <button
                            onClick={goToNextMonth}
                            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
                            title="Next Month"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Days of Week */}
                    <div className="grid grid-cols-7 gap-2 mb-2 text-center">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                            <div key={day} className="text-xs text-slate-400 font-semibold tracking-wider">
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
                                        disabled={!isViewableDate(day)}
                                    >
                                        {day}
                                        {hasEventIndicator(day) && (
                                            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-500"></div>
                                        )}
                                    </button>
                                ) : (
                                    <div className="h-10 w-10" />
                                )}
                            </div>
                        ))}
                    </div>

                    {selectedDate && canAddEvent(selectedDate.getDate()) && (
                        <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                            <h4 className="text-sm font-semibold text-slate-700 mb-3">Set Availability Status</h4>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => updateAvailabilityStatus('available')}
                                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors border ${
                                        availabilityMap[formatDateKey(selectedDate.getDate(), selectedDate.getMonth(), selectedDate.getFullYear())] === 'available'
                                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200 ring-1 ring-emerald-500' 
                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'
                                    }`}
                                >
                                    Available
                                </button>
                                <button
                                    onClick={() => updateAvailabilityStatus('busy')}
                                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors border ${
                                        availabilityMap[formatDateKey(selectedDate.getDate(), selectedDate.getMonth(), selectedDate.getFullYear())] === 'busy'
                                            ? 'bg-red-100 text-red-800 border-red-200 ring-1 ring-red-500' 
                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200'
                                    }`}
                                >
                                    Busy
                                </button>
                                <button
                                    onClick={() => updateAvailabilityStatus(null)}
                                    className="px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Legend */}
                    <div className="flex flex-col gap-4 mt-8 pt-6 border-t border-slate-100">
                        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                <span className="text-sm text-slate-600">Available</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <span className="text-sm text-slate-600">Busy</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                <span className="text-sm text-slate-600">Has Event</span>
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-slate-400">📅 View past 30 days • ✏️ Edit future dates</p>
                        </div>
                    </div>
                </div>

                {/* Right side - Event Form */}
                <div className="flex-1">
                    {selectedDate ? (
                        <div className="surface-card p-6 bg-white border border-slate-200 shadow-sm relative sticky top-6">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                                <h2 className="text-xl font-bold text-slate-900">
                                    {canAddEvent(selectedDate.getDate()) ? 'Add Event' : 'Event Details'}
                                </h2>
                                <button
                                    onClick={closePanel}
                                    className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                                    title="Close"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Selected Date Display */}
                            <div className="mb-6 p-4 bg-sky-50 rounded-lg border border-sky-100">
                                <p className="text-sm text-sky-600/80 mb-1 font-medium">Selected Date</p>
                                <p className="text-lg font-bold text-sky-900">
                                    {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>

                            {/* Error/Success Messages */}
                            {error && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-700">
                                    <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                    <span className="text-sm">{error}</span>
                                </div>
                            )}
                            {success && (
                                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2 text-emerald-700">
                                    <span className="text-sm">{success}</span>
                                </div>
                            )}

                            {/* Form */}
                            {canAddEvent(selectedDate.getDate()) && (
                                <div className="space-y-4 mb-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                            Event Host Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.eventHostName}
                                            onChange={(e) => handleFormChange('eventHostName', e.target.value)}
                                            placeholder="e.g. John's Wedding"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                            Managed By <span className="text-slate-400 text-xs font-normal">(Optional)</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.managedBy}
                                            onChange={(e) => handleFormChange('managedBy', e.target.value)}
                                            placeholder="e.g. Sarah Johnson"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                            Location <span className="text-slate-400 text-xs font-normal">(Optional)</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.location}
                                            onChange={(e) => handleFormChange('location', e.target.value)}
                                            placeholder="e.g. Grand Hotel, Mumbai"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                                        />
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                        <button
                                            onClick={handleSaveEvent}
                                            disabled={loading}
                                            className="flex-1 primary-button"
                                        >
                                            {loading ? 'Saving...' : 'Save Event'}
                                        </button>
                                        <button
                                            onClick={closePanel}
                                            className="secondary-button w-full sm:w-auto"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}

                            {!canAddEvent(selectedDate.getDate()) && (
                                <div className="mb-6">
                                    <button
                                        onClick={closePanel}
                                        className="w-full secondary-button"
                                    >
                                        Close
                                    </button>
                                </div>
                            )}

                            {/* Existing Events for Selected Date */}
                            {(eventsForSelectedDate.length > 0 || !canAddEvent(selectedDate.getDate())) && eventsForSelectedDate.length > 0 && (
                                <div className="mt-8 pt-6 border-t border-slate-100">
                                    <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Events on this date:</h3>
                                    <div className="space-y-3">
                                        {eventsForSelectedDate.map(event => (
                                            <div key={event.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl relative group hover:border-sky-200 transition-colors">
                                                <div className="pr-8">
                                                    <p className="font-bold text-slate-900">{event.eventHostName}</p>
                                                    {event.managedBy && <p className="text-sm text-slate-500 mt-1">Managed by: {event.managedBy}</p>}
                                                    {event.location && <p className="text-sm text-slate-500">Location: {event.location}</p>}
                                                </div>
                                                {canAddEvent(selectedDate.getDate()) && (
                                                    <button
                                                        onClick={() => handleDeleteEvent(event.id)}
                                                        className="absolute top-4 right-4 text-slate-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        title="Delete Event"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-slate-50 min-h-[400px] rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-12">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-100">
                                <CalendarIcon className="h-8 w-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900">No date selected</h3>
                            <p className="text-slate-500 mt-2 max-w-xs mx-auto">
                                Click on any date from the calendar to view details, set availability, or add events.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Availability;
