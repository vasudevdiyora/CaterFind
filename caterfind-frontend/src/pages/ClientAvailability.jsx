import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ArrowLeft } from 'lucide-react';
import { availabilityAPI } from '../services/api';

/**
 * Client Availability View
 * 
 * Read-only calendar showing a caterer's availability.
 */
const ClientAvailability = ({ catererId, onBack, embedded = false, showBack = true }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [availabilityMap, setAvailabilityMap] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (catererId) {
            loadAvailabilityForMonth(currentDate);
        }
    }, [catererId, currentDate]);

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

        for (let i = 0; i < startDay; i++) {
            days.push(null);
        }

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

    const loadAvailabilityForMonth = async (date) => {
        try {
            setLoading(true);
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
        } finally {
            setLoading(false);
        }
    };

    const getDayClass = (day) => {
        if (!day) return "invisible";
        const key = formatDateKey(day);
        const status = availabilityMap[key];

        let baseClass = "h-10 w-10 flex items-center justify-center rounded-lg text-sm transition-colors";

        if (status === 'available') {
            baseClass += " bg-emerald-800 text-emerald-100";
        } else if (status === 'busy') {
            baseClass += " bg-red-900/50 text-red-100";
        } else {
            baseClass += " bg-slate-800 text-slate-200";
        }

        return baseClass;
    };

    const wrapperClass = embedded ? "text-white" : "p-8 text-white min-h-screen bg-transparent";
    const calendarClass = embedded
        ? "max-w-md bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-sm"
        : "max-w-md bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-sm";

    return (
        <div className={wrapperClass}>
            <div className={embedded ? "mb-4" : "mb-6"}>
                {showBack && onBack && (
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Caterers
                    </button>
                )}

                <h1 className={embedded ? "text-xl font-bold flex items-center gap-2" : "text-2xl font-bold flex items-center gap-2"}>
                    <span className="text-amber-500"><CalendarIcon className="h-6 w-6" /></span> Availability Calendar
                </h1>
                <p className="text-slate-400 mt-1">Caterer availability (read-only)</p>
            </div>

            <div className={calendarClass}>
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
                        <div key={index} className="flex justify-center">
                            {day ? (
                                <div className={getDayClass(day)}>
                                    {day}
                                </div>
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
                </div>

                {loading && (
                    <div className="text-center text-slate-500 text-sm mt-4">Loading availability...</div>
                )}
            </div>
        </div>
    );
};

export default ClientAvailability;
