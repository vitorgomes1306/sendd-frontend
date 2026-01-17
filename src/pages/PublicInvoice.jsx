import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiService } from '../services/api';
import { Download, Copy, CheckCircle, AlertTriangle, FileText, Barcode, QrCode, AlertCircle } from 'lucide-react';
import logoSendd from '../../src/assets/img/sendd2.png';

import QRCode from 'qrcode';

const PublicInvoice = () => {
    const { token } = useParams();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [copiedPix, setCopiedPix] = useState(false);
    const [copiedBar, setCopiedBar] = useState(false);
    const [qrCodeUrl, setQrCodeUrl] = useState('');

    useEffect(() => {
        const fetchInvoice = async () => {
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
    }, [token]);

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

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }} className="invoice-container">
            <style>{`
                .invoice-container { padding: 20px; }
                .invoice-card-content { padding: 24px; }
                .invoice-header { padding: 24px; }
                .invoice-value { fontSize: 28px; }
                
                @media (max-width: 480px) {
                    .invoice-container { padding: 12px; }
                    .invoice-card-content { padding: 16px; }
                    .invoice-header { padding: 20px; }
                    .invoice-value { fontSize: 24px; }
                }
            `}</style>

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
                    Esta cobrança é de total responsabilidade do emitente. Verifique todos os dados antes de realizar o pagamento e se tiver dúvidas, confirme com a empresa emitente sua autoria.
                </div>
                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                    <strong style={{ color: '#111827', fontSize: '12px' }}>Desenvolvido por:</strong>
                </div>
                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                    <a href="https://sendd.altersoft.dev.br" target="_blank" rel="noreferrer"><img src={logoSendd} alt="Logo Sendd" style={{ width: '100px', height: '100px', objectFit: 'contain' }} /></a>
                </div>
            </div>
        </div>
    );
};

export default PublicInvoice;
