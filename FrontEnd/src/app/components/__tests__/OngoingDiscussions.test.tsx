import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OngoingDiscussions } from '../OngoingDiscussions';
import { DetectedDiscussion } from '../../types/chat';

// Mock react-router hooks used inside the component
vi.mock('react-router', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({ serverId: 's-1', groupId: undefined }),
}));

// Mock the API service
vi.mock('../../services/api', () => ({
  getDiscussions: vi.fn(),
  updateDiscussionStatus: vi.fn(),
}));

import { getDiscussions } from '../../services/api';

const makeDiscussion = (overrides: Partial<DetectedDiscussion> = {}): DetectedDiscussion => ({
  id: 'd-1',
  topic: 'Test discussion',
  status: 'archived',
  participants: ['Alice', 'Bob'],
  lastActivity: new Date(),
  channelId: 'ch-1',
  channelName: 'general',
  messageCount: 5,
  messageId: 'm-1',
  ...overrides,
});

describe('OngoingDiscussions – Remove from list (Issue #5)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows "Remove from list" button only for archived discussions', async () => {
    vi.mocked(getDiscussions).mockResolvedValue([
      makeDiscussion({ id: 'd-1', status: 'archived', topic: 'Archived topic' }),
      makeDiscussion({ id: 'd-2', status: 'active', topic: 'Active topic' }),
    ]);

    render(<OngoingDiscussions />);

    await waitFor(() => {
      expect(screen.getByText('Archived topic')).toBeInTheDocument();
    });

    const removeButtons = screen.getAllByRole('button', { name: /remove from list/i });
    expect(removeButtons).toHaveLength(1);

    // Active discussion must NOT have the button
    expect(screen.queryAllByRole('button', { name: /remove from list/i })).toHaveLength(1);
  });

  it('removes an archived discussion from the list when "Remove from list" is clicked', async () => {
    vi.mocked(getDiscussions).mockResolvedValue([
      makeDiscussion({ id: 'd-1', status: 'archived', topic: 'Archived discussion' }),
    ]);

    render(<OngoingDiscussions />);

    // Wait for the discussion to appear
    await waitFor(() => {
      expect(screen.getByText('Archived discussion')).toBeInTheDocument();
    });

    const removeButton = screen.getByRole('button', { name: /remove from list/i });
    fireEvent.click(removeButton);

    // After clicking, the discussion should be gone from the UI
    await waitFor(() => {
      expect(screen.queryByText('Archived discussion')).not.toBeInTheDocument();
    });
  });

  it('does not re-fetch from API when removing from list (client-side hide only)', async () => {
    vi.mocked(getDiscussions).mockResolvedValue([
      makeDiscussion({ id: 'd-1', status: 'archived', topic: 'Archived discussion' }),
    ]);

    render(<OngoingDiscussions />);

    await waitFor(() => {
      expect(screen.getByText('Archived discussion')).toBeInTheDocument();
    });

    const callsBefore = vi.mocked(getDiscussions).mock.calls.length;

    fireEvent.click(screen.getByRole('button', { name: /remove from list/i }));

    // getDiscussions should NOT have been called again after hiding
    expect(vi.mocked(getDiscussions).mock.calls.length).toBe(callsBefore);
  });

  // FAILING TEST — documents Issue #5
  // After removing the last visible discussion via "Remove from list," the component
  // stays in the success viewState and renders "No all discussions" (a confusing
  // inline placeholder) instead of the proper empty state used when no discussions
  // exist at all ("No discussions found"). Fix: transition viewState → 'empty' when
  // visibleDiscussions becomes empty after a hide.
  it('shows the empty state after the last archived discussion is removed', async () => {
    vi.mocked(getDiscussions).mockResolvedValue([
      makeDiscussion({ id: 'd-1', status: 'archived', topic: 'Only discussion' }),
    ]);

    render(<OngoingDiscussions />);

    await waitFor(() => {
      expect(screen.getByText('Only discussion')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /remove from list/i }));

    // Expect the proper empty state — this FAILS with the current code because
    // viewState stays 'success' and renders "No all discussions" instead.
    await waitFor(() => {
      expect(screen.getByText('No discussions found')).toBeInTheDocument();
    });
  });

  it('keeps other discussions visible after one is removed', async () => {
    vi.mocked(getDiscussions).mockResolvedValue([
      makeDiscussion({ id: 'd-1', status: 'archived', topic: 'To be removed' }),
      makeDiscussion({ id: 'd-2', status: 'archived', topic: 'Should stay' }),
    ]);

    render(<OngoingDiscussions />);

    await waitFor(() => {
      expect(screen.getByText('To be removed')).toBeInTheDocument();
      expect(screen.getByText('Should stay')).toBeInTheDocument();
    });

    const [firstRemove] = screen.getAllByRole('button', { name: /remove from list/i });
    fireEvent.click(firstRemove);

    await waitFor(() => {
      expect(screen.queryByText('To be removed')).not.toBeInTheDocument();
      expect(screen.getByText('Should stay')).toBeInTheDocument();
    });
  });
});
