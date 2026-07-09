// =========================================================
// dashboard.js — Métricas e agenda
// =========================================================

(async () => {
  const user = await requireAuth();
  if (!user) return;
  document.getElementById("user-info").textContent = user.email;
  await applyEmpresaTheme();
  await carregarMetricas();
  await carregarAgenda();
})();

async function carregarMetricas() {
  const [prod, cli, ped, pagos, pend, receber, inad, baixo] = await Promise.all([
    supabase.from("produtos").select("*", { count: "exact", head: true }),
    supabase.from("clientes").select("*", { count: "exact", head: true }),
    supabase.from("pedidos").select("*", { count: "exact", head: true }),
    supabase.from("pedidos").select("*", { count: "exact", head: true }).eq("status", "pago"),
    supabase.from("pedidos").select("*", { count: "exact", head: true }).eq("status", "pendente"),
    supabase.from("cobrancas").select("valor").eq("situacao", "pendente"),
    supabase.from("cobrancas").select("cliente_id").eq("situacao", "pendente").lt("vencimento", todayISO()),
    supabase.from("produtos").select("id,quantidade,estoque_minimo"),
  ]);

  const totalReceber = (receber.data || []).reduce((s, x) => s + Number(x.valor || 0), 0);
  const inadSet = new Set((inad.data || []).map(x => x.cliente_id).filter(Boolean));
  const estoqueBaixo = (baixo.data || []).filter(p => Number(p.quantidade) <= Number(p.estoque_minimo || 0)).length;

  const items = [
    { label: "Produtos", value: prod.count || 0 },
    { label: "Clientes", value: cli.count || 0 },
    { label: "Pedidos", value: ped.count || 0 },
    { label: "Pedidos pagos", value: pagos.count || 0, cls: "ok" },
    { label: "Pedidos pendentes", value: pend.count || 0, cls: "warn" },
    { label: "A receber", value: formatMoney(totalReceber), cls: "warn" },
    { label: "Clientes inadimplentes", value: inadSet.size, cls: "err" },
    { label: "Estoque baixo", value: estoqueBaixo, cls: "err" },
  ];

  document.getElementById("metrics").innerHTML = items.map(i =>
    `<div class="metric ${i.cls || ""}">
      <div class="label">${i.label}</div>
      <div class="value">${i.value}</div>
    </div>`
  ).join("");
}

async function carregarAgenda() {
  const hoje = todayISO();
  const em7 = new Date(); em7.setDate(em7.getDate() + 7);
  const em7iso = em7.toISOString().slice(0, 10);

  const { data } = await supabase.from("cobrancas")
    .select("*").eq("situacao", "pendente")
    .lte("vencimento", em7iso).order("vencimento");

  if (!data || !data.length) {
    document.getElementById("agenda").innerHTML = "<p style='color:var(--cor-muted);'>Nenhuma cobrança para os próximos dias.</p>";
    return;
  }

  const rows = data.map(c => {
    const dias = diffDaysFromToday(c.vencimento);
    let badge = "<span class='badge badge-info'>Próxima</span>";
    if (c.vencimento === hoje) badge = "<span class='badge badge-warn'>Hoje</span>";
    else if (dias > 0) badge = `<span class='badge badge-err'>${dias}d atraso</span>`;
    return `<tr>
      <td>${esc(c.cliente_nome || "-")}</td>
      <td>${formatMoney(c.valor)}</td>
      <td>${formatDate(c.vencimento)}</td>
      <td>${badge}</td>
    </tr>`;
  }).join("");

  document.getElementById("agenda").innerHTML = `
    <div class="table-wrap"><table class="data">
      <thead><tr><th>Cliente</th><th>Valor</th><th>Vencimento</th><th>Situação</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
}
