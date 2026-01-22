import React, { useState } from 'react';
import { apiService } from '../services/api';


const ImportarLeadsPlanilha = ({ onImportSuccess }) => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setMessage(null);
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) {
            setError('Por favor, selecione um arquivo.');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setLoading(true);
        setMessage(null);
        setError(null);

        try {
            const response = await apiService.importLeads(formData);
            setMessage(response.data.message || 'Importação realizada com sucesso!');
            setFile(null);

            // Reset file input value
            e.target.reset(); // This handles the input reset if passed correctly, or ref

            if (onImportSuccess) {
                onImportSuccess();
            }
        } catch (err) {
            console.error('Erro na importação:', err);
            setError(err.response?.data?.message || 'Erro ao importar arquivo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-bold mb-4">Importar Leads via Excel</h2>
            <p className="text-gray-600 mb-4 text-sm">
                O arquivo deve conter uma coluna "Custom field" com os dados no formato:<br />
                Nome: [Nome]<br />
                Sobrenome: [Sobrenome]<br />
                Email: [Email]<br />
                Telefone: [Telefone]
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md">
                <div className="flex flex-col">
                    <label htmlFor="excelFile" className="mb-2 text-sm font-medium text-gray-700">Selecione o arquivo Excel (.xlsx, .xls)</label>
                    <input
                        id="excelFile"
                        type="file"
                        accept=".xlsx, .xls"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none p-2"
                    />
                </div>

                {error && <div className="text-red-500 text-sm">{error}</div>}
                {message && <div className="text-green-500 text-sm">{message}</div>}

                <button
                    type="submit"
                    disabled={loading || !file}
                    className={`px-4 py-2 rounded-lg text-white font-medium ${loading || !file ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                    {loading ? 'Importando...' : 'Importar Leads'}
                </button>
            </form>
        </div>
    );
};

export default ImportarLeadsPlanilha;
