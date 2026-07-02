import { useCallback, useEffect, useMemo, useState } from 'react';
import { LogOut, RefreshCw } from 'lucide-react';
import AuditHistoryModal from '../components/AuditHistoryModal';
import CancelPlacaModal from '../components/CancelPlacaModal';
import DetailsModal from '../components/DetailsModal';
import EditPlacaModal from '../components/EditPlacaModal';
import Filters from '../components/Filters';
import PlacaForm from '../components/PlacaForm';
import PlacasTable from '../components/PlacasTable';
import ReportCards from '../components/ReportCards';
import {
  AUDIT_VIEWERS,
  createPlaca,
  currentTime,
  fetchAuditoriaPlaca,
  fetchPlacas,
  fetchReportDetails,
  fetchTodayReport,
  moveToEnd,
  registrarAuditoria,
  signOut,
  swapOrder,
  todayISO,
  updatePlaca,
  updatePlacaCadastro,
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
  const [editingItem, setEditingItem] = useState(null);
  const [editError, setEditError] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [cancelingItem, setCancelingItem] = useState(null);
  const [cancelSaving, setCancelSaving] = useState(false);
  const [auditItem, setAuditItem] = useState(null);
  const [auditEntries, setAuditEntries] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState('');

  const safeRegisterAudit = useCallback(
    async (payload) => {
      try {
        await registrarAuditoria(user, payload);
      } catch (err) {
        console.error('Não foi possível registrar auditoria.', err);
      }
    },
    [user]
  );

  const describeCadastroChanges = (before, after) => {
    const labels = {
      tipo_veiculo: 'Tipo de veículo',
      placa: 'Placa',
      placa_cavalo: 'Placa do cavalo',
      placa_carreta: 'Placa da carreta',
      motorista: 'Motorista',
      telefone: 'Telefone',
      rota_1: 'Rota 1',
      rota_2: 'Rota 2',
      rota_3: 'Rota 3',
      ocorrido: 'Ocorrido',
    };

    return Object.entries(labels)
      .filter(([field]) => String(before?.[field] || '') !== String(after?.[field] || ''))
      .map(([field, label]) => `${label} alterado de "${before?.[field] || '-'}" para "${after?.[field] || '-'}"`)
      .join('; ');
  };

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
      const created = await createPlaca(payload, user);
      await safeRegisterAudit({
        placaId: created.id,
        acao: 'Cadastro',
        statusNovo: created.status,
        ordemNova: created.ordem,
        detalhes: 'Placa cadastrada no sistema.',
      });
      showSuccess('Placa cadastrada no final da fila.');
      await loadData();
      return true;
    } catch (err) {
      setError(err.message || 'Não foi possível cadastrar a placa.');
      return false;
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
        const moved = await moveToEnd(item);
        await safeRegisterAudit({
          placaId: item.id,
          acao: 'Não atendeu',
          statusAnterior: item.status,
          statusNovo: 'Não atendeu',
          ordemAnterior: item.ordem,
          ordemNova: moved.ordem,
        });
      } else if (action === 'cancelar') {
        setCancelingItem(item);
      } else {
        const updated = await updatePlaca(item.id, actionMap[action]);
        const auditActionMap = {
          primeira: '1ª ligação',
          segunda: '2ª ligação',
          terceira: '3ª ligação',
          chamado: 'Chamado',
          chegou: 'Chegou',
          carregando: 'Carregando',
          finalizar: 'Finalizado',
        };
        await safeRegisterAudit({
          placaId: item.id,
          acao: auditActionMap[action],
          statusAnterior: item.status,
          statusNovo: updated.status,
          ordemAnterior: item.ordem,
          ordemNova: updated.ordem,
        });
      }

      if (action !== 'cancelar') {
        await loadData();
        if (selectedReportCard) await loadReportDetails();
      }
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
        const moved = await moveToEnd(item);
        await safeRegisterAudit({
          placaId: item.id,
          acao: 'Movido para o fim',
          statusAnterior: item.status,
          statusNovo: moved.status,
          ordemAnterior: item.ordem,
          ordemNova: moved.ordem,
        });
      } else {
        const target = direction === 'up' ? sourceItems[index - 1] : sourceItems[index + 1];
        if (!target) return;
        await swapOrder(item, target);
        await safeRegisterAudit({
          placaId: item.id,
          acao: direction === 'up' ? 'Subiu posição' : 'Desceu posição',
          statusAnterior: item.status,
          statusNovo: item.status,
          ordemAnterior: item.ordem,
          ordemNova: target.ordem,
          detalhes: `Trocou posição com ${target.placa}.`,
        });
      }
      await loadData();
      if (selectedReportCard) await loadReportDetails();
    } catch (err) {
      setError(err.message || 'Não foi possível mover a placa.');
    } finally {
      setBusyId('');
    }
  };

  const handleEdit = (item) => {
    setEditError('');
    setEditingItem(item);
  };

  const handleSaveEdit = async (id, payload) => {
    setEditSaving(true);
    setEditError('');
    try {
      const original = editingItem;
      const updated = await updatePlacaCadastro(id, payload);
      await safeRegisterAudit({
        placaId: id,
        acao: 'Edição',
        statusAnterior: original?.status,
        statusNovo: updated.status,
        ordemAnterior: original?.ordem,
        ordemNova: updated.ordem,
        detalhes: describeCadastroChanges(original, updated) || 'Cadastro revisado sem alteração detectada nos campos principais.',
      });
      showSuccess('Cadastro atualizado com sucesso.');
      setEditingItem(null);
      await loadData();
      if (selectedReportCard) await loadReportDetails();
      return true;
    } catch (err) {
      setEditError(err.message || 'Não foi possível atualizar o cadastro.');
      return false;
    } finally {
      setEditSaving(false);
    }
  };

  const handleConfirmCancel = async (item, reason) => {
    setCancelSaving(true);
    setError('');
    try {
      const cancelNote = `[Cancelamento] ${reason}`;
      const ocorrido = item.ocorrido ? `${item.ocorrido}\n${cancelNote}` : cancelNote;
      const updated = await updatePlaca(item.id, {
        status: 'Cancelado',
        cancelado_por: user.email,
        cancelado_em: new Date().toISOString(),
        ocorrido,
      });
      await safeRegisterAudit({
        placaId: item.id,
        acao: 'Cancelado',
        statusAnterior: item.status,
        statusNovo: 'Cancelado',
        ordemAnterior: item.ordem,
        ordemNova: updated.ordem,
        detalhes: `Motivo: ${reason}`,
      });
      setCancelingItem(null);
      await loadData();
      if (selectedReportCard) await loadReportDetails();
    } catch (err) {
      setError(err.message || 'Não foi possível cancelar a marcação.');
    } finally {
      setCancelSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    onLogout();
  };

  const handleOpenAudit = async (item) => {
    setAuditItem(item);
    setAuditEntries([]);
    setAuditError('');
    setAuditLoading(true);
    try {
      const data = await fetchAuditoriaPlaca(item.id);
      setAuditEntries(data);
    } catch (err) {
      setAuditError(err.message || 'Não foi possível carregar a auditoria.');
    } finally {
      setAuditLoading(false);
    }
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
            {loading ? (
              <div className="empty-state">Carregando fila...</div>
            ) : (
              <PlacasTable items={items} onAction={handleAction} onMove={handleMove} onEdit={handleEdit} onAudit={handleOpenAudit} busyId={busyId} canViewAudit={canViewAudit} />
            )}
          </>
        ) : (
          <>
            <Filters finalizados filters={finishedFilters} onChange={setFinishedFilters} onClear={() => setFinishedFilters({ data: '', busca: '' })} />
            {loading ? (
              <div className="empty-state">Carregando finalizados...</div>
            ) : (
              <PlacasTable items={finishedItems} finalizados canViewAudit={canViewAudit} onAction={handleAction} onMove={handleMove} onAudit={handleOpenAudit} busyId={busyId} />
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
        onEdit={handleEdit}
        onAudit={handleOpenAudit}
        onDateChange={setDetailsDate}
        onSearchChange={setDetailsSearch}
        onClearFilters={() => {
          setDetailsDate('');
          setDetailsSearch('');
        }}
        onClose={handleCloseReportDetails}
      />
      <EditPlacaModal item={editingItem} saving={editSaving} error={editError} onClose={() => setEditingItem(null)} onSave={handleSaveEdit} />
      <CancelPlacaModal item={cancelingItem} saving={cancelSaving} onClose={() => setCancelingItem(null)} onConfirm={handleConfirmCancel} />
      <AuditHistoryModal item={auditItem} entries={auditEntries} loading={auditLoading} error={auditError} onClose={() => setAuditItem(null)} />
    </main>
  );
}
