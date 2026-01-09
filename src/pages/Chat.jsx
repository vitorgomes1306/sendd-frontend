import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { apiService } from '../services/api';
import { 
  MessageSquare, 
  Users, 
  Clock, 
  List, 
  User, 
  Settings, 
  Send as SendIcon, 
  Paperclip, 
  Smile, 
  MoreVertical,
  Phone,
  Video,
  Search
} from 'lucide-react';
import './Chat.css';

const Chat = () => {
  const { currentTheme } = useTheme();

  // Configuration State
  const [showConfigModal, setShowConfigModal] = useState(true);
  const [instances, setInstances] = useState([]);
  const [config, setConfig] = useState({
    instanceId: '',
    departments: ''
  });

  // Chat State
  const [activeTab, setActiveTab] = useState('history'); // history, bot, queue, my_chats
  const [selectedContact, setSelectedContact] = useState(null);
  const [contacts, setContacts] = useState([]); // Placeholder for now
  const [messageInput, setMessageInput] = useState('');
  
  // Dummy Messages for UI
  const [messages, setMessages] = useState([
    { id: 1, text: 'Olá, como posso ajudar?', sender: 'me', time: '10:00' },
    { id: 2, text: 'Gostaria de saber sobre os planos.', sender: 'other', time: '10:01' },
    { id: 3, text: 'Claro! Temos planos a partir de R$ 99,90.', sender: 'me', time: '10:02' }
  ]);

  // Load Instances on Mount
  useEffect(() => {
    fetchInstances();
  }, []);

  const fetchInstances = async () => {
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
            organizationName: org.razaoSocial || org.nomeFantasia
          }));
          allInstances = [...allInstances, ...instancesWithOrg];
        } catch (error) {
          console.error(`Erro ao carregar instâncias da organização ${org.id}:`, error);
        }
      }
      setInstances(allInstances.filter(i => i.status === 'connected'));
    } catch (error) {
      console.error('Erro ao carregar instâncias:', error);
    }
  };

  const handleConfigSubmit = (e) => {
    e.preventDefault();
    if (config.instanceId) {
      setShowConfigModal(false);
      // Load contacts/chats based on instance...
      loadDummyContacts();
    }
  };

  const loadDummyContacts = () => {
    // Simulating data based on tabs
    const dummyData = [
      { id: 1, name: 'João Silva', lastMessage: 'Obrigado pelo atendimento', time: '10:30', avatar: null, type: 'history' },
      { id: 2, name: 'Maria Santos', lastMessage: 'Quero cancelar', time: '09:15', avatar: null, type: 'queue' },
      { id: 3, name: 'Pedro Souza', lastMessage: 'Aguardando resposta...', time: 'Ontem', avatar: null, type: 'my_chats' },
      { id: 4, name: 'Bot Atendimento', lastMessage: 'Menu principal enviado', time: '11:00', avatar: null, type: 'bot' },
    ];
    setContacts(dummyData);
  };

  const getFilteredContacts = () => {
    // Simple filter for now, in real app would filter by API or state
    if (activeTab === 'history') return contacts; // Show all for history/demo
    return contacts.filter(c => c.type === activeTab);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;
    
    const newMessage = {
      id: Date.now(),
      text: messageInput,
      sender: 'me',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages([...messages, newMessage]);
    setMessageInput('');
  };

  return (
    <div className="chat-container">
      {/* Configuration Modal */}
      {showConfigModal && (
        <div className="config-modal-overlay">
          <div className="config-modal">
            <div className="config-header">
              <Settings size={24} />
              <h2>Configuração do Chat</h2>
            </div>
            <form onSubmit={handleConfigSubmit}>
              <div className="config-body">
                <div className="form-group">
                  <label>Selecione o Canal (Instância)</label>
                  <select 
                    value={config.instanceId}
                    onChange={(e) => setConfig({...config, instanceId: e.target.value})}
                    required
                    style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd'}}
                  >
                    <option value="">Selecione...</option>
                    {instances.map(inst => (
                      <option key={inst.id} value={inst.id}>
                        {inst.name} ({inst.organizationName})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Departamentos (Separar por vírgula)</label>
                  <input 
                    type="text" 
                    value={config.departments}
                    onChange={(e) => setConfig({...config, departments: e.target.value})}
                    placeholder="Ex: Suporte, Vendas, Financeiro"
                    style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd'}}
                  />
                  <small style={{color: '#666', marginTop: '4px'}}>*CRUD de departamentos será implementado em breve.</small>
                </div>
              </div>
              <div className="config-footer">
                <button type="submit" className="config-btn" disabled={!config.instanceId}>
                  Entrar no Chat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Left Sidebar */}
      <div className="chat-sidebar">
        <div className="sidebar-header">
          <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
             <div style={{width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#0084ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'}}>
               <User size={18} />
             </div>
             <span style={{fontWeight: '600'}}>Meu Usuário</span>
          </div>
          <div style={{display: 'flex', gap: '8px'}}>
            <button onClick={() => setShowConfigModal(true)} style={{background: 'none', border: 'none', cursor: 'pointer', color: '#666'}}>
              <Settings size={20} />
            </button>
          </div>
        </div>

        <div className="sidebar-tabs">
          <button 
            className={`sidebar-tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
            title="Histórico"
          >
            <Clock size={20} />
            <span>Histórico</span>
          </button>
          <button 
            className={`sidebar-tab ${activeTab === 'bot' ? 'active' : ''}`}
            onClick={() => setActiveTab('bot')}
            title="Bot"
          >
            <MessageSquare size={20} />
            <span>Bot</span>
          </button>
          <button 
            className={`sidebar-tab ${activeTab === 'queue' ? 'active' : ''}`}
            onClick={() => setActiveTab('queue')}
            title="Fila"
          >
            <List size={20} />
            <span>Fila</span>
          </button>
          <button 
            className={`sidebar-tab ${activeTab === 'my_chats' ? 'active' : ''}`}
            onClick={() => setActiveTab('my_chats')}
            title="Meus"
          >
            <Users size={20} />
            <span>Meus</span>
          </button>
        </div>

        <div style={{padding: '10px'}}>
           <div style={{position: 'relative'}}>
             <Search size={16} style={{position: 'absolute', left: '10px', top: '10px', color: '#999'}} />
             <input 
               type="text" 
               placeholder="Buscar contatos..." 
               style={{
                 width: '100%', 
                 padding: '8px 8px 8px 32px', 
                 borderRadius: '20px', 
                 border: '1px solid #ddd',
                 backgroundColor: '#f0f2f5',
                 outline: 'none'
               }}
             />
           </div>
        </div>

        <div className="contact-list">
          {contacts.length === 0 ? (
            <div style={{padding: '20px', textAlign: 'center', color: '#999', fontSize: '14px'}}>
              Nenhum contato encontrado nesta aba.
            </div>
          ) : (
            contacts.map(contact => (
              <div 
                key={contact.id} 
                className={`contact-item ${selectedContact?.id === contact.id ? 'active' : ''}`}
                onClick={() => setSelectedContact(contact)}
              >
                <div className="contact-avatar">
                  {contact.avatar ? <img src={contact.avatar} alt="" /> : <User size={20} />}
                </div>
                <div className="contact-info">
                  <div className="contact-name">{contact.name}</div>
                  <div className="contact-preview">{contact.lastMessage}</div>
                </div>
                <div className="contact-meta">
                  {contact.time}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area (Right Div - Full Width for now) */}
      <div className="chat-main">
        {selectedContact ? (
          <>
            <div className="chat-header">
              <div className="chat-header-info">
                <div className="contact-avatar" style={{width: '40px', height: '40px'}}>
                  {selectedContact.avatar ? <img src={selectedContact.avatar} alt="" /> : <User size={18} />}
                </div>
                <div>
                  <div style={{fontWeight: '600'}}>{selectedContact.name}</div>
                  <div style={{fontSize: '12px', color: '#666'}}>Online</div>
                </div>
              </div>
              <div style={{display: 'flex', gap: '16px', color: '#0084ff'}}>
                <Search size={20} style={{cursor: 'pointer'}} />
                <MoreVertical size={20} style={{cursor: 'pointer'}} />
              </div>
            </div>

            <div className="chat-messages">
              {messages.map(msg => (
                <div key={msg.id} className={`message ${msg.sender === 'me' ? 'sent' : 'received'}`}>
                  <div>{msg.text}</div>
                  <div className="message-time">{msg.time}</div>
                </div>
              ))}
            </div>

            <form className="chat-input-area" onSubmit={handleSendMessage}>
              <button type="button" className="send-button">
                <Smile size={24} />
              </button>
              <button type="button" className="send-button">
                <Paperclip size={24} />
              </button>
              <input 
                type="text" 
                className="chat-input" 
                placeholder="Digite uma mensagem" 
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
              />
              <button type="submit" className="send-button">
                <SendIcon size={24} />
              </button>
            </form>
          </>
        ) : (
          <div className="chat-empty-state">
            <img 
              src="https://img.freepik.com/free-vector/conversation-concept-illustration_114360-1102.jpg?w=740&t=st=1704724000~exp=1704724600~hmac=..." 
              alt="Chat" 
              style={{width: '300px', opacity: 0.8, marginBottom: '20px'}}
            />
            <h2>Bem-vindo ao Chat Sendd</h2>
            <p>Selecione um contato para iniciar o atendimento.</p>
          </div>
        )}
      </div>

      {/* Third Div (Placeholder/Hidden for now as requested) */}
      {/* 
      <div className="chat-info-sidebar" style={{display: 'none'}}>
         Info
      </div> 
      */}
    </div>
  );
};

export default Chat;
