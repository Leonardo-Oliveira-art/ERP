// =========================================================
// clientes.js — CRUD de clientes
// =========================================================

let USER = null;

(async () => {
  USER = await requireAuth();
  if (!USER) return;
  await applyEmpresaTheme();
  document.getElementById("busca").addEventListener("input", () => listar());
  await listar();
})();

async function listar() {
  const q = document.getElementById("busca").value.trim();
  let query = supabase.from("clientes").select("*").order("nome");
  if (q) query = query.or(`nome.ilike.%${q}%,cpf_cnpj.ilike.%${q}%,cidade.ilike.%${q}%`);
  const { data } = await query;
  document.getElementById("lista").innerHTML = (data || []).map(c => `
    <tr>
      <td>${esc(c.nome)}</td>
      <td>${esc(c.cpf_cnpj || "-")}</td>
      <td>${esc(c.telefone || "-")}</td>
      <td>${esc(c.cidade || "-")}</td>
      <td class="actions-col">
        <button class="btn btn-sm btn-secondary" onclick='editar("${c.id}")'>Editar</button>
        <button class="btn btn-sm btn-danger" onclick='remover("${c.id}")'>Excluir</button>
      </td>
    </tr>`).join("") || `<tr><td colspan="5" style="text-align:center;color:var(--cor-muted);">Nenhum cliente</td></tr>`;
}

function abrirModalCliente() {
  document.getElementById("modal-titulo").textContent = "Novo cliente";
  document.getElementById("form-cliente").reset();
  document.getElementById("c-id").value = "";
  document.getElementById("modal-cliente").classList.add("open");
}

function fecharModal(id) { document.getElementById(id).classList.remove("open"); }

async function editar(id) {
  const { data } = await supabase.from("clientes").select("*").eq("id", id).single();
  if (!data) return;
  document.getElementById("modal-titulo").textContent = "Editar cliente";
  document.getElementById("c-id").value = data.id;
  document.getElementById("c-nome").value = data.nome || "";
  document.getElementById("c-doc").value = data.cpf_cnpj || "";
  document.getElementById("c-email").value = data.email || "";
  document.getElementById("c-tel").value = data.telefone || "";
  document.getElementById("c-wpp").value = data.whatsapp || "";
  document.getElementById("c-end").value = data.endereco || "";
  document.getElementById("c-cid").value = data.cidade || "";
  document.getElementById("c-uf").value = data.estado || "";
  document.getElementById("c-obs").value = data.observacoes || "";
  document.getElementById("modal-cliente").classList.add("open");
}

async function salvarCliente() {
  const id = document.getElementById("c-id").value;
  const payload = {
    owner_id: USER.id,
    nome: document.getElementById("c-nome").value.trim(),
    cpf_cnpj: document.getElementById("c-doc").value.trim() || null,
    email: document.getElementById("c-email").value.trim() || null,
    telefone: document.getElementById("c-tel").value.trim() || null,
    whatsapp: document.getElementById("c-wpp").value.trim() || null,
    endereco: document.getElementById("c-end").value.trim() || null,
    cidade: document.getElementById("c-cid").value.trim() || null,
    estado: document.getElementById("c-uf").value.trim() || null,
    observacoes: document.getElementById("c-obs").value.trim() || null,
  };
  if (!payload.nome) return toast("Nome obrigatório", "erro");

  const res = id
    ? await supabase.from("clientes").update(payload).eq("id", id)
    : await supabase.from("clientes").insert(payload);
  if (res.error) return toast(res.error.message, "erro");
  toast("Cliente salvo!", "sucesso");
  fecharModal("modal-cliente");
  await listar();
}

async function remover(id) {
  if (!confirmar("Excluir este cliente?")) return;
  const { error } = await supabase.from("clientes").delete().eq("id", id);
  if (error) return toast(error.message, "erro");
  toast("Excluído", "sucesso");
  await listar();
}
