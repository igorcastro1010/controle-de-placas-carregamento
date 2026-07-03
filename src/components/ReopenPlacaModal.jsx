import { useEffect, useState } from 'react';
import { RotateCcw, X } from 'lucide-react';

const reasons = ['Motorista retornou', 'Cancelamento incorreto', 'Finalização incorreta', 'Solicitação da gerência', 'Outro'];

export default function ReopenPlacaModal({ item, saving, onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');

  useEffect(() => {
    if (item) {
      setReason('');
      setDetails('');
    }
  }, [item]);

  if (!item) return null;

  const finalReason = reason === 'Outro' ? details.trim() : [reason, details.trim()].filter(Boolean).join(' - ');
  const canConfirm = Boolean(finalReason.trim());

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canConfirm) return;
    await onConfirm(item, finalReason);
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section className="form-modal cancel-modal" role="dialog" aria-modal="true" aria-labelledby="reopen-modal-title" onClick={(event) => event.stopPropagation()}>
        <header className="details-header">
          <div>
            <span className="eyebrow">Reabrir</span>
            <h2 id="reopen-modal-title">Reabrir marcação</h2>
            <p>Informe o motivo para voltar a placa para a fila.</p>
          </div>
          <button className="icon-only" type="button" onClick={onClose} aria-label="Fechar reabertura">
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <form className="modal-form" onSubmit={handleSubmit}>
          <label>
            Motivo da reabertura *
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
            <textarea value={details} onChange={(event) => setDetails(event.target.value)} rows="4" placeholder="Detalhe o motivo, se necessário" />
          </label>

          <div className="modal-actions">
            <button className="icon-text secondary" type="button" onClick={onClose}>
              Voltar
            </button>
            <button className="icon-text success" type="submit" disabled={!canConfirm || saving}>
              <RotateCcw size={16} aria-hidden="true" />
              {saving ? 'Reabrindo...' : 'Confirmar reabertura'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
