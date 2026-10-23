import { describe, it, expect } from 'vitest';
import {
  passwordSchema,
  emailSchema,
  loginSchema,
  createInvitationSchema,
} from '../validators/auth.validator';

describe('Auth Validators', () => {
  describe('passwordSchema', () => {
    it('should validate passwords with 10 or more characters', () => {
      const valid = passwordSchema.safeParse('SecurePass123!');
      expect(valid.success).toBe(true);
    });

    it('should reject passwords shorter than 10 characters', () => {
      const invalid = passwordSchema.safeParse('short');
      expect(invalid.success).toBe(false);
      if (!invalid.success) {
        expect(invalid.error.issues[0].message).toContain('at least 10 characters');
      }
    });

    it('should reject passwords longer than 128 characters', () => {
      const invalid = passwordSchema.safeParse('a'.repeat(129));
      expect(invalid.success).toBe(false);
    });
  });

  describe('emailSchema', () => {
    it('should normalize valid emails to lowercase and trim spaces', () => {
      const result = emailSchema.safeParse('  Admin@Example.com  ');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('admin@example.com');
      }
    });

    it('should reject invalid email formats', () => {
      const result = emailSchema.safeParse('not-an-email');
      expect(result.success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('should accept and normalize email identifiers', () => {
      const result = loginSchema.safeParse({
        email: '  Admin@Example.com  ',
        password: 'Password123!',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('admin@example.com');
      }
    });

    it('should accept username identifiers', () => {
      const result = loginSchema.safeParse({
        email: 'admin',
        password: 'Password123!',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('admin');
      }
    });

    it('should reject empty login identifiers or missing passwords', () => {
      const result = loginSchema.safeParse({
        email: '   ',
        password: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('createInvitationSchema', () => {
    it('should accept valid system roles', () => {
      const roles = ['ADMIN', 'ORGANIZER', 'COACH', 'ATHLETE', 'SCORER'] as const;
      for (const role of roles) {
        const result = createInvitationSchema.safeParse({
          email: 'user@example.com',
          role,
        });
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid role names', () => {
      const result = createInvitationSchema.safeParse({
        email: 'user@example.com',
        role: 'SUPERUSER',
      });
      expect(result.success).toBe(false);
    });
  });
});
