'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, Badge, Tabs, Spinner } from '@/components/ui';

const statusLabels = { new: 'Nieuw', in_behandeling: 'In behandeling', besteld: 'Besteld', ingepland: 'Ingepland', afgerond: 'Afgerond', geannuleerd: 'Geannuleerd' };
const urgencyLabels = { urgent: '🚨 Spoed', soon: '⚡ Zo snel mogelijk', normal: '📅 Nabije toekomst' };

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function RequestsPage() {
  const { session } = useAuth();
  const [tab, setTab] = useState('parts');
  const [partOrders, setPartOrders] = useState([]);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) loadData();
  }, [session]);

  async function loadData() {
    const [oRes, sRes] = await Promise.all([
      supabase.from('part_orders')
        .select('id, quantity, status, created_at, note, parts(name, part_number), machines(nickname, machine_types(name))')
        .eq('customer_id', session.user.id)
        .order('created_at', { ascending: false }),
      supabase.from('service_requests')
        .select('id, description, urgency, status, created_at, preferred_date, machines(nickname, machine_types(name))')
        .eq('customer_id', session.user.id)
        .order('created_at', { ascending: false }),
    ]);
    setPartOrders(oRes.data || []);
    setServiceRequests(sRes.data || []);
    setLoading(false);
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={40} /></div>;

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>Mijn aanvragen</h1>

      <div style={{ marginBottom: 24 }}>
        <Tabs
          tabs={[
            { key: 'parts', label: `Onderdelen bestellingen (${partOrders.length})` },
            { key: 'service', label: `Service aanvragen (${serviceRequests.length})` },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      {tab === 'parts' ? (
        partOrders.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: 48 }}>
            <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>Geen bestelaanvragen gevonden.</p>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {partOrders.map(order => (
              <Card key={order.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <p style={{ fontWeight: 600 }}>
                      {order.quantity}× {order.parts?.name}
                      <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}> ({order.parts?.part_number})</span>
                    </p>
                    <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>
                      {order.machines?.nickname || order.machines?.machine_types?.name}
                    </p>
                    {order.note && (
                      <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4, fontStyle: 'italic' }}>"{order.note}"</p>
                    )}
                  </div>
                  <Badge status={order.status} label={statusLabels[order.status]} />
                </div>
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Aangevraagd op {formatDate(order.created_at)}</p>
              </Card>
            ))}
          </div>
        )
      ) : (
        serviceRequests.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: 48 }}>
            <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>Geen service aanvragen gevonden.</p>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {serviceRequests.map(req => (
              <Card key={req.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ flex: 1, marginRight: 16 }}>
                    <p style={{ fontSize: 12, color: 'var(--color-warning)', fontWeight: 700, marginBottom: 4 }}>
                      {urgencyLabels[req.urgency]}
                    </p>
                    <p style={{ fontWeight: 600 }}>{req.description}</p>
                    <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>
                      {req.machines ? (req.machines.nickname || req.machines.machine_types?.name) : 'Algemene aanvraag'}
                    </p>
                  </div>
                  <Badge status={req.status} label={statusLabels[req.status]} />
                </div>
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                  Aangevraagd op {formatDate(req.created_at)}
                  {req.preferred_date ? ` · Gewenst: ${formatDate(req.preferred_date)}` : ''}
                </p>
              </Card>
            ))}
          </div>
        )
      )}
    </div>
  );
}
