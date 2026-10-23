import React from 'react';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'live';

export const Badge: React.FC<{
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  style?: React.CSSProperties;
}> = ({ children, variant = 'default', className = '', style = {} }) => {
  const styles: Record<BadgeVariant, React.CSSProperties> = {
    default: { background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' },
    success: { background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' },
    warning: { background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' },
    danger: { background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' },
    info: { background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd' },
    live: { background: '#fee2e2', color: '#dc2626', border: '1px solid #f87171', fontWeight: 700 },
  };

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: '0.2rem 0.55rem',
        borderRadius: 'var(--radius-xs)',
        fontSize: '0.75rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        ...styles[variant],
        ...style,
      }}
    >
      {variant === 'live' && (
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: '#dc2626',
            display: 'inline-block',
          }}
        />
      )}
      {children}
    </span>
  );
};
