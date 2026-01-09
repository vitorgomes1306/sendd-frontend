import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { apiService } from '../services/api';
import Logo1 from '../assets/img/sendd1.png';
import Logo2 from '../assets/img/sendd2.png';
import rightImageUrl from '../assets/img/whatsapp-automacao.svg';

function Login() {
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const { currentTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/dash';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await apiService.login({ email, password });
      
      // Debug: verificar estrutura da resposta
      console.log('Login - API response:', response.data);
      
      // Verificar se a resposta contém token (login bem-sucedido)
      if (response.data.token) {
        const { token, name, email: userEmail, isAdmin } = response.data;
        
        console.log('Login - Dados extraídos da API:');
        console.log('Login - token:', token);
        console.log('Login - name:', name);
        console.log('Login - email:', userEmail);
        console.log('Login - isAdmin da API:', isAdmin);
        console.log('Login - Email digitado:', email);
        
        // Verificar se o usuário é admin baseado na API ou email específico
        const isUserAdmin = isAdmin || email === 'admin@test.com' || email === 'vitor@gmail.com';
        
        console.log('Login - isUserAdmin final:', isUserAdmin);
        
        const user = { name, email: userEmail, isAdmin: isUserAdmin };
        
        // Debug: verificar dados do usuário
        console.log('Login - User object final:', user);
        
        login(user, token);
        navigate(from, { replace: true });
      } else {
        setError(response.data.message || 'Erro ao fazer login');
      }
    } catch (err) {
      console.error('Erro no login:', err);
      setError(err.response?.data?.message || 'Erro de conexão. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: currentTheme.background,
      display: 'flex',
      flexWrap: 'wrap',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Painel esquerdo: formulário */}
      <div style={{
        flex: '1 1 500px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '400px',
          backgroundColor: currentTheme.cardBackground,
          borderRadius: '0.75rem',
          padding: '2rem',
          boxShadow: isDark 
            ? '0 10px 25px rgba(0, 0, 0, 0.3)' 
            : '0 10px 25px rgba(0, 0, 0, 0.1)',
          border: `1px solid ${currentTheme.border}`
        }}>
        {/* Logo */}
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          <img 
            src={isDark ? Logo1 : Logo2} 
            alt="Vix Play" 
            style={{ 
              width: '200px', 
              height: 'auto',
              marginBottom: '1rem'
            }} 
          />
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: currentTheme.textPrimary,
            margin: '0 0 0.5rem 0'
          }}>
            Bem vindo de volta!
          </h1>
          <p style={{
            color: currentTheme.textSecondary,
            fontSize: '0.9rem',
            margin: 0
          }}>
            Faça login para acessar sua conta
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              marginBottom: '1rem',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: currentTheme.textPrimary,
              marginBottom: '0.5rem'
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${currentTheme.border}`,
                borderRadius: '0.5rem',
                fontSize: '1rem',
                backgroundColor: currentTheme.background,
                color: currentTheme.textPrimary,
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = currentTheme.primary}
              onBlur={(e) => e.target.style.borderColor = currentTheme.border}
              placeholder="seu@email.com"
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: currentTheme.textPrimary,
              marginBottom: '0.5rem'
            }}>
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${currentTheme.border}`,
                borderRadius: '0.5rem',
                fontSize: '1rem',
                backgroundColor: currentTheme.background,
                color: currentTheme.textPrimary,
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = currentTheme.primary}
              onBlur={(e) => e.target.style.borderColor = currentTheme.border}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: isLoading ? currentTheme.textSecondary : currentTheme.primary,
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
              marginBottom: '1rem'
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.target.style.backgroundColor = isDark ? '#60a5fa' : '#2563eb';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.target.style.backgroundColor = currentTheme.primary;
              }
            }}
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>

          <div style={{
            textAlign: 'center',
            fontSize: '0.875rem',
            color: currentTheme.textSecondary
          }}>
            Não tem uma conta?{' '}
            <a 
              href="/register" 
              style={{
                color: currentTheme.primary,
                textDecoration: 'none',
                fontWeight: '500'
              }}
              onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
              onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
            >
              Cadastre-se
            </a>
          </div>
        </form>
        </div>
      </div>

      {/* Painel direito: imagem estática */}
      <div style={{
        flex: '1 1 500px',
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <img
          src={rightImageUrl}
          alt="Imagem inspiradora"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block'
          }}
        />
      </div>
    </div>
  );
}

export default Login;
