'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
      else setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
      else { setProfile(null); setCompany(null); setLoading(false); }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function loadProfile(userId) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) {
      setProfile(data);
      if (data.company_id) {
        const { data: comp } = await supabase.from('companies').select('*').eq('id', data.company_id).single();
        setCompany(comp);
      }
    }
    setLoading(false);
  }

  async function signIn({ email, password }) {
    return await supabase.auth.signInWithPassword({ email, password });
  }

  async function signUp({ email, password, fullName, companyName, createNewCompany, inviteCode }) {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName, company_name: companyName } },
    });
    if (error || !data.user) return { data, error };
    const needsEmailConfirmation = !data.session;
    if (!needsEmailConfirmation) {
      await applyCompanySetup(data.user.id, { createNewCompany, companyName, inviteCode });
    } else {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`pending_company_${email.trim().toLowerCase()}`, JSON.stringify({ createNewCompany, companyName, inviteCode }));
      }
    }
    return { data, error, needsEmailConfirmation };
  }

  async function applyCompanySetup(userId, { createNewCompany, companyName, inviteCode }) {
    if (createNewCompany && companyName) {
      const { data: comp } = await supabase.from('companies').insert({ name: companyName }).select().single();
      if (comp) await supabase.from('profiles').update({ company_id: comp.id, is_company_admin: true }).eq('id', userId);
    } else if (inviteCode) {
      const { data: invite } = await supabase.from('company_invites').select('*').eq('invite_code', inviteCode.trim()).single();
      if (invite && new Date(invite.expires_at) > new Date()) {
        await supabase.from('profiles').update({ company_id: invite.company_id }).eq('id', userId);
      }
    }
  }

  async function signOut() { await supabase.auth.signOut(); }

  async function sendPasswordReset(email) {
    return await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/portal/reset-password` });
  }

  async function createCompanyForUser(companyName) {
    if (!session) return { error: { message: 'Niet ingelogd.' } };
    const { data: comp, error } = await supabase.from('companies').insert({ name: companyName }).select().single();
    if (error) return { error };
    await supabase.from('profiles').update({ company_id: comp.id, is_company_admin: true }).eq('id', session.user.id);
    await loadProfile(session.user.id);
    return { error: null };
  }

  async function generateInviteCode() {
    if (!profile?.company_id) return { error: { message: 'Geen bedrijf gekoppeld.' } };
    const { data, error } = await supabase.from('company_invites').insert({ company_id: profile.company_id, created_by: profile.id }).select().single();
    return { data, error };
  }

  async function joinWithCode(code) {
    const { data: invite } = await supabase.from('company_invites').select('*').eq('invite_code', code.trim()).single();
    if (!invite || new Date(invite.expires_at) < new Date()) return { error: { message: 'Code niet gevonden of verlopen.' } };
    const { error } = await supabase.from('profiles').update({ company_id: invite.company_id }).eq('id', session.user.id);
    if (!error) await loadProfile(session.user.id);
    return { error };
  }

  return (
    <AuthContext.Provider value={{ session, profile, company, loading, isAdmin: profile?.role === 'admin', isCompanyAdmin: profile?.is_company_admin, signIn, signUp, signOut, sendPasswordReset, createCompanyForUser, generateInviteCode, joinWithCode, refreshProfile: () => session && loadProfile(session.user.id) }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth moet binnen AuthProvider gebruikt worden');
  return ctx;
}
