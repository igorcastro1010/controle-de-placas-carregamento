import { useState } from 'react';
import {
  ArrowDown,
  ArrowDownToLine,
  ArrowUp,
  Check,
  ChevronDown,
  History,
  Loader,
  Megaphone,
  MoreHorizontal,
  Pencil,
  Phone,
  PhoneOff,
  RotateCcw,
  X,
} from 'lucide-react';

function ActionButton({ className = 'neutral', children, ...props }) {
  return (
    <button className={`queue-action ${className}`} type="button" {...props}>
      {children}
    </button>
  );
}

export default function ActionButtons({ item, index, itemsLength, busyId, canViewAudit, onAction, onMove, onEdit, onAudit, onReopen }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const disabled = busyId === item.id;
  const isFirst = index === 0;
  const isLast = index === itemsLength - 1;
  const isClosed = ['Finalizado', 'Cancelado'].includes((item.status || '').trim());

  const handleMenuClick = (callback) => {
    callback?.();
    setMenuOpen(false);
  };

  return (
    <div className="queue-actions compact-actions">
      {!isClosed && (
        <div className="primary-actions">
          <ActionButton title="1ª ligação" disabled={disabled} onClick={() => onAction(item, 'primeira')}>
            <Phone size={14} />
            1ª ligação
          </ActionButton>
          <ActionButton title="2ª ligação" disabled={disabled} onClick={() => onAction(item, 'segunda')}>
            <Phone size={14} />
            2ª ligação
          </ActionButton>
          <ActionButton title="3ª ligação" disabled={disabled} onClick={() => onAction(item, 'terceira')}>
            <Phone size={14} />
            3ª ligação
          </ActionButton>
          <ActionButton className="danger-soft" title="Não atendeu" disabled={disabled} onClick={() => onAction(item, 'nao_atendeu')}>
            <PhoneOff size={14} />
            Não atendeu
          </ActionButton>
          <ActionButton className="blue-soft" title="Chamado" disabled={disabled} onClick={() => onAction(item, 'chamado')}>
            <Megaphone size={14} />
            Chamado
          </ActionButton>
          <ActionButton className="danger-soft" title="Cancelar" disabled={disabled} onClick={() => onAction(item, 'cancelar')}>
            <X size={14} />
            Cancelar
          </ActionButton>
        </div>
      )}

      <div className="more-actions">
        <button className="queue-action neutral more-actions-trigger" type="button" disabled={disabled} aria-expanded={menuOpen} onClick={() => setMenuOpen((current) => !current)}>
          <MoreHorizontal size={15} />
          Mais ações
          <ChevronDown size={14} />
        </button>

        {menuOpen && (
          <div className="more-actions-menu">
            {!isClosed && (
              <>
                <button type="button" onClick={() => handleMenuClick(() => onEdit?.(item))}>
                  <Pencil size={14} />
                  Editar
                </button>
                {canViewAudit && (
                  <button type="button" onClick={() => handleMenuClick(() => onAudit?.(item))}>
                    <History size={14} />
                    Histórico
                  </button>
                )}
                <button type="button" disabled={isFirst} onClick={() => handleMenuClick(() => onMove(item, index, 'up'))}>
                  <ArrowUp size={14} />
                  Subir
                </button>
                <button type="button" disabled={isLast} onClick={() => handleMenuClick(() => onMove(item, index, 'down'))}>
                  <ArrowDown size={14} />
                  Descer
                </button>
                <button type="button" onClick={() => handleMenuClick(() => onMove(item, index, 'end'))}>
                  <ArrowDownToLine size={14} />
                  Fim
                </button>
                <button type="button" onClick={() => handleMenuClick(() => onAction(item, 'chegou'))}>
                  <Check size={14} />
                  Chegou
                </button>
                <button type="button" onClick={() => handleMenuClick(() => onAction(item, 'carregando'))}>
                  <Loader size={14} />
                  Carregando
                </button>
                <button type="button" onClick={() => handleMenuClick(() => onAction(item, 'finalizar'))}>
                  <Check size={14} />
                  Finalizar
                </button>
              </>
            )}

            {isClosed && canViewAudit && (
              <>
                <button type="button" onClick={() => handleMenuClick(() => onAudit?.(item))}>
                  <History size={14} />
                  Histórico
                </button>
                <button type="button" onClick={() => handleMenuClick(() => onReopen?.(item))}>
                  <RotateCcw size={14} />
                  Reabrir
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
