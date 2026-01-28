import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
import {
    User, Mail, Phone, Shield, Calendar, Activity,
    Lock, CheckCircle, XCircle, Trash2, Save, ArrowLeft,
    Users, MessageSquare, Briefcase, BanknoteArrowDown, BanknoteArrowUp, SquarePen
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext'; // Para checar permissões extras se precisar

// Simple Toggle Component
const ToggleSwitch = ({ checked, onChange }) => (
    <div
        onClick={onChange}
        style={{
            width: '40px', height: '22px', backgroundColor: checked ? '#10b981' : '#e5e7eb',
            borderRadius: '20px', position: 'relative', cursor: 'pointer', transition: 'background-color 0.2s'
        }}
    >
        <div style={{
            width: '18px', height: '18px', backgroundColor: 'white', borderRadius: '50%',
            position: 'absolute', top: '2px', left: checked ? '20px' : '2px', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
        }} />
    </div>
);

const UserDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentTheme } = useTheme();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('profile');

    // Form states
    const [formData, setFormData] = useState({
        name: '', email: '', role: '', cellphone: '', cpfCnpj: ''
    });
    const [passwordData, setPasswordData] = useState({ password: '', confirmPassword: '' });

    // UI states
    const [saving, setSaving] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    useEffect(() => {
        loadUser();
    }, [id]);

    const loadUser = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/private/users/${id}`);
            setUser(response.data);
            setFormData({
                name: response.data.name || '',
                email: response.data.email || '',
                role: response.data.role || 'MEMBER',
                cellphone: response.data.cellphone || '',
                cpfCnpj: response.data.cpfCnpj || ''
            });
        } catch (error) {
            console.error('Erro ao carregar usuário:', error);
            alert('Erro ao carregar usuário');
            navigate('/admin/gestao');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            await api.put(`/private/users/${id}`, formData);
            alert('Perfil atualizado com sucesso!');
            loadUser(); // Recarrega para garantir
        } catch (error) {
            console.error('Erro ao atualizar:', error);
            alert('Erro ao atualizar perfil');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwordData.password !== passwordData.confirmPassword) {
            return alert('As senhas não coincidem');
        }
        if (passwordData.password.length < 6) {
            return alert('Senha muito curta (min 6 caracteres)');
        }

        try {
            setSaving(true);
            await api.put(`/private/users/${id}/password`, { password: passwordData.password });
            alert('Senha alterada com sucesso!');
            setPasswordData({ password: '', confirmPassword: '' });
        } catch (error) {
            console.error('Erro ao mudar senha:', error);
            alert('Erro ao mudar senha. Verifique se você tem permissão.');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async () => {
        try {
            await api.put(`/private/users/${id}/toggle-active`);
            loadUser();
        } catch (error) {
            console.error('Erro ao alterar status:', error);
            alert('Erro ao alterar status');
        }
    };

    const handleDeleteUser = async () => {
        if (!confirm('Tem certeza que deseja EXCLUIR este usuário? Esta ação é irreversível.')) return;

        try {
            await api.delete(`/private/users/${id}`);
            alert('Usuário excluído.');
            navigate('/admin/gestao');
        } catch (error) {
            console.error('Erro ao excluir:', error);
            alert('Erro ao excluir usuário');
        }
    };

    // Financial States
    const [invoices, setInvoices] = useState([]);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [isReceiveMode, setIsReceiveMode] = useState(false); // Mode to differentiate "Receive" from "Edit"
    const [financialSubTab, setFinancialSubTab] = useState('open'); // 'open' | 'paid'

    const [invoiceForm, setInvoiceForm] = useState({
        id: null,
        value: '',
        dueDate: '',
        carrier: '',
        discount: 0,
        paymentMethod: 'PIX',
        status: 'pending',
        paymentDate: ''
    });

    const loadInvoices = async () => {
        try {
            const response = await api.get(`/private/users/${id}/invoices`);
            setInvoices(response.data);
        } catch (error) {
            console.error('Erro ao carregar faturas:', error);
        }
    };

    useEffect(() => {
        if (activeTab === 'financial') {
            loadInvoices();
        }
    }, [activeTab]);

    const handleSaveInvoice = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            const data = { ...invoiceForm };
            if (!data.paymentDate) delete data.paymentDate; // Don't send empty string

            if (data.id) {
                await api.put(`/private/users/${id}/invoices/${data.id}`, data);
            } else {
                await api.post(`/private/users/${id}/invoices`, data);
            }
            alert(isReceiveMode ? 'Pagamento recebido!' : 'Fatura salva com sucesso!');
            setShowInvoiceModal(false);
            loadInvoices();
        } catch (error) {
            console.error('Erro ao salvar fatura:', error);
            alert('Erro ao salvar fatura');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteInvoice = async (invoiceId) => {
        if (!confirm('Excluir fatura?')) return;
        try {
            await api.delete(`/private/users/${id}/invoices/${invoiceId}`);
            loadInvoices();
        } catch (error) {
            console.error('Erro ao excluir fatura:', error);
            alert('Erro: ' + error.response?.data?.error);
        }
    };

    const handleReverseInvoice = async (invoiceId) => {
        if (!confirm('Deseja realmente estornar este pagamento? O status voltará para Pendente.')) return;
        try {
            await api.put(`/private/users/${id}/invoices/${invoiceId}`, {
                status: 'pending',
                paymentDate: null // Backend handles this logic via strict typing usually, ensure backend clears it
            });
            alert('Estorno realizado.');
            loadInvoices();
        } catch (error) {
            console.error('Erro ao estornar:', error);
            alert('Erro ao estornar fatura');
        }
    };

    const openInvoiceModal = (invoice = null) => {
        setIsReceiveMode(false);
        if (invoice) {
            setInvoiceForm({
                id: invoice.id,
                value: invoice.value,
                dueDate: invoice.dueDate ? invoice.dueDate.split('T')[0] : '',
                carrier: invoice.carrier,
                discount: invoice.discount || 0,
                paymentMethod: invoice.paymentMethod,
                status: invoice.status,
                paymentDate: invoice.paymentDate ? invoice.paymentDate.split('T')[0] : ''
            });
        } else {
            setInvoiceForm({
                id: null,
                value: '',
                dueDate: '',
                carrier: '',
                discount: 0,
                paymentMethod: 'PIX',
                status: 'pending',
                paymentDate: ''
            });
        }
        setShowInvoiceModal(true);
    };

    const openReceiveModal = (invoice) => {
        setIsReceiveMode(true);
        setInvoiceForm({
            id: invoice.id,
            value: invoice.value,
            dueDate: invoice.dueDate ? invoice.dueDate.split('T')[0] : '',
            carrier: invoice.carrier,
            discount: invoice.discount || 0,
            paymentMethod: invoice.paymentMethod || 'PIX',
            status: 'paid', // Force status paid
            paymentDate: new Date().toISOString().split('T')[0] // Default today
        });
        setShowInvoiceModal(true);
    }

    const handleToggleOrgActive = async (orgId, currentStatus) => {
        try {
            // Optimistic update
            setUser(prev => ({
                ...prev,
                organizations: prev.organizations.map(o => o.id === orgId ? { ...o, active: !currentStatus } : o)
            }));

            await api.put(`/private/organizations/${orgId}`, { active: !currentStatus });
        } catch (error) {
            console.error('Erro ao alterar status da organização:', error);
            alert('Erro ao alterar status da organização');
            loadUser(); // Revert
        }
    };

    if (loading) return <div style={{ padding: '40px', color: currentTheme.text }}>Carregando...</div>;
    if (!user) return <div style={{ padding: '40px', color: currentTheme.text }}>Usuário não encontrado</div>;

    const styles = {
        container: { padding: '24px', backgroundColor: currentTheme.background, color: currentTheme.text, minHeight: '100vh' },
        header: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' },
        backBtn: { background: 'none', border: 'none', color: currentTheme.text, cursor: 'pointer' },
        title: { fontSize: '24px', fontWeight: 'bold' },
        grid: { display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' },
        card: { backgroundColor: currentTheme.cardBackground, borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
        statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' },
        statCard: { backgroundColor: currentTheme.background, padding: '16px', borderRadius: '8px', textAlign: 'center' },
        statValue: { fontSize: '24px', fontWeight: 'bold', color: currentTheme.primary },
        statLabel: { fontSize: '12px', color: currentTheme.secondaryText },
        menuList: { listStyle: 'none', padding: 0 },
        menuItem: (active) => ({
            padding: '12px 16px', borderRadius: '8px', cursor: 'pointer', marginBottom: '8px',
            backgroundColor: active ? currentTheme.primary + '20' : 'transparent',
            color: active ? currentTheme.primary : currentTheme.text,
            fontWeight: active ? '600' : 'normal',
            display: 'flex', alignItems: 'center', gap: '12px'
        }),
        inputGroup: { marginBottom: '16px' },
        label: { display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' },
        input: { width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${currentTheme.borderColor}`, backgroundColor: currentTheme.background, color: currentTheme.text },
        btnPromise: (color = currentTheme.primary) => ({
            padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: color, color: '#fff', fontWeight: '600', cursor: 'pointer', opacity: saving ? 0.7 : 1
        }),
        badge: (active) => ({
            padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold',
            backgroundColor: active ? '#dcfce7' : '#fee2e2', color: active ? '#166534' : '#991b1b'
        })
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <button style={styles.backBtn} onClick={() => navigate('/admin/gestao')}>
                    <ArrowLeft size={24} />
                </button>
                <div style={{ flex: 1 }}>
                    <h1 style={styles.title}>{user.name}</h1>
                    <span style={{ fontSize: '14px', color: currentTheme.secondaryText }}>{user.email}</span>
                </div>
                <div style={styles.badge(user.Active && !user.bloqued)}>
                    {user.Active && !user.bloqued ? 'ATIVO' : 'BLOQUEADO/INATIVO'}
                </div>
            </div>

            <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                    <Briefcase size={20} color={currentTheme.primary} style={{ marginBottom: 8 }} />
                    <div style={styles.statValue}>{user._count?.organizations || 0}</div>
                    <div style={styles.statLabel}>Organizações</div>
                </div>
                <div style={styles.statCard}>
                    <Users size={20} color={currentTheme.primary} style={{ marginBottom: 8 }} />
                    <div style={styles.statValue}>{user._count?.teamMembers || 0}</div>
                    <div style={styles.statLabel}>Times</div>
                </div>
                <div style={styles.statCard}>
                    <MessageSquare size={20} color={currentTheme.primary} style={{ marginBottom: 8 }} />
                    <div style={styles.statValue}>{user._count?.chats || 0}</div>
                    <div style={styles.statLabel}>Chats</div>
                </div>
            </div>

            <div style={styles.grid}>
                <div style={styles.card}>
                    <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>Menu</h3>
                    <ul style={styles.menuList}>
                        <li style={styles.menuItem(activeTab === 'profile')} onClick={() => setActiveTab('profile')}>
                            <User size={18} /> Perfil
                        </li>
                        <li style={styles.menuItem(activeTab === 'organizations')} onClick={() => setActiveTab('organizations')}>
                            <Briefcase size={18} /> Organizações
                        </li>
                        <li style={styles.menuItem(activeTab === 'financial')} onClick={() => setActiveTab('financial')}>
                            <Activity size={18} /> Financeiro
                        </li>
                        <li style={styles.menuItem(activeTab === 'security')} onClick={() => setActiveTab('security')}>
                            <Lock size={18} /> Segurança
                        </li>
                        <li style={styles.menuItem(activeTab === 'danger')} onClick={() => setActiveTab('danger')}>
                            <Shield size={18} /> Zona de Perigo
                        </li>
                    </ul>
                </div>

                <div style={styles.card}>
                    {activeTab === 'organizations' && (
                        <div>
                            <h2 style={{ marginBottom: '24px', fontSize: '20px' }}>Organizações</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                                {user.organizations?.map(org => (
                                    <div key={org.id} style={{
                                        backgroundColor: currentTheme.background,
                                        border: `1px solid ${currentTheme.borderColor}`,
                                        borderRadius: '8px',
                                        padding: '16px',
                                        position: 'relative'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                            <div style={{
                                                width: '48px', height: '48px', borderRadius: '8px',
                                                backgroundColor: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                                            }}>
                                                {org.logo ? (
                                                    <img src={`${api.defaults.baseURL.replace('/api', '')}/${org.logo}`} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <Briefcase size={24} color="#9ca3af" />
                                                )}
                                            </div>
                                            <div>
                                                <h4 style={{ margin: 0, fontSize: '16px' }}>{org.nomeFantasia || org.razaoSocial}</h4>
                                                <span style={{ fontSize: '12px', color: currentTheme.secondaryText }}>{org.razaoSocial}</span>
                                            </div>
                                            <div style={{ marginLeft: 'auto' }}>
                                                <ToggleSwitch
                                                    checked={org.active}
                                                    onChange={() => handleToggleOrgActive(org.id, org.active)}
                                                />
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px', backgroundColor: currentTheme.cardBackground, borderRadius: '4px' }}>
                                                <span style={{ fontWeight: 'bold' }}>{org._count?.whatsappInstances || 0}</span>
                                                <span style={{ color: currentTheme.secondaryText }}>Instâncias</span>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px', backgroundColor: currentTheme.cardBackground, borderRadius: '4px' }}>
                                                <span style={{ fontWeight: 'bold' }}>{org._count?.chats || 0}</span>
                                                <span style={{ color: currentTheme.secondaryText }}>Chats</span>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px', backgroundColor: currentTheme.cardBackground, borderRadius: '4px' }}>
                                                {/* Summing team members as proxy for collaborators */}
                                                <span style={{ fontWeight: 'bold' }}>
                                                    {org.teams?.reduce((acc, team) => acc + (team._count?.members || 0), 0) || 0}
                                                </span>
                                                <span style={{ color: currentTheme.secondaryText }}>Colaboradores</span>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px', backgroundColor: currentTheme.cardBackground, borderRadius: '4px' }}>
                                                <span style={{ fontWeight: 'bold' }}>{org._count?.departments || 0}</span>
                                                <span style={{ color: currentTheme.secondaryText }}>Deptos</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {(!user.organizations || user.organizations.length === 0) && (
                                    <p style={{ color: currentTheme.secondaryText, gridColumn: '1/-1', textAlign: 'center', padding: '20px' }}>
                                        Nenhuma organização vinculada.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'financial' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h2 style={{ fontSize: '20px' }}>Financeiro</h2>
                                <button type="button" onClick={() => openInvoiceModal()} style={styles.btnPromise()}>
                                    + Nova Fatura
                                </button>
                            </div>

                            {/* Sub-tabs for Financial */}
                            <div style={{ display: 'flex', borderBottom: `1px solid ${currentTheme.borderColor}`, marginBottom: '16px' }}>
                                <div
                                    onClick={() => setFinancialSubTab('open')}
                                    style={{
                                        padding: '10px 20px', cursor: 'pointer',
                                        borderBottom: financialSubTab === 'open' ? `2px solid ${currentTheme.primary}` : 'none',
                                        color: financialSubTab === 'open' ? currentTheme.primary : currentTheme.secondaryText,
                                        fontWeight: financialSubTab === 'open' ? 'bold' : 'normal'
                                    }}
                                >
                                    Faturas em Aberto / Atrasadas
                                </div>
                                <div
                                    onClick={() => setFinancialSubTab('paid')}
                                    style={{
                                        padding: '10px 20px', cursor: 'pointer',
                                        borderBottom: financialSubTab === 'paid' ? `2px solid ${currentTheme.primary}` : 'none',
                                        color: financialSubTab === 'paid' ? currentTheme.primary : currentTheme.secondaryText,
                                        fontWeight: financialSubTab === 'paid' ? 'bold' : 'normal'
                                    }}
                                >
                                    Faturas Pagas
                                </div>
                            </div>

                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                    <thead>
                                        <tr style={{ textAlign: 'left', borderBottom: `1px solid ${currentTheme.borderColor}` }}>
                                            <th style={{ padding: '12px' }}>Vencimento</th>
                                            <th style={{ padding: '12px' }}>Valor Original</th>
                                            <th style={{ padding: '12px' }}>Desconto</th>
                                            <th style={{ padding: '12px' }}>Total Final</th>
                                            <th style={{ padding: '12px' }}>Portador</th>
                                            <th style={{ padding: '12px' }}>Status</th>
                                            {financialSubTab === 'paid' && <th style={{ padding: '12px' }}>Data Pagto</th>}
                                            <th style={{ padding: '12px' }}>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {invoices.filter(inv => financialSubTab === 'paid' ? inv.status === 'paid' : inv.status !== 'paid').map(inv => {
                                            const total = parseFloat(inv.value) - parseFloat(inv.discount || 0);
                                            const isPaid = inv.status === 'paid';
                                            const isOverdue = !isPaid && new Date(inv.dueDate) < new Date();
                                            const dueDateStr = new Date(inv.dueDate).toLocaleDateString('pt-BR');
                                            const paymentDateStr = inv.paymentDate ? new Date(inv.paymentDate).toLocaleDateString('pt-BR') : '-';

                                            return (
                                                <tr key={inv.id} style={{ borderBottom: `1px solid ${currentTheme.borderColor}` }}>
                                                    <td style={{ padding: '12px' }}>{dueDateStr}</td>
                                                    <td style={{ padding: '12px' }}>R$ {parseFloat(inv.value).toFixed(2)}</td>
                                                    <td style={{ padding: '12px' }}>R$ {parseFloat(inv.discount || 0).toFixed(2)}</td>
                                                    <td style={{ padding: '12px', fontWeight: 'bold' }}>R$ {total.toFixed(2)}</td>
                                                    <td style={{ padding: '12px' }}>{inv.carrier}</td>
                                                    <td style={{ padding: '12px' }}>
                                                        <span style={{
                                                            padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold',
                                                            backgroundColor: isPaid ? '#dcfce7' : isOverdue ? '#fee2e2' : '#fef9c3',
                                                            color: isPaid ? '#166534' : isOverdue ? '#991b1b' : '#854d0e'
                                                        }}>
                                                            {isPaid ? 'PAGO' : isOverdue ? 'ATRASADO' : 'PENDENTE'}
                                                        </span>
                                                    </td>
                                                    {financialSubTab === 'paid' && <td style={{ padding: '12px' }}>{paymentDateStr}</td>}
                                                    <td style={{ padding: '12px' }}>
                                                        {!isPaid && (
                                                            <button
                                                                onClick={() => openReceiveModal(inv)}
                                                                title="Receber Manualmente"
                                                                style={{ marginRight: '8px', cursor: 'pointer', background: 'none', border: 'none', color: '#16a34a', fontWeight: 'bold' }}
                                                            >
                                                                <BanknoteArrowDown />
                                                            </button>
                                                        )}
                                                        {isPaid && (
                                                            <button
                                                                onClick={() => handleReverseInvoice(inv.id)}
                                                                title="Estornar Pagamento"
                                                                style={{ marginRight: '8px', cursor: 'pointer', background: 'none', border: 'none', color: '#d97706', fontWeight: 'bold' }}
                                                            >
                                                                <BanknoteArrowUp />
                                                            </button>
                                                        )}
                                                        <button onClick={() => openInvoiceModal(inv)} style={{ marginRight: '8px', cursor: 'pointer', background: 'none', border: 'none', color: currentTheme.primary }}>
                                                            <SquarePen />
                                                        </button>
                                                        <button onClick={() => handleDeleteInvoice(inv.id)} style={{ cursor: 'pointer', background: 'none', border: 'none', color: '#ef4444' }}>
                                                            <Trash2 />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {invoices.filter(inv => financialSubTab === 'paid' ? inv.status === 'paid' : inv.status !== 'paid').length === 0 && (
                                            <tr>
                                                <td colSpan={financialSubTab === 'paid' ? 8 : 7} style={{ padding: '20px', textAlign: 'center', color: currentTheme.secondaryText }}>
                                                    Nenhuma fatura encontrada nesta aba.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Simple Modal for Invoice (Add/Edit) */}
                    {showInvoiceModal && !isReceiveMode && (
                        <div style={{
                            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
                        }}>
                            <div style={{
                                backgroundColor: currentTheme.cardBackground, padding: '24px', borderRadius: '8px',
                                width: '90%', maxWidth: '500px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                            }}>
                                <h3 style={{ marginBottom: '16px' }}>{invoiceForm.id ? 'Editar Fatura' : 'Nova Fatura'}</h3>
                                <form onSubmit={handleSaveInvoice}>
                                    <div style={styles.grid}>
                                        <div style={styles.inputGroup}>
                                            <label style={styles.label}>Valor (R$)</label>
                                            <input type="number" step="0.01" style={styles.input} value={invoiceForm.value} onChange={e => setInvoiceForm({ ...invoiceForm, value: e.target.value })} required />
                                        </div>
                                        <div style={styles.inputGroup}>
                                            <label style={styles.label}>Vencimento</label>
                                            <input type="date" style={styles.input} value={invoiceForm.dueDate} onChange={e => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })} required />
                                        </div>
                                    </div>

                                    <div style={styles.inputGroup}>
                                        <label style={styles.label}>Portador (Banco/Gateway)</label>
                                        <input style={styles.input} value={invoiceForm.carrier} onChange={e => setInvoiceForm({ ...invoiceForm, carrier: e.target.value })} required placeholder="Ex: Banco Itaú" />
                                    </div>

                                    {/* Simple Status edit only */}
                                    <div style={styles.inputGroup}>
                                        <label style={styles.label}>Status</label>
                                        <select style={styles.input} value={invoiceForm.status} onChange={e => setInvoiceForm({ ...invoiceForm, status: e.target.value })}>
                                            <option value="pending">Pendente</option>
                                            <option value="paid">Pago</option>
                                            <option value="cancelled">Cancelado</option>
                                        </select>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                                        <button type="button" onClick={() => setShowInvoiceModal(false)} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', backgroundColor: '#e5e7eb', color: '#374151' }}>
                                            Cancelar
                                        </button>
                                        <button type="submit" style={styles.btnPromise()} disabled={saving}>
                                            Salvar
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Receive Modal (Manual Payment) */}
                    {showInvoiceModal && isReceiveMode && (
                        <div style={{
                            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
                        }}>
                            <div style={{
                                backgroundColor: currentTheme.cardBackground, padding: '24px', borderRadius: '8px',
                                width: '90%', maxWidth: '500px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                            }}>
                                <h3 style={{ marginBottom: '16px', color: '#16a34a' }}>Receber Fatura Manualmente</h3>
                                <form onSubmit={handleSaveInvoice}>
                                    <div style={{ padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '8px', marginBottom: '16px' }}>
                                        <div style={{ fontSize: '14px', color: '#166534', marginBottom: '4px' }}>Valor Original</div>
                                        <strong style={{ fontSize: '18px', color: '#166534' }}>R$ {parseFloat(invoiceForm.value).toFixed(2)}</strong>
                                    </div>

                                    <div style={styles.inputGroup}>
                                        <label style={styles.label}>Desconto no Pagamento (R$)</label>
                                        <input
                                            type="number" step="0.01" style={styles.input}
                                            value={invoiceForm.discount}
                                            onChange={e => setInvoiceForm({ ...invoiceForm, discount: e.target.value })}
                                        />
                                    </div>

                                    <div style={{ marginBottom: '16px', textAlign: 'right' }}>
                                        <span style={{ fontSize: '14px', marginRight: '8px' }}>Total a Receber:</span>
                                        <strong style={{ fontSize: '20px' }}>
                                            R$ {Math.max(0, parseFloat(invoiceForm.value || 0) - parseFloat(invoiceForm.discount || 0)).toFixed(2)}
                                        </strong>
                                    </div>

                                    <div style={styles.grid}>
                                        <div style={styles.inputGroup}>
                                            <label style={styles.label}>Data Pagamento</label>
                                            <input type="date" style={styles.input} value={invoiceForm.paymentDate} onChange={e => setInvoiceForm({ ...invoiceForm, paymentDate: e.target.value })} required />
                                        </div>
                                        <div style={styles.inputGroup}>
                                            <label style={styles.label}>Forma de Pagto</label>
                                            <select style={styles.input} value={invoiceForm.paymentMethod} onChange={e => setInvoiceForm({ ...invoiceForm, paymentMethod: e.target.value })}>
                                                <option value="PIX">PIX</option>
                                                <option value="BOLETO">Boleto</option>
                                                <option value="CREDIT_CARD">Cartão de Crédito</option>
                                                <option value="TRANSFER">Transferência</option>
                                                <option value="CASH">Dinheiro</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                                        <button type="button" onClick={() => setShowInvoiceModal(false)} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', backgroundColor: '#e5e7eb', color: '#374151' }}>
                                            Cancelar
                                        </button>
                                        <button type="submit" style={styles.btnPromise('#16a34a')} disabled={saving}>
                                            Confirmar Recebimento
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {activeTab === 'profile' && (
                        <form onSubmit={handleUpdateProfile}>
                            <h2 style={{ marginBottom: '24px', fontSize: '20px' }}>Editar Perfil</h2>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Nome Completo</label>
                                <input style={styles.input} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Email</label>
                                <input style={styles.input} type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Cargo (Role)</label>
                                <select style={styles.input} value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                                    <option value="MEMBER">MEMBER</option>
                                    <option value="MANAGER">MANAGER</option>
                                    <option value="ADMIN">ADMIN</option>
                                    <option value="MASTER">MASTER</option>
                                </select>
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Telefone</label>
                                <input style={styles.input} value={formData.cellphone} onChange={e => setFormData({ ...formData, cellphone: e.target.value })} />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>CPF/CNPJ</label>
                                <input style={styles.input} value={formData.cpfCnpj} onChange={e => setFormData({ ...formData, cpfCnpj: e.target.value })} />
                            </div>
                            <button type="submit" style={styles.btnPromise()} disabled={saving}>
                                {saving ? 'Salvando...' : 'Salvar Alterações'}
                            </button>
                        </form>
                    )}

                    {activeTab === 'security' && (
                        <form onSubmit={handleChangePassword}>
                            <h2 style={{ marginBottom: '24px', fontSize: '20px' }}>Segurança</h2>
                            <div style={{ padding: '16px', backgroundColor: '#fff3cd', color: '#856404', borderRadius: '8px', marginBottom: '24px', fontSize: '14px' }}>
                                <strong>Atenção:</strong> Alterar a senha desconectará o usuário de todas as sessões ativas.
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Nova Senha</label>
                                <input style={styles.input} type="password" value={passwordData.password} onChange={e => setPasswordData({ ...passwordData, password: e.target.value })} minLength={6} placeholder="Mínimo 6 caracteres" />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Confirmar Nova Senha</label>
                                <input style={styles.input} type="password" value={passwordData.confirmPassword} onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} minLength={6} placeholder="Confirme a senha" />
                            </div>
                            <button type="submit" style={styles.btnPromise()} disabled={saving}>
                                {saving ? 'Alterando...' : 'Alterar Senha'}
                            </button>
                        </form>
                    )}

                    {activeTab === 'danger' && (
                        <div>
                            <h2 style={{ marginBottom: '24px', fontSize: '20px', color: '#ef4444' }}>Zona de Perigo</h2>

                            <div style={{ padding: '20px', border: `1px solid ${currentTheme.borderColor}`, borderRadius: '8px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h4 style={{ fontWeight: 'bold', marginBottom: '4px' }}>{user.Active && !user.bloqued ? 'Desativar Usuário' : 'Ativar Usuário'}</h4>
                                    <p style={{ fontSize: '13px', color: currentTheme.secondaryText }}>
                                        {user.Active && !user.bloqued ? 'Impede o acesso imediatamento ao sistema.' : 'Restaura o acesso ao sistema.'}
                                    </p>
                                </div>
                                <button type="button" onClick={handleToggleActive} style={{
                                    padding: '8px 16px', borderRadius: '6px', border: `1px solid ${currentTheme.borderColor}`,
                                    backgroundColor: 'transparent', color: currentTheme.text, cursor: 'pointer'
                                }}>
                                    {user.Active && !user.bloqued ? 'Bloquear' : 'Ativar'}
                                </button>
                            </div>

                            <div style={{ padding: '20px', border: '1px solid #fee2e2', backgroundColor: '#fef2f2', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h4 style={{ fontWeight: 'bold', marginBottom: '4px', color: '#991b1b' }}>Excluir Usuário</h4>
                                    <p style={{ fontSize: '13px', color: '#b91c1c' }}>
                                        Ação irreversível. Remove todos os dados associados.
                                    </p>
                                </div>
                                <button type="button" onClick={handleDeleteUser} style={{
                                    padding: '8px 16px', borderRadius: '6px', border: 'none',
                                    backgroundColor: '#ef4444', color: 'white', cursor: 'pointer', fontWeight: 'bold'
                                }}>
                                    Excluir
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserDetails;
