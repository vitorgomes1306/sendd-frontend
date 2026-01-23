import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { Download, Filter, Search, User, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import AlertToast from '../components/ui/AlertToast';

const Relatorios = () => {
  const { currentTheme, isDark } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Access Control
  useEffect(() => {
    if (user && user.role !== 'ADMIN' && user.role !== 'MANAGER' && user.role !== 'MASTER') {
      navigate('/dash');
    }
  }, [user, navigate]);

  // Tabs
  const [activeTab, setActiveTab] = useState('funil'); // Default to Funnel for now

  // Funnel Report State
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [filters, setFilters] = useState({ search: '', startDate: '', endDate: '' });

  const fetchLeadsReport = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search,
        startDate: filters.startDate,
        endDate: filters.endDate,
        includeInactive: 'true' // Special param for report
      };

      const response = await apiService.getLeads(params);

      if (response.data && response.data.data) {
        setLeads(response.data.data);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total,
          pages: response.data.pagination.pages
        }));
      }
    } catch (error) {
      console.error("Erro ao buscar relatório:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'funil') {
      fetchLeadsReport();
    }
  }, [activeTab, pagination.page, filters]); // Re-fetch on filter change logic needs debounce or manual trigger? 
  // Let's assume manual trigger for filters or auto for simpler UX. For now auto.

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getStageLabel = (stage) => {
    switch (stage) {
      case 'TOP': return 'Topo';
      case 'MIDDLE': return 'Meio';
      case 'BOTTOM': return 'Fundo';
      case 'POST_SALE': return 'Pós-Venda';
      default: return '-';
    }
  };

  const getStageColor = (stage) => {
    switch (stage) {
      case 'TOP': return '#3b82f6';
      case 'MIDDLE': return '#eab308';
      case 'BOTTOM': return '#f97316';
      case 'POST_SALE': return '#10b981';
      default: return '#9ca3af';
    }
  };

  const styles = {
    container: {
      padding: '24px',
      backgroundColor: currentTheme.background,
      color: currentTheme.textPrimary,
      minHeight: '100%',
      fontFamily: 'Inter, sans-serif'
    },
    header: { marginBottom: '24px' },
    title: { fontSize: '24px', fontWeight: 'bold', color: currentTheme.textPrimary, marginBottom: '8px' },
    tabsContainer: {
      display: 'flex',
      borderBottom: `1px solid ${currentTheme.border}`,
      marginBottom: '24px'
    },
    tab: (active) => ({
      padding: '12px 24px',
      cursor: 'pointer',
      borderBottom: active ? `2px solid ${currentTheme.primary}` : 'none',
      color: active ? currentTheme.primary : currentTheme.textSecondary,
      fontWeight: active ? '600' : 'normal',
      transition: 'all 0.2s'
    }),
    card: {
      backgroundColor: currentTheme.cardBackground,
      padding: '24px',
      borderRadius: '8px',
      boxShadow: currentTheme.shadow,
      border: `1px solid ${currentTheme.borderLight}`,
      overflow: 'hidden'
    },
    filterBar: {
      display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center'
    },
    input: {
      padding: '8px 12px',
      borderRadius: '6px',
      border: `1px solid ${currentTheme.border}`,
      backgroundColor: currentTheme.background,
      color: currentTheme.textPrimary,
      outline: 'none',
      fontSize: '14px'
    },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: {
      padding: '12px', textAlign: 'left', borderBottom: `1px solid ${currentTheme.border}`,
      fontWeight: '600', color: currentTheme.textSecondary, fontSize: '13px'
    },
    td: {
      padding: '12px', borderBottom: `1px solid ${currentTheme.borderLight}`,
      color: currentTheme.textPrimary, fontSize: '14px'
    },
    statusBadge: (active) => ({
      padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '500',
      backgroundColor: active ? (isDark ? 'rgba(16, 185, 129, 0.2)' : '#dcfce7') : (isDark ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2'),
      color: active ? (isDark ? '#34d399' : '#15803d') : (isDark ? '#f87171' : '#b91c1c'),
      display: 'inline-flex', alignItems: 'center', gap: '4px'
    }),
    stageBadge: (stage) => ({
      padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600',
      backgroundColor: getStageColor(stage),
      color: '#fff'
    })
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Relatórios</h1>
        <p style={{ color: currentTheme.textSecondary }}>Acompanhe o desempenho do seu negócio.</p>
      </div>

      <div style={styles.tabsContainer}>
        <div style={styles.tab(activeTab === 'funil')} onClick={() => setActiveTab('funil')}>
          Histórico do Funil
        </div>
        <div style={styles.tab(activeTab === 'geral')} onClick={() => setActiveTab('geral')}>
          Geral (Em breve)
        </div>
      </div>

      {activeTab === 'funil' && (
        <div style={styles.card}>
          <div style={styles.filterBar}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: currentTheme.textSecondary }} />
              <input
                type="text"
                placeholder="Buscar por nome, email..."
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                style={{ ...styles.input, paddingLeft: '32px', minWidth: '250px' }}
              />
            </div>
            <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} style={styles.input} />
            <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} style={styles.input} />
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Nome/Lead</th>
                  <th style={styles.th}>Responsável</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Etapa Atual</th>
                  <th style={styles.th}>Motivo Perda/Observação</th>
                  <th style={styles.th}>Data Criação</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: currentTheme.textSecondary }}>Carregando dados...</td></tr>
                ) : leads.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: currentTheme.textSecondary }}>Nenhum registro encontrado.</td></tr>
                ) : (
                  leads.map(lead => (
                    <tr key={lead.id} style={{ ':hover': { backgroundColor: currentTheme.background } }}>
                      <td style={styles.td}>
                        <div>
                          <div style={{ fontWeight: '500' }}>{lead.name} {lead.surname}</div>
                          <div style={{ fontSize: '12px', color: currentTheme.textSecondary }}>{lead.email}</div>
                          <div style={{ fontSize: '12px', color: currentTheme.textSecondary }}>{lead.phone}</div>
                        </div>
                      </td>
                      <td style={styles.td}>
                        {lead.user ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <User size={14} /> {lead.user.name}
                          </div>
                        ) : <span style={{ color: currentTheme.textMuted }}>Sem dono</span>}
                      </td>
                      <td style={styles.td}>
                        <span style={styles.statusBadge(lead.active)}>
                          {lead.active ? <CheckCircle size={10} /> : <XCircle size={10} />}
                          {lead.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {lead.salesFunnel ? (
                          <span style={styles.stageBadge(lead.salesFunnel.stage)}>
                            {getStageLabel(lead.salesFunnel.stage)}
                          </span>
                        ) : '-'}
                      </td>
                      <td style={styles.td}>
                        {lead.lostReason ? (
                          <div style={{ color: '#ef4444', fontSize: '13px' }}>
                            <AlertTriangle size={12} style={{ display: 'inline', marginRight: '4px' }} />
                            {lead.lostReason}
                          </div>
                        ) : '-'}
                      </td>
                      <td style={styles.td}>
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination (Simple) */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', gap: '8px' }}>
            <button
              disabled={pagination.page === 1}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              style={{ ...styles.input, cursor: pagination.page === 1 ? 'not-allowed' : 'pointer', opacity: pagination.page === 1 ? 0.5 : 1 }}
            >
              Anterior
            </button>
            <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
              Pag {pagination.page} de {pagination.pages}
            </div>
            <button
              disabled={pagination.page === pagination.pages}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              style={{ ...styles.input, cursor: pagination.page === pagination.pages ? 'not-allowed' : 'pointer', opacity: pagination.page === pagination.pages ? 0.5 : 1 }}
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Relatorios;