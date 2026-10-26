# Dojo Kenpo Porto Alto

Website do futuro Dojo Kenpo Porto Alto. O repositório separa o frontend atual do espaço reservado para um backend futuro.

## Estrutura

- `client/`: frontend Vue 3, Vite, JavaScript e Tailwind CSS; inclui componentes, estilos, logótipos, dependências e configuração do build.
- `server/`: documentação para uma possível aplicação backend futura. Não contém API nem serviços ativos.
- `.gitignore`: regras globais para dependências, builds, ficheiros de ambiente e logs.

## Executar o frontend

Requer Node.js 22.18 ou superior (ou 24.12 ou superior).

```sh
cd client
npm install
npm run dev
```

O Vite indica no terminal o endereço local, normalmente `http://localhost:5173`.

Para gerar e pré-visualizar a versão de produção, a partir de `client/`:

```sh
npm run build
npm run preview
```

O frontend funciona de forma independente. Não existe backend configurado ou iniciado.

## Conteúdo do website

Os logótipos institucionais permanentes estão em `client/public/images/logos/`. Os textos sobre história, filosofia, linhagem, mestres, aulas, horários, localização detalhada, contactos e abertura permanecem assinalados para confirmação. A galeria está vazia enquanto não houver fotografias reais autorizadas.

Cartazes, fotografias de atividades e outros conteúdos dinâmicos não estão incluídos. Uma futura integração com base de dados e armazenamento Supabase fica fora da estrutura atualmente implementada.
