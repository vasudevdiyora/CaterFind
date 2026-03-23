import React, { useState } from 'react';
import Modal from './Modal';
import { moderationAPI } from '../services/api';
import { useToast } from './ToastProvider';

const ReportModal = ({ isOpen, onClose, content, contentId, contentType }) => {
    const [reason, setReason] = useState('spam');
    const [details, setDetails] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const toast = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                type: 'PROFILE',
                content: content || 'Reported content',
                reportedUser: String(contentId || 'unknown'),
                reason: reason,
                contentId: contentId,
                contentType: contentType || 'review'
            };
            if (details) payload.details = details;
            await moderationAPI.createReport(payload);
            toast.show('Report submitted — thank you', { type: 'success' });
            onClose();
        } catch (err) {
            console.error('Report failed', err);
            toast.show(err?.message || 'Failed to submit report', { type: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={<div><h2 className="text-2xl font-bold text-foreground">Report content</h2><p className="text-sm text-muted-foreground mt-1">Tell us why this content should be reviewed</p></div>} className="max-w-lg">
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                    <label className="text-sm font-medium text-foreground">Reason</label>
                    <select value={reason} onChange={(e) => setReason(e.target.value)} className="form-input w-full mt-2">
                        <option value="spam">Spam / Promotional</option>
                        <option value="harassment">Harassment / Hate</option>
                        <option value="inappropriate">Inappropriate Content</option>
                        <option value="fraud">Fraud / Scams</option>
                        <option value="privacy">Private / Personal Info</option>
                        <option value="other">Other</option>
                    </select>
                </div>

                <div>
                    <label className="text-sm font-medium text-foreground">Details (optional)</label>
                    <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={4} className="form-input w-full mt-2" placeholder="Any additional context for moderators" />
                </div>

                <div className="flex gap-3 justify-end">
                    <button type="button" onClick={onClose} disabled={submitting} className="px-4 py-2 bg-card border border-border rounded-lg">Cancel</button>
                    <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary text-white rounded-lg">{submitting ? 'Sending...' : 'Submit Report'}</button>
                </div>
            </form>
        </Modal>
    );
};

export default ReportModal;
