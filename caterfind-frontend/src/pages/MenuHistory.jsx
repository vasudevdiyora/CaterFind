import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { menuAPI } from '@/services/api';
import { Plus, ChevronDown, ChevronUp, Edit, FileClock, CalendarCheck, CalendarX, Info, Users, Building, Mail, Phone } from 'lucide-react';
import '../styles/Contacts.css'; // For filter pills
import '../styles/Table.css'; // For buttons and layout elements

function MenuHistory({ user }) {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('upcoming');
    const [upcomingMenus, setUpcomingMenus] = useState([]);
    const [pastMenus, setPastMenus] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedMenuId, setExpandedMenuId] = useState(null);

    const totalMenus = useMemo(() => upcomingMenus.length + pastMenus.length, [upcomingMenus.length, pastMenus.length]);

    useEffect(() => {
        loadMenus();
    }, []);

    const loadMenus = async () => {
        try {
            setLoading(true);
            const [upcoming, past] = await Promise.all([
                menuAPI.getUpcoming(user.userId),
                menuAPI.getPast(user.userId, 30)
            ]);

            setUpcomingMenus(Array.isArray(upcoming) ? upcoming : []);
            setPastMenus(Array.isArray(past) ? past : []);
        } catch (error) {
            console.error('Error loading menu history:', error);
            alert('Failed to load menu history');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'SENT':
                return 'status-badge blue';
            case 'ACCEPTED':
                return 'status-badge green';
            case 'REJECTED':
                return 'status-badge red';
            case 'DRAFT':
                return 'status-badge gray';
            default:
                return 'status-badge gray';
        }
    };

    const formatDate = (dateText) => {
        if (!dateText) return '-';
        return new Date(dateText).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const currentMenus = activeTab === 'upcoming' ? upcomingMenus : pastMenus;

    return (
        <div className="page-shell">
            <div className="contacts-header">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                        <FileClock className="w-6 h-6" />
                        Menu History
                    </h1>
                    <button
                        onClick={() => navigate('/caterer/menu-builder')}
                        className="primary-button"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        New Menu
                    </button>
                </div>
                <p className="text-sm text-slate-500 mt-1">
                    All generated menus stored in one place. Total: {totalMenus}
                </p>
                <div className="filter-pills mt-4">
                    <button
                        onClick={() => setActiveTab('upcoming')}
                        className={`filter-pill ${activeTab === 'upcoming' ? 'active' : ''}`}
                    >
                        <CalendarCheck className="w-4 h-4 mr-2" />
                        Upcoming Events ({upcomingMenus.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('past')}
                        className={`filter-pill ${activeTab === 'past' ? 'active' : ''}`}
                    >
                        <CalendarX className="w-4 h-4 mr-2" />
                        Past 30 Days ({pastMenus.length})
                    </button>
                </div>
            </div>

            <div className="py-6">
                {loading ? (
                    <div className="surface-card p-8 text-center text-slate-500">Loading menus...</div>
                ) : currentMenus.length === 0 ? (
                    <div className="surface-card p-8 text-center text-slate-500">
                        No {activeTab === 'upcoming' ? 'upcoming' : 'past'} menus found.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {currentMenus.map((menu) => {
                            const isOpen = expandedMenuId === menu.id;
                            return (
                                <div key={menu.id} className="surface-card overflow-hidden transition-all duration-300">
                                    <div className="p-4">
                                        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_auto] gap-4 items-center">
                                            <div>
                                                <h3 className="font-bold text-slate-800">{menu.clientName || 'Unnamed Client'}</h3>
                                                <p className="text-sm text-slate-500">{menu.eventType || 'Event'}</p>
                                            </div>
                                            <div className="text-sm text-slate-600">
                                                <p className="font-semibold">{formatDate(menu.eventDate)}</p>
                                                <p className="text-xs">{menu.mealTime || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <span className={getStatusBadge(menu.status)}>
                                                    {menu.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 justify-self-end">
                                                <button
                                                    onClick={() => setExpandedMenuId(isOpen ? null : menu.id)}
                                                    className="secondary-button-sm"
                                                >
                                                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                    <span className="ml-2">{isOpen ? 'Hide' : 'Details'}</span>
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/caterer/menu-builder?menuId=${menu.id}`)}
                                                    className="primary-button-sm"
                                                >
                                                    <Edit size={14} className="mr-2" />
                                                    Edit
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {isOpen && (
                                        <div className="bg-slate-50/70 p-4 border-t border-border">
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                                                <div className="flex items-start gap-2"><Users size={16} className="text-slate-500 mt-0.5" /><p><strong className="font-semibold text-slate-600">Guests:</strong> {menu.numberOfGuests}</p></div>
                                                <div className="flex items-start gap-2"><Building size={16} className="text-slate-500 mt-0.5" /><p><strong className="font-semibold text-slate-600">Venue:</strong> {menu.eventLocation}</p></div>
                                                <div className="flex items-start gap-2"><Mail size={16} className="text-slate-500 mt-0.5" /><p><strong className="font-semibold text-slate-600">Email:</strong> {menu.clientEmail || 'N/A'}</p></div>
                                                <div className="flex items-start gap-2"><Phone size={16} className="text-slate-500 mt-0.5" /><p><strong className="font-semibold text-slate-600">Phone:</strong> {menu.contactNumber || 'N/A'}</p></div>
                                            </div>
                                            <div className="space-y-4">
                                                {Object.entries(menu.dishesByCategory || {}).map(([category, dishes]) => (
                                                    <div key={category}>
                                                        <h4 className="font-semibold text-slate-600 text-sm mb-2 pb-1 border-b border-slate-200">{category}</h4>
                                                        <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-1">
                                                            {dishes.map((dish) => (
                                                                <li key={dish.id} className="text-sm text-slate-700 truncate" title={dish.note ? `${dish.dishName} - Note: ${dish.note}`: dish.dishName}>
                                                                    {dish.dishName}
                                                                    {dish.note && <span className="text-slate-500 text-xs italic ml-1">(note)</span>}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default MenuHistory;
