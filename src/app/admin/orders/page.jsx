'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Badge, Modal, Button, Select, Input, Spinner, Card } from '@/components/ui';

const STATUS_OPTIONS = [
  { value: 'new', label: 'Nieuw' },
  { value: 'in_behandeling', label: 'In behandeling' },
  { value: 'besteld', label: 'Besteld' },
  { value: 'afgerond', label: 'Afgerond' },
  { value: 'geannuleerd', label: 'Geannuleerd' },
];

const statusLabels = { new: 'Nieuw', in_behandeling: 'In behandeling', besteld: 'Besteld', afgerond: 'Afgerond', geannuleerd: 'Geannuleerd' };

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// Groepeer losse order-regels per klant+datum combinatie
function groupOrders(orders) {
  const groups = {};
  orders.forEach(order => {
    // Groepeer op minuut zodat orders die tegelijk binnenkomen samen staan
    const minute = order.created_at?.substring(0, 16);
    const key = `${order.profiles?.id}_${minute}`;
    if (!groups[key]) {
      groups[key] = {
        id: key,
        created_at: order.created_at,
        customer: order.profiles,
        company: order.companies,
        machine: order.machines,
        status: order.status,
        note: order.note,
        items: [],
        // Gebruik het eerste id voor statuswijziging-referentie
        orderIds: [],
      };
    }
    groups[key].items.push(order);
    groups[key].orderIds.push(order.id);
  });
  return Object.values(groups).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data } = await supabase
      .from('part_orders')
      .select(`
        id, quantity, status, created_at, note,
        parts(name, part_number),
        machines(serial_number, nickname, machine_types(name)),
        profiles!customer_id(id, full_name, company_id,
          companies(name, customer_number))
      `)
      .order('created_at', { ascending: false });

    // Voeg company info toe aan elk order
    const enriched = (data || []).map(o => ({
      ...o,
      companies: o.profiles?.companies,
    }));

    setOrders(enriched);
    setLoading(false);
  }

  async function handleStatusChange() {
    if (!selected || !newStatus) return;
    setSaving(true);
    // Update alle orders in de groep
    await supabase.from('part_orders').update({ status: newStatus }).in('id', selected.orderIds);
    setSaving(false);
    setSelected(null);
    loadData();
  }

  const grouped = groupOrders(orders);

  const filtered = grouped.filter(g => {
    const q = search.toLowerCase();
    const company = g.company?.name || g.customer?.full_name || '';
    const matchesSearch = !q || company.toLowerCase().includes(q) ||
      g.items.some(i => i.parts?.name?.toLowerCase().includes(q) || i.parts?.part_number?.toLowerCase().includes(q));
    const matchesStatus = !statusFilter || g.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={40} /></div>;

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Bestellingen</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 24 }}>
        {grouped.filter(g => g.status === 'new').length} nieuwe bestellingen
      </p>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <Input value={search} onChange={setSearch} placeholder="Zoek op bedrijf of onderdeel..." />
        </div>
        <div style={{ width: 200 }}>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={[{ value: '', label: 'Alle statussen' }, ...STATUS_OPTIONS]}
          />
        </div>
      </div>

      {/* Bestellingen tabel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.length === 0 && (
          <Card style={{ textAlign: 'center', padding: 40 }}>
            <p style={{ color: 'var(--color-text-muted)' }}>Geen bestellingen gevonden.</p>
          </Card>
        )}
        {filtered.map(group => (
          <Card key={group.id} style={{ padding: 0, overflow: 'hidden' }}>
            {/* Bestelling header */}
            <div
              onClick={() => setExpanded(expanded === group.id ? null : group.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', cursor: 'pointer', backgroundColor: expanded === group.id ? 'var(--color-surface-alt)' : 'transparent' }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                  <p style={{ fontWeight: 700, fontSize: 15 }}>
                    {group.company?.name || group.customer?.full_name || '—'}
                  </p>
                  {group.company?.customer_number && (
                    <span style={{ fontSize: 12, backgroundColor: 'var(--color-surface-alt)', padding: '2px 8px', borderRadius: 4, color: 'var(--color-text-muted)' }}>
                      KL. {group.company.customer_number}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                  {group.items.length} onderdeel{group.items.length !== 1 ? 'en' : ''} ·{' '}
                  {group.items.reduce((s, i) => s + i.quantity, 0)} stuks ·{' '}
                  {formatDate(group.created_at)}
                </p>
                {group.note && (
                  <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4, fontStyle: 'italic' }}>
                    "{group.note}"
                  </p>
                )}
              </div>
              <Badge status={group.status} label={statusLabels[group.status]} />
              <button
                onClick={e => { e.stopPropagation(); setSelected(group); setNewStatus(group.status); }}
                style={{ padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}
              >
                Status wijzigen
              </button>
              <span style={{ color: 'var(--color-text-muted)', fontSize: 18, transition: 'transform 0.2s', transform: expanded === group.id ? 'rotate(180deg)' : 'none' }}>▾</span>
            </div>

            {/* Uitklapbare onderdelen */}
            {expanded === group.id && (
              <div style={{ borderTop: '1px solid var(--color-border)', padding: '12px 20px', backgroundColor: 'var(--color-surface-alt)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr>
                      {['Onderdeelnummer', 'Naam', 'Machine', 'Aantal'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '6px 12px', fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {group.items.map(item => (
                      <tr key={item.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '8px 12px', fontFamily: 'monospace' }}>{item.parts?.part_number}</td>
                        <td style={{ padding: '8px 12px' }}>{item.parts?.name}</td>
                        <td style={{ padding: '8px 12px', color: 'var(--color-text-muted)' }}>
                          {item.machines?.nickname || item.machines?.machine_types?.name} · SN {item.machines?.serial_number}
                        </td>
                        <td style={{ padding: '8px 12px', fontWeight: 600 }}>{item.quantity}×</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Status wijzigen modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Status wijzigen">
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: 16, backgroundColor: 'var(--color-surface-alt)', borderRadius: 'var(--radius-md)', fontSize: 14 }}>
              <p><strong>Klant:</strong> {selected.company?.name || selected.customer?.full_name}</p>
              <p style={{ marginTop: 6 }}><strong>Onderdelen:</strong> {selected.items.length} verschillende, {selected.items.reduce((s, i) => s + i.quantity, 0)} stuks</p>
              <p style={{ marginTop: 6 }}><strong>Datum:</strong> {formatDate(selected.created_at)}</p>
              {selected.note && <p style={{ marginTop: 6 }}><strong>Opmerking:</strong> {selected.note}</p>}
            </div>
            <Select label="Nieuwe status" value={newStatus} onChange={setNewStatus} options={STATUS_OPTIONS} />
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setSelected(null)}>Annuleren</Button>
              <Button onClick={handleStatusChange} loading={saving}>Opslaan</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
