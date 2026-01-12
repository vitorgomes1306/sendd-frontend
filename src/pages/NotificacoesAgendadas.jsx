import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { apiService } from '../services/api';
import {
  Calendar,
  Trash2,
  Search,
  Clock,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import AlertToast from '../components/ui/AlertToast';
import '../styles/buttons.css';

const NotificacoesAgendadas = () => {
  const { currentTheme } = useTheme();
  const { user } = useAuth();
  const { showToast } = useToast();
  const styles = getStyles(currentTheme);

  const [scheduledMessages, setScheduledMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  const [alertState, setAlertState] = useState({
    open: false,
    variant: 'info',
    title: '',
    message: ''
  });

  const fetchScheduledMessages = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search,
        status: filters.status
      };

      const response = await apiService.get('/private/scheduled-messages', { params });

      // Ajustar conforme o formato de resposta do seu backend
      // Se for { messages: [], total: 0, pages: 0 }
      // ou { data: [], meta: {} }
      // Baseado em routes/scheduledMessages.js, o retorno é:
      // res.json({ messages: formatted, total, page, pages });

      if (response.data) {
        // Suporta tanto { messages: [] } quanto { data: [] }
        const messages = response.data.messages || response.data.data || [];
        setScheduledMessages(messages);

        const total = response.data.total || (response.data.pagination && response.data.pagination.total) || 0;
        const pages = response.data.pages || (response.data.pagination && response.data.pagination.pages) || 0;

        setPagination(prev => ({
          ...prev,
          total,
          pages
        }));
      }

    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
      showToast({
        title: 'Erro',
        message: 'Falha ao carregar agendamentos.',
        variant: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduledMessages();
  }, [pagination.page, filters]); // Re-fetch on page or filter change

  // Debounce para busca (opcional, ou apenas no enter/blur)
  // Por simplicidade, usando effect direto.

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja cancelar este agendamento?')) return;

    try {
      await apiService.delete(`/private/scheduled-messages/${id}`);
      showToast({ title: 'Sucesso', message: 'Agendamento cancelado com sucesso.', variant: 'success' });
      fetchScheduledMessages(); // Recarregar lista
    } catch (error) {
      console.error('Erro ao excluir:', error);
      showToast({ title: 'Erro', message: 'Falha ao cancelar agendamento.', variant: 'error' });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('pt-BR');
  };

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

      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            <Calendar size={32} style={styles.titleIcon} />
            Agendamentos
          </h1>
          <p style={styles.subtitle}>Gerencie suas notificações programadas</p>
        </div>
        <button
          onClick={fetchScheduledMessages}
          className="btn-base"
          style={{
            backgroundColor: currentTheme.backgroundSecondary,
            color: currentTheme.textPrimary,
            border: `1px solid ${currentTheme.border}`
          }}
        >
          <RefreshCw size={18} /> Atualizar
        </button>
      </div>

      <div style={styles.card}>
        <div style={styles.filterContainer}>
          <div className="form-input-wrapper" style={{ display: 'flex', alignItems: 'center', position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', color: currentTheme.textSecondary }} />
            <input
              type="text"
              placeholder="Buscar por nome ou mensagem..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
              style={{
                ...styles.input,
                paddingLeft: '36px'
              }}
            />
          </div>
          {/* Filtro de status se necessário */}
        </div>

        {loading ? (
          <div style={styles.emptyState}>Carregando...</div>
        ) : scheduledMessages.length === 0 ? (
          <div style={styles.emptyState}>
            <Clock size={48} style={{ color: currentTheme.textSecondary, marginBottom: '16px' }} />
            <p>Nenhum agendamento encontrado</p>
          </div>
        ) : (
          <>
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Agendado Para</th>
                    <th style={styles.th}>Nome</th>
                    <th style={styles.th}>Canal</th>
                    <th style={styles.th}>Destinatários</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduledMessages.map(item => (
                    <tr key={item.id} style={styles.tr}>
                      <td style={styles.td}>{formatDate(item.scheduledFor)}</td>
                      <td style={styles.td}><strong>{item.name}</strong></td>
                      <td style={styles.td}>{item.channelName || '-'}</td>
                      <td style={styles.td}>{item.recipients?.length || 0} números</td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.statusBadge,
                          backgroundColor: item.status === 'pending' ? '#fef3c7' : item.status === 'sent' ? '#d1fae5' : '#fee2e2',
                          color: item.status === 'pending' ? '#92400e' : item.status === 'sent' ? '#065f46' : '#991b1b'
                        }}>
                          {item.status === 'pending' ? 'Pendente' : item.status === 'sent' ? 'Enviado' : 'Falhou'}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <button
                          onClick={() => handleDelete(item.id)}
                          style={styles.deleteButton}
                          title="Cancelar Agendamento"
                        >
                          <Trash2 size={16} />
                        </button>
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
    </div>
  );
};

const getStyles = (theme) => ({
  container: {
    padding: '24px',
    backgroundColor: theme.background,
    minHeight: '100vh',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
  },
  header: {
    marginBottom: '32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
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
  card: {
    backgroundColor: theme.cardBackground,
    borderRadius: '16px',
    padding: '24px',
    boxShadow: theme.shadow,
    marginBottom: '24px'
  },
  filterContainer: {
    display: 'flex',
    gap: '16px',
    marginBottom: '24px',
    flexWrap: 'wrap'
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: `1px solid ${theme.border}`,
    backgroundColor: theme.inputBackground || theme.background,
    color: theme.textPrimary,
    fontSize: '14px',
    outline: 'none'
  },
  tableContainer: {
    overflowX: 'auto',
    border: `1px solid ${theme.border}`,
    borderRadius: '8px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left'
  },
  th: {
    padding: '16px',
    borderBottom: `1px solid ${theme.border}`,
    backgroundColor: theme.backgroundSecondary || '#f9fafb',
    color: theme.textSecondary,
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  tr: {
    borderBottom: `1px solid ${theme.border}`
  },
  td: {
    padding: '16px',
    color: theme.textPrimary,
    fontSize: '14px'
  },
  statusBadge: {
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500'
  },
  deleteButton: {
    padding: '8px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#fee2e2',
    color: '#ef4444',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyState: {
    padding: '48px',
    textAlign: 'center',
    color: theme.textSecondary,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
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
    borderRadius: '8px',
    border: `1px solid ${theme.border}`,
    backgroundColor: theme.cardBackground,
    color: theme.textPrimary,
    cursor: 'pointer',
    fontWeight: '500'
  }
});

export default NotificacoesAgendadas;