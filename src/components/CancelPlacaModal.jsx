import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { toUpperText } from '../services/placasService';

const reasons = ['Motorista não compareceu', 'Erro de cadastro', 'Cliente cancelou', 'Duplicidade', 'Outro'];

export default function CancelPlacaModal({ item, saving, onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');

  useEffect(() => {
    if (item) {
      setReason('');
      setDetails('');
    }
  }, [item]);

  if (!item) return null;

  const finalReason = toUpperText(reason === 'Outro' ? details : [reason, details].filter(Boolean).join(' - '));
  const canConfirm = Boolean(finalReason.trim());

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canConfirm) return;
    await onConfirm(item, finalReason);
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section className="form-modal cancel-modal" role="dialog" aria-modal="true" aria-labelledby="cancel-modal-title" onClick={(event) => event.stopPropagation()}>
        <header className="details-header">
          <div>
            <span className="eyebrow">Cancelar</span>
            <h2 id="cancel-modal-title">Cancelar marcação</h2>
            <p>Informe o motivo do cancelamento para continuar.</p>
          </div>
          <button className="icon-only" type="button" onClick={onClose} aria-label="Fechar cancelamento">
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <form className="modal-form" onSubmit={handleSubmit}>
          <label>
            Motivo do cancelamento *
            <select required value={reason} onChange={(event) => setReason(event.target.value)}>
              <option value="">Selecione um motivo</option>
              {reasons.map((itemReason) => (
                <option key={itemReason} value={itemReason}>
                  {itemReason}
                </option>
              ))}
            </select>
          </label>

          <label>
            Observação
            <textarea value={details} onChange={(event) => setDetails(event.target.value.toUpperCase())} rows="4" placeholder="Detalhe o motivo, se necessário" />
          </label>

          <div className="modal-actions">
            <button className="icon-text secondary" type="button" onClick={onClose}>
              Voltar
            </button>
            <button className="icon-text danger" type="submit" disabled={!canConfirm || saving}>
              {saving ? 'Cancelando...' : 'Confirmar cancelamento'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
