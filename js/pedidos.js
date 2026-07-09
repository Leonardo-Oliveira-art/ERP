// =========================================================
// pedidos.js — CRUD, cálculo, impressão e exportação de PDF
// =========================================================

let USER = null;
let ITENS = [];      // itens do pedido em edição
let CLIENTES = [];
let PRODUTOS = [];

(async () => {
  USER = await requireAuth();
  if (!USER) return;
  await applyEmpresaTheme();
  document.getElementById("filtro-status").addEventListener("change", listar);
  await Promise.all([carregarClientes(), carregarProdutos(), listar()]);
})();

async function carregarClientes() {
  const { data } = await supabase.from("clientes").select("id,nome").order("nome");
  CLIENTES = data || [];
  document.getElementById("ped-cliente").innerHTML =
    "<option value=''>-- selecione --</option>" + CLIENTES.map(c => `<option value="${c.id}">${esc(c.nome)}</option>`).join("");
}

async function carregarProdutos() {
  const { data } = await supabase.from("produtos").select("id,nome,preco_venda").order("nome");
  PRODUTOS = data || [];
  document.getElementById("item-produto").innerHTML =
    "<option value=''>-- produto --</option>" + PRODUTOS.map(p => `<option value="${p.id}">${esc(p.nome)}</option>`).join("");
}

async function listar() {
  const st = document.getElementById("filtro-status").value;
  let q = supabase.from("pedidos").select("*").order("created_at", { ascending: false });
  if (st) q = q.eq("status", st);
  const { data } = await q;
  document.getElementById("lista").innerHTML = (data || []).map(p => `
    <tr>
      <td>#${p.numero}</td>
      <td>${esc(p.cliente_nome || "-")}</td>
      <td>${formatMoney(p.total)}</td>
      <td>${badgeStatus(p.status)}</td>
      <td>${formatDate(p.created_at)}</td>
      <td class="actions-col">
        <button class="btn btn-sm btn-secondary" onclick='editar("${p.id}")'>Editar</button>
        <button class="btn btn-sm btn-ghost" onclick='imprimirPedido("${p.id}")'>Imprimir / PDF</button>
        <button class="btn btn-sm btn-danger" onclick='remover("${p.id}")'>Excluir</button>
      </td>
    </tr>`).join("") || `<tr><td colspan="6" style="text-align:center;color:var(--cor-muted);">Nenhum pedido</td></tr>`;
}

function badgeStatus(s) {
  const m = {
    orcamento: "badge-info", pendente: "badge-warn",
    pago: "badge-ok", entregue: "badge-ok", cancelado: "badge-err",
  };
  return `<span class="badge ${m[s] || "badge-muted"}">${s}</span>`;
}

function abrirModalPedido() {
  document.getElementById("modal-titulo").textContent = "Novo pedido";
  document.getElementById("ped-id").value = "";
  document.getElementById("ped-cliente").value = "";
  document.getElementById("ped-status").value = "orcamento";
  document.getElementById("ped-desc").value = 0;
  document.getElementById("ped-obs").value = "";
  ITENS = [];
  renderItens();
  document.getElementById("modal-pedido").classList.add("open");
}

function fecharModal(id) { document.getElementById(id).classList.remove("open"); }

// Ao trocar produto, sugere preço de venda
document.addEventListener("change", (e) => {
  if (e.target.id === "item-produto") {
    const p = PRODUTOS.find(x => x.id === e.target.value);
    if (p) document.getElementById("item-preco").value = p.preco_venda;
  }
});

function addItem() {
  const pid = document.getElementById("item-produto").value;
  const qtd = Number(document.getElementById("item-qtd").value || 0);
  const preco = Number(document.getElementById("item-preco").value || 0);
  if (!pid || qtd <= 0) return toast("Selecione produto e quantidade", "erro");
  const prod = PRODUTOS.find(x => x.id === pid);
  ITENS.push({
    produto_id: pid,
    produto_nome: prod ? prod.nome : "",
    quantidade: qtd, preco_unit: preco, subtotal: qtd * preco,
  });
  renderItens();
}

function removerItem(i) { ITENS.splice(i, 1); renderItens(); }

function renderItens() {
  document.getElementById("itens-lista").innerHTML = ITENS.map((it, i) => `
    <tr>
      <td>${esc(it.produto_nome)}</td>
      <td>${it.quantidade}</td>
      <td>${formatMoney(it.preco_unit)}</td>
      <td>${formatMoney(it.subtotal)}</td>
      <td><button class="btn btn-sm btn-danger" onclick="removerItem(${i})">×</button></td>
    </tr>`).join("");
  recalcular();
}

function recalcular() {
  const sub = ITENS.reduce((s, i) => s + i.subtotal, 0);
  const desc = Number(document.getElementById("ped-desc").value || 0);
  document.getElementById("ped-total").value = formatMoney(sub - desc);
}

async function editar(id) {
  const { data: ped } = await supabase.from("pedidos").select("*").eq("id", id).single();
  const { data: its } = await supabase.from("pedido_itens").select("*").eq("pedido_id", id);
  if (!ped) return;
  document.getElementById("modal-titulo").textContent = `Pedido #${ped.numero}`;
  document.getElementById("ped-id").value = ped.id;
  document.getElementById("ped-cliente").value = ped.cliente_id || "";
  document.getElementById("ped-status").value = ped.status;
  document.getElementById("ped-desc").value = ped.desconto || 0;
  document.getElementById("ped-obs").value = ped.observacoes || "";
  ITENS = (its || []).map(i => ({
    produto_id: i.produto_id, produto_nome: i.produto_nome,
    quantidade: Number(i.quantidade), preco_unit: Number(i.preco_unit), subtotal: Number(i.subtotal),
  }));
  renderItens();
  document.getElementById("modal-pedido").classList.add("open");
}

async function salvarPedido() {
  const id = document.getElementById("ped-id").value;
  const cliId = document.getElementById("ped-cliente").value || null;
  const cli = CLIENTES.find(c => c.id === cliId);
  const subtotal = ITENS.reduce((s, i) => s + i.subtotal, 0);
  const desconto = Number(document.getElementById("ped-desc").value || 0);
  const total = subtotal - desconto;

  const payload = {
    owner_id: USER.id,
    cliente_id: cliId, cliente_nome: cli ? cli.nome : null,
    status: document.getElementById("ped-status").value,
    subtotal, desconto, total,
    observacoes: document.getElementById("ped-obs").value.trim() || null,
  };

  let pedidoId = id;
  if (id) {
    const { error } = await supabase.from("pedidos").update(payload).eq("id", id);
    if (error) return toast(error.message, "erro");
    await supabase.from("pedido_itens").delete().eq("pedido_id", id);
  } else {
    const { data, error } = await supabase.from("pedidos").insert(payload).select().single();
    if (error) return toast(error.message, "erro");
    pedidoId = data.id;
  }

  if (ITENS.length) {
    const rows = ITENS.map(i => ({ ...i, owner_id: USER.id, pedido_id: pedidoId }));
    const { error } = await supabase.from("pedido_itens").insert(rows);
    if (error) return toast(error.message, "erro");
  }

  toast("Pedido salvo!", "sucesso");
  fecharModal("modal-pedido");
  await listar();
}

async function remover(id) {
  if (!confirmar("Excluir este pedido?")) return;
  const { error } = await supabase.from("pedidos").delete().eq("id", id);
  if (error) return toast(error.message, "erro");
  await listar();
}

// Impressão / PDF (usa janela nativa; usuário pode "Salvar como PDF")
async function imprimirPedido(id) {
  const { data: ped } = await supabase.from("pedidos").select("*").eq("id", id).single();
  const { data: its } = await supabase.from("pedido_itens").select("*").eq("pedido_id", id);
  const { data: emp } = await supabase.from("empresa").select("*").maybeSingle();

  const rows = (its || []).map(i => `
    <tr><td>${esc(i.produto_nome)}</td><td>${i.quantidade}</td>
    <td>${formatMoney(i.preco_unit)}</td><td>${formatMoney(i.subtotal)}</td></tr>`).join("");

  const html = `
    <html><head><title>Pedido #${ped.numero}</title>
    <style>
      body{font-family:Arial;padding:24px;color:#1e293b;}
      h1{margin:0 0 4px;} .muted{color:#64748b;font-size:12px;}
      table{width:100%;border-collapse:collapse;margin-top:16px;}
      th,td{padding:8px;border-bottom:1px solid #e2e8f0;text-align:left;font-size:13px;}
      th{background:#f1f5f9;}
      .tot{margin-top:16px;text-align:right;font-size:14px;}
    </style></head><body>
      <h1>${esc(emp?.nome || "Empresa")}</h1>
      <div class="muted">${esc(emp?.endereco || "")} ${esc(emp?.cidade || "")} ${esc(emp?.estado || "")}</div>
      <div class="muted">${esc(emp?.telefone || "")} ${esc(emp?.email || "")}</div>
      <hr/>
      <h2>Pedido #${ped.numero} - ${ped.status.toUpperCase()}</h2>
      <div><strong>Cliente:</strong> ${esc(ped.cliente_nome || "-")}</div>
      <div class="muted">Data: ${formatDate(ped.created_at)}</div>
      <table>
        <thead><tr><th>Produto</th><th>Qtd</th><th>Preço</th><th>Subtotal</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="tot">Subtotal: ${formatMoney(ped.subtotal)}</div>
      <div class="tot">Desconto: ${formatMoney(ped.desconto)}</div>
      <div class="tot"><strong>Total: ${formatMoney(ped.total)}</strong></div>
      ${ped.observacoes ? `<p><strong>Obs:</strong> ${esc(ped.observacoes)}</p>` : ""}
      <script>window.onload=()=>window.print();</script>
    </body></html>`;
  const w = window.open("", "_blank");
  w.document.write(html); w.document.close();
}
