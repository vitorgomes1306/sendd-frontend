import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import InstanceModal from '../components/ui/InstanceModal';
import { apiService } from '../services/api';

const Organizations = () => {
  const { currentTheme } = useTheme();
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showInstanceModal, setShowInstanceModal] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [editingOrg, setEditingOrg] = useState(null);
  const [formData, setFormData] = useState({
    razaoSocial: '',
    cnpj: '',
    nomeFantasia: '',
    email: '',
    telefone: '',
    endereco: '',
    numero: '',
    bairro: '',
    cep: '',
    estado: '',
    cidade: ''
  });

  // Buscar organizações
  const fetchOrganizations = async () => {
    try {
      const data = await apiService.get('/private/organizations');
      setOrganizations(data);
    } catch (error) {
      console.error('Erro ao buscar organizações:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  // Resetar formulário
  const resetForm = () => {
    setFormData({
      razaoSocial: '',
      cnpj: '',
      nomeFantasia: '',
      email: '',
      telefone: '',
      endereco: '',
      numero: '',
      bairro: '',
      cep: '',
      estado: '',
      cidade: ''
    });
    setEditingOrg(null);
  };

  // Abrir modal para criar
  const handleCreate = () => {
    resetForm();
    setShowModal(true);
  };

  // Abrir modal para editar
  const handleEdit = (org) => {
    setFormData({
      razaoSocial: org.razaoSocial || '',
      cnpj: org.cnpj || '',
      nomeFantasia: org.nomeFantasia || '',
      email: org.email || '',
      telefone: org.telefone || '',
      endereco: org.endereco || '',
      numero: org.numero || '',
      bairro: org.bairro || '',
      cep: org.cep || '',
      estado: org.estado || '',
      cidade: org.cidade || ''
    });
    setEditingOrg(org);
    setShowModal(true);
  };

  // Abrir modal de instâncias
  const handleInstances = (org) => {
    setSelectedOrganization(org);
    setShowInstanceModal(true);
  };

  // Salvar organização
  const handleSave = async (e) => {
    e.preventDefault();
    
    try {
      if (editingOrg) {
        await apiService.put(`/private/organizations/${editingOrg.id}`, formData);
      } else {
        await apiService.post('/private/organizations', formData);
      }
      
      setShowModal(false);
      resetForm();
      fetchOrganizations();
    } catch (error) {
      console.error('Erro ao salvar organização:', error);
      alert(error.response?.data?.error || 'Erro ao salvar organização');
    }
  };

  // Deletar organização
  const handleDelete = async (org) => {
    if (!confirm(`Tem certeza que deseja deletar a organização "${org.razaoSocial}"?`)) {
      return;
    }

    try {
      await apiService.delete(`/private/organizations/${org.id}`);
      fetchOrganizations();
    } catch (error) {
      console.error('Erro ao deletar organização:', error);
      alert(error.response?.data?.error || 'Erro ao deletar organização');
    }
  };

  // Atualizar campo do formulário
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div style={{
        padding: '2rem',
        fontFamily: 'Poppins, sans-serif',
        color: currentTheme.textPrimary,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        Carregando...
      </div>
    );
  }

  return (
    <div style={{
      padding: '2rem',
      fontFamily: 'Poppins, sans-serif',
      color: currentTheme.textPrimary
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: '600',
            margin: 0,
            color: currentTheme.textPrimary
          }}>
            Organizations
          </h1>
          <p style={{
            margin: '0.5rem 0 0 0',
            color: currentTheme.textSecondary,
            fontSize: '0.875rem'
          }}>
            Gerencie suas organizações e empresas
          </p>
        </div>
        
        <button
          onClick={handleCreate}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: currentTheme.primary,
            color: 'white',
            border: 'none',
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
          <i className="bi bi-plus-lg"></i>
          Nova Organização
        </button>
      </div>

      {/* Lista de Organizações */}
      {organizations.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          backgroundColor: currentTheme.cardBackground,
          borderRadius: '0.75rem',
          border: `1px solid ${currentTheme.border}`
        }}>
          <i className="bi bi-building" style={{
            fontSize: '3rem',
            color: currentTheme.textSecondary,
            marginBottom: '1rem',
            display: 'block'
          }}></i>
          <h3 style={{
            color: currentTheme.textPrimary,
            marginBottom: '0.5rem'
          }}>
            Nenhuma organização encontrada
          </h3>
          <p style={{
            color: currentTheme.textSecondary,
            marginBottom: '1.5rem'
          }}>
            Crie sua primeira organização para começar
          </p>
          <button
            onClick={handleCreate}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: currentTheme.primary,
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Criar Organização
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gap: '1.5rem',
          gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))'
        }}>
          {organizations.map((org) => (
            <div
              key={org.id}
              style={{
                backgroundColor: currentTheme.cardBackground,
                border: `1px solid ${currentTheme.border}`,
                borderRadius: '0.75rem',
                padding: '1.5rem',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = currentTheme.shadow;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1rem'
              }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    margin: '0 0 0.25rem 0',
                    color: currentTheme.textPrimary
                  }}>
                    {org.razaoSocial}
                  </h3>
                  {org.nomeFantasia && (
                    <p style={{
                      fontSize: '0.875rem',
                      color: currentTheme.textSecondary,
                      margin: '0 0 0.5rem 0'
                    }}>
                      {org.nomeFantasia}
                    </p>
                  )}
                  <p style={{
                    fontSize: '0.75rem',
                    color: currentTheme.textSecondary,
                    margin: 0,
                    fontFamily: 'monospace'
                  }}>
                    CNPJ: {org.cnpj}
                  </p>
                </div>
                
                <div style={{
                  display: 'flex',
                  gap: '0.5rem'
                }}>
                  <button
                    onClick={() => handleInstances(org)}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: 'transparent',
                      color: currentTheme.primary,
                      border: `1px solid ${currentTheme.primary}`,
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = currentTheme.primary;
                      e.target.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                      e.target.style.color = currentTheme.primary;
                    }}
                    title="Gerenciar Instâncias WhatsApp"
                  >
                    <i className="bi bi-whatsapp"></i>
                  </button>
                  <button
                    onClick={() => handleEdit(org)}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: 'transparent',
                      color: currentTheme.textSecondary,
                      border: `1px solid ${currentTheme.border}`,
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = currentTheme.borderLight;
                      e.target.style.color = currentTheme.textPrimary;
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                      e.target.style.color = currentTheme.textSecondary;
                    }}
                  >
                    <i className="bi bi-pencil"></i>
                  </button>
                  <button
                    onClick={() => handleDelete(org)}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: 'transparent',
                      color: '#ef4444',
                      border: '1px solid #ef4444',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#ef4444';
                      e.target.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                      e.target.style.color = '#ef4444';
                    }}
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.75rem',
                fontSize: '0.875rem'
              }}>
                <div>
                  <strong style={{ color: currentTheme.textPrimary }}>Email:</strong>
                  <br />
                  <span style={{ color: currentTheme.textSecondary }}>{org.email}</span>
                </div>
                {org.telefone && (
                  <div>
                    <strong style={{ color: currentTheme.textPrimary }}>Telefone:</strong>
                    <br />
                    <span style={{ color: currentTheme.textSecondary }}>{org.telefone}</span>
                  </div>
                )}
                {org.cidade && org.estado && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <strong style={{ color: currentTheme.textPrimary }}>Localização:</strong>
                    <br />
                    <span style={{ color: currentTheme.textSecondary }}>
                      {org.cidade}, {org.estado}
                    </span>
                  </div>
                )}
              </div>

              {org.teams && org.teams.length > 0 && (
                <div style={{
                  marginTop: '1rem',
                  paddingTop: '1rem',
                  borderTop: `1px solid ${currentTheme.border}`
                }}>
                  <p style={{
                    fontSize: '0.75rem',
                    color: currentTheme.textSecondary,
                    margin: 0
                  }}>
                    {org.teams.length} equipe{org.teams.length !== 1 ? 's' : ''} cadastrada{org.teams.length !== 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: currentTheme.cardBackground,
            borderRadius: '0.75rem',
            padding: '2rem',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                margin: 0,
                color: currentTheme.textPrimary
              }}>
                {editingOrg ? 'Editar Organização' : 'Nova Organização'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '0.5rem',
                  backgroundColor: 'transparent',
                  color: currentTheme.textSecondary,
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '1.25rem'
                }}
              >
                <i className="bi bi-x"></i>
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: currentTheme.textPrimary,
                    marginBottom: '0.5rem'
                  }}>
                    Razão Social *
                  </label>
                  <input
                    type="text"
                    name="razaoSocial"
                    value={formData.razaoSocial}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `1px solid ${currentTheme.border}`,
                      borderRadius: '0.5rem',
                      backgroundColor: currentTheme.background,
                      color: currentTheme.textPrimary,
                      fontSize: '0.875rem',
                      fontFamily: 'Poppins, sans-serif'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: currentTheme.textPrimary,
                    marginBottom: '0.5rem'
                  }}>
                    CNPJ *
                  </label>
                  <input
                    type="text"
                    name="cnpj"
                    value={formData.cnpj}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `1px solid ${currentTheme.border}`,
                      borderRadius: '0.5rem',
                      backgroundColor: currentTheme.background,
                      color: currentTheme.textPrimary,
                      fontSize: '0.875rem',
                      fontFamily: 'Poppins, sans-serif'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: currentTheme.textPrimary,
                    marginBottom: '0.5rem'
                  }}>
                    Nome Fantasia
                  </label>
                  <input
                    type="text"
                    name="nomeFantasia"
                    value={formData.nomeFantasia}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `1px solid ${currentTheme.border}`,
                      borderRadius: '0.5rem',
                      backgroundColor: currentTheme.background,
                      color: currentTheme.textPrimary,
                      fontSize: '0.875rem',
                      fontFamily: 'Poppins, sans-serif'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: currentTheme.textPrimary,
                    marginBottom: '0.5rem'
                  }}>
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `1px solid ${currentTheme.border}`,
                      borderRadius: '0.5rem',
                      backgroundColor: currentTheme.background,
                      color: currentTheme.textPrimary,
                      fontSize: '0.875rem',
                      fontFamily: 'Poppins, sans-serif'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: currentTheme.textPrimary,
                    marginBottom: '0.5rem'
                  }}>
                    Telefone
                  </label>
                  <input
                    type="text"
                    name="telefone"
                    value={formData.telefone}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `1px solid ${currentTheme.border}`,
                      borderRadius: '0.5rem',
                      backgroundColor: currentTheme.background,
                      color: currentTheme.textPrimary,
                      fontSize: '0.875rem',
                      fontFamily: 'Poppins, sans-serif'
                    }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: currentTheme.textPrimary,
                    marginBottom: '0.5rem'
                  }}>
                    Endereço
                  </label>
                  <input
                    type="text"
                    name="endereco"
                    value={formData.endereco}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `1px solid ${currentTheme.border}`,
                      borderRadius: '0.5rem',
                      backgroundColor: currentTheme.background,
                      color: currentTheme.textPrimary,
                      fontSize: '0.875rem',
                      fontFamily: 'Poppins, sans-serif'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: currentTheme.textPrimary,
                    marginBottom: '0.5rem'
                  }}>
                    Número
                  </label>
                  <input
                    type="text"
                    name="numero"
                    value={formData.numero}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `1px solid ${currentTheme.border}`,
                      borderRadius: '0.5rem',
                      backgroundColor: currentTheme.background,
                      color: currentTheme.textPrimary,
                      fontSize: '0.875rem',
                      fontFamily: 'Poppins, sans-serif'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: currentTheme.textPrimary,
                    marginBottom: '0.5rem'
                  }}>
                    Bairro
                  </label>
                  <input
                    type="text"
                    name="bairro"
                    value={formData.bairro}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `1px solid ${currentTheme.border}`,
                      borderRadius: '0.5rem',
                      backgroundColor: currentTheme.background,
                      color: currentTheme.textPrimary,
                      fontSize: '0.875rem',
                      fontFamily: 'Poppins, sans-serif'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: currentTheme.textPrimary,
                    marginBottom: '0.5rem'
                  }}>
                    CEP
                  </label>
                  <input
                    type="text"
                    name="cep"
                    value={formData.cep}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `1px solid ${currentTheme.border}`,
                      borderRadius: '0.5rem',
                      backgroundColor: currentTheme.background,
                      color: currentTheme.textPrimary,
                      fontSize: '0.875rem',
                      fontFamily: 'Poppins, sans-serif'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: currentTheme.textPrimary,
                    marginBottom: '0.5rem'
                  }}>
                    Estado
                  </label>
                  <input
                    type="text"
                    name="estado"
                    value={formData.estado}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `1px solid ${currentTheme.border}`,
                      borderRadius: '0.5rem',
                      backgroundColor: currentTheme.background,
                      color: currentTheme.textPrimary,
                      fontSize: '0.875rem',
                      fontFamily: 'Poppins, sans-serif'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: currentTheme.textPrimary,
                    marginBottom: '0.5rem'
                  }}>
                    Cidade
                  </label>
                  <input
                    type="text"
                    name="cidade"
                    value={formData.cidade}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `1px solid ${currentTheme.border}`,
                      borderRadius: '0.5rem',
                      backgroundColor: currentTheme.background,
                      color: currentTheme.textPrimary,
                      fontSize: '0.875rem',
                      fontFamily: 'Poppins, sans-serif'
                    }}
                  />
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'flex-end'
              }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: 'transparent',
                    color: currentTheme.textSecondary,
                    border: `1px solid ${currentTheme.border}`,
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    fontFamily: 'Poppins, sans-serif'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: currentTheme.primary,
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    fontFamily: 'Poppins, sans-serif'
                  }}
                >
                  {editingOrg ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Instâncias */}
      {showInstanceModal && selectedOrganization && (
        <InstanceModal
          organization={selectedOrganization}
          onClose={() => {
            setShowInstanceModal(false);
            setSelectedOrganization(null);
          }}
        />
      )}
    </div>
  );
};

export default Organizations;