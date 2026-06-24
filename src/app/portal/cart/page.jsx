'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';
import { Button, Card, Input, Alert, Spinner } from '@/components/ui';

export default function CartPage() {
  const { session, profile } = useAuth();
  const { items, loading, totalItems, updateQuantity, removeItem, clearCart } = useCart();
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (!items.length) return;
    setSubmitting(true); setError('');

    const regularItems = items.filter(i => i.parts);
    const customItems = items.filter(i => i.custom_parts);

    // Reguliere onderdelen → part_orders
    if (regularItems.length > 0) {
      const orders = regularItems.map(i => ({
        customer_id: session.user.id,
        machine_id: i.machines?.id,
        part_id: i.parts.id,
        quantity: i.quantity,
        note: note.trim() || null,
      }));
      const { error: ordErr } = await supabase.from('part_orders').insert(orders);
      if (ordErr) { setError(ordErr.message); setSubmitting(false); return; }
    }

    // Eigen onderdelen → custom_part_orders
    if (customItems.length > 0 && profile?.company_id) {
      const customOrders = customItems.map(i => ({
        customer_id: session.user.id,
        company_id: profile.company_id,
        custom_part_id: i.custom_parts.id,
        quantity: i.quantity,
        note: note.trim() || null,
      }));
      const { error: custErr } = await supabase.from('custom_part_orders').insert(customOrders);
      if (custErr) { setError(custErr.message); setSubmitting(false); return; }
    }

    await clearCart();
    setSubmitting(false);
    setSuccess('Bestelaanvraag verstuurd! We nemen contact op voor bevestiging.');
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={40} /></div>;

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Winkelwagen</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 24 }}>
        {totalItems === 0 ? 'Leeg' : `${totalItems} onderdeel${totalItems !== 1 ? 'en' : ''}`}
      </p>

      {success ? (
        <Card style={{ textAlign: 'center', padding: 48 }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>✅</p>
          <h3 style={{ marginBottom: 8 }}>Aanvraag verstuurd</h3>
          <p style={{ color: 'var(--color-text-muted)' }}>We nemen zo snel mogelijk contact op ter bevestiging.</p>
        </Card>
      ) : items.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 48 }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>🛒</p>
          <h3 style={{ marginBottom: 8 }}>Je winkelwagen is leeg</h3>
          <p style={{ color: 'var(--color-text-muted)' }}>Voeg onderdelen toe via een machine of via "Mijn onderdelen".</p>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {items.map(item => {
              const part = item.parts || item.custom_parts;
              const machineName = item.machines?.nickname || item.machines?.machine_types?.name;
              const isCustom = !!item.custom_parts;
              return (
                <Card key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600 }}>{part?.name || part?.part_number}</p>
                    <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>Nr. {part?.part_number}</p>
                    <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                      {isCustom ? 'Eigen onderdeel' : `${machineName} · SN ${item.machines?.serial_number}`}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: 'var(--color-surface-alt)', borderRadius: 'var(--radius-md)', padding: '4px 8px' }}>
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} style={{ width: 28, height: 28, border: 'none', background: 'none', cursor: 'pointer', fontSize: 18 }}>−</button>
                      <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 600 }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} style={{ width: 28, height: 28, border: 'none', background: 'none', cursor: 'pointer', fontSize: 18 }}>+</button>
                    </div>
                    <button onClick={() => removeItem(item.id)} style={{ color: 'var(--color-danger)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>✕</button>
                  </div>
                </Card>
              );
            })}
          </div>

          <Card>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Samenvatting</h3>
            <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 16 }}>
              {items.length} {items.length === 1 ? 'onderdeel' : 'verschillende onderdelen'}, {totalItems} {totalItems === 1 ? 'stuk' : 'stuks'} totaal
            </p>
            <Input label="Opmerking (optioneel)" value={note} onChange={setNote} placeholder="bv. graag zo spoedig mogelijk" multiline rows={3} />
            <Alert type="error" message={error} />
            <Button onClick={handleSubmit} loading={submitting} style={{ width: '100%', marginTop: 16 }}>
              Aanvraag versturen ({totalItems})
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
