import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import Logo1 from '../../assets/img/sendd1.png';
import Logo2 from '../../assets/img/sendd2.png';
import LogoAltersoft1 from '../../assets/img/altersoft1.png';
import LogoAltersoft2 from '../../assets/img/altersoft2.png';
import './Sidebar.css';

const Sidebar = ({ onToggle, isHidden, isMobile, onMobileClose }) => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState({});
  const { currentTheme, isDark } = useTheme();
  const { user } = useAuth();

  // Função para construir URL completa do avatar
  const getAvatarUrl = (picturePath) => {
    if (!picturePath) return null;
    
    // Se já é uma URL completa, retorna como está
    if (picturePath.startsWith('http')) {
      return picturePath;
    }
    
    // Constrói a URL completa baseada no ambiente
    const apiBaseUrl = window.APP_CONFIG?.API_BASE_URL || 'http://localhost:4000';
    // Adiciona timestamp para evitar cache da imagem
    const timestamp = new Date().getTime();
    return `${apiBaseUrl}${picturePath}?t=${timestamp}`;
  };

  const handleToggle = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    if (onToggle) {
      onToggle(newState);
    }
  };

  const handleMobileClose = () => {
    if (isMobile && onMobileClose) {
      onMobileClose();
    }
  };

  const toggleSubmenu = (path) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  const isActive = (path) => {
    // Verifica se a rota atual é exatamente igual ao path
    if (location.pathname === path) return true;
    
    // Verifica se a rota atual é um submenu do item
    const menuItem = menuItems.find(item => item.path === path);
    if (menuItem && menuItem.submenu) {
      return menuItem.submenu.some(subItem => location.pathname === subItem.path);
    }
    
    return false;
  };

  const menuItems = [
    {
      path: '/dash',
      name: 'Dashboard',
      icon: 'bi-speedometer2'
    },

    {
      path: '/formas',
      name: 'Formas',
      icon: 'bi bi-chat-left-text'
    },
    {
      path: '/canais',
      name: 'Canais',
      icon: 'bi-broadcast'
    },
    {
      path: '/clientes',
      name: 'Clientes',
      icon: 'bi-people'
    },
    {
      path: '/campanhas',
      name: 'Campanhas',
      icon: 'bi-megaphone'
    },
    {
      path: '/midias',
      name: 'Mídias',
      icon: 'bi-play-circle'
    },
    {
      path: '/configuracao',
      name: 'Configuração',
      icon: 'bi-gear',
      submenu: [
        { path: '/configuracao/boot', name: 'Boot', icon: 'bi-power' },
        { path: '/configuracao/horarios', name: 'Horários de Atendimento', icon: 'bi-clock' }
      ]
    },
    {
      path: '/notificacoes',
      name: 'Notificações',
      icon: 'bi-bell',
      submenu: [
        { path: '/notificacoes/manual', name: 'Manual', icon: 'bi-hand-index' },
        { path: '/notificacoes/agendadas', name: 'Agendadas', icon: 'bi-calendar-event' },
        { path: '/notificacoes/historico', name: 'Histórico', icon: 'bi-clock-history' }
      ]
    },
    {
      path: '/relatorios',
      name: 'Relatórios',
      icon: 'bi-graph-up'
    },
    {
      path: '/utilidades',
      name: 'Utilidades',
      icon: 'bi-wrench-adjustable-circle'
    },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && !isHidden && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999
          }}
          onClick={handleMobileClose}
        />
      )}

      <div 
        className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}
        style={{
          width: isCollapsed ? '70px' : '250px',
          height: '100vh',
          backgroundColor: currentTheme.sidebarBackground,
          color: currentTheme.textPrimary,
          position: 'fixed',
          left: isMobile ? (isHidden ? '-250px' : '0') : '0',
          top: 0,
          transition: 'all 0.3s ease',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'Poppins, sans-serif',
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollbarWidth: 'none', // Firefox
          msOverflowStyle: 'none', // IE/Edge
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1rem',
          borderBottom: `1px solid ${currentTheme.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between'
        }}>
          {!isCollapsed && (
            <h2 style={{ 
              margin: 0, 
              fontSize: '1.25rem',
              fontWeight: 'bold'
            }}>
              {user && user.picture && user.picture !== '0' && user.picture !== 'null' ? (
                <img 
                  src={getAvatarUrl(user.picture)} 
                  alt="User Avatar" 
                  style={{ 
                    width: '100%', 
                    height: 'auto',
                    maxHeight: '60px',
                    objectFit: 'contain',
                  }} 
                />
              ) : (
                <img src={isDark ? Logo1 : Logo2} alt="Vix Play" style={{ width: '100%', height: 'auto' }} />
              )}
            </h2>
          )}
          <button
            onClick={handleToggle}
            style={{
              background: 'none',
              border: 'none',
              color: currentTheme.textPrimary,
              fontSize: '1.2rem',
              cursor: 'pointer',
              padding: '0.25rem',
              display: window.innerWidth <= 768 ? 'none' : 'block'
            }}
          >
            <i className={`bi ${isCollapsed ? 'bi-chevron-right' : 'bi-chevron-left'}`}></i>
          </button>
        </div>

        {/* Navigation Menu */}
        <nav style={{ flex: 1, padding: '1rem 0' }}>
          {menuItems.map((item) => (
            <div key={item.path}>
              {item.submenu ? (
                // Item com submenu
                <div>
                  <div
                    onClick={() => !isCollapsed && toggleSubmenu(item.path)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: isCollapsed ? 'center' : 'space-between',
                      padding: isCollapsed ? '0.75rem' : '0.75rem 1rem',
                      color: isActive(item.path) ? currentTheme.primary : currentTheme.textSecondary,
                      backgroundColor: isActive(item.path) ? currentTheme.primaryLight : 'transparent',
                      borderLeft: isActive(item.path) ? `3px solid ${currentTheme.primary}` : '3px solid transparent',
                      transition: 'all 0.2s ease',
                      cursor: isCollapsed ? 'default' : 'pointer',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive(item.path)) {
                        e.target.style.backgroundColor = currentTheme.borderLight;
                        e.target.style.color = currentTheme.textPrimary;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive(item.path)) {
                        e.target.style.backgroundColor = 'transparent';
                        e.target.style.color = currentTheme.textSecondary;
                      }
                    }}
                    title={isCollapsed ? item.name : ''}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <i className={`bi ${item.icon}`} style={{ 
                        fontSize: '1.2rem',
                        marginRight: isCollapsed ? 0 : '0.75rem',
                        minWidth: '20px'
                      }}></i>
                      {!isCollapsed && (
                        <span style={{ 
                          fontSize: '0.9rem',
                          fontFamily: 'Poppins, sans-serif',
                          fontWeight: '500'
                        }}>
                          {item.name}
                        </span>
                      )}
                    </div>
                    {!isCollapsed && (
                      <i className={`bi ${openSubmenus[item.path] ? 'bi-chevron-up' : 'bi-chevron-down'}`} 
                         style={{ fontSize: '0.8rem' }}></i>
                    )}
                  </div>
                  
                  {/* Submenu */}
                  {!isCollapsed && openSubmenus[item.path] && (
                    <div style={{ backgroundColor: currentTheme.backgroundSecondary }}>
                      {item.submenu.map((subItem) => (
                        <Link
                          key={subItem.path}
                          to={subItem.path}
                          onClick={handleMobileClose}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0.5rem 1rem 0.5rem 3rem',
                            color: location.pathname === subItem.path ? currentTheme.primary : currentTheme.textSecondary,
                            backgroundColor: location.pathname === subItem.path ? currentTheme.primaryLight : 'transparent',
                            textDecoration: 'none',
                            borderLeft: location.pathname === subItem.path ? `3px solid ${currentTheme.primary}` : '3px solid transparent',
                            transition: 'all 0.2s ease',
                            fontSize: '0.85rem'
                          }}
                          onMouseEnter={(e) => {
                            if (location.pathname !== subItem.path) {
                              e.target.style.backgroundColor = currentTheme.borderLight;
                              e.target.style.color = currentTheme.textPrimary;
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (location.pathname !== subItem.path) {
                              e.target.style.backgroundColor = 'transparent';
                              e.target.style.color = currentTheme.textSecondary;
                            }
                          }}
                        >
                          <i className={`bi ${subItem.icon}`} style={{ 
                            fontSize: '1rem',
                            marginRight: '0.75rem',
                            minWidth: '16px'
                          }}></i>
                          <span style={{ 
                            fontFamily: 'Poppins, sans-serif',
                            fontWeight: '400'
                          }}>
                            {subItem.name}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                // Item sem submenu
                <Link
                  to={item.path}
                  onClick={handleMobileClose}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    padding: isCollapsed ? '0.75rem' : '0.75rem 1rem',
                    color: isActive(item.path) ? currentTheme.primary : currentTheme.textSecondary,
                    backgroundColor: isActive(item.path) ? currentTheme.primaryLight : 'transparent',
                    textDecoration: 'none',
                    borderLeft: isActive(item.path) ? `3px solid ${currentTheme.primary}` : '3px solid transparent',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive(item.path)) {
                      e.target.style.backgroundColor = currentTheme.borderLight;
                      e.target.style.color = currentTheme.textPrimary;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive(item.path)) {
                      e.target.style.backgroundColor = 'transparent';
                      e.target.style.color = currentTheme.textSecondary;
                    }
                  }}
                  title={isCollapsed ? item.name : ''}
                >
                  <i className={`bi ${item.icon}`} style={{ 
                    fontSize: '1.2rem',
                    marginRight: isCollapsed ? 0 : '0.75rem',
                    minWidth: '20px'
                  }}></i>
                  {!isCollapsed && (
                    <span style={{ 
                      fontSize: '0.9rem',
                      fontFamily: 'Poppins, sans-serif',
                      fontWeight: '500'
                    }}>
                      {item.name}
                    </span>
                  )}
                </Link>
              )}
            </div>
          ))}
          

        </nav>

        {/* Footer */}
        <div style={{
          padding: '1rem',
          borderTop: `1px solid ${currentTheme.border}`,
          fontSize: '0.75rem',
          color: currentTheme.textSecondary,
          textAlign: 'center',
          fontFamily: 'Poppins, sans-serif',
          fontWeight: '400'
        }}>
          <div>
          {window.innerWidth > 768 && !isCollapsed && (
            <a href="https://www.altersot.dev.br" target="_blank" rel="noopener noreferrer">
              <img src={isDark ? LogoAltersoft2 : LogoAltersoft1} alt="Altersoft" style={{ width: '100px', height: 'auto' }} />
            </a>
          )}
          Vix Play v3.0.1
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;