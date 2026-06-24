'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, Table, Modal, Input, Button, Alert, Spinner, Badge, Select } from '@/components/ui';

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });
}

const statusLabels = { new: 'Nieuw', in_behandeling: 'In behandeling', besteld: 'Besteld', ingepland: 'Ingepland', afgerond: 'Afgerond', geannuleerd: 'Geannuleerd' };
const urgencyLabels = { urgent: '🚨 Spoed', soon: '⚡ Snel', normal: '📅 Normaal' };

export default function AdminCustomersPage() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [machines, setMachines] = useState([]);
  const [machineTypes, setMachineTypes] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [customerNumber, setCustomerNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('machines');
  const [showAddMachine, setShowAddMachine] = useState(false);
  const [addMachineType, setAddMachineType] = useState('');
  const [addSerial, setAddSerial] = useState('');
  const [addNickname, setAddNickname] = useState('');
  const [addingMachine, setAddingMachine] = useState(false);
  const [addMachineError, setAddMachineError] = useState('');
  const [orders, setOrders] = useState([]);
  const [serviceReqs, setServiceReqs] = useState([]);

  useEffect(() => { loadData(); loadMachineTypes(); }, []);

  async function loadData() {
    const { data } = await supabase.from('companies').select('id, name, customer_number, created_at, profiles(id, full_name, role, is_company_admin)').order('name');
    setCompanies(data || []);
    setLoading(false);
  }

  async function loadMachineTypes() {
    const { data } = await supabase.from('machine_types').select('id, name').order('name');
    setMachineTypes(data || []);
  }

  async function openCompany(company) {
    setSelected(company);
    setCustomerNumber(company.customer_number || '');
    setSaveMsg(''); setActiveTab('machines'); setShowAddMachine(false);
    setLoadingDetail(true);
    const customerIds = company.profiles?.map(p => p.id) || [];
    const [machinesRes, ordersRes, serviceRes] = await Promise.all([
      supabase.from('machines').select('id, serial_number, nickname, registered_at, machine_types(name)').eq('company_id', company.id).order('registered_at', { ascending: false }),
      customerIds.length > 0 ? supabase.from('part_orders').select('id, quantity, status, created_at, parts(name, part_number)').in('customer_id', customerIds).order('created_at', { ascending: false }).limit(20) : Promise.resolve({ data: [] }),
      customerIds.length > 0 ? supabase.from('service_requests').select('id, description, urgency, status, created_at').in('customer_id', customerIds).order('created_at', { ascending: false }).limit(20) : Promise.resolve({ data: [] }),
    ]);
    setMachines(machinesRes.data || []);
    setOrders(ordersRes.data || []);
    setServiceReqs(serviceRes.data || []);
    setLoadingDetail(false);
  }

  async function handleSaveNumber(e) {
    e.preventDefault(); setSaving(true); setSaveMsg('');
    const { error } = await supabase.from('companies').update({ customer_number: customerNumber.trim() || null }).eq('id', selected.id);
    setSaving(false);
    if (error) { setSaveMsg('Fout: ' + error.message); return; }
    setSaveMsg('Opgeslagen.'); loadData();
  }

  async function handleAddMachine(e) {
    e.preventDefault();
    if (!addMachineType) { setAddMachineError('Kies een machinetype.'); return; }
    if (!addSerial.trim()) { setAddMachineError('Vul het serienummer in.'); return; }
    setAddingMachine(true); setAddMachineError('');
    const ownerProfile = selected.profiles?.find(p => p.is_company_admin) || selected.profiles?.[0];
    if (!ownerProfile) { setAddMachineError('Geen gebruikers gevonden voor dit bedrijf.'); setAddingMachine(false); return; }
    const { error } = await supabase.from('machines').insert({ owner_id: ownerProfile.id, company_id: selected.id, machine_type_id: addMachineType, serial_number: addSerial.trim(), nickname: addNickname.trim() || null });
    setAddingMachine(false);
    if (error) { setAddMachineError(error.code === '23505' ? 'Dit serienummer bestaat al voor dit type.' : error.message); return; }
    setAddSerial(''); setAddNickname(''); setAddMachineType(''); setShowAddMachine(false);
    openCompany(selected);
  }

  async function handleDeleteMachine(machineId) {
    if (!confirm('Machine verwijderen voor deze klant?')) return;
    await supabase.from('machines').delete().eq('id', machineId);
    openCompany(selected);
  }

  const filtered = companies.filter(c => {
    const q = search.toLowerCase();
    return !q || c.name?.toLowerCase().includes(q) || c.customer_number?.toLowerCase().includes(q);
  });

  const companyColumns = [
    { key: 'name', label: 'Bedrijf' },
    { key: 'customer_number', label: 'Klantnummer', render: r => r.customer_number || <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>—</span> },
    { key: 'users', label: 'Gebruikers', render: r => r.profiles?.length || 0 },
    { key: 'created_at', label: 'Aangemaakt', render: r => formatDate(r.created_at) },
  ];

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={40} /></div>;

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Klanten</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 24 }}>Klik op een bedrijf voor details en beheer.</p>
      <div style={{ marginBottom: 20 }}>
        <Input value={search} onChange={setSearch} placeholder="Zoek op bedrijfsnaam of klantnummer..." />
      </div>
      <Table columns={companyColumns} rows={filtered} onRowClick={openCompany} emptyMessage="Geen klanten gevonden." />

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.name}>
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Klantnummer (ERP)</h3>
                <form onSubmit={handleSaveNumber} style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1 }}><Input value={customerNumber} onChange={setCustomerNumber} placeholder="bv. 10234" /></div>
                  <Button type="submit" loading={saving} size="sm">OK</Button>
                </form>
                {saveMsg && <p style={{ fontSize: 12, color: 'var(--color-success)', marginTop: 6 }}>{saveMsg}</p>}
              </div>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Gebruikers</h3>
                {selected.profiles?.map(p => (
                  <div key={p.id} style={{ fontSize: 13, padding: '4px 0', display: 'flex', gap: 8, alignItems: 'center' }}>
                    {p.full_name}
                    {p.is_company_admin && <span style={{ fontSize: 10, backgroundColor: 'var(--color-primary)', color: '#fff', padding: '1px 6px', borderRadius: 4 }}>admin</span>}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--color-border)' }}>
              {[['machines', `Machines (${machines.length})`], ['orders', `Bestellingen (${orders.length})`], ['service', `Service (${serviceReqs.length})`]].map(([key, label]) => (
                <button key={key} onClick={() => setActiveTab(key)} style={{ padding: '8px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, fontWeight: activeTab === key ? 700 : 400, color: activeTab === key ? 'var(--color-primary)' : 'var(--color-text-muted)', borderBottom: activeTab === key ? '2px solid var(--color-primary)' : '2px solid transparent', marginBottom: -1 }}>
                  {label}
                </button>
              ))}
            </div>

            {loadingDetail ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}><Spinner size={24} /></div>
            ) : activeTab === 'machines' ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                  <Button size="sm" onClick={() => setShowAddMachine(!showAddMachine)}>+ Machine toevoegen</Button>
                </div>
                {showAddMachine && (
                  <Card style={{ marginBottom: 16, backgroundColor: 'var(--color-surface-alt)' }}>
                    <form onSubmit={handleAddMachine} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <Select label="Machinetype *" value={addMachineType} onChange={setAddMachineType} options={machineTypes.map(t => ({ value: t.id, label: t.name }))} placeholder="Kies een type..." />
                      <Input label="Serienummer *" value={addSerial} onChange={setAddSerial} placeholder="bv. SN-2024-00123" autoCapitalize="characters" />
                      <Input label="Eigen naam (optioneel)" value={addNickname} onChange={setAddNickname} placeholder="bv. Lijn 2 - hal B" />
                      {addMachineError && <Alert type="error" message={addMachineError} />}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Button type="submit" loading={addingMachine} size="sm">Toevoegen</Button>
                        <Button type="button" variant="secondary" size="sm" onClick={() => setShowAddMachine(false)}>Annuleren</Button>
                      </div>
                    </form>
                  </Card>
                )}
                {machines.length === 0
                  ? <p style={{ fontSize: 14, color: 'var(--color-text-muted)', textAlign: 'center', padding: 20 }}>Geen machines geregistreerd.</p>
                  : machines.map(m => (
                    <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--color-border)', fontSize: 14 }}>
                      <div>
                        <p style={{ fontWeight: 500 }}>{m.nickname || m.machine_types?.name}</p>
                        <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{m.machine_types?.name} · SN {m.serial_number} · {formatDate(m.registered_at)}</p>
                      </div>
                      <button onClick={() => handleDeleteMachine(m.id)} style={{ color: 'var(--color-danger)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, padding: '4px 8px' }}>Verwijderen</button>
                    </div>
                  ))
                }
              </div>
            ) : activeTab === 'orders' ? (
              <div>
                {orders.length === 0 ? <p style={{ fontSize: 14, color: 'var(--color-text-muted)', textAlign: 'center', padding: 20 }}>Geen bestellingen.</p>
                  : orders.map(o => (
                    <div key={o.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14 }}>
                      <div>
                        <p>{o.quantity}× {o.parts?.name} <span style={{ color: 'var(--color-text-muted)' }}>({o.parts?.part_number})</span></p>
                        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>{formatDate(o.created_at)}</p>
                      </div>
                      <Badge status={o.status} label={statusLabels[o.status]} />
                    </div>
                  ))
                }
              </div>
            ) : (
              <div>
                {serviceReqs.length === 0 ? <p style={{ fontSize: 14, color: 'var(--color-text-muted)', textAlign: 'center', padding: 20 }}>Geen service aanvragen.</p>
                  : serviceReqs.map(s => (
                    <div key={s.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14 }}>
                      <div>
                        <p style={{ fontSize: 12, color: 'var(--color-warning)', fontWeight: 600, marginBottom: 2 }}>{urgencyLabels[s.urgency]}</p>
                        <p>{s.description?.substring(0, 60)}{s.description?.length > 60 ? '...' : ''}</p>
                        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>{formatDate(s.created_at)}</p>
                      </div>
                      <Badge status={s.status} label={statusLabels[s.status]} />
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
