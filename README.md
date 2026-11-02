# Dojo Kenpo Porto Alto

Website público e base técnica inicial para os serviços do Dojo Kenpo Porto Alto. O frontend Vue funciona independentemente; o backend Express inclui health check, clientes Supabase e uma rota administrativa temporária de verificação. As restantes funcionalidades administrativas e de conteúdo ainda não estão implementadas.

## Tecnologias

- **Frontend:** Vue 3, Vite 7, JavaScript ES Modules, Tailwind CSS 4.
- **Backend:** Node.js (20+), Express 5, JavaScript ES Modules, Zod.
- **Dados e identidade previstos/ligados:** Supabase Auth, Postgres e Storage; veja as ressalvas de verificação em [Arquitetura](docs/ARCHITECTURE.md) e [Progresso](docs/PROGRESS.md).
- **Testes do backend:** Node.js Test Runner (`node:test`).

## Estrutura

```text
client/                     Website público Vue/Vite
  public/images/logos/      Logótipos institucionais permanentes
  src/                      Aplicação, estilos e componentes Vue
server/                     API Express e integração Supabase
  src/config/               Validação do ambiente
  src/middleware/           Autenticação, validação, contexto e erros
  src/routes/               Health check e endpoint temporário admin-test
  src/services/             Clientes Supabase
  tests/                    Testes automatizados
  docs/ data-model.md        Mapeamento documentado do esquema Supabase fornecido
  openapi/                  Contratos planeados; não são prova de implementação
docs/                       Arquitetura, segurança e progresso auditado
.gitignore                  Exclusões globais
```

## Requisitos

Node.js **20.19+** ou **22.12+** (o ambiente auditado usou 22.19.0) e npm. Vite 7 necessita de uma versão de Node compatível; o backend declara Node 20 ou superior.

## Frontend local

```sh
cd client
npm ci
npm run dev
```

O Vite mostra o endereço local, normalmente `http://localhost:5173`. Para validar o build e servir o resultado localmente, execute `npm run build` e depois `npm run preview`, ainda em `client/`.

## Backend local

O backend requer configuração Supabase fora do modo de teste. Em PowerShell:

```powershell
cd server
npm ci
Copy-Item .env.example .env
```

Preencha localmente `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` e `SUPABASE_SECRET_KEY` com valores do projeto autorizado. Nunca copie a Secret Key para o frontend, documentação, logs ou Git. Não partilhe o conteúdo do ficheiro `.env`.

```sh
npm run dev
```

O servidor usa `http://localhost:3000` por omissão. A rota `GET /api/v1/health` não requer Supabase. A rota temporária `GET /api/v1/admin-test` exige autenticação e perfil administrativo ativo. Consulte [server/README.md](server/README.md) para scripts e limitações atuais.

## Testes

Na pasta `server/`:

```sh
npm test
```

A suite Node.js executa os testes em `tests/`; o módulo da rota temporária está nomeado `src/routes/admin-router.js` para não ser descoberto como teste. Os testes de autenticação usam clientes simulados; não validam credenciais nem o projeto Supabase remoto.

## Estado e conteúdo

O site mantém conteúdos do dojo por confirmar como provisórios. Não introduza história, linhagem, horários, contactos ou datas sem validação. Fotografias e cartazes não estão incluídos; o backoffice e o CRUD ainda estão por desenvolver.

Leia [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/SECURITY.md](docs/SECURITY.md) e [docs/PROGRESS.md](docs/PROGRESS.md). A documentação de `server/docs/data-model.md` e a OpenAPI estão alinhadas com o esquema Supabase fornecido para esta fase. O estado remoto continua sem migrations versionadas neste repositório e deve ser confirmado antes de futuras alterações de base de dados.
