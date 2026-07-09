// =========================================================
// cobrancas.js — Contas a receber
// =========================================================

let USER = null;
let CLIENTES = [];

(async () => {
  USER = await requireAuth();
  if (!USER) return;
  await applyEmpresaTheme();
  await carregarClientes();
  document.getElementById("filtro-cliente").addEventListener("change", carregarResumoCliente);
  document.getElementById("filtro-sit").addEventListener("change", listar);
  await listar();
})();

async function carregarClientes() {
  const { data } = await supabase.from("clientes").select("id,nome").order("nome");
  CLIENTES = data || [];
  const opts = "<option value=''>-- selecione --</option>" +
    CLIENTES.map(c => `<option value="${c.id}">${esc(c.nome)}</option>`).join("");
  document.getElementById("filtro-cliente").innerHTML = opts;
  document.getElementById("cb-cliente").innerHTML = opts;
}

async function carregarResumoCliente() {
  const id = document.getElementById("filtro-cliente").value;
  if (!id) { document.getElementById("resumo-cli").innerHTML = ""; return; }
  const { data } = await supabase.from("cobrancas").select("*").eq("cliente_id", id).order("vencimento");
  const total = (data || []).filter(c => c.situacao === "pendente").reduce((s, c) => s + Number(c.valor || 0), 0);
  const rows = (data || []).map(c => `<tr>
    <td>${esc(c.descricao || "-")}</td>
    <td>${formatMoney(c.valor)}</td>
    <td>${formatDate(c.vencimento)}</td>
    <td>${badgeSit(c)}</td></tr>`).join("");
  document.getElementById("resumo-cli").innerHTML = `
    <p><strong>Total pendente: ${formatMoney(total)}</strong></p>
    <div class="table-wrap"><table class="data">
    <thead><tr><th>Descrição</th><th>Valor</th><th>Vencimento</th><th>Situação</th></tr></thead>
    <tbody>${rows || "<tr><td colspan='4' style='text-align:center;color:var(--cor-muted);'>Nenhuma cobrança</td></tr>"}</tbody>
    </table></div>`;
}

function badgeSit(c) {
  if (c.situacao === "pago") return "<span class='badge badge-ok'>pago</span>";
  if (c.situacao === "cancelado") return "<span class='badge badge-muted'>cancelado</span>";
  const dias = diffDaysFromToday(c.vencimento);
  if (dias > 0) return `<span class='badge badge-err'>atrasado</span>`;
  return "<span class='badge badge-warn'>pendente</span>";
}

async function listar() {
  const st = document.getElementById("filtro-sit").value;
  let q = supabase.from("cobrancas").select("*").order("vencimento");
  if (st) q = q.eq("situacao", st);
  const { data } = await q;
  document.getElementById("lista").innerHTML = (data || []).map(c => {
    const dias = c.situacao === "pendente" ? diffDaysFromToday(c.vencimento) : 0;
    return `<tr>
      <td>${esc(c.cliente_nome || "-")}</td>
      <td>${esc(c.descricao || "-")}</td>
      <td>${formatMoney(c.valor)}</td>
      <td>${formatDate(c.vencimento)}</td>
      <td>${badgeSit(c)}</td>
      <td>${dias > 0 ? dias + " dias" : "-"}</td>
      <td class="actions-col">
        ${c.situacao === "pendente" ? `<button class="btn btn-sm btn-success" onclick='marcarPago("${c.id}")'>Pagar</button>` : ""}
        <button class="btn btn-sm btn-secondary" onclick='editar("${c.id}")'>Editar</button>
        <button class="btn btn-sm btn-danger" onclick='remover("${c.id}")'>Excluir</button>
      </td>
    </tr>`;
  }).join("") || `<tr><td colspan="7" style="text-align:center;color:var(--cor-muted);">Nenhuma cobrança</td></tr>`;
}

function abrirModalCobranca() {
  document.getElementById("modal-titulo").textContent = "Nova cobrança";
  document.getElementById("cb-id").value = "";
  document.getElementById("cb-cliente").value = "";
  document.getElementById("cb-desc").value = "";
  document.getElementById("cb-valor").value = "";
  document.getElementById("cb-venc").value = todayISO();
  document.getElementById("cb-sit").value = "pendente";
  document.getElementById("modal-cob").classList.add("open");
}

function fecharModal(id) { document.getElementById(id).classList.remove("open"); }

async function editar(id) {
  const { data } = await supabase.from("cobrancas").select("*").eq("id", id).single();
  if (!data) return;
  document.getElementById("modal-titulo").textContent = "Editar cobrança";
  document.getElementById("cb-id").value = data.id;
  document.getElementById("cb-cliente").value = data.cliente_id || "";
  document.getElementById("cb-desc").value = data.descricao || "";
  document.getElementById("cb-valor").value = data.valor;
  document.getElementById("cb-venc").value = data.vencimento;
  document.getElementById("cb-sit").value = data.situacao;
  document.getElementById("modal-cob").classList.add("open");
}

async function salvar() {
  const id = document.getElementById("cb-id").value;
  const cliId = document.getElementById("cb-cliente").value || null;
  const cli = CLIENTES.find(c => c.id === cliId);
  const payload = {
    owner_id: USER.id,
    cliente_id: cliId, cliente_nome: cli ? cli.nome : null,
    descricao: document.getElementById("cb-desc").value.trim() || null,
    valor: Number(document.getElementById("cb-valor").value || 0),
    vencimento: document.getElementById("cb-venc").value,
    situacao: document.getElementById("cb-sit").value,
  };
  if (!payload.valor || !payload.vencimento) return toast("Valor e vencimento obrigatórios", "erro");
  if (payload.situacao === "pago") payload.data_pagamento = todayISO();

  const res = id
    ? await supabase.from("cobrancas").update(payload).eq("id", id)
    : await supabase.from("cobrancas").insert(payload);
  if (res.error) return toast(res.error.message, "erro");
  toast("Salvo!", "sucesso");
  fecharModal("modal-cob");
  await listar();
}

async function marcarPago(id) {
  await supabase.from("cobrancas").update({ situacao: "pago", data_pagamento: todayISO() }).eq("id", id);
  toast("Pagamento registrado", "sucesso");
  await listar();
}

async function remover(id) {
  if (!confirmar("Excluir esta cobrança?")) return;
  await supabase.from("cobrancas").delete().eq("id", id);
  await listar();
}
