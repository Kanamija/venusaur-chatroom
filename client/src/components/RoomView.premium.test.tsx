import { render, screen, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RoomView } from './RoomView';

function mockFetch(hasAccess: boolean) {
  return vi.fn((url: string, init?: RequestInit) => {
    if (url.endsWith('/access')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({ success: true, isPremium: true, hasAccess }),
      });
    }
    if (url.endsWith('/checkout') && init?.method === 'POST') {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            success: true,
            url: 'https://checkout.stripe.com/c/test',
          }),
      });
    }
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ messages: [] }),
    });
  });
}

const makeSocket = () => ({ emit: vi.fn(), on: vi.fn(), off: vi.fn() });

async function renderAndOpenMewtwo(socket: ReturnType<typeof makeSocket>) {
  await act(async () => {
    render(
      <RoomView
        user={{ username: 'TestAsh' }}
        socket={socket}
        onLogout={vi.fn()}
      />,
    );
  });
  await act(async () => {
    fireEvent.click(screen.getByText((content) => content.includes('Mewtwo')));
  });
}

describe('RoomView premium Mewtwo room', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('locks Mewtwo until it is unlocked and starts Stripe Checkout', async () => {
    const fetchMock = mockFetch(false);
    vi.stubGlobal('fetch', fetchMock);
    const assign = vi.fn();
    vi.stubGlobal('location', {
      ...window.location,
      assign,
      search: '',
      pathname: '/',
    });
    const socket = makeSocket();

    await renderAndOpenMewtwo(socket);

    expect(
      screen.getByRole('heading', { name: /Mewtwo's room is premium/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Message The Mewtwo Room')).toBeDisabled();
    expect(socket.emit).not.toHaveBeenCalledWith('join_room', 'Mewtwo');
    expect(fetchMock).not.toHaveBeenCalledWith('/api/rooms/Mewtwo/messages');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Unlock for CA\$3/ }));
    });

    expect(fetchMock).toHaveBeenCalledWith('/api/rooms/Mewtwo/checkout', {
      method: 'POST',
      credentials: 'include',
    });
    expect(assign).toHaveBeenCalledWith('https://checkout.stripe.com/c/test');
    vi.unstubAllGlobals();
  });

  it('opens Mewtwo normally once the user has access', async () => {
    vi.stubGlobal('fetch', mockFetch(true));
    const socket = makeSocket();

    await renderAndOpenMewtwo(socket);

    expect(screen.queryByText(/room is premium/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText('Message The Mewtwo Room')).toBeEnabled();
    expect(socket.emit).toHaveBeenCalledWith('join_room', 'Mewtwo');
    vi.unstubAllGlobals();
  });
});
