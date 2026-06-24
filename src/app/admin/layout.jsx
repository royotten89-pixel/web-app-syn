'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/orders', label: 'Bestellingen', icon: '📦' },
  { href: '/admin/service', label: 'Service aanvragen', icon: '🔧' },
  { href: '/admin/machines', label: 'Machinetypes', icon: '⚙' },
  { href: '/admin/customers', label: 'Klanten', icon: '👥' },
];

function AdminNav() {
  const { profile, signOut, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && (!profile || profile.role !== 'admin') && !pathname.includes('/login')) {
      router.push('/admin/login');
    }
  }, [loading, profile, pathname]);

  if (pathname.includes('/login')) return null;
  if (loading || !profile) return null;

  return (
    <aside style={{ width: 240, backgroundColor: 'var(--color-primary)', minHeight: '100vh', position: 'fixed', left: 0, top: 0, display: 'flex', flexDirection: 'column' }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>S</span>
          </div>
          <div>
            <p style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Synergy Systems</p>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>Back-office</p>
          </div>
        </div>
      </div>

      {/* Navigatie */}
      <nav style={{ flex: 1, padding: '16px 12px' }}>
        {NAV.map(item => {
          const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 'var(--radius-md)', marginBottom: 4, backgroundColor: active ? 'rgba(255,255,255,0.15)' : 'transparent', color: active ? '#fff' : 'rgba(255,255,255,0.7)', fontWeight: active ? 600 : 400, fontSize: 14, textDecoration: 'none', transition: 'all 0.15s' }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Gebruiker */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 4 }}>{profile?.full_name}</p>
        <button onClick={signOut} style={{ color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, padding: 0 }}>Uitloggen</button>
      </div>
    </aside>
  );
}

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const isLogin = pathname.includes('/login');

  return (
    <AuthProvider>
      <div style={{ display: 'flex' }}>
        <AdminNav />
        <main style={{ marginLeft: isLogin ? 0 : 240, flex: 1, minHeight: '100vh', padding: isLogin ? 0 : '32px 40px', backgroundColor: 'var(--color-bg)' }}>
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}
