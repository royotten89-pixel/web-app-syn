'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/contexts/CartContext';
import { Button, Card, Input, Alert, Spinner } from '@/components/ui';

export default function PartsPage() {
  const { session, profile } = useAuth();
  const { addItem } = useCart();
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [partNumber, setPartNumber] = useState('');
  const [partName, setPartName] = useState('');
  const [partNameEn, setPartNameEn] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [cartMsg, setCartMsg] = useState('');

  useEffect(() => {
    if (session && profile?.company_id) loadParts();
    else setLoading(false);
  }, [session, profile]);

  async function loadParts() {
    const { data } = await supabase
      .from('custom_parts')
      .select('*')
      .eq('company_id', profile.company_id)
      .order('created_at', { ascending: false });
    setParts(data || []);
    setLoading(false);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!partNumber.trim()) { setError('Vul een artikelnummer in.'); return; }
    if (!profile?.company_id) { setError('Je bent niet gekoppeld aan een bedrijfsaccount.'); return; }
    setSaving(true); setError('');
    if (editingId) {
      const { error } = await supabase.from('custom_parts').update({ part_number: partNumber.trim(), name: partName.trim() || null, name_en: partNameEn.trim() || null }).eq('id', editingId);
      if (error) { setError(error.message); setSaving(false); return; }
    } else {
      const { error } = await supabase.from('custom_parts').insert({ company_id: profile.company_id, part_number: partNumber.trim(), name: partName.trim() || null, name_en: partNameEn.trim() || null });
      if (error) { setError(error.code === '23505' ? 'Dit artikelnummer bestaat al.' : error.message); setSaving(false); return; }
    }
    setSaving(false);
    setPartNumber(''); setPartName(''); setPartNameEn(''); setEditingId(null);
    loadParts();
  }

  function startEdit(p) {
    setEditingId(p.id);
    setPartNumber(p.part_number);
    setPartName(p.name || '');
    setPartNameEn(p.name_en || '');
  }

  async function deletePart(id) {
    if (!confirm('Onderdeel verwijderen?')) return;
    await supabase.from('custom_parts').delete().eq('id', id);
    loadParts();
  }

  async function addToCart(part) {
    await addItem({ customPartId: part.id });
    setCartMsg(`${part.part_number} toegevoegd aan winkelwagen`);
    setTimeout(() => setCartMsg(''), 3000);
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={40} /></div>;

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Mijn onderdelen</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 32 }}>Vaste artikelnummers voor snelle nabestelling.</p>

      {cartMsg && <Alert type="success" message={cartMsg} />}

      {!profile?.company_id ? (
        <Card style={{ padding: 32, textAlign: 'center' }}>
          <p style={{ color: 'var(--color-text-muted)' }}>Je bent nog niet gekoppeld aan een bedrijfsaccount. Ga naar je profiel om een bedrijf aan te maken of te joinen.</p>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
          {/* Lijst */}
          <div>
            {parts.length === 0 ? (
              <Card style={{ textAlign: 'center', padding: 40 }}>
                <p style={{ fontSize: 36, marginBottom: 12 }}>🔧</p>
                <h3 style={{ marginBottom: 8 }}>Nog geen onderdelen</h3>
                <p style={{ color: 'var(--color-text-muted)' }}>Voeg je vaste artikelnummers toe voor snelle nabestelling.</p>
              </Card>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {parts.map(part => (
                  <Card key={part.id} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600 }}>{part.name || part.part_number}</p>
                      <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>Nr. {part.part_number}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => addToCart(part)} style={{ padding: '6px 14px', borderRadius: 'var(--radius-md)', border: 'none', backgroundColor: 'var(--color-primary)', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>+ Winkelwagen</button>
                      <button onClick={() => startEdit(part)} style={{ padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'none', cursor: 'pointer', fontSize: 13 }}>✏</button>
                      <button onClick={() => deletePart(part.id)} style={{ padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', background: 'none', cursor: 'pointer', fontSize: 13 }}>✕</button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Formulier */}
          <Card>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>{editingId ? 'Onderdeel bewerken' : 'Onderdeel toevoegen'}</h3>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Input label="Artikelnummer *" value={partNumber} onChange={setPartNumber} placeholder="bv. 12345-AB" />
              <Input label="Naam (Nederlands)" value={partName} onChange={setPartName} placeholder="bv. Filter element" />
              <Input label="Naam (Engels)" value={partNameEn} onChange={setPartNameEn} placeholder="e.g. Filter element" />
              <Alert type="error" message={error} />
              <div style={{ display: 'flex', gap: 10 }}>
                <Button type="submit" loading={saving}>{editingId ? 'Opslaan' : 'Toevoegen'}</Button>
                {editingId && <Button type="button" variant="secondary" onClick={() => { setEditingId(null); setPartNumber(''); setPartName(''); setPartNameEn(''); }}>Annuleren</Button>}
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
