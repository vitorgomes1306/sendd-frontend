import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { apiService, getApiBaseUrl } from '../services/api';
import { Download, Copy, CheckCircle, AlertTriangle, FileText, Barcode, QrCode, AlertCircle } from 'lucide-react';
import logoSendd from '../../src/assets/img/sendd2.png';

import QRCode from 'qrcode';

const PublicInvoice = () => {
    const { token } = useParams();
    const location = useLocation();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [copiedPix, setCopiedPix] = useState(false);
    const [copiedBar, setCopiedBar] = useState(false);
    const [qrCodeUrl, setQrCodeUrl] = useState('');

    useEffect(() => {
        const fetchInvoice = async () => {
            // Check if we have data passed via state (from ISP FLASH integration)
            if (location.state?.invoiceData) {
                const data = location.state.invoiceData;
                setInvoice({
                    value: data.reais,
                    clientName: data.customer?.nome || 'Cliente',
                    clientDoc: data.customer?.cpf_cnpj || '---',
                    pixCode: data.pix?.data?.response?.qrCopyPaste,
                    description: 'Fatura ISP Flash',
                    dueDate: new Date().toISOString(), // Default to now as we don't have due date in this response
                    status: 'PENDING'
                });

                if (data.pix?.data?.response?.qrImageUrl) {
                    setQrCodeUrl(data.pix.data.response.qrImageUrl);
                }

                setLoading(false);
                return;
                setLoading(false);
                return;
            }

            // Check if we have data passed via URL query param (base64 encoded)
            const searchParams = new URLSearchParams(location.search);
            const dataParam = searchParams.get('data');

            if (dataParam) {
                try {
                    const decoded = JSON.parse(atob(dataParam));
                    // Handle both old full structure (fallback) and new minimal structure
                    const pixCode = decoded.p || decoded.pix?.data?.response?.qrCopyPaste;

                    setInvoice({
                        value: decoded.v || decoded.reais,
                        clientName: decoded.n || decoded.customer?.nome || 'Cliente',
                        clientDoc: decoded.d || decoded.customer?.cpf_cnpj || '---',
                        pixCode: pixCode,
                        description: 'Fatura ISP Flash',
                        dueDate: new Date().toISOString(),
                        status: 'PENDING'
                    });

                    // Generate QR Code locally if not provided in URL
                    const remoteQr = decoded.pix?.data?.response?.qrImageUrl;
                    if (remoteQr) {
                        setQrCodeUrl(remoteQr);
                    } else if (pixCode) {
                        try {
                            const url = await QRCode.toDataURL(pixCode);
                            setQrCodeUrl(url);
                        } catch (qrErr) {
                            console.error("Error generating QR:", qrErr);
                        }
                    }

                    setLoading(false);
                    return;
                } catch (e) {
                    console.error('Failed to parse invoice data from URL', e);
                }
            }

            try {
                const response = await apiService.get(`/public/invoice/${token}`);
                setInvoice(response.data);

                // Generate QR Code if PIX exists
                if (response.data.pixCode) {
                    try {
                        const url = await QRCode.toDataURL(response.data.pixCode);
                        setQrCodeUrl(url);
                    } catch (qrErr) {
                        console.error("Error generating QR:", qrErr);
                    }
                }

            } catch (err) {
                console.error(err);
                setError('Fatura não encontrada ou link expirado.');
            } finally {
                setLoading(false);
            }
        };
        fetchInvoice();
    }, [token, location.search]);

    const handleCopyPix = () => {
        if (!invoice?.pixCode) return;
        navigator.clipboard.writeText(invoice.pixCode);
        setCopiedPix(true);
        setTimeout(() => setCopiedPix(false), 2000);
    };

    const handleCopyBar = () => {
        if (!invoice?.digitableLine && !invoice?.barCode) return;
        navigator.clipboard.writeText(invoice.digitableLine || invoice.barCode);
        setCopiedBar(true);
        setTimeout(() => setCopiedBar(false), 2000);
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#666', fontFamily: 'Inter, sans-serif' }}>Carregando fatura...</div>;

    if (error) return (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', padding: '20px', textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
            <AlertTriangle size={48} color="#ef4444" style={{ marginBottom: '16px' }} />
            <h2 style={{ color: '#111' }}>Ops!</h2>
            <p style={{ color: '#666' }}>{error}</p>
        </div>
    );

    const isPaid = invoice.status?.toLowerCase() === 'pago' || invoice.status?.toLowerCase() === 'liquidado';
    const apiBaseUrl = getApiBaseUrl();

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }} className="invoice-container">
            <style>{`
                .invoice-container { padding: 20px; }
                .invoice-card-content { padding: 24px; }
                .invoice-header { padding: 24px; }
                .invoice-value { fontSize: 28px; }
                
                @media (max-width: 768px) {
                    .invoice-wrapper { flexDirection: column !important; alignItems: center !important; }
                    .org-card { width: 100% !important; maxWidth: 420px !important; }
                }

                @media (max-width: 480px) {
                    .invoice-container { padding: 12px; }
                    .invoice-card-content { padding: 16px; }
                    .invoice-header { padding: 20px; }
                    .invoice-value { fontSize: 24px; }
                }
            `}</style>

            <div className="invoice-wrapper" style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-start', width: '100%', maxWidth: '900px' }}>

                {/* INVOICE CARD */}
                <div style={{ width: '100%', maxWidth: '420px', backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>

                    {/* Header */}
                    <div className="invoice-header" style={{ backgroundColor: '#2563eb', color: 'white', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '4px' }}>Pagamento de Fatura</div>
                        <div className="invoice-value" style={{ fontWeight: 'bold' }}>
                            {Number(invoice.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </div>
                        <div style={{ marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '20px', fontSize: '13px' }}>
                            {isPaid ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                            {isPaid ? 'Paga' : `Vence em ${new Date(invoice.dueDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}`}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="invoice-card-content">

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                            {/* Client Info */}
                            <div style={{ fontSize: '14px', color: '#4b5563', borderBottom: '1px solid #eee', paddingBottom: '16px' }}>
                                <div style={{ fontWeight: '600', color: '#111', fontSize: '16px', marginBottom: '2px' }}>{invoice.clientName}</div>
                                <div style={{ fontSize: '13px' }}>Doc: {invoice.clientDoc || '---'}</div>
                                <div style={{ marginTop: '6px', fontSize: '13px', color: '#6b7280' }}>Ref: {invoice.description || 'Fatura mensal'}</div>
                            </div>

                            {/* PIX Option */}
                            {invoice.pixCode && !isPaid && (
                                <div>
                                    <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                        <QrCode size={18} color="#2563eb" /> Pix Copia e Cola
                                    </label>

                                    {/* QR Code Image */}
                                    {qrCodeUrl && (
                                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                                            <img src={qrCodeUrl} alt="QR Code PIX" style={{ width: '180px', height: '180px', border: '1px solid #eee', borderRadius: '8px' }} />
                                        </div>
                                    )}

                                    <div style={{ position: 'relative' }}>
                                        <textarea
                                            readOnly
                                            value={invoice.pixCode}
                                            style={{ width: '100%', height: '80px', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13px', resize: 'none', backgroundColor: '#f9fafb', color: '#4b5563', fontFamily: 'monospace' }}
                                        />
                                        <button
                                            onClick={handleCopyPix}
                                            style={{
                                                width: '100%',
                                                padding: '14px',
                                                marginTop: '8px',
                                                backgroundColor: copiedPix ? '#10b981' : '#2563eb',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                fontSize: '15px',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px',
                                                transition: 'transform 0.1s',
                                                transform: copiedPix ? 'scale(0.98)' : 'scale(1)'
                                            }}
                                        >
                                            {copiedPix ? <CheckCircle size={20} /> : <Copy size={20} />}
                                            {copiedPix ? 'Copiado para área de transferência!' : 'Copiar Código Pix'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Barcode Option */}
                            {(invoice.digitableLine || invoice.barCode) && !isPaid && (
                                <div style={{ marginTop: '8px' }}>
                                    <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                        <Barcode size={18} color="#2563eb" /> Código de Barras
                                    </label>
                                    <div style={{ backgroundColor: '#f3f4f6', padding: '14px', borderRadius: '8px', fontSize: '13px', wordBreak: 'break-all', fontFamily: 'monospace', color: '#374151', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                                        {invoice.digitableLine || invoice.barCode}
                                    </div>
                                    <button
                                        onClick={handleCopyBar}
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            marginTop: '8px',
                                            backgroundColor: 'white',
                                            color: copiedBar ? '#10b981' : '#374151',
                                            border: `1px solid ${copiedBar ? '#10b981' : '#d1d5db'}`,
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            transition: '0.2s'
                                        }}
                                    >
                                        {copiedBar ? <CheckCircle size={18} /> : <Copy size={18} />}
                                        {copiedBar ? 'Copiado!' : 'Copiar Números'}
                                    </button>
                                </div>
                            )}

                            {/* PDF Download */}
                            {invoice.pdfLink && (
                                <a
                                    href={invoice.pdfLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        width: '100%',
                                        padding: '14px',
                                        backgroundColor: '#f3f4f6',
                                        color: '#4b5563',
                                        textDecoration: 'none',
                                        borderRadius: '8px',
                                        fontWeight: '600',
                                        fontSize: '14px',
                                        border: '1px solid #e5e7eb',
                                        marginTop: '8px'
                                    }}
                                >
                                    <FileText size={18} />
                                    Baixar PDF Original
                                </a>
                            )}

                        </div>
                    </div>

                    <div style={{ backgroundColor: '#f9fafb', padding: '16px', textAlign: 'center', fontSize: '12px', color: '#9ca3af', borderTop: '1px solid #eee' }}>
                        <AlertCircle size={18} color="#dc2626" />
                        Esta cobrança é de total responsabilidade do emitente. Verifique todos os dados antes de realizar o pagamento.
                    </div>
                </div>

                {/* ORGANIZATION INFO CARD */}
                {invoice.organization && (
                    <div className="org-card" style={{
                        width: '100%',
                        maxWidth: '350px',
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        padding: '24px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        alignSelf: 'flex-start'
                    }}>
                        <h3 style={{ fontSize: '18px', marginBottom: '16px', color: '#111827', fontWeight: '600' }}>Dados do Emissor</h3>

                        {invoice.organization.logo && (
                            <img
                                src={`${apiBaseUrl}/${invoice.organization.logo}`}
                                alt="Logo Empresa"
                                style={{ maxWidth: '140px', maxHeight: '140px', objectFit: 'contain', marginBottom: '20px', borderRadius: '8px' }}
                            />
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                            <div style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: '12px' }}>
                                <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Razão Social</div>
                                <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#374151', marginTop: '4px' }}>{invoice.organization.razaoSocial}</div>
                                {invoice.organization.nomeFantasia && (
                                    <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>{invoice.organization.nomeFantasia}</div>
                                )}
                            </div>

                            <div style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: '12px' }}>
                                <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CNPJ</div>
                                <div style={{ fontSize: '14px', fontWeight: '500', color: '#374151', fontFamily: 'monospace', marginTop: '4px' }}>{invoice.organization.cnpj}</div>
                            </div>

                            {(invoice.organization.email || invoice.organization.telefone) && (
                                <div style={{ paddingTop: '4px' }}>
                                    <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Contato</div>
                                    {invoice.organization.email && <div style={{ fontSize: '14px', color: '#374151', wordBreak: 'break-all', marginBottom: '4px' }}>{invoice.organization.email}</div>}
                                    {invoice.organization.telefone && <div style={{ fontSize: '14px', color: '#374151' }}>{invoice.organization.telefone}</div>}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div style={{ textAlign: 'center', marginTop: '24px', opacity: 0.8 }}>
                <strong style={{ color: '#111827', fontSize: '12px' }}>Plataforma:</strong>
                <div style={{ marginTop: '8px' }}>
                    <a href="https://sendd.altersoft.dev.br" target="_blank" rel="noreferrer">
                        <img src={logoSendd} alt="Logo Sendd" style={{ height: '32px', objectFit: 'contain', filter: 'grayscale(100%)', opacity: 0.6 }} />
                    </a>
                </div>
            </div>
        </div>
    );
};

export default PublicInvoice;
