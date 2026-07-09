import { useEffect, useState } from 'react';
import { MapPin, X } from 'lucide-react';
import { toUpperText } from '../services/placasService';

export default function OutroLocalModal({ item, saving, onClose, onConfirm }) {
  const [local, setLocal] = useState('');
  const [motivo, setMotivo] = useState('');

  useEffect(() => {
    if (item) {
      setLocal('');
      setMotivo('');
    }
  }, [item]);

  if (!item) return null;

  const localFinal = toUpperText(local);
  const motivoFinal = toUpperText(motivo);
  const canConfirm = Boolean(localFinal && motivoFinal);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canConfirm) return;
    await onConfirm(item, { local: localFinal, motivo: motivoFinal });
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section className="form-modal cancel-modal" role="dialog" aria-modal="true" aria-labelledby="outro-local-modal-title" onClick={(event) => event.stopPropagation()}>
        <header className="details-header">
          <div>
            <span className="eyebrow">Outro local</span>
            <h2 id="outro-local-modal-title">Carregou em outro local</h2>
            <p>Informe onde o motorista carregou e o motivo da baixa.</p>
          </div>
          <button className="icon-only" type="button" onClick={onClose} aria-label="Fechar outro local">
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <form className="modal-form" onSubmit={handleSubmit}>
          <label>
            Local onde carregou *
            <input required value={local} onChange={(event) => setLocal(event.target.value.toUpperCase())} placeholder="Digite o local" />
          </label>

          <label>
            Motivo/observação *
            <textarea required value={motivo} onChange={(event) => setMotivo(event.target.value.toUpperCase())} rows="4" placeholder="Informe o motivo" />
          </label>

          <div className="modal-actions">
            <button className="icon-text secondary" type="button" onClick={onClose}>
              Voltar
            </button>
            <button className="primary-action" type="submit" disabled={!canConfirm || saving}>
              <MapPin size={16} aria-hidden="true" />
              {saving ? 'Salvando...' : 'Confirmar'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
