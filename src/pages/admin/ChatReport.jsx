import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { apiService } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import {
    Search, Calendar, Filter, User, CheckCircle,
    MessageSquare, Clock, ArrowLeft, ChevronLeft, MessageCircleReply, ChevronRight, X, Clock8, BotMessageSquare, MessageSquareMore, BadgeCheck
} from 'lucide-react';
import Select from '../../components/ui/Select';

const ChatReport = () => {
    const { user } = useAuth();
    const { isDark } = useTheme();
    const { showToast } = useToast();

    // Filters
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        status: '', // 'bot,attendant,finished' or specific
        search: '',
        attendantId: ''
    });
    const [attendants, setAttendants] = useState([]);

    // Data
    const [instances, setInstances] = useState([]);

    // Data
    const [chats, setChats] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, total: 0, lastPage: 1 });
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({ bot: 0, queue: 0, open: 0, finished: 0 });

    // Modals
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [showFinishModal, setShowFinishModal] = useState(false);
    const [actionChat, setActionChat] = useState(null);
    const [transferTarget, setTransferTarget] = useState('');
    const [closingMessage, setClosingMessage] = useState('');

    // Selection
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loadingMessages, setLoadingMessages] = useState(false);

    // Initial load
    useEffect(() => {
        fetchInstances();
        fetchAttendants();
        fetchChats(1);
        fetchStats();
    }, []); // eslint-disable-line

    const fetchInstances = async () => {
        try {
            const response = await apiService.getInstances(user.organizationId ? { organizationId: user.organizationId } : {});
            // Backend returns { instances: [...] }
            if (response.data && Array.isArray(response.data.instances)) {
                setInstances(response.data.instances);
            } else if (Array.isArray(response.data)) {
                // Direct array
                setInstances(response.data);
            } else if (response.data && Array.isArray(response.data.data)) {
                // Standard wrapper
                setInstances(response.data.data);
            } else {
                console.warn('Structure of instances response unexpected:', response.data);
                setInstances([]);
            }
        } catch (error) {
            console.error('Erro ao buscar instâncias:', error);
            setInstances([]);
        }
    };

    const fetchStats = async () => {
        try {
            // Apply filtering to stats? Or global?
            // Usually stats for the dashboard reflect the filtering context if possible, 
            // OR they are global overview.
            // Let's pass the filters.
            const params = {
                organizationId: user.organizationId,
                ...filters
            };
            if (!params.startDate) delete params.startDate;
            if (!params.endDate) delete params.endDate;
            if (!params.attendantId) delete params.attendantId;
            if (!params.instanceId) delete params.instanceId;
            // Remove status/search from stats params usually, as we want the breakdown BY status.
            delete params.status;
            delete params.search;

            const response = await apiService.getChatStats(params);
            setStats(response.data);
        } catch (error) {
            console.error('Erro ao buscar estatísticas:', error);
        }
    };

    const fetchAttendants = async () => {
        try {
            const response = await apiService.getUsers({ organizationId: user.organizationId });
            setAttendants(response.data || []);
        } catch (error) {
            console.error('Erro ao buscar atendentes:', error);
        }
    };

    const fetchChats = async (page = 1) => {
        setLoading(true);
        try {
            const params = {
                organizationId: user.organizationId,
                page,
                limit: 20,
                ...filters
            };

            // Allow empty filters to be ignored by backend if empty string
            if (!params.startDate) delete params.startDate;
            if (!params.endDate) delete params.endDate;
            if (!params.status) delete params.status;
            if (!params.status) delete params.status; // keeping duplicate check from original code to minimize diff noise if intentional, though likely typo. 
            if (!params.search) delete params.search;
            if (!params.attendantId) delete params.attendantId;
            if (!params.instanceId) delete params.instanceId;

            const response = await apiService.get('/private/chats', { params });
            if (response.data.data) {
                setChats(response.data.data);
                setPagination(response.data.meta);
            } else {
                // Fallback if backend backward compatibility kicks in unexpectedly
                setChats(response.data);
            }
        } catch (error) {
            console.error(error);
            showToast({ title: 'Erro', message: 'Falha ao buscar relatórios', variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (chatId) => {
        setLoadingMessages(true);
        try {
            const response = await apiService.get(`/private/chats/${chatId}/messages`, {
                params: { page: 1, limit: 100 } // Load last 100 messages
            });
            // Reverse to show oldest first if backend returns newest first? 
            // Backend `getMessages` returns `messages.reverse()` which means Oldest -> Newest.
            setMessages(response.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingMessages(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleApplyFilters = () => {
        fetchChats(1);
        fetchStats();
    };

    const handleOpenTransfer = (chat) => {
        setActionChat(chat);
        setTransferTarget('');
        setShowTransferModal(true);
    };

    const handleOpenFinish = (chat) => {
        setActionChat(chat);
        setClosingMessage('');
        setShowFinishModal(true);
    };

    const handleConfirmTransfer = async () => {
        if (!actionChat || !transferTarget) return;
        try {
            await apiService.put(`/private/chats/${actionChat.id}/transfer`, {
                targetType: 'user',
                targetId: transferTarget
            });
            showToast({ title: 'Sucesso', message: 'Chat transferido!', variant: 'success' });
            setShowTransferModal(false);
            fetchChats(pagination.page);
            fetchStats();
            if (selectedChat?.id === actionChat.id) setSelectedChat(null);
        } catch (error) {
            console.error(error);
            showToast({ title: 'Erro', message: 'Falha na transferência', variant: 'error' });
        }
    };

    const handleConfirmFinish = async () => {
        if (!actionChat) return;
        try {
            await apiService.put(`/private/chats/${actionChat.id}/finish`, {
                closingMessage
            });
            showToast({ title: 'Sucesso', message: 'Chat encerrado!', variant: 'success' });
            setShowFinishModal(false);
            fetchChats(pagination.page);
            fetchStats();
            if (selectedChat?.id === actionChat.id) setSelectedChat(null);
        } catch (error) {
            console.error(error);
            showToast({ title: 'Erro', message: 'Falha ao encerrar', variant: 'error' });
        }
    };

    const handleChatSelect = (chat) => {
        setSelectedChat(chat);
        fetchMessages(chat.id);
    };

    const formatPhoneNumber = (phone) => {
        if (!phone) return 'Sem número';
        const cleaned = ('' + phone).replace(/\D/g, '');
        let match;
        // Check for Brazil code 55 - 13 digits: 55 + DDD (2) + 9(1) + XXXX (4) + XXXX (4)
        if (cleaned.length === 13 && cleaned.startsWith('55')) {
            match = cleaned.match(/^55(\d{2})(\d{5})(\d{4})$/);
            if (match) return `(${match[1]}) ${match[2]}-${match[3]}`;
        }
        // 12 digits: 55 + DDD (2) + XXXX (4) + XXXX (4)
        else if (cleaned.length === 12 && cleaned.startsWith('55')) {
            match = cleaned.match(/^55(\d{2})(\d{4})(\d{4})$/);
            if (match) return `(${match[1]}) ${match[2]}-${match[3]}`;
        }
        // 11 digits: DDD (2) + 9(1) + XXXX (4) + XXXX (4)
        else if (cleaned.length === 11) {
            match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/);
            if (match) return `(${match[1]}) ${match[2]}-${match[3]}`;
        }
        // 10 digits: DDD (2) + XXXX (4) + XXXX (4)
        else if (cleaned.length === 10) {
            match = cleaned.match(/^(\d{2})(\d{4})(\d{4})$/);
            if (match) return `(${match[1]}) ${match[2]}-${match[3]}`;
        }
        return phone;
    };

    // Styles
    const styles = {
        container: {
            display: 'flex',
            height: 'calc(100vh - 64px)',
            backgroundColor: isDark ? '#1f2937' : '#f3f4f6',
            color: isDark ? '#e5e7eb' : '#1f2937',
            overflow: 'hidden'
        },
        sidebar: {
            width: '350px',
            backgroundColor: isDark ? '#111827' : '#fff',
            borderRight: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0
        },
        main: {
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: isDark ? '#1f2937' : '#f9fafb',
            position: 'relative'
        },
        header: {
            padding: '16px',
            borderBottom: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
        },
        input: {
            padding: '8px',
            borderRadius: '6px',
            border: `1px solid ${isDark ? '#4b5563' : '#d1d5db'}`,
            backgroundColor: isDark ? '#374151' : '#fff',
            color: isDark ? '#fff' : '#000',
            width: '100%'
        },
        select: {
            padding: '8px',
            borderRadius: '6px',
            border: `1px solid ${isDark ? '#4b5563' : '#d1d5db'}`,
            backgroundColor: isDark ? '#374151' : '#fff',
            color: isDark ? '#fff' : '#000',
            flex: 1
        },
        chatItem: (active) => ({
            padding: '12px',
            borderBottom: `1px solid ${isDark ? '#374151' : '#f3f4f6'}`,
            cursor: 'pointer',
            backgroundColor: active ? (isDark ? '#374151' : '#e5e7eb') : 'transparent',
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
            transition: 'background-color 0.2s'
        }),
        messageBubble: (sender) => ({
            maxWidth: '70%',
            padding: '10px 14px',
            borderRadius: '12px',
            marginBottom: '8px',
            alignSelf: sender === 'me' ? 'flex-end' : 'flex-start',
            backgroundColor: sender === 'me' ? '#3b82f6' : (isDark ? '#374151' : '#fff'),
            color: sender === 'me' ? '#fff' : (isDark ? '#e5e7eb' : '#1f2937'),
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
            wordWrap: 'break-word'
        })
    };

    return (
        <div style={styles.container}>
            {/* Sidebar List */}
            <div style={styles.sidebar}>
                <div style={styles.header}>
                    <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>Relatório de Conversas</h2>

                    {/* Filters */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

                        {/* Dates */}
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px', display: 'block' }}>De</label>
                                <input
                                    type="date"
                                    style={{ ...styles.input, width: '100%' }}
                                    value={filters.startDate}
                                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px', display: 'block' }}>Até</label>
                                <input
                                    type="date"
                                    style={{ ...styles.input, width: '100%' }}
                                    value={filters.endDate}
                                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                />
                            </div>
                        </div>


                        {/* Status */}
                        <div style={{ marginBottom: '10px' }}>
                            <Select
                                label="Status"
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                placeholder="Todos Status"
                                options={[
                                    { value: '', label: 'Todos Status' },
                                    { value: 'bot', label: 'Bot' },
                                    { value: 'attendant', label: 'Em Atendimento' },
                                    { value: 'finished', label: 'Encerrados' }
                                ]}
                            />
                        </div>

                        {/* Instance (Channel) */}
                        <div style={{ marginBottom: '10px' }}>
                            <Select
                                label="Canal (Instância)"
                                value={filters.instanceId || ''}
                                onChange={(e) => handleFilterChange('instanceId', e.target.value)}
                                placeholder="Todos Canais"
                                options={[
                                    { value: '', label: 'Todos Canais' },
                                    ...instances.map(instance => ({
                                        value: instance.id,
                                        label: `${instance.name} - ${formatPhoneNumber(instance.number)}`
                                    }))
                                ]}
                            />
                        </div>

                        {/* Attendant */}
                        <div style={{ marginBottom: '10px' }}>
                            <Select
                                label="Atendente"
                                value={filters.attendantId}
                                onChange={(e) => handleFilterChange('attendantId', e.target.value)}
                                placeholder="Todos Atendentes"
                                options={[
                                    { value: '', label: 'Todos Atendentes' },
                                    ...attendants.map(att => ({
                                        value: att.id,
                                        label: att.name
                                    }))
                                ]}
                            />
                        </div>

                        {/* Search */}
                        <div style={{ position: 'relative' }}>
                            <label style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px', display: 'block' }}>Busca</label>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <div style={{ position: 'relative', flex: 1 }}>
                                    <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                                    <input
                                        style={{ ...styles.input, paddingLeft: '32px', width: '100%' }}
                                        placeholder="Nome, telefone..."
                                        value={filters.search}
                                        onChange={(e) => handleFilterChange('search', e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                                    />
                                </div>
                                <button
                                    onClick={handleApplyFilters}
                                    style={{
                                        padding: '0 12px',
                                        backgroundColor: '#3b82f6',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                    title="Filtrar"
                                >
                                    <Filter size={16} />
                                </button>
                            </div>
                        </div>


                    </div>
                </div>

                {/* List */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {loading ? (
                        <div style={{ padding: '20px', textAlign: 'center' }}>Carregando...</div>
                    ) : chats.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>Nenhuma conversa encontrada</div>
                    ) : (
                        chats.map(chat => (
                            <div
                                key={chat.id}
                                style={styles.chatItem(selectedChat?.id === chat.id)}
                                onClick={() => handleChatSelect(chat)}
                            >
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <User size={20} color="#6b7280" />
                                </div>
                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                                        <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{chat.name || chat.externalId}</span>
                                        <span style={{ fontSize: '11px', color: '#6b7280' }}>
                                            {chat.attendant?.name ? (
                                                <span style={{ marginRight: '8px', color: '#4b5563', fontWeight: '500' }}>
                                                    {chat.attendant.name.split(' ')[0]}
                                                </span>
                                            ) : null}
                                            {new Date(chat.dateUpdated).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {chat.lastMessage}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination */}
                <div style={{ padding: '10px', borderTop: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button
                        disabled={pagination.page <= 1}
                        onClick={() => fetchChats(pagination.page - 1)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: isDark ? '#fff' : '#000', opacity: pagination.page <= 1 ? 0.3 : 1 }}
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <span style={{ fontSize: '12px' }}>Pag {pagination.page} de {pagination.lastPage}</span>
                    <button
                        disabled={pagination.page >= pagination.lastPage}
                        onClick={() => fetchChats(pagination.page + 1)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: isDark ? '#fff' : '#000', opacity: pagination.page >= pagination.lastPage ? 0.3 : 1 }}
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Main Chat View */}
            <div style={styles.main}>
                {!selectedChat ? (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                        {/* Stats Dashboard */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '40px', width: '90%', maxWidth: '800px' }}>
                            {/* Open */}
                            <div style={{ padding: '20px', backgroundColor: isDark ? '#374151' : '#d1fae5', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '120px' }}>
                                <MessageSquareMore
                                    size={100}
                                    color={isDark ? '#fff' : '#065f46'}
                                    style={{ position: 'absolute', bottom: -20, left: -20, opacity: 0.1, transform: 'rotate(15deg)', zIndex: 0 }}
                                />
                                <div style={{ position: 'relative', zIndex: 1 }}>
                                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: isDark ? '#fff' : '#065f46', marginBottom: '4px', lineHeight: 1 }}>{loading ? '-' : stats.open}</div>
                                    <div style={{ fontSize: '14px', color: isDark ? '#9ca3af' : '#065f46' }}>Em Atendimento</div>
                                </div>
                            </div>

                            {/* Queue */}
                            <div style={{ padding: '20px', backgroundColor: isDark ? '#374151' : '#fee2e2', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '120px' }}>
                                <Clock8
                                    size={100}
                                    color={isDark ? '#fff' : '#991b1b'}
                                    style={{ position: 'absolute', bottom: -20, left: -20, opacity: 0.1, transform: 'rotate(15deg)', zIndex: 0 }}
                                />
                                <div style={{ position: 'relative', zIndex: 1 }}>
                                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: isDark ? '#fff' : '#991b1b', marginBottom: '4px', lineHeight: 1 }}>{loading ? '-' : stats.queue}</div>
                                    <div style={{ fontSize: '14px', color: isDark ? '#9ca3af' : '#991b1b' }}>Fila</div>
                                </div>
                            </div>

                            {/* Bot */}
                            <div style={{ padding: '20px', backgroundColor: isDark ? '#374151' : '#e0f2fe', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '120px' }}>
                                <BotMessageSquare
                                    size={100}
                                    color={isDark ? '#fff' : '#075985'}
                                    style={{ position: 'absolute', bottom: -20, left: -20, opacity: 0.1, transform: 'rotate(15deg)', zIndex: 0 }}
                                />
                                <div style={{ position: 'relative', zIndex: 1 }}>
                                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: isDark ? '#fff' : '#075985', marginBottom: '4px', lineHeight: 1 }}>{loading ? '-' : stats.bot}</div>
                                    <div style={{ fontSize: '14px', color: isDark ? '#9ca3af' : '#075985' }}>Bot</div>
                                </div>
                            </div>

                            {/* Finished */}
                            <div style={{ padding: '20px', backgroundColor: isDark ? '#374151' : '#f3f4f6', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '120px' }}>
                                <BadgeCheck
                                    size={100}
                                    color={isDark ? '#fff' : '#374151'}
                                    style={{ position: 'absolute', bottom: -20, left: -20, opacity: 0.1, transform: 'rotate(15deg)', zIndex: 0 }}
                                />
                                <div style={{ position: 'relative', zIndex: 1 }}>
                                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: isDark ? '#fff' : '#374151', marginBottom: '4px', lineHeight: 1 }}>{loading ? '-' : stats.finished}</div>
                                    <div style={{ fontSize: '14px', color: isDark ? '#9ca3af' : '#374151' }}>Encerrados</div>
                                </div>
                            </div>
                        </div>

                        <MessageSquare size={48} style={{ marginBottom: '16px', color: '#9ca3af', opacity: 0.5 }} />
                        <p style={{ color: '#6b7280', fontSize: '16px' }}>Selecione uma conversa para visualizar o histórico</p>
                    </div>
                ) : (
                    <>
                        {/* Chat Header */}
                        <div style={{ padding: '16px', borderBottom: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: isDark ? '#1f2937' : '#fff' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <User size={20} color="#059669" />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>{selectedChat.name || selectedChat.externalId}</h3>
                                    <p style={{ fontSize: '12px', color: '#6b7280' }}>
                                        Status: {selectedChat.status === 'attendant' ? (selectedChat.attendantId ? 'Em Atendimento' : 'Na Fila') :
                                            selectedChat.status === 'bot' ? 'Bot' : 'Encerrado'}
                                    </p>
                                    <p style={{ fontSize: '12px', color: '#6b7280' }}>
                                        Atendente: {selectedChat.attendant?.name}
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={() => handleOpenTransfer(selectedChat)}
                                    title="Transferir"
                                    style={{
                                        padding: '8px 12px',
                                        borderRadius: '6px',
                                        border: '1px solid #d1d5db',
                                        backgroundColor: '#fff',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        fontSize: '12px',
                                        color: '#374151'
                                    }}
                                >
                                    <MessageCircleReply size={14} /> Transferir
                                </button>
                                <button
                                    onClick={() => handleOpenFinish(selectedChat)}
                                    title="Encerrar"
                                    style={{
                                        padding: '8px 12px',
                                        borderRadius: '6px',
                                        border: 'none',
                                        backgroundColor: '#ef4444',
                                        color: 'white',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        fontSize: '12px'
                                    }}
                                >
                                    <CheckCircle size={14} /> Encerrar
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column' }}>
                            {loadingMessages ? (
                                <div style={{ textAlign: 'center', padding: '20px' }}>Carregando mensagens...</div>
                            ) : messages.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>Histórico vazio.</div>
                            ) : (
                                messages.map((msg, idx) => (
                                    <div key={idx} style={styles.messageBubble(msg.sender)}>
                                        {msg.mediaUrl && (
                                            msg.type === 'image' ? <img src={msg.mediaUrl} alt="midia" style={{ maxWidth: '100%', borderRadius: '8px' }} /> :
                                                msg.type === 'video' ? <video src={msg.mediaUrl} controls style={{ maxWidth: '100%', borderRadius: '8px' }} /> :
                                                    msg.type === 'audio' ? <audio src={msg.mediaUrl} controls /> :
                                                        <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>Ver Arquivo</a>
                                        )}
                                        <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text || (msg.mediaUrl ? '' : <i>Sem conteúdo de texto</i>)}</div>
                                        <div style={{ fontSize: '10px', textAlign: 'right', marginTop: '4px', opacity: 0.7 }}>
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                )}
            </div>


            {/* Transfer Modal */}
            {
                showTransferModal && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <div style={{ backgroundColor: isDark ? '#1f2937' : '#fff', padding: '20px', borderRadius: '8px', width: '400px', border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}` }}>
                            <h3 style={{ marginBottom: '16px', fontWeight: 'bold' }}>Transferir Chat</h3>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Selecione o Atendente</label>
                                <select
                                    style={{ ...styles.select, width: '100%' }}
                                    value={transferTarget}
                                    onChange={(e) => setTransferTarget(e.target.value)}
                                >
                                    <option value="">Selecione...</option>
                                    {attendants.filter(a => a.id !== actionChat?.attendantId).map(att => (
                                        <option key={att.id} value={att.id}>{att.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                <button onClick={() => setShowTransferModal(false)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', background: 'none', cursor: 'pointer', color: isDark ? '#fff' : '#000' }}>Cancelar</button>
                                <button onClick={handleConfirmTransfer} style={{ padding: '8px 12px', borderRadius: '6px', border: 'none', backgroundColor: '#3b82f6', color: 'white', cursor: 'pointer' }}>Confirmar</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Finish Modal */}
            {
                showFinishModal && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <div style={{ backgroundColor: isDark ? '#1f2937' : '#fff', padding: '20px', borderRadius: '8px', width: '400px', border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}` }}>
                            <h3 style={{ marginBottom: '16px', fontWeight: 'bold' }}>Encerrar Chat</h3>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Mensagem de Encerramento (Opcional)</label>
                                <textarea
                                    style={{ ...styles.input, width: '100%', height: '80px', resize: 'none' }}
                                    value={closingMessage}
                                    onChange={(e) => setClosingMessage(e.target.value)}
                                    placeholder="Digite uma mensagem final..."
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                <button onClick={() => setShowFinishModal(false)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', background: 'none', cursor: 'pointer', color: isDark ? '#fff' : '#000' }}>Cancelar</button>
                                <button onClick={handleConfirmFinish} style={{ padding: '8px 12px', borderRadius: '6px', border: 'none', backgroundColor: '#ef4444', color: 'white', cursor: 'pointer' }}>Encerrar</button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
};

export default ChatReport;
