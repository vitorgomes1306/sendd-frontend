import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ResponsiveContainer } from 'recharts';
import { Monitor, MonitorOff, DollarSign, Image, Video, FileText, TrendingUp, TrendingDown, AlertTriangle, Smartphone, Megaphone, Users } from 'lucide-react';

function Dash() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    devices: 0,
    panels: 0,
    medias: 0,
    campaigns: 0,
    clients: 0,
    channels: 0,
    notifications: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para modais
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [showPanelModal, setShowPanelModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  // Estados para formulários
  const [deviceFormData, setDeviceFormData] = useState({
    deviceKey: ['', '', '', '', '', ''],
    name: '',
    format: 'HORIZONTAL',
    panelId: '',
    type: 'display',
    geoLocation: '',
    sendNotification: false,
    showClientInfo: false,
    personalTextDevice: ''
  });

  const [panelFormData, setPanelFormData] = useState({
    name: '',
    description: '',
    type: 'FULL_SCREEN'
  });

  const [panels, setPanels] = useState([]);

  // Dados fictícios para os gráficos
  const [deviceStatus, setDeviceStatus] = useState([
    { name: 'Online', value: 0, color: '#10b981' },
    { name: 'Offline', value: 0, color: '#ef4444' }
  ]);

  const [financialData, setFinancialData] = useState([
    { month: 'Jan', overdue: 2500, paid: 8500 },
    { month: 'Fev', overdue: 1800, paid: 9200 },
    { month: 'Mar', overdue: 3200, paid: 7800 },
    { month: 'Abr', overdue: 2100, paid: 8900 },
    { month: 'Mai', overdue: 1500, paid: 9500 },
    { month: 'Jun', overdue: 2800, paid: 8200 }
  ]);

  const [mediaTypes, setMediaTypes] = useState([
    { name: 'Imagens', value: 0, color: '#3b82f6' },
    { name: 'Vídeos', value: 0, color: '#f59e0b' },
    { name: 'Documentos', value: 0, color: '#8b5cf6' }
  ]);

  const [recentMedias, setRecentMedias] = useState([]);

  useEffect(() => {
    fetchDashboardStats();
    fetchPanels();
  }, []);

  // Função para buscar painéis
  const fetchPanels = async () => {
    try {
      const response = await apiService.getPanels();
      setPanels(response.data || []);
    } catch (err) {
      console.error('Erro ao carregar painéis:', err);
    }
  };

  // Funções para manipular formulário de dispositivo
  const handleDeviceKeyChange = (index, value) => {
    if (value.length <= 1 && /^[A-Za-z0-9]*$/.test(value)) {
      const newKey = [...deviceFormData.deviceKey];
      newKey[index] = value.toUpperCase();
      setDeviceFormData({ ...deviceFormData, deviceKey: newKey });
      
      // Auto-focus no próximo input
      if (value && index < 5) {
        const nextInput = document.querySelector(`input[data-index="${index + 1}"]`);
        if (nextInput) nextInput.focus();
      }
    }
  };

  const resetDeviceForm = () => {
    setDeviceFormData({
      deviceKey: ['', '', '', '', '', ''],
      name: '',
      format: 'HORIZONTAL',
      panelId: '',
      type: 'display',
      geoLocation: '',
      sendNotification: false,
      showClientInfo: false,
      personalTextDevice: ''
    });
    setModalError('');
  };

  const resetPanelForm = () => {
    setPanelFormData({
      name: '',
      description: '',
      type: 'FULL_SCREEN'
    });
    setModalError('');
  };

  // Função para criar dispositivo
  const handleCreateDevice = async (e) => {
    e.preventDefault();
    
    if (!deviceFormData.name.trim()) {
      setModalError('Nome do dispositivo é obrigatório');
      return;
    }
    
    const deviceKey = deviceFormData.deviceKey.join('');
    if (deviceKey.length !== 6) {
      setModalError('Chave do dispositivo deve ter 6 dígitos');
      return;
    }
    
    if (!deviceFormData.panelId) {
      setModalError('Selecione um painel');
      return;
    }

    try {
      setIsSubmitting(true);
      setModalError('');
      
      const deviceData = {
        deviceKey,
        name: deviceFormData.name,
        format: deviceFormData.format,
        panelId: parseInt(deviceFormData.panelId),
        type: deviceFormData.type,
        geoLocation: deviceFormData.geoLocation || null,
        sendNotification: deviceFormData.sendNotification,
        showClientInfo: deviceFormData.showClientInfo,
        personalTextDevice: deviceFormData.personalTextDevice || null
      };

      await apiService.createDevice(deviceData);
      setShowDeviceModal(false);
      resetDeviceForm();
      fetchDashboardStats(); // Recarregar estatísticas
    } catch (err) {
      console.error('Erro ao criar dispositivo:', err);
      setModalError('Erro ao criar dispositivo. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para criar painel
  const handleCreatePanel = async (e) => {
    e.preventDefault();
    
    if (!panelFormData.name.trim()) {
      setModalError('Nome do painel é obrigatório');
      return;
    }

    try {
      setIsSubmitting(true);
      setModalError('');
      
      const panelData = {
        name: panelFormData.name.trim(),
        description: panelFormData.description.trim(),
        type: panelFormData.type,
        active: true
      };

      await apiService.createPanel(panelData);
      setShowPanelModal(false);
      resetPanelForm();
      fetchDashboardStats(); // Recarregar estatísticas
      fetchPanels(); // Recarregar lista de painéis
    } catch (err) {
      console.error('Erro ao criar painel:', err);
      setModalError('Erro ao criar painel. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      console.log('Iniciando carregamento das estatísticas do dashboard...');
      
      // Função auxiliar para fazer requisições com retry
      const fetchWithRetry = async (fetchFunction, name, maxRetries = 2) => {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            console.log(`Tentativa ${attempt} para ${name}...`);
            const result = await fetchFunction();
            console.log(`✓ ${name} carregado com sucesso`);
            return result;
          } catch (error) {
            console.warn(`✗ Tentativa ${attempt} falhou para ${name}:`, error.message);
            if (attempt === maxRetries) {
              console.error(`✗ Todas as tentativas falharam para ${name}`);
              return { data: [] }; // Retorna dados vazios em caso de falha
            }
            // Aguarda 1 segundo antes da próxima tentativa
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      };

      // Executa todas as requisições com retry
      const [devicesRes, panelsRes, mediasRes, campaignsRes, clientsRes] = await Promise.allSettled([
        fetchWithRetry(() => apiService.getDevices(), 'Dispositivos'),
        fetchWithRetry(() => apiService.getPanels(), 'Painéis'),
        fetchWithRetry(() => apiService.getMedias(), 'Mídias'),
        fetchWithRetry(() => apiService.getCampaigns(), 'Campanhas'),
        fetchWithRetry(() => apiService.getClients(), 'Clientes')
      ]);

      // Processa os resultados
      const devices = devicesRes.status === 'fulfilled' ? devicesRes.value.data : [];
      const panels = panelsRes.status === 'fulfilled' ? panelsRes.value.data : [];
      const medias = mediasRes.status === 'fulfilled' ? mediasRes.value.data : [];
      const campaigns = campaignsRes.status === 'fulfilled' ? campaignsRes.value.data : [];
      const clients = clientsRes.status === 'fulfilled' ? (clientsRes.value.data?.data || []) : [];

      // Log dos resultados
      console.log('Resultados finais:', {
        devices: devices.length,
        panels: panels.length,
        medias: medias.length,
        campaigns: campaigns.length,
        clients: clients.length
      });

      // Buscar total de Canais (somatório de instâncias por organização)
      let channelsTotal = 0;
      try {
        const orgResponse = await apiService.get('/private/organizations');
        const orgs = Array.isArray(orgResponse.data)
          ? orgResponse.data
          : (orgResponse.data?.data ?? []);
        for (const org of orgs) {
          try {
            const instanceResponse = await apiService.get(`/private/organizations/${org.id}/instances`);
            const orgInstances = instanceResponse.data.instances || [];
            channelsTotal += orgInstances.length;
          } catch (error) {
            console.warn(`Falha ao carregar instâncias da organização ${org.id}:`, error?.message || error);
          }
        }
      } catch (error) {
        console.warn('Falha ao carregar organizações para contar canais:', error?.message || error);
      }

      // Buscar total de Notificações via paginação
      let notificationsTotal = 0;
      try {
        const notifRes = await apiService.getNotifications({ page: 1, limit: 1 });
        notificationsTotal = notifRes?.data?.pagination?.total
          ?? (Array.isArray(notifRes?.data?.data) ? notifRes.data.data.length : 0);
      } catch (error) {
        console.warn('Falha ao carregar total de notificações:', error?.message || error);
      }

      const newStats = {
        devices: devices.length,
        panels: panels.length,
        medias: medias.length,
        campaigns: campaigns.length,
        clients: clients.length,
        channels: channelsTotal,
        notifications: notificationsTotal
      };

      setStats(newStats);

      // Calcular dispositivos online/offline baseado nos dados reais
      const onlineDevices = devices.filter(device => 
        device.status === 'Ativo' && device.statusDevice === true
      ).length;
      const offlineDevices = devices.filter(device => 
        device.status === 'Ativo' && device.statusDevice === false
      ).length;
      const inactiveDevices = devices.filter(device => 
        device.status !== 'Ativo'
      ).length;
      
      setDeviceStatus([
        { name: 'Online', value: onlineDevices, color: '#10b981' },
        { name: 'Offline', value: offlineDevices, color: '#ef4444' },
        { name: 'Inativos', value: inactiveDevices, color: '#6b7280' }
      ]);

      // Simular tipos de mídia baseado no total
      const images = Math.floor(newStats.medias * 0.6); // 60% imagens
      const videos = Math.floor(newStats.medias * 0.3); // 30% vídeos
      const documents = newStats.medias - images - videos; // resto documentos

      setMediaTypes([
        { name: 'Imagens', value: images, color: '#3b82f6' },
        { name: 'Vídeos', value: videos, color: '#f59e0b' },
        { name: 'Documentos', value: documents, color: '#8b5cf6' }
      ]);

      // Buscar mídias recentes (simulado)
      setRecentMedias([
        { id: 1, name: 'Promoção Verão 2024', type: 'image', thumbnail: '/api/placeholder/80/60' },
        { id: 2, name: 'Video Institucional', type: 'video', thumbnail: '/api/placeholder/80/60' },
        { id: 3, name: 'Banner Black Friday', type: 'image', thumbnail: '/api/placeholder/80/60' },
        { id: 4, name: 'Apresentação Q4', type: 'document', thumbnail: '/api/placeholder/80/60' }
      ]);

      setError('');
    } catch (err) {
      console.error('Erro ao carregar estatísticas do dashboard:', err);
      setError('Erro ao carregar dados do dashboard');
      // Define valores padrão em caso de erro geral
      setStats({
        devices: 0,
        panels: 0,
        medias: 0,
        campaigns: 0,
        clients: 0,
        channels: 0,
        notifications: 0
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '50vh',
        fontSize: '1.2rem',
        color: '#6b7280'
      }}>
        Carregando dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '0.5rem',
        padding: '1rem',
        color: '#dc2626',
        textAlign: 'center'
      }}>
        {error}
        <button
          onClick={fetchDashboardStats}
          style={{
            marginLeft: '1rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '0.25rem',
            cursor: 'pointer'
          }}
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box'
    }}>
      {/* Welcome Section */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        padding: '2rem',
        marginBottom: '2rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: '700',
          color: '#1f2937',
          margin: '0 0 0.5rem 0'
        }}>
          Bem-vindo ao Sendd 
        </h1>
        <p style={{
          color: '#6b7280',
          fontSize: '1.1rem',
          margin: 0
        }}>
          Gerencie seus clientes, contatos, disparos em massa, campanhas e leads de forma rápida e eficiente
        </p>
      </div>


      {/* Statistics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <a href="/canais" style={{ textDecoration: 'none' }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            padding: '1rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            borderLeft: '4px solid #3b82f6',
            cursor: 'pointer',
            position: 'relative',
            transition: 'all 0.3s ease',
            transform: 'translateX(0)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderLeftWidth = '8px';
            e.currentTarget.style.transform = 'translateX(2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderLeftWidth = '4px';
            e.currentTarget.style.transform = 'translateX(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#1f2937', fontSize: '0.9rem' }}>Canais</h3>
                <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#3b82f6', margin: 0 }}>{stats.channels}</p>
              </div>
              <Smartphone size={32} style={{ color: '#3b82f6', opacity: 0.7 }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginTop: '0.5rem', fontSize: '0.8rem', color: '#6b7280' }}>
              <TrendingUp size={16} style={{ marginRight: '0.25rem', color: '#10b981' }} />
              +12% este mês
            </div>
          </div>
        </a>

        <a href="/notificacoes/historico" style={{ textDecoration: 'none' }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            padding: '1rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            borderLeft: '4px solid #10b981',
            cursor: 'pointer',
            position: 'relative',
            transition: 'all 0.3s ease',
            transform: 'translateX(0)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderLeftWidth = '8px';
            e.currentTarget.style.transform = 'translateX(2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderLeftWidth = '4px';
            e.currentTarget.style.transform = 'translateX(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#1f2937', fontSize: '0.9rem' }}>Notificações</h3>
                <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10b981', margin: 0 }}>{stats.notifications}</p>
              </div>
              <Megaphone size={32} style={{ color: '#10b981', opacity: 0.7 }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginTop: '0.5rem', fontSize: '0.8rem', color: '#6b7280' }}>
              <TrendingUp size={16} style={{ marginRight: '0.25rem', color: '#10b981' }} />
              +8% este mês
            </div>
          </div>
        </a>

        <a href="/medias" style={{ textDecoration: 'none' }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            padding: '1rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            borderLeft: '4px solid #f59e0b',
            cursor: 'pointer',
            position: 'relative',
            transition: 'all 0.3s ease',
            transform: 'translateX(0)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderLeftWidth = '8px';
            e.currentTarget.style.transform = 'translateX(2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderLeftWidth = '4px';
            e.currentTarget.style.transform = 'translateX(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#1f2937', fontSize: '0.9rem' }}>Mídias</h3>
                <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f59e0b', margin: 0 }}>{stats.medias}</p>
              </div>
              <Image size={32} style={{ color: '#f59e0b', opacity: 0.7 }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginTop: '0.5rem', fontSize: '0.8rem', color: '#6b7280' }}>
              <TrendingUp size={16} style={{ marginRight: '0.25rem', color: '#10b981' }} />
              +25% este mês
            </div>
          </div>
        </a>

        <a href="/campaigns" style={{ textDecoration: 'none' }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            padding: '1rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            borderLeft: '4px solid #ef4444',
            cursor: 'pointer',
            position: 'relative',
            transition: 'all 0.3s ease',
            transform: 'translateX(0)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderLeftWidth = '8px';
            e.currentTarget.style.transform = 'translateX(2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderLeftWidth = '4px';
            e.currentTarget.style.transform = 'translateX(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#1f2937', fontSize: '0.9rem' }}>Campanhas</h3>
                <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#ef4444', margin: 0 }}>{stats.campaigns}</p>
              </div>
              <TrendingUp size={32} style={{ color: '#ef4444', opacity: 0.7 }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginTop: '0.5rem', fontSize: '0.8rem', color: '#6b7280' }}>
              <TrendingDown size={16} style={{ marginRight: '0.25rem', color: '#ef4444' }} />
              -3% este mês
            </div>
          </div>
        </a>

        <a href="/clients" style={{ textDecoration: 'none' }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            padding: '1rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            borderLeft: '4px solid #8b5cf6',
            cursor: 'pointer',
            position: 'relative',
            transition: 'all 0.3s ease',
            transform: 'translateX(0)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderLeftWidth = '8px';
            e.currentTarget.style.transform = 'translateX(2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderLeftWidth = '4px';
            e.currentTarget.style.transform = 'translateX(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#1f2937', fontSize: '0.9rem' }}>Clientes</h3>
                <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#8b5cf6', margin: 0 }}>{stats.clients}</p>
              </div>
              <Users size={32} style={{ color: '#8b5cf6', opacity: 0.7 }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginTop: '0.5rem', fontSize: '0.8rem', color: '#6b7280' }}>
              <TrendingUp size={16} style={{ marginRight: '0.25rem', color: '#10b981' }} />
              +15% este mês
            </div>
          </div>
        </a>

        
      </div>

      {/* Quick Actions */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        padding: '2rem',
        marginBottom: '2rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: '600',
          color: '#1f2937',
          margin: '0 0 1.5rem 0'
        }}>
          Ações Rápidas
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          <button 
            onClick={() => setShowDeviceModal(true)}
            style={{
            padding: '1rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            fontSize: '1rem',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}>
            Adicionar Dispositivo
          </button>
          <button 
            onClick={() => setShowPanelModal(true)}
            style={{
            padding: '1rem',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            fontSize: '1rem',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}>
            Criar Painel
          </button>
          <button 
            onClick={() => navigate('/medias')}
            style={{
            padding: '1rem',
            backgroundColor: '#f59e0b',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            fontSize: '1rem',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}>
            Upload de Mídia
          </button>
          <button 
            onClick={() => navigate('/campaigns')}
            style={{
            padding: '1rem',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            fontSize: '1rem',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}>
            Nova Campanha
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        padding: '2rem',
        marginBottom: '2rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: '600',
          color: '#1f2937',
          margin: '0 0 1.5rem 0'
        }}>
          Atividade Recente
        </h2>
        <div style={{ color: '#6b7280' }}>
          <p>• Dispositivo "TV Recepção" conectado há 2 horas</p>
          <p>• Nova mídia "Promoção Verão" adicionada</p>
          <p>• Campanha "Black Friday" iniciada</p>
          <p>• Painel "Lobby Principal" atualizado</p>
        </div>
      </div>

      {/* Gráficos e Analytics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '2rem',
        marginBottom: '2rem'
      }}>
        {/* Gráfico de Dispositivos Online/Offline */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          padding: '2rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
            <Monitor size={24} style={{ color: '#3b82f6', marginRight: '0.5rem' }} />
            <h3 style={{ margin: 0, color: '#1f2937', fontSize: '1.25rem', fontWeight: '600' }}>
              Status dos Dispositivos
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={deviceStatus}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {deviceStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Valores Financeiros */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          padding: '2rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
            <DollarSign size={24} style={{ color: '#ef4444', marginRight: '0.5rem' }} />
            <h3 style={{ margin: 0, color: '#1f2937', fontSize: '1.25rem', fontWeight: '600' }}>
              Valores Financeiros
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={financialData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`R$ ${value}`, '']} />
              <Legend />
              <Bar dataKey="paid" fill="#10b981" name="Pagos" />
              <Bar dataKey="overdue" fill="#ef4444" name="Atrasados" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Tipos de Mídia */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          padding: '2rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
            <Image size={24} style={{ color: '#f59e0b', marginRight: '0.5rem' }} />
            <h3 style={{ margin: 0, color: '#1f2937', fontSize: '1.25rem', fontWeight: '600' }}>
              Tipos de Mídia
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={mediaTypes}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
              >
                {mediaTypes.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Mini Cards com Mídias Recentes */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          padding: '2rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
            <Video size={24} style={{ color: '#8b5cf6', marginRight: '0.5rem' }} />
            <h3 style={{ margin: 0, color: '#1f2937', fontSize: '1.25rem', fontWeight: '600' }}>
              Mídias Recentes
            </h3>
          </div>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {recentMedias.map((media) => (
              <div key={media.id} style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0.75rem',
                backgroundColor: '#f9fafb',
                borderRadius: '0.375rem',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{
                  width: '60px',
                  height: '45px',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '0.25rem',
                  marginRight: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {media.type === 'image' && <Image size={20} color="#6b7280" />}
                  {media.type === 'video' && <Video size={20} color="#6b7280" />}
                  {media.type === 'document' && <FileText size={20} color="#6b7280" />}
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: '500', color: '#1f2937', fontSize: '0.9rem' }}>
                    {media.name}
                  </p>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '0.8rem', textTransform: 'capitalize' }}>
                    {media.type === 'image' ? 'Imagem' : media.type === 'video' ? 'Vídeo' : 'Documento'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Adicionar Dispositivo */}
      {showDeviceModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '2rem',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{ margin: 0, color: '#1f2937' }}>Novo Dispositivo</h2>
              <button
                onClick={() => {
                  setShowDeviceModal(false);
                  resetDeviceForm();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ×
              </button>
            </div>

            {modalError && (
              <div style={{
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                padding: '0.75rem',
                borderRadius: '4px',
                marginBottom: '1rem',
                fontSize: '0.875rem'
              }}>
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateDevice}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Chave do Dispositivo
                </label>
                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  marginBottom: '1rem'
                }}>
                  {deviceFormData.deviceKey.map((digit, index) => (
                    <input
                      key={index}
                      type="text"
                      data-index={index}
                      value={digit}
                      onChange={(e) => handleDeviceKeyChange(index, e.target.value)}
                      style={{
                        width: '3rem',
                        height: '3rem',
                        textAlign: 'center',
                        fontSize: '1.25rem',
                        fontWeight: 'bold',
                        border: '2px solid #d1d5db',
                        borderRadius: '4px',
                        outline: 'none'
                      }}
                      maxLength={1}
                    />
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Nome do Dispositivo *
                </label>
                <input
                  type="text"
                  value={deviceFormData.name}
                  onChange={(e) => setDeviceFormData({ ...deviceFormData, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                  placeholder="Digite o nome do dispositivo"
                  required
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Formato
                </label>
                <select
                  value={deviceFormData.format}
                  onChange={(e) => setDeviceFormData({ ...deviceFormData, format: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                >
                  <option value="HORIZONTAL">Horizontal</option>
                  <option value="VERTICAL">Vertical</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Painel *
                </label>
                <select
                  value={deviceFormData.panelId}
                  onChange={(e) => setDeviceFormData({ ...deviceFormData, panelId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                  required
                >
                  <option value="">Selecione um painel</option>
                  {panels.map(panel => (
                    <option key={panel.id} value={panel.id}>
                      {panel.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Localização Geográfica
                </label>
                <input
                  type="text"
                  value={deviceFormData.geoLocation}
                  onChange={(e) => setDeviceFormData({ ...deviceFormData, geoLocation: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                  placeholder="Ex: São Paulo, SP"
                />
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '1rem',
                marginTop: '2rem'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeviceModal(false);
                    resetDeviceForm();
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    backgroundColor: 'white',
                    color: '#374151',
                    cursor: 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: 'none',
                    borderRadius: '4px',
                    backgroundColor: isSubmitting ? '#9ca3af' : '#3b82f6',
                    color: 'white',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  {isSubmitting ? 'Criando...' : 'Criar Dispositivo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Criar Painel */}
      {showPanelModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '2rem',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{ margin: 0, color: '#1f2937' }}>Novo Painel</h2>
              <button
                onClick={() => {
                  setShowPanelModal(false);
                  resetPanelForm();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ×
              </button>
            </div>

            {modalError && (
              <div style={{
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                padding: '0.75rem',
                borderRadius: '4px',
                marginBottom: '1rem',
                fontSize: '0.875rem'
              }}>
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreatePanel}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Nome do Painel *
                </label>
                <input
                  type="text"
                  value={panelFormData.name}
                  onChange={(e) => setPanelFormData({ ...panelFormData, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                  placeholder="Digite o nome do painel"
                  required
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Descrição
                </label>
                <textarea
                  value={panelFormData.description}
                  onChange={(e) => setPanelFormData({ ...panelFormData, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                  placeholder="Descrição do painel (opcional)"
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Tipo de Painel
                </label>
                <select
                  value={panelFormData.type}
                  onChange={(e) => setPanelFormData({ ...panelFormData, type: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                >
                  <option value="FULL_SCREEN">Tela Cheia</option>
                  <option value="DIVIDED">Dividido</option>
                </select>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '1rem',
                marginTop: '2rem'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowPanelModal(false);
                    resetPanelForm();
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    backgroundColor: 'white',
                    color: '#374151',
                    cursor: 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: 'none',
                    borderRadius: '4px',
                    backgroundColor: isSubmitting ? '#9ca3af' : '#3b82f6',
                    color: 'white',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  {isSubmitting ? 'Criando...' : 'Criar Painel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dash;