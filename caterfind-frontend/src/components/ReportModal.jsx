import React, { useState } from 'react';
import Modal from './Modal';
import Select from './Select';
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
                    <Select
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        options={[
                            { value: 'spam', label: 'Spam / Promotional' },
                            { value: 'harassment', label: 'Harassment / Hate' },
                            { value: 'inappropriate', label: 'Inappropriate Content' },
                            { value: 'fraud', label: 'Fraud / Scams' },
                            { value: 'privacy', label: 'Private / Personal Info' },
                            { value: 'other', label: 'Other' }
                        ]}
                        placeholder="Select reason"
                        className="w-full mt-2"
                    />
                </div>

                <div>
                    <label className="text-sm font-medium text-foreground">Details (optional)</label>
                    <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={4} className="form-input w-full mt-2" placeholder="Any additional context for moderators" />
                </div>

                <div className="flex gap-3 justify-end">
                    <button type="button" onClick={onClose} disabled={submitting} className="secondary-button">Cancel</button>
                    <button type="submit" disabled={submitting} className="primary-button">{submitting ? 'Sending...' : 'Submit Report'}</button>
                </div>
            </form>
        </Modal>
    );
};

export default ReportModal;
