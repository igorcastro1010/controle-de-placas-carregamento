import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Filter, RefreshCw } from 'lucide-react';
import {
  REPORT_STATUSES,
  STATUSES,
  fetchPeriodReport,
  formatBodyType,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatTime,
  normalizeStatus,
  todayISO,
} from '../services/placasService';
import StatusBadge from './StatusBadge';

const initialFilters = {
  start: todayISO(),
  end: todayISO(),
  status: '',
  tipo_veiculo: '',
  search: '',
  responsavel: '',
  entrega_local: '',
  prioridade_local: '',
};

function ReportMetric({ label, value }) {
  return (
    <article className="period-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function DetailLine({ label, value }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value || '-'}</strong>
    </div>
  );
}

export default function PeriodReport({ refreshSignal = 0 }) {
  const [filters, setFilters] = useState(initialFilters);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const loadReport = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchPeriodReport(filters);
      setItems(data);
    } catch (err) {
      setError(err.message || 'Não foi possível carregar o relatório.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, refreshSignal]);

  const summary = useMemo(() => {
    const statusCounts = REPORT_STATUSES.reduce((acc, status) => {
      acc[status] = 0;
      return acc;
    }, {});

    const vehicleCounts = { Truck: 0, Carreta: 0 };

    items.forEach((item) => {
      const reportStatus = REPORT_STATUSES.find((status) => normalizeStatus(status) === normalizeStatus(item.status));
      if (reportStatus) statusCounts[reportStatus] += 1;
      if (item.tipo_veiculo === 'Carreta') vehicleCounts.Carreta += 1;
      else vehicleCounts.Truck += 1;
    });

    const localCounts = items.reduce(
      (acc, item) => {
        if (item.entrega_local) acc.entregaLocal += 1;
        if (item.prioridade_local) acc.prioridadeLocal += 1;
        return acc;
      },
      { entregaLocal: 0, prioridadeLocal: 0 }
    );

    return { statusCounts, vehicleCounts, localCounts, total: items.length };
  }, [items]);

  const updateFilter = (field, value) => setFilters((current) => ({ ...current, [field]: value }));
  const clearFilters = () => setFilters(initialFilters);
  const activeFilterCount = Object.entries(filters).filter(([field, value]) => {
    const defaultValue = initialFilters[field];
    return String(value || '') !== String(defaultValue || '');
  }).length;

  return (
    <section className="period-report">
      <div className="filter-shell">
        <button className={`filter-toggle-button ${showFilters ? 'open' : ''}`} type="button" onClick={() => setShowFilters((current) => !current)} aria-expanded={showFilters}>
          <span>
            <Filter size={18} aria-hidden="true" />
            <strong>{activeFilterCount ? 'Filtros ativos' : 'Filtros'}</strong>
            {activeFilterCount > 0 && <span className="filter-count-badge">{activeFilterCount}</span>}
          </span>
          <ChevronDown size={18} aria-hidden="true" />
        </button>

        {showFilters && (
          <div className="period-filter-panel">
            <div className="filter-title">
              <Filter size={18} aria-hidden="true" />
              <strong>Filtros</strong>
            </div>
            <label>
              Data inicial
              <input type="date" value={filters.start} onChange={(event) => updateFilter('start', event.target.value)} />
            </label>
            <label>
              Data final
              <input type="date" value={filters.end} onChange={(event) => updateFilter('end', event.target.value)} />
            </label>
            <label>
              Status
              <select value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}>
                <option value="">Todos</option>
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Tipo de veículo
              <select value={filters.tipo_veiculo} onChange={(event) => updateFilter('tipo_veiculo', event.target.value)}>
                <option value="">Todos</option>
                <option value="Truck">Truck</option>
                <option value="Carreta">Carreta</option>
              </select>
            </label>
            <label>
              Placa ou motorista
              <input value={filters.search} onChange={(event) => updateFilter('search', event.target.value)} placeholder="Digite a placa ou nome" />
            </label>
            <label>
              Responsável
              <input value={filters.responsavel} onChange={(event) => updateFilter('responsavel', event.target.value)} placeholder="Buscar responsável" />
            </label>
            <label>
              Entrega local
              <select value={filters.entrega_local} onChange={(event) => updateFilter('entrega_local', event.target.value)}>
                <option value="">Todos</option>
                <option value="sim">Sim</option>
                <option value="nao">Não</option>
              </select>
            </label>
            <label>
              Prioridade local
              <select value={filters.prioridade_local} onChange={(event) => updateFilter('prioridade_local', event.target.value)}>
                <option value="">Todos</option>
                <option value="sim">Sim</option>
                <option value="nao">Não</option>
              </select>
            </label>
            <button className="icon-text secondary" type="button" onClick={clearFilters}>
              Limpar filtros
            </button>
          </div>
        )}
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="period-summary-grid">
        <ReportMetric label="Total no período" value={summary.total} />
        {REPORT_STATUSES.map((status) => (
          <ReportMetric key={status} label={status} value={summary.statusCounts[status] || 0} />
        ))}
        <ReportMetric label="Truck" value={summary.vehicleCounts.Truck} />
        <ReportMetric label="Carreta" value={summary.vehicleCounts.Carreta} />
        <ReportMetric label="Total entrega local" value={summary.localCounts.entregaLocal} />
        <ReportMetric label="Total prioridade local" value={summary.localCounts.prioridadeLocal} />
      </div>

      <div className="period-list-header">
        <div>
          <h3>Registros do período</h3>
          <p>{loading ? 'Carregando...' : `${items.length} registro${items.length === 1 ? '' : 's'} encontrado${items.length === 1 ? '' : 's'}`}</p>
        </div>
        <button className="icon-text secondary" type="button" onClick={loadReport} disabled={loading}>
          <RefreshCw size={16} aria-hidden="true" />
          Atualizar
        </button>
      </div>

      {loading ? (
        <div className="empty-state">Carregando relatório...</div>
      ) : items.length ? (
        <div className="period-record-list">
          {items.map((item, index) => (
            <article className="period-record-card" key={item.id}>
              <header>
                <div>
                  <span className="queue-order">#{index + 1}</span>
                  <h4>{item.placa || '-'}</h4>
                  <small>
                    {item.tipo_veiculo || 'Truck'}
                    {' | '}
                    {formatBodyType(item.tipo_carroceria)}
                    {item.tipo_veiculo === 'Carreta' ? ` | Cavalo: ${item.placa_cavalo || '-'} | Carreta: ${item.placa_carreta || '-'}` : ` | Placa: ${item.placa || '-'}`}
                  </small>
                  {(item.entrega_local || item.prioridade_local || item.retorno_local) && (
                    <span className="local-badge-row">
                      {item.entrega_local && <span className="local-badge">Entrega local</span>}
                      {(item.prioridade_local || item.retorno_local) && <span className="local-badge priority">Prioridade local</span>}
                    </span>
                  )}
                </div>
                <StatusBadge status={item.status} />
              </header>
              <div className="period-record-grid">
                <DetailLine label="Motorista" value={item.motorista} />
                <DetailLine label="Telefone" value={item.telefone} />
                <DetailLine label="Data/Hora" value={`${formatDate(item.data)} - ${formatTime(item.hora)}`} />
                <DetailLine label="Rotas" value={[item.rota_1, item.rota_2, item.rota_3].filter(Boolean).join(' | ')} />
                <DetailLine
                  label="Frete"
                  value={[item.cidade_destino ? `Cidade: ${item.cidade_destino}` : '', item.valor_frete_carreteiro ? `Valor: ${formatCurrency(item.valor_frete_carreteiro)}` : ''].filter(Boolean).join(' | ')}
                />
                <DetailLine label="Ligações" value={`1ª ${formatTime(item.primeira_ligacao)} | 2ª ${formatTime(item.segunda_ligacao)} | 3ª ${formatTime(item.terceira_ligacao)}`} />
                <DetailLine label="Responsável" value={item.responsavel_email || item.responsavel} />
                <DetailLine label="Finalizado por" value={item.finalizado_por} />
                <DetailLine label="Finalizado em" value={formatDateTime(item.finalizado_em)} />
                <DetailLine label="Cancelado por" value={item.cancelado_por} />
                <DetailLine label="Cancelado em" value={formatDateTime(item.cancelado_em)} />
                {item.ocorrido && <DetailLine label="Ocorrido" value={item.ocorrido} />}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">Nenhum registro encontrado para os filtros selecionados.</div>
      )}
    </section>
  );
}
