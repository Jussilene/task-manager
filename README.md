# Task Manager — Controle de Tarefas com Login (API + Web)

Aplicação **full-stack** com autenticação **JWT**, cadastro/login de usuários e **CRUD de tarefas** com filtros, busca e ordenação.  
Backend em **Node.js + Express + MongoDB** e frontend em **React + Vite + Tailwind CSS**.

> **Status**: Concluido (funcional localmente).  
> **Demo**: _em breve_  
> **Código**: este repositório

---

## ✨ Funcionalidades

- Autenticação com **JWT** (registro, login e logout)
- **CRUD de tarefas** (criar, listar, editar, concluir e excluir)
- Campos de tarefa: **título, descrição, prazo, prioridade, status**
- **Filtros** por status/prioridade, **busca** por texto e **ordenação** por prazo
- **Exportar CSV**, **limpar concluídas** e **atualizar lista**
- Interface responsiva com **Tailwind CSS**

---

## 🧱 Tecnologias

- **API**: Node.js, Express, Mongoose, MongoDB, JWT, CORS, Nodemon  
- **WEB**: React 18, Vite, Axios, Tailwind CSS  
- **Dev**: dotenv, morgan

---

## 📁 Estrutura do projeto

task-manager/  
├── task-manager/api/                  # API (Node/Express/MongoDB)  
│   ├── src/  
│   │   ├── routes/                    # auth, tasks  
│   │   ├── models/                    # User, Task  
│   │   ├── middlewares/               # auth middleware  
│   │   └── server.js  
│   └── .env                           # variáveis da API (ver exemplo)  
│  
├── web/                               # Frontend (React/Vite)  
│   ├── src/  
│   │   ├── api.ts                     # Axios + detecção automática do host  
│   │   ├── pages/, components/        # UI, telas, formulários  
│   │   └── main.tsx, index.css  
│   └── .env                           # variáveis do front (opcional, ver exemplo)  
│  
├── .gitignore  
└── package.json                       # metadados do monorepo

---

## 🚀 Como rodar localmente

### Pré-requisitos

- **Node.js** 18+  
- **MongoDB** em execução (local `mongodb://127.0.0.1:27017` ou Atlas)  
- **Git** (opcional para clonar)

---

### 1) Clone e entre na pasta

```bash
git clone https://github.com/Jussilene/task-manager.git
cd task-manager
```

---

### 2) Suba a API

```bash
cd task-manager/api
npm install
```

Crie um arquivo `.env` (use o exemplo abaixo):

```env
PORT=4000
JWT_SECRET=supersedredo_aqui
MONGO_URI=mongodb://127.0.0.1:27017/taskmanager
# Para permitir o front local e em rede (celular)
CORS_ORIGIN=http://localhost:5173,http://192.168.1.21:5173
```

Ajuste `192.168.1.21` para o IPv4 do seu PC (use `ipconfig` no Windows).

Rodar a API:

```bash
npm run dev
# API em http://localhost:4000
```

---

### 3) Suba o Frontend (Web)

Em outro terminal:

```bash
cd web
npm install
```

Opcionalmente crie `web/.env`:

```env
# Se NÃO definir, o front tenta usar automaticamente: http(s)://<host>:4000/api
# Use para apontar manualmente para a API (ex.: quando publicar o back)
VITE_API_BASE=http://localhost:4000/api
```

Rodar em modo dev (expondo para rede local):

```bash
npm run dev -- --host
# ou
npm run dev
# Acesse: http://localhost:5173  (e também http://SEU_IP_LAN:5173)
```

Se a porta em uso atrapalhar:
```bash
npx kill-port 5173 5174 5175
```

---

## 📱 Testar no celular (mesma rede Wi-Fi)

- Descubra o IPv4 do seu PC (`ipconfig` no Windows).  
- Inicie o Vite com `--host` e acesse do celular: `http://SEU_IP:5173`  
- Garanta que o `CORS_ORIGIN` da API inclui `http://SEU_IP:5173`  
- Se o navegador do celular não abrir, libere o acesso no Firewall do Windows ao Node/Vite.

---

## 🔐 Endpoints principais (API)

Base: `http://localhost:4000/api`

### Autenticação
- **POST** `/auth/register` — `{ name, email, password }`  
- **POST** `/auth/login` — `{ email, password }`  
- **POST** `/auth/logout` — limpa sessão/token (se usado via cookie)  

### Tarefas (JWT Bearer)
- **GET** `/tasks` — lista (com filtros via query)  
- **POST** `/tasks` — cria tarefa  
- **PUT** `/tasks/:id` — edita  
- **PATCH** `/tasks/:id/toggle` — alterna concluída/aberta  
- **DELETE** `/tasks/:id` — apaga  

Exemplo de tarefa:
```json
{
  "_id": "66ba0f...",
  "title": "Implementar autenticação",
  "description": "Adicionar JWT e middleware",
  "priority": "Média",
  "status": "A Fazer",
  "dueDate": "2025-08-15",
  "createdAt": "2025-08-12T13:45:00.000Z",
  "updatedAt": "2025-08-12T14:10:00.000Z",
  "user": "66b9ff..."
}
```

---

## ⚙️ Scripts úteis

### API (`task-manager/api`)
```bash
npm run dev   # inicia a API com Nodemon (porta 4000)
```

### Web (`web`)
```bash
npm run dev     # inicia o Vite (porta 5173)
npm run build   # gera build de produção em dist/
npm run preview # pré-visualiza o build local
```

---

## ☁️ Publicação (resumo)

- **API**: Render, Railway, Fly.io ou outra plataforma de Node  
  Configure variáveis de ambiente `PORT`, `JWT_SECRET`, `MONGO_URI` e `CORS_ORIGIN` (inclua a URL pública do front)  

- **WEB**: Vercel/Netlify/GitHub Pages  
  Se a API estiver em domínio público, defina:
  ```env
  VITE_API_BASE=https://sua-api.com/api
  ```
  e rode:
  ```bash
  npm run build
  ```

---

## 🧰 Solução de problemas

- **EADDRINUSE: 4000/5173** — porta ocupada. Feche processos ou use:
  ```bash
  npx kill-port 4000 5173
  ```
- **MongoDB connect ECONNREFUSED** — Mongo não está rodando; inicie o serviço/local (ou use uma URI do Atlas)  
- **Erro de CORS** — confira `CORS_ORIGIN` na API  
- **Celular não abre o front** — use `npm run dev -- --host` no Vite e libere no Firewall

---

## 🗺️ Roadmap
- Recuperação de senha  
- Anexos/Uploads  
- Compartilhar tarefas/equipe  
- Modo escuro automático  

---

## 🤝 Contribuindo
Sinta-se à vontade para abrir Issues e Pull Requests.

---

## 💬 Autor
**Jussilene V. Ribeiro**  
Portfólio: [https://jussilene.github.io/](https://jussilene.github.io/)  
Repositório: [https://github.com/Jussilene/task-manager](https://github.com/Jussilene/task-manager)
