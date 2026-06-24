'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Input, Alert, Card } from '@/components/ui';

export default function RegisterPage() {
  const { signUp } = useAuth();
  const [mode, setMode] = useState('new');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!fullName || !email || !password) { setError('Vul alle verplichte velden in.'); return; }
    if (password.length < 6) { setError('Wachtwoord moet minimaal 6 tekens zijn.'); return; }
    if (password !== confirmPassword) { setError('Wachtwoorden komen niet overeen.'); return; }
    if (mode === 'new' && !companyName) { setError('Vul een bedrijfsnaam in.'); return; }
    setError('');
    setLoading(true);
    const { error, needsEmailConfirmation } = await signUp({ email: email.trim(), password, fullName, companyName, createNewCompany: mode === 'new', inviteCode: mode === 'join' ? inviteCode : null });
    setLoading(false);
    if (error) { setError(error.message || 'Registreren mislukt.'); return; }
    setSuccess(needsEmailConfirmation ? 'Bijna klaar! Controleer je e-mail en klik op de bevestigingslink om je account te activeren.' : 'Account aangemaakt. Je kunt nu inloggen.');
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-bg)', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 460 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, backgroundColor: 'var(--color-primary)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 24 }}>S</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700 }}>Account aanmaken</h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: 6 }}>Registreer om je machines te koppelen en onderdelen te bestellen.</p>
        </div>

        <Card>
          {success ? (
            <Alert type="success" message={success} />
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Input label="Naam *" value={fullName} onChange={setFullName} placeholder="Voor- en achternaam" />
              <Input label="E-mailadres *" type="email" value={email} onChange={setEmail} placeholder="naam@bedrijf.nl" autoCapitalize="none" />
              <Input label="Wachtwoord *" type="password" value={password} onChange={setPassword} placeholder="Minimaal 6 tekens" />
              <Input label="Wachtwoord bevestigen *" type="password" value={confirmPassword} onChange={setConfirmPassword} placeholder="Herhaal je wachtwoord" />

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 8 }}>BEDRIJFSACCOUNT</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[['new', 'Nieuw bedrijf'], ['join', 'Joinen met code']].map(([m, label]) => (
                    <button key={m} type="button" onClick={() => setMode(m)} style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-md)', border: `1.5px solid ${mode === m ? 'var(--color-primary)' : 'var(--color-border)'}`, backgroundColor: mode === m ? 'var(--color-primary)' + '14' : 'var(--color-surface)', fontWeight: 600, fontSize: 13, cursor: 'pointer', color: 'var(--color-text-primary)' }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {mode === 'new'
                ? <Input label="Bedrijfsnaam *" value={companyName} onChange={setCompanyName} placeholder="Naam van je bedrijf" />
                : <Input label="Uitnodigingscode" value={inviteCode} onChange={setInviteCode} placeholder="8-tekens code van collega" autoCapitalize="none" />
              }

              <Alert type="error" message={error} />
              <Button type="submit" loading={loading} style={{ width: '100%' }}>Registreren</Button>
            </form>
          )}
        </Card>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--color-text-muted)' }}>
          Al een account? <Link href="/portal/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Inloggen</Link>
        </p>
      </div>
    </div>
  );
}
