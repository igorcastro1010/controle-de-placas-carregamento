# Revisao do sistema

Revisao local com testes de navegador em desktop (1440px) e celular (390px),
Supabase REST/Auth e WebSocket simulados. Nenhum registro de producao foi alterado.

## Correcoes

- Data e hora operacionais usam America/Fortaleza, evitando data UTC adiantada.
- Detalhes dos cards iniciam com a mesma data usada no contador diario.
- Campos de auditoria de encerramento do relatorio respeitam a permissao visual.
- Historico de outro local nao contamina registros reabertos/finalizados novamente.
- Status legado Carregado em outro local e reconhecido como encerrado.
- Fim e remocao de prioridade limpam retorno/prioridade local para chegar ao fim real.
  A classificacao motorista_prioridade nao e alterada.
- Reabertura verifica placa/cavalo/carreta duplicados antes de alterar o registro.
- Subir/Descer localizam vizinhos pela fila completa, nao pelo indice filtrado.
  Movimentos entre grupos de prioridade sao recusados com uma mensagem explicita.
- Respostas antigas de consultas nao sobrescrevem filtros mais recentes.
- Eventos de auditoria nao recarregam toda a fila. Eventos de veiculos atualizam a
  aba aberta. O debounce preserva eventos simultaneos de tipos diferentes.
- Requisicoes HTTP ao Supabase possuem limite de 20 segundos. O login mantem o
  limite proprio de 15 segundos. Falhas ao sair sao apresentadas na tela.
- Observacoes padrao voltaram ao select de preenchimento automatico.
- Corrigida acentuacao no filtro Tipo de veiculo.
- Vite atualizado dentro da versao principal 8, com dependencias transitivas corrigidas.

## Validacao

Execute `npm run test:e2e`, `npm run build` e `npm audit`.
Os testes cobrem login invalido, permissoes visuais, cadastro/edicao de prioridade,
duplicidade, reabertura, cancelamento obrigatorio, chamado/frete, chegou,
carregando, finalizar, outro local, ligacoes, fim, paginacao, consultas sob demanda,
eventos realtime, datas e respostas atrasadas.

## Limites e pendencias do banco

- Testes simulados nao certificam login com contas reais, entrega de e-mails ou
  sincronizacao entre dois computadores contra o banco remoto.
- A publicacao realtime de veiculos precisa ser habilitada no Supabase.
  SQL: `supabase/migrations/enable_veiculos_realtime.sql`.
- Ocultar campos de finalizacao no relatorio e controle visual. As policies atuais
  de placas permitem UPDATE a usuarios autenticados; restringir movimentos e
  reabertura de verdade exige regras no banco. A policy de placas_auditoria e
  restrita aos emails autorizados no SQL local, mas nao foi auditada por acesso admin.
- A verificacao de duplicidade no cliente nao e atomica entre computadores.
  Trocas de ordem usam multiplos updates; falhas parciais e movimentacoes concorrentes
  exigem uma RPC transacional e protecao de unicidade para garantia no banco.
- Listas que ainda nao usam range podem atingir o limite de linhas configurado
  no Supabase em grandes volumes. Contadores em grande escala devem migrar para
  agregacao no banco; essa revisao nao alterou esquema de negocio nem RLS remotos.

Nao foi feito deploy desta revisao automaticamente.
