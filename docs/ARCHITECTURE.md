# Arquitetura — Dojo Kenpo Porto Alto

## Aplicações

- `client/`: website público Vue 3/Vite.
- `server/`: API Node.js/Express 5, ES Modules, validação Zod 4.
- `docs/`: arquitetura, segurança e progresso.

O frontend público e a futura interface administrativa devem permanecer separados. Backoffice não está implementado.

## Backend atual

Express monta `GET /api/v1/health` e `GET /api/v1/admin-test`. A última é temporária. A única consulta ao banco lê `user_id`, `role` e `is_active` de `admin_profiles` para autenticar administradores. Não existem operações de conteúdo nem endpoints CRUD executáveis.

A aplicação usa middleware para request context, validação, CORS, Helmet, rate limit global e erros. Contratos futuros estão em `server/openapi/openapi.yaml`; `x-implementation-status` distingue os endpoints executáveis dos planeados.

## Supabase e contratos

O contexto fornecido identifica sete tabelas: `admin_profiles`, `classes`, `class_sessions`, `schedule_exceptions`, `media_assets`, `site_config` e `contact_messages`. O esquema detalhado, constraints, RLS/grants reportados e mapeamento camelCase/snake_case estão em `server/docs/data-model.md`. Não há migrations SQL que versionem o estado remoto.

`authClient` valida utilizadores com Supabase Auth; `adminClient` usa Secret Key para consultar perfil. Essa chave só pode existir no servidor. O fluxo atual consulta perfil ativo e role `owner`/`admin`. Autenticação não implementa permissões granulares por operação. Antes de conteúdo CRUD, devem ser confirmados privilégios SQL e políticas RLS para o método de acesso escolhido.

O bucket informado `dojo-media` é público. Um registo editorial draft não oculta o objeto. Upload, remoção segura e backoffice não estão implementados.

## Contratos de dados

A API planeada usa camelCase; tabelas usam snake_case, com mapeamento direto documentado. Não estão confirmadas tabelas de versões de configuração, posters, entidades de galeria ou respostas. Exceções ligam-se a sessões; configuração segue chave/valor.
