-- ATENCAO: este script apaga todos os dados de teste.
-- Rode no Supabase SQL Editor do projeto correto.

truncate table public.placas restart identity cascade;

delete from auth.users;
