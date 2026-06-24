'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button, Card, Input, Alert } from '@/components/ui';

export default function ServiceGeneralPage() {
  const { session } = useAuth();
  const [urgency, setUrgency] = useState('normal');
  const [description, setDescription] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!description.trim()) { setError('Vul een omschrijving in.'); return; }
    setSubmitting(true); setError('');
    const { error } = await supabase.from('service_requests').insert({
      customer_id: session.user.id,
      machine_id: null, // geen machine gekoppeld
      description: description.trim(),
      urgency,
      preferred_date: preferredDate || null,
    });
    setSubmitting(false);
    if (error) { setError(error.message); return; }
    setSuccess('Aanvraag verstuurd! We nemen contact op.');
    setDescription(''); setPreferredDate(''); setUrgency('normal');
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Algemene service aanvraag</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 32 }}>Niet gekoppeld aan een specifieke machine — voor algemene vragen, inspecties of overige service.</p>

      {success ? (
        <Card style={{ textAlign: 'center', padding: 48 }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>✅</p>
          <h3 style={{ marginBottom: 8 }}>Aanvraag verstuurd</h3>
          <p style={{ color: 'var(--color-text-muted)' }}>{success}</p>
          <button onClick={() => setSuccess('')} style={{ marginTop: 20, color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>Nieuwe aanvraag indienen</button>
        </Card>
      ) : (
        <Card>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 10 }}>URGENTIE *</label>
              {[['urgent', '🚨 Spoed', 'Directe actie vereist'], ['soon', '⚡ Zo snel mogelijk', 'Binnen korte termijn'], ['normal', '📅 Nabije toekomst', 'Niet urgent']].map(([val, label, desc]) => (
                <label key={val} onClick={() => setUrgency(val)} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', borderRadius: 'var(--radius-md)', border: `1.5px solid ${urgency === val ? 'var(--color-primary)' : 'var(--color-border)'}`, backgroundColor: urgency === val ? 'var(--color-primary)14' : 'transparent', cursor: 'pointer', marginBottom: 8 }}>
                  <input type="radio" name="urgency" checked={urgency === val} onChange={() => setUrgency(val)} style={{ marginTop: 2 }} />
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 14 }}>{label}</p>
                    <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>{desc}</p>
                  </div>
                </label>
              ))}
            </div>

            <Input label="Omschrijving *" value={description} onChange={setDescription} placeholder="Beschrijf uw vraag of wens zo specifiek mogelijk" multiline rows={5} />
            <Input label="Gewenste datum (optioneel)" type="date" value={preferredDate} onChange={setPreferredDate} />

            <Card style={{ backgroundColor: 'var(--color-surface-alt)', padding: 14 }}>
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                Na het versturen nemen wij telefonisch of per e-mail contact op.
              </p>
            </Card>

            <Alert type="error" message={error} />
            <Button type="submit" loading={submitting} style={{ width: '100%' }}>Aanvraag versturen</Button>
          </form>
        </Card>
      )}
    </div>
  );
}
