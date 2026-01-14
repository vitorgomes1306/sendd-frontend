import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import Modal from '../../components/ui/Modal';
import { Pencil, Trash2, Plus, Users, UserCog, Check, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
// import Select from '../../components/ui/Select'; // Opcional se já tivermos um multi-select

const Attendants = () => {
    const [attendants, setAttendants] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'ATTENDANT',
        departmentIds: [],
        Active: true
    });

    const { user } = useAuth();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [attResponse, deptResponse] = await Promise.all([
                apiService.get('/private/attendants'),
                apiService.get('/private/departments')
            ]);
            setAttendants(Array.isArray(attResponse.data) ? attResponse.data : []);
            setDepartments(Array.isArray(deptResponse.data) ? deptResponse.data : []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                organizationId: user?.organizationId || user?.organizations?.[0]?.id
            };

            if (editingUser) {
                // Remover senha se vazia
                if (!payload.password) delete payload.password;
                await apiService.put(`/private/attendants/${editingUser.id}`, payload);
            } else {
                await apiService.post('/private/attendants', payload);
            }

            setModalOpen(false);
            resetForm();
            fetchData();
        } catch (error) {
            console.error('Error saving attendant:', error);
            alert(error.response?.data?.message || 'Erro ao salvar atendente.');
        }
    };

    const resetForm = () => {
        setEditingUser(null);
        setFormData({ name: '', email: '', password: '', role: 'ATTENDANT', departmentIds: [], Active: true });
    }

    const handleEdit = (usr) => {
        setEditingUser(usr);
        setFormData({
            name: usr.name,
            email: usr.email,
            password: '', // Senha em branco para não alterar
            role: usr.role,
            departmentIds: usr.departments?.map(d => d.id) || [],
            Active: usr.Active
        });
        setModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Tem certeza que deseja remover este atendente?')) return;
        try {
            await apiService.delete(`/private/attendants/${id}`);
            fetchData();
        } catch (error) {
            console.error('Error deleting attendant:', error);
            alert('Erro ao remover atendente.');
        }
    };

    const toggleDept = (deptId) => {
        setFormData(prev => {
            const exists = prev.departmentIds.includes(deptId);
            if (exists) {
                return { ...prev, departmentIds: prev.departmentIds.filter(id => id !== deptId) };
            } else {
                return { ...prev, departmentIds: [...prev.departmentIds, deptId] };
            }
        });
    };

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2><Users style={{ marginRight: '10px' }} /> Colaboradores / Atendentes</h2>
                <button
                    onClick={() => { resetForm(); setModalOpen(true); }}
                    style={{
                        backgroundColor: '#0084ff', color: 'white', border: 'none', padding: '10px 20px',
                        borderRadius: '5px', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer'
                    }}
                >
                    <Plus size={18} /> Novo Colaborador
                </button>
            </div>

            <div className="card-custom">
                {loading ? (
                    <p>Carregando...</p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                                <th style={{ padding: '10px' }}>Nome</th>
                                <th style={{ padding: '10px' }}>Email</th>
                                <th style={{ padding: '10px' }}>Cargo</th>
                                <th style={{ padding: '10px' }}>Departamentos</th>
                                <th style={{ padding: '10px' }}>Status</th>
                                <th style={{ padding: '10px', textAlign: 'right' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attendants.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                                        Nenhum colaborador cadastrado.
                                    </td>
                                </tr>
                            ) : (
                                attendants.map(att => (
                                    <tr key={att.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                        <td style={{ padding: '10px' }}>{att.name}</td>
                                        <td style={{ padding: '10px' }}>{att.email}</td>
                                        <td style={{ padding: '10px' }}>
                                            <span style={{
                                                padding: '2px 8px', borderRadius: '10px', fontSize: '12px',
                                                backgroundColor: att.role === 'MASTER' ? '#fff2e8' : '#e6f7ff',
                                                color: att.role === 'MASTER' ? '#d4380d' : '#1890ff',
                                                border: `1px solid ${att.role === 'MASTER' ? '#ffbb96' : '#91d5ff'}`
                                            }}>
                                                {att.role}
                                            </span>
                                        </td>
                                        <td style={{ padding: '10px' }}>
                                            {att.departments?.length > 0
                                                ? att.departments.map(d => d.name).join(', ')
                                                : <span style={{ color: '#999' }}>-</span>
                                            }
                                        </td>
                                        <td style={{ padding: '10px' }}>
                                            {att.Active ? <span style={{ color: '#52c41a' }}>Ativo</span> : <span style={{ color: '#999' }}>Inativo</span>}
                                        </td>
                                        <td style={{ padding: '10px', textAlign: 'right' }}>
                                            <button onClick={() => handleEdit(att)} style={{ marginRight: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>
                                                <Pencil size={18} />
                                            </button>
                                            <button onClick={() => handleDelete(att.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff4d4f' }}>
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingUser ? "Editar Colaborador" : "Novo Colaborador"}>
                <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>Nome</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                            />
                        </div>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                required
                                disabled={!!editingUser} // Email costuma ser imutável
                                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: editingUser ? '#f5f5f5' : 'white' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>Senha {editingUser && '(Deixe em branco p/ manter)'}</label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                required={!editingUser}
                                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                            />
                        </div>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>Cargo</label>
                            <select
                                value={formData.role}
                                onChange={e => setFormData({ ...formData, role: e.target.value })}
                                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                            >
                                <option value="ATTENDANT">Atendente (Apenas Chat)</option>
                                <option value="MEMBER">Membro (Chat + Configurações)</option>
                                <option value="MANAGER">Gerente (Funções Administrativas)</option>
                                <option value="ADMIN">Administrador (Tudo + Relatórios)</option>
                                <option value="MASTER">Master (Dono do Sistema)</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px' }}>Status</label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={formData.Active}
                                onChange={e => setFormData({ ...formData, Active: e.target.checked })}
                            />
                            Usuário Ativo no Sistema
                        </label>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Departamentos</label>
                        <div style={{ border: '1px solid #ddd', padding: '10px', borderRadius: '4px', maxHeight: '150px', overflowY: 'auto' }}>
                            {departments.map(dept => (
                                <div key={dept.id} onClick={() => toggleDept(dept.id)}
                                    style={{
                                        padding: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                                        backgroundColor: formData.departmentIds.includes(dept.id) ? '#e6f7ff' : 'transparent'
                                    }}>
                                    <div style={{
                                        width: '16px', height: '16px', border: '1px solid #999', borderRadius: '3px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        backgroundColor: formData.departmentIds.includes(dept.id) ? '#1890ff' : 'white',
                                        borderColor: formData.departmentIds.includes(dept.id) ? '#1890ff' : '#999'
                                    }}>
                                        {formData.departmentIds.includes(dept.id) && <Check size={12} color="white" />}
                                    </div>
                                    <span>{dept.name}</span>
                                </div>
                            ))}
                            {departments.length === 0 && <span style={{ color: '#999' }}>Nenhum departamento disponível.</span>}
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button type="button" onClick={() => setModalOpen(false)} style={{ padding: '8px 16px', border: '1px solid #ddd', background: 'white', borderRadius: '4px', cursor: 'pointer' }}>
                            Cancelar
                        </button>
                        <button type="submit" style={{ padding: '8px 16px', background: '#0084ff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                            Salvar
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Attendants;
