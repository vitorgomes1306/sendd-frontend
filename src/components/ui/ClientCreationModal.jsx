import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { apiService } from '../../services/api';
import { lookupCep } from '../../utils/cep';
import InternationalPhoneInput from './InternationalPhoneInput';
import AlertToast from './AlertToast';

const ClientCreationModal = ({ isOpen, onClose, onSuccess, initialData = null }) => {
    const { currentTheme } = useTheme();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
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

    useEffect(() => {
        if (isOpen && initialData) {
            setFormData(prev => ({
                ...prev,
                name: initialData.name || '',
                email: initialData.email || '',
                phone: initialData.phone || '',
                cellphone: initialData.cellphone || initialData.phone || '', // Tenta usar o mesmo se não tiver cellphone
                // Limpa os outros campos para evitar dados antigos se o modal for reaberto
                type: 'PF',
                cpfCnpj: '',
                cep: '',
                address: '',
                number: '',
                neighborhood: '',
                city: '',
                state: '',
                country: 'Brasil'
            }));
        } else if (isOpen) {
            // Reset form if no initial data
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
        }
        setError('');
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const styles = getStyles(currentTheme);

    // Helpers (copied from Clients.jsx)
    const formatPhone = (value) => {
        if (!value) return '';
        const cleaned = value.replace(/\D/g, '');
        const match = cleaned.match(/^(\d{2})(\d{4})(\d{4})$/);
        return match ? `(${match[1]}) ${match[2]}-${match[3]}` : value;
    };

    const formatCellphone = (value) => {
        if (!value) return '';
        const cleaned = value.replace(/\D/g, '');
        const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/);
        return match ? `(${match[1]}) ${match[2]}-${match[3]}` : value;
    };

    const formatCep = (value) => {
        if (!value) return '';
        const cleaned = value.replace(/\D/g, '');
        const match = cleaned.match(/^(\d{5})(\d{3})$/);
        return match ? `${match[1]}-${match[2]}` : value;
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

    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const validateCep = (cep) => /^\d{5}-?\d{3}$/.test(cep);

    // Simplificadas validações de CPF/CNPJ para brevidade, mas idealmente usa as completas
    const validateCPF = (cpf) => cpf.replace(/\D/g, '').length === 11;
    const validateCNPJ = (cnpj) => cnpj.replace(/\D/g, '').length === 14;

    const fetchAddressByCep = async (cep) => {
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
                setError('Erro ao buscar endereço pelo CEP');
            }
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        let formattedValue = value;

        if (name === 'phone') formattedValue = formatPhone(value);
        else if (name === 'cellphone') formattedValue = formatCellphone(value);
        else if (name === 'cep') {
            formattedValue = formatCep(value);
            if (formattedValue.length === 9) fetchAddressByCep(formattedValue);
        }
        else if (name === 'cpfCnpj') formattedValue = formatCpfCnpj(value);

        setFormData(prev => ({ ...prev, [name]: formattedValue }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Validações Básicas
        if (!formData.name.trim()) return setErrorAndLoading('Nome é obrigatório');
        if (!formData.cpfCnpj.trim()) return setErrorAndLoading('CPF/CNPJ é obrigatório');
        if (!formData.email.trim() || !validateEmail(formData.email)) return setErrorAndLoading('Email inválido');
        if (!formData.cellphone.trim()) return setErrorAndLoading('Celular é obrigatório');
        if (!formData.cep.trim() || !validateCep(formData.cep)) return setErrorAndLoading('CEP inválido');

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

            const response = await apiService.createClient(clientData);

            if (onSuccess) onSuccess(response.data || response); // Adapt depending on axios response structure
            onClose();
        } catch (error) {
            console.error('Erro ao criar cliente:', error);
            if (error.response?.data?.message) {
                setError(error.response.data.message);
            } else {
                setError('Erro ao salvar cliente.');
            }
        } finally {
            setLoading(false);
        }
    };

    const setErrorAndLoading = (msg) => {
        setError(msg);
        setLoading(false);
    };

    return (
        <div style={styles.modalOverlay}>
            <div style={styles.modal}>
                <div style={styles.modalHeader}>
                    <h2 style={styles.modalTitle}>Novo Cliente (Migração)</h2>
                    <button onClick={onClose} style={styles.closeButton}>
                        <X size={24} />
                    </button>
                </div>

                <div style={styles.modalContent}>
                    {error && (
                        <div style={{ ...styles.errorMessage, marginBottom: '16px' }}>
                            {error}
                        </div>
                    )}

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
                        </div>

                        <div style={styles.modalActions}>
                            <button
                                type="button"
                                onClick={onClose}
                                style={styles.cancelButton}
                                disabled={loading}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                style={{ ...styles.saveButton, opacity: loading ? 0.7 : 1 }}
                                disabled={loading}
                            >
                                {loading ? 'Salvando...' : 'Criar Cliente'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

const getStyles = (theme) => ({
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
        margin: 0
    },
    closeButton: {
        background: 'none',
        border: 'none',
        fontSize: '24px',
        cursor: 'pointer',
        color: theme.textSecondary,
        padding: '4px'
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
        gap: '20px'
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
        outline: 'none'
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
        cursor: 'pointer'
    },
    saveButton: {
        padding: '12px 24px',
        backgroundColor: theme.primary,
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer'
    },
    errorMessage: {
        padding: '12px',
        backgroundColor: '#fee2e2',
        color: '#dc2626',
        borderRadius: '8px',
        fontSize: '14px'
    }
});

export default ClientCreationModal;
