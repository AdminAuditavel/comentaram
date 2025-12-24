//pulso-publico/components/Ranking.jsx

'use client';

import { useEffect, useState } from 'react';

export default function Ranking() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/daily_ranking');
      if (!res.ok) throw new Error('Erro ao buscar dados');
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Para polling automático (opcional):
    // const id = setInterval(fetchData, 60 * 1000);
    // return () => clearInterval(id);
  }, []);

  if (loading) return <div>Carregando ranking…</div>;
  if (error)
    return (
      <div>
        Erro ao buscar ranking: {error.message}
        <button onClick={fetchData}>Tentar novamente</button>
      </div>
    );
  if (!data || !Array.isArray(data) || data.length === 0) return <div>Nenhum dado disponível</div>;

  return (
    <div>
      <h2>Ranking Diário</h2>
      <table>
        <thead>
          <tr>
            <th>Posição</th>
            <th>Clube</th>
            <th>IAP</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => (
            <tr key={item.club_id ?? idx}>
              <td>{idx + 1}</td>
              <td>{item.club_name ?? item.club ?? '—'}</td>
              <td>{item.iap ?? item.score ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
