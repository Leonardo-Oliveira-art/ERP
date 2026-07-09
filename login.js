// =========================================================
// login.js — Autenticação com Supabase
// =========================================================

document.getElementById("form-login").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const senha = document.getElementById("senha").value;

  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error) return toast("Falha no login: " + error.message, "erro");
  window.location.href = "dashboard.html";
});

// Cadastro rápido
document.getElementById("link-cadastro").addEventListener("click", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const senha = document.getElementById("senha").value;
  if (!email || !senha) return toast("Informe email e senha para criar conta", "erro");

  const { error } = await supabase.auth.signUp({
    email, password: senha,
    options: { emailRedirectTo: window.location.origin + "/login.html" }
  });
  if (error) return toast("Erro no cadastro: " + error.message, "erro");
  toast("Conta criada! Verifique seu email se necessário.", "sucesso");
});

// Recuperação de senha
document.getElementById("link-recuperar").addEventListener("click", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  if (!email) return toast("Informe seu email primeiro", "erro");
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + "/login.html"
  });
  if (error) return toast("Erro: " + error.message, "erro");
  toast("Enviamos um link de recuperação para seu email.", "sucesso");
});

// Se já logado, vai direto pro dashboard
(async () => {
  const { data } = await supabase.auth.getUser();
  if (data.user) window.location.href = "dashboard.html";
})();
