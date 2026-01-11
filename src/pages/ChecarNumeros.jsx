import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import '../styles/buttons.css';
import '../styles/forms.css';
import { apiService } from '../services/api';
import { Search, Smartphone, Check, AlertCircle, X, Download, Globe } from 'lucide-react';
import axios from 'axios';

const countries = [
    { code: '55', name: 'Brasil', flag: '🇧🇷' },
    { code: '1', name: 'Estados Unidos', flag: '🇺🇸' },
    { code: '351', name: 'Portugal', flag: '🇵🇹' },
    { code: '54', name: 'Argentina', flag: '🇦🇷' },
    { code: '44', name: 'Reino Unido', flag: '🇬🇧' },
    { code: '34', name: 'Espanha', flag: '🇪🇸' },
    { code: '33', name: 'França', flag: '🇫🇷' },
    { code: '49', name: 'Alemanha', flag: '🇩🇪' },
    { code: '39', name: 'Itália', flag: '🇮🇹' },
    { code: '91', name: 'Índia', flag: '🇮🇳' },
    { code: '52', name: 'México', flag: '🇲🇽' },
    { code: '598', name: 'Uruguai', flag: '🇺🇾' },
    { code: '595', name: 'Paraguai', flag: '🇵🇾' },
    { code: '56', name: 'Chile', flag: '🇨🇱' },
    { code: '57', name: 'Colômbia', flag: '🇨🇴' },
    { code: '51', name: 'Peru', flag: '🇵🇪' },
];

const ChecarNumeros = () => {
    const { currentTheme } = useTheme();
    const { showToast } = useToast();
    const styles = getStyles(currentTheme);

    // Estados
    const [instances, setInstances] = useState([]);
    const [selectedInstance, setSelectedInstance] = useState('');
    const [selectedCountry, setSelectedCountry] = useState('55');
    const [phoneNumbers, setPhoneNumbers] = useState([]);
    const [phoneInput, setPhoneInput] = useState('');
    const [checking, setChecking] = useState(false);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    // Carregar instâncias
    useEffect(() => {
        fetchInstances();
    }, []);

    const fetchInstances = async () => {
        setLoading(true);
        try {
            const orgResponse = await apiService.get('/private/organizations');
            const orgs = orgResponse.data;
            let allInstances = [];

            for (const org of orgs) {
                try {
                    const instanceResponse = await apiService.get(`/private/organizations/${org.id}/instances`);
                    const orgInstances = instanceResponse.data.instances || [];

                    const instancesWithOrg = orgInstances.map(instance => ({
                        ...instance,
                        organizationName: org.razaoSocial || org.nomeFantasia,
                        organizationId: org.id
                    }));
                    allInstances = [...allInstances, ...instancesWithOrg];
                } catch (error) {
                    console.error(`Erro ao carregar instâncias da organização ${org.id}:`, error);
                }
            }

            const connectedInstances = allInstances.filter(instance => instance.status === 'connected');
            setInstances(connectedInstances);
            if (connectedInstances.length > 0) {
                setSelectedInstance(connectedInstances[0].id);
            }
        } catch (error) {
            console.error('Erro ao carregar instâncias:', error);
            showToast({ title: 'Erro', message: 'Erro ao carregar instâncias', variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // Funções de manipulação de números (reutilizadas do NotificacoesManual)
    // Funções de manipulação de números
    const formatSinglePhoneNumber = (number, ddi) => {
        let numbersOnly = number.replace(/\D/g, '');

        // Se for Brasil (55), lógica específica com validação de DDD e dígitos (10/11)
        if (ddi === '55') {
            // Se o usuário digitou com 55 no início
            if (numbersOnly.startsWith('55')) {
                if (numbersOnly.length === 12 || numbersOnly.length === 13) {
                    const ddd = parseInt(numbersOnly.substring(2, 4));
                    if (ddd >= 11 && ddd <= 99) return numbersOnly;
                }
            }

            // Se o usuário digitou sem 55 (DDD + Numero)
            if (numbersOnly.length === 10 || numbersOnly.length === 11) {
                const ddd = parseInt(numbersOnly.substring(0, 2));
                if (ddd >= 11 && ddd <= 99) return '55' + numbersOnly;
            }
            return null;
        }

        // Lógica Genérica para outros países
        // Remove zeros à esquerda (ex: 00351...)
        if (numbersOnly.startsWith('00')) numbersOnly = numbersOnly.substring(2);

        // Se já começa com o DDI, aceita
        if (numbersOnly.startsWith(ddi)) {
            // Validação mínima de comprimento (ex: DDI + min 4 digitos)
            if (numbersOnly.length >= ddi.length + 4) return numbersOnly;
        } else {
            // Se não começa com DDI, adiciona
            // Assume que o resto é o número completo
            if (numbersOnly.length >= 4) return ddi + numbersOnly;
        }

        return null;
    };

    const processPhoneNumbers = (input) => {
        if (!input) return [];

        // Se for Brasil, usa a lógica de parser smart (chunks)
        if (selectedCountry === '55') {
            const numbersOnly = String(input).replace(/\D/g, '');
            if (numbersOnly.length === 0) return [];

            const numbers = [];
            let cursor = 0;

            while (cursor < numbersOnly.length) {
                const remaining = numbersOnly.substring(cursor);
                let matched = false;

                // Prioridade 1: 55 + DDD + 9d (13)
                if (remaining.startsWith('55') && remaining.length >= 13) {
                    const candidate = remaining.substring(0, 13);
                    if (formatSinglePhoneNumber(candidate, '55')) {
                        numbers.push(candidate);
                        cursor += 13;
                        matched = true;
                        continue;
                    }
                }
                // Prioridade 2: 55 + DDD + 8d (12)
                if (remaining.startsWith('55') && remaining.length >= 12 && !matched) {
                    const candidate = remaining.substring(0, 12);
                    if (formatSinglePhoneNumber(candidate, '55')) {
                        numbers.push(candidate);
                        cursor += 12;
                        matched = true;
                        continue;
                    }
                }
                // Prioridade 3: DDD + 9d (11)
                if (remaining.length >= 11 && !matched) {
                    const candidate = remaining.substring(0, 11);
                    const formatted = formatSinglePhoneNumber(candidate, '55');
                    if (formatted) {
                        numbers.push(formatted);
                        cursor += 11;
                        matched = true;
                        continue;
                    }
                }
                // Prioridade 4: DDD + 8d (10)
                if (remaining.length >= 10 && !matched) {
                    const candidate = remaining.substring(0, 10);
                    const formatted = formatSinglePhoneNumber(candidate, '55');
                    if (formatted) {
                        numbers.push(formatted);
                        cursor += 10;
                        matched = true;
                        continue;
                    }
                }

                if (!matched) cursor++;
            }
            return numbers;
        }
        else {
            // Para outros países, é mais seguro separar por delimitadores comuns
            // senão podemos encavalar números de tamanhos variados
            const rawNumbers = input.split(/[\n,;\s]+/);
            const numbers = [];

            for (const raw of rawNumbers) {
                if (!raw) continue;
                const formatted = formatSinglePhoneNumber(raw, selectedCountry);
                if (formatted) numbers.push(formatted);
            }
            return numbers;
        }
    };

    const addPhoneNumbers = (input) => {
        const newNumbers = processPhoneNumbers(input);
        const uniqueNumbers = newNumbers.filter(num => !phoneNumbers.some(existing => existing.number === num));

        if (uniqueNumbers.length > 0) {
            const numbersWithId = uniqueNumbers.map(num => ({ id: Date.now() + Math.random(), number: num }));
            setPhoneNumbers(prev => [...prev, ...numbersWithId]);
        }
    };

    const removePhoneNumber = (id) => {
        setPhoneNumbers(prev => prev.filter(item => item.id !== id));
    };

    const handlePhoneInputKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (phoneInput.trim()) {
                addPhoneNumbers(phoneInput);
                setPhoneInput('');
            }
        }
    };

    const handlePhoneInputPaste = (e) => {
        setTimeout(() => {
            const pastedValue = e.target.value;
            if (pastedValue) {
                addPhoneNumbers(pastedValue);
                setPhoneInput('');
            }
        }, 0);
    };

    // Checar Números
    const handleCheckNumbers = async () => {
        if (!selectedInstance) {
            showToast({ title: 'Atenção', message: 'Selecione uma instância', variant: 'warning' });
            return;
        }
        if (phoneNumbers.length === 0) {
            showToast({ title: 'Atenção', message: 'Adicione pelo menos um número', variant: 'warning' });
            return;
        }

        setChecking(true);
        setResults([]);

        // Obter URL base do Evolution e Key
        // OBS: Assumindo que VITE_EVOLUTION_API_URL é a base URL (ex: https://api.evolution.com)
        // E precisamos adicionar /chat/whatsappNumbers/{instance}
        // A variável VITE_EVOLUTION_API_URL deve vir do .env
        const evolutionUrl = import.meta.env.VITE_EVOLUTION_API_URL;
        const evolutionKey = import.meta.env.VITE_EVOLUTION_API_KEY;

        if (!evolutionUrl || !evolutionKey) {
            showToast({ title: 'Erro de Configuração', message: 'Variáveis de ambiente do Evolution API não configuradas.', variant: 'error' });
            setChecking(false);
            return;
        }

        try {
            const instanceObj = instances.find(i => i.id === parseInt(selectedInstance));
            const instance = instanceObj ? instanceObj.instanceName : '';

            if (!instance) throw new Error("Instância inválida");

            const numbersToCheck = phoneNumbers.map(p => p.number); // Array de strings

            const response = await axios.post(
                `${evolutionUrl}/chat/whatsappNumbers/${instance}`,
                { numbers: numbersToCheck },
                {
                    headers: {
                        'apikey': evolutionKey,
                        'Content-Type': 'application/json'
                    }
                }
            );

            setResults(response.data);
            showToast({ title: 'Sucesso', message: 'Verificação concluída', variant: 'success' });

        } catch (error) {
            console.error("Erro ao checar números:", error);
            showToast({ title: 'Erro', message: 'Falha ao verificar números no WhatsApp', variant: 'error' });
        } finally {
            setChecking(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.title}>
                    <Search size={32} style={styles.titleIcon} />
                    Checar Números WhatsApp
                </h1>
                <p style={styles.subtitle}>Valide se os números possuem conta no WhatsApp</p>
            </div>

            <div style={styles.card}>
                <div style={styles.formGroup}>
                    <label className="form-label">Instância Conectada *</label>
                    <select
                        value={selectedInstance}
                        onChange={(e) => setSelectedInstance(e.target.value)}
                        className="form-select"
                    >
                        <option value="">Selecione uma instância</option>
                        {instances.map(inst => (
                            <option key={inst.id} value={inst.id}>{inst.name}</option>
                        ))}
                    </select>
                </div>

                <div style={{ ...styles.formGroup, marginTop: '16px' }}>
                    <label className="form-label">Números para Checagem *</label>
                    <div className="form-input-wrapper" style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>

                        {/* Input de País (Validando Flag por DDI) */}
                        <div style={{ position: 'relative', width: '110px', flexShrink: 0 }}>
                            <div style={{
                                position: 'absolute',
                                left: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                zIndex: 1,
                                pointerEvents: 'none',
                                display: 'flex',
                                alignItems: 'center'
                            }}>
                                {(() => {
                                    const matchingCountry = countries.find(c => c.code === selectedCountry);
                                    return matchingCountry ? (
                                        <span style={{ fontSize: '1.2rem' }}>{matchingCountry.flag}</span>
                                    ) : (
                                        <Globe size={18} color={currentTheme.textSecondary} />
                                    );
                                })()}
                            </div>
                            <span style={{
                                position: 'absolute',
                                left: '42px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: currentTheme.textSecondary,
                                fontWeight: '500',
                                fontSize: '14px',
                                pointerEvents: 'none',
                                zIndex: 1
                            }}>+</span>
                            <input
                                type="text"
                                value={selectedCountry}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    setSelectedCountry(val);
                                }}
                                className="form-input"
                                style={{ paddingLeft: '54px' }}
                                placeholder="DDI"
                                maxLength={4}
                            />
                        </div>

                        <input
                            type="text"
                            value={phoneInput}
                            onChange={(e) => setPhoneInput(e.target.value)}
                            onKeyPress={handlePhoneInputKeyPress}
                            onPaste={handlePhoneInputPaste}
                            placeholder="Digite números e enter..."
                            className="form-input"
                            style={{ flex: 1 }}
                        />
                    </div>
                    <small className="form-help">
                        Digite números e pressione Enter. O código do país (+{selectedCountry}) será adicionado automaticamente.
                    </small>

                    {phoneNumbers.length > 0 && (
                        <div style={styles.tagsContainer}>
                            {phoneNumbers.map(item => (
                                <span key={item.id} style={styles.tag}>
                                    <Smartphone size={14} />
                                    {item.number}
                                    <button
                                        type="button"
                                        onClick={() => removePhoneNumber(item.id)}
                                        className="btn-remove-tag"
                                    >
                                        <X size={12} />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ marginTop: '24px' }}>
                    <button
                        onClick={handleCheckNumbers}
                        disabled={checking || loading}
                        className="btn-base btn-new"
                        style={{ width: '100%' }}
                    >
                        <Search size={20} />
                        {checking ? 'Verificando...' : 'Checar Números'}
                    </button>
                </div>
            </div>

            {results.length > 0 && (
                <div style={{ ...styles.card, marginTop: '24px' }}>
                    <h2 style={styles.cardTitle}> <Check size={20} /> Resultados</h2>

                    <div style={styles.tableContainer}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>Número Consultado</th>
                                    <th style={styles.th}>JID (WhatsApp ID)</th>
                                    <th style={styles.th}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.map((res, idx) => (
                                    <tr key={idx} style={styles.tr}>
                                        <td style={styles.td}>{res.number}</td>
                                        <td style={styles.td}>{res.jid}</td>
                                        <td style={styles.td}>
                                            <span style={{
                                                ...styles.statusBadge,
                                                backgroundColor: res.exists ? '#d1fae5' : '#fee2e2',
                                                color: res.exists ? '#065f46' : '#991b1b'
                                            }}>
                                                {res.exists ? 'Existe' : 'Não Existe'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

// Estilos (Cópia simplificada do NotificacoesManual para manter consistência)
const getStyles = (theme) => ({
    container: {
        padding: '24px',
        backgroundColor: theme.background,
        minHeight: '100vh',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
    },
    header: { marginBottom: '32px' },
    title: {
        fontSize: '32px',
        fontWeight: '700',
        color: theme.textPrimary,
        margin: '0 0 8px 0',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
    },
    titleIcon: { color: theme.primary },
    subtitle: { fontSize: '16px', color: theme.textSecondary, margin: 0 },
    card: {
        backgroundColor: theme.cardBackground,
        borderRadius: '12px',
        boxShadow: theme.shadow,
        border: `1px solid ${theme.border}`,
        padding: '24px'
    },
    cardTitle: {
        fontSize: '20px',
        fontWeight: '600',
        color: theme.textPrimary,
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    },
    formGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
    tagsContainer: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        padding: '8px',
        border: `1px solid ${theme.border}`,
        borderRadius: '8px',
        backgroundColor: theme.inputBackground || theme.background,
        marginTop: '8px'
    },
    tag: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        backgroundColor: theme.primary,
        color: 'white',
        borderRadius: '16px',
        fontSize: '12px',
        fontWeight: '500'
    },
    tableContainer: {
        overflowX: 'auto',
        border: `1px solid ${theme.border}`,
        borderRadius: '8px'
    },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: {
        padding: '12px 16px',
        textAlign: 'left',
        fontSize: '13px',
        fontWeight: '600',
        color: theme.textSecondary,
        backgroundColor: theme.backgroundSecondary || '#f9fafb',
        borderBottom: `1px solid ${theme.border}`,
        whiteSpace: 'nowrap'
    },
    tr: {
        borderBottom: `1px solid ${theme.border}`,
        transition: 'background-color 0.2s',
    },
    td: {
        padding: '12px 16px',
        fontSize: '14px',
        color: theme.textPrimary
    },
    statusBadge: {
        padding: '4px 10px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600',
        textTransform: 'uppercase'
    }
});

export default ChecarNumeros;
