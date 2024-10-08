// Home.test.js

import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import Home from './Home';
import { useNavigate } from 'react-router-dom';

jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
}));

describe('Home component', () => {
    it('Updates urls state on user input', () => {
        render(<Home />);
      
        const input = screen.getByTestId('base-input'); 
        fireEvent.change(input, { target: { value: 'https://www.google.com' } });
      
        expect(input.value).toBe('https://www.google.com');
    });

    it('Alerts for empty URLs', () => {
        const mockAlert = jest.spyOn(window, 'alert');
        const { getByRole, getByTestId } = render(<Home />);
    
        const input = screen.getByTestId('base-input'); 
        const button = screen.getByRole('button', { name: /Analyze/i });
        
        fireEvent.change(input, { target: { value: '' } }); 
        fireEvent.click(button);
        
        expect(mockAlert).toHaveBeenCalledWith('No URLs provided');
        mockAlert.mockRestore();
    });

    it('Alerts for invalid URLs', () => {
        const mockAlert = jest.spyOn(window, 'alert');
        const { getByTestId, getByRole } = render(<Home />);

        const input = screen.getByTestId('base-input');
        fireEvent.change(input, { target: { value: 'invalidurl' } });

        const button = getByRole('button', { name: /Analyze/i });
        fireEvent.click(button);

        expect(mockAlert).toHaveBeenCalledWith('One or more URLs provided are not valid');
        mockAlert.mockRestore();
    });

    it('Navigates to dashboard on valid URL', async () => {
        const mockNavigate = jest.fn(); 
        useNavigate.mockReturnValue(mockNavigate);

        render(<Home />);

        const input = screen.getByTestId('base-input');
        fireEvent.change(input, { target: { value: 'https://www.validurl.com' } });

        const button = screen.getByRole('button', { name: /Analyze/i });
        fireEvent.click(button);

        // Wait for potential state updates and navigation
        await waitFor(() => 
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { state: { urls: ['https://www.validurl.com/'] } })
        );
    });
});