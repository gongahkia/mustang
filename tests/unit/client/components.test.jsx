import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuthProvider } from '../../../client/src/contexts/AuthContext';
import { CryptoProvider } from '../../../client/src/contexts/CryptoContext';
import ProtectedRoute from '../../../client/src/components/ProtectedRoute';
import LoadingSpinner from '../../../client/src/components/LoadingSpinner';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('ProtectedRoute', () => {
  const TestComponent = () => <div data-testid="protected-content">Protected</div>;
  
  it('redirects unauthenticated users to login', () => {
    render(
      <AuthProvider>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </AuthProvider>
    );
    
    expect(mockNavigate).toHaveBeenCalledWith('/login');
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('displays content when authenticated', () => {

    jest.spyOn(React, 'useContext').mockImplementation(() => ({
      currentUser: { uid: 'test-user' },
      isInitializing: false
    }));
    
    render(
      <AuthProvider>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </AuthProvider>
    );
    
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });
});

describe('LoadingSpinner', () => {
  it('displays security message during crypto operations', () => {
    render(<LoadingSpinner securityMessage="Encrypting message..." />);
    
    expect(screen.getByText('Encrypting message...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});