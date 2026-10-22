import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Mail, Send, CheckCircle, Copy, AlertCircle } from 'lucide-react';
import { apiRequest } from '../../lib/api';

const inviteSchema = z.object({
  email: z.string().email('Please enter a valid email address').trim().toLowerCase(),
  role: z.enum(['ADMIN', 'ORGANIZER', 'COACH', 'ATHLETE', 'SCORER']),
});

type InviteFormData = z.infer<typeof inviteSchema>;

export const InvitationsManagement: React.FC = () => {
  const [createdInvite, setCreatedInvite] = useState<{ inviteUrl?: string; email: string; role: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: '', role: 'COACH' },
  });

  const inviteMutation = useMutation({
    mutationFn: (data: InviteFormData) =>
      apiRequest<{ invitation: any; inviteUrl?: string }>('/auth/invitations', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (res, variables) => {
      setCreatedInvite({
        inviteUrl: res.inviteUrl,
        email: variables.email,
        role: variables.role,
      });
      setErrorMsg(null);
      reset();
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to dispatch invitation');
    },
  });

  const onSubmit = (data: InviteFormData) => {
    inviteMutation.mutate(data);
  };

  const copyToClipboard = () => {
    if (createdInvite?.inviteUrl) {
      navigator.clipboard.writeText(createdInvite.inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>User Invitations</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Issue single-use cryptographic invitation tokens to onboard organizers, coaches, athletes, and scorers.
        </p>
      </div>

      {errorMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-sm)', color: '#b91c1c', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
          <AlertCircle size={18} /> {errorMsg}
        </div>
      )}

      {/* Success banner with copy link */}
      {createdInvite && (
        <div
          style={{
            backgroundColor: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            marginBottom: '1.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#065f46', fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.5rem' }}>
            <CheckCircle size={18} /> Invitation Generated for {createdInvite.email} ({createdInvite.role})
          </div>
          <p style={{ fontSize: '0.85rem', color: '#047857', marginBottom: '0.75rem' }}>
            The one-time token has been secured. In development mode, the link is accessible below:
          </p>

          {createdInvite.inviteUrl && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                readOnly
                value={createdInvite.inviteUrl}
                style={{
                  flex: 1,
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.8rem',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: 'var(--radius-sm)',
                }}
              />
              <button
                onClick={copyToClipboard}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.5rem 1rem',
                  background: '#047857',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                }}
              >
                <Copy size={14} /> {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Invitation Form */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          padding: '1.75rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Mail size={18} /> Send New Invitation
        </h2>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Institutional Email Address
              </label>
              <input
                type="email"
                placeholder="recipient@institution.edu"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  outline: 'none',
                  fontSize: '0.9rem',
                }}
                {...register('email')}
              />
              {errors.email && <span style={{ color: 'var(--color-danger)', fontSize: '0.8rem' }}>{errors.email.message}</span>}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Assigned Role
              </label>
              <select
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  fontSize: '0.9rem',
                }}
                {...register('role')}
              >
                <option value="COACH">Coach (Team Ownership & Rosters)</option>
                <option value="ATHLETE">Athlete (Personal Profile & Schedule)</option>
                <option value="SCORER">Scorer (Official Match Event Recording)</option>
                <option value="ORGANIZER">Organizer (Tournament & Scheduling Management)</option>
                <option value="ADMIN">Admin (Full Platform Administration)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.25rem',
              backgroundColor: 'var(--color-accent)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
            }}
          >
            <Send size={16} /> {isSubmitting ? 'Generating...' : 'Issue Invitation'}
          </button>
        </form>
      </div>
    </div>
  );
};
