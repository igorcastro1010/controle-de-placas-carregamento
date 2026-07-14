import { useEffect, useState } from 'react';
import { ListOrdered, X } from 'lucide-react';

export default function MovePositionModal({ item, currentPosition, total, saving = false, error = '', onClose, onConfirm }) {
  const [position, setPosition] = useState('');
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (item) {
      setPosition(currentPosition ? String(currentPosition) : '');
      setLocalError('');
    }
  }, [item, currentPosition]);

  if (!item) return null;

  const totalItems = Number(total || 0);
  const positionNumber = Number(position);
  const validationError = !position
    ? 'Informe a nova posição.'
    : !Number.isInteger(positionNumber) || positionNumber < 1 || positionNumber > totalItems
      ? `Informe uma posição entre 1 e ${totalItems}.`
      : '';

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (validationError) {
      setLocalError(validationError);
      return;
    }

    setLocalError('');
    await onConfirm?.(item, positionNumber);
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section className="form-modal move-position-modal" role="dialog" aria-modal="true" aria-labelledby="move-position-title" onClick={(event) => event.stopPropagation()}>
        <header className="details-header">
          <div>
            <span className="eyebrow">Fila de Chamada</span>
            <h2 id="move-position-title">Mover veículo na fila</h2>
            <p>
              {item.placa} - {item.motorista || '-'}
            </p>
          </div>
          <button className="icon-only" type="button" onClick={onClose} aria-label="Fechar movimentação">
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <form className="modal-form move-position-form" onSubmit={handleSubmit}>
          {(localError || error) && <div className="alert error">{localError || error}</div>}

          <div className="move-position-summary">
            <div>
              <span>Posição atual</span>
              <strong>#{currentPosition || '-'}</strong>
            </div>
            <div>
              <span>Total na fila</span>
              <strong>{totalItems}</strong>
            </div>
          </div>

          <p className="move-position-help">
            Este veículo está na posição #{currentPosition || '-'}. Informe para qual posição deseja mover.
          </p>

          <label>
            Nova posição *
            <input
              type="number"
              min="1"
              max={totalItems || 1}
              step="1"
              required
              value={position}
              onChange={(event) => {
                setPosition(event.target.value);
                setLocalError('');
              }}
              placeholder="Ex.: 3"
            />
          </label>

          <div className="modal-actions">
            <button className="icon-text secondary" type="button" onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button className="primary-action" type="submit" disabled={saving || totalItems < 1}>
              <ListOrdered size={17} aria-hidden="true" />
              {saving ? 'Movendo...' : 'Confirmar movimentação'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
