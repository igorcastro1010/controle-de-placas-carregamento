import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const emptyForm = {
  tipo_veiculo: 'Truck',
  placa: '',
  placa_cavalo: '',
  placa_carreta: '',
  motorista: '',
  telefone: '',
  rota_1: '',
  rota_2: '',
  rota_3: '',
  ocorrido: '',
};

function formFromItem(item) {
  if (!item) return emptyForm;
  return {
    tipo_veiculo: item.tipo_veiculo || 'Truck',
    placa: item.placa || '',
    placa_cavalo: item.placa_cavalo || '',
    placa_carreta: item.placa_carreta || '',
    motorista: item.motorista || '',
    telefone: item.telefone || '',
    rota_1: item.rota_1 || '',
    rota_2: item.rota_2 || '',
    rota_3: item.rota_3 || '',
    ocorrido: item.ocorrido || '',
  };
}

export default function EditPlacaModal({ item, saving, error, onClose, onSave }) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    setForm(formFromItem(item));
  }, [item]);

  if (!item) return null;

  const isCarreta = form.tipo_veiculo === 'Carreta';
  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

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
