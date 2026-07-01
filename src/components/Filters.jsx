import { Search, X } from 'lucide-react';
import { STATUSES } from '../services/placasService';

export default function Filters({ filters, onChange, onClear, finalizados = false }) {
  const setFilter = (field, value) => onChange({ ...filters, [field]: value });

  return (
    <section className="filters">
      <div className="filter-title">
        <Search size={18} aria-hidden="true" />
        <strong>Filtros</strong>
      </div>
      {!finalizados && (
        <>
          <label>
            Placa
            <input value={filters.placa || ''} onChange={(event) => setFilter('placa', event.target.value)} placeholder="ABC1D23" />
          </label>
          <label>
            Motorista
            <input value={filters.motorista || ''} onChange={(event) => setFilter('motorista', event.target.value)} placeholder="Nome" />
          </label>
          <label>
            Status
            <select value={filters.status || ''} onChange={(event) => setFilter('status', event.target.value)}>
              <option value="">Todos</option>
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label>
            Responsável
            <input value={filters.responsavel || ''} onChange={(event) => setFilter('responsavel', event.target.value)} placeholder="email" />
          </label>
        </>
      )}
      <label>
        Data
        <input type="date" value={filters.data || ''} onChange={(event) => setFilter('data', event.target.value)} />
      </label>
      <button className="icon-text secondary" type="button" onClick={onClear}>
        <X size={16} aria-hidden="true" />
        Limpar
      </button>
    </section>
  );
}
