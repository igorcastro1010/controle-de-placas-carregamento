import { CheckCircle2, Clock, MapPin, Megaphone, PackageCheck, PackageOpen, PhoneOff, Truck, XCircle } from 'lucide-react';

export const reportCards = [
  { key: 'total', label: 'Cadastros hoje', group: 'Fila de Chamada', icon: Truck, className: 'accent-total', defaultToday: true },
  { key: 'Aguardando', label: 'Aguardando', group: 'Fila de Chamada', icon: Clock, className: 'accent-waiting', status: 'Aguardando' },
  { key: 'Chamado', label: 'Chamado', group: 'Em Andamento', icon: Megaphone, className: 'accent-called', status: 'Chamado' },
  { key: 'Chegou', label: 'Chegou', group: 'Em Andamento', icon: PackageCheck, className: 'accent-arrived', status: 'Chegou' },
  { key: 'Carregando', label: 'Carregando', group: 'Em Andamento', icon: PackageOpen, className: 'accent-loading', status: 'Carregando' },
  { key: 'Finalizado', label: 'Finalizado', group: 'Encerrados', icon: CheckCircle2, className: 'accent-done', status: 'Finalizado' },
  { key: 'Carregado em outro local', label: 'Outro local', group: 'Encerrados', icon: MapPin, className: 'accent-other-location', status: 'Carregado em outro local' },
  { key: 'Não atendeu', label: 'Não atendeu', group: 'Fila de Chamada', icon: PhoneOff, className: 'accent-no-answer', status: 'Não atendeu' },
  { key: 'Cancelado', label: 'Cancelado', group: 'Encerrados', icon: XCircle, className: 'accent-canceled', status: 'Cancelado' },
];

export default function ReportCards({ report, activeKey, onSelect }) {
  return (
    <section className="report-grid" aria-label="Relatório do dia">
      {reportCards.map(({ key, label, group, icon: Icon, className, status, defaultToday }) => (
        <button className={`report-card ${className} ${activeKey === key ? 'active' : ''}`} key={key} type="button" onClick={() => onSelect?.({ key, label, status, defaultToday })}>
          <div>
            <small>{group}</small>
            <span>{label}</span>
            <strong>{report?.[key] || 0}</strong>
          </div>
          <Icon size={22} aria-hidden="true" />
        </button>
      ))}
    </section>
  );
}
