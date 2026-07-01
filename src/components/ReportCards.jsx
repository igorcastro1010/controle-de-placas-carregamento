import { CheckCircle2, Clock, Megaphone, PackageOpen, PhoneOff, Truck, XCircle } from 'lucide-react';

export const reportCards = [
  { key: 'total', label: 'Cadastradas hoje', icon: Truck, className: 'accent-total', defaultToday: true },
  { key: 'Aguardando', label: 'Aguardando', icon: Clock, className: 'accent-waiting', status: 'Aguardando' },
  { key: 'Chamado', label: 'Chamado', icon: Megaphone, className: 'accent-called', status: 'Chamado' },
  { key: 'Carregando', label: 'Carregando', icon: PackageOpen, className: 'accent-loading', status: 'Carregando' },
  { key: 'Finalizado', label: 'Finalizado', icon: CheckCircle2, className: 'accent-done', status: 'Finalizado', defaultToday: true },
  { key: 'Não atendeu', label: 'Não atendeu', icon: PhoneOff, className: 'accent-no-answer', status: 'Não atendeu' },
  { key: 'Cancelado', label: 'Cancelado', icon: XCircle, className: 'accent-canceled', status: 'Cancelado', defaultToday: true },
];

export default function ReportCards({ report, activeKey, onSelect }) {
  return (
    <section className="report-grid" aria-label="Relatório do dia">
      {reportCards.map(({ key, label, icon: Icon, className, status, defaultToday }) => (
        <button
          className={`report-card ${className} ${activeKey === key ? 'active' : ''}`}
          key={key}
          type="button"
          onClick={() => onSelect?.({ key, label, status, defaultToday })}
        >
          <div>
            <span>{label}</span>
            <strong>{report?.[key] || 0}</strong>
          </div>
          <Icon size={22} aria-hidden="true" />
        </button>
      ))}
    </section>
  );
}
