# CONTROLE DE PLACAS - CARREGAMENTO

Sistema web em React + Vite para controlar a fila de placas de motoristas que vão carregar, usando Supabase Auth, Supabase Database e deploy preparado para Vercel.

## Funcionalidades

- Login com Supabase Auth.
- Cadastro de placa com data, hora, ordem, status inicial e responsável automáticos.
- Tipo de veículo: Truck ou Carreta, com placa do cavalo e placa da carreta.
- Bloqueio de placa duplicada ativa na fila.
- Fila Atual exibindo somente: `Aguardando`, `1ª ligação feita`, `2ª ligação feita`, `3ª ligação feita` e `Não atendeu`.
- Ações por placa: ligações, não atendeu, chamado, chegou, carregando, finalizar, cancelar, subir, descer e mandar para o fim.
- `Não atendeu` mantém o motorista na Fila Atual e manda para o fim da fila ativa.
- Finalizados/Cancelados com auditoria de encerramento.
- Reabertura de Finalizado/Cancelado somente para usuários autorizados, com motivo obrigatório.
- Cards do dashboard clicáveis com modal de detalhes e ações.
- Relatório por período com filtros e resumo.
- Auditoria completa das alterações da fila para gerente/testador.
- Layout responsivo para computador e celular.

## Configuração do Supabase

1. Crie um projeto no Supabase.
2. Abra `Project Settings > Data API` ou `Project Settings > API`.
3. Copie a `Project URL`. Ela deve ter este formato:

```env
https://pmogcbqdqfvxewmjpkbh.supabase.co
```

4. Copie a `Publishable key`, que começa com `sb_publishable_`.
5. Crie um arquivo `.env` na raiz do projeto.
6. Preencha o `.env` assim:

```env
VITE_SUPABASE_URL=https://pmogcbqdqfvxewmjpkbh.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_sua_chave_aqui
```

Use a `Publishable key`. Nunca use `Secret key` em projeto React.

Nunca suba o arquivo `.env` para GitHub, Vercel ou ZIP público. Ele deve ficar apenas na máquina local. Para produção, configure as variáveis diretamente na Vercel.

7. Vá em `SQL Editor` no Supabase.
8. Copie e execute o conteúdo de `supabase/placas.sql`.
9. Se o projeto já existe e falta apenas auditoria, execute `supabase/migrations/add_placas_auditoria.sql`.
10. Em `Authentication > Users`, crie os usuários que vão acessar o sistema.

### Realtime do Supabase

O sistema usa Supabase Realtime para atualizar automaticamente todos os computadores quando uma placa é cadastrada, editada, movida, finalizada, cancelada ou reaberta.

Se as atualizações automáticas não funcionarem, habilite as tabelas na publicação realtime pelo SQL Editor:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.placas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.placas_auditoria;
```

Se o Supabase informar que a tabela já faz parte da publicação, pode ignorar o aviso. O botão `Atualizar` continua disponível como backup manual.

## Auditoria e permissões

A auditoria completa é gravada na tabela `placas_auditoria`.

Usuários autorizados a visualizar histórico e reabrir marcações:

- `gerencia.ce@grupodago.com.br`
- `operacional3.ce@grupodago.com.br`

Esses usuários veem o botão `Histórico` nos cards da Fila Atual, no modal de detalhes do dashboard e em Finalizados/Cancelados. Em registros encerrados, também veem o botão `Reabrir`.

As policies da tabela `placas_auditoria` usam o e-mail do JWT do Supabase para leitura. O front-end também faz controle visual, mas segurança forte deve ficar no banco por RLS/policies.

## Como rodar

```bash
npm install
npm run dev
```

Depois abra a URL mostrada pelo Vite, normalmente `http://localhost:3000`.

Em ambiente local, o link pode variar conforme a porta livre. Normalmente será algo como:

```text
http://localhost:5173
http://127.0.0.1:3000
```

Se você usar convite ou recuperação de senha do Supabase, configure em `Authentication > URL Configuration`:

```text
Site URL: http://localhost:3000
Redirect URLs: http://localhost:3000
```

## Deploy na Vercel

1. Suba este projeto para o GitHub.
2. Importe o repositório na Vercel.
3. Configure as variáveis de ambiente em `Project Settings > Environment Variables`:

```env
VITE_SUPABASE_URL=https://pmogcbqdqfvxewmjpkbh.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_sua_chave_aqui
```

Use somente a `Publishable key` do Supabase, que começa com `sb_publishable_`. Nunca use `Secret key` no React ou em variáveis públicas `VITE_`.

4. Use estas configurações:

```text
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
```

Depois que a Vercel gerar a URL online, configure no Supabase em `Authentication > URL Configuration`:

```text
Site URL: https://sua-url-da-vercel.vercel.app
Redirect URLs:
http://localhost:3000
https://sua-url-da-vercel.vercel.app
```

Em produção, o link público é definido pela Vercel. Para mudar o link público do sistema, configure um domínio em `Project Settings > Domains` na Vercel e depois atualize também as URLs permitidas no Supabase Auth.

## Estrutura

```text
src/
  components/
    ActionButtons.jsx
    AuditHistoryModal.jsx
    CancelPlacaModal.jsx
    DetailsModal.jsx
    Filters.jsx
    PeriodReport.jsx
    PlacaForm.jsx
    PlacasTable.jsx
    ReopenPlacaModal.jsx
    ReportCards.jsx
    StatusBadge.jsx
  pages/
    Dashboard.jsx
    Login.jsx
  services/
    placasService.js
    supabaseClient.js
  App.jsx
  main.jsx
  styles.css
supabase/
  placas.sql
  migrations/
```
