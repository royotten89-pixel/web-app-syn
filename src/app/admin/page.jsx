'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Card, Badge, Spinner } from '@/components/ui';

const statusLabels = { new: 'Nieuw', in_behandeling: 'In behandeling', besteld: 'Besteld', ingepland: 'Ingepland', afgerond: 'Afgerond', geannuleerd: 'Geannuleerd' };

function StatCard({ label, value, icon, color = 'var(--color-primary)' }) {
  return (
    <Card style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <div style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{icon}</div>
      <div>
        <p style={{ fontSize: 28, fontWeight: 700, color }}>{value}</p>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{label}</p>
      </div>
    </Card>
  );
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
      supabase.from('part_orders').select('id, quantity, status, created_at, parts(name, part_number), machines(nickname, machine_types(name)), profiles(full_name, company_name)').order('created_at', { ascending: false }).limit(5),
      supabase.from('service_requests').select('id, description, urgency, status, created_at, machines(nickname, machine_types(name)), profiles(full_name)').order('created_at', { ascending: false }).limit(5),
      supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'customer'),
      supabase.from('machines').select('id', { count: 'exact' }),
    ]);
    const newOrders = ordersRes.data?.filter(o => o.status === 'new').length || 0;
    const newService = serviceRes.data?.filter(s => s.status === 'new').length || 0;
    setStats({ newOrders, newService, customers: customersRes.count || 0, machines: machinesRes.count || 0 });
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
        <StatCard label="Nieuwe bestelorders" value={stats.newOrders} icon="📦" color="var(--color-warning)" />
        <StatCard label="Nieuwe serviceaanvragen" value={stats.newService} icon="🔧" color="var(--color-danger)" />
        <StatCard label="Klanten" value={stats.customers} icon="👥" />
        <StatCard label="Machines geregistreerd" value={stats.machines} icon="⚙" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <Link href="/admin/orders" style={{ textDecoration: 'none', color: 'inherit' }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Recente bestellingen</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recentOrders.map(order => (
              <Card key={order.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 14 }}>{order.quantity}× {order.parts?.name}</p>
                    <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>{order.profiles?.company_name || order.profiles?.full_name} · {formatDate(order.created_at)}</p>
                  </div>
                  <Badge status={order.status} label={statusLabels[order.status]} />
                </div>
              </Card>
            ))}
          </div>
        </div>
          <Link href="/admin/service" style={{ textDecoration: 'none', color: 'inherit' }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Recente service-aanvragen</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recentService.map(req => (
              <Card key={req.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 14 }}>{req.description?.substring(0, 60)}{req.description?.length > 60 ? '...' : ''}</p>
                    <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>{req.profiles?.full_name} · {formatDate(req.created_at)}</p>
                  </div>
                  <Badge status={req.status} label={statusLabels[req.status]} />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
