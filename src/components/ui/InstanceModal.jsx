import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import './InstanceModal.css';

const InstanceModal = ({ isOpen, onClose, organizationId, organizationName }) => {
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [newInstance, setNewInstance] = useState({
    instanceName: '',
    tipo: 'WHATSAPP_WEB', // ENUM: WHATSAPP_WEB ou META_CLOUD_API
    atendimento: true,
    notificacoes: true
  });

  useEffect(() => {
    if (isOpen && organizationId) {
      fetchInstances();
    }
  }, [isOpen, organizationId]);

  const fetchInstances = async () => {
    try {
      setLoading(true);
      const response = await apiService.get(`/organizations/${organizationId}/instances`);
      setInstances(response.data.instances || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInstance = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    setQrCode('');

    try {
      const response = await apiService.post(`/organizations/${organizationId}/instances`, {
        ...newInstance,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS'
      });

      const data = response.data;

      setSuccess('Instância criada com sucesso!');
      if (data.qrcode) {
        setQrCode(data.qrcode);
      }
      setShowCreateForm(false);
      setNewInstance({
        instanceName: '',
        tipo: 'WHATSAPP_WEB',
        atendimento: true,
        notificacoes: true
      });
      fetchInstances();
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInstance = async (instanceId) => {
    if (!confirm('Tem certeza que deseja excluir esta instância?')) return;

    try {
      setLoading(true);
      await apiService.delete(`/organizations/${organizationId}/instances/${instanceId}`);
      setSuccess('Instância excluída com sucesso!');
      fetchInstances();
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewInstance(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content instance-modal">
        <div className="modal-header">
          <h2>Instâncias WhatsApp - {organizationName}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {qrCode && (
            <div className="qr-code-section">
              <h3>QR Code para Conexão</h3>
              <div className="qr-code-container">
                <img src={qrCode} alt="QR Code WhatsApp" />
              </div>
              <p>Escaneie este QR Code com o WhatsApp para conectar a instância</p>
              <button 
                className="btn btn-secondary"
                onClick={() => setQrCode('')}
              >
                Fechar QR Code
              </button>
            </div>
          )}

          {!showCreateForm && !qrCode && (
            <div className="instances-section">
              <div className="section-header">
                <h3>Instâncias Ativas</h3>
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowCreateForm(true)}
                  disabled={loading}
                >
                  Nova Instância 2
                </button>
              </div>

              {loading ? (
                <div className="loading">Carregando...</div>
              ) : instances.length === 0 ? (
                <div className="empty-state">
                  <p>Nenhuma instância encontrada</p>
                  <p>Crie uma nova instância para começar a usar o WhatsApp</p>
                </div>
              ) : (
                <div className="instances-list">
                  {instances.map((instance) => (
                    <div key={instance.id} className="instance-card">
                      <div className="instance-info">
                        <h4>{instance.instanceName}</h4>
                        <p><strong>Status:</strong> {instance.status}</p>
                        <p><strong>ID:</strong> {instance.instanceId}</p>
                        {instance.number && <p><strong>Número:</strong> {instance.number}</p>}
                      </div>
                      <div className="instance-actions">
                        <button 
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteInstance(instance.id)}
                          disabled={loading}
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {showCreateForm && !qrCode && (
            <div className="create-form-section">
              <div className="section-header">
                <h3>Nova Instância WhatsApp</h3>
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancelar
                </button>
              </div>

              <form onSubmit={handleCreateInstance} className="create-instance-form">
                <div className="form-group">
                  <label htmlFor="instanceName">Nome da Instância *</label>
                  <input
                    type="text"
                    id="instanceName"
                    name="instanceName"
                    value={newInstance.instanceName}
                    onChange={handleInputChange}
                    required
                    placeholder="Ex: WhatsApp Vendas"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="tipo">Tipo da Instância *</label>
                  <select
                    id="tipo"
                    name="tipo"
                    value={newInstance.tipo}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="WHATSAPP_WEB">WhatsApp Web</option>
                    <option value="META_CLOUD_API">Meta Cloud API</option>
                  </select>
                </div>

                <div className="form-group-row">
                  <div className="checkbox-group">
                    <input
                      type="checkbox"
                      id="atendimento"
                      name="atendimento"
                      checked={newInstance.atendimento}
                      onChange={handleInputChange}
                    />
                    <label htmlFor="atendimento">Atendimento</label>
                  </div>

                  <div className="checkbox-group">
                    <input
                      type="checkbox"
                      id="notificacoes"
                      name="notificacoes"
                      checked={newInstance.notificacoes}
                      onChange={handleInputChange}
                    />
                    <label htmlFor="notificacoes">Notificações</label>
                  </div>
                </div>

                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Criando...' : 'Criar Instância'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstanceModal;