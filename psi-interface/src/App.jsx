import { useState, useEffect, useRef } from "react";
import { 
  Send, Trash2, LogOut, Bot, User, Stethoscope, ChevronRight, 
  DollarSign, AlertCircle, Edit2, X, Check, PanelLeft, RefreshCw,
  Sparkles, Clock, Activity, Settings, KeyRound
} from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const API_URL = "http://127.0.0.1:8001";

// ══════════════════════════════════════════════════════════════════════════════
// 🔐 LOGIN SCREEN
// ══════════════════════════════════════════════════════════════════════════════
function LoginScreen({ token, setToken, onLogin }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setLoading(true); 
    setError("");
    try { await onLogin(); } 
    catch { setError("Token inválido ou falha ao conectar."); } 
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: "#0a0a0f" }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[500px] h-[500px] rounded-full blur-[120px] opacity-10" style={{ background: "radial-gradient(circle, #6366f1 0%, transparent 70%)", top: "-15%", left: "-10%", animation: "float 8s ease-in-out infinite" }} />
        <div className="absolute w-[500px] h-[500px] rounded-full blur-[120px] opacity-10" style={{ background: "radial-gradient(circle, #8b5cf6 0%, transparent 70%)", bottom: "-15%", right: "-10%", animation: "float 10s ease-in-out infinite", animationDelay: "3s" }} />
      </div>
      <div className="w-full max-w-md mx-4 relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-5 relative group transition-all duration-500" style={{ background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)", boxShadow: "0 8px 32px rgba(99, 102, 241, 0.15)" }}>
            <Stethoscope size={36} color="white" strokeWidth={2} className="transition-transform duration-500 group-hover:scale-110" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2 transition-all duration-500">PsiAgent</h1>
          <div className="flex items-center justify-center gap-2 transition-all duration-500">
            <Sparkles size={12} className="text-indigo-400 opacity-60" />
            <p className="text-indigo-400/80 text-sm font-medium">Assistente Clínico Inteligente</p>
          </div>
        </div>
        <div className="rounded-2xl p-8 backdrop-blur-xl relative overflow-hidden transition-all duration-500 hover:shadow-2xl" style={{ background: "rgba(15, 15, 20, 0.8)", border: "1px solid rgba(99, 102, 241, 0.15)", boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)" }}>
          <div className="relative z-10">
            <label className="block text-sm font-semibold text-indigo-300/90 mb-3 tracking-wide transition-all duration-300">Token de Acesso</label>
            <input type="password" placeholder="Insira seu API_SECRET..." className="w-full rounded-xl px-4 py-3.5 text-white placeholder-gray-600 mb-5 transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" style={{ background: "rgba(20, 20, 28, 0.6)", border: "1px solid rgba(99, 102, 241, 0.2)" }} value={token} onChange={(e) => setToken(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
            {error && (<div className="flex items-center gap-2 mb-4 text-red-400 text-sm px-4 py-3 rounded-xl transition-all duration-500" style={{ background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)" }}><AlertCircle size={16} /> {error}</div>)}
            <button onClick={handleLogin} disabled={loading} className="w-full py-3.5 rounded-xl font-semibold text-white transition-all duration-500 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed" style={{ background: loading ? "rgba(60, 60, 70, 0.4)" : "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)", boxShadow: loading ? "none" : "0 4px 20px rgba(99, 102, 241, 0.2)" }}>{loading ? "Verificando..." : "Entrar"}</button>
          </div>
        </div>
        <p className="text-center text-xs text-gray-700 mt-8 font-medium transition-all duration-500">🔒 Acesso restrito a profissionais autorizados</p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 📝 SESSION ITEM
// ══════════════════════════════════════════════════════════════════════════════
function SessionItem({ log, token, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempNotes, setTempNotes] = useState(log.notas);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setTempNotes(log.notas); }, [log.notas]);

  const handleSave = async () => {
    if (!log.id && log.id !== 0) return alert("Erro de ID.");
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/session/${log.id}`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ notas: tempNotes }), });
      if (res.ok) { setIsEditing(false); onUpdate(); } else { alert("Erro ao salvar."); }
    } catch { alert("Erro de conexão."); } finally { setSaving(false); }
  };

  return (
    <div className="mb-3 rounded-xl p-4 transition-all duration-500 group" style={{ background: isEditing ? "rgba(99, 102, 241, 0.08)" : "rgba(20, 20, 28, 0.5)", border: isEditing ? "1px solid rgba(99, 102, 241, 0.3)" : "1px solid rgba(255, 255, 255, 0.05)", boxShadow: isEditing ? "0 4px 20px rgba(99, 102, 241, 0.1)" : "none" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2"><Clock size={11} className="text-indigo-400/60" /><span className="text-xs font-medium text-slate-500">{new Date(log.data).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: '2-digit', minute:'2-digit' })}</span></div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full font-semibold tracking-wide" style={log.pago ? { background: "rgba(52, 211, 153, 0.12)", color: "#34d399", border: "1px solid rgba(52, 211, 153, 0.2)" } : { background: "rgba(248, 113, 113, 0.12)", color: "#f87171", border: "1px solid rgba(248, 113, 113, 0.2)" }}>{log.pago ? "✓ Pago" : "✗ Pendente"}</span>
          {!isEditing && (<button onClick={() => setIsEditing(true)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-indigo-500/10 text-gray-600 hover:text-indigo-400 transition-all"><Edit2 size={12} /></button>)}
        </div>
      </div>
      {isEditing ? (
        <div className="flex flex-col gap-3">
          <textarea className="w-full text-sm text-slate-300 p-3.5 rounded-xl border transition-all resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50" style={{ background: "rgba(10, 10, 15, 0.7)", border: "1px solid rgba(99, 102, 241, 0.25)" }} rows={4} value={tempNotes} onChange={(e) => setTempNotes(e.target.value)} autoFocus />
          <div className="flex justify-end gap-2">
            <button onClick={() => { setIsEditing(false); setTempNotes(log.notas); }} className="flex items-center gap-1.5 px-3.5 py-2 text-xs text-slate-500 hover:text-slate-300 hover:bg-white/5 rounded-lg transition-all" disabled={saving}><X size={12} /> Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-3.5 py-2 text-xs rounded-lg text-white font-semibold transition-all hover:shadow-lg disabled:opacity-50" style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)", boxShadow: "0 2px 12px rgba(99, 102, 241, 0.2)" }}>{saving ? "Salvando..." : <><Check size={12} /> Salvar</>}</button>
          </div>
        </div>
      ) : (<div onClick={() => setIsEditing(true)} className="cursor-text"><p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-400">{log.notas || <em className="text-slate-700 italic">Sem anotações.</em>}</p></div>)}
      {log.insights && (<div className="mt-3.5 pt-3.5 rounded-lg p-3 transition-all" style={{ borderTop: "1px solid rgba(255, 255, 255, 0.04)", background: "rgba(99, 102, 241, 0.04)" }}><div className="flex items-center gap-2 mb-1.5"><Sparkles size={11} className="text-indigo-400/70" /><p className="text-[10px] font-bold uppercase tracking-wider text-indigo-400/80">Insight IA</p></div><p className="text-xs italic text-slate-500 leading-relaxed">{log.insights}</p></div>)}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 👤 PATIENT DRAWER
// ══════════════════════════════════════════════════════════════════════════════
function PatientDrawer({ patient, token, onClose, onSessionsDeleted }) {
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [deletingHistory, setDeletingHistory] = useState(false);

  const fetchHistory = () => {
    if (!patient) return;
    setLoadingHistory(true);
    fetch(`${API_URL}/patient/${patient.id}/history`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()).then(setHistory).finally(() => setLoadingHistory(false));
  };

  useEffect(() => { fetchHistory(); }, [patient]);
  if (!patient) return null;
  const dividaAtual = Number(patient.divida || 0);

  const handleDeleteSessions = async () => {
    if (!confirm(`Apagar histórico de ${patient.nome}?`)) return;
    setDeletingHistory(true);
    try { const res = await fetch(`${API_URL}/patient/${patient.id}/sessions`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }); if (res.ok) { setHistory([]); onSessionsDeleted(); } } finally { setDeletingHistory(false); }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 backdrop-blur-sm transition-all duration-500" style={{ background: "rgba(0, 0, 0, 0.7)" }} onClick={onClose} />
      <div className="fixed right-0 top-0 h-full z-50 flex flex-col overflow-hidden transition-all duration-500" style={{ width: "420px", background: "#0a0a0f", borderLeft: "1px solid rgba(99, 102, 241, 0.15)", boxShadow: "-20px 0 60px rgba(0, 0, 0, 0.8)" }}>
        <div className="p-6 relative overflow-hidden border-b border-white/5">
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3.5"><div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-lg" style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)", boxShadow: "0 4px 16px rgba(99, 102, 241, 0.25)" }}>{patient.nome.charAt(0).toUpperCase()}</div><div><h2 className="text-white font-bold text-lg leading-none mb-1">{patient.nome}</h2><p className="text-xs font-medium text-indigo-400/70">ID #{patient.id}</p></div></div>
            <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-600 hover:text-white hover:bg-white/5 transition-all"><X size={18} /></button>
          </div>
        </div>
        <div className="px-6 py-4 grid grid-cols-2 gap-3" style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}>
          <div className="rounded-xl p-3.5 transition-all hover:scale-105" style={{ background: "rgba(52, 211, 153, 0.08)", border: "1px solid rgba(52, 211, 153, 0.2)" }}><p className="text-xs mb-1.5 font-semibold text-emerald-400/80 uppercase tracking-wide">Valor/Sessão</p><p className="text-lg font-bold text-emerald-400">{patient.valor_sessao ? `R$ ${Number(patient.valor_sessao).toFixed(2)}` : "Não definido"}</p></div>
          <div className="rounded-xl p-3.5 transition-all hover:scale-105" style={{ background: dividaAtual > 0 ? "rgba(248, 113, 113, 0.08)" : "rgba(52, 211, 153, 0.08)", border: dividaAtual > 0 ? "1px solid rgba(248, 113, 113, 0.2)" : "1px solid rgba(52, 211, 153, 0.2)" }}><p className="text-xs mb-1.5 font-semibold uppercase tracking-wide" style={{ color: dividaAtual > 0 ? "rgba(248, 113, 113, 0.8)" : "rgba(52, 211, 153, 0.8)" }}>Dívida Atual</p><p className="text-lg font-bold" style={{ color: dividaAtual > 0 ? "#f87171" : "#34d399" }}>R$ {dividaAtual.toFixed(2)}</p></div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4"><h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400/80 flex items-center gap-2"><Clock size={13} /> Histórico</h3>{history.length > 0 && (<button onClick={handleDeleteSessions} disabled={deletingHistory} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105 disabled:opacity-50" style={{ color: "#f87171", background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)" }}><Trash2 size={11} /> {deletingHistory ? "..." : "Apagar tudo"}</button>)}</div>
          {loadingHistory ? (<div className="flex flex-col items-center justify-center py-12"><div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-3" /><p className="text-sm text-slate-600 font-medium">Carregando...</p></div>) : history.length === 0 ? (<div className="text-center py-12 rounded-xl" style={{ background: "rgba(20, 20, 28, 0.4)", border: "1px dashed rgba(255, 255, 255, 0.06)" }}><Bot size={28} className="mx-auto mb-3 text-slate-700" /><p className="text-sm text-slate-600 font-medium">Nenhum registro.</p></div>) : (history.map((log, idx) => (<SessionItem key={log.id || idx} log={log} token={token} onUpdate={fetchHistory} />)))}
        </div>
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 💳 PATIENT CARD
// ══════════════════════════════════════════════════════════════════════════════
function PatientCard({ p, isSelected, onClick }) {
  const dividaValue = Number(p.divida || 0);
  return (
    <div onClick={onClick} className="mb-2 cursor-pointer rounded-xl p-3.5 transition-all duration-500 hover:translate-x-1 group" style={{ background: isSelected ? "linear-gradient(135deg, #6366f1, #4f46e5)" : "rgba(20, 20, 28, 0.5)", border: isSelected ? "1px solid rgba(99, 102, 241, 0.4)" : "1px solid rgba(255, 255, 255, 0.05)", boxShadow: isSelected ? "0 4px 20px rgba(99, 102, 241, 0.2)" : "none" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold transition-all" style={{ background: isSelected ? "rgba(255, 255, 255, 0.2)" : "rgba(99, 102, 241, 0.25)" }}>{p.nome.charAt(0).toUpperCase()}</div>
          <div><div className={`text-sm font-semibold transition-all ${isSelected ? "text-white" : "text-slate-300"}`}>{p.nome}</div>{dividaValue > 0 ? (<div className="flex items-center gap-1 text-xs font-semibold mt-0.5 transition-all" style={{ color: isSelected ? "#fff" : "#f87171" }}><DollarSign size={10} /> R$ {dividaValue.toFixed(2)}</div>) : (<div className="text-[10px] font-medium mt-0.5 opacity-60 transition-all" style={{ color: isSelected ? "#fff" : "#34d399" }}>✓ Sem pendências</div>)}</div>
        </div>
        <ChevronRight size={15} className="transition-all group-hover:translate-x-1" style={{ color: isSelected ? "white" : "#6b7280" }} />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 💬 MESSAGE BUBBLE
// ══════════════════════════════════════════════════════════════════════════════
function MessageBubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-5 transition-all duration-500`}>
      {!isUser && (<div className="w-9 h-9 rounded-xl flex items-center justify-center mr-3 mt-1 flex-shrink-0 shadow-lg" style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)", boxShadow: "0 2px 12px rgba(99, 102, 241, 0.2)" }}><Bot size={17} color="white" strokeWidth={2} /></div>)}
      <div className="max-w-2xl rounded-xl px-5 py-4 text-sm leading-relaxed shadow-lg overflow-hidden" style={isUser ? { background: "linear-gradient(135deg, #6366f1, #4f46e5)", color: "white", borderBottomRightRadius: "4px", boxShadow: "0 4px 16px rgba(99, 102, 241, 0.2)" } : { background: "rgba(20, 20, 28, 0.6)", color: "#e2e8f0", border: "1px solid rgba(99, 102, 241, 0.15)", borderBottomLeftRadius: "4px" }}>
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
            h1: ({node, ...props}) => <h1 className="text-xl font-bold text-white mt-4 mb-2 border-b border-white/10 pb-2" {...props} />,
            h2: ({node, ...props}) => <h2 className="text-lg font-bold text-indigo-300/90 mt-3 mb-2" {...props} />,
            h3: ({node, ...props}) => <h3 className="text-base font-bold text-white mt-2 mb-1.5" {...props} />,
            ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-3 space-y-1.5" {...props} />,
            ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-3 space-y-1.5" {...props} />,
            li: ({node, ...props}) => <li className="pl-1" {...props} />,
            p: ({node, ...props}) => <p className="mb-3 last:mb-0" {...props} />,
            strong: ({node, ...props}) => <strong className="font-bold text-indigo-300/90" {...props} />,
            em: ({node, ...props}) => <em className="italic text-slate-400" {...props} />,
            code: ({node, inline, className, children, ...props}) => { return inline ? (<code className="bg-black/40 px-2 py-0.5 rounded text-xs font-mono text-amber-300/90 border border-white/10" {...props}>{children}</code>) : (<div className="bg-black/50 p-4 rounded-xl my-3 overflow-x-auto border border-white/10"><code className="text-xs font-mono text-gray-300" {...props}>{children}</code></div>); },
            table: ({node, ...props}) => <table className="w-full border-collapse my-3 text-xs" {...props} />,
            th: ({node, ...props}) => <th className="border border-white/15 px-3 py-2 bg-white/5 text-left font-bold" {...props} />,
            td: ({node, ...props}) => <td className="border border-white/10 px-3 py-2" {...props} />,
            blockquote: ({node, ...props}) => <blockquote className="border-l-2 border-indigo-500/70 pl-4 italic my-3 text-slate-500 bg-white/5 py-2 pr-3 rounded-r-lg" {...props} />,
            a: ({node, ...props}) => <a className="text-indigo-300 underline hover:text-indigo-200 font-medium" target="_blank" rel="noopener noreferrer" {...props} />,
            hr: ({node, ...props}) => <hr className="border-white/10 my-4" {...props} />
          }}>
          {msg.content}
        </ReactMarkdown>
      </div>
      {isUser && (<div className="w-9 h-9 rounded-xl flex items-center justify-center ml-3 mt-1 flex-shrink-0" style={{ background: "rgba(255, 255, 255, 0.06)" }}><User size={17} color="#94a3b8" strokeWidth={2} /></div>)}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ⚙️ SETTINGS MODAL
// ══════════════════════════════════════════════════════════════════════════════
function SettingsModal({ isOpen, onClose, token, onPasswordChanged }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!currentPassword) {
      setError("Informe sua senha atual.");
      return;
    }
    if (!newPassword) {
      setError("Informe a nova senha.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Nova senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    if (newPassword.includes("'") || newPassword.includes('"')) {
      setError("Senha não pode conter aspas.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        setError(errData.detail || "Erro ao atualizar senha.");
        return;
      }

      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        onPasswordChanged();
        onClose();
      }, 2000);
    } catch (err) {
      setError("Erro de conexão ao atualizar senha.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 backdrop-blur-sm transition-all duration-500" style={{ background: "rgba(0, 0, 0, 0.7)" }} onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="rounded-2xl p-8 w-full max-w-md backdrop-blur-xl relative overflow-hidden transition-all duration-500 shadow-2xl" style={{ background: "rgba(15, 15, 20, 0.95)", border: "1px solid rgba(99, 102, 241, 0.15)", boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)" }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)", boxShadow: "0 4px 16px rgba(99, 102, 241, 0.25)" }}>
                <KeyRound size={20} color="white" />
              </div>
              <h2 className="text-lg font-bold text-white">Alterar Senha</h2>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-600 hover:text-white hover:bg-white/5 transition-all"><X size={18} /></button>
          </div>

          {success ? (
            <div className="text-center py-8">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "rgba(52, 211, 153, 0.12)", border: "2px solid rgba(52, 211, 153, 0.3)" }}>
                  <Check size={28} color="#34d399" />
                </div>
              </div>
              <h3 className="text-white font-semibold mb-2">Senha Atualizada!</h3>
              <p className="text-sm text-slate-400">Você será desconectado e precisará fazer login novamente com a nova senha.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-indigo-300/90 mb-2">Senha Atual</label>
                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Digite sua senha atual" className="w-full rounded-xl px-4 py-3 text-white placeholder-gray-600 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50" style={{ background: "rgba(20, 20, 28, 0.6)", border: "1px solid rgba(99, 102, 241, 0.2)" }} />
              </div>

              <div>
                <label className="block text-sm font-semibold text-indigo-300/90 mb-2">Nova Senha</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo 8 caracteres" className="w-full rounded-xl px-4 py-3 text-white placeholder-gray-600 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50" style={{ background: "rgba(20, 20, 28, 0.6)", border: "1px solid rgba(99, 102, 241, 0.2)" }} />
              </div>

              <div>
                <label className="block text-sm font-semibold text-indigo-300/90 mb-2">Confirmar Nova Senha</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirme a nova senha" className="w-full rounded-xl px-4 py-3 text-white placeholder-gray-600 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50" style={{ background: "rgba(20, 20, 28, 0.6)", border: "1px solid rgba(99, 102, 241, 0.2)" }} />
              </div>

              {error && (<div className="flex items-center gap-2 text-red-400 text-sm px-4 py-3 rounded-xl transition-all" style={{ background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)" }}><AlertCircle size={16} /> {error}</div>)}

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl font-semibold transition-all hover:bg-white/5" style={{ color: "#94a3b8", border: "1px solid rgba(99, 102, 241, 0.2)" }} disabled={loading}>
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-white transition-all hover:shadow-xl disabled:opacity-50" style={{ background: loading ? "rgba(60, 60, 70, 0.4)" : "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)", boxShadow: loading ? "none" : "0 4px 20px rgba(99, 102, 241, 0.2)" }}>
                  {loading ? "Salvando..." : "Atualizar"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 🏠 MAIN APP (Com Streaming & Status Dinâmico)
// ══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [token, setToken] = useState(localStorage.getItem("psi_token") || "");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  
  // NOVO: Estado para feedback textual do que a IA está fazendo
  const [streamingStatus, setStreamingStatus] = useState(""); 
  
  const [threadId, setThreadId] = useState("sessao_" + Math.random().toString(36).substring(7));
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  
  const [isRecording, setIsRecording] = useState(false);
  const [showTranscription, setShowTranscription] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");
  const [transcribing, setTranscribing] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const messagesEndRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, streamingStatus]);
  useEffect(() => { if (token) verifyToken().catch(() => {}); }, []);

  useEffect(() => {
    if (selectedPatient) {
      const updated = patients.find((p) => p.id === selectedPatient.id);
      if (updated) setSelectedPatient(updated);
    }
  }, [patients]);

  const verifyToken = async () => {
    const res = await fetch(`${API_URL}/patients`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error("invalid");
    const data = await res.json();
    setPatients(data);
    setIsAuthenticated(true);
    localStorage.setItem("psi_token", token);
  };

  const logout = () => { setToken(""); setIsAuthenticated(false); localStorage.removeItem("psi_token"); };
  const refreshPatients = async () => {
    const res = await fetch(`${API_URL}/patients`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setPatients(await res.json());
  };


  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    
    // 1. Adiciona mensagem do usuário
    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput(""); 
    setLoading(true);
    setStreamingStatus("Iniciando..."); // Feedback inicial

    // 2. Cria o placeholder da resposta da IA
    const assistantMsgIndex = messages.length + 1;
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: userMsg.content, thread_id: threadId }),
      });

      if (!response.ok) throw new Error("Erro na conexão");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n\n"); // SSE separa eventos por \n\n

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.substring(6)); 
              
              if (data.type === "token") {
                assistantText += data.content;
                setStreamingStatus(""); 
                setMessages((prev) => {
                  const newMsgs = [...prev];
                  newMsgs[assistantMsgIndex] = { role: "assistant", content: assistantText };
                  return newMsgs;
                });
              } else if (data.type === "status") {
                setStreamingStatus(data.content); 
              }
            } catch (e) {
              console.warn("Erro parse JSON stream:", e);
            }
          }
        }
      }
      
      setTimeout(refreshPatients, 500);

    } catch (e) {
      setMessages((prev) => [...prev, { role: "assistant", content: "❌ Falha na comunicação com a IA." }]);
    } finally { 
      setLoading(false); 
      setStreamingStatus("");
    }
  };

  const restartChat = async () => {
    if (!confirm("Reiniciar o chat e começar uma nova sessão? O histórico visual atual será limpo.")) return;
    try { await fetch(`${API_URL}/history/${threadId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }); } catch (e) { console.error("Erro backend", e); }
    setMessages([]);
    setThreadId("sessao_" + Math.random().toString(36).substring(7));
  };

  if (!isAuthenticated) return <LoginScreen token={token} setToken={setToken} onLogin={verifyToken} />;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#0a0a0f", color: "#e2e8f0", fontFamily: "'Inter', sans-serif" }}>
      
      {/* Sidebar */}
      {isSidebarOpen && (
        <aside className="w-80 flex flex-col transition-all duration-500 relative" style={{ background: "#0d0d12", borderRight: "1px solid rgba(99, 102, 241, 0.15)" }}>
          <div className="p-6 flex items-center gap-4 border-b border-white/5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-purple-600 to-indigo-900 shadow-[0_0_15px_rgba(124,58,237,0.2)]"><Stethoscope size={20} className="text-white" /></div>
            <div><h1 className="font-bold text-white text-lg leading-none">PsiAgent</h1><p className="text-[10px] mt-1 font-bold tracking-widest text-purple-500 uppercase"></p></div>
          </div>
          <div className="flex items-center justify-between px-6 py-5"><span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Pacientes Ativos</span><span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">{patients.length}</span></div>
          <div className="flex-1 overflow-y-auto px-4 custom-scrollbar mb-4">{patients.length === 0 ? (<div className="text-center py-10 px-4 opacity-50"><p className="text-xs italic">Lista vazia.</p></div>) : (patients.map((p) => (<PatientCard key={p.id} p={p} isSelected={selectedPatient?.id === p.id} onClick={() => setSelectedPatient(selectedPatient?.id === p.id ? null : p)} />)))}</div>
          <div className="space-y-2 border-t border-white/5 p-4">
            <button onClick={() => setShowSettings(true)} className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:bg-indigo-500/10 text-indigo-400/70 hover:text-indigo-300" style={{ border: "1px solid rgba(99, 102, 241, 0.2)" }}><Settings size={14} /> Configurações</button>
            <button onClick={logout} className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:bg-red-500/10 text-red-500/70 hover:text-red-400"><LogOut size={14} /> Sair do Sistema</button>
          </div>
        </aside>
      )}

      {/* Main Area */}
      <main className="flex flex-1 flex-col overflow-hidden relative">
        <header className="flex items-center justify-between px-6 py-4 z-10 backdrop-blur-xl" style={{ background: "rgba(10, 10, 15, 0.8)", borderBottom: "1px solid rgba(99, 102, 241, 0.15)" }}>
          <div className="flex items-center gap-4"><button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2.5 rounded-xl hover:bg-white/5 text-slate-600 hover:text-slate-300 transition-all"><PanelLeft size={19} /></button><div className="flex items-center gap-3"><div className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${loading ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} style={{ boxShadow: loading ? "0 0 10px rgba(245, 158, 11, 0.5)" : "0 0 10px rgba(52, 211, 153, 0.5)" }} /><div><h2 className="font-semibold text-white text-sm transition-all">{selectedPatient ? `Focando em: ${selectedPatient.nome}` : "Chat com Assistente"}</h2><p className="text-[10px] text-indigo-400/70 font-medium mt-0.5 transition-all">{loading ? "Processando..." : "Online"}</p></div></div></div>
          <button onClick={restartChat} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all hover:scale-105" style={{ background: "rgba(20, 20, 28, 0.6)", color: "#94a3b8", border: "1px solid rgba(99, 102, 241, 0.15)" }}><RefreshCw size={13} /> Reiniciar</button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-lg mx-auto animate-in fade-in zoom-in duration-500">
              <div className="w-24 h-24 rounded-[2rem] flex items-center justify-center mb-8 shadow-[0_0_60px_rgba(124,58,237,0.15)] bg-gradient-to-b from-white/5 to-transparent border border-white/10"><Bot size={48} className="text-purple-500" /></div>
              <h3 className="text-white font-bold text-2xl mb-3 tracking-tight">Olá! (a).</h3>
              <p className="text-gray-500 mb-10 leading-relaxed">Estou pronto para auxiliar na gestão clínica.</p>
              <div className="grid grid-cols-1 gap-3 w-full">{["Cadastrar novo paciente", "Verificar inadimplentes", "Resumo da última sessão"].map((s) => (<button key={s} onClick={() => setInput(s)} className="text-left px-6 py-4 rounded-xl text-sm font-medium transition-all bg-white/5 border border-white/5 hover:border-purple-500/40 hover:bg-purple-500/5 text-gray-300 hover:text-white group"><span className="group-hover:translate-x-1 transition-transform inline-block">{s}</span></button>))}</div>
            </div>
          )}
          {messages.map((msg, idx) => <MessageBubble key={idx} msg={msg} />)}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area (Com STATUS DINÂMICO) */}
        <div className="px-6 py-6 backdrop-blur-xl" style={{ background: "linear-gradient(to top, rgba(10, 10, 15, 0.95), transparent)", borderTop: "1px solid rgba(99, 102, 241, 0.1)" }}>
          
          {/* Status Feedback Line (A MÁGICA) */}
          {streamingStatus && (
            <div className="max-w-4xl mx-auto mb-2 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
                <Activity size={14} className="text-indigo-400 animate-pulse" />
                <span className="text-xs font-mono text-indigo-400/80 tracking-wide">{streamingStatus}</span>
            </div>
          )}

          <div className="max-w-4xl mx-auto flex gap-3 items-center">
            <div className="flex-1 flex items-center rounded-xl px-5 py-1 shadow-2xl transition-all focus-within:ring-2 focus-within:ring-indigo-500/40" style={{ background: "rgba(20, 20, 28, 0.7)", border: "1px solid rgba(99, 102, 241, 0.2)" }}>
              <input type="text" placeholder={selectedPatient ? `Adicionar nota para ${selectedPatient.nome}...` : "Digite sua solicitação..."} className="flex-1 bg-transparent py-4 text-sm text-white placeholder-slate-600 focus:outline-none" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} disabled={loading} />
            </div>
            <button onClick={sendMessage} disabled={loading || !input.trim()} className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 transition-all hover:scale-110 disabled:scale-100 disabled:opacity-30" style={{ background: loading || !input.trim() ? "rgba(60, 60, 70, 0.3)" : "linear-gradient(135deg, #6366f1, #4f46e5)", boxShadow: loading || !input.trim() ? "none" : "0 4px 20px rgba(99, 102, 241, 0.25)", cursor: loading || !input.trim() ? "not-allowed" : "pointer" }}><Send size={19} color={loading || !input.trim() ? "#334155" : "white"} strokeWidth={2} /></button>
          </div>
          <p className="text-center text-[10px] mt-4 font-medium text-slate-800 tracking-wider">🤖 PsiAgent pode errar. Revise informações.</p>
        </div>
      </main>

      <PatientDrawer patient={selectedPatient} token={token} onClose={() => setSelectedPatient(null)} onSessionsDeleted={refreshPatients} />
      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
        token={token} 
        onPasswordChanged={() => {
          setToken("");
          setIsAuthenticated(false);
          localStorage.removeItem("psi_token");
        }}
      />
    </div>
  );
}