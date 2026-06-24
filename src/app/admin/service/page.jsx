'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Badge, Modal, Button, Select, Input, Spinner, Card, Table } from '@/components/ui';

const STATUS_OPTIONS = [
  { value: 'new', label: 'Nieuw' },
  { value: 'in_behandeling', label: 'In behandeling' },
  { value: 'ingepland', label: 'Ingepland' },
  { value: 'afgerond', label: 'Afgerond' },
  { value: 'geannuleerd', label: 'Geannuleerd' },
];

const statusLabels = { new: 'Nieuw', in_behandeling: 'In behandeling', ingepland: 'Ingepland', afgerond: 'Afgerond', geannuleerd: 'Geannuleerd' };
const urgencyLabels = { urgent: '🚨 Spoed', soon: '⚡ Zo snel mogelijk', normal: '📅 Nabije toekomst' };
const urgencyOrder = { urgent: 0, soon: 1, normal: 2 };

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminServicePage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data } = await supabase
      .from('service_requests')
      .select(`
        id, description, urgency, status, created_at, preferred_date,
        machines(serial_number, nickname, machine_types(name)),
        profiles!customer_id(id, full_name,
          companies(name, customer_number))
      `)
      .order('created_at', { ascending: false });

    // Sorteer op urgentie dan datum
    const sorted = (data || []).sort((a, b) => {
      if (a.status === 'new' && b.status !== 'new') return -1;
      if (b.status === 'new' && a.status !== 'new') return 1;
      const urgDiff = (urgencyOrder[a.urgency] || 2) - (urgencyOrder[b.urgency] || 2);
      if (urgDiff !== 0) return urgDiff;
      return new Date(b.created_at) - new Date(a.created_at);
    });

    setRequests(sorted);
    setLoading(false);
  }

  const filtered = requests.filter(r => {
    const q = search.toLowerCase();
    const company = r.profiles?.companies?.name || r.profiles?.full_name || '';
    const matchesSearch = !q || company.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q);
    const matchesStatus = !statusFilter || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      key: 'urgency', label: 'Urgentie',
      render: r => <span style={{ fontSize: 13, fontWeight: 600 }}>{urgencyLabels[r.urgency] || r.urgency}</span>
    },
    {
      key: 'customer', label: 'Klant',
      render: r => (
        <div>
          <p style={{ fontWeight: 600 }}>{r.profiles?.companies?.name || r.profiles?.full_name || '—'}</p>
          {r.profiles?.companies?.customer_number && (
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>KL. {r.profiles.companies.customer_number}</p>
          )}
        </div>
      )
    },
    {
      key: 'description', label: 'Omschrijving',
      render: r => <p style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.description}</p>
    },
    {
      key: 'machine', label: 'Machine',
      render: r => r.machines
        ? <span>{r.machines.nickname || r.machines.machine_types?.name}<br /><span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>SN {r.machines.serial_number}</span></span>
        : <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Algemene aanvraag</span>
    },
    { key: 'created_at', label: 'Datum', render: r => formatDate(r.created_at) },
    { key: 'preferred_date', label: 'Gewenst', render: r => r.preferred_date ? formatDate(r.preferred_date) : '—' },
    { key: 'status', label: 'Status', render: r => <Badge status={r.status} label={statusLabels[r.status]} /> },
  ];

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={40} /></div>;

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Service aanvragen</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 24 }}>
        {requests.filter(r => r.status === 'new').length} nieuwe aanvragen · gesorteerd op urgentie
      </p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <Input value={search} onChange={setSearch} placeholder="Zoek op bedrijf of omschrijving..." />
        </div>
        <div style={{ width: 200 }}>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={[{ value: '', label: 'Alle statussen' }, ...STATUS_OPTIONS]}
          />
        </div>
      </div>

      <Table
        columns={columns}
        rows={filtered}
        onRowClick={r => { setSelected(r); setNewStatus(r.status); }}
        emptyMessage="Geen service-aanvragen gevonden."
      />

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Service aanvraag">
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: 16, backgroundColor: 'var(--color-surface-alt)', borderRadius: 'var(--radius-md)', fontSize: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p><strong>Klant:</strong> {selected.profiles?.companies?.name || selected.profiles?.full_name}</p>
              {selected.profiles?.companies?.customer_number && (
                <p><strong>Klantnummer:</strong> {selected.profiles.companies.customer_number}</p>
              )}
              <p><strong>Urgentie:</strong> {urgencyLabels[selected.urgency]}</p>
              <p><strong>Omschrijving:</strong> {selected.description}</p>
              <p><strong>Machine:</strong> {selected.machines ? `${selected.machines.nickname || selected.machines.machine_types?.name} · SN ${selected.machines.serial_number}` : 'Algemene aanvraag'}</p>
              {selected.preferred_date && <p><strong>Gewenste datum:</strong> {formatDate(selected.preferred_date)}</p>}
              <p><strong>Aangevraagd:</strong> {formatDate(selected.created_at)}</p>
            </div>
            <Select label="Nieuwe status" value={newStatus} onChange={setNewStatus} options={STATUS_OPTIONS} />
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setSelected(null)}>Annuleren</Button>
              <Button onClick={async () => {
                setSaving(true);
                await supabase.from('service_requests').update({ status: newStatus }).eq('id', selected.id);
                setSaving(false);
                setSelected(null);
                loadData();
              }} loading={saving}>Opslaan</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
