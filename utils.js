// =========================================================
// utils.js — Funções utilitárias comuns
// =========================================================

// Formata número como moeda BRL
function formatMoney(v) {
  const n = Number(v || 0);
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Formata data ISO -> dd/mm/aaaa
function formatDate(d) {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString("pt-BR");
}

// Data de hoje em ISO (yyyy-mm-dd)
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// Diferença em dias entre hoje e uma data
function diffDaysFromToday(dateStr) {
  const d = new Date(dateStr);
  const t = new Date(todayISO());
  return Math.floor((t - d) / (1000 * 60 * 60 * 24));
}

// Toast simples
function toast(msg, type = "info") {
  let box = document.getElementById("toast-box");
  if (!box) {
    box = document.createElement("div");
    box.id = "toast-box";
    document.body.appendChild(box);
  }
  const el = document.createElement("div");
  el.className = "toast toast-" + type;
  el.textContent = msg;
  box.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// Confirma remoção
function confirmar(msg) {
  return window.confirm(msg || "Confirmar?");
}

// Protege página: exige usuário logado; retorna o usuário
async function requireAuth() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    window.location.href = "login.html";
    return null;
  }
  return data.user;
}

// Logout
async function logout() {
  await supabase.auth.signOut();
  window.location.href = "login.html";
}

// Escape simples de HTML
function esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Aplica cores da empresa (se salvas)
async function applyEmpresaTheme() {
  const { data } = await supabase.from("empresa").select("*").maybeSingle();
  if (!data) return;
  if (data.cor_primaria)
    document.documentElement.style.setProperty("--cor-primaria", data.cor_primaria);
  if (data.cor_secundaria)
    document.documentElement.style.setProperty("--cor-secundaria", data.cor_secundaria);
  const logo = document.querySelector(".sidebar-logo img");
  if (logo && data.logo_url) logo.src = data.logo_url;
  const nome = document.querySelector(".sidebar-logo span");
  if (nome && data.nome) nome.textContent = data.nome;
}

// Upload de arquivo para o Storage; retorna URL pública
async function uploadArquivo(file, pasta = "geral") {
  if (!file) return null;
  const ext = file.name.split(".").pop();
  const path = `${pasta}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file);
  if (error) {
    toast("Erro no upload: " + error.message, "erro");
    return null;
  }
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
