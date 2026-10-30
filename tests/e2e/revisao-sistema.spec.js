import { test, expect } from '@playwright/test';

const manager = { id: '11111111-1111-4111-8111-111111111111', email: 'gerencia.ce@grupodago.com.br', aud: 'authenticated', role: 'authenticated' };
const operator = { ...manager, email: 'operador@example.com' };
const today = new Date().toISOString().slice(0, 10);
const seed = (overrides = {}) => ({ id: 'record-1', placa: 'ABC1234', motorista: 'JOSE TESTE', telefone: '85999999999', tipo_veiculo: 'Truck', tipo_carroceria: 'BAU', status: 'Aguardando', ordem: 10, data: today, hora: '09:00:00', created_at: `${today}T12:00:00Z`, ...overrides });

async function setup(page, { user = manager, records = [seed()], vehicles = [] } = {}) {
  let items = records.map((item) => ({ ...item }));
  const requests = [];
  const channels = new Map();
  await page.routeWebSocket('wss://priority-test.supabase.co/**', (socket) => {
    socket.onMessage((raw) => {
      const [joinRef, ref, topic, event, payload] = JSON.parse(String(raw));
      if (event === 'phx_join') {
        const changes = (payload.config?.postgres_changes || []).map((filter, i) => ({ ...filter, id: i + 1 }));
        channels.set(topic, { socket, joinRef, changes });
        socket.send(JSON.stringify([joinRef, ref, topic, 'phx_reply', { status: 'ok', response: { postgres_changes: changes } }]));
      }
      if (event === 'heartbeat') socket.send(JSON.stringify([joinRef, ref, topic, 'phx_reply', { status: 'ok', response: {} }]));
    });
  });
  await page.addInitScript((user) => {
    if (user) sessionStorage.setItem('sb-priority-test-auth-token', JSON.stringify({ access_token: 'test-token', refresh_token: 'test-refresh', expires_at: Math.floor(Date.now() / 1000) + 3600, user }));
  }, user);
  await page.route('https://priority-test.supabase.co/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    requests.push({ path: url.pathname, search: url.search, method: request.method(), body: request.postDataJSON() });
    if (url.pathname.startsWith('/auth/')) {
      return route.fulfill({ status: 400, json: { error: 'invalid_grant', code: 'invalid_credentials', error_description: 'Invalid login credentials' } });
    }
    if (url.pathname.endsWith('/placas')) {
      if (request.method() === 'PATCH') {
        const id = url.searchParams.get('id')?.slice(3);
        items = items.map((item) => item.id === id ? { ...item, ...request.postDataJSON() } : item);
        return route.fulfill({ json: items.find((item) => item.id === id) });
      }
      if (request.method() === 'POST') {
        const record = { ...request.postDataJSON(), id: 'new-record' };
        items.push(record);
        return route.fulfill({ json: record });
      }
      let result = items.filter((item) => {
        for (const field of ['data', 'status', 'id']) {
          const filter = url.searchParams.get(field);
          if (filter?.startsWith('eq.') && String(item[field]) !== filter.slice(3)) return false;
          if (filter?.startsWith('in.') && !filter.slice(3).replace(/[()"\u0022]/g, '').split(',').includes(item[field])) return false;
          if (filter?.startsWith('not.in.') && filter.slice(7).replace(/[()"\u0022]/g, '').split(',').includes(item[field])) return false;
        }
        return true;
      });
      if (url.searchParams.get('order')?.includes('ordem')) result.sort((a, b) => url.searchParams.get('order').includes('desc') ? b.ordem - a.ordem : a.ordem - b.ordem);
      if (url.searchParams.has('limit')) result = result.slice(0, Number(url.searchParams.get('limit')));
      return route.fulfill({ json: result });
    }
    if (url.pathname.endsWith('/veiculos_motoristas')) {
      const offset = Number(url.searchParams.get('offset') || 0);
      const limit = Number(url.searchParams.get('limit') || vehicles.length);
      return route.fulfill({ headers: { 'access-control-expose-headers': 'content-range', 'content-range': `${offset}-${offset + limit - 1}/${vehicles.length}` }, json: vehicles.slice(offset, offset + limit) });
    }
    return route.fulfill({ json: [] });
  });
  await page.goto('/');
  await expect(page.getByRole('button', { name: user ? 'Cadastrar Placa' : 'Entrar', exact: true })).toBeVisible();
  return { requests, records: () => items, emit(table) {
    for (const [topic, channel] of channels) {
      for (const filter of channel.changes.filter((change) => change.table === table)) {
        channel.socket.send(JSON.stringify([channel.joinRef, null, topic, 'postgres_changes', {
          ids: [filter.id], data: { schema: 'public', table, type: 'UPDATE', record: items[0], old_record: {}, columns: [], commit_timestamp: new Date().toISOString() },
        }]));
      }
    }
  } };
}

test('data operacional respeita o dia de Fortaleza perto da meia-noite UTC', async ({ page }) => {
  await setup(page);
  await page.clock.install({ time: new Date('2026-10-29T01:00:00Z') });
  const date = await page.evaluate(async () => (await import('/src/services/placasService.js')).todayISO());
  expect(date).toBe('2026-10-28');
});

test('operador nao ve auditoria de encerramento no relatorio', async ({ page }) => {
  await setup(page, { user: operator, records: [seed({ status: 'Finalizado', finalizado_por: 'auditoria-restrita@example.com', finalizado_em: `${today}T12:00:00Z` })] });
  await page.getByRole('button', { name: 'Relatório', exact: true }).click();
  await expect(page.getByText('Registros do período')).toBeVisible();
  await expect(page.getByText('auditoria-restrita@example.com')).toHaveCount(0);
});

test('detalhes dos cards usam a mesma data do contador', async ({ page }) => {
  const { requests } = await setup(page, { records: [seed(), seed({ id: 'old', data: '2020-01-01' })] });
  await page.getByRole('button', { name: /Fila de Chamada Aguardando/ }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByLabel('Data', { exact: true })).toHaveValue(today);
  await expect(dialog.getByRole('article')).toHaveCount(1);
  expect(requests.some((r) => r.path.endsWith('/placas') && r.search.includes('data=eq.'))).toBe(true);
});

test('reaberto nao e classificado como encerrado em outro local', async ({ page }) => {
  await setup(page);
  const value = await page.evaluate(async () => (await import('/src/services/placasService.js')).isOutroLocalRecord({ status: 'Aguardando', ocorrido: '[Carregou em outro local]\n[Reabertura] RETORNO' }));
  expect(value).toBe(false);
});

test('fim de prioridade local realmente vai para ultima posicao', async ({ page }) => {
  const original = seed({ prioridade_local: true, retorno_local: true });
  const { records } = await setup(page, { records: [original, seed({ id: 'second', placa: 'DEF5678', ordem: 20 })] });
  await page.evaluate(async (item) => (await import('/src/services/placasService.js')).moveToEnd(item), original);
  const updated = records().find((item) => item.id === original.id);
  expect(updated.prioridade_local).toBe(false);
  expect(updated.retorno_local).toBe(false);
  expect(updated.ordem).toBe(21);
});

test('login invalido libera o botao e mostra erro em portugues', async ({ page }) => {
  await setup(page, { user: null });
  await page.getByLabel('E-mail', { exact: true }).fill('operador@example.com');
  await page.locator('input[autocomplete="current-password"]').fill('SENHA-TESTE');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByText('E-mail ou senha incorretos.', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toBeEnabled();
});

test('encerrados veiculos e auditoria nao sao buscados no inicio', async ({ page }) => {
  const { requests } = await setup(page);
  await expect(page.getByText('ABC1234', { exact: true })).toBeVisible();
  expect(requests.filter((r) => r.path.endsWith('/veiculos_motoristas'))).toHaveLength(0);
  expect(requests.filter((r) => r.path.endsWith('/placas_auditoria'))).toHaveLength(0);
  expect(requests.some((r) => r.search.includes('status=in.%28Finalizado'))).toBe(false);
});

test('chamado chegou carregando e finalizar atualizam secoes e auditoria', async ({ page }) => {
  const { requests } = await setup(page);
  const card = page.getByRole('article').filter({ hasText: 'ABC1234' });
  await card.getByRole('button', { name: 'Chamado', exact: true }).click();
  let dialog = page.getByRole('dialog', { name: 'Dados do frete' });
  await expect(dialog.getByRole('button', { name: 'Confirmar chamado' })).toBeDisabled();
  await dialog.getByLabel('Cidade destino *').fill('fortaleza');
  await dialog.getByLabel('Valor do frete carreteiro *').fill('1.500,50');
  await dialog.getByRole('button', { name: 'Confirmar chamado' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('heading', { name: 'Fila de Chamada (0)', exact: true })).toBeVisible();
  await card.getByRole('button', { name: 'Chegou', exact: true }).click();
  await expect(card.getByText('Chegou', { exact: true })).toBeVisible();
  await card.getByRole('button', { name: 'Carregando', exact: true }).click();
  await expect(card.getByText('Carregando', { exact: true })).toBeVisible();
  await card.getByRole('button', { name: 'Finalizar', exact: true }).click();
  await expect(card).toHaveCount(0);
  expect(requests.filter((r) => r.path.endsWith('/placas_auditoria') && r.method === 'POST').map((r) => r.body.acao)).toEqual(['Chamado', 'Chegou', 'Carregando', 'Finalizado']);
  const called = requests.find((r) => r.body?.status === 'Chamado');
  expect(called.body.cidade_destino).toBe('FORTALEZA');
  expect(called.body.valor_frete_carreteiro).toBe(1500.5);
});

test('ligacao conserva posicao e nao atendeu vai ao fim', async ({ page }) => {
  const { records } = await setup(page, { records: [seed(), seed({ id: 'second', placa: 'DEF5678', ordem: 20 })] });
  let card = page.getByRole('article').filter({ hasText: 'ABC1234' });
  await card.getByRole('button', { name: '1ª ligação', exact: true }).click();
  await expect.poll(() => records()[0].primeira_ligacao).toBeTruthy();
  expect(records()[0].ordem).toBe(10);
  await expect(card).toContainText('#1');
  await card.getByRole('button', { name: 'Não atendeu', exact: true }).click();
  await expect.poll(() => records()[0].status).toBe('Não atendeu');
  await expect(card).toContainText('#2');
  expect(records()).toHaveLength(2);
});

test('cancelamento exige motivo e encerra sem apagar registro', async ({ page }) => {
  const { records } = await setup(page);
  await page.getByRole('article').filter({ hasText: 'ABC1234' }).getByRole('button', { name: 'Ações', exact: true }).click();
  await page.getByRole('button', { name: 'Cancelar carga', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Cancelar carga' });
  await expect(dialog.getByRole('button', { name: 'Confirmar cancelamento' })).toBeDisabled();
  await dialog.getByLabel('Motivo do cancelamento *').selectOption('Outro');
  await expect(dialog.getByRole('button', { name: 'Confirmar cancelamento' })).toBeDisabled();
  await dialog.getByLabel('Observacao').fill('cliente desistiu');
  await dialog.getByRole('button', { name: 'Confirmar cancelamento' }).click();
  await expect(dialog).toBeHidden();
  expect(records()).toHaveLength(1);
  expect(records()[0].status).toBe('Cancelado');
  expect(records()[0].cancelado_por).toBe(manager.email);
  expect(records()[0].ocorrido).toContain('CLIENTE DESISTIU');
});

test('outro local encerra diretamente usando somente campos existentes', async ({ page }) => {
  const { records } = await setup(page);
  await page.getByRole('article').filter({ hasText: 'ABC1234' }).getByRole('button', { name: 'Ações', exact: true }).click();
  await page.getByRole('button', { name: 'Carregou em outro local', exact: true }).click();
  await expect(page.getByText('Motorista removido da fila como carregou em outro local.', { exact: true })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(records()[0].status).toBe('Finalizado');
  expect(records()[0].finalizado_em).toBeTruthy();
  expect(records()[0].carregado_outro_local_em).toBeUndefined();
});

test('acao na pagina 2 preserva pagina quando ainda tem itens', async ({ page }) => {
  await setup(page, { records: Array.from({ length: 12 }, (_, i) => seed({ id: `record-${i}`, placa: `AAA${1000 + i}`, ordem: i + 1 })) });
  const nav = page.getByRole('navigation', { name: 'Paginacao' });
  await nav.getByRole('button', { name: '2', exact: true }).click();
  const card = page.getByRole('article').filter({ hasText: 'AAA1010' });
  await card.getByRole('button', { name: 'Ações', exact: true }).click();
  await page.getByRole('button', { name: 'Carregou em outro local', exact: true }).click();
  await expect(page.getByText('Mostrando 11-11 de 11', { exact: true })).toBeVisible();
  await expect(page.getByRole('article').filter({ hasText: 'AAA1011' })).toBeVisible();
});

test('cadastro bloqueia placa duplicada normalizada e preserva formulario', async ({ page }) => {
  const { requests } = await setup(page);
  await page.getByRole('button', { name: 'Cadastrar Placa', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Placa *', { exact: true }).fill('abc-1234');
  await dialog.getByLabel('Motorista *', { exact: true }).fill('teste');
  await dialog.getByLabel('Telefone *', { exact: true }).fill('85999999999');
  await dialog.getByRole('button', { name: 'Cadastrar no Final da Fila' }).click();
  await expect(dialog.getByText('Essa placa já está cadastrada na fila.', { exact: true })).toBeVisible();
  await expect(dialog.getByLabel('Placa *', { exact: true })).toHaveValue('ABC-1234');
  expect(requests.filter((r) => r.path.endsWith('/placas') && r.method === 'POST')).toHaveLength(0);
});

test('cadastro de veiculos busca somente a pagina escolhida', async ({ page }) => {
  await setup(page, { vehicles: Array.from({ length: 25 }, (_, i) => seed({ id: `vehicle-${i}`, placa: `VAA${1000 + i}`, ultimo_uso_em: new Date().toISOString() })) });
  await page.getByRole('button', { name: 'Cadastro de Veículos', exact: true }).click();
  await expect(page.getByText('VAA1000', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Próxima', exact: true }).click();
  await expect(page.getByText(/Página 2 de/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Anterior', exact: true })).toBeEnabled();
});

test('tempo real atualiza cadastro de veiculos aberto', async ({ page }) => {
  const { requests, emit } = await setup(page, { vehicles: [seed()] });
  await expect(page.getByText('Tempo real ativo', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cadastro de Veículos', exact: true }).click();
  await expect(page.getByText('ABC1234', { exact: true })).toBeVisible();
  const count = requests.filter((r) => r.path.endsWith('/veiculos_motoristas')).length;
  emit('veiculos_motoristas');
  await expect.poll(() => requests.filter((r) => r.path.endsWith('/veiculos_motoristas')).length).toBeGreaterThan(count);
});

test('tempo real preserva pagina e nao busca abas fechadas', async ({ page }) => {
  const { requests, emit } = await setup(page, { records: Array.from({ length: 12 }, (_, i) => seed({ id: `record-${i}`, placa: `AAA${1000 + i}`, ordem: i + 1 })) });
  await expect(page.getByText('Tempo real ativo', { exact: true })).toBeVisible();
  await page.getByRole('navigation', { name: 'Paginacao' }).getByRole('button', { name: '2', exact: true }).click();
  const count = requests.filter((r) => r.path.endsWith('/placas')).length;
  emit('placas');
  await expect.poll(() => requests.filter((r) => r.path.endsWith('/placas')).length).toBeGreaterThan(count);
  await expect(page.getByText('Mostrando 11-12 de 12', { exact: true })).toBeVisible();
  expect(requests.filter((r) => r.path.endsWith('/veiculos_motoristas'))).toHaveLength(0);
});

test('operador tem fim mas nao subir descer historico ou reabertura', async ({ page }) => {
  await setup(page, { user: operator });
  await page.getByRole('article').getByRole('button', { name: 'Ações', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Fim', exact: true })).toBeVisible();
  for (const name of ['Subir', 'Descer', 'Histórico', 'Reabrir']) {
    await expect(page.getByRole('button', { name, exact: true })).toHaveCount(0);
  }
});

test('relatorio nao aceita resposta antiga sobrescrevendo filtro novo', async ({ page }) => {
  await setup(page);
  let release;
  const delayed = new Promise((resolve) => { release = resolve; });
  await page.route('https://priority-test.supabase.co/rest/v1/placas?**', async (route) => {
    const url = new URL(route.request().url());
    const value = url.searchParams.get('responsavel_email');
    if (!value) return route.fallback();
    if (value.includes('ANTIGO')) {
      await delayed;
      await route.fulfill({ json: [seed({ placa: 'OLD9999' })] });
    } else {
      await route.fulfill({ json: [seed({ placa: 'NEW9999' })] });
    }
  });
  await page.getByRole('button', { name: 'Relatório', exact: true }).click();
  await page.locator('.period-report').getByRole('button', { name: 'Filtros', exact: true }).click();
  const field = page.locator('.period-report').getByLabel('Responsável', { exact: true });
  const pending = page.waitForRequest((r) => r.url().includes('ANTIGO'));
  await field.fill('ANTIGO');
  await pending;
  await field.fill('NOVO');
  await expect(page.getByRole('heading', { name: 'NEW9999', exact: true })).toBeVisible();
  const returned = page.waitForResponse((r) => r.url().includes('ANTIGO'));
  release();
  await returned;
  await expect(page.getByRole('heading', { name: 'NEW9999', exact: true })).toBeVisible();
});

test('reabertura seguida de finalizacao normal nao herda outro local', async ({ page }) => {
  await setup(page);
  const result = await page.evaluate(async () => {
    const { isOutroLocalRecord, isActiveStatus } = await import('/src/services/placasService.js');
    return {
      normal: isOutroLocalRecord({ status: 'Finalizado', ocorrido: '[Carregou em outro local]\n[Reabertura] RETORNO' }),
      other: isOutroLocalRecord({ status: 'Carregado em outro local' }),
      active: isActiveStatus('Carregado em outro local'),
    };
  });
  expect(result).toEqual({ normal: false, other: true, active: false });
});

test('reabrir bloqueia duplicidade ativa antes de qualquer alteracao', async ({ page }) => {
  const original = seed({ status: 'Cancelado' });
  const { requests } = await setup(page, { records: [original, seed({ id: 'active', placa: 'ABC-1234' })] });
  const message = await page.evaluate(async (item) => {
    try {
      await (await import('/src/services/placasService.js')).reopenPlaca(item, 'RETORNO');
      return '';
    } catch (error) { return error.message; }
  }, original);
  expect(message).toBe('Essa placa já está cadastrada na fila.');
  expect(requests.filter((r) => r.method === 'PATCH')).toHaveLength(0);
});

test('remover prioridade local limpa retorno para edicao nao reativar', async ({ page }) => {
  const original = seed({ prioridade_local: true, retorno_local: true });
  const { records } = await setup(page, { records: [original] });
  await page.evaluate(async (item) => (await import('/src/services/placasService.js')).removePrioridadeLocal(item), original);
  expect(records()[0].prioridade_local).toBe(false);
  expect(records()[0].retorno_local).toBe(false);
});

test('movimento entre grupos nao informa sucesso sem mudar posicao', async ({ page }) => {
  const first = seed({ prioridade_local: true });
  const second = seed({ id: 'second', placa: 'DEF5678', ordem: 20 });
  const { requests } = await setup(page, { records: [first, second] });
  const error = await page.evaluate(async ({ first, second }) => {
    try {
      await (await import('/src/services/placasService.js')).swapOrder(first, second);
      return '';
    } catch (err) { return err.message; }
  }, { first, second });
  expect(error).toContain('prioridade local');
  expect(requests.filter((r) => r.method === 'PATCH')).toHaveLength(0);
});

test('dashboard nao quebra JavaScript nem cria overflow horizontal', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await setup(page);
  await expect(page.getByText('ABC1234', { exact: true })).toBeVisible();
  const width = await page.evaluate(() => ({ document: document.documentElement.scrollWidth, viewport: window.innerWidth }));
  expect(width.document).toBeLessThanOrEqual(width.viewport);
  expect(errors).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath('dashboard.png'), fullPage: true });
});

test('duplicidade verifica todas as paginas de registros ativos', async ({ page }) => {
  await setup(page);
  await page.route('https://priority-test.supabase.co/rest/v1/placas?**', async (route) => {
    const url = new URL(route.request().url());
    if (url.searchParams.get('select') !== 'id,placa,placa_cavalo,placa_carreta,status') return route.fallback();
    const offset = Number(url.searchParams.get('offset') || 0);
    const rows = offset === 0
      ? Array.from({ length: 500 }, (_, i) => seed({ id: `active-${i}`, placa: `XYZ${1000 + i}` }))
      : [seed({ placa: 'ABC-1234' })];
    return route.fulfill({ json: rows });
  });
  const error = await page.evaluate(async () => {
    try {
      await (await import('/src/services/placasService.js')).createPlaca({ placa: 'ABC1234', motorista: 'TESTE', telefone: '85999999999' }, { id: 'test', email: 'test@example.com' });
      return '';
    } catch (err) { return err.message; }
  });
  expect(error).toBe('Essa placa já está cadastrada na fila.');
});
