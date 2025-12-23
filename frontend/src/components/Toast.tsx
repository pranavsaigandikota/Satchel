import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastProps {
    toast: ToastMessage;
    onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(toast.id);
        }, 3000); // Auto close after 3s

        return () => clearTimeout(timer);
    }, [toast.id, onClose]);

    const getIcon = () => {
        switch (toast.type) {
            case 'success': return <CheckCircle className="w-5 h-5 text-green-400" />;
            case 'error': return <AlertCircle className="w-5 h-5 text-red-400" />;
            default: return <Info className="w-5 h-5 text-blue-400" />;
        }
    };

    const getBgColor = () => {
         switch (toast.type) {
            case 'success': return 'bg-ink/90 border-green-500/30';
            case 'error': return 'bg-ink/90 border-red-500/30';
            default: return 'bg-ink/90 border-blue-500/30';
        }
    };

    return (
        <div className={`flex items-center gap-3 px-4 py-3 rounded shadow-lg border backdrop-blur-sm text-parchment animate-in slide-in-from-bottom-5 fade-in duration-300 ${getBgColor()}`}>
            {getIcon()}
            <span className="text-sm font-medium">{toast.message}</span>
            <button onClick={() => onClose(toast.id)} className="ml-2 hover:bg-white/10 rounded p-1">
                <X className="w-4 h-4 opacity-70" />
            </button>
        </div>
    );
};

export const ToastContainer: React.FC<{ toasts: ToastMessage[], removeToast: (id: string) => void }> = ({ toasts, removeToast }) => {
    return (
        <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2">
            {toasts.map(t => (
                <Toast key={t.id} toast={t} onClose={removeToast} />
            ))}
        </div>
    );
};
