import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import ImportarLeadsPlanilha from '../components/ImportarLeadsPlanilha';

const Leads = () => {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchLeads = async () => {
        try {
            setLoading(true);
            const response = await apiService.getLeads();
            setLeads(response.data);
        } catch (error) {
            console.error('Erro ao buscar leads:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeads();
    }, []);

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Gestão de Leads</h1>

            <ImportarLeadsPlanilha onImportSuccess={fetchLeads} />

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <h3 className="text-lg font-bold p-4 border-b">Leads Cadastrados</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sobrenome</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefone</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Criado em</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-4 text-center">Carregando...</td>
                                </tr>
                            ) : leads.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">Nenhum lead encontrado.</td>
                                </tr>
                            ) : (
                                leads.map((lead) => (
                                    <tr key={lead.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">{lead.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{lead.surname || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{lead.email || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{lead.phone || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(lead.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Leads;
