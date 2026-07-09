# ERP SaaS — Manual de instalação e uso

Sistema ERP para revenda escrito 100% em **HTML5 + CSS3 + JavaScript puro + Supabase**.
Sem frameworks, sem build. Basta hospedar os arquivos estáticos.

---

## 1. Estrutura do projeto

```
/
├── index.html            # tela inicial (redireciona para login/dashboard)
├── login.html            # login, cadastro, recuperação de senha
├── dashboard.html        # métricas e agenda
├── produtos.html         # cadastro de produtos
├── clientes.html         # cadastro de clientes
├── pedidos.html          # criação e gestão de pedidos
├── estoque.html          # entradas, saídas, ajustes, histórico
├── cobrancas.html        # contas a receber
├── relatorios.html       # relatórios imprimíveis / PDF
├── configuracoes.html    # dados da empresa, logo, cores, senha
│
├── css/
│   ├── style.css         # estilos globais
│   ├── dashboard.css     # layout com sidebar
│   └── responsivo.css    # adaptações para tablet/celular
│
├── js/
│   ├── config.js         # URL + chave Anon do Supabase (EDITAR AQUI)
│   ├── utils.js          # funções auxiliares (auth, upload, toast, format)
│   ├── login.js
│   ├── dashboard.js
│   ├── produtos.js
│   ├── clientes.js
│   ├── pedidos.js
│   ├── estoque.js
│   ├── cobrancas.js
│   └── relatorios.js
│
├── assets/
│   ├── logo.png          # (opcional) coloque sua logo aqui
│   └── imagens/
│
└── supabase.sql          # schema completo do banco
```

---

## 2. Configurar o Supabase

1. Crie um projeto em https://supabase.com
2. No menu **SQL Editor**, cole todo o conteúdo de `supabase.sql` e execute.
   Isso cria: tabelas, índices, foreign keys, RLS, políticas e o bucket de Storage `erp`.
3. Em **Project Settings → API**, copie:
   - `Project URL`
   - `anon public` key
4. Abra `js/config.js` e substitua:
   ```js
   const SUPABASE_URL = "https://SEU-PROJETO.supabase.co";
   const SUPABASE_ANON_KEY = "SUA_ANON_KEY_AQUI";
   ```

Pronto. O sistema já se conecta.

---

## 3. Testar localmente

Como usa `fetch`/módulos, não abra por `file://`. Sirva com qualquer servidor estático:

```
# Python
python3 -m http.server 8080

# Node (opcional)
npx serve .
```

Acesse http://localhost:8080/login.html, crie uma conta e comece a usar.

---

## 4. Publicar

### 4.1 GitHub Pages
1. Crie um repositório no GitHub, envie todos os arquivos.
2. Settings → Pages → Branch: `main` / root → Save.
3. Acesse `https://SEU-USUARIO.github.io/SEU-REPO/login.html`.

### 4.2 Vercel
1. Crie conta em https://vercel.com e clique **Add New → Project**.
2. Importe o repositório do GitHub.
3. Framework preset: **Other**. Sem build. Publish directory: `/`.
4. Deploy. Pronto.

### 4.3 Hospedar no próprio Supabase Storage
Sim, é possível:
1. Storage → bucket `erp` (já criado) → **Public**.
2. Faça upload de todos os arquivos mantendo a estrutura.
3. Acesse pela URL pública de cada arquivo (ex.: `https://SEU-PROJETO.supabase.co/storage/v1/object/public/erp/login.html`).
   *Obs.: o Storage não é otimizado para hosting de site — recomendado apenas para testes.*

---

## 5. Criar um novo cliente/revenda (outro Supabase)

Cada cliente pode ter o próprio banco:
1. Crie outro projeto Supabase.
2. Rode o mesmo `supabase.sql`.
3. Copie o projeto (fork/duplicar pasta) e edite apenas `js/config.js` com o novo URL + Anon Key.
4. Publique.

---

## 6. Segurança

- **RLS ativo** em todas as tabelas: cada usuário só vê os próprios dados (`owner_id = auth.uid()`).
- Chave Anon é pública por design — a segurança vem do RLS.
- **Nunca** coloque a `service_role key` em `config.js`.

---

## 7. Módulos preparados para o futuro (não implementados)

PIX, integração bancária, pagamentos online, WhatsApp API, NF-e, NFC-e, controle de caixa, fornecedores, compras, mobile app. A estrutura do banco e das telas foi pensada para acomodar tudo isso depois sem quebrar o que existe.

---

## 8. Como cada arquivo funciona (resumo)

| Arquivo | Papel |
|---|---|
| `index.html` | Porta de entrada; redireciona para login ou dashboard |
| `login.html` / `login.js` | Autenticação (Supabase Auth), cadastro, reset de senha |
| `dashboard.html/js` | Contadores agregados e agenda de cobranças |
| `produtos.html/js` | CRUD + busca + upload de imagem |
| `clientes.html/js` | CRUD + busca |
| `pedidos.html/js` | Cria pedidos com itens, calcula totais, imprime/PDF |
| `estoque.html/js` | Entradas/saídas/ajustes + histórico + alerta de estoque baixo |
| `cobrancas.html/js` | Contas a receber, situação, dias em atraso, resumo por cliente |
| `relatorios.html/js` | Relatórios com "Salvar como PDF" via impressão do navegador |
| `configuracoes.html` | Empresa, logo, cores, alteração de senha |
| `css/style.css` | Design system (tokens, botões, forms, tabelas, badges, toast) |
| `css/dashboard.css` | Sidebar, topbar, cards de métrica, modais |
| `css/responsivo.css` | Media queries para tablet/celular |
| `js/config.js` | Cliente Supabase e nome do bucket |
| `js/utils.js` | Auth guard, upload, format, toast, aplicar tema da empresa |

---

Bons negócios!
