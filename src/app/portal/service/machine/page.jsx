'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button, Card, Input, Alert, Select, Spinner } from '@/components/ui';

export default function ServiceMachinePage() {
  const { session } = useAuth();
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMachine, setSelectedMachine] = useState('');
  const [urgency, setUrgency] = useState('normal');
  const [description, setDescription] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (session) loadMachines();
  }, [session]);

  async function loadMachines() {
    const { data } = await supabase
      .from('machines')
      .select('id, serial_number, nickname, machine_types(name)')
      .eq('owner_id', session.user.id)
      .order('registered_at', { ascending: false });
    setMachines(data || []);
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedMachine) { setError('Kies een machine.'); return; }
    if (!description.trim()) { setError('Vul een omschrijving in.'); return; }
    setSubmitting(true); setError('');
    const { error } = await supabase.from('service_requests').insert({
      customer_id: session.user.id,
      machine_id: selectedMachine,
      description: description.trim(),
      urgency,
      preferred_date: preferredDate || null,
    });
    setSubmitting(false);
    if (error) { setError(error.message); return; }
    setSuccess('Service-aanvraag verstuurd! We nemen contact op om een afspraak te plannen.');
    setSelectedMachine(''); setDescription(''); setPreferredDate(''); setUrgency('normal');
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={40} /></div>;

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Service aanvragen</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 32 }}>Voor een specifieke machine uit uw machinepark.</p>

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
            <Select
              label="Machine *"
              value={selectedMachine}
              onChange={setSelectedMachine}
              placeholder="Kies een machine..."
              options={machines.map(m => ({ value: m.id, label: `${m.nickname || m.machine_types?.name} — SN ${m.serial_number}` }))}
            />

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 10 }}>URGENTIE *</label>
              {[['urgent', '🚨 Spoed', 'Machine staat stil, productie geblokkeerd'], ['soon', '⚡ Zo snel mogelijk', 'Storing maar productie loopt nog'], ['normal', '📅 Nabije toekomst', 'Preventief of niet urgent']].map(([val, label, desc]) => (
                <label key={val} onClick={() => setUrgency(val)} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', borderRadius: 'var(--radius-md)', border: `1.5px solid ${urgency === val ? 'var(--color-primary)' : 'var(--color-border)'}`, backgroundColor: urgency === val ? 'var(--color-primary)14' : 'transparent', cursor: 'pointer', marginBottom: 8 }}>
                  <input type="radio" name="urgency" checked={urgency === val} onChange={() => setUrgency(val)} style={{ marginTop: 2 }} />
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 14 }}>{label}</p>
                    <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>{desc}</p>
                  </div>
                </label>
              ))}
            </div>

            <Input label="Omschrijving *" value={description} onChange={setDescription} placeholder="Beschrijf het probleem of de gewenste service zo specifiek mogelijk" multiline rows={4} />
            <Input label="Gewenste datum (optioneel)" type="date" value={preferredDate} onChange={setPreferredDate} />

            <Card style={{ backgroundColor: 'var(--color-surface-alt)', padding: 14 }}>
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                Na het versturen nemen wij telefonisch of per e-mail contact op om de afspraak te bevestigen.
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
