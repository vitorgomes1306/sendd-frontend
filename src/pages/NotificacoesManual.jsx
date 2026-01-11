import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import '../styles/buttons.css';
import '../styles/forms.css';

//
import { apiService, getApiBaseUrl } from '../services/api';
import {
  Upload,
  Image as ImageIcon,
  Video,
  FileText,
  Trash2,
  Search,
  X,
  Paperclip,
  Music,
  File,
  Send,
  History,
  Smartphone,
  Users,
  Clock,
  AlertCircle,
  Check,
  Play,
  Pause,
  Square,
  Timer,

} from 'lucide-react';
import AlertToast from '../components/ui/AlertToast';


const NotificacoesManual = () => {

  // Função para exibir Alertas toast
  const { showToast } = useToast();

  // Estado para hover do botão laranja
  const [isHover, setIsHover] = useState(false);

  const { currentTheme } = useTheme();
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  // Obter estilos com o tema atual
  const styles = getStyles(currentTheme);

  // Estados da aplicação
  const [activeTab, setActiveTab] = useState('send'); // 'send' ou 'history'
  const [instances, setInstances] = useState([]);
  const [clients, setClients] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Templates
  const [templates, setTemplates] = useState([]);

  // Estado para alertas (AlertToast)
  const [alertState, setAlertState] = useState({
    open: false,
    variant: 'info',
    title: '',
    message: ''
  });

  // Estados do formulário
  const [formData, setFormData] = useState({
    name: '',
    instanceName: '',
    recipients: '',
    selectedClients: [],
    text: '',
    delay: 1000,
    linkPreview: true,
    interval: 1 // Mantido apenas para compatibilidade visual
  });

  // Estados para anexo de mídia
  const [showMediaOptions, setShowMediaOptions] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryMedias, setGalleryMedias] = useState([]);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  // Estados da listagem
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    status: ''
  });

  // Carregar dados ao montar o componente
  useEffect(() => {
    fetchInstances();
    fetchClients();
    fetchTemplates();
  }, []);

  // Carregar histórico quando a aba mudar
  useEffect(() => {
    if (activeTab === 'history') {
      fetchNotifications();
    }
  }, [activeTab, pagination.page, filters]);

  // Helper para mostrar alertas
  const showAlert = (variant, title, message) => {
    setAlertState({
      open: true,
      variant,
      title,
      message
    });
  };

  // Buscar instâncias disponíveis
  const fetchInstances = async () => {
    setLoading(true);
    try {
      const orgResponse = await apiService.get('/private/organizations');
      const orgs = orgResponse.data;
      let allInstances = [];

      for (const org of orgs) {
        try {
          const instanceResponse = await apiService.get(`/private/organizations/${org.id}/instances`);
          const orgInstances = instanceResponse.data.instances || [];

          const instancesWithOrg = orgInstances.map(instance => ({
            ...instance,
            organizationName: org.razaoSocial || org.nomeFantasia,
            organizationId: org.id
          }));
          allInstances = [...allInstances, ...instancesWithOrg];
        } catch (error) {
          console.error(`Erro ao carregar instâncias da organização ${org.id}:`, error);
        }
      }

      const connectedInstances = allInstances.filter(instance => instance.status === 'connected');
      setInstances(connectedInstances);
    } catch (error) {
      console.error('Erro ao carregar instâncias:', error);
      showAlert('error', 'Erro', 'Erro ao carregar instâncias');
    } finally {
      setLoading(false);
    }
  };

  // Buscar clientes
  const fetchClients = async () => {
    try {
      const response = await apiService.getClients({ limit: 1000, active: true });
      setClients(response.data.data || []);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  // Buscar templates
  const fetchTemplates = async () => {
    try {
      const response = await apiService.getAllTemplates();
      setTemplates(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
    }
  };

  // Buscar histórico de notificações
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };

      const response = await apiService.getNotifications(params);
      setNotifications(response.data.data || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination?.total || 0,
        pages: response.data.pagination?.pages || 0
      }));
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
      showAlert('error', 'Erro', 'Erro ao carregar histórico de notificações');
    } finally {
      setLoading(false);
    }
  };

  // Estado para controlar o modal de clientes
  const [showClientModal, setShowClientModal] = useState(false);

  // Estado para menu de comandos (Slash Menu)
  const [slashMenu, setSlashMenu] = useState({
    isOpen: false,
    position: { top: 0, left: 0 },
    filter: '',
    activeIndex: 0
  });
  const textareaRef = useRef(null);

  // Estado para controlar visibilidade do relatório final
  const [showReport, setShowReport] = useState(false);

  // Estados para controle de envio
  const [sendingProgress, setSendingProgress] = useState({
    isActive: false,
    currentIndex: 0,
    total: 0,
    isPaused: false,
    isStopped: false
  });

  // Lista de números que falharam ou foram pulados
  const [failedNumbers, setFailedNumbers] = useState([]);
  const [successNumbers, setSuccessNumbers] = useState([]);

  // Estado para armazenar números como array de objetos
  const [phoneNumbers, setPhoneNumbers] = useState([]);
  const [phoneInput, setPhoneInput] = useState('');

  // Função para formatar um único número de telefone corretamente
  // Atualizado para remover o nono dígito conforme solicitado
  const formatSinglePhoneNumber = (number) => {
    let numbersOnly = number.replace(/\D/g, '');

    // Se tiver DDI (55), remove
    if (numbersOnly.startsWith('55') && numbersOnly.length > 11) {
      numbersOnly = numbersOnly.substring(2);
    }

    // Validar tamanho mínimo (DDD + 8 dígitos = 10)
    if (numbersOnly.length < 10) {
      return null;
    }

    const ddd = numbersOnly.substring(0, 2);
    const dddNum = parseInt(ddd);
    if (dddNum < 11 || dddNum > 99) {
      return null; // DDD inválido
    }

    // Caso 11 dígitos (DDD + 9 + 8 dígitos) -> Remove o 9
    if (numbersOnly.length === 11) {
      // Exemplo: 71 9 81885771 -> 71 81885771
      // Remove o terceiro dígito (índice 2) que seria o 9
      return ddd + numbersOnly.substring(3);
    }

    // Caso 10 dígitos (DDD + 8 dígitos) -> Mantém como está
    if (numbersOnly.length === 10) {
      return numbersOnly;
    }

    // Caso 12 dígitos (possível erro de digitação duplicando 9 ou formato incomum)
    // Tenta tratar removendo 2 dígitos se começar com 99 após DDD?
    // Mantendo lógica anterior simplificada para remover 9 extra se houver
    if (numbersOnly.length === 12) {
      const rest = numbersOnly.substring(2);
      if (rest.startsWith('99')) {
        // DDD + 99 + 8 digitos -> remove dois 9s? ou remove um?
        // Se o objetivo é 8 digitos, removemos o prefixo para sobrar 8
        return ddd + rest.substring(2);
      }
    }

    return null;
  };

  // Função para processar múltiplos números colados
  const processPhoneNumbers = (input) => {
    if (!input) return [];

    // Garantir que é string para evitar crash
    const stringInput = String(input);

    // Remove todos os caracteres não numéricos
    const numbersOnly = stringInput.replace(/\D/g, '');

    if (numbersOnly.length === 0) return [];

    const numbers = [];
    let currentNumber = '';

    // Processa cada dígito
    for (let i = 0; i < numbersOnly.length; i++) {
      currentNumber += numbersOnly[i];

      // Se chegou a 11 dígitos, é um número completo de celular com 9
      if (currentNumber.length === 11) {
        const formatted = formatSinglePhoneNumber(currentNumber);
        if (formatted) numbers.push(formatted);
        currentNumber = '';
      }
      // Se chegou a 10 dígitos
      else if (currentNumber.length === 10) {
        // Verifica se é o final da string ou se é um número fixo (começa com 2-5)
        // Se for celular (6-9), aguarda o 11º dígito (o 9) para processar no próximo loop
        // a não ser que não existam mais dígitos.
        const firstDigit = currentNumber.charAt(2);
        const isFixed = ['2', '3', '4', '5'].includes(firstDigit);
        const isEnd = i === numbersOnly.length - 1;

        if (isFixed || isEnd) {
          const formatted = formatSinglePhoneNumber(currentNumber);
          if (formatted) numbers.push(formatted);
          currentNumber = '';
        }
      }
    }

    // Processa o último número se sobrou algo válido (ex: colou número de 10 dígitos exatos)
    if (currentNumber.length >= 10) {
      const formatted = formatSinglePhoneNumber(currentNumber);
      if (formatted) numbers.push(formatted);
    }

    return numbers;
  };

  const addPhoneNumbers = (input) => {
    const newNumbers = processPhoneNumbers(input);
    const uniqueNumbers = newNumbers.filter(num =>
      !phoneNumbers.some(existing => existing.number === num)
    );

    if (uniqueNumbers.length > 0) {
      const numbersWithId = uniqueNumbers.map(num => ({
        id: Date.now() + Math.random(),
        number: num
      }));

      setPhoneNumbers(prev => [...prev, ...numbersWithId]);

      const allNumbers = [...phoneNumbers, ...numbersWithId].map(item => item.number).join(',');
      setFormData(prev => ({ ...prev, recipients: allNumbers }));
    }
  };

  const removePhoneNumber = (id) => {
    const updatedNumbers = phoneNumbers.filter(item => item.id !== id);
    setPhoneNumbers(updatedNumbers);

    const allNumbers = updatedNumbers.map(item => item.number).join(',');
    setFormData(prev => ({ ...prev, recipients: allNumbers }));
  };

  const handlePhoneInputChange = (e) => setPhoneInput(e.target.value);

  const handlePhoneInputKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (phoneInput.trim()) {
        addPhoneNumbers(phoneInput);
        setPhoneInput('');
      }
    }
  };

  const handlePhoneInputPaste = (e) => {
    setTimeout(() => {
      const pastedValue = e.target.value;
      if (pastedValue) {
        addPhoneNumbers(pastedValue);
        setPhoneInput('');
      }
    }, 0);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

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
    // Remove /api do final se existir, pois os uploads geralmente estão na raiz/uploads ou similar
    // Mas depende de como o backend serve. Se o backend serve estáticos na raiz, usamos a base sem /api
    const baseUrl = getApiBaseUrl().replace(/\/api$/, '');
    const normalizedPath = path.replace(/\\/g, '/');
    // Se o path já começar com http, retorna ele mesmo
    if (normalizedPath.startsWith('http')) return normalizedPath;
    // Garante que não tenha barra dupla
    const cleanPath = normalizedPath.startsWith('/') ? normalizedPath.substring(1) : normalizedPath;
    return `${baseUrl}/${cleanPath}`;
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showAlert('error', 'Erro', 'Arquivo muito grande. Limite máximo de 10MB.');
      return;
    }

    const formDataUpload = new FormData();
    formDataUpload.append('file', file);
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
    formDataUpload.append('name', nameWithoutExt);

    try {
      setUploadingMedia(true);
      const response = await apiService.uploadMedia(formDataUpload);
      setSelectedMedia(response.data);
      setShowMediaOptions(false);
      showAlert('success', 'Sucesso', 'Mídia enviada com sucesso!');
    } catch (err) {
      console.error('Erro no upload:', err);
      showAlert('error', 'Erro', 'Erro ao fazer upload do arquivo.');
    } finally {
      setUploadingMedia(false);
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
      showAlert('error', 'Erro', 'Erro ao carregar galeria.');
    }
  };

  const selectGalleryMedia = (media) => {
    setSelectedMedia(media);
    setShowGallery(false);
  };

  const removeMedia = () => setSelectedMedia(null);

  const handleClientSelection = (client) => {
    const formattedNumber = formatSinglePhoneNumber(client.cellphone);
    if (formattedNumber) {
      addPhoneNumbers(formattedNumber);
    }
    setShowClientModal(false);
  };

  const handleTemplateSelect = (e) => {
    const templateId = e.target.value;
    if (!templateId) return;
    const template = templates.find(t => t.id === parseInt(templateId));
    if (template) {
      setFormData(prev => ({ ...prev, text: template.content }));
    }
  };

  // Slash Menu Handlers
  const handleContentChange = (e) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart;

    // Atualiza o estado do formulário (texto)
    setFormData(prev => ({ ...prev, text: value }));

    const textBeforeCursor = value.substring(0, cursorPosition);
    const slashIndex = textBeforeCursor.lastIndexOf('/');

    if (slashIndex !== -1 && slashIndex < cursorPosition) {
      const query = textBeforeCursor.substring(slashIndex + 1);
      // Se tiver espaço ou quebra de linha após a barra, não consideramos comando
      if (!query.includes(' ') && !query.includes('\n')) {
        setSlashMenu({
          isOpen: true,
          position: { top: 0, left: 0 },
          filter: query,
          activeIndex: 0
        });
        return;
      }
    }

    if (slashMenu.isOpen) {
      setSlashMenu(prev => ({ ...prev, isOpen: false }));
    }
  };

  const handleContentKeyDown = (e) => {
    if (!slashMenu.isOpen) return;

    const filteredTemplates = templates.filter(t =>
      t.title.toLowerCase().includes(slashMenu.filter.toLowerCase())
    );

    if (filteredTemplates.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSlashMenu(prev => ({
        ...prev,
        activeIndex: (prev.activeIndex + 1) % filteredTemplates.length
      }));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSlashMenu(prev => ({
        ...prev,
        activeIndex: (prev.activeIndex - 1 + filteredTemplates.length) % filteredTemplates.length
      }));
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      selectSlashTemplate(filteredTemplates[slashMenu.activeIndex]);
    } else if (e.key === 'Escape') {
      setSlashMenu(prev => ({ ...prev, isOpen: false }));
    }
  };

  const selectSlashTemplate = (template) => {
    const cursorPosition = textareaRef.current.selectionStart;
    const text = formData.text;
    const textBeforeCursor = text.substring(0, cursorPosition);
    const slashIndex = textBeforeCursor.lastIndexOf('/');

    const newText = text.substring(0, slashIndex) + template.content + text.substring(cursorPosition);

    setFormData(prev => ({ ...prev, text: newText }));
    setSlashMenu(prev => ({ ...prev, isOpen: false }));

    // Retornar o foco para o textarea após a atualização do estado
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = slashIndex + template.content.length;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  // Referência para controle de fluxo (pause/stop)
  const controlRef = useRef({ isPaused: false, isStopped: false });

  // Sincronizar ref com estado de progresso
  useEffect(() => {
    controlRef.current = {
      isPaused: sendingProgress.isPaused,
      isStopped: sendingProgress.isStopped
    };
  }, [sendingProgress.isPaused, sendingProgress.isStopped]);

  // Função de sleep
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const handleSendNotification = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showAlert('error', 'Erro', 'Digite o nome da notificação');
      return;
    }

    if (!formData.instanceId) {
      showAlert('error', 'Erro', 'Selecione uma instância');
      return;
    }

    if (phoneNumbers.length === 0) {
      showAlert('error', 'Erro', 'Adicione pelo menos um destinatário');
      return;
    }

    if (!formData.text.trim() && !selectedMedia) {
      showAlert('error', 'Erro', 'Digite uma mensagem ou selecione uma mídia');
      return;
    }

    // Resetar controles e lista de falhas
    controlRef.current = { isPaused: false, isStopped: false };
    setFailedNumbers([]);
    setSuccessNumbers([]);
    const currentFailures = [];
    const currentSuccesses = [];
    setShowReport(true); // Mostrar relatório/progresso

    setSendingProgress({
      isActive: true,
      currentIndex: 0,
      total: phoneNumbers.length,
      isPaused: false,
      isStopped: false
    });

    setSending(true);

    try {
      const selectedInstance = instances.find(inst => inst.id === parseInt(formData.instanceId));
      if (!selectedInstance) throw new Error('Instância não encontrada');

      const recipientsList = phoneNumbers.map(p => p.number);
      const intervalMs = (formData.interval || 1) * 1000;

      for (let i = 0; i < recipientsList.length; i++) {
        // Verificar Stop
        if (controlRef.current.isStopped) break;

        // Verificar Pause (loop de espera)
        while (controlRef.current.isPaused) {
          if (controlRef.current.isStopped) break;
          await sleep(500);
        }
        if (controlRef.current.isStopped) break;

        const recipient = recipientsList[i];

        // Atualizar UI
        setSendingProgress(prev => ({ ...prev, currentIndex: i + 1 }));

        const notificationData = {
          name: `${formData.name}`,
          message: formData.text,
          recipients: [recipient], // Envia individualmente
          channelId: formData.instanceId,
          channelName: selectedInstance.name,
          selectedClients: [],
          status: 'pending',
          mediaId: selectedMedia ? selectedMedia.id : null,
          interval: 0 // Sem delay no backend
        };

        try {
          const response = await apiService.saveNotification(notificationData);

          // Verificar se o backend retornou status 'failed' (ex: número inválido)
          if (response.data && response.data.status === 'failed') {
            const errorMsg = response.data.errorMessage || 'Erro desconhecido';
            const failObj = { number: recipient, reason: errorMsg };
            currentFailures.push(failObj);
            setFailedNumbers(prev => [...prev, failObj]);
          } else {
            const successObj = { number: recipient };
            currentSuccesses.push(successObj);
            setSuccessNumbers(prev => [...prev, successObj]);
          }

        } catch (err) {
          console.error(`Falha ao enviar para ${recipient}:`, err);
          const errorMsg = err.response?.data?.message || err.message || 'Erro de conexão';
          const failObj = { number: recipient, reason: errorMsg };
          currentFailures.push(failObj);
          setFailedNumbers(prev => [...prev, failObj]);
        }

        // Aguardar intervalo (apenas se não for o último)
        if (i < recipientsList.length - 1) {
          await sleep(intervalMs);
        }
      }

      if (!controlRef.current.isStopped) {
        if (currentFailures.length === phoneNumbers.length) {
          showAlert('error', 'Falha', 'Nenhuma mensagem foi enviada. Verifique os números.');
        } else if (currentFailures.length > 0) {
          showAlert('warning', 'Concluído com erros', `Envio finalizado. ${currentFailures.length} números falharam.`);
        } else {
          showAlert('success', 'Concluído', 'Todas as mensagens foram enviadas com sucesso!');
        }

        // Limpar tudo se foi sucesso total
        if (currentFailures.length === 0) {
          setFormData(prev => ({
            ...prev,
            name: '',
            text: '',
            recipients: ''
          }));
          setPhoneNumbers([]);
          setPhoneInput('');
          setSelectedMedia(null);
        }
      } else {
        showAlert('warning', 'Parado', 'Envio interrompido.');
      }

    } catch (error) {
      console.error('Erro no envio em massa:', error);
      showAlert('error', 'Erro', error.message || 'Falha ao iniciar envio');
    } finally {
      setSending(false);
      setSendingProgress(prev => ({ ...prev, isActive: false }));
    }
  };

  const handlePauseSending = () => {
    setSendingProgress(prev => ({ ...prev, isPaused: !prev.isPaused }));
  };

  const handleStopSending = () => {
    setSendingProgress(prev => ({ ...prev, isStopped: true }));
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleString('pt-BR');

  // Renderizar formulário de envio
  const renderSendForm = () => (
    <div style={styles.card}>
      <h2 style={styles.cardTitle}>
        <Send size={20} />
        Nova Notificação
      </h2>

      <form onSubmit={handleSendNotification} className="form-container">
        {/* Nome da Notificação */}
        <div className="form-group">
          <label className="form-label">Nome da Notificação *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Ex: Promoção Black Friday"
            required
            className="form-input"
          />
        </div>

        <div style={styles.grid2}>
          {/* Instância */}
          <div className="form-group">
            <label className="form-label">Instância WhatsApp *</label>
            <select
              name="instanceId"
              value={formData.instanceId}
              onChange={handleInputChange}
              required
              className="form-select"
            >
              <option value="">Selecione uma instância</option>
              {instances.map(instance => (
                <option key={instance.id} value={instance.id}>
                  {instance.name}
                </option>
              ))}
            </select>
          </div>

          {/* Anexo de Mídia */}
          <div style={styles.mediaContainer}>
            <label className="form-label">Anexar Mídia (Opcional)</label>

            {selectedMedia ? (
              <div style={styles.selectedMedia}>
                <div style={styles.mediaInfo}>
                  {selectedMedia.type === 'image' ? (
                    <img src={getFileUrl(selectedMedia.path)} alt="Preview" style={styles.mediaPreview} />
                  ) : (
                    <div style={styles.mediaIconPlaceholder}>
                      {getFileIcon(selectedMedia.type)}
                    </div>
                  )}
                  <span style={styles.mediaName}>
                    {selectedMedia.name || selectedMedia.filename}
                  </span>
                </div>
                <button type="button" onClick={removeMedia} style={styles.removeMediaButton}>
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div style={styles.uploadContainer}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

                  {/* Botão de Upload */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={styles.mediaActionBtn}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = currentTheme.primary}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = currentTheme.border}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      backgroundColor: currentTheme.backgroundSecondary || '#f3f4f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: currentTheme.primary
                    }}>
                      <Upload size={20} />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <span style={{ display: 'block', fontWeight: '600', fontSize: '14px', color: currentTheme.textPrimary }}>Fazer Upload</span>
                      <span style={{ display: 'block', fontSize: '12px', color: currentTheme.textSecondary }}>Do seu computador</span>
                    </div>
                  </button>

                  {/* Botão de Galeria */}
                  <button
                    type="button"
                    onClick={openGallery}
                    style={styles.mediaActionBtn}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = currentTheme.primary}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = currentTheme.border}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      backgroundColor: currentTheme.backgroundSecondary || '#f3f4f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#8b5cf6' // Um roxo para diferenciar
                    }}>
                      <ImageIcon size={20} />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <span style={{ display: 'block', fontWeight: '600', fontSize: '14px', color: currentTheme.textPrimary }}>Galeria</span>
                      <span style={{ display: 'block', fontSize: '12px', color: currentTheme.textSecondary }}>Arquivos salvos</span>
                    </div>
                  </button>

                </div>

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
        </div>

        {/* Seleção de Clientes */}
        <div className="form-group">
          <label className="form-label">Selecionar Clientes</label>
          <button
            type="button"
            onClick={() => setShowClientModal(true)}
            className="form-input"
          >
            <Users size={18} />
            Clique para selecionar clientes da base
          </button>
        </div>

        {/* Destinatários */}
        <div className="form-group">
          <label className="form-label">Destinatários *</label>
          <input
            type="text"
            value={phoneInput}
            onChange={handlePhoneInputChange}
            onKeyPress={handlePhoneInputKeyPress}
            onPaste={handlePhoneInputPaste}
            placeholder="Digite ou cole números (Ex: 85999999999) e pressione Enter"
            className="form-input"
          />

          {phoneNumbers.length > 0 && (
            <div style={styles.tagsContainer}>
              {phoneNumbers.map(item => (
                <span key={item.id} style={styles.tag}>
                  <Smartphone size={14} />
                  {item.number}
                  <button
                    type="button"
                    onClick={() => removePhoneNumber(item.id)}
                    className="btn-remove-tag"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          <small className="form-help">
            Digite números e pressione Enter. Números de 10 dígitos terão o 9 adicionado automaticamente.
          </small>
        </div>

        {/* Intervalo */}
        <div className="form-group">
          <label className="form-label">Intervalo entre envios (segundos)</label>
          <input
            type="number"
            name="interval"
            value={formData.interval ?? 30}
            onChange={handleInputChange}
            min="0"
            max="60"
            className="form-input"
          />
          <small className="form-help">
            Tempo de espera entre cada envio (recomendamos mínimo 30 segundo para evitar bloqueios da META)
          </small>
        </div>

        {/* Mensagem */}
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="form-label">Mensagem *</label>
            {templates.length > 0 && (
              <select
                onChange={handleTemplateSelect}
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: `1px solid ${currentTheme.border}`,
                  fontSize: '12px',
                  backgroundColor: currentTheme.background,
                  color: currentTheme.textPrimary
                }}
                defaultValue=""
              >
                <option value="" disabled>Carregar Mensagem Pronta</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            )}
          </div>
          <div style={{ position: 'relative' }}>
            <textarea
              ref={textareaRef}
              name="text"
              value={formData.text}
              onChange={handleContentChange}
              onKeyDown={handleContentKeyDown}
              placeholder="Digite sua mensagem aqui... (Use / para mensagens prontas)"
              required
              rows={4}
              maxLength={4096}
              className="form-textarea"
            />
            {slashMenu.isOpen && (
              <div style={styles.slashMenu}>
                {templates
                  .filter(t => t.title.toLowerCase().includes(slashMenu.filter.toLowerCase()))
                  .map((template, index) => (
                    <div
                      key={template.id}
                      style={{
                        ...styles.slashMenuItem,
                        ...(index === slashMenu.activeIndex ? styles.slashMenuItemActive : {})
                      }}
                      onClick={() => selectSlashTemplate(template)}
                    >
                      <span style={styles.templateTitle}>{template.title}</span>
                      <span style={styles.templatePreview}>{template.content.substring(0, 30)}...</span>
                    </div>
                  ))}
                {templates.filter(t => t.title.toLowerCase().includes(slashMenu.filter.toLowerCase())).length === 0 && (
                  <div style={styles.slashMenuEmpty}>Nenhuma mensagem encontrada</div>
                )}
              </div>
            )}
          </div>
          <div style={styles.charCount}>
            <small className="form-help">Máximo 4096 caracteres</small>
            <small style={{
              ...styles.helperText,
              color: formData.text.length > 4000 ? '#ef4444' : styles.helperText.color,
              fontWeight: formData.text.length > 4000 ? 'bold' : 'normal'
            }}>
              {formData.text.length}/4096
            </small>
          </div>
        </div>

        {/* Progresso de Envio e Relatório */}
        {showReport && (
          <div style={styles.progressCard}>
            <div style={styles.progressHeader}>
              <h3 style={styles.progressTitle}>
                {sendingProgress.isActive ? 'Enviando...' : 'Envio Finalizado'}
              </h3>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={styles.progressCount}>
                  {sendingProgress.currentIndex} de {sendingProgress.total}
                </span>
                {!sendingProgress.isActive && (
                  <button type="button" onClick={() => setShowReport(false)} style={styles.closeReportButton}>
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            <div style={styles.progressBarBg}>
              <div style={{
                ...styles.progressBarFill,
                width: `${(sendingProgress.currentIndex / sendingProgress.total) * 100}%`,
                backgroundColor: sendingProgress.isActive ? currentTheme.primary : (failedNumbers.length > 0 && failedNumbers.length === phoneNumbers.length) ? '#ef4444' : '#10b981'
              }} />
            </div>

            {sendingProgress.isActive && (
              <div style={styles.progressActions}>
                <button type="button" onClick={handlePauseSending} style={styles.pauseButton}>
                  {sendingProgress.isPaused ? <Play size={16} /> : <Pause size={16} />}
                  {sendingProgress.isPaused ? 'Retomar' : 'Pausar'}
                </button>
                <button type="button" onClick={handleStopSending} style={styles.stopButton}>
                  <Square size={16} /> Parar
                </button>
              </div>
            )}

            {/* Listas de Resultados */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Lista de Sucesso */}
              {successNumbers.length > 0 && (
                <div style={styles.successList}>
                  <h4 style={styles.successTitle}>
                    <Check size={16} color="#059669" />
                    Enviados com Sucesso ({successNumbers.length})
                  </h4>
                  <ul style={styles.successUl}>
                    {successNumbers.map((item, idx) => (
                      <li key={idx} style={styles.successLi}>
                        <strong>{item.number}</strong>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Lista de Falhas */}
              {failedNumbers.length > 0 && (
                <div style={styles.failedList}>
                  <h4 style={styles.failedTitle}>
                    <AlertCircle size={16} color="#dc2626" />
                    Falhas no Envio ({failedNumbers.length})
                  </h4>
                  <ul style={styles.failedUl}>
                    {failedNumbers.map((fail, idx) => (
                      <li key={idx} style={styles.failedLi}>
                        <strong>{fail.number}</strong>: {fail.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Botão de envio */}
        <div style={styles.actionButtons}>
          <button
            type="submit"
            disabled={sending || loading || instances.length === 0 || sendingProgress.isActive}
            onMouseEnter={() => setIsHover(true)}
            onMouseLeave={() => setIsHover(false)}
            className="btn-base btn-new" style={{ fontSize: '16px' }}
          >
            <Send size={16} />
            <span>
              {sending ? 'Enviando...' : 'Enviar Notificação'}
            </span>
          </button>


          <button
            className="btn-base btn-new-orange" style={{ fontSize: '16px' }}
            type="button"
            onClick={() =>
              showToast({
                title: 'Função não habilitada',
                message: 'O agendamento será liberado em breve.',
                variant: 'warning'
              })
            }
          >
            <Timer size={18} />
            <span>Agendar envio</span>
          </button>


        </div>


      </form>
    </div>
  );

  // Renderizar histórico
  const renderHistory = () => (
    <div style={styles.card}>
      <div style={styles.historyHeader}>
        <h2 style={styles.cardTitle}>
          <History size={20} />
          Histórico
        </h2>

        <div style={styles.filterContainer}>
          <div className="form-input-wrapper">
            <Search size={16} style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Buscar..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="form-input"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="form-select"
          >
            <option value="">Todos os status</option>
            <option value="pending">Pendente</option>
            <option value="sent">Enviado</option>
            <option value="failed">Falhou</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={styles.emptyState}>Carregando...</div>
      ) : notifications.length === 0 ? (
        <div style={styles.emptyState}>
          <AlertCircle size={48} style={styles.emptyIcon} />
          <p>Nenhuma notificação encontrada</p>
        </div>
      ) : (
        <>
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Data</th>
                  <th style={styles.th}>Nome</th>
                  <th style={styles.th}>Canal</th>
                  <th style={styles.th}>Destinatários</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Mensagem</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map(notification => (
                  <tr key={notification.id} style={styles.tr}>
                    <td style={styles.td}>{formatDate(notification.dateCreated)}</td>
                    <td style={styles.td}><strong>{notification.name}</strong></td>
                    <td style={styles.td}>{notification.channelName || 'N/A'}</td>
                    <td style={styles.td}>
                      <div style={styles.truncateCell}>
                        {notification.recipients?.join(', ') || 'N/A'}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.statusBadge,
                        backgroundColor: notification.status === 'sent' ? '#d1fae5' : notification.status === 'failed' ? '#fee2e2' : '#fef3c7',
                        color: notification.status === 'sent' ? '#065f46' : notification.status === 'failed' ? '#991b1b' : '#92400e'
                      }}>
                        {notification.status === 'sent' ? 'Enviado' : notification.status === 'failed' ? 'Falhou' : 'Pendente'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.truncateCell}>{notification.message}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {pagination.pages > 1 && (
            <div style={styles.pagination}>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
                style={{ ...styles.paginationButton, opacity: pagination.page === 1 ? 0.5 : 1 }}
              >
                Anterior
              </button>
              <span style={{ color: currentTheme.textPrimary }}>
                Página {pagination.page} de {pagination.pages}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                disabled={pagination.page === pagination.pages}
                style={{ ...styles.paginationButton, opacity: pagination.page === pagination.pages ? 0.5 : 1 }}
              >
                Próxima
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <div style={styles.container}>
      {/* Alerta Global */}
      <AlertToast
        open={alertState.open}
        variant={alertState.variant}
        title={alertState.title}
        message={alertState.message}
        onClose={() => setAlertState(prev => ({ ...prev, open: false }))}
      />

      {/* Cabeçalho */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            <Send size={32} style={styles.titleIcon} />
            Notificações Manuais
          </h1>
          <p style={styles.subtitle}>Envie mensagens em massa para seus clientes via WhatsApp</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabsContainer}>
        <button
          onClick={() => setActiveTab('send')}
          style={{
            ...styles.tabButton,
            ...(activeTab === 'send' ? styles.activeTab : styles.inactiveTab)
          }}
        >
          <Send size={18} /> Enviar Notificação
        </button>
        <button
          onClick={() => setActiveTab('history')}
          style={{
            ...styles.tabButton,
            ...(activeTab === 'history' ? styles.activeTab : styles.inactiveTab)
          }}
        >
          <History size={18} /> Histórico
        </button>
      </div>

      {/* Conteúdo */}
      <div style={styles.content}>
        {activeTab === 'send' ? renderSendForm() : renderHistory()}
      </div>

      {/* Modal de Clientes */}
      {showClientModal && (
        <div style={styles.modalOverlay} onClick={() => setShowClientModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Selecionar Cliente</h3>
              <button onClick={() => setShowClientModal(false)} style={styles.closeButton}>
                <X size={24} />
              </button>
            </div>
            <div style={styles.modalBody}>
              {clients.map(client => (
                <div
                  key={client.id}
                  style={styles.clientItem}
                  onClick={() => handleClientSelection(client)}
                >
                  <div style={{ fontWeight: '500', color: currentTheme.textPrimary }}>{client.name}</div>
                  <div style={{ fontSize: '0.875rem', color: currentTheme.textSecondary }}>{client.cellphone}</div>
                </div>
              ))}
              {clients.length === 0 && (
                <div style={styles.emptyState}>Nenhum cliente encontrado</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal da Galeria */}
      {showGallery && (
        <div style={styles.modalOverlay} onClick={() => setShowGallery(false)}>
          <div style={{ ...styles.modal, maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Galeria de Mídia</h3>
              <button onClick={() => setShowGallery(false)} style={styles.closeButton}>
                <X size={24} />
              </button>
            </div>
            <div style={styles.galleryGrid}>
              {galleryMedias.map(media => (
                <div key={media.id} style={styles.galleryItem} onClick={() => selectGalleryMedia(media)}>
                  {media.type === 'image' ? (
                    <img src={getFileUrl(media.path)} alt={media.filename} style={styles.galleryImage} />
                  ) : (
                    <div style={styles.galleryIcon}>
                      {getFileIcon(media.type)}
                    </div>
                  )}
                  <span style={styles.galleryName}>{media.name || media.filename}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Estilos
const getStyles = (theme) => ({
  container: {
    padding: '24px',
    backgroundColor: theme.background,
    minHeight: '100vh',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
  },
  header: {
    marginBottom: '32px'
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
  tabsContainer: {
    display: 'flex',
    gap: '16px',
    marginBottom: '24px',
    borderBottom: `1px solid ${theme.border}`
  },
  tabButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    borderBottom: '2px solid transparent'
  },
  activeTab: {
    color: theme.primary,
    borderBottom: `2px solid ${theme.primary}`
  },
  inactiveTab: {
    color: theme.textSecondary
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto'
  },
  card: {
    backgroundColor: theme.cardBackground,
    borderRadius: '12px',
    boxShadow: theme.shadow,
    border: `1px solid ${theme.border}`,
    padding: '24px'
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: theme.textPrimary,
    margin: '0 0 24px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px'
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: theme.textPrimary
  },
  input: {
    padding: '12px',
    border: `1px solid ${theme.border}`,
    borderRadius: '8px',
    backgroundColor: theme.inputBackground || theme.background,
    color: theme.textPrimary,
    fontSize: '14px',
    outline: 'none',
    width: '100%'
  },
  select: {
    padding: '12px',
    border: `1px solid ${theme.border}`,
    borderRadius: '8px',
    backgroundColor: theme.inputBackground || theme.background,
    color: theme.textPrimary,
    fontSize: '14px',
    outline: 'none',
    width: '100%',
    cursor: 'pointer'
  },
  textarea: {
    padding: '12px',
    border: `1px solid ${theme.border}`,
    borderRadius: '8px',
    backgroundColor: theme.inputBackground || theme.background,
    color: theme.textPrimary,
    fontSize: '14px',
    outline: 'none',
    width: '100%',
    minHeight: '120px',
    resize: 'vertical'
  },
  helperText: {
    fontSize: '12px',
    color: theme.textSecondary,
    marginTop: '4px'
  },
  charCount: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  submitButton: {
    padding: '14px',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    transition: 'background-color 0.2s',
    width: '100%'
  },

  tagsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    padding: '8px',
    border: `1px solid ${theme.border}`,
    borderRadius: '8px',
    backgroundColor: theme.inputBackground || theme.background,
    marginTop: '8px'
  },
  tag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    backgroundColor: theme.primary,
    color: 'white',
    borderRadius: '16px',
    fontSize: '12px',
    fontWeight: '500'
  },
  removeTagButton: {
    background: 'none',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    padding: 0,
    display: 'flex',
    alignItems: 'center'
  },
  mediaContainer: {
    border: `1px solid ${theme.border}`,
    borderRadius: '8px',
    padding: '16px',
    backgroundColor: theme.inputBackground || theme.background
  },
  attachButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    padding: '12px',
    border: `1px dashed ${theme.border}`,
    borderRadius: '8px',
    backgroundColor: 'transparent',
    color: theme.textSecondary,
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  mediaDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: '8px',
    backgroundColor: theme.cardBackground,
    border: `1px solid ${theme.border}`,
    borderRadius: '8px',
    boxShadow: theme.shadow,
    zIndex: 10,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  },
  mediaOption: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: `1px solid ${theme.border}`,
    color: theme.textPrimary,
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%'
  },
  selectedMedia: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px',
    border: `1px solid ${theme.border}`,
    borderRadius: '8px',
    backgroundColor: theme.background
  },
  mediaInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    overflow: 'hidden'
  },
  mediaPreview: {
    width: '40px',
    height: '40px',
    objectFit: 'cover',
    borderRadius: '4px'
  },
  mediaIconPlaceholder: {
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.backgroundSecondary || '#f3f4f6',
    borderRadius: '4px',
    color: theme.textSecondary
  },
  mediaName: {
    fontSize: '13px',
    color: theme.textPrimary,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '200px'
  },
  removeMediaButton: {
    background: 'none',
    border: 'none',
    color: theme.textSecondary,
    cursor: 'pointer'
  },
  clientSelectButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
    padding: '12px',
    border: `1px solid ${theme.border}`,
    borderRadius: '8px',
    backgroundColor: theme.inputBackground || theme.background,
    color: theme.textPrimary,
    cursor: 'pointer',
    textAlign: 'left'
  },
  progressCard: {
    padding: '20px',
    backgroundColor: theme.backgroundSecondary || '#f9fafb',
    borderRadius: '12px',
    border: `1px solid ${theme.border}`,
    marginBottom: '24px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
  },
  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  progressTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: theme.textPrimary,
    margin: 0
  },
  progressCount: {
    fontSize: '14px',
    fontWeight: '500',
    color: theme.primary,
    backgroundColor: theme.primaryLight || '#e0e7ff',
    padding: '4px 12px',
    borderRadius: '16px'
  },
  progressBarBg: {
    width: '100%',
    height: '12px',
    backgroundColor: theme.border,
    borderRadius: '6px',
    overflow: 'hidden',
    marginBottom: '16px'
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.primary,
    transition: 'width 0.3s ease-out',
    borderRadius: '6px'
  },
  progressActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end'
  },
  pauseButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    border: `1px solid ${theme.primary}`,
    borderRadius: '6px',
    backgroundColor: 'transparent',
    color: theme.primary,
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: theme.primaryLight || '#e0e7ff'
    }
  },
  stopButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    border: `1px solid #ef4444`,
    borderRadius: '6px',
    backgroundColor: 'transparent',
    color: '#ef4444',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: '#fee2e2'
    }
  },
  historyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px'
  },
  filterContainer: {
    display: 'flex',
    gap: '12px'
  },
  searchWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    color: theme.textSecondary
  },
  searchInput: {
    padding: '8px 8px 8px 36px',
    border: `1px solid ${theme.border}`,
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: theme.background,
    color: theme.textPrimary,
    outline: 'none'
  },
  filterSelect: {
    padding: '8px',
    border: `1px solid ${theme.border}`,
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: theme.background,
    color: theme.textPrimary,
    outline: 'none',
    cursor: 'pointer'
  },
  tableContainer: {
    overflowX: 'auto',
    border: `1px solid ${theme.border}`,
    borderRadius: '8px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '13px',
    fontWeight: '600',
    color: theme.textSecondary,
    backgroundColor: theme.backgroundSecondary || '#f9fafb',
    borderBottom: `1px solid ${theme.border}`,
    whiteSpace: 'nowrap'
  },
  tr: {
    borderBottom: `1px solid ${theme.border}`,
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: theme.backgroundSecondary || '#f9fafb'
    }
  },
  td: {
    padding: '12px 16px',
    fontSize: '14px',
    color: theme.textPrimary
  },
  statusBadge: {
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  truncateCell: {
    maxWidth: '250px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '16px',
    marginTop: '24px'
  },
  paginationButton: {
    padding: '8px 16px',
    border: `1px solid ${theme.border}`,
    borderRadius: '6px',
    backgroundColor: theme.background,
    color: theme.textPrimary,
    cursor: 'pointer',
    fontSize: '14px'
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px',
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  modal: {
    backgroundColor: theme.cardBackground,
    borderRadius: '12px',
    width: '100%',
    maxWidth: '500px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
  },
  modalHeader: {
    padding: '20px',
    borderBottom: `1px solid ${theme.border}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  modalTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '600',
    color: theme.textPrimary
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: theme.textSecondary,
    cursor: 'pointer'
  },
  modalBody: {
    padding: '20px',
    overflowY: 'auto',
    flex: 1
  },
  clientItem: {
    padding: '12px',
    borderBottom: `1px solid ${theme.border}`,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: theme.backgroundSecondary || '#f9fafb'
    }
  },
  galleryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
    gap: '16px',
    padding: '16px'
  },
  galleryItem: {
    cursor: 'pointer',
    border: `1px solid ${theme.border}`,
    borderRadius: '8px',
    overflow: 'hidden'
  },
  galleryImage: {
    width: '100%',
    height: '100px',
    objectFit: 'cover'
  },
  galleryIcon: {
    width: '100%',
    height: '100px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.backgroundSecondary || '#f3f4f6',
    color: theme.textSecondary
  },
  galleryName: {
    display: 'block',
    padding: '8px',
    fontSize: '11px',
    color: theme.textPrimary,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    textAlign: 'center'
  },
  failedList: {
    padding: '16px',
    backgroundColor: '#fef2f2',
    borderRadius: '8px',
    border: '1px solid #fee2e2'
  },
  failedTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#991b1b',
    margin: '0 0 12px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  failedUl: {
    margin: 0,
    paddingLeft: '20px',
    color: '#b91c1c',
    maxHeight: '200px',
    overflowY: 'auto'
  },
  failedLi: {
    fontSize: '13px',
    marginBottom: '4px'
  },
  successList: {
    padding: '16px',
    backgroundColor: '#ecfdf5',
    borderRadius: '8px',
    border: '1px solid #d1fae5'
  },
  successTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#065f46',
    margin: '0 0 12px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  successUl: {
    margin: 0,
    paddingLeft: '20px',
    color: '#047857',
    maxHeight: '200px',
    overflowY: 'auto'
  },
  successLi: {
    fontSize: '13px',
    marginBottom: '4px'
  },
  slashMenu: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    width: '300px',
    maxHeight: '200px',
    overflowY: 'auto',
    backgroundColor: theme.cardBackground,
    border: `1px solid ${theme.border}`,
    borderRadius: '6px',
    boxShadow: theme.shadow,
    zIndex: 100,
    display: 'flex',
    flexDirection: 'column'
  },
  slashMenuItem: {
    padding: '8px 12px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    borderBottom: `1px solid ${theme.border}`,
    backgroundColor: theme.cardBackground,
    color: theme.textPrimary
  },
  slashMenuItemActive: {
    backgroundColor: theme.backgroundSecondary || '#f0f7ff'
  },
  templateTitle: {
    fontWeight: '600',
    fontSize: '13px',
    color: theme.textPrimary
  },
  templatePreview: {
    fontSize: '12px',
    color: theme.textSecondary,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  slashMenuEmpty: {
    padding: '12px',
    textAlign: 'center',
    color: theme.textSecondary,
    fontSize: '13px'
  },

  actionButtons: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginTop: '16px'
  },

  orangeButton: {
    padding: '14px',
    backgroundColor: '#f97316', // laranja
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },

  submitButton: {
    padding: '14px',
    backgroundColor: theme.primary,
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    width: '100%'
  },

  orangeButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '14px',
    backgroundColor: '#f97316',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    width: '100%'
  },


  actionButtons: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginTop: '16px'
  },
  orangeButtonHover: {
    backgroundColor: '#e58957ff'
  },





  mediaActionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    backgroundColor: theme.background,
    border: `1px solid ${theme.border}`,
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    width: '100%'
  }

});

export default NotificacoesManual;
