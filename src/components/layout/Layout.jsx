import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import LogoutModal from '../ui/LogoutModal';
import '../../../src/styles/buttons.css';
import {
  Menu,
  User as UserIcon,
  Bell,
  Sun,
  Moon,
  Settings,
  LogOut,
  ChevronDown,
  UserCircle,
  Building,
  ClipboardList,
  Phone,
  Maximize,
  Minimize
} from 'lucide-react';

import { apiService } from '../../services/api';

const Layout = ({ children }) => {
  const { currentTheme, toggleTheme, isDark } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [orgBlocked, setOrgBlocked] = useState(false);

  // Push Notifications Auto-Subscribe
  useEffect(() => {
    if (user) {
      import('../../services/pushService')
        .then(({ subscribeToPush }) => subscribeToPush())
        .catch(err => console.error('Push load error:', err));
    }
  }, [user]);

  useEffect(() => {
    const checkOrgStatus = async () => {
      try {
        // Fetch organizations to check active status
        const response = await apiService.get('/private/organizations');
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          // Check if specific user org is active, or fallback
          const orgId = user?.organizationId;
          const currentOrg = orgId
            ? response.data.find(o => o.id === Number(orgId))
            : response.data[0];

          if (currentOrg && currentOrg.active === false) {
            setOrgBlocked(true);
          } else {
            setOrgBlocked(false);
          }
        }
      } catch (error) {
        console.error('Failed to check organization status:', error);
      }
    };

    let intervalId;
    if (user) {
      // Initial check
      checkOrgStatus();

      // Schedule check every 5 minutes (300000 ms)
      intervalId = setInterval(checkOrgStatus, 300000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [user]);

  // Sidebar visibility control
  const [showSidebar, setShowSidebar] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setMobileSidebarOpen(false); // Start closed on mobile
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

  // Fullscreen Logic
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch((err) => console.error("Error attempting to enable fullscreen:", err));
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
          .then(() => setIsFullscreen(false))
          .catch((err) => console.error("Error attempting to exit fullscreen:", err));
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
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

  // Determine Sidebar Hidden State
  const isSidebarHidden = isMobile ? !mobileSidebarOpen : !showSidebar;
  const contentMarginLeft = isMobile ? 0 : (showSidebar ? '80px' : '0'); // 80px = Compact Sidebar Width

  const iconButtonStyle = {
    padding: '0.5rem',
    backgroundColor: 'transparent',
    color: currentTheme.textSecondary,
    border: `1px solid ${currentTheme.border}`,
    borderRadius: '0.375rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    position: 'relative' // Ensure relative positioning for badges/dropdowns
  };

  // Helper for hover effects to avoid "e.target" issues
  const handleMouseEnter = (e) => {
    e.currentTarget.style.backgroundColor = currentTheme.borderLight;
    e.currentTarget.style.color = currentTheme.textPrimary;
  };

  const handleMouseLeave = (e) => {
    e.currentTarget.style.backgroundColor = 'transparent';
    e.currentTarget.style.color = currentTheme.textSecondary;
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: currentTheme.background
    }}>
      {/* Sidebar */}
      <Sidebar
        isHidden={isSidebarHidden}
        isMobile={isMobile}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div
        style={{
          marginLeft: contentMarginLeft,
          transition: 'margin-left 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          flex: 1, // Use flex grow instead of fixed width calc
          width: '100%',
          position: 'relative'
        }}
      >
        {/* Top Header */}
        <header style={{
          backgroundColor: currentTheme.cardBackground,
          boxShadow: currentTheme.shadow,
          padding: isMobile ? '1rem' : '1rem 2rem',
          borderBottom: `1px solid ${currentTheme.border}`,
          zIndex: 50 // Ensure header stays on top if needed
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>

              {/* Toggle Sidebar Button */}
              <button
                onClick={isMobile ? toggleMobileSidebar : toggleSidebar}
                style={iconButtonStyle}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                title={isMobile ? "Menu" : (showSidebar ? "Esconder Menu" : "Mostrar Menu")}
              >
                <Menu size={20} />
              </button>
            </div>

            {/* User Info & Actions */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>

              {/* User Menu Trigger */}
              <div style={{ position: 'relative' }} data-user-menu>
                <button
                  style={iconButtonStyle}
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                  title="Menu do usuário"
                >
                  {user?.picture ? (
                    <img
                      src={user.picture}
                      alt="Avatar"
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                  ) : null}

                  <div style={{ display: user?.picture ? 'none' : 'block' }}>
                    <UserCircle size={20} />
                  </div>
                </button>

                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <div style={{
                    position: isMobile ? 'fixed' : 'absolute',
                    top: isMobile ? '75px' : '100%',
                    right: isMobile ? '10px' : 0,
                    marginTop: isMobile ? 0 : '0.5rem',
                    backgroundColor: currentTheme.cardBackground,
                    border: `1px solid ${currentTheme.border}`,
                    borderRadius: '0.5rem',
                    boxShadow: currentTheme.shadow,
                    minWidth: '240px',
                    zIndex: 1000,
                    overflow: 'hidden'
                  }}>
                    {/* User Header */}
                    <div style={{
                      padding: '1rem',
                      borderBottom: `1px solid ${currentTheme.border}`,
                      backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'
                    }}>
                      <p style={{
                        fontWeight: '600',
                        color: currentTheme.textPrimary,
                        margin: 0,
                        fontSize: '0.95rem'
                      }}>
                        {user?.name || 'Usuário'}
                      </p>
                      <p style={{
                        margin: '4px 0 0 0',
                        fontSize: '0.8rem',
                        color: currentTheme.textSecondary,
                        wordBreak: 'break-all'
                      }}>
                        {user?.email || ''}
                      </p>
                    </div>

                    {/* Menu Items */}
                    <div
                      style={{
                        padding: '0.75rem 1rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        fontSize: '0.9rem',
                        color: currentTheme.textPrimary,
                      }}
                      onClick={() => {
                        alert('Função não disponivel');
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = currentTheme.borderLight}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <UserIcon size={18} />
                      Perfil
                    </div>

                    <div
                      style={{
                        padding: '0.75rem 1rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        fontSize: '0.9rem',
                        color: currentTheme.textPrimary,
                      }}
                      onClick={() => {
                        navigate('/organizations');
                        setShowUserMenu(false);
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = currentTheme.borderLight}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <Building size={18} />
                      Empresas
                    </div>

                    <div
                      style={{
                        padding: '0.75rem 1rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        fontSize: '0.9rem',
                        color: currentTheme.textPrimary,
                      }}
                      onClick={() => {
                        alert('Função não disponivel');
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = currentTheme.borderLight}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <ClipboardList size={18} />
                      Auditoria
                    </div>
                    <div
                      style={{
                        padding: '0.75rem 1rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        fontSize: '0.9rem',
                        color: currentTheme.textPrimary,
                      }}
                      onClick={async () => {
                        try {
                          await apiService.post('/private/notifications/test-push');
                          alert('Push enviado! Verifique seu celular/desktop');
                        } catch (e) {
                          alert('Erro ao enviar push: ' + e.message);
                          console.error(e);
                        }
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = currentTheme.borderLight}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <Bell size={18} />
                      Testar Push
                    </div>

                    <div
                      style={{
                        padding: '0.75rem 1rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        fontSize: '0.9rem',
                        color: '#ef4444',
                        borderTop: `1px solid ${currentTheme.border}`,
                        marginTop: '0.5rem'
                      }}
                      onClick={handleLogoutClick}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = currentTheme.borderLight}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <LogOut size={18} />
                      Sair
                    </div>
                  </div>
                )}
              </div>

              {/* Notifications */}
              <button
                style={iconButtonStyle}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onClick={() => navigate('/profile?tab=notificacoes')}
                title="Notificações"
              >
                <Bell size={20} />
                <span style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  backgroundColor: '#ef4444',
                  borderRadius: '50%',
                  width: '8px',
                  height: '8px',
                  border: `2px solid ${currentTheme.cardBackground}`
                }}></span>
              </button>

              {/* Admin Button */}
              {(user?.isAdmin) && (
                <button
                  style={iconButtonStyle}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => navigate('/admin/gestao')}
                  title="Administração"
                >
                  <Settings size={20} />
                </button>
              )}

              {/* Fullscreen Toggle */}
              <button
                style={iconButtonStyle}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onClick={toggleFullscreen}
                title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
              >
                {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
              </button>

              {/* Theme Toggle */}
              <button
                style={iconButtonStyle}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onClick={toggleTheme}
                title={isDark ? "Alternar para tema claro" : "Alternar para tema escuro"}
              >
                {isDark ? <Moon size={20} /> : <Sun size={20} />}
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
              href="https://sendd.altersoft.dev.br"
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
              © 2025 Sendd - Sistema de Gerenciamento multiplataforma WhatsApp
            </a>
          </footer>
        )}
      </div>

      {/* Modal de Bloqueio do Sistema */}
      {orgBlocked && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          zIndex: 9999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backdropFilter: 'blur(5px)'
        }}>
          <div style={{
            backgroundColor: currentTheme.cardBackground,
            padding: '40px',
            borderRadius: '16px',
            textAlign: 'center',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: `1px solid ${currentTheme.border}`
          }}>
            <div style={{ marginBottom: '20px', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: currentTheme.textPrimary,
              marginBottom: '10px'
            }}>
              Acesso Suspenso
            </h2>
            <p style={{
              fontSize: '18px',
              color: currentTheme.textSecondary,
              marginBottom: '30px'
            }}>
              Consulte atendimento <a href="https://wa.me/5585984454472"
                className='btn-base btn-new-orange'
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '16px',
                  textDecoration: 'none',
                  color: 'white'
                }}
              ><br /><Phone size={20} />(85) 98445-4472</a>
            </p>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              style={{
                backgroundColor: '#ef4444',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                margin: '0 auto'
              }}
            >
              <LogOut size={20} /> Sair
            </button>
          </div>
        </div>
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