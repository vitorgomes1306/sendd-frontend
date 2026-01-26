import { useState, useEffect } from 'react'; // Added useEffect
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LogoSendd from '../../assets/img/logo_sendd.png';
import api from '../../services/api'; // Import API
import './Sidebar.css';

const Sidebar = ({ isHidden, isMobile, onMobileClose }) => {
  const location = useLocation();
  const { user } = useAuth();
  const [hoveredSubmenu, setHoveredSubmenu] = useState(null);
  const [showExternalReports, setShowExternalReports] = useState(false);

  useEffect(() => {
    const checkExternalReports = async () => {
      try {
        // Fetch user's organizations
        const response = await api.get('/private/organizations');
        const orgs = response.data;
        // Check if ANY of the user's organizations has the flag enabled
        const hasEnabled = orgs.some(org => org.useExternalReports);
        setShowExternalReports(hasEnabled);
      } catch (error) {
        console.error('Error fetching organizations for sidebar:', error);
      }
    };

    if (user) {
      checkExternalReports();
    }
  }, [user]);

  const handleMouseEnter = (e, path) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredSubmenu({ path, top: rect.top });
  };

  const handleMouseLeave = () => {
    setHoveredSubmenu(null);
  };

  const isActive = (path) => {
    if (location.pathname === path) return true;
    const menuItem = menuItems.find(item => item.path === path);
    if (menuItem && menuItem.submenu) {
      return menuItem.submenu.some(subItem => location.pathname === subItem.path);
    }
    return false;
  };

  const reportSubmenu = [
    { path: '/relatorios', name: 'Geral', icon: 'bi-pie-chart' },
    { path: '/admin/chat-reports', name: 'Conversas', icon: 'bi-chat-square-text' }
  ];

  if (showExternalReports) {
    reportSubmenu.push({ path: '/relatorios/clientes-sem-venda', name: 'Clientes sem venda', icon: 'bi-slash-circle' });
  }

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
    { path: '/leads', name: 'Leads', icon: 'bi-people-fill' },
    { path: '/funnel', name: 'Funil de Vendas', icon: 'bi-funnel' },
    {
      path: '/relatorios',
      name: 'Relatórios',
      icon: 'bi-graph-up',
      submenu: reportSubmenu
    },
    { path: '/utilidades', name: 'Utilidades', icon: 'bi-wrench-adjustable-circle' },
  ];

  const filteredItems = menuItems.filter(item => {
    const role = user?.role;
    if (role === 'MASTER' || role === 'ADMIN' || role === 'MANAGER') return true;
    if (role === 'ATTENDANT') return item.path === '/chat';
    if (role === 'MEMBER') return ['/chat', '/configuracao', '/dash', '/leads', '/funnel'].includes(item.path);
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
        transform: isHidden ? 'translateX(-100%)' : 'none',
        overflowY: 'auto' // Enable scrolling
      }}>

        {/* Logo */}
        <div className="sidebar-logo">
          <a href="/dash"><img src={LogoSendd} alt="Sendd" /></a>
        </div>

        {/* Menu */}
        <nav style={{ flex: 1, padding: '1rem 0' }}>
          {filteredItems.map((item) => (
            <div
              key={item.path}
              className="sidebar-item-group"
              style={{ position: 'relative' }}
              onMouseEnter={(e) => handleMouseEnter(e, item.path)}
              onMouseLeave={handleMouseLeave}
            >

              {item.submenu ? (
                // Item with Submenu (Flyout managed by JS)
                <>
                  <div className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}>
                    <i className={`bi ${item.icon}`}></i>
                    {/* CSS Label removed as it's clipped. Relying on JS fixed label below if hovered */}
                  </div>

                  {/* Flyout Submenu */}
                  {hoveredSubmenu?.path === item.path && (
                    <div
                      className="sidebar-flyout fixed-flyout"
                      style={{
                        top: hoveredSubmenu.top,
                        position: 'fixed',
                        left: '80px',
                        transform: 'none',
                        opacity: 1,
                        visibility: 'visible',
                        marginTop: '0'
                      }}
                    >
                      <div className="sidebar-flyout-header">{item.name}</div>
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
                  )}
                </>
              ) : (
                // Standard Item
                <>
                  <Link
                    to={item.path}
                    className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}
                    onClick={onMobileClose}
                  >
                    <i className={`bi ${item.icon}`}></i>
                  </Link>

                  {/* Fixed Label via JS - Rendered outside overflow container effectively due to fixed pos */}
                  {hoveredSubmenu?.path === item.path && (
                    <div
                      style={{
                        position: 'fixed',
                        top: hoveredSubmenu.top + 10, // Slightly centered (50px height -> 10px padding top/bottom roughly)
                        left: '80px',
                        backgroundColor: '#1a1a1a',
                        color: 'white',
                        padding: '0.5rem 1rem',
                        borderRadius: '0 4px 4px 0',
                        whiteSpace: 'nowrap',
                        zIndex: 1002,
                        border: '1px solid #333',
                        borderLeft: 'none',
                        boxShadow: '4px 0 10px rgba(0,0,0,0.5)',
                        fontWeight: '500',
                        fontSize: '0.9rem',
                        pointerEvents: 'none' // Don't block clicking things if overlapping (shouldn't happen here)
                      }}
                    >
                      {item.name}
                    </div>
                  )}
                </>
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