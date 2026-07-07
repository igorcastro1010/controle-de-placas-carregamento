import { useState } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { STATUSES } from '../services/placasService';

export default function Filters({ filters, onChange, onClear, finalizados = false }) {
  const [showFilters, setShowFilters] = useState(false);
  const setFilter = (field, value) => onChange({ ...filters, [field]: value });
  const activeFilterCount = Object.values(filters || {}).filter((value) => String(value || '').trim()).length;

  return (
    <section className="filter-shell">
      <button className={`filter-toggle-button ${showFilters ? 'open' : ''}`} type="button" onClick={() => setShowFilters((current) => !current)} aria-expanded={showFilters}>
        <span>
          <Search size={18} aria-hidden="true" />
          <strong>{activeFilterCount ? 'Filtros ativos' : 'Filtros'}</strong>
          {activeFilterCount > 0 && <span className="filter-count-badge">{activeFilterCount}</span>}
        </span>
        <ChevronDown size={18} aria-hidden="true" />
      </button>

      {showFilters && (
        <div className="filters">
          <div className="filter-title">
            <Search size={18} aria-hidden="true" />
            <strong>Filtros</strong>
          </div>

          {!finalizados && (
            <>
              <label>
                Placa
                <input value={filters.placa || ''} onChange={(event) => setFilter('placa', event.target.value)} placeholder="Buscar placa" />
              </label>
              <label>
                Motorista
                <input value={filters.motorista || ''} onChange={(event) => setFilter('motorista', event.target.value)} placeholder="Buscar motorista" />
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
                <input value={filters.responsavel || ''} onChange={(event) => setFilter('responsavel', event.target.value)} placeholder="Buscar responsável" />
              </label>
              <label>
                Entrega local
                <select value={filters.entrega_local || ''} onChange={(event) => setFilter('entrega_local', event.target.value)}>
                  <option value="">Todos</option>
                  <option value="sim">Sim</option>
                  <option value="nao">Não</option>
                </select>
              </label>
              <label>
                Prioridade local
                <select value={filters.prioridade_local || ''} onChange={(event) => setFilter('prioridade_local', event.target.value)}>
                  <option value="">Todos</option>
                  <option value="sim">Sim</option>
                  <option value="nao">Não</option>
                </select>
              </label>
            </>
          )}

          {finalizados && (
            <label className="wide-filter">
              Placa ou motorista
              <input value={filters.busca || ''} onChange={(event) => setFilter('busca', event.target.value)} placeholder="Digite a placa ou nome" />
            </label>
          )}

          <label>
            Data
            <input type="date" value={filters.data || ''} onChange={(event) => setFilter('data', event.target.value)} />
          </label>

          <button className="icon-text secondary" type="button" onClick={onClear}>
            <X size={16} aria-hidden="true" />
            Limpar filtros
          </button>
        </div>
      )}
    </section>
  );
}
