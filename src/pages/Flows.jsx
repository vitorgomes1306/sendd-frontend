import React, { useState, useEffect, useRef } from 'react';
import { GitBranch, Plus, Search, Edit2, Trash2, ArrowRight, BotMessageSquare, Smartphone, Clock, MessageSquare, Import, Download, Copy } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import AlertToast from '../components/ui/AlertToast';
import FlowBuilder from '../components/bot/FlowBuilder';
import { useToast } from '../contexts/ToastContext';

const Flows = () => {
    const { currentTheme } = useTheme();
    const { user } = useAuth();
    const { showToast } = useToast();
    const fileInputRef = useRef(null);

    const [flows, setFlows] = useState([]);
    // ... existing states ...
    const [organizations, setOrganizations] = useState([]);
    const [instances, setInstances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
    const [selectedFlow, setSelectedFlow] = useState(null);
    const [isBuilding, setIsBuilding] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        organizationId: '',
        botInactivityLimit: '',
        queueInactivityLimit: '',
        inactivityMessage: 'Sua conversa foi finalizada por inatividade. Retorne o contato caso precise novamente.',
        instanceIds: []
    });

    useEffect(() => {
        loadOrganizations();
    }, []);

    useEffect(() => {
        if (organizations.length > 0) {
            if (modalMode === 'add' && !formData.organizationId) {
                setFormData(prev => ({ ...prev, organizationId: organizations[0].id }));
            }
            if (formData.organizationId) {
                loadFlows(formData.organizationId);
                loadInstances(formData.organizationId);
            }
        }
    }, [organizations, formData.organizationId, modalMode]);

    // ... existing load functions ...
    const loadOrganizations = async () => {
        try {
            const response = await apiService.get('/private/organizations');
            setOrganizations(response.data);
            if (response.data.length > 0 && !formData.organizationId) {
                setFormData(prev => ({ ...prev, organizationId: response.data[0].id }));
            }
        } catch (error) {
            console.error('Erro ao carregar organizações:', error);
        }
    };

    const loadInstances = async (orgId) => {
        try {
            const response = await apiService.get(`/private/organizations/${orgId}/instances`);
            setInstances(response.data.instances || []);
        } catch (error) {
            console.error('Erro ao carregar instâncias:', error);
        }
    };

    const loadFlows = async (orgId) => {
        setLoading(true);
        try {
            const response = await apiService.get(`/private/bot-flows?organizationId=${orgId}`);
            setFlows(response.data);
        } catch (error) {
            console.error('Erro ao carregar fluxos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOrUpdateFlow = async (e) => {
        e.preventDefault();
        try {
            if (modalMode === 'add') {
                const response = await apiService.post('/private/bot-flows', formData);
                setFlows([...flows, response.data]);
                showToast({ title: 'Sucesso', message: 'Fluxo criado com sucesso!', variant: 'success' });
            } else {
                const response = await apiService.put(`/private/bot-flows/${selectedFlow.id}`, formData);
                loadFlows(formData.organizationId);
                showToast({ title: 'Sucesso', message: 'Fluxo atualizado com sucesso!', variant: 'success' });
            }
            setShowModal(false);
        } catch (error) {
            showToast({ title: 'Erro', message: `Falha ao ${modalMode === 'add' ? 'criar' : 'atualizar'} fluxo`, variant: 'error' });
        }
    };

    const handleCloneFlow = async (e, flow) => {
        e.stopPropagation();
        if (!window.confirm(`Deseja clonar o fluxo "${flow.name}"?`)) return;

        try {
            const response = await apiService.post(`/private/bot-flows/${flow.id}/clone`);
            setFlows([...flows, response.data]);
            showToast({ title: 'Sucesso', message: 'Fluxo clonado com sucesso!', variant: 'success' });
        } catch (error) {
            console.error(error);
            showToast({ title: 'Erro', message: 'Falha ao clonar fluxo', variant: 'error' });
        }
    };

    const handleDeleteFlow = async (e, flowId) => {
        e.stopPropagation();
        if (!window.confirm('Tem certeza que deseja excluir este fluxo?')) return;

        try {
            await apiService.delete(`/private/bot-flows/${flowId}`);
            setFlows(flows.filter(f => f.id !== flowId));
            showToast({ title: 'Sucesso', message: 'Fluxo excluído!', variant: 'success' });
        } catch (error) {
            showToast({ title: 'Erro', message: 'Falha ao excluir fluxo', variant: 'error' });
        }
    };

    const handleExport = async (e, flow) => {
        e.stopPropagation();
        try {
            const response = await apiService.get(`/private/bot-flows/${flow.id}/export`);
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(response.data, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", `fluxo_${flow.name.replace(/\s+/g, '_').toLowerCase()}.json`);
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
            showToast({ title: 'Exportado', message: 'Download iniciado!', variant: 'success' });
        } catch (error) {
            console.error(error);
            showToast({ title: 'Erro', message: 'Falha ao exportar fluxo', variant: 'error' });
        }
    };

    const handleImportClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const flowData = JSON.parse(event.target.result);
                // Usa a organização atual selecionada ou do form data
                const orgId = formData.organizationId || (organizations.length > 0 ? organizations[0].id : null);

                if (!orgId) {
                    showToast({ title: 'Atenção', message: 'Nenhuma organização selecionada.', variant: 'warning' });
                    return;
                }

                await apiService.post('/private/bot-flows/import', {
                    organizationId: orgId,
                    flowData
                });

                showToast({ title: 'Sucesso', message: 'Fluxo importado com sucesso!', variant: 'success' });
                loadFlows(orgId); // Recarrega a lista
            } catch (error) {
                console.error(error);
                showToast({ title: 'Erro', message: 'Arquivo inválido ou erro na importação.', variant: 'error' });
            } finally {
                // Reset input
                e.target.value = null;
            }
        };
        reader.readAsText(file);
    };

    const openCreateModal = () => {
        // ... implementation as before
        setModalMode('add');
        setFormData({
            name: '',
            organizationId: organizations.length > 0 ? organizations[0].id : '',
            botInactivityLimit: '',
            queueInactivityLimit: '',
            inactivityMessage: 'Sua conversa foi finalizada por inatividade. Retorne o contato caso precise novamente.',
            instanceIds: []
        });
        setShowModal(true);
    };

    // ... existing methods for openEditModal, toggleInstanceSelection, openBuilder ...

    // ... render methods ... 

    // Inject logic to render
    // Inside return:

    // Header button replacement:
    /*
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    style={{ display: 'none' }} 
                    accept=".json" 
                    onChange={handleFileChange} 
                />
                <button
                    onClick={handleImportClick}
                    className="btn-base btn-new-green"
                >
                    <Import size={20} /> Importar Fluxo
                </button>
    */


    const openEditModal = (e, flow) => {
        e.stopPropagation();
        setModalMode('edit');
        setSelectedFlow(flow);
        setFormData({
            name: flow.name,
            organizationId: flow.organizationId,
            botInactivityLimit: flow.botInactivityLimit || '',
            queueInactivityLimit: flow.queueInactivityLimit || '',
            inactivityMessage: flow.inactivityMessage || 'Sua conversa foi finalizada por inatividade. Retorne o contato caso precise novamente.',
            instanceIds: flow.instances?.map(inst => inst.id) || []
        });
        setShowModal(true);
    };

    const toggleInstanceSelection = (instanceId) => {
        setFormData(prev => {
            const isSelected = prev.instanceIds.includes(instanceId);
            if (isSelected) {
                return { ...prev, instanceIds: prev.instanceIds.filter(id => id !== instanceId) };
            } else {
                return { ...prev, instanceIds: [...prev.instanceIds, instanceId] };
            }
        });
    };

    const openBuilder = (flow) => {
        setSelectedFlow(flow);
        setIsBuilding(true);
    };

    if (isBuilding) {
        return <FlowBuilder flowId={selectedFlow.id} onBack={() => setIsBuilding(false)} />;
    }

    const styles = {
        container: { padding: '24px' },
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
        title: { display: 'flex', alignItems: 'center', gap: '12px', fontSize: '24px', fontWeight: 'bold' },
        grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' },
        card: {
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
            border: '1px solid #eee',
            transition: 'transform 0.2s',
            cursor: 'pointer'
        },
        cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '12px' },
        cardTitle: { fontWeight: '600', fontSize: '18px' },
        badge: { padding: '4px 8px', borderRadius: '4px', fontSize: '12px', backgroundColor: '#e0f2fe', color: '#0369a1' },
        modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
        modal: { backgroundColor: 'white', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' },
        input: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '8px', marginBottom: '16px' },
        sectionTitle: { fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#444' },
        instanceGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px', marginBottom: '16px' },
        instanceItem: {
            padding: '8px',
            borderRadius: '8px',
            border: '1px solid #eee',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: '0.2s'
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>
                        <GitBranch size={32} color={currentTheme.primary} />
                        Fluxos de Atendimento
                    </h1>
                    <p style={{ color: '#666' }}>Gerencie os menus e caminhos do seu Fluxo de Atendimento</p>
                </div>

                <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '0 20px' }}>
                    <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                        <input
                            type="text"
                            placeholder="Pesquisar fluxos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 10px 10px 40px',
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb',
                                outline: 'none',
                                fontSize: '14px'
                            }}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        accept=".json"
                        onChange={handleFileChange}
                    />
                    <button
                        onClick={handleImportClick}
                        className="btn-base btn-new-green"
                    >
                        <Import size={20} /> Importar Fluxo
                    </button>
                    <button
                        onClick={openCreateModal}
                        className="btn-base btn-new"
                    >
                        <Plus size={20} /> Novo Fluxo
                    </button>
                </div>
            </div>

            {
                loading ? (
                    <p>Carregando fluxos...</p>
                ) : flows.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px', backgroundColor: '#f9fafb', borderRadius: '12px' }}>
                        <GitBranch size={48} color="#ccc" style={{ marginBottom: '16px' }} />
                        <h3>Nenhum fluxo criado</h3>
                        <p>Crie o seu primeiro fluxo profissional para automatizar seu atendimento.</p>
                    </div>
                ) : (
                    <div style={styles.grid}>
                        {flows.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase())).map(flow => (
                            <div
                                key={flow.id}
                                style={{
                                    ...styles.card,
                                    position: 'relative',
                                    overflow: 'hidden',
                                    border: flow.active ? `1px solid ${currentTheme.primary}40` : '1px solid #eee'
                                }}
                                onClick={() => openBuilder(flow)}
                                onMouseOver={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                                onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                {/* Background Icon */}
                                <BotMessageSquare
                                    size={120}
                                    color={currentTheme.primary}
                                    style={{
                                        position: 'absolute',
                                        right: -20,
                                        bottom: -20,
                                        opacity: 0.05,
                                        transform: 'rotate(-15deg)',
                                        zIndex: 0
                                    }}
                                />

                                <div style={{ ...styles.cardHeader, position: 'relative', zIndex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{
                                            ...styles.badge,
                                            backgroundColor: flow.active ? '#dcfce7' : '#f3f4f6',
                                            color: flow.active ? '#166534' : '#6b7280'
                                        }}>
                                            {flow.active ? 'Ativo' : 'Inativo'}
                                        </span>
                                        <span style={styles.badge}>{flow.nodes?.length || 0} nós</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {/* Toggle Active Button */}
                                        <button
                                            title={flow.active ? "Desativar" : "Ativar"}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const newStatus = !flow.active;
                                                const updatedFlows = flows.map(f => f.id === flow.id ? { ...f, active: newStatus } : f);
                                                setFlows(updatedFlows);

                                                apiService.put(`/private/bot-flows/${flow.id}`, { ...flow, active: newStatus, organizationId: flow.organizationId })
                                                    .then(() => showToast({ title: 'Atualizado', message: `Fluxo ${newStatus ? 'ativado' : 'desativado'}!`, variant: 'success' }))
                                                    .catch(() => {
                                                        setFlows(flows);
                                                        showToast({ title: 'Erro', message: 'Falha ao atualizar status', variant: 'error' });
                                                    });
                                            }}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                                        >
                                            <div style={{
                                                width: '32px',
                                                height: '18px',
                                                backgroundColor: flow.active ? currentTheme.primary : '#ccc',
                                                borderRadius: '10px',
                                                position: 'relative',
                                                transition: '0.3s'
                                            }}>
                                                <div style={{
                                                    width: '14px',
                                                    height: '14px',
                                                    backgroundColor: 'white',
                                                    borderRadius: '50%',
                                                    position: 'absolute',
                                                    top: '2px',
                                                    left: flow.active ? '16px' : '2px',
                                                    transition: '0.3s'
                                                }} />
                                            </div>
                                        </button>

                                        <button
                                            title="Exportar Fluxo"
                                            onClick={(e) => handleExport(e, flow)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                                        >
                                            <Download size={16} color="#0369a1" />
                                        </button>
                                        <button
                                            title="Clonar Fluxo"
                                            onClick={(e) => handleCloneFlow(e, flow)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                                        >
                                            <Copy size={16} color="#d97706" /> {/* Amber/Orange color */}
                                        </button>
                                        <button
                                            onClick={(e) => openEditModal(e, flow)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                                        >
                                            <Edit2 size={16} color="#666" />
                                        </button>
                                        <button
                                            onClick={(e) => handleDeleteFlow(e, flow.id)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                                        >
                                            <Trash2 size={16} color="#ef4444" />
                                        </button>
                                    </div>
                                </div>

                                <h3 style={{ ...styles.cardTitle, position: 'relative', zIndex: 1 }}>{flow.name}</h3>

                                <div style={{ marginTop: '12px', fontSize: '13px', color: '#666', position: 'relative', zIndex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                        <Smartphone size={14} />
                                        {flow.instances?.length > 0
                                            ? (
                                                <span title={flow.instances.map(i => i.name).join(', ')}>
                                                    {flow.instances.length === 1 ? flow.instances[0].name : `${flow.instances.length} canais: ${flow.instances.map(i => i.name).slice(0, 2).join(', ')}${flow.instances.length > 2 ? '...' : ''}`}
                                                </span>
                                            )
                                            : 'Nenhum canal associado'}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Clock size={14} />
                                        {flow.botInactivityLimit
                                            ? `Tempo de inatividade: ${flow.botInactivityLimit} min`
                                            : 'Sem limite de inatividade'}
                                    </div>
                                </div>

                                <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '4px', color: currentTheme.primary, fontWeight: '600', position: 'relative', zIndex: 1 }}>
                                    Abrir Construtor <ArrowRight size={16} />
                                </div>
                            </div>
                        ))}
                    </div>
                )
            }

            {
                showModal && (
                    <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
                        <div style={styles.modal} onClick={e => e.stopPropagation()}>
                            <h2 style={{ marginBottom: '20px' }}>{modalMode === 'add' ? 'Novo Fluxo' : 'Configurações do Fluxo'}</h2>
                            <form onSubmit={handleCreateOrUpdateFlow}>
                                <div style={styles.sectionTitle}><MessageSquare size={16} /> Informações Básicas</div>
                                <label>Nome do Fluxo</label>
                                <input
                                    style={styles.input}
                                    placeholder="Ex: Atendimento Principal"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />

                                {modalMode === 'add' && (
                                    <>
                                        <label>Organização</label>
                                        <select
                                            style={styles.input}
                                            value={formData.organizationId}
                                            onChange={e => setFormData({ ...formData, organizationId: e.target.value })}
                                        >
                                            {organizations.map(org => (
                                                <option key={org.id} value={org.id}>{org.razaoSocial || org.nomeFantasia}</option>
                                            ))}
                                        </select>
                                    </>
                                )}

                                <div style={styles.sectionTitle}><Smartphone size={16} /> Canais (Instâncias)</div>
                                <div style={styles.instanceGrid}>
                                    {instances.map(inst => (
                                        <div
                                            key={inst.id}
                                            style={{
                                                ...styles.instanceItem,
                                                backgroundColor: formData.instanceIds.includes(inst.id) ? `${currentTheme.primary}15` : 'transparent',
                                                borderColor: formData.instanceIds.includes(inst.id) ? currentTheme.primary : '#eee'
                                            }}
                                            onClick={() => toggleInstanceSelection(inst.id)}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={formData.instanceIds.includes(inst.id)}
                                                onChange={() => { }} // Handle via parent onClick
                                                style={{ pointerEvents: 'none' }}
                                            />
                                            {inst.name}
                                        </div>
                                    ))}
                                    {instances.length === 0 && <p style={{ fontSize: '12px', color: '#999' }}>Nenhuma instância encontrada.</p>}
                                </div>

                                <div style={styles.sectionTitle}><Clock size={16} /> Limites de Inatividade</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label>Limite Inatividade Bot (min)</label>
                                        <input
                                            type="number"
                                            style={styles.input}
                                            placeholder="Ex: 15 ou vazio"
                                            value={formData.botInactivityLimit}
                                            onChange={e => setFormData({ ...formData, botInactivityLimit: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label>Limite Inatividade Fila (min)</label>
                                        <input
                                            type="number"
                                            style={styles.input}
                                            placeholder="Ex: 30 ou vazio"
                                            value={formData.queueInactivityLimit}
                                            onChange={e => setFormData({ ...formData, queueInactivityLimit: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <label>Mensagem Inatividade Atingida (Bot)</label>
                                <textarea
                                    style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }}
                                    placeholder="Ex: Sua conversa foi finalizada por inatividade..."
                                    value={formData.inactivityMessage}
                                    onChange={e => setFormData({ ...formData, inactivityMessage: e.target.value })}
                                />

                                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                                    <button type="button" onClick={() => setShowModal(false)} className="btn-base" style={{ flex: 1, backgroundColor: '#eee', color: '#333' }}>Cancelar</button>
                                    <button type="submit" className="btn-base btn-new" style={{ flex: 1 }}>{modalMode === 'add' ? 'Criar' : 'Salvar Alterações'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default Flows;
