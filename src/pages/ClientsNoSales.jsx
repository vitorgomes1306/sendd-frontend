
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { FileText, Search, X, Phone, User, Clock, CheckCircle, MessageCircle, RefreshCcw, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ClientsNoSales = () => {
    const { currentTheme } = useTheme();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('Consulta'); // 'Consulta' | 'Status'

    // State for Consulta
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClient, setSelectedClient] = useState(null);
    const [error, setError] = useState(null);
    const [targetOrgId, setTargetOrgId] = useState(null);

    // State for History
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    useEffect(() => {
        loadClients();
    }, []);

    // Load History when tab changes
    useEffect(() => {
        if (activeTab === 'Status' && targetOrgId) {
            loadHistory();
        }
    }, [activeTab, targetOrgId]);

    // State for History Filters
    const [historyFilters, setHistoryFilters] = useState({
        startDate: '',
        endDate: '',
        search: '', // Name, Phone, User
        channel: ''
    });

    const filteredHistory = history.filter(record => {
        const { startDate, endDate, search, channel } = historyFilters;
        const recordDate = new Date(record.createdAt);

        // Date Range
        if (startDate) {
            const [sy, sm, sd] = startDate.split('-').map(Number);
            const start = new Date(sy, sm - 1, sd); // Local midnight
            if (recordDate < start) return false;
        }
        if (endDate) {
            const [ey, em, ed] = endDate.split('-').map(Number);
            const end = new Date(ey, em - 1, ed); // Local midnight
            end.setHours(23, 59, 59, 999);
            if (recordDate > end) return false;
        }

        // Search (Name, Phone, User)
        if (search) {
            const term = search.toLowerCase();
            const clientName = (record.clientName || '').toLowerCase();
            const phone = (record.phoneNumber || '').toLowerCase();
            const userName = (record.user?.name || '').toLowerCase();

            if (!clientName.includes(term) && !phone.includes(term) && !userName.includes(term)) {
                return false;
            }
        }

        // Channel
        if (channel) {
            const recordChannel = (record.channel || '').toLowerCase();
            if (!recordChannel.includes(channel.toLowerCase())) return false;
        }

        return true;
    });

    const loadClients = async () => {
        try {
            setLoading(true);
            setError(null);

            const orgsResponse = await api.get('/private/organizations');
            const enabledOrgs = orgsResponse.data.filter(o => o.useExternalReports);

            if (enabledOrgs.length === 0) {
                setError('Nenhuma organização habilitada para este relatório.');
                setLoading(false);
                return;
            }

            const orgId = enabledOrgs[0].id;
            setTargetOrgId(orgId);

            const response = await api.get(`/private/integrations/external-reports?organizationId=${orgId}`);

            // Adjust based on actual response
            let data = response.data;
            if (data && !Array.isArray(data)) {
                if (data.rows && Array.isArray(data.rows)) {
                    data = data.rows;
                } else if (data.data && Array.isArray(data.data)) {
                    data = data.data;
                }
            }

            setClients(Array.isArray(data) ? data : []);

        } catch (error) {
            console.error('Erro ao carregar relatório:', error);
            setError('Falha ao carregar dados do relatório externo.');
        } finally {
            setLoading(false);
        }
    };

    const loadHistory = async () => {
        if (!targetOrgId) return;
        try {
            setLoadingHistory(true);
            const res = await api.get(`/private/integrations/external-reports/history?organizationId=${targetOrgId}`);
            setHistory(res.data);
        } catch (error) {
            console.error('Error loading history:', error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleCallClient = async (client) => {
        let phone = client.TELENT || client.TELCOB || client.telefone || client.celular;

        // Clean number
        const cleanPhone = String(phone || '').replace(/\D/g, '');

        if (!cleanPhone || cleanPhone.length < 10) {
            alert('Cliente sem telefone válido cadastrado.');
            return;
        }

        try {
            // Get Channel (Instance) from Config
            let channel = 'Desconhecido';
            try {
                const savedConfig = localStorage.getItem('chat_config');
                if (savedConfig) {
                    const parsed = JSON.parse(savedConfig);
                    // Usually instanceId is the name or ID.
                    channel = parsed.instanceName || parsed.instanceId || 'WhatsApp';
                }
            } catch (e) {
                console.error('Error reading chat_config:', e);
            }

            // Log call
            await api.post('/private/integrations/external-reports/log', {
                organizationId: targetOrgId,
                clientExternalId: String(client.CODCLI || client.id || client.id_cliente),
                clientName: String(client.CLIENTE || client.nome || client.razao_social || 'Desconhecido'),
                phoneNumber: cleanPhone,
                channel: channel
            });

            // Close modal
            setSelectedClient(null);

            // Redirect to chat with state to trigger new chat
            navigate('/chat', {
                state: {
                    startChat: { number: cleanPhone, name: client.CLIENTE || client.nome },
                    autoTag: { name: 'Cliente sem venda - API', color: '#8b5cf6' }
                }
            });

        } catch (error) {
            console.error('Error logging call:', error);
            alert('Erro ao registrar chamada. Tente novamente.');
        }
    };

    const filteredClients = clients.filter(client => {
        const search = searchTerm.toLowerCase();
        return Object.values(client).some(val =>
            String(val).toLowerCase().includes(search)
        );
    });

    const getClientName = (c) => c.CLIENTE || c.nome || c.razao_social || c.nome_cliente || c.cliente || 'Sem nome';
    const getClientId = (c) => c.CODCLI || c.id || c.id_cliente || c.codigo || '-';

    // Styles
    const styles = {
        container: {
            padding: '24px',
            backgroundColor: currentTheme.background,
            color: currentTheme.text,
            minHeight: '100vh',
            fontFamily: 'Inter, sans-serif'
        },
        header: {
            marginBottom: '24px'
        },
        titleLine: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
        },
        title: {
            fontSize: '24px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
        },
        tabs: {
            display: 'flex',
            gap: '20px',
            borderBottom: `1px solid ${currentTheme.borderColor} `,
        },
        tabButton: (isActive) => ({
            padding: '12px 24px',
            background: 'none',
            border: 'none',
            borderBottom: isActive ? `3px solid ${currentTheme.primary} ` : '3px solid transparent',
            color: isActive ? currentTheme.primary : currentTheme.secondaryText,
            fontWeight: isActive ? '600' : '500',
            cursor: 'pointer',
            fontSize: '16px',
            transition: 'all 0.2s',
            marginBottom: '-2px' // Overlap border
        }),
        searchContainer: {
            position: 'relative',
            width: '100%'
        },
        input: {
            padding: '8px 12px',
            borderRadius: '6px',
            border: `1px solid ${currentTheme.border}`,
            backgroundColor: currentTheme.background,
            color: currentTheme.textPrimary || currentTheme.text,
            outline: 'none',
            fontSize: '14px',
            width: '100%'
        },
        searchInput: {
            width: '100%',
            padding: '8px 12px 8px 32px', // Space for icon
            borderRadius: '6px',
            border: `1px solid ${currentTheme.border}`,
            backgroundColor: currentTheme.background,
            color: currentTheme.textPrimary || currentTheme.text,
            outline: 'none',
            fontSize: '14px'
        },
        searchIcon: {
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#9ca3af'
        },
        refreshBtn: {
            padding: '10px',
            borderRadius: '8px',
            border: `1px solid ${currentTheme.borderColor} `,
            backgroundColor: currentTheme.cardBackground,
            color: currentTheme.text,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: '8px'
        },
        tableContainer: {
            backgroundColor: currentTheme.cardBackground,
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
            overflowX: 'auto',
            marginTop: '20px'
        },
        table: {
            width: '100%',
            borderCollapse: 'collapse',
            minWidth: '600px'
        },
        th: {
            textAlign: 'left',
            padding: '16px',
            borderBottom: `1px solid ${currentTheme.borderColor} `,
            fontSize: '14px',
            fontWeight: '600',
            color: currentTheme.secondaryText,
            backgroundColor: currentTheme.background
        },
        td: {
            padding: '16px',
            borderBottom: `1px solid ${currentTheme.borderColor} `,
            fontSize: '14px',
            cursor: 'pointer'
        },
        tr: {
            transition: 'background 0.2s'
        },
        // Modal Styles
        modalOverlay: {
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
        },
        modalContent: {
            backgroundColor: currentTheme.cardBackground,
            borderRadius: '12px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflowY: 'auto',
            padding: '24px',
            position: 'relative',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
        },
        closeIconBtn: {
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: currentTheme.secondaryText
        },
        detailRow: {
            display: 'flex',
            marginBottom: '12px',
            borderBottom: `1px solid ${currentTheme.borderColor} `,
            paddingBottom: '8px'
        },
        detailLabel: {
            fontWeight: '600',
            width: '140px',
            flexShrink: 0,
            color: currentTheme.secondaryText
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div style={styles.titleLine}>
                    <div style={styles.title}>
                        <FileText size={28} />
                        Relatório: Clientes sem Venda
                    </div>
                </div>

                <div style={styles.tabs}>
                    <button
                        style={styles.tabButton(activeTab === 'Consulta')}
                        onClick={() => setActiveTab('Consulta')}
                    >
                        Consulta
                    </button>
                    <button
                        style={styles.tabButton(activeTab === 'Status')}
                        onClick={() => setActiveTab('Status')}
                    >
                        Status de chamada
                    </button>
                </div>
            </div>

            {error && (
                <div style={{ padding: '20px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '20px' }}>
                    {error}
                </div>
            )}

            {/* TAB: CONSULTA */}
            {activeTab === 'Consulta' && (
                <>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                        <div style={styles.searchContainer}>
                            <Search size={18} style={styles.searchIcon} />
                            <input
                                type="text"
                                placeholder="Buscar cliente..."
                                style={styles.searchInput}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button
                            style={styles.refreshBtn}
                            onClick={loadClients}
                            title="Atualizar lista"
                        >
                            <RefreshCcw size={18} />
                        </button>
                    </div>

                    <div style={styles.tableContainer}>
                        {loading ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: currentTheme.secondaryText }}>
                                Carregando dados...
                            </div>
                        ) : filteredClients.length === 0 ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: currentTheme.secondaryText }}>
                                Nenhum registro encontrado.
                            </div>
                        ) : (
                            <table style={styles.table}>
                                <thead>
                                    <tr>
                                        <th style={styles.th}>ID</th>
                                        <th style={styles.th}>Nome</th>
                                        <th style={styles.th}>Cidade / Bairro</th>
                                        <th style={styles.th}>Detalhes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredClients.map((client, index) => (
                                        <tr
                                            key={index}
                                            style={{ ...styles.tr, ':hover': { backgroundColor: currentTheme.background } }}
                                            onClick={() => setSelectedClient(client)}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = currentTheme.background}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <td style={styles.td}>{getClientId(client)}</td>
                                            <td style={styles.td}>
                                                <div style={{ fontWeight: '500' }}>{getClientName(client)}</div>
                                            </td>
                                            <td style={styles.td}>
                                                {client.MUNICENT} {client.BAIRROENT ? ` - ${client.BAIRROENT} ` : ''}
                                            </td>
                                            <div style={{ ...styles.td, color: currentTheme.primary, alignItems: 'center', display: 'flex', justifyContent: 'center' }}>
                                                <Eye
                                                    onClick={() => setSelectedClient(client)}
                                                />
                                                Abrir
                                            </div>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </>
            )}




            {/* TAB: STATUS DE CHAMADA */}
            {activeTab === 'Status' && (
                <>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'end' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '12px', color: currentTheme.textSecondary }}>Data Início</label>
                            <input
                                type="date"
                                style={styles.input}
                                value={historyFilters.startDate}
                                onChange={e => setHistoryFilters(prev => ({ ...prev, startDate: e.target.value }))}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '12px', color: currentTheme.textSecondary }}>Data Fim</label>
                            <input
                                type="date"
                                style={styles.input}
                                value={historyFilters.endDate}
                                onChange={e => setHistoryFilters(prev => ({ ...prev, endDate: e.target.value }))}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '200px' }}>
                            <label style={{ fontSize: '12px', color: currentTheme.textSecondary }}>Buscar (Cliente, Tel, Usuário)</label>
                            <div style={{ ...styles.searchContainer, width: '100%', position: 'relative' }}>
                                <Search size={18} style={styles.searchIcon} />
                                <input
                                    type="text"
                                    placeholder="Buscar..."
                                    style={styles.searchInput}
                                    value={historyFilters.search}
                                    onChange={(e) => setHistoryFilters(prev => ({ ...prev, search: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '12px', color: currentTheme.textSecondary }}>Canal</label>
                            <input
                                type="text"
                                placeholder="Filtrar canal"
                                style={styles.input}
                                value={historyFilters.channel}
                                onChange={(e) => setHistoryFilters(prev => ({ ...prev, channel: e.target.value }))}
                            />
                        </div>
                        <button
                            style={styles.refreshBtn}
                            onClick={() => setHistoryFilters({ startDate: '', endDate: '', search: '', channel: '' })}
                            title="Limpar Filtros"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div style={styles.tableContainer}>
                        {loadingHistory ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: currentTheme.secondaryText }}>
                                Carregando histórico...
                            </div>
                        ) : filteredHistory.length === 0 ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: currentTheme.secondaryText }}>
                                Nenhum registro de chamada encontrado.
                            </div>
                        ) : (
                            <table style={styles.table}>
                                <thead>
                                    <tr>
                                        <th style={styles.th}>Data/Hora</th>
                                        <th style={styles.th}>Usuário</th>
                                        <th style={styles.th}>Cliente</th>
                                        <th style={styles.th}>Telefone</th>
                                        <th style={styles.th}>Canal (Instância)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredHistory.map((record) => (
                                        <tr key={record.id} style={styles.tr}>
                                            <td style={styles.td}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Clock size={14} />
                                                    {new Date(record.createdAt).toLocaleString('pt-BR')}
                                                </div>
                                            </td>
                                            <td style={styles.td}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <User size={14} />
                                                    {record.user?.name || 'Sistema'}
                                                </div>
                                            </td>
                                            <td style={styles.td}>{record.clientName}</td>
                                            <td style={styles.td}>{formatPhoneNumber(record.phoneNumber)}</td>
                                            <td style={styles.td}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#25D366' }}>
                                                    <MessageCircle size={14} />
                                                    {record.channel || 'WhatsApp'}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </>
            )}

            {/* MODAL DETALHES */}
            {selectedClient && (
                <div style={styles.modalOverlay} onClick={() => setSelectedClient(null)}>
                    <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ fontSize: '20px', margin: 0 }}>Detalhes do Cliente</h2>
                            <button style={styles.closeIconBtn} onClick={() => setSelectedClient(null)}>
                                <X size={24} />
                            </button>
                        </div>

                        <div style={{ marginBottom: '30px' }}>
                            <DetailRow label="ID" value={getClientId(selectedClient)} />
                            <DetailRow label="Cliente" value={getClientName(selectedClient)} />
                            <DetailRow label="Cidade" value={selectedClient.MUNICENT} />
                            <DetailRow label="Bairro" value={selectedClient.BAIRROENT} />
                            <DetailRow label="Telefone" value={selectedClient.TELENT} />
                            <DetailRow label="Tel. Cobrança" value={selectedClient.TELCOB} />
                            <DetailRow label="Data Últ. Compra" value={formatDate(selectedClient.DATA_ULTIMA_COMPRA)} />
                            <DetailRow label="Valor Últ. Compra" value={formatCurrency(selectedClient.VALOR_ULTIMA_COMPRA)} />
                            <div style={{ margin: '10px 0', borderTop: `1px solid ${currentTheme.borderColor} ` }}></div>
                            <DetailRow label="Vendedor" value={selectedClient.VENDEDOR_ULT_VENDA} />
                            <DetailRow label="Responsável" value={selectedClient.CODUSUR_RESPONSAVEL_CLIENTE} />
                            <DetailRow label="Contactado" value={selectedClient.CONTACTADO} />
                            <DetailRow label="Status" value={selectedClient.STATUS_ATUAL} />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button
                                onClick={() => setSelectedClient(null)}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: '8px',
                                    border: `1px solid ${currentTheme.borderColor} `,
                                    backgroundColor: 'transparent',
                                    color: currentTheme.text,
                                    cursor: 'pointer'
                                }}
                            >
                                Fechar
                            </button>
                            <button
                                onClick={() => handleCallClient(selectedClient)}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    backgroundColor: '#25D366',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    fontWeight: '600'
                                }}
                            >
                                <MessageCircle size={18} />
                                Chamar Cliente
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const DetailRow = ({ label, value }) => {
    const { currentTheme } = useTheme();
    const styles = {
        detailRow: {
            display: 'flex',
            marginBottom: '12px',
            borderBottom: `1px solid ${currentTheme.borderColor} `,
            paddingBottom: '8px'
        },
        detailLabel: {
            fontWeight: '600',
            width: '140px',
            flexShrink: 0,
            color: currentTheme.secondaryText
        }
    };

    if (!value && value !== 0) return null;
    return (
        <div style={styles.detailRow}>
            <span style={styles.detailLabel}>{label}:</span>
            <span>{String(value)}</span>
        </div>
    );
};

const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        return date.toLocaleDateString('pt-BR');
    } catch { return dateString; }
};

const formatCurrency = (val) => {
    if (val === null || val === undefined || isNaN(Number(val))) return '-';
    return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatPhoneNumber = (phone) => {
    if (!phone) return '-';
    const cleaned = String(phone).replace(/\D/g, '');
    if (cleaned.length === 11) {
        return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)} -${cleaned.slice(7)} `;
    }
    if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)} -${cleaned.slice(6)} `;
    }
    return phone;
};

export default ClientsNoSales;
