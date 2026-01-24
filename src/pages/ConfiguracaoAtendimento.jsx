import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import Button from '../components/ui/Button';
import { MessageSquare, Save, Info } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const ConfiguracaoAtendimento = () => {
    const { currentTheme } = useTheme();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [attendantWelcomeMessage, setAttendantWelcomeMessage] = useState('');
    const [attendantFinishMessage, setAttendantFinishMessage] = useState('');
    const [organizationId, setOrganizationId] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await apiService.get('/private/organizations');
            if (res.data && res.data.length > 0) {
                const org = res.data[0];
                setOrganizationId(org.id);
                setAttendantWelcomeMessage(org.attendantWelcomeMessage || '');
                setAttendantFinishMessage(org.attendantFinishMessage || '');
            }
        } catch (error) {
            console.error('Erro ao carregar configurações:', error);
            showToast({ title: 'Erro', message: 'Falha ao carregar configurações.', variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!organizationId) return;
        setSaving(true);
        try {
            await apiService.put(`/private/organizations/${organizationId}`, {
                attendantWelcomeMessage,
                attendantFinishMessage
            });
            showToast({ title: 'Salvo', message: 'Mensagem de atendimento atualizada.', variant: 'success' });
        } catch (error) {
            console.error('Erro ao salvar:', error);
            showToast({ title: 'Erro', message: 'Falha ao salvar.', variant: 'error' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-4">Carregando...</div>;

    const styles = {
        container: { padding: '24px', maxWidth: '800px', margin: '0 auto' },
        header: { marginBottom: '32px' },
        title: { display: 'flex', alignItems: 'center', gap: '12px', fontSize: '24px', color: '#333', marginBottom: '8px' },
        card: { background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '24px' },
        textarea: { width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px', fontFamily: 'inherit', resize: 'vertical', minHeight: '120px' },
        infoBox: { backgroundColor: '#e0f2fe', padding: '16px', borderRadius: '8px', marginTop: '16px', fontSize: '14px', color: '#0369a1', display: 'flex', gap: '8px' }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.title}>
                    <MessageSquare size={24} /> Configuração de Atendente
                </h1>
                <p style={{ color: '#666' }}>
                    Personalize a experiência quando um atendente assume o chat.
                </p>
            </div>

            <div style={styles.card}>
                <h3 style={{ marginBottom: '16px', fontSize: '18px', color: '#444' }}>Mensagem de Apresentação</h3>
                <p style={{ fontSize: '14px', color: '#888', marginBottom: '12px' }}>
                    Esta mensagem será enviada automaticamente assim que você ou sua equipe clicar em "Assumir" ou "Iniciar Atendimento".
                </p>
                <textarea
                    style={styles.textarea}
                    value={attendantWelcomeMessage}
                    onChange={(e) => setAttendantWelcomeMessage(e.target.value)}
                    placeholder="Ex: Olá, sou atendente {attendantName}! Como posso ajudar hoje? Protocolo: {protocol}"
                />

                <div style={styles.infoBox}>
                    <Info size={20} style={{ flexShrink: 0 }} />
                    <div>
                        <strong>Variáveis Disponíveis:</strong>
                        <ul style={{ paddingLeft: '20px', marginTop: '4px' }}>
                            <li><code>{`{attendantName}`}</code> - Nome do atendente que assumiu</li>
                            <li><code>{`{protocol}`}</code> - Número do protocolo gerado</li>
                            <li><code>{`{name}`}</code> - Nome do cliente</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div style={styles.card}>
                <h3 style={{ marginBottom: '16px', fontSize: '18px', color: '#444' }}>Mensagem de Encerramento</h3>
                <p style={{ fontSize: '14px', color: '#888', marginBottom: '12px' }}>
                    Mensagem padrão que será sugerida ao finalizar um atendimento.
                </p>
                <textarea
                    style={styles.textarea}
                    value={attendantFinishMessage}
                    onChange={(e) => setAttendantFinishMessage(e.target.value)}
                    placeholder="Ex: Atendimento finalizado. Obrigado!"
                />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button onClick={handleSave} loading={saving}>
                    <Save size={18} /> Salvar Alterações
                </Button>
            </div>
        </div>
    );
};

export default ConfiguracaoAtendimento;
