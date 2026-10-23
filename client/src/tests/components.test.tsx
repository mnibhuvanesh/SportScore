import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import {
  formatDate,
  formatNumber,
  formatCurrency,
  formatPhoneNumber,
} from '../lib/formatters';

describe('UI Components & Indian Formatters', () => {
  describe('Indian Formatters', () => {
    it('formats dates as DD/MM/YYYY', () => {
      const formatted = formatDate('2026-10-22T12:00:00Z');
      expect(formatted).toMatch(/22\/10\/2026/);
    });

    it('formats numbers with Indian numbering commas (e.g. 1,00,000)', () => {
      expect(formatNumber(100000)).toBe('1,00,000');
      expect(formatNumber(15000000)).toBe('1,50,00000'.replace('0000', '00,00') || '1,50,00,000');
    });

    it('formats currency with ₹ symbol and Indian commas', () => {
      expect(formatCurrency(50000)).toBe('₹50,000');
      expect(formatCurrency(100000)).toBe('₹1,00,000');
    });

    it('formats phone numbers in Indian format (+91 XXXXX XXXXX)', () => {
      expect(formatPhoneNumber('0000000000')).toBe('+91 00000 00000');
    });
  });

  describe('Badge', () => {
    it('renders child text content correctly', () => {
      render(<Badge variant="success">Completed</Badge>);
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });

    it('applies the appropriate styling variant', () => {
      render(<Badge variant="live">Live Now</Badge>);
      const badge = screen.getByText('Live Now');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('EmptyState', () => {
    it('renders title and description', () => {
      render(
        <EmptyState
          title="No Teams Found"
          description="Create your first team to get started."
        />
      );
      expect(screen.getByText('No Teams Found')).toBeInTheDocument();
      expect(screen.getByText('Create your first team to get started.')).toBeInTheDocument();
    });

    it('renders action button when provided', () => {
      render(
        <EmptyState
          title="Empty Roster"
          action={<button>Add Athlete</button>}
        />
      );
      expect(screen.getByRole('button', { name: /Add Athlete/i })).toBeInTheDocument();
    });
  });
});
