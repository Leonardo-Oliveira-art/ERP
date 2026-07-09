// =========================================================
// estoque.js — Entradas, saídas, ajustes e histórico
// =========================================================

let USER = null;
let PRODUTOS = [];

(async () => {
  USER = await requireAuth();
  if (!USER) return;
  await applyEmpresaTheme();
  await carregarProdutos();
  await carregarBaixo();
  await carregarHistorico();
})();

async function carregarProdutos() {
  const { data } = await supabase.from("produtos").select("id,nome,quantidade,estoque_minimo").order("nome");
  PRODUTOS = data || [];
  document.getElementById("mov-prod").innerHTML =
    PRODUTOS.map(p => `<option value="${p.id}">${esc(p.nome)} (${p.quantidade})</option>`).join("");
}

async function carregarBaixo() {
  const baixo = PRODUTOS.filter(p => Number(p.quantidade) <= Number(p.estoque_minimo || 0));
  document.getElementById("baixo").innerHTML = baixo.map(p =>
    `<tr><td>${esc(p.nome)}</td><td><span class="badge badge-err">${p.quantidade}</span></td><td>${p.estoque_minimo}</td></tr>`
  ).join("") || `<tr><td colspan="3" style="text-align:center;color:var(--cor-muted);">Nenhum produto com estoque baixo</td></tr>`;
}

async function carregarHistorico() {
  const { data } = await supabase.from("estoque_mov")
    .select("*, produtos(nome)").order("created_at", { ascending: false }).limit(50);
  document.getElementById("hist").innerHTML = (data || []).map(m => `
    <tr>
      <td>${formatDate(m.created_at)}</td>
      <td>${esc(m.produtos?.nome || "-")}</td>
      <td>${m.tipo}</td>
      <td>${m.quantidade}</td>
      <td>${esc(m.observacao || "")}</td>
    </tr>`).join("") || `<tr><td colspan="5" style="text-align:center;color:var(--cor-muted);">Sem movimentações</td></tr>`;
}

async function salvarMov() {
  const pid = document.getElementById("mov-prod").value;
  const tipo = document.getElementById("mov-tipo").value;
  const qtd = Number(document.getElementById("mov-qtd").value || 0);
  const obs = document.getElementById("mov-obs").value.trim() || null;
  if (!pid || qtd <= 0) return toast("Informe produto e quantidade", "erro");

  const prod = PRODUTOS.find(p => p.id === pid);
  let novaQtd = Number(prod.quantidade);
  if (tipo === "entrada") novaQtd += qtd;
  else if (tipo === "saida") novaQtd -= qtd;
  else if (tipo === "ajuste") novaQtd = qtd;

  const { error: e1 } = await supabase.from("estoque_mov")
    .insert({ owner_id: USER.id, produto_id: pid, tipo, quantidade: qtd, observacao: obs });
  if (e1) return toast(e1.message, "erro");

  const { error: e2 } = await supabase.from("produtos").update({ quantidade: novaQtd }).eq("id", pid);
  if (e2) return toast(e2.message, "erro");

  toast("Movimentação registrada", "sucesso");
  document.getElementById("mov-qtd").value = "";
  document.getElementById("mov-obs").value = "";
  await carregarProdutos();
  await carregarBaixo();
  await carregarHistorico();
}
