import { useAuth0 } from '@auth0/auth0-react';
import { Navigate } from 'react-router-dom';

const Login = () => {
    const { loginWithRedirect, isAuthenticated, isLoading, error } = useAuth0();

    if (isLoading) {
        return <div style={{ color: 'white', textAlign: 'center', marginTop: '20%' }}>Loading...</div>;
    }

    if (error) {
        return <div style={{ color: 'red', textAlign: 'center', marginTop: '20%' }}>Auth Error: {error.message}</div>;
    }

    if (isAuthenticated) {
        return <Navigate to="/dashboard" />;
    }

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'radial-gradient(circle at top, #1e293b, #0f172a)' }}>
            <div className="glass" style={{ padding: '2rem', width: '350px', textAlign: 'center' }}>
                <h2 style={{ marginBottom: '1.5rem' }}>Welcome to PremZone</h2>
                <p style={{ marginBottom: '2rem', color: '#94a3b8' }}>Please sign in to continue</p>
                <button
                    onClick={() => loginWithRedirect()}
                    className="btn-primary"
                    style={{ width: '100%', padding: '0.75rem' }}
                >
                    Log In with Auth0
                </button>
            </div>
        </div>
    );
};

export default Login;
