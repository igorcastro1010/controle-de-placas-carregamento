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

export const AUDIT_VIEWERS = [
  'gerencia.ce@grupodago.com.br',
  'operacional3.ce@grupodago.com.br',
];

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
    query = query.not('status', 'in', `(${ACTIVE_EXCLUDED_STATUSES.map((status) => `"${status}"`).join(',')})`);
  }

  if (filters.placa) query = query.ilike('placa', `%${filters.placa}%`);
  if (filters.motorista) query = query.ilike('motorista', `%${filters.motorista}%`);
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.responsavel) query = query.ilike('responsavel_email', `%${filters.responsavel}%`);
  if (filters.data) query = query.eq('data', filters.data);
  if (filters.busca) query = query.or(`placa.ilike.%${filters.busca}%,motorista.ilike.%${filters.busca}%`);

  query = query.order(finalizados ? 'updated_at' : 'ordem', { ascending: !finalizados });

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function fetchTodayReport() {
  const { data, error } = await supabase.from('placas').select('status').eq('data', todayISO());
  if (error) throw error;

  return data.reduce(
    (acc, item) => {
      acc.total += 1;
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    },
    { total: 0 }
  );
}

export async function fetchReportDetails({ status, date, search } = {}) {
  let query = supabase.from('placas').select('*');

  if (status) query = query.eq('status', status);
  if (date) query = query.eq('data', date);
  if (search) query = query.or(`placa.ilike.%${search}%,motorista.ilike.%${search}%`);

  query = query.order('data', { ascending: false }).order('ordem', { ascending: true });

  const { data, error } = await query;
  if (error) throw error;
  return data;
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
    placa: payload.placa.trim().toUpperCase(),
    motorista: payload.motorista.trim(),
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
    .not('status', 'in', `(${ACTIVE_EXCLUDED_STATUSES.map((status) => `"${status}"`).join(',')})`)
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
