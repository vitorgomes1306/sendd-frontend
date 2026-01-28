import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import ImportarLeadsPlanilha from '../components/ImportarLeadsPlanilha';
import { Search, Calendar, Users, Filter, X, Edit, Trash2, UserPlus, MessageSquare, AlertCircle, CheckCircle, Funnel, ArrowLeftRight, FileSpreadsheet } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import AlertToast from '../components/ui/AlertToast';
import '../styles/buttons.css';

const Leads = ({ embed }) => {
    const { currentTheme, isDark } = useTheme();

    // States
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: '',
        startDate: '',
        endDate: ''
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        pages: 1
    });

    // Modal States
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedLead, setSelectedLead] = useState(null);
    const [editForm, setEditForm] = useState({
        name: '',
        surname: '',
        email: '',
        phone: ''
    });

    // Alert State
    const [alert, setAlert] = useState({
        open: false,
        variant: 'info',
        title: '',
        message: ''
    });

    // Fetch Leads
    const fetchLeads = async () => {
        try {
            setLoading(true);
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                search: filters.search,
                startDate: filters.startDate,
                endDate: filters.endDate
            };

            const response = await apiService.getLeads(params);

            // Handle response format
            if (response.data && response.data.data) {
                setLeads(response.data.data);
                setPagination({
                    ...pagination,
                    total: response.data.pagination.total,
                    pages: response.data.pagination.pages
                });
            } else {
                setLeads(Array.isArray(response.data) ? response.data : []);
            }

        } catch (error) {
            console.error('Erro ao buscar leads:', error);
            showAlert('error', 'Erro', 'Falha ao carregar leads');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeads();
    }, [pagination.page, filters]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const clearFilters = () => {
        setFilters({ search: '', startDate: '', endDate: '' });
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const showAlert = (variant, title, message) => {
        setAlert({ open: true, variant, title, message });
    };

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState({
        open: false,
        title: '',
        message: '',
        onConfirm: null
    });

    const closeConfirmModal = () => {
        setConfirmModal({ ...confirmModal, open: false });
    };

    // Actions Handlers
    const handleEdit = (lead) => {
        setSelectedLead(lead);
        setEditForm({
            name: lead.name || '',
            surname: lead.surname || '',
            email: lead.email || '',
            phone: lead.phone || ''
        });
        setShowEditModal(true);
    };

    const confirmDelete = async (lead) => {
        try {
            await apiService.deleteLead(lead.id);
            showAlert('success', 'Sucesso', 'Lead excluído com sucesso');
            fetchLeads();
        } catch (error) {
            console.error('Erro ao excluir lead:', error);
            showAlert('error', 'Erro', 'Erro ao excluir lead');
        } finally {
            closeConfirmModal();
        }
    };

    const handleDelete = (lead) => {
        setConfirmModal({
            open: true,
            title: 'Excluir Lead',
            message: `Tem certeza que deseja excluir o lead ${lead.name}? Esta ação não pode ser desfeita.`,
            onConfirm: () => confirmDelete(lead)
        });
    };

    const [showTransferModal, setShowTransferModal] = useState(false);
    const [transferTargetLead, setTransferTargetLead] = useState(null);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState('');
    const [showImportModal, setShowImportModal] = useState(false);

    const { user } = useAuth(); // Assuming useAuth provides user info for permission check

    const fetchUsers = async () => {
        try {
            // Filter users by current organization
            const response = await apiService.getUsers({ organizationId: user.organizationId });
            setUsers(response.data || []);
        } catch (error) {
            console.error('Erro ao buscar usuários:', error);
        }
    };

    const handleTransferClick = (lead) => {
        setTransferTargetLead(lead);
        setSelectedUser(lead.userId || ''); // Pre-select current owner if possible, or empty
        if (users.length === 0) fetchUsers();
        setShowTransferModal(true);
    };

    const confirmTransfer = async () => {
        if (!selectedUser) {
            showAlert('warning', 'Atenção', 'Selecione um usuário para transferir.');
            return;
        }

        try {
            await apiService.updateLead(transferTargetLead.id, { userId: Number(selectedUser) });
            showAlert('success', 'Sucesso', 'Lead transferido com sucesso');
            setShowTransferModal(false);
            fetchLeads();
        } catch (error) {
            console.error('Erro ao transferir lead:', error);
            showAlert('error', 'Erro', 'Erro ao transferir lead');
        }
    };

    const handleMigrate = () => {
        showAlert('info', 'Em breve', 'Funcionalidade de migrar para cliente será implementada em breve.');
    };

    const handleSendToFunnel = async (lead) => {
        try {
            await apiService.addToFunnel({ leadId: lead.id });
            showAlert('success', 'Sucesso', 'Lead enviado para o funil!');
        } catch (error) {
            console.error('Erro ao enviar para funil:', error);
            if (error.response?.status === 409) {
                showAlert('warning', 'Atenção', 'Lead já está no funil.');
            } else {
                showAlert('error', 'Erro', 'Falha ao enviar lead para o funil.');
            }
        }
    };

    const handleMessage = () => {
        showAlert('info', 'Em breve', 'Funcionalidade de enviar mensagem será implementada em breve.');
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();

        try {
            if (selectedLead) {
                // Update
                await apiService.updateLead(selectedLead.id, editForm);
                showAlert('success', 'Sucesso', 'Lead atualizado com sucesso');
            } else {
                // Create
                await apiService.createLead(editForm);
                showAlert('success', 'Sucesso', 'Lead criado com sucesso');
            }
            setShowEditModal(false);
            fetchLeads();
        } catch (error) {
            console.error('Erro ao salvar lead:', error);
            showAlert('error', 'Erro', 'Erro ao salvar lead');
        }
    };

    // Bulk Actions
    const [selectedLeads, setSelectedLeads] = useState([]);

    const toggleSelectAll = (e) => {
        if (e.target.checked) {
            const allIds = leads.map(l => l.id);
            setSelectedLeads(allIds);
        } else {
            setSelectedLeads([]);
        }
    };

    const toggleSelectOne = (id) => {
        if (selectedLeads.includes(id)) {
            setSelectedLeads(selectedLeads.filter(leadId => leadId !== id));
        } else {
            setSelectedLeads([...selectedLeads, id]);
        }
    };

    const confirmBulkDelete = async () => {
        try {
            await apiService.deleteLeads(selectedLeads);
            showAlert('success', 'Sucesso', 'Leads excluídos com sucesso');
            setSelectedLeads([]);
            fetchLeads();
        } catch (error) {
            console.error('Erro ao excluir leads:', error);
            showAlert('error', 'Erro', 'Erro ao excluir leads');
        } finally {
            closeConfirmModal();
        }
    };

    const handleBulkDelete = () => {
        setConfirmModal({
            open: true,
            title: 'Excluir Leads Selecionados',
            message: `Tem certeza que deseja excluir ${selectedLeads.length} leads selecionados? Esta ação não pode ser desfeita.`,
            onConfirm: confirmBulkDelete
        });
    };

    const styles = {
        container: {
            padding: embed ? '0' : '24px',
            backgroundColor: embed ? 'transparent' : currentTheme.background,
            minHeight: '100%',
        },
        header: { marginBottom: '24px' },
        title: { fontSize: '24px', fontWeight: 'bold', color: currentTheme.textPrimary, marginBottom: '16px' },
        filtersCard: {
            backgroundColor: currentTheme.cardBackground,
            padding: '16px',
            borderRadius: '8px',
            boxShadow: currentTheme.shadow,
            marginBottom: '24px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '16px',
            alignItems: 'flex-end',
            border: `1px solid ${currentTheme.borderLight}`
        },
        inputGroup: { flex: 1, minWidth: '200px' },
        label: { display: 'block', fontSize: '14px', fontWeight: '500', color: currentTheme.textSecondary, marginBottom: '6px' },
        input: {
            width: '100%',
            padding: '8px 12px',
            borderRadius: '6px',
            border: `1px solid ${currentTheme.border}`,
            backgroundColor: isDark ? currentTheme.background : '#fff',
            color: currentTheme.textPrimary,
            fontSize: '14px',
            outline: 'none',
            transition: 'border-color 0.2s',
        },
        tableCard: {
            backgroundColor: currentTheme.cardBackground,
            borderRadius: '8px',
            boxShadow: currentTheme.shadow,
            overflow: 'hidden',
            border: `1px solid ${currentTheme.borderLight}`
        },
        th: {
            padding: '12px 24px',
            textAlign: 'left',
            fontSize: '12px',
            fontWeight: '600',
            textTransform: 'uppercase',
            color: currentTheme.textSecondary,
            backgroundColor: isDark ? currentTheme.background : '#f9fafb',
            borderBottom: `1px solid ${currentTheme.border}`
        },
        td: {
            padding: '16px 24px',
            fontSize: '14px',
            color: currentTheme.textPrimary,
            borderBottom: `1px solid ${currentTheme.border}`,
            whiteSpace: 'nowrap'
        },
        actionButton: {
            padding: '6px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            marginRight: '8px',
            transition: 'background-color 0.2s',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center'
        },
        pagination: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 24px',
            borderTop: `1px solid ${currentTheme.border}`
        },
        // Modal Styles
        modalOverlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50
        },
        modalContainer: {
            backgroundColor: currentTheme.cardBackground,
            borderRadius: '8px',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: `1px solid ${currentTheme.borderLight}`
        },
        modalHeader: {
            padding: '16px 24px',
            borderBottom: `1px solid ${currentTheme.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
        },
        modalTitle: { fontSize: '18px', fontWeight: 'bold', color: currentTheme.textPrimary },
        modalContent: { padding: '24px', overflowY: 'auto' },
        modalFooter: {
            padding: '16px 24px',
            borderTop: `1px solid ${currentTheme.border}`,
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            backgroundColor: isDark ? currentTheme.background : '#f9fafb'
        },
        formGroup: { marginBottom: '16px' }
    };

    return (
        <div style={styles.container}>
            {!embed && <h1 style={styles.title}>Gestão de Leads</h1>}

            <AlertToast
                open={alert.open}
                variant={alert.variant}
                title={alert.title}
                message={alert.message}
                onClose={() => setAlert({ ...alert, open: false })}
            />

            {/* ImportarLeadsPlanilha removed - Moved to Modal */}

            {/* Filtros */}
            <div style={styles.filtersCard}>
                <div style={{ ...styles.inputGroup, flex: 2 }}>
                    <label style={styles.label}>Buscar</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <div style={{
                            position: 'absolute',
                            left: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            pointerEvents: 'none',
                            color: currentTheme.textMuted
                        }}>
                            <Search size={18} />
                        </div>
                        <input
                            type="text"
                            name="search"
                            value={filters.search}
                            onChange={handleFilterChange}
                            placeholder="Nome, Email ou Telefone..."
                            style={{ ...styles.input, paddingLeft: '40px' }}
                        />
                    </div>
                </div>

                <div style={styles.inputGroup}>
                    <label style={styles.label}>Data Início</label>
                    <input
                        type="date"
                        name="startDate"
                        value={filters.startDate}
                        onChange={handleFilterChange}
                        style={styles.input}
                    />
                </div>

                <div style={styles.inputGroup}>
                    <label style={styles.label}>Data Fim</label>
                    <input
                        type="date"
                        name="endDate"
                        value={filters.endDate}
                        onChange={handleFilterChange}
                        style={styles.input}
                    />
                </div>

                <button
                    onClick={clearFilters}
                    className="btn-base"
                    style={{ backgroundColor: '#ef4444', height: '38px', padding: '0 16px', fontSize: '13px' }}
                    title="Limpar Filtros"
                >
                    <X size={16} /> Limpar
                </button>
            </div>

            {/* Botão Novo Lead e Bulk Delete */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px', gap: '8px' }}>
                <button
                    onClick={() => setShowImportModal(true)}
                    className="btn-base"
                    style={{
                        backgroundColor: '#16a34a',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <FileSpreadsheet size={18} />
                    Importar Excel
                </button>
                {selectedLeads.length > 0 && (
                    <button
                        onClick={handleBulkDelete}
                        className="btn-base"
                        style={{ backgroundColor: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <Trash2 size={18} />
                        Excluir Selecionados ({selectedLeads.length})
                    </button>
                )}
                <button
                    onClick={() => {
                        setSelectedLead(null);
                        setEditForm({ name: '', surname: '', email: '', phone: '' });
                        setShowEditModal(true);
                    }}
                    className="btn-base btn-new"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <UserPlus size={18} />
                    Novo Lead
                </button>
            </div>

            {/* Tabela */}
            <div style={styles.tableCard}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th style={{ ...styles.th, width: '40px' }}>
                                    <input
                                        type="checkbox"
                                        onChange={toggleSelectAll}
                                        checked={leads.length > 0 && selectedLeads.length === leads.length}
                                        style={{ accentColor: currentTheme.primary }}
                                    />
                                </th>
                                <th style={styles.th}>Nome</th>
                                <th style={styles.th}>Sobrenome</th>
                                <th style={styles.th}>Email</th>
                                <th style={styles.th}>Telefone</th>
                                <th style={styles.th}>Criado em</th>
                                <th style={styles.th}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-8 text-center" style={{ color: currentTheme.textSecondary }}>
                                        Carregando...
                                    </td>
                                </tr>
                            ) : leads.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-8 text-center" style={{ color: currentTheme.textSecondary }}>
                                        Nenhum lead encontrado.
                                    </td>
                                </tr>
                            ) : (
                                leads.map((lead) => (
                                    <tr key={lead.id} className={`${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'} transition-colors`}>
                                        <td style={styles.td}>
                                            <input
                                                type="checkbox"
                                                checked={selectedLeads.includes(lead.id)}
                                                onChange={() => toggleSelectOne(lead.id)}
                                                style={{ accentColor: currentTheme.primary }}
                                            />
                                        </td>
                                        <td style={styles.td}>{lead.name}</td>
                                        <td style={styles.td}>{lead.surname || '-'}</td>
                                        <td style={styles.td}>{lead.email || '-'}</td>
                                        <td style={styles.td}>{lead.phone || '-'}</td>
                                        <td style={styles.td}>
                                            {new Date(lead.createdAt).toLocaleDateString()} {new Date(lead.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td style={styles.td}>
                                            <div className="flex items-center">
                                                <button
                                                    onClick={() => handleEdit(lead)}
                                                    style={{ ...styles.actionButton, color: '#2563eb', backgroundColor: isDark ? '#1e3a8a' : '#eff6ff' }}
                                                    className={isDark ? "hover:bg-blue-900" : "hover:bg-blue-100"}
                                                    title="Editar"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(lead)}
                                                    style={{ ...styles.actionButton, color: '#dc2626', backgroundColor: isDark ? '#7f1d1d' : '#fef2f2' }}
                                                    className={isDark ? "hover:bg-red-900" : "hover:bg-red-100"}
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleSendToFunnel(lead)}
                                                    style={{ ...styles.actionButton, color: '#f59e0b', backgroundColor: isDark ? '#78350f' : '#fef3c7' }}
                                                    className={isDark ? "hover:bg-yellow-900" : "hover:bg-yellow-100"}
                                                    title="Enviar para Funil"
                                                >
                                                    <Funnel size={16} />
                                                </button>
                                                {(user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'MASTER') && (
                                                    <button
                                                        onClick={() => handleTransferClick(lead)}
                                                        style={{ ...styles.actionButton, color: '#0ea5e9', backgroundColor: isDark ? '#0c4a6e' : '#e0f2fe' }}
                                                        className={isDark ? "hover:bg-sky-900" : "hover:bg-sky-100"}
                                                        title="Transferir Lead"
                                                    >
                                                        <ArrowLeftRight size={16} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={handleMigrate}
                                                    style={{ ...styles.actionButton, color: '#16a34a', backgroundColor: isDark ? '#14532d' : '#f0fdf4' }}
                                                    className={isDark ? "hover:bg-green-900" : "hover:bg-green-100"}
                                                    title="Migrar para Cliente"
                                                >
                                                    <UserPlus size={16} />
                                                </button>
                                                <button
                                                    onClick={handleMessage}
                                                    style={{ ...styles.actionButton, color: '#9333ea', backgroundColor: isDark ? '#581c87' : '#faf5ff' }}
                                                    className={isDark ? "hover:bg-purple-900" : "hover:bg-purple-100"}
                                                    title="Enviar Mensagem"
                                                >
                                                    <MessageSquare size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Paginação */}
                {pagination.pages > 1 && (
                    <div style={styles.pagination}>
                        <button
                            onClick={() => setPagination(prev => ({ ...prev, page: Math.max(prev.page - 1, 1) }))}
                            disabled={pagination.page === 1}
                            className={`btn-base btn-new ${pagination.page === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                            style={{
                                backgroundColor: isDark ? currentTheme.cardBackground : '#fff',
                                color: currentTheme.textPrimary,
                                borderColor: currentTheme.border
                            }}
                        >
                            Anterior
                        </button>
                        <span className="text-sm" style={{ color: currentTheme.textSecondary }}>
                            Página {pagination.page} de {pagination.pages}
                        </span>
                        <button
                            onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.page + 1, pagination.pages) }))}
                            disabled={pagination.page === pagination.pages}
                            className={`btn-base btn-new ${pagination.page === pagination.pages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                            style={{
                                backgroundColor: isDark ? currentTheme.cardBackground : '#fff',
                                color: currentTheme.textPrimary,
                                borderColor: currentTheme.border
                            }}
                        >
                            Próxima
                        </button>
                    </div>
                )}
            </div>

            {/* Modal Editar / Criar */}
            {showEditModal && (
                <div style={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
                    <div style={styles.modalContainer} onClick={e => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h3 style={styles.modalTitle}>{selectedLead ? 'Editar Lead' : 'Novo Lead'}</h3>
                            <button onClick={() => setShowEditModal(false)} className="btn-close-modal">
                                <X size={24} />
                            </button>
                        </div>
                        <div style={styles.modalContent}>
                            <form id="edit-lead-form" onSubmit={handleSaveEdit}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Nome <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        style={styles.input}
                                        value={editForm.name}
                                        onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                        required
                                    />
                                </div>

                                {/* Show Owner if Admin/Manager */}
                                {(user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'MASTER') && selectedLead && (
                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>Responsável (Dono)</label>
                                        <input
                                            type="text"
                                            style={{ ...styles.input, backgroundColor: isDark ? '#333' : '#f3f4f6', cursor: 'not-allowed' }}
                                            value={selectedLead.user ? selectedLead.user.name : 'Sem dono'}
                                            readOnly
                                        />
                                        <small style={{ color: currentTheme.textSecondary, fontSize: '11px' }}>
                                            Para alterar, use o botão de transferência na lista.
                                        </small>
                                    </div>
                                )}

                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Sobrenome</label>
                                    <input
                                        type="text"
                                        style={styles.input}
                                        value={editForm.surname}
                                        onChange={e => setEditForm(prev => ({ ...prev, surname: e.target.value }))}
                                    />
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Email</label>
                                    <input
                                        type="email"
                                        style={styles.input}
                                        value={editForm.email}
                                        onChange={e => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                                    />
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Telefone</label>
                                    <input
                                        type="text"
                                        style={styles.input}
                                        value={editForm.phone}
                                        onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                                    />
                                </div>
                            </form>
                        </div>
                        <div style={styles.modalFooter}>
                            <button
                                type="button"
                                onClick={() => setShowEditModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50"
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    border: `1px solid ${currentTheme.border}`,
                                    backgroundColor: isDark ? currentTheme.cardBackground : '#fff',
                                    color: currentTheme.textPrimary,
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                form="edit-lead-form"
                                className="btn-base btn-new"
                            >
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Confirmação (Bootstrap Style) */}
            {confirmModal.open && (
                <div style={styles.modalOverlay} onClick={closeConfirmModal}>
                    <div style={{ ...styles.modalContainer, maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h3 style={{ ...styles.modalTitle, color: '#dc2626' }}>{confirmModal.title}</h3>
                            <button onClick={closeConfirmModal} className="btn-close-modal">
                                <X size={24} />
                            </button>
                        </div>
                        <div style={{ padding: '24px' }}>
                            <p style={{ color: currentTheme.textSecondary }}>{confirmModal.message}</p>
                        </div>
                        <div style={styles.modalFooter}>
                            <button
                                type="button"
                                onClick={closeConfirmModal}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50"
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    border: `1px solid ${currentTheme.border}`,
                                    backgroundColor: isDark ? currentTheme.cardBackground : '#fff',
                                    color: currentTheme.textPrimary,
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={confirmModal.onConfirm}
                                className="btn-base"
                                style={{
                                    backgroundColor: '#dc2626',
                                    color: '#fff',
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                                }}
                            >
                                Confirmar Exclusão
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Transferir Lead */}
            {showTransferModal && (
                <div style={styles.modalOverlay} onClick={() => setShowTransferModal(false)}>
                    <div style={{ ...styles.modalContainer, maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h3 style={styles.modalTitle}>Transferir Lead</h3>
                            <button onClick={() => setShowTransferModal(false)} className="btn-close-modal">
                                <X size={24} />
                            </button>
                        </div>
                        <div style={{ padding: '24px' }}>
                            <p style={{ marginBottom: '16px', color: currentTheme.textSecondary }}>
                                Selecione o novo responsável para o lead <b>{transferTargetLead?.name}</b>:
                            </p>
                            <select
                                style={{ ...styles.input, width: '100%' }}
                                value={selectedUser}
                                onChange={(e) => setSelectedUser(e.target.value)}
                            >
                                <option value="">Selecione um usuário...</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>{u.name} ({u.role || 'Membro'})</option>
                                ))}
                            </select>
                        </div>
                        <div style={styles.modalFooter}>
                            <button
                                onClick={() => setShowTransferModal(false)}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    border: `1px solid ${currentTheme.border}`,
                                    backgroundColor: isDark ? currentTheme.cardBackground : '#fff',
                                    color: currentTheme.textPrimary,
                                    cursor: 'pointer'
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmTransfer}
                                className="btn-base"
                                style={{
                                    backgroundColor: '#0ea5e9',
                                    color: '#fff',
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                Transferir
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Importar Leads */}
            {showImportModal && (
                <div style={styles.modalOverlay} onClick={() => setShowImportModal(false)}>
                    <div style={{ ...styles.modalContainer, maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h3 style={styles.modalTitle}>Importar Leads via Excel</h3>
                            <button onClick={() => setShowImportModal(false)} className="btn-close-modal">
                                <X size={24} />
                            </button>
                        </div>
                        <div style={styles.modalContent}>
                            <ImportarLeadsPlanilha
                                isModal={true}
                                onImportSuccess={() => {
                                    fetchLeads();
                                    // Optionally close modal or let user close
                                    // setShowImportModal(false);
                                }}
                            />
                        </div>
                        <div style={styles.modalFooter}>
                            <button
                                onClick={() => setShowImportModal(false)}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    border: `1px solid ${currentTheme.border}`,
                                    backgroundColor: isDark ? currentTheme.cardBackground : '#fff',
                                    color: currentTheme.textPrimary,
                                    cursor: 'pointer'
                                }}
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Leads;
