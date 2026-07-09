// =========================================================
// relatorios.js — Relatórios com impressão / exportação PDF
// =========================================================

(async () => {
  const u = await requireAuth();
  if (!u) return;
  await applyEmpresaTheme();
})();

async function gerar() {
  const tipo = document.getElementById("tipo").value;
  const el = document.getElementById("relatorio");
  el.innerHTML = "<p>Carregando...</p>";

  if (tipo === "produtos") {
    const { data } = await supabase.from("produtos").select("*").order("nome");
    el.innerHTML = tabela(["Código", "Nome", "Categoria", "Preço venda", "Estoque"],
      (data || []).map(p => [p.codigo || "-", p.nome, p.categoria || "-", formatMoney(p.preco_venda), p.quantidade]));
  }
  else if (tipo === "clientes") {
    const { data } = await supabase.from("clientes").select("*").order("nome");
    el.innerHTML = tabela(["Nome", "CPF/CNPJ", "Telefone", "Cidade", "UF"],
      (data || []).map(c => [c.nome, c.cpf_cnpj || "-", c.telefone || "-", c.cidade || "-", c.estado || "-"]));
  }
  else if (tipo === "estoque") {
    const { data } = await supabase.from("produtos").select("nome,quantidade,estoque_minimo").order("nome");
    el.innerHTML = tabela(["Produto", "Estoque", "Mínimo", "Status"],
      (data || []).map(p => [p.nome, p.quantidade, p.estoque_minimo,
        Number(p.quantidade) <= Number(p.estoque_minimo || 0) ? "BAIXO" : "OK"]));
  }
  else if (tipo === "entradas" || tipo === "saidas") {
    const t = tipo === "entradas" ? "entrada" : "saida";
    const { data } = await supabase.from("estoque_mov").select("*, produtos(nome)")
      .eq("tipo", t).order("created_at", { ascending: false });
    el.innerHTML = tabela(["Data", "Produto", "Qtd", "Observação"],
      (data || []).map(m => [formatDate(m.created_at), m.produtos?.nome || "-", m.quantidade, m.observacao || ""]));
  }
  else if (tipo === "pedidos") {
    const { data } = await supabase.from("pedidos").select("*").order("created_at", { ascending: false });
    el.innerHTML = tabela(["#", "Cliente", "Status", "Total", "Data"],
      (data || []).map(p => [p.numero, p.cliente_nome || "-", p.status, formatMoney(p.total), formatDate(p.created_at)]));
  }
  else if (tipo === "cobrancas") {
    const { data } = await supabase.from("cobrancas").select("*").order("vencimento");
    el.innerHTML = tabela(["Cliente", "Descrição", "Valor", "Vencimento", "Situação"],
      (data || []).map(c => [c.cliente_nome || "-", c.descricao || "-", formatMoney(c.valor), formatDate(c.vencimento), c.situacao]));
  }
}

function tabela(cols, rows) {
  return `<h2>Relatório - ${document.getElementById("tipo").selectedOptions[0].text}</h2>
    <div class="table-wrap"><table class="data">
      <thead><tr>${cols.map(c => `<th>${c}</th>`).join("")}</tr></thead>
      <tbody>${rows.map(r => `<tr>${r.map(v => `<td>${esc(v)}</td>`).join("")}</tr>`).join("") ||
        `<tr><td colspan="${cols.length}" style="text-align:center;color:var(--cor-muted);">Sem dados</td></tr>`}</tbody>
    </table></div>`;
}
