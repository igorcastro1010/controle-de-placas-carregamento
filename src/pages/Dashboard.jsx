import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownCircle, LogOut, PlusCircle, RefreshCw, X } from 'lucide-react';
import AuditHistoryModal from '../components/AuditHistoryModal';
import CancelPlacaModal from '../components/CancelPlacaModal';
import ChamadoModal from '../components/ChamadoModal';
import DetailsModal from '../components/DetailsModal';
import EditPlacaModal from '../components/EditPlacaModal';
import Filters from '../components/Filters';
import PlacaForm from '../components/PlacaForm';
import PlacasTable from '../components/PlacasTable';
import PeriodReport from '../components/PeriodReport';
import PriorityLocalModal from '../components/PriorityLocalModal';
import ReopenPlacaModal from '../components/ReopenPlacaModal';
import ReportCards from '../components/ReportCards';
import VehicleRegistry from '../components/VehicleRegistry';
import {
  cancelCargaAndReturnToQueue,
  createPlaca,
  currentTime,
  addPrioridadeLocal,
  fetchAuditoriaPlaca,
  fetchPlacas,
  fetchReportDetails,
  fetchTodayReport,
  moveToEnd,
  removePrioridadeLocal,
  registrarAuditoria,
  reopenPlaca,
  signOut,
  swapOrder,
  isManager,
  todayISO,
  toUpperText,
  updatePlaca,
  updatePlacaCadastro,
} from '../services/placasService';
import { supabase } from '../services/supabaseClient';

const emptyFilters = {
  placa: '',
  motorista: '',
  tipo_veiculo: '',
  status: '',
  responsavel: '',
  data: '',
  entrega_local: '',
  prioridade_local: '',
};

const emptyFinishedFilters = {
  data: todayISO(),
  busca: '',
  tipo_veiculo: '',
};

export default function Dashboard({ user, onLogout }) {
  const canManageQueue = isManager(user);
  const canViewAudit = canManageQueue;
  const inProgressRef = useRef(null);
  const realtimeTimerRef = useRef(null);
  const loadDataRef = useRef(null);
  const loadReportDetailsRef = useRef(null);
  const auditItemRef = useRef(null);
  const refreshAuditRef = useRef(null);
  const [activeTab, setActiveTab] = useState('fila');
  const [items, setItems] = useState([]);
  const [inProgressItems, setInProgressItems] = useState([]);
  const [finishedItems, setFinishedItems] = useState([]);
  const [report, setReport] = useState({});
  const [createModalOpen, setCreateModalOpen] = useState(false);
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
  const [chamadoItem, setChamadoItem] = useState(null);
  const [chamadoSaving, setChamadoSaving] = useState(false);
  const [reopeningItem, setReopeningItem] = useState(null);
  const [reopenSaving, setReopenSaving] = useState(false);
  const [priorityItem, setPriorityItem] = useState(null);
  const [prioritySaving, setPrioritySaving] = useState(false);
  const [auditItem, setAuditItem] = useState(null);
  const [auditEntries, setAuditEntries] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState('');
  const [realtimeStatus, setRealtimeStatus] = useState('connecting');
  const [periodRefreshKey, setPeriodRefreshKey] = useState(0);

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
      tipo_carroceria: 'Tipo de carroceria',
      placa: 'Placa',
      placa_cavalo: 'Placa do cavalo',
      placa_carreta: 'Placa da carreta',
      entrega_local: 'Entrega local',
      retorno_local: 'Retorno local',
      prioridade_local: 'Prioridade local',
      prioridade_motivo: 'Motivo da prioridade',
      motorista: 'Motorista',
      telefone: 'Telefone',
      rota_1: 'Rota 1',
      rota_2: 'Rota 2',
      rota_3: 'Rota 3',
      cidade_destino: 'Cidade destino',
      valor_frete_carreteiro: 'Frete carreteiro',
      ocorrido: 'Ocorrido',
    };

    return Object.entries(labels)
      .filter(([field]) => String(before?.[field] || '') !== String(after?.[field] || ''))
      .map(([field, label]) => `${label} alterado de "${before?.[field] || '-'}" para "${after?.[field] || '-'}"`)
      .join('; ');
  };

  const loadData = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const [active, inProgress, finished, dailyReport] = await Promise.all([
        fetchPlacas({ filters }),
        fetchPlacas({ filters, scope: 'andamento' }),
        fetchPlacas({ finalizados: true, filters: finishedFilters }),
        fetchTodayReport(),
      ]);
      setItems(active);
      setInProgressItems(inProgress);
      setFinishedItems(finished);
      setReport(dailyReport);
    } catch (err) {
      setError(err.message || 'Não foi possível carregar os dados.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [filters, finishedFilters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadReportDetails = useCallback(async ({ silent = false } = {}) => {
    if (!selectedReportCard) return;

    if (!silent) setDetailsLoading(true);
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
      if (!silent) setDetailsLoading(false);
    }
  }, [detailsDate, detailsSearch, selectedReportCard]);

  useEffect(() => {
    loadReportDetails();
  }, [loadReportDetails]);

  useEffect(() => {
    loadDataRef.current = loadData;
  }, [loadData]);

  useEffect(() => {
    loadReportDetailsRef.current = loadReportDetails;
  }, [loadReportDetails]);

  useEffect(() => {
    auditItemRef.current = auditItem;
  }, [auditItem]);

  useEffect(() => {
    refreshAuditRef.current = async () => {
      const currentAuditItem = auditItemRef.current;
      if (!currentAuditItem || !canViewAudit) return;

      try {
        const data = await fetchAuditoriaPlaca(currentAuditItem.id);
        setAuditEntries(data);
      } catch (err) {
        console.error('Não foi possível atualizar auditoria em tempo real.', err);
      }
    };
  }, [canViewAudit]);

  useEffect(() => {
    if (!supabase) {
      setRealtimeStatus('disconnected');
      return undefined;
    }

    setRealtimeStatus('connecting');

    const scheduleRefresh = (includeAudit = false) => {
      if (realtimeTimerRef.current) window.clearTimeout(realtimeTimerRef.current);

      realtimeTimerRef.current = window.setTimeout(async () => {
        try {
          await loadDataRef.current?.({ silent: true });
          await loadReportDetailsRef.current?.({ silent: true });
          setPeriodRefreshKey((current) => current + 1);
          if (includeAudit) await refreshAuditRef.current?.();
          setRealtimeStatus('active');
        } catch (err) {
          console.error('Não foi possível atualizar dados em tempo real.', err);
          setRealtimeStatus('disconnected');
        }
      }, 400);
    };

    const placasChannel = supabase
      .channel('placas-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'placas' }, () => scheduleRefresh(false))
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setRealtimeStatus('active');
        if (['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'].includes(status)) setRealtimeStatus('disconnected');
      });

    const auditoriaChannel = supabase
      .channel('placas-auditoria-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'placas_auditoria' }, () => scheduleRefresh(true))
      .subscribe((status) => {
        if (['CHANNEL_ERROR', 'TIMED_OUT'].includes(status)) {
          console.warn('Realtime de auditoria indisponível.');
        }
      });

    return () => {
      if (realtimeTimerRef.current) window.clearTimeout(realtimeTimerRef.current);
      supabase.removeChannel(placasChannel);
      supabase.removeChannel(auditoriaChannel);
    };
  }, []);

  const showSuccess = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleScrollToInProgress = () => {
    setActiveTab('fila');
    window.setTimeout(() => {
      const target = inProgressRef.current || document.getElementById('em-andamento');
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
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
      if (created.entrega_local) {
        await safeRegisterAudit({
          placaId: created.id,
          acao: 'Marcado como entrega local',
          statusNovo: created.status,
          ordemNova: created.ordem,
          detalhes: 'Entrega local marcada no cadastro.',
        });
      }
      if (created.prioridade_local) {
        await safeRegisterAudit({
          placaId: created.id,
          acao: 'Prioridade local adicionada',
          statusNovo: created.status,
          ordemNova: created.ordem,
          detalhes: `Motivo: ${created.prioridade_motivo || 'RETORNO DE ENTREGA LOCAL'}; Por: ${created.prioridade_por || user.email}; Em: ${created.prioridade_em || '-'}`,
        });
      }
      setCreateModalOpen(false);
      await loadData();
      if (created.veiculoCadastroErro) {
        setError('Placa cadastrada na fila, mas não foi possível salvar no cadastro de veículos.');
      } else {
        showSuccess(created.prioridade_local ? 'Placa cadastrada com prioridade local.' : 'Placa cadastrada no final da fila.');
      }
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
        primeira: { primeira_ligacao: time },
        segunda: { segunda_ligacao: time },
        terceira: { terceira_ligacao: time },
        chegou: { status: 'Chegou' },
        carregando: { status: 'Carregando' },
        finalizar: { status: 'Finalizado', finalizado_por: user.email, finalizado_em: new Date().toISOString() },
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
      } else if (action === 'chamado') {
        setChamadoItem(item);
      } else if (action === 'outro_local') {
        await handleConfirmOutroLocal(item);
      } else {
        const updated = await updatePlaca(item.id, actionMap[action]);
        const auditActionMap = {
          primeira: '1ª ligação',
          segunda: '2ª ligação',
          terceira: '3ª ligação',
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
          detalhes: ['primeira', 'segunda', 'terceira'].includes(action) ? `Horário salvo: ${time}` : undefined,
        });
      }

      if (action !== 'cancelar' && action !== 'chamado' && action !== 'outro_local') {
        await loadData();
        if (selectedReportCard) await loadReportDetails();
      }
    } catch (err) {
      setError(err.message || 'Não foi possível atualizar a placa.');
    } finally {
      setBusyId('');
    }
  };

  const handleConfirmChamado = async (item, chamadoPayload) => {
    setChamadoSaving(true);
    setError('');
    try {
      const updated = await updatePlaca(item.id, {
        status: 'Chamado',
        cidade_destino: chamadoPayload.cidade_destino,
        valor_frete_carreteiro: chamadoPayload.valor_frete_carreteiro,
      });
      await safeRegisterAudit({
        placaId: item.id,
        acao: 'Chamado',
        statusAnterior: item.status,
        statusNovo: 'Chamado',
        ordemAnterior: item.ordem,
        ordemNova: updated.ordem,
        detalhes: `Cidade: ${updated.cidade_destino || '-'}; Frete carreteiro: ${updated.valor_frete_carreteiro || '-'}`,
      });
      setChamadoItem(null);
      await loadData();
      if (selectedReportCard) await loadReportDetails();
      showSuccess('Motorista marcado como chamado.');
    } catch (err) {
      setError(err.message || 'Não foi possível marcar como chamado.');
    } finally {
      setChamadoSaving(false);
    }
  };

  const handleConfirmOutroLocal = async (item) => {
    setBusyId(item.id);
    setError('');
    try {
      const outroLocalPayload = {
        local: 'Outro local',
        motivo: 'Carregou em outro local',
      };
      const note = `[Carregou em outro local] ${outroLocalPayload.motivo}`;
      const ocorrido = item.ocorrido ? `${item.ocorrido}\n${note}` : note;
      const updated = await updatePlaca(item.id, {
        status: 'Finalizado',
        finalizado_por: user.email,
        finalizado_em: new Date().toISOString(),
        ocorrido,
      });
      await safeRegisterAudit({
        placaId: item.id,
        acao: 'Carregou em outro local',
        statusAnterior: item.status,
        statusNovo: 'Finalizado',
        ordemAnterior: item.ordem,
        ordemNova: updated.ordem,
        detalhes: `Motivo: ${outroLocalPayload.motivo}`,
      });
      await loadData();
      if (selectedReportCard) await loadReportDetails();
      showSuccess('Motorista removido da fila como carregou em outro local.');
    } catch (err) {
      setError(err.message || 'Não foi possível marcar como carregado em outro local.');
    } finally {
      setBusyId('');
    }
  };

  const handleMove = async (item, index, direction, sourceItems = items) => {
    if ((direction === 'up' || direction === 'down') && !canManageQueue) {
      setError('Você não tem permissão para alterar essa posição.');
      return;
    }

    setBusyId(item.id);
    setError('');
    try {
      if (direction === 'end') {
        const maxOrder = sourceItems.reduce((max, sourceItem) => Math.max(max, sourceItem.ordem || 0), item.ordem || 0);
        const moved = await updatePlaca(item.id, { ordem: maxOrder + 1 });
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
      const updated = await updatePlacaCadastro(id, payload, user);
      const changeDetails = describeCadastroChanges(original, updated) || 'Cadastro revisado sem alteração detectada nos campos principais.';
      await safeRegisterAudit({
        placaId: id,
        acao: 'Edição',
        statusAnterior: original?.status,
        statusNovo: updated.status,
        ordemAnterior: original?.ordem,
        ordemNova: updated.ordem,
        detalhes: describeCadastroChanges(original, updated) || 'Cadastro revisado sem alteração detectada nos campos principais.',
      });
      await safeRegisterAudit({
        placaId: id,
        acao: 'Cadastro do veículo atualizado',
        statusAnterior: original?.status,
        statusNovo: updated.status,
        ordemAnterior: original?.ordem,
        ordemNova: updated.ordem,
        detalhes: changeDetails,
      });
      if (!original?.entrega_local && updated.entrega_local) {
        await safeRegisterAudit({
          placaId: id,
          acao: 'Marcado como entrega local',
          statusAnterior: original?.status,
          statusNovo: updated.status,
          ordemAnterior: original?.ordem,
          ordemNova: updated.ordem,
          detalhes: 'Entrega local marcada na edição do cadastro.',
        });
      }
      setEditingItem(null);
      await loadData();
      if (selectedReportCard) await loadReportDetails();
      if (updated.veiculoCadastroErro) {
        setError('Cadastro atualizado, mas não foi possível salvar no cadastro de veículos.');
      } else {
        showSuccess('Cadastro atualizado com sucesso.');
      }
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
      const cancelReason = toUpperText(reason);
      const cancelNote = `[Carga cancelada] ${cancelReason}`;
      const ocorrido = item.ocorrido ? `${item.ocorrido}\n${cancelNote}` : cancelNote;
      const updated = await cancelCargaAndReturnToQueue(item, {
        ocorrido,
      });
      await safeRegisterAudit({
        placaId: item.id,
        acao: 'Carga cancelada',
        statusAnterior: item.status,
        statusNovo: 'Aguardando',
        ordemAnterior: item.ordem,
        ordemNova: updated.ordem,
        detalhes: `Motivo: ${cancelReason}`,
      });
      setCancelingItem(null);
      await loadData();
      if (selectedReportCard) await loadReportDetails();
      showSuccess('Carga cancelada. Motorista voltou para a fila.');
    } catch (err) {
      setError(err.message || 'Não foi possível cancelar a carga.');
    } finally {
      setCancelSaving(false);
    }
  };

  const handleRequestReopen = (item) => {
    if (!canManageQueue) {
      setError('Você não tem permissão para reabrir marcações.');
      return;
    }

    setReopeningItem(item);
  };

  const handlePriorityAction = async (item) => {
    if (!canManageQueue) {
      setError('Você não tem permissão para alterar prioridade local.');
      return;
    }

    if (!item.prioridade_local) {
      setPriorityItem(item);
      return;
    }

    setBusyId(item.id);
    setError('');
    try {
      const updated = await removePrioridadeLocal(item);
      await safeRegisterAudit({
        placaId: item.id,
        acao: 'Prioridade local removida',
        statusAnterior: item.status,
        statusNovo: updated.status,
        ordemAnterior: item.ordem,
        ordemNova: updated.ordem,
        detalhes: `Prioridade local removida por ${user.email}.`,
      });
      showSuccess('Prioridade local removida.');
      await loadData();
      if (selectedReportCard) await loadReportDetails();
    } catch (err) {
      setError(err.message || 'Não foi possível remover a prioridade local.');
    } finally {
      setBusyId('');
    }
  };

  const handleConfirmPriority = async (item, reason) => {
    if (!canManageQueue) {
      setError('Você não tem permissão para alterar prioridade local.');
      setPriorityItem(null);
      return;
    }

    setPrioritySaving(true);
    setBusyId(item.id);
    setError('');
    try {
      const priorityReason = toUpperText(reason);
      const updated = await addPrioridadeLocal(item, user, priorityReason);
      await safeRegisterAudit({
        placaId: item.id,
        acao: 'Prioridade local adicionada',
        statusAnterior: item.status,
        statusNovo: updated.status,
        ordemAnterior: item.ordem,
        ordemNova: updated.ordem,
        detalhes: `Motivo: ${priorityReason}; Por: ${updated.prioridade_por || user.email}; Em: ${updated.prioridade_em || '-'}`,
      });
      showSuccess('Prioridade local adicionada.');
      setPriorityItem(null);
      await loadData();
      if (selectedReportCard) await loadReportDetails();
    } catch (err) {
      setError(err.message || 'Não foi possível adicionar a prioridade local.');
    } finally {
      setPrioritySaving(false);
      setBusyId('');
    }
  };

  const handleConfirmReopen = async (item, reason) => {
    if (!canManageQueue) {
      setError('Você não tem permissão para reabrir marcações.');
      setReopeningItem(null);
      return;
    }

    setReopenSaving(true);
    setError('');
    try {
      const reopenReason = toUpperText(reason);
      const reopened = await reopenPlaca(item, reopenReason);
      await safeRegisterAudit({
        placaId: item.id,
        acao: 'Reabertura',
        statusAnterior: item.status,
        statusNovo: 'Aguardando',
        ordemAnterior: item.ordem,
        ordemNova: reopened.ordem,
        detalhes: `Motivo: ${reopenReason}`,
      });
      showSuccess('Marcação reaberta e enviada para o fim da fila.');
      setReopeningItem(null);
      await loadData();
      if (selectedReportCard) await loadReportDetails();
    } catch (err) {
      setError(err.message || 'Não foi possível reabrir a marcação.');
    } finally {
      setReopenSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    onLogout();
  };

  const handleOpenAudit = async (item) => {
    if (!canViewAudit) {
      setError('Você não tem permissão para ver auditoria.');
      return;
    }

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

  const tableTitle = useMemo(() => {
    if (activeTab === 'fila') return 'Fila de Chamada';
    if (activeTab === 'relatorio') return 'Relatório por período';
    if (activeTab === 'veiculos') return 'Cadastro de Veículos';
    return 'Encerrados';
  }, [activeTab]);

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
          <span className={`realtime-indicator ${realtimeStatus === 'active' ? 'active' : 'disconnected'}`}>
            <span aria-hidden="true" />
            {realtimeStatus === 'active' ? 'Tempo real ativo' : realtimeStatus === 'connecting' ? 'Conectando tempo real' : 'Tempo real desconectado'}
          </span>
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

      <div className="quick-actions-bar">
        <button className="primary-action create-plate-button" type="button" onClick={() => setCreateModalOpen(true)}>
          <PlusCircle size={18} aria-hidden="true" />
          Cadastrar Placa
        </button>
        <button className="icon-text secondary scroll-progress-button" type="button" onClick={handleScrollToInProgress}>
          <ArrowDownCircle size={18} aria-hidden="true" />
          Em Andamento
        </button>
      </div>

      <section className="queue-section">
        <div className="section-heading">
          <h2>{tableTitle}</h2>
          <div className="tabs" role="tablist" aria-label="Telas">
            <button className={activeTab === 'fila' ? 'active' : ''} onClick={() => setActiveTab('fila')} type="button">
              Fila de Chamada
            </button>
            <button className={activeTab === 'finalizados' ? 'active' : ''} onClick={() => setActiveTab('finalizados')} type="button">
              Encerrados
            </button>
            <button className={activeTab === 'relatorio' ? 'active' : ''} onClick={() => setActiveTab('relatorio')} type="button">
              Relatório
            </button>
            {canManageQueue && (
              <button className={activeTab === 'veiculos' ? 'active' : ''} onClick={() => setActiveTab('veiculos')} type="button">
                Cadastro de Veículos
              </button>
            )}
          </div>
        </div>

        {activeTab === 'veiculos' && canManageQueue ? (
          <VehicleRegistry />
        ) : activeTab === 'relatorio' ? (
          <PeriodReport refreshSignal={periodRefreshKey} />
        ) : activeTab === 'fila' ? (
          <>
            <Filters filters={filters} onChange={setFilters} onClear={() => setFilters(emptyFilters)} />
            {loading ? (
              <div className="empty-state">Carregando fila...</div>
            ) : (
              <div className="queue-split-layout">
                <section className="queue-subsection">
                  <div className="queue-subsection-header">
                    <div>
                      <span className="eyebrow">Fila de Chamada</span>
                      <h3>Fila de Chamada ({items.length})</h3>
                    </div>
                  </div>
                  <PlacasTable
                    items={items}
                    onAction={handleAction}
                    onMove={handleMove}
                    onEdit={handleEdit}
                    onAudit={handleOpenAudit}
                    onPriority={handlePriorityAction}
                    onOtherLocation={handleConfirmOutroLocal}
                    busyId={busyId}
                    canViewAudit={canViewAudit}
                    canManageQueue={canManageQueue}
                  />
                </section>

                <section className="queue-subsection in-progress-subsection" id="em-andamento" ref={inProgressRef}>
                  <div className="queue-subsection-header">
                    <div>
                      <span className="eyebrow">Em Andamento</span>
                      <h3>Em Andamento ({inProgressItems.length})</h3>
                    </div>
                  </div>
                  <PlacasTable
                    items={inProgressItems}
                    onAction={handleAction}
                    onMove={handleMove}
                    onEdit={handleEdit}
                    onAudit={handleOpenAudit}
                    onPriority={handlePriorityAction}
                    onOtherLocation={handleConfirmOutroLocal}
                    busyId={busyId}
                    canViewAudit={canViewAudit}
                    canManageQueue={canManageQueue}
                  />
                </section>
              </div>
            )}
          </>
        ) : (
          <>
            <Filters finalizados filters={finishedFilters} onChange={setFinishedFilters} onClear={() => setFinishedFilters({ data: '', busca: '', tipo_veiculo: '' })} />
            {loading ? (
              <div className="empty-state">Carregando finalizados...</div>
            ) : (
              <PlacasTable items={finishedItems} finalizados canViewAudit={canViewAudit} canManageQueue={canManageQueue} onAction={handleAction} onMove={handleMove} onAudit={handleOpenAudit} onReopen={handleRequestReopen} onPriority={handlePriorityAction} onOtherLocation={handleConfirmOutroLocal} busyId={busyId} />
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
        canManageQueue={canManageQueue}
        busyId={busyId}
        onAction={handleAction}
        onMove={handleMove}
        onEdit={handleEdit}
        onAudit={handleOpenAudit}
        onReopen={handleRequestReopen}
        onPriority={handlePriorityAction}
        onOtherLocation={handleConfirmOutroLocal}
        onDateChange={setDetailsDate}
        onSearchChange={setDetailsSearch}
        onClearFilters={() => {
          setDetailsDate('');
          setDetailsSearch('');
        }}
        onClose={handleCloseReportDetails}
      />
      <EditPlacaModal item={editingItem} saving={editSaving} error={editError} onClose={() => setEditingItem(null)} onSave={handleSaveEdit} />
      <ChamadoModal item={chamadoItem} saving={chamadoSaving} onClose={() => setChamadoItem(null)} onConfirm={handleConfirmChamado} />
      <CancelPlacaModal item={cancelingItem} saving={cancelSaving} onClose={() => setCancelingItem(null)} onConfirm={handleConfirmCancel} />
      <ReopenPlacaModal item={reopeningItem} saving={reopenSaving} onClose={() => setReopeningItem(null)} onConfirm={handleConfirmReopen} />
      <PriorityLocalModal item={priorityItem} saving={prioritySaving} onClose={() => setPriorityItem(null)} onConfirm={handleConfirmPriority} />
      <AuditHistoryModal item={auditItem} entries={auditEntries} loading={auditLoading} error={auditError} onClose={() => setAuditItem(null)} />

      {createModalOpen && (
        <div className="modal-backdrop" role="presentation" onClick={() => setCreateModalOpen(false)}>
          <section className="form-modal cadastro-modal" role="dialog" aria-modal="true" aria-labelledby="cadastro-modal-title" onClick={(event) => event.stopPropagation()}>
            <header className="details-header">
              <div>
                <span className="eyebrow">Cadastro</span>
                <h2 id="cadastro-modal-title">Cadastro de Placa</h2>
                <p>Preencha os dados para adicionar a placa no final da fila.</p>
              </div>
              <button className="icon-only" type="button" onClick={() => setCreateModalOpen(false)} aria-label="Fechar cadastro">
                <X size={20} aria-hidden="true" />
              </button>
            </header>
            <PlacaForm onSubmit={handleCreate} loading={saving} error={error} embedded />
          </section>
        </div>
      )}
    </main>
  );
}
