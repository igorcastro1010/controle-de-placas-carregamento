import { test, expect } from '@playwright/test';

const user = { id: '11111111-1111-4111-8111-111111111111', email: 'gerencia.ce@grupodago.com.br', aud: 'authenticated', role: 'authenticated' };

test.beforeEach(async ({ page }) => {
  await page.addInitScript((user) => {
    sessionStorage.setItem('sb-priority-test-auth-token', JSON.stringify({
      access_token: 'test-token', refresh_token: 'test-refresh',
      expires_at: Math.floor(Date.now() / 1000) + 3600, user,
    }));
  }, user);

  let items = ['AAA1111', 'BBB2222', 'CCC3333'].map((placa, index) => ({
    id: `test-${index}`, placa, motorista: `MOTORISTA ${index + 1}`,
    telefone: '85999999999', status: 'Aguardando', ordem: index + 10,
    tipo_veiculo: 'Truck', motorista_prioridade: index === 1,
    data: new Date().toISOString().slice(0, 10), hora: '09:00:00',
    created_at: new Date().toISOString(), responsavel_email: user.email,
  }));
  await page.route('https://priority-test.supabase.co/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname.startsWith('/auth/')) return route.fulfill({ json: { user } });
    if (url.pathname.endsWith('/placas')) {
      if (request.method() === 'POST') {
        const record = { ...request.postDataJSON(), id: 'new-record', created_at: new Date().toISOString() };
        items = [...items, record];
        return route.fulfill({ json: record });
      }
      if (request.method() === 'PATCH') {
        const id = url.searchParams.get('id').replace('eq.', '');
        items = items.map((item) => item.id === id ? { ...item, ...request.postDataJSON() } : item);
        return route.fulfill({ json: items.find((item) => item.id === id) });
      }
      if (url.searchParams.get('limit') === '1') {
        return route.fulfill({ json: [items.reduce((last, item) => item.ordem > last.ordem ? item : last)] });
      }
      return route.fulfill({ json: items });
    }
    if (url.pathname.endsWith('/veiculos_motoristas') && request.method() === 'POST') {
      return route.fulfill({ json: { ...request.postDataJSON(), id: 'vehicle-test' } });
    }
    return route.fulfill({ json: [] });
  });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Cadastrar Placa', exact: true })).toBeVisible();
});

test('aba filtra prioridades sem mudar a ordem nem a posicao real', async ({ page }) => {
  const cards = page.locator('.queue-card-list').first().getByRole('article');
  await expect(cards).toHaveCount(3);
  await expect(cards.nth(0)).toContainText('AAA1111');
  await expect(cards.nth(1)).toContainText('BBB2222');
  await page.getByRole('button', { name: 'Motoristas prioridade (1)', exact: true }).click();
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText('BBB2222');
  await expect(cards.first()).toContainText('#2');
  await page.getByRole('button', { name: 'Todos (3)', exact: true }).click();
  await expect(cards.nth(0)).toContainText('AAA1111');
  await expect(cards.nth(1)).toContainText('BBB2222');
  await expect(cards.nth(2)).toContainText('CCC3333');
});

test('cadastro prioritario entra no final sem prioridade local', async ({ page }) => {
  await page.getByRole('button', { name: 'Cadastrar Placa', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Placa *', { exact: true }).fill('DDD4444');
  await dialog.getByLabel('Motorista *', { exact: true }).fill('NOVO MOTORISTA');
  await dialog.getByLabel('Telefone *', { exact: true }).fill('85988888888');
  await dialog.getByRole('checkbox', { name: /Motorista prioridade/ }).check();
  const savedRequest = page.waitForRequest((request) => request.url().includes('/rest/v1/placas') && request.method() === 'POST');
  await dialog.getByRole('button', { name: 'Cadastrar no Final da Fila' }).click();
  const payload = (await savedRequest).postDataJSON();
  expect(payload.motorista_prioridade).toBe(true);
  expect(payload.prioridade_local).toBe(false);
  expect(payload.ordem).toBeGreaterThan(12);
  await expect(dialog).toBeHidden();
  await page.getByRole('button', { name: 'Motoristas prioridade (2)', exact: true }).click();
  await expect(page.locator('.queue-card-list').first().getByRole('article')).toHaveCount(2);
});

test('edicao remove a classificacao sem alterar a ordem', async ({ page }) => {
  const card = page.locator('.queue-card-list').first().getByRole('article').filter({ hasText: 'BBB2222' });
  await card.getByRole('button', { name: 'Ações', exact: true }).click();
  await page.getByRole('button', { name: 'Editar', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Editar marcação' });
  await expect(dialog.getByRole('checkbox', { name: /Motorista prioridade/ })).toBeChecked();
  await dialog.getByRole('checkbox', { name: /Motorista prioridade/ }).uncheck();
  await dialog.getByRole('button', { name: 'Salvar alterações' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('button', { name: 'Motoristas prioridade (0)', exact: true })).toBeVisible();
  await expect(card).toContainText('#2');
  await page.getByRole('button', { name: 'Motoristas prioridade (0)', exact: true }).click();
  await expect(page.getByText('Nenhum registro encontrado.', { exact: true }).first()).toBeVisible();
});
