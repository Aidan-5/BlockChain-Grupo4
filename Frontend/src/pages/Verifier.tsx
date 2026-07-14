import React, { useState } from 'react';
import axios from 'axios';
import { Search, ShieldCheck, ShieldAlert, Fingerprint } from 'lucide-react';

const Verifier = () => {
  const [credentialId, setCredentialId] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credentialId) return;

    setLoading(true);
    setResult(null);
    setError('');

    try {
      const response = await axios.get(`http://localhost:3000/credentials/${credentialId}/verify`);
      setResult(response.data);
    } catch (err: any) {
      console.error('Verify error', err);
      setError(err.response?.data?.message || 'Error al verificar la credencial. Es posible que no exista.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <h2 className="gradient-text" style={{ fontSize: '2rem', marginBottom: '2rem', textAlign: 'center' }}>Portal de Verificación</h2>
      
      <div className="glass-panel" style={{ padding: '2.5rem', marginBottom: '2rem' }}>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2rem' }}>
          Ingrese el identificador (ID) de la credencial que el ciudadano ha compartido para validar su autenticidad directamente en la Blockchain.
        </p>

        <form onSubmit={handleVerify} style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <input 
              type="number" 
              className="glass-input" 
              placeholder="ID de la Credencial (ej. 1)"
              value={credentialId}
              onChange={(e) => setCredentialId(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Verificando...' : <><Search size={18} /> Verificar</>}
          </button>
        </form>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--error)', padding: '1.5rem', borderRadius: '8px', color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <ShieldAlert size={24} /> {error}
        </div>
      )}

      {result && (
        <div className="glass-card" style={{ border: result.validaEnBlockchain ? '1px solid var(--accent)' : '1px solid var(--error)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1.5rem' }}>
            {result.validaEnBlockchain && result.hashCoincide ? (
              <ShieldCheck size={40} color="var(--accent)" />
            ) : (
              <ShieldAlert size={40} color="var(--error)" />
            )}
            <div>
              <h3 style={{ color: result.validaEnBlockchain && result.hashCoincide ? 'var(--accent)' : 'var(--error)' }}>
                {result.validaEnBlockchain && result.hashCoincide ? 'CREDENCIAL AUTÉNTICA' : 'CREDENCIAL INVÁLIDA O ALTERADA'}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Verificación en Blockchain Híbrida completada</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Titular</p>
              <p style={{ fontWeight: 500 }}>{result.usuario?.nombre}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>Identificación</p>
              <p style={{ fontWeight: 500 }}>{result.usuario?.identificacion}</p>
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Emisor Verificado</p>
              <p style={{ fontWeight: 500 }}>{result.institucion?.nombre}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>Fecha de Emisión</p>
              <p style={{ fontWeight: 500 }}>{result.timestamp ? new Date(result.timestamp * 1000).toLocaleString() : 'N/A'}</p>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Fingerprint size={14} /> Hash Criptográfico Registrado
            </p>
            <p style={{ fontFamily: 'monospace', fontSize: '0.85rem', wordBreak: 'break-all', color: 'var(--primary)' }}>
              {result.hash}
            </p>
            {!result.hashCoincide && (
              <p style={{ color: 'var(--error)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                * El hash calculado no coincide con el registrado. Los datos han sido manipulados.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Verifier;
