import React from 'react'
import Button from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import logoSendd from '../../src/assets/img/sendd2.png';



const Home = () => {
  const navigate = useNavigate();

  return (
    <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh'
        }} >
    <div>
        {/* Div que centraliza tudo */}

        {/* logo centralizada */}
        <img src={logoSendd} alt="Logo Sendd" style={{ width: '200px', marginBottom: '2rem' }} />
        <br />

        {/* Botão para ir para o dashboard */}
        <Button variant="primary" size="lg" style={{ margin: '2rem 0' }} onClick={() => navigate('/login')}>
         Acessar sistema
        </Button>
        
        </div>
        </div>
  )
}

export default Home