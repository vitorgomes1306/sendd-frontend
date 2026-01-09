import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { apiService, getApiBaseUrl } from '../services/api';
import { Upload, Image as ImageIcon, Video, FileText, Trash2, Search, X, Loader2, File, Music, Edit2 } from 'lucide-react';
import AlertToast from '../components/ui/AlertToast';

const Midias = () => {
  const { currentTheme } = useTheme();
  const styles = getStyles(currentTheme);
  const fileInputRef = useRef(null);

  const [medias, setMedias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, image, video, pdf
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado para modal de upload com nome
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [mediaName, setMediaName] = useState('');

  // Estado para modal de edição de nome
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMedia, setEditingMedia] = useState(null);
  const [newName, setNewName] = useState('');

  // Estado para modal de exclusão
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState(null);

  // Estado para modal de visualização de PDF
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfToView, setPdfToView] = useState(null);

  useEffect(() => {
    loadMedias();
  }, []);

  const loadMedias = async () => {
    try {
      setLoading(true);
      const response = await apiService.getMedias({ limit: 100 });
      setMedias(response.data.data || []);
    } catch (err) {
      console.error('Erro ao carregar mídias:', err);
      setError('Erro ao carregar mídias');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tamanho (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Arquivo muito grande. Limite máximo de 10MB.');
      return;
    }

    setSelectedFile(file);
    // Remove extensão do nome sugerido
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
    setMediaName(nameWithoutExt);
    setShowUploadModal(true);
    
    // Limpar input para permitir selecionar o mesmo arquivo novamente se cancelar
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const confirmUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('name', mediaName);

    try {
      setUploading(true);
      setError('');
      await apiService.uploadMedia(formData);
      setSuccess('Upload realizado com sucesso!');
      setShowUploadModal(false);
      setSelectedFile(null);
      setMediaName('');
      loadMedias();
    } catch (err) {
      console.error('Erro no upload:', err);
      setError('Erro ao fazer upload do arquivo.');
    } finally {
      setUploading(false);
    }
  };

  const cancelUpload = () => {
    setShowUploadModal(false);
    setSelectedFile(null);
    setMediaName('');
  };

  const handleEditName = (media) => {
    setEditingMedia(media);
    setNewName(media.name || media.filename);
    setShowEditModal(true);
  };

  const confirmEditName = async () => {
    if (!editingMedia || !newName.trim()) return;

    try {
      setLoading(true); // Bloqueia a UI levemente
      await apiService.updateMedia(editingMedia.id, { name: newName });
      
      // Atualizar lista localmente
      setMedias(prev => prev.map(m => 
        m.id === editingMedia.id ? { ...m, name: newName } : m
      ));
      
      setSuccess('Nome atualizado com sucesso!');
      setShowEditModal(false);
      setEditingMedia(null);
      setNewName('');
    } catch (err) {
      console.error('Erro ao atualizar nome:', err);
      setError('Erro ao atualizar nome.');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!mediaToDelete) return;

    try {
      await apiService.deleteMedia(mediaToDelete.id);
      setSuccess('Arquivo excluído com sucesso!');
      setMedias(prev => prev.filter(m => m.id !== mediaToDelete.id));
      setShowDeleteModal(false);
      setMediaToDelete(null);
    } catch (err) {
      console.error('Erro ao excluir:', err);
      setError('Erro ao excluir arquivo.');
    }
  };

  const handleDelete = (media) => {
    setMediaToDelete(media);
    setShowDeleteModal(true);
  };

  const handleViewPdf = (media) => {
    setPdfToView(media);
    setShowPdfModal(true);
  };

  const filteredMedias = medias.filter(media => {
    const matchesType = filterType === 'all' || media.type === filterType;
    const matchesSearch = (media.name || media.filename).toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getFileIcon = (type) => {
    switch (type) {
      case 'image': return <ImageIcon size={24} />;
      case 'video': return <Video size={24} />;
      case 'audio': return <Music size={24} />;
      case 'pdf': return <FileText size={24} />;
      default: return <File size={24} />;
    }
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // URL base para arquivos (ajuste conforme seu ambiente)
  // Em desenvolvimento local: http://localhost:5001/
  // Em produção: URL do backend
  // Assumindo que o path salvo é relativo 'uploads/file.ext'
  const getFileUrl = (path) => {
    if (!path) return '';
    const baseUrl = getApiBaseUrl().replace(/\/api$/, '');
    const normalizedPath = path.replace(/\\/g, '/');
    if (normalizedPath.startsWith('http')) return normalizedPath;
    const cleanPath = normalizedPath.startsWith('/') ? normalizedPath.substring(1) : normalizedPath;
    return `${baseUrl}/${cleanPath}`;
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Galeria de Mídias</h1>
          <p style={styles.subtitle}>Gerencie suas imagens, vídeos e documentos</p>
        </div>
        
        <div style={styles.actions}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            accept="image/*,video/*,audio/*,application/pdf"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            style={styles.uploadButton}
            disabled={uploading}
          >
            {uploading ? <Loader2 size={20} style={styles.spinner} /> : <Upload size={20} />}
            {uploading ? 'Enviando...' : 'Upload de Mídia'}
          </button>
        </div>
      </div>

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

      <div style={styles.filters}>
        <div style={styles.searchWrapper}>
          <Search size={18} style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar arquivos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        
        <div style={styles.typeFilters}>
          {['all', 'image', 'video', 'audio', 'pdf'].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              style={{
                ...styles.filterButton,
                ...(filterType === type ? styles.activeFilter : {})
              }}
            >
              {type === 'all' ? 'Todos' : type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={styles.loadingState}>Carregando mídias...</div>
      ) : filteredMedias.length === 0 ? (
        <div style={styles.emptyState}>
          <ImageIcon size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
          <p>Nenhuma mídia encontrada</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {filteredMedias.map(media => (
            <div key={media.id} style={styles.card} className="card">
              <div style={styles.previewContainer}>
                {media.type === 'image' ? (
                  <img 
                    src={getFileUrl(media.path)} 
                    alt={media.filename} 
                    style={styles.previewImage} 
                    loading="lazy"
                  />
                ) : media.type === 'video' ? (
                  <video 
                    src={getFileUrl(media.path)} 
                    controls 
                    style={styles.previewImage}
                    preload="metadata"
                  />
                ) : media.type === 'audio' ? (
                  <div style={styles.audioPreview}>
                    <audio 
                      src={getFileUrl(media.path)} 
                      controls 
                      style={{ width: '100%', maxWidth: '180px' }}
                    />
                  </div>
                ) : media.type === 'pdf' ? (
                  <div 
                    style={{...styles.previewIcon, cursor: 'pointer'}} 
                    onClick={() => handleViewPdf(media)}
                    title="Clique para visualizar o PDF"
                  >
                    {getFileIcon(media.type)}
                    <span style={{ fontSize: '10px', marginTop: '4px', display: 'block' }}>Visualizar</span>
                  </div>
                ) : (
                  <div style={styles.previewIcon}>
                    {getFileIcon(media.type)}
                  </div>
                )}
                <div style={styles.cardOverlay}>
                    <button 
                        onClick={() => handleEditName(media)}
                        style={styles.editButton}
                        title="Editar Nome"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button 
                        onClick={() => handleDelete(media)}
                        style={styles.deleteButton}
                        title="Excluir"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
              </div>
              <div style={styles.cardInfo}>
                <p style={styles.filename} title={media.name || media.filename}>{media.name || media.filename}</p>
                <div style={styles.metaInfo}>
                    <span>{formatSize(media.size)}</span>
                    <span>•</span>
                    <span>{new Date(media.dateCreated).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Modal de Upload */}
      {showUploadModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Confirmar Upload</h2>
              <button onClick={cancelUpload} style={styles.closeButton}>
                <X size={24} />
              </button>
            </div>
            
            <div style={styles.modalContent}>
              <div style={styles.filePreview}>
                <div style={styles.fileIcon}>
                    {selectedFile && getFileIcon(
                        selectedFile.type.startsWith('image/') ? 'image' : 
                        selectedFile.type.startsWith('video/') ? 'video' : 
                        selectedFile.type.startsWith('audio/') ? 'audio' : 
                        selectedFile.type === 'application/pdf' ? 'pdf' : 'file'
                    )}
                </div>
                <div style={styles.fileDetails}>
                    <p style={styles.fileName}>{selectedFile?.name}</p>
                    <p style={styles.fileSize}>{selectedFile && formatSize(selectedFile.size)}</p>
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Nome de exibição</label>
                <input
                    type="text"
                    value={mediaName}
                    onChange={(e) => setMediaName(e.target.value)}
                    style={styles.input}
                    placeholder="Nome para identificar a mídia"
                    autoFocus
                />
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button onClick={cancelUpload} style={styles.cancelButton} disabled={uploading}>
                Cancelar
              </button>
              <button onClick={confirmUpload} style={styles.confirmButton} disabled={uploading || !mediaName.trim()}>
                {uploading ? 'Enviando...' : 'Salvar Mídia'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição de Nome */}
      {showEditModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Renomear Mídia</h2>
              <button onClick={() => setShowEditModal(false)} style={styles.closeButton}>
                <X size={24} />
              </button>
            </div>
            
            <div style={styles.modalContent}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Novo nome</label>
                <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    style={styles.input}
                    placeholder="Nome da mídia"
                    autoFocus
                />
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button onClick={() => setShowEditModal(false)} style={styles.cancelButton}>
                Cancelar
              </button>
              <button onClick={confirmEditName} style={styles.confirmButton} disabled={!newName.trim()}>
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Exclusão */}
      {showDeleteModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Excluir Mídia</h2>
              <button onClick={() => setShowDeleteModal(false)} style={styles.closeButton}>
                <X size={24} />
              </button>
            </div>
            
            <div style={styles.modalContent}>
              <p style={{ color: currentTheme.textPrimary }}>
                Tem certeza que deseja excluir o arquivo <strong>{mediaToDelete?.name || mediaToDelete?.filename}</strong>?
              </p>
              <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '8px' }}>
                Esta ação não pode ser desfeita.
              </p>
            </div>

            <div style={styles.modalFooter}>
              <button onClick={() => setShowDeleteModal(false)} style={styles.cancelButton}>
                Cancelar
              </button>
              <button 
                onClick={confirmDelete} 
                style={{ ...styles.confirmButton, backgroundColor: '#ef4444' }}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal de Visualização de PDF */}
      {showPdfModal && pdfToView && (
        <div style={styles.modalOverlay}>
          <div style={{...styles.modal, maxWidth: '900px', width: '90%', height: '90vh', display: 'flex', flexDirection: 'column'}}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{pdfToView.name || pdfToView.filename}</h2>
              <button onClick={() => setShowPdfModal(false)} style={styles.closeButton}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{...styles.modalContent, flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column'}}>
                <iframe 
                    src={getFileUrl(pdfToView.path)} 
                    style={{ width: '100%', flex: 1, border: 'none' }}
                    title="PDF Viewer"
                />
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
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px'
  },
  title: {
    fontSize: '28px', fontWeight: '700', color: theme.textPrimary, margin: 0
  },
  subtitle: {
    fontSize: '14px', color: theme.textSecondary, marginTop: '4px'
  },
  actions: {
    display: 'flex', gap: '12px'
  },
  uploadButton: {
    display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
    backgroundColor: theme.primary, color: 'white', border: 'none', borderRadius: '8px',
    cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s',
    ':hover': { backgroundColor: theme.primaryDark }
  },
  filters: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px'
  },
  searchWrapper: {
    display: 'flex', alignItems: 'center', backgroundColor: theme.cardBackground,
    border: `1px solid ${theme.border}`, borderRadius: '8px', padding: '8px 12px',
    width: '100%', maxWidth: '300px'
  },
  searchIcon: {
    color: theme.textSecondary, marginRight: '8px'
  },
  searchInput: {
    border: 'none', background: 'transparent', outline: 'none', color: theme.textPrimary, width: '100%'
  },
  typeFilters: {
    display: 'flex', gap: '8px'
  },
  filterButton: {
    padding: '6px 12px', borderRadius: '6px', border: `1px solid ${theme.border}`,
    backgroundColor: theme.cardBackground, color: theme.textSecondary, cursor: 'pointer',
    fontSize: '13px', fontWeight: '500'
  },
  activeFilter: {
    backgroundColor: theme.primary + '20', color: theme.primary, borderColor: theme.primary
  },
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px'
  },
  card: {
    backgroundColor: theme.cardBackground, borderRadius: '12px', overflow: 'hidden',
    border: `1px solid ${theme.border}`, boxShadow: theme.shadow,
    display: 'flex', flexDirection: 'column'
  },
  previewContainer: {
    height: '140px', backgroundColor: theme.backgroundSecondary, display: 'flex',
    alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden'
  },
  previewImage: {
    width: '100%', height: '100%', objectFit: 'cover'
  },
  audioPreview: {
    width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.background
  },
  previewIcon: {
    color: theme.textSecondary
  },
  cardOverlay: {
    position: 'absolute', top: 0, right: 0, padding: '8px',
    opacity: 1, transition: 'opacity 0.2s', backgroundColor: 'transparent', width: '100%', height: '100%',
    display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start',
    pointerEvents: 'none' // Permite clicar na imagem se necessário, mas os botões precisam de pointerEvents: auto
  },
  deleteButton: {
    padding: '6px', borderRadius: '4px', backgroundColor: '#ef4444', color: 'white',
    border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    pointerEvents: 'auto', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
  },
  editButton: {
    padding: '6px', borderRadius: '4px', backgroundColor: theme.primary, color: 'white',
    border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '8px',
    pointerEvents: 'auto', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
  },
  cardInfo: {
    padding: '12px', borderTop: `1px solid ${theme.border}`
  },
  filename: {
    fontSize: '14px', fontWeight: '500', color: theme.textPrimary, margin: '0 0 4px 0',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
  },
  metaInfo: {
    fontSize: '11px', color: theme.textSecondary, display: 'flex', gap: '4px'
  },
  loadingState: {
    textAlign: 'center', padding: '40px', color: theme.textSecondary
  },
  emptyState: {
    textAlign: 'center', padding: '60px', color: theme.textSecondary,
    display: 'flex', flexDirection: 'column', alignItems: 'center'
  },
  spinner: {
    animation: 'spin 1s linear infinite'
  },
  modalOverlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
  },
  modal: {
    backgroundColor: theme.cardBackground, borderRadius: '12px', width: '100%', maxWidth: '500px',
    boxShadow: theme.shadow, overflow: 'hidden'
  },
  modalHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px',
    borderBottom: `1px solid ${theme.border}`
  },
  modalTitle: {
    fontSize: '18px', fontWeight: '600', color: theme.textPrimary, margin: 0
  },
  closeButton: {
    background: 'none', border: 'none', color: theme.textSecondary, cursor: 'pointer'
  },
  modalContent: {
    padding: '24px'
  },
  modalFooter: {
    padding: '16px 24px', borderTop: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'flex-end', gap: '12px'
  },
  formGroup: {
    marginBottom: '16px'
  },
  label: {
    display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: theme.textPrimary
  },
  input: {
    width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${theme.border}`,
    backgroundColor: theme.background, color: theme.textPrimary, outline: 'none', fontSize: '14px'
  },
  filePreview: {
    display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px',
    padding: '12px', backgroundColor: theme.background, borderRadius: '8px', border: `1px solid ${theme.border}`
  },
  fileIcon: {
    color: theme.primary
  },
  fileDetails: {
    flex: 1, overflow: 'hidden'
  },
  fileName: {
    fontSize: '14px', fontWeight: '500', color: theme.textPrimary, margin: '0 0 4px 0',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
  },
  fileSize: {
    fontSize: '12px', color: theme.textSecondary, margin: 0
  },
  cancelButton: {
    padding: '8px 16px', borderRadius: '6px', border: `1px solid ${theme.border}`,
    backgroundColor: 'transparent', color: theme.textPrimary, cursor: 'pointer', fontSize: '14px'
  },
  confirmButton: {
    padding: '8px 16px', borderRadius: '6px', border: 'none',
    backgroundColor: theme.primary, color: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: '500',
    ':disabled': { opacity: 0.7, cursor: 'not-allowed' }
  }
});

// Add hover effect via css in js (simplified)
const styleTag = document.createElement('style');
styleTag.innerHTML = `
  @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  .card:hover .cardOverlay { opacity: 1 !important; }
`;
document.head.appendChild(styleTag);

export default Midias;
