# Esquema Supabase e mapeamento dos contratos

Este documento descreve o esquema remoto fornecido pelo responsável do projeto. Não constitui uma migração versionada nem prova de inspeção direta do projeto Supabase. O backend deste checkout apenas lê `admin_profiles` para autenticação; não existem operações CRUD de conteúdo.

## Convenções

A API planeada usa `camelCase`; a persistência usa `snake_case`. O mapeamento é direto (`targetAudience` → `target_audience`, `classSessionId` → `class_session_id`, etc.). IDs UUID são strings na API; timestamps são ISO 8601 com offset; datas são `YYYY-MM-DD`; horas são `HH:mm:ss` com fração opcional até microssegundos; weekday segue ISO 1–7; timezone é um identificador IANA.

## Tabelas e constraints fornecidas

| Tabela | Colunas | Regras confirmadas |
| --- | --- | --- |
| `admin_profiles` | `user_id` PK, `display_name`, `avatar_asset_id`, `role`, `is_active`, `created_at`, `updated_at` | role `owner`/`admin`; `avatar_asset_id` → `media_assets.id`. Alvo FK de `user_id` não confirmado. |
| `classes` | `id`, `slug`, `title`, `description`, `target_audience`, `location`, `status`, `sort_order`, `published_at`, `expires_at`, `created_by`, `updated_by`, timestamps | slug único; status `draft`/`published`/`archived`; expiry posterior a published_at quando ambos existem. Alvos FK de created_by/updated_by não confirmados. |
| `class_sessions` | `id`, `class_id`, `weekday`, `start_time`, `end_time`, `timezone`, `location`, `status`, `valid_from`, `valid_until`, `sort_order`, timestamps | class_id → classes.id; weekday 1–7; end > start; valid_until ≥ valid_from; status draft/published/archived. |
| `schedule_exceptions` | `id`, `class_session_id`, `exception_date`, `exception_type`, `replacement_start_time`, `replacement_end_time`, `replacement_location`, `public_note`, `status`, timestamps | session FK; unique (session,date); cancelled sem horários substitutos; modified exige ambos e end > start; status draft/published/archived. |
| `media_assets` | `id`, `bucket_id`, `storage_path`, `media_type`, `original_filename`, `title`, `description`, `alt_text`, `mime_type`, `size_bytes`, `width`, `height`, `duration_seconds`, `status`, `sort_order`, `published_at`, `uploaded_by`, timestamps | path único; media_type image/video; estado draft/published/archived; tamanho ≥0; dimensões positivas quando presentes; duração ≥0. FK uploaded_by não confirmada. |
| `site_config` | `id`, `config_key`, `config_value` JSONB, `is_public`, `updated_by`, timestamps | config_key único. Modelo chave/valor; `site_config_versions` não existe no esquema fornecido. |
| `contact_messages` | `id`, `name`, `email`, `phone`, `subject`, `message`, `status`, `admin_notes`, `replied_at`, timestamps | name 1–150, email 3–320, message 1–10000 após trim; status new/read/replied/archived. `admin_notes` e `replied_at` são administrativos. |

As colunas `created_by`, `updated_by` e `uploaded_by` não têm alvo FK confirmado. Não se presume relação com `auth.users`.

## Contratos e estado

A OpenAPI marca `/health` como implementado e `/admin-test` como temporário implementado. O único acesso a dados da aplicação é a leitura `user_id, role, is_active` em `admin_profiles` durante autenticação. Todos os contratos de conteúdo são futuros, não implementados.

- Classes: criação exige `slug` explícito; geração automática não está decidida. Create/Patch/Response incluem as colunas reais. A unicidade pode gerar conflito; publicação só deve expor status publicado dentro da janela.
- Sessões: pertencem sempre a uma classe; usam formatos acima e validam weekday, hora e intervalo de validade.
- Exceções: pertencem obrigatoriamente a uma sessão e data; `cancelled` não tem horários substitutos; `modified` exige ambos. Leitura pública futura combina sessões publicadas válidas e exceções publicadas no período consultado, omitindo rascunhos/arquivados/expirados.
- Media: contrato representa `media_assets`, sem providers externos, HTML embed ou upload intent. O bucket atual `dojo-media` é público, limite 104857600 bytes (100 MiB), MIME: image/jpeg, image/png, image/webp, image/gif, video/mp4, video/webm, video/quicktime. Metadado draft não torna privado o objeto público. Upload e remoção não estão contratados/implementados.
- Site config: somente key/value e `is_public`; não há versões confirmadas.
- Contacto: schema público exclui estado, notas, timestamps administrativos e replied_at. Persistência e retenção continuam por aprovar.
- Perfis: role, estado e dados de apresentação são descritos; contratos de gestão não são definidos sem decisão de permissões.

## Segurança e acesso reportados

RLS está ativa nas sete tabelas; FORCE RLS está desativado. Foi reportada policy de gestão por `is_active_admin()` nas tabelas e leitura própria/admin para profiles. `service_role` tem SELECT em `admin_profiles`; não foram reportados privilégios DML nas outras seis tabelas. Bypass RLS não concede por si só privilégios SQL. Não foram reportados grants DML de `authenticated` em `admin_profiles`.

A função `public.is_active_admin()` reportada é STABLE, SECURITY DEFINER, propriedade postgres, `search_path=''`, verifica `auth.uid()`, active e role owner/admin; execução concedida a authenticated, não anon. O trigger de updated_at foi reportado apenas em admin_profiles. Estes factos são informação fornecida; não há migrations ou snapshot SQL neste repositório para os confirmar.

## Pontos pendentes antes de CRUD/migrações

1. Confirmar e versionar o schema remoto, incluindo FKs ainda desconhecidas e permissões SQL necessárias para cada cliente/role.
2. Definir matriz de autorização por operação e estratégia de acesso do backend: JWT do utilizador sujeito a RLS ou cliente privilegiado com grants mínimos e autorização própria.
3. Decidir se bucket público é aceitável para rascunhos e definir policies Storage; não tratar status editorial como privacidade do objeto.
4. Aprovar retenção/acesso a contactos e política de publicação/chaves públicas de site_config.
5. Definir fluxo de upload/remoção só depois de corrigir acesso Storage e ciclo de vida; impor o teto efetivo de 100 MiB e validar bytes reais, não apenas MIME declarado.
6. Aprovar regras de eliminação e referências de assets; esquema fornecido só confirma a referência avatar_asset_id.

Nenhuma tabela, policy, grant ou recurso foi criado nesta fase.

## Restrições de validação da aplicação

- O formato de horas dos contratos usa `HH:mm:ss` com até seis casas fracionárias e rejeita `24:00:00`. Embora PostgreSQL `time` admita a representação de fim de dia, a API restringe-se ao intervalo civil 00:00–23:59:59.999999 para evitar ambiguidade de apresentação; rever esta decisão se o dojo precisar de horários à meia-noite.
- O campo de email aplica validação de formato além do comprimento/trim reportado para a coluna. É uma regra de aplicação deliberadamente mais estrita que as constraints da base de dados; a OpenAPI documenta essa diferença.
- Validações que dependem do registo atual (por exemplo, aplicar um PATCH de `expiresAt` ou `endTime`) devem executar-se sobre o estado persistido combinado com o patch. A função pura em `server/src/domain/patch-validation.js` demonstra esta abordagem sem acesso a dados ou escrita.
