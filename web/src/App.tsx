import React, { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Edit3, CheckCircle2, Search, Download, CalendarClock, AlertTriangle, RefreshCcw, LogOut, UserPlus, KeyRound } from "lucide-react";

// ============================
// Config
// ============================
const API_BASE =
  (import.meta as any).env?.VITE_API_BASE ||
  ((typeof window !== "undefined" && (window as any).__API_BASE__) as string) ||
  "http://localhost:4000/api";

const PRIORIDADES = ["Baixa", "Média", "Alta", "Crítica"] as const;
const STATUS = ["A Fazer", "Em Progresso", "Concluída"] as const;

function clsx(...args: (string | false | null | undefined)[]) {
  return args.filter(Boolean).join(" ");
}
function formatDateISO(dt?: string | number | Date) {
  const d = dt ? new Date(dt) : new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// ============================
// UI helpers
// ============================
function Pill({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={clsx("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", className)}>{children}</span>;
}
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx("rounded-2xl bg-white/70 backdrop-blur shadow-sm ring-1 ring-black/5", className)}>{children}</div>;
}
function Button({
  children, onClick, type = "button", className = "", variant = "primary", disabled,
}: {
  children: React.ReactNode; onClick?: () => void; type?: "button" | "submit" | "reset"; className?: string;
  variant?: "primary" | "ghost" | "danger" | "outline"; disabled?: boolean;
}) {
  const base = "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition active:scale-[.98]";
  const styles: Record<string, string> = {
    primary: "bg-zinc-900 text-white hover:bg-zinc-800",
    ghost: "bg-transparent hover:bg-zinc-100",
    outline: "border border-zinc-300 hover:bg-zinc-50",
    danger: "bg-rose-600 text-white hover:bg-rose-500",
  };
  return (
    <button disabled={disabled} type={type} onClick={onClick} className={clsx(base, styles[variant], disabled && "opacity-50", className)}>
      {children}
    </button>
  );
}

// ============================
// API Client
// ============================
const TOKEN_KEY = "tm_token_v2";
const USER_KEY = "tm_user_v2";

async function api(path: string, opts: RequestInit = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers: Record<string, string> = { "Content-Type": "application/json", ...(opts.headers as any) };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
  if (res.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Erro ${res.status}`);
  }
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : res.text();
}

// ============================
// App
// ============================
export default function App() {
  const [user, setUser] = useState<{ id: string; name?: string; email: string } | null>(() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));

  function handleAuth({ token, user }: any) {
    setToken(token);
    setUser(user);
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  function logout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 text-zinc-900">
      <div className="mx-auto max-w-6xl px-4 py-6 md:py-10">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">Task Manager</h1>
            <p className="text-sm text-zinc-600">App full-stack com autenticação JWT e API Node/Express + MongoDB.</p>
          </div>
          <div className="flex gap-2">{user ? <Button variant="outline" onClick={logout}><LogOut size={16}/> Sair</Button> : null}</div>
        </div>
        {user ? <TaskBoard token={token!} user={user} /> : <AuthCard onAuthed={handleAuth} />}
        <footer className="mt-10 text-center text-xs text-zinc-400">API: <code>{API_BASE}</code></footer>
      </div>
    </div>
  );
}

// ============================
// Auth
// ============================
function AuthCard({ onAuthed }: { onAuthed: (p: any) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const body: any = { email, password };
      if (mode === 'register') body.name = name || email.split('@')[0];
      const data = await api(`/auth/${mode === 'login' ? 'login' : 'register'}`, {
        method: 'POST',
        body: JSON.stringify(body)
      });
      onAuthed(data);
    } catch (err: any) {
      try {
        const j = JSON.parse(err.message);
        setError(j.error || 'Falha na autenticação');
      } catch {
        setError('Falha na autenticação');
      }
    } finally { setLoading(false); }
  }

  return (
    <Card className="mx-auto max-w-md p-6">
      <div className="mb-3 flex items-center gap-2 text-lg font-semibold">
        {mode === 'login' ? <KeyRound size={18}/> : <UserPlus size={18}/>}
        {mode === 'login' ? 'Entrar' : 'Criar conta'}
      </div>
      <form onSubmit={submit} className="grid grid-cols-1 gap-3">
        {mode === 'register' && (
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">Nome</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-300 focus:ring-2"/>
          </div>
        )}
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">E-mail</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-300 focus:ring-2"/>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">Senha</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-300 focus:ring-2"/>
        </div>
        {error && <div className="rounded-xl bg-rose-100 px-3 py-2 text-sm text-rose-700">{error}</div>}
        <div className="flex items-center gap-2">
          <Button type="submit" disabled={loading}>{mode === 'login' ? 'Entrar' : 'Criar conta'}</Button>
          <Button type="button" variant="ghost" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? 'Criar conta' : 'Já tenho conta'}
          </Button>
        </div>
      </form>
    </Card>
  );
}

// ============================
// Board (tarefas)
// ============================
function TaskBoard({ token, user }: { token: string; user: any }) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<string>("Todas");
  const [prioFiltro, setPrioFiltro] = useState<string>("Todas");
  const [ordem, setOrdem] = useState<string>("prazo:asc");
  const [editando, setEditando] = useState<any | null>(null);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (statusFiltro !== 'Todas') params.set('status', statusFiltro);
    if (prioFiltro !== 'Todas') params.set('prioridade', prioFiltro);
    params.set('sort', ordem);
    const data = await api(`/tasks?${params.toString()}`);
    setTasks(data.items);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);
  useEffect(() => { load(); }, [query, statusFiltro, prioFiltro, ordem]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const concluidas = tasks.filter((t) => t.status === "Concluída").length;
    const abertas = total - concluidas;
    const hojeISO = formatDateISO();
    const overdue = tasks.filter((t) => t.prazo && t.prazo < hojeISO && t.status !== "Concluída").length;
    const progresso = total ? Math.round((concluidas / total) * 100) : 0;
    return { total, concluidas, abertas, overdue, progresso };
  }, [tasks]);

  async function upsertTask(input: any) {
    if (!input.titulo?.trim()) return;
    if (input._id) {
      const { item } = await api(`/tasks/${input._id}`, { method: 'PUT', body: JSON.stringify(input) });
      setTasks((prev) => prev.map((t) => (t._id === item._id ? item : t)));
    } else {
      const { item } = await api(`/tasks`, { method: 'POST', body: JSON.stringify(input) });
      setTasks((prev) => [item, ...prev]);
    }
    setEditando(null);
  }

  async function removerTask(id: string) {
    await api(`/tasks/${id}`, { method: 'DELETE' });
    setTasks((prev) => prev.filter((t) => t._id !== id));
  }

  async function marcarConcluida(id: string) {
    const alvo = tasks.find((t) => t._id === id);
    if (!alvo) return;
    await upsertTask({ ...alvo, status: 'Concluída' });
  }

  async function limparConcluidas() {
    const concluidas = tasks.filter((t) => t.status === 'Concluída');
    for (const t of concluidas) await removerTask(t._id);
  }

  function exportarJSON() {
    const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `tarefas-${formatDateISO()}.json`; a.click(); URL.revokeObjectURL(url);
  }

  return (
    <>
      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="p-4"><div className="text-xs text-zinc-500">Total</div><div className="text-2xl font-semibold">{stats.total}</div></Card>
        <Card className="p-4"><div className="text-xs text-zinc-500">Concluídas</div><div className="text-2xl font-semibold">{stats.concluidas}</div></Card>
        <Card className="p-4"><div className="text-xs text-zinc-500">Abertas</div><div className="text-2xl font-semibold">{stats.abertas}</div></Card>
        <Card className="p-4"><div className="flex items-center justify-between"><div><div className="text-xs text-zinc-500">Atrasadas</div><div className="text-2xl font-semibold">{stats.overdue}</div></div><AlertTriangle className={clsx("h-6 w-6", stats.overdue ? "text-amber-600" : "text-zinc-300")} /></div></Card>
      </div>

      {/* Progresso */}
      <Card className="mb-6 p-4">
        <div className="mb-2 flex items-center justify-between text-sm"><span>Progresso geral</span><span className="tabular-nums">{stats.progresso}%</span></div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-200"><div className="h-full rounded-full bg-zinc-900 transition-all" style={{ width: `${stats.progresso}%` }} /></div>
      </Card>

      {/* Formulário */}
      <TaskForm key={editando?._id || 'novo'} initial={editando || { titulo: '', descricao: '', prioridade: 'Média', status: 'A Fazer', prazo: '' }} onCancel={() => setEditando(null)} onSave={upsertTask} />

      {/* Filtros e busca */}
      <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"/>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por título ou descrição..." className="w-72 rounded-xl border border-zinc-300 bg-white px-9 py-2 text-sm outline-none ring-zinc-300 focus:ring-2"/>
          </div>
          <div className="flex gap-2">
            <select value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value)} className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm">
              <option>Todas</option>
              {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={prioFiltro} onChange={(e) => setPrioFiltro(e.target.value)} className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm">
              <option>Todas</option>
              {PRIORIDADES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={ordem} onChange={(e) => setOrdem(e.target.value)} className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm">
              <option value="prazo:asc">Prazo · mais próximo</option>
              <option value="prazo:desc">Prazo · mais distante</option>
              <option value="prioridade:desc">Prioridade · alta → baixa</option>
              <option value="prioridade:asc">Prioridade · baixa → alta</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={exportarJSON}><Download size={16}/> Exportar</Button>
          <Button variant="outline" onClick={limparConcluidas}><Trash2 size={16}/> Limpar concluídas</Button>
          <Button variant="ghost" onClick={load}><RefreshCcw size={16}/> Atualizar</Button>
        </div>
      </div>

      {/* Lista */}
      <div className="grid grid-cols-1 gap-3">
        {loading ? (
          <Card className="p-8 text-center text-sm text-zinc-500">Carregando…</Card>
        ) : tasks.length ? (
          tasks.map((t) => (
            <TaskRow key={t._id} task={t} onEdit={() => setEditando(t)} onRemove={() => removerTask(t._id)} onDone={() => marcarConcluida(t._id)} />
          ))
        ) : (
          <Card className="p-8 text-center text-sm text-zinc-500">Nenhuma tarefa encontrada. Cadastre a primeira! ✨</Card>
        )}
      </div>
    </>
  );
}

function TaskRow({ task, onEdit, onRemove, onDone }: { task: any; onEdit: () => void; onRemove: () => void; onDone: () => void }) {
  const overdue = (() => {
    if (!task.prazo) return false;
    const hoje = formatDateISO();
    return task.status !== "Concluída" && task.prazo < hoje;
  })();

  const prioColors: Record<string, string> = {
    Baixa: "bg-emerald-100 text-emerald-700",
    "Média": "bg-blue-100 text-blue-700",
    Alta: "bg-amber-100 text-amber-700",
    Crítica: "bg-rose-100 text-rose-700",
  };

  return (
    <Card className="p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h3 className={clsx("truncate text-lg font-semibold", task.status === "Concluída" && "line-through text-zinc-400")}>{task.titulo}</h3>
            <Pill className={prioColors[task.prioridade]}>{task.prioridade}</Pill>
            <Pill className={clsx("bg-zinc-100 text-zinc-700", task.status === "Concluída" && "bg-green-100 text-green-700")}>{task.status}</Pill>
            {task.prazo && (<Pill className={clsx("bg-zinc-100 text-zinc-700", overdue && "bg-rose-100 text-rose-700")}><CalendarClock className="mr-1 h-3 w-3"/> {new Date(task.prazo).toLocaleDateString()} </Pill>)}
          </div>
          {task.descricao && <p className="max-w-3xl text-sm text-zinc-600">{task.descricao}</p>}
          <div className="mt-2 text-xs text-zinc-400">Atualizado em {new Date(task.updatedAt || task.createdAt).toLocaleString()}</div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {task.status !== "Concluída" && (<Button variant="outline" onClick={onDone}><CheckCircle2 size={16}/> Concluir</Button>)}
          <Button variant="ghost" onClick={onEdit}><Edit3 size={16}/> Editar</Button>
          <Button variant="danger" onClick={onRemove}><Trash2 size={16}/> Excluir</Button>
        </div>
      </div>
    </Card>
  );
}

function TaskForm({ initial, onSave, onCancel }: { initial: any; onSave: (t: any) => void; onCancel: () => void }) {
  const [titulo, setTitulo] = useState(initial.titulo || "");
  const [descricao, setDescricao] = useState(initial.descricao || "");
  const [prazo, setPrazo] = useState(initial.prazo || "");
  const [prioridade, setPrioridade] = useState<string>(initial.prioridade || "Média");
  const [status, setStatus] = useState<string>(initial.status || "A Fazer");

  const isEdit = Boolean(initial._id);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSave({ _id: initial._id, titulo, descricao, prazo: prazo || undefined, prioridade, status });
  }

  return (
    <Card className="mb-6 p-4">
      <form onSubmit={submit} className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end">
        <div className="md:col-span-4">
          <label className="mb-1 block text-xs font-medium text-zinc-600">Título</label>
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Implementar autenticação" className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-300 focus:ring-2"/>
        </div>
        <div className="md:col-span-4">
          <label className="mb-1 block text-xs font-medium text-zinc-600">Descrição</label>
          <input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Detalhes rápidos da tarefa" className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-300 focus:ring-2"/>
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-medium text-zinc-600">Prazo</label>
          <input type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm"/>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">Prioridade</label>
          <select value={prioridade} onChange={(e) => setPrioridade(e.target.value)} className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm">
            {PRIORIDADES.map((p) => <option key={p as string}>{p as string}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm">
            {STATUS.map((s) => <option key={s as string}>{s as string}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 md:col-span-12">
          <Button type="submit">{isEdit ? (<><Edit3 size={16}/> Salvar alterações</>) : (<><Plus size={16}/> Adicionar tarefa</>)}</Button>
        </div>
      </form>
    </Card>
  );
}
