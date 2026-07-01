const statusClassMap = {
  Aguardando: 'status-waiting',
  Chamado: 'status-called',
  Carregando: 'status-loading',
  'Não atendeu': 'status-no-answer',
  Finalizado: 'status-done',
  Cancelado: 'status-canceled',
};

export default function StatusBadge({ status }) {
  return <span className={`status-badge ${statusClassMap[status] || 'status-neutral'}`}>{status}</span>;
}
