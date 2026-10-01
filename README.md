# LGRP

Aplicação React/Vite servida por uma API Node/Express. O banco e a autenticação usam MySQL; os usuários entram com e-mail/senha ou Google OAuth.

## Requisitos

- Node.js 20 ou superior e npm.
- MySQL 8 ou MariaDB compatível.
- Uma VPS Hostinger com acesso SSH e um domínio apontado para ela.
- SMTP para convites e redefinição de senha.

## Preparar o GitHub

O repositório não deve conter `.env`, senhas, chaves MySQL, segredo JWT, segredos Google nem a chave de serviço antiga do Supabase. O `.gitignore` já exclui arquivos de ambiente.

1. Crie um repositório vazio no GitHub, sem README ou licença gerados pelo site.
2. Na pasta do projeto, inicialize a branch `main` e confira os arquivos antes de criar o primeiro commit:

```powershell
git init -b main
git status --short
git add .
git status --short
git commit -m "Preparar aplicação LGRP para MySQL"
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
git push -u origin main
```

Troque a URL pelo endereço do repositório. Não faça commit de arquivos `.env` nem use credenciais como argumentos de comandos.

## Preparar MySQL na VPS

Crie no painel da Hostinger um banco e um usuário MySQL dedicados à aplicação, com acesso apenas a esse banco. Em VPS própria, não exponha a porta 3306 à internet; mantenha o MySQL acessível localmente.

Envie o projeto à VPS e, na pasta do projeto, aplique o esquema:

```bash
mysql -h MYSQL_HOST -u MYSQL_USER -p MYSQL_DATABASE < database/schema.sql
```

O comando solicitará a senha sem incluí-la no histórico do terminal. O esquema cria as tabelas de usuários, pedidos, coletas, tratamentos, solventes, reagentes, vidrarias, indicadores, notificações e auditoria.

## Configurar o servidor

Use `.env.example` como lista dos parâmetros e crie um `.env` privado na VPS. Não o envie ao GitHub. Preencha `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`, `JWT_SECRET` e `APP_ORIGIN`. Gere um segredo JWT aleatório com pelo menos 32 caracteres; nunca reutilize a senha do banco.

Configure também `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD` e `SMTP_FROM`. Sem SMTP, não será possível enviar convites nem redefinir senhas.

Para login Google, configure `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` no servidor. Cadastre como URL de callback autorizada:

```text
https://SEU_DOMINIO/api/auth/google/callback
```

Defina `GOOGLE_REDIRECT_URI` com essa mesma URL e `APP_ORIGIN` como `https://SEU_DOMINIO`. O segredo Google fica apenas no `.env` do servidor.

## Migrar os dados antigos

Faça um backup do banco de origem primeiro. A ferramenta abaixo copia dados das tabelas públicas do Supabase para MySQL e pode ser executada novamente sem substituir registros que já existam. Depois de criar o esquema MySQL, configure temporariamente no terminal `SOURCE_SUPABASE_URL` e `SOURCE_SUPABASE_SERVICE_ROLE_KEY`, usando uma chave válida do projeto de origem, e rode:

```bash
npm run db:migrate-supabase
```

Execute a importação antes de criar o primeiro administrador para manter os IDs originais e os vínculos entre registros.

As senhas não podem ser exportadas do Supabase Auth. Os registros dos usuários são copiados sem senha; cada pessoa precisa pedir um link em “Esqueci ou preciso configurar minha senha” ou usar Google. Mantenha SMTP configurado para que os links sejam entregues.

Uma chave privilegiada do Supabase chegou a estar numa configuração versionável. Revogue-a/rotacione-a no painel do Supabase antes de migrar, e nunca a adicione ao GitHub. A chave nova da migração deve ficar apenas no ambiente temporário do terminal.

## Primeiro administrador

Depois da migração, configure temporariamente `ADMIN_NAME`, `ADMIN_EMAIL` e `ADMIN_PASSWORD` no ambiente do terminal da VPS. A senha inicial precisa ter pelo menos 12 caracteres. Execute:

```bash
npm ci
npm run admin:create
```

O comando cria um administrador ou define a senha do administrador indicado que já tenha sido importado. Remova essas três variáveis do ambiente depois. Cadastros novos são feitos por administradores e recebem um link de configuração de senha.

## Publicar na VPS

Instale Node.js 20 ou superior, clone o repositório privado ou público e configure o `.env` local da VPS. Então:

```bash
npm ci
npm run build
npm start
```

O servidor Express serve o frontend construído e as APIs na porta definida por `PORT` (padrão `3000`), vinculada apenas a `127.0.0.1`. Para produção, mantenha o processo ativo com PM2 ou o gerenciador de processos da Hostinger e configure o Nginx como proxy reverso para `127.0.0.1:3000`, com HTTPS. Não publique a porta MySQL nem a porta interna do Node diretamente.

Verifique a API e a conexão ao banco em `https://SEU_DOMINIO/api/health`. Uma resposta `{ "ok": true }` indica que a aplicação alcançou o MySQL.

### Hostinger com importação GitHub

Para o formulário de implantação de aplicativo Node.js da Hostinger, use:

- Predefinição: Express.
- Repositório: `IsaelRosa/LGRP_2026`.
- Branch: `main`.
- Versão do Node: `20.x`.
- Diretório raiz: `./`.
- Comando de compilação: `npm run build`.
- Comando de inicialização: `npm start`.
- Diretório público/saída: não definir; o Express serve `dist` e também as rotas `/api`.

O servidor usa a variável `PORT` fornecida pela plataforma e escuta em `0.0.0.0` para aceitar o tráfego do proxy Hostinger. Não fixe uma porta diferente da variável `PORT`.

O arquivo `.env.example` documenta 24 nomes, mas **não são 24 valores de produção obrigatórios**. Configure no painel da Hostinger as seis chaves essenciais para iniciar e conectar o sistema:

- `NODE_ENV=production`
- `APP_ORIGIN=https://springgreen-magpie-310253.hostingersite.com`
- `JWT_SECRET`: segredo aleatório privado com ao menos 32 caracteres.
- `MYSQL_HOST`: host MySQL mostrado no painel Hostinger.
- `MYSQL_PORT=3306`, salvo se o painel informar outra porta.
- `MYSQL_DATABASE`, `MYSQL_USER` e `MYSQL_PASSWORD`: credenciais do banco criadas no painel.

`PORT` é fornecida pela plataforma; não use `3000` se a Hostinger fornecer outra porta. `MYSQL_CONNECTION_LIMIT` pode ficar ausente (padrão 10).

As variáveis `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD` e `SMTP_FROM` são necessárias para enviar convites e links de senha. As três variáveis Google (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`) são necessárias somente se o botão de login Google for usado; o callback deve ser `https://springgreen-magpie-310253.hostingersite.com/api/auth/google/callback` e também deve estar cadastrado no Google Cloud.

Não configure `ADMIN_NAME`, `ADMIN_EMAIL` e `ADMIN_PASSWORD` como variáveis permanentes do site: elas são usadas uma única vez no terminal para criar o primeiro administrador. `SOURCE_SUPABASE_URL` e `SOURCE_SUPABASE_SERVICE_ROLE_KEY` também são apenas para uma importação temporária, se ainda for migrar dados do Supabase. Não copie valores de exemplo como se fossem credenciais reais.

## Desenvolvimento local

Copie `.env.example` para `.env` e preencha uma base MySQL local. Depois rode:

```bash
npm ci
npm run dev
```

O Vite disponibiliza o frontend em `http://localhost:5173` e encaminha `/api` para o backend em `http://localhost:3000`.

## Verificações

```bash
npm test
npm run build
npm run lint
```