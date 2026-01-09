import {
  Menu,
  X,
  MessageCircle,
  Zap,
  Shield,
  Users,
  CheckCircle,
  ArrowRight,
  MessageSquare,
  Send,
  Sun,
  Moon
} from 'lucide-react';

import { useEffect, useState } from 'react';

function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getInitialTheme = () => {
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') return stored;
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  };

  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    source: '',
    message: ''
  });

  const [formStatus, setFormStatus] = useState('idle');
  const [formMessage, setFormMessage] = useState('');

  const handleFormChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async e => {
    e.preventDefault();
    setFormStatus('loading');

    try {
      const response = await fetch('https://api.sendd.altersoft.dev.br/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setFormStatus('success');
        setFormMessage('Mensagem enviada com sucesso! Entraremos em contato em breve.');
        setFormData({ name: '', email: '', phone: '', source: '', message: '' });
      } else {
        throw new Error();
      }
    } catch {
      setFormStatus('error');
      setFormMessage('Erro ao enviar a mensagem. Tente novamente.');
    } finally {
      setTimeout(() => setFormStatus('idle'), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* WhatsApp Floating Button */}
      <a
        href="https://wa.me/5585994454472"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 bg-[#25D366] hover:bg-[#20BA5F] text-white p-4 rounded-full shadow-2xl z-40"
      >
        <MessageSquare size={32} />
      </a>

      {/* HEADER */}
      <header className="fixed w-full bg-white/95 dark:bg-gray-900/95 backdrop-blur shadow z-50">
        <nav className="max-w-7xl mx-auto px-4 h-20 flex justify-between items-center">
          <img src="/sendd2.png" alt="Sendd" className="h-16" />

          <div className="hidden md:flex items-center gap-6">
            {['features', 'integrations', 'benefits', 'contact'].map(item => (
              <a
                key={item}
                href={`#${item}`}
                className="text-gray-700 dark:text-gray-200 hover:text-[#1DB990] font-medium"
              >
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </a>
            ))}

            <a
              href="/login"
              className="bg-black text-white px-6 py-2.5 rounded-lg hover:bg-gray-800"
            >
              Acessar sistema
            </a>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border dark:border-gray-700"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>

          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </nav>
      </header>

      {/* MAIN */}
      <main className="pt-20">
        {/* HERO */}
        <section className="py-24 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
          <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
                Conecte seu negócio ao
                <span className="text-[#1DB990]"> WhatsApp</span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                Plataforma profissional de disparos e automações via WhatsApp.
              </p>
              <a
                href="#contact"
                className="inline-flex items-center bg-[#1DB990] text-white px-8 py-4 rounded-lg hover:bg-[#17a078]"
              >
                Solicitar Demonstração
                <ArrowRight className="ml-2" />
              </a>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl">
              <MessageCircle size={48} className="text-[#1DB990] mb-4" />
              <h3 className="text-2xl font-bold mb-4">Comunicação Eficiente</h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                <li className="flex items-center">
                  <CheckCircle className="text-[#1DB990] mr-2" /> API REST
                </li>
                <li className="flex items-center">
                  <CheckCircle className="text-[#1DB990] mr-2" /> Disparos ilimitados
                </li>
                <li className="flex items-center">
                  <CheckCircle className="text-[#1DB990] mr-2" /> Suporte dedicado
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* CONTACT */}
        <section id="contact" className="py-24 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-4xl mx-auto px-4">
            <div className="bg-white dark:bg-gray-800 p-10 rounded-2xl shadow-xl">
              <form onSubmit={handleFormSubmit} className="space-y-6">
                {['name', 'email', 'phone'].map(field => (
                  <input
                    key={field}
                    name={field}
                    value={formData[field]}
                    onChange={handleFormChange}
                    placeholder={field}
                    required
                    className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-[#1DB990]"
                  />
                ))}

                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleFormChange}
                  required
                  rows={4}
                  placeholder="Mensagem"
                  className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-[#1DB990]"
                />

                {formStatus !== 'idle' && (
                  <div
                    className={`p-4 rounded text-center ${
                      formStatus === 'success'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {formMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={formStatus === 'loading'}
                  className="w-full bg-[#1DB990] text-white py-4 rounded-lg hover:bg-[#17a078]"
                >
                  {formStatus === 'loading' ? 'Enviando...' : 'Enviar Mensagem'}
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-400 py-10 text-center">
        © 2024 Sendd — Desenvolvido por Altersoft
      </footer>
    </div>
  );
}

export default LandingPage;
