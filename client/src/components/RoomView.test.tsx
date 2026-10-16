import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RoomView } from './RoomView';

describe('RoomView Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Mock JSDOM missing DOM method scrollIntoView
        Element.prototype.scrollIntoView = vi.fn();

        // Stub global fetch using Vitest helper
        vi.stubGlobal(
        'fetch',
        vi.fn(() =>
            Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ messages: [] }),
            }),
        ),
        );
    });

    it('renders room header and layout without crashing', async () => {
        const mockSocket = {
        emit: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
        };

        await act(async () => {
            render(
                <RoomView
                user={{ username: 'TestAsh' }}
                socket={mockSocket}
                onLogout={vi.fn()}
                />,
            );
        });

        // Verify room heading renders and socket joins room
        expect(
        screen.getByRole('heading', { name: /Venusaur/i }),
        ).toBeInTheDocument();
        expect(mockSocket.emit).toHaveBeenCalledWith('join_room', 'Venusaur');
    });
});
