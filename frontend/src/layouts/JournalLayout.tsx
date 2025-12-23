import React from 'react';
import ChatWidget from '../components/ChatWidget';

interface JournalLayoutProps {
    children: React.ReactNode;
}

const JournalLayout: React.FC<JournalLayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 md:p-8">
            {/* Main Book Container */}
            <div className="relative w-full max-w-7xl aspect-[4/3] md:aspect-[3/2] bg-leather rounded-r-2xl rounded-l-md shadow-2xl flex perspective-1000">
                
                {/* Book Spine / Shadow */}
                <div className="absolute left-0 top-0 bottom-0 w-8 md:w-16 bg-gradient-to-r from-leather-dark to-leather rounded-l-md z-10 shadow-inner"></div>

                {/* Pages Container */}
                <div className="flex-1 bg-parchment m-2 md:m-4 ml-8 md:ml-16 rounded-r-lg shadow-inner flex overflow-hidden border-2 border-[#d4c5a9]">
                    
                    {/* Left Page (Chat Sidebar) */}
                    <div className="hidden md:flex flex-col w-1/3 border-r-2 border-[#d4c5a9] border-dashed p-4 relative bg-parchment-dark/30">
                         {/* Page Crease Shadow */}
                         <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black/5 to-transparent pointer-events-none"></div>
                         
                         <ChatWidget />
                    </div>

                    {/* Right Page (Main Content) */}
                    <div className="flex-1 p-6 relative flex flex-col overflow-y-auto custom-scrollbar">
                        {/* Page Crease Shadow */}
                        <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/5 to-transparent pointer-events-none"></div>
                        
                        {/* Content */}
                        <div className="relative z-0">
                            {children}
                        </div>
                    </div>

                </div>

                {/* Brass Corner Protectors (Decorative) */}
                <div className="absolute -top-1 -right-1 w-12 h-12 bg-gradient-to-br from-gold to-gold-dark rounded-bl-3xl border-2 border-yellow-200 shadow-md"></div>
                <div className="absolute -bottom-1 -right-1 w-12 h-12 bg-gradient-to-tr from-gold to-gold-dark rounded-tl-3xl border-2 border-yellow-200 shadow-md"></div>
            </div>
            
            {/* Leather Strap (Nav) - Floating on top? Or inside? */}
        </div>
    );
};

export default JournalLayout;
