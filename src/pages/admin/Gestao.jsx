import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
import { Users, Search, MoreVertical, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';

const Gestao = () => {
    const navigate = useNavigate();
    const { currentTheme } = useTheme();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/private/users?scope=all_masters');
            setUsers(response.data);
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
            // Poderíamos adicionar um toast aqui
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const styles = {
        container: {
            padding: '24px',
            backgroundColor: currentTheme.background,
            color: currentTheme.text,
            minHeight: '100vh'
        },
        header: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px'
        },
        title: {
            fontSize: '24px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
        },
        searchContainer: {
            position: 'relative',
            width: '300px'
        },
        searchInput: {
            width: '100%',
            padding: '10px 16px 10px 40px',
            borderRadius: '8px',
            border: `1px solid ${currentTheme.borderColor}`,
            backgroundColor: currentTheme.cardBackground,
            color: currentTheme.text,
            outline: 'none'
        },
        searchIcon: {
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#9ca3af'
        },
        tableContainer: {
            backgroundColor: currentTheme.cardBackground,
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
        },
        table: {
            width: '100%',
            borderCollapse: 'collapse'
        },
        th: {
            textAlign: 'left',
            padding: '16px',
            borderBottom: `1px solid ${currentTheme.borderColor}`,
            fontSize: '14px',
            fontWeight: '600',
            color: currentTheme.secondaryText
        },
        td: {
            padding: '16px',
            borderBottom: `1px solid ${currentTheme.borderColor}`,
            fontSize: '14px'
        },
        badge: (active) => ({
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '500',
            backgroundColor: active ? '#dcfce7' : '#fee2e2',
            color: active ? '#166534' : '#991b1b',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
        }),
        actionBtn: {
            padding: '6px',
            borderRadius: '6px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: currentTheme.secondaryText,
            transition: 'color 0.2s'
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div style={styles.title}>
                    <Users size={28} />
                    Gestão de Usuários
                    <span style={{ fontSize: '14px', fontWeight: 'normal', color: currentTheme.secondaryText, marginLeft: '8px' }}>
                        ({users.length})
                    </span>
                </div>
                <div style={styles.searchContainer}>
                    <Search size={18} style={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Buscar por nome ou email..."
                        style={styles.searchInput}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div style={styles.tableContainer}>
                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: currentTheme.secondaryText }}>
                        Carregando usuários...
                    </div>
                ) : (
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Nome</th>
                                <th style={styles.th}>Email</th>
                                <th style={styles.th}>Cargo</th>
                                <th style={styles.th}>Status</th>
                                <th style={styles.th}>Data Cadastro</th>
                                <th style={styles.th}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(user => (
                                <tr key={user.id}>
                                    <td style={styles.td}>
                                        <div style={{ fontWeight: '500' }}>{user.name}</div>
                                        {user.cellphone && <div style={{ fontSize: '12px', color: currentTheme.secondaryText }}>{user.cellphone}</div>}
                                    </td>
                                    <td style={styles.td}>{user.email}</td>
                                    <td style={styles.td}>
                                        <span style={{
                                            padding: '4px 8px',
                                            borderRadius: '6px',
                                            backgroundColor: currentTheme.buttonBackground + '20',
                                            color: currentTheme.primary,
                                            fontSize: '12px',
                                            fontWeight: '600'
                                        }}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td style={styles.td}>
                                        <span style={styles.badge(user.Active && !user.bloqued)}>
                                            {user.Active && !user.bloqued ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                            {user.Active && !user.bloqued ? 'Ativo' : 'Inativo/Bloq'}
                                        </span>
                                    </td>
                                    <td style={styles.td}>
                                        {new Date(user.dateCreated).toLocaleDateString()}
                                    </td>
                                    <td style={styles.td}>
                                        <button style={styles.actionBtn} title="Editar" onClick={() => navigate(`/admin/gestao/${user.id}`)}>
                                            <Edit size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

export default Gestao;
