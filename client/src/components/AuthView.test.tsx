import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AuthView } from './AuthView';

describe('AuthView Component', () => {
    it('renders authentication elements correctly', () => {
        const mockOnLoginSuccess = vi.fn();

        render(<AuthView onLoginSuccess={mockOnLoginSuccess} />);

        // Query the Pokeball submit button specifically by title
        const submitButton = screen.getByTitle('Click Pokéball to Register');
        const toggleButton = screen.getByText(/Already have an account\? Log in/i);

        expect(submitButton).toBeInTheDocument();
        expect(toggleButton).toBeInTheDocument();
    });
});
