import React, { useState } from 'react';

/**
 * Availability Page
 * 
 * Allows caterers to manage their availability on a calendar.
 * - Displays a monthly calendar view.
 * - Allows toggling dates between Available, Busy, and Neutral.
 * - Matches the visual style provided in the screenshot.
 */
const Availability = ({ user }) => {
    // Current date for default view
    const [currentDate, setCurrentDate] = useState(new Date(2026, 1)); // Feb 2026 as per screenshot
    
    // State to store status of dates. 
    // Format: "YYYY-MM-DD": "available" | "busy"
    const [availabilityMap, setAvailabilityMap] = useState({
        '2026-02-05': 'busy',
        '2026-02-10': 'busy',
        '2026-02-15': 'available',
        '2026-02-20': 'busy',
        '2026-02-25': 'available',
    });

    const [selectedDate, setSelectedDate] = useState(new Date(2026, 1, 13)); // Default selected date

    // Calendar helpers
    const daysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

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

    const formatDateKey = (day) => {
        if (!day) return null;
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        return `${year}-${month}-${d}`;
    };

    const handleDateClick = (day) => {
        if (!day) return;
        const key = formatDateKey(day);
        
        // Update selected date for visual focus (yellow border)
        setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));

        // Toggle status: Neutral -> Available -> Busy -> Neutral
        setAvailabilityMap(prev => {
            const currentStatus = prev[key];
            const newMap = { ...prev };

            if (!currentStatus) {
                newMap[key] = 'available';
            } else if (currentStatus === 'available') {
                newMap[key] = 'busy';
            } else {
                delete newMap[key]; // Remove to make it neutral
            }
            return newMap;
        });
    };

    const getDayClass = (day) => {
        if (!day) return "invisible";
        const key = formatDateKey(day);
        const status = availabilityMap[key];
        const isSelected = selectedDate && 
                           selectedDate.getDate() === day && 
                           selectedDate.getMonth() === currentDate.getMonth() && 
                           selectedDate.getFullYear() === currentDate.getFullYear();

        let baseClass = "h-10 w-10 flex items-center justify-center rounded-lg text-sm cursor-pointer transition-colors";
        
        if (status === 'available') {
            baseClass += " bg-emerald-800 text-emerald-100 hover:bg-emerald-700";
        } else if (status === 'busy') {
            baseClass += " bg-red-900/50 text-red-100 hover:bg-red-800/50";
        } else {
            baseClass += " bg-slate-800 text-slate-200 hover:bg-slate-700";
        }

        if (isSelected) {
            baseClass += " ring-2 ring-amber-400";
        }

        return baseClass;
    };

    return (
        <div className="p-8 text-white min-h-screen bg-transparent">
            <div className="mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <span className="text-amber-500">📅</span> Availability Calendar
                </h1>
                <p className="text-slate-400 mt-1">Tap dates to mark as busy or available</p>
            </div>

            <div className="max-w-md bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-sm">
                
                {/* Header */}
                <div className="text-center mb-6">
                    <h2 className="text-lg font-semibold">
                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </h2>
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
                                >
                                    {day}
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
                </div>

            </div>
        </div>
    );
};

export default Availability;
