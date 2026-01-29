import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import Button from '../components/ui/Button';
import { Clock, CheckSquare, Square, Save } from 'lucide-react';
import './ConfiguracaoHorarios.css';

const DAYS = [
  { id: 1, label: 'Segunda-feira' },
  { id: 2, label: 'Terça-feira' },
  { id: 3, label: 'Quarta-feira' },
  { id: 4, label: 'Quinta-feira' },
  { id: 5, label: 'Sexta-feira' },
  { id: 6, label: 'Sábado' },
  { id: 0, label: 'Domingo' }
];

const ConfiguracaoHorarios = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [outOfHoursMessage, setOutOfHoursMessage] = useState('');

  // New States for Notification
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [notificationTarget, setNotificationTarget] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationInstanceId, setNotificationInstanceId] = useState('');

  const [instances, setInstances] = useState([]);

  const [hours, setHours] = useState({});
  const [organizationId, setOrganizationId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch Instances
      const instancesRes = await apiService.get('/private/instance');
      setInstances(instancesRes.data?.instances || []);

      const orgRes = await apiService.get('/private/organizations');
      const orgs = orgRes.data;
      if (orgs.length > 0) {
        const orgId = orgs[0].id;
        setOrganizationId(orgId);

        const res = await apiService.get(`/private/organizations/${orgId}/business-hours`);
        setOutOfHoursMessage(res.data.outOfHoursMessage || '');
        setNotificationEnabled(!!res.data.outOfHoursNotificationEnabled);
        setNotificationTarget(res.data.outOfHoursNotificationTarget || '');
        setNotificationMessage(res.data.outOfHoursNotificationMessage || '');
        setNotificationInstanceId(res.data.outOfHoursNotificationInstanceId || '');

        const hoursMap = {};
        DAYS.forEach(d => {
          hoursMap[d.id] = {
            startTime: '08:00',
            endTime: '12:00',
            startTime2: '13:00',
            endTime2: '18:00',
            isOpen: d.id !== 0 && d.id !== 6
          };
        });

        if (res.data.hours && Array.isArray(res.data.hours)) {
          res.data.hours.forEach(h => {
            hoursMap[h.dayOfWeek] = {
              startTime: h.startTime,
              endTime: h.endTime,
              startTime2: h.startTime2 || '',
              endTime2: h.endTime2 || '',
              isOpen: h.isOpen
            };
          });
        }
        setHours(hoursMap);
      }
    } catch (error) {
      console.error('Erro ao carregar horários:', error);
      showToast({ title: 'Erro', message: 'Falha ao carregar horários.', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleHourChange = (dayId, field, value) => {
    setHours(prev => ({
      ...prev,
      [dayId]: { ...prev[dayId], [field]: value }
    }));
  };

  const handleToggleOpen = (dayId) => {
    setHours(prev => ({
      ...prev,
      [dayId]: { ...prev[dayId], isOpen: !prev[dayId].isOpen }
    }));
  };

  const handleSave = async () => {
    if (!organizationId) return;
    setSaving(true);
    try {
      const hoursArray = Object.keys(hours).map(dayId => ({
        dayOfWeek: Number(dayId),
        startTime: hours[dayId].startTime,
        endTime: hours[dayId].endTime,
        startTime2: hours[dayId].startTime2,
        endTime2: hours[dayId].endTime2,
        isOpen: hours[dayId].isOpen
      }));

      await apiService.post(`/private/organizations/${organizationId}/business-hours`, {
        organizationId,
        outOfHoursMessage,
        outOfHoursNotificationEnabled: notificationEnabled,
        outOfHoursNotificationTarget: notificationTarget,
        outOfHoursNotificationMessage: notificationMessage,
        outOfHoursNotificationInstanceId: notificationInstanceId,
        hours: hoursArray
      });

      showToast({ title: 'Salvo', message: 'Horários atualizados com sucesso.', variant: 'success' });
    } catch (error) {
      console.error('Erro ao salvar:', error);
      showToast({ title: 'Erro', message: 'Falha ao salvar horários.', variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-4">Carregando...</div>;

  return (
    <div className="business-hours-container">
      <div className="header">
        <h1><Clock size={24} /> Horários de Atendimento</h1>
        <p>Configure os horários em que o bot deve transferir para a fila. Fora destes horários, a mensagem de ausência será enviada.</p>
      </div>

      <div className="card">
        <h3>Mensagem de Ausência</h3>
        <p className="hint">Enviada quando o cliente solicita atendimento fora do horário.</p>
        <textarea
          className="form-textarea"
          value={outOfHoursMessage}
          onChange={(e) => setOutOfHoursMessage(e.target.value)}
          rows={3}
          placeholder="Ex: No momento estamos fechados. Responderemos assim que possível."
        />
      </div>

      <div className="card">
        <h3>Notificação Interna (Fora de Horário)</h3>
        <p className="hint">Avise seu time quando um cliente tentar contato fora do horário.</p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <label className="switch">
            <input
              type="checkbox"
              checked={notificationEnabled}
              onChange={(e) => setNotificationEnabled(e.target.checked)}
            />
            <span className="slider round"></span>
          </label>
          <span>{notificationEnabled ? 'Ativado' : 'Desativado'}</span>
        </div>

        {notificationEnabled && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>Destino (Número ou Group JID)</label>
              <input
                type="text"
                className="form-input"
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}
                value={notificationTarget}
                onChange={(e) => setNotificationTarget(e.target.value)}
                placeholder="Ex: 5585994454472 ou 1203630...@g.us"
              />
              <p className="hint" style={{ fontSize: '12px', marginTop: '4px' }}>Para grupos, use o JID que pode ser encontrado nos logs ou via API.</p>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>Instância de Envio</label>
              <select
                className="form-input"
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}
                value={notificationInstanceId}
                onChange={(e) => setNotificationInstanceId(e.target.value)}
              >
                <option value="">(Padrão) Instância atual do Chat</option>
                {instances.map(inst => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name} ({inst.instanceName}) - {inst.status === 'connected' ? '🟢 Conectado' : '🔴 Desconectado'}
                  </option>
                ))}
              </select>
              <p className="hint" style={{ fontSize: '12px', marginTop: '4px' }}>Escolha qual WhatsApp enviará o aviso interno.</p>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>Mensagem Personalizada (Opcional)</label>
              <textarea
                className="form-textarea"
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
                rows={2}
                placeholder="Deixe em branco para usar a mensagem padrão: 'Novo Cliente na Fila (Fora de Horário)...'"
              />
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h3>Horários Semanais</h3>
        <div className="hours-grid">
          {DAYS.map(day => {
            const dayConfig = hours[day.id] || { startTime: '08:00', endTime: '18:00', isOpen: false };
            return (
              <div key={day.id} className={`day-row ${!dayConfig.isOpen ? 'closed' : ''}`}>
                <div className="day-name">
                  <button className="toggle-btn" onClick={() => handleToggleOpen(day.id)}>
                    {dayConfig.isOpen ? <CheckSquare size={20} color="#4bce97" /> : <Square size={20} color="#ccc" />}
                    {day.label}
                  </button>
                </div>
                <div className="time-inputs" style={{ flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#666' }}>Manhã:</span>
                    <input
                      type="time"
                      value={dayConfig.startTime}
                      disabled={!dayConfig.isOpen}
                      onChange={(e) => handleHourChange(day.id, 'startTime', e.target.value)}
                    />
                    <span>até</span>
                    <input
                      type="time"
                      value={dayConfig.endTime}
                      disabled={!dayConfig.isOpen}
                      onChange={(e) => handleHourChange(day.id, 'endTime', e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '10px' }}>
                    <span style={{ fontSize: '12px', color: '#666' }}>Tarde:</span>
                    <input
                      type="time"
                      value={dayConfig.startTime2 || ''}
                      disabled={!dayConfig.isOpen}
                      onChange={(e) => handleHourChange(day.id, 'startTime2', e.target.value)}
                    />
                    <span>até</span>
                    <input
                      type="time"
                      value={dayConfig.endTime2 || ''}
                      disabled={!dayConfig.isOpen}
                      onChange={(e) => handleHourChange(day.id, 'endTime2', e.target.value)}
                    />
                  </div>
                </div>
                <div className="status-label">
                  {dayConfig.isOpen ? 'Aberto' : 'Fechado'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="footer-actions">
        <Button onClick={handleSave} loading={saving}>
          <Save size={18} /> Salvar Alterações
        </Button>
      </div>
    </div>
  );
};

export default ConfiguracaoHorarios;