'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Input, Alert, Card } from '@/components/ui';

export default function AdminLoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    const { data, error } = await signIn({ email: email.trim(), password });
    setLoading(false);
    if (error) { setError('Inloggen mislukt.'); return; }
    if (data?.user) {
      const { createClient } = await import('@/lib/supabase');
      const sb = createClient();
      const { data: profile } = await sb.from('profiles').select('role').eq('id', data.user.id).single();
      if (profile?.role !== 'admin') { setError('Je hebt geen toegang tot het beheerdersdeel.'); await sb.auth.signOut(); return; }
    }
    router.push('/admin');
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-primary)', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 24 }}>S</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>Synergy Back-office</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: 6 }}>Alleen voor beheerders</p>
        </div>
        <Card>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input label="E-mailadres" type="email" value={email} onChange={setEmail} placeholder="admin@synergy-systems.nl" autoCapitalize="none" />
            <Input label="Wachtwoord" type="password" value={password} onChange={setPassword} placeholder="••••••••" />
            <Alert type="error" message={error} />
            <Button type="submit" loading={loading} style={{ width: '100%' }}>Inloggen</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
