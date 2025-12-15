import React, { useState, useEffect } from 'react';
import { BarChart3, Users, Zap, Clock, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const AuditLogs = () => {
  const { user } = useAuth();
  const { currentTheme } = useTheme();
  
  // Obter estilos com o tema atual
  const styles = getStyles(currentTheme);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    method: '',
    resource: '',
    statusCode: '',
    userEmail: '',
    startDate: '',
    endDate: ''
  });

  const itemsPerPage = 20;

  // Carregar logs de auditoria
  const loadAuditLogs = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      });

      const response = await api.get(`/private/audit/logs?${params}`);
      setLogs(response.data.logs);
      setTotalPages(Math.ceil(response.data.total / itemsPerPage));
      setCurrentPage(page);
    } catch (err) {
      setError('Erro ao carregar logs de auditoria');
      console.error('Erro ao carregar logs:', err);
    } finally {
      setLoading(false);
    }
  };

  // Carregar estatísticas
  const loadStats = async () => {
    try {
      const response = await api.get('/private/audit/stats');
      setStats(response.data);
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    }
  };

  useEffect(() => {
    loadAuditLogs();
    loadStats();
  }, []);

  // Aplicar filtros
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const applyFilters = () => {
    setCurrentPage(1);
    loadAuditLogs(1);
  };

  const clearFilters = () => {
    setFilters({
      method: '',
      resource: '',
      statusCode: '',
      userEmail: '',
      startDate: '',
      endDate: ''
    });
    setCurrentPage(1);
    loadAuditLogs(1);
  };

  // Formatar data
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  // Formatar descrição da ação
  const formatActionDescription = (log) => {
    const userName = log.user ? log.user.name : log.userName || 'Usuário anônimo';
    const action = log.action || 'executou uma ação';
    const resource = log.resource || 'recurso';
    
    // Se a ação já é uma frase completa, apenas adiciona o usuário
    if (action.includes('sistema') || action.includes('mensagem') || action.includes('QR Code')) {
      return `${userName} ${action}`;
    }
    
    // Para outras ações, combina usuário + ação + recurso
    return `${userName} ${action} ${resource}`;
  };

  // Formatação de método HTTP
  const getMethodColor = (method) => {
    const colors = {
      GET: 'bg-blue-100 text-blue-800',
      POST: 'bg-green-100 text-green-800',
      PUT: 'bg-yellow-100 text-yellow-800',
      DELETE: 'bg-red-100 text-red-800',
      PATCH: 'bg-purple-100 text-purple-800'
    };
    return colors[method] || 'bg-gray-100 text-gray-800';
  };

  // Formatação de status code
  const getStatusColor = (status) => {
    if (status >= 200 && status < 300) return 'text-green-600';
    if (status >= 300 && status < 400) return 'text-yellow-600';
    if (status >= 400 && status < 500) return 'text-red-600';
    if (status >= 500) return 'text-red-800';
    return 'text-gray-600';
  };

  if (loading && logs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando logs de auditoria...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.mainContainer}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>Logs de Auditoria</h1>
          <p style={styles.subtitle}>
            Visualize todas as ações realizadas no sistema
          </p>
        </div>

        {/* Cards de Estatísticas */}
        {stats && (
          <div style={styles.statsGrid}>
            <div style={{...styles.statsCard, borderLeft: `4px solid ${currentTheme.primary || '#3b82f6'}`}}>
              <div style={styles.statsIcon}>
                <BarChart3 size={24} />
              </div>
              <div>
                <p style={styles.statsLabel}>Total de Requisições</p>
                <p style={styles.statsValue}>{stats.totalRequests}</p>
              </div>
            </div>
            
            <div style={{...styles.statsCard, borderLeft: `4px solid ${currentTheme.success || '#10b981'}`}}>
              <div style={{...styles.statsIcon, backgroundColor: `${currentTheme.success || '#10b981'}20`, color: currentTheme.success || '#10b981'}}>
                <Users size={24} />
              </div>
              <div>
                <p style={styles.statsLabel}>Usuários Únicos</p>
                <p style={styles.statsValue}>{stats.uniqueUsers}</p>
              </div>
            </div>
            
            <div style={{...styles.statsCard, borderLeft: `4px solid ${currentTheme.warning || '#f59e0b'}`}}>
              <div style={{...styles.statsIcon, backgroundColor: `${currentTheme.warning || '#f59e0b'}20`, color: currentTheme.warning || '#f59e0b'}}>
                <Zap size={24} />
              </div>
              <div>
                <p style={styles.statsLabel}>Método Mais Usado</p>
                <p style={styles.statsValue}>
                  {stats.topMethods?.[0]?.method || 'N/A'}
                </p>
              </div>
            </div>

            <div style={{...styles.statsCard, borderLeft: `4px solid ${currentTheme.info || '#06b6d4'}`}}>
              <div style={{...styles.statsIcon, backgroundColor: `${currentTheme.info || '#06b6d4'}20`, color: currentTheme.info || '#06b6d4'}}>
                <Clock size={24} />
              </div>
              <div>
                <p style={styles.statsLabel}>Tempo Médio</p>
                <p style={styles.statsValue}>
                  {stats.averageResponseTime ? `${Math.round(stats.averageResponseTime)}ms` : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div style={styles.filtersCard}>
          <h3 style={styles.filtersTitle}>Filtros</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Método</label>
              <select
                value={filters.method}
                onChange={(e) => handleFilterChange('method', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.statusCode}
                onChange={(e) => handleFilterChange('statusCode', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                <option value="200">200 - OK</option>
                <option value="201">201 - Created</option>
                <option value="400">400 - Bad Request</option>
                <option value="401">401 - Unauthorized</option>
                <option value="404">404 - Not Found</option>
                <option value="500">500 - Server Error</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recurso</label>
              <input
                type="text"
                value={filters.resource}
                onChange={(e) => handleFilterChange('resource', e.target.value)}
                placeholder="Ex: users, organizations"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email do Usuário</label>
              <input
                type="text"
                value={filters.userEmail}
                onChange={(e) => handleFilterChange('userEmail', e.target.value)}
                placeholder="usuario@email.com"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={applyFilters}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Aplicar Filtros
            </button>
            <button
              onClick={clearFilters}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: currentTheme.cardBackground,
                color: currentTheme.textPrimary,
                border: `1px solid ${currentTheme.border}`,
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = currentTheme.shadow;
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              <i className="bi bi-arrow-clockwise" style={{ fontSize: '0.875rem' }}></i>
              Limpar Filtros
            </button>
          </div>
        </div>

        {/* Tabela de Logs */}
        <div style={styles.tableCard}>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data/Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ação
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Método
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rota
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tempo (ms)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(log.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatActionDescription(log)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getMethodColor(log.method)}`}>
                        {log.method}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                      {log.route}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                      <span className={getStatusColor(log.statusCode)}>
                        {log.statusCode}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.ipAddress}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.responseTime}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {logs.length === 0 && !loading && (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: currentTheme.textSecondary
            }}>
              <i className="bi bi-clipboard-data" style={{
                fontSize: '1.25rem',
                marginBottom: '1rem',
                display: 'block'
              }}></i>
              <h3 style={{
                margin: '0 0 0.5rem 0',
                color: currentTheme.textPrimary
              }}>
                Nenhum log encontrado
              </h3>
              <p style={{ margin: 0 }}>
                Não há logs de auditoria para os filtros selecionados
              </p>
            </div>
          )}
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-6 rounded-lg shadow">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => loadAuditLogs(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                onClick={() => loadAuditLogs(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próximo
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Mostrando página <span className="font-medium">{currentPage}</span> de{' '}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => loadAuditLogs(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Anterior</span>
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => loadAuditLogs(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === pageNum
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => loadAuditLogs(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Próximo</span>
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Erro</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Função para obter estilos baseados no tema
const getStyles = (currentTheme) => ({
  container: {
    minHeight: '100vh',
    backgroundColor: currentTheme.background,
    padding: '2rem 0'
  },
  
  mainContainer: {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '0 1rem'
  },
  
  header: {
    marginBottom: '2rem'
  },
  
  title: {
    fontSize: '1.875rem',
    fontWeight: '700',
    color: currentTheme.textPrimary,
    margin: '0 0 0.5rem 0'
  },
  
  subtitle: {
    color: currentTheme.textSecondary,
    margin: 0
  },
  
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '24px',
    marginBottom: '32px'
  },
  
  statsCard: {
    padding: '1.5rem',
    backgroundColor: currentTheme.cardBackground,
    borderRadius: '0.75rem',
    border: `1px solid ${currentTheme.border}`,
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    transition: 'all 0.2s'
  },
  
  statsIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '8px',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    color: '#3b82f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  
  statsValue: {
    fontSize: '2rem',
    fontWeight: '700',
    color: currentTheme.primary,
    margin: '0.25rem 0 0 0'
  },
  
  statsLabel: {
    margin: 0,
    fontSize: '0.875rem',
    color: currentTheme.textSecondary,
    fontWeight: '500'
  },
  
  filtersCard: {
    backgroundColor: currentTheme.cardBackground,
    borderRadius: '0.75rem',
    border: `1px solid ${currentTheme.border}`,
    padding: '1.5rem',
    marginBottom: '1.5rem'
  },
  
  filtersTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: currentTheme.textPrimary,
    margin: '0 0 1rem 0'
  },
  
  tableCard: {
    backgroundColor: currentTheme.cardBackground,
    borderRadius: '0.75rem',
    border: `1px solid ${currentTheme.border}`,
    overflow: 'hidden'
  }
});

export default AuditLogs;