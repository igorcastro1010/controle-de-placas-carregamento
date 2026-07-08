import { useEffect, useMemo, useState } from 'react';
import { Megaphone, X } from 'lucide-react';
import { formatCurrency, toUpperText } from '../services/placasService';

function parseFrete(value) {
  const normalized = String(value || '')
    .replace(/[^\d,.-]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function ChamadoModal({ item, saving, onClose, onConfirm }) {
  const [cidade, setCidade] = useState('');
  const [frete, setFrete] = useState('');

  useEffect(() => {
    if (item) {
      setCidade(toUpperText(item.cidade_destino));
      setFrete(item.valor_frete_carreteiro ? String(item.valor_frete_carreteiro).replace('.', ',') : '');
    }
  }, [item]);

  const freteNumber = useMemo(() => parseFrete(frete), [frete]);
  const canConfirm = Boolean(toUpperText(cidade)) && freteNumber > 0;

  if (!item) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canConfirm) return;
    await onConfirm(item, {
      cidade_destino: toUpperText(cidade),
      valor_frete_carreteiro: freteNumber,
    });
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section className="form-modal cancel-modal" role="dialog" aria-modal="true" aria-labelledby="chamado-modal-title" onClick={(event) => event.stopPropagation()}>
        <header className="details-header">
          <div>
            <span className="eyebrow">Chamado</span>
            <h2 id="chamado-modal-title">Dados do frete</h2>
            <p>Informe a cidade de destino e o valor do frete carreteiro.</p>
          </div>
          <button className="icon-only" type="button" onClick={onClose} aria-label="Fechar chamado">
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <form className="modal-form" onSubmit={handleSubmit}>
          <label>
            Cidade destino *
            <input required value={cidade} onChange={(event) => setCidade(event.target.value.toUpperCase())} placeholder="Digite a cidade" />
          </label>

          <label>
            Valor do frete carreteiro *
            <input required inputMode="decimal" value={frete} onChange={(event) => setFrete(event.target.value)} placeholder="Ex: 1500,00" />
            {freteNumber > 0 && <small className="field-hint">{formatCurrency(freteNumber)}</small>}
          </label>

          <div className="modal-actions">
            <button className="icon-text secondary" type="button" onClick={onClose}>
              Voltar
            </button>
            <button className="primary-action" type="submit" disabled={!canConfirm || saving}>
              <Megaphone size={16} aria-hidden="true" />
              {saving ? 'Chamando...' : 'Confirmar chamado'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
