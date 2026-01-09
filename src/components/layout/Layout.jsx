import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import LogoutModal from '../ui/LogoutModal';

const Layout = ({ children }) => {
  const { currentTheme, toggleTheme, isDark } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarHidden(true);
        setSidebarCollapsed(false);
      } else {
        setSidebarHidden(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Fechar menu do usuário quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest('[data-user-menu]')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  const handleSidebarToggle = (collapsed) => {
    setSidebarCollapsed(collapsed);
  };

  const toggleMobileSidebar = () => {
    setSidebarHidden(!sidebarHidden);
  };

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = () => {
    logout();
    navigate('/login');
    setShowLogoutModal(false);
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  const isChatPage = location.pathname === '/chat';

  return (
    <div style={{ 
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: currentTheme.background
    }}>
      {/* Sidebar */}
      <Sidebar 
        onToggle={handleSidebarToggle} 
        isHidden={isMobile && sidebarHidden}
        isMobile={isMobile}
        onMobileClose={toggleMobileSidebar}
      />
      
      {/* Main Content Area */}
      <div 
        style={{
          marginLeft: isMobile ? 0 : (sidebarCollapsed ? '70px' : '250px'),
          transition: 'margin-left 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          width: isMobile ? '100%' : `calc(100vw - ${sidebarCollapsed ? '70px' : '250px'})`,
          position: 'relative'
        }}
      >
        {/* Top Header */}
        <header style={{
          backgroundColor: currentTheme.cardBackground,
          boxShadow: currentTheme.shadow,
          padding: '1rem 2rem',
          borderBottom: `1px solid ${currentTheme.border}`
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {/* Mobile Menu Button */}
              {isMobile && (
                <button
                  onClick={toggleMobileSidebar}
                  style={{
                    padding: '0.5rem',
                    backgroundColor: 'transparent',
                    color: currentTheme.textPrimary,
                    border: `1px solid ${currentTheme.border}`,
                    borderRadius: '0.375rem',
                    fontSize: '1.2rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '40px',
                    height: '40px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = currentTheme.borderLight;
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                  }}
                  title="Menu"
                >
                  <i className="bi bi-list"></i>
                </button>
              )}
              
              
            </div>
            
            {/* User Info */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <div style={{ position: 'relative' }} data-user-menu>
                 <div style={{
                   display: 'flex',
                   alignItems: 'center',
                   gap: '0.5rem',
                   padding: '0.5rem 1rem',
                   backgroundColor: currentTheme.borderLight,
                   borderRadius: '0.5rem',
                   cursor: 'pointer',
                   transition: 'all 0.2s'
                 }}
                 onClick={() => setShowUserMenu(!showUserMenu)}
                 onMouseEnter={(e) => {
                   e.currentTarget.style.backgroundColor = currentTheme.border;
                 }}
                 onMouseLeave={(e) => {
                   e.currentTarget.style.backgroundColor = currentTheme.borderLight;
                 }}
                 title="Menu do usuário"
                 >
                  {user?.picture ? (
                    <img 
                      src={user.picture} 
                      alt="Avatar do usuário"
                      style={{ 
                        width: '1.2rem', 
                        height: '1.2rem', 
                        borderRadius: '50%',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        // Se a imagem falhar ao carregar, mostra o ícone padrão
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'inline';
                      }}
                    />
                  ) : null}
                  <i 
                    className="bi bi-person-circle" 
                    style={{ 
                      fontSize: '1.2rem', 
                      color: currentTheme.textPrimary,
                      display: user?.picture ? 'none' : 'inline'
                    }}
                  ></i>
                  <span style={{ 
                    fontSize: '0.875rem',
                    color: currentTheme.textPrimary,
                    fontFamily: 'Poppins, sans-serif'
                  }}>
                    {user?.name || 'Usuário'}
                  </span>
                  <i className="bi bi-chevron-down" style={{
                    fontSize: '0.75rem',
                    color: currentTheme.textSecondary,
                    marginLeft: '0.25rem',
                    transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s'
                  }}></i>
                </div>
                
                {/* User Submenu */}
                {showUserMenu && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '0.5rem',
                    backgroundColor: currentTheme.cardBackground,
                    border: `1px solid ${currentTheme.border}`,
                    borderRadius: '0.5rem',
                    boxShadow: currentTheme.shadow,
                    minWidth: '200px',
                    zIndex: 1000,
                    overflow: 'hidden'
                  }}>
                    <div 
                      style={{
                        padding: '0.75rem 1rem',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.875rem',
                        color: currentTheme.textPrimary,
                        fontFamily: 'Poppins, sans-serif'
                      }}
                      onClick={() => {
                        navigate('/profile');
                        setShowUserMenu(false);
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = currentTheme.borderLight;
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                      }}
                    >
                      <i className="bi bi-person"></i>
                      Perfil
                    </div>
                    <div 
                      style={{
                        padding: '0.75rem 1rem',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.875rem',
                        color: currentTheme.textPrimary,
                        fontFamily: 'Poppins, sans-serif'
                      }}
                      onClick={() => {
                        navigate('/organizations');
                        setShowUserMenu(false);
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = currentTheme.borderLight;
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                      }}
                    >
                      <i className="bi bi-building"></i>
                      Organizations
                    </div>
                    <div 
                      style={{
                        padding: '0.75rem 1rem',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.875rem',
                        color: currentTheme.textPrimary,
                        fontFamily: 'Poppins, sans-serif'
                      }}
                      onClick={() => {
                        navigate('/auditoria');
                        setShowUserMenu(false);
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = currentTheme.borderLight;
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                      }}
                    >
                      <i className="bi bi-clipboard-data"></i>
                      Auditoria
                    </div>
                  </div>
                )}
              </div>
              
              {/* Notifications Icon */}
              <button style={{
                padding: '0.5rem',
                backgroundColor: 'transparent',
                color: currentTheme.textSecondary,
                border: `1px solid ${currentTheme.border}`,
                borderRadius: '0.375rem',
                fontSize: '1.1rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = currentTheme.borderLight;
                e.target.style.color = currentTheme.textPrimary;
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = currentTheme.textSecondary;
              }}
              onClick={() => navigate('/profile?tab=notificacoes')}
              title="Notificações"
              >
                <i className="bi bi-bell"></i>
                {/* Badge de notificação */}
                <span style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  borderRadius: '50%',
                  width: '8px',
                  height: '8px',
                  fontSize: '0.6rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}></span>
              </button>
              
              {/* Admin Button - Only visible for admin users */}
              {(console.log('Layout - User data:', user) || console.log('Layout - user.isAdmin:', user?.isAdmin)) || user?.isAdmin && (
                <button style={{
                  padding: '0.5rem',
                  backgroundColor: 'transparent',
                  color: currentTheme.textSecondary,
                  border: `1px solid ${currentTheme.border}`,
                  borderRadius: '0.375rem',
                  fontSize: '1.1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = currentTheme.borderLight;
                  e.target.style.color = currentTheme.primary;
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = currentTheme.textSecondary;
                }}
                onClick={() => navigate('/admin')}
                title="Administração"
                >
                  <i className="bi bi-gear-fill"></i>
                </button>
              )}
              
              {/* Theme Toggle Icon */}
              <button style={{
                padding: '0.5rem',
                backgroundColor: 'transparent',
                color: currentTheme.textSecondary,
                border: `1px solid ${currentTheme.border}`,
                borderRadius: '0.375rem',
                fontSize: '1.1rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = currentTheme.borderLight;
                e.target.style.color = currentTheme.textPrimary;
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = currentTheme.textSecondary;
              }}
              onClick={toggleTheme}
              title={isDark ? "Alternar para tema claro" : "Alternar para tema escuro"}
              >
                <i className={isDark ? "bi bi-sun" : "bi bi-moon"}></i>
              </button>
              
              <button style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: '500'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#ef4444'}
              onClick={handleLogoutClick}
              >
                Sair
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main style={{
          flex: 1,
          padding: isChatPage ? 0 : '2rem',
          overflow: isChatPage ? 'hidden' : 'auto',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          {children}
        </main>

        {/* Footer */}
        {!isChatPage && (
          <footer style={{
            backgroundColor: currentTheme.cardBackground,
            borderTop: `1px solid ${currentTheme.border}`,
            padding: '1rem 2rem',
            textAlign: 'center',
            fontSize: '0.875rem',
            color: currentTheme.textSecondary,
            fontFamily: 'Poppins, sans-serif'
          }}>
            <a 
              href="https://vixplay.altersoft.dev.br" 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ 
                color: 'inherit', 
                textDecoration: 'none',
                fontWeight: 'bold'
              }}
              onMouseEnter={(e) => e.target.style.color = currentTheme.primary || '#3b82f6'}
              onMouseLeave={(e) => e.target.style.color = 'inherit'}
            >
              © 2025 Vix Play - Sistema de Gerenciamento de Mídia indoor e Tv corporativa
            </a>
          </footer>
        )}
      </div>

      {/* Mobile Overlay */}
      {isMobile && !sidebarHidden && (
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
          onClick={() => setSidebarHidden(true)}
        />
      )}

      {/* Logout Modal */}
      <LogoutModal 
        isOpen={showLogoutModal}
        onClose={handleLogoutCancel}
        onConfirm={handleLogoutConfirm}
      />
    </div>
  );
};

export default Layout;