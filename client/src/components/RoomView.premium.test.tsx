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

  it('after paying, shows "Check again" instead of a second Unlock until access is confirmed', async () => {
    let hasAccess = false;
    const fetchMock = vi.fn((url: string) =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve(
            url.endsWith('/access')
              ? { success: true, isPremium: true, hasAccess }
              : { messages: [] },
          ),
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    // Returning from Stripe Checkout before the webhook has unlocked the room.
    window.history.pushState(null, '', '/?checkout=success&room=Mewtwo');

    await act(async () => {
      render(
        <RoomView
          user={{ username: 'TestAsh' }}
          socket={makeSocket()}
          onLogout={vi.fn()}
        />,
      );
    });

    expect(screen.getByText('Payment received')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Check again' })).toBeEnabled();
    expect(
      screen.queryByRole('button', { name: /Unlock for/ }),
    ).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalledWith(
      '/api/rooms/Mewtwo/checkout',
      expect.anything(),
    );

    // The webhook lands; "Check again" opens the room.
    hasAccess = true;
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Check again' }));
    });
    expect(screen.queryByText('Payment received')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Message The Mewtwo Room')).toBeEnabled();
    vi.unstubAllGlobals();
  });

  it('opens the room when checkout reports the payment was already made', async () => {
    const fetchMock = vi.fn((url: string, init?: RequestInit) =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve(
            url.endsWith('/checkout') && init?.method === 'POST'
              ? { success: true, hasAccess: true }
              : url.endsWith('/access')
                ? { success: true, isPremium: true, hasAccess: false }
                : { messages: [] },
          ),
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    window.history.pushState(null, '', '/');
    const socket = makeSocket();

    await renderAndOpenMewtwo(socket);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Unlock for CA\$3/ }));
    });

    expect(screen.queryByText(/room is premium/i)).not.toBeInTheDocument();
    expect(socket.emit).toHaveBeenCalledWith('join_room', 'Mewtwo');
    vi.unstubAllGlobals();
  });
});
