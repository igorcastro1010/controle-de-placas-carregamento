import { useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { fetchVeiculosMotoristas, formatBodyType, formatDateTime, matchesVehicleGroup } from '../services/placasService';

const emptyFilters = {
  placa: '',
  motorista: '',
  vehicle_group: '',
};

const pageSizeOptions = [5, 10, 20, 50];

function VehicleCard({ item }) {
  return (
    <article className="vehicle-registry-card">
      <header>
        <div>
          <span className="eyebrow">
            {item.tipo_veiculo || 'Truck'}
            {item.tipo_veiculo === 'Carreta' ? ` | ${formatBodyType(item.tipo_carroceria || item.carroceria)}` : ''}
          </span>
          <h3>{item.placa || '-'}</h3>
          {item.tipo_veiculo === 'Carreta' && (
            <small>
              Cavalo: {item.placa_cavalo || '-'} | Carreta: {item.placa_carreta || '-'}
            </small>
          )}
        </div>
        <span className="registry-last-use">Último uso: {formatDateTime(item.ultimo_uso_em)}</span>
      </header>

      <div className="vehicle-registry-grid">
        <div>
          <span>Motorista</span>
          <strong>{item.motorista || '-'}</strong>
        </div>
        <div>
          <span>Telefone</span>
          <strong>{item.telefone || '-'}</strong>
        </div>
        <div>
          <span>Carroceria</span>
          <strong>{formatBodyType(item.tipo_carroceria)}</strong>
        </div>
        <div>
          <span>Rotas</span>
          <strong>{[item.rota_1, item.rota_2, item.rota_3].filter(Boolean).join(' | ') || '-'}</strong>
        </div>
        <div>
          <span>Atualizado por</span>
          <strong>{item.atualizado_por || item.criado_por || '-'}</strong>
        </div>
      </div>
    </article>
  );
}

export default function VehicleRegistry() {
  const [filters, setFilters] = useState(emptyFilters);
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadVehicles() {
      setLoading(true);
      setError('');
      try {
        const data = await fetchVeiculosMotoristas(filters);
        if (active) setItems(data);
      } catch (err) {
        if (active) setError(err.message || 'Não foi possível carregar o cadastro de veículos.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadVehicles();

    return () => {
      active = false;
    };
  }, [filters]);

  useEffect(() => {
    if (window.matchMedia?.('(max-width: 768px)').matches) setPageSize(5);
  }, []);

  const filteredItems = useMemo(() => items.filter((item) => matchesVehicleGroup(item, filters.vehicle_group)), [filters.vehicle_group, items]);
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStartIndex = (currentPage - 1) * pageSize;
  const pageItems = filteredItems.slice(pageStartIndex, pageStartIndex + pageSize);

  useEffect(() => {
    setPage(1);
  }, [filters.placa, filters.motorista, filters.vehicle_group, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const setFilter = (field, value) => setFilters((current) => ({ ...current, [field]: value }));

  return (
    <section className="vehicle-registry">
      <div className="vehicle-registry-filters">
        <div className="filter-title">
          <Search size={18} aria-hidden="true" />
          <strong>Buscar cadastro salvo</strong>
        </div>
        <label>
          Placa
          <input value={filters.placa} onChange={(event) => setFilter('placa', event.target.value)} placeholder="Buscar placa" />
        </label>
        <label>
          Motorista
          <input value={filters.motorista} onChange={(event) => setFilter('motorista', event.target.value)} placeholder="Buscar motorista" />
        </label>
        <label>
          Tipo/carroceria
          <select value={filters.vehicle_group} onChange={(event) => setFilter('vehicle_group', event.target.value)}>
            <option value="">Todos</option>
            <option value="truck">Truck</option>
            <option value="carreta_bau">Carreta Baú</option>
            <option value="carreta_sider">Carreta Sider</option>
          </select>
        </label>
        <button className="icon-text secondary" type="button" onClick={() => setFilters(emptyFilters)}>
          <X size={16} aria-hidden="true" />
          Limpar filtros
        </button>
      </div>

      {error && <div className="alert error">{error}</div>}
      {loading ? (
        <div className="empty-state">Carregando cadastro de veículos...</div>
      ) : filteredItems.length ? (
        <>
          <div className="vehicle-registry-list">
            {pageItems.map((item) => (
              <VehicleCard key={item.id} item={item} />
            ))}
          </div>
          <div className="pagination-bar vehicle-pagination">
            <span>
              Página {currentPage} de {totalPages} · {filteredItems.length} cadastro{filteredItems.length === 1 ? '' : 's'}
            </span>
            <label className="pagination-size">
              Mostrar
              <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
                {pageSizeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option} por página
                  </option>
                ))}
              </select>
            </label>
            <div className="pagination-actions">
              <button className="pagination-button" type="button" disabled={currentPage === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                Anterior
              </button>
              <button className="pagination-button" type="button" disabled={currentPage === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>
                Próxima
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="empty-state">Nenhum cadastro encontrado.</div>
      )}
    </section>
  );
}
