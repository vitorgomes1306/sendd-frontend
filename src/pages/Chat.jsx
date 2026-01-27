import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import EmojiPicker from 'emoji-picker-react';
import { useTheme } from '../contexts/ThemeContext';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import '../styles/buttons.css';
import { io } from 'socket.io-client';
import logoSenddDark from '../../src/assets/img/sendd1.png';
import logoSenddLight from '../../src/assets/img/sendd2.png';
import '../styles/buttons.css'
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
  Info,
  ArrowLeft,
  CheckCheck,
  Tag as TagIcon
} from 'lucide-react';
import './Chat.css';
import { Play, X } from 'lucide-react';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import ChatClientInfo from './ChatClientInfo';
import usePageTitleBadge from '../hooks/usePageTitleBadge';
import { useToast } from '../contexts/ToastContext';
import { playNotificationSound, AVAILABLE_SOUNDS } from '../utils/sounds';

// Configuração do socket
const getSocketUrl = () => {
  if (import.meta.env.DEV) {
    // CRITICAL FIX: Conectar na origem atual (ex: 192.168.x.x:4500) para usar o Proxy do Vite.
    // 'localhost' só funciona na própria máquina. Se usar localhost no celular, falha.
    return window.location.origin;
  }
  return 'https://api.sendd.altersoft.dev.br';
};

const socket = io(getSocketUrl(), {
  withCredentials: true,
  autoConnect: false,
  transports: ['websocket', 'polling']
});

// Internal Component for Avatar
const ChatAvatar = ({ chat, config, instances = [] }) => {
  const [picUrl, setPicUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchPic = async () => {
      if (!chat) return;
      const number = chat.remoteJid ? chat.remoteJid.split('@')[0] : '';

      // Fallback logic for instanceName
      // 1. chat.instance object from backend
      // 2. Lookup in global instances list by chat.instanceId
      // 3. Config instanceName (last resort)
      let instanceName = chat.instance?.instanceName || chat.instance?.name;

      if (!instanceName && chat.instanceId) {
        const found = instances.find(i => Number(i.id) === Number(chat.instanceId));
        if (found) instanceName = found.instanceName || found.name;
      }

      if (!instanceName) instanceName = config.instanceName;

      if (instanceName && number) {
        try {
          // Try to use cache if available (could add simple cache object later)
          const res = await apiService.get(`/private/chats/profile-picture/${instanceName}?number=${number}`);
          if (mounted && res.data && res.data.pictureUrl) {
            setPicUrl(res.data.pictureUrl);
          } else {
            // Only log failure/empty to avoid noise
            // console.log('[ChatAvatar] No pic for', number);
          }
        } catch (e) {
          // Silent fail for avatar
        }
      } else {
        console.log('[ChatAvatar] Missing data:', { instanceName, number, chatInstance: chat.instance });
      }
      if (mounted) setLoading(false);
    };
    fetchPic();
    return () => { mounted = false; };
  }, [chat?.id, chat?.remoteJid, config?.instanceName, chat?.instanceId, instances, chat?.instance?.instanceName]); // Re-fetch if chat identity changes

  if (picUrl) {
    return (
      <img
        src={picUrl}
        alt="Avatar"
        style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
        onError={(e) => { e.target.style.display = 'none'; setPicUrl(null); }}
      />
    );
  }

  return <User size={20} />;
};

const Chat = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentTheme, isDark } = useTheme();
  const { user } = useAuth();
  const [availableDepartments, setAvailableDepartments] = useState([]);
  const [departmentCache, setDepartmentCache] = useState({}); // Cache para departamentos por setor

  // Slash Commands
  const [templates, setTemplates] = useState([]);
  const [slashMenu, setSlashMenu] = useState({
    isOpen: false,
    filter: '',
    activeIndex: 0
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await apiService.getTemplates({ limit: 100 });
      setTemplates(response.data.data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };
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

  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarSearchTerm, setSidebarSearchTerm] = useState('');

  // Chat State
  const [activeTab, setActiveTab] = useState('history'); // history, bot, queue, my_chats
  const [selectedChat, setSelectedChat] = useState(null);
  const [chats, setChats] = useState([]);
  const totalUnread = chats.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  usePageTitleBadge(totalUnread);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [closingMessage, setClosingMessage] = useState('');
  const [sendFinishedMessage, setSendFinishedMessage] = useState(true); // Default true
  const [signMessage, setSignMessage] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferOptions, setTransferOptions] = useState([]);
  const [transferType, setTransferType] = useState('user'); // 'user', 'department', 'general'
  const [selectedTransferTarget, setSelectedTransferTarget] = useState('');
  const [transferNotify, setTransferNotify] = useState(false);
  const [transferObservation, setTransferObservation] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [showClientInfo, setShowClientInfo] = useState(false);
  const [viewingMedia, setViewingMedia] = useState(null); // { url, type }
  const [mediaPreview, setMediaPreview] = useState(null); // { file, url, type, name, mimeType }
  const [mediaCaption, setMediaCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Tags & Profile Pic
  const [profilePicUrl, setProfilePicUrl] = useState(null);
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedTagFilter, setSelectedTagFilter] = useState('');
  const [showCheckTagsModal, setShowCheckTagsModal] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#000000');

  // Mobile Support
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Context Menu State
  const [activeMenuChatId, setActiveMenuChatId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuChatId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleToggleMenu = (e, chatId) => {
    e.stopPropagation(); // Prevent chat selection
    setActiveMenuChatId(prev => prev === chatId ? null : chatId);
  };

  const handleMarkAsRead = async (e, chat) => {
    e.stopPropagation();
    setActiveMenuChatId(null);
    try {
      await apiService.put(`/private/chats/${chat.id}/read`);
      // Update local state locally for immediate feedback
      setChats(prev => prev.map(c => c.id === chat.id ? { ...c, unreadCount: 0 } : c));
      // Force refresh from backend to be sure
      fetchChats();
    } catch (error) {
      console.error('Error marking as read:', error);
      showToast('Erro ao marcar como lido', 'error');
    }
  };

  const handleFinishFromList = async (e, chat) => {
    e.stopPropagation();
    setActiveMenuChatId(null);

    // Adapted handleFinish logic for list item
    if (!window.confirm(`Deseja encerrar o atendimento de ${chat.name || chat.externalId}?`)) return;

    try {
      await apiService.put(`/private/chats/${chat.id}/finish`, {
        closingMessage: '' // No closing message from list quick action? Or default?
      });

      // If current selected chat is the one being finished, deselect it?
      if (selectedChat?.id === chat.id) {
        setSelectedChat(null);
        setShowFinishModal(false);
      }

      fetchChats();
      showToast({
        title: 'Sucesso',
        message: 'Atendimento encerrado.',
        variant: 'success'
      });
    } catch (error) {
      console.error('Erro ao encerrar chat:', error);
      showToast({
        title: 'Erro',
        message: 'Falha ao encerrar atendimento.',
        variant: 'error'
      });
    }
  };

  const handleDeleteChat = async (e, chat) => {
    e.stopPropagation();
    setActiveMenuChatId(null);

    // Critical Confirmation
    if (!window.confirm(`ATENÇÃO: Deseja EXCLUIR PERMANENTEMENTE o chat de ${chat.name || chat.externalId}?\n\nEsta ação não pode ser desfeita e todo o histórico será perdido.`)) return;

    try {
      await apiService.delete(`/private/chats/${chat.id}`);

      if (selectedChat?.id === chat.id) {
        setSelectedChat(null);
      }

      // Remove from local list immediately
      setChats(prev => prev.filter(c => c.id !== chat.id));

      showToast({
        title: 'Sucesso',
        message: 'Chat excluído permanentemente.',
        variant: 'success'
      });
    } catch (error) {
      console.error('Erro ao excluir chat:', error);
      showToast({
        title: 'Erro',
        message: error.response?.data?.error || 'Falha ao excluir chat.',
        variant: 'error'
      });
    }
  };

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
  const chatsRef = useRef(chats);
  const configRef = useRef(config);
  const userRef = useRef(user);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

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

  // Auto-start chat from navigation state (e.g. from External Reports)
  useEffect(() => {
    if (location.state?.startChat) {
      const { number } = location.state.startChat;
      const { autoTag } = location.state;
      if (number) {
        console.log('[Chat] Auto-starting chat with:', number);
        handleStartChat(null, number, { autoTag });
      }
      // Clear state to prevent loop/re-run
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);

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
          setSelectedChat(prev => {
            if (!prev) return null;
            return { ...prev, status: data.status, attendantId: data.attendantId, departmentId: data.departmentId };
          });
        }

        // Caso 1: Chat entrou na Fila (attendant sem id)
        if (data.status === 'attendant' && !data.attendantId) {
          playNotificationSound();
        }

        // Caso 2: Chat atribuído diretamente a MIM (Notificação sonora + Toast)
        if (data.status === 'attendant' && data.attendantId && userRef.current && Number(data.attendantId) === Number(userRef.current.id)) {
          playNotificationSound(configRef.current?.sound);
          showToast({
            title: 'Novo Atendimento',
            message: 'Você recebeu um novo atendimento.',
            variant: 'success'
          });
        }

        fetchChats();
      });

      socket.on('message_status_updated', (data) => {
        //   console.log('[Socket] Status da mensagem atualizado:', data);
        if (selectedChatRef.current && data.chatId === selectedChatRef.current.id) {
          setMessages(prev => prev.map(m =>
            m.id === data.messageId ? { ...m, status: data.status } : m
          ));
        }
      });

      return () => {
        socket.off('new_message');
        socket.off('chat_status_updated');
        socket.off('message_status_updated');
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

  // Format phone number helper
  const formatPhoneNumber = (jid) => {
    if (!jid) return '';
    let number = jid.split('@')[0];

    // Check if it is a BR number (starts with 55 and has valid length)
    // BR numbers usually: 55 + 2 DDD + 8 or 9 digits = 12 or 13 digits
    if (number.startsWith('55') && (number.length === 12 || number.length === 13)) {
      // Remove country code for display
      number = number.substring(2);

      const ddd = number.substring(0, 2);
      const rest = number.substring(2);

      if (rest.length === 9) {
        // Cellular: (XX) X XXXX-XXXX
        // rest: 9 8888 7777 -> 9 8888-7777
        return `(${ddd}) ${rest.substring(0, 1)} ${rest.substring(1, 5)}-${rest.substring(5)}`;
      } else if (rest.length === 8) {
        // Fixed: (XX) XXXX-XXXX
        return `(${ddd}) ${rest.substring(0, 4)}-${rest.substring(4)}`;
      }
    }

    return number;
  };

  // Fetch Profile Picture when Chat Selected
  useEffect(() => {
    const fetchPic = async () => {
      if (selectedChat && selectedChat.externalId) {
        const number = selectedChat.externalId.split('@')[0];
        // Use instanceName from the related instance object. 
        // Note: In getChats, we selected { name: true, instanceName: true }.
        // Sometimes 'name' is the friendly name and 'instanceName' is the ID used in Evolution.
        const instanceName = selectedChat.instance?.instanceName || selectedChat.instance?.name || config.instanceName;

        console.log('[ProfilePic] Fetching for:', { number, instanceName, chatInstance: selectedChat.instance });

        if (instanceName && number) {
          try {
            const res = await apiService.get(`/private/chats/profile-picture/${instanceName}?number=${number}`);
            console.log('[ProfilePic] Result:', res.data);
            if (res.data && res.data.pictureUrl) {
              setProfilePicUrl(res.data.pictureUrl);
            } else {
              setProfilePicUrl(null);
            }
          } catch (e) {
            console.error("Error fetching profile pic:", e);
            setProfilePicUrl(null);
          }
        } else {
          console.warn('[ProfilePic] Missing instanceName or number');
        }
      } else {
        setProfilePicUrl(null);
      }
    };
    fetchPic();
  }, [selectedChat, config]);

  // Fetch Tags on mount
  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const res = await apiService.get('/private/tags');
      setAvailableTags(res.data || []);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  // Main fetchChats with filter (including tags)
  const fetchChats = useCallback(async (options = {}) => {
    // Blocking if loading might cause missed updates if events are rapid
    // if (loading) return; 
    setLoading(true);
    try {
      // Use ref to avoid stale closure if called from socket
      const cfg = configRef.current || config;
      const orgId = cfg.organizationId;

      if (!orgId) {
        console.warn("[Chat] fetchChats abortado: sem organizationId");
        return;
      }

      console.log('[Chat] Buscando chats para org:', orgId, 'Depts:', cfg.departments);
      const params = { organizationId: orgId };

      // Add department filter if configured
      if (cfg.departments) {
        if (Array.isArray(cfg.departments) && cfg.departments.length > 0) {
          params.departmentIds = cfg.departments.join(',');
        } else if (typeof cfg.departments === 'string' && cfg.departments.trim()) {
          params.departmentIds = cfg.departments;
        }
      }

      // Add instance filter
      if (cfg.instanceId) {
        params.instanceId = cfg.instanceId;
      }

      // Add tag filter
      if (selectedTagFilter) {
        params.tagId = selectedTagFilter;
      }

      const response = await apiService.get('/private/chats', { params });
      const data = response.data;
      console.log('[Chat] Chats recebidos (Raw):', data);

      const chatsArray = Array.isArray(data) ? data : (data.data || []);
      if (chatsArray.length > 0) {
        console.log('[Chat] Exemplo de Chat[0].instance:', chatsArray[0].instance);
      } else {
        console.log('[Chat] Nenhum chat retornado.');
      }

      setChats(chatsArray);
    } catch (error) {
      console.error('Erro ao buscar chats:', error);
    } finally {
      setLoading(false);
    }
  }, [config, showConfigModal, selectedTagFilter]);

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    try {
      const response = await apiService.post('/private/tags', { name: newTagName, color: newTagColor });
      // Refresh tags
      const tagsRes = await apiService.get('/private/tags');
      setAvailableTags(tagsRes.data);
      setNewTagName('');
      setNewTagColor('#000000');
    } catch (error) {
      console.error('Error creating tag:', error);
      showToast({ title: 'Erro', message: 'Erro ao criar tag.', variant: 'error' });
    }
  };

  const handleDeleteTag = async (tagId) => {
    if (!window.confirm('Tem certeza que deseja excluir esta tag permanentemente?')) return;
    try {
      await apiService.delete(`/private/tags/${tagId}`);
      const tagsRes = await apiService.get('/private/tags');
      setAvailableTags(tagsRes.data);
      // Remove from current selection if present
      if (selectedChat?.tags?.some(t => t.id === tagId)) {
        setSelectedChat(prev => ({ ...prev, tags: prev.tags?.filter(t => t.id !== tagId) }));
      }
      showToast({ title: 'Sucesso', message: 'Tag excluída com sucesso.', variant: 'success' });
    } catch (error) {
      console.error('Error deleting tag:', error);
      showToast({ title: 'Erro', message: 'Erro ao excluir tag.', variant: 'error' });
    }
  };

  // Carregar chats iniciais se já tiver config
  useEffect(() => {
    console.log('[Chat] Config atual:', config);
    if (config.organizationId && !showConfigModal) {
      fetchChats();
    }
  }, [config.organizationId, showConfigModal]);

  // Fetch user specific departments for configuration
  useEffect(() => {
    const loadUserDepartments = async () => {
      if (!config.organizationId) return;

      try {
        const response = await apiService.get('/private/departments', {
          params: { organizationId: config.organizationId }
        });
        setAvailableDepartments(response.data);

        // Auto-select if only one department
        if (response.data.length === 1) {
          const deptId = response.data[0].id;
          setConfig(prev => {
            if (prev.departments && prev.departments.includes(deptId) && prev.departments.length === 1) return prev;
            return { ...prev, departments: [deptId] };
          });
        }
      } catch (error) {
        console.error('Erro ao buscar departamentos do usuário:', error);
      }
    };

    loadUserDepartments();
  }, [config.organizationId]);

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

  const handleStartChat = async (clientId = null, manualNumber = null, options = {}) => {
    setCreatingChat(true);
    try {
      const response = await apiService.post('/private/chats/start', {
        clientId,
        number: manualNumber,
        instanceId: config.instanceId // Send explicit instance
      });

      const newChat = response.data;
      setShowStartChatModal(false);
      setActiveTab('my_chats');

      await fetchChats(); // Atualiza a lista geral
      setSelectedChat(newChat); // Seleciona o chat novo

      // Auto Tag Logic
      if (options.autoTag && newChat && newChat.id) {
        try {
          const { name, color } = options.autoTag;
          // Check if tag exists (fetch fresh or use availableTags if reliable)
          // We'll fetch fresh to be safe
          const tagsRes = await apiService.get('/private/tags');
          const existingTags = tagsRes.data || [];
          let targetTag = existingTags.find(t => t.name.toLowerCase() === name.toLowerCase());

          let tagId;
          if (targetTag) {
            tagId = targetTag.id;
          } else {
            console.log('[Chat] Creating global tag:', name);
            const newTagRes = await apiService.post('/private/tags', { name, color });
            tagId = newTagRes.data.id;
          }

          if (tagId) {
            console.log('[Chat] Auto-assigning tag:', tagId, 'to chat:', newChat.id);
            await apiService.post(`/private/chats/${newChat.id}/tags`, { tagId });
            // Optionally refresh chat to show tag immediately, 
            // but fetchChats() above might need to run again or selectedChat updated.
            // Since selectedChat is already set, we might manually update it or refetch.
            // For now, let's trigger a light refresh or manual local update
            setSelectedChat(prev => prev.id === newChat.id ? ({
              ...prev,
              tags: [...(prev.tags || []), { id: tagId, name, color }]
            }) : prev);
            fetchChats(); // Refresh list tags
          }
        } catch (tagError) {
          console.error('[Chat] Auto-tag error:', tagError);
        }
      }

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

    // Determine Media Type
    const mimeType = file.type;
    let mediaType = 'document';

    if (mimeType.startsWith('image/')) mediaType = 'image';
    else if (mimeType.startsWith('video/')) mediaType = 'video';
    else if (mimeType.startsWith('audio/')) mediaType = 'audio';

    // Fallback based on extension
    if (file.name.endsWith('.webp')) mediaType = 'image';
    if (file.name.endsWith('.webm')) mediaType = 'video';

    // Create Local Preview URL
    const url = URL.createObjectURL(file);

    setMediaPreview({
      file,
      url,
      type: mediaType,
      name: file.name,
      mimeType: mimeType
    });
    setMediaCaption(messageInput); // Pre-fill caption if user typed something
    setShowAttachMenu(false);

    // Reset input to allow selecting same file again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCancelPreview = () => {
    if (mediaPreview?.url) {
      URL.revokeObjectURL(mediaPreview.url);
    }
    setMediaPreview(null);
    setMediaCaption('');
  };

  const handleConfirmSendMedia = async () => {
    if (!mediaPreview || !selectedChat) return;

    setIsUploading(true);

    // Convert to Base64
    const reader = new FileReader();
    reader.readAsDataURL(mediaPreview.file);
    reader.onload = async () => {
      const base64Content = reader.result.split(',')[1];

      try {
        await apiService.post('/private/chats/send', {
          chatId: selectedChat.id,
          media: base64Content,
          fileName: mediaPreview.name,
          mimeType: mediaPreview.mimeType,
          mediaType: mediaPreview.type,
          caption: mediaCaption
        });

        // Success
        handleCancelPreview(); // Cleans up state
        setMessageInput(''); // Clear main input if it was used for caption init
      } catch (error) {
        console.error('Erro ao enviar arquivo:', error);
        showToast('Erro', 'Falha ao enviar arquivo.', 'error');
      } finally {
        setIsUploading(false);
      }
    };

    reader.onerror = () => {
      console.error('Erro ao ler arquivo');
      showToast('Erro', 'Falha ao processar arquivo.', 'error');
      setIsUploading(false);
    };
  };

  const handleInputFocus = () => {
    if (selectedChat && ((selectedChat.unreadCount && selectedChat.unreadCount > 0) || totalUnread > 0)) {
      // Reset local state
      setChats(prev => prev.map(c => c.id === selectedChat.id ? { ...c, unreadCount: 0 } : c));
      setSelectedChat(prev => ({ ...prev, unreadCount: 0 }));

      // Optional: Force backend sync if needed, but usually fetchMessages handles it.
      // If fetchMessages was already called, backend is likely updated. We just need to update UI.
    }
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
    let filtered = [];

    if (activeTab === 'bot') {
      filtered = chats.filter(c => c.status === 'bot');
    } else if (activeTab === 'queue') {
      // Fila: Status 'attendant' mas sem atendente definido
      filtered = chats.filter(c => c.status === 'attendant' && !c.attendantId);
    } else if (activeTab === 'my_chats') {
      // Meus Chats: Status 'attendant' e meu ID (estrito)
      if (!user?.id) {
        console.warn('User ID missing for my_chats filter', user);
        filtered = [];
      } else {
        filtered = chats.filter(c => {
          const match = c.status === 'attendant' && Number(c.attendantId) === Number(user.id);
          return match;
        });
      }
    } else if (activeTab === 'history') {
      filtered = chats.filter(c => c.status === 'finished');
    }

    // Apply Sidebar Search
    if (sidebarSearchTerm.trim()) {
      const term = sidebarSearchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        (c.name && c.name.toLowerCase().includes(term)) ||
        (c.externalId && c.externalId.includes(term)) ||
        (c.lastMessage && c.lastMessage.toLowerCase().includes(term))
      );
    }

    return filtered;
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
      await apiService.put(`/private/chats/${selectedChat.id}/finish`, {
        closingMessage: sendFinishedMessage ? closingMessage : null,
        sendFinishedMessage
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

  const fetchTransferOptions = async () => {
    try {
      const [usersRes, deptsRes] = await Promise.all([
        apiService.get(`/private/organizations/${config.organizationId}/users`),
        apiService.get(`/private/departments`, { params: { scope: 'all' } })
      ]);

      const users = usersRes.data.map(u => ({ ...u, type: 'user' }));
      const depts = deptsRes.data.map(d => ({ ...d, type: 'department' }));

      setTransferOptions([...depts, ...users]);
    } catch (error) {
      console.error('Erro ao buscar opções de transferência:', error);
      showToast('Erro ao carregar lista de transferência.', 'error');
    }
  };

  const handleOpenTransfer = () => {
    fetchTransferOptions();
    setTransferType('user');
    setSelectedTransferTarget('');
    setTransferNotify(false);
    setTransferObservation('');
    setShowTransferModal(true);
  };

  // Slash Handlers
  const handleSlashChange = (e) => {
    const value = e.target.value;
    setMessageInput(value); // Original behavior

    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const slashIndex = textBeforeCursor.lastIndexOf('/');

    if (slashIndex !== -1 && slashIndex < cursorPosition) {
      const query = textBeforeCursor.substring(slashIndex + 1);
      if (!query.includes(' ') && !query.includes('\n')) {
        setSlashMenu({
          isOpen: true,
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

  const handleSlashKeyDown = (e) => {
    // Original key press logic for sending message
    if (e.key === 'Enter' && !e.shiftKey && !slashMenu.isOpen) {
      e.preventDefault();
      handleSendMessage(e);
      return;
    }

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
    const cursorPosition = inputRef.current.selectionStart;
    const text = messageInput;
    const textBeforeCursor = text.substring(0, cursorPosition);
    const slashIndex = textBeforeCursor.lastIndexOf('/');

    const newText = text.substring(0, slashIndex) + template.content + text.substring(cursorPosition);

    setMessageInput(newText);
    setSlashMenu(prev => ({ ...prev, isOpen: false }));

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const newCursorPos = slashIndex + template.content.length;
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleTransferChat = async () => {
    // Basic validation
    if (!selectedChat || isTransferring) return;

    // Bot Reset Special Case
    if (transferType === 'bot-reset') {
      if (!window.confirm('Tem certeza que deseja devolver esta conversa para o Bot?')) return;
      setIsTransferring(true);
      try {
        await apiService.put(`/private/chats/${selectedChat.id}/reset`, { notifyClient: true });
        setSelectedChat(prev => ({ ...prev, status: 'bot', attendantId: null }));
        fetchChats();
        setShowTransferModal(false);
        showToast({ title: 'Sucesso', message: 'Conversa retornada para o Bot.', variant: 'success' });
      } catch (error) {
        console.error('Erro ao resetar:', error);
        showToast({ title: 'Erro', message: 'Falha ao retornar para o Bot.', variant: 'error' });
      } finally {
        setIsTransferring(false);
      }
      return;
    }

    // General Queue / User / Department
    // Validate target selection if not general
    if (transferType !== 'general' && !selectedTransferTarget) {
      showToast({ title: 'Atenção', message: 'Selecione um destino para a transferência.', variant: 'warning' });
      return;
    }

    setIsTransferring(true);
    try {
      const payload = {
        targetType: transferType,
        targetId: selectedTransferTarget,
        notifyClient: transferNotify,
        observation: transferObservation
      };

      await apiService.put(`/private/chats/${selectedChat.id}/transfer`, payload);

      showToast({ title: 'Sucesso', message: 'Transferência realizada com sucesso.', variant: 'success' });
      setShowTransferModal(false);
      fetchChats();
      // Opcional: Manter selecionado mas atualizar status? Ou limpar?
      // Geralmente limpar se foi transferido para outro/geral.
      if (transferType !== 'user' || Number(selectedTransferTarget) !== Number(user?.id)) {
        setSelectedChat(null);
      }
    } catch (error) {
      console.error('Erro ao transferir:', error);
      showToast({ title: 'Erro', message: 'Falha ao transferir atendimento.', variant: 'error' });
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
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Tipo de Transferência</label>
              <Select
                value={transferType}
                onChange={(e) => {
                  setTransferType(e.target.value);
                  setSelectedTransferTarget(''); // Reset target on type change
                }}
                options={[
                  { value: 'user', label: 'Atendente', icon: <User size={18} /> },
                  { value: 'department', label: 'Departamento', icon: <Users size={18} /> },
                  { value: 'general', label: 'Fila Geral', icon: <List size={18} /> },
                  { value: 'bot-reset', label: 'Devolver ao Bot', icon: <Bot size={18} /> }
                ]}
              />
            </div>

            {transferType !== 'general' && transferType !== 'bot-reset' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Destino</label>
                <Select
                  placeholder={transferType === 'user' ? "Selecione o atendente..." : "Selecione o departamento..."}
                  value={selectedTransferTarget}
                  onChange={(e) => setSelectedTransferTarget(e.target.value)}
                  options={transferOptions
                    .filter(o => o.type === transferType)
                    .map(o => ({
                      value: o.id,
                      label: transferType === 'user' ? `${o.name} (${o.email})` : o.name,
                      icon: transferType === 'user' ? <CircleUserRound size={18} /> : <Users size={18} />
                    }))
                  }
                />
              </div>
            )}

            {transferType !== 'bot-reset' && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Observação (Interna)</label>
                  <textarea
                    value={transferObservation}
                    onChange={(e) => setTransferObservation(e.target.value)}
                    placeholder="Digite o motivo da transferência..."
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: `1px solid ${currentTheme.border}`,
                      backgroundColor: currentTheme.inputBg || 'transparent',
                      color: currentTheme.textPrimary,
                      minHeight: '80px',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    id="notifyClient"
                    checked={transferNotify}
                    onChange={(e) => setTransferNotify(e.target.checked)}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <label htmlFor="notifyClient" style={{ cursor: 'pointer' }}>Notificar cliente sobre a transferência?</label>
                </div>
              </>
            )}



            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <Button onClick={() => setShowTransferModal(false)} style={{ backgroundColor: isDark ? '#4b5563' : '#e5e7eb', color: currentTheme.textPrimary }}>Cancelar</Button>
              <Button
                onClick={handleTransferChat}
                disabled={isTransferring || (transferType !== 'general' && transferType !== 'bot-reset' && !selectedTransferTarget)}
                className="btn-base btn-new"
              >
                {isTransferring ? 'Processando...' : (transferType === 'bot-reset' ? 'Devolver' : 'Transferir')}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Tag Management Modal */}
      {showCheckTagsModal && (
        <Modal isOpen={showCheckTagsModal} onClose={() => setShowCheckTagsModal(false)}>
          <div style={{ padding: '20px', minWidth: '300px' }}>
            <h3 style={{ marginBottom: '15px' }}>Gerenciar Tags (Canal)</h3>

            {/* Create Tag Form */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '15px', paddingBottom: '15px', borderBottom: `1px solid ${currentTheme.border}`, alignItems: 'center' }}>
              <div style={{ position: 'relative', width: '32px', height: '32px', flexShrink: 0 }}>
                <input
                  type="color"
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                  title="Escolher cor da tag"
                />
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', backgroundColor: newTagColor, border: `1px solid ${currentTheme.border}` }}></div>
              </div>
              <input
                type="text"
                placeholder="Nova Tag..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '6px',
                  border: `1px solid ${currentTheme.border}`,
                  backgroundColor: currentTheme.inputBg || currentTheme.background,
                  color: currentTheme.textPrimary
                }}
              />
              <Button onClick={handleCreateTag} disabled={!newTagName.trim()}>
                Criar
              </Button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
              {availableTags.length === 0 ? (
                <div style={{ color: 'gray', width: '100%', textAlign: 'center' }}>Nenhuma tag disponível.</div>
              ) : (
                availableTags.map(tag => {
                  const isSelected = selectedChat?.tags?.some(t => t.id === tag.id);
                  return (
                    <div key={tag.id} style={{ display: 'flex', alignItems: 'center' }}>
                      <div
                        onClick={async (e) => {
                          // Prevent toggling when clicking delete button
                          if (e.target.closest('.delete-btn')) return;

                          try {
                            if (isSelected) {
                              await apiService.delete(`/private/chats/${selectedChat.id}/tags/${tag.id}`);
                              setSelectedChat(prev => ({ ...prev, tags: prev.tags.filter(t => t.id !== tag.id) }));
                            } else {
                              await apiService.post(`/private/chats/${selectedChat.id}/tags`, { tagId: tag.id });
                              setSelectedChat(prev => ({ ...prev, tags: [...(prev.tags || []), tag] }));
                            }
                            fetchChats();
                          } catch (err) {
                            console.error('Error toggling tag:', err);
                            showToast({ title: 'Erro', message: 'Erro ao atualizar tag.', variant: 'error' });
                          }
                        }}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '20px',
                          backgroundColor: isSelected ? (tag.color || '#000') : 'transparent',
                          color: isSelected ? '#fff' : currentTheme.textPrimary,
                          border: `1px solid ${tag.color || currentTheme.border}`,
                          cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: '6px',
                          fontWeight: '500',
                          fontSize: '13px',
                          opacity: isSelected ? 1 : 0.7,
                          transition: 'all 0.2s',
                          userSelect: 'none',
                          position: 'relative',
                          paddingRight: tag.userId ? '32px' : '10px' // Extra padding for delete button if exists
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {tag.name}
                          {isSelected && <Check size={14} />}
                        </span>

                        {/* Only show delete if user owns the tag (userId matches) or if it's a private tag (has userId) */}
                        {tag.userId && (
                          <div
                            className="delete-btn"
                            onClick={(e) => {
                              console.log('Click deleted');
                              e.stopPropagation();
                              handleDeleteTag(tag.id);
                            }}
                            style={{
                              position: 'absolute',
                              right: '4px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              width: '20px', // Hit area
                              height: '20px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '50%',
                              backgroundColor: 'rgba(255,255,255,0.2)',
                              cursor: 'pointer'
                            }}
                            title="Excluir Tag"
                          >
                            <Trash2 size={12} color={isSelected ? '#fff' : '#ef4444'} />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={() => setShowCheckTagsModal(false)}>Fechar</Button>
            </div>
          </div>
        </Modal>
      )
      }

      {/* Configuration Modal */}
      {
        showConfigModal && (
          <div className="config-modal-overlay">
            <div className="config-modal">
              <div className="config-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Settings size={24} />
                  <h2>Configuração do Chat</h2>
                </div>
                <button
                  // fechar o modal
                  onClick={() => setShowConfigModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: currentTheme.textSecondary }}
                  title="Fechar e Voltar"
                >
                  <CircleX size={24} />
                </button>
              </div>
              <form onSubmit={handleConfigSubmit}>
                <div className="config-body">
                  <div className="form-group">
                    <Select
                      label="Selecione o Canal (Instância)"
                      value={config.instanceId}
                      onChange={(e) => {
                        const inst = instances.find(i => i.id === Number(e.target.value));
                        const orgId = inst ? inst.organizationId : config.organizationId;
                        setConfig({ ...config, instanceId: e.target.value, organizationId: orgId });
                      }}
                      options={instances.map(inst => ({
                        value: inst.id,
                        label: `${inst.name} (${inst.organizationName})`,
                        icon: <Settings size={18} />
                      }))}
                      placeholder="Selecione uma instância..."
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ color: currentTheme.textPrimary, display: 'block', marginBottom: '8px' }}>Selecione os Departamentos</label>
                    <div style={{
                      maxHeight: '150px',
                      overflowY: 'auto',
                      border: `1px solid ${currentTheme.border}`,
                      borderRadius: '6px',
                      padding: '8px',
                      backgroundColor: currentTheme.inputBg || currentTheme.background
                    }}>
                      {availableDepartments.length > 0 ? (
                        availableDepartments.map(dept => {
                          const isChecked = Array.isArray(config.departments)
                            ? config.departments.includes(dept.id)
                            : (typeof config.departments === 'string' && config.departments.includes(String(dept.id)));

                          return (
                            <div key={dept.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                              <input
                                type="checkbox"
                                id={`dept-${dept.id}`}
                                checked={isChecked}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setConfig(prev => {
                                    let current = Array.isArray(prev.departments) ? [...prev.departments] : [];
                                    if (checked) {
                                      current.push(dept.id);
                                    } else {
                                      current = current.filter(id => id !== dept.id);
                                    }
                                    return { ...prev, departments: current };
                                  });
                                }}
                                style={{ cursor: 'pointer' }}
                              />
                              <label htmlFor={`dept-${dept.id}`} style={{ cursor: 'pointer', color: currentTheme.textPrimary, fontSize: '14px' }}>
                                {dept.name}
                              </label>
                            </div>
                          );
                        })
                      ) : (
                        <div style={{ padding: '4px', color: currentTheme.textSecondary, fontSize: '13px' }}>
                          {config.instanceId ? "Nenhum departamento encontrado." : "Selecione uma instância primeiro."}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="form-group">
                    <label style={{ color: currentTheme.textPrimary }}>Som de Notificação</label>
                    <Select
                      value={config.sound || 'default'}
                      onChange={(e) => setConfig({ ...config, sound: e.target.value })}
                      options={AVAILABLE_SOUNDS.map(sound => ({
                        value: sound.id,
                        label: sound.label
                      }))}
                      placeholder="Selecione o som..."
                    />
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
        )
      }

      {/* Left Sidebar */}
      <div className="chat-sidebar" style={{
        display: (isMobile && selectedChat) ? 'none' : 'flex',
        width: isMobile ? '100%' : undefined
      }}>


        <div style={{ padding: '0 10px', display: 'flex', gap: '8px', alignItems: 'center', height: '64px', borderBottom: `1px solid ${currentTheme.border}` }}>
          <button
            onClick={handleClearConfig}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: currentTheme.textSecondary }}
            title="Trocar Canal"
          >
            <Settings size={30} />
          </button>
          <div style={{ position: 'relative', flex: 1, display: 'flex', gap: '5px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: currentTheme.textSecondary }} />
              <input
                type="text"
                placeholder="Buscar..."
                value={sidebarSearchTerm}
                onChange={(e) => setSidebarSearchTerm(e.target.value)}
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
            {/* Tag Filter */}
            {/* <div style={{ position: 'relative' }} title="Filtrar conversas por Tag">
              <select
                value={selectedTagFilter}
                onChange={(e) => setSelectedTagFilter(e.target.value)}
                style={{
                  height: '100%',
                  borderRadius: '20px',
                  border: `1px solid ${currentTheme.border}`,
                  backgroundColor: isDark ? '#374151' : '#f0f2f5',
                  color: currentTheme.textPrimary,
                  padding: '0 10px',
                  outline: 'none',
                  maxWidth: '100px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                <option value="">Filtrar...</option>
                {availableTags.map(tag => (
                  <option key={tag.id} value={tag.id}>{tag.name}</option>
                ))}
              </select>
            </div> */}
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
          </button>
          <button
            className={`sidebar-tab ${activeTab === 'bot' ? 'active' : ''}`}
            onClick={() => setActiveTab('bot')}
            title="Atendimentos do Bot"
          >
            <Bot size={26} />
            {chats.filter(c => c.status === 'bot' && (c.unreadCount || 0) > 0).length > 0 && (
              <span className="tab-badge">{chats.filter(c => c.status === 'bot' && (c.unreadCount || 0) > 0).length}</span>
            )}
          </button>
          <button
            className={`sidebar-tab ${activeTab === 'queue' ? 'active' : ''}`}
            onClick={() => setActiveTab('queue')}
            title="Fila de Atendimentos"
          >
            <MessagesSquare size={26} />
            {chats.filter(c => c.status === 'attendant' && !c.attendantId && (c.unreadCount || 0) > 0).length > 0 && (
              <span className="tab-badge">{chats.filter(c => c.status === 'attendant' && !c.attendantId && (c.unreadCount || 0) > 0).length}</span>
            )}
          </button>
          <button
            className={`sidebar-tab ${activeTab === 'my_chats' ? 'active' : ''}`}
            onClick={() => setActiveTab('my_chats')}
            title="Meus Atendimentos"
          >
            <Headset size={26} />
            {chats.filter(c => c.status === 'attendant' && Number(c.attendantId) === Number(user?.id) && (c.unreadCount || 0) > 0).length > 0 && (
              <span className="tab-badge">{chats.filter(c => c.status === 'attendant' && Number(c.attendantId) === Number(user?.id) && (c.unreadCount || 0) > 0).length}</span>
            )}
          </button>
        </div>

        <div style={{
          padding: '16px 16px 10px',
          borderBottom: `1px solid ${currentTheme.border}`,
          color: currentTheme.textPrimary,
          fontWeight: '600',
          fontSize: '15px',
          display: 'flex',
          alignItems: 'center'
        }}>
          {activeTab === 'history' && "Histórico"}
          {activeTab === 'bot' && (
            <>
              Atendimentos do Bot
              <span
                style={{
                  marginLeft: '8px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: socketConnected ? '#4bce97' : '#ff4d4f',
                  display: 'inline-block'
                }}
                title={socketConnected ? 'Socket Conectado' : 'Socket Desconectado'}
              />
            </>
          )}
          {activeTab === 'queue' && "Fila de Atendimentos"}
          {activeTab === 'my_chats' && "Meus Atendimentos"}
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
                style={{ position: 'relative' }} // Ensure positioning context
              >
                <div className="contact-avatar">
                  <ChatAvatar chat={chat} config={config} instances={instances} />
                </div>
                <div className="contact-info">
                  <div className="contact-name" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{formatPhoneNumber(chat.name || chat.externalId)}</span>
                  </div>
                  <div className="contact-preview">{chat.lastMessage}</div>
                  {/* Tags Display */}
                  {chat.tags && chat.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                      {chat.tags.map(tag => (
                        <span key={tag.id} style={{
                          fontSize: '10px',
                          padding: '2px 6px',
                          borderRadius: '10px',
                          backgroundColor: tag.color || '#e5e7eb',
                          color: '#fff', // Assuming dark text on light bg, or adjust contrast
                          whiteSpace: 'nowrap'
                        }}>
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="contact-meta">
                  {new Date(chat.dateUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {/* Context Menu Button */}
                  <div
                    className="contact-menu-btn"
                    onClick={(e) => handleToggleMenu(e, chat.id)}
                    style={{
                      marginLeft: '4px',
                      padding: '2px',
                      cursor: 'pointer',
                      opacity: 0.6,
                      display: 'inline-flex'
                    }}
                    title="Opções"
                  >
                    <MoreVertical size={16} />
                  </div>
                </div>

                {/* Dropdown Menu */}
                {activeMenuChatId === chat.id && (
                  <div
                    ref={menuRef}
                    className="contact-item-menu-dropdown"
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '40px',
                      backgroundColor: currentTheme.cardBackground,
                      border: `1px solid ${currentTheme.border}`,
                      borderRadius: '4px',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                      zIndex: 100,
                      minWidth: '150px',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      onClick={(e) => handleMarkAsRead(e, chat)}
                      style={{
                        padding: '8px 12px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        color: currentTheme.textPrimary,
                        display: 'flex', alignItems: 'center', gap: '8px',
                        borderBottom: `1px solid ${currentTheme.border}`
                      }}
                      onMouseEnter={e => e.target.style.backgroundColor = isDark ? '#374151' : '#f5f5f5'}
                      onMouseLeave={e => e.target.style.backgroundColor = 'transparent'}
                    >
                      <CircleCheckBig size={14} /> Marcar como lido
                    </div>
                    <div
                      onClick={(e) => handleFinishFromList(e, chat)}
                      style={{
                        padding: '8px 12px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        color: '#ef4444',
                        display: 'flex', alignItems: 'center', gap: '8px'
                      }}
                      onMouseEnter={e => e.target.style.backgroundColor = isDark ? '#374151' : '#f5f5f5'}
                      onMouseLeave={e => e.target.style.backgroundColor = 'transparent'}
                    >
                      <CircleX size={14} /> Encerrar seção
                    </div>
                    {user?.role === 'MASTER' && (
                      <div
                        onClick={(e) => handleDeleteChat(e, chat)}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          color: '#dc2626', // Darker red
                          fontWeight: 'bold',
                          display: 'flex', alignItems: 'center', gap: '8px',
                          borderTop: `1px solid ${currentTheme.border}`
                        }}
                        onMouseEnter={e => e.target.style.backgroundColor = isDark ? '#374151' : '#f5f5f5'}
                        onMouseLeave={e => e.target.style.backgroundColor = 'transparent'}
                        title="Ação irreversível"
                      >
                        <Trash2 size={14} /> Excluir Chat
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="chat-main" style={{
        display: (isMobile && !selectedChat) ? 'none' : 'flex',
        flexDirection: 'row',
        overflow: 'hidden',
        width: isMobile ? '100%' : undefined
      }}>
        {selectedChat ? (
          <>

            <div style={{
              flex: 1,
              display: (isMobile && showClientInfo) ? 'none' : 'flex',
              flexDirection: 'column',
              minWidth: 0,
              height: '100%'
            }}>
              <div className="chat-header">
                {isMobile && (
                  <button
                    onClick={() => setSelectedChat(null)}
                    style={{
                      marginRight: '8px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: currentTheme.textPrimary,
                      padding: '4px'
                    }}
                  >
                    <ArrowLeft size={24} />
                  </button>
                )}
                <div className="chat-header-info-container">
                  <div className="chat-header-info">
                    <div className="contact-avatar" style={{ width: '40px', height: '40px', flexShrink: 0, overflow: 'hidden', borderRadius: '50%' }}>
                      {profilePicUrl ? (
                        <img src={profilePicUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <User size={18} />
                      )}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{ fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                        onClick={() => setShowClientInfo(!showClientInfo)}
                        title="Ver informações do cliente"
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {selectedChat.name || selectedChat.externalId.split('@')[0]}
                        </span>
                        <Info size={14} color={currentTheme.textSecondary} style={{ flexShrink: 0 }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="chat-action-btn-group">
                  {(selectedChat.status === 'bot' || selectedChat.status === 'attendant') && (
                    <>
                      <button
                        className="action-button chat-action-btn"
                        onClick={() => setShowFinishModal(true)}
                        disabled={selectedChat.status === 'bot' || (selectedChat.status === 'attendant' && !selectedChat.attendantId)}
                        title="Finalizar Atendimento"
                        style={{
                          cursor: (selectedChat.status === 'bot' || (selectedChat.status === 'attendant' && !selectedChat.attendantId)) ? 'not-allowed' : 'pointer',
                          opacity: (selectedChat.status === 'bot' || (selectedChat.status === 'attendant' && !selectedChat.attendantId)) ? 0.5 : 1
                        }}
                      >
                        {/* Use responsive size logic or CSS transform if strictly needed. For now keeping isMobile check for icon size or defaulting to 20px and using CSS to scale if needed. 
                            To be fully CSS based, we'd need SVGs to inherit size or use media query to scale SVG.
                            Let's rely on standard size 20 but button padding change handles layout. 
                        */}
                        <CircleCheck size={isMobile ? 18 : 20} color="#ff4d4f" />
                      </button>

                      <button
                        className="action-button chat-action-btn"
                        onClick={handleOpenTransfer}
                        disabled={selectedChat.status === 'bot' || (selectedChat.status === 'attendant' && !selectedChat.attendantId)}
                        title="Transferir Atendimento"
                        style={{
                          cursor: (selectedChat.status === 'bot' || (selectedChat.status === 'attendant' && !selectedChat.attendantId)) ? 'not-allowed' : 'pointer',
                          opacity: (selectedChat.status === 'bot' || (selectedChat.status === 'attendant' && !selectedChat.attendantId)) ? 0.5 : 1
                        }}
                      >
                        <CircleUserRound size={isMobile ? 18 : 20} color="#0084ff" />
                      </button>
                    </>
                  )}

                  <button
                    className="action-button chat-action-btn"
                    onClick={handleCloseChatView}
                    title="Fechar Conversa (Voltar ao Início)"
                  >
                    <CircleX size={isMobile ? 18 : 20} color="#f59e0b" />
                  </button>

                  {(selectedChat.status === 'bot' || (selectedChat.status === 'attendant' && !selectedChat.attendantId)) && (
                    <button
                      onClick={handleTakeover}
                      disabled={isTakingOver}
                      className="chat-takeover-btn"
                      style={{
                        backgroundColor: isTakingOver ? '#ccc' : (selectedChat.status === 'attendant' ? '#f97316' : '#4bce97'),
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: isTakingOver ? 'not-allowed' : 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      {/* Text content can remain reactive or hide via CSS if we pushed it further. keeping reactive is fine for text content as long as container sizing is robust via CSS */}
                      {isTakingOver ? '...' : (selectedChat.status === 'attendant' ? (isMobile ? 'Iniciar' : 'Iniciar Atendimento') : (isMobile ? 'Assumir' : 'Assumir Atendimento'))}
                    </button>

                  )}

                  {/* Botão de Tags */}
                  |
                  <button
                    className="action-button chat-action-btn"
                    onClick={() => setShowCheckTagsModal(true)}
                    disabled={selectedChat.status === 'bot' || (selectedChat.status === 'attendant' && !selectedChat.attendantId)}
                    title="Gerenciar Tags"
                    style={{
                      cursor: (selectedChat.status === 'bot' || (selectedChat.status === 'attendant' && !selectedChat.attendantId)) ? 'not-allowed' : 'pointer',
                      opacity: (selectedChat.status === 'bot' || (selectedChat.status === 'attendant' && !selectedChat.attendantId)) ? 0.5 : 1
                    }}
                  >
                    {/* Use responsive size logic or CSS transform if strictly needed. For now keeping isMobile check for icon size or defaulting to 20px and using CSS to scale if needed. 
                            To be fully CSS based, we'd need SVGs to inherit size or use media query to scale SVG.
                            Let's rely on standard size 20 but button padding change handles layout. 
                        */}
                    <TagIcon size={isMobile ? 18 : 20} color="#ff4d4f" />
                  </button>
                  <button
                    className="action-button chat-action-btn"
                    onClick={() => setShowSearch(!showSearch)}
                  >
                    <Search size={isMobile ? 18 : 20} style={{ color: showSearch ? '#ff4d4f' : '#0084ff' }} />
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
                          <div className="media-card" onClick={() => setViewingMedia({ url: msg.mediaUrl || msg.text, type: 'image' })}>
                            <img
                              src={msg.mediaUrl || msg.text}
                              alt="Imagem"
                              className="media-thumbnail"
                            />
                          </div>
                        )}
                        {msg.type === 'video' && (
                          <div className="media-card" onClick={() => setViewingMedia({ url: msg.mediaUrl || msg.text, type: 'video' })}>
                            <video
                              src={msg.mediaUrl || msg.text}
                              className="media-thumbnail"
                              preload="metadata"
                            />
                            <div className="video-overlay"><Play size={24} fill="white" /></div>
                          </div>
                        )}
                        {msg.type === 'audio' && (
                          <audio src={msg.mediaUrl || msg.text} controls style={{ width: '240px', marginBottom: '4px' }} />
                        )}
                        {msg.type === 'document' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderRadius: '8px', marginBottom: '4px', color: currentTheme.textPrimary }}>
                            <FileText size={24} />
                            <a href={msg.mediaUrl || msg.text} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none', fontWeight: '500', wordBreak: 'break-all' }}>
                              {(msg.mediaUrl || msg.text).split('/').pop()}
                            </a>
                          </div>
                        )}

                        {(msg.type === 'text' || (msg.type !== 'event' && msg.text && !msg.text.includes('/uploads/'))) && (
                          <div>{msg.text}</div>
                        )}

                        <div className="message-time" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {msg.sender === 'me' && (
                            <span title={msg.status}>
                              {msg.status === 'read' ? (
                                <CheckCheck size={16} color="#0084ff" />
                              ) : msg.status === 'delivered' ? (
                                <CheckCheck size={16} color={isDark ? '#8696a0' : '#667781'} />
                              ) : (
                                <Check size={16} color={isDark ? '#8696a0' : '#667781'} />
                              )}
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {(selectedChat.status === 'attendant' && !selectedChat.attendantId) || selectedChat.status === 'bot' || (selectedChat.status === 'attendant' && selectedChat.departmentId && !selectedChat.attendantId) ? (
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
                      backgroundColor: isTakingOver ? '#ccc' : (selectedChat.status === 'attendant' ? '#f97316' : '#4bce97'),
                      color: 'white',
                      height: 'auto'
                    }}
                  >
                    {isTakingOver ? 'Processando...' : (selectedChat.status === 'attendant' ? 'Iniciar Atendimento' : 'Assumir Atendimento')}
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

                          <button type="button" onClick={() => { fileInputRef.current.accept = 'image/*,.webp'; fileInputRef.current.click(); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', border: 'none', background: 'transparent', cursor: 'pointer', padding: '8px', width: '100%', textAlign: 'left', borderRadius: '4px', color: currentTheme.textPrimary, transition: 'background 0.2s' }} onMouseEnter={e => e.target.style.backgroundColor = isDark ? '#374151' : '#f5f5f5'} onMouseLeave={e => e.target.style.backgroundColor = 'transparent'}>
                            <ImageIcon size={20} color="#007bff" /> Imagem
                          </button>
                          <button type="button" onClick={() => { fileInputRef.current.accept = 'video/*,.webm'; fileInputRef.current.click(); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', border: 'none', background: 'transparent', cursor: 'pointer', padding: '8px', width: '100%', textAlign: 'left', borderRadius: '4px', color: currentTheme.textPrimary, transition: 'background 0.2s' }} onMouseEnter={e => e.target.style.backgroundColor = isDark ? '#374151' : '#f5f5f5'} onMouseLeave={e => e.target.style.backgroundColor = 'transparent'}>
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

                            {/* Slash Menu */}
                            {slashMenu.isOpen && (
                              <div style={{
                                position: 'absolute',
                                bottom: '70px',
                                left: '20px',
                                width: '300px',
                                maxHeight: '200px',
                                overflowY: 'auto',
                                backgroundColor: currentTheme.cardBackground,
                                border: `1px solid ${currentTheme.border}`,
                                borderRadius: '8px',
                                boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1)',
                                zIndex: 20
                              }}>
                                {templates
                                  .filter(t => t.title.toLowerCase().includes(slashMenu.filter.toLowerCase()))
                                  .map((template, index) => (
                                    <div
                                      key={template.id}
                                      style={{
                                        padding: '10px',
                                        cursor: 'pointer',
                                        backgroundColor: index === slashMenu.activeIndex ? (isDark ? '#374151' : '#f3f4f6') : 'transparent',
                                        borderBottom: `1px solid ${currentTheme.border}`,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '4px'
                                      }}
                                      onClick={() => selectSlashTemplate(template)}
                                    >
                                      <span style={{ fontWeight: 'bold', fontSize: '14px', color: currentTheme.textPrimary }}>{template.title}</span>
                                      <span style={{ fontSize: '12px', color: currentTheme.textSecondary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{template.content}</span>
                                    </div>
                                  ))}
                                {templates.filter(t => t.title.toLowerCase().includes(slashMenu.filter.toLowerCase())).length === 0 && (
                                  <div style={{ padding: '10px', color: currentTheme.textSecondary, fontSize: '14px', textAlign: 'center' }}>
                                    Nenhuma mensagem encontrada
                                  </div>
                                )}
                              </div>
                            )}

                            <input
                              ref={inputRef}
                              type="text"
                              placeholder="Digite uma mensagem (Use / para mensagens prontas)"
                              className="chat-input"
                              value={messageInput}
                              onChange={handleSlashChange}
                              onKeyDown={handleSlashKeyDown}
                              onFocus={handleInputFocus}
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
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>
              <img src={isDark ? logoSenddDark : logoSenddLight} alt="Sendd - Chat" />
            </div>
            <h2>Bem vindo ao Chat Sendd</h2>
            <p>Selecione um contato para iniciar o atendimento.</p>
          </div>
        )}
      </div >

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
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <input
                type="checkbox"
                id="sendFinishMsg"
                checked={sendFinishedMessage}
                onChange={(e) => setSendFinishedMessage(e.target.checked)}
                style={{ width: '16px', height: '16px', marginRight: '8px', cursor: 'pointer' }}
              />
              <label htmlFor="sendFinishMsg" style={{ fontSize: '14px', color: currentTheme.textPrimary, cursor: 'pointer', fontWeight: '500' }}>
                Enviar mensagem de encerramento ao cliente?
              </label>
            </div>

            {sendFinishedMessage && (
              <>
                <label style={{ fontSize: '13px', fontWeight: '600', color: currentTheme.textSecondary, marginBottom: '6px', display: 'block' }}>
                  Mensagem (Opcional)
                </label>
                <textarea
                  value={closingMessage}
                  onChange={(e) => setClosingMessage(e.target.value)}
                  placeholder="Deixe em branco para usar a mensagem padrão configurada."
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: `1px solid ${currentTheme.border}`,
                    backgroundColor: currentTheme.inputBg || currentTheme.background,
                    color: currentTheme.textPrimary,
                    minHeight: '80px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </>
            )}
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
      <div className="chat-info-sidebar" style={{ display: 'none' }}>
        Info
      </div>


      {/* Media Preview Modal (Before Send) */}
      <Modal
        isOpen={!!mediaPreview}
        onClose={() => !isUploading && handleCancelPreview()}
        title="Enviar Mídia"
        size="md"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Preview Container */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: isDark ? '#111827' : '#f3f4f6',
            borderRadius: '8px',
            padding: '20px',
            minHeight: '200px',
            maxHeight: '400px',
            overflow: 'hidden'
          }}>
            {mediaPreview?.type === 'image' && (
              <img
                src={mediaPreview.url}
                alt="Preview"
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '4px' }}
              />
            )}
            {mediaPreview?.type === 'video' && (
              <video
                src={mediaPreview.url}
                controls
                style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '4px' }}
              />
            )}
            {mediaPreview?.type === 'audio' && (
              <audio src={mediaPreview.url} controls style={{ width: '100%' }} />
            )}
            {mediaPreview?.type === 'document' && (
              <div style={{ textAlign: 'center', color: currentTheme.textPrimary }}>
                <FileText size={48} style={{ marginBottom: '8px', opacity: 0.7 }} />
                <div style={{ fontWeight: '500', wordBreak: 'break-all' }}>{mediaPreview.name}</div>
                <div style={{ fontSize: '12px', color: currentTheme.textSecondary }}>{mediaPreview.mimeType}</div>
              </div>
            )}
          </div>

          {/* Caption Input */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: currentTheme.textPrimary }}>
              Legenda
            </label>
            <textarea
              value={mediaCaption}
              onChange={(e) => setMediaCaption(e.target.value)}
              placeholder="Adicione uma legenda..."
              disabled={isUploading}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: `1px solid ${currentTheme.border}`,
                backgroundColor: currentTheme.inputBg || currentTheme.background,
                color: currentTheme.textPrimary,
                minHeight: '60px',
                resize: 'vertical'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleConfirmSendMedia();
                }
              }}
            />
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <Button
              variant="outline"
              onClick={handleCancelPreview}
              disabled={isUploading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmSendMedia}
              loading={isUploading}
              disabled={isUploading}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <SendIcon size={16} />
              {isUploading ? 'Enviando...' : 'Enviar'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Media View Modal (Viewing received media) */}
      {
        viewingMedia && (
          <div className="media-modal-overlay" onClick={() => setViewingMedia(null)}>
            <div className="media-modal-content" onClick={e => e.stopPropagation()}>
              <button className="media-close-btn" onClick={() => setViewingMedia(null)}>
                <X size={32} />
              </button>
              {viewingMedia.type === 'video' ? (
                <video src={viewingMedia.url} controls autoPlay className="media-full" />
              ) : (
                <img src={viewingMedia.url} alt="Full View" className="media-full" />
              )}
            </div>
          </div>
        )
      }
    </div >
  );
};

export default Chat;
