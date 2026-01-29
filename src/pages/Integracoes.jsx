import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Database, ExternalLink, ShieldCheck, ToggleLeft, Workflow, ToggleRight, RefreshCcw, Eye, EyeOff } from 'lucide-react';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import AlertToast from '../components/ui/AlertToast';
import Modal from '../components/ui/Modal';
import '../styles/buttons.css';

const Integracoes = () => {
    const { user } = useAuth();
    const { currentTheme } = useTheme();
    const [integrations, setIntegrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeOrgId, setActiveOrgId] = useState(user?.organizationId || null);
    const [showModal, setShowModal] = useState(false);
    const [editingIntegration, setEditingIntegration] = useState(null);
    const [showToken, setShowToken] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        type: 'SGP',
        url: '',
        token: '',
        app: '',
        active: true
    });
    const [toast, setToast] = useState({ open: false, title: '', message: '', variant: 'success' });
    const [syncing, setSyncing] = useState({});

    // Modal de Confirmação de Sync
    const [showSyncModal, setShowSyncModal] = useState(false);
    const [syncTarget, setSyncTarget] = useState(null);

    // Modal de Confirmação de Delete
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const showToast = (title, message, variant = 'success') => {
        setToast({ open: true, title, message, variant });
    };

    useEffect(() => {
        if (user) {
            initComponent();
        }
    }, [user]);

    const initComponent = async () => {
        let orgId = user?.organizationId;

        // Se não tiver organizationId no user, buscar das organizações dele
        if (!orgId) {
            try {
                const response = await apiService.get('/private/organizations');
                const orgs = Array.isArray(response.data) ? response.data : (response.data?.data || []);
                if (orgs.length > 0) {
                    orgId = orgs[0].id;
                }
            } catch (err) {
                console.error('Erro ao buscar organizações:', err);
            }
        }

        if (orgId) {
            setActiveOrgId(orgId);
            loadIntegrations(orgId);
        } else {
            setLoading(false);
        }
    };

    const loadIntegrations = async (orgId = activeOrgId) => {
        if (!orgId) return;
        setLoading(true);
        try {
            const response = await apiService.get(`/private/integrations?organizationId=${orgId}`);
            setIntegrations(response.data);
        } catch (error) {
            showToast('Erro', 'Falha ao carregar integrações', 'danger');
        } finally {
            setLoading(false);
        }
    };

    const handleSync = (integration) => {
        setSyncTarget(integration);
        setShowSyncModal(true);
    };

    const confirmSync = async () => {
        if (!syncTarget) return;
        const integration = syncTarget;
        setShowSyncModal(false);

        try {
            setSyncing(prev => ({ ...prev, [integration.id]: true }));
            showToast('Info', 'Sincronização iniciada... Por favor aguarde.');

            const response = await apiService.syncIntegration(integration.id);

            showToast('Sucesso', `Sincronização concluída! ${response.data.synced} registros processados.`);
        } catch (error) {
            showToast('Erro', 'Falha na sincronização: ' + (error.response?.data?.error || error.message), 'danger');
        } finally {
            setSyncing(prev => ({ ...prev, [integration.id]: false }));
            setSyncTarget(null);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!activeOrgId) {
            showToast('Erro', 'Organização não identificada', 'danger');
            return;
        }

        try {
            if (editingIntegration) {
                await apiService.put(`/private/integrations/${editingIntegration.id}`, formData);
                showToast('Sucesso', 'Integração atualizada');
            } else {
                await apiService.post('/private/integrations', { ...formData, organizationId: activeOrgId });
                showToast('Sucesso', 'Integração criada');
            }
            setShowModal(false);
            setEditingIntegration(null);
            setFormData({ name: '', type: 'SGP', url: '', token: '', app: '', active: true });
            loadIntegrations(activeOrgId);
        } catch (error) {
            showToast('Erro', 'Falha ao salvar integração', 'danger');
        }
    };

    const handleDelete = (integration) => {
        setDeleteTarget(integration);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        const id = deleteTarget.id;
        setShowDeleteModal(false);
        try {
            await apiService.delete(`/private/integrations/${id}`);
            showToast('Sucesso', 'Integração excluída');
            loadIntegrations();
        } catch (error) {
            showToast('Erro', 'Falha ao excluir', 'danger');
        } finally {
            setDeleteTarget(null);
        }
    };

    const handleEdit = (integration) => {
        setEditingIntegration(integration);
        setFormData({
            name: integration.name,
            type: integration.type,
            url: integration.url || '',
            token: integration.token || '',
            app: integration.app || '',
            active: integration.active
        });
        setShowModal(true);
    };

    const toggleStatus = async (integration) => {
        try {
            await apiService.put(`/private/integrations/${integration.id}`, { ...integration, active: !integration.active });
            loadIntegrations();
        } catch (error) {
            showToast('Erro', 'Falha ao alterar status', 'danger');
        }
    };

    const [activeTab, setActiveTab] = useState('erp');

    // ... existing initialization code ...

    const filteredIntegrations = integrations.filter(integ => {
        if (activeTab === 'erp') return ['SGP', 'IXC', 'MK_AUTH', 'GENERIC'].includes(integ.type);
        if (activeTab === 'banking') return ['ISP_FLASH'].includes(integ.type);
        return false;
    });

    const getAvailableTypes = () => {
        if (activeTab === 'erp') {
            return [
                { value: 'SGP', label: 'SGP - Sistema de Gestão de Provedores' },
                { value: 'IXC', label: 'IXC Soft' },
                { value: 'MK_AUTH', label: 'MK-Auth' },
                { value: 'GENERIC', label: 'API Genérica' }
            ];
        } else {
            return [
                { value: 'ISP_FLASH', label: 'ISP Flash (Carteira de auto custódia)' },
                { value: 'paguedev', label: 'Pague.dev (PIX)' },
                { value: 'sicoob', label: 'Sicoob' },
                { value: 'inter', label: 'Inter' },

            ];
        }
    };

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>

                    <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}><Workflow /> Integrações Externas</h1>
                    <p style={{ color: '#666', margin: '4px 0 0 0' }}>Gerencie conexões com sistemas de terceiros</p>
                </div>
                <button
                    onClick={() => {
                        setEditingIntegration(null);
                        setFormData({
                            name: '',
                            type: activeTab === 'erp' ? 'SGP' : 'ISP_FLASH',
                            url: '', token: '', app: '', active: true
                        });
                        setShowModal(true);
                    }}
                    className="btn-base btn-new"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <Plus size={20} /> Nova Integração
                </button>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '1px solid #eee' }}>
                <button
                    onClick={() => setActiveTab('erp')}
                    style={{
                        padding: '12px 24px',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'erp' ? `2px solid ${currentTheme.primary}` : '2px solid transparent',
                        color: activeTab === 'erp' ? currentTheme.primary : '#666',
                        fontWeight: activeTab === 'erp' ? 'bold' : 'normal',
                        cursor: 'pointer',
                        fontSize: '15px'
                    }}
                >
                    Integrações ERP (Sistemas)
                </button>
                <button
                    onClick={() => setActiveTab('banking')}
                    style={{
                        padding: '12px 24px',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'banking' ? `2px solid ${currentTheme.primary}` : '2px solid transparent',
                        color: activeTab === 'banking' ? currentTheme.primary : '#666',
                        fontWeight: activeTab === 'banking' ? 'bold' : 'normal',
                        cursor: 'pointer',
                        fontSize: '15px'
                    }}
                >
                    Integrações Bancárias
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '48px' }}>Carregando...</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                    {filteredIntegrations.map(integ => (
                        <div key={integ.id} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #eee', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <div style={{ backgroundColor: integ.active ? `${currentTheme.primary}15` : '#f3f4f6', padding: '10px', borderRadius: '10px' }}>
                                        <Database size={24} color={integ.active ? currentTheme.primary : '#999'} />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '18px' }}>{integ.name}</h3>
                                        <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold', backgroundColor: '#eef2ff', color: '#4f46e5', padding: '2px 6px', borderRadius: '4px' }}>
                                            {integ.type}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {['SGP', 'IXC', 'MK_AUTH'].includes(integ.type) && (
                                        <button
                                            onClick={() => handleSync(integ)}
                                            disabled={syncing[integ.id]}
                                            title="Sincronizar Contratos"
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                cursor: syncing[integ.id] ? 'not-allowed' : 'pointer',
                                                color: '#3b82f6',
                                                animation: syncing[integ.id] ? 'spin 1s linear infinite' : 'none'
                                            }}
                                        >
                                            <RefreshCcw size={20} />
                                        </button>
                                    )}
                                    <button onClick={() => toggleStatus(integ)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: integ.active ? '#10b981' : '#999' }}>
                                        {integ.active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                                    </button>
                                    <button onClick={() => handleEdit(integ)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>
                                        <Edit2 size={20} />
                                    </button>
                                    <button onClick={() => handleDelete(integ)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>

                            <div style={{ marginTop: '20px', fontSize: '13px', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                                    <ExternalLink size={14} /> {integ.url || 'Sem URL configurada'}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <ShieldCheck size={14} /> Token: {integ.token ? '••••••••' : 'Não definido'}
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredIntegrations.length === 0 && (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '64px', backgroundColor: '#f9fafb', borderRadius: '16px', border: '2px dashed #eee' }}>
                            <Database size={48} color="#ccc" style={{ marginBottom: '16px' }} />
                            <p style={{ color: '#999' }}>Nenhuma integração configurada nesta seção.</p>
                        </div>
                    )}
                </div>
            )}

            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px', width: '500px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                        <h2 style={{ margin: '0 0 24px 0' }}>{editingIntegration ? 'Editar Integração' : 'Nova Integração'}</h2>
                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>Nome da Integração</label>
                                <input
                                    className="form-input"
                                    placeholder="Ex: Minha Integração"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>Tipo</label>
                                <select
                                    className="form-input"
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    disabled={!!editingIntegration} // Prevent changing type on edit to avoid issues
                                >
                                    {getAvailableTypes().map(t => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>URL Base (ou Endpoint)</label>
                                <input
                                    className="form-input"
                                    placeholder="https://api.sistema.com.br"
                                    value={formData.url}
                                    onChange={e => setFormData({ ...formData, url: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>Token / Key</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            className="form-input"
                                            type={showToken ? "text" : "password"}
                                            placeholder="••••••••"
                                            value={formData.token}
                                            onChange={e => setFormData({ ...formData, token: e.target.value })}
                                            style={{ paddingRight: '40px' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowToken(!showToken)}
                                            style={{
                                                position: 'absolute',
                                                right: '10px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                color: '#666',
                                                display: 'flex',
                                                alignItems: 'center'
                                            }}
                                        >
                                            {showToken ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>App ID (se houver)</label>
                                    <input
                                        className="form-input"
                                        placeholder="MinhaAppFlow"
                                        value={formData.app}
                                        onChange={e => setFormData({ ...formData, app: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                                <button type="button" onClick={() => setShowModal(false)} className="btn-base" style={{ flex: 1, backgroundColor: '#f3f4f6', color: '#374151' }}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-base btn-new" style={{ flex: 1 }}>
                                    Salvar Integração
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <AlertToast
                open={toast.open}
                title={toast.title}
                message={toast.message}
                variant={toast.variant}
                onClose={() => setToast({ ...toast, open: false })}
            />
            {/* Modal de Confirmação de Sync */}
            <Modal
                isOpen={showSyncModal}
                onClose={() => setShowSyncModal(false)}
                title="Confirmar Sincronização"
                size="md"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', color: currentTheme.textPrimary }}>
                        <div style={{ backgroundColor: '#eff6ff', padding: '12px', borderRadius: '50%' }}>
                            <RefreshCcw size={28} color="#0070E0" />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 8px 0' }}>Iniciar Sincronização?</h3>
                            <p style={{ margin: 0, lineHeight: '1.5' }}>
                                Deseja sincronizar todos os contratos ativos da integração <strong>{syncTarget?.name}</strong>?
                            </p>
                            <p style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
                                Isso pode levar alguns minutos dependendo da quantidade de dados. O processo continuará em segundo plano.
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px', paddingTop: '16px', borderTop: `1px solid ${currentTheme.borderLight || '#eee'}` }}>
                        <button
                            className="btn-base"
                            style={{ backgroundColor: 'transparent', color: currentTheme.textSecondary || '#666', border: `1px solid ${currentTheme.borderLight || '#ddd'}` }}
                            onClick={() => setShowSyncModal(false)}
                        >
                            Cancelar
                        </button>
                        <button
                            className="btn-base btn-new"
                            onClick={confirmSync}
                        >
                            <RefreshCcw size={18} />
                            Confirmar Sincronização
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Modal de Confirmação de Exclusão */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Confirmar Exclusão"
                size="md"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', color: currentTheme.textPrimary }}>
                        <div style={{ backgroundColor: '#fee2e2', padding: '12px', borderRadius: '50%' }}>
                            <Trash2 size={28} color="#dc2626" />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 8px 0' }}>Excluir Integração?</h3>
                            <p style={{ margin: 0, lineHeight: '1.5' }}>
                                Tem certeza que deseja excluir a integração <strong>{deleteTarget?.name}</strong>?
                            </p>
                            <p style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
                                Esta ação não pode ser desfeita e pode afetar bots vinculados.
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px', paddingTop: '16px', borderTop: `1px solid ${currentTheme.borderLight || '#eee'}` }}>
                        <button
                            className="btn-base"
                            style={{ backgroundColor: 'transparent', color: currentTheme.textSecondary || '#666', border: `1px solid ${currentTheme.borderLight || '#ddd'}` }}
                            onClick={() => setShowDeleteModal(false)}
                        >
                            Cancelar
                        </button>
                        <button
                            className="btn-base btn-new-red"
                            onClick={confirmDelete}
                        >
                            <Trash2 size={18} />
                            Excluir Integração
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Integracoes;
