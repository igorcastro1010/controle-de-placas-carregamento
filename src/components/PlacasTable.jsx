import {
  ArrowDown,
  ArrowDownToLine,
  ArrowUp,
  Check,
  Loader,
  Megaphone,
  Phone,
  PhoneOff,
  X,
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import { formatDate, formatTime } from '../services/placasService';

const columns = [
  'ordem',
  'data',
  'hora',
  'placa',
  'motorista',
  'telefone',
  'rota_1',
  'rota_2',
  'rota_3',
  'primeira_ligacao',
  'segunda_ligacao',
  'terceira_ligacao',
  'status',
  'responsavel',
  'ocorrido',
  'ações',
];

export default function PlacasTable({ items, onAction, onMove, finalizados = false, busyId }) {
  if (!items.length) {
    return <div className="empty-state">Nenhum registro encontrado.</div>;
  }

  return (
    <div className="table-shell">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={item.id}>
              <td data-label="ordem">
                <strong>{item.ordem}</strong>
              </td>
              <td data-label="data">{formatDate(item.data)}</td>
              <td data-label="hora">{formatTime(item.hora)}</td>
              <td data-label="placa">
                <strong className="plate">{item.placa}</strong>
              </td>
              <td data-label="motorista">{item.motorista}</td>
              <td data-label="telefone">{item.telefone || '-'}</td>
              <td data-label="rota_1">{item.rota_1 || '-'}</td>
              <td data-label="rota_2">{item.rota_2 || '-'}</td>
              <td data-label="rota_3">{item.rota_3 || '-'}</td>
              <td data-label="primeira_ligacao">{formatTime(item.primeira_ligacao)}</td>
              <td data-label="segunda_ligacao">{formatTime(item.segunda_ligacao)}</td>
              <td data-label="terceira_ligacao">{formatTime(item.terceira_ligacao)}</td>
              <td data-label="status">
                <StatusBadge status={item.status} />
              </td>
              <td data-label="responsavel">{item.responsavel_email || '-'}</td>
              <td data-label="ocorrido" className="notes-cell">
                {item.ocorrido || '-'}
              </td>
              <td data-label="ações">
                {finalizados ? (
                  <span className="muted">Encerrado</span>
                ) : (
                  <div className="actions-grid">
                    <button title="1ª ligação" disabled={busyId === item.id} onClick={() => onAction(item, 'primeira')}>
                      <Phone size={15} />
                      1ª
                    </button>
                    <button title="2ª ligação" disabled={busyId === item.id} onClick={() => onAction(item, 'segunda')}>
                      <Phone size={15} />
                      2ª
                    </button>
                    <button title="3ª ligação" disabled={busyId === item.id} onClick={() => onAction(item, 'terceira')}>
                      <Phone size={15} />
                      3ª
                    </button>
                    <button title="Não atendeu" disabled={busyId === item.id} onClick={() => onAction(item, 'nao_atendeu')}>
                      <PhoneOff size={15} />
                      Não atendeu
                    </button>
                    <button title="Chamado" disabled={busyId === item.id} onClick={() => onAction(item, 'chamado')}>
                      <Megaphone size={15} />
                      Chamado
                    </button>
                    <button title="Chegou" disabled={busyId === item.id} onClick={() => onAction(item, 'chegou')}>
                      <Check size={15} />
                      Chegou
                    </button>
                    <button title="Carregando" disabled={busyId === item.id} onClick={() => onAction(item, 'carregando')}>
                      <Loader size={15} />
                      Carregando
                    </button>
                    <button title="Finalizar" disabled={busyId === item.id} onClick={() => onAction(item, 'finalizar')}>
                      <Check size={15} />
                      Finalizar
                    </button>
                    <button title="Cancelar" disabled={busyId === item.id} onClick={() => onAction(item, 'cancelar')}>
                      <X size={15} />
                      Cancelar
                    </button>
                    <button title="Subir" disabled={index === 0 || busyId === item.id} onClick={() => onMove(item, index, 'up')}>
                      <ArrowUp size={15} />
                      Subir
                    </button>
                    <button title="Descer" disabled={index === items.length - 1 || busyId === item.id} onClick={() => onMove(item, index, 'down')}>
                      <ArrowDown size={15} />
                      Descer
                    </button>
                    <button title="Mandar para o fim" disabled={busyId === item.id} onClick={() => onMove(item, index, 'end')}>
                      <ArrowDownToLine size={15} />
                      Fim
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
