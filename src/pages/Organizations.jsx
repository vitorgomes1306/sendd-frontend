import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import InstanceModal from '../components/ui/InstanceModal';
import AlertToast from '../components/ui/AlertToast'; // Import AlertToast
import { apiService, getApiBaseUrl } from '../services/api';
import '../styles/buttons.css'

const Organizations = () => {
  const { currentTheme } = useTheme();
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showInstanceModal, setShowInstanceModal] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [editingOrg, setEditingOrg] = useState(null);
  const [logoFile, setLogoFile] = useState(null); // State for the logo file

  // State variables for AlertToast
  const [toast, setToast] = useState({ open: false, variant: 'info', title: '', message: '' });

  // State variables for Delete Confirmation Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [orgToDelete, setOrgToDelete] = useState(null);
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
    cidade: '',
    logo: '',
  });

  // Base URL for images
  const apiBaseUrl = getApiBaseUrl();

  // Buscar organizações
  const fetchOrganizations = async () => {
    try {
      const response = await apiService.get('/private/organizations');
      const list = Array.isArray(response.data)
        ? response.data
        : (response.data?.data ?? []);
      setOrganizations(list);
    } catch (error) {
      console.error('Erro ao buscar organizações:', error);
      setOrganizations([]);
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
      cidade: '',
      logo: '',
    });
    setLogoFile(null);
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
      cidade: org.cidade || '',
      logo: org.logo || '',
    });
    setLogoFile(null); // Reset file input on edit open (user might not want to change it)
    setEditingOrg(org);
    setShowModal(true);
  };

  // Abrir modal de instâncias
  const handleInstances = (org) => {
    setSelectedOrganization(org);
    setShowInstanceModal(true);
  };

  // Handle file selection
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setLogoFile(e.target.files[0]);
    }
  };

  // Salvar organização
  const handleSave = async (e) => {
    e.preventDefault();

    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        // Ignora o campo 'logo' do state formData para não enviar string
        if (key !== 'logo') {
          data.append(key, formData[key] || '');
        }
      });

      if (logoFile) {
        data.append('logo', logoFile);
      }

      // Config de headers não é estritamente necessária se o axios detectar FormData, 
      // mas podemos passar explicitamente ou deixar o browser setar o boundary.
      // apiService.post/put usam api.post/put direto.

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      };

      if (editingOrg) {
        await apiService.put(`/private/organizations/${editingOrg.id}`, data, config);
        setToast({
          open: true,
          variant: 'success',
          title: 'Sucesso',
          message: 'Organização atualizada com sucesso!'
        });
      } else {
        await apiService.post('/private/organizations', data, config);
        setToast({
          open: true,
          variant: 'success',
          title: 'Sucesso',
          message: 'Organização criada com sucesso!'
        });
      }

      setShowModal(false);
      resetForm();
      fetchOrganizations();
    } catch (error) {
      console.error('Erro ao salvar organização:', error);
      setToast({
        open: true,
        variant: 'danger',
        title: 'Erro',
        message: error.response?.data?.error || error.response?.data?.message || 'Erro ao salvar organização'
      });
    }
  };

  // Solicitar confirmação de exclusão
  const confirmDelete = (org) => {
    setOrgToDelete(org);
    setShowDeleteModal(true);
  };

  // Executar exclusão
  const executeDelete = async () => {
    if (!orgToDelete) return;

    try {
      await apiService.delete(`/private/organizations/${orgToDelete.id}`);
      setToast({
        open: true,
        variant: 'success',
        title: 'Sucesso',
        message: 'Organização removida com sucesso!'
      });
      fetchOrganizations();
    } catch (error) {
      console.error('Erro ao deletar organização:', error);
      setToast({
        open: true,
        variant: 'danger',
        title: 'Erro',
        message: 'Erro ao deletar organização'
      });
    } finally {
      setShowDeleteModal(false);
      setOrgToDelete(null);
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
            Minhas empresas
          </h1>
          <p style={{
            margin: '0.5rem 0 0 0',
            color: currentTheme.textSecondary,
            fontSize: '0.875rem'
          }}>
            Gerencie suas organizações
          </p>
        </div>

        <button
          onClick={handleCreate}
          className="btn-base btn-new"
        >
          <i className="bi bi-plus-lg"></i>
          Nova Empresa
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
            className="btn-base btn-new"

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
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column'
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
                <div style={{ display: 'flex', gap: '1rem', flex: 1 }}>
                  {/* Logo Display */}
                  {org.logo ? (
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      flexShrink: 0,
                      border: `1px solid ${currentTheme.border}`
                    }}>
                      <img
                        src={`${apiBaseUrl}/${org.logo}`}
                        alt={org.razaoSocial}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    </div>
                  ) : (
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '8px',
                      backgroundColor: currentTheme.borderLight, // Placeholder color
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      color: currentTheme.textSecondary
                    }}>
                      <i className="bi bi-building"></i>
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{
                      fontSize: '1.125rem',
                      fontWeight: '600',
                      margin: '0 0 0.25rem 0',
                      color: currentTheme.textPrimary,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
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
                </div>

                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  marginLeft: '0.5rem'
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
                    onClick={() => confirmDelete(org)}
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
            overflow: 'auto',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
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
                {/* Logo Input */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: currentTheme.textPrimary,
                    marginBottom: '0.5rem'
                  }}>
                    Logomarca da Empresa
                  </label>

                  <div
                    onClick={() => document.getElementById('logo-upload').click()}
                    style={{
                      border: `2px dashed ${currentTheme.border}`,
                      borderRadius: '0.75rem',
                      padding: '2rem',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      backgroundColor: currentTheme.background,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: '150px',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = currentTheme.primary;
                      e.currentTarget.style.backgroundColor = currentTheme.cardBackground;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = currentTheme.border;
                      e.currentTarget.style.backgroundColor = currentTheme.background;
                    }}
                  >
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        handleFileChange(e);
                        // Create preview URL locally
                        if (e.target.files && e.target.files[0]) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            // Store preview in a temp property or state if you preferred, 
                            // but we can just use the file object in the state we already have
                            // and render based on that.
                            // For simplicity, we can force update or let state handle re-render
                          };
                          reader.readAsDataURL(e.target.files[0]);
                        }
                      }}
                      style={{ display: 'none' }}
                    />

                    {/* Preview Logic */}
                    {(logoFile || (editingOrg && editingOrg.logo)) ? (
                      <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img
                          src={logoFile ? URL.createObjectURL(logoFile) : `${apiBaseUrl}/${editingOrg.logo}`}
                          alt="Preview"
                          style={{
                            maxHeight: '120px',
                            maxWidth: '100%',
                            objectFit: 'contain',
                            borderRadius: '4px'
                          }}
                        />
                        <div style={{
                          position: 'absolute',
                          inset: 0,
                          backgroundColor: 'rgba(0,0,0,0.4)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: 0,
                          transition: 'opacity 0.2s',
                          color: 'white',
                          fontWeight: '500'
                        }}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
                        >
                          Alterar Imagem
                        </div>
                      </div>
                    ) : (
                      <>
                        <i className="bi bi-cloud-arrow-up" style={{ fontSize: '2rem', color: currentTheme.primary, marginBottom: '0.5rem' }}></i>
                        <span style={{ fontSize: '0.875rem', color: currentTheme.textSecondary }}>
                          Clique para selecionar uma imagem
                        </span>
                        <span style={{ fontSize: '0.75rem', color: currentTheme.textSecondary, opacity: 0.7, marginTop: '0.25rem' }}>
                          PNG, JPG ou JPEG (Max. 5MB)
                        </span>
                      </>
                    )}
                  </div>
                </div>

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
                  className="btn-base btn-new"
                >
                  {editingOrg ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Instâncias */}
      {
        showInstanceModal && selectedOrganization && (
          <InstanceModal
            organization={selectedOrganization}
            onClose={() => {
              setShowInstanceModal(false);
              setSelectedOrganization(null);
            }}
          />
        )
      }

      {/* Alert Toast */}
      <AlertToast
        open={toast.open}
        variant={toast.variant}
        title={toast.title}
        message={toast.message}
        onClose={() => setToast({ ...toast, open: false })}
      />

      {/* Confirmation Modal for Delete */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: currentTheme.cardBackground,
            borderRadius: '1rem',
            padding: '2rem',
            width: '100%',
            maxWidth: '500px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: `1px solid ${currentTheme.border}`,
            animation: 'slideUp 0.3s ease-out'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: currentTheme.textPrimary,
              marginBottom: '1rem'
            }}>
              Confirmar Exclusão
            </h3>
            <p style={{
              color: currentTheme.textSecondary,
              marginBottom: '1.5rem',
              fontSize: '0.95rem'
            }}>
              Tem certeza que deseja excluir a organização <strong>{orgToDelete?.razaoSocial}</strong>? esta ação não poderá ser desfeita.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                style={{
                  padding: '0.6rem 1.25rem',
                  backgroundColor: 'transparent',
                  color: currentTheme.textSecondary,
                  border: `1px solid ${currentTheme.border}`,
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = currentTheme.background}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                Cancelar
              </button>
              <button
                onClick={executeDelete}
                style={{
                  padding: '0.6rem 1.25rem',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  boxShadow: '0 4px 6px -1px rgba(220, 38, 38, 0.3)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#b91c1c'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#dc2626'}
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

    </div >
  );
};

export default Organizations;