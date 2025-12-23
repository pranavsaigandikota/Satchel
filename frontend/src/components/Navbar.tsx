import { useAuth0 } from '@auth0/auth0-react';
import { Link } from 'react-router-dom';
import { LogOut } from 'lucide-react'; // Assuming Lucide is installed

const Navbar = () => {
    const { logout, user, isAuthenticated } = useAuth0();

    return (
        <nav className="relative z-50 w-full bg-leather-dark border-b-4 border-leather shadow-lg flex justify-between items-center px-6 py-3 font-heading text-parchment">
            {/* Logo / Brand */}
            <Link to="/dashboard" className="no-underline group">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gold rounded-full flex items-center justify-center border-2 border-yellow-200 shadow-inner group-hover:scale-110 transition-transform">
                        <span className="text-leather-dark text-2xl">S</span>
                    </div>
                    <span className="text-2xl tracking-widest text-gold group-hover:text-gold-glow transition-colors drop-shadow-md">SATCHEL</span>
                </div>
            </Link>

            {/* User & Actions */}
            <div className="flex items-center gap-6">
                


                {isAuthenticated && user && (
                    <div className="flex items-center gap-3 bg-leather p-1 pr-3 rounded-full border border-leather-light shadow-inner">
                        {user.picture ? (
                            <img src={user.picture} alt="Profile" className="w-8 h-8 rounded-full border border-gold" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-leather-dark border border-gold"></div>
                        )}
                        <span className="font-body text-gold-glow text-lg truncate max-w-[100px]">{user.nickname || user.name}</span>
                    </div>
                )}

                {/* Logout Button (Brass Plate Style) */}
                <button
                    onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                    className="flex items-center gap-2 bg-gradient-to-b from-gold to-yellow-700 text-leather-dark font-bold px-4 py-1 rounded shadow-md border border-yellow-200 hover:brightness-110 active:scale-95 transition-all"
                    title="Logout"
                >
                    <LogOut className="w-4 h-4" />
                    <span className="uppercase text-sm tracking-widest">Logout</span>
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
