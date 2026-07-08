import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { fetchVeiculosMotoristas, formatBodyType, formatDateTime } from '../services/placasService';

const emptyFilters = {
  placa: '',
  motorista: '',
};

function VehicleCard({ item }) {
  return (
    <article className="vehicle-registry-card">
      <header>
        <div>
          <span className="eyebrow">{item.tipo_veiculo || 'Truck'}</span>
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
        <button className="icon-text secondary" type="button" onClick={() => setFilters(emptyFilters)}>
          <X size={16} aria-hidden="true" />
          Limpar filtros
        </button>
      </div>

      {error && <div className="alert error">{error}</div>}
      {loading ? (
        <div className="empty-state">Carregando cadastro de veículos...</div>
      ) : items.length ? (
        <div className="vehicle-registry-list">
          {items.map((item) => (
            <VehicleCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="empty-state">Nenhum cadastro encontrado.</div>
      )}
    </section>
  );
}
