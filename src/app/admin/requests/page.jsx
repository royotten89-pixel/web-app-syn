'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Badge, Tabs, Table, Select, Modal, Button, Spinner, Input } from '@/components/ui';

const STATUS_OPTIONS_ORDERS = [
  { value: '', label: 'Alle statussen' },
  { value: 'new', label: 'Nieuw' },
  { value: 'in_behandeling', label: 'In behandeling' },
  { value: 'besteld', label: 'Besteld' },
  { value: 'afgerond', label: 'Afgerond' },
  { value: 'geannuleerd', label: 'Geannuleerd' },
];

const STATUS_OPTIONS_SERVICE = [
  { value: '', label: 'Alle statussen' },
  { value: 'new', label: 'Nieuw' },
  { value: 'in_behandeling', label: 'In behandeling' },
  { value: 'ingepland', label: 'Ingepland' },
  { value: 'afgerond', label: 'Afgerond' },
  { value: 'geannuleerd', label: 'Geannuleerd' },
];

const STATUS_UPDATE_OPTIONS_ORDERS = STATUS_OPTIONS_ORDERS.slice(1);
const STATUS_UPDATE_OPTIONS_SERVICE = STATUS_OPTIONS_SERVICE.slice(1);

const urgencyLabels = { urgent: '🚨 Spoed', soon: '⚡ Zo snel mogelijk', normal: '📅 Nabije toekomst' };
const statusLabels = { new: 'Nieuw', in_behandeling: 'In behandeling', besteld: 'Besteld', ingepland: 'Ingepland', afgerond: 'Afgerond', geannuleerd: 'Geannuleerd' };

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminRequestsPage() {
  const [tab, setTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [serviceReqs, setServiceReqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [oRes, sRes] = await Promise.all([
      supabase.from('part_orders').select('id, quantity, status, created_at, note, parts(name, part_number), machines(serial_number, nickname, machine_types(name)), profiles(full_name, company_name)').order('created_at', { ascending: false }),
      supabase.from('service_requests').select('id, description, urgency, status, created_at, preferred_date, machines(serial_number, nickname, machine_types(name)), profiles(full_name, company_name)').order('created_at', { ascending: false }),
    ]);
    setOrders(oRes.data || []);
    setServiceReqs(sRes.data || []);
    setLoading(false);
  }

  async function handleStatusChange() {
    if (!selected || !newStatus) return;
    setSaving(true);
    const table = tab === 'orders' ? 'part_orders' : 'service_requests';
    await supabase.from(table).update({ status: newStatus }).eq('id', selected.id);
    setSaving(false);
    setSelected(null);
    loadData();
  }

  function openDetail(row) { setSelected(row); setNewStatus(row.status); }

  // Filter logica
  const filterData = (data) => {
    return data.filter(item => {
      const q = search.toLowerCase();
      const matchesSearch = !q || (
        item.profiles?.full_name?.toLowerCase().includes(q) ||
        item.profiles?.company_name?.toLowerCase().includes(q) ||
        item.parts?.name?.toLowerCase().includes(q) ||
        item.parts?.part_number?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.machines?.serial_number?.toLowerCase().includes(q)
      );
      const matchesStatus = !statusFilter || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  };

  const filteredOrders = filterData(orders);
  const filteredService = filterData(serviceReqs);

  const orderColumns = [
    { key: 'created_at', label: 'Datum', render: r => formatDate(r.created_at) },
    { key: 'customer', label: 'Klant', render: r => <div><p style={{ fontWeight: 500 }}>{r.profiles?.company_name || r.profiles?.full_name || '—'}</p><p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{r.profiles?.full_name}</p></div> },
    { key: 'part', label: 'Onderdeel', render: r => <div><p>{r.parts?.name}</p><p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Nr. {r.parts?.part_number} · {r.quantity}×</p></div> },
    { key: 'machine', label: 'Machine', render: r => <div><p>{r.machines?.nickname || r.machines?.machine_types?.name}</p><p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>SN {r.machines?.serial_number}</p></div> },
    { key: 'status', label: 'Status', render: r => <Badge status={r.status} label={statusLabels[r.status]} /> },
  ];

  const serviceColumns = [
    { key: 'created_at', label: 'Datum', render: r => formatDate(r.created_at) },
    { key: 'customer', label: 'Klant', render: r => <div><p style={{ fontWeight: 500 }}>{r.profiles?.company_name || r.profiles?.full_name || '—'}</p></div> },
    { key: 'urgency', label: 'Urgentie', render: r => <span style={{ fontSize: 13 }}>{urgencyLabels[r.urgency] || r.urgency}</span> },
    { key: 'description', label: 'Omschrijving', render: r => <p style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.description}</p> },
    { key: 'machine', label: 'Machine', render: r => r.machines?.nickname || r.machines?.machine_types?.name },
    { key: 'status', label: 'Status', render: r => <Badge status={r.status} label={statusLabels[r.status]} /> },
  ];

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={40} /></div>;

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Aanvragen</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 24 }}>Klik op een rij om de status te wijzigen.</p>

      <div style={{ display: 'flex', gap: 16, marginBottom: 24, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <Input value={search} onChange={setSearch} placeholder="Zoek op klant, onderdeel, serienummer..." />
        </div>
        <div style={{ width: 200 }}>
          <Select value={statusFilter} onChange={setStatusFilter} options={tab === 'orders' ? STATUS_OPTIONS_ORDERS : STATUS_OPTIONS_SERVICE} placeholder="Alle statussen" />
        </div>
        <Tabs
          tabs={[
            { key: 'orders', label: `Bestellingen (${orders.filter(o => o.status === 'new').length} nieuw)` },
            { key: 'service', label: `Service (${serviceReqs.filter(s => s.status === 'new').length} nieuw)` },
          ]}
          active={tab}
          onChange={(t) => { setTab(t); setStatusFilter(''); setSearch(''); }}
        />
      </div>

      {tab === 'orders'
        ? <Table columns={orderColumns} rows={filteredOrders} onRowClick={openDetail} emptyMessage="Geen bestellingen gevonden." />
        : <Table columns={serviceColumns} rows={filteredService} onRowClick={openDetail} emptyMessage="Geen service-aanvragen gevonden." />
      }

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Status wijzigen">
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: 16, backgroundColor: 'var(--color-surface-alt)', borderRadius: 'var(--radius-md)', fontSize: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tab === 'orders' ? (
                <>
                  <p><strong>Klant:</strong> {selected.profiles?.company_name || selected.profiles?.full_name}</p>
                  <p><strong>Onderdeel:</strong> {selected.quantity}× {selected.parts?.name} ({selected.parts?.part_number})</p>
                  <p><strong>Machine:</strong> {selected.machines?.nickname || selected.machines?.machine_types?.name} · SN {selected.machines?.serial_number}</p>
                  {selected.note && <p><strong>Opmerking:</strong> {selected.note}</p>}
                  <p><strong>Aangevraagd:</strong> {formatDate(selected.created_at)}</p>
                </>
              ) : (
                <>
                  <p><strong>Klant:</strong> {selected.profiles?.company_name || selected.profiles?.full_name}</p>
                  <p><strong>Urgentie:</strong> {urgencyLabels[selected.urgency]}</p>
                  <p><strong>Omschrijving:</strong> {selected.description}</p>
                  <p><strong>Machine:</strong> {selected.machines?.nickname || selected.machines?.machine_types?.name}</p>
                  {selected.preferred_date && <p><strong>Gewenste datum:</strong> {formatDate(selected.preferred_date)}</p>}
                  <p><strong>Aangevraagd:</strong> {formatDate(selected.created_at)}</p>
                </>
              )}
            </div>
            <Select label="Nieuwe status" value={newStatus} onChange={setNewStatus} options={tab === 'orders' ? STATUS_UPDATE_OPTIONS_ORDERS : STATUS_UPDATE_OPTIONS_SERVICE} />
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
