// App.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import Home from './Home';

const renderWithRouter = (ui) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('App Component', () => {
  test('renders Home component at the root path', () => {
    renderWithRouter(<App />);
    
    // Check if the Home component is rendered
    const homeElement = screen.getByText(/hybrid/i); 
    expect(homeElement).toBeInTheDocument();
  });

  test('does not render Home component at an unknown path', () => {
    window.history.pushState({}, 'Test page', '/unknown'); 
    renderWithRouter(<App />);
    
    // Check if the Home component is not rendered
    const homeElement = screen.queryByText(/welcome/i); 
    expect(homeElement).not.toBeInTheDocument();
  });
});
