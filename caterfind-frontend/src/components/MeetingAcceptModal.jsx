import React, { useState, useEffect } from 'react';
import Modal from './Modal';

/**
 * Modal used by caterer to confirm meeting details when accepting a request.
 * Props:
 * - isOpen, onClose, request, defaultPlace, onConfirm(requestId, payload)
 */
const MeetingAcceptModal = ({ isOpen, onClose, request, defaultPlace = '', onConfirm, businessProfile = null }) => {
    const [meetingDate, setMeetingDate] = useState('');
    const [meetingTime, setMeetingTime] = useState('');
    const [meetingPlace, setMeetingPlace] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!request) return;
        // Pre-fill date from request.event date
        try {
            if (request.date) {
                const d = new Date(request.date);
                const iso = d.toISOString().slice(0, 10);
                setMeetingDate(iso);
            }
        } catch (e) {}

        // Default place is passed in
        setMeetingPlace(defaultPlace || '');
    }, [request, defaultPlace]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!request) return;
        setSubmitting(true);
        try {
            const payload = {
                meetingDate: meetingDate || undefined,
                meetingTime: meetingTime || undefined,
                meetingPlace: (meetingPlace && meetingPlace.trim()) ? meetingPlace.trim() : undefined
            };
            // If caller provided business coordinates (via businessProfile) and payload has no coords, include them
            if ((!payload.meetingLatitude || !payload.meetingLongitude) && businessProfile && businessProfile.latitude && businessProfile.longitude) {
                const lat = Number(businessProfile.latitude);
                const lon = Number(businessProfile.longitude);
                if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
                    payload.meetingLatitude = lat;
                    payload.meetingLongitude = lon;
                }
            }

            // If still missing coords but we have a meetingPlace string, attempt client-side geocoding (Nominatim) as best-effort
            if ((!payload.meetingLatitude || !payload.meetingLongitude) && payload.meetingPlace) {
                try {
                    const q = encodeURIComponent(payload.meetingPlace);
                    const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`;
                    const res = await fetch(url);
                    if (res.ok) {
                        const arr = await res.json();
                        if (Array.isArray(arr) && arr.length > 0 && arr[0].lat && arr[0].lon) {
                            payload.meetingLatitude = Number(arr[0].lat);
                            payload.meetingLongitude = Number(arr[0].lon);
                        }
                    }
                } catch (err) {
                    // ignore geocoding errors; server will fallback
                    console.warn('Client geocode failed', err);
                }
            }

            // Send payload
            await onConfirm(request.id, payload);
            onClose();
        } catch (err) {
            alert(err.message || 'Failed to accept request');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Confirm Meeting Details">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700">Meeting Date</label>
                    <input type="date" value={meetingDate} onChange={e => setMeetingDate(e.target.value)} className="form-input w-full" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700">Meeting Time</label>
                    <input type="time" value={meetingTime} onChange={e => setMeetingTime(e.target.value)} className="form-input w-full" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700">Meeting Place</label>
                    <input type="text" value={meetingPlace} onChange={e => setMeetingPlace(e.target.value)} placeholder="Enter place or leave to use business address" className="form-input w-full" />
                </div>

                <div className="flex items-center justify-end gap-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-slate-200 rounded">Cancel</button>
                    <button type="submit" disabled={submitting} className="px-4 py-2 bg-emerald-600 text-white rounded">
                        {submitting ? 'Sending...' : 'Confirm & Accept'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default MeetingAcceptModal;
