import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { useTheme } from '../contexts/ThemeContext';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import '../styles/buttons.css';
import { io } from 'socket.io-client';
import {
  MessageSquare,
  Users,
  Clock,
  List,
  User,
  Settings,
  Send as SendIcon,
  Paperclip,
  Smile,
  MoreVertical,
  Phone,
  Video,
  Search,
  AlertTriangle,
  Plus,
  Headset,
  Bot,
  MessagesSquare,
  CircleCheck,
  CircleUserRound,
  CircleX,
  Image as ImageIcon,
  FileVideo,
  FileAudio,
  FileText,
  Mic,
  Trash2,
  Check,
  StopCircle,
  CircleCheckBig,
  Info
} from 'lucide-react';
import './Chat.css';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import ChatClientInfo from './ChatClientInfo';
import { useToast } from '../contexts/ToastContext';
import { playNotificationSound, AVAILABLE_SOUNDS } from '../utils/sounds';

// Configuração do socket (ajustar conforme ambiente)
//const socket = io('http://localhost:5001', {
const socket = io('https://api.sendd.altersoft.dev.br', {
  withCredentials: true,
  autoConnect: false
});

const Chat = () => {
  const { currentTheme, isDark } = useTheme();
  const { user } = useAuth();

  const themeStyles = {
    '--chat-bg': currentTheme.background,
    '--chat-sidebar-bg': currentTheme.sidebarBackground,
    '--chat-card-bg': currentTheme.cardBackground,
    '--chat-border': currentTheme.border,
    '--chat-text-primary': currentTheme.textPrimary,
    '--chat-text-secondary': currentTheme.textSecondary,
    '--chat-hover': isDark ? 'rgba(255, 255, 255, 0.06)' : '#f0f2f5',
    '--chat-active': isDark ? 'rgba(59, 130, 246, 0.15)' : '#e7f3ff',
    '--chat-header-bg': currentTheme.cardBackground,
    '--chat-input-bg': isDark ? '#111827' : '#ffffff',
    '--chat-bubble-sent': isDark ? '#005c4b' : '#d9fdd3',
    '--chat-bubble-received': isDark ? '#202c33' : '#ffffff',
    '--chat-message-text': isDark ? '#e9edef' : '#111b21',
    '--chat-message-time': isDark ? '#8696a0' : '#667781',
    '--chat-bg-messages': isDark ? '#0b141a' : '#efeae2',
    '--chat-bg-image': isDark ? 'none' : 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
    '--chat-avatar-bg': isDark ? 'rgba(255, 255, 255, 0.1)' : '#e0e0e0',
  };

  const iconButtonStyle = {
    background: 'transparent',
    border: 'none',
    padding: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: currentTheme.textSecondary // Force icon color
  };

  // Configuration State
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [instances, setInstances] = useState([]);
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('chat_config');
    return saved ? JSON.parse(saved) : { instanceId: '', organizationId: '', departments: '', sound: 'default' };
  });

  // Search State
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Chat State
  const [activeTab, setActiveTab] = useState('history'); // history, bot, queue, my_chats
  const [selectedChat, setSelectedChat] = useState(null);
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [closingMessage, setClosingMessage] = useState('');
  const [signMessage, setSignMessage] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferUsers, setTransferUsers] = useState([]);
  const [selectedTransferUser, setSelectedTransferUser] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [showClientInfo, setShowClientInfo] = useState(false);

  // Focus Ref
  const inputRef = useRef(null);

  // Pagination State
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Start Chat State
  const [showStartChatModal, setShowStartChatModal] = useState(false);
  const [availableClients, setAvailableClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [newChatNumber, setNewChatNumber] = useState('');
  const [startChatTab, setStartChatTab] = useState('contacts');

  // Media & Emoji State
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  const fileInputRef = useRef(null);
  const [creatingChat, setCreatingChat] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState('');

  const { showToast } = useToast();
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null); // Ref for scroll container
  const prevScrollHeightRef = useRef(null); // Ref for scroll height tracking
  const selectedChatRef = useRef(null);
  const chatsRef = useRef(chats); // Ref para acessar chats dentro do socket sem recriar listener

  useEffect(() => {
    selectedChatRef.current = selectedChat;
    if (selectedChat && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [selectedChat]);

  useEffect(() => {
    chatsRef.current = chats;
  }, [chats]);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll Logic
  useLayoutEffect(() => {
    if (prevScrollHeightRef.current && chatContainerRef.current) {
      // We loaded more messages, restore scroll position
      const newScrollHeight = chatContainerRef.current.scrollHeight;
      const diff = newScrollHeight - prevScrollHeightRef.current;
      chatContainerRef.current.scrollTop = diff;
      prevScrollHeightRef.current = null;
    } else {
      // Standard behavior: scroll to bottom (only if new message or first load)
      // If we just loaded page 1, scroll to bottom
      // Logic: if no prevScrollHeight was set, assume we want bottom
      if (!loadingMore) {
        scrollToBottom();
      }
    }
  }, [messages]);

  // Abrir modal se não houver config salva
  useEffect(() => {
    if (!config.instanceId) {
      setShowConfigModal(true);
    }
  }, []);

  // Fetch initial data
  useEffect(() => {
    fetchInstances();
  }, []);

  // Socket management
  useEffect(() => {
    if (config.organizationId) {
      console.log('[Socket] Tentando conectar ao room da org:', config.organizationId);
      socket.connect();

      socket.on('connect', () => {
        console.log('[Socket] Conectado com ID:', socket.id);
        setSocketConnected(true);
        socket.emit('join_organization', config.organizationId);
      });

      socket.on('disconnect', () => {
        setSocketConnected(false);
      });

      socket.on('connect_error', (err) => {
        console.error('[Socket] Erro de conexão:', err.message);
        setSocketConnected(false);
      });

      socket.on('new_message', async (data) => {
        console.log('[Socket] Nova mensagem:', data);
        // Se a mensagem for do chat atual
        if (selectedChatRef.current && data.chatId === selectedChatRef.current.id) {
          // Adiciona otimista
          setMessages(prev => [...prev, data.message]);

          // Busca mensagens novamente para garantir sync e resetar unreadCount no backend
          await fetchMessages(data.chatId);
          fetchChats();
        } else {
          // Se for outro chat

          // Verificar se é 'meu atendimento' usando o ref atualizado
          // e tocar som se for
          const currentChats = chatsRef.current || [];
          const targetChat = currentChats.find(c => c.id === data.chatId);

          // Verifica se o chat existe na lista E se sou o responsável por ele
          if (targetChat && targetChat.status === 'attendant' && user?.id && Number(targetChat.attendantId) === Number(user.id)) {
            playNotificationSound(config.sound);
          } else {
            // Debug: por que não tocou?
            // console.log('Som ignorado. Chat:', targetChat?.id, 'Status:', targetChat?.status, 'Attendant:', targetChat?.attendantId, 'User:', user?.id);
          }

          // Se for outro chat, apenas atualiza a lista (unreadCount virá do banco)
          fetchChats();
        }
      });

      socket.on('chat_status_updated', (data) => {
        console.log('[Socket] Status do chat atualizado:', data);
        if (selectedChatRef.current && data.chatId === selectedChatRef.current.id) {
          setSelectedChat(prev => ({ ...prev, status: data.status }));
        }

        // Tocar som se entrar na fila (attendant sem id)
        if (data.status === 'attendant' && !data.attendantId) {
          playNotificationSound();
        }

        fetchChats();
      });

      return () => {
        socket.off('new_message');
        socket.off('chat_status_updated');
        socket.disconnect();
      };
    }
  }, [config.organizationId]); // Removido selectedChat da dependência para evitar reconectores constante

  // Carregar mensagens quando um chat é selecionado
  useEffect(() => {
    if (selectedChat) {
      setPage(1);
      setHasMore(true);
      // setMessages([]); // Optional: clear or keep to prevent flash? Clearing is safer related to conflicting IDs.
      fetchMessages(selectedChat.id, 1);
    }
  }, [selectedChat]);

  const fetchInstances = async () => {
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
            organizationId: org.id,
            organizationName: org.razaoSocial || org.nomeFantasia
          }));
          allInstances = [...allInstances, ...instancesWithOrg];
        } catch (error) {
          console.error(`Erro ao carregar instâncias da organização ${org.id}:`, error);
        }
      }
      setInstances(allInstances.filter(i => i.status === 'connected'));
      console.log('[Chat] Instâncias conectadas carregadas:', allInstances.filter(i => i.status === 'connected'));

      // Auto-correção: Se a instância salva no config existe mas a orgId está errada (pós-reset)
      const currentInst = allInstances.find(i => i.id === Number(config.instanceId) || i.instanceName === config.instanceId);
      if (currentInst && currentInst.organizationId !== Number(config.organizationId)) {
        console.log(`[Chat] Corrigindo organizationId de ${config.organizationId} para ${currentInst.organizationId}`);
        const newConfig = { ...config, organizationId: currentInst.organizationId };
        setConfig(newConfig);
        localStorage.setItem('chat_config', JSON.stringify(newConfig));
      }
    } catch (error) {
      console.error('Erro ao carregar instâncias:', error);
    }
  };

  const fetchChats = async () => {
    const orgId = Number(config.organizationId);
    if (!orgId || isNaN(orgId)) {
      console.warn('[Chat] organizationId inválido ou ausente:', config.organizationId);
      return;
    }

    setLoading(true);
    try {
      console.log('[Chat] Buscando chats para org:', orgId);
      const response = await apiService.get('/private/chats', {
        params: { organizationId: orgId }
      });
      console.log('[Chat] Chats recebidos:', response.data);
      setChats(response.data);
    } catch (error) {
      console.error('Erro ao buscar chats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Carregar chats iniciais se já tiver config
  useEffect(() => {
    console.log('[Chat] Config atual:', config);
    if (config.organizationId && !showConfigModal) {
      fetchChats();
    }
  }, [config.organizationId, showConfigModal]);

  const fetchMessages = async (chatId, pageNum = 1) => {
    try {
      if (pageNum > 1) {
        setLoadingMore(true);
        if (chatContainerRef.current) {
          prevScrollHeightRef.current = chatContainerRef.current.scrollHeight;
        }
      }

      const response = await apiService.get(`/private/chats/${chatId}/messages`, {
        params: { page: pageNum, limit: 30 }
      });
      const newMessages = response.data;

      if (newMessages.length < 30) {
        setHasMore(false);
      } else {
        setHasMore(true); // Reset only if starting fresh? No, strictly based on response length.
      }

      if (pageNum === 1) {
        setMessages(newMessages);
        setPage(1);
        setTimeout(scrollToBottom, 100); // Scroll to bottom only on first load
      } else {
        // Prepend messages
        setMessages(prev => {
          // Filter duplicates just in case
          const existingIds = new Set(prev.map(m => m.id));
          const uniqueNew = newMessages.filter(m => !existingIds.has(m.id));
          return [...uniqueNew, ...prev];
        });
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !loadingMore && selectedChat) {
      fetchMessages(selectedChat.id, page + 1);
    }
  };

  const handleConfigSubmit = (e) => {
    e.preventDefault();
    const inst = instances.find(i => i.id === Number(config.instanceId));
    if (inst) {
      const newConfig = {
        ...config,
        organizationId: inst.organizationId,
        instanceName: inst.name || inst.instanceName // Opcional, para exibição
      };
      setConfig(newConfig);
      localStorage.setItem('chat_config', JSON.stringify(newConfig));
      setShowConfigModal(false);
    }
  };

  const fetchClients = async () => {
    setLoadingClients(true);
    try {
      const response = await apiService.get('/private/clients', {
        params: { organizationId: config.organizationId }
      });
      // Backend returns { data: [], pagination: {} }
      const clientsList = response.data.data || response.data || [];
      setAvailableClients(Array.isArray(clientsList) ? clientsList : []);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      showToast('Erro ao carregar contatos.', 'error');
    } finally {
      setLoadingClients(false);
    }
  };

  const handleStartChat = async (clientId = null, manualNumber = null) => {
    setCreatingChat(true);
    try {
      const response = await apiService.post('/private/chats/start', {
        clientId,
        number: manualNumber
      });

      const newChat = response.data;
      setShowStartChatModal(false);
      setActiveTab('my_chats');

      await fetchChats(); // Atualiza a lista geral
      setSelectedChat(newChat); // Seleciona o chat novo

      showToast({
        title: 'Sucesso',
        message: 'Conversa iniciada com sucesso!',
        variant: 'success'
      });
    } catch (error) {
      console.error('Erro ao iniciar conversa:', error);
      showToast({
        title: 'Erro',
        message: error.response?.data?.error || 'Falha ao iniciar conversa.',
        variant: 'error'
      });
    } finally {
      setCreatingChat(false);
    }
  };

  const handleOpenStartChat = () => {
    setShowStartChatModal(true);
    fetchClients();
  };

  const handleEmojiClick = (emojiObject) => {
    setMessageInput(prev => prev + emojiObject.emoji);
    // setShowEmojiPicker(false); // Manter aberto se quiser
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Erro ao acessar microfone. Verifique as permissões.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        handleSendAudio(audioBlob);
        streamCleanup();
      };
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      streamCleanup();
    }
  };

  const streamCleanup = () => {
    setIsRecording(false);
    clearInterval(timerRef.current);
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    setRecordingTime(0);
    audioChunksRef.current = [];
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendAudio = (audioBlob) => {
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onload = async () => {
      const base64Audio = reader.result.split(',')[1];
      try {
        const tempId = Date.now();
        const newMessage = {
          id: tempId,
          chatId: selectedChat.id,
          text: URL.createObjectURL(audioBlob), // Preview local
          sender: 'me',
          timestamp: new Date().toISOString(),
          status: 'sending',
          type: 'audio'
        };

        // Opcional: Adicionar ao estado imediatamente (optimistic UI)
        // setMessages(prev => [...prev, newMessage]);

        await apiService.post('/private/chats/send', {
          chatId: selectedChat.id,
          media: base64Audio,
          fileName: `audio_${Date.now()}.webm`,
          mediaType: 'audio',
          mimeType: 'audio/webm',
          caption: ''
        });
        // O socket vai atualizar a lista de mensagens
      } catch (error) {
        console.error('Erro ao enviar áudio:', error);
        alert('Erro ao enviar áudio.');
      }
    };
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Convert to Base64
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Content = reader.result.split(',')[1];
      const mimeType = file.type;
      let mediaType = 'document';

      if (mimeType.startsWith('image/')) mediaType = 'image';
      else if (mimeType.startsWith('video/')) mediaType = 'video';
      else if (mimeType.startsWith('audio/')) mediaType = 'audio';

      // Send
      try {
        await apiService.post('/private/chats/send', {
          chatId: selectedChat.id,
          media: base64Content,
          fileName: file.name,
          mimeType: mimeType,
          mediaType: mediaType,
          caption: messageInput // Optional caption
        });
        setMessageInput(''); // Clear caption if any
        setShowAttachMenu(false);
      } catch (error) {
        console.error('Erro ao enviar arquivo:', error);
        showToast('Erro', 'Falha ao enviar arquivo.', 'error');
      }
    };
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedChat) return;

    if (showEmojiPicker) setShowEmojiPicker(false);

    const text = signMessage && user?.name
      ? `*${user.name}:*\n${messageInput}`
      : messageInput;

    setMessageInput('');

    try {
      await apiService.post('/private/chats/send', {
        chatId: selectedChat.id,
        text
      });
      // A mensagem voltará via Socket, então não precisamos adicionar manualmente
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      alert('Falha ao enviar mensagem');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const getFilteredChats = () => {
    // DEBUG: Filter Logic
    // console.log('Filtering chats. Tab:', activeTab, 'User:', user);

    if (activeTab === 'bot') {
      return chats.filter(c => c.status === 'bot');
    }
    if (activeTab === 'queue') {
      // Fila: Status 'attendant' mas sem atendente definido
      return chats.filter(c => c.status === 'attendant' && !c.attendantId);
    }
    if (activeTab === 'my_chats') {
      // Meus Chats: Status 'attendant' e meu ID (estrito)
      if (!user?.id) {
        console.warn('User ID missing for my_chats filter', user);
        return [];
      }
      return chats.filter(c => {
        const match = c.status === 'attendant' && Number(c.attendantId) === Number(user.id);
        // if (c.status === 'attendant') console.log(`Checking chat ${c.id}: attendantId=${c.attendantId} vs userId=${user.id} => ${match}`);
        return match;
      });
    }
    if (activeTab === 'history') {
      return chats.filter(c => c.status === 'finished');
    }
    return [];
  };

  const [isTakingOver, setIsTakingOver] = useState(false);

  const handleTakeover = async () => {
    if (!selectedChat || isTakingOver) return;
    setIsTakingOver(true);
    try {
      const response = await apiService.put(`/private/chats/${selectedChat.id}/takeover`);
      setSelectedChat(response.data);
      fetchChats();
      showToast({
        title: 'Sucesso',
        message: 'Você assumiu o atendimento deste chat.',
        variant: 'success'
      });
    } catch (error) {
      console.error('Erro ao assumir chat:', error);
      showToast({
        title: 'Erro',
        message: 'Falha ao assumir atendimento. Tente novamente.',
        variant: 'error'
      });
    } finally {
      setIsTakingOver(false);
    }
  };

  const handleFinish = async () => {
    if (!selectedChat || isFinishing) return;
    setIsFinishing(true);
    try {
      const response = await apiService.put(`/private/chats/${selectedChat.id}/finish`, {
        closingMessage: closingMessage.trim()
      });
      setSelectedChat(null);
      fetchChats();
      setShowFinishModal(false);
      showToast({
        title: 'Sucesso',
        message: 'Atendimento encerrado com sucesso.',
        variant: 'success'
      });
    } catch (error) {
      console.error('Erro ao encerrar chat:', error);
      showToast({
        title: 'Erro',
        message: 'Falha ao encerrar atendimento. Tente novamente.',
        variant: 'error'
      });
    } finally {
      setIsFinishing(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await apiService.get(`/private/organizations/${config.organizationId}/users`);
      setTransferUsers(response.data);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      showToast('Erro ao carregar lista de atendentes.', 'error');
    }
  };

  const handleOpenTransfer = () => {
    fetchUsers();
    setShowTransferModal(true);
  };

  const handleTransferChat = async () => {
    if (!selectedChat || !selectedTransferUser || isTransferring) return;

    // Transferir para o Bot (Reset)
    if (selectedTransferUser === 'bot') {
      if (!window.confirm('Tem certeza que deseja devolver esta conversa para o Bot?')) return;
      setIsTransferring(true);
      try {
        await apiService.put(`/private/chats/${selectedChat.id}/reset`);
        setSelectedChat(prev => ({ ...prev, status: 'bot', attendantId: null }));
        fetchChats();
        setShowTransferModal(false);
        showToast('Sucesso', 'Conversa retornada para o Bot.', 'success');
      } catch (error) {
        console.error('Erro ao resetar:', error);
        showToast('Erro', 'Falha ao retornar para o Bot.', 'error');
      } finally {
        setIsTransferring(false);
      }
      return;
    }

    // Transferir para outro atendente
    setIsTransferring(true);
    try {
      await apiService.put(`/private/chats/${selectedChat.id}/transfer`, {
        newAttendantId: selectedTransferUser
      });
      setShowTransferModal(false);
      fetchChats();
      setSelectedChat(prev => ({ ...prev, attendantId: selectedTransferUser }));
      showToast('Sucesso', 'Atendimento transferido!', 'success');
    } catch (error) {
      console.error('Erro ao transferir:', error);
      showToast('Erro', 'Falha ao transferir chat.', 'error');
    } finally {
      setIsTransferring(false);
    }
  };

  const handleCloseChatView = () => {
    setSelectedChat(null);
  };

  const handleClearConfig = () => {
    // Não limpa mais o storage, apenas abre o modal com o valor atual
    setShowConfigModal(true);
  };

  return (
    <div className="chat-container" style={themeStyles}>
      {/* Transfer Modal */}
      <Modal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        title="Transferir Atendimento"
      >
        <div style={{ padding: '20px', minHeight: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <p style={{ marginBottom: '16px' }}>Selecione o atendente para transferir esta conversa:</p>

            <Select
              placeholder="Selecione um atendente..."
              value={selectedTransferUser}
              onChange={(e) => setSelectedTransferUser(e.target.value)}
              options={[
                {
                  value: 'bot',
                  label: 'Devolver para a Fila do Bot (Reset)',
                  icon: <Bot />,
                  className: 'option-bot-reset'
                },
                ...transferUsers.map(u => ({
                  value: u.id,
                  label: ` ${u.name} (${u.email})`,
                  icon: <CircleUserRound size={18} className="text-gray-500" />,
                  className: 'option-transfer-user'
                }))
              ]}
              className="mb-8"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '40px' }}>
            <Button onClick={() => setShowTransferModal(false)} style={{ backgroundColor: isDark ? '#4b5563' : '#e5e7eb', color: currentTheme.textPrimary }}>Cancelar</Button>
            <Button onClick={handleTransferChat} disabled={!selectedTransferUser || isTransferring} className="btn-base btn-new">
              {isTransferring ? 'Transferindo...' : 'Transferir'}
            </Button>
          </div>
        </div>
      </Modal>
      {/* Configuration Modal */}
      {showConfigModal && (
        <div className="config-modal-overlay">
          <div className="config-modal">
            <div className="config-header">
              <Settings size={24} />
              <h2>Configuração do Chat</h2>
            </div>
            <form onSubmit={handleConfigSubmit}>
              <div className="config-body">
                <div className="form-group">
                  <label style={{ color: currentTheme.textPrimary }}>Selecione o Canal (Instância)</label>
                  <select
                    value={config.instanceId}
                    onChange={(e) => setConfig({ ...config, instanceId: e.target.value })}
                    required
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: `1px solid ${currentTheme.border}`, backgroundColor: currentTheme.inputBg || currentTheme.background, color: currentTheme.textPrimary }}
                  >
                    <option value="">Selecione...</option>
                    {instances.map(inst => (
                      <option key={inst.id} value={inst.id}>
                        {inst.name} ({inst.organizationName})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ color: currentTheme.textPrimary }}>Departamentos (Separar por vírgula)</label>
                  <input
                    type="text"
                    value={config.departments}
                    onChange={(e) => setConfig({ ...config, departments: e.target.value })}
                    placeholder="Ex: Suporte, Vendas, Financeiro"
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: `1px solid ${currentTheme.border}`, backgroundColor: currentTheme.inputBg || currentTheme.background, color: currentTheme.textPrimary }}
                  />
                  <small style={{ color: currentTheme.textSecondary, marginTop: '4px' }}>*CRUD de departamentos será implementado em breve.</small>
                </div>
                <div className="form-group">
                  <label style={{ color: currentTheme.textPrimary }}>Som de Notificação</label>
                  <select
                    value={config.sound || 'default'}
                    onChange={(e) => setConfig({ ...config, sound: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: `1px solid ${currentTheme.border}`, backgroundColor: currentTheme.inputBg || currentTheme.background, color: currentTheme.textPrimary }}
                  >
                    {AVAILABLE_SOUNDS.map(sound => (
                      <option key={sound.id} value={sound.id}>
                        {sound.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="config-footer" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', backgroundColor: currentTheme.cardBackground, borderTop: `1px solid ${currentTheme.border}` }}>
                <button
                  type="button"
                  onClick={() => playNotificationSound(config.sound)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '6px',
                    border: `1px solid ${currentTheme.border}`,
                    backgroundColor: isDark ? '#374151' : '#f8f9fa',
                    color: currentTheme.textPrimary,
                    cursor: 'pointer'
                  }}
                >
                  Testar Som
                </button>
                <button type="submit" className="config-btn" disabled={!config.instanceId}>
                  Entrar no Chat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Left Sidebar */}
      <div className="chat-sidebar">


        <div style={{ padding: '0 10px', display: 'flex', gap: '8px', alignItems: 'center', height: '64px', borderBottom: `1px solid ${currentTheme.border}` }}>
          <button
            onClick={handleClearConfig}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: currentTheme.textSecondary }}
            title="Trocar Canal"
          >
            <Settings size={30} />
          </button>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: currentTheme.textSecondary }} />
            <input
              type="text"
              placeholder="Buscar contatos..."
              style={{
                width: '100%',
                padding: '8px 8px 8px 32px',
                borderRadius: '20px',
                border: `1px solid ${currentTheme.border}`,
                backgroundColor: isDark ? '#374151' : '#f0f2f5',
                color: currentTheme.textPrimary,
                outline: 'none'
              }}
            />
          </div>
          <button
            onClick={handleOpenStartChat}
            title="Iniciar Nova Conversa"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#4bce97',
              color: 'white',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="sidebar-tabs">
          <button
            className={`sidebar-tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
            title="Histórico"
          >
            <Clock size={26} />
            <span
              className="tab-badge"
              style={{
                backgroundColor: socketConnected ? '#4bce97' : '#ff4d4f',
                width: '10px',
                height: '10px',
                padding: 0,
                minWidth: 'unset',
                border: `1px solid ${currentTheme.cardBackground}`
              }}
              title={socketConnected ? 'Socket Conectado' : 'Socket Desconectado'}
            />
          </button>
          <button
            className={`sidebar-tab ${activeTab === 'bot' ? 'active' : ''}`}
            onClick={() => setActiveTab('bot')}
            title="Bot"
          >
            <Bot size={26} />
            {chats.filter(c => c.status === 'bot').length > 0 && (
              <span className="tab-badge">{chats.filter(c => c.status === 'bot').length}</span>
            )}
          </button>
          <button
            className={`sidebar-tab ${activeTab === 'queue' ? 'active' : ''}`}
            onClick={() => setActiveTab('queue')}
            title="Fila"
          >
            <MessagesSquare size={26} />
            {chats.filter(c => c.status === 'attendant' && !c.attendantId).length > 0 && (
              <span className="tab-badge">{chats.filter(c => c.status === 'attendant' && !c.attendantId).length}</span>
            )}
          </button>
          <button
            className={`sidebar-tab ${activeTab === 'my_chats' ? 'active' : ''}`}
            onClick={() => setActiveTab('my_chats')}
            title="Meus"
          >
            <Headset size={26} />
            {chats.filter(c => c.status === 'attendant' && Number(c.attendantId) === Number(user?.id) && c.unreadCount > 0).length > 0 && (
              <span className="tab-badge">{chats.filter(c => c.status === 'attendant' && Number(c.attendantId) === Number(user?.id) && c.unreadCount > 0).length}</span>
            )}
          </button>
        </div>

        <div className="contact-list">


          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: currentTheme.textSecondary }}>
              Carregando conversas...
            </div>
          ) : getFilteredChats().length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: currentTheme.textSecondary, fontSize: '14px' }}>
              Nenhum contato encontrado nesta aba.
            </div>
          ) : (
            getFilteredChats().map(chat => (
              <div
                key={chat.id}
                className={`contact-item ${selectedChat?.id === chat.id ? 'active' : ''}`}
                onClick={() => setSelectedChat(chat)}
              >
                <div className="contact-avatar">
                  <User size={20} />
                </div>
                <div className="contact-info">
                  <div className="contact-name">{chat.name || chat.externalId.split('@')[0]}</div>
                  <div className="contact-preview">{chat.lastMessage}</div>
                </div>
                <div className="contact-meta">
                  {new Date(chat.dateUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="chat-main" style={{ display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>
        {selectedChat ? (
          <>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%' }}>
              <div className="chat-header">
                <div className="chat-header-info">
                  <div className="contact-avatar" style={{ width: '40px', height: '40px' }}>
                    <User size={18} />
                  </div>
                  <div>
                    <div
                      style={{ fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                      onClick={() => setShowClientInfo(!showClientInfo)}
                      title="Ver informações do cliente"
                    >
                      {selectedChat.name || selectedChat.externalId.split('@')[0]}
                      <Info size={14} color={currentTheme.textSecondary} />
                    </div>
                    <div style={{ fontSize: '12px', color: currentTheme.textSecondary }}>
                      {selectedChat.instance?.name || 'Instância Ativa'} • Status: {selectedChat.status}
                      {selectedChat.status === 'attendant' && selectedChat.attendant?.name && ` • Atendente: ${selectedChat.attendant.name}`}
                      {selectedChat.protocol && ` • Protocolo: ${selectedChat.protocol}`}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {(selectedChat.status === 'bot' || selectedChat.status === 'attendant') && (
                    <>
                      <button
                        onClick={() => setShowFinishModal(true)}
                        disabled={selectedChat.status === 'bot' || (selectedChat.status === 'attendant' && !selectedChat.attendantId)}
                        title="Finalizar Atendimento"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          padding: '6px',
                          cursor: (selectedChat.status === 'bot' || (selectedChat.status === 'attendant' && !selectedChat.attendantId)) ? 'not-allowed' : 'pointer',
                          opacity: (selectedChat.status === 'bot' || (selectedChat.status === 'attendant' && !selectedChat.attendantId)) ? 0.5 : 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <CircleCheck size={20} color="#ff4d4f" />
                      </button>

                      <button
                        onClick={handleOpenTransfer}
                        disabled={selectedChat.status === 'bot' || (selectedChat.status === 'attendant' && !selectedChat.attendantId)}
                        title="Transferir Atendimento"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          padding: '6px',
                          cursor: (selectedChat.status === 'bot' || (selectedChat.status === 'attendant' && !selectedChat.attendantId)) ? 'not-allowed' : 'pointer',
                          opacity: (selectedChat.status === 'bot' || (selectedChat.status === 'attendant' && !selectedChat.attendantId)) ? 0.5 : 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <CircleUserRound size={20} color="#0084ff" />
                      </button>

                      <button
                        onClick={handleCloseChatView}
                        title="Fechar Conversa (Voltar ao Início)"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          padding: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <CircleX size={20} color="#f59e0b" />
                      </button>
                    </>
                  )}
                  {selectedChat.status === 'bot' && (
                    <button
                      onClick={handleTakeover}
                      disabled={isTakingOver}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: isTakingOver ? '#ccc' : '#4bce97',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: isTakingOver ? 'not-allowed' : 'pointer',
                        fontSize: '13px',
                        fontWeight: '600'
                      }}
                    >
                      {isTakingOver ? 'Assumindo...' : 'Assumir Atendimento'}
                    </button>
                  )}
                  <button
                    onClick={() => setShowSearch(!showSearch)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Search size={20} style={{ color: showSearch ? '#ff4d4f' : '#0084ff' }} />
                  </button>
                </div>
              </div>

              {showSearch && (
                <div style={{ padding: '10px', backgroundColor: currentTheme.background, borderBottom: `1px solid ${currentTheme.border}` }}>
                  <input
                    type="text"
                    placeholder="Pesquisar na conversa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '6px',
                      border: `1px solid ${currentTheme.border}`,
                      backgroundColor: currentTheme.inputBg || currentTheme.background,
                      color: currentTheme.textPrimary,
                      outline: 'none'
                    }}
                    autoFocus
                  />
                </div>
              )}

              <div className="chat-messages" ref={chatContainerRef}>
                {hasMore && !searchTerm && (
                  <div style={{ textAlign: 'center', padding: '10px' }}>
                    <button
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      style={{
                        background: 'transparent',
                        border: '1px solid #ddd',
                        borderRadius: '12px',
                        padding: '4px 12px',
                        color: '#666',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      {loadingMore ? 'Carregando...' : 'Carregar mensagens anteriores'}
                    </button>
                  </div>
                )}

                {(searchTerm ? messages.filter(m => m.text?.toLowerCase().includes(searchTerm.toLowerCase())) : messages).map(msg => (
                  <div key={msg.id} className={`message ${msg.sender === 'me' ? 'sent' : 'received'}`}>
                    {msg.type === 'event' ? (
                      <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        width: '100%',
                        padding: '4px 0',
                        margin: '8px 0'
                      }}>
                        <span style={{
                          backgroundColor: isDark ? '#1f2937' : '#f0f2f5',
                          color: currentTheme.textSecondary,
                          fontSize: '11px',
                          fontWeight: '500',
                          padding: '4px 12px',
                          borderRadius: '8px',
                          textAlign: 'center',
                          boxShadow: currentTheme.shadow,
                          whiteSpace: 'pre-line'
                        }}>
                          {msg.text}
                        </span>
                      </div>
                    ) : (
                      <>
                        {msg.type === 'image' && (
                          <img src={msg.text} alt="Imagem" style={{ maxWidth: '100%', borderRadius: '8px', marginBottom: '4px' }} />
                        )}
                        {msg.type === 'video' && (
                          <video src={msg.text} controls style={{ maxWidth: '100%', borderRadius: '8px', marginBottom: '4px' }} />
                        )}
                        {msg.type === 'audio' && (
                          <audio src={msg.text} controls style={{ width: '240px', marginBottom: '4px' }} />
                        )}
                        {msg.type === 'document' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderRadius: '8px', marginBottom: '4px', color: currentTheme.textPrimary }}>
                            <FileText size={24} />
                            <a href={msg.text} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none', fontWeight: '500', wordBreak: 'break-all' }}>
                              {msg.text.split('/').pop()}
                            </a>
                          </div>
                        )}

                        {(msg.type === 'text' || (msg.type !== 'event' && msg.text && !msg.text.includes('/uploads/'))) && (
                          <div>{msg.text}</div>
                        )}

                        <div className="message-time">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {(selectedChat.status === 'attendant' && !selectedChat.attendantId) || selectedChat.status === 'bot' ? (
                <div style={{
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: currentTheme.backgroundSecondary || currentTheme.background,
                  borderTop: `1px solid ${currentTheme.border}`
                }}>
                  {selectedChat.status === 'bot' && (
                    <p style={{ color: currentTheme.textSecondary, fontSize: '14px', margin: 0 }}>
                      <Bot size={16} style={{ verticalAlign: 'middle', marginRight: '5px' }} />
                      O robô está atendendo esta conversa.
                    </p>
                  )}
                  <Button
                    onClick={handleTakeover}
                    disabled={isTakingOver}
                    style={{
                      padding: '12px 32px',
                      fontSize: '16px',
                      backgroundColor: '#4bce97',
                      color: 'white',
                      height: 'auto'
                    }}
                  >
                    {isTakingOver ? 'Iniciando...' : 'Assumir Atendimento'}
                  </Button>
                </div>
              ) : (
                <>
                  {selectedChat.status === 'finished' && (
                    <div style={{
                      padding: '10px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: isDark ? '#4c1d1d' : '#fff1f0',
                      borderTop: `1px solid ${currentTheme.border}`
                    }}>
                      <Button
                        onClick={handleTakeover}
                        disabled={isTakingOver}
                        className="btn-base btn-new-orange"
                      >
                        {isTakingOver ? 'Reabrindo...' : 'Reabrir Atendimento'}
                      </Button>
                    </div>
                  )}
                  {selectedChat.status !== 'finished' && (
                    <form className="chat-input-area" onSubmit={handleSendMessage} style={{ flexDirection: 'column', gap: 0, padding: '10px', position: 'relative' }}>

                      {/* Attach Menu */}
                      {showAttachMenu && (
                        <div style={{
                          position: 'absolute',
                          bottom: '70px',
                          left: '60px',
                          backgroundColor: currentTheme.cardBackground,
                          boxShadow: currentTheme.shadowLg,
                          borderRadius: '8px',
                          padding: '10px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          zIndex: 10,
                          border: `1px solid ${currentTheme.border}`
                        }}>
                          <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleFileUpload}
                          />

                          <button type="button" onClick={() => { fileInputRef.current.accept = 'image/*'; fileInputRef.current.click(); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', border: 'none', background: 'transparent', cursor: 'pointer', padding: '8px', width: '100%', textAlign: 'left', borderRadius: '4px', color: currentTheme.textPrimary, transition: 'background 0.2s' }} onMouseEnter={e => e.target.style.backgroundColor = isDark ? '#374151' : '#f5f5f5'} onMouseLeave={e => e.target.style.backgroundColor = 'transparent'}>
                            <ImageIcon size={20} color="#007bff" /> Imagem
                          </button>
                          <button type="button" onClick={() => { fileInputRef.current.accept = 'video/*'; fileInputRef.current.click(); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', border: 'none', background: 'transparent', cursor: 'pointer', padding: '8px', width: '100%', textAlign: 'left', borderRadius: '4px', color: currentTheme.textPrimary, transition: 'background 0.2s' }} onMouseEnter={e => e.target.style.backgroundColor = isDark ? '#374151' : '#f5f5f5'} onMouseLeave={e => e.target.style.backgroundColor = 'transparent'}>
                            <FileVideo size={20} color="#dc3545" /> Vídeo
                          </button>
                          <button type="button" onClick={() => { fileInputRef.current.accept = 'audio/*'; fileInputRef.current.click(); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', border: 'none', background: 'transparent', cursor: 'pointer', padding: '8px', width: '100%', textAlign: 'left', borderRadius: '4px', color: currentTheme.textPrimary, transition: 'background 0.2s' }} onMouseEnter={e => e.target.style.backgroundColor = isDark ? '#374151' : '#f5f5f5'} onMouseLeave={e => e.target.style.backgroundColor = 'transparent'}>
                            <FileAudio size={20} color="#28a745" /> Áudio
                          </button>
                          <button type="button" onClick={() => { fileInputRef.current.accept = '.pdf,.doc,.docx,.xls,.xlsx'; fileInputRef.current.click(); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', border: 'none', background: 'transparent', cursor: 'pointer', padding: '8px', width: '100%', textAlign: 'left', borderRadius: '4px', color: currentTheme.textPrimary, transition: 'background 0.2s' }} onMouseEnter={e => e.target.style.backgroundColor = isDark ? '#374151' : '#f5f5f5'} onMouseLeave={e => e.target.style.backgroundColor = 'transparent'}>
                            <FileText size={20} color="#6f42c1" /> Documento
                          </button>
                        </div>
                      )}

                      {/* Emoji Picker */}
                      {showEmojiPicker && (
                        <div style={{ position: 'absolute', bottom: '70px', left: '10px', zIndex: 10 }}>
                          <EmojiPicker onEmojiClick={handleEmojiClick} />
                        </div>
                      )}

                      <div style={{ display: 'flex', width: '100%', alignItems: 'center', gap: '10px' }}>
                        {isRecording ? (
                          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ff4d4f' }}>
                              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ff4d4f', animation: 'pulse 1.5s infinite' }} />
                              <span style={{ fontWeight: '600' }}>{formatTime(recordingTime)}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                              <button
                                onClick={cancelRecording}
                                style={{
                                  background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px',
                                  color: '#ff4d4f'
                                }}
                                title="Cancelar"
                              >
                                <Trash2 size={24} />
                              </button>
                              <button
                                onClick={stopRecording}
                                style={{
                                  background: '#0084ff', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '50%',
                                  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}
                                title="Enviar"
                              >
                                <SendIcon size={20} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <button
                              className="action-button"
                              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                              title="Emojis"
                            >
                              <Smile size={24} />
                            </button>

                            <button
                              className="action-button"
                              onClick={() => setSignMessage(!signMessage)}
                              title={`Assinar como ${user?.name || 'Atendente'}`}
                            >
                              <CircleCheckBig size={24} color={signMessage ? '#4bce97' : '#54656f'} />
                            </button>

                            <button
                              className="action-button"
                              onClick={() => setShowAttachMenu(!showAttachMenu)}
                              title="Anexar"
                            >
                              <Paperclip size={24} />
                            </button>

                            <input
                              ref={inputRef}
                              type="text"
                              placeholder="Digite uma mensagem"
                              className="chat-input"
                              value={messageInput}
                              onChange={(e) => setMessageInput(e.target.value)}
                              onKeyPress={handleKeyPress}
                            />

                            <button className="action-button" onClick={startRecording} title="Gravar Áudio">
                              <Mic size={24} />
                            </button>

                            <button className="action-button" onClick={handleSendMessage} disabled={!messageInput.trim()} title="Enviar Mensagem">
                              <SendIcon size={24} color={messageInput.trim() ? '#0084ff' : '#ccc'} />
                            </button>
                          </>
                        )}
                      </div>
                    </form>
                  )}
                </>
              )}
            </div>
            {showClientInfo && (
              <ChatClientInfo
                chat={selectedChat}
                currentTheme={currentTheme}
                onClose={() => setShowClientInfo(false)}
              />
            )}
          </>
        ) : (
          <div className="chat-empty-state">
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>💬</div>
            <h2>Bem-vindo ao Chat Sendd</h2>
            <p>Selecione um contato para iniciar o atendimento.</p>
          </div>
        )}
      </div>

      <Modal
        isOpen={showFinishModal}
        onClose={() => !isFinishing && setShowFinishModal(false)}
        title="Encerrar Atendimento"
        size="sm"
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{
            backgroundColor: isDark ? '#4c1d1d' : '#fff1f0',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            color: '#ff4d4f'
          }}>
            <AlertTriangle size={32} />
          </div>
          <p style={{ fontSize: '16px', color: currentTheme.textPrimary, marginBottom: '8px', fontWeight: '600' }}>
            Deseja realmente encerrar este atendimento?
          </p>
          <p style={{ fontSize: '14px', color: currentTheme.textSecondary, marginBottom: '24px' }}>
            A conversa será movida para o histórico e o robô voltará a responder automaticamente.
          </p>

          <div style={{ marginBottom: '24px', textAlign: 'left' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: currentTheme.textSecondary, marginBottom: '6px', display: 'block' }}>
              Mensagem de Encerramento (Opcional)
            </label>
            <textarea
              value={closingMessage}
              onChange={(e) => setClosingMessage(e.target.value)}
              placeholder="Ex: Obrigado pelo contato, tenha um bom dia!"
              style={{
                width: '100%',
                height: '80px',
                padding: '8px',
                borderRadius: '6px',
                border: `1px solid ${currentTheme.border}`,
                backgroundColor: currentTheme.background,
                color: currentTheme.textPrimary,
                fontSize: '14px',
                resize: 'none'
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Button
              variant="outline"
              onClick={() => setShowFinishModal(false)}
              disabled={isFinishing}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleFinish}
              loading={isFinishing}
            >
              Confirmar e Encerrar
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showStartChatModal}
        onClose={() => setShowStartChatModal(false)}
        title="Iniciar Nova Conversa"
        size="md"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '10px', borderBottom: `1px solid ${currentTheme.border}` }}>
            <button
              style={{
                padding: '10px 16px',
                borderBottom: startChatTab === 'contacts' ? '2px solid #4bce97' : '2px solid transparent',
                color: startChatTab === 'contacts' ? '#4bce97' : currentTheme.textSecondary,
                background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                cursor: 'pointer', fontWeight: '500'
              }}
              onClick={() => setStartChatTab('contacts')}
            >
              Contatos Salvos
            </button>
            <button
              style={{
                padding: '10px 16px',
                borderBottom: startChatTab === 'manual' ? '2px solid #4bce97' : '2px solid transparent',
                color: startChatTab === 'manual' ? '#4bce97' : currentTheme.textSecondary,
                background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                cursor: 'pointer', fontWeight: '500'
              }}
              onClick={() => setStartChatTab('manual')}
            >
              Digitando Número
            </button>
          </div>

          {startChatTab === 'manual' ? (
            <div style={{ padding: '20px 0' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: currentTheme.textPrimary }}>WhatsApp com DDD (somente números)</label>
              <input
                type="text"
                placeholder="Ex: 85999999999"
                value={newChatNumber}
                onChange={(e) => setNewChatNumber(e.target.value.replace(/\D/g, ''))}
                style={{
                  width: '100%', padding: '10px', fontSize: '16px',
                  borderRadius: '6px', border: `1px solid ${currentTheme.border}`, marginBottom: '16px',
                  backgroundColor: currentTheme.background, color: currentTheme.textPrimary
                }}
              />
              <Button
                onClick={() => handleStartChat(null, newChatNumber)}
                disabled={creatingChat || newChatNumber.length < 10}
                loading={creatingChat}
                style={{ width: '100%', backgroundColor: '#4bce97' }}
              >
                Iniciar Conversa
              </Button>
            </div>
          ) : (
            <div style={{ padding: '10px 0', minHeight: '300px' }}>
              <div style={{ position: 'relative', marginBottom: '16px' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: '#999' }} />
                <input
                  type="text"
                  placeholder="Filtrar contatos..."
                  value={clientSearchTerm}
                  onChange={(e) => setClientSearchTerm(e.target.value)}
                  style={{
                    width: '100%', padding: '8px 8px 8px 32px',
                    borderRadius: '20px', border: `1px solid ${currentTheme.border}`, outline: 'none',
                    backgroundColor: currentTheme.background, color: currentTheme.textPrimary
                  }}
                />
              </div>
              {loadingClients ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>Carregando...</div>
              ) : (
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {availableClients
                    .filter(c =>
                      !clientSearchTerm ||
                      (c.name && c.name.toLowerCase().includes(clientSearchTerm.toLowerCase())) ||
                      (c.cellphone && c.cellphone.includes(clientSearchTerm))
                    )
                    .map(client => (
                      <div
                        key={client.id}
                        onClick={() => handleStartChat(client.id)}
                        style={{
                          padding: '10px', borderBottom: `1px solid ${currentTheme.border}`,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
                          transition: 'background 0.2s',
                          color: currentTheme.textPrimary
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? '#374151' : '#f9f9f9'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: currentTheme.borderLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <User size={16} color={currentTheme.textSecondary} />
                        </div>
                        <div>
                          <div style={{ fontWeight: '500' }}>{client.name || 'Sem Nome'}</div>
                          <div style={{ fontSize: '12px', color: currentTheme.textSecondary }}>{client.cellphone || client.phone}</div>
                        </div>
                        <div style={{ marginLeft: 'auto' }}>
                          <Button size="sm" variant="outline" style={{ fontSize: '12px', padding: '4px 8px' }}>Iniciar</Button>
                        </div>
                      </div>
                    ))}
                  {availableClients.length === 0 && <div style={{ textAlign: 'center', padding: '20px', color: currentTheme.textSecondary }}>Nenhum contato salvo.</div>}
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Third Div (Placeholder/Hidden for now as requested) */}
      {/*
      <div className="chat-info-sidebar" style={{display: 'none'}}>
         Info
      </div> 
      */}
    </div >
  );
};

export default Chat;
