import { useCallback, useEffect, useMemo, useState } from 'react';
import { LogOut, RefreshCw } from 'lucide-react';
import Filters from '../components/Filters';
import PlacaForm from '../components/PlacaForm';
import PlacasTable from '../components/PlacasTable';
import ReportCards from '../components/ReportCards';
import {
  createPlaca,
  currentTime,
  fetchPlacas,
  fetchTodayReport,
  moveToEnd,
  signOut,
  swapOrder,
  todayISO,
  updatePlaca,
} from '../services/placasService';

const emptyFilters = {
  placa: '',
  motorista: '',
  status: '',
  responsavel: '',
  data: '',
};

export default function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('fila');
  const [items, setItems] = useState([]);
  const [finishedItems, setFinishedItems] = useState([]);
  const [report, setReport] = useState({});
  const [filters, setFilters] = useState(emptyFilters);
  const [finishedFilters, setFinishedFilters] = useState({ data: todayISO() });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [active, finished, dailyReport] = await Promise.all([
        fetchPlacas({ filters }),
        fetchPlacas({ finalizados: true, filters: finishedFilters }),
        fetchTodayReport(),
      ]);
      setItems(active);
      setFinishedItems(finished);
      setReport(dailyReport);
    } catch (err) {
      setError(err.message || 'Não foi possível carregar os dados.');
    } finally {
      setLoading(false);
    }
  }, [filters, finishedFilters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showSuccess = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleCreate = async (payload) => {
    setSaving(true);
    setError('');
    try {
      await createPlaca(payload, user);
      showSuccess('Placa cadastrada no final da fila.');
      await loadData();
    } catch (err) {
      setError(err.message || 'Não foi possível cadastrar a placa.');
    } finally {
      setSaving(false);
    }
  };

  const handleAction = async (item, action) => {
    setBusyId(item.id);
    setError('');
    try {
      const time = currentTime();
      const actionMap = {
        primeira: { primeira_ligacao: time, status: '1ª ligação feita' },
        segunda: { segunda_ligacao: time, status: '2ª ligação feita' },
        terceira: { terceira_ligacao: time, status: '3ª ligação feita' },
        chamado: { status: 'Chamado' },
        chegou: { status: 'Chegou' },
        carregando: { status: 'Carregando' },
        finalizar: { status: 'Finalizado' },
        cancelar: { status: 'Cancelado' },
      };

      if (action === 'nao_atendeu') {
        await updatePlaca(item.id, { status: 'Não atendeu' });
        await moveToEnd(item);
      } else {
        await updatePlaca(item.id, actionMap[action]);
      }

      await loadData();
    } catch (err) {
      setError(err.message || 'Não foi possível atualizar a placa.');
    } finally {
      setBusyId('');
    }
  };

  const handleMove = async (item, index, direction) => {
    setBusyId(item.id);
    setError('');
    try {
      if (direction === 'end') {
        await moveToEnd(item);
      } else {
        const target = direction === 'up' ? items[index - 1] : items[index + 1];
        await swapOrder(item, target);
      }
      await loadData();
    } catch (err) {
      setError(err.message || 'Não foi possível mover a placa.');
    } finally {
      setBusyId('');
    }
  };

  const handleLogout = async () => {
    await signOut();
    onLogout();
  };

  const tableTitle = useMemo(() => (activeTab === 'fila' ? 'Fila atual' : 'Finalizados e cancelados'), [activeTab]);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <span className="eyebrow">CONTROLE DE PLACAS</span>
          <h1>Carregamento</h1>
          <p>{user.email}</p>
        </div>
        <div className="topbar-actions">
          <button className="icon-text secondary" type="button" onClick={loadData} disabled={loading}>
            <RefreshCw size={16} aria-hidden="true" />
            Atualizar
          </button>
          <button className="icon-text danger" type="button" onClick={handleLogout}>
            <LogOut size={16} aria-hidden="true" />
            Sair
          </button>
        </div>
      </header>

      {message && <div className="alert success">{message}</div>}
      {error && <div className="alert error">{error}</div>}

      <ReportCards report={report} />
      <PlacaForm onSubmit={handleCreate} loading={saving} />

      <section className="queue-section">
        <div className="section-heading">
          <h2>{tableTitle}</h2>
          <div className="tabs" role="tablist" aria-label="Telas">
            <button className={activeTab === 'fila' ? 'active' : ''} onClick={() => setActiveTab('fila')} type="button">
              Fila Atual
            </button>
            <button className={activeTab === 'finalizados' ? 'active' : ''} onClick={() => setActiveTab('finalizados')} type="button">
              Finalizados
            </button>
          </div>
        </div>

        {activeTab === 'fila' ? (
          <>
            <Filters filters={filters} onChange={setFilters} onClear={() => setFilters(emptyFilters)} />
            {loading ? <div className="empty-state">Carregando fila...</div> : <PlacasTable items={items} onAction={handleAction} onMove={handleMove} busyId={busyId} />}
          </>
        ) : (
          <>
            <Filters finalizados filters={finishedFilters} onChange={setFinishedFilters} onClear={() => setFinishedFilters({ data: '' })} />
            {loading ? (
              <div className="empty-state">Carregando finalizados...</div>
            ) : (
              <PlacasTable items={finishedItems} finalizados onAction={handleAction} onMove={handleMove} busyId={busyId} />
            )}
          </>
        )}
      </section>
    </main>
  );
}
