import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Filter, Search, User, Calendar, UserPlus, Trash2, X, HelpCircle, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AlertToast from '../components/ui/AlertToast';
import ClientCreationModal from '../components/ui/ClientCreationModal';

// Se react-beautiful-dnd não estiver instalado, podemos fazer um fallback visual simples primeiro.
// Vou assumir que podemos instalar ou já existe. Se der erro, o user avisa.
// Para garantir, vou fazer uma implementação visual sem DND por enquanto, e usar botões de ação, 
// pois é mais garantido de funcionar sem dependências extras.

const SalesFunnel = () => {


    const { currentTheme, isDark } = useTheme();
    const [funnelItems, setFunnelItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState({ open: false, variant: 'info', title: '', message: '' });

    // Filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const navigate = useNavigate();

    // Migração
    const [showClientModal, setShowClientModal] = useState(false);
    const [selectedLeadForMigration, setSelectedLeadForMigration] = useState(null);

    // Archive State
    const [showArchiveModal, setShowArchiveModal] = useState(false);
    const [selectedItemForArchive, setSelectedItemForArchive] = useState(null);
    const [archiveReason, setArchiveReason] = useState('');

    // Chat Modal State
    const [showChatModal, setShowChatModal] = useState(false);
    const [selectedLeadForChat, setSelectedLeadForChat] = useState(null);

    // Help Modal State
    const [showHelpModal, setShowHelpModal] = useState(false);

    const handleArchiveClick = (item) => {
        setSelectedItemForArchive(item);
        setArchiveReason('');
        setShowArchiveModal(true);
    };

    const handleConfirmArchive = async () => {
        if (!archiveReason.trim()) {
            showAlert('warning', 'Atenção', 'Por favor, informe o motivo da perda.');
            return;
        }

        try {
            await apiService.updateLead(selectedItemForArchive.lead.id, {
                active: false,
                lostReason: archiveReason
            });

            // Remove from local state
            setFunnelItems(prev => prev.filter(i => i.id !== selectedItemForArchive.id));
            showAlert('success', 'Sucesso', 'Lead arquivado com sucesso.');
            setShowArchiveModal(false);
        } catch (error) {
            console.error('Erro ao arquivar lead:', error);
            showAlert('error', 'Erro', 'Falha ao arquivar lead.');
        }
    };

    const stages = {
        TOP: { label: 'Topo (Prospecção)', color: '#3b82f6' },
        MIDDLE: { label: 'Meio (Qualificação)', color: '#eab308' },
        BOTTOM: { label: 'Fundo (Proposta)', color: '#f97316' },
        POST_SALE: { label: 'Pós-venda (Contrato)', color: '#10b981' }
    };

    const fetchFunnel = async () => {
        try {
            setLoading(true);
            const response = await apiService.getFunnel();
            setFunnelItems(response.data || []);
        } catch (error) {
            console.error('Erro ao buscar funil:', error);
            showAlert('error', 'Erro', 'Falha ao carregar funil de vendas');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFunnel();
    }, []);

    const showAlert = (variant, title, message) => {
        setAlert({ open: true, variant, title, message });
    };

    const handleMoveStage = async (itemId, newStage) => {
        try {
            await apiService.updateFunnelStage(itemId, newStage);
            // Atualizar localmente para feedback rápido
            setFunnelItems(prev => prev.map(item =>
                item.id === itemId ? { ...item, stage: newStage } : item
            ));
            showAlert('success', 'Sucesso', 'Estágio atualizado com sucesso');
        } catch (error) {
            console.error('Erro ao mover estágio:', error);
            showAlert('error', 'Erro', 'Erro ao atualizar estágio');
        }
    };

    const handleMigrateClick = (item) => {
        setSelectedLeadForMigration(item.lead);
        setShowClientModal(true);
    };

    const handleMigrationSuccess = async (newClient) => {
        showAlert('success', 'Sucesso', `Cliente ${newClient.name} criado com sucesso!`);

        // Opcional: Mover o lead para Pós-Venda automaticamente após virar cliente
        const item = funnelItems.find(i => i.lead.email === newClient.email || i.lead.phone === newClient.phone);
        if (item && item.stage !== 'POST_SALE') {
            try {
                await apiService.updateFunnelStage(item.id, 'POST_SALE');
                setFunnelItems(prev => prev.map(i =>
                    i.id === item.id ? { ...i, stage: 'POST_SALE' } : i
                ));
            } catch (err) {
                console.error("Erro ao mover para pós-venda automaticamente", err);
            }
        }
    };

    const handleChatClick = (lead) => {
        if (!lead.phone) {
            showAlert('warning', 'Atenção', 'Este lead não possui telefone cadastrado.');
            return;
        }
        setSelectedLeadForChat(lead);
        setShowChatModal(true);
    };

    const handleConfirmChat = async () => {
        if (!selectedLeadForChat) return;

        try {
            setLoading(true);
            const response = await apiService.startChat({
                number: selectedLeadForChat.phone,
                clientId: null
            });

            if (response.data && response.data.id) {
                navigate(`/chat?chatId=${response.data.id}`);
            } else {
                showAlert('error', 'Erro', 'Falha ao iniciar conversa.');
            }
        } catch (error) {
            console.error('Erro ao iniciar chat:', error);
            showAlert('error', 'Erro', 'Falha ao abrir o chat.');
        } finally {
            setLoading(false);
            setShowChatModal(false);
        }
    };

    const getItemsByStage = (stageKey) => {
        return funnelItems.filter(item => {
            // Filtro de Estágio
            if (item.stage !== stageKey) return false;

            // Filtro de Texto (Nome, Email, Telefone do Lead)
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch =
                !searchTerm ||
                item.lead.name?.toLowerCase().includes(searchLower) ||
                item.lead.surname?.toLowerCase().includes(searchLower) ||
                item.lead.email?.toLowerCase().includes(searchLower) ||
                item.lead.phone?.includes(searchTerm);

            if (!matchesSearch) return false;

            // Filtro de Data
            if (startDate) {
                const itemDate = new Date(item.updatedAt); // ou createdAt
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                if (itemDate < start) return false;
            }

            if (endDate) {
                const itemDate = new Date(item.updatedAt);
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                if (itemDate > end) return false;
            }

            return true;
        });
    };

    const styles = {
        container: {
            padding: '24px',
            backgroundColor: currentTheme.background,
            height: '100%',
            fontFamily: 'Inter, sans-serif',
            maxWidth: '100%',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        },
        header: { marginBottom: '24px' },
        title: { fontSize: '24px', fontWeight: 'bold', color: currentTheme.textPrimary, marginBottom: '16px' },
        filtersContainer: {
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            alignItems: 'center',
            marginBottom: '16px',
            backgroundColor: currentTheme.cardBackground,
            padding: '16px',
            borderRadius: '8px',
            border: `1px solid ${currentTheme.border}`,
            boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)'
        },
        inputGroup: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            position: 'relative'
        },
        input: {
            padding: '8px 12px',
            paddingLeft: '36px', // space for icon
            borderRadius: '6px',
            border: `1px solid ${currentTheme.border}`,
            backgroundColor: currentTheme.background,
            color: currentTheme.textPrimary,
            fontSize: '14px',
            outline: 'none',
            minWidth: '200px'
        },
        dateInput: {
            padding: '8px 12px',
            borderRadius: '6px',
            border: `1px solid ${currentTheme.border}`,
            backgroundColor: currentTheme.background,
            color: currentTheme.textPrimary,
            fontSize: '14px',
            outline: 'none'
        },
        icon: {
            position: 'absolute',
            left: '10px',
            color: currentTheme.textSecondary,
            pointerEvents: 'none'
        },
        board: {
            display: 'flex',
            gap: '16px',
            overflowX: 'auto',
            paddingBottom: '16px',
            flex: 1,
            width: '100%'
        },
        column: {
            flex: '0 0 300px',
            backgroundColor: currentTheme.cardBackground,
            borderRadius: '8px',
            border: `1px solid ${currentTheme.border}`,
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
        },
        columnHeader: (color) => ({
            padding: '12px 16px',
            borderBottom: `1px solid ${currentTheme.border}`,
            fontWeight: '600',
            color: currentTheme.textPrimary,
            borderTop: `4px solid ${color}`,
            backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
            borderTopLeftRadius: '8px',
            borderTopRightRadius: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        }),
        columnContent: {
            padding: '12px',
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
        },
        card: {
            backgroundColor: isDark ? currentTheme.background : '#fff',
            borderRadius: '6px',
            padding: '12px',
            boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
            border: `1px solid ${currentTheme.borderLight}`,
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s',
            ':hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
            }
        },
        cardTitle: {
            fontWeight: '500',
            color: currentTheme.textPrimary,
            marginBottom: '4px',
            fontSize: '14px'
        },
        cardSubtitle: {
            fontSize: '12px',
            color: currentTheme.textSecondary,
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
        },
        actions: {
            display: 'flex',
            justifyContent: 'space-between', // Changed to space-between to accommodate migrate btn
            alignItems: 'center',
            gap: '4px',
            marginTop: '8px',
            paddingTop: '8px',
            borderTop: `1px dashed ${currentTheme.borderLight}`
        },
        actionBtn: {
            fontSize: '10px',
            padding: '4px 8px',
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: isDark ? currentTheme.backgroundSecondary : '#f3f4f6',
            color: currentTheme.textSecondary
        },
        migrateBtn: {
            fontSize: '10px',
            padding: '4px 8px',
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: '#10b981', // green
            color: '#fff',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
        }
    };

    // formatar telefone (XX) XXXX-XXXX ou (XX) XXXXX-XXXX
    const formatPhone = (phone) => {
        if (!phone) return '';
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 11) {
            return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        } else if (cleaned.length === 10) {
            return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        }
        return phone;
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.title}>Funil de Vendas</h1>

                {/* Filtros */}
                <div style={styles.filtersContainer}>
                    <div style={styles.inputGroup}>
                        <Search size={16} style={styles.icon} />
                        <input
                            type="text"
                            placeholder="Buscar Lead (Nome, Email, Tel)"
                            style={styles.input}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: currentTheme.textSecondary, fontSize: '14px' }}>
                        <Calendar size={16} />
                        <span>De:</span>
                        <input
                            type="date"
                            style={styles.dateInput}
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                        <span>Até:</span>
                        <input
                            type="date"
                            style={styles.dateInput}
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>

                    {(searchTerm || startDate || endDate) && (
                        <button
                            onClick={() => { setSearchTerm(''); setStartDate(''); setEndDate(''); }}
                            style={{
                                ...styles.actionBtn,
                                backgroundColor: '#ef4444',
                                color: 'white',
                                marginLeft: 'auto'
                            }}
                        >
                            Limpar Filtros
                        </button>
                    )}
                </div>
            </div>

            <AlertToast
                open={alert.open}
                variant={alert.variant}
                title={alert.title}
                message={alert.message}
                onClose={() => setAlert({ ...alert, open: false })}
            />

            <ClientCreationModal
                isOpen={showClientModal}
                onClose={() => setShowClientModal(false)}
                onSuccess={handleMigrationSuccess}
                initialData={selectedLeadForMigration}
            />

            {loading ? (
                <div style={{ color: currentTheme.textSecondary, display: 'flex', justifyContent: 'center', padding: '40px' }}>
                    Carregando funil...
                </div>
            ) : (
                <div style={styles.board}>
                    {Object.entries(stages).map(([key, stage]) => (
                        <div key={key} style={styles.column}>
                            <div style={styles.columnHeader(stage.color)}>
                                <span>{stage.label}</span>
                                <span style={{
                                    fontSize: '12px',
                                    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                                    padding: '2px 8px',
                                    borderRadius: '12px'
                                }}>
                                    {getItemsByStage(key).length}
                                </span>
                            </div>
                            <div style={styles.columnContent}>
                                {getItemsByStage(key).map(item => (
                                    <div key={item.id} style={styles.card}>
                                        <div style={styles.cardTitle}>{item.lead.name} {item.lead.surname}</div>
                                        <div style={styles.cardSubtitle}>
                                            <User size={12} />
                                            {item.lead.phone || item.lead.email || 'Sem contato'}
                                        </div>
                                        <div style={styles.cardSubtitle}>
                                            <Calendar size={12} />
                                            {new Date(item.updatedAt).toLocaleDateString()}
                                        </div>

                                        <div style={styles.actions}>
                                            {/* Left side actions (Migrate + Chat) */}
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                <button
                                                    style={styles.migrateBtn}
                                                    onClick={() => handleMigrateClick(item)}
                                                    title="Migrar para Cliente"
                                                >
                                                    <UserPlus size={10} />
                                                    Cliente
                                                </button>

                                                <button
                                                    style={{ ...styles.actionBtn, backgroundColor: '#3b82f6', color: '#fff' }}
                                                    onClick={() => handleChatClick(item.lead)}
                                                    title="Abrir Chat"
                                                >
                                                    <MessageCircle size={10} />
                                                     Chat
                                                </button>
                                            </div>

                                            {/* Center action (Archive) */}
                                            <div>
                                                <button
                                                    style={{ ...styles.actionBtn, color: '#ef4444', backgroundColor: isDark ? '#450a0a' : '#fef2f2' }}
                                                    onClick={() => handleArchiveClick(item)}
                                                    title="Arquivar (Perda)"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>

                                            {/* Right side actions (Move) */}
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                {key !== 'TOP' && (
                                                    <button
                                                        style={styles.actionBtn}
                                                        onClick={() => handleMoveStage(item.id,
                                                            key === 'MIDDLE' ? 'TOP' :
                                                                key === 'BOTTOM' ? 'MIDDLE' : 'BOTTOM'
                                                        )}
                                                        title="Voltar Etapa"
                                                    >
                                                        ←
                                                    </button>
                                                )}
                                                {key !== 'POST_SALE' && (
                                                    <button
                                                        style={{ ...styles.actionBtn, backgroundColor: stage.color, color: '#fff' }}
                                                        onClick={() => handleMoveStage(item.id,
                                                            key === 'TOP' ? 'MIDDLE' :
                                                                key === 'MIDDLE' ? 'BOTTOM' : 'POST_SALE'
                                                        )}
                                                        title="Avançar Etapa"
                                                    >
                                                        →
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {getItemsByStage(key).length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '20px', color: currentTheme.textMuted, fontSize: '12px', fontStyle: 'italic' }}>
                                        Nenhum lead
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', paddingBottom: '16px' }}>
                <button
                    onClick={() => setShowHelpModal(true)}
                    style={{
                        background: 'none', border: 'none', color: '#3b82f6',
                        cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px',
                        textDecoration: 'underline'
                    }}
                >
                    <HelpCircle size={16} /> Como funciona o Funil de Vendas?
                </button>
            </div>

            {/* Modal Arquivar (Excluir do Funil) */}
            {showArchiveModal && (
                <div style={{
                    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }} onClick={() => setShowArchiveModal(false)}>
                    <div style={{
                        backgroundColor: currentTheme.cardBackground,
                        borderRadius: '8px',
                        width: '100%', maxWidth: '400px',
                        border: `1px solid ${currentTheme.borderLight}`,
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{
                            padding: '16px 24px',
                            borderBottom: `1px solid ${currentTheme.border}`,
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: currentTheme.textPrimary }}>Arquivar Lead</h3>
                            <button onClick={() => setShowArchiveModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: currentTheme.textSecondary }}>
                                <X size={24} />
                            </button>
                        </div>
                        <div style={{ padding: '24px' }}>
                            <p style={{ marginBottom: '16px', color: currentTheme.textSecondary }}>
                                Deseja arquivar o lead <b>{selectedItemForArchive?.lead?.name}</b>?<br />
                                Ele será removido do funil mas continuará na base de dados (inativo).
                            </p>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: currentTheme.textPrimary }}>
                                Motivo da perda: <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                style={{
                                    width: '100%', padding: '8px', borderRadius: '6px',
                                    border: `1px solid ${currentTheme.border}`,
                                    backgroundColor: currentTheme.background,
                                    color: currentTheme.textPrimary,
                                    outline: 'none', minHeight: '80px', fontSize: '14px'
                                }}
                                value={archiveReason}
                                onChange={(e) => setArchiveReason(e.target.value)}
                                placeholder="Ex: Cliente não tinha orçamento..."
                            />
                        </div>
                        <div style={{
                            padding: '16px 24px',
                            borderTop: `1px solid ${currentTheme.border}`,
                            display: 'flex', justifyContent: 'flex-end', gap: '8px',
                            backgroundColor: isDark ? currentTheme.background : '#f9fafb',
                            borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px'
                        }}>
                            <button
                                onClick={() => setShowArchiveModal(false)}
                                style={{
                                    padding: '8px 16px', borderRadius: '6px',
                                    border: `1px solid ${currentTheme.border}`,
                                    backgroundColor: isDark ? currentTheme.cardBackground : '#fff',
                                    color: currentTheme.textPrimary, cursor: 'pointer'
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmArchive}
                                style={{
                                    padding: '8px 16px', borderRadius: '6px', border: 'none',
                                    backgroundColor: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: '500'
                                }}
                            >
                                Arquivar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Como Funciona */}
            {showHelpModal && (
                <div style={{
                    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }} onClick={() => setShowHelpModal(false)}>
                    <div style={{
                        backgroundColor: currentTheme.cardBackground,
                        borderRadius: '8px',
                        width: '100%', maxWidth: '600px', maxHeight: '90vh',
                        border: `1px solid ${currentTheme.borderLight}`,
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        display: 'flex', flexDirection: 'column'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{
                            padding: '16px 24px',
                            borderBottom: `1px solid ${currentTheme.border}`,
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: currentTheme.textPrimary }}>Como funciona o Funil de Vendas</h3>
                            <button onClick={() => setShowHelpModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: currentTheme.textSecondary }}>
                                <X size={24} />
                            </button>
                        </div>
                        <div style={{ padding: '24px', overflowY: 'auto', lineHeight: '1.6', color: currentTheme.textPrimary }}>
                            <p><strong>O funil de vendas</strong> é um modelo que representa todas as etapas pelas quais um potencial cliente passa, desde o primeiro contato com a empresa até a efetivação da venda.</p>
                            <br />
                            <p>O objetivo é organizar o processo comercial, padronizar o atendimento e aumentar a taxa de conversão.</p>

                            <h4 style={{ marginTop: '16px', marginBottom: '8px', fontWeight: 'bold' }}>Etapas do Funil</h4>

                            <div style={{ marginBottom: '16px' }}>
                                <strong style={{ color: '#3b82f6' }}>1. Topo do Funil – Prospecção / Leads</strong>
                                <p style={{ fontSize: '13px', marginTop: '4px' }}>Etapa inicial. Leads que demonstraram interesse mas ainda não estão prontos. Ações: Identificar necessidade e realizar primeiro atendimento.</p>
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <strong style={{ color: '#eab308' }}>2. Meio do Funil – Qualificação / Oportunidade</strong>
                                <p style={{ fontSize: '13px', marginTop: '4px' }}>Lead com interesse real. Momento de apresentar a solução, tirar dúvidas e enviar propostas.</p>
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <strong style={{ color: '#f97316' }}>3. Fundo do Funil – Negociação / Fechamento</strong>
                                <p style={{ fontSize: '13px', marginTop: '4px' }}>Etapa final. Cliente pronto para decidir. Ações: Negociação, contrato e fechamento.</p>
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <strong style={{ color: '#10b981' }}>4. Pós-venda – Relacionamento</strong>
                                <p style={{ fontSize: '13px', marginTop: '4px' }}>Cliente comprou. Foco em fidelização, suporte e garantir a satisfação.</p>
                            </div>

                            <p style={{ fontStyle: 'italic', fontSize: '13px', color: currentTheme.textSecondary, marginTop: '24px' }}>
                                "Seguir o funil corretamente significa vender mais, com melhor qualidade e previsibilidade."
                            </p>
                        </div>
                        <div style={{
                            padding: '16px 24px',
                            borderTop: `1px solid ${currentTheme.border}`,
                            display: 'flex', justifyContent: 'flex-end',
                            backgroundColor: isDark ? currentTheme.background : '#f9fafb',
                            borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px'
                        }}>
                            <button
                                onClick={() => setShowHelpModal(false)}
                                style={{
                                    backgroundColor: '#3b82f6', color: '#fff', border: 'none',
                                    padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500'
                                }}
                            >
                                Entendi, fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Modal Confirmar Chat */}
            {showChatModal && (
                <div style={{
                    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }} onClick={() => setShowChatModal(false)}>
                    <div style={{
                        backgroundColor: currentTheme.cardBackground,
                        borderRadius: '8px',
                        width: '100%', maxWidth: '400px',
                        border: `1px solid ${currentTheme.borderLight}`,
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{
                            padding: '16px 24px',
                            borderBottom: `1px solid ${currentTheme.border}`,
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: currentTheme.textPrimary }}>Iniciar Atendimento</h3>
                            <button onClick={() => setShowChatModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: currentTheme.textSecondary }}>
                                <X size={24} />
                            </button>
                        </div>
                        <div style={{ padding: '24px' }}>
                            <p style={{ marginBottom: '16px', color: currentTheme.textSecondary }}>
                                Deseja iniciar uma conversa com <b>{selectedLeadForChat?.name}</b> pelo número: {formatPhone(selectedLeadForChat?.phone)}?
                            </p>
                            <p style={{ fontSize: '13px', color: currentTheme.textMuted }}>
                                Isso abrirá a tela de chat e você poderá enviar mensagens imediatamente pelo WhatsApp.
                            </p>
                        </div>
                        <div style={{
                            padding: '16px 24px',
                            borderTop: `1px solid ${currentTheme.border}`,
                            display: 'flex', justifyContent: 'flex-end', gap: '8px',
                            backgroundColor: isDark ? currentTheme.background : '#f9fafb',
                            borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px'
                        }}>
                            <button
                                onClick={() => setShowChatModal(false)}
                                style={{
                                    padding: '8px 16px', borderRadius: '6px',
                                    border: `1px solid ${currentTheme.border}`,
                                    backgroundColor: isDark ? currentTheme.cardBackground : '#fff',
                                    color: currentTheme.textPrimary, cursor: 'pointer'
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmChat}
                                style={{
                                    padding: '8px 16px', borderRadius: '6px', border: 'none',
                                    backgroundColor: '#3b82f6', color: '#fff', cursor: 'pointer', fontWeight: '500'
                                }}
                            >
                                Iniciar Chat
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalesFunnel;
