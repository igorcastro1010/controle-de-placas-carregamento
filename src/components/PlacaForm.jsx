import { useState } from 'react';
import { PlusCircle } from 'lucide-react';

const initialForm = {
  tipo_veiculo: 'Truck',
  placa: '',
  placa_cavalo: '',
  placa_carreta: '',
  entrega_local: false,
  retorno_local: false,
  motorista: '',
  telefone: '',
  rota_1: '',
  rota_2: '',
  rota_3: '',
  ocorrido: '',
};

export default function PlacaForm({ onSubmit, loading, error, embedded = false }) {
  const [form, setForm] = useState(initialForm);

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      ...form,
      placa: form.tipo_veiculo === 'Carreta' ? form.placa_cavalo : form.placa,
      prioridade_local: form.retorno_local,
      prioridade_motivo: form.retorno_local ? 'Retorno de entrega local' : '',
    };
    const success = await onSubmit(payload);
    if (success !== false) setForm(initialForm);
  };

  const isCarreta = form.tipo_veiculo === 'Carreta';

  return (
    <form className={`placa-form ${embedded ? 'embedded-form' : ''}`} onSubmit={handleSubmit}>
      {!embedded && (
        <div className="section-heading">
          <h2>Cadastro de Placa</h2>
        </div>
      )}
      {error && <div className="alert error">{error}</div>}

      <div className="form-grid">
        <label>
          Tipo de veículo *
          <select required value={form.tipo_veiculo} onChange={(event) => updateField('tipo_veiculo', event.target.value)}>
            <option value="Truck">Truck</option>
            <option value="Carreta">Carreta</option>
          </select>
        </label>

        {!isCarreta && (
          <label>
            Placa *
            <input required value={form.placa} onChange={(event) => updateField('placa', event.target.value)} placeholder="Digite a placa" />
          </label>
        )}

        {isCarreta && (
          <>
            <label>
              Placa do cavalo *
              <input required value={form.placa_cavalo} onChange={(event) => updateField('placa_cavalo', event.target.value)} placeholder="Digite a placa do cavalo" />
            </label>
            <label>
              Placa da carreta *
              <input required value={form.placa_carreta} onChange={(event) => updateField('placa_carreta', event.target.value)} placeholder="Digite a placa da carreta" />
            </label>
          </>
        )}

        <label>
          Motorista *
          <input required value={form.motorista} onChange={(event) => updateField('motorista', event.target.value)} placeholder="Digite o nome do motorista" />
        </label>
        <label>
          Telefone *
          <input required value={form.telefone} onChange={(event) => updateField('telefone', event.target.value)} placeholder="(00) 00000-0000" />
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

        <section className="operation-section full-width" aria-label="Tipo de operação">
          <div>
            <span className="operation-title">Tipo de operação</span>
            <p>Marque apenas quando essa condição fizer parte da operação do motorista.</p>
          </div>
          <label className="checkbox-field operation-checkbox">
            <input type="checkbox" checked={form.entrega_local} onChange={(event) => updateField('entrega_local', event.target.checked)} />
            <span>
              Entrega local
              <small>Marque quando o motorista estiver fazendo entrega local dentro do estado.</small>
            </span>
          </label>
          <label className="checkbox-field operation-checkbox">
            <input type="checkbox" checked={form.retorno_local} onChange={(event) => updateField('retorno_local', event.target.checked)} />
            <span>
              Retorno local com prioridade
              <small>Use quando o motorista retornou de entrega local e deve ter prioridade na fila.</small>
            </span>
          </label>
        </section>

        <label className="full-width">
          Ocorrido
          <textarea value={form.ocorrido} onChange={(event) => updateField('ocorrido', event.target.value)} placeholder="Observações importantes" rows="3" />
        </label>
      </div>

      <button className="primary-action" type="submit" disabled={loading}>
        <PlusCircle size={18} aria-hidden="true" />
        {loading ? 'Cadastrando...' : 'Cadastrar no Final da Fila'}
      </button>
    </form>
  );
}
