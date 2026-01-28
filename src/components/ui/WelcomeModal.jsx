import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { CirclePlay, MessageCircleQuestionMark } from 'lucide-react';
import '../../styles/buttons.css'

const WelcomeModal = ({ onClose }) => {
    const { currentTheme, isDark } = useTheme();
    const { user, updateUser } = useAuth(); // Assuming useAuth exposes updateUser to update local state

    const handleDontShowAgain = async () => {
        try {
            if (user && user.id) {
                // Call API to update showModalBoasVindas = false
                await apiService.updateUser(user.id, { showModalBoasVindas: false });

                // Update local user state if function exists
                if (updateUser) {
                    updateUser({ ...user, showModalBoasVindas: false });
                }
            }
            onClose();
        } catch (error) {
            console.error('Erro ao atualizar preferência do usuário:', error);
            onClose(); // Close anyway to not block user
        }
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
        }}>
            <div style={{
                backgroundColor: currentTheme.cardBackground,
                borderRadius: '16px',
                width: '100%',
                maxWidth: '600px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                overflow: 'hidden',
                animation: 'fadeIn 0.3s ease-out'
            }}>
                {/* Header with Image or Gradient */}
                <div style={{
                    height: '140px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: '#fff',
                    textAlign: 'center',
                    padding: '24px'
                }}>
                    <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>Bem-vindo ao Sendd!</h2>
                    <p style={{ fontSize: '16px', opacity: 0.9 }}>Sua plataforma completa de atendimento e gestão.</p>
                </div>

                {/* Content */}
                <div style={{ padding: '32px 24px' }}>
                    <div style={{ marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: currentTheme.textPrimary, marginBottom: '12px' }}>
                            O que você pode fazer aqui?
                        </h3>
                        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {[
                                { title: 'Atendimento Omnichannel', desc: 'Centralize seus atendimentos do WhatsApp em um só lugar.' },
                                { title: 'Gestão de Leads', desc: 'Organize seus contatos e acompanhe o funil de vendas.' },
                                { title: 'Automação com IA', desc: 'Utilize inteligência artificial para otimizar suas respostas.' },
                                { title: 'Relatórios Detalhados', desc: 'Acompanhe a performance da sua equipe em tempo real.' }
                            ].map((item, index) => (
                                <li key={index} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                    <span style={{
                                        color: '#3b82f6',
                                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                        borderRadius: '50%',
                                        width: '24px',
                                        height: '24px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '14px',
                                        fontWeight: 'bold',
                                        marginTop: '2px',
                                        flexShrink: 0
                                    }}>✓</span>
                                    <div>
                                        <div style={{ fontWeight: '600', color: currentTheme.textPrimary }}>{item.title}</div>
                                        <div style={{ fontSize: '14px', color: currentTheme.textSecondary }}>{item.desc}</div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <p style={{ fontSize: '14px', color: currentTheme.textMuted, textAlign: 'center', marginTop: '32px' }}>
                        Explore os menus laterais para acessar todas as funcionalidades.
                    </p>
                </div>

                {/* Footer */}
                <div style={{
                    padding: '20px 24px',
                    borderTop: `1px solid ${currentTheme.border}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: isDark ? currentTheme.background : '#f8fafc'
                }}>
                    <button
                        onClick={handleDontShowAgain}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: currentTheme.textSecondary,
                            cursor: 'pointer',
                            fontSize: '14px',
                            textDecoration: 'underline'
                        }}
                    >
                        Não exibir mais
                    </button>

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '12px' }}>
                        <button
                            // Vai para link externo
                            onClick={() => window.open('https://wa.me/5585994454472', '_blank')}
                            className="btn-base btn-new-orange"
                            style={{
                                display: 'flex',
                                alignItems: 'center',      // 🔹 centraliza verticalmente
                                justifyContent: 'center',  // 🔹 centraliza horizontalmente
                                gap: '8px'                 // 🔹 espaço entre ícone e texto
                            }}
                        >
                            <MessageCircleQuestionMark size={16} />
                            Preciso de ajuda!
                        </button>

                        <button
                            onClick={onClose}
                            className="btn-base btn-new"
                            style={{

                                display: 'flex',
                                alignItems: 'center',      // 🔹 centraliza verticalmente
                                justifyContent: 'center',  // 🔹 centraliza horizontalmente
                                gap: '8px'                 // 🔹 espaço entre ícone e texto
                            }}
                        >
                            <CirclePlay size={16} />
                            Começar
                        </button>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default WelcomeModal;
