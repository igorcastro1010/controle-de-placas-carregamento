import { useState } from 'react';
import { PlusCircle } from 'lucide-react';

const initialForm = {
  placa: '',
  motorista: '',
  telefone: '',
  rota_1: '',
  rota_2: '',
  rota_3: '',
  ocorrido: '',
};

export default function PlacaForm({ onSubmit, loading }) {
  const [form, setForm] = useState(initialForm);

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onSubmit(form);
    setForm(initialForm);
  };

  return (
    <form className="placa-form" onSubmit={handleSubmit}>
      <div className="section-heading">
        <h2>Cadastro de placa</h2>
      </div>
      <div className="form-grid">
        <label>
          Placa *
          <input required value={form.placa} onChange={(event) => updateField('placa', event.target.value)} placeholder="ABC1D23" />
        </label>
        <label>
          Motorista *
          <input required value={form.motorista} onChange={(event) => updateField('motorista', event.target.value)} placeholder="Nome do motorista" />
        </label>
        <label>
          Telefone
          <input value={form.telefone} onChange={(event) => updateField('telefone', event.target.value)} placeholder="(00) 00000-0000" />
        </label>
        <label>
          Rota 1
          <input value={form.rota_1} onChange={(event) => updateField('rota_1', event.target.value)} placeholder="Origem ou destino" />
        </label>
        <label>
          Rota 2
          <input value={form.rota_2} onChange={(event) => updateField('rota_2', event.target.value)} placeholder="Opcional" />
        </label>
        <label>
          Rota 3
          <input value={form.rota_3} onChange={(event) => updateField('rota_3', event.target.value)} placeholder="Opcional" />
        </label>
        <label className="full-width">
          Ocorrido
          <textarea value={form.ocorrido} onChange={(event) => updateField('ocorrido', event.target.value)} placeholder="Observações importantes" rows="3" />
        </label>
      </div>
      <button className="primary-action" type="submit" disabled={loading}>
        <PlusCircle size={18} aria-hidden="true" />
        {loading ? 'Cadastrando...' : 'Cadastrar no final da fila'}
      </button>
    </form>
  );
}
