import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ChatBubble } from './ChatBubble';
import type { Message } from '../types/chat';

describe('ChatBubble Component', () => {
    it('renders message text, username, and accent styles correctly', () => {
        const mockMessage: Message = {
        _id: 'msg-test-123',
        roomId: 'Venusaur',
        text: 'Pikachu, use Thunderbolt!',
        username: 'TrainerAsh',
        createdAt: new Date('2026-10-14T12:00:00.000Z').toISOString(),
        };

        render(
        <ChatBubble
            message={mockMessage}
            accentColorClass="bg-rose-300 border-rose-400"
        />,
        );

        // Assert that the username and message text appear in the document
        expect(screen.getByText('TrainerAsh')).toBeInTheDocument();
        expect(screen.getByText('Pikachu, use Thunderbolt!')).toBeInTheDocument();
    });
});
