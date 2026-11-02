# Progresso — Dojo Kenpo Porto Alto

## Implementado no repositório

- Website público Vue 3/Vite e os quatro logótipos institucionais.
- Backend Express 5 em ES Modules, configuração Zod, middleware de segurança/validação/erros.
- Clientes Supabase separados: Publishable Key para Auth e Secret Key no servidor.
- Middleware que valida token, consulta `admin_profiles` e exige perfil ativo `owner` ou `admin`.
- `GET /api/v1/health` e rota temporária `GET /api/v1/admin-test`.
- Testes Node.js para aplicação, schemas e autenticação simulada.

## Contratos e esquema

- Schemas Zod e OpenAPI alinhados com o schema fornecido: sete tabelas, constraints e camelCase externo mapeado a snake_case.
- Apenas health e admin-test são executáveis; as operações de conteúdo documentadas são planeadas.
- O schema remoto, RLS, policies, grants e bucket são contexto fornecido, não snapshot SQL verificado nem migrations versionadas.

## Por desenvolver

- CRUD autorizado para `site_config`, classes, sessões e exceções.
- Aprovação do modelo de permissões e confirmação de grants/RLS necessários ao cliente escolhido.
- Backoffice separado do site público.
- Gestão de mensagens após aprovação de retenção e acesso.
- Upload/eliminação de assets após resolver acesso Storage, privacidade do bucket e ciclo de vida.
- Testes de integração controlados com Supabase; testes atuais usam mocks.

## Pendências técnicas

1. Confirmar grants SQL para as operações de conteúdo; bypass RLS não equivale a privilégios SQL.
2. Rever o bucket público e policies Storage antes de upload ou conteúdo draft.
3. Decidir geração de slug, permissão por operação, retenção de contacto e eliminação de assets.
4. A rota temporária foi renomeada para `src/routes/admin-router.js` para não ser recolhida pelo padrão de descoberta do Node Test Runner.

Não foram implementadas funcionalidades de backoffice nem operações CRUD nesta fase.

