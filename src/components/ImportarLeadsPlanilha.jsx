import React, { useState, useRef } from 'react';
import { apiService } from '../services/api';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import '../styles/buttons.css';

const ImportarLeadsPlanilha = ({ onImportSuccess }) => {
    const { currentTheme, isDark } = useTheme();
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setMessage(null);
            setError(null);
        }
    };

    const handleRemoveFile = () => {
        setFile(null);
        setMessage(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
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
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

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

    const styles = {
        container: {
            backgroundColor: currentTheme.cardBackground,
            padding: '24px',
            borderRadius: '12px',
            boxShadow: currentTheme.shadow,
            marginBottom: '24px',
            border: `1px solid ${currentTheme.borderLight}`
        },
        title: {
            fontSize: '18px',
            fontWeight: '600',
            color: currentTheme.textPrimary,
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
        },
        description: {
            fontSize: '14px',
            color: currentTheme.textSecondary,
            marginBottom: '20px',
            lineHeight: '1.5'
        },
        uploadArea: {
            border: `2px dashed ${currentTheme.border}`,
            borderRadius: '12px',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            backgroundColor: isDark ? currentTheme.background : '#f9fafb',
            position: 'relative'
        },
        uploadIcon: {
            color: currentTheme.textMuted,
            marginBottom: '12px'
        },
        uploadText: {
            fontSize: '14px',
            color: currentTheme.textSecondary,
            fontWeight: '500',
            textAlign: 'center'
        },
        uploadSubtext: {
            fontSize: '12px',
            color: currentTheme.textMuted,
            marginTop: '4px',
            textAlign: 'center'
        },
        fileInfo: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: isDark ? currentTheme.background : '#f3f4f6',
            padding: '12px 16px',
            borderRadius: '8px',
            marginTop: '16px',
            border: `1px solid ${currentTheme.border}`
        },
        fileName: {
            fontSize: '14px',
            color: currentTheme.textPrimary,
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
        },
        removeButton: {
            background: 'none',
            border: 'none',
            color: '#ef4444',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        },
        actionButton: {
            marginTop: '20px',
            width: '100%'
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.title}>
                <FileSpreadsheet size={24} className="text-green-600" />
                Importar Leads via Excel
            </div>

            <p style={styles.description}>
                Carregue uma planilha Excel para importar novos leads.
            </p>

            <form onSubmit={handleSubmit}>
                <div
                    onClick={() => fileInputRef.current.click()}
                    style={styles.uploadArea}
                    className={isDark ? "hover:border-blue-500 hover:bg-gray-800" : "hover:border-blue-500 hover:bg-blue-50"}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx, .xls"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                    />
                    <Upload size={40} style={styles.uploadIcon} />
                    <p style={styles.uploadText}>Clique para selecionar o arquivo</p>
                    <p style={styles.uploadSubtext}>Formato .xlsx ou .xls (Máx. 10MB)</p>
                </div>

                {file && (
                    <div style={styles.fileInfo}>
                        <div style={styles.fileName}>
                            <FileSpreadsheet size={18} className="text-green-600" />
                            {file.name}
                        </div>
                        <button type="button" onClick={handleRemoveFile} style={styles.removeButton} title="Remover arquivo">
                            <X size={18} />
                        </button>
                    </div>
                )}

                {error && (
                    <div className={`mt-4 p-3 text-sm rounded-lg flex items-center gap-2 ${isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-700'}`}>
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                {message && (
                    <div className={`mt-4 p-3 text-sm rounded-lg flex items-center gap-2 ${isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-700'}`}>
                        <CheckCircle size={18} />
                        {message}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading || !file}
                    className={`btn-base ${loading || !file ? 'cursor-not-allowed bg-gray-300 text-gray-500' : 'btn-new'}`}
                    style={{
                        ...styles.actionButton,
                        ...(loading || !file ? { backgroundColor: isDark ? '#374151' : '#e5e7eb', color: isDark ? '#9ca3af' : '#9ca3af', boxShadow: 'none' } : {})
                    }}
                >
                    {loading ? 'Processando Importação...' : 'Iniciar Importação'}
                </button>
            </form>
        </div>
    );
};

export default ImportarLeadsPlanilha;
