import { PhoneOff, Truck, CheckCircle2, Clock, Megaphone, PackageOpen, XCircle } from 'lucide-react';

const cards = [
  { key: 'total', label: 'Cadastradas hoje', icon: Truck, className: 'accent-total' },
  { key: 'Aguardando', label: 'Aguardando', icon: Clock, className: 'accent-waiting' },
  { key: 'Chamado', label: 'Chamado', icon: Megaphone, className: 'accent-called' },
  { key: 'Carregando', label: 'Carregando', icon: PackageOpen, className: 'accent-loading' },
  { key: 'Finalizado', label: 'Finalizado', icon: CheckCircle2, className: 'accent-done' },
  { key: 'Não atendeu', label: 'Não atendeu', icon: PhoneOff, className: 'accent-no-answer' },
  { key: 'Cancelado', label: 'Cancelado', icon: XCircle, className: 'accent-canceled' },
];

export default function ReportCards({ report }) {
  return (
    <section className="report-grid" aria-label="Relatório do dia">
      {cards.map(({ key, label, icon: Icon, className }) => (
        <article className={`report-card ${className}`} key={key}>
          <div>
            <span>{label}</span>
            <strong>{report?.[key] || 0}</strong>
          </div>
          <Icon size={22} aria-hidden="true" />
        </article>
      ))}
    </section>
  );
}
