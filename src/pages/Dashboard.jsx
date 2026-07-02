import { useCallback, useEffect, useMemo, useState } from 'react';
import { LogOut, RefreshCw } from 'lucide-react';
import DetailsModal from '../components/DetailsModal';
import Filters from '../components/Filters';
import PlacaForm from '../components/PlacaForm';
import PlacasTable from '../components/PlacasTable';
import ReportCards from '../components/ReportCards';
import {
  AUDIT_VIEWERS,
  createPlaca,
  currentTime,
  fetchPlacas,
  fetchReportDetails,
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

const emptyFinishedFilters = {
  data: todayISO(),
  busca: '',
};

export default function Dashboard({ user, onLogout }) {
  const canViewAudit = AUDIT_VIEWERS.includes(user.email?.toLowerCase());
  const [activeTab, setActiveTab] = useState('fila');
  const [items, setItems] = useState([]);
  const [finishedItems, setFinishedItems] = useState([]);
  const [report, setReport] = useState({});
  const [filters, setFilters] = useState(emptyFilters);
  const [finishedFilters, setFinishedFilters] = useState(emptyFinishedFilters);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [selectedReportCard, setSelectedReportCard] = useState(null);
  const [detailsDate, setDetailsDate] = useState('');
  const [detailsSearch, setDetailsSearch] = useState('');
  const [detailsItems, setDetailsItems] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');

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

  const loadReportDetails = useCallback(async () => {
    if (!selectedReportCard) return;

    setDetailsLoading(true);
    setDetailsError('');
    try {
      const data = await fetchReportDetails({
        status: selectedReportCard.status,
        date: detailsDate,
        search: detailsSearch,
      });
      setDetailsItems(data);
    } catch (err) {
      setDetailsError(err.message || 'Não foi possível carregar os detalhes.');
    } finally {
      setDetailsLoading(false);
    }
  }, [detailsDate, detailsSearch, selectedReportCard]);

  useEffect(() => {
    loadReportDetails();
  }, [loadReportDetails]);

  const showSuccess = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleSelectReportCard = (card) => {
    setSelectedReportCard(card);
    setDetailsDate(card.defaultToday ? todayISO() : '');
    setDetailsSearch('');
    setDetailsItems([]);
    setDetailsError('');
  };

  const handleCloseReportDetails = () => {
    setSelectedReportCard(null);
    setDetailsDate('');
    setDetailsSearch('');
    setDetailsItems([]);
    setDetailsError('');
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
        finalizar: { status: 'Finalizado', finalizado_por: user.email, finalizado_em: new Date().toISOString() },
        cancelar: { status: 'Cancelado', cancelado_por: user.email, cancelado_em: new Date().toISOString() },
      };

      if (action === 'nao_atendeu') {
        await updatePlaca(item.id, { status: 'Não atendeu' });
        await moveToEnd(item);
      } else {
        await updatePlaca(item.id, actionMap[action]);
      }

      await loadData();
      if (selectedReportCard) await loadReportDetails();
    } catch (err) {
      setError(err.message || 'Não foi possível atualizar a placa.');
    } finally {
      setBusyId('');
    }
  };

  const handleMove = async (item, index, direction, sourceItems = items) => {
    setBusyId(item.id);
    setError('');
    try {
      if (direction === 'end') {
        await moveToEnd(item);
      } else {
        const target = direction === 'up' ? sourceItems[index - 1] : sourceItems[index + 1];
        if (!target) return;
        await swapOrder(item, target);
      }
      await loadData();
      if (selectedReportCard) await loadReportDetails();
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
        <div className="topbar-brand">
          <div>
            <span className="eyebrow">CONTROLE DE PLACAS</span>
            <h1>Controle de Placas - Carregamento</h1>
            <p>{user.email}</p>
          </div>
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

      <ReportCards report={report} activeKey={selectedReportCard?.key} onSelect={handleSelectReportCard} />
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
            <Filters finalizados filters={finishedFilters} onChange={setFinishedFilters} onClear={() => setFinishedFilters({ data: '', busca: '' })} />
            {loading ? (
              <div className="empty-state">Carregando finalizados...</div>
            ) : (
              <PlacasTable items={finishedItems} finalizados canViewAudit={canViewAudit} onAction={handleAction} onMove={handleMove} busyId={busyId} />
            )}
          </>
        )}
      </section>

      <DetailsModal
        card={selectedReportCard}
        date={detailsDate}
        search={detailsSearch}
        items={detailsItems}
        loading={detailsLoading}
        error={detailsError}
        canViewAudit={canViewAudit}
        busyId={busyId}
        onAction={handleAction}
        onMove={handleMove}
        onDateChange={setDetailsDate}
        onSearchChange={setDetailsSearch}
        onClearFilters={() => {
          setDetailsDate('');
          setDetailsSearch('');
        }}
        onClose={handleCloseReportDetails}
      />
    </main>
  );
}
