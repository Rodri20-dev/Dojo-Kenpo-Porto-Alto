# Segurança — Dojo Kenpo Porto Alto

## Credenciais e Supabase

O código espera `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` e `SUPABASE_SECRET_KEY`. A Publishable Key é usada no cliente Auth do backend para validar utilizadores. A Secret Key é privilegiada e deve ficar apenas no ambiente do servidor; nunca a colocar no frontend, logs ou Git. Não documentar valores de `.env`.

## Autenticação e autorização atuais

O middleware lê Bearer token, chama `authClient.auth.getUser(token)`, obtém `user_id`, `role`, `is_active` de `admin_profiles` via `adminClient` e permite apenas perfil ativo com role `owner` ou `admin`. O cliente não define a identidade/role/estado usados na decisão. A rota `/api/v1/admin-test` é temporária. Não existem ainda rotas CRUD nem permissões granulares.

Autenticação identifica o utilizador; perfil ativo define membership; autorização deve ainda validar a permissão específica da operação. A role atual não equivale a uma matriz CRUD completa. Qualquer operação administrativa futura deve negar por omissão e validar estado atual no servidor.

## RLS e privilégios SQL (camadas diferentes)

Segundo o estado fornecido, RLS está ativa nas sete tabelas e FORCE RLS está desativado. `is_active_admin()` verifica `auth.uid()`, perfil ativo e role owner/admin. Foi reportada policy de gestão administrativa nas tabelas; `admin_profiles` tem ainda leitura própria/admin. Não foram reportados grants DML `authenticated` em `admin_profiles`.

`service_role` tem SELECT em `admin_profiles`; não foram reportados SELECT/INSERT/UPDATE/DELETE nas outras seis tabelas. Bypass de RLS não concede automaticamente privilégios SQL. Antes de CRUD, confirmar grants exigidos pelo cliente efetivamente escolhido. Esta documentação não executa nem recomenda GRANT/REVOKE automático.

## Storage

O bucket informado `dojo-media` é público, tem limite 104857600 bytes (100 MiB) e MIME `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `video/mp4`, `video/webm`, `video/quicktime`. RLS está ativa em `storage.objects`, sem policies reportadas. O objeto num bucket público não fica privado porque `media_assets.status` seja draft. As permissões SQL de `storage.objects` não substituem autorização RLS. Upload/remoção não estão implementados; não aceitar MIME declarado como prova do tipo real.

## Proteções do processo

CORS usa lista exata configurada; wildcard é rejeitado. Helmet configura cabeçalhos, body JSON tem limite, e rate limit atual é global em memória, adequado apenas a instância única. O limite dedicado de contacto não está aplicado a uma rota. Verificar logs de auth/erros para não registar dados pessoais, tokens ou mensagens sensíveis.

## Limitações e pré-produção

O estado remoto é informação fornecida e não validada por migrations versionadas neste checkout. Confirmar RLS, policies, grants, Storage e fluxo de revogação antes de produção. Testar acesso permitido/negado por papel e falhas de dependência sem expor detalhes. Escolher rate-limit distribuído se houver múltiplas instâncias. Não publicar endpoints administrativos sem autorização por operação no servidor.
