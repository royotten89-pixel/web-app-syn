'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button, Card, Input, Modal, Select, Spinner, Alert } from '@/components/ui';

export default function MachinesPage() {
  const { session, profile } = useAuth();
  const router = useRouter();
  const [machines, setMachines] = useState([]);
  const [machineTypes, setMachineTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [nickname, setNickname] = useState('');
  const [saving, setSaving] = useState(false);
  const [addError, setAddError] = useState('');

  useEffect(() => {
    if (session) { loadMachines(); loadTypes(); }
  }, [session]);

  async function loadMachines() {
    const { data } = await supabase.from('machines').select('id, serial_number, nickname, registered_at, machine_types(id, name, image_url)').eq('owner_id', session.user.id).order('registered_at', { ascending: false });
    setMachines(data || []);
    setLoading(false);
  }

  async function loadTypes() {
    const { data } = await supabase.from('machine_types').select('id, name').order('name');
    setMachineTypes(data || []);
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!selectedType) { setAddError('Kies een machinetype.'); return; }
    if (!serialNumber.trim()) { setAddError('Vul het serienummer in.'); return; }
    setSaving(true); setAddError('');
    const { error } = await supabase.from('machines').insert({ owner_id: session.user.id, company_id: profile?.company_id || null, machine_type_id: selectedType, serial_number: serialNumber.trim(), nickname: nickname.trim() || null });
    setSaving(false);
    if (error) { setAddError(error.code === '23505' ? 'Dit serienummer is al geregistreerd voor dit machinetype.' : error.message); return; }
    setShowAdd(false); setSelectedType(''); setSerialNumber(''); setNickname('');
    loadMachines();
  }

  const filtered = machines.filter(m => {
    const q = search.toLowerCase();
    return m.serial_number?.toLowerCase().includes(q) || m.nickname?.toLowerCase().includes(q) || m.machine_types?.name?.toLowerCase().includes(q);
  });

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={40} /></div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>Mijn machines</h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: 4 }}>{machines.length} machine(s) geregistreerd</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>+ Machine toevoegen</Button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <Input value={search} onChange={setSearch} placeholder="Zoek op naam, type of serienummer..." />
      </div>

      {filtered.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 48 }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>⚙</p>
          <h3 style={{ marginBottom: 8 }}>{search ? 'Geen resultaten' : 'Nog geen machines'}</h3>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: 20 }}>{search ? `Geen machines gevonden voor "${search}"` : 'Voeg je eerste machine toe.'}</p>
          {!search && <Button onClick={() => setShowAdd(true)}>Machine toevoegen</Button>}
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filtered.map(machine => (
            <Card key={machine.id} onClick={() => router.push(`/portal/machines/${machine.id}`)} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ width: 72, height: 72, borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-surface-alt)', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {machine.machine_types?.image_url
                  ? <img src={machine.machine_types.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 32 }}>⚙</span>
                }
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 2 }}>{machine.nickname || machine.machine_types?.name}</h3>
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 8 }}>{machine.machine_types?.name}</p>
                <span style={{ display: 'inline-block', padding: '3px 10px', backgroundColor: 'var(--color-surface-alt)', borderRadius: 'var(--radius-sm)', fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                  SN {machine.serial_number}
                </span>
              </div>
              <span style={{ color: 'var(--color-text-muted)', fontSize: 20 }}>›</span>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Machine toevoegen">
        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Select label="Machinetype *" value={selectedType} onChange={setSelectedType} placeholder="Kies een type..." options={machineTypes.map(t => ({ value: t.id, label: t.name }))} />
          <Input label="Serienummer *" value={serialNumber} onChange={setSerialNumber} placeholder="bv. SN-2024-00123" autoCapitalize="characters" />
          <Input label="Eigen naam (optioneel)" value={nickname} onChange={setNickname} placeholder="bv. Lijn 2 - hal B" />
          <Alert type="error" message={addError} />
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <Button type="button" variant="secondary" onClick={() => setShowAdd(false)}>Annuleren</Button>
            <Button type="submit" loading={saving}>Registreren</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
