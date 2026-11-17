import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RoomHeader } from './RoomHeader';
import type { RoomTheme } from '../types/theme';

const mockRooms: RoomTheme[] = [
    {
        name: 'Venusaur',
        bgGradient: 'from-teal-600',
        accentColor: 'bg-rose-300',
        spriteUrl: 'https://example.com/sprite3.png',
        isAvailable: true,
    },
    {
        name: 'Charizard',
        bgGradient: 'from-amber-200',
        accentColor: 'bg-sky-200',
        spriteUrl: 'https://example.com/sprite6.png',
        isAvailable: true,
    },
    ];

    describe('RoomHeader Component', () => {
    it('renders room navigation buttons and triggers selection callback', () => {
        const handleSelectRoom = vi.fn();

        render(
            <RoomHeader
                rooms={mockRooms}
                currentRoom="Venusaur"
                onSelectRoom={handleSelectRoom}
                onLogout={vi.fn()}
            />,
        );

        // Use a custom function matcher to handle multiline formatted button text
        const venusaurButton = screen.getByText((content) =>
        content.includes('Venusaur'),
        );
        const charizardButton = screen.getByText((content) =>
        content.includes('Charizard'),
        );

        expect(venusaurButton).toBeInTheDocument();
        expect(charizardButton).toBeInTheDocument();

        // Click Charizard room button
        fireEvent.click(charizardButton);
        expect(handleSelectRoom).toHaveBeenCalledWith('Charizard');
    });
});

describe('RoomHeader premium lock', () => {
    it('shows a lock icon only on locked premium rooms', () => {
        render(
            <RoomHeader
                rooms={[
                    ...mockRooms,
                    {
                        name: 'Mewtwo',
                        bgGradient: 'from-violet-950',
                        accentColor: 'bg-fuchsia-200',
                        spriteUrl: 'https://example.com/sprite150.png',
                        isAvailable: true,
                        isPremium: true,
                    },
                ]}
                currentRoom="Venusaur"
                onSelectRoom={vi.fn()}
                onLogout={vi.fn()}
                lockedRooms={['Mewtwo']}
            />,
        );

        const locks = screen.getAllByRole('img', { name: 'Locked' });
        expect(locks).toHaveLength(1);
        expect(locks[0].closest('button')).toHaveTextContent('Mewtwo');
    });
});
