import React, { useState, useEffect } from 'react';
import { ChevronLeft, Plus, Save, Trash2, ArrowRightCircle, MessageSquare, UserCheck, LogOut, GitBranch, Edit2, Database, Code, Settings, Search } from 'lucide-react';
import { apiService } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
import AlertToast from '../ui/AlertToast';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import FlowVisualizer from './FlowVisualizer';

const FlowBuilder = ({ flowId, onBack }) => {
    const { currentTheme } = useTheme();

    const [flow, setFlow] = useState(null);
    const [integrations, setIntegrations] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingNode, setEditingNode] = useState(null);
    const [toast, setToast] = useState({ open: false, title: '', message: '', variant: 'success' });
    const [activeTab, setActiveTab] = useState('list'); // 'list' | 'visual'
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null
    });
    const [searchTerm, setSearchTerm] = useState('');

    const showToast = (title, message, variant = 'success') => {
        setToast({ open: true, title, message, variant });
    };

    useEffect(() => {
        loadFlowDetails();
    }, [flowId]);

    const loadFlowDetails = async () => {
        setLoading(true);
        try {
            const response = await apiService.get(`/private/bot-flows/${flowId}`);
            setFlow(response.data);
            if (response.data?.organizationId) {
                loadIntegrations(response.data.organizationId);
                loadDepartments(response.data.organizationId);
            }
        } catch (error) {
            console.error('Erro ao carregar detalhes do fluxo:', error);
            showToast('Erro', 'Falha ao carregar fluxo', 'danger');
        } finally {
            setLoading(false);
        }
    };

    const loadIntegrations = async (orgId) => {
        try {
            const response = await apiService.get(`/private/integrations?organizationId=${orgId}`);
            setIntegrations(response.data);
        } catch (error) {
            console.error('Erro ao buscar integrações:', error);
        }
    };

    const loadDepartments = async (orgId) => {
        try {
            const response = await apiService.get(`/private/departments?organizationId=${orgId}`);
            setDepartments(response.data);
        } catch (error) {
            console.error('Erro ao buscar departamentos:', error);
        }
    };

    const handleDeleteNode = async (nodeId) => {
        setConfirmModal({
            isOpen: true,
            title: 'Excluir Nó',
            message: 'Tem certeza que deseja excluir este nó? Esta ação não pode ser desfeita.',
            onConfirm: async () => {
                try {
                    await apiService.delete(`/private/bot-flows/nodes/${nodeId}`);
                    showToast('Sucesso', 'Nó excluído com sucesso!');
                    loadFlowDetails();
                    if (editingNode?.id === nodeId) setEditingNode(null);
                } catch (error) {
                    showToast('Erro', 'Falha ao excluir nó', 'danger');
                }
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleUpdateNode = async (nodeId, data) => {
        try {
            await apiService.put(`/private/bot-flows/nodes/${nodeId}`, data);
            showToast('Sucesso', 'Nó atualizado com sucesso!');
            loadFlowDetails();
            setEditingNode(null);
        } catch (error) {
            showToast('Erro', 'Falha ao salvar nó', 'danger');
        }
    };

    const handleAddNode = async () => {
        try {
            await apiService.post('/private/bot-flows/nodes', {
                flowId,
                type: 'message',
                content: 'Nova mensagem...'
            });
            loadFlowDetails();
            showToast('Sucesso', 'Nó adicionado!');
        } catch (error) {
            showToast('Erro', 'Falha ao adicionar nó', 'danger');
        }
    };

    if (loading) return <div>Carregando flow builder...</div>;

    const styles = {
        container: { display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)', padding: '24px' },
        header: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' },
        backBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#666', display: 'flex', alignItems: 'center', gap: '4px' },
        content: { display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px', flex: 1, minHeight: 0 },
        nodeList: { overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingRight: '12px' },
        nodeCard: {
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #eee',
            padding: '16px',
            cursor: 'pointer',
            position: 'relative'
        },
        nodeType: {
            fontSize: '11px',
            textTransform: 'uppercase',
            fontWeight: 'bold',
            padding: '2px 6px',
            borderRadius: '4px',
            marginBottom: '8px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
        },
        optionItem: { display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px', backgroundColor: '#f9fafb', borderRadius: '4px', fontSize: '13px', marginTop: '4px' },
        editor: { backgroundColor: 'white', borderRadius: '12px', border: '1px solid #eee', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', overflowY: 'auto', maxHeight: '100%' },
        input: { width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' }
    };

    const getTypeStyle = (type) => {
        switch (type) {
            case 'start': return { backgroundColor: '#e0f2fe', color: '#0369a1' };
            case 'transfer': return { backgroundColor: '#fef3c7', color: '#92400e' };
            case 'finish': return { backgroundColor: '#fee2e2', color: '#991b1b' };
            case 'api': return { backgroundColor: '#f5f3ff', color: '#5b21b6' };
            case 'input': return { backgroundColor: '#ecfdf5', color: '#065f46' };
            default: return { backgroundColor: '#f3f4f6', color: '#374151' };
        }
    };

    const getNodeIcon = (type) => {
        switch (type) {
            case 'start': return <GitBranch size={14} />;
            case 'transfer': return <UserCheck size={14} />;
            case 'finish': return <LogOut size={14} />;
            case 'api': return <Database size={14} />;
            case 'input': return <Code size={14} />;
            default: return <MessageSquare size={14} />;
        }
    };

    const handleConfigChange = (field, value) => {
        setEditingNode({
            ...editingNode,
            config: {
                ...(editingNode.config || {}),
                [field]: value
            }
        });
    };

    const addMappingRow = () => {
        const currentMapping = editingNode.config?.mapping || [];
        handleConfigChange('mapping', [...currentMapping, { from: '', to: '' }]);
    };

    const removeMappingRow = (idx) => {
        const currentMapping = editingNode.config?.mapping || [];
        handleConfigChange('mapping', currentMapping.filter((_, i) => i !== idx));
    };

    // ... (keep existing imports and styles)

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <button onClick={onBack} style={styles.backBtn}>
                    <ChevronLeft size={24} /> Voltar
                </button>
                <h2 style={{ margin: 0 }}>Fluxo: {flow.name}</h2>

                {/* Tab Switcher */}
                <div style={{ display: 'flex', backgroundColor: '#f3f4f6', padding: '4px', borderRadius: '8px', marginLeft: '24px' }}>
                    <button
                        onClick={() => setActiveTab('list')}
                        style={{
                            padding: '6px 16px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: activeTab === 'list' ? 'white' : 'transparent',
                            color: activeTab === 'list' ? currentTheme.primary : '#666',
                            fontWeight: activeTab === 'list' ? 'bold' : 'normal',
                            boxShadow: activeTab === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            cursor: 'pointer',
                            transition: '0.2s'
                        }}
                    >
                        Editor em Lista
                    </button>
                    <button
                        onClick={() => setActiveTab('visual')}
                        style={{
                            padding: '6px 16px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: activeTab === 'visual' ? 'white' : 'transparent',
                            color: activeTab === 'visual' ? currentTheme.primary : '#666',
                            fontWeight: activeTab === 'visual' ? 'bold' : 'normal',
                            boxShadow: activeTab === 'visual' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            cursor: 'pointer',
                            transition: '0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <GitBranch size={16} /> Fluxograma
                    </button>
                </div>

                <button
                    onClick={handleAddNode}
                    className="btn-base btn-new"
                    style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <Plus size={18} /> Novo Nó
                </button>
            </div>

            <div style={styles.content}>
                {activeTab === 'list' ? (
                    <div style={styles.nodeList}>
                        <div style={{ position: 'relative', marginBottom: '16px' }}>
                            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                            <input
                                type="text"
                                placeholder="Buscar nó por nome ou ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 8px 8px 36px',
                                    borderRadius: '6px',
                                    border: '1px solid #e5e7eb',
                                    outline: 'none',
                                    fontSize: '14px'
                                }}
                            />
                        </div>

                        {/* Existing List Content */}
                        {flow.nodes
                            .filter(n => {
                                const term = searchTerm.toLowerCase();
                                return (n.name && n.name.toLowerCase().includes(term)) ||
                                    String(n.id).includes(term) ||
                                    (n.content && n.content.toLowerCase().includes(term));
                            })
                            .sort((a, b) => a.id - b.id)
                            .map(node => (
                                <div
                                    key={node.id}
                                    style={{
                                        ...styles.nodeCard,
                                        boxShadow: editingNode?.id === node.id ? `0 0 0 2px ${currentTheme.primary}40` : 'none',
                                        borderColor: editingNode?.id === node.id ? currentTheme.primary : '#eee'
                                    }}
                                    onClick={() => setEditingNode({ ...node })}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                        <div style={{ ...styles.nodeType, ...getTypeStyle(node.type), margin: 0 }}>
                                            {getNodeIcon(node.type)} {node.type}
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteNode(node.id);
                                            }}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: '#ef4444',
                                                cursor: 'pointer',
                                                padding: '4px',
                                                borderRadius: '4px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fee2e2'}
                                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                            title="Excluir Nó"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <h4 style={{ margin: '0 0 4px 0', fontSize: '13px' }}>
                                        {node.name ? node.name : `Nó #${node.id}`}
                                        {node.name && <span style={{ color: '#999', fontWeight: 'normal', marginLeft: '4px' }}>(#{node.id})</span>}
                                    </h4>
                                    <p style={{ margin: '8px 0', fontSize: '14px', whiteSpace: 'pre-wrap', color: '#444' }}>
                                        {node.type === 'api' ? `Chamada API: ${node.config?.url || 'Não configurado'}` : node.content}
                                    </p>

                                    {node.nextNodeId && (
                                        <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                                            → Próximo: Nó #{node.nextNodeId}
                                        </div>
                                    )}

                                    {node.options && node.options.length > 0 && (
                                        <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '8px', marginTop: '8px' }}>
                                            <span style={{ fontSize: '12px', color: '#666', fontWeight: '600' }}>Caminhos (Opções):</span>
                                            {node.options.map(opt => (
                                                <div key={opt.id} style={styles.optionItem}>
                                                    <span style={{ fontWeight: 'bold' }}>{opt.value}</span>
                                                    <span>{opt.label}</span>
                                                    <ArrowRightCircle size={14} style={{ marginLeft: 'auto', color: '#999' }} />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                    </div>
                ) : (
                    /* Visual Builder PlaceHolder */
                    <FlowVisualizer flow={flow} onNodeClick={setEditingNode} theme={currentTheme} />
                )}

                <div style={{ height: '100%' }}>
                    {editingNode ? (
                        <div style={styles.editor}>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Settings size={20} color={currentTheme.primary} />
                                Configurar: {editingNode.name || `Nó #${editingNode.id}`}
                            </h3>

                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#666' }}>Nome de Identificação</label>
                                <input
                                    className="form-input"
                                    placeholder="Ex: Menu Principal, Solicitar CPF..."
                                    value={editingNode.name || ''}
                                    onChange={e => setEditingNode({ ...editingNode, name: e.target.value })}
                                />
                                <p style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>Apenas para sua organização interna.</p>
                            </div>

                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#666' }}>Tipo da Ação</label>
                                <select
                                    className="form-input"
                                    value={editingNode.type}
                                    onChange={e => setEditingNode({ ...editingNode, type: e.target.value })}
                                >
                                    <option value="start">Início (Boas Vindas)</option>
                                    <option value="message">Mensagem Simples</option>
                                    <option value="menu">Menu (Opções Numéricas)</option>
                                    <option value="input">Capturar Resposta (Salvar dado)</option>
                                    <option value="api">Requisição API (Integração)</option>
                                    <option value="transfer">Transferir para Humano</option>
                                    <option value="finish">Encerrar Chat</option>
                                </select>
                            </div>

                            {editingNode.type !== 'api' && (
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#666' }}>Texto da Mensagem</label>
                                    <textarea
                                        className="form-input"
                                        style={{ minHeight: '80px', resize: 'vertical' }}
                                        placeholder="Olá! Como vai?"
                                        value={editingNode.content}
                                        onChange={e => setEditingNode({ ...editingNode, content: e.target.value })}
                                    />
                                    <p style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>Dica: use {'{{variavel}}'} para dados dinâmicos.</p>
                                </div>
                            )}

                            {editingNode.type === 'input' && (
                                <div style={{ backgroundColor: '#f0fdf4', padding: '12px', borderRadius: '8px' }}>
                                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#065f46' }}>Salvar resposta em:</label>
                                    <input
                                        placeholder="Ex: cpf"
                                        style={styles.input}
                                        value={editingNode.config?.variable || ''}
                                        onChange={e => handleConfigChange('variable', e.target.value)}
                                    />
                                    <p style={{ fontSize: '11px', color: '#059669', marginTop: '4px' }}>O texto digitado pelo cliente será salvo nesta variável.</p>
                                </div>
                            )}

                            {editingNode.type === 'api' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div>
                                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#666' }}>Integração Salva (Opcional)</label>
                                        <select
                                            className="form-input"
                                            value={editingNode.integrationId || ''}
                                            onChange={e => setEditingNode({ ...editingNode, integrationId: e.target.value ? Number(e.target.value) : null })}
                                        >
                                            <option value="">Configuração Manual (Genérica)</option>
                                            {integrations.map(integ => (
                                                <option key={integ.id} value={integ.id}>{integ.name} ({integ.type})</option>
                                            ))}
                                        </select>
                                    </div>

                                    {!editingNode.integrationId && (
                                        <>
                                            <div>
                                                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>URL</label>
                                                <input
                                                    placeholder="https://sua-api.com/user/{{cpf}}"
                                                    style={styles.input}
                                                    value={editingNode.config?.url || ''}
                                                    onChange={e => handleConfigChange('url', e.target.value)}
                                                />
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                                <div>
                                                    <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Método</label>
                                                    <select
                                                        className="form-input"
                                                        value={editingNode.config?.method || 'GET'}
                                                        onChange={e => handleConfigChange('method', e.target.value)}
                                                    >
                                                        <option value="GET">GET</option>
                                                        <option value="POST">POST</option>
                                                        <option value="PUT">PUT</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    <div>
                                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#666' }}>Tipo da Ação (SGP)</label>
                                        <select
                                            className="form-input"
                                            value={editingNode.config?.action || 'sync'}
                                            onChange={e => handleConfigChange('action', e.target.value)}
                                        >
                                            <option value="sync">Identificação (Sincronizar)</option>
                                            <option value="invoice">2ª Via de Fatura</option>
                                            <option value="unlock">Desbloqueio de Confiança</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                                            Mapeamento da Resposta
                                            <button type="button" onClick={addMappingRow} style={{ color: currentTheme.primary, background: 'none', border: 'none', fontSize: '11px', cursor: 'pointer' }}>+ Adicionar</button>
                                        </label>
                                        <p style={{ fontSize: '10px', color: '#999', margin: '-4px 0 8px 0' }}>Integrações fixas (como SGP) já mapeiam dados automaticamente.</p>
                                        {editingNode.config?.mapping?.map((m, idx) => (
                                            <div key={idx} style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                                                <input placeholder="Campo API (ex: data.nome)" style={{ ...styles.input, flex: 1, fontSize: '12px' }} value={m.from} onChange={e => {
                                                    const newMap = [...editingNode.config.mapping];
                                                    newMap[idx].from = e.target.value;
                                                    handleConfigChange('mapping', newMap);
                                                }} />
                                                <input placeholder="Variavel (ex: nome)" style={{ ...styles.input, flex: 1, fontSize: '12px' }} value={m.to} onChange={e => {
                                                    const newMap = [...editingNode.config.mapping];
                                                    newMap[idx].to = e.target.value;
                                                    handleConfigChange('mapping', newMap);
                                                }} />
                                                <button onClick={() => removeMappingRow(idx)} style={{ background: 'none', border: 'none', color: '#ef4444' }}><Trash2 size={12} /></button>
                                            </div>
                                        ))}
                                    </div>

                                    {editingNode.config?.action === 'invoice' && (
                                        <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#f0fdf4', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                                            <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#166534' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={editingNode.config?.preferIspFlash || false}
                                                    onChange={e => handleConfigChange('preferIspFlash', e.target.checked)}
                                                />
                                                Priorizar Link ISP Flash
                                            </label>
                                            <p style={{ fontSize: '10px', color: '#15803d', margin: '4px 0 0 22px' }}>
                                                Se houver uma integração ISP Flash ativa, o bot tentará gerar e enviar o link por ela.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {editingNode.type === 'menu' && (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#666' }}>Caminhos do Menu</label>
                                        <button
                                            type="button"
                                            onClick={() => setEditingNode({
                                                ...editingNode,
                                                options: [...(editingNode.options || []), { value: (editingNode.options?.length + 1).toString(), label: 'Nova Opção', nextNodeId: '' }]
                                            })}
                                            style={{ background: 'none', border: 'none', color: currentTheme.primary, cursor: 'pointer', fontSize: '12px' }}
                                        >
                                            + Opção
                                        </button>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {editingNode.options?.map((opt, idx) => (
                                            <div key={idx} style={{ backgroundColor: '#f9fafb', padding: '10px', borderRadius: '8px', border: '1px solid #eee' }}>
                                                <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                                                    <input style={{ ...styles.input, width: '45px' }} value={opt.value} onChange={e => {
                                                        const no = [...editingNode.options]; no[idx].value = e.target.value; setEditingNode({ ...editingNode, options: no });
                                                    }} />
                                                    <input style={{ ...styles.input, flex: 1 }} value={opt.label} onChange={e => {
                                                        const no = [...editingNode.options]; no[idx].label = e.target.value; setEditingNode({ ...editingNode, options: no });
                                                    }} />
                                                    <button onClick={() => {
                                                        const no = editingNode.options.filter((_, i) => i !== idx); setEditingNode({ ...editingNode, options: no });
                                                    }} style={{ color: '#ef4444', border: 'none', background: 'none' }}><Trash2 size={14} /></button>
                                                </div>
                                                <select
                                                    className="form-input"
                                                    style={{ margin: 0, height: '30px', fontSize: '11px' }}
                                                    value={opt.nextNodeId}
                                                    onChange={e => {
                                                        const no = [...editingNode.options]; no[idx].nextNodeId = e.target.value; setEditingNode({ ...editingNode, options: no });
                                                    }}
                                                >
                                                    <option value="">Destino?</option>
                                                    {flow.nodes.filter(n => n.id !== editingNode.id).map(n => (
                                                        <option key={n.id} value={n.id}>
                                                            {n.name ? `${n.name} (#${n.id})` : `Nó #${n.id} - ${n.type}`}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {editingNode.type === 'transfer' && (
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#666' }}>Departamento de Destino (Opcional)</label>
                                    <select
                                        className="form-input"
                                        value={editingNode.config?.departmentId || ''}
                                        onChange={e => handleConfigChange('departmentId', e.target.value ? Number(e.target.value) : null)}
                                    >
                                        <option value="">Todos (Fila Geral)</option>
                                        {departments.map(dept => (
                                            <option key={dept.id} value={dept.id}>
                                                {dept.name}
                                            </option>
                                        ))}
                                    </select>
                                    <p style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                                        Se selecionado, o chat será visível apenas para membros deste departamento.
                                    </p>
                                </div>
                            )}

                            {(editingNode.type !== 'menu' && editingNode.type !== 'transfer' && editingNode.type !== 'finish') && (
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#666' }}>Próximo Passo (Após esta ação)</label>
                                    <select
                                        className="form-input"
                                        value={editingNode.nextNodeId || ''}
                                        onChange={e => setEditingNode({ ...editingNode, nextNodeId: e.target.value ? Number(e.target.value) : null })}
                                    >
                                        <option value="">Encerrar fluxo aqui</option>
                                        {flow.nodes.filter(n => n.id !== editingNode.id).map(n => (
                                            <option key={n.id} value={n.id}>
                                                {n.name ? `${n.name} (#${n.id})` : `Nó #${n.id} - ${n.type}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <button
                                onClick={() => handleUpdateNode(editingNode.id, editingNode)}
                                className="btn-base btn-new"
                                style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', height: '44px' }}
                            >
                                <Save size={20} /> Salvar Configuração
                            </button>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '32px', color: '#999', backgroundColor: '#f9fafb', borderRadius: '12px', border: '1px dashed #ccc' }}>
                            <Edit2 size={32} style={{ marginBottom: '12px' }} />
                            <p style={{ fontSize: '14px' }}>Selecione um nó para configurar.</p>
                        </div>
                    )}
                </div>
            </div>

            <AlertToast
                open={toast.open}
                title={toast.title}
                message={toast.message}
                variant={toast.variant}
                onClose={() => setToast({ ...toast, open: false })}
            />
            {/* Modal de Confirmação Genérico */}
            <Modal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                title={confirmModal.title}
                size="sm"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <p style={{ margin: 0, color: '#4b5563', lineHeight: '1.5' }}>
                        {confirmModal.message}
                    </p>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <Button
                            variant="outline"
                            onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="danger"
                            onClick={confirmModal.onConfirm}
                        >
                            Confirmar
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default FlowBuilder;
