import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { OngoingDiscussions } from '../../src/app/components/OngoingDiscussions';

jest.mock('../../src/app/components/ui/dropdown-menu', () => {
  const React = require('react');
  return {
    DropdownMenu: ({ children }: { children: React.ReactNode }) => React.createElement('div', null, children),
    DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => React.createElement('div', null, children),
    DropdownMenuContent: ({ children }: { children: React.ReactNode }) => React.createElement('div', null, children),
    DropdownMenuItem: ({ children, onSelect }: { children: React.ReactNode; onSelect?: () => void }) =>
      React.createElement(
        'button',
        {
          type: 'button',
          onClick: () => onSelect?.(),
        },
        children,
      ),
  };
});

const installFetchMock = () => {
  Object.defineProperty(globalThis, 'fetch', {
    writable: true,
    value: jest.fn<() => Promise<Response>>(),
  });

  return globalThis.fetch as jest.MockedFunction<typeof fetch>;
};

const response = (data: unknown, ok = true, status = 200): Response => ({
  ok,
  status,
  json: async () => data,
} as Response);

const LocationProbe = () => {
  const location = useLocation();
  return <div data-testid="location-probe">{`${location.pathname}${location.search}`}</div>;
};

const renderInRouter = () => {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="*" element={<><OngoingDiscussions /><LocationProbe /></>} />
      </Routes>
    </MemoryRouter>,
  );
};

describe('OngoingDiscussions (Jest)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    installFetchMock();
  });

  it('renders archived discussion and removes it from visible list', async () => {
    const fetchMock = globalThis.fetch as jest.MockedFunction<typeof fetch>;
    fetchMock.mockResolvedValue(
      response([
      {
        id: 'd-archived-1',
        topic: 'Old archived thread',
        status: 'archived',
        participants: ['Alice', 'Bob'],
        lastActivity: '2026-03-20T10:00:00.000Z',
        channelId: 'c1',
        channelName: 'general',
        messageCount: 5,
        messageId: 'm1',
      },
      ]),
    );

    renderInRouter();

    await waitFor(() => {
      expect(screen.getByText('Old archived thread')).toBeTruthy();
    });

    await userEvent.click(screen.getByRole('button', { name: 'Remove from list' }));

    await waitFor(() => {
      expect(screen.queryByText('Old archived thread')).toBeNull();
    });

    expect(screen.getByText('No all discussions')).toBeTruthy();
  });

  it('keeps removed discussion hidden after unmount/remount using localStorage', async () => {
    const fetchMock = globalThis.fetch as jest.MockedFunction<typeof fetch>;
    fetchMock.mockResolvedValue(
      response([
      {
        id: 'd-archived-2',
        topic: 'Archived thread expected deleted',
        status: 'archived',
        participants: ['Alice', 'Bob'],
        lastActivity: '2026-03-20T10:00:00.000Z',
        channelId: 'c1',
        channelName: 'general',
        messageCount: 2,
        messageId: 'm2',
      },
      ]),
    );

    const firstRender = renderInRouter();

    await waitFor(() => {
      expect(screen.getByText('Archived thread expected deleted')).toBeTruthy();
    });

    await userEvent.click(screen.getByRole('button', { name: 'Remove from list' }));

    await waitFor(() => {
      expect(screen.queryByText('Archived thread expected deleted')).toBeNull();
    });

    firstRender.unmount();
    renderInRouter();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    expect(screen.queryByText('Archived thread expected deleted')).toBeNull();
  });

  it('marks active discussion as resolved and refreshes list', async () => {
    const fetchMock = globalThis.fetch as jest.MockedFunction<typeof fetch>;
    fetchMock
      .mockResolvedValueOnce(
        response([
          {
            id: 'd-active-1',
            topic: 'Active thread',
            status: 'active',
            participants: ['Alice', 'Bob'],
            lastActivity: '2026-04-04T10:00:00.000Z',
            channelId: 'c1',
            channelName: 'general',
            messageCount: 3,
            messageId: 'm3',
          },
        ]),
      )
      .mockResolvedValueOnce(response({ id: 'd-active-1', status: 'resolved' }))
      .mockResolvedValueOnce(
        response([
          {
            id: 'd-active-1',
            topic: 'Active thread',
            status: 'resolved',
            participants: ['Alice', 'Bob'],
            lastActivity: '2026-04-04T10:00:00.000Z',
            channelId: 'c1',
            channelName: 'general',
            messageCount: 3,
            messageId: 'm3',
          },
        ]),
      );

    renderInRouter();

    await waitFor(() => {
      expect(screen.getByText('Active thread')).toBeTruthy();
    });

    await userEvent.click(screen.getByRole('button', { name: 'Mark as resolved' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/api/discussions/d-active-1/status',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ status: 'resolved' }),
        }),
      );
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('navigates to thread when clicking View thread', async () => {
    const fetchMock = globalThis.fetch as jest.MockedFunction<typeof fetch>;
    fetchMock.mockResolvedValue(
      response([
      {
        id: 'd-active-2',
        topic: 'Navigate thread',
        status: 'active',
        participants: ['A', 'B'],
        lastActivity: '2026-04-04T10:00:00.000Z',
        channelId: 'c9',
        channelName: 'general',
        messageCount: 10,
        messageId: 'm99',
      },
      ]),
    );

    renderInRouter();

    await waitFor(() => {
      expect(screen.getByText('Navigate thread')).toBeTruthy();
    });

    await userEvent.click(screen.getByRole('button', { name: 'View thread' }));

    await waitFor(() => {
      expect(screen.getByTestId('location-probe').textContent).toBe('/');
    });
  });
});
