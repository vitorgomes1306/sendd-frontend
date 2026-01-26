import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { apiService, getApiBaseUrl } from '../services/api';
import {
  Share2, Users, Monitor, MessageSquare,
  Megaphone, Image, User, Layers,
  TrendingUp, Filter, BarChart, Activity, Bell, BotMessageSquare
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

const Dash = () => {
  const { user } = useAuth();
  // nome da organização
  const { isDark } = useTheme();
  // nome da organização - fetched from API now
  const [orgData, setOrgData] = useState(null);
  const orgName = orgData?.nomeFantasia || orgData?.name || orgData?.razaoSocial || user?.organization?.name || 'Organização';
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    counts: {
      instances: 0,
      departments: 0,
      collaborators: 0
    },
    chats: {
      bot: 0,
      attendant: 0,
      finished: 0,
      queue: 0
    },
    marketing: {
      campaigns: 0,
      media: 0,
      clients: 0,
      leads: 0,
      disparos: 0
    },
    funnel: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const orgId = user.organizationId;
      const params = orgId ? { organizationId: orgId } : {};

      // Parallel fetch for all stats
      const [
        instancesRes,
        departmentsRes,
        usersRes,
        chatStatsRes,
        campaignsRes,
        mediaRes,
        clientsRes,
        leadsRes,
        funnelRes,
        notificationsRes,
        orgRes
      ] = await Promise.allSettled([
        apiService.getInstances(params),
        apiService.get('/private/departments', { params }), // Assuming list endpoint
        apiService.getUsers(params),
        apiService.getChatStats(params),
        apiService.getCampaigns(params),
        apiService.getMedias(params),
        apiService.getClients(params),
        apiService.getLeads(params),
        apiService.get('/private/funnel', { params }),
        apiService.getNotifications({ ...params, limit: 1 }),
        apiService.get('/private/organizations')
      ]);

      const newStats = { ...stats };

      // 0. Organization Data
      if (orgRes.status === 'fulfilled') {
        const orgs = Array.isArray(orgRes.value.data) ? orgRes.value.data : [];
        if (orgs.length > 0) {
          const found = orgId ? orgs.find(o => o.id === Number(orgId)) : null;
          setOrgData(found || orgs[0]);
        }
      }

      // 1. Counts
      // Instances
      if (instancesRes.status === 'fulfilled') {
        const data = instancesRes.value.data;
        const list = Array.isArray(data.instances) ? data.instances : (Array.isArray(data) ? data : []);
        newStats.counts.instances = list.length;
      }

      // Departments
      if (departmentsRes.status === 'fulfilled') {
        const data = departmentsRes.value.data;
        newStats.counts.departments = Array.isArray(data) ? data.length : 0;
      }

      // Collaborators (Users)
      if (usersRes.status === 'fulfilled') {
        const data = usersRes.value.data;
        // getUsers often returns array directly
        newStats.counts.collaborators = Array.isArray(data) ? data.length : 0;
      }

      // 2. Chat Stats
      if (chatStatsRes.status === 'fulfilled') {
        // Backend usually returns { bot: N, open: N, finished: N, queue: N }
        // 'open' usually maps to 'attendant' (Em atendimento)
        const data = chatStatsRes.value.data || {};
        newStats.chats = {
          bot: data.bot || 0,
          attendant: data.open || 0,
          finished: data.finished || 0,
          queue: data.queue || 0
        };
      }

      // 3. Marketing & Sales
      // Campaigns
      if (campaignsRes.status === 'fulfilled') {
        const data = campaignsRes.value.data;
        const list = data.data && Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
        newStats.marketing.campaigns = list.length; // Or use pagination total
      }

      // Medias
      if (mediaRes.status === 'fulfilled') {
        const data = mediaRes.value.data;
        const list = data.data && Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
        newStats.marketing.media = list.length;
      }

      // Clients
      if (clientsRes.status === 'fulfilled') {
        const data = clientsRes.value.data;
        const list = data.data && Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
        newStats.marketing.clients = data.pagination?.total || list.length;
      }

      // Leads
      if (leadsRes.status === 'fulfilled') {
        const data = leadsRes.value.data;
        newStats.marketing.leads = data.pagination?.total || (Array.isArray(data.data) ? data.data.length : 0);
      }

      // Notifications (Disparos)
      if (notificationsRes.status === 'fulfilled') {
        const data = notificationsRes.value.data;
        // Check if data is array or has pagination
        newStats.marketing.disparos = data.pagination?.total || (Array.isArray(data.data) ? data.data.length : (Array.isArray(data) ? data.length : 0));
      }


      // 4. Sales Funnel
      if (funnelRes.status === 'fulfilled') {
        const data = funnelRes.value.data; // Array of funnel items
        // Process funnel data to group by stage
        if (Array.isArray(data)) {
          const stageCounts = data.reduce((acc, item) => {
            const stage = item.stage || 'UNKNOWN';
            acc[stage] = (acc[stage] || 0) + 1;
            return acc;
          }, {});

          newStats.funnel = Object.keys(stageCounts).map(stage => ({
            name: stage,
            value: stageCounts[stage]
          }));
        }
      }

      setStats(newStats);

    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const themeColors = {
    bg: isDark ? '#111827' : '#f3f4f6',
    card: isDark ? '#1F2937' : 'white',
    textPrimary: isDark ? '#F9FAFB' : '#111827',
    textSecondary: isDark ? '#9CA3AF' : '#6B7280',
    chartGrid: isDark ? '#374151' : '#e5e7eb',
  };

  const styles = {
    container: {
      padding: '24px',
      backgroundColor: themeColors.bg,
      minHeight: '100vh',
      fontFamily: 'Inter, sans-serif',
      transition: 'background-color 0.2s'
    },
    sectionTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: themeColors.textPrimary,
      marginBottom: '16px',
      marginTop: '24px'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '12px',
      marginBottom: '16px'
    },
    card: {
      backgroundColor: themeColors.card,
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    },
    cardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '12px'
    },
    cardLabel: {
      fontSize: '14px',
      color: themeColors.textSecondary,
      fontWeight: '500'
    },
    cardValue: {
      fontSize: '28px',
      fontWeight: '700',
      color: themeColors.textPrimary,
      lineHeight: '1'
    },
    cardIcon: (color) => ({
      padding: '10px',
      borderRadius: '10px',
      backgroundColor: `${color}20`, // 20% opacity
      color: color
    }),
    chartContainer: {
      backgroundColor: themeColors.card,
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      minHeight: '350px'
    }
  };

  // Helper for Stat Card
  const StatCard = ({ label, value, icon, color }) => (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div>
          <p style={styles.cardLabel}>{label}</p>
          <p style={styles.cardValue}>{value}</p>
        </div>
        <div style={styles.cardIcon(color)}>
          {icon}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f3f4f6' }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: themeColors.textPrimary, marginBottom: '8px' }}>Dashboard</h1>
      <p style={{ color: themeColors.textSecondary, marginBottom: '24px' }}>Visão geral da organização</p>

      {/* Organization Card */}
      <div style={{
        backgroundColor: themeColors.card,
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
        marginBottom: '24px',
        transition: 'background-color 0.2s'
      }}>
        {/* Logo */}
        <div style={{
          width: '100px',
          height: '100px',
          borderRadius: '12px',
          backgroundColor: isDark ? '#374151' : '#f3f4f6',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
          flexShrink: 0
        }}>
          {orgData?.logo ? (
            <img
              src={`${getApiBaseUrl()}/${orgData.logo.replace(/\\/g, '/')}`}
              alt={orgName}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://via.placeholder.com/100?text=Logo';
                e.target.style.display = 'none'; // Hide if fail, show icon instead?
                e.target.parentElement.innerHTML = '<span style="font-size: 24px;">🏢</span>';
              }}
            />
          ) : (
            <Layers size={40} color={themeColors.textSecondary} />
          )}
        </div>

        {/* Details */}
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: themeColors.textPrimary, marginBottom: '8px' }}>
            {orgName}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {orgData?.cnpj && (
              <p style={{ fontSize: '14px', color: themeColors.textSecondary }}>
                <span style={{ fontWeight: '500' }}>CNPJ:</span> {orgData.cnpj}
              </p>
            )}
            {orgData?.email && (
              <p style={{ fontSize: '14px', color: themeColors.textSecondary }}>
                <span style={{ fontWeight: '500' }}>Email:</span> {orgData.email}
              </p>
            )}
          </div>
        </div>
      </div>
      {/* General Stats */}
      <div style={styles.grid}>
        <StatCard
          label="Instâncias Conectadas"
          value={stats.counts.instances}
          icon={<Share2 size={24} />}
          color="#2563eb" // Blue
        />
        <StatCard
          label="Departamentos"
          value={stats.counts.departments}
          icon={<Layers size={24} />}
          color="#8b5cf6" // Purple
        />
        <StatCard
          label="Colaboradores"
          value={stats.counts.collaborators}
          icon={<Users size={24} />}
          color="#10b981" // Emerald
        />
      </div>

      <h2 style={styles.sectionTitle}>Atendimento (Mensagens)</h2>
      <div style={styles.grid}>
        <StatCard
          label="Bot"
          value={stats.chats.bot}
          icon={<BotMessageSquare size={24} />}
          color="#f59e0b" // Amber
        />
        <StatCard
          label="Em Atendimento"
          value={stats.chats.attendant}
          icon={<MessageSquare size={24} />}
          color="#3b82f6" // Blue
        />
        <StatCard
          label="Na Fila"
          value={stats.chats.queue}
          icon={<Activity size={24} />}
          color="#ef4444" // Red
        />
        <StatCard
          label="Encerrados"
          value={stats.chats.finished}
          icon={<CheckCircleIcon size={24} />}
          color="#10b981" // Green
        />
      </div>

      <h2 style={styles.sectionTitle}>Marketing & Vendas</h2>
      <div style={styles.grid}>
        <StatCard
          label="Campanhas"
          value={stats.marketing.campaigns}
          icon={<Megaphone size={24} />}
          color="#ec4899" // Pink
        />
        <StatCard
          label="Mídias"
          value={stats.marketing.media}
          icon={<Image size={24} />}
          color="#8b5cf6" // Violet
        />
        <StatCard
          label="Clientes"
          value={stats.marketing.clients}
          icon={<User size={24} />}
          color="#f97316" // Orange
        />
        <StatCard
          label="Leads"
          value={stats.marketing.leads}
          icon={<TrendingUp size={24} />}
          color="#14b8a6" // Teal
        />
        <StatCard
          label="Disparos Realizados"
          value={stats.marketing.disparos}
          icon={<Bell size={24} />}
          color="#6366f1" // Indigo
        />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginTop: '32px' }}>

        {/* Sales Funnel Chart */}
        <div style={styles.chartContainer}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '20px' }}>Funil de Vendas</h3>
          {stats.funnel.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <RechartsBarChart data={stats.funnel} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip cursor={{ fill: '#f3f4f6' }} />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
              </RechartsBarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', color: '#9ca3af' }}>
              Sem dados no funil
            </div>
          )}
        </div>

        {/* Chat Distribution */}
        <div style={styles.chartContainer}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '20px' }}>Distribuição de Atendimentos</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Bot', value: stats.chats.bot },
                  { name: 'Humano', value: stats.chats.attendant },
                  { name: 'Fila', value: stats.chats.queue },
                  { name: 'Encerrados', value: stats.chats.finished }
                ]}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                <Cell fill="#f59e0b" />
                <Cell fill="#3b82f6" />
                <Cell fill="#ef4444" />
                <Cell fill="#10b981" />
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
};

// Icons needed for internal usage if not imported
const CheckCircleIcon = ({ size, style }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);



export default Dash;