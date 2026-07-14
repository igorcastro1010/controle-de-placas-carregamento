import { useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowDownToLine,
  ArrowUp,
  Check,
  ChevronDown,
  CheckCircle2,
  History,
  ListOrdered,
  Loader,
  MapPin,
  Megaphone,
  MoreHorizontal,
  Pencil,
  Phone,
  PhoneOff,
  RotateCcw,
  Star,
  StarOff,
  X,
} from 'lucide-react';

function ActionButton({ className = 'neutral', children, ...props }) {
  return (
    <button className={`queue-action ${className}`} type="button" {...props}>
      {children}
    </button>
  );
}

const normalizeStatus = (status) =>
  String(status || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export default function ActionButtons({ item, index, itemsLength, busyId, canViewAudit, canManageQueue, onAction, onMove, onEdit, onAudit, onReopen, onPriority, onOtherLocation, onMoveToPosition }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState({});
  const menuRef = useRef(null);
  const triggerRef = useRef(null);
  const disabled = busyId === item.id;
  const isFirst = index === 0;
  const isLast = index === itemsLength - 1;
  const isClosed = ['Finalizado', 'Cancelado', 'Carregado em outro local'].includes((item.status || '').trim());
  const statusKey = normalizeStatus(item.status);
  const isInProgress = ['chamado', 'chegou', 'carregando'].includes(statusKey);

  const positionMenu = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const isMobile = window.innerWidth <= 820;

    if (isMobile) {
      setMenuStyle({
        position: 'fixed',
        left: 12,
        right: 12,
        bottom: 12,
        top: 'auto',
        width: 'auto',
      });
      return;
    }

    const width = 230;
    const itemCount = isClosed ? (canManageQueue ? 2 : 0) : 7 + (canManageQueue ? (isInProgress ? 3 : 4) : 0) + (canViewAudit ? 1 : 0);
    const estimatedHeight = Math.min(420, itemCount * 39 + 18);
    const left = Math.min(Math.max(12, rect.right - width), window.innerWidth - width - 12);
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow >= estimatedHeight + 16 ? rect.bottom + 8 : Math.max(12, rect.top - estimatedHeight - 8);

    setMenuStyle({
      position: 'fixed',
      left,
      top,
      width,
    });
  };

  const toggleMenu = () => {
    if (menuOpen) {
      setMenuOpen(false);
      return;
    }

    positionMenu();
    setMenuOpen(true);
  };

  useEffect(() => {
    if (!menuOpen) return undefined;

    const handleOutsideClick = (event) => {
      if (menuRef.current?.contains(event.target) || triggerRef.current?.contains(event.target)) return;
      setMenuOpen(false);
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };

    const handleViewportChange = () => {
      setMenuOpen(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [menuOpen]);

  const handleMenuClick = (callback) => {
    callback?.();
    setMenuOpen(false);
  };

  return (
    <div className={`queue-actions compact-actions ${isInProgress ? 'in-progress-actions' : ''}`}>
      {!isClosed && !isInProgress && (
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
        </div>
      )}

      {!isClosed && isInProgress && (
        <div className="primary-actions progress-primary-actions">
          {statusKey === 'chamado' && (
            <ActionButton className="blue-soft" title="Chegou" disabled={disabled} onClick={() => onAction(item, 'chegou')}>
              <Check size={14} />
              Chegou
            </ActionButton>
          )}
          {(statusKey === 'chamado' || statusKey === 'chegou') && (
            <ActionButton className="purple-soft" title="Carregando" disabled={disabled} onClick={() => onAction(item, 'carregando')}>
              <Loader size={14} />
              Carregando
            </ActionButton>
          )}
          <ActionButton className="success-soft" title="Finalizar" disabled={disabled} onClick={() => onAction(item, 'finalizar')}>
            <CheckCircle2 size={14} />
            Finalizar
          </ActionButton>
          <ActionButton className="danger-soft" title="Carga cancelada" disabled={disabled} onClick={() => onAction(item, 'cancelar')}>
            <X size={14} />
            Carga cancelada
          </ActionButton>
        </div>
      )}

      <div className="more-actions">
        <button ref={triggerRef} className="queue-action neutral more-actions-trigger" type="button" disabled={disabled} aria-expanded={menuOpen} onClick={toggleMenu}>
          <MoreHorizontal size={15} />
          Ações
          <ChevronDown size={14} />
        </button>

        {menuOpen && (
          <div ref={menuRef} className="more-actions-menu" style={menuStyle}>
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
                {canManageQueue && (
                  <>
                    <button type="button" onClick={() => handleMenuClick(() => onPriority?.(item))}>
                      {item.prioridade_local ? <StarOff size={14} /> : <Star size={14} />}
                      {item.prioridade_local ? 'Remover prioridade' : 'Prioridade local'}
                    </button>
                    {!isInProgress && (
                      <button type="button" onClick={() => handleMenuClick(() => onMoveToPosition?.(item))}>
                        <ListOrdered size={14} />
                        Mover para posição
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
                  </>
                )}
                <button type="button" onClick={() => handleMenuClick(() => onMove(item, index, 'end'))}>
                  <ArrowDownToLine size={14} />
                  Fim
                </button>
                <button type="button" onClick={() => handleMenuClick(() => (onOtherLocation ? onOtherLocation(item) : onAction(item, 'outro_local')))}>
                  <MapPin size={14} />
                  Carregou em outro local
                </button>
                {!isInProgress && (
                  <>
                    <button type="button" onClick={() => handleMenuClick(() => onAction(item, 'chegou'))}>
                      <Check size={14} />
                      Chegou
                    </button>
                    <button type="button" onClick={() => handleMenuClick(() => onAction(item, 'carregando'))}>
                      <Loader size={14} />
                      Carregando
                    </button>
                    <button type="button" onClick={() => handleMenuClick(() => onAction(item, 'finalizar'))}>
                      <CheckCircle2 size={14} />
                      Finalizar
                    </button>
                    <button className="menu-danger" type="button" onClick={() => handleMenuClick(() => onAction(item, 'cancelar'))}>
                      <X size={14} />
                      Carga cancelada
                    </button>
                  </>
                )}
              </>
            )}

            {isClosed && canManageQueue && (
              <>
                {canViewAudit && (
                  <button type="button" onClick={() => handleMenuClick(() => onAudit?.(item))}>
                    <History size={14} />
                    Histórico
                  </button>
                )}
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
