import { useAuth0 } from '@auth0/auth0-react';
import { Navigate } from 'react-router-dom';
import SatchelLogo from '../assets/SatchelLogo.png';

const Login = () => {
    const { loginWithRedirect, isAuthenticated, isLoading, error } = useAuth0();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-parchment-dark flex items-center justify-center">
                <div className="font-heading text-2xl text-leather animate-pulse">Summoning Portal...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-parchment-dark flex items-center justify-center">
                 <div className="bg-rpg-red/10 border-2 border-rpg-red text-rpg-red p-6 rounded max-w-md text-center font-body text-lg">
                    <h3 className="font-heading text-xl mb-2">Portal Malfunction</h3>
                    {error.message}
                 </div>
            </div>
        );
    }

    if (isAuthenticated) {
        return <Navigate to="/dashboard" />;
    }

    return (
        <div className="min-h-screen bg-[#2a2a2a] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Texture/Pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/dark-leather.png")' }}></div>
            
            <div className="w-full max-w-md bg-parchment border-[6px] border-leather rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.5)] p-8 relative z-10">
                {/* Corner Decorations */}
                <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-gold rounded-tl-lg"></div>
                <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-gold rounded-tr-lg"></div>
                <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-gold rounded-bl-lg"></div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-gold rounded-br-lg"></div>

                <div className="text-center mb-8 flex flex-row items-center justify-center gap-4">
                    <img src={SatchelLogo} alt="Satchel Logo" className="w-16 h-auto drop-shadow-lg" />
                    <div>
                        <h1 className="font-heading text-5xl text-leather-dark drop-shadow-sm text-left">Satchel</h1>
                        <p className="font-body text-xl text-ink/70 italic text-left">Your inventory, reimagined.</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-leather/5 p-4 rounded border border-leather/20 text-center">
                        <p className="font-body text-lg text-leather-dark">
                            Ever had so many things in your shelf and never knew it existed at the right time? Well.. Satchel got you covered!
                        </p>
                    </div>

                    <button
                        onClick={() => loginWithRedirect()}
                        className="w-full bg-leather text-gold font-heading text-xl py-4 rounded shadow-lg border-2 border-gold hover:bg-leather-light hover:scale-[1.02] transition-all active:scale-95 flex items-center justify-center gap-3 group"
                    >
                        <span>Log In</span>
                    </button>
                    
                    <p className="text-center text-sm font-body text-ink/50 mt-4">
                        Made with love by Pranavsai Gandikota
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
