import { useTheme } from '../contexts/ThemeContext';

const NotificacoesAgendadas = () => {
  const { currentTheme } = useTheme();

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
          Notificações - Agendadas
        </h1>
        <p style={{
          color: currentTheme.textSecondary,
          fontSize: '1.1rem',
          lineHeight: '1.6'
        }}>
          Gerencie notificações agendadas do sistema.
        </p>
      </div>
    </div>
  );
};

export default NotificacoesAgendadas;