import { useAuth0 } from '@auth0/auth0-react';
import { Link } from 'react-router-dom';

const Navbar = () => {

    const { logout, user, isAuthenticated } = useAuth0();

    return (
        <nav className="glass" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
            <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--primary)' }}>Satchel</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {isAuthenticated && user && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {user.picture && <img src={user.picture} alt="Profile" style={{ width: '30px', height: '30px', borderRadius: '50%' }} />}
                        <span style={{ color: 'white', fontSize: '0.9rem' }}>{user.name}</span>
                    </div>
                )}
                <Link to="/chat" style={{ color: 'white', marginRight: '1rem', textDecoration: 'none' }}>
                    <span style={{ fontSize: '1.2rem' }}>💬</span>
                </Link>
                <button
                    onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                    style={{ background: 'transparent', border: '1px solid #ffffff33', color: 'white', padding: '5px 15px', borderRadius: '6px', cursor: 'pointer' }}
                >
                    Logout
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
