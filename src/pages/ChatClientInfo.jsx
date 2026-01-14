import React, { useState, useEffect } from 'react';
import { User, MapPin, FileText, CheckCircle, AlertTriangle, FileCheck, ClipboardList, PenTool, Plus, Trash2, X, Link, Search, RefreshCw } from 'lucide-react';
import { apiService } from '../services/api';

const ChatClientInfo = ({ chat, currentTheme, onClose }) => {
    const styles = getStyles(currentTheme);
    const [loading, setLoading] = useState(false);
    const [clientInfo, setClientInfo] = useState(null);
    const [selectedContract, setSelectedContract] = useState(null);

    // Modal State
    const [showAddModal, setShowAddModal] = useState(false);
    const [newContract, setNewContract] = useState({ plan: '', status: 'Ativo', externalId: '' });
    const [submitting, setSubmitting] = useState(false);

    // Manual Link/Sync State
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchingClient, setSearchingClient] = useState(false);
    const [syncing, setSyncing] = useState(false);

    useEffect(() => {
        if (chat?.id) {
            console.log('[ChatClientInfo] Loading for chat:', chat.id);
            loadClientInfo();
        }
    }, [chat?.id]);

    useEffect(() => {
        if (chat?.context?.selected_contract && clientInfo?.contracts) {
            const preSelected = clientInfo.contracts.find(c => c.id === chat.context.selected_contract.id) ||
                clientInfo.contracts.find(c => String(c.id) === String(chat.context.selected_contract.id));
            if (preSelected) setSelectedContract(preSelected);
        } else if (clientInfo?.contracts && clientInfo.contracts.length > 0 && !selectedContract) {
            setSelectedContract(clientInfo.contracts[0]);
        }
    }, [clientInfo, chat]);

    const loadClientInfo = async () => {
        try {
            setLoading(true);
            const response = await apiService.getChatClientInfo(chat.id);
            const data = response.data?.client;
            setClientInfo(data);

            // Re-select contract if needed
            if (data?.contracts?.length > 0) {
                if (selectedContract) {
                    const stillExists = data.contracts.find(c => c.id === selectedContract.id);
                    setSelectedContract(stillExists || data.contracts[0]);
                } else {
                    setSelectedContract(data.contracts[0]);
                }
            } else {
                setSelectedContract(null);
            }
        } catch (error) {
            console.error("Failed to load client info", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddContract = async () => {
        if (!newContract.plan) return alert('O nome do plano é obrigatório');
        try {
            setSubmitting(true);
            await apiService.addClientContract(clientInfo.id, newContract);
            setShowAddModal(false);
            setNewContract({ plan: '', status: 'Ativo', externalId: '' });
            await loadClientInfo(); // Refresh list
        } catch (error) {
            alert('Erro ao adicionar contrato');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteContract = async () => {
        if (!selectedContract) return;
        if (!window.confirm(`Tem certeza que deseja excluir o contrato "${selectedContract.plan}"?`)) return;

        try {
            setLoading(true);
            await apiService.deleteClientContract(clientInfo.id, selectedContract.id);
            await loadClientInfo();
        } catch (error) {
            alert('Erro ao excluir contrato');
            setLoading(false);
        }
    };

    const actions = [
        { label: 'Verificar Conexão', icon: <CheckCircle size={16} />, color: '#10b981' },
        { label: 'Faturas em Aberto', icon: <AlertTriangle size={16} />, color: '#f59e0b' },
        { label: 'Desbloqueio Confiança', icon: <FileCheck size={16} />, color: '#3b82f6' },
        { label: 'Chamados', icon: <ClipboardList size={16} />, color: '#6366f1' },
        { label: 'Assinatura Digital', icon: <PenTool size={16} />, color: '#8b5cf6' },
    ];

    const handleSearchClients = async (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (query.length < 3) return;

        try {
            setSearchingClient(true);
            const response = await apiService.getClients({ search: query, limit: 5 });
            setSearchResults(response.data?.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setSearchingClient(false);
        }
    };

    const handleLinkClient = async (client) => {
        if (!window.confirm(`Vincular este chat ao cliente "${client.name}"?`)) return;
        try {
            setLoading(true);
            await apiService.linkClientToChat(chat.id, client.id);
            setShowLinkModal(false);
            setSearchQuery('');
            setSearchResults([]);
            loadClientInfo(); // Reload
        } catch (error) {
            alert('Erro ao vincular cliente: ' + (error.response?.data?.error || error.message));
            setLoading(false);
        }
    };

    const handleSyncClient = async () => {
        try {
            setSyncing(true);
            const response = await apiService.syncClientForChat(chat.id);
            alert(response.data.message || 'Sincronização concluída');
            loadClientInfo();
        } catch (error) {
            alert('Erro ao sincronizar: ' + (error.response?.data?.message || error.message));
        } finally {
            setSyncing(false);
        }
    };

    if (loading && !clientInfo) {
        return <div style={styles.container}><div style={styles.loading}>Carregando dados...</div></div>;
    }

    if (!clientInfo) {
        return (
            <div style={styles.container}>
                <div style={styles.empty}>
                    <User size={48} style={{ opacity: 0.3, marginBottom: '10px' }} />
                    <p style={{ marginBottom: '20px' }}>Cliente não identificado ou não vinculado.</p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                        <button onClick={() => setShowLinkModal(true)} style={styles.outlineButton}>
                            <Link size={16} /> Vincular Cliente (Local)
                        </button>
                        <button onClick={handleSyncClient} disabled={syncing} style={styles.outlineButton}>
                            <RefreshCw size={16} className={syncing ? 'spin' : ''} />
                            {syncing ? 'Sincronizando...' : 'Sincronizar do ERP'}
                        </button>
                    </div>
                </div>

                {/* Link Modal */}
                {showLinkModal && (
                    <div style={styles.modalOverlay}>
                        <div style={styles.modalContent}>
                            <div style={styles.modalHeader}>
                                <h4 style={styles.modalTitle}>Vincular Cliente</h4>
                                <button onClick={() => setShowLinkModal(false)} style={styles.closeButton}><X size={16} /></button>
                            </div>
                            <div style={styles.inputGroup}>
                                <div style={{ position: 'relative' }}>
                                    <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: '#9ca3af' }} />
                                    <input
                                        style={{ ...styles.input, paddingLeft: '35px' }}
                                        value={searchQuery}
                                        onChange={handleSearchClients}
                                        placeholder="Buscar por nome ou CPF/CNPJ..."
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                {searchingClient && <div style={{ padding: '10px', textAlign: 'center', color: '#9ca3af' }}>Buscando...</div>}
                                {!searchingClient && searchResults.length === 0 && searchQuery.length >= 3 && (
                                    <div style={{ padding: '10px', textAlign: 'center', color: '#9ca3af' }}>Nenhum cliente encontrado.</div>
                                )}
                                {searchResults.map(client => (
                                    <div
                                        key={client.id}
                                        onClick={() => handleLinkClient(client)}
                                        style={styles.searchResultItem}
                                    >
                                        <div style={{ fontWeight: 'bold' }}>{client.name}</div>
                                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                            CPF: {client.cpfCnpj} | Tel: {client.cellphone || 'N/A'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.section}>
                <h3 style={styles.title}>{clientInfo.name}</h3>
                <p style={styles.subtitle}>{clientInfo.cpfCnpj}</p>
                <p style={styles.subtitle}>{clientInfo.cellphone}</p>
            </div>

            <hr style={styles.divider} />

            {/* Contract Selector */}
            <div style={styles.section}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ ...styles.label, marginBottom: 0 }}>CONTRATOS</label>
                    <button
                        onClick={() => setShowAddModal(true)}
                        style={styles.iconButton}
                        title="Adicionar Contrato Manualmente"
                    >
                        <Plus size={14} />
                    </button>
                </div>

                <select
                    style={styles.select}
                    value={selectedContract?.id || ''}
                    onChange={(e) => {
                        const found = clientInfo.contracts.find(c => c.id === Number(e.target.value));
                        setSelectedContract(found);
                    }}
                >
                    {clientInfo.contracts && clientInfo.contracts.length > 0 ? (
                        clientInfo.contracts.map(c => (
                            <option key={c.id} value={c.id}>
                                {c.plan} {c.externalId ? `(#${c.externalId})` : ''}
                            </option>
                        ))
                    ) : (
                        <option value="">Nenhum contrato</option>
                    )}
                </select>
            </div>

            {/* Contract Details */}
            {selectedContract && (
                <div style={styles.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={styles.row}>
                            <MapPin size={16} style={styles.icon} />
                            <span style={styles.text}>
                                {clientInfo.address ? `${clientInfo.address}, ${clientInfo.number}` : 'Endereço não informado'}
                                {clientInfo.city ? ` - ${clientInfo.city}` : ''}
                            </span>
                        </div>
                        {/* Delete Button */}
                        <button
                            onClick={handleDeleteContract}
                            style={{ ...styles.iconButton, color: '#ef4444' }}
                            title="Excluir Contrato"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>

                    <div style={styles.row}>
                        <FileText size={16} style={styles.icon} />
                        <span style={styles.text}>{selectedContract.plan}</span>
                    </div>

                    <div style={styles.badgeRow}>
                        <span style={{
                            ...styles.badge,
                            backgroundColor: (selectedContract.status || '').toLowerCase().includes('ativo') ? '#d1fae5' : '#fee2e2',
                            color: (selectedContract.status || '').toLowerCase().includes('ativo') ? '#059669' : '#dc2626'
                        }}>
                            {selectedContract.status || 'Status Desconhecido'}
                        </span>
                    </div>
                </div>
            )}

            {/* Actions Grid */}
            <div style={styles.actionsGrid}>
                {actions.map((action, idx) => (
                    <button key={idx} style={styles.actionButton}>
                        <div style={{ ...styles.actionIcon, backgroundColor: `${action.color}20`, color: action.color }}>
                            {action.icon}
                        </div>
                        <span style={styles.actionLabel}>{action.label}</span>
                    </button>
                ))}
            </div>

            {/* Simple Add Modal */}
            {showAddModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <div style={styles.modalHeader}>
                            <h4 style={styles.modalTitle}>Novo Contrato</h4>
                            <button onClick={() => setShowAddModal(false)} style={styles.closeButton}><X size={16} /></button>
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Plano *</label>
                            <input
                                style={styles.input}
                                value={newContract.plan}
                                onChange={e => setNewContract({ ...newContract, plan: e.target.value })}
                                placeholder="Ex: Internet 500MB"
                            />
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>ID Externo (Opcional)</label>
                            <input
                                style={styles.input}
                                value={newContract.externalId}
                                onChange={e => setNewContract({ ...newContract, externalId: e.target.value })}
                                placeholder="Ex: 12345"
                            />
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Status</label>
                            <select
                                style={styles.select}
                                value={newContract.status}
                                onChange={e => setNewContract({ ...newContract, status: e.target.value })}
                            >
                                <option value="Ativo">Ativo</option>
                                <option value="Bloqueado">Bloqueado</option>
                                <option value="Cancelado">Cancelado</option>
                            </select>
                        </div>
                        <div style={styles.modalActions}>
                            <button onClick={() => setShowAddModal(false)} style={styles.cancelButton}>Cancelar</button>
                            <button onClick={handleAddContract} disabled={submitting} style={styles.saveButton}>
                                {submitting ? 'Salvando...' : 'Salvar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const getStyles = (theme) => ({
    container: {
        width: '300px',
        height: '100%',
        backgroundColor: theme.sidebarBackground || theme.background,
        borderLeft: `1px solid ${theme.border}`,
        display: 'flex',
        flexDirection: 'column',
        padding: '20px',
        overflowY: 'auto',
        position: 'relative' // For modal overlay
    },
    loading: {
        color: theme.textSecondary,
        textAlign: 'center',
        marginTop: '40px'
    },
    empty: {
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%',
        color: theme.textSecondary, textAlign: 'center'
    },
    section: {
        display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px'
    },
    title: {
        fontSize: '18px', fontWeight: 'bold', color: theme.textPrimary, margin: 0
    },
    subtitle: {
        fontSize: '13px', color: theme.textSecondary, margin: 0
    },
    divider: {
        border: 'none', borderTop: `1px solid ${theme.border}`, margin: '0 0 16px 0'
    },
    label: {
        fontSize: '12px', fontWeight: '600', color: theme.textSecondary, marginBottom: '8px', textTransform: 'uppercase'
    },
    select: {
        padding: '8px', borderRadius: '6px', border: `1px solid ${theme.border}`,
        backgroundColor: theme.background, color: theme.textPrimary, fontSize: '14px', outline: 'none', width: '100%'
    },
    input: {
        padding: '8px', borderRadius: '6px', border: `1px solid ${theme.border}`,
        backgroundColor: theme.background, color: theme.textPrimary, fontSize: '14px', outline: 'none', width: '100%'
    },
    card: {
        backgroundColor: theme.background, borderRadius: '8px', border: `1px solid ${theme.border}`,
        padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px',
        boxShadow: theme.shadow
    },
    row: {
        display: 'flex', alignItems: 'flex-start', gap: '8px', flex: 1
    },
    icon: {
        color: theme.textSecondary, minWidth: '16px', marginTop: '3px'
    },
    text: {
        fontSize: '13px', color: theme.textPrimary, lineHeight: '1.4'
    },
    badgeRow: {
        marginTop: '4px'
    },
    badge: {
        padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase'
    },
    actionsGrid: {
        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px'
    },
    actionButton: {
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '12px', backgroundColor: theme.background, border: `1px solid ${theme.border}`,
        borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s',
        ':hover': { borderColor: theme.primary, backgroundColor: `${theme.primary}05` }
    },
    actionIcon: {
        width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px'
    },
    actionLabel: {
        fontSize: '11px', fontWeight: '500', color: theme.textSecondary, textAlign: 'center'
    },
    // New Styles
    iconButton: {
        background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.textSecondary,
        ':hover': { color: theme.primary }
    },
    modalOverlay: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 10
    },
    modalContent: {
        width: '90%', backgroundColor: theme.background, borderRadius: '8px', padding: '16px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    },
    modalHeader: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'
    },
    modalTitle: { margin: 0, fontSize: '16px', fontWeight: 'bold', color: theme.textPrimary },
    closeButton: { background: 'none', border: 'none', cursor: 'pointer', color: theme.textSecondary },
    inputGroup: { marginBottom: '12px' },
    modalActions: { display: 'flex', gap: '10px', marginTop: '16px', justifyContent: 'flex-end' },
    saveButton: {
        padding: '8px 16px', backgroundColor: theme.primary || '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px'
    },
    cancelButton: {
        padding: '8px 16px', backgroundColor: 'transparent', color: theme.textSecondary, border: `1px solid ${theme.border}`, borderRadius: '6px', cursor: 'pointer', fontSize: '13px'
    },
    outlineButton: {
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        padding: '10px', backgroundColor: 'transparent', border: `1px solid ${theme.border}`,
        color: theme.textPrimary, borderRadius: '6px', cursor: 'pointer', fontSize: '13px',
        transition: 'all 0.2s', width: '100%',
        ':hover': { backgroundColor: theme.borderLight }
    },
    searchResultItem: {
        padding: '10px', border: `1px solid ${theme.border}`, borderRadius: '6px',
        cursor: 'pointer', backgroundColor: theme.cardBackground || theme.background,
        transition: 'background 0.2s',
        ':hover': { backgroundColor: theme.borderLight }
    }
});

export default ChatClientInfo;
