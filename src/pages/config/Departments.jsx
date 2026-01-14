import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import Modal from '../../components/ui/Modal';
import { Pencil, Trash2, Plus, Building2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Departments = () => {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingDept, setEditingDept] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const { user } = useAuth();

    useEffect(() => {
        console.log('Departments Page - User Context:', user);
        fetchDepartments();
    }, [user]);

    const fetchDepartments = async () => {
        try {
            setLoading(true);
            const response = await apiService.get('/private/departments');
            setDepartments(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Error fetching departments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const orgId = user?.organizationId || user?.organizations?.[0]?.id;
            console.log('Submitting Department. Org ID resolved:', orgId);

            const payload = {
                ...formData,
                organizationId: orgId
            };

            console.log('Payload:', payload);

            if (editingDept) {
                await apiService.put(`/private/departments/${editingDept.id}`, formData);
            } else {
                await apiService.post('/private/departments', payload);
            }
            setModalOpen(false);
            setEditingDept(null);
            setFormData({ name: '', description: '' });
            fetchDepartments();
        } catch (error) {
            console.error('Error saving department:', error);
            const msg = error.response?.data?.message || 'Erro ao salvar departamento.';
            alert(msg);
        }
    };

    const handleEdit = (dept) => {
        setEditingDept(dept);
        setFormData({ name: dept.name, description: dept.description || '' });
        setModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Tem certeza que deseja excluir este departamento?')) return;
        try {
            await apiService.delete(`/private/departments/${id}`);
            fetchDepartments();
        } catch (error) {
            console.error('Error deleting department:', error);
            alert('Erro ao excluir departamento.');
        }
    };

    const openNewModal = () => {
        setEditingDept(null);
        setFormData({ name: '', description: '' });
        setModalOpen(true);
    };

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2><Building2 style={{ marginRight: '10px' }} /> Departamentos</h2>
                <button
                    onClick={openNewModal}
                    style={{
                        backgroundColor: '#0084ff', color: 'white', border: 'none', padding: '10px 20px',
                        borderRadius: '5px', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer'
                    }}
                >
                    <Plus size={18} /> Novo Departamento
                </button>
            </div>

            <div className="card-custom"> {/* Assuming global card class or similar style */}
                {loading ? (
                    <p>Carregando...</p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                                <th style={{ padding: '10px' }}>Nome</th>
                                <th style={{ padding: '10px' }}>Descrição</th>
                                <th style={{ padding: '10px' }}>Membros</th>
                                <th style={{ padding: '10px', textAlign: 'right' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {departments.length === 0 ? (
                                <tr>
                                    <td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                                        Nenhum departamento cadastrado.
                                    </td>
                                </tr>
                            ) : (
                                departments.map(dept => (
                                    <tr key={dept.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                        <td style={{ padding: '10px' }}>{dept.name}</td>
                                        <td style={{ padding: '10px', color: '#666' }}>{dept.description}</td>
                                        <td style={{ padding: '10px' }}>{dept._count?.users || 0}</td>
                                        <td style={{ padding: '10px', textAlign: 'right' }}>
                                            <button onClick={() => handleEdit(dept)} style={{ marginRight: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>
                                                <Pencil size={18} />
                                            </button>
                                            <button onClick={() => handleDelete(dept.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff4d4f' }}>
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

            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingDept ? "Editar Departamento" : "Novo Departamento"}>
                <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
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
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '5px' }}>Descrição</label>
                        <textarea
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', minHeight: '80px' }}
                        />
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

export default Departments;
