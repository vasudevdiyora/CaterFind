import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { menuAPI } from '@/services/api';

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
    if (status === 'SENT') return 'bg-blue-600/20 text-blue-300 border-blue-500/30';
    if (status === 'ACCEPTED') return 'bg-green-600/20 text-green-300 border-green-500/30';
    if (status === 'REJECTED') return 'bg-red-600/20 text-red-300 border-red-500/30';
    return 'bg-gray-700/40 text-gray-300 border-gray-600/40';
  };

  const formatDate = (dateText) => {
    if (!dateText) return '-';
    return new Date(dateText).toLocaleDateString();
  };

  const currentMenus = activeTab === 'upcoming' ? upcomingMenus : pastMenus;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-3 md:p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Menu History</h1>
            <p className="text-sm text-gray-400">
              All generated menus stored in one place. Total: {totalMenus}
            </p>
          </div>
          <button
            onClick={() => navigate('/owner/menu-builder')}
            className="bg-[#f59e0b] text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#d97706] transition"
          >
            + New Menu
          </button>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-3 py-2 rounded-lg text-sm font-medium border ${
              activeTab === 'upcoming'
                ? 'bg-[#f59e0b] text-black border-[#f59e0b]'
                : 'bg-[#1f1f1f] text-gray-300 border-gray-700'
            }`}
          >
            Upcoming Events ({upcomingMenus.length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`px-3 py-2 rounded-lg text-sm font-medium border ${
              activeTab === 'past'
                ? 'bg-[#f59e0b] text-black border-[#f59e0b]'
                : 'bg-[#1f1f1f] text-gray-300 border-gray-700'
            }`}
          >
            Past 30 Days ({pastMenus.length})
          </button>
        </div>

        {loading ? (
          <div className="bg-[#1a1a1a] rounded-lg p-8 text-center text-gray-400">Loading menus...</div>
        ) : currentMenus.length === 0 ? (
          <div className="bg-[#1a1a1a] rounded-lg p-8 text-center text-gray-400">
            No {activeTab === 'upcoming' ? 'upcoming' : 'past'} menus found.
          </div>
        ) : (
          <div className="space-y-3">
            {currentMenus.map((menu) => {
              const isOpen = expandedMenuId === menu.id;
              return (
                <div key={menu.id} className="bg-[#1a1a1a] rounded-lg border border-gray-800 overflow-hidden">
                  <div className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold">{menu.clientName || 'Unnamed Client'}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded border ${getStatusBadge(menu.status)}`}>
                            {menu.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300">
                          {menu.eventType || 'Event'} | {formatDate(menu.eventDate)} | {menu.eventLocation || '-'}
                        </p>
                        <p className="text-xs text-gray-400">
                          Guests: {menu.numberOfGuests || '-'} | Contact: {menu.contactNumber || '-'} | Email: {menu.clientEmail || '-'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setExpandedMenuId(isOpen ? null : menu.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#2a2a2a] text-white hover:bg-[#323232]"
                        >
                          {isOpen ? 'Hide Details' : 'View Details'}
                        </button>
                        <button
                          onClick={() => navigate(`/owner/menu-builder?menuId=${menu.id}`)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#f59e0b] text-black hover:bg-[#d97706]"
                        >
                          Edit Menu
                        </button>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="mt-3 pt-3 border-t border-gray-800 space-y-3">
                        {Object.entries(menu.dishesByCategory || {}).map(([category, dishes]) => (
                          <div key={category}>
                            <h4 className="text-sm font-semibold text-[#f59e0b] mb-1">{category}</h4>
                            <ul className="space-y-1">
                              {dishes.map((dish) => (
                                <li key={dish.id} className="text-sm text-gray-200">
                                  {dish.dishName}
                                  {dish.note ? ` - Note: ${dish.note}` : ''}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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
