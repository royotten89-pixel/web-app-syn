'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button, Card, Input, Modal, Table, Spinner, Alert } from '@/components/ui';

export default function AdminMachinesPage() {
  const router = useRouter();
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadTypes(); }, []);

  async function loadTypes() {
    const { data } = await supabase.from('machine_types').select('id, name, description, parts(id), manuals(id)').order('name');
    setTypes(data || []);
    setLoading(false);
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!name.trim()) { setError('Vul een naam in.'); return; }
    setSaving(true); setError('');
    const { error } = await supabase.from('machine_types').insert({ name: name.trim(), description: description.trim() || null });
    setSaving(false);
    if (error) { setError(error.message); return; }
    setName(''); setDescription(''); setShowAdd(false);
    loadTypes();
  }

  const columns = [
    { key: 'name', label: 'Model' },
    { key: 'description', label: 'Omschrijving', wrap: true },
    { key: 'parts', label: 'Onderdelen', render: r => r.parts?.length || 0 },
    { key: 'manuals', label: 'Handleidingen', render: r => r.manuals?.length || 0 },
    { key: 'actions', label: '', render: r => <button onClick={e => { e.stopPropagation(); router.push(`/admin/machines/${r.id}`); }} style={{ padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Beheren</button> },
  ];

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={40} /></div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>Machinetypes</h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: 4 }}>Beheer handleidingen, foto's en onderdelen per type.</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>+ Type toevoegen</Button>
      </div>

      <Table columns={columns} rows={types} emptyMessage="Nog geen machinetypes." />

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Nieuw machinetype">
        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="Modelnaam *" value={name} onChange={setName} placeholder='bv. "Model X2000"' />
          <Input label="Omschrijving (optioneel)" value={description} onChange={setDescription} multiline rows={3} />
          <Alert type="error" message={error} />
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <Button type="button" variant="secondary" onClick={() => setShowAdd(false)}>Annuleren</Button>
            <Button type="submit" loading={saving}>Opslaan</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
