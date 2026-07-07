import { setKeepConnectedPreference, supabase } from './supabaseClient';

export const STATUSES = [
  'Aguardando',
  '1ª ligação feita',
  '2ª ligação feita',
  '3ª ligação feita',
  'Não atendeu',
  'Chamado',
  'Chegou',
  'Carregando',
  'Finalizado',
  'Cancelado',
];

export const ACTIVE_EXCLUDED_STATUSES = ['Finalizado', 'Cancelado'];
export const STATUS_FILA_ATUAL = ['Aguardando', '1ª ligação feita', '2ª ligação feita', '3ª ligação feita', 'Não atendeu'];
export const STATUS_EM_ANDAMENTO = ['Chamado', 'Chegou', 'Carregando'];
export const AUDIT_VIEWERS = ['gerencia.ce@grupodago.com.br', 'operacional3.ce@grupodago.com.br'];

export const REPORT_STATUSES = [
  'Aguardando',
  '1ª ligação feita',
  '2ª ligação feita',
  '3ª ligação feita',
  'Não atendeu',
  'Chamado',
  'Chegou',
  'Carregando',
  'Finalizado',
  'Cancelado',
];

export const normalizeStatus = (status) =>
  String(status || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export const normalizePlate = (value) =>
  String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .trim();

export const normalizeSearch = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');

const inactiveStatusFilter = () => `(${ACTIVE_EXCLUDED_STATUSES.map((status) => `"${status}"`).join(',')})`;

export const isStatusFilaAtual = (status) => STATUS_FILA_ATUAL.some((queueStatus) => normalizeStatus(queueStatus) === normalizeStatus(status));

export const isStatusEmAndamento = (status) => STATUS_EM_ANDAMENTO.some((progressStatus) => normalizeStatus(progressStatus) === normalizeStatus(status));

export const isActiveStatus = (status) => !ACTIVE_EXCLUDED_STATUSES.some((inactiveStatus) => normalizeStatus(inactiveStatus) === normalizeStatus(status));

function normalizeVehiclePayload(payload) {
  const tipoVeiculo = payload.tipo_veiculo || 'Truck';
  const isCarreta = tipoVeiculo === 'Carreta';
  const placaBase = isCarreta ? payload.placa_cavalo : payload.placa;

  return {
    tipo_veiculo: tipoVeiculo,
    placa: placaBase.trim().toUpperCase(),
    placa_cavalo: isCarreta ? payload.placa_cavalo?.trim().toUpperCase() || null : null,
    placa_carreta: isCarreta ? payload.placa_carreta?.trim().toUpperCase() || null : null,
    motorista: payload.motorista.trim(),
    telefone: payload.telefone.trim(),
    rota_1: payload.rota_1?.trim() || null,
    rota_2: payload.rota_2?.trim() || null,
    rota_3: payload.rota_3?.trim() || null,
    ocorrido: payload.ocorrido?.trim() || null,
  };
}

async function ensurePlateIsNotDuplicated(payload, ignoreId = '') {
  const isCarreta = payload.tipo_veiculo === 'Carreta';
  const candidatePlates = (isCarreta ? [payload.placa, payload.placa_cavalo, payload.placa_carreta] : [payload.placa]).map(normalizePlate).filter(Boolean);
  if (!candidatePlates.length) return;

  const { data, error } = await supabase.from('placas').select('id, placa, placa_cavalo, placa_carreta, status');
  if (error) throw error;

  const hasDuplicate = (data || [])
    .filter((item) => item.id !== ignoreId && isActiveStatus(item.status))
    .some((item) => [item.placa, item.placa_cavalo, item.placa_carreta].map(normalizePlate).some((plate) => plate && candidatePlates.includes(plate)));

  if (hasDuplicate) {
    throw new Error(isCarreta ? 'Já existe uma placa ativa com esse cavalo ou carreta.' : 'Essa placa já está cadastrada na fila.');
  }
}

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const currentTime = () =>
  new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

export const formatDate = (value) => {
  if (!value) return '-';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
};

export const formatTime = (value) => {
  if (!value) return '-';
  return value.slice(0, 5);
};

export const formatDateTime = (value) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
};

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function signIn(email, password, { keepConnected = true } = {}) {
  setKeepConnectedPreference(keepConnected);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function fetchPlacas({ finalizados = false, filters = {}, scope = 'fila' } = {}) {
  let query = supabase.from('placas').select('*');

  if (finalizados) {
    query = query.in('status', ACTIVE_EXCLUDED_STATUSES);
  } else {
    query = query.not('status', 'in', inactiveStatusFilter());
  }

  if (filters.placa) query = query.or(`placa.ilike.%${filters.placa}%,placa_cavalo.ilike.%${filters.placa}%,placa_carreta.ilike.%${filters.placa}%`);
  if (filters.motorista) query = query.ilike('motorista', `%${filters.motorista}%`);
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.responsavel) query = query.ilike('responsavel_email', `%${filters.responsavel}%`);
  if (filters.data) query = query.eq('data', filters.data);
  if (filters.busca) query = query.or(`placa.ilike.%${filters.busca}%,placa_cavalo.ilike.%${filters.busca}%,placa_carreta.ilike.%${filters.busca}%,motorista.ilike.%${filters.busca}%`);

  query = query.order(finalizados ? 'updated_at' : 'ordem', { ascending: !finalizados });

  const { data, error } = await query;
  if (error) throw error;
  if (finalizados) return data || [];

  if (scope === 'andamento') {
    return (data || []).filter((item) => isStatusEmAndamento(item.status));
  }

  if (scope === 'ativos') {
    return data || [];
  }

  return (data || []).filter((item) => isStatusFilaAtual(item.status));
}

export async function fetchTodayReport() {
  const { data, error } = await supabase.from('placas').select('status, data');
  if (error) throw error;

  const initialReport = REPORT_STATUSES.reduce((acc, status) => {
    acc[status] = 0;
    return acc;
  }, { total: 0 });

  return (data || []).reduce((acc, item) => {
    if (item.data === todayISO()) acc.total += 1;
    const reportStatus = REPORT_STATUSES.find((status) => normalizeStatus(status) === normalizeStatus(item.status));
    if (reportStatus) acc[reportStatus] += 1;
    return acc;
  }, initialReport);
}

export async function fetchReportDetails({ status, date, search } = {}) {
  let query = supabase.from('placas').select('*');

  if (date) query = query.eq('data', date);
  if (search) query = query.or(`placa.ilike.%${search}%,placa_cavalo.ilike.%${search}%,placa_carreta.ilike.%${search}%,motorista.ilike.%${search}%`);

  query = query.order('data', { ascending: false }).order('ordem', { ascending: true });

  const { data, error } = await query;
  if (error) throw error;
  if (!status) return data || [];
  return (data || []).filter((item) => normalizeStatus(item.status) === normalizeStatus(status));
}

export async function fetchPeriodReport(filters = {}) {
  let query = supabase.from('placas').select('*');

  const start = filters.start || todayISO();
  const end = filters.end || filters.start || todayISO();
  query = query.gte('data', start).lte('data', end);

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.tipo_veiculo) query = query.eq('tipo_veiculo', filters.tipo_veiculo);
  if (filters.responsavel) query = query.ilike('responsavel_email', `%${filters.responsavel}%`);

  query = query.order('data', { ascending: false }).order('ordem', { ascending: true });

  const { data, error } = await query;
  if (error) throw error;

  if (!filters.search) return data || [];

  const normalizedSearch = normalizeSearch(filters.search);
  return (data || []).filter((item) => {
    const target = [item.placa, item.placa_cavalo, item.placa_carreta, item.motorista].map(normalizeSearch).join('');
    return target.includes(normalizedSearch);
  });
}

export async function registrarAuditoria(user, { placaId, acao, statusAnterior, statusNovo, ordemAnterior, ordemNova, detalhes }) {
  const { error } = await supabase.from('placas_auditoria').insert({
    placa_id: placaId,
    acao,
    status_anterior: statusAnterior || null,
    status_novo: statusNovo || null,
    ordem_anterior: ordemAnterior ?? null,
    ordem_nova: ordemNova ?? null,
    alterado_por: user?.email || null,
    alterado_por_id: user?.id || null,
    detalhes: detalhes || null,
  });

  if (error) throw error;
}

export async function fetchAuditoriaPlaca(placaId) {
  const { data, error } = await supabase.from('placas_auditoria').select('*').eq('placa_id', placaId).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createPlaca(payload, user) {
  const recordPayload = normalizeVehiclePayload(payload);
  await ensurePlateIsNotDuplicated(recordPayload);

  const { data: lastItem, error: orderError } = await supabase.from('placas').select('ordem').order('ordem', { ascending: false }).limit(1).maybeSingle();
  if (orderError) throw orderError;

  const now = new Date();
  const record = {
    ...recordPayload,
    data: now.toISOString().slice(0, 10),
    hora: currentTime(),
    ordem: (lastItem?.ordem || 0) + 1,
    status: 'Aguardando',
    responsavel_id: user.id,
    responsavel_email: user.email,
  };

  const { data, error } = await supabase.from('placas').insert(record).select().single();
  if (error) throw error;
  return data;
}

export async function updatePlacaCadastro(id, payload) {
  const recordPayload = normalizeVehiclePayload(payload);
  await ensurePlateIsNotDuplicated(recordPayload, id);
  return updatePlaca(id, recordPayload);
}

export async function updatePlaca(id, payload) {
  const { data, error } = await supabase.from('placas').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function moveToEnd(item) {
  const { data: activeItems, error: orderError } = await supabase.from('placas').select('id, ordem, status').not('status', 'in', inactiveStatusFilter()).order('ordem', { ascending: false });
  if (orderError) throw orderError;

  const maxQueueOrder = (activeItems || [])
    .filter((activeItem) => isStatusFilaAtual(activeItem.status))
    .reduce((maxOrder, activeItem) => Math.max(maxOrder, activeItem.ordem || 0), item.ordem || 0);

  return updatePlaca(item.id, { ordem: maxQueueOrder + 1 });
}

export async function reopenPlaca(item, reason) {
  const reopened = await updatePlaca(item.id, {
    status: 'Aguardando',
    cancelado_por: null,
    cancelado_em: null,
    ocorrido: item.ocorrido ? `${item.ocorrido}\n[Reabertura] ${reason}` : `[Reabertura] ${reason}`,
  });

  return moveToEnd(reopened);
}

export async function swapOrder(current, target) {
  const updates = [
    supabase.from('placas').update({ ordem: target.ordem }).eq('id', current.id),
    supabase.from('placas').update({ ordem: current.ordem }).eq('id', target.id),
  ];

  const results = await Promise.all(updates);
  const error = results.find((result) => result.error)?.error;
  if (error) throw error;
}
