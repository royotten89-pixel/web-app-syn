'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button, Card, Input, Alert } from '@/components/ui';

export default function ProfilePage() {
  const { session, profile, company, signOut, sendPasswordReset, createCompanyForUser, generateInviteCode, joinWithCode, refreshProfile } = useAuth();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPw, setChangingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState('');
  const [pwError, setPwError] = useState('');

  const [customerNumber, setCustomerNumber] = useState('');
  const [savingNumber, setSavingNumber] = useState(false);
  const [numberMsg, setNumberMsg] = useState('');

  const [newCompanyName, setNewCompanyName] = useState('');
  const [creatingCompany, setCreatingCompany] = useState(false);
  const [companyError, setCompanyError] = useState('');

  const [joinCode, setJoinCode] = useState('');
  const [joiningCode, setJoiningCode] = useState(false);
  const [joinMsg, setJoinMsg] = useState('');

  const [inviteCode, setInviteCode] = useState('');
  const [generatingCode, setGeneratingCode] = useState(false);

  useEffect(() => {
    if (company?.customer_number) setCustomerNumber(company.customer_number);
  }, [company]);

  async function handleChangePassword(e) {
    e.preventDefault();
    if (newPassword.length < 6) { setPwError('Minimaal 6 tekens.'); return; }
    if (newPassword !== confirmPassword) { setPwError('Wachtwoorden komen niet overeen.'); return; }
    setChangingPw(true); setPwError('');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPw(false);
    if (error) { setPwError(error.message); return; }
    setPwMsg('Wachtwoord gewijzigd.'); setNewPassword(''); setConfirmPassword('');
  }

  async function handleSaveNumber(e) {
    e.preventDefault();
    if (!company?.id) return;
    setSavingNumber(true);
    await supabase.from('companies').update({ customer_number: customerNumber.trim() || null }).eq('id', company.id);
    setSavingNumber(false);
    setNumberMsg('Klantnummer opgeslagen.');
    await refreshProfile();
  }

  async function handleCreateCompany(e) {
    e.preventDefault();
    if (!newCompanyName.trim()) return;
    setCreatingCompany(true); setCompanyError('');
    const { error } = await createCompanyForUser(newCompanyName.trim());
    setCreatingCompany(false);
    if (error) { setCompanyError(error.message); return; }
    setNewCompanyName('');
  }

  async function handleJoin(e) {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setJoiningCode(true);
    const { error } = await joinWithCode(joinCode);
    setJoiningCode(false);
    if (error) { setJoinMsg('Code niet gevonden of verlopen.'); return; }
    setJoinMsg('Je bent toegevoegd aan het bedrijf!'); setJoinCode('');
  }

  async function handleGenerateInvite() {
    setGeneratingCode(true);
    const { data, error } = await generateInviteCode();
    setGeneratingCode(false);
    if (!error && data) setInviteCode(data.invite_code);
  }

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 32 }}>Mijn profiel</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
        {/* Gegevens */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Card>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Accountgegevens</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 2 }}>NAAM</p>
                <p>{profile?.full_name || '—'}</p>
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 2 }}>E-MAILADRES</p>
                <p>{session?.user?.email}</p>
              </div>
              {company && (
                <>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 2 }}>BEDRIJF</p>
                    <p>{company.name}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 2 }}>KLANTNUMMER</p>
                    <p>{company.customer_number || <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Niet ingesteld</span>}</p>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Klantnummer bewerken */}
          {company && (
            <Card>
              <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Klantnummer</h2>
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16 }}>ERP-klantnummer zoals toegekend door Synergy Systems.</p>
              <form onSubmit={handleSaveNumber} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Input value={customerNumber} onChange={setCustomerNumber} placeholder="bv. 10234" />
                {numberMsg && <Alert type="success" message={numberMsg} />}
                <Button type="submit" variant="secondary" loading={savingNumber}>Opslaan</Button>
              </form>
            </Card>
          )}

          <Button variant="secondary" onClick={signOut} style={{ width: '100%' }}>Uitloggen</Button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Wachtwoord wijzigen */}
          <Card>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Wachtwoord wijzigen</h2>
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Input label="Nieuw wachtwoord" type="password" value={newPassword} onChange={setNewPassword} placeholder="Minimaal 6 tekens" />
              <Input label="Bevestigen" type="password" value={confirmPassword} onChange={setConfirmPassword} placeholder="Herhaal wachtwoord" />
              {pwError && <Alert type="error" message={pwError} />}
              {pwMsg && <Alert type="success" message={pwMsg} />}
              <Button type="submit" variant="secondary" loading={changingPw}>Wachtwoord wijzigen</Button>
            </form>
          </Card>

          {/* Bedrijf aanmaken of joinen */}
          {!profile?.company_id && (
            <>
              <Card>
                <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Bedrijf aanmaken</h2>
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16 }}>Je bent nog niet gekoppeld aan een bedrijfsaccount.</p>
                <form onSubmit={handleCreateCompany} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Input value={newCompanyName} onChange={setNewCompanyName} placeholder="Naam van je bedrijf" />
                  {companyError && <Alert type="error" message={companyError} />}
                  <Button type="submit" loading={creatingCompany}>Bedrijf aanmaken</Button>
                </form>
              </Card>

              <Card>
                <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Joinen met uitnodigingscode</h2>
                <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Input value={joinCode} onChange={setJoinCode} placeholder="8-tekens code van collega" autoCapitalize="none" />
                  {joinMsg && <Alert type={joinMsg.includes('!') ? 'success' : 'error'} message={joinMsg} />}
                  <Button type="submit" variant="secondary" loading={joiningCode}>Joinen</Button>
                </form>
              </Card>
            </>
          )}

          {/* Uitnodigingscode genereren (bedrijfsadmin) */}
          {profile?.is_company_admin && (
            <Card>
              <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Collega uitnodigen</h2>
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16 }}>Genereer een code die collega's kunnen gebruiken om bij jullie bedrijfsaccount te joinen.</p>
              {inviteCode && (
                <div style={{ backgroundColor: 'var(--color-surface-alt)', borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 16, textAlign: 'center' }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 6 }}>UITNODIGINGSCODE</p>
                  <p style={{ fontSize: 28, fontWeight: 800, letterSpacing: 6, color: 'var(--color-primary)' }}>{inviteCode}</p>
                  <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 8 }}>Geldig voor 7 dagen</p>
                </div>
              )}
              <Button variant="secondary" loading={generatingCode} onClick={handleGenerateInvite}>
                {inviteCode ? 'Nieuwe code genereren' : 'Code genereren'}
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
