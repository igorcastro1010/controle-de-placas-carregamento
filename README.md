# CONTROLE DE PLACAS - CARREGAMENTO

Sistema web em React + Vite para transportadora controlar a fila de placas de motoristas que vão carregar, com Supabase Auth, banco de dados Supabase e deploy preparado para Vercel.

## Funcionalidades

- Login com Supabase Auth.
- Cadastro de placa com data, hora, ordem, status inicial e responsável automáticos.
- Fila atual exibindo somente registros que não estejam `Finalizado` ou `Cancelado`.
- Ações por placa: ligações, não atendeu, chamado, chegou, carregando, finalizar, cancelar, subir, descer e mandar para o fim.
- Filtros por placa, motorista, status, responsável e data.
- Tela de finalizados e cancelados com filtro por data.
- Relatório do dia com cards por status.
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

Use a `Publishable key`. Não use `Secret key` em projeto React.

7. Vá em `SQL Editor` no Supabase.
8. Copie e execute o conteúdo de [`supabase/placas.sql`](supabase/placas.sql).
9. Em `Authentication > Users`, crie os usuários que vão acessar o sistema.

## Como rodar

```bash
npm install
npm run dev
```

Depois abra a URL mostrada pelo Vite, normalmente `http://localhost:3000`.

Se você usar convite ou recuperação de senha do Supabase, configure em `Authentication > URL Configuration`:

```text
Site URL: http://localhost:3000
Redirect URLs: http://localhost:3000
```

## Deploy na Vercel

### Pelo painel da Vercel

1. Suba este projeto para um repositório Git.
2. Importe o repositório na Vercel.
3. Configure as variáveis de ambiente em `Project Settings > Environment Variables`:

```env
VITE_SUPABASE_URL=https://pmogcbqdqfvxewmjpkbh.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_sua_chave_aqui
```

4. Use estas configurações:

```text
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
```

5. Faça o deploy.

### Pelo terminal

```bash
npm run deploy
```

Se a Vercel pedir login:

```bash
.\node_modules\.bin\vercel.cmd login
npm run deploy
```

Depois que a Vercel gerar a URL online, configure no Supabase em `Authentication > URL Configuration`:

```text
Site URL: https://sua-url-da-vercel.vercel.app
Redirect URLs:
http://localhost:3000
https://sua-url-da-vercel.vercel.app
```

## Estrutura

```text
src/
  components/
    Filters.jsx
    PlacaForm.jsx
    PlacasTable.jsx
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
```
