import React, { useEffect, useState } from 'react';
import { formatPhoneForDisplay, formatPhoneForBackend, formatPhoneForInput } from './lib/utils';

const API_URL = 'http://localhost:8080/api/contacts';

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const fetchContacts = async () => {
    setLoading(true);
    const res = await fetch(API_URL);
    const data = await res.json();
    // Strip +91 from phone numbers for display in inputs
    const formattedData = data.map(c => ({
      ...c,
      phone: formatPhoneForInput(c.phone)
    }));
    setContacts(formattedData);
    setLoading(false);
  };

  useEffect(() => {
    // Schedule fetch to avoid synchronous setState inside effect
    const t = setTimeout(() => fetchContacts(), 0);
    return () => clearTimeout(t);
  }, []);

  const handleChange = (e) => {
    const nextValue = e.target.name === 'phone'
      ? e.target.value.replace(/\D/g, '').slice(0, 10)
      : e.target.value;

    setForm({ ...form, [e.target.name]: nextValue });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = {
      ...form,
      phone: form.phone ? formatPhoneForBackend(form.phone) : ''
    };
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    setForm({ name: '', phone: '', email: '', notes: '' });
    fetchContacts();
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
      <h2>Contacts</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: 32 }}>
        <input
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
          required
          style={{ width: '100%', marginBottom: 8, padding: 8 }}
        />
        <div style={{ width: '100%', marginBottom: 8, position: 'relative' }}>
          <div style={{ position: 'absolute', left: '8px', top: '8px', color: '#999', fontSize: '12px', fontWeight: 'bold', display: form.phone ? 'block' : 'none' }}>+91</div>
          <input
            name="phone"
            placeholder="+91 98765 43210"
            value={form.phone}
            onChange={handleChange}
            style={{ width: '100%', marginBottom: 0, padding: '8px', paddingLeft: form.phone ? '40px' : '8px' }}
          />
        </div>
        <input
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          style={{ width: '100%', marginBottom: 8, padding: 8 }}
        />
        <input
          name="notes"
          placeholder="Notes (e.g. Staff, Chef, Supplier)"
          value={form.notes}
          onChange={handleChange}
          style={{ width: '100%', marginBottom: 8, padding: 8 }}
        />
        <button type="submit" style={{ padding: 10, width: '100%' }}>Add Contact</button>
      </form>
      {loading ? <p>Loading...</p> : (
        <ul>
          {contacts.map((c) => (
            <li key={c.id} style={{ marginBottom: 16, border: '1px solid #333', padding: 12, borderRadius: 8 }}>
              <strong>{c.name}</strong> <br />
              {c.notes && <span>Type: {c.notes} <br /></span>}
              {c.phone && <span>Phone: {formatPhoneForDisplay(c.phone)} <br /></span>}
              {c.email && <span>Email: {c.email}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
