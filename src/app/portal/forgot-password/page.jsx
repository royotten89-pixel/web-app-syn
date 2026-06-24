'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Input, Alert, Card } from '@/components/ui';

export default function ForgotPasswordPage() {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true); setError('');
    const { error } = await sendPasswordReset(email.trim());
    setLoading(false);
    if (error) { setError(error.message); return; }
    setSuccess('Reset-link verstuurd! Controleer je e-mail (ook spam).');
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-bg)', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Wachtwoord vergeten</h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: 6 }}>Vul je e-mailadres in. Je ontvangt een reset-link.</p>
        </div>
        <Card>
          {success ? <Alert type="success" message={success} /> : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Input label="E-mailadres" type="email" value={email} onChange={setEmail} placeholder="naam@bedrijf.nl" autoCapitalize="none" />
              <Alert type="error" message={error} />
              <Button type="submit" loading={loading} style={{ width: '100%' }}>Reset-link versturen</Button>
            </form>
          )}
        </Card>
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14 }}>
          <Link href="/portal/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>← Terug naar inloggen</Link>
        </p>
      </div>
    </div>
  );
}
