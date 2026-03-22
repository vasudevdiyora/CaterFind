import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ArrowLeft } from 'lucide-react';
import { availabilityAPI } from '../services/api';
import '../styles/Table.css';

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

        // Add empty placeholders for days before the 1st of the month
        for (let i = 0; i < startDay; i++) {
            days.push(null);
        }

        // Add the actual days of the month
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

        let baseClass = "h-9 w-9 flex items-center justify-center rounded-lg text-sm font-semibold";

        switch (status) {
            case 'available':
                return `${baseClass} bg-emerald-100 text-emerald-800`;
            case 'busy':
                return `${baseClass} bg-red-100 text-red-800 line-through`;
            default:
                return `${baseClass} bg-slate-100 text-slate-700`;
        }
    };

    const wrapperClass = embedded ? "" : "page-shell";
    const calendarClass = embedded ? "surface-card p-0" : "surface-card";

    return (
        <div className={wrapperClass}>
            {!embedded && (
                 <header className="page-header">
                    <h1 className="page-title">
                        <CalendarIcon /> Availability Calendar
                    </h1>
                    <p className="page-subtitle">
                        View the caterer's schedule.
                    </p>
                </header>
            )}

            <div className={calendarClass}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                    <button
                        onClick={goToPrevMonth}
                        className="icon-button"
                        title="Previous Month"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <h2 className="text-base font-bold text-slate-800 text-center">
                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </h2>
                    <button
                        onClick={goToNextMonth}
                        className="icon-button"
                        title="Next Month"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                <div className="p-4">
                    {/* Days of Week */}
                    <div className="grid grid-cols-7 gap-2 mb-2 text-center">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                            <div key={i} className="text-xs text-slate-500 font-medium">
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
                                    <div className="h-9 w-9" />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Legend */}
                    <div className="flex items-center justify-center gap-6 mt-6">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                            <span className="text-sm text-slate-600">Available</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-400"></div>
                            <span className="text-sm text-slate-600">Busy</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                            <span className="text-sm text-slate-600">Default</span>
                        </div>
                    </div>

                    {loading && (
                        <div className="text-center text-slate-500 text-sm mt-4">Loading...</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClientAvailability;
