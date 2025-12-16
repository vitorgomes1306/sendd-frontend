import React, { useState, useEffect, useRef } from 'react';
import { Smartphone, Plus, Search, Filter, Edit, Trash2, Eye, Check, AlertCircle, Wifi, WifiOff, QrCode, RefreshCw } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

const Canais = () => {
  const { currentTheme } = useTheme();
  const { user } = useAuth();
  
  // Obter estilos com o tema atual
  const styles = getStyles(currentTheme);

  // Estados do componente
  const [instances, setInstances] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add', 'edit', 'view'
  const [selectedInstance, setSelectedInstance] = useState(null);
  const [deleteInstanceData, setDeleteInstanceData] = useState({ id: null, name: '' });
  const [qrCodeData, setQrCodeData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Estados para polling de status
  const [isPolling, setIsPolling] = useState(false);
  const [pollingInstanceId, setPollingInstanceId] = useState(null);
  const pollingIntervalRef = useRef(null);
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    instanceName: '',
    tipo: 'WHATSAPP_WEB',
    organizationId: '',
    atendimento: false,
    notificacoes: false
  });

  // Estados das estatísticas
  const [stats, setStats] = useState({
    total: 0,
    connected: 0,
    disconnected: 0,
    created: 0
  });

  // Carregar dados ao montar o componente
  useEffect(() => {
    loadOrganizations();
    loadInstances();
  }, []);

  // Limpar polling ao desmontar componente
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Atualizar estatísticas quando instâncias mudarem
  useEffect(() => {
    updateStats();
  }, [instances]);

  // Função para carregar organizações
  const loadOrganizations = async () => {
    try {
      const orgResponse = await apiService.get('/private/organizations');
      const orgs = Array.isArray(orgResponse.data)
        ? orgResponse.data
        : (orgResponse.data?.data ?? []);
      setOrganizations(orgs);
    } catch (error) {
      console.error('Erro ao carregar organizações:', error);
      setOrganizations([]);
    }
  };

  // Função para carregar instâncias
  const loadInstances = async () => {
    setLoading(true);
    setError('');
    try {
      // Buscar instâncias de todas as organizações do usuário
      const orgResponse = await apiService.get('/private/organizations');
      const orgs = orgResponse.data;
      let allInstances = [];

      // Para cada organização, buscar suas instâncias
      for (const org of orgs) {
        try {
          const instanceResponse = await apiService.get(`/private/organizations/${org.id}/instances`);
          const orgInstances = instanceResponse.data.instances || []; // Acessar a propriedade instances
          
          // Adicionar informação da organização a cada instância
          const instancesWithOrg = orgInstances.map(instance => ({
            ...instance,
            organizationName: org.razaoSocial || org.nomeFantasia
          }));
          allInstances = [...allInstances, ...instancesWithOrg];
        } catch (error) {
          console.error(`Erro ao carregar instâncias da organização ${org.id}:`, error);
        }
      }

      setInstances(allInstances);
    } catch (error) {
      console.error('Erro ao carregar instâncias:', error);
      setError('Erro ao carregar instâncias. Verifique sua conexão.');
      setInstances([]);
    } finally {
      setLoading(false);
    }
  };

  // Função para atualizar estatísticas
  const updateStats = () => {
    const total = instances.length;
    const connected = instances.filter(instance => instance.status === 'connected').length;
    const disconnected = instances.filter(instance => instance.status === 'disconnected').length;
    const created = instances.filter(instance => instance.status === 'created').length;

    setStats({ total, connected, disconnected, created });
  };

  // Função para filtrar instâncias
  const filteredInstances = instances.filter(instance => {
    const matchesSearch = instance.instanceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (instance.number && instance.number.includes(searchTerm)) ||
                         (instance.organizationName && instance.organizationName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterStatus === 'all' || instance.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  // Função para abrir modal
  const openModal = (mode, instance = null) => {
    setModalMode(mode);
    setSelectedInstance(instance);
    
    if (mode === 'add') {
      setFormData({
        instanceName: '',
        tipo: 'WHATSAPP_WEB',
        organizationId: organizations.length > 0 ? organizations[0].id : '',
        atendimento: false,
        notificacoes: false
      });
    } else if (instance) {
      setFormData({
        instanceName: instance.instanceName || '',
        tipo: instance.tipo || 'WHATSAPP_WEB',
        organizationId: instance.organizationId || '',
        atendimento: instance.atendimento || false,
        notificacoes: instance.notificacoes || false
      });
    }
    
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  // Função para fechar modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedInstance(null);
    setError('');
    setSuccess('');
  };

  // Função para verificar status da instância
  const checkInstanceStatus = async (instanceId, organizationId) => {
    try {
      const response = await apiService.get(`/private/organizations/${organizationId}/instances/${instanceId}/status`);
      return response.data;
    } catch (error) {
      console.error('Erro ao verificar status da instância:', error);
      return null;
    }
  };

  // Função para iniciar polling de status
  const startStatusPolling = (instanceId, organizationId) => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    setIsPolling(true);
    setPollingInstanceId(instanceId);

    console.log(`Iniciando polling para instância ${instanceId}`);

    pollingIntervalRef.current = setInterval(async () => {
      const statusData = await checkInstanceStatus(instanceId, organizationId);
      
      if (statusData) {
        console.log(`🔍 Status da instância ${instanceId}:`, statusData.status);
        console.log('📊 Dados completos do status:', JSON.stringify(statusData, null, 2));
        console.log('📊 Status Evolution:', statusData.evolutionStatus);
        
        // Se a instância foi conectada (verificar apenas status mapeado)
        if (statusData.status === 'connected') {
          console.log('✅ Instância conectada! Parando polling...');
          
          // Parar polling
          stopStatusPolling();
          
          // Fechar modal do QR Code
          closeQrModal();
          
          // Mostrar mensagem de sucesso
          setSuccess('Instância conectada com sucesso!');
          
          // Recarregar lista de instâncias
          loadInstances();
        }
      } else {
        console.log('❌ Erro ao verificar status da instância');
      }
    }, 3000); // Verificar a cada 3 segundos
  };

  // Função para parar polling de status
  const stopStatusPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsPolling(false);
    setPollingInstanceId(null);
    console.log('Polling de status parado');
  };

  // Função para abrir modal de QR Code
  const openQrModal = async (instance) => {
    setSelectedInstance(instance);
    setQrCodeData(null);
    setShowQrModal(true);
    
    // Buscar QR Code da instância existente
    try {
      // Primeiro, tentar conectar a instância na Evolution API para gerar QR Code
      const evolutionApiUrl = import.meta.env.VITE_EVOLUTION_API_URL || 'http://localhost:8080';
      const evolutionApiKey = import.meta.env.VITE_EVOLUTION_API_KEY;
      
      // Fazer requisição para conectar a instância e obter QR Code
      const response = await fetch(`${evolutionApiUrl}/instance/connect/${instance.instanceName}`, {
        method: 'GET',
        headers: {
          'apikey': evolutionApiKey || 'B6D711FCDE4D4FD5936544120E713976'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Resposta da Evolution API:', data);
        
        if (data.base64) {
          setQrCodeData(data);
          
          // Iniciar polling de status após mostrar QR Code
          startStatusPolling(instance.id, instance.organizationId);
        } else {
          // Se não há QR Code, pode ser que a instância já esteja conectada
          console.log('Sem QR Code - verificando status da instância...');
          const statusData = await checkInstanceStatus(instance.id, instance.organizationId);
          
          if (statusData && statusData.status === 'connected') {
            setSuccess('Instância já está conectada!');
            closeQrModal();
          } else {
            setError('Não foi possível gerar QR Code. Tente novamente.');
          }
        }
      } else {
        console.error('Erro na Evolution API:', response.status);
        setError('Erro ao conectar com a Evolution API');
      }
    } catch (error) {
      console.error('Erro ao buscar QR Code:', error);
      setError('Erro ao gerar QR Code');
    }
  };

  // Função para fechar modal de QR Code
  const closeQrModal = () => {
    // Parar polling quando fechar modal
    stopStatusPolling();
    
    setShowQrModal(false);
    setSelectedInstance(null);
    setQrCodeData(null);
  };

  // Função para abrir modal de exclusão
  const openDeleteModal = (instance) => {
    setDeleteInstanceData({ id: instance.id, name: instance.instanceName });
    setShowDeleteModal(true);
  };

  // Função para fechar modal de exclusão
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteInstanceData({ id: null, name: '' });
  };

  // Função para lidar com mudanças no formulário
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Função para salvar instância
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      let response;
      
      if (modalMode === 'edit') {
        response = await apiService.put(`/private/organizations/${formData.organizationId}/instances/${selectedInstance.id}`, formData);
      } else {
        response = await apiService.post(`/private/organizations/${formData.organizationId}/instances`, formData);
      }

      const data = response.data;
      console.log('Resposta do backend:', data); // Debug log
      setSuccess(modalMode === 'edit' ? 'Instância atualizada com sucesso!' : 'Instância criada com sucesso!');
      
      // Se foi criada uma nova instância e tem QR Code, mostrar
      if (modalMode === 'add' && data.qrcode) {
        console.log('QR Code encontrado:', data.qrcode); // Debug log
        setQrCodeData(data.qrcode);
        setSelectedInstance(data.instance || { instanceName: formData.instanceName }); // Adicionar instância selecionada
        closeModal();
        setShowQrModal(true);
      } else {
        console.log('Sem QR Code na resposta ou não é modo add:', { modalMode, hasQrcode: !!data.qrcode }); // Debug log
        closeModal();
      }
      
      loadInstances();
    } catch (error) {
      console.error('Erro ao salvar instância:', error);
      setError(error.response?.data?.message || 'Erro ao salvar instância. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para excluir instância
  const handleDelete = async () => {
    try {
      const instance = instances.find(i => i.id === deleteInstanceData.id);
      
      await apiService.delete(`/private/organizations/${instance.organizationId}/instances/${deleteInstanceData.id}`);
      
      setSuccess('Instância excluída com sucesso!');
      loadInstances();
    } catch (error) {
      console.error('Erro ao excluir instância:', error);
      setError(error.response?.data?.message || 'Erro ao excluir instância. Tente novamente.');
    } finally {
      closeDeleteModal();
    }
  };

  // Função para formatar status
  const getStatusInfo = (status) => {
    switch (status) {
      case 'connected':
        return { label: 'Conectado', color: '#10b981', bgColor: '#d1fae5' };
      case 'disconnected':
        return { label: 'Desconectado', color: '#ef4444', bgColor: '#fee2e2' };
      case 'created':
        return { label: 'Criado', color: '#f59e0b', bgColor: '#fef3c7' };
      default:
        return { label: 'Desconhecido', color: '#6b7280', bgColor: '#f3f4f6' };
    }
  };

  return (
    <div style={styles.container}>
      {/* Cabeçalho */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            <Smartphone size={32} style={styles.titleIcon} />
            Canais WhatsApp
          </h1>
          <p style={styles.subtitle}>Gerencie suas instâncias WhatsApp</p>
        </div>
        
        <div style={styles.headerActions}>
          <div style={styles.searchContainer}>
            <Search size={20} style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Buscar instâncias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="all">Todos</option>
            <option value="connected">Conectados</option>
            <option value="disconnected">Desconectados</option>
            <option value="created">Criados</option>
          </select>
          
          <button
            onClick={() => openModal('add')}
            style={styles.addButton}
          >
            <Plus size={20} />
            Nova Instância
          </button>
        </div>
      </div>

      {/* Alertas */}
      {error && (
        <div style={{...styles.alert, ...styles.alertError}}>
          <AlertCircle size={20} />
          {error}
        </div>
      )}
      
      {success && (
        <div style={{...styles.alert, ...styles.alertSuccess}}>
          <Check size={20} />
          {success}
        </div>
      )}

      {/* Cards de Estatísticas */}
      <div style={styles.statsGrid}>
        <div style={{...styles.statsCard, borderLeft: `4px solid ${currentTheme.primary || '#3b82f6'}`}}>
          <div style={styles.statsIcon}>
            <Smartphone size={24} />
          </div>
          <div>
            <p style={styles.statsLabel}>Total de Instâncias</p>
            <p style={styles.statsValue}>{stats.total}</p>
          </div>
        </div>
        
        <div style={{...styles.statsCard, borderLeft: `4px solid #10b981`}}>
          <div style={{...styles.statsIcon, backgroundColor: '#10b98120', color: '#10b981'}}>
            <Wifi size={24} />
          </div>
          <div>
            <p style={styles.statsLabel}>Conectadas</p>
            <p style={styles.statsValue}>{stats.connected}</p>
          </div>
        </div>
        
        <div style={{...styles.statsCard, borderLeft: `4px solid #ef4444`}}>
          <div style={{...styles.statsIcon, backgroundColor: '#ef444420', color: '#ef4444'}}>
            <WifiOff size={24} />
          </div>
          <div>
            <p style={styles.statsLabel}>Desconectadas</p>
            <p style={styles.statsValue}>{stats.disconnected}</p>
          </div>
        </div>

        <div style={{...styles.statsCard, borderLeft: `4px solid #f59e0b`}}>
          <div style={{...styles.statsIcon, backgroundColor: '#f59e0b20', color: '#f59e0b'}}>
            <Plus size={24} />
          </div>
          <div>
            <p style={styles.statsLabel}>Aguardando Conexão</p>
            <p style={styles.statsValue}>{stats.created}</p>
          </div>
        </div>
      </div>

      {/* Tabela de Instâncias */}
      <div style={styles.tableCard}>
        <div style={styles.tableHeader}>
          <h2 style={styles.tableTitle}>Lista de Instâncias</h2>
          <button
            onClick={loadInstances}
            style={styles.refreshButton}
            title="Atualizar"
          >
            <RefreshCw size={16} />
          </button>
        </div>
        
        <div style={styles.tableContainer}>
          {loading ? (
            <div style={styles.loadingContainer}>
              <div style={styles.spinner}></div>
              <p>Carregando instâncias...</p>
            </div>
          ) : filteredInstances.length === 0 ? (
            <div style={styles.emptyState}>
              <Smartphone size={48} style={styles.emptyIcon} />
              <p>Nenhuma instância encontrada</p>
            </div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Nome</th>
                  <th style={styles.th}>Organização</th>
                  <th style={styles.th}>Número</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredInstances.map((instance) => {
                  const statusInfo = getStatusInfo(instance.status);
                  return (
                    <tr key={instance.id} style={styles.tr}>
                      <td style={styles.td}>{instance.instanceName}</td>
                      <td style={styles.td}>{instance.organizationName}</td>
                      <td style={styles.td}>{instance.number || 'Não conectado'}</td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.status,
                          backgroundColor: statusInfo.bgColor,
                          color: statusInfo.color
                        }}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actionButtons}>
                          <button
                            onClick={() => openQrModal(instance)}
                            style={{...styles.actionButton, ...styles.qrButton}}
                            title="QR Code"
                          >
                            <QrCode size={16} />
                          </button>
                          <button
                            onClick={() => openModal('edit', instance)}
                            style={{...styles.actionButton, ...styles.editButton}}
                            title="Editar"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => openDeleteModal(instance)}
                            style={{...styles.actionButton, ...styles.deleteButton}}
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal de Criar/Editar */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                {modalMode === 'add' ? 'Nova Instância' : 'Editar Instância'}
              </h2>
              <button onClick={closeModal} style={styles.closeButton}>
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit} style={styles.modalBody}>
              <div style={styles.formGrid}>
                 <div style={styles.formGroup}>
                   <label style={styles.label}>Nome da Instância *</label>
                   <input
                     type="text"
                     name="instanceName"
                     value={formData.instanceName}
                     onChange={handleInputChange}
                     required
                     style={styles.input}
                     placeholder="Digite o nome da instância"
                   />
                 </div>
                 
                 <div style={styles.formGroup}>
                   <label style={styles.label}>Tipo *</label>
                   <select
                     name="tipo"
                     value={formData.tipo}
                     onChange={handleInputChange}
                     required
                     style={styles.input}
                   >
                     <option value="WHATSAPP_WEB">WhatsApp Web</option>
                     <option value="META_CLOUD_API">Meta Cloud API</option>
                   </select>
                 </div>
                 
                 <div style={styles.formGroup}>
                   <label style={styles.label}>Organização *</label>
                   <select
                     name="organizationId"
                     value={formData.organizationId}
                     onChange={handleInputChange}
                     required
                     style={styles.input}
                   >
                     <option value="">Selecione uma organização</option>
                     {organizations.map((org) => (
                       <option key={org.id} value={org.id}>
                         {org.razaoSocial || org.nomeFantasia}
                       </option>
                     ))}
                   </select>
                 </div>
                 
                 <div style={styles.formGroup}>
                   <label style={styles.label}>
                     <input
                       type="checkbox"
                       name="atendimento"
                       checked={formData.atendimento}
                       onChange={handleInputChange}
                       style={{ marginRight: '8px' }}
                     />
                     Atendimento
                   </label>
                 </div>
                 
                 <div style={styles.formGroup}>
                   <label style={styles.label}>
                     <input
                       type="checkbox"
                       name="notificacoes"
                       checked={formData.notificacoes}
                       onChange={handleInputChange}
                       style={{ marginRight: '8px' }}
                     />
                     Notificações
                   </label>
                 </div>
               </div>
              
              <div style={styles.modalFooter}>
                <button
                  type="button"
                  onClick={closeModal}
                  style={styles.cancelButton}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    ...styles.submitButton,
                    ...(isSubmitting ? styles.submitButtonDisabled : {})
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <div style={styles.buttonSpinner}></div>
                      {modalMode === 'add' ? 'Criando...' : 'Salvando...'}
                    </>
                  ) : (
                    <>
                      <Check size={20} />
                      {modalMode === 'add' ? 'Criar Instância' : 'Salvar Alterações'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de QR Code */}
      {showQrModal && (
        <div style={styles.modalOverlay} onClick={closeQrModal}>
          <div style={styles.qrModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                <QrCode size={24} style={{ marginRight: '8px' }} />
                QR Code - {selectedInstance?.instanceName}
              </h2>
              <button onClick={closeQrModal} style={styles.closeButton}>
                ×
              </button>
            </div>
            
            <div style={styles.qrModalBody}>
              {qrCodeData ? (
                <div style={styles.qrContainer}>
                  <img 
                    src={typeof qrCodeData === 'object' && qrCodeData.base64 ? qrCodeData.base64 : qrCodeData} 
                    alt="QR Code WhatsApp" 
                    style={styles.qrImage}
                    onLoad={() => console.log('QR Code image loaded successfully')}
                    onError={(e) => {
                      console.error('Erro ao carregar imagem do QR Code:', e);
                      console.log('QR Code data type:', typeof qrCodeData);
                      console.log('QR Code data:', qrCodeData);
                      
                      // Verificar se é string antes de usar substring
                      if (typeof qrCodeData === 'string') {
                        console.log('QR Code data preview:', qrCodeData.substring(0, 100));
                      } else if (qrCodeData && typeof qrCodeData === 'object') {
                        console.log('QR Code object keys:', Object.keys(qrCodeData));
                        console.log('QR Code object:', JSON.stringify(qrCodeData, null, 2));
                      }
                    }}
                  />
                  <p style={styles.qrInstructions}>
                    Escaneie este QR Code com o WhatsApp para conectar a instância
                  </p>
                  
                  {/* Indicador de polling */}
                  {isPolling && (
                    <div style={styles.pollingIndicator}>
                      <div style={styles.pollingSpinner}></div>
                      <p style={styles.pollingText}>
                        Aguardando conexão... Verificando status automaticamente
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div style={styles.qrLoading}>
                  <div style={styles.spinner}></div>
                  <p>Gerando QR Code...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Exclusão */}
      {showDeleteModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.bootstrapModal}>
            <div style={styles.bootstrapModalHeader}>
              <h5 style={styles.bootstrapModalTitle}>
                <Trash2 size={20} style={{ marginRight: '8px' }} />
                Excluir Instância
              </h5>
              <button
                type="button"
                onClick={closeDeleteModal}
                style={styles.bootstrapCloseButton}
              >
                ×
              </button>
            </div>
            <div style={styles.bootstrapModalBody}>
              <p>Tem certeza que deseja excluir a instância <strong>{deleteInstanceData.name}</strong>?</p>
              <p style={styles.warningText}>Esta ação não pode ser desfeita.</p>
            </div>
            <div style={styles.bootstrapModalFooter}>
              <button
                type="button"
                onClick={closeDeleteModal}
                style={styles.bootstrapCancelButton}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                style={styles.bootstrapDeleteButton}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Função para obter estilos baseados no tema
const getStyles = (theme) => ({
  container: {
    padding: '24px',
    backgroundColor: theme.background,
    minHeight: '100vh',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
  },
  
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '32px',
    flexWrap: 'wrap',
    gap: '16px'
  },
  
  title: {
    fontSize: '32px',
    fontWeight: '700',
    color: theme.textPrimary,
    margin: '0 0 8px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  
  titleIcon: {
    color: theme.primary
  },
  
  subtitle: {
    fontSize: '16px',
    color: theme.textSecondary,
    margin: 0
  },
  
  headerActions: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  
  searchContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  
  searchIcon: {
    position: 'absolute',
    left: '12px',
    color: theme.textSecondary,
    zIndex: 1
  },
  
  searchInput: {
    padding: '12px 12px 12px 40px',
    border: `1px solid ${theme.border}`,
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: theme.cardBackground,
    color: theme.textPrimary,
    width: '300px',
    outline: 'none',
    transition: 'all 0.2s',
    '::placeholder': {
      color: theme.textSecondary
    }
  },
  
  filterSelect: {
    padding: '12px 16px',
    border: `1px solid ${theme.border}`,
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: theme.cardBackground,
    color: theme.textPrimary,
    cursor: 'pointer',
    outline: 'none'
  },
  
  addButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    backgroundColor: theme.primary,
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: theme.primaryDark || theme.primary
    }
  },
  
  refreshButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px',
    backgroundColor: 'transparent',
    color: theme.textSecondary,
    border: `1px solid ${theme.border}`,
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: theme.borderLight,
      color: theme.textPrimary
    }
  },
  
  alert: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '24px',
    fontSize: '14px',
    fontWeight: '500'
  },
  
  alertError: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    border: '1px solid #fecaca'
  },
  
  alertSuccess: {
    backgroundColor: '#d1fae5',
    color: '#059669',
    border: '1px solid #a7f3d0'
  },
  
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '32px'
  },
  
  statsCard: {
    backgroundColor: theme.cardBackground,
    padding: '24px',
    borderRadius: '12px',
    boxShadow: theme.shadow,
    border: `1px solid ${theme.border}`,
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  
  statsIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    backgroundColor: `${theme.primary}20`,
    color: theme.primary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  
  statsLabel: {
    fontSize: '14px',
    color: theme.textSecondary,
    margin: '0 0 4px 0'
  },
  
  statsValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: theme.textPrimary,
    margin: 0
  },
  
  tableCard: {
    backgroundColor: theme.cardBackground,
    borderRadius: '12px',
    boxShadow: theme.shadow,
    border: `1px solid ${theme.border}`,
    overflow: 'hidden'
  },
  
  tableHeader: {
    padding: '24px',
    borderBottom: `1px solid ${theme.border}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  
  tableTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: theme.textPrimary,
    margin: 0
  },
  
  tableContainer: {
    overflowX: 'auto'
  },
  
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  
  th: {
    padding: '16px 24px',
    textAlign: 'left',
    fontSize: '14px',
    fontWeight: '600',
    color: theme.textSecondary,
    backgroundColor: theme.background,
    borderBottom: `1px solid ${theme.border}`
  },
  
  tr: {
    borderBottom: `1px solid ${theme.border}`,
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: theme.borderLight
    }
  },
  
  td: {
    padding: '16px 24px',
    fontSize: '14px',
    color: theme.textPrimary
  },
  
  status: {
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  
  actionButtons: {
    display: 'flex',
    gap: '8px'
  },
  
  actionButton: {
    padding: '8px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  
  qrButton: {
    backgroundColor: '#3b82f620',
    color: '#3b82f6',
    ':hover': {
      backgroundColor: '#3b82f640'
    }
  },
  
  editButton: {
    backgroundColor: '#f59e0b20',
    color: '#f59e0b',
    ':hover': {
      backgroundColor: '#f59e0b40'
    }
  },
  
  deleteButton: {
    backgroundColor: '#ef444420',
    color: '#ef4444',
    ':hover': {
      backgroundColor: '#ef444440'
    }
  },
  
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '64px',
    color: theme.textSecondary
  },
  
  spinner: {
    width: '32px',
    height: '32px',
    border: `3px solid ${theme.border}`,
    borderTop: `3px solid ${theme.primary}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '16px'
  },
  
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '64px',
    color: theme.textSecondary
  },
  
  emptyIcon: {
    marginBottom: '16px',
    opacity: 0.5
  },
  
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  
  modal: {
    backgroundColor: theme.cardBackground,
    borderRadius: '12px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  },
  
  qrModal: {
    backgroundColor: theme.cardBackground,
    borderRadius: '12px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '400px',
    overflow: 'hidden'
  },
  
  modalHeader: {
    padding: '24px',
    borderBottom: `1px solid ${theme.border}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  
  modalTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: theme.textPrimary,
    margin: 0,
    display: 'flex',
    alignItems: 'center'
  },
  
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: theme.textSecondary,
    padding: '4px',
    borderRadius: '4px',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: theme.borderLight
    }
  },
  
  modalBody: {
    padding: '24px',
    flex: 1,
    overflowY: 'auto'
  },
  
  qrModalBody: {
    padding: '24px',
    textAlign: 'center'
  },
  
  qrContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px'
  },
  
  qrImage: {
    width: '256px',
    height: '256px',
    border: `2px solid ${theme.border}`,
    borderRadius: '8px'
  },
  
  qrInstructions: {
    fontSize: '14px',
    color: theme.textSecondary,
    margin: 0,
    textAlign: 'center'
  },
  
  qrLoading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    padding: '32px'
  },
  
  // Estilos para o indicador de polling
  pollingIndicator: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    backgroundColor: `${theme.primary}10`,
    borderRadius: '8px',
    border: `1px solid ${theme.primary}30`,
    marginTop: '16px'
  },
  
  pollingSpinner: {
    width: '20px',
    height: '20px',
    border: `2px solid ${theme.primary}30`,
    borderTop: `2px solid ${theme.primary}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  
  pollingText: {
    fontSize: '12px',
    color: theme.primary,
    margin: 0,
    textAlign: 'center',
    fontWeight: '500'
  },
  
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '24px'
  },
  
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: theme.textPrimary
  },
  
  input: {
    padding: '12px 16px',
    border: `1px solid ${theme.border}`,
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: theme.background,
    color: theme.textPrimary,
    outline: 'none',
    transition: 'all 0.2s',
    ':focus': {
      borderColor: theme.primary,
      boxShadow: `0 0 0 3px ${theme.primary}20`
    }
  },
  
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    paddingTop: '24px',
    borderTop: `1px solid ${theme.border}`
  },
  
  cancelButton: {
    padding: '12px 24px',
    border: `1px solid ${theme.border}`,
    backgroundColor: 'transparent',
    color: theme.textSecondary,
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: theme.borderLight
    }
  },
  
  submitButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    backgroundColor: theme.primary,
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: theme.primaryDark || theme.primary
    }
  },
  
  submitButtonDisabled: {
    backgroundColor: theme.textSecondary,
    cursor: 'not-allowed',
    ':hover': {
      backgroundColor: theme.textSecondary
    }
  },
  
  buttonSpinner: {
    width: '16px',
    height: '16px',
    border: '2px solid transparent',
    borderTop: '2px solid currentColor',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },

  // Estilos do Modal Bootstrap (para exclusão)
  bootstrapModal: {
    backgroundColor: theme.cardBackground,
    borderRadius: '8px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
    width: '100%',
    maxWidth: '500px',
    margin: '0 auto',
    overflow: 'hidden'
  },

  bootstrapModalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: `1px solid ${theme.border}`,
    backgroundColor: theme.background
  },

  bootstrapModalTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#dc3545',
    margin: 0,
    display: 'flex',
    alignItems: 'center'
  },

  bootstrapCloseButton: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: theme.textSecondary,
    padding: '4px',
    borderRadius: '4px',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: theme.borderLight
    }
  },

  bootstrapModalBody: {
    padding: '20px',
    fontSize: '14px',
    lineHeight: '1.5',
    color: theme.textPrimary
  },

  warningText: {
    color: '#dc3545',
    fontSize: '13px',
    marginTop: '8px',
    marginBottom: 0
  },

  bootstrapModalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '16px 20px',
    borderTop: `1px solid ${theme.border}`,
    backgroundColor: theme.background
  },

  bootstrapCancelButton: {
    padding: '8px 16px',
    border: `1px solid ${theme.border}`,
    backgroundColor: 'transparent',
    color: theme.textSecondary,
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: theme.borderLight
    }
  },

  bootstrapDeleteButton: {
    padding: '8px 16px',
    border: '1px solid #dc3545',
    backgroundColor: '#dc3545',
    color: 'white',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: '#c82333',
      borderColor: '#bd2130'
    }
  }
});

// Adicionar animação CSS
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default Canais;