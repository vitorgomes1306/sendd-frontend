import React, { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import { User, MapPin, FileText, CheckCircle, LockKeyholeOpen, AlertTriangle, Wifi, FileCheck, ClipboardList, MonitorUp, PenTool, Plus, Trash2, X, Link, Search, RefreshCw, QrCode, Barcode, MessageSquare, Send, CircleDollarSign, Zap } from 'lucide-react';

// ... (existing code top)

// ... (deleted duplicates)
import { apiService } from '../services/api';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';

const formatCpfCnpj = (value) => {
    if (!value) return 'CPF/CNPJ não informado';
    const clean = value.replace(/\D/g, '');
    if (clean.length === 11) {
        return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    if (clean.length === 14) {
        return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return value;
};

const formatPhone = (value) => {
    if (!value) return 'Telefone não informado';
    let clean = value.replace(/\D/g, '');
    if (clean.startsWith('55') && clean.length >= 12) clean = clean.substring(2);

    if (clean.length === 11) {
        return clean.replace(/(\d{2})(\d{1})(\d{4})(\d{4})/, '($1) $2 $3-$4');
    }
    if (clean.length === 10) {
        return clean.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return value;
};

const formatDuration = (startTime) => {
    if (!startTime) return '-';
    const start = new Date(startTime);
    const now = new Date();
    const diff = now - start;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const dStr = days > 0 ? `${String(days).padStart(2, '0')}d ` : '';
    return `${dStr}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const getConnValue = (conn, keys) => {
    if (!conn) return null;
    for (const k of keys) {
        if (conn[k] !== undefined && conn[k] !== null) return conn[k];
        const lowerK = k.toLowerCase();
        const foundKey = Object.keys(conn).find(ck => ck.toLowerCase() === lowerK);
        if (foundKey) return conn[foundKey];
    }
    return null;
};

const formatBytes = (bytes, decimals = 2) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const ChatClientInfo = ({ chat, currentTheme, onClose }) => {
    const { showToast } = useToast();
    const toast = {
        success: (msg) => showToast({ title: 'Sucesso', message: msg, variant: 'success' }),
        error: (msg, options) => showToast({ title: 'Erro', message: msg, variant: 'danger', durationMs: options?.duration || 5000 }),
        info: (msg) => showToast({ title: 'Informação', message: msg, variant: 'info' }),
        warning: (msg) => showToast({ title: 'Atenção', message: msg, variant: 'warning' })
    };
    const styles = getStyles(currentTheme);
    const [loading, setLoading] = useState(false);
    const [clientInfo, setClientInfo] = useState(null);
    const [selectedContract, setSelectedContract] = useState(null);

    // Modal State
    const [showAddModal, setShowAddModal] = useState(false);
    const [unlockConfirmOpen, setUnlockConfirmOpen] = useState(false);
    const [newContract, setNewContract] = useState({ plan: '', status: 'Ativo', externalId: '' });
    const [submitting, setSubmitting] = useState(false);

    // Manual Link/Sync State
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchingClient, setSearchingClient] = useState(false);
    const [syncing, setSyncing] = useState(false);

    // Invoice State
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [sendingInvoice, setSendingInvoice] = useState(null);

    // Connection Check State
    const [showConnectionModal, setShowConnectionModal] = useState(false);
    const [connectionData, setConnectionData] = useState({ loading: false, result: null, error: null });



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

            // Tentar sincronizar dados atualizados do ERP/Integração antes de exibir
            try {
                await apiService.syncClientForChat(chat.id);
            } catch (err) {
                console.warn("[ChatClientInfo] Sync failed, proceeding with existing data:", err);
            }

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

    // Connection Handler
    const handleCheckConnection = async () => {
        if (!clientInfo.cpfCnpj) {
            toast.warning('Cliente não possui CPF/CNPJ cadastrado para verificar conexão.');
            return;
        }
        setShowConnectionModal(true);
        setConnectionData({ loading: true, result: null, error: null });

        try {
            const response = await apiService.checkConnection({
                cpfCnpj: clientInfo.cpfCnpj,
                organizationId: clientInfo.organizationId // Ensure this is available or derived
            });
            setConnectionData({ loading: false, result: response.data, error: null });
        } catch (err) {
            console.error('Connection Check Error:', err);
            setConnectionData({ loading: false, result: null, error: 'Erro ao verificar conexão.' });
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

    // Invoice Handlers
    const executeUnlock = async () => {
        if (!selectedContract) return;

        try {
            toast.info('Solicitando desbloqueio...');
            // API Call
            const response = await apiService.performUnlock(chat.id, selectedContract.id);
            toast.success(response.data.message || 'Desbloqueio realizado!');
            loadClientInfo(); // Refresh status
            setUnlockConfirmOpen(false);
        } catch (error) {
            // Check for blockAction flag from backend
            const msg = error.response?.data?.error || 'Erro ao realizar desbloqueio';
            if (msg.includes('já atingiu o limite')) {
                toast.error(msg, { duration: 5000 });
            } else {
                toast.error(msg);
            }
            // Always close modal ? Or keep open on network error?
            // If it's a limit error, close it.
            setUnlockConfirmOpen(false);
        }
    };

    // Ticket State
    const [showTicketModal, setShowTicketModal] = useState(false); // Form Modal
    const [showTicketListModal, setShowTicketListModal] = useState(false); // List Modal
    const [ticketSubjects, setTicketSubjects] = useState([]);
    const [tickets, setTickets] = useState([]); // List of tickets
    const [loadingSubjects, setLoadingSubjects] = useState(false);
    const [loadingTickets, setLoadingTickets] = useState(false);

    const [ticketData, setTicketData] = useState({
        contractId: '',
        subjectCode: '',
        content: '',
        observation: ''
    });

    // Invoice Handlers
    const handleActionClick = async (actionLabel) => {
        if (actionLabel === 'Faturas em Aberto') {
            setShowInvoiceModal(true);
        } else if (actionLabel === 'Desbloqueio Confiança') {
            if (!selectedContract) return toast.warning('Nenhum contrato selecionado.');
            setUnlockConfirmOpen(true);
        } else if (actionLabel === 'Chamados') {
            // Change: Open List Modal first
            openTicketListModal();
        } else if (actionLabel === 'Verificar Conexão') {
            handleCheckConnection();
        } else {
            toast.info('Funcionalidade em desenvolvimento');
        }
    };

    const openTicketListModal = async () => {
        if (!selectedContract) return toast.warning('Selecione um contrato primeiro.');

        // Reset and show
        setTickets([]);
        setShowTicketListModal(true);
        setLoadingTickets(true);

        try {
            const response = await apiService.getTickets(chat.id, selectedContract.id);
            setTickets(response.data?.tickets || []);
        } catch (error) {
            console.error(error);
            toast.error('Erro ao buscar chamados: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoadingTickets(false);
        }
    };

    const handleNewTicketClick = () => {
        // Switch modals
        setShowTicketListModal(false);
        openTicketModal(); // Prepare and open Form
    };

    const openTicketModal = async () => {
        // if (!selectedContract) return toast.warning('Selecione um contrato primeiro.'); // Already checked in list, but safe to keep
        if (!selectedContract) {
            // Fallback if accessed directly (unlikely)
            setShowTicketListModal(false);
            return toast.warning('Selecione um contrato.');
        }

        setTicketData(prev => ({ ...prev, contractId: selectedContract.id }));
        setShowTicketModal(true);

        if (ticketSubjects.length === 0) {
            setLoadingSubjects(true);
            try {
                const response = await apiService.getTicketSubjects(chat.id);
                // Resposta esperada: Array de { codigo, descricao, ... }
                const list = Array.isArray(response.data) ? response.data : (response.data?.motivos || []);
                setTicketSubjects(list);
            } catch (error) {
                toast.error('Erro ao carregar assuntos: ' + (error.response?.data?.error || error.message));
            } finally {
                setLoadingSubjects(false);
            }
        }
    };

    const handleCreateTicket = async () => {
        if (!ticketData.contractId) return toast.warning('Contrato não selecionado.');
        if (!ticketData.subjectCode) return toast.warning('Selecione o Assunto.');
        if (!ticketData.content) return toast.warning('Preencha a descrição.');

        try {
            setSubmitting(true);
            const response = await apiService.createTicket(chat.id, ticketData);

            // Check for business logic warning (e.g. ticket already exists)
            if (response.data && response.data.msg && (response.data.status === 3 || response.data.msg.includes('já existe'))) {
                toast.warning(response.data.msg);
                // Do not close modal so user can read it? Or close? User said "Mande alerta".
                // I'll keep modal open so they can change selection if needed.
            } else {
                toast.success('Chamado aberto com sucesso!');
                setShowTicketModal(false);
                setTicketData({ contractId: '', subjectCode: '', content: '', observation: '' });
            }
        } catch (error) {
            console.error(error);
            toast.error('Erro ao abrir chamado: ' + (error.response?.data?.error || error.message));
        } finally {
            setSubmitting(false);
        }
    };

    // funcao para criar chamados via API (LEGACY - Remove if duplicate)
    // const createTicket = async () => { ... } // Removed since we have handleCreateTicket now

    const handleSendInvoiceOption = async (invoice, type) => {
        if (!chat?.id) return;

        let messagesToSend = [];

        if (type === 'linha') {
            messagesToSend.push({ text: `Segue linha digitável da fatura *${invoice.description}*:` });
            messagesToSend.push({ text: invoice.digitableLine });
        } else if (type === 'pix') {
            messagesToSend.push({ text: `Segue código PIX Copia e Cola da fatura *${invoice.description}*:` });
            messagesToSend.push({ text: invoice.pixCode });
        } else if (type === 'pix_dinamico') {
            console.log('Action: PIX Dinamico clicked');
            // Using alert to guarantee visibility if toast fails
            // alert('Função não contratada. Solicite em nosso comercial'); 
            return toast.warning('Função não contratada. Solicite em nosso comercial');
        } else if (type === 'link') {
            messagesToSend.push({ text: `Link da fatura *${invoice.description}*:\n${invoice.pdfLink}` });
        } else if (type === 'pdf') {
            // Send PDF as file using mediaUrl suport
            messagesToSend.push({
                text: `Segue PDF da fatura *${invoice.description}*`,
                mediaUrl: invoice.pdfLink,
                mediaType: 'document',
                mediaType: 'document',
                fileName: `Fatura-${invoice.description}.pdf`
            });
        } else if (type === 'public_link') {
            const link = `${window.location.origin}/fatura/${invoice.token}`;
            messagesToSend.push({ text: `Acesse sua fatura pelo link abaixo:\n${link}` });
        } else if (type === 'manual') {
            // Disable manual message
            return toast.info("Função desabilitada no momento");
        }

        if (messagesToSend.length === 0) return toast.warning('Dado não disponível para esta fatura');

        try {
            setSendingInvoice(invoice.id);
            for (const msg of messagesToSend) {
                await apiService.sendMessageManual(chat.id, msg);
                await new Promise(r => setTimeout(r, 500)); // Increased delay for file handling
            }
            toast.success('Enviado com sucesso!');
        } catch (error) {
            console.error(error);
            toast.error('Erro ao enviar');
        } finally {
            setSendingInvoice(null);
        }
    };

    const displayInvoices = (clientInfo?.invoices?.filter(inv => {
        if (!selectedContract) return true;
        return inv.contractId === selectedContract.id || !inv.contractId;
    }) || [])
        // Deduplicate invoices (by externalId or content)
        .filter((inv, index, self) =>
            index === self.findIndex((t) => {
                if (t.externalId && inv.externalId) {
                    return String(t.externalId) === String(inv.externalId);
                }
                return t.description === inv.description && t.value === inv.value && t.dueDate === inv.dueDate;
            })
        )
        .sort((a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0)) // Sort Ascending (Oldest first)
        .slice(0, 6); // Limit to 6

    const actions = [
        { label: 'Verificar Conexão', icon: <Wifi size={20} />, color: '#10b981' },
        { label: 'Faturas em Aberto', icon: <CircleDollarSign size={20} />, color: '#f59e0b' },
        { label: 'Desbloqueio Confiança', icon: <LockKeyholeOpen size={20} />, color: '#f63b3bff' },
        { label: 'Chamados', icon: <ClipboardList size={20} />, color: '#6366f1' },
        { label: 'Assinatura Digital', icon: <PenTool size={20} />, color: '#8b5cf6' },
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
                <p style={styles.subtitle}>{formatCpfCnpj(clientInfo.cpfCnpj)}</p>
                <p style={styles.subtitle}>{formatPhone(clientInfo.cellphone)}</p>
            </div>

            <hr style={styles.divider} />

            {/* Contract Selector */}
            <div style={styles.section}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ ...styles.label, marginBottom: 0 }}>CONTRATOS</label>
                    <button
                        onClick={() => setShowAddModal(true)}
                        style={styles.plusButton}
                        title="Adicionar Contrato Manualmente"
                    >
                        <Plus size={16} />
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
                                {(() => {
                                    const addr = selectedContract?.address || clientInfo.address;
                                    const num = selectedContract?.address ? (selectedContract.number || 'S/N') : clientInfo.number;
                                    const city = selectedContract?.city || clientInfo.city;

                                    if (!addr) return 'Endereço não informado';
                                    return `${addr}, ${num}${city ? ` - ${city}` : ''}`;
                                })()}
                            </span>
                        </div>
                        {/* Delete Button */}
                        <button
                            onClick={handleDeleteContract}
                            style={{ ...styles.iconButton, color: '#ef4444' }}
                            title="Desvincular Contrato"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>

                    <div style={styles.row}>
                        <FileText size={16} style={styles.icon} />
                        <span style={styles.text}>{selectedContract.plan}</span>
                    </div>

                    <div style={styles.badgeRow}>
                        {(() => {
                            const status = (selectedContract.status || '').toLowerCase();
                            let bgColor = '#fee2e2';
                            let color = '#dc2626';

                            if (status.includes('ativo') && !status.includes('reduzida')) {
                                bgColor = '#d1fae5';
                                color = '#059669';
                            } else if (status.includes('ativo') && status.includes('reduzida')) {
                                bgColor = '#ef4444';
                                color = '#ffffff';
                            } else if (status === 'ativo') { // Fallback for plain 'ativo'
                                bgColor = '#d1fae5';
                                color = '#059669';
                            }

                            return (
                                <span style={{ ...styles.badge, backgroundColor: bgColor, color: color }}>
                                    {selectedContract.status || 'Status Desconhecido'}
                                </span>
                            );
                        })()}
                    </div>
                </div>
            )}

            {/* Actions Grid */}
            <div style={styles.actionsGrid}>
                {actions.map((action, idx) => (
                    <button
                        key={idx}
                        style={styles.actionButton}
                        onClick={() => handleActionClick(action.label)}
                    >
                        <div style={{ ...styles.actionIcon, backgroundColor: `${action.color}20`, color: action.color }}>
                            {action.icon}
                        </div>
                        <span style={styles.actionLabel}>{action.label}</span>
                    </button>
                ))}
            </div>

            {/* Invoice Modal */}
            {showInvoiceModal && (
                <div style={styles.modalOverlay}>
                    <div style={{ ...styles.modalContent, width: '600px', maxWidth: '95%' }}>
                        <div style={styles.modalHeader}>
                            <h4 style={styles.modalTitle}>Faturas em Aberto</h4>
                            <button onClick={() => setShowInvoiceModal(false)} style={styles.closeButton}><X size={16} /></button>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                <thead>
                                    <tr style={{ borderBottom: `1px solid ${styles.divider.borderTop ? styles.divider.borderTop.split(' ')[2] : '#eee'}`, textAlign: 'left' }}>
                                        <th style={{ padding: '8px' }}>Nº</th>
                                        <th style={{ padding: '8px' }}>Descrição</th>
                                        <th style={{ padding: '8px' }}>Vencimento</th>
                                        <th style={{ padding: '8px' }}>Valor</th>
                                        <th style={{ padding: '8px', textAlign: 'center' }}>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayInvoices.length === 0 && (
                                        <tr>
                                            <td colSpan="5" style={{ padding: '16px', textAlign: 'center', color: '#9ca3af' }}>
                                                Nenhuma fatura em aberto encontrada.
                                            </td>
                                        </tr>
                                    )}
                                    {displayInvoices.map(inv => (
                                        <tr key={inv.id} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '8px', fontSize: '11px', color: '#666' }}>{inv.externalId || inv.id}</td>
                                            <td style={{ padding: '8px' }}>{inv.description}</td>
                                            <td style={{ padding: '8px' }}>
                                                {(() => {
                                                    if (!inv.dueDate) return '-';
                                                    const d = new Date(inv.dueDate);
                                                    // Fix timezone offset by treating as UTC or adding offset
                                                    const userTimezoneOffset = d.getTimezoneOffset() * 60000;
                                                    const adjustedDate = new Date(d.getTime() + userTimezoneOffset);
                                                    return adjustedDate.toLocaleDateString('pt-BR');
                                                })()}
                                            </td>
                                            <td style={{ padding: '8px', fontWeight: 'bold' }}>
                                                {inv.value ? `R$ ${inv.value.toFixed(2).replace('.', ',')}` : '-'}
                                            </td>
                                            <td style={{ padding: '8px', textAlign: 'center' }}>
                                                <InvoiceDropdown
                                                    invoice={inv}
                                                    onAction={handleSendInvoiceOption}
                                                    styles={styles}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                    </div>
                </div>
            )}

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
                                <option value="Ativo V. Reduzida">Ativo V. Reduzida</option>
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

            {/* Ticket List Modal */}
            {showTicketListModal && (
                <div style={styles.modalOverlay}>
                    <div style={{ ...styles.modalContent, width: '600px', maxWidth: '95%' }}>
                        <div style={styles.modalHeader}>
                            <h4 style={styles.modalTitle}>Chamados em Aberto</h4>
                            <button onClick={() => setShowTicketListModal(false)} style={styles.closeButton}><X size={16} /></button>
                        </div>

                        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={handleNewTicketClick} style={styles.saveButton}>
                                <Plus size={14} style={{ marginRight: 5 }} /> Novo Chamado
                            </button>
                        </div>

                        {loadingTickets ? (
                            <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>Carregando chamados...</div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid #eee', textAlign: 'left' }}>
                                            <th style={{ padding: '8px' }}>Protocolo</th>
                                            <th style={{ padding: '8px' }}>Assunto</th>
                                            <th style={{ padding: '8px' }}>Status</th>
                                            <th style={{ padding: '8px' }}>Data</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tickets.length === 0 && (
                                            <tr><td colSpan="4" style={{ padding: '16px', textAlign: 'center', color: '#9ca3af' }}>Nenhum chamado em aberto.</td></tr>
                                        )}
                                        {tickets.map((t, i) => (
                                            <tr key={t.id || i} style={{ borderBottom: '1px solid #eee' }}>
                                                <td style={{ padding: '8px', fontWeight: 'bold' }}>
                                                    {t.ocorrencia || t.protocolo || t.id || '-'}
                                                </td>
                                                <td style={{ padding: '8px' }}>
                                                    {t.motivo || t.assunto || t.conteudo || '-'}
                                                </td>
                                                <td style={{ padding: '8px' }}>
                                                    <span style={{ ...styles.badge, backgroundColor: '#dbeafe', color: '#1e40af' }}>{t.status}</span>
                                                </td>
                                                <td style={{ padding: '8px' }}>
                                                    {t.data_cadastro ? (
                                                        `${t.data_cadastro.split('-').reverse().join('/')} ${t.hora_cadastro || ''}`
                                                    ) : (
                                                        t.data_abertura ? new Date(t.data_abertura).toLocaleDateString('pt-BR') : '-'
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Ticket Modal */}
            {showTicketModal && (
                <div style={styles.modalOverlay}>
                    <div style={{ ...styles.modalContent, width: '500px' }}>
                        <div style={styles.modalHeader}>
                            <h4 style={styles.modalTitle}>Abrir Chamado</h4>
                            <button onClick={() => setShowTicketModal(false)} style={styles.closeButton}><X size={16} /></button>
                        </div>

                        {/* Contrato (Readonly ou Select se quiser implementar mudança) */}
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Contrato</label>
                            <input
                                style={{ ...styles.input, backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                                value={clientInfo.contracts?.find(c => c.id === ticketData.contractId)?.plan || 'Desconhecido'}
                                readOnly
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Assunto *</label>
                            {loadingSubjects ? (
                                <div style={{ fontSize: '13px', color: '#6b7280' }}>Carregando assuntos...</div>
                            ) : (
                                <select
                                    style={styles.select}
                                    value={ticketData.subjectCode}
                                    onChange={e => setTicketData({ ...ticketData, subjectCode: e.target.value })}
                                >
                                    <option value="">Selecione...</option>
                                    {ticketSubjects.map((subject, idx) => (
                                        <option key={subject.codigo || idx} value={subject.codigo}>
                                            {subject.descricao}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Descrição *</label>
                            <textarea
                                style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }}
                                value={ticketData.content}
                                onChange={e => setTicketData({ ...ticketData, content: e.target.value })}
                                placeholder="Descreva o problema..."
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Observação</label>
                            <textarea
                                style={{ ...styles.input, minHeight: '60px', resize: 'vertical' }}
                                value={ticketData.observation}
                                onChange={e => setTicketData({ ...ticketData, observation: e.target.value })}
                                placeholder="Observações adicionais..."
                            />
                        </div>

                        <div style={styles.modalActions}>
                            <button onClick={() => setShowTicketModal(false)} style={styles.cancelButton}>Cancelar</button>
                            <button
                                onClick={handleCreateTicket}
                                disabled={submitting || loadingSubjects}
                                style={{ ...styles.saveButton, opacity: (submitting || loadingSubjects) ? 0.7 : 1 }}
                            >
                                {submitting ? 'Abrindo...' : 'Abrir Chamado'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Connection Status Modal */}
            {showConnectionModal && (
                <div style={styles.modalOverlay}>
                    <div style={{ ...styles.modalContent, maxWidth: '600px' }}>
                        <div style={styles.modalHeader}>
                            <h4 style={styles.modalTitle}>Status da Conexão</h4>
                            <button onClick={() => setShowConnectionModal(false)} style={styles.closeButton}>
                                <X size={16} />
                            </button>
                        </div>
                        <div style={{ padding: '20px 0' }}>
                            {connectionData.loading ? (
                                <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                                    <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '8px' }} />
                                    <p>Verificando conexão...</p>
                                </div>
                            ) : connectionData.error ? (
                                <div style={{ color: '#ef4444', textAlign: 'center', padding: '20px' }}>
                                    <p>{connectionData.error}</p>
                                </div>
                            ) : (
                                <div>
                                    {(() => {
                                        // results is array of services/contracts
                                        const services = connectionData.result?.result || [];
                                        let sessions = [];

                                        // 1. Filter Services by Selected Contract
                                        if (selectedContract) {
                                            const extId = String(selectedContract.externalId);

                                            // Find matching service(s)
                                            const matchedServices = services.filter(srv => {
                                                const srvId = String(srv.servico_id || srv.service_id || srv.id);
                                                // Check for loose match or direct match
                                                return srvId === extId;
                                            });

                                            // If found, use them
                                            if (matchedServices.length > 0) {
                                                matchedServices.forEach(srv => {
                                                    if (Array.isArray(srv.radacct)) {
                                                        sessions.push(...srv.radacct);
                                                    }
                                                });
                                            } else if (services.length > 0) {
                                                // Fallback: User requested to show Online if result is not empty.
                                                // If strict match fails, show all sessions we found.
                                                services.forEach(srv => {
                                                    if (Array.isArray(srv.radacct)) {
                                                        sessions.push(...srv.radacct);
                                                    }
                                                });
                                            }
                                        } else {
                                            // No contract selected, show all sessions from all services
                                            services.forEach(srv => {
                                                if (Array.isArray(srv.radacct)) {
                                                    sessions.push(...srv.radacct);
                                                }
                                            });
                                        }

                                        // If sessions is still empty but we have services/result?
                                        // The user said "Offline apenas se result vier vazio".
                                        // If result is not empty but sessions (radacct) is empty, maybe we should still show something?
                                        // JSON sample has "online": true.
                                        if (sessions.length === 0 && services.length > 0) {
                                            // Extract data from the service object itself if radacct is empty
                                            // Sample: { "ip": "", "online": true, "nome": "...", "radacct": [] }
                                            // If IP is empty there, we can't show much. But we can show "Online".
                                            // Let's create a dummy session object from the service data to render "Online"
                                            sessions = services.map(srv => ({
                                                framedipaddress: srv.ip || srv.framedipaddress,
                                                acctstarttime: null, // No start time in root
                                                acctinputoctets: 0,
                                                acctoutputoctets: 0,
                                                nasipaddress: null,
                                                username: srv.pppoe_login || srv.login,
                                                isSummary: true // Flag
                                            }));
                                        }

                                        if (sessions.length === 0) {
                                            return (
                                                <div style={{ padding: '20px', textAlign: 'center', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#f9fafb' }}>
                                                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#6b7280', marginBottom: '8px' }}>OFFLINE</div>
                                                    <p style={{ fontSize: '13px', color: '#9ca3af' }}>
                                                        {selectedContract ? 'Nenhuma conexão ativa encontrada para este contrato.' : 'Nenhuma conexão ativa encontrada.'}
                                                    </p>
                                                </div>
                                            );
                                        }

                                        // 2. Render Sessions
                                        return sessions.map((conn, idx) => {
                                            const ip = getConnValue(conn, ['framedipaddress', 'framedip', 'ipaddress', 'ip']);
                                            const start = getConnValue(conn, ['acctstarttime', 'starttime', 'start_time', 'start']);
                                            const download = getConnValue(conn, ['acctinputoctets', 'inputoctets', 'download']);
                                            const upload = getConnValue(conn, ['acctoutputoctets', 'outputoctets', 'upload']);
                                            const nas = getConnValue(conn, ['nasipaddress', 'nasip', 'nas']);
                                            const service = getConnValue(conn, ['nasportid', 'calledstationid', 'service']);
                                            const username = getConnValue(conn, ['username', 'user-name']);

                                            return (
                                                <div key={idx} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px' }}>
                                                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', backgroundColor: '#f9fafb' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span style={{ fontWeight: '600', color: '#374151', fontSize: '13px' }}>Status:</span>
                                                            <span style={{ backgroundColor: '#10b981', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>ONLINE</span>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <MonitorUp style={{ color: '#10b981' }} alt="Acessar roteador do cliente"/>
                                                            <span style={{ fontWeight: '600', color: '#374151', fontSize: '13px' }}>IP:</span>
                                                            <a href={`http://${ip}:8888`} target="_blank" rel="noopener noreferrer" alt="Acessar roteador do cliente"><span style={{ fontFamily: 'monospace', color: '#6b7280', fontSize: '13px' }}>{ip || '-'}</span></a>
                                                        </div>
                                                    </div>
                                                    <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '13px' }}>
                                                        <div>
                                                            <span style={{ display: 'block', fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>Conectado em:</span>
                                                            <span style={{ color: '#111827', fontWeight: '500' }}>{start ? new Date(start).toLocaleString() : '-'}</span>
                                                        </div>
                                                        <div>
                                                            <span style={{ display: 'block', fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>Duração:</span>
                                                            <span style={{ color: '#111827', fontWeight: '500' }}>{formatDuration(start)}</span>
                                                        </div>

                                                        <div>
                                                            <span style={{ display: 'block', fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>Download:</span>
                                                            <span style={{ color: '#111827', fontWeight: '500' }}>{formatBytes(download) || '0 B'}</span>
                                                        </div>
                                                        <div>
                                                            <span style={{ display: 'block', fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>Upload:</span>
                                                            <span style={{ color: '#111827', fontWeight: '500' }}>{formatBytes(upload) || '0 B'}</span>
                                                        </div>

                                                        {username && (
                                                            <div style={{ gridColumn: '1 / -1' }}>
                                                                <span style={{ display: 'block', fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>Usuário:</span>
                                                                <span style={{ color: '#374151', fontSize: '12px', fontFamily: 'monospace' }}>{username}</span>
                                                            </div>
                                                        )}

                                                        <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #f3f4f6', paddingTop: '12px', marginTop: '4px' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                <div>
                                                                    <span style={{ display: 'block', fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>NAS:</span>
                                                                    <span style={{ color: '#374151', fontSize: '12px' }}>{nas || '-'}</span>
                                                                </div>
                                                                <div style={{ textAlign: 'right' }}>
                                                                    <span style={{ display: 'block', fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>Service:</span>
                                                                    <span style={{ color: '#374151', fontSize: '12px' }}>{service || '-'}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            )}
                            <div style={{ marginTop: '16px', textAlign: 'right', fontSize: '10px', color: '#9ca3af' }}>
                                O status é atualizado automaticamente a cada 5 segundos (mock).
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Unlock Confirmation Modal */}
            <Modal
                isOpen={unlockConfirmOpen}
                onClose={() => setUnlockConfirmOpen(false)}
                title="Desbloqueio em Confiança"
                size="md"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <p style={{ color: currentTheme?.textSecondary, lineHeight: '1.5' }}>
                        Deseja realmente confirmar o desbloqueio em confiança para o contrato <strong>{selectedContract?.plan || 'Selecionado'}</strong>?
                    </p>

                    <div style={{
                        backgroundColor: (currentTheme?.primary || '#10b981') + '15',
                        padding: '12px',
                        borderRadius: '6px',
                        borderLeft: `4px solid ${currentTheme?.primary || '#10b981'}`
                    }}>
                        <p style={{ margin: 0, fontSize: '13px', color: currentTheme?.textPrimary, display: 'flex', alignItems: 'center' }}>
                            <AlertTriangle size={16} style={{ marginRight: 8, flexShrink: 0 }} />
                            <span>Atenção: Esta ação só pode ser realizada <strong>uma vez por mês</strong>.</span>
                        </p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                        <Button variant="outline" onClick={() => setUnlockConfirmOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={executeUnlock}>
                            Confirmar Desbloqueio
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

const InvoiceDropdown = ({ invoice, onAction, styles }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = React.useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div style={{ position: 'relative', display: 'inline-block' }} ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={styles.outlineButton}
            >
                Enviar
                <Send size={14} style={{ marginLeft: '8px', verticalAlign: 'middle' }} />
            </button>
            {isOpen && (
                <div style={{
                    position: 'absolute', right: 0, top: '100%',
                    backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '4px',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)', zIndex: 100, minWidth: '180px',
                    marginTop: '4px', textAlign: 'left'
                }}>
                    {invoice.digitableLine && (
                        <div style={styles.menuItem} onClick={() => { onAction(invoice, 'linha'); setIsOpen(false); }}>
                            <Barcode size={14} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Linha Digitável
                        </div>
                    )}
                    {invoice.pixCode && (
                        <div style={styles.menuItem} onClick={() => { onAction(invoice, 'pix'); setIsOpen(false); }}>
                            <QrCode size={14} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> QR Code PIX
                        </div>
                    )}
                    {invoice.pixCode && (
                        <div style={styles.menuItem}
                            onClick={() => { onAction(invoice, 'pix_dinamico'); setIsOpen(false); }}>
                            <Zap size={14} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> PIX Dinâmico
                        </div>
                    )}
                    {invoice.pdfLink && (
                        <div style={styles.menuItem} onClick={() => { onAction(invoice, 'link'); setIsOpen(false); }}>
                            <Link size={14} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Link Fatura
                        </div>
                    )}
                    {invoice.pdfLink && (
                        <div style={styles.menuItem} onClick={() => { onAction(invoice, 'pdf'); setIsOpen(false); }}>
                            <FileText size={14} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> PDF (Arquivo)
                        </div>
                    )}
                    {invoice.token && (
                        <div style={styles.menuItem} onClick={() => { onAction(invoice, 'public_link'); setIsOpen(false); }}>
                            <Link size={14} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Link PIX
                        </div>
                    )}
                    <div style={{ ...styles.menuItem, color: '#9ca3af', cursor: 'not-allowed' }} onClick={() => { onAction(invoice, 'manual'); setIsOpen(false); }}>
                        <MessageSquare size={14} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Mensagem manual
                    </div>
                </div>
            )}
        </div>
    );
};

const getStyles = (theme) => ({
    container: {
        width: '400px',
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
    plusButton: {
        width: '24px', height: '24px', borderRadius: '50%', backgroundColor: theme.primary,
        color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)', transition: 'transform 0.2s',
        ':hover': { transform: 'scale(1.1)' }
    },
    modalOverlay: {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999
    },
    modalContent: {
        width: '90%', backgroundColor: theme.background, borderRadius: '8px', padding: '16px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        maxHeight: '80vh', overflowY: 'auto'
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
    },
    menuItem: {
        padding: '8px 16px', cursor: 'pointer', display: 'block', fontSize: '13px', color: '#374151', textAlign: 'left',
        display: 'flex', alignItems: 'center' // Also ensure flex for icon alignment
    }
});

export default ChatClientInfo;
