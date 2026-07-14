const normalizeStatus = (status) =>
  String(status || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const statusClassMap = {
  aguardando: 'status-waiting',
  chamado: 'status-called',
  chegou: 'status-arrived',
  carregando: 'status-loading',
  'nao atendeu': 'status-no-answer',
  finalizado: 'status-done',
  cancelado: 'status-canceled',
  'carregado em outro local': 'status-other-location',
};

const legacyCallStatuses = ['1ª ligação feita', '2ª ligação feita', '3ª ligação feita'];
const displayStatus = (status) => (legacyCallStatuses.some((item) => normalizeStatus(item) === normalizeStatus(status)) ? 'Aguardando' : status);

export default function StatusBadge({ status }) {
  const visibleStatus = displayStatus(status);
  return <span className={`status-badge ${statusClassMap[normalizeStatus(visibleStatus)] || 'status-neutral'}`}>{visibleStatus}</span>;
}
