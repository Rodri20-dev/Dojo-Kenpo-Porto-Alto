# Backend e contratos da API

Backend Node.js/Express 5 com JavaScript ES Modules e Zod 4. Rotas executáveis nesta branch: `GET /api/v1/health` e `GET /api/v1/admin-test` (temporária). A única leitura de dados é `admin_profiles` durante autenticação. Não há CRUD, upload nem backoffice.

## Executar

Requer Node.js 20+. A partir de `server/`:

```sh
npm install
Copy-Item .env.example .env
npm run dev
```

O servidor usa `http://localhost:3000`. Testes: `npm test`; arranque sem watch: `npm start`. Não inclua valores secretos em documentação ou frontend.

## Estado dos contratos

`openapi/openapi.yaml` descreve health e admin-test como operações executáveis. Conteúdo público e administrativo aparece como planeado e não implementado. A especificação segue camelCase; `server/docs/data-model.md` documenta o mapeamento às colunas snake_case do schema Supabase fornecido.

O schema atual é chave/valor em `site_config`; as demais entidades são as sete tabelas descritas no documento de dados. Não há `site_config_versions`, tabelas separadas de posters/galeria ou respostas de contacto confirmadas. O esquema remoto é contexto fornecido e não está versionado por migrations neste repositório.

O bucket informado `dojo-media` é público, limitado a 104857600 bytes (100 MiB) e aos MIME listados no modelo. Status draft não protege objetos. Não existem neste backend contratos ou implementação de upload/eliminação. As permissões reais de Storage e os grants SQL devem ser confirmados antes de CRUD; bypass RLS não substitui privilégios SQL.

## Autenticação

`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` e `SUPABASE_SECRET_KEY` são nomes de configuração. O cliente Auth usa a Publishable Key; a Secret Key fica exclusivamente no servidor. O middleware valida o token com Supabase Auth e consulta `admin_profiles`, exigindo perfil ativo com role `owner` ou `admin`. `/admin-test` é apenas diagnóstico temporário. Os testes usam mocks; a validação manual real foi reportada pelo responsável, não repetida nesta documentação.

Consulte `../docs/SECURITY.md` para limites de RLS, grants, CORS, logs e configuração remota reportada.
