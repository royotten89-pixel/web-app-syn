'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/lib/supabase';
import { Button, Card, Spinner, Alert, Input, Modal } from '@/components/ui';

export default function MachineDetailPage() {
  const { session } = useAuth();
  const { addItem } = useCart();
  const router = useRouter();
  const params = useParams();
  const machineId = params.id;

  const [machine, setMachine] = useState(null);
  const [manuals, setManuals] = useState([]);
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [partSearch, setPartSearch] = useState('');
  const [showService, setShowService] = useState(false);
  const [urgency, setUrgency] = useState('normal');
  const [description, setDescription] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [serviceLoading, setServiceLoading] = useState(false);
  const [serviceSuccess, setServiceSuccess] = useState('');
  const [addedParts, setAddedParts] = useState({});
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (session && machineId) loadData();
  }, [session, machineId]);

  async function loadData() {
    const { data: m } = await supabase
      .from('machines')
      .select('id, serial_number, nickname, machine_type_id, machine_types(id, name, description, image_url)')
      .eq('id', machineId)
      .single();
    if (!m) { router.push('/portal/machines'); return; }
    setMachine(m);
    const [mRes, pRes] = await Promise.all([
      supabase.from('manuals').select('*').eq('machine_type_id', m.machine_type_id).order('uploaded_at', { ascending: false }),
      supabase.from('parts').select('*').eq('machine_type_id', m.machine_type_id).order('part_number'),
    ]);
    setManuals(mRes.data || []);
    setParts(pRes.data || []);
    setLoading(false);
  }

  async function handleAddToCart(part) {
    await addItem({ partId: part.id, machineId: machine.id });
    setAddedParts(prev => ({ ...prev, [part.id]: true }));
    setTimeout(() => setAddedParts(prev => ({ ...prev, [part.id]: false })), 2000);
  }

  async function handleServiceRequest(e) {
    e.preventDefault();
    if (!description.trim()) return;
    setServiceLoading(true);
    const { error } = await supabase.from('service_requests').insert({
      customer_id: session.user.id,
      machine_id: machineId,
      description: description.trim(),
      urgency,
      preferred_date: preferredDate || null,
    });
    setServiceLoading(false);
    if (!error) {
      setServiceSuccess('Service-aanvraag verstuurd! We nemen contact op.');
      setDescription(''); setPreferredDate('');
    }
  }

  async function handleDelete() {
    if (!confirm('Weet je zeker dat je deze machine wilt verwijderen?')) return;
    setDeleteLoading(true);
    await supabase.from('machines').delete().eq('id', machineId);
    router.push('/portal/machines');
  }

  const filteredParts = parts.filter(p => {
    const q = partSearch.toLowerCase();
    return p.name?.toLowerCase().includes(q) || p.part_number?.toLowerCase().includes(q);
  });

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={40} /></div>;
  if (!machine) return null;

  return (
    <div>
      <button onClick={() => router.push('/portal/machines')} style={{ color: 'var(--color-text-muted)', fontSize: 14, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
        ← Terug naar machines
      </button>

      {/* Header */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap' }}>
        <div style={{ width: 100, height: 100, borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-surface-alt)', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {machine.machine_types?.image_url
            ? <img src={machine.machine_types.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: 48 }}>⚙</span>
          }
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>{machine.nickname || machine.machine_types?.name}</h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: 4 }}>{machine.machine_types?.name}</p>
          <span style={{ display: 'inline-block', marginTop: 8, padding: '4px 12px', backgroundColor: 'var(--color-surface-alt)', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
            SERIENR. {machine.serial_number}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button variant="ghost" onClick={() => setShowService(true)}>Service aanvragen</Button>
          <Button variant="danger" onClick={handleDelete} loading={deleteLoading}>Verwijderen</Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24, alignItems: 'start' }}>
        {/* Handleidingen */}
        <Card>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Handleiding</h2>
          {manuals.length === 0
            ? <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Nog geen handleiding beschikbaar.</p>
            : manuals.map(m => (
              <a key={m.id} href={m.file_url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--color-border)', textDecoration: 'none', color: 'inherit' }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500 }}>{m.title}</p>
                  {m.version && <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>v{m.version}</p>}
                </div>
                <span style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: 13 }}>Openen →</span>
              </a>
            ))
          }
        </Card>

        {/* Onderdelen */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600 }}>Onderdelen ({parts.length})</h2>
          </div>
          <div style={{ marginBottom: 16 }}>
            <Input value={partSearch} onChange={setPartSearch} placeholder="Zoek op naam of onderdeelnummer..." />
          </div>
          {filteredParts.length === 0
            ? <Card><p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>{parts.length === 0 ? 'Nog geen onderdelen voor dit type.' : `Geen onderdelen gevonden voor "${partSearch}".`}</p></Card>
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filteredParts.map(part => (
                  <Card key={part.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                    <div>
                      <p style={{ fontWeight: 500 }}>{part.name}</p>
                      <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>Nr. {part.part_number}</p>
                      {part.description && <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>{part.description}</p>}
                    </div>
                    <button
                      onClick={() => handleAddToCart(part)}
                      style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', border: 'none', backgroundColor: addedParts[part.id] ? 'var(--color-success)' : 'var(--color-primary)', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'background 0.2s', minWidth: 120 }}
                    >
                      {addedParts[part.id] ? '✓ Toegevoegd' : '+ Winkelwagen'}
                    </button>
                  </Card>
                ))}
              </div>
            )
          }
        </div>
      </div>

      {/* Service aanvraag modal */}
      <Modal open={showService} onClose={() => { setShowService(false); setServiceSuccess(''); }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Service aanvragen</h2>
        {serviceSuccess ? (
          <Alert type="success" message={serviceSuccess} />
        ) : (
          <form onSubmit={handleServiceRequest} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 8 }}>URGENTIE</label>
              {[['urgent', '🚨 Spoed — machine staat stil'], ['soon', '⚡ Zo snel mogelijk'], ['normal', '📅 Nabije toekomst']].map(([val, label]) => (
                <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 'var(--radius-md)', border: `1.5px solid ${urgency === val ? 'var(--color-primary)' : 'var(--color-border)'}`, backgroundColor: urgency === val ? 'var(--color-primary)14' : 'transparent', cursor: 'pointer', marginBottom: 8 }}>
                  <input type="radio" name="urgency" value={val} checked={urgency === val} onChange={() => setUrgency(val)} />
                  {label}
                </label>
              ))}
            </div>
            <Input label="Omschrijving *" value={description} onChange={setDescription} placeholder="Beschrijf het probleem of de gewenste service" multiline rows={4} />
            <Input label="Gewenste datum (optioneel)" type="date" value={preferredDate} onChange={setPreferredDate} />
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <Button type="button" variant="secondary" onClick={() => setShowService(false)}>Annuleren</Button>
              <Button type="submit" loading={serviceLoading}>Versturen</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
