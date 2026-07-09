// =========================================================
// produtos.js — CRUD de produtos
// =========================================================

let USER = null;

(async () => {
  USER = await requireAuth();
  if (!USER) return;
  await applyEmpresaTheme();
  document.getElementById("busca").addEventListener("input", () => listarProdutos());
  await listarProdutos();
})();

async function listarProdutos() {
  const q = document.getElementById("busca").value.trim();
  let query = supabase.from("produtos").select("*").order("nome");
  if (q) query = query.or(`nome.ilike.%${q}%,codigo.ilike.%${q}%,categoria.ilike.%${q}%,codigo_barras.ilike.%${q}%`);
  const { data, error } = await query;
  if (error) return toast(error.message, "erro");

  document.getElementById("lista").innerHTML = (data || []).map(p => {
    const baixo = Number(p.quantidade) <= Number(p.estoque_minimo || 0);
    return `<tr>
      <td>${esc(p.codigo || "-")}</td>
      <td>${esc(p.nome)}</td>
      <td>${esc(p.categoria || "-")}</td>
      <td>${formatMoney(p.preco_venda)}</td>
      <td>${p.quantidade} ${baixo ? "<span class='badge badge-err'>baixo</span>" : ""}</td>
      <td class="actions-col">
        <button class="btn btn-sm btn-secondary" onclick='editarProduto("${p.id}")'>Editar</button>
        <button class="btn btn-sm btn-danger" onclick='removerProduto("${p.id}")'>Excluir</button>
      </td>
    </tr>`;
  }).join("") || `<tr><td colspan="6" style="text-align:center;color:var(--cor-muted);">Nenhum produto</td></tr>`;
}

function abrirModalProduto() {
  document.getElementById("modal-titulo").textContent = "Novo produto";
  document.getElementById("form-produto").reset();
  document.getElementById("p-id").value = "";
  document.getElementById("modal-produto").classList.add("open");
}

function fecharModal(id) { document.getElementById(id).classList.remove("open"); }

async function editarProduto(id) {
  const { data } = await supabase.from("produtos").select("*").eq("id", id).single();
  if (!data) return;
  document.getElementById("modal-titulo").textContent = "Editar produto";
  document.getElementById("p-id").value = data.id;
  document.getElementById("p-codigo").value = data.codigo || "";
  document.getElementById("p-barras").value = data.codigo_barras || "";
  document.getElementById("p-nome").value = data.nome || "";
  document.getElementById("p-categoria").value = data.categoria || "";
  document.getElementById("p-descricao").value = data.descricao || "";
  document.getElementById("p-custo").value = data.preco_custo || 0;
  document.getElementById("p-venda").value = data.preco_venda || 0;
  document.getElementById("p-qtd").value = data.quantidade || 0;
  document.getElementById("p-min").value = data.estoque_minimo || 0;
  document.getElementById("modal-produto").classList.add("open");
}

async function salvarProduto() {
  const id = document.getElementById("p-id").value;
  const file = document.getElementById("p-imagem").files[0];
  let imagem_url = null;
  if (file) imagem_url = await uploadArquivo(file, "produtos");

  const payload = {
    owner_id: USER.id,
    codigo: document.getElementById("p-codigo").value.trim() || null,
    codigo_barras: document.getElementById("p-barras").value.trim() || null,
    nome: document.getElementById("p-nome").value.trim(),
    categoria: document.getElementById("p-categoria").value.trim() || null,
    descricao: document.getElementById("p-descricao").value.trim() || null,
    preco_custo: Number(document.getElementById("p-custo").value || 0),
    preco_venda: Number(document.getElementById("p-venda").value || 0),
    quantidade: Number(document.getElementById("p-qtd").value || 0),
    estoque_minimo: Number(document.getElementById("p-min").value || 0),
  };
  if (imagem_url) payload.imagem_url = imagem_url;
  if (!payload.nome) return toast("Nome obrigatório", "erro");

  const res = id
    ? await supabase.from("produtos").update(payload).eq("id", id)
    : await supabase.from("produtos").insert(payload);

  if (res.error) return toast(res.error.message, "erro");
  toast("Produto salvo!", "sucesso");
  fecharModal("modal-produto");
  await listarProdutos();
}

async function removerProduto(id) {
  if (!confirmar("Excluir este produto?")) return;
  const { error } = await supabase.from("produtos").delete().eq("id", id);
  if (error) return toast(error.message, "erro");
  toast("Excluído", "sucesso");
  await listarProdutos();
}
