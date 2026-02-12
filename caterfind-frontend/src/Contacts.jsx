import React, { useEffect, useState } from 'react';

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
    setContacts(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
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
        <input
          name="phone"
          placeholder="Phone"
          value={form.phone}
          onChange={handleChange}
          style={{ width: '100%', marginBottom: 8, padding: 8 }}
        />
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
              {c.phone && <span>Phone: {c.phone} <br /></span>}
              {c.email && <span>Email: {c.email}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
