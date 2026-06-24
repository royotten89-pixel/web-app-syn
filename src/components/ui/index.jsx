'use client';

import { useState } from 'react';

// ── Button ──────────────────────────────────────────────────
export function Button({ children, onClick, variant = 'primary', type = 'button', loading, disabled, size = 'md', style }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    fontWeight: 600, border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer',
    transition: 'all 0.15s', fontFamily: 'var(--font-sans)',
    opacity: loading || disabled ? 0.6 : 1,
    pointerEvents: loading || disabled ? 'none' : 'auto',
    ...(size === 'sm' ? { padding: '6px 12px', fontSize: 13 } : { padding: '10px 20px', fontSize: 15 }),
    ...(size === 'lg' ? { padding: '14px 28px', fontSize: 16 } : {}),
  };
  const variants = {
    primary: { backgroundColor: 'var(--color-primary)', color: '#fff' },
    secondary: { backgroundColor: 'var(--color-surface-alt)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' },
    danger: { backgroundColor: 'var(--color-danger)', color: '#fff' },
    ghost: { backgroundColor: 'transparent', color: 'var(--color-primary)', border: '1px solid var(--color-primary)' },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled || loading} style={{ ...base, ...variants[variant], ...style }}>
      {loading ? <Spinner size={16} color={variant === 'secondary' || variant === 'ghost' ? 'var(--color-primary)' : '#fff'} /> : null}
      {children}
    </button>
  );
}

// ── Input ────────────────────────────────────────────────────
export function Input({ label, value, onChange, placeholder, type = 'text', required, multiline, rows = 3, error, autoCapitalize = 'off' }) {
  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)',
    border: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-border)'}`,
    fontSize: 15, color: 'var(--color-text-primary)', backgroundColor: 'var(--color-surface)',
    outline: 'none', resize: multiline ? 'vertical' : 'none',
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', letterSpacing: 0.3 }}>{label}{required && <span style={{ color: 'var(--color-danger)', marginLeft: 2 }}>*</span>}</label>}
      {multiline
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} style={inputStyle} />
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} autoCapitalize={autoCapitalize} style={inputStyle} />
      }
      {error && <span style={{ fontSize: 13, color: 'var(--color-danger)' }}>{error}</span>}
    </div>
  );
}

// ── Select ───────────────────────────────────────────────────
export function Select({ label, value, onChange, options, placeholder }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>{label}</label>}
      <select value={value} onChange={e => onChange(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 15, color: 'var(--color-text-primary)', backgroundColor: 'var(--color-surface)', outline: 'none' }}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// ── Card ─────────────────────────────────────────────────────
export function Card({ children, style, onClick, padding = 20 }) {
  return (
    <div onClick={onClick} style={{ backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-md)', padding, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border)', cursor: onClick ? 'pointer' : 'default', transition: onClick ? 'box-shadow 0.15s' : 'none', ...style }}
      onMouseEnter={e => onClick && (e.currentTarget.style.boxShadow = 'var(--shadow-md)')}
      onMouseLeave={e => onClick && (e.currentTarget.style.boxShadow = 'var(--shadow-sm)')}>
      {children}
    </div>
  );
}

// ── Badge ────────────────────────────────────────────────────
const statusColors = {
  new: { bg: '#FEF3C7', text: '#92400E' },
  in_behandeling: { bg: '#DBEAFE', text: '#1E40AF' },
  besteld: { bg: '#E0E7FF', text: '#3730A3' },
  ingepland: { bg: '#E0E7FF', text: '#3730A3' },
  afgerond: { bg: '#D1FAE5', text: '#065F46' },
  geannuleerd: { bg: '#FEE2E2', text: '#991B1B' },
};

export function Badge({ status, label }) {
  const colors = statusColors[status] || { bg: 'var(--color-surface-alt)', text: 'var(--color-text-muted)' };
  const displayLabel = label || status;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700, backgroundColor: colors.bg, color: colors.text }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: colors.text, display: 'inline-block' }} />
      {displayLabel}
    </span>
  );
}

// ── Spinner ──────────────────────────────────────────────────
export function Spinner({ size = 24, color = 'var(--color-primary)' }) {
  return (
    <div style={{ width: size, height: size, border: `2px solid ${color}33`, borderTopColor: color, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Alert ────────────────────────────────────────────────────
export function Alert({ type = 'error', message }) {
  if (!message) return null;
  const styles = {
    error: { bg: 'var(--color-danger-light)', color: 'var(--color-danger)', border: 'var(--color-danger)' },
    success: { bg: '#D1FAE5', color: '#065F46', border: '#065F46' },
    info: { bg: '#DBEAFE', color: '#1E40AF', border: '#1E40AF' },
  };
  const s = styles[type] || styles.error;
  return (
    <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}33`, fontSize: 14 }}>
      {message}
    </div>
  );
}

// ── Modal ────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }} onClick={onClose}>
      <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', padding: 28, width: '100%', maxWidth: 520, boxShadow: 'var(--shadow-lg)', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        {title && <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, color: 'var(--color-text-primary)' }}>{title}</h2>}
        {children}
        <div style={{ marginTop: 20, textAlign: 'right' }}>
          <Button variant="secondary" onClick={onClose} size="sm">Sluiten</Button>
        </div>
      </div>
    </div>
  );
}

// ── Table ────────────────────────────────────────────────────
export function Table({ columns, rows, onRowClick, emptyMessage = 'Geen gegevens.' }) {
  return (
    <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'var(--color-surface)' }}>
        <thead>
          <tr style={{ backgroundColor: 'var(--color-surface-alt)' }}>
            {columns.map(col => (
              <th key={col.key} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: 'var(--color-text-secondary)', letterSpacing: 0.5, whiteSpace: 'nowrap', borderBottom: '1px solid var(--color-border)' }}>
                {col.label.toUpperCase()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={columns.length} style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 14 }}>{emptyMessage}</td></tr>
          ) : rows.map((row, i) => (
            <tr key={row.id || i} onClick={() => onRowClick?.(row)} style={{ borderBottom: '1px solid var(--color-border)', cursor: onRowClick ? 'pointer' : 'default', transition: 'background 0.1s' }}
              onMouseEnter={e => onRowClick && (e.currentTarget.style.backgroundColor = 'var(--color-surface-alt)')}
              onMouseLeave={e => onRowClick && (e.currentTarget.style.backgroundColor = 'transparent')}>
              {columns.map(col => (
                <td key={col.key} style={{ padding: '12px 16px', fontSize: 14, color: 'var(--color-text-primary)', whiteSpace: col.wrap ? 'normal' : 'nowrap' }}>
                  {col.render ? col.render(row) : row[col.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Tabs ─────────────────────────────────────────────────────
export function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 4, backgroundColor: 'var(--color-surface-alt)', padding: 4, borderRadius: 'var(--radius-md)', width: 'fit-content' }}>
      {tabs.map(tab => (
        <button key={tab.key} onClick={() => onChange(tab.key)} style={{ padding: '8px 18px', borderRadius: 'var(--radius-sm)', border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s', backgroundColor: active === tab.key ? 'var(--color-surface)' : 'transparent', color: active === tab.key ? 'var(--color-primary)' : 'var(--color-text-muted)', boxShadow: active === tab.key ? 'var(--shadow-sm)' : 'none' }}>
          {tab.label}
        </button>
      ))}
    </div>
  );
}
