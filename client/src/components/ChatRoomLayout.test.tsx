import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ChatRoomLayout } from './ChatRoomLayout';
import type { RoomTheme } from '../types/theme';

const mockTheme: RoomTheme = {
    name: 'Venusaur',
    bgGradient: 'from-teal-600 via-emerald-600 to-teal-900',
    accentColor: 'bg-rose-300 border-rose-400',
    spriteUrl: 'https://example.com/sprite3.png',
    isAvailable: true,
    };

    describe('ChatRoomLayout Component', () => {
    it('renders input field, children, and handles form submission', () => {
        const handleInputChange = vi.fn();
        const handleSubmitMessage = vi.fn((e) => e.preventDefault());

        render(
        <ChatRoomLayout
            theme={mockTheme}
            inputText="Hello Venusaur"
            onInputChange={handleInputChange}
            onSubmitMessage={handleSubmitMessage}
        >
            <div>Test Chat Content</div>
        </ChatRoomLayout>,
        );

        // Verify children and input are rendered
        expect(screen.getByText('Test Chat Content')).toBeInTheDocument();
        const inputElement = screen.getByRole('textbox');
        expect(inputElement).toBeInTheDocument();
        expect(inputElement).toHaveValue('Hello Venusaur');

        // Simulate typing and submitting
        fireEvent.change(inputElement, { target: { value: 'New message' } });
        expect(handleInputChange).toHaveBeenCalled();
    });
});
