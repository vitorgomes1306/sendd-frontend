import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Smartphone, Settings, Shield, User, Info, Wifi, WifiOff } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { apiService } from '../services/api';
import AlertToast from '../components/ui/AlertToast';
import '../App.css';

const InstanceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const styles = getStyles(currentTheme);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    loadDetails();
  }, [id]);

  const loadDetails = async () => {
    setLoading(true);
    try {
      // Primeiro precisamos descobrir a organização da instância, 
      // mas o backend pede organizationId na rota.
      // Como não temos orgId na URL (apenas id da instância),
      // vamos fazer uma busca "burra" ou assumir que o frontend passaria o orgId.
      // Melhor: Vamos buscar as organizações primeiro e procurar a instância nelas,
      // OU ajustar o backend para buscar por ID globalmente (mas a rota exige orgId).
      //
      // Workaround: Iterar organizações para achar a instância e então chamar details.
      
      const orgsRes = await apiService.get('/private/organizations');
      const orgs = Array.isArray(orgsRes.data) ? orgsRes.data : (orgsRes.data?.data || []);
      
      let foundOrgId = null;
      
      // Buscar em qual organização esta instância está
      // Isso não é performático, mas resolve sem mudar a estrutura de rotas do backend agora
      for (const org of orgs) {
          try {
              const instRes = await apiService.get(`/private/organizations/${org.id}/instances`);
              const instances = instRes.data.instances || [];
              if (instances.find(i => i.id === Number(id))) {
                  foundOrgId = org.id;
                  break;
              }
          } catch (e) { continue; }
      }

      if (!foundOrgId) {
          setError('Instância não encontrada nas suas organizações.');
          setLoading(false);
          return;
      }

      const response = await apiService.get(`/private/organizations/${foundOrgId}/instances/${id}/details`);
      setData(response.data);
    } catch (err) {
      console.error('Erro ao carregar detalhes:', err);
      setError('Erro ao carregar detalhes da instância.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingState}>Carregando detalhes...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={styles.container}>
        <div style={styles.errorState}>
          <p>{error || 'Dados não disponíveis'}</p>
          <button onClick={() => navigate('/canais')} style={styles.backButton}>
            Voltar
          </button>
        </div>
      </div>
    );
  }

  const { instance, evolution, settings } = data;
  
  // Extrair dados da Evolution
  // Evolution v2 pode ter estrutura aninhada em 'instance'
  const evoInstance = evolution?.instance || evolution || {};
  
  // Settings
  const rejectCall = settings?.reject_call || settings?.rejectCall || false;
  const msgCall = settings?.msg_call || settings?.msgCall || '';
  
  // Status
  const isConnected = instance.status === 'connected';

  // Função para formatar telefone
  const formatPhoneNumber = (jid) => {
    if (!jid) return '-';
    
    // Remove tudo que não for dígito
    const numbers = jid.replace(/\D/g, '');
    
    // Remove prefixo do país (55 para Brasil) se existir e for longo o suficiente
    // Assumindo números brasileiros padrão
    let phone = numbers;
    if (numbers.startsWith('55') && numbers.length > 10) {
      phone = numbers.substring(2);
    }
    
    // Formata celular (XX) 9XXXX-XXXX
    if (phone.length === 11) {
      return `(${phone.substring(0, 2)}) ${phone.substring(2, 3)}${phone.substring(3, 7)}-${phone.substring(7)}`;
    }
    
    // Formata fixo (XX) XXXX-XXXX
    if (phone.length === 10) {
      return `(${phone.substring(0, 2)}) ${phone.substring(2, 6)}-${phone.substring(6)}`;
    }
    
    // Retorna original se não casar com padrão
    return jid.split('@')[0];
  };

  const translateStatus = (status) => {
    if (!status) return '-';
    const s = status.toLowerCase();
    if (s === 'open') return 'Conectado';
    if (s === 'closed') return 'Desconectado';
    if (s === 'connecting') return 'Conectando';
    return status;
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate('/canais')} style={styles.iconButton} title="Voltar">
          <ArrowLeft size={24} />
        </button>
        <h1 style={styles.title}>
          Detalhes da Instância: {instance.name}
        </h1>
      </div>

      <div style={styles.grid}>
        {/* Card 1: Informações Gerais */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <Info size={20} style={{ color: currentTheme.primary }} />
            <h2 style={styles.cardTitle}>Informações Gerais</h2>
          </div>
          
          <div style={styles.cardContent}>
            <div style={styles.infoRow}>
              <span style={styles.label}>ID Instância (Evolution):</span>
              <span style={styles.value}>
                {evoInstance.instanceId || evoInstance.id || instance.instanceId || instance.instanceName}
              </span>
            </div>

            <div style={styles.infoRow}>
              <span style={styles.label}>Plataforma:</span>
              <span style={styles.value}>WhatsApp Web</span>
            </div>
            
            <div style={styles.infoRow}>
              <span style={styles.label}>Tipo:</span>
              <span style={styles.value}>{instance.tipo}</span>
            </div>

            <div style={styles.infoRow}>
              <span style={styles.label}>Nome Interno:</span>
              <span style={styles.value}>{instance.name}</span>
            </div>

            <div style={styles.infoRow}>
              <span style={styles.label}>Notificações:</span>
              <span style={styles.badge(instance.notificacoes)}>
                {instance.notificacoes ? 'Habilitado' : 'Desabilitado'}
              </span>
            </div>

            <div style={styles.divider} />

            <h3 style={styles.subTitle}>Configurações de Chamada</h3>
            
            <div style={styles.infoRow}>
              <span style={styles.label}>Rejeitar Ligações:</span>
              <span style={styles.badge(rejectCall)}>
                {rejectCall ? 'Ativado' : 'Desativado'}
              </span>
            </div>

            {rejectCall && (
                <div style={styles.infoColumn}>
                    <span style={styles.label}>Mensagem de Rejeição:</span>
                    <div style={styles.messageBox}>
                        {msgCall || 'Sem mensagem configurada'}
                    </div>
                </div>
            )}
          </div>
        </div>

        {/* Card 2: Status e Conexão */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <Wifi size={20} style={{ color: isConnected ? '#10b981' : '#ef4444' }} />
            <h2 style={styles.cardTitle}>Status e Conexão</h2>
          </div>

          <div style={styles.cardContent}>
             {/* Foto de Perfil Grande */}
             <div style={styles.profileSection}>
                {instance.profilePicUrl ? (
                    <img 
                        src={instance.profilePicUrl} 
                        alt="Profile" 
                        style={styles.bigProfilePic} 
                    />
                ) : (
                    <div style={styles.bigProfilePlaceholder}>
                        <User size={48} />
                    </div>
                )}
             </div>

             <div style={styles.infoRow}>
               <span style={styles.label}>Status:</span>
               <span style={{ 
                   ...styles.statusBadge, 
                   backgroundColor: isConnected ? '#d1fae5' : '#fee2e2',
                   color: isConnected ? '#059669' : '#dc2626'
               }}>
                 {isConnected ? 'Conectado' : 'Desconectado'}
               </span>
             </div>

             <div style={styles.infoRow}>
               <span style={styles.label}>Instancia na API:</span>
               <code style={styles.code}>{evoInstance.instanceId || instance.instanceName}</code>
             </div>

             <div style={styles.infoRow}>
               <span style={styles.label}>Nome no WhatsApp:</span>
               <span style={styles.value}>{evoInstance.profileName || '-'}</span>
             </div>

             <div style={styles.infoRow}>
               <span style={styles.label}>Número:</span>
               <code style={styles.code}>{formatPhoneNumber(evoInstance.ownerJid)}</code>
             </div>

             <div style={styles.infoRow}>
               <span style={styles.label}>Integração:</span>
               <span style={styles.value}>{evoInstance.integration || 'WHATSAPP-BAILEYS'}</span>
             </div>

             <div style={styles.infoRow}>
                <span style={styles.label}>Connection Status:</span>
                {/* Status de conexão da instância Evolution
                Pode ser 'open', 'connecting', 'closed', 'disconnected'
               Função: Mostra o status atual da conexão da instância Evolution.

               */}

                <span style={styles.value}>{translateStatus(evoInstance.connectionStatus || evoInstance.status)}</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const getStyles = (theme) => ({
  container: {
    padding: '24px',
    backgroundColor: theme.background,
    minHeight: '100vh',
    fontFamily: 'Inter, sans-serif'
  },
  loadingState: {
    display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh',
    color: theme.textSecondary, fontSize: '18px'
  },
  errorState: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh',
    color: '#ef4444', gap: '16px'
  },
  header: {
    display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px'
  },
  title: {
    fontSize: '24px', fontWeight: '700', color: theme.textPrimary, margin: 0
  },
  iconButton: {
    background: 'none', border: 'none', cursor: 'pointer', color: theme.textPrimary,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px',
    borderRadius: '50%', transition: 'background 0.2s',
    ':hover': { backgroundColor: theme.borderLight }
  },
  backButton: {
    padding: '10px 20px', backgroundColor: theme.primary, color: 'white',
    border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '24px'
  },
  card: {
    backgroundColor: theme.cardBackground,
    borderRadius: '12px',
    border: `1px solid ${theme.border}`,
    overflow: 'hidden',
    boxShadow: theme.shadow
  },
  cardHeader: {
    padding: '20px', borderBottom: `1px solid ${theme.border}`,
    display: 'flex', alignItems: 'center', gap: '12px',
    backgroundColor: theme.backgroundSecondary
  },
  cardTitle: {
    fontSize: '18px', fontWeight: '600', color: theme.textPrimary, margin: 0
  },
  cardContent: {
    padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px'
  },
  infoRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '8px 0', borderBottom: `1px solid ${theme.borderLight}`
  },
  infoColumn: {
    display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px'
  },
  label: {
    color: theme.textSecondary, fontSize: '14px', fontWeight: '500'
  },
  value: {
    color: theme.textPrimary, fontSize: '14px', fontWeight: '600'
  },
  badge: (active) => ({
    padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: '600',
    backgroundColor: active ? '#d1fae5' : '#f3f4f6',
    color: active ? '#059669' : '#6b7280'
  }),
  statusBadge: {
    padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: '600'
  },
  code: {
    fontFamily: 'monospace', fontSize: '13px', backgroundColor: theme.background,
    padding: '4px 8px', borderRadius: '4px', color: theme.textPrimary
  },
  divider: {
    height: '1px', backgroundColor: theme.border, margin: '16px 0'
  },
  subTitle: {
    fontSize: '16px', fontWeight: '600', color: theme.textPrimary, margin: '0 0 12px 0'
  },
  messageBox: {
    backgroundColor: theme.background, padding: '12px', borderRadius: '8px',
    border: `1px solid ${theme.border}`, color: theme.textPrimary, fontSize: '14px',
    fontStyle: 'italic'
  },
  profileSection: {
    display: 'flex', justifyContent: 'center', marginBottom: '20px'
  },
  bigProfilePic: {
    width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover',
    border: `4px solid ${theme.borderLight}`
  },
  bigProfilePlaceholder: {
    width: '120px', height: '120px', borderRadius: '50%',
    backgroundColor: theme.background, display: 'flex', alignItems: 'center',
    justifyContent: 'center', color: theme.textSecondary,
    border: `4px solid ${theme.borderLight}`
  }
});

export default InstanceDetails;
