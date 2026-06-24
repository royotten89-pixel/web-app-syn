'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button, Input, Alert, Card } from '@/components/ui';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase stuurt de gebruiker terug met een sessie in de URL-hash
    // na het klikken op de reset-link. We wachten even tot de sessie geladen is.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
      else setError('Ongeldige of verlopen reset-link. Vraag opnieuw een reset-link aan.');
    });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password.length < 6) { setError('Wachtwoord moet minimaal 6 tekens zijn.'); return; }
    if (password !== confirmPassword) { setError('Wachtwoorden komen niet overeen.'); return; }
    setLoading(true); setError('');
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setSuccess('Wachtwoord succesvol gewijzigd! Je wordt doorgestuurd naar inloggen...');
    setTimeout(() => router.push('/portal/login'), 2500);
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-bg)', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, backgroundColor: 'var(--color-primary)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 24 }}>S</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Nieuw wachtwoord instellen</h1>
        </div>
        <Card>
          {success
            ? <Alert type="success" message={success} />
            : !ready
            ? <Alert type="error" message={error || 'Link valideren...'} />
            : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Input label="Nieuw wachtwoord" type="password" value={password} onChange={setPassword} placeholder="Minimaal 6 tekens" />
                <Input label="Bevestigen" type="password" value={confirmPassword} onChange={setConfirmPassword} placeholder="Herhaal wachtwoord" />
                <Alert type="error" message={error} />
                <Button type="submit" loading={loading} style={{ width: '100%' }}>Wachtwoord instellen</Button>
              </form>
            )
          }
        </Card>
      </div>
    </div>
  );
}
