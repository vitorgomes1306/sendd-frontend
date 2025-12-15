import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

const Teams = () => {
  const { currentTheme } = useTheme();
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    funcao: 'Atendente',
    setor: '',
    organizationId: ''
  });

  const funcoes = ['Atendente', 'Membro', 'Gerente', 'Administrador'];

  // Buscar equipes e organizações
  const fetchData = async () => {
    try {
      // Buscar organizações
      const orgsData = await apiService.get('/private/organizations');
      setOrganizations(orgsData);

      // Buscar equipes
      const teamsData = await apiService.get('/private/teams');
      setTeams(teamsData);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Resetar formulário
  const resetForm = () => {
    setFormData({
      nome: '',
      email: '',
      funcao: 'Atendente',
      setor: '',
      organizationId: organizations.length > 0 ? organizations[0].id : ''
    });
    setEditingTeam(null);
  };

  // Abrir modal para criar
  const handleCreate = () => {
    resetForm();
    setShowModal(true);
  };

  // Abrir modal para editar
  const handleEdit = (team) => {
    setFormData({
      nome: team.nome || '',
      email: team.email || '',
      funcao: team.funcao || 'Atendente',
      setor: team.setor || '',
      organizationId: team.organizationId || ''
    });
    setEditingTeam(team);
    setShowModal(true);
  };

  // Salvar membro da equipe
  const handleSave = async (e) => {
    e.preventDefault();
    
    try {
      if (editingTeam) {
        await apiService.put(`/private/teams/${editingTeam.id}`, formData);
      } else {
        await apiService.post('/private/teams', formData);
      }
      
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Erro ao salvar membro da equipe:', error);
      alert(error.response?.data?.error || 'Erro ao salvar membro da equipe');
    }
  };

  // Deletar membro da equipe
  const handleDelete = async (team) => {
    if (!confirm(`Tem certeza que deseja remover "${team.nome}" da equipe?`)) {
      return;
    }

    try {
      await apiService.delete(`/private/teams/${team.id}`);
      fetchData();
    } catch (error) {
      console.error('Erro ao remover membro da equipe:', error);
      alert(error.response?.data?.error || 'Erro ao remover membro da equipe');
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

  // Obter cor da função
  const getFuncaoColor = (funcao) => {
    switch (funcao) {
      case 'Administrador':
        return '#ef4444';
      case 'Gerente':
        return '#f59e0b';
      case 'Membro':
        return '#10b981';
      case 'Atendente':
        return '#3b82f6';
      default:
        return currentTheme.textSecondary;
    }
  };

  // Agrupar equipes por organização
  const teamsByOrganization = teams.reduce((acc, team) => {
    const orgId = team.organizationId;
    if (!acc[orgId]) {
      acc[orgId] = [];
    }
    acc[orgId].push(team);
    return acc;
  }, {});

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
            Teams
          </h1>
          <p style={{
            margin: '0.5rem 0 0 0',
            color: currentTheme.textSecondary,
            fontSize: '0.875rem'
          }}>
            Gerencie as equipes das suas organizações
          </p>
        </div>
        
        <button
          onClick={handleCreate}
          disabled={organizations.length === 0}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: organizations.length === 0 ? currentTheme.textSecondary : currentTheme.primary,
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: organizations.length === 0 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s',
            opacity: organizations.length === 0 ? 0.6 : 1
          }}
          onMouseEnter={(e) => {
            if (organizations.length > 0) {
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = currentTheme.shadow;
            }
          }}
          onMouseLeave={(e) => {
            if (organizations.length > 0) {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }
          }}
        >
          <i className="bi bi-plus-lg"></i>
          Novo Membro
        </button>
      </div>

      {/* Verificar se há organizações */}
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
            Você precisa criar uma organização antes de gerenciar equipes
          </p>
        </div>
      ) : teams.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          backgroundColor: currentTheme.cardBackground,
          borderRadius: '0.75rem',
          border: `1px solid ${currentTheme.border}`
        }}>
          <i className="bi bi-people" style={{
            fontSize: '3rem',
            color: currentTheme.textSecondary,
            marginBottom: '1rem',
            display: 'block'
          }}></i>
          <h3 style={{
            color: currentTheme.textPrimary,
            marginBottom: '0.5rem'
          }}>
            Nenhum membro encontrado
          </h3>
          <p style={{
            color: currentTheme.textSecondary,
            marginBottom: '1.5rem'
          }}>
            Adicione membros às suas equipes para começar
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
            Adicionar Membro
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {organizations.map((org) => {
            const orgTeams = teamsByOrganization[org.id] || [];
            
            return (
              <div key={org.id} style={{
                backgroundColor: currentTheme.cardBackground,
                border: `1px solid ${currentTheme.border}`,
                borderRadius: '0.75rem',
                padding: '1.5rem'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.5rem',
                  paddingBottom: '1rem',
                  borderBottom: `1px solid ${currentTheme.border}`
                }}>
                  <div>
                    <h2 style={{
                      fontSize: '1.25rem',
                      fontWeight: '600',
                      margin: '0 0 0.25rem 0',
                      color: currentTheme.textPrimary
                    }}>
                      {org.razaoSocial}
                    </h2>
                    <p style={{
                      fontSize: '0.875rem',
                      color: currentTheme.textSecondary,
                      margin: 0
                    }}>
                      {orgTeams.length} membro{orgTeams.length !== 1 ? 's' : ''} na equipe
                    </p>
                  </div>
                  
                  <button
                    onClick={() => {
                      setFormData(prev => ({ ...prev, organizationId: org.id }));
                      handleCreate();
                    }}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: currentTheme.primary,
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.375rem',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    <i className="bi bi-plus"></i>
                    Adicionar
                  </button>
                </div>

                {orgTeams.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '2rem',
                    color: currentTheme.textSecondary
                  }}>
                    <i className="bi bi-people" style={{
                      fontSize: '2rem',
                      marginBottom: '0.5rem',
                      display: 'block'
                    }}></i>
                    <p>Nenhum membro nesta organização</p>
                  </div>
                ) : (
                  <div style={{
                    display: 'grid',
                    gap: '1rem',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))'
                  }}>
                    {orgTeams.map((team) => (
                      <div
                        key={team.id}
                        style={{
                          backgroundColor: currentTheme.background,
                          border: `1px solid ${currentTheme.border}`,
                          borderRadius: '0.5rem',
                          padding: '1rem',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-1px)';
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
                          marginBottom: '0.75rem'
                        }}>
                          <div style={{ flex: 1 }}>
                            <h3 style={{
                              fontSize: '1rem',
                              fontWeight: '600',
                              margin: '0 0 0.25rem 0',
                              color: currentTheme.textPrimary
                            }}>
                              {team.nome}
                            </h3>
                            <p style={{
                              fontSize: '0.875rem',
                              color: currentTheme.textSecondary,
                              margin: '0 0 0.5rem 0'
                            }}>
                              {team.email}
                            </p>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}>
                              <span style={{
                                padding: '0.25rem 0.5rem',
                                backgroundColor: getFuncaoColor(team.funcao),
                                color: 'white',
                                borderRadius: '0.25rem',
                                fontSize: '0.75rem',
                                fontWeight: '500'
                              }}>
                                {team.funcao}
                              </span>
                              {team.setor && (
                                <span style={{
                                  padding: '0.25rem 0.5rem',
                                  backgroundColor: currentTheme.borderLight,
                                  color: currentTheme.textSecondary,
                                  borderRadius: '0.25rem',
                                  fontSize: '0.75rem'
                                }}>
                                  {team.setor}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div style={{
                            display: 'flex',
                            gap: '0.25rem'
                          }}>
                            <button
                              onClick={() => handleEdit(team)}
                              style={{
                                padding: '0.375rem',
                                backgroundColor: 'transparent',
                                color: currentTheme.textSecondary,
                                border: `1px solid ${currentTheme.border}`,
                                borderRadius: '0.25rem',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
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
                              onClick={() => handleDelete(team)}
                              style={{
                                padding: '0.375rem',
                                backgroundColor: 'transparent',
                                color: '#ef4444',
                                border: '1px solid #ef4444',
                                borderRadius: '0.25rem',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
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
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
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
            maxWidth: '500px',
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
                {editingTeam ? 'Editar Membro' : 'Novo Membro'}
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
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: currentTheme.textPrimary,
                    marginBottom: '0.5rem'
                  }}>
                    Organização *
                  </label>
                  <select
                    name="organizationId"
                    value={formData.organizationId}
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
                  >
                    <option value="">Selecione uma organização</option>
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.razaoSocial}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: currentTheme.textPrimary,
                    marginBottom: '0.5rem'
                  }}>
                    Nome *
                  </label>
                  <input
                    type="text"
                    name="nome"
                    value={formData.nome}
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
                    Função *
                  </label>
                  <select
                    name="funcao"
                    value={formData.funcao}
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
                  >
                    {funcoes.map((funcao) => (
                      <option key={funcao} value={funcao}>
                        {funcao}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: currentTheme.textPrimary,
                    marginBottom: '0.5rem'
                  }}>
                    Setor
                  </label>
                  <input
                    type="text"
                    name="setor"
                    value={formData.setor}
                    onChange={handleInputChange}
                    placeholder="Ex: Vendas, Suporte, Marketing..."
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
                  {editingTeam ? 'Atualizar' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teams;