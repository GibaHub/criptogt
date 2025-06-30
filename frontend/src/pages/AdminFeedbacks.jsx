
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './AdminFeedbacks.css';

const AdminFeedbacks = () => {
  const [feedbacks, setFeedbacks] = useState([]);

  useEffect(() => {
    carregarFeedbacks();
  }, []);

  const carregarFeedbacks = async () => {
    try {
      const response = await axios.get('/api/feedback');
      setFeedbacks(response.data);
    } catch (error) {
      console.error('Erro ao carregar feedbacks:', error);
    }
  };

  return (
    <div className="admin-feedbacks">
      <h2>Feedbacks Recebidos</h2>
      {feedbacks.length === 0 ? (
        <p>Nenhum feedback encontrado.</p>
      ) : (
        <table className="feedbacks-tabela">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Referência</th>
              <th>Mensagem</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            {feedbacks.map((item) => (
              <tr key={item.id}>
                <td>{item.tipo}</td>
                <td>{item.referencia}</td>
                <td>{item.mensagem}</td>
                <td>{new Date(item.data).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminFeedbacks;
