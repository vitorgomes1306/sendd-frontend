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
  const [hours, setHours] = useState({});
  const [organizationId, setOrganizationId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const orgRes = await apiService.get('/private/organizations');
      const orgs = orgRes.data;
      if (orgs.length > 0) {
        const orgId = orgs[0].id;
        setOrganizationId(orgId);

        const res = await apiService.get(`/private/organizations/${orgId}/business-hours`);
        setOutOfHoursMessage(res.data.outOfHoursMessage || '');

        const hoursMap = {};
        DAYS.forEach(d => {
          hoursMap[d.id] = { startTime: '08:00', endTime: '18:00', isOpen: d.id !== 0 && d.id !== 6 };
        });

        if (res.data.hours && Array.isArray(res.data.hours)) {
          res.data.hours.forEach(h => {
            hoursMap[h.dayOfWeek] = {
              startTime: h.startTime,
              endTime: h.endTime,
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
        isOpen: hours[dayId].isOpen
      }));

      await apiService.post(`/private/organizations/${organizationId}/business-hours`, {
        organizationId,
        outOfHoursMessage,
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
                <div className="time-inputs">
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