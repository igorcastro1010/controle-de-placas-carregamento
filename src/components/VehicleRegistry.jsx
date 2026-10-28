import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { fetchVeiculosMotoristas, formatBodyType, formatDateTime } from '../services/placasService';

const emptyFilters = {
  placa: '',
  motorista: '',
  vehicle_group: '',
};

const pageSizeOptions = [5, 10, 20, 50];

function getSafePage(currentPage, totalItems, pageSize) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  return Math.min(Math.max(1, currentPage), totalPages);
}

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

export default function VehicleRegistry({ refreshSignal = 0 }) {
  const [filters, setFilters] = useState(emptyFilters);
  const [items, setItems] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
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
        const result = await fetchVeiculosMotoristas({ ...filters, page, pageSize });
        if (active) {
          setItems(result.items);
          setTotalItems(result.total);
        }
      } catch (err) {
        console.error('Erro ao carregar cadastro de veículos:', err);
        if (active) setError(err.message || 'Não foi possível carregar o cadastro de veículos.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadVehicles();

    return () => {
      active = false;
    };
  }, [filters, page, pageSize, refreshSignal]);

  useEffect(() => {
    if (window.matchMedia?.('(max-width: 768px)').matches) setPageSize(5);
  }, []);

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = getSafePage(page, totalItems, pageSize);
  const pageItems = items;

  useEffect(() => {
    setPage(1);
  }, [filters.placa, filters.motorista, filters.vehicle_group, pageSize]);

  useEffect(() => {
    const safePage = getSafePage(page, totalItems, pageSize);
    if (page !== safePage) setPage(safePage);
  }, [page, pageSize, totalItems]);

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
      ) : totalItems ? (
        <>
          <div className="vehicle-registry-list">
            {pageItems.map((item) => (
              <VehicleCard key={item.id} item={item} />
            ))}
          </div>
          <div className="pagination-bar vehicle-pagination">
            <span>
              Página {currentPage} de {totalPages} · {totalItems} cadastro{totalItems === 1 ? '' : 's'}
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
