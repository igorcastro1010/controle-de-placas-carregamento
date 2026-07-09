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

export default function StatusBadge({ status }) {
  return <span className={`status-badge ${statusClassMap[normalizeStatus(status)] || 'status-neutral'}`}>{status}</span>;
}
