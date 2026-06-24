'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button, Card, Input, Spinner, Alert } from '@/components/ui';

export default function AdminMachineTypeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;
  const imageInputRef = useRef(null);
  const pdfInputRef = useRef(null);

  const [machineType, setMachineType] = useState(null);
  const [manuals, setManuals] = useState([]);
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [partNumber, setPartNumber] = useState('');
  const [partName, setPartName] = useState('');
  const [partNameEn, setPartNameEn] = useState('');
  const [partDescription, setPartDescription] = useState('');
  const [editingPartId, setEditingPartId] = useState(null);
  const [savingPart, setSavingPart] = useState(false);
  const [partError, setPartError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  useEffect(() => { if (id) loadData(); }, [id]);

  async function loadData() {
    const [tRes, mRes, pRes] = await Promise.all([
      supabase.from('machine_types').select('*').eq('id', id).single(),
      supabase.from('manuals').select('*').eq('machine_type_id', id).order('uploaded_at', { ascending: false }),
      supabase.from('parts').select('*').eq('machine_type_id', id).order('part_number'),
    ]);
    setMachineType(tRes.data);
    setManuals(mRes.data || []);
    setParts(pRes.data || []);
    setLoading(false);
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Reset
    setUploadError('');
    setUploadSuccess('');
    setUploadingImage(true);

    try {
      const ext = file.name.split('.').pop().toLowerCase();
      const allowedExts = ['jpg', 'jpeg', 'png', 'webp'];
      if (!allowedExts.includes(ext)) {
        throw new Error('Alleen JPG, PNG of WebP bestanden zijn toegestaan.');
      }

      const path = `${id}/foto_${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('machine-images')
        .upload(path, file, { contentType: file.type, upsert: true });

      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage.from('machine-images').getPublicUrl(path);
      const { error: updateErr } = await supabase.from('machine_types').update({ image_url: urlData.publicUrl }).eq('id', id);
      if (updateErr) throw updateErr;

      setUploadSuccess('Foto opgeslagen.');
      await loadData();
    } catch (err) {
      setUploadError('Foto upload mislukt: ' + (err.message || 'Onbekende fout'));
    } finally {
      setUploadingImage(false);
      // Reset de file input zodat hetzelfde bestand opnieuw geselecteerd kan worden
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  }

  async function handlePdfUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');
    setUploadSuccess('');
    setUploadingPdf(true);

    try {
      if (file.type !== 'application/pdf') {
        throw new Error('Alleen PDF bestanden zijn toegestaan.');
      }
      if (file.size > 50 * 1024 * 1024) {
        throw new Error('Bestand is te groot (max 50MB).');
      }

      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${id}/${Date.now()}_${safeName}`;

      const { error: upErr } = await supabase.storage
        .from('manuals')
        .upload(path, file, { contentType: 'application/pdf' });

      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage.from('manuals').getPublicUrl(path);
      const { error: insertErr } = await supabase.from('manuals').insert({
        machine_type_id: id,
        title: file.name,
        file_url: urlData.publicUrl,
      });
      if (insertErr) throw insertErr;

      setUploadSuccess('PDF handleiding geüpload.');
      await loadData();
    } catch (err) {
      setUploadError('PDF upload mislukt: ' + (err.message || 'Onbekende fout'));
    } finally {
      setUploadingPdf(false);
      if (pdfInputRef.current) pdfInputRef.current.value = '';
    }
  }

  async function handleDeleteManual(manualId, fileUrl) {
    if (!confirm('Handleiding verwijderen?')) return;
    // Verwijder uit storage
    const urlParts = fileUrl.split('/manuals/');
    if (urlParts[1]) {
      await supabase.storage.from('manuals').remove([decodeURIComponent(urlParts[1])]);
    }
    await supabase.from('manuals').delete().eq('id', manualId);
    loadData();
  }

  async function handleSavePart(e) {
    e.preventDefault();
    if (!partNumber.trim() || !partName.trim()) { setPartError('Vul minimaal onderdeelnummer en naam in.'); return; }
    setSavingPart(true); setPartError('');
    if (editingPartId) {
      const { error } = await supabase.from('parts').update({ part_number: partNumber.trim(), name: partName.trim(), name_en: partNameEn.trim() || null, description: partDescription.trim() || null }).eq('id', editingPartId);
      if (error) { setPartError(error.message); setSavingPart(false); return; }
    } else {
      const { error } = await supabase.from('parts').insert({ machine_type_id: id, part_number: partNumber.trim(), name: partName.trim(), name_en: partNameEn.trim() || null, description: partDescription.trim() || null });
      if (error) { setPartError(error.code === '23505' ? 'Dit onderdeelnummer bestaat al.' : error.message); setSavingPart(false); return; }
    }
    setSavingPart(false);
    setPartNumber(''); setPartName(''); setPartNameEn(''); setPartDescription(''); setEditingPartId(null);
    loadData();
  }

  function startEdit(p) {
    setEditingPartId(p.id);
    setPartNumber(p.part_number);
    setPartName(p.name || '');
    setPartNameEn(p.name_en || '');
    setPartDescription(p.description || '');
    setPartError('');
  }

  async function deletePart(partId) {
    if (!confirm('Onderdeel verwijderen?')) return;
    await supabase.from('parts').delete().eq('id', partId);
    loadData();
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={40} /></div>;
  if (!machineType) return null;

  return (
    <div>
      <button onClick={() => router.push('/admin/machines')} style={{ color: 'var(--color-text-muted)', fontSize: 14, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20 }}>
        ← Terug naar machinetypes
      </button>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 32 }}>{machineType.name}</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 28, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Foto upload */}
          <Card>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Foto</h2>
            {machineType.image_url && (
              <img src={machineType.image_url} alt="" style={{ width: '100%', borderRadius: 'var(--radius-md)', marginBottom: 12, objectFit: 'cover', maxHeight: 200 }} />
            )}
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8 }}>
                Toegestaan: JPG, PNG, WebP · Max 10MB
              </p>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
                id="image-upload"
              />
              <label htmlFor="image-upload">
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-alt)', cursor: uploadingImage ? 'not-allowed' : 'pointer', opacity: uploadingImage ? 0.6 : 1, fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {uploadingImage ? '⏳ Uploaden...' : machineType.image_url ? '📷 Foto vervangen' : '📷 Foto uploaden'}
                </div>
              </label>
            </div>
            {uploadError && uploadError.includes('Foto') && <Alert type="error" message={uploadError} />}
            {uploadSuccess && uploadSuccess.includes('Foto') && <Alert type="success" message={uploadSuccess} />}
          </Card>

          {/* PDF upload */}
          <Card>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Handleidingen</h2>
            {manuals.map(m => (
              <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                <a href={m.file_url} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: 'var(--color-primary)', fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {m.title}
                </a>
                <button onClick={() => handleDeleteManual(m.id, m.file_url)} style={{ color: 'var(--color-danger)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, marginLeft: 8, flexShrink: 0 }}>✕</button>
              </div>
            ))}
            <div style={{ marginTop: 12 }}>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8 }}>
                Alleen PDF · Max 50MB
              </p>
              <input
                ref={pdfInputRef}
                type="file"
                accept="application/pdf"
                onChange={handlePdfUpload}
                style={{ display: 'none' }}
                id="pdf-upload"
              />
              <label htmlFor="pdf-upload">
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-alt)', cursor: uploadingPdf ? 'not-allowed' : 'pointer', opacity: uploadingPdf ? 0.6 : 1, fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {uploadingPdf ? '⏳ Uploaden...' : '📄 PDF uploaden'}
                </div>
              </label>
            </div>
            {uploadError && uploadError.includes('PDF') && <Alert type="error" message={uploadError} />}
            {uploadSuccess && uploadSuccess.includes('PDF') && <Alert type="success" message={uploadSuccess} />}
          </Card>
        </div>

        {/* Onderdelen */}
        <Card>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Onderdelen ({parts.length})</h2>
          <div style={{ overflowX: 'auto', marginBottom: 24 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-surface-alt)' }}>
                  {['Nr.', 'Naam (NL)', 'Naam (EN)', 'Omschrijving', ''].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parts.length === 0
                  ? <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-muted)' }}>Nog geen onderdelen.</td></tr>
                  : parts.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontWeight: 600 }}>{p.part_number}</td>
                      <td style={{ padding: '10px 12px' }}>{p.name}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--color-text-muted)' }}>{p.name_en || '—'}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--color-text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.description || '—'}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => startEdit(p)} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--color-border)', background: 'none', cursor: 'pointer' }}>✏ Bewerken</button>
                          <button onClick={() => deletePart(p.id)} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--color-danger)', color: 'var(--color-danger)', background: 'none', cursor: 'pointer' }}>✕</button>
                        </div>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>

          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>{editingPartId ? '✏ Onderdeel bewerken' : '+ Nieuw onderdeel'}</h3>
            <form onSubmit={handleSavePart} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Onderdeelnummer *" value={partNumber} onChange={setPartNumber} placeholder="bv. ABC-1234" autoCapitalize="characters" />
              <div />
              <Input label="Naam (Nederlands) *" value={partName} onChange={setPartName} placeholder="bv. Aandrijfriem" />
              <Input label="Naam (Engels)" value={partNameEn} onChange={setPartNameEn} placeholder="e.g. Drive belt" />
              <div style={{ gridColumn: '1/-1' }}>
                <Input label="Omschrijving (optioneel)" value={partDescription} onChange={setPartDescription} multiline rows={2} />
              </div>
              {partError && <div style={{ gridColumn: '1/-1' }}><Alert type="error" message={partError} /></div>}
              <div style={{ gridColumn: '1/-1', display: 'flex', gap: 12 }}>
                <Button type="submit" loading={savingPart}>{editingPartId ? 'Opslaan' : 'Toevoegen'}</Button>
                {editingPartId && (
                  <Button type="button" variant="secondary" onClick={() => { setEditingPartId(null); setPartNumber(''); setPartName(''); setPartNameEn(''); setPartDescription(''); setPartError(''); }}>
                    Annuleren
                  </Button>
                )}
              </div>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
