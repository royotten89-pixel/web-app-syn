'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Card, Badge, Spinner } from '@/components/ui';

const statusLabels = { new: 'Nieuw', in_behandeling: 'In behandeling', besteld: 'Besteld', ingepland: 'Ingepland', afgerond: 'Afgerond', geannuleerd: 'Geannuleerd' };
const urgencyLabels = { urgent: '🚨 Spoed', soon: '⚡ Zo snel mogelijk', normal: '📅 Nabije toekomst' };

function StatCard({ label, value, icon, color = 'var(--color-primary)', href }) {
  const inner = (
    <Card style={{ display: 'flex', alignItems: 'center', gap: 20, cursor: href ? 'pointer' : 'default' }}>
      <div style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{icon}</div>
      <div>
        <p style={{ fontSize: 28, fontWeight: 700, color }}>{value}</p>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{label}</p>
      </div>
    </Card>
  );
  if (href) return <Link href={href} style={{ textDecoration: 'none' }}>{inner}</Link>;
  return inner;
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({ newOrders: 0, newService: 0, customers: 0, machines: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentService, setRecentService] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [ordersRes, serviceRes, customersRes, machinesRes] = await Promise.all([
      supabase.from('part_orders').select('id, quantity, status, created_at, parts(name, part_number), profiles!customer_id(full_name, company_name)').order('created_at', { ascending: false }).limit(5),
      supabase.from('service_requests').select('id, description, urgency, status, created_at, profiles!customer_id(full_name)').order('created_at', { ascending: false }).limit(5),
      supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'customer'),
      supabase.from('machines').select('id', { count: 'exact' }),
    ]);
    setStats({
      newOrders: ordersRes.data?.filter(o => o.status === 'new').length || 0,
      newService: serviceRes.data?.filter(s => s.status === 'new').length || 0,
      customers: customersRes.count || 0,
      machines: machinesRes.count || 0,
    });
    setRecentOrders(ordersRes.data || []);
    setRecentService(serviceRes.data || []);
    setLoading(false);
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={40} /></div>;

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Dashboard</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 32 }}>Overzicht van de meest recente activiteit.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 40 }}>
        <StatCard label="Nieuwe bestellingen" value={stats.newOrders} icon="📦" color="var(--color-warning)" href="/admin/orders" />
        <StatCard label="Nieuwe service aanvragen" value={stats.newService} icon="🔧" color="var(--color-danger)" href="/admin/service" />
        <StatCard label="Klanten" value={stats.customers} icon="👥" href="/admin/customers" />
        <StatCard label="Machines geregistreerd" value={stats.machines} icon="⚙" href="/admin/machines" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600 }}>Recente bestellingen</h2>
            <Link href="/admin/orders" style={{ fontSize: 13, color: 'var(--color-primary)', fontWeight: 600 }}>Alles bekijken →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recentOrders.length === 0
              ? <Card><p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Geen bestellingen.</p></Card>
              : recentOrders.map(order => (
                <Card key={order.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 14 }}>{order.quantity}× {order.parts?.name}</p>
                      <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                        {order.profiles?.company_name || order.profiles?.full_name} · {formatDate(order.created_at)}
                      </p>
                    </div>
                    <Badge status={order.status} label={statusLabels[order.status]} />
                  </div>
                </Card>
              ))
            }
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600 }}>Recente service aanvragen</h2>
            <Link href="/admin/service" style={{ fontSize: 13, color: 'var(--color-primary)', fontWeight: 600 }}>Alles bekijken →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recentService.length === 0
              ? <Card><p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Geen service aanvragen.</p></Card>
              : recentService.map(req => (
                <Card key={req.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, marginRight: 12 }}>
                      <p style={{ fontSize: 11, color: 'var(--color-warning)', fontWeight: 700, marginBottom: 4 }}>{urgencyLabels[req.urgency]}</p><p style={{ fontWeight: 600, fontSize: 14 }}>{req.description?.substring(0, 60)}{req.description?.length > 60 ? '...' : ''}</p>
                      <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                        {req.profiles?.full_name} · {formatDate(req.created_at)}
                      </p>
                    </div>
                    <Badge status={req.status} label={statusLabels[req.status]} />
                  </div>
                </Card>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}
