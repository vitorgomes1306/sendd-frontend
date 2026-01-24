import React, { useState, useEffect } from 'react';
import { Key, Plus, Search, Trash2, Copy, Check, AlertCircle, Edit } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import AlertToast from '../components/ui/AlertToast';
import '../styles/buttons.css';
import '../styles/forms.css';

const Tokens = () => {
  const { currentTheme } = useTheme();
  const { user } = useAuth();
  const styles = getStyles(currentTheme);

  const [tokens, setTokens] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedToken, setSelectedToken] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    organizationId: '',
    instanceIds: []
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadOrganizations();
  }, []);

  useEffect(() => {
    if (organizations.length > 0) {
      // Carregar tokens da primeira organização por padrão ou permitir selecionar
      // Para simplificar, vamos carregar da primeira
      loadTokens(organizations[0].id);
      loadAllInstances(organizations); // Carregar instâncias de TODAS as organizações
      setFormData(prev => ({ ...prev, organizationId: organizations[0].id }));
    }
  }, [organizations]);

  const loadOrganizations = async () => {
    try {
      const response = await apiService.get('/private/organizations');
      const orgs = Array.isArray(response.data) ? response.data : (response.data?.data ?? []);
      setOrganizations(orgs);
    } catch (error) {
      console.error('Erro ao carregar organizações:', error);
    }
  };

  const loadTokens = async (orgId) => {
    setLoading(true);
    try {
      const response = await apiService.get(`/private/external-tokens/${orgId}`);
      setTokens(response.data);
    } catch (error) {
      console.error('Erro ao carregar tokens:', error);
      setError('Erro ao carregar tokens.');
    } finally {
      setLoading(false);
    }
  };

  const loadAllInstances = async (orgs) => {
    try {
      let allInstances = [];
      for (const org of orgs) {
        try {
          const response = await apiService.get(`/private/organizations/${org.id}/instances`);
          const orgInstances = response.data.instances || [];
          // Adicionar nome da organização para diferenciar visualmente
          const enrichedInstances = orgInstances.map(i => ({
            ...i,
            displayName: `${i.name || i.instanceName} (${org.razaoSocial || org.nomeFantasia})`
          }));
          allInstances = [...allInstances, ...enrichedInstances];
        } catch (err) {
          console.error(`Erro ao carregar instâncias da org ${org.id}`, err);
        }
      }
      setInstances(allInstances);
    } catch (error) {
      console.error('Erro ao carregar instâncias:', error);
    }
  };

  const handleSaveToken = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (isEditing && selectedToken) {
        await apiService.put(`/private/external-tokens/${selectedToken.id}`, formData);
        setSuccess('Token atualizado com sucesso!');
      } else {
        await apiService.post('/private/external-tokens', formData);
        setSuccess('Token criado com sucesso!');
      }

      handleCloseModal();
      loadTokens(formData.organizationId);
    } catch (error) {
      console.error('Erro ao salvar token:', error);
      setError('Erro ao salvar token.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditToken = (token) => {
    setSelectedToken(token);
    setFormData({
      name: token.name,
      organizationId: token.organizationId,
      instanceIds: token.instances ? token.instances.map(i => i.id) : []
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setSelectedToken(null);
    setFormData(prev => ({ ...prev, name: '', instanceIds: [] }));
  };

  const handleDeleteToken = async () => {
    try {
      await apiService.delete(`/private/external-tokens/${selectedToken.id}`);
      setSuccess('Token excluído com sucesso!');
      setShowDeleteModal(false);
      loadTokens(formData.organizationId);
    } catch (error) {
      console.error('Erro ao excluir token:', error);
      setError('Erro ao excluir token.');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSuccess('Token copiado para a área de transferência!');
  };

  const filteredTokens = tokens.filter(t =>
    t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.token.includes(searchTerm)
  );

  const toggleInstanceSelection = (instanceId) => {
    setFormData(prev => {
      const currentIds = prev.instanceIds;
      if (currentIds.includes(instanceId)) {
        return { ...prev, instanceIds: currentIds.filter(id => id !== instanceId) };
      } else {
        return { ...prev, instanceIds: [...currentIds, instanceId] };
      }
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            <Key size={32} style={styles.titleIcon} />
            Tokens de Acesso Externo
          </h1>
          <p style={styles.subtitle}>Gerencie tokens para integração via API pública</p>
        </div>

        <div style={{ ...styles.headerActions, alignItems: 'center' }}>
          <div className="form-input-wrapper" style={{ flex: 1, minWidth: '300px' }}>
            <Search size={18} />
            <input
              id="search-token"
              type="text"
              placeholder="Buscar tokens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ backgroundColor: currentTheme.cardBackground }}
            />
          </div>
          <button
            id="btn-new-token"
            onClick={() => {
              setIsEditing(false);
              setFormData(prev => ({ ...prev, name: '', instanceIds: [] }));
              setShowModal(true);
            }}
            className='btn-base btn-new'
            style={{ height: '44px' }} // Matching form-input height
          >
            <Plus size={20} />
            Novo Token
          </button>
        </div>
      </div>

      <AlertToast open={!!error} variant="danger" title="Erro" message={error} onClose={() => setError('')} />
      <AlertToast open={!!success} variant="success" title="Sucesso" message={success} onClose={() => setSuccess('')} />

      <div style={styles.card}>
        {loading ? (
          <div style={styles.loadingContainer}>Loading...</div>
        ) : filteredTokens.length === 0 ? (
          <div style={styles.emptyState}>Nenhum token encontrado.</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Nome</th>
                <th style={styles.th}>Token</th>
                <th style={styles.th}>Instâncias Associadas</th>
                <th style={styles.th}>Criado em</th>
                <th style={styles.th}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredTokens.map(token => (
                <tr key={token.id} style={styles.tr}>
                  <td style={styles.td}>{token.name || '-'}</td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <code style={styles.code}>
                        {token.token.substring(0, 10)}...{token.token.substring(token.token.length - 4)}
                      </code>
                      <button onClick={() => copyToClipboard(token.token)} style={styles.iconButton} title="Copiar Token">
                        <Copy size={14} />
                      </button>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {token.instances?.map(i => (
                        <span key={i.id} style={styles.badge}>{i.name || i.instanceName}</span>
                      ))}
                    </div>
                  </td>
                  <td style={styles.td}>{new Date(token.createdAt).toLocaleDateString()}</td>
                  <td style={styles.td}>
                    <button
                      onClick={() => handleEditToken(token)}
                      style={{ ...styles.iconButton, color: currentTheme.primary }}
                      title="Editar"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => { setSelectedToken(token); setShowDeleteModal(true); }}
                      style={{ ...styles.iconButton, color: '#ef4444' }}
                      title="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Criar Token */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={handleCloseModal}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{isEditing ? 'Editar Token' : 'Novo Token'}</h2>
              <button onClick={handleCloseModal} style={styles.closeButton}>×</button>
            </div>
            <form onSubmit={handleSaveToken} className="form-container" style={{ padding: '20px' }}>
              <div className="form-group">
                <label className="form-label">Nome do Token</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="form-input"
                  placeholder="Ex: Integração Site"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Instâncias permitidas</label>
                <div style={styles.checkboxList}>
                  {instances.map(inst => (
                    <label key={inst.id} className="form-check" style={{ padding: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.instanceIds.includes(inst.id)}
                        onChange={() => toggleInstanceSelection(inst.id)}
                      />
                      {inst.displayName || inst.name || inst.instanceName}
                    </label>
                  ))}
                </div>
                <small className="form-help">
                  O token usará a primeira instância conectada desta lista para enviar mensagens.
                </small>
              </div>

              <div className="form-actions">
                <button type="button"
                  onClick={handleCloseModal}
                  className="btn-base" style={{ backgroundColor: 'transparent', border: `1px solid ${currentTheme.border}`, color: currentTheme.textSecondary }}>Cancelar</button>
                <button type="submit" disabled={isSubmitting}
                  className="btn-base btn-new">
                  {isSubmitting ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Criar Token')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Excluir */}
      {showDeleteModal && (
        <div style={styles.modalOverlay} onClick={() => setShowDeleteModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Excluir Token</h2>
            </div>
            <div className="modalBody" style={{ padding: '20px' }}>
              <p style={{ color: currentTheme.textPrimary }}>Tem certeza que deseja excluir este token? A integração irá parar de funcionar.</p>
            </div>
            <div className="form-actions" style={{ padding: '0 20px 20px 20px' }}>
              <button onClick={() => setShowDeleteModal(false)} className="btn-base" style={{ backgroundColor: 'transparent', border: `1px solid ${currentTheme.border}`, color: currentTheme.textSecondary }}>Cancelar</button>
              <button onClick={handleDeleteToken} className="btn-base" style={{ backgroundColor: '#ef4444' }}>Excluir</button>
            </div>
          </div>
        </div>
      )}
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
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '32px',
    flexWrap: 'wrap',
    gap: '16px'
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: theme.textPrimary,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    margin: 0
  },
  titleIcon: { color: theme.primary },
  subtitle: { color: theme.textSecondary, margin: '4px 0 0 0' },
  headerActions: { display: 'flex', gap: '12px' },
  searchContainer: { position: 'relative', display: 'flex', alignItems: 'center' },
  searchIcon: { position: 'absolute', left: '12px', color: theme.textSecondary },
  searchInput: {
    padding: '10px 10px 10px 40px',
    borderRadius: '8px',
    border: `1px solid ${theme.border}`,
    backgroundColor: theme.cardBackground,
    color: theme.textPrimary,
    outline: 'none'
  },
  addButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    backgroundColor: theme.primary,
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600'
  },
  card: {
    backgroundColor: theme.cardBackground,
    borderRadius: '12px',
    border: `1px solid ${theme.border}`,
    overflow: 'hidden'
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    padding: '16px',
    textAlign: 'left',
    borderBottom: `1px solid ${theme.border}`,
    color: theme.textSecondary,
    fontWeight: '600',
    fontSize: '14px'
  },
  tr: { borderBottom: `1px solid ${theme.border}` },
  td: { padding: '16px', color: theme.textPrimary, fontSize: '14px' },
  code: {
    backgroundColor: theme.background,
    padding: '4px 8px',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '12px'
  },
  iconButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: theme.textSecondary,
    padding: '4px'
  },
  badge: {
    backgroundColor: `${theme.primary}20`,
    color: theme.primary,
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '12px'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    backgroundColor: theme.cardBackground,
    borderRadius: '12px',
    width: '100%',
    maxWidth: '500px',
    padding: '0',
    overflow: 'hidden'
  },
  modalHeader: {
    padding: '20px',
    borderBottom: `1px solid ${theme.border}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  modalTitle: { margin: 0, fontSize: '18px', color: theme.textPrimary },
  closeButton: { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: theme.textSecondary },
  modalBody: { padding: '20px' },
  formGroup: { marginBottom: '20px' },
  label: { display: 'block', marginBottom: '8px', fontWeight: '500', color: theme.textPrimary },
  input: {
    width: '100%',
    padding: '10px',
    borderRadius: '8px',
    border: `1px solid ${theme.border}`,
    backgroundColor: theme.background,
    color: theme.textPrimary,
    outline: 'none'
  },
  checkboxList: {
    maxHeight: '150px',
    overflowY: 'auto',
    border: `1px solid ${theme.border}`,
    borderRadius: '8px',
    padding: '10px'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px',
    cursor: 'pointer',
    color: theme.textPrimary
  },
  modalFooter: {
    padding: '20px',
    borderTop: `1px solid ${theme.border}`,
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px'
  },
  cancelButton: {
    padding: '10px 20px',
    border: `1px solid ${theme.border}`,
    backgroundColor: 'transparent',
    color: theme.textSecondary,
    borderRadius: '8px',
    cursor: 'pointer'
  },
  submitButton: {
    padding: '10px 20px',
    backgroundColor: theme.primary,
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600'
  },
  loadingContainer: { padding: '40px', textAlign: 'center', color: theme.textSecondary },
  emptyState: { padding: '40px', textAlign: 'center', color: theme.textSecondary }
});

export default Tokens;
