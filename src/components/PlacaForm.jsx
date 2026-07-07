import { useEffect, useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { findVeiculoMotoristaByPlate, normalizePlate, toUpperText } from '../services/placasService';

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

const upperInputFields = new Set(['placa', 'placa_cavalo', 'placa_carreta', 'motorista', 'telefone', 'rota_1', 'rota_2', 'rota_3', 'ocorrido']);

export default function PlacaForm({ onSubmit, loading, error, embedded = false }) {
  const [form, setForm] = useState(initialForm);
  const [lookupStatus, setLookupStatus] = useState('');
  const [autoFilled, setAutoFilled] = useState(false);

  const updateField = (field, value) =>
    setForm((current) => ({
      ...current,
      [field]: upperInputFields.has(field) ? String(value || '').toUpperCase() : value,
    }));

  const isCarreta = form.tipo_veiculo === 'Carreta';
  const lookupPlate = isCarreta ? form.placa_cavalo : form.placa;

  useEffect(() => {
    const normalizedLookupPlate = normalizePlate(lookupPlate);
    if (normalizedLookupPlate.length < 3) {
      setLookupStatus('');
      setAutoFilled(false);
      return undefined;
    }

    const timer = window.setTimeout(async () => {
      try {
        const savedRegistration = await findVeiculoMotoristaByPlate(normalizedLookupPlate);
        if (!savedRegistration) {
          setLookupStatus('');
          setAutoFilled(false);
          return;
        }

        setForm((current) => {
          const currentPlate = current.tipo_veiculo === 'Carreta' ? current.placa_cavalo : current.placa;
          if (normalizePlate(currentPlate) !== normalizedLookupPlate) return current;

          const savedTipoVeiculo = savedRegistration.tipo_veiculo || 'Truck';
          const savedIsCarreta = savedTipoVeiculo === 'Carreta';

          return {
            ...current,
            tipo_veiculo: savedTipoVeiculo,
            placa: savedIsCarreta ? toUpperText(savedRegistration.placa_cavalo || savedRegistration.placa) : toUpperText(savedRegistration.placa),
            placa_cavalo: savedIsCarreta ? toUpperText(savedRegistration.placa_cavalo || savedRegistration.placa) : '',
            placa_carreta: savedIsCarreta ? toUpperText(savedRegistration.placa_carreta) : '',
            motorista: toUpperText(savedRegistration.motorista),
            telefone: toUpperText(savedRegistration.telefone),
            rota_1: toUpperText(savedRegistration.rota_1),
            rota_2: toUpperText(savedRegistration.rota_2),
            rota_3: toUpperText(savedRegistration.rota_3),
            ocorrido: savedRegistration.observacao_padrao ? toUpperText(savedRegistration.observacao_padrao) : current.ocorrido,
          };
        });
        setLookupStatus('Cadastro encontrado: dados preenchidos automaticamente.');
        setAutoFilled(true);
      } catch (err) {
        console.warn('Nao foi possivel buscar cadastro salvo do veiculo.', err);
        setLookupStatus('');
        setAutoFilled(false);
      }
    }, 400);

    return () => window.clearTimeout(timer);
  }, [lookupPlate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      ...form,
      placa: form.tipo_veiculo === 'Carreta' ? form.placa_cavalo : form.placa,
      prioridade_local: form.retorno_local,
      prioridade_motivo: form.retorno_local ? 'RETORNO DE ENTREGA LOCAL' : '',
    };
    const success = await onSubmit(payload);
    if (success !== false) setForm(initialForm);
  };

  const clearAutoFilledData = () => {
    setForm((current) => ({
      ...current,
      motorista: '',
      telefone: '',
      rota_1: '',
      rota_2: '',
      rota_3: '',
      ocorrido: '',
    }));
    setLookupStatus('');
    setAutoFilled(false);
  };

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
          Tipo de veiculo *
          <select required value={form.tipo_veiculo} onChange={(event) => updateField('tipo_veiculo', event.target.value)}>
            <option value="Truck">Truck</option>
            <option value="Carreta">Carreta</option>
          </select>
        </label>

        {!isCarreta && (
          <label>
            Placa *
            <input required value={form.placa} onChange={(event) => updateField('placa', event.target.value)} placeholder="Digite a placa" />
            <small className="field-hint">Digite uma placa ja usada para preencher automaticamente.</small>
          </label>
        )}

        {isCarreta && (
          <label>
            Placa do cavalo *
            <input required value={form.placa_cavalo} onChange={(event) => updateField('placa_cavalo', event.target.value)} placeholder="Digite a placa do cavalo" />
            <small className="field-hint">Digite uma placa ja usada para preencher automaticamente.</small>
          </label>
        )}

        <label>
          Motorista *
          <input required value={form.motorista} onChange={(event) => updateField('motorista', event.target.value)} placeholder="Digite o nome do motorista" />
        </label>

        {lookupStatus && (
          <div className="auto-fill-note full-width">
            <span>{lookupStatus}</span>
            {autoFilled && (
              <button className="text-button" type="button" onClick={clearAutoFilledData}>
                Limpar dados preenchidos
              </button>
            )}
          </div>
        )}

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

        {isCarreta && (
          <label>
            Placa da carreta *
            <input required value={form.placa_carreta} onChange={(event) => updateField('placa_carreta', event.target.value)} placeholder="Digite a placa da carreta" />
          </label>
        )}

        <section className="operation-section full-width" aria-label="Tipo de operacao">
          <div>
            <span className="operation-title">Tipo de operacao</span>
            <p>Marque apenas quando essa condicao fizer parte da operacao do motorista.</p>
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
          <textarea value={form.ocorrido} onChange={(event) => updateField('ocorrido', event.target.value)} placeholder="Observacoes importantes" rows="3" />
        </label>
      </div>

      <button className="primary-action" type="submit" disabled={loading}>
        <PlusCircle size={18} aria-hidden="true" />
        {loading ? 'Cadastrando...' : 'Cadastrar no Final da Fila'}
      </button>
    </form>
  );
}
