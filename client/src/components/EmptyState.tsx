import React from 'react';
import { FolderOpen } from 'lucide-react';

export const EmptyState: React.FC<{
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}> = ({ title, description, icon, action }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3.5rem 1.5rem',
        textAlign: 'center',
        background: '#ffffff',
        border: '1px dashed var(--color-border)',
        borderRadius: 'var(--radius-md)',
        color: 'var(--color-text-muted)',
        width: '100%',
      }}
    >
      <div style={{ marginBottom: '1rem', color: '#94a3b8' }}>
        {icon || <FolderOpen size={42} strokeWidth={1.5} />}
      </div>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.35rem' }}>
        {title}
      </h3>
      {description && (
        <p style={{ fontSize: '0.875rem', maxWidth: '380px', marginBottom: action ? '1.25rem' : 0 }}>
          {description}
        </p>
      )}
      {action && <div style={{ marginTop: '0.75rem' }}>{action}</div>}
    </div>
  );
};
