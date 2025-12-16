import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

const NotificacoesManual = () => {
  const { currentTheme } = useTheme();
  const { user } = useAuth();

  // Estados da aplicação
  const [activeTab, setActiveTab] = useState('send'); // 'send' ou 'history'
  const [instances, setInstances] = useState([]);
  const [clients, setClients] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Estados do formulário
  const [formData, setFormData] = useState({
    name: '',
    instanceId: '',
    recipients: '',
    selectedClients: [],
    text: '',
    image: null,
    delay: 1000,
    linkPreview: true
  });

  // Estados da listagem
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    status: ''
  });

  // Carregar dados ao montar o componente
  useEffect(() => {
    fetchInstances();
    fetchClients();
    if (activeTab === 'history') {
      fetchNotifications();
    }
  }, [activeTab, pagination.page, filters]);

  // Buscar instâncias disponíveis
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
    } catch (error) {
      console.error('Erro ao carregar instâncias:', error);
      setMessage({ type: 'error', text: 'Erro ao carregar instâncias' });
    } finally {
      setLoading(false);
    }
  };

  // Buscar clientes
  const fetchClients = async () => {
    try {
      const response = await apiService.getClients({ limit: 1000, active: true });
      setClients(response.data.data || []);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  // Buscar histórico de notificações
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };

      const response = await apiService.getNotifications(params);
      setNotifications(response.data.data || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination?.total || 0,
        pages: response.data.pagination?.pages || 0
      }));
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
      setMessage({ type: 'error', text: 'Erro ao carregar histórico de notificações' });
    } finally {
      setLoading(false);
    }
  };

  // Estado para controlar o modal de clientes
  const [showClientModal, setShowClientModal] = useState(false);

  // Estados para controle de envio
  const [sendingProgress, setSendingProgress] = useState({
    isActive: false,
    currentIndex: 0,
    total: 0,
    isPaused: false,
    isStopped: false
  });

  // Estado para armazenar números como array de objetos
  const [phoneNumbers, setPhoneNumbers] = useState([]);
  const [phoneInput, setPhoneInput] = useState('');

  // Função para formatar um único número de telefone corretamente
  // Formatos suportados:
  // - Telefone fixo: XXXXXXXXXX (DDD + 8 dígitos, começando com 2-5)
  // - Celular: XX9XXXXXXXX (DDD + 9 dígitos, começando com 9 + 6-9)

  const formatSinglePhoneNumber = (number) => {
  // Remove tudo que não for número
  let numbersOnly = number.replace(/\D/g, '');

  // Se tiver DDI (55), remove
  if (numbersOnly.startsWith('55') && numbersOnly.length > 11) {
    numbersOnly = numbersOnly.substring(2);
  }

  // Validar DDD (deve estar entre 11 e 99)
  if (numbersOnly.length < 10) {
    return null; // Número muito curto
  }

  const ddd = numbersOnly.substring(0, 2);
  const dddNum = parseInt(ddd);
  if (dddNum < 11 || dddNum > 99) {
    return null; // DDD inválido
  }

  // Caso 10 dígitos → pode ser celular sem 9 ou fixo
  if (numbersOnly.length === 10) {
    const firstDigit = numbersOnly.charAt(2);
    
    // Se começar com 2, 3, 4 ou 5 → telefone fixo (8 dígitos após DDD)
    if (['2', '3', '4', '5'].includes(firstDigit)) {
      return numbersOnly; // XXXXXXXXXX (DDD + 8 dígitos fixo)
    }
    
    // Se começar com 6, 7, 8 ou 9 → celular, adiciona o 9
    if (['6', '7', '8', '9'].includes(firstDigit)) {
      const rest = numbersOnly.substring(2);
      return `${ddd}${rest}`; // XX9XXXXXXXX (DDD + 9 dígitos celular)
    }
    
    return null; // Primeiro dígito inválido
  }

  // Caso 11 dígitos → deve ser celular
  if (numbersOnly.length === 11) {
    const firstDigit = numbersOnly.charAt(2);
    
    // Deve começar com 9 para ser celular válido
    if (firstDigit === '9') {
      const secondDigit = numbersOnly.charAt(3);
      // O segundo dígito deve ser 6, 7, 8 ou 9
      if (['6', '7', '8', '9'].includes(secondDigit)) {
        return numbersOnly; // XX9XXXXXXXX (já está correto)
      }
    }
    
    return null; // Formato inválido para 11 dígitos
  }

  // Caso 12 dígitos → pode ter 99 duplicado
  if (numbersOnly.length === 12) {
    const ddd = numbersOnly.substring(0, 2);
    let rest = numbersOnly.substring(2);
    
    // Se começar com 99, remove um 9
    if (rest.startsWith('99')) {
      rest = rest.substring(1);
      const secondDigit = rest.charAt(1);
      // Verifica se após remover um 9, o formato fica válido
      if (['6', '7', '8', '9'].includes(secondDigit)) {
        return `${ddd}${rest}`; // XX9XXXXXXXX
      }
    }
    
    return null; // Formato inválido
  }

  // Número inválido
  return null;
};



  // Função para processar múltiplos números colados
  const processPhoneNumbers = (input) => {
    if (!input) return [];

    // Remove todos os caracteres não numéricos
    const numbersOnly = input.replace(/\D/g, '');

    if (numbersOnly.length === 0) return [];

    const numbers = [];
    let currentNumber = '';

    // Processa cada dígito
    for (let i = 0; i < numbersOnly.length; i++) {
      currentNumber += numbersOnly[i];

      // Se chegou a 11 dígitos, é um número completo
      if (currentNumber.length === 11) {
        const formatted = formatSinglePhoneNumber(currentNumber);
        if (formatted) numbers.push(formatted);
        currentNumber = '';
      }
      // Se chegou a 10 dígitos e ainda há mais dígitos, processa como número de 10 dígitos
      else if (currentNumber.length === 10 && i < numbersOnly.length - 1) {
        const formatted = formatSinglePhoneNumber(currentNumber);
        if (formatted) numbers.push(formatted);
        currentNumber = '';
      }
    }

    // Processa o último número se sobrou algo
    if (currentNumber.length >= 10) {
      const formatted = formatSinglePhoneNumber(currentNumber);
      if (formatted) numbers.push(formatted);
    }

    return numbers;
  };

  // Adicionar números à lista
  const addPhoneNumbers = (input) => {
    const newNumbers = processPhoneNumbers(input);
    const uniqueNumbers = newNumbers.filter(num =>
      !phoneNumbers.some(existing => existing.number === num)
    );

    if (uniqueNumbers.length > 0) {
      const numbersWithId = uniqueNumbers.map(num => ({
        id: Date.now() + Math.random(),
        number: num
      }));

      setPhoneNumbers(prev => [...prev, ...numbersWithId]);

      // Atualizar formData com a lista de números
      const allNumbers = [...phoneNumbers, ...numbersWithId].map(item => item.number).join(',');
      setFormData(prev => ({
        ...prev,
        recipients: allNumbers
      }));
    }
  };

  // Remover número da lista
  const removePhoneNumber = (id) => {
    const updatedNumbers = phoneNumbers.filter(item => item.id !== id);
    setPhoneNumbers(updatedNumbers);

    // Atualizar formData
    const allNumbers = updatedNumbers.map(item => item.number).join(',');
    setFormData(prev => ({
      ...prev,
      recipients: allNumbers
    }));
  };

  // Manipular input de telefone
  const handlePhoneInputChange = (e) => {
    setPhoneInput(e.target.value);
  };

  // Manipular tecla Enter no input de telefone
  const handlePhoneInputKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (phoneInput.trim()) {
        addPhoneNumbers(phoneInput);
        setPhoneInput('');
      }
    }
  };

  // Manipular paste no input de telefone
  const handlePhoneInputPaste = (e) => {
    setTimeout(() => {
      const pastedValue = e.target.value;
      if (pastedValue) {
        addPhoneNumbers(pastedValue);
        setPhoneInput('');
      }
    }, 0);
  };

  // Manipular mudanças no formulário
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Manipular upload de imagem
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de arquivo
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setMessage({ type: 'error', text: 'Tipo de arquivo não suportado. Use: JPEG, PNG, GIF ou WebP' });
        return;
      }

      // Validar tamanho (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Arquivo muito grande. Máximo 5MB' });
        return;
      }

      setFormData(prev => ({ ...prev, image: file }));
      setMessage({ type: '', text: '' });
    }
  };

  // Manipular seleção de clientes no modal
  const handleClientSelection = (client) => {
    // Formatar o número do cliente
    const formattedNumber = formatSinglePhoneNumber(client.cellphone);

    if (formattedNumber) {
      // Adicionar o número formatado à lista de números
      addPhoneNumbers([formattedNumber]);
    }

    // Fechar o modal
    setShowClientModal(false);
  };

  // Enviar notificação com progresso
  const handleSendNotification = async (e) => {
    e.preventDefault();

    // Validações
    if (!formData.name.trim()) {
      setMessage({ type: 'error', text: 'Digite o nome da notificação' });
      return;
    }

    if (!formData.instanceId) {
      setMessage({ type: 'error', text: 'Selecione uma instância' });
      return;
    }

    if (phoneNumbers.length === 0) {
      setMessage({ type: 'error', text: 'Adicione pelo menos um destinatário' });
      return;
    }

    if (!formData.text.trim()) {
      setMessage({ type: 'error', text: 'Digite o texto da mensagem' });
      return;
    }

    // Inicializar progresso
    setSendingProgress({
      isActive: true,
      currentIndex: 0,
      total: phoneNumbers.length,
      isPaused: false,
      isStopped: false
    });

    setSending(true);
    setMessage({ type: '', text: '' });

    try {
      // Util para converter arquivo em Base64 (fallback caso o backend/evolution espere base64)
      const fileToBase64 = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });

      // Pré-calcular base64 uma vez
      let imageBase64 = null;
      if (formData.image) {
        try {
          imageBase64 = await fileToBase64(formData.image);
        } catch (convErr) {
          console.error('Erro ao converter imagem para base64:', convErr);
        }
      }
      const selectedInstance = instances.find(inst => inst.id === parseInt(formData.instanceId));
      if (!selectedInstance) {
        throw new Error('Instância não encontrada');
      }

      // Enviar mensagens uma por uma com intervalo
      for (let i = 0; i < phoneNumbers.length; i++) {
        // Verificar se foi pausado ou parado
        if (sendingProgress.isStopped) {
          break;
        }

        // Aguardar se pausado
        while (sendingProgress.isPaused && !sendingProgress.isStopped) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Atualizar progresso
        setSendingProgress(prev => ({
          ...prev,
          currentIndex: i + 1
        }));

        const phoneNumberObj = phoneNumbers[i];
        const phoneNumber = phoneNumberObj.number;

        try {
          // Preparar FormData para envio individual
          const evolutionApiUrl = import.meta.env.VITE_EVOLUTION_API_URL || 'http://localhost:8080';
          const evolutionApiKey = import.meta.env.VITE_EVOLUTION_API_KEY || '';

          // Se houver imagem, enviar diretamente para Evolution API como JSON base64
          if (formData.image && imageBase64) {
            const base64Raw = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
            const toJid = phoneNumber.endsWith('@c.us') ? phoneNumber : `55${phoneNumber}@c.us`;

            const payload = {
              to: toJid,
              type: 'image',
              data: base64Raw,
              mimetype: formData.image.type,
              caption: formData.text,
              fileName: formData.image.name,
            };

            const resp = await fetch(`${evolutionApiUrl}/message/sendmedia`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': evolutionApiKey,
              },
              body: JSON.stringify(payload),
            });

            if (!resp.ok) {
              const errText = await resp.text();
              throw new Error(`Evolution erro ${resp.status}: ${errText}`);
            }
          } else {
            // Sem imagem: usa backend atual para envio de texto/registro
            const formDataToSend = new FormData();
            formDataToSend.append('name', `${formData.name} - ${phoneNumber}`);
            formDataToSend.append('message', formData.text);
            formDataToSend.append('recipients', phoneNumber);
            formDataToSend.append('channelId', formData.instanceId);
            formDataToSend.append('channelName', selectedInstance.instanceName);
            formDataToSend.append('selectedClients', JSON.stringify([]));
            await apiService.createNotification(formDataToSend);
          }

          // Aguardar intervalo antes da próxima mensagem (exceto na última)
          if (i < phoneNumbers.length - 1) {
            await new Promise(resolve => setTimeout(resolve, formData.interval * 1000));
          }

        } catch (error) {
          console.error(`Erro ao enviar para ${phoneNumber}:`, error);
          // Continuar com os próximos números mesmo se um falhar
        }
      }

      setMessage({
        type: 'success',
        text: `Envio concluído! ${phoneNumbers.length} mensagens processadas.`
      });

      // Limpar formulário
      setFormData({
        name: '',
        instanceId: '',
        recipients: '',
        selectedClients: [],
        text: '',
        image: null,
        delay: 1000,
        linkPreview: true,
        interval: 1
      });

      setPhoneNumbers([]);
      setPhoneInput('');

      // Limpar input de arquivo
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';

    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Erro ao enviar notificação'
      });
    } finally {
      setSending(false);
      setSendingProgress({
        isActive: false,
        currentIndex: 0,
        total: 0,
        isPaused: false,
        isStopped: false
      });
    }
  };

  // Pausar envio
  const handlePauseSending = () => {
    setSendingProgress(prev => ({
      ...prev,
      isPaused: !prev.isPaused
    }));
  };

  // Parar envio
  const handleStopSending = () => {
    setSendingProgress(prev => ({
      ...prev,
      isStopped: true
    }));
  };

  // Formatar data
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  // Renderizar formulário de envio
  const renderSendForm = () => (
    <div>
      <h2 style={{
        margin: '0 0 1.5rem 0',
        fontSize: '1.5rem',
        fontWeight: 'bold',
        color: currentTheme.primary
      }}>
        Enviar Nova Notificação
      </h2>

      <form onSubmit={handleSendNotification} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Nome da Notificação */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: '500',
            color: currentTheme.textPrimary
          }}>
            Nome da Notificação *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Ex: Promoção Black Friday"
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              border: `1px solid ${currentTheme.border}`,
              borderRadius: '4px',
              backgroundColor: currentTheme.inputBackground,
              color: currentTheme.textPrimary,
              fontSize: '1rem'
            }}
          />
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1rem'
        }}>
          {/* Instância */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '500',
              color: currentTheme.textPrimary
            }}>
              Instância WhatsApp *
            </label>
            <select
              name="instanceId"
              value={formData.instanceId}
              onChange={handleInputChange}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${currentTheme.border}`,
                borderRadius: '4px',
                backgroundColor: currentTheme.inputBackground,
                color: currentTheme.textPrimary,
                fontSize: '1rem'
              }}
            >
              <option value="">Selecione uma instância</option>
              {instances.map(instance => (
                <option key={instance.id} value={instance.id}>
                  {instance.instanceName} ({instance.status === 'connected' ? '🟢 Conectada' : '🔴 Desconectada'})
                </option>
              ))}
            </select>
          </div>

          {/* Upload de Imagem */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '500',
              color: currentTheme.textPrimary
            }}>
              Imagem (Opcional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${currentTheme.border}`,
                borderRadius: '4px',
                backgroundColor: currentTheme.inputBackground,
                color: currentTheme.textPrimary,
                fontSize: '1rem'
              }}
            />
            <small style={{
              color: currentTheme.textSecondary,
              fontSize: '0.875rem',
              marginTop: '0.25rem',
              display: 'block'
            }}>
              Formatos: JPEG, PNG, GIF, WebP (máx. 5MB)
            </small>
          </div>
        </div>

        {/* Seleção de Clientes - Botão para abrir modal */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: '500',
            color: currentTheme.textPrimary
          }}>
            Selecionar Clientes
          </label>
          <button
            type="button"
            onClick={() => setShowClientModal(true)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: `1px solid ${currentTheme.border}`,
              borderRadius: '4px',
              backgroundColor: currentTheme.inputBackground,
              color: currentTheme.textPrimary,
              cursor: 'pointer',
              fontSize: '1rem',
              textAlign: 'left'
            }}
          >
            Clique para selecionar clientes
          </button>
        </div>


        {/* Destinatários */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: '500',
            color: currentTheme.textPrimary
          }}>
            Destinatários *
          </label>

          {/* Input para adicionar números */}
          <input
            type="text"
            value={phoneInput}
            onChange={handlePhoneInputChange}
            onKeyPress={handlePhoneInputKeyPress}
            onPaste={handlePhoneInputPaste}
            placeholder="Digite ou cole números: 8599025454 ou 8599902545485988766166"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: `1px solid ${currentTheme.border}`,
              borderRadius: '4px',
              backgroundColor: currentTheme.inputBackground,
              color: currentTheme.textPrimary,
              fontSize: '1rem',
              marginBottom: '0.5rem'
            }}
          />

          {/* Tags dos números adicionados */}
          {phoneNumbers.length > 0 && (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.5rem',
              marginBottom: '0.5rem',
              padding: '0.5rem',
              border: `1px solid ${currentTheme.border}`,
              borderRadius: '4px',
              backgroundColor: currentTheme.inputBackground,
              minHeight: '50px'
            }}>
              {phoneNumbers.map(item => (
                <span
                  key={item.id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    backgroundColor: currentTheme.primary,
                    color: 'white',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '16px',
                    fontSize: '0.875rem',
                    gap: '0.25rem'
                  }}
                >
                  {item.number}
                  <button
                    type="button"
                    onClick={() => removePhoneNumber(item.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'white',
                      cursor: 'pointer',
                      padding: '0',
                      marginLeft: '0.25rem',
                      fontSize: '1rem',
                      lineHeight: '1'
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          <small style={{
            color: currentTheme.textSecondary,
            fontSize: '0.875rem',
            marginTop: '0.25rem',
            display: 'block'
          }}>
            Digite números e pressione Enter para adicionar. Números de 10 dígitos terão o 9 adicionado automaticamente. Clique no × para remover.
          </small>
        </div>

        {/* Campo de Intervalo */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: '500',
            color: currentTheme.textPrimary
          }}>
            Intervalo entre envios (segundos)
          </label>
          <input
            type="number"
            name="interval"
            value={formData.interval || 1}
            onChange={handleInputChange}
            min="1"
            max="60"
            placeholder="1"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: `1px solid ${currentTheme.border}`,
              borderRadius: '4px',
              backgroundColor: currentTheme.inputBackground,
              color: currentTheme.textPrimary,
              fontSize: '1rem'
            }}
          />
          <small style={{
            color: currentTheme.textSecondary,
            fontSize: '0.875rem',
            marginTop: '0.25rem',
            display: 'block'
          }}>
            Tempo de espera entre cada envio (mínimo 1 segundo, máximo 60 segundos)
          </small>
        </div>

        {/* Mensagem */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: '500',
            color: currentTheme.textPrimary
          }}>
            Mensagem *
          </label>
          <textarea
            name="text"
            value={formData.text}
            onChange={handleInputChange}
            placeholder="Digite sua mensagem aqui..."
            required
            rows={4}
            maxLength={4096}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: `1px solid ${currentTheme.border}`,
              borderRadius: '4px',
              backgroundColor: currentTheme.inputBackground,
              color: currentTheme.textPrimary,
              fontSize: '1rem',
              resize: 'vertical',
              minHeight: '100px'
            }}
          />
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '0.25rem'
          }}>
            <small style={{
              color: currentTheme.textSecondary,
              fontSize: '0.875rem'
            }}>
              Máximo 4096 caracteres
            </small>
            <small style={{
              color: formData.text.length > 4000 ? '#ef4444' : currentTheme.textSecondary,
              fontSize: '0.875rem',
              fontWeight: formData.text.length > 4000 ? 'bold' : 'normal'
            }}>
              {formData.text.length}/4096
            </small>
          </div>
        </div>

        {/* Progresso de Envio */}
        {sendingProgress.isActive && (
          <div style={{
            backgroundColor: currentTheme.inputBackground,
            border: `1px solid ${currentTheme.border}`,
            borderRadius: '8px',
            padding: '1.5rem',
            marginBottom: '1rem'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <h3 style={{
                margin: 0,
                color: currentTheme.textPrimary,
                fontSize: '1.1rem'
              }}>
                Progresso do Envio
              </h3>
              <span style={{
                color: currentTheme.textSecondary,
                fontSize: '0.9rem'
              }}>
                {sendingProgress.currentIndex} de {sendingProgress.total}
              </span>
            </div>

            {/* Barra de progresso */}
            <div style={{
              width: '100%',
              height: '8px',
              backgroundColor: currentTheme.border,
              borderRadius: '4px',
              overflow: 'hidden',
              marginBottom: '1rem'
            }}>
              <div style={{
                width: `${(sendingProgress.currentIndex / sendingProgress.total) * 100}%`,
                height: '100%',
                backgroundColor: currentTheme.primary,
                transition: 'width 0.3s ease'
              }} />
            </div>

            {/* Botões de controle */}
            <div style={{
              display: 'flex',
              gap: '0.5rem'
            }}>
              <button
                type="button"
                onClick={handlePauseSending}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: sendingProgress.isPaused ? '#10b981' : '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                {sendingProgress.isPaused ? 'Retomar' : 'Pausar'}
              </button>

              <button
                type="button"
                onClick={handleStopSending}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                Parar
              </button>
            </div>

            {sendingProgress.isPaused && (
              <div style={{
                marginTop: '0.5rem',
                padding: '0.5rem',
                backgroundColor: '#f59e0b20',
                borderRadius: '4px',
                color: '#f59e0b',
                fontSize: '0.875rem'
              }}>
                Envio pausado. Clique em "Retomar" para continuar.
              </div>
            )}
          </div>
        )}

        {/* Botão de envio */}
        <button
          type="submit"
          disabled={sending || loading || instances.length === 0 || sendingProgress.isActive}
          style={{
            padding: '1rem 2rem',
            backgroundColor: (sending || sendingProgress.isActive) ? currentTheme.textSecondary : currentTheme.primary,
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: (sending || loading || instances.length === 0 || sendingProgress.isActive) ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s'
          }}
        >
          {sendingProgress.isActive ? 'Enviando...' : sending ? 'Enviando...' : 'Enviar Notificação'}
        </button>
      </form>
    </div>
  );

  // Renderizar histórico
  const renderHistory = () => (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <h2 style={{
          margin: 0,
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: currentTheme.primary
        }}>
          Histórico de Notificações
        </h2>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <input
            type="text"
            placeholder="Buscar..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            style={{
              padding: '0.5rem',
              border: `1px solid ${currentTheme.border}`,
              borderRadius: '4px',
              backgroundColor: currentTheme.inputBackground,
              color: currentTheme.textPrimary
            }}
          />
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            style={{
              padding: '0.5rem',
              border: `1px solid ${currentTheme.border}`,
              borderRadius: '4px',
              backgroundColor: currentTheme.inputBackground,
              color: currentTheme.textPrimary
            }}
          >
            <option value="">Todos os status</option>
            <option value="pending">Pendente</option>
            <option value="sent">Enviado</option>
            <option value="failed">Falhou</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: currentTheme.textSecondary }}>
          Carregando...
        </div>
      ) : notifications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: currentTheme.textSecondary }}>
          Nenhuma notificação encontrada
        </div>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              backgroundColor: currentTheme.cardBackground
            }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${currentTheme.border}` }}>
                  <th style={{ padding: '1rem', textAlign: 'left', color: currentTheme.textPrimary, fontWeight: 'bold' }}>Data</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: currentTheme.textPrimary, fontWeight: 'bold' }}>Nome</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: currentTheme.textPrimary, fontWeight: 'bold' }}>Canal</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: currentTheme.textPrimary, fontWeight: 'bold' }}>Destinatários</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: currentTheme.textPrimary, fontWeight: 'bold' }}>Status</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: currentTheme.textPrimary, fontWeight: 'bold' }}>Mensagem</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map(notification => (
                  <tr key={notification.id} style={{ borderBottom: `1px solid ${currentTheme.border}` }}>
                    <td style={{ padding: '1rem', color: currentTheme.textPrimary }}>
                      {formatDate(notification.dateCreated)}
                    </td>
                    <td style={{ padding: '1rem', color: currentTheme.textPrimary, fontWeight: '500' }}>
                      {notification.name}
                    </td>
                    <td style={{ padding: '1rem', color: currentTheme.textPrimary }}>
                      {notification.channelName || 'N/A'}
                    </td>
                    <td style={{ padding: '1rem', color: currentTheme.textPrimary }}>
                      <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {notification.recipients?.join(', ') || 'N/A'}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                        fontWeight: 'bold',
                        backgroundColor:
                          notification.status === 'sent' ? '#d4edda' :
                            notification.status === 'failed' ? '#f8d7da' : '#fff3cd',
                        color:
                          notification.status === 'sent' ? '#155724' :
                            notification.status === 'failed' ? '#721c24' : '#856404'
                      }}>
                        {notification.status === 'sent' ? 'Enviado' :
                          notification.status === 'failed' ? 'Falhou' : 'Pendente'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', color: currentTheme.textPrimary }}>
                      <div style={{
                        maxWidth: '300px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {notification.message}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {pagination.pages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '1rem',
              marginTop: '2rem'
            }}>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
                style={{
                  padding: '0.5rem 1rem',
                  border: `1px solid ${currentTheme.border}`,
                  borderRadius: '4px',
                  backgroundColor: currentTheme.inputBackground,
                  color: currentTheme.textPrimary,
                  cursor: pagination.page === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                Anterior
              </button>

              <span style={{ color: currentTheme.textPrimary }}>
                Página {pagination.page} de {pagination.pages}
              </span>

              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                disabled={pagination.page === pagination.pages}
                style={{
                  padding: '0.5rem 1rem',
                  border: `1px solid ${currentTheme.border}`,
                  borderRadius: '4px',
                  backgroundColor: currentTheme.inputBackground,
                  color: currentTheme.textPrimary,
                  cursor: pagination.page === pagination.pages ? 'not-allowed' : 'pointer'
                }}
              >
                Próxima
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <div style={{
      padding: '2rem',
      backgroundColor: currentTheme.background,
      color: currentTheme.textPrimary,
      minHeight: '100vh'
    }}>
      <div style={{
        backgroundColor: currentTheme.cardBackground,
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: currentTheme.shadow
      }}>
        <h1 style={{
          margin: '0 0 1rem 0',
          fontSize: '2rem',
          fontWeight: 'bold',
          color: currentTheme.primary
        }}>
          Notificações - Manual
        </h1>
        <p style={{
          color: currentTheme.textSecondary,
          fontSize: '1.1rem',
          lineHeight: '1.6',
          marginBottom: '2rem'
        }}>
          Envie notificações manuais para seus clientes via WhatsApp.
        </p>

        {/* Mensagens de feedback */}
        {message.text && (
          <div style={{
            padding: '1rem',
            borderRadius: '4px',
            marginBottom: '2rem',
            backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
            color: message.type === 'success' ? '#155724' : '#721c24',
            border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`
          }}>
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div style={{
          display: 'flex',
          marginBottom: '2rem',
          borderBottom: `2px solid ${currentTheme.border}`
        }}>
          <button
            onClick={() => setActiveTab('send')}
            style={{
              padding: '1rem 2rem',
              border: 'none',
              backgroundColor: 'transparent',
              color: activeTab === 'send' ? currentTheme.primary : currentTheme.textSecondary,
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              borderBottom: activeTab === 'send' ? `3px solid ${currentTheme.primary}` : '3px solid transparent',
              transition: 'all 0.2s'
            }}
          >
            Enviar Notificação
          </button>
          <button
            onClick={() => setActiveTab('history')}
            style={{
              padding: '1rem 2rem',
              border: 'none',
              backgroundColor: 'transparent',
              color: activeTab === 'history' ? currentTheme.primary : currentTheme.textSecondary,
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              borderBottom: activeTab === 'history' ? `3px solid ${currentTheme.primary}` : '3px solid transparent',
              transition: 'all 0.2s'
            }}
          >
            Histórico
          </button>
        </div>

        {/* Conteúdo das tabs */}
        {activeTab === 'send' ? renderSendForm() : renderHistory()}
      </div>

      {/* Modal de Seleção de Clientes */}
      {showClientModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: currentTheme.cardBackground,
            borderRadius: '8px',
            padding: '1.5rem',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <h3 style={{
                margin: 0,
                color: currentTheme.textPrimary,
                fontSize: '1.25rem'
              }}>
                Selecionar Cliente
              </h3>
              <button
                onClick={() => setShowClientModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: currentTheme.textSecondary,
                  padding: '0.25rem'
                }}
              >
                ×
              </button>
            </div>

            <div style={{
              flex: 1,
              overflowY: 'auto',
              border: `1px solid ${currentTheme.border}`,
              borderRadius: '4px',
              backgroundColor: currentTheme.inputBackground
            }}>
              {clients.map(client => (
                <div
                  key={client.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '1rem',
                    borderBottom: `1px solid ${currentTheme.border}`,
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onClick={() => handleClientSelection(client)}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = currentTheme.primary + '10';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{
                      color: currentTheme.textPrimary,
                      fontWeight: '500',
                      marginBottom: '0.25rem'
                    }}>
                      {client.name}
                    </div>
                    <div style={{
                      color: currentTheme.textSecondary,
                      fontSize: '0.875rem'
                    }}>
                      {client.cellphone}
                    </div>
                  </div>
                </div>
              ))}

              {clients.length === 0 && (
                <div style={{
                  padding: '2rem',
                  textAlign: 'center',
                  color: currentTheme.textSecondary
                }}>
                  Nenhum cliente encontrado
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificacoesManual;