'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { CartProvider, useCart } from '@/contexts/CartContext';
import { LangProvider, useLang } from '@/contexts/LangContext';

function CartBadge() {
  const { totalItems } = useCart();
  if (totalItems === 0) return null;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 18, height: 18, backgroundColor: 'var(--color-danger)', color: '#fff', borderRadius: 999, fontSize: 11, fontWeight: 700, padding: '0 5px', marginLeft: 4 }}>
      {totalItems}
    </span>
  );
}

function NavLink({ href, children, badge }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + '/');
  return (
    <Link href={href} style={{ display: 'inline-flex', alignItems: 'center', padding: '8px 14px', borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 600, color: active ? 'var(--color-primary)' : 'var(--color-text-secondary)', backgroundColor: active ? 'var(--color-surface-alt)' : 'transparent', transition: 'all 0.15s', textDecoration: 'none', whiteSpace: 'nowrap' }}>
      {children}{badge}
    </Link>
  );
}

function ServiceDropdown() {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const pathname = usePathname();
  const active = pathname.startsWith('/portal/service');

  useEffect(() => {
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '8px 14px', borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 600, color: active ? 'var(--color-primary)' : 'var(--color-text-secondary)', backgroundColor: active ? 'var(--color-surface-alt)' : 'transparent', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
      >
        {t.service} <span style={{ fontSize: 10, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>▾</span>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--color-border)', minWidth: 220, zIndex: 200 }}>
          <Link href="/portal/service/machine" onClick={() => setOpen(false)} style={{ display: 'block', padding: '12px 16px', fontSize: 14, color: 'var(--color-text-primary)', textDecoration: 'none', borderBottom: '1px solid var(--color-border)' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-alt)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
            <p style={{ fontWeight: 600 }}>🔧 {t.serviceForMachine}</p>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>{lang === 'nl' ? 'Koppel aan een specifieke machine' : 'Link to a specific machine'}</p>
          </Link>
          <Link href="/portal/service/general" onClick={() => setOpen(false)} style={{ display: 'block', padding: '12px 16px', fontSize: 14, color: 'var(--color-text-primary)', textDecoration: 'none' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-alt)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
            <p style={{ fontWeight: 600 }}>📋 {t.serviceGeneral}</p>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>{lang === 'nl' ? 'Niet gekoppeld aan een machine' : 'Not linked to a machine'}</p>
          </Link>
        </div>
      )}
    </div>
  );
}

function LangSwitcher() {
  const { lang, setLang } = useLang();
  return (
    <div style={{ display: 'flex', gap: 4, backgroundColor: 'var(--color-surface-alt)', borderRadius: 'var(--radius-md)', padding: 3 }}>
      {['nl', 'en'].map(code => (
        <button key={code} onClick={() => setLang(code)} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, backgroundColor: lang === code ? 'var(--color-surface)' : 'transparent', color: lang === code ? 'var(--color-primary)' : 'var(--color-text-muted)', boxShadow: lang === code ? 'var(--shadow-sm)' : 'none' }}>
          {code === 'nl' ? '🇳🇱' : '🇬🇧'}
        </button>
      ))}
    </div>
  );
}

// Toegang tot lang buiten LangContext
let lang = 'nl';

function PortalNav() {
  const { profile, company, signOut, loading } = useAuth();
  const { t, lang: currentLang } = useLang();
  lang = currentLang; // update de module-level var voor ServiceDropdown
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const publicPaths = ['/login', '/register', '/forgot', '/reset-password'];
    const isPublic = publicPaths.some(p => pathname.includes(p));
    if (!loading && !profile && !isPublic) router.push('/portal/login');
  }, [loading, profile, pathname]);

  const isAuthPage = ['/login', '/register', '/forgot', '/reset-password'].some(p => pathname.includes(p));
  if (isAuthPage || loading || !profile) return null;

  return (
    <nav style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', position: 'sticky', top: 0, zIndex: 100, boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link href="/portal/machines" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginRight: 16 }}>
            <div style={{ width: 32, height: 32, backgroundColor: 'var(--color-primary)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>S</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--color-text-primary)' }}>Synergy</span>
          </Link>
          <NavLink href="/portal/machines">{t.machines}</NavLink>
          <NavLink href="/portal/parts">{t.myParts}</NavLink>
          <NavLink href="/portal/cart" badge={<CartBadge />}>{t.cart}</NavLink>
          <NavLink href="/portal/requests">{t.requests}</NavLink>
          <ServiceDropdown />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <LangSwitcher />
          <span style={{ fontSize: 13, color: 'var(--color-text-muted)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {company?.name || profile?.full_name}
          </span>
          <NavLink href="/portal/profile">{t.profile}</NavLink>
          <button onClick={signOut} style={{ padding: '6px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'transparent', fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
            {t.logout}
          </button>
        </div>
      </div>
    </nav>
  );
}

function PortalInner({ children }) {
  const { session } = useAuth();
  return (
    <CartProvider userId={session?.user?.id}>
      <LangProvider>
        <PortalNav />
        <main style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px' }}>
          {children}
        </main>
      </LangProvider>
    </CartProvider>
  );
}

export default function PortalLayout({ children }) {
  return (
    <AuthProvider>
      <PortalInner>{children}</PortalInner>
    </AuthProvider>
  );
}
