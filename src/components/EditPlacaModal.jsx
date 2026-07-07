import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { toUpperText } from '../services/placasService';

const emptyForm = {
  tipo_veiculo: 'Truck',
  placa: '',
  placa_cavalo: '',
  placa_carreta: '',
  entrega_local: false,
  retorno_local: false,
  prioridade_local: false,
  prioridade_motivo: '',
  prioridade_por: '',
  prioridade_em: '',
  motorista: '',
  telefone: '',
  rota_1: '',
  rota_2: '',
  rota_3: '',
  ocorrido: '',
};

const upperInputFields = new Set(['placa', 'placa_cavalo', 'placa_carreta', 'motorista', 'telefone', 'rota_1', 'rota_2', 'rota_3', 'ocorrido', 'prioridade_motivo']);

function formFromItem(item) {
  if (!item) return emptyForm;
  return {
    tipo_veiculo: item.tipo_veiculo || 'Truck',
    placa: toUpperText(item.placa),
    placa_cavalo: toUpperText(item.placa_cavalo),
    placa_carreta: toUpperText(item.placa_carreta),
    entrega_local: Boolean(item.entrega_local),
    retorno_local: Boolean(item.retorno_local),
    prioridade_local: Boolean(item.prioridade_local),
    prioridade_motivo: toUpperText(item.prioridade_motivo),
    prioridade_por: item.prioridade_por || '',
    prioridade_em: item.prioridade_em || '',
    motorista: toUpperText(item.motorista),
    telefone: toUpperText(item.telefone),
    rota_1: toUpperText(item.rota_1),
    rota_2: toUpperText(item.rota_2),
    rota_3: toUpperText(item.rota_3),
    ocorrido: toUpperText(item.ocorrido),
  };
}

export default function EditPlacaModal({ item, saving, error, onClose, onSave }) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    setForm(formFromItem(item));
  }, [item]);

  if (!item) return null;

  const isCarreta = form.tipo_veiculo === 'Carreta';
  const updateField = (field, value) =>
    setForm((current) => ({
      ...current,
      [field]: upperInputFields.has(field) ? String(value || '').toUpperCase() : value,
    }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onSave(item.id, {
      ...form,
      placa: isCarreta ? form.placa_cavalo : form.placa,
    });
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section className="form-modal" role="dialog" aria-modal="true" aria-labelledby="edit-modal-title" onClick={(event) => event.stopPropagation()}>
        <header className="details-header">
          <div>
            <span className="eyebrow">Cadastro</span>
            <h2 id="edit-modal-title">Editar marcação</h2>
          </div>
          <button className="icon-only" type="button" onClick={onClose} aria-label="Fechar edição">
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        {error && <div className="alert error">{error}</div>}

        <form className="modal-form" onSubmit={handleSubmit}>
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
                <input required value={form.placa} onChange={(event) => updateField('placa', event.target.value)} />
              </label>
            )}

            {isCarreta && (
              <>
                <label>
                  Placa do cavalo *
                  <input required value={form.placa_cavalo} onChange={(event) => updateField('placa_cavalo', event.target.value)} />
                </label>
                <label>
                  Placa da carreta *
                  <input required value={form.placa_carreta} onChange={(event) => updateField('placa_carreta', event.target.value)} />
                </label>
              </>
            )}

            <label>
              Motorista *
              <input required value={form.motorista} onChange={(event) => updateField('motorista', event.target.value)} />
            </label>
            <label>
              Telefone *
              <input required value={form.telefone} onChange={(event) => updateField('telefone', event.target.value)} />
            </label>
            <label>
              Rota 1
              <input value={form.rota_1} onChange={(event) => updateField('rota_1', event.target.value)} />
            </label>
            <label>
              Rota 2
              <input value={form.rota_2} onChange={(event) => updateField('rota_2', event.target.value)} />
            </label>
            <label>
              Rota 3
              <input value={form.rota_3} onChange={(event) => updateField('rota_3', event.target.value)} />
            </label>
            <section className="operation-section full-width" aria-label="Tipo de operação">
              <div>
                <span className="operation-title">Tipo de operação</span>
                <p>A prioridade local deve ser alterada pelo menu Ações.</p>
              </div>
              <label className="checkbox-field operation-checkbox">
                <input type="checkbox" checked={form.entrega_local} onChange={(event) => updateField('entrega_local', event.target.checked)} />
                <span>
                  Entrega local
                  <small>Marque quando o motorista estiver fazendo entrega local dentro do estado.</small>
                </span>
              </label>
            </section>
            <label className="full-width">
              Ocorrido
              <textarea value={form.ocorrido} onChange={(event) => updateField('ocorrido', event.target.value)} rows="3" />
            </label>
          </div>

          <div className="modal-actions">
            <button className="icon-text secondary" type="button" onClick={onClose}>
              Voltar
            </button>
            <button className="primary-action" type="submit" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
