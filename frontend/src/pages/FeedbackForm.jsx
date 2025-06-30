
import React, { useState } from 'react';
import axios from 'axios';
import './FeedbackForm.css';

const FeedbackForm = ({ tipo = 'geral', referencia = '' }) => {
  const [mensagem, setMensagem] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/feedback', { tipo, referencia, mensagem });
      setEnviado(true);
      setMensagem('');
      setErro(false);
    } catch (error) {
      console.error('Erro ao enviar feedback:', error);
      setErro(true);
    }
  };

  return (
    <div className="feedback-container">
      <h3>Enviar Feedback</h3>
      <form onSubmit={handleSubmit}>
        <textarea
          placeholder="Digite seu feedback..."
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          required
        />
        <button type="submit">Enviar</button>
        {enviado && <p className="sucesso">Feedback enviado com sucesso!</p>}
        {erro && <p className="erro">Erro ao enviar feedback. Tente novamente.</p>}
      </form>
    </div>
  );
};

export default FeedbackForm;
