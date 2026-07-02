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
export const QUEUE_STATUSES = STATUSES.slice(0, 4);

export const AUDIT_VIEWERS = [
  'gerencia.ce@grupodago.com.br',
  'operacional3.ce@grupodago.com.br',
];

const REPORT_STATUSES = ['Aguardando', 'Chamado', 'Chegou', 'Carregando', 'Finalizado', 'NÃ£o atendeu', 'Cancelado'];

export const normalizeStatus = (status) => (status || '').trim().toLowerCase();

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

export async function fetchPlacas({ finalizados = false, filters = {} } = {}) {
  let query = supabase.from('placas').select('*');

  if (finalizados) {
    query = query.in('status', ACTIVE_EXCLUDED_STATUSES);
  } else {
    query = query.in('status', QUEUE_STATUSES);
  }

  if (filters.placa) {
    query = query.or(`placa.ilike.%${filters.placa}%,placa_cavalo.ilike.%${filters.placa}%,placa_carreta.ilike.%${filters.placa}%`);
  }
  if (filters.motorista) query = query.ilike('motorista', `%${filters.motorista}%`);
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.responsavel) query = query.ilike('responsavel_email', `%${filters.responsavel}%`);
  if (filters.data) query = query.eq('data', filters.data);
  if (filters.busca) {
    query = query.or(`placa.ilike.%${filters.busca}%,placa_cavalo.ilike.%${filters.busca}%,placa_carreta.ilike.%${filters.busca}%,motorista.ilike.%${filters.busca}%`);
  }

  query = query.order(finalizados ? 'updated_at' : 'ordem', { ascending: !finalizados });

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function fetchTodayReport() {
  const { data, error } = await supabase.from('placas').select('status, data');
  if (error) throw error;

  const initialReport = REPORT_STATUSES.reduce(
    (acc, status) => {
      acc[status] = 0;
      return acc;
    },
    { total: 0 }
  );

  return data.reduce(
    (acc, item) => {
      if (item.data === todayISO()) acc.total += 1;

      const reportStatus = REPORT_STATUSES.find((status) => normalizeStatus(status) === normalizeStatus(item.status));
      if (reportStatus) acc[reportStatus] += 1;
      return acc;
    },
    initialReport
  );
}

export async function fetchReportDetails({ status, date, search } = {}) {
  let query = supabase.from('placas').select('*');

  if (date) query = query.eq('data', date);
  if (search) query = query.or(`placa.ilike.%${search}%,placa_cavalo.ilike.%${search}%,placa_carreta.ilike.%${search}%,motorista.ilike.%${search}%`);

  query = query.order('data', { ascending: false }).order('ordem', { ascending: true });

  const { data, error } = await query;
  if (error) throw error;

  if (!status) return data;
  return data.filter((item) => normalizeStatus(item.status) === normalizeStatus(status));
}

export async function createPlaca(payload, user) {
  const { data: lastItem, error: orderError } = await supabase
    .from('placas')
    .select('ordem')
    .order('ordem', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (orderError) throw orderError;

  const now = new Date();
  const record = {
    ...payload,
    tipo_veiculo: payload.tipo_veiculo || 'Truck',
    placa: payload.placa.trim().toUpperCase(),
    placa_cavalo: payload.placa_cavalo?.trim().toUpperCase() || null,
    placa_carreta: payload.placa_carreta?.trim().toUpperCase() || null,
    motorista: payload.motorista.trim(),
    telefone: payload.telefone.trim(),
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

export async function updatePlaca(id, payload) {
  const { data, error } = await supabase.from('placas').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function moveToEnd(item) {
  const { data: lastItem, error: orderError } = await supabase
    .from('placas')
    .select('ordem')
    .in('status', QUEUE_STATUSES)
    .order('ordem', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (orderError) throw orderError;
  return updatePlaca(item.id, { ordem: (lastItem?.ordem || item.ordem) + 1 });
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
