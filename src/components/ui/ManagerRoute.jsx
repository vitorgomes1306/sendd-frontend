import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';

const ManagerRoute = ({ children }) => {
    const { user, isLoading } = useContext(AuthContext);

    // Mostrar loading enquanto verifica autenticação
    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                fontSize: '1.2rem',
                color: '#6b7280'
            }}>
                Carregando...
            </div>
        );
    }

    // Se não está logado, redireciona para login
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Permitir MASTER, ADMIN e MANAGER
    const hasAccess = ['MASTER', 'ADMIN', 'MANAGER'].includes(user.role);

    if (!hasAccess) {
        console.log('ManagerRoute - Acesso negado para role:', user.role);
        return <Navigate to="/dash" replace />;
    }

    return children;
};

export default ManagerRoute;
