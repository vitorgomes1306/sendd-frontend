import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, MessageSquare, DollarSign, BarChart, MapPin, Mail, Phone, Edit, Trash2, Send, X, Paperclip, Image as ImageIcon, Video, FileText, Music, Upload } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { apiService, getApiBaseUrl } from '../services/api';
import AlertToast from '../components/ui/AlertToast';

const ClientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const styles = getStyles(currentTheme);

  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('info');
  const [messages, setMessages] = useState([]); // Estado para mensagens

  // Estado para envio de mensagem
  const [showMsgModal, setShowMsgModal] = useState(false);
  const [instances, setInstances] = useState([]);
  const [msgData, setMsgData] = useState({
    instanceId: '',
    message: '',
    mediaId: null // ID da mídia selecionada ou recém-enviada
  });
  const [sending, setSending] = useState(false);

  // Estados para anexo de mídia
  const [showMediaOptions, setShowMediaOptions] = useState(false); // Menu de escolha: Upload ou Galeria
  const [showGallery, setShowGallery] = useState(false); // Modal da Galeria
  const [galleryMedias, setGalleryMedias] = useState([]); // Mídias da galeria
  const [selectedMedia, setSelectedMedia] = useState(null); // Objeto da mídia selecionada (para preview)
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadClient();
    loadInstances();
    loadMessages(); // Carregar mensagens ao montar
  }, [id]);

  const loadClient = async () => {
    try {
      setLoading(true);
      const response = await apiService.getClient(id);
      setClient(response.data);
    } catch (err) {
      console.error('Erro ao carregar cliente:', err);
      setError('Erro ao carregar dados do cliente.');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      // Como a rota de listar mensagens não filtra por cliente específico ainda (apenas por usuário criador),
      // idealmente a rota GET /notifications deveria aceitar um filtro clientId.
      // Vou assumir que o backend lista todas do usuário e filtrar aqui no front por enquanto,
      // ou melhor, implementar um filtro básico no front já que não mexi no GET do backend para filtrar por selectedClients.

      // Correção: O backend GET /notifications retorna { data: [], pagination: {} }
      const response = await apiService.getNotifications({ limit: 100 });
      const allMsgs = response.data?.data || [];

      // Filtrar mensagens onde este cliente está em selectedClients
      // Como selectedClients é array de IDs, verificamos se o ID do cliente atual está incluso.
      const clientMsgs = allMsgs.filter(msg =>
        msg.selectedClients && msg.selectedClients.includes(Number(id))
      );

      setMessages(clientMsgs);
    } catch (err) {
      console.error('Erro ao carregar mensagens:', err);
    }
  };

  const loadInstances = async () => {
    try {
      const response = await apiService.getInstances();
      // Temporariamente removendo filtro estrito de 'connected' para debug/uso
      // ou permitindo 'open' que é o status retornado pela Evolution
      const allInstances = response.data?.instances || [];

      // Filtrar instâncias que parecem estar operacionais
      // Status possíveis: 'open', 'connected', 'connecting'
      // Se não tiver status, assume que está disponível se tiver ID
      const available = allInstances.filter(i => {
        const s = (i.status || i.connectionStatus || '').toLowerCase();
        return s === 'open' || s === 'connected' || s === 'connecting' || !s;
      });

      setInstances(available.length > 0 ? available : allInstances);
    } catch (err) {
      console.error('Erro ao carregar instâncias:', err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!msgData.instanceId || !msgData.message.trim()) {
      setError('Selecione uma instância e digite uma mensagem.');
      return;
    }

    if (!client.cellphone) {
      setError('Cliente não possui número de celular cadastrado.');
      return;
    }

    setSending(true);
    setError('');

    try {
      // 1. Encontrar a instância selecionada para pegar os dados
      const selectedInstance = instances.find(i => i.id === Number(msgData.instanceId));

      if (!selectedInstance) throw new Error('Instância não encontrada');

      // 2. Preparar payload para salvar notificação manual
      const notificationData = {
        name: `Mensagem direta para ${client.name}`,
        message: msgData.message,
        recipients: [client.cellphone],
        channelId: selectedInstance.id,
        channelName: selectedInstance.name,
        selectedClients: [client.id],
        status: 'pending',
        mediaId: msgData.mediaId
      };

      // 3. Chamar API interna que vai processar o envio
      await apiService.saveNotification(notificationData);

      setSuccess('Mensagem enviada com sucesso!');
      setShowMsgModal(false);
      setMsgData({ instanceId: '', message: '', mediaId: null });
      setSelectedMedia(null);
      loadMessages(); // Recarregar mensagens após envio

    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      setError('Erro ao enviar mensagem. Tente novamente.');
    } finally {
      setSending(false);
    }
  };


  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tamanho (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Arquivo muito grande. Limite máximo de 10MB.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setSending(true); // Bloquear UI enquanto faz upload
      const response = await apiService.uploadMedia(formData);
      const media = response.data;

      setMsgData(prev => ({ ...prev, mediaId: media.id }));
      setSelectedMedia(media);
      setShowMediaOptions(false);
    } catch (err) {
      console.error('Erro no upload:', err);
      setError('Erro ao fazer upload do arquivo.');
    } finally {
      setSending(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const openGallery = async () => {
    try {
      const response = await apiService.getMedias({ limit: 50 });
      setGalleryMedias(response.data.data || []);
      setShowGallery(true);
      setShowMediaOptions(false);
    } catch (err) {
      console.error('Erro ao carregar galeria:', err);
      setError('Erro ao carregar galeria.');
    }
  };

  const selectGalleryMedia = (media) => {
    setMsgData(prev => ({ ...prev, mediaId: media.id }));
    setSelectedMedia(media);
    setShowGallery(false);
  };

  const removeMedia = () => {
    setMsgData(prev => ({ ...prev, mediaId: null }));
    setSelectedMedia(null);
  };

  const tabs = [
    { id: 'info', label: 'Informações', icon: <User size={18} /> },
    { id: 'messages', label: 'Histórico de Mensagens', icon: <MessageSquare size={18} /> },
    { id: 'finance', label: 'Financeiro', icon: <DollarSign size={18} /> },
    { id: 'funnel', label: 'Funil de Venda', icon: <BarChart size={18} /> }
  ];

  const getFileIcon = (type) => {
    switch (type) {
      case 'image': return <ImageIcon size={24} />;
      case 'video': return <Video size={24} />;
      case 'audio': return <Music size={24} />;
      case 'pdf': return <FileText size={24} />;
      default: return <File size={24} />;
    }
  };

  const getFileUrl = (path) => {
    if (!path) return '';
    const baseUrl = getApiBaseUrl().replace(/\/api$/, '');
    const normalizedPath = path.replace(/\\/g, '/');
    if (normalizedPath.startsWith('http')) return normalizedPath;
    const cleanPath = normalizedPath.startsWith('/') ? normalizedPath.substring(1) : normalizedPath;
    return `${baseUrl}/${cleanPath}`;
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingState}>Carregando cliente...</div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div style={styles.container}>
        <div style={styles.errorState}>
          <p>{error || 'Cliente não encontrado'}</p>
          <button onClick={() => navigate('/clientes')} style={styles.backButton}>
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => navigate('/clientes')} style={styles.iconButton} title="Voltar">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 style={styles.title}>{client.name}</h1>
            <p style={styles.subtitle}>{client.email}</p>
          </div>
        </div>

        <button
          onClick={() => setShowMsgModal(true)}
          style={styles.sendButton}
        >
          <Send size={18} />
          Enviar Mensagem
        </button>
      </div>

      {/* Alerts */}
      <AlertToast
        open={!!error}
        variant="danger"
        title="Erro"
        message={error}
        onClose={() => setError('')}
      />
      <AlertToast
        open={!!success}
        variant="success"
        title="Sucesso"
        message={success}
        onClose={() => setSuccess('')}
      />

      {/* Tabs */}
      <div style={styles.tabsContainer}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              ...styles.tabButton,
              ...(activeTab === tab.id ? styles.activeTab : {})
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={styles.content}>
        {activeTab === 'info' && (
          <div style={styles.infoGrid}>
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <User size={20} style={{ color: currentTheme.primary }} />
                <h2 style={styles.cardTitle}>Dados Pessoais</h2>
              </div>
              <div style={styles.cardContent}>
                <div style={styles.infoRow}>
                  <span style={styles.label}>Nome:</span>
                  <span style={styles.value}>{client.name}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.label}>Tipo:</span>
                  <span style={styles.value}>{client.type === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física'}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.label}>CPF/CNPJ:</span>
                  <span style={styles.value}>{client.cpfCnpj}</span>
                </div>
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <Phone size={20} style={{ color: currentTheme.primary }} />
                <h2 style={styles.cardTitle}>Contato</h2>
              </div>
              <div style={styles.cardContent}>
                <div style={styles.infoRow}>
                  <span style={styles.label}>Email:</span>
                  <span style={styles.value}>{client.email}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.label}>Celular:</span>
                  <span style={styles.value}>{client.cellphone}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.label}>Telefone:</span>
                  <span style={styles.value}>{client.phone || '-'}</span>
                </div>
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <MapPin size={20} style={{ color: currentTheme.primary }} />
                <h2 style={styles.cardTitle}>Endereço</h2>
              </div>
              <div style={styles.cardContent}>
                <div style={styles.infoRow}>
                  <span style={styles.label}>Logradouro:</span>
                  <span style={styles.value}>{client.address}, {client.number}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.label}>Bairro:</span>
                  <span style={styles.value}>{client.neighborhood}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.label}>Cidade/UF:</span>
                  <span style={styles.value}>{client.city} / {client.state}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.label}>CEP:</span>
                  <span style={styles.value}>{client.cep}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.label}>País:</span>
                  <span style={styles.value}>{client.country}</span>
                </div>
              </div>
            </div>
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <FileText size={20} style={{ color: currentTheme.primary }} />
                <h2 style={styles.cardTitle}>Contratos</h2>
              </div>
              <div style={styles.cardContent}>
                {!client.contracts || client.contracts.length === 0 ? (
                  <p style={{ color: currentTheme.textSecondary, fontSize: '14px' }}>Nenhum contrato vinculado.</p>
                ) : (
                  client.contracts.map((contract, index) => (
                    <div key={contract.id} style={{
                      paddingBottom: index < client.contracts.length - 1 ? '16px' : '0',
                      borderBottom: index < client.contracts.length - 1 ? `1px solid ${currentTheme.borderLight}` : 'none'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontWeight: '600', color: currentTheme.textPrimary, fontSize: '14px' }}>
                          Contrato #{contract.externalId || contract.id}
                        </span>
                        <span style={{
                          padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase',
                          backgroundColor: (contract.status || '').toLowerCase().includes('ativo') ? '#d1fae5' : '#fee2e2',
                          color: (contract.status || '').toLowerCase().includes('ativo') ? '#059669' : '#dc2626'
                        }}>
                          {contract.status || 'Desconhecido'}
                        </span>
                      </div>
                      <div style={styles.infoRow}>
                        <span style={styles.label}>Plano:</span>
                        <span style={styles.value}>{contract.plan || '-'}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'messages' && (
          <div style={styles.messagesContainer}>
            {messages.length === 0 ? (
              <div style={styles.emptyState}>
                <MessageSquare size={48} style={styles.emptyIcon} />
                <p>Nenhuma mensagem enviada para este cliente.</p>
              </div>
            ) : (
              <div style={styles.timeline}>
                {messages.map((msg) => (
                  <div key={msg.id} style={styles.timelineItem}>
                    <div style={styles.timelineIcon}>
                      <MessageSquare size={16} color="white" />
                    </div>
                    <div style={styles.timelineContent}>
                      <div style={styles.timelineHeader}>
                        <span style={styles.timelineTitle}>{msg.name}</span>
                        <span style={styles.timelineDate}>
                          {new Date(msg.dateCreated).toLocaleString()}
                        </span>
                      </div>
                      <p style={styles.timelineMessage}>{msg.message}</p>
                      <div style={styles.timelineFooter}>
                        <span style={{
                          ...styles.statusBadge,
                          backgroundColor: msg.status === 'sent' ? '#d1fae5' : msg.status === 'failed' ? '#fee2e2' : '#fef3c7',
                          color: msg.status === 'sent' ? '#059669' : msg.status === 'failed' ? '#dc2626' : '#d97706'
                        }}>
                          {msg.status === 'sent' ? 'Enviada' : msg.status === 'failed' ? 'Falhou' : 'Pendente'}
                        </span>
                        <span style={styles.channelInfo}>
                          Via: {msg.channelName}
                        </span>
                      </div>
                      {msg.imagePath && (
                        <div style={styles.timelineAttachment}>
                          <Paperclip size={14} style={{ marginRight: '4px' }} />
                          <span>{msg.imageOriginalName || 'Anexo'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'finance' && (
          <div style={styles.placeholderState}>
            <DollarSign size={48} style={{ opacity: 0.3 }} />
            <p>Módulo financeiro será implementado em breve.</p>
          </div>
        )}

        {activeTab === 'funnel' && (
          <div style={styles.placeholderState}>
            <BarChart size={48} style={{ opacity: 0.3 }} />
            <p>Funil de vendas será implementado em breve.</p>
          </div>
        )}
      </div>
      {/* Modal de Envio de Mensagem */}
      {
        showMsgModal && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>Enviar Mensagem</h2>
                <button onClick={() => setShowMsgModal(false)} style={styles.closeButton}>
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSendMessage} style={styles.modalContent}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Instância (WhatsApp) *</label>
                  <select
                    value={msgData.instanceId}
                    onChange={(e) => setMsgData({ ...msgData, instanceId: e.target.value })}
                    style={styles.input}
                    required
                  >
                    <option value="">Selecione uma instância...</option>
                    {instances.map(inst => (
                      <option key={inst.id} value={inst.id}>
                        {inst.name} ({inst.instanceName})
                      </option>
                    ))}
                  </select>
                  {instances.length === 0 && (
                    <span style={styles.helperText}>Nenhuma instância conectada disponível.</span>
                  )}
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Mensagem</label>
                  <textarea
                    value={msgData.message}
                    onChange={(e) => setMsgData({ ...msgData, message: e.target.value })}
                    style={{ ...styles.input, minHeight: '120px', resize: 'vertical' }}
                    placeholder="Digite sua mensagem..."
                  />
                </div>

                {/* Área de Anexo */}
                <div style={styles.attachmentArea}>
                  {selectedMedia ? (
                    <div style={styles.selectedMedia}>
                      <div style={styles.mediaPreview}>
                        {selectedMedia.type === 'image' ? (
                          <img src={getFileUrl(selectedMedia.path)} alt="Preview" style={styles.mediaThumb} />
                        ) : (
                          <div style={styles.mediaIcon}>{getFileIcon(selectedMedia.type)}</div>
                        )}
                        <span style={styles.mediaName}>{selectedMedia.name || selectedMedia.filename}</span>
                      </div>
                      <button type="button" onClick={removeMedia} style={styles.removeMediaBtn}>
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div style={styles.attachmentOptions}>
                      <button
                        type="button"
                        onClick={() => setShowMediaOptions(!showMediaOptions)}
                        style={styles.attachBtn}
                      >
                        <Paperclip size={18} />
                        Anexar Mídia
                      </button>

                      {showMediaOptions && (
                        <div style={styles.optionsMenu}>
                          <button type="button" onClick={() => fileInputRef.current?.click()} style={styles.optionItem}>
                            <Upload size={16} /> Upload
                          </button>
                          <button type="button" onClick={openGallery} style={styles.optionItem}>
                            <ImageIcon size={16} /> Galeria
                          </button>
                        </div>
                      )}
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                        accept="image/*,video/*,audio/*,application/pdf"
                      />
                    </div>
                  )}
                </div>

                <div style={styles.modalActions}>
                  <button
                    type="button"
                    onClick={() => setShowMsgModal(false)}
                    style={styles.cancelButton}
                    disabled={sending}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    style={styles.sendButton}
                    disabled={sending || instances.length === 0 || (!msgData.message && !selectedMedia)}
                  >
                    {sending ? 'Enviando...' : 'Enviar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }

      {/* Modal da Galeria */}
      {
        showGallery && (
          <div style={styles.modalOverlay}>
            <div style={{ ...styles.modal, maxWidth: '800px', maxHeight: '80vh' }}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>Selecionar da Galeria</h2>
                <button onClick={() => setShowGallery(false)} style={styles.closeButton}>
                  <X size={24} />
                </button>
              </div>
              <div style={{ ...styles.modalContent, overflowY: 'auto' }}>
                <div style={styles.galleryGrid}>
                  {galleryMedias.map(media => (
                    <div key={media.id} style={styles.galleryItem} onClick={() => selectGalleryMedia(media)}>
                      {media.type === 'image' ? (
                        <img src={getFileUrl(media.path)} alt={media.filename} style={styles.galleryThumb} />
                      ) : (
                        <div style={styles.galleryIcon}>{getFileIcon(media.type)}</div>
                      )}
                      <span style={styles.galleryName}>{media.name || media.filename}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

const getStyles = (theme) => ({
  container: {
    padding: '24px',
    backgroundColor: theme.background,
    minHeight: '100vh',
    fontFamily: 'Inter, sans-serif'
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px'
  },
  title: {
    fontSize: '24px', fontWeight: '700', color: theme.textPrimary, margin: 0
  },
  subtitle: {
    fontSize: '14px', color: theme.textSecondary, margin: '4px 0 0 0'
  },
  iconButton: {
    background: 'none', border: 'none', cursor: 'pointer', color: theme.textPrimary,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px',
    borderRadius: '50%', transition: 'background 0.2s',
    ':hover': { backgroundColor: theme.borderLight }
  },
  tabsContainer: {
    display: 'flex', gap: '8px', borderBottom: `1px solid ${theme.border}`, marginBottom: '24px'
  },
  tabButton: {
    display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px',
    background: 'none', border: 'none', borderBottom: '2px solid transparent',
    color: theme.textSecondary, cursor: 'pointer', fontSize: '14px', fontWeight: '500',
    transition: 'all 0.2s',
    ':hover': { color: theme.textPrimary }
  },
  activeTab: {
    color: theme.primary, borderBottomColor: theme.primary
  },
  content: {
    minHeight: '400px'
  },
  infoGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px'
  },
  card: {
    backgroundColor: theme.cardBackground, borderRadius: '12px',
    border: `1px solid ${theme.border}`, overflow: 'hidden', boxShadow: theme.shadow
  },
  cardHeader: {
    padding: '16px 20px', borderBottom: `1px solid ${theme.border}`,
    display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: theme.backgroundSecondary
  },
  cardTitle: {
    fontSize: '16px', fontWeight: '600', color: theme.textPrimary, margin: 0
  },
  cardContent: {
    padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px'
  },
  infoRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '8px 0', borderBottom: `1px solid ${theme.borderLight}`
  },
  label: {
    color: theme.textSecondary, fontSize: '13px', fontWeight: '500'
  },
  value: {
    color: theme.textPrimary, fontSize: '14px', fontWeight: '500'
  },
  loadingState: {
    display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh',
    color: theme.textSecondary
  },
  errorState: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh',
    color: '#ef4444', gap: '16px'
  },
  backButton: {
    padding: '10px 20px', backgroundColor: theme.primary, color: 'white',
    border: 'none', borderRadius: '8px', cursor: 'pointer'
  },
  sendButton: {
    display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
    backgroundColor: theme.primary, color: 'white', border: 'none', borderRadius: '8px',
    cursor: 'pointer', fontSize: '14px', fontWeight: '600', transition: 'all 0.2s',
    ':hover': { backgroundColor: theme.primaryDark || theme.primary }
  },
  modalOverlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: '20px'
  },
  modal: {
    backgroundColor: theme.cardBackground, borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', overflow: 'hidden'
  },
  modalHeader: {
    padding: '20px', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
  },
  modalTitle: {
    fontSize: '18px', fontWeight: '600', color: theme.textPrimary, margin: 0
  },
  closeButton: {
    background: 'none', border: 'none', cursor: 'pointer', color: theme.textSecondary,
    padding: '4px', borderRadius: '4px', ':hover': { backgroundColor: theme.borderLight }
  },
  modalContent: {
    padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px'
  },
  formGroup: {
    display: 'flex', flexDirection: 'column', gap: '8px'
  },
  input: {
    padding: '12px', border: `1px solid ${theme.border}`, borderRadius: '8px',
    fontSize: '14px', backgroundColor: theme.background, color: theme.textPrimary, outline: 'none',
    ':focus': { borderColor: theme.primary, boxShadow: `0 0 0 3px ${theme.primary}20` }
  },
  modalActions: {
    display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px'
  },
  cancelButton: {
    padding: '10px 20px', border: `1px solid ${theme.border}`, backgroundColor: 'transparent',
    color: theme.textSecondary, borderRadius: '8px', fontSize: '14px', fontWeight: '500',
    cursor: 'pointer', ':hover': { backgroundColor: theme.borderLight }
  },
  helperText: {
    fontSize: '12px', color: '#ef4444', marginTop: '4px'
  },
  messagesContainer: {
    display: 'flex', flexDirection: 'column', gap: '24px'
  },
  timeline: {
    display: 'flex', flexDirection: 'column', gap: '20px', paddingLeft: '20px', borderLeft: `2px solid ${theme.border}`
  },
  timelineItem: {
    display: 'flex', gap: '16px', position: 'relative'
  },
  timelineIcon: {
    width: '32px', height: '32px', borderRadius: '50%', backgroundColor: theme.primary,
    display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'absolute', left: '-37px', top: '0'
  },
  timelineContent: {
    flex: 1, backgroundColor: theme.cardBackground, borderRadius: '8px', padding: '16px',
    border: `1px solid ${theme.border}`, boxShadow: theme.shadow
  },
  timelineHeader: {
    display: 'flex', justifyContent: 'space-between', marginBottom: '8px'
  },
  timelineTitle: {
    fontWeight: '600', color: theme.textPrimary, fontSize: '14px'
  },
  timelineDate: {
    color: theme.textSecondary, fontSize: '12px'
  },
  timelineMessage: {
    color: theme.textPrimary, fontSize: '14px', whiteSpace: 'pre-wrap', marginBottom: '12px'
  },
  timelineFooter: {
    display: 'flex', alignItems: 'center', gap: '12px', borderTop: `1px solid ${theme.borderLight}`, paddingTop: '12px'
  },
  statusBadge: {
    padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase'
  },
  channelInfo: {
    color: theme.textSecondary, fontSize: '12px'
  },
  emptyState: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: '64px', color: theme.textSecondary
  },
  emptyIcon: {
    marginBottom: '16px', opacity: 0.5
  },
  timelineAttachment: {
    display: 'flex', alignItems: 'center', marginTop: '8px', padding: '8px', backgroundColor: theme.backgroundSecondary,
    borderRadius: '4px', fontSize: '12px', color: theme.textPrimary, gap: '4px'
  },
  attachmentArea: {
    marginTop: '8px'
  },
  attachBtn: {
    display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px',
    backgroundColor: 'transparent', border: `1px solid ${theme.border}`, borderRadius: '6px',
    color: theme.textSecondary, cursor: 'pointer', fontSize: '13px',
    ':hover': { backgroundColor: theme.backgroundSecondary }
  },
  attachmentOptions: {
    position: 'relative'
  },
  optionsMenu: {
    position: 'absolute', bottom: '100%', left: 0, marginBottom: '4px',
    backgroundColor: theme.cardBackground, border: `1px solid ${theme.border}`,
    borderRadius: '6px', boxShadow: theme.shadow, zIndex: 10, overflow: 'hidden',
    display: 'flex', flexDirection: 'column'
  },
  optionItem: {
    display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px',
    backgroundColor: 'transparent', border: 'none', color: theme.textPrimary,
    cursor: 'pointer', fontSize: '13px', width: '100%', textAlign: 'left',
    ':hover': { backgroundColor: theme.backgroundSecondary }
  },
  selectedMedia: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '8px', border: `1px solid ${theme.border}`, borderRadius: '6px',
    backgroundColor: theme.backgroundSecondary
  },
  mediaPreview: {
    display: 'flex', alignItems: 'center', gap: '12px'
  },
  mediaThumb: {
    width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px'
  },
  mediaIcon: {
    width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.background, borderRadius: '4px', color: theme.textSecondary
  },
  mediaName: {
    fontSize: '13px', color: theme.textPrimary, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
  },
  removeMediaBtn: {
    background: 'none', border: 'none', cursor: 'pointer', color: theme.textSecondary,
    padding: '4px', borderRadius: '50%', ':hover': { backgroundColor: theme.borderLight, color: '#ef4444' }
  },
  galleryGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '16px'
  },
  galleryItem: {
    cursor: 'pointer', border: `1px solid ${theme.border}`, borderRadius: '8px', overflow: 'hidden',
    ':hover': { borderColor: theme.primary, boxShadow: `0 0 0 2px ${theme.primary}20` }
  },
  galleryThumb: {
    width: '100%', height: '100px', objectFit: 'cover'
  },
  galleryIcon: {
    width: '100%', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.backgroundSecondary, color: theme.textSecondary
  },
  galleryName: {
    display: 'block', padding: '8px', fontSize: '11px', color: theme.textPrimary,
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center'
  }
});

export default ClientDetails;
