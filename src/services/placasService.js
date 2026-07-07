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
export const MANAGERS = ['gerencia.ce@grupodago.com.br', 'operacional3.ce@grupodago.com.br'];
export const AUDIT_VIEWERS = MANAGERS;

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

export const toUpperText = (value) => String(value || '').toUpperCase().trim();

const toUpperOrNull = (value) => toUpperText(value) || null;

export const normalizeSearch = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');

export const isManager = (user) => MANAGERS.includes(String(user?.email || '').trim().toLowerCase());

const inactiveStatusFilter = () => `(${ACTIVE_EXCLUDED_STATUSES.map((status) => `"${status}"`).join(',')})`;

export const isStatusFilaAtual = (status) => STATUS_FILA_ATUAL.some((queueStatus) => normalizeStatus(queueStatus) === normalizeStatus(status));

export const isStatusEmAndamento = (status) => STATUS_EM_ANDAMENTO.some((progressStatus) => normalizeStatus(progressStatus) === normalizeStatus(status));

export const isActiveStatus = (status) => !ACTIVE_EXCLUDED_STATUSES.some((inactiveStatus) => normalizeStatus(inactiveStatus) === normalizeStatus(status));

export const sortByPriorityAndOrder = (items = []) =>
  [...items].sort((a, b) => {
    const priorityDiff = Number(Boolean(b.prioridade_local)) - Number(Boolean(a.prioridade_local));
    if (priorityDiff !== 0) return priorityDiff;
    return (a.ordem || 0) - (b.ordem || 0);
  });

function normalizeVehiclePayload(payload) {
  const tipoVeiculo = payload.tipo_veiculo || 'Truck';
  const isCarreta = tipoVeiculo === 'Carreta';
  const placaBase = isCarreta ? payload.placa_cavalo : payload.placa;
  const retornoLocal = Boolean(payload.retorno_local);
  const prioridadeLocal = Boolean(payload.prioridade_local || retornoLocal);
  const prioridadeMotivo = toUpperText(payload.prioridade_motivo) || 'RETORNO DE ENTREGA LOCAL';

  return {
    tipo_veiculo: tipoVeiculo,
    placa: toUpperText(placaBase),
    placa_cavalo: isCarreta ? toUpperOrNull(payload.placa_cavalo) : null,
    placa_carreta: isCarreta ? toUpperOrNull(payload.placa_carreta) : null,
    entrega_local: Boolean(payload.entrega_local),
    retorno_local: retornoLocal,
    prioridade_local: prioridadeLocal,
    prioridade_motivo: prioridadeLocal ? prioridadeMotivo : null,
    prioridade_por: prioridadeLocal ? payload.prioridade_por || null : null,
    prioridade_em: prioridadeLocal ? payload.prioridade_em || null : null,
    motorista: toUpperText(payload.motorista),
    telefone: toUpperText(payload.telefone),
    rota_1: toUpperOrNull(payload.rota_1),
    rota_2: toUpperOrNull(payload.rota_2),
    rota_3: toUpperOrNull(payload.rota_3),
    ocorrido: toUpperOrNull(payload.ocorrido),
  };
}

function buildVehicleRegistrationPayload(source = {}) {
  const tipoVeiculo = source.tipo_veiculo || 'Truck';
  const isCarreta = tipoVeiculo === 'Carreta';
  const placaBase = isCarreta ? source.placa_cavalo || source.placa : source.placa;

  return {
    tipo_veiculo: tipoVeiculo,
    placa: toUpperText(placaBase),
    placa_cavalo: isCarreta ? toUpperOrNull(source.placa_cavalo || source.placa) : null,
    placa_carreta: isCarreta ? toUpperOrNull(source.placa_carreta) : null,
    motorista: toUpperText(source.motorista),
    telefone: toUpperText(source.telefone),
    rota_1: toUpperOrNull(source.rota_1),
    rota_2: toUpperOrNull(source.rota_2),
    rota_3: toUpperOrNull(source.rota_3),
    observacao_padrao: toUpperOrNull(source.observacao_padrao || source.ocorrido),
  };
}

function findVehicleRegistrationInList(items = [], plate) {
  const normalizedPlate = normalizePlate(plate);
  if (!normalizedPlate) return null;

  return (
    items.find((item) =>
      [item.placa, item.placa_cavalo]
        .map(normalizePlate)
        .filter(Boolean)
        .includes(normalizedPlate)
    ) || null
  );
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

export async function findVeiculoMotoristaByPlate(plate) {
  const normalizedPlate = normalizePlate(plate);
  if (!normalizedPlate || normalizedPlate.length < 3) return null;

  const { data, error } = await supabase.from('veiculos_motoristas').select('*').order('ultimo_uso_em', { ascending: false, nullsFirst: false });
  if (error) throw error;
  return findVehicleRegistrationInList(data || [], normalizedPlate);
}

export async function fetchVeiculosMotoristas(filters = {}) {
  let query = supabase.from('veiculos_motoristas').select('*').order('ultimo_uso_em', { ascending: false, nullsFirst: false }).order('updated_at', { ascending: false });

  if (filters.motorista) query = query.ilike('motorista', `%${filters.motorista}%`);

  const { data, error } = await query;
  if (error) throw error;

  if (!filters.placa) return data || [];

  const normalizedPlate = normalizePlate(filters.placa);
  return (data || []).filter((item) => [item.placa, item.placa_cavalo, item.placa_carreta].map(normalizePlate).some((plate) => plate.includes(normalizedPlate)));
}

export async function syncVeiculoMotorista(source, user) {
  const recordPayload = buildVehicleRegistrationPayload(source);
  if (!recordPayload.placa) return null;

  const { data: existingItems, error: fetchError } = await supabase.from('veiculos_motoristas').select('*');
  if (fetchError) throw fetchError;

  const existing = findVehicleRegistrationInList(existingItems || [], recordPayload.placa);
  const now = new Date().toISOString();

  if (existing) {
    const { data, error } = await supabase
      .from('veiculos_motoristas')
      .update({
        ...recordPayload,
        ultimo_uso_em: now,
        atualizado_por: user?.email || null,
        atualizado_por_id: user?.id || null,
      })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from('veiculos_motoristas')
    .insert({
      ...recordPayload,
      ultimo_uso_em: now,
      criado_por: user?.email || null,
      criado_por_id: user?.id || null,
      atualizado_por: user?.email || null,
      atualizado_por_id: user?.id || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function safeSyncVeiculoMotorista(source, user) {
  try {
    return await syncVeiculoMotorista(source, user);
  } catch (err) {
    console.warn('Não foi possível sincronizar o cadastro do veículo.', err);
    return null;
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
  if (filters.entrega_local === 'sim') query = query.eq('entrega_local', true);
  if (filters.entrega_local === 'nao') query = query.eq('entrega_local', false);
  if (filters.prioridade_local === 'sim') query = query.eq('prioridade_local', true);
  if (filters.prioridade_local === 'nao') query = query.eq('prioridade_local', false);

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

  return sortByPriorityAndOrder((data || []).filter((item) => isStatusFilaAtual(item.status)));
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
  if (filters.entrega_local === 'sim') query = query.eq('entrega_local', true);
  if (filters.entrega_local === 'nao') query = query.eq('entrega_local', false);
  if (filters.prioridade_local === 'sim') query = query.eq('prioridade_local', true);
  if (filters.prioridade_local === 'nao') query = query.eq('prioridade_local', false);

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

  let nextOrder;
  if (recordPayload.prioridade_local) {
    const { data: priorityItems, error: priorityOrderError } = await supabase
      .from('placas')
      .select('ordem, status, prioridade_local')
      .eq('prioridade_local', true)
      .in('status', STATUS_FILA_ATUAL)
      .order('ordem', { ascending: false })
      .limit(1);
    if (priorityOrderError) throw priorityOrderError;
    nextOrder = priorityItems?.length ? (priorityItems[0].ordem || 0) + 1 : 1;
    recordPayload.prioridade_por = user.email;
    recordPayload.prioridade_em = new Date().toISOString();
  } else {
    const { data: lastItem, error: orderError } = await supabase.from('placas').select('ordem').order('ordem', { ascending: false }).limit(1).maybeSingle();
    if (orderError) throw orderError;
    nextOrder = (lastItem?.ordem || 0) + 1;
  }

  const now = new Date();
  const record = {
    ...recordPayload,
    data: now.toISOString().slice(0, 10),
    hora: currentTime(),
    ordem: nextOrder,
    status: 'Aguardando',
    responsavel_id: user.id,
    responsavel_email: user.email,
  };

  const { data, error } = await supabase.from('placas').insert(record).select().single();
  if (error) throw error;
  await safeSyncVeiculoMotorista(data, user);
  return data;
}

export async function updatePlacaCadastro(id, payload, user) {
  const recordPayload = normalizeVehiclePayload(payload);
  await ensurePlateIsNotDuplicated(recordPayload, id);
  const updated = await updatePlaca(id, recordPayload);
  await safeSyncVeiculoMotorista(updated, user);
  return updated;
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

export async function addPrioridadeLocal(item, user, reason = 'RETORNO DE ENTREGA LOCAL') {
  const { data: priorityItems, error: orderError } = await supabase
    .from('placas')
    .select('id, ordem, status, prioridade_local')
    .eq('prioridade_local', true)
    .in('status', STATUS_FILA_ATUAL)
    .order('ordem', { ascending: false })
    .limit(1);
  if (orderError) throw orderError;

  const nextOrder = priorityItems?.length ? (priorityItems[0].ordem || 0) + 1 : 1;
  return updatePlaca(item.id, {
    prioridade_local: true,
    retorno_local: true,
    prioridade_motivo: toUpperText(reason) || 'RETORNO DE ENTREGA LOCAL',
    prioridade_por: user.email,
    prioridade_em: new Date().toISOString(),
    ordem: nextOrder,
  });
}

export async function removePrioridadeLocal(item) {
  const { data: activeItems, error: orderError } = await supabase.from('placas').select('id, ordem, status').not('status', 'in', inactiveStatusFilter()).order('ordem', { ascending: false });
  if (orderError) throw orderError;

  const maxQueueOrder = (activeItems || [])
    .filter((activeItem) => isStatusFilaAtual(activeItem.status))
    .reduce((maxOrder, activeItem) => Math.max(maxOrder, activeItem.ordem || 0), item.ordem || 0);

  return updatePlaca(item.id, {
    prioridade_local: false,
    ordem: maxQueueOrder + 1,
  });
}

export async function reopenPlaca(item, reason) {
  const reopenReason = toUpperText(reason);
  const reopened = await updatePlaca(item.id, {
    status: 'Aguardando',
    cancelado_por: null,
    cancelado_em: null,
    ocorrido: item.ocorrido ? `${item.ocorrido}\n[Reabertura] ${reopenReason}` : `[Reabertura] ${reopenReason}`,
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
