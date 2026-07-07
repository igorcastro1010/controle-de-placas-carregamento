import { useEffect, useState } from 'react';
import { Star, X } from 'lucide-react';
import { toUpperText } from '../services/placasService';

const defaultReason = 'RETORNO DE ENTREGA LOCAL';

export default function PriorityLocalModal({ item, saving = false, onClose, onConfirm }) {
  const [reason, setReason] = useState(defaultReason);
  const [error, setError] = useState('');

  useEffect(() => {
    if (item) {
      setReason(toUpperText(item.prioridade_motivo) || defaultReason);
      setError('');
    }
  }, [item]);

  if (!item) return null;

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmedReason = toUpperText(reason);
    if (!trimmedReason) {
      setError('Informe o motivo da prioridade.');
      return;
    }
    onConfirm?.(item, trimmedReason);
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section className="form-modal priority-modal" role="dialog" aria-modal="true" aria-labelledby="priority-modal-title" onClick={(event) => event.stopPropagation()}>
        <header className="details-header">
          <div>
            <span className="eyebrow">Prioridade</span>
            <h2 id="priority-modal-title">Prioridade local</h2>
            <p>
              {item.placa} - {item.motorista}
            </p>
          </div>
          <button className="icon-only" type="button" onClick={onClose} aria-label="Fechar prioridade">
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <form className="priority-form" onSubmit={handleSubmit}>
          {error && <div className="alert error">{error}</div>}
          <label>
            Motivo *
            <textarea value={reason} onChange={(event) => setReason(event.target.value.toUpperCase())} rows="3" placeholder="Informe o motivo da prioridade" />
          </label>
          <div className="modal-actions">
            <button className="icon-text secondary" type="button" onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button className="primary-action" type="submit" disabled={saving}>
              <Star size={17} aria-hidden="true" />
              {saving ? 'Salvando...' : 'Confirmar prioridade'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
