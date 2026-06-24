'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Input, Alert, Card } from '@/components/ui';

export default function LoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) { setError('Vul je e-mailadres en wachtwoord in.'); return; }
    setError('');
    setLoading(true);
    const { error } = await signIn({ email: email.trim(), password });
    setLoading(false);
    if (error) { setError('Inloggen mislukt. Controleer je e-mailadres en wachtwoord.'); return; }
    router.push('/portal/machines');
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-bg)', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, backgroundColor: 'var(--color-primary)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 24 }}>S</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--color-text-primary)' }}>Welkom terug</h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: 6, fontSize: 15 }}>Log in om je machines en onderdelen te beheren.</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input label="E-mailadres" type="email" value={email} onChange={setEmail} placeholder="naam@bedrijf.nl" required autoCapitalize="none" />
            <Input label="Wachtwoord" type="password" value={password} onChange={setPassword} placeholder="••••••••" required />
            <div style={{ textAlign: 'right', marginTop: -8 }}>
              <Link href="/portal/forgot-password" style={{ fontSize: 13, color: 'var(--color-primary)', fontWeight: 600 }}>Wachtwoord vergeten?</Link>
            </div>
            <Alert type="error" message={error} />
            <Button type="submit" loading={loading} style={{ width: '100%' }}>Inloggen</Button>
          </form>
        </Card>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--color-text-muted)' }}>
          Nog geen account? <Link href="/portal/register" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Registreren</Link>
        </p>
      </div>
    </div>
  );
}
