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
  ClipboardList
} from 'lucide-react';

const Layout = ({ children }) => {
  const { currentTheme, toggleTheme, isDark } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
          padding: '1rem 2rem',
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
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '0.5rem',
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
                      // Chamar função de alerta
                      
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
                  border: `2px solid ${currentTheme.cardBackground}` // Optional: Add border to blend with bg
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

              {/* Logout Button */}
              <button className="btn-base btn-new-red"
                onClick={handleLogoutClick}
                title="Sair"
                style={{
                  width: '40px',
                  height: '40px',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <LogOut size={20} />
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