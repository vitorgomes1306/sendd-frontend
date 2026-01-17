import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from './components/layout/Layout';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ui/ProtectedRoute';
import AdminRoute from './components/ui/AdminRoute';
import Dash from './pages/Dash';
import Login from './pages/Login';
import Register from './pages/Register';
import PublicInvoice from './pages/PublicInvoice';
import Home from './pages/Home';
import Canais from './pages/Canais';
import InstanceDetails from './pages/InstanceDetails';

import Clients from './pages/Clients';
import ClientDetails from './pages/ClientDetails';
import Midias from './pages/Midias';
import Campanhas from './pages/Campanhas';
import Relatorios from './pages/Relatorios';
import Utilidades from './pages/Utilidades';

import ConfiguracaoHorarios from './pages/ConfiguracaoHorarios';
import ConfiguracaoAtendimento from './pages/ConfiguracaoAtendimento';
import Tokens from './pages/Tokens';
import NotificacoesManual from './pages/NotificacoesManual';
import ChecarNumeros from './pages/ChecarNumeros';
import NotificacoesAgendadas from './pages/NotificacoesAgendadas';
import NotificacoesHistorico from './pages/NotificacoesHistorico';
import Chat from './pages/Chat';
import Organizations from './pages/Organizations';
import Teams from './pages/Teams';
import AuditLogs from './pages/AuditLogs';
import Flows from './pages/Flows';
import Integracoes from './pages/Integracoes';
import Departments from './pages/config/Departments';
import Attendants from './pages/config/Attendants';

import Admin from './pages/Admin'; // Página de administração

import LytexPayment from './pages/LytexPayment'; // Página de pagamento Lytex
import LandingPage from './pages/LandingPage';
import Erro404 from '../src/assets/img/404.png'; // Imagem de erro 404

const ExternalRedirect = ({ url }) => {
  useEffect(() => {
    window.location.href = url; // Redireciona para fora do app
  }, [url]);

  return null; // Não renderiza nada
};


function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="app">
            <Routes>
              {/* Rota principal agora é a Landing Page */}
              {/* <Route path="/" element={<ExternalRedirect url="https://sendd-landing-page.vercel.app/" />} /> */}

              <Route path="/" element={<Home />} />

              {/* Rotas públicas (sem sidebar) */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/fatura/:token" element={<PublicInvoice />} />

              {/* Rotas internas (com sidebar) - Protegidas */}
              <Route path="/dash" element={
                <ProtectedRoute>
                  <Layout><Dash /></Layout>
                </ProtectedRoute>
              } />

              <Route path="/canais" element={
                <ProtectedRoute>
                  <Layout><Canais /></Layout>
                </ProtectedRoute>
              } />

              <Route path="/canais/:id" element={
                <ProtectedRoute>
                  <Layout><InstanceDetails /></Layout>
                </ProtectedRoute>
              } />

              <Route path="/clientes" element={
                <ProtectedRoute>
                  <Layout><Clients /></Layout>
                </ProtectedRoute>
              } />

              <Route path="/clientes/:id" element={
                <ProtectedRoute>
                  <Layout><ClientDetails /></Layout>
                </ProtectedRoute>
              } />

              <Route path="/campanhas" element={
                <ProtectedRoute>
                  <Layout><Campanhas /></Layout>
                </ProtectedRoute>
              } />

              <Route path="/midias" element={
                <ProtectedRoute>
                  <Layout><Midias /></Layout>
                </ProtectedRoute>
              } />

              <Route path="/configuracao/horarios" element={
                <ProtectedRoute>
                  <Layout><ConfiguracaoHorarios /></Layout>
                </ProtectedRoute>
              } />

              <Route path="/configuracao/tokens" element={
                <ProtectedRoute>
                  <Layout><Tokens /></Layout>
                </ProtectedRoute>
              } />

              <Route path="/configuracao/atendimento" element={
                <ProtectedRoute>
                  <Layout><ConfiguracaoAtendimento /></Layout>
                </ProtectedRoute>
              } />

              <Route path="/configuracao/fluxos" element={
                <ProtectedRoute>
                  <Layout><Flows /></Layout>
                </ProtectedRoute>
              } />

              <Route path="/configuracao/integracoes" element={
                <ProtectedRoute>
                  <Layout><Integracoes /></Layout>
                </ProtectedRoute>
              } />

              <Route path="/configuracao/departamentos" element={
                <ProtectedRoute>
                  <Layout><Departments /></Layout>
                </ProtectedRoute>
              } />

              <Route path="/configuracao/colaboradores" element={
                <ProtectedRoute>
                  <Layout><Attendants /></Layout>
                </ProtectedRoute>
              } />

              <Route path="/notificacoes/manual" element={
                <ProtectedRoute>
                  <Layout><NotificacoesManual /></Layout>
                </ProtectedRoute>
              } />

              <Route path="/checar-numeros" element={
                <ProtectedRoute>
                  <Layout><ChecarNumeros /></Layout>
                </ProtectedRoute>
              } />

              <Route path="/notificacoes/agendadas" element={
                <ProtectedRoute>
                  <Layout><NotificacoesAgendadas /></Layout>
                </ProtectedRoute>
              } />

              <Route path="/notificacoes/historico" element={
                <ProtectedRoute>
                  <Layout><NotificacoesHistorico /></Layout>
                </ProtectedRoute>
              } />

              <Route path="/chat" element={
                <ProtectedRoute>
                  <Layout><Chat /></Layout>
                </ProtectedRoute>
              } />

              <Route path="/relatorios" element={
                <ProtectedRoute>
                  <Layout><Relatorios /></Layout>
                </ProtectedRoute>
              } />

              <Route path="/utilidades" element={
                <ProtectedRoute>
                  <Layout><Utilidades /></Layout>
                </ProtectedRoute>
              } />

              <Route path="/organizations" element={
                <ProtectedRoute>
                  <Layout><Organizations /></Layout>
                </ProtectedRoute>
              } />

              <Route path="/teams" element={
                <ProtectedRoute>
                  <Layout><Teams /></Layout>
                </ProtectedRoute>
              } />

              <Route path="/auditoria" element={
                <ProtectedRoute>
                  <Layout><AuditLogs /></Layout>
                </ProtectedRoute>
              } />

              <Route path="/admin" element={
                <ProtectedRoute>
                  <AdminRoute>
                    <Layout><Admin /></Layout>
                  </AdminRoute>
                </ProtectedRoute>
              } />
              <Route path="/formas" element={
                <ProtectedRoute>
                  <AdminRoute>
                    <Layout><Admin /></Layout>
                  </AdminRoute>
                </ProtectedRoute>
              } />

              {/* Rota 404 */}
              <Route path="*" element={

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',     // centraliza horizontalmente
                    justifyContent: 'center', // centraliza verticalmente
                    minHeight: '100vh',       // ocupa toda a altura da tela
                    textAlign: 'center',
                    padding: '20px',          // espaço interno para mobile
                  }}
                >
                  <img
                    src={Erro404}
                    alt="Erro 404"
                    style={{
                      maxWidth: '80%',  // impede que a imagem ultrapasse a tela no mobile
                      height: 'auto',
                      marginBottom: '20px',
                    }}
                  />

                  <p
                    style={{
                      fontSize: 'clamp(24px, 6vw, 50px)', // tamanho responsivo da fonte
                      fontWeight: 'bold',
                      margin: 0,
                    }}
                  >
                    Ei, tem essa página aqui não, óh!
                  </p>

                  <a
                    href="/dash"
                    style={{
                      color: '#3b82f6',
                      textDecoration: 'none',
                      fontSize: '20px',
                      marginTop: '15px',
                    }}
                  >
                    Voltar ao Dashboard
                  </a>
                </div>
              } />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
