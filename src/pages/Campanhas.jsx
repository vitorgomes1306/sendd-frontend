import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { apiService, getApiBaseUrl } from '../services/api';
import AlertToast from '../components/ui/AlertToast';
import './Campanhas.css'; // Importando estilos específicos (incluindo modals)
import {
  MessageSquare,
  Megaphone,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Calendar,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  File,
  Check,
  AlertCircle
} from 'lucide-react';

const Campanhas = () => {
  const { currentTheme } = useTheme();
  const styles = getStyles(currentTheme);

  // States
  const [activeTab, setActiveTab] = useState('templates'); // 'templates' or 'campaigns'
  const [loading, setLoading] = useState(false);
  const [alertState, setAlertState] = useState({ open: false, variant: 'info', title: '', message: '' });

  // Data States
  const [templates, setTemplates] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [medias, setMedias] = useState([]);

  // Gallery States
  const [showGallery, setShowGallery] = useState(false);
  const [galleryMedias, setGalleryMedias] = useState([]);

  // Delete Confirmation State
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    type: null, // 'template' or 'campaign'
    id: null,
    title: ''
  });

  // Selected Media Object (for preview in form)
  const [selectedMedia, setSelectedMedia] = useState(null);

  // Pagination & Filters
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [filters, setFilters] = useState({ search: '' });

  // Modal States
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form Data
  const [templateForm, setTemplateForm] = useState({ title: '', content: '' });
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    description: '',
    content: '',
    mediaId: '',
    startDate: '',
    endDate: '',
    status: 'active'
  });

  // Slash Menu States
  const [slashMenu, setSlashMenu] = useState({
    isOpen: false,
    position: { top: 0, left: 0 },
    filter: '',
    activeIndex: 0
  });
  const textareaRef = useRef(null);

  // Load Data
  useEffect(() => {
    if (activeTab === 'templates') {
      fetchTemplates();
    } else {
      fetchCampaigns();
      fetchMedias();
    }
  }, [activeTab, pagination.page, filters]);

  // Load templates when Campaign Modal is opened (for slash command)
  useEffect(() => {
    if (showCampaignModal) {
      fetchTemplates(); // Ensure templates are loaded
    }
  }, [showCampaignModal]);

  const showAlert = (variant, title, message) => {
    setAlertState({ open: true, variant, title, message });
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
    const baseUrl = getApiBaseUrl().replace(/\/api$/, '');
    const normalizedPath = path.replace(/\\/g, '/');
    if (normalizedPath.startsWith('http')) return normalizedPath;
    const cleanPath = normalizedPath.startsWith('/') ? normalizedPath.substring(1) : normalizedPath;
    return `${baseUrl}/${cleanPath}`;
  };

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await apiService.getTemplates({
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search
      });
      setTemplates(response.data.data);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total,
        pages: response.data.pagination.pages
      }));
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      showAlert('error', 'Erro', 'Erro ao carregar mensagens prontas');
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const response = await apiService.getCampaigns({
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search
      });
      setCampaigns(response.data.data);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total,
        pages: response.data.pagination.pages
      }));
    } catch (error) {
      console.error('Erro ao carregar campanhas:', error);
      showAlert('error', 'Erro', 'Erro ao carregar campanhas');
    } finally {
      setLoading(false);
    }
  };

  const fetchMedias = async () => {
    try {
      const response = await apiService.getMedias({ limit: 100 });
      setMedias(response.data.data || []);
    } catch (error) {
      console.error('Erro ao carregar mídias:', error);
    }
  };

  // Gallery Functions
  const openGallery = async () => {
    try {
      const response = await apiService.getMedias({ limit: 50 });
      setGalleryMedias(response.data.data || []);
      setShowGallery(true);
    } catch (err) {
      console.error('Erro ao carregar galeria:', err);
      showAlert('error', 'Erro', 'Erro ao carregar galeria.');
    }
  };

  const selectGalleryMedia = (media) => {
    setSelectedMedia(media);
    setCampaignForm(prev => ({ ...prev, mediaId: media.id }));
    setShowGallery(false);
  };

  const removeMedia = () => {
    setSelectedMedia(null);
    setCampaignForm(prev => ({ ...prev, mediaId: '' }));
  };

  // Handlers - Template
  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await apiService.updateTemplate(editingItem.id, templateForm);
        showAlert('success', 'Sucesso', 'Mensagem atualizada com sucesso');
      } else {
        await apiService.createTemplate(templateForm);
        showAlert('success', 'Sucesso', 'Mensagem criada com sucesso');
      }
      setShowTemplateModal(false);
      fetchTemplates();
      setTemplateForm({ title: '', content: '' });
      setEditingItem(null);
    } catch (error) {
      showAlert('error', 'Erro', 'Erro ao salvar mensagem');
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta mensagem?')) {
      try {
        await apiService.deleteTemplate(id);
        showAlert('success', 'Sucesso', 'Mensagem excluída');
        fetchTemplates();
      } catch (error) {
        showAlert('error', 'Erro', 'Erro ao excluir mensagem');
      }
    }
  };

  const openTemplateModal = (template = null) => {
    if (template) {
      setEditingItem(template);
      setTemplateForm({ title: template.title, content: template.content });
    } else {
      setEditingItem(null);
      setTemplateForm({ title: '', content: '' });
    }
    setShowTemplateModal(true);
  };

  // Handlers - Campaign
  const handleSaveCampaign = async (e) => {
    e.preventDefault();
    try {
      const data = { ...campaignForm };
      if (!data.mediaId) delete data.mediaId;
      if (!data.startDate) delete data.startDate;
      if (!data.endDate) delete data.endDate;

      if (editingItem) {
        await apiService.updateCampaign(editingItem.id, data);
        showAlert('success', 'Sucesso', 'Campanha atualizada com sucesso');
      } else {
        await apiService.createCampaign(data);
        showAlert('success', 'Sucesso', 'Campanha criada com sucesso');
      }
      setShowCampaignModal(false);
      fetchCampaigns();
      setCampaignForm({
        name: '',
        description: '',
        content: '',
        mediaId: '',
        startDate: '',
        endDate: '',
        status: 'active'
      });
      setEditingItem(null);
    } catch (error) {
      showAlert('error', 'Erro', 'Erro ao salvar campanha');
    }
  };

  const handleDeleteCampaign = (item) => {
    setDeleteConfirmation({
      isOpen: true,
      type: 'campaign',
      id: item.id,
      title: item.name
    });
  };

  const confirmDelete = async () => {
    const { type, id } = deleteConfirmation;
    try {
      if (type === 'template') {
        await apiService.deleteTemplate(id);
        showAlert('success', 'Sucesso', 'Mensagem excluída');
        fetchTemplates();
      } else if (type === 'campaign') {
        await apiService.deleteCampaign(id);
        showAlert('success', 'Sucesso', 'Campanha excluída');
        fetchCampaigns();
      }
    } catch (error) {
      showAlert('error', 'Erro', `Erro ao excluir ${type === 'template' ? 'mensagem' : 'campanha'}`);
    } finally {
      setDeleteConfirmation({ isOpen: false, type: null, id: null, title: '' });
    }
  };

  const openCampaignModal = (campaign = null) => {
    if (campaign) {
      setEditingItem(campaign);
      setCampaignForm({
        name: campaign.name,
        description: campaign.description || '',
        content: campaign.content,
        mediaId: campaign.mediaId || '',
        startDate: campaign.startDate ? campaign.startDate.split('T')[0] : '',
        endDate: campaign.endDate ? campaign.endDate.split('T')[0] : '',
        status: campaign.status || 'active'
      });
      // Set selected media if exists
      if (campaign.media) {
        setSelectedMedia(campaign.media);
      } else {
        setSelectedMedia(null);
      }
    } else {
      setEditingItem(null);
      setCampaignForm({
        name: '',
        description: '',
        content: '',
        mediaId: '',
        startDate: '',
        endDate: '',
        status: 'active'
      });
      setSelectedMedia(null);
    }
    setShowCampaignModal(true);
  };

  // Slash Menu Handlers
  const handleContentChange = (e) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart;

    setCampaignForm(prev => ({ ...prev, content: value }));

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
    const text = campaignForm.content;
    const textBeforeCursor = text.substring(0, cursorPosition);
    const slashIndex = textBeforeCursor.lastIndexOf('/');

    const newText = text.substring(0, slashIndex) + template.content + text.substring(cursorPosition);

    setCampaignForm(prev => ({ ...prev, content: newText }));
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

  // Renderers
  const renderPagination = () => {
    if (pagination.pages <= 1) return null;
    return (
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
    );
  };

  return (
    <div style={styles.container}>
      <AlertToast
        open={alertState.open}
        variant={alertState.variant}
        title={alertState.title}
        message={alertState.message}
        onClose={() => setAlertState(prev => ({ ...prev, open: false }))}
      />

      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>
          {activeTab === 'templates' ? <MessageSquare size={32} style={styles.titleIcon} /> : <Megaphone size={32} style={styles.titleIcon} />}
          {activeTab === 'templates' ? 'Mensagens Prontas' : 'Campanhas'}
        </h1>
        <p style={styles.subtitle}>
          {activeTab === 'templates'
            ? 'Gerencie modelos de mensagens para uso rápido.'
            : 'Crie e gerencie suas campanhas de marketing.'}
        </p>
      </div>

      {/* Tabs */}
      <div style={styles.tabsContainer}>
        <button
          onClick={() => setActiveTab('templates')}
          style={{ ...styles.tabButton, ...(activeTab === 'templates' ? styles.activeTab : styles.inactiveTab) }}
        >
          <MessageSquare size={18} /> Mensagens Prontas
        </button>
        <button
          onClick={() => setActiveTab('campaigns')}
          style={{ ...styles.tabButton, ...(activeTab === 'campaigns' ? styles.activeTab : styles.inactiveTab) }}
        >
          <Megaphone size={18} /> Campanhas
        </button>
      </div>

      {/* Content */}
      <div style={styles.card}>
        <div style={styles.actionsHeader}>
          <div style={styles.searchWrapper}>
            <Search size={16} style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Buscar..."
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
              style={styles.searchInput}
            />
          </div>
          <button
            onClick={() => activeTab === 'templates' ? openTemplateModal() : openCampaignModal()}
            style={styles.createButton}
          >
            <Plus size={18} />
            {activeTab === 'templates' ? 'Nova Mensagem' : 'Nova Campanha'}
          </button>
        </div>

        {activeTab === 'templates' ? (
          // Templates Table
          <>
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Título</th>
                    <th style={styles.th}>Conteúdo</th>
                    <th style={styles.th} width="100">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map(item => (
                    <tr key={item.id} style={styles.tr}>
                      <td style={styles.td}><strong>{item.title}</strong></td>
                      <td style={styles.td}>
                        <div style={styles.truncateCell}>{item.content}</div>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actionButtons}>
                          <button onClick={() => openTemplateModal(item)} style={styles.iconButton}>
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDeleteTemplate(item)} style={{ ...styles.iconButton, color: '#ef4444' }}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {templates.length === 0 && (
                    <tr>
                      <td colSpan="3" style={{ ...styles.td, textAlign: 'center', padding: '32px' }}>
                        Nenhuma mensagem encontrada
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {renderPagination()}
          </>
        ) : (
          // Campaigns Table
          <>
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Nome</th>
                    <th style={styles.th}>Período</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Mídia</th>
                    <th style={styles.th} width="100">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map(item => (
                    <tr key={item.id} style={styles.tr}>
                      <td style={styles.td}>
                        <div style={{ fontWeight: '600' }}>{item.name}</div>
                        <div style={{ fontSize: '12px', color: currentTheme.textSecondary }}>{item.description}</div>
                      </td>
                      <td style={styles.td}>
                        {item.startDate ? new Date(item.startDate).toLocaleDateString() : '-'}
                        {' até '}
                        {item.endDate ? new Date(item.endDate).toLocaleDateString() : '-'}
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.statusBadge,
                          backgroundColor: item.status === 'active' ? '#d1fae5' : '#f3f4f6',
                          color: item.status === 'active' ? '#065f46' : '#374151'
                        }}>
                          {item.status === 'active' ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {item.media ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <ImageIcon size={14} /> {item.media.filename}
                          </div>
                        ) : '-'}
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actionButtons}>
                          <button onClick={() => openCampaignModal(item)} style={styles.iconButton}>
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDeleteCampaign(item)} style={{ ...styles.iconButton, color: '#ef4444' }}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {campaigns.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ ...styles.td, textAlign: 'center', padding: '32px' }}>
                        Nenhuma campanha encontrada
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {renderPagination()}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.isOpen && (
        <div style={styles.modalOverlay} onClick={() => setDeleteConfirmation({ isOpen: false, type: null, id: null, title: '' })}>
          <div style={{ ...styles.modal, maxWidth: '450px' }} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Confirmar Exclusão</h2>
              <button style={styles.closeButton} onClick={() => setDeleteConfirmation({ isOpen: false, type: null, id: null, title: '' })}>
                <X size={20} />
              </button>
            </div>
            <div style={styles.modalBody}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#dc2626' }}>
                  <AlertCircle size={32} />
                  <p style={{ margin: 0, color: currentTheme.textPrimary }}>
                    Tem certeza que deseja excluir <strong>{deleteConfirmation.title}</strong>? Esta ação não pode ser desfeita.
                  </p>
                </div>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button
                style={{ ...styles.btn, backgroundColor: 'transparent', border: `1px solid ${currentTheme.border}`, color: currentTheme.textPrimary }}
                onClick={() => setDeleteConfirmation({ isOpen: false, type: null, id: null, title: '' })}
              >
                Cancelar
              </button>
              <button
                style={{ ...styles.btn, backgroundColor: '#dc2626', color: 'white', border: 'none' }}
                onClick={confirmDelete}
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template Modal */}
      {showTemplateModal && (
        <div style={styles.modalOverlay} onClick={() => setShowTemplateModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{editingItem ? 'Editar Mensagem' : 'Nova Mensagem'}</h2>
              <button style={styles.closeButton} onClick={() => setShowTemplateModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveTemplate} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div style={styles.modalBody}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Título</label>
                  <input
                    type="text"
                    value={templateForm.title}
                    onChange={e => setTemplateForm(prev => ({ ...prev, title: e.target.value }))}
                    required
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Conteúdo</label>
                  <textarea
                    value={templateForm.content}
                    onChange={e => setTemplateForm(prev => ({ ...prev, content: e.target.value }))}
                    rows={6}
                    required
                    style={styles.input}
                  />
                </div>
              </div>
              <div style={styles.modalFooter}>
                <button
                  style={{ ...styles.btn, backgroundColor: 'transparent', border: `1px solid ${currentTheme.border}`, color: currentTheme.textPrimary }}
                  type="button"
                  onClick={() => setShowTemplateModal(false)}
                >
                  Cancelar
                </button>
                <button
                  style={{ ...styles.btn, backgroundColor: currentTheme.primary, color: 'white', border: 'none' }}
                  type="submit"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Campaign Modal */}
      {showCampaignModal && (
        <div style={styles.modalOverlay} onClick={() => setShowCampaignModal(false)}>
          <div style={{ ...styles.modal, maxWidth: '700px' }} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{editingItem ? 'Editar Campanha' : 'Nova Campanha'}</h2>
              <button style={styles.closeButton} onClick={() => setShowCampaignModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveCampaign} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div style={styles.modalBody}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Nome da Campanha</label>
                  <input
                    type="text"
                    value={campaignForm.name}
                    onChange={e => setCampaignForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Descrição (Opcional)</label>
                  <input
                    type="text"
                    value={campaignForm.description}
                    onChange={e => setCampaignForm(prev => ({ ...prev, description: e.target.value }))}
                    style={styles.input}
                  />
                </div>
                <div style={{ display: 'flex', gap: '16px', flexDirection: window.innerWidth < 768 ? 'column' : 'row' }}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Data Início</label>
                    <input
                      type="date"
                      value={campaignForm.startDate}
                      onChange={e => setCampaignForm(prev => ({ ...prev, startDate: e.target.value }))}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Data Fim</label>
                    <input
                      type="date"
                      value={campaignForm.endDate}
                      onChange={e => setCampaignForm(prev => ({ ...prev, endDate: e.target.value }))}
                      style={styles.input}
                    />
                  </div>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Mídia (Opcional)</label>

                  {selectedMedia ? (
                    <div className="selected-media-preview" style={styles.mediaPreview}>
                      <div className="media-info" style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                        <div className="preview-thumbnail" style={styles.thumbnail}>
                          {selectedMedia.type === 'image' ? (
                            <img src={getFileUrl(selectedMedia.path)} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            getFileIcon(selectedMedia.type)
                          )}
                        </div>
                        <span className="media-name" style={{ fontSize: '14px', color: currentTheme.textPrimary }}>
                          {selectedMedia.name || selectedMedia.filename}
                        </span>
                      </div>
                      <button type="button" onClick={removeMedia} style={styles.iconButton}>
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={openGallery}
                      style={styles.attachButton}
                    >
                      <ImageIcon size={18} />
                      Selecionar da Galeria
                    </button>
                  )}
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Texto da Mensagem</label>
                  <textarea
                    ref={textareaRef}
                    value={campaignForm.content}
                    onChange={handleContentChange}
                    onKeyDown={handleContentKeyDown}
                    rows={4}
                    required
                    style={styles.input}
                  />
                  {slashMenu.isOpen && (
                    <div style={{
                      ...styles.slashMenu,
                      top: 'auto',
                      bottom: '100%',
                      left: '0'
                    }}>
                      {templates.filter(t => t.title.toLowerCase().includes(slashMenu.filter.toLowerCase())).length === 0 ? (
                        <div style={{ padding: '8px', color: '#999', fontSize: '12px' }}>Nenhuma mensagem encontrada</div>
                      ) : (
                        templates
                          .filter(t => t.title.toLowerCase().includes(slashMenu.filter.toLowerCase()))
                          .map((template, index) => (
                            <div
                              key={template.id}
                              style={{
                                ...styles.slashMenuItem,
                                backgroundColor: index === slashMenu.activeIndex ? '#f3f4f6' : 'transparent'
                              }}
                              onClick={() => selectSlashTemplate(template)}
                            >
                              <div style={{ fontWeight: '600', fontSize: '13px' }}>{template.title}</div>
                              <div style={{ fontSize: '12px', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {template.content}
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  )}
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Status</label>
                  <select
                    value={campaignForm.status}
                    onChange={e => setCampaignForm(prev => ({ ...prev, status: e.target.value }))}
                    style={styles.input}
                  >
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                  </select>
                </div>
              </div>
              <div style={styles.modalFooter}>
                <button
                  style={{ ...styles.btn, backgroundColor: 'transparent', border: `1px solid ${currentTheme.border}`, color: currentTheme.textPrimary }}
                  type="button"
                  onClick={() => setShowCampaignModal(false)}
                >
                  Cancelar
                </button>
                <button
                  style={{ ...styles.btn, backgroundColor: currentTheme.primary, color: 'white', border: 'none' }}
                  type="submit"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Gallery Modal - Note the extra class for z-index */}
      {showGallery && (
        <div className="modal-overlay modal-overlay-upper" onClick={() => setShowGallery(false)}>
          <div className="modal-content" style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Galeria de Mídia</h2>
              <button className="close-button" onClick={() => setShowGallery(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="gallery-grid">
                {galleryMedias.map(media => (
                  <div key={media.id} className="gallery-item" onClick={() => selectGalleryMedia(media)}>
                    {media.type === 'image' ? (
                      <img src={getFileUrl(media.path)} alt={media.filename} className="gallery-image" />
                    ) : (
                      <div className="gallery-icon">
                        {getFileIcon(media.type)}
                      </div>
                    )}
                    <span className="gallery-name">{media.name || media.filename}</span>
                  </div>
                ))}
                {galleryMedias.length === 0 && (
                  <div style={{ gridColumn: '1 / -1', padding: '32px', textAlign: 'center', color: '#666' }}>
                    Nenhuma mídia encontrada.
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowGallery(false)}>
                Fechar
              </button>
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
  card: {
    backgroundColor: theme.cardBackground,
    borderRadius: '12px',
    boxShadow: theme.shadow,
    border: `1px solid ${theme.border}`,
    padding: '24px'
  },
  actionsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '24px'
  },
  searchWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '300px'
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    color: theme.textSecondary
  },
  searchInput: {
    padding: '10px 10px 10px 36px',
    border: `1px solid ${theme.border}`,
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: theme.background,
    color: theme.textPrimary,
    outline: 'none',
    width: '100%'
  },
  createButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    backgroundColor: theme.primary,
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '600',
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
    borderBottom: `1px solid ${theme.border}`
  },
  tr: {
    borderBottom: `1px solid ${theme.border}`
  },
  td: {
    padding: '12px 16px',
    fontSize: '14px',
    color: theme.textPrimary
  },
  truncateCell: {
    maxWidth: '400px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  actionButtons: {
    display: 'flex',
    gap: '8px'
  },
  iconButton: {
    background: 'none',
    border: 'none',
    color: theme.textSecondary,
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center'
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
  statusBadge: {
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase'
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
    width: '90%',
    maxWidth: '500px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 4px 24px rgba(0,0,0,0.2)'
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
    fontSize: '24px',
    cursor: 'pointer',
    color: theme.textSecondary,
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalBody: {
    padding: '20px',
    overflowY: 'auto',
    flex: 1
  },
  modalFooter: {
    padding: '20px',
    borderTop: `1px solid ${theme.border}`,
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px'
  },
  formGroup: {
    marginBottom: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flex: 1
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: theme.textPrimary
  },
  input: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: `1px solid ${theme.border}`,
    backgroundColor: theme.background,
    color: theme.textPrimary,
    fontSize: '14px',
    outline: 'none'
  },
  btn: {
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  attachButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px',
    border: `1px dashed ${theme.border}`,
    borderRadius: '8px',
    backgroundColor: theme.background,
    color: theme.textSecondary,
    cursor: 'pointer',
    fontSize: '14px',
    width: '100%'
  },
  mediaPreview: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px',
    border: `1px solid ${theme.border}`,
    borderRadius: '8px',
    backgroundColor: theme.background
  },
  thumbnail: {
    width: '40px',
    height: '40px',
    borderRadius: '4px',
    objectFit: 'cover',
    backgroundColor: theme.backgroundSecondary || '#eee',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  slashMenu: {
    position: 'absolute',
    width: '100%',
    maxHeight: '200px',
    overflowY: 'auto',
    backgroundColor: theme.cardBackground,
    border: `1px solid ${theme.border}`,
    borderRadius: '8px',
    boxShadow: theme.shadow,
    zIndex: 100
  },
  slashMenuItem: {
    padding: '8px 12px',
    cursor: 'pointer',
    borderBottom: `1px solid ${theme.border}`
  }
});

export default Campanhas;
