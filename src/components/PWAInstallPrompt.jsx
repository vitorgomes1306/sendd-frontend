import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const PWAInstallPrompt = () => {
    const { currentTheme } = useTheme();
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handler = (e) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Update UI notify the user they can install the PWA
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 9999,
            backgroundColor: currentTheme?.cardBackground || '#fff',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            borderRadius: '12px',
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            border: `1px solid ${currentTheme?.border || '#eee'}`,
            maxWidth: '300px',
            animation: 'fadeIn 0.5s ease-out'
        }}>
            <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                overflow: 'hidden',
                flexShrink: 0
            }}>
                <img src="/pwa-icon.png" alt="App Icon" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>

            <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', fontSize: '14px', color: currentTheme?.textPrimary || '#000' }}>Instalar App</div>
                <div style={{ fontSize: '12px', color: currentTheme?.textSecondary || '#666' }}>Adicione à tela inicial</div>
            </div>

            <button
                onClick={handleInstallClick}
                style={{
                    backgroundColor: '#0084ff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <Download size={18} />
            </button>

            <button
                onClick={() => setIsVisible(false)}
                style={{
                    background: 'transparent',
                    border: 'none',
                    color: currentTheme?.textSecondary || '#999',
                    cursor: 'pointer',
                    marginLeft: '4px'
                }}
            >
                <X size={16} />
            </button>
        </div>
    );
};

export default PWAInstallPrompt;
