import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LogoSendd from '../../assets/img/logo_sendd.png';
import './Sidebar.css';

const Sidebar = ({ isHidden, isMobile, onMobileClose }) => {
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path) => {
    if (location.pathname === path) return true;
    const menuItem = menuItems.find(item => item.path === path);
    if (menuItem && menuItem.submenu) {
      return menuItem.submenu.some(subItem => location.pathname === subItem.path);
    }
    return false;
  };

  const menuItems = [
    { path: '/chat', name: 'Atendimento', icon: 'bi-chat-dots' },
    { path: '/canais', name: 'Canais', icon: 'bi-broadcast' },
    { path: '/clientes', name: 'Clientes', icon: 'bi-people' },
    { path: '/campanhas', name: 'Campanhas', icon: 'bi-megaphone' },
    { path: '/midias', name: 'Mídias', icon: 'bi-play-circle' },
    {
      path: '/configuracao',
      name: 'Configuração',
      icon: 'bi-gear',
      submenu: [
        { path: '/configuracao/atendimento', name: 'Atendente', icon: 'bi-headset' },
        { path: '/configuracao/horarios', name: 'Horários', icon: 'bi-clock' },
        { path: '/configuracao/tokens', name: 'Tokens', icon: 'bi-key' },
        { path: '/configuracao/fluxos', name: 'Bots', icon: 'bi-diagram-3' },
        { path: '/configuracao/integracoes', name: 'Integrações', icon: 'bi-hdd-network' },
        { path: '/configuracao/departamentos', name: 'Departamentos', icon: 'bi-building' },
        { path: '/configuracao/colaboradores', name: 'Colaboradores', icon: 'bi-people-fill' }
      ]
    },
    {
      path: '/notificacoes',
      name: 'Notificações',
      icon: 'bi-bell',
      submenu: [
        { path: '/notificacoes/manual', name: 'Manual', icon: 'bi-hand-index' },
        { path: '/checar-numeros', name: 'Checar Números', icon: 'bi-check-circle' },
        { path: '/notificacoes/agendadas', name: 'Agendadas', icon: 'bi-calendar-event' },
        { path: '/notificacoes/historico', name: 'Histórico', icon: 'bi-clock-history' }
      ]
    },
    { path: '/relatorios', name: 'Relatórios', icon: 'bi-graph-up' },
    { path: '/utilidades', name: 'Utilidades', icon: 'bi-wrench-adjustable-circle' },
  ];

  const filteredItems = menuItems.filter(item => {
    const role = user?.role;
    if (role === 'MASTER' || role === 'ADMIN') return true;
    if (role === 'ATTENDANT') return item.path === '/chat';
    if (role === 'MEMBER') return ['/chat', '/configuracao', '/dash'].includes(item.path);
    if (role === 'MANAGER') return item.path !== '/relatorios';
    return false;
  });

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && !isHidden && (
        <div
          onClick={onMobileClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999 }}
        />
      )}

      <div className="sidebar" style={{
        transform: isHidden ? 'translateX(-100%)' : 'translateX(0)'
      }}>

        {/* Logo */}
        <div className="sidebar-logo">
          <img src={LogoSendd} alt="Sendd" />
        </div>

        {/* Menu */}
        <nav style={{ flex: 1, padding: '1rem 0' }}>
          {filteredItems.map((item) => (
            <div key={item.path} className="sidebar-item-group" style={{ position: 'relative' }}>

              {item.submenu ? (
                // Item with Submenu (Flyout)
                <>
                  <div
                    className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}
                  >
                    <i className={`bi ${item.icon}`}></i>
                    {/* Tooltip for main item name */}
                    <span className="sidebar-label">{item.name}</span>
                  </div>

                  {/* Flyout Submenu */}
                  <div className="sidebar-flyout">
                    {item.submenu.map(subItem => (
                      <Link
                        key={subItem.path}
                        to={subItem.path}
                        className={`sidebar-flyout-item ${location.pathname === subItem.path ? 'active' : ''}`}
                        onClick={onMobileClose}
                      >
                        <i className={`bi ${subItem.icon}`}></i>
                        <span>{subItem.name}</span>
                      </Link>
                    ))}
                  </div>
                </>
              ) : (
                // Standard Item
                <Link
                  to={item.path}
                  className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}
                  onClick={onMobileClose}
                >
                  <i className={`bi ${item.icon}`}></i>
                  <span className="sidebar-label">{item.name}</span>
                </Link>
              )}

            </div>
          ))}
        </nav>

        {/* User / Footer (Optional - keeping minimal) */}

      </div>
    </>
  );
};

export default Sidebar;