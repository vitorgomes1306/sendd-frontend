import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
import {
    User, Mail, Phone, Shield, Calendar, Activity,
    Lock, CheckCircle, XCircle, Trash2, Save, ArrowLeft,
    Users, MessageSquare, Briefcase
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext'; // Para checar permissões extras se precisar

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
                        <li style={styles.menuItem(activeTab === 'security')} onClick={() => setActiveTab('security')}>
                            <Lock size={18} /> Segurança
                        </li>
                        <li style={styles.menuItem(activeTab === 'danger')} onClick={() => setActiveTab('danger')}>
                            <Shield size={18} /> Zona de Perigo
                        </li>
                    </ul>
                </div>

                <div style={styles.card}>
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
