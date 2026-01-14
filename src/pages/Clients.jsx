import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { Users, Plus, Search, Edit, Trash2, Eye, X, MapPin, Phone, Mail, User, Building, Hash, Calendar, RefreshCw, AlertCircle, Check, Import } from 'lucide-react';
import { apiService } from '../services/api';
import AlertToast from '../components/ui/AlertToast';
import { useToast } from '../contexts/ToastContext';

import '../styles/buttons.css';

import { lookupCep } from '../utils/cep';
import InternationalPhoneInput from '../components/ui/InternationalPhoneInput';

const Clients = () => {

  // Função para exibir Alertas toast
  const { showToast } = useToast();

  const [hover, setHover] = useState(false);

  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalClients, setTotalClients] = useState(0);
  const [activeClients, setActiveClients] = useState(0);
  const [inactiveClients, setInactiveClients] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedClient, setSelectedClient] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [formData, setFormData] = useState({


    name: '',
    type: 'PF',
    cpfCnpj: '',
    email: '',
    phone: '',
    cellphone: '',
    cep: '',
    address: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
    country: 'Brasil'
  });

  const itemsPerPage = 10;

  useEffect(() => {
    loadClients();
  }, [currentPage, searchTerm]);

  useEffect(() => {
    updateStats();
  }, [clients]);

  const loadClients = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm
      };

      const response = await apiService.getClients(params);

      // Ajustando para a estrutura de resposta do backend
      if (response.data && response.data.data) {
        setClients(response.data.data);
        setTotalPages(response.data.pagination?.pages || 1);
        setTotalClients(response.data.pagination?.total || 0);
      } else {
        setClients([]);
        setTotalPages(1);
        setTotalClients(0);
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      setError('Erro ao carregar clientes: ' + (error.response?.data?.message || error.message));
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const updateStats = () => {
    const active = clients.filter(client => client.active !== false).length;
    const inactive = clients.filter(client => client.active === false).length;
    setActiveClients(active);
    setInactiveClients(inactive);
  };

  const fetchAddressByCep = async (cep) => {
    // Remove formatação
    const cleanCep = cep.replace(/\D/g, '');

    if (cleanCep.length === 8) {
      try {
        const data = await lookupCep(cleanCep);

        setFormData(prev => ({
          ...prev,
          address: data.street || '',
          city: data.city || '',
          neighborhood: data.neighborhood || '',
          state: data.state || ''
        }));
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
        // Usar setError para exibir no AlertToast
        setError(error.message || 'Erro ao buscar endereço pelo CEP');
      }
    }
  };

  const formatPhone = (value) => {
    if (!value) return '';
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{2})(\d{4})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return value;
  };

  const formatCellphone = (value) => {
    if (!value) return '';
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return value;
  };

  const formatCep = (value) => {
    if (!value) return '';
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{5})(\d{3})$/);
    if (match) {
      return `${match[1]}-${match[2]}`;
    }
    return value;
  };

  const validateCPF = (cpf) => {
    if (!cpf) return false;
    const cleaned = cpf.replace(/\D/g, '');
    if (cleaned.length !== 11) return false;

    if (/^(\d)\1{10}$/.test(cleaned)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleaned.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleaned.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleaned.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleaned.charAt(10))) return false;

    return true;
  };

  const validateCNPJ = (cnpj) => {
    if (!cnpj) return false;
    const cleaned = cnpj.replace(/\D/g, '');
    if (cleaned.length !== 14) return false;

    if (/^(\d)\1{13}$/.test(cleaned)) return false;

    let sum = 0;
    let weight = 2;
    for (let i = 11; i >= 0; i--) {
      sum += parseInt(cleaned.charAt(i)) * weight;
      weight = weight === 9 ? 2 : weight + 1;
    }
    let remainder = sum % 11;
    const digit1 = remainder < 2 ? 0 : 11 - remainder;
    if (digit1 !== parseInt(cleaned.charAt(12))) return false;

    sum = 0;
    weight = 2;
    for (let i = 12; i >= 0; i--) {
      sum += parseInt(cleaned.charAt(i)) * weight;
      weight = weight === 9 ? 2 : weight + 1;
    }
    remainder = sum % 11;
    const digit2 = remainder < 2 ? 0 : 11 - remainder;
    if (digit2 !== parseInt(cleaned.charAt(13))) return false;

    return true;
  };

  const formatCpfCnpj = (value) => {
    if (!value) return '';
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 11) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else {
      return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateCep = (cep) => {
    const cepRegex = /^\d{5}-?\d{3}$/;
    return cepRegex.test(cep);
  };

  const openModal = (mode, client = null) => {
    setModalMode(mode);
    setSelectedClient(client);

    if (mode === 'create') {
      setFormData({
        name: '',
        type: 'PF',
        cpfCnpj: '',
        email: '',
        phone: '',
        cellphone: '',
        cep: '',
        address: '',
        number: '',
        neighborhood: '',
        city: '',
        state: '',
        country: 'Brasil'
      });
    } else if (mode === 'edit' && client) {
      setFormData({
        name: client.name || '',
        type: client.type || 'PF',
        cpfCnpj: client.cpfCnpj || '',
        email: client.email || '',
        phone: client.phone || '',
        cellphone: client.cellphone || '',
        cep: client.cep || '',
        address: client.address || '',
        number: client.number || '',
        neighborhood: client.neighborhood || '',
        city: client.city || '',
        state: client.state || '',
        country: client.country || 'Brasil'
      });
    }

    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedClient(null);
    setError('');
    setSuccess('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'phone') {
      formattedValue = formatPhone(value);
    } else if (name === 'cellphone') {
      formattedValue = formatCellphone(value);
    } else if (name === 'cep') {
      formattedValue = formatCep(value);
      if (formattedValue.length === 9) {
        fetchAddressByCep(formattedValue);
      }
    } else if (name === 'cpfCnpj') {
      formattedValue = formatCpfCnpj(value);
    }

    setFormData(prev => ({
      ...prev,
      [name]: formattedValue
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validações
    if (!formData.name.trim()) {
      setError('Nome é obrigatório');
      return;
    }

    if (!formData.cpfCnpj.trim()) {
      setError('CPF/CNPJ é obrigatório');
      return;
    }

    const cleanedCpfCnpj = formData.cpfCnpj.replace(/\D/g, '');
    if (cleanedCpfCnpj.length === 11) {
      if (!validateCPF(formData.cpfCnpj)) {
        setError('CPF inválido');
        return;
      }
    } else if (cleanedCpfCnpj.length === 14) {
      if (!validateCNPJ(formData.cpfCnpj)) {
        setError('CNPJ inválido');
        return;
      }
    } else {
      setError('CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos');
      return;
    }

    if (!formData.email.trim()) {
      setError('Email é obrigatório');
      return;
    }

    if (!validateEmail(formData.email)) {
      setError('Email inválido');
      return;
    }

    if (!formData.cellphone.trim()) {
      setError('Celular é obrigatório');
      return;
    }

    if (!formData.cep.trim()) {
      setError('CEP é obrigatório');
      return;
    }

    if (!validateCep(formData.cep)) {
      setError('CEP inválido');
      return;
    }

    if (!formData.address.trim()) {
      setError('Endereço é obrigatório');
      return;
    }

    if (!formData.number.trim()) {
      setError('Número é obrigatório');
      return;
    }

    if (!formData.neighborhood.trim()) {
      setError('Bairro é obrigatório');
      return;
    }

    if (!formData.city.trim()) {
      setError('Cidade é obrigatória');
      return;
    }

    if (!formData.state.trim()) {
      setError('Estado é obrigatório');
      return;
    }

    try {
      const clientData = {
        name: formData.name.trim(),
        type: formData.type,
        cpfCnpj: formData.cpfCnpj.replace(/\D/g, ''),
        email: formData.email.trim(),
        phone: formData.phone.replace(/\D/g, ''),
        cellphone: formData.cellphone.replace(/\D/g, ''),
        cep: formData.cep.replace(/\D/g, ''),
        address: formData.address.trim(),
        number: formData.number.trim(),
        neighborhood: formData.neighborhood.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        country: formData.country.trim()
      };

      if (modalMode === 'create') {
        await apiService.createClient(clientData);
        setSuccess('Cliente criado com sucesso!');
      } else {
        await apiService.updateClient(selectedClient.id, clientData);
        setSuccess('Cliente atualizado com sucesso!');
      }

      // Fecha o modal mantendo a mensagem de sucesso
      setShowModal(false);
      setSelectedClient(null);
      loadClients();

    } catch (error) {
      console.error('Erro ao salvar cliente:', error);

      if (error.response?.status === 400) {
        setError(error.response.data.message || 'Dados inválidos');
      } else if (error.response?.status === 409) {
        setError('CPF/CNPJ ou email já cadastrado');
      } else if (error.response?.status === 422) {
        setError('Dados de validação incorretos');
      } else {
        setError('Erro ao salvar cliente. Tente novamente.');
      }
    }
  };

  const openDeleteModal = (client) => {
    setClientToDelete(client);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setClientToDelete(null);
    setShowDeleteModal(false);
  };

  const handleDelete = async () => {
    if (!clientToDelete) return;

    try {
      await apiService.deleteClient(clientToDelete.id);
      setSuccess('Cliente excluído com sucesso!');
      loadClients();
      closeDeleteModal();
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      setError('Erro ao excluir cliente');
      closeDeleteModal();
    }
  };

  const styles = getStyles(currentTheme);

  const filteredClients = clients.filter(client =>
    client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.cpfCnpj?.includes(searchTerm)
  );

  return (
    <div style={styles.container}>
      {/* Cabeçalho */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            <Users size={32} style={styles.titleIcon} />
            Clientes
          </h1>
          <p style={styles.subtitle}>Gerencie seus clientes</p>
        </div>

        <div style={styles.headerActions}>
          <div style={styles.searchContainer}>
            <div style={styles.searchInputContainer}>
              <Search size={20} style={styles.searchIcon} />
              <input
                type="text"
                placeholder="Pesquisar por nome, email ou CPF/CNPJ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
            </div>
          </div>

          <button
            className="btn-base btn-new-green"
            onClick={() =>
              showToast({
                title: 'Função não habilitada',
                message: 'A importação de contatos será liberada em breve.',
                variant: 'warning'
              })
            }
          >
            <Import size={20} />
            Importar contatos
          </button>
          <button
            className="btn-base btn-new"
            onClick={() => openModal('create')}

          >
            <Plus size={20} />
            Novo Cliente
          </button>
        </div>
      </div>

      {/* Alertas */}
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

      {/* Estatísticas */}
      <div style={styles.statsContainer}>
        <div style={{ ...styles.statCard, borderLeft: `4px solid ${currentTheme.primary || '#3b82f6'}` }}>
          <div style={styles.statsIcon}>
            <Users size={24} />
          </div>
          <div>
            <p style={styles.statLabel}>Total de Clientes</p>
            <p style={styles.statNumber}>{totalClients}</p>
          </div>
        </div>

        <div style={{ ...styles.statCard, borderLeft: `4px solid #10b981` }}>
          <div style={{ ...styles.statsIcon, backgroundColor: '#10b98120', color: '#10b981' }}>
            <Building size={24} />
          </div>
          <div>
            <p style={styles.statLabel}>Clientes Ativos</p>
            <p style={styles.statNumber}>{activeClients}</p>
          </div>
        </div>

        <div style={{ ...styles.statCard, borderLeft: `4px solid #f59e0b` }}>
          <div style={{ ...styles.statsIcon, backgroundColor: '#f59e0b20', color: '#f59e0b' }}>
            <User size={24} />
          </div>
          <div>
            <p style={styles.statLabel}>Clientes Inativos</p>
            <p style={styles.statNumber}>{inactiveClients}</p>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div style={styles.tableContainer}>
        <div style={styles.tableHeader}>
          <h2 style={styles.tableTitle}>Lista de Clientes</h2>
        </div>

        <div>
          {loading ? (
            <div style={styles.loading}>
              <div style={styles.spinner}></div>
              <p>Carregando clientes...</p>
            </div>
          ) : filteredClients.length === 0 ? (
            <div style={styles.emptyState}>
              <Users size={48} style={styles.emptyIcon} />
              <p>Nenhum cliente encontrado</p>
            </div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Nome</th>
                  <th style={styles.th}>Tipo</th>
                  <th style={styles.th}>CPF/CNPJ</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Celular</th>
                  <th style={styles.th}>Cidade</th>
                  <th style={styles.th}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => (
                  <tr key={client.id} style={styles.tableRow}>
                    <td style={styles.td}>{client.name}</td>
                    <td style={styles.td}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: client.type === 'PJ' ? '#10b98120' : '#f59e0b20',
                        color: client.type === 'PJ' ? '#10b981' : '#f59e0b'
                      }}>
                        {client.type}
                      </span>
                    </td>
                    <td style={styles.td}>{formatCpfCnpj(client.cpfCnpj)}</td>
                    <td style={styles.td}>{client.email}</td>
                    <td style={styles.td}>{formatCellphone(client.cellphone)}</td>
                    <td style={styles.td}>{client.city}</td>
                    <td style={styles.td}>
                      <div style={styles.actionButtons}>
                        <button
                          onClick={() => navigate(`/clientes/${client.id}`)}
                          style={styles.actionButton}
                          title="Visualizar Detalhes"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => openModal('edit', client)}
                          style={{ ...styles.actionButton, ...styles.editButton }}
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => openDeleteModal(client)}
                          style={{ ...styles.actionButton, ...styles.deleteButton }}
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div style={styles.pagination}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            style={styles.paginationButton}
          >
            Anterior
          </button>
          <span style={styles.paginationInfo}>
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            style={styles.paginationButton}
          >
            Próxima
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                {modalMode === 'create' && 'Novo Cliente'}
                {modalMode === 'edit' && 'Editar Cliente'}
                {modalMode === 'view' && 'Detalhes do Cliente'}
              </h2>
              <button onClick={closeModal} style={styles.closeButton}>
                <X size={24} />
              </button>
            </div>

            <div style={styles.modalContent}>
              {modalMode === 'view' ? (
                <div style={styles.viewContainer}>
                  <div style={styles.viewSection}>
                    <h3 style={styles.viewSectionTitle}>
                      <User size={20} />
                      Informações Pessoais
                    </h3>
                    <div style={styles.viewGrid}>
                      <div style={styles.viewField}>
                        <span style={styles.viewLabel}>Nome:</span>
                        <span style={styles.viewValue}>{selectedClient?.name}</span>
                      </div>
                      <div style={styles.viewField}>
                        <span style={styles.viewLabel}>Tipo:</span>
                        <span style={styles.viewValue}>{selectedClient?.type}</span>
                      </div>
                      <div style={styles.viewField}>
                        <span style={styles.viewLabel}>CPF/CNPJ:</span>
                        <span style={styles.viewValue}>{formatCpfCnpj(selectedClient?.cpfCnpj || '')}</span>
                      </div>
                    </div>
                  </div>

                  <div style={styles.viewSection}>
                    <h3 style={styles.viewSectionTitle}>
                      <Mail size={20} />
                      Contato
                    </h3>
                    <div style={styles.viewGrid}>
                      <div style={styles.viewField}>
                        <span style={styles.viewLabel}>Email:</span>
                        <span style={styles.viewValue}>{selectedClient?.email}</span>
                      </div>
                      <div style={styles.viewField}>
                        <span style={styles.viewLabel}>Telefone:</span>
                        <span style={styles.viewValue}>{formatPhone(selectedClient?.phone || '')}</span>
                      </div>
                      <div style={styles.viewField}>
                        <span style={styles.viewLabel}>Celular:</span>
                        <span style={styles.viewValue}>{formatCellphone(selectedClient?.cellphone || '')}</span>
                      </div>
                    </div>
                  </div>

                  <div style={styles.viewSection}>
                    <h3 style={styles.viewSectionTitle}>
                      <MapPin size={20} />
                      Endereço
                    </h3>
                    <div style={styles.viewGrid}>
                      <div style={styles.viewField}>
                        <span style={styles.viewLabel}>CEP:</span>
                        <span style={styles.viewValue}>{formatCep(selectedClient?.cep || '')}</span>
                      </div>
                      <div style={styles.viewField}>
                        <span style={styles.viewLabel}>Endereço:</span>
                        <span style={styles.viewValue}>{selectedClient?.address}</span>
                      </div>
                      <div style={styles.viewField}>
                        <span style={styles.viewLabel}>Número:</span>
                        <span style={styles.viewValue}>{selectedClient?.number}</span>
                      </div>
                      <div style={styles.viewField}>
                        <span style={styles.viewLabel}>Bairro:</span>
                        <span style={styles.viewValue}>{selectedClient?.neighborhood}</span>
                      </div>
                      <div style={styles.viewField}>
                        <span style={styles.viewLabel}>Cidade:</span>
                        <span style={styles.viewValue}>{selectedClient?.city}</span>
                      </div>
                      <div style={styles.viewField}>
                        <span style={styles.viewLabel}>Estado:</span>
                        <span style={styles.viewValue}>{selectedClient?.state}</span>
                      </div>
                      <div style={styles.viewField}>
                        <span style={styles.viewLabel}>País:</span>
                        <span style={styles.viewValue}>{selectedClient?.country}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={styles.form}>
                  <div style={styles.formGrid}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Nome *</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        style={styles.input}
                        required
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>Tipo *</label>
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        style={styles.input}
                        required
                      >
                        <option value="PF">Pessoa Física</option>
                        <option value="PJ">Pessoa Jurídica</option>
                      </select>
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>CPF/CNPJ *</label>
                      <input
                        type="text"
                        name="cpfCnpj"
                        value={formData.cpfCnpj}
                        onChange={handleInputChange}
                        style={styles.input}
                        maxLength={18}
                        required
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>Email *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        style={styles.input}
                        required
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>Telefone</label>
                      <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        style={styles.input}
                        maxLength={14}
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>Celular *</label>
                      <InternationalPhoneInput
                        name="cellphone"
                        value={formData.cellphone}
                        onChange={handleInputChange}
                        required
                        error={error && error.includes('Celular') ? 'Celular inválido' : ''}
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>CEP *</label>
                      <input
                        type="text"
                        name="cep"
                        value={formData.cep}
                        onChange={handleInputChange}
                        style={styles.input}
                        maxLength={9}
                        required
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>Endereço *</label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        style={styles.input}
                        required
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>Número *</label>
                      <input
                        type="text"
                        name="number"
                        value={formData.number}
                        onChange={handleInputChange}
                        style={styles.input}
                        required
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>Bairro *</label>
                      <input
                        type="text"
                        name="neighborhood"
                        value={formData.neighborhood}
                        onChange={handleInputChange}
                        style={styles.input}
                        required
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>Cidade *</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        style={styles.input}
                        required
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>Estado *</label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        style={styles.input}
                        maxLength={2}
                        required
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>País</label>
                      <input
                        type="text"
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        style={styles.input}
                      />
                    </div>
                  </div>

                  <div style={styles.modalActions}>
                    <button
                      type="button"
                      onClick={closeModal}
                      style={styles.cancelButton}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      style={styles.saveButton}
                    >
                      {modalMode === 'create' ? 'Criar' : 'Salvar'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.deleteModal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Confirmar Exclusão</h2>
              <button onClick={closeDeleteModal} style={styles.closeButton}>
                <X size={24} />
              </button>
            </div>
            <div style={styles.modalContent}>
              <p style={styles.deleteText}>
                Tem certeza que deseja excluir o cliente <strong>{clientToDelete?.name}</strong>?
              </p>
              <p style={styles.deleteWarning}>
                Esta ação não pode ser desfeita.
              </p>
              <div style={styles.modalActions}>
                <button
                  onClick={closeDeleteModal}
                  style={styles.cancelButton}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  style={styles.confirmDeleteButton}
                >
                  Excluir
                </button>
              </div>
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
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '32px',
    flexWrap: 'wrap',
    gap: '16px'
  },

  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap'
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

  addButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    backgroundColor: theme.primary,
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: theme.primaryDark || theme.primary
    }
  },
  importButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    backgroundColor: '#16a34a', // verde
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },

  addButtonImportContacts: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    backgroundColor: theme.primary,
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: theme.primaryDark || theme.primary
    }
  },

  statsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '32px'
  },

  statCard: {
    backgroundColor: theme.cardBackground,
    padding: '24px',
    borderRadius: '12px',
    boxShadow: theme.shadow,
    border: `1px solid ${theme.border}`,
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },

  statsIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    backgroundColor: `${theme.primary}20`,
    color: theme.primary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  statLabel: {
    fontSize: '14px',
    color: theme.textSecondary,
    margin: '0 0 4px 0'
  },

  statNumber: {
    fontSize: '28px',
    fontWeight: '700',
    color: theme.textPrimary,
    margin: 0
  },

  searchContainer: {
    flex: 1,
    minWidth: '300px'
  },

  searchInputContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    maxWidth: '400px'
  },

  searchIcon: {
    position: 'absolute',
    left: '12px',
    color: theme.textSecondary,
    zIndex: 1
  },

  searchInput: {
    width: '100%',
    padding: '12px 12px 12px 40px',
    border: `1px solid ${theme.border}`,
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: theme.cardBackground,
    color: theme.textPrimary,
    outline: 'none',
    transition: 'all 0.2s',
    '::placeholder': {
      color: theme.textSecondary
    }
  },

  tableContainer: {
    backgroundColor: theme.cardBackground,
    borderRadius: '12px',
    boxShadow: theme.shadow,
    border: `1px solid ${theme.border}`,
    overflow: 'hidden',
    marginBottom: '32px'
  },

  tableHeader: {
    padding: '24px',
    borderBottom: `1px solid ${theme.border}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  refreshButton: {
    padding: '8px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.borderLight,
    color: theme.textSecondary,
    ':hover': {
      backgroundColor: theme.border
    }
  },

  tableTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: theme.textPrimary,
    margin: 0
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },

  th: {
    padding: '16px 24px',
    textAlign: 'left',
    fontSize: '14px',
    fontWeight: '600',
    color: theme.textSecondary,
    backgroundColor: theme.background,
    borderBottom: `1px solid ${theme.border}`
  },

  tableRow: {
    borderBottom: `1px solid ${theme.border}`,
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: theme.borderLight
    }
  },

  td: {
    padding: '16px 24px',
    fontSize: '14px',
    color: theme.textPrimary
  },

  actionButtons: {
    display: 'flex',
    gap: '8px'
  },

  actionButton: {
    padding: '8px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f620',
    color: '#3b82f6',
    ':hover': {
      backgroundColor: '#3b82f640'
    }
  },

  editButton: {
    backgroundColor: '#f59e0b20',
    color: '#f59e0b',
    ':hover': {
      backgroundColor: '#f59e0b40'
    }
  },

  deleteButton: {
    backgroundColor: '#ef444420',
    color: '#ef4444',
    ':hover': {
      backgroundColor: '#ef444440'
    }
  },

  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '12px'
  },

  paginationButton: {
    padding: '8px 16px',
    border: `1px solid ${theme.border}`,
    backgroundColor: theme.cardBackground,
    color: theme.textPrimary,
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: theme.borderLight
    }
  },

  paginationInfo: {
    fontSize: '14px',
    color: theme.textSecondary
  },

  modalOverlay: {
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
    padding: '20px'
  },

  modal: {
    backgroundColor: theme.cardBackground,
    borderRadius: '12px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '800px',
    maxHeight: '90vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  },

  deleteModal: {
    backgroundColor: theme.cardBackground,
    borderRadius: '12px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '500px',
    overflow: 'hidden'
  },

  modalHeader: {
    padding: '24px',
    borderBottom: `1px solid ${theme.border}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  modalTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: theme.textPrimary,
    margin: 0,
    display: 'flex',
    alignItems: 'center'
  },

  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: theme.textSecondary,
    padding: '4px',
    borderRadius: '4px',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: theme.borderLight
    }
  },

  modalContent: {
    padding: '24px',
    flex: 1,
    overflowY: 'auto'
  },

  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },

  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '24px'
  },

  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },

  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: theme.textPrimary
  },

  input: {
    padding: '12px 16px',
    border: `1px solid ${theme.border}`,
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: theme.background,
    color: theme.textPrimary,
    outline: 'none',
    transition: 'all 0.2s',
    ':focus': {
      borderColor: theme.primary,
      boxShadow: `0 0 0 3px ${theme.primary}20`
    }
  },

  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    paddingTop: '24px',
    borderTop: `1px solid ${theme.border}`
  },

  cancelButton: {
    padding: '12px 24px',
    border: `1px solid ${theme.border}`,
    backgroundColor: 'transparent',
    color: theme.textSecondary,
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: theme.borderLight
    }
  },

  saveButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    backgroundColor: theme.primary,
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: theme.primaryDark || theme.primary
    }
  },

  confirmDeleteButton: {
    padding: '12px 24px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: '#c82333'
    }
  },

  viewContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },

  viewSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },

  viewSectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: theme.primary,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px'
  },

  viewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px'
  },

  viewField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },

  viewLabel: {
    fontSize: '12px',
    fontWeight: '500',
    color: theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },

  viewValue: {
    fontSize: '14px',
    color: theme.textPrimary,
    fontWeight: '400'
  },

  deleteText: {
    fontSize: '14px',
    color: theme.textPrimary,
    marginBottom: '16px',
    lineHeight: '1.5'
  },

  deleteWarning: {
    fontSize: '13px',
    color: '#dc3545',
    marginBottom: '24px'
  },

  errorMessage: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '24px',
    fontSize: '14px',
    fontWeight: '500',
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    border: '1px solid #fecaca'
  },

  successMessage: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '24px',
    fontSize: '14px',
    fontWeight: '500',
    backgroundColor: '#d1fae5',
    color: '#059669',
    border: '1px solid #a7f3d0'
  },

  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '64px',
    color: theme.textSecondary
  },

  spinner: {
    width: '32px',
    height: '32px',
    border: `3px solid ${theme.border}`,
    borderTop: `3px solid ${theme.primary}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '16px'
  },

  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '64px',
    color: theme.textSecondary
  },

  emptyIcon: {
    marginBottom: '16px',
    opacity: 0.5
  }
});

export default Clients;