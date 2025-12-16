/********************
 * LOGIN / LOGOUT
 ********************/

const DEFAULT_USER = {
  username: "admin",
  password: "1234"
};

const loginSection = document.getElementById("login-section");
const appSection = document.getElementById("app-section");
const loginForm = document.getElementById("login-form");
const loginMsg = document.getElementById("login-msg");
const btnLogout = document.getElementById("btn-logout");

// inicializa utilizador se não existir
if (!localStorage.getItem("finance_user")) {
  localStorage.setItem("finance_user", JSON.stringify(DEFAULT_USER));
}

function isLoggedIn() {
  return localStorage.getItem("finance_logged_in") === "true";
}

function mostrarApp() {
  if (loginSection) loginSection.style.display = "none";
  if (appSection) appSection.style.display = "block";
}

function mostrarLogin() {
  if (loginSection) loginSection.style.display = "block";
  if (appSection) appSection.style.display = "none";
}

if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value.trim();

    const stored = JSON.parse(localStorage.getItem("finance_user") || "{}");

    if (username === stored.username && password === stored.password) {
      localStorage.setItem("finance_logged_in", "true");
      if (loginMsg) {
        loginMsg.textContent = "Login bem-sucedido!";
        loginMsg.style.color = "#00ff88";
      }
      mostrarApp();
      renderizar();
    } else {
      if (loginMsg) {
        loginMsg.textContent = "Utilizador ou senha inválidos.";
        loginMsg.style.color = "#ff4757";
      }
    }
  });
}

if (btnLogout) {
  btnLogout.addEventListener("click", () => {
    localStorage.setItem("finance_logged_in", "false");
    mostrarLogin();
  });
}

/********************
 * APP FINANCEIRO
 ********************/

let transacoes = JSON.parse(localStorage.getItem("transacoes")) || [];
let editandoId = null;

const form = document.getElementById("form-transacao");
const listaReceitasEl = document.getElementById("lista-receitas");
const listaDespesasEl = document.getElementById("lista-despesas");
const totalReceitasEl = document.getElementById("total-receitas");
const totalDespesasEl = document.getElementById("total-despesas");
const saldoEl = document.getElementById("saldo");
const filtroMesEl = document.getElementById("filtro-mes");
const filtroCategoriaEl = document.getElementById("filtro-categoria");
const btnFiltrar = document.getElementById("btn-aplicar-filtro");
const btnLimpar = document.getElementById("btn-limpar-filtro");
const btnSalvar = document.getElementById("btn-salvar");
const recorrenteCheckbox = document.getElementById("recorrente");

let filtros = { mes: "", categoria: "" };

function salvarLocal() {
  localStorage.setItem("transacoes", JSON.stringify(transacoes));
}

function aplicarFiltros(lista) {
  return lista.filter(t => {
    if (filtros.mes) {
      const [anoF, mesF] = filtros.mes.split("-");
      const [anoT, mesT] = t.data.split("-");
      if (anoT !== anoF || mesT !== mesF) return false;
    }
    if (filtros.categoria && !t.categoria.toLowerCase().includes(filtros.categoria)) return false;
    return true;
  });
}

// gera lançamentos futuros a partir de recorrentes (até 12 meses à frente)
function gerarRecorrentes() {
  const hoje = new Date();
  const limite = new Date(hoje.getFullYear(), hoje.getMonth() + 12, hoje.getDate());

  const originais = [...transacoes];

  originais.forEach((transacao) => {
    if (transacao.recorrente) {
      let dataAtual = new Date(transacao.data);
      while (true) {
        dataAtual.setMonth(dataAtual.getMonth() + 1);
        if (dataAtual > limite) break;

        const novaData = dataAtual.toISOString().split("T")[0];

        const jaExiste = transacoes.some(
          t => t.descricao === transacao.descricao &&
               t.categoria === transacao.categoria &&
               t.tipo === transacao.tipo &&
               t.data === novaData
        );
        if (!jaExiste) {
          transacoes.push({
            ...transacao,
            id: Date.now() + Math.random(),
            data: novaData,
            recorrente: false
          });
        }
      }
    }
  });

  transacoes.sort((a, b) => new Date(b.data) - new Date(a.data));
  salvarLocal();
}

function renderizar() {
  if (!listaReceitasEl || !listaDespesasEl) return;

  gerarRecorrentes();

  const listaFiltrada = aplicarFiltros(transacoes);
  listaReceitasEl.innerHTML = "";
  listaDespesasEl.innerHTML = "";

  let totalR = 0;
  let totalD = 0;

  // Receitas
  listaFiltrada
    .filter(t => t.tipo === "receita")
    .forEach(t => {
      const tr = document.createElement("tr");
      const iconeRec = t.recorrente ? "🔄 " : "";
      tr.innerHTML = `
        <td>${iconeRec}${t.data}</td>
        <td>${t.descricao}</td>
        <td>${t.categoria}</td>
        <td style="color:#00ff88;font-weight:bold;">
          +${t.valor.toLocaleString('pt-PT',{minimumFractionDigits:2,maximumFractionDigits:2})}
        </td>
        <td>
          <button class="btn-editar" data-id="${t.id}">✏️</button>
          <button class="btn-remover" data-id="${t.id}">🗑️</button>
        </td>
      `;
      listaReceitasEl.appendChild(tr);
      totalR += t.valor;
    });

  // Despesas
  listaFiltrada
    .filter(t => t.tipo === "despesa")
    .forEach(t => {
      const tr = document.createElement("tr");
      const iconeRec = t.recorrente ? "🔄 " : "";
      tr.innerHTML = `
        <td>${iconeRec}${t.data}</td>
        <td>${t.descricao}</td>
        <td>${t.categoria}</td>
        <td style="color:#ff4757;font-weight:bold;">
          -${t.valor.toLocaleString('pt-PT',{minimumFractionDigits:2,maximumFractionDigits:2})}
        </td>
        <td>
          <button class="btn-editar" data-id="${t.id}">✏️</button>
          <button class="btn-remover" data-id="${t.id}">🗑️</button>
        </td>
      `;
      listaDespesasEl.appendChild(tr);
      totalD += t.valor;
    });

  if (totalReceitasEl) totalReceitasEl.textContent =
    totalR.toLocaleString('pt-PT',{minimumFractionDigits:2,maximumFractionDigits:2});
  if (totalDespesasEl) totalDespesasEl.textContent =
    totalD.toLocaleString('pt-PT',{minimumFractionDigits:2,maximumFractionDigits:2});
  if (saldoEl) saldoEl.textContent =
    (totalR - totalD).toLocaleString('pt-PT',{minimumFractionDigits:2,maximumFractionDigits:2});
}

function limparForm() {
  if (!form) return;
  form.reset();
  editandoId = null;
  if (btnSalvar) btnSalvar.textContent = "Adicionar";
  if (recorrenteCheckbox) recorrenteCheckbox.checked = false;
}

function editarTransacao(id) {
  const t = transacoes.find(x => x.id === id);
  if (!t) return;

  document.getElementById("data").value = t.data;
  document.getElementById("descricao").value = t.descricao;
  document.getElementById("categoria").value = t.categoria;
  document.getElementById("tipo").value = t.tipo;
  document.getElementById("valor").value = t.valor;
  if (recorrenteCheckbox) recorrenteCheckbox.checked = !!t.recorrente;

  editandoId = id;
  if (btnSalvar) btnSalvar.textContent = "Atualizar";
  form.scrollIntoView({ behavior: "smooth" });
}

function adicionarTransacao(e) {
  e.preventDefault();
  const data = document.getElementById("data").value;
  const descricao = document.getElementById("descricao").value;
  const categoria = document.getElementById("categoria").value;
  const tipo = document.getElementById("tipo").value;
  const valor = parseFloat(document.getElementById("valor").value);
  const recorrente = recorrenteCheckbox ? recorrenteCheckbox.checked : false;

  if (!data || !descricao || !categoria || isNaN(valor)) {
    alert("Preencha todos os campos!");
    return;
  }

  const novo = { id: editandoId || Date.now(), data, descricao, categoria, tipo, valor, recorrente };

  if (editandoId) {
    const idx = transacoes.findIndex(t => t.id === editandoId);
    if (idx !== -1) transacoes[idx] = novo;
  } else {
    transacoes.push(novo);
  }

  salvarLocal();
  renderizar();
  limparForm();
}

/********* EVENTOS *********/

if (form) form.addEventListener("submit", adicionarTransacao);

function handleTableClick(e) {
  const id = Number(e.target.dataset.id);
  if (!id) return;

  if (e.target.classList.contains("btn-remover")) {
    if (confirm("Remover esta transação?")) {
      transacoes = transacoes.filter(t => t.id !== id);
      salvarLocal();
      renderizar();
    }
  }

  if (e.target.classList.contains("btn-editar")) {
    editarTransacao(id);
  }
}

if (listaReceitasEl) listaReceitasEl.addEventListener("click", handleTableClick);
if (listaDespesasEl) listaDespesasEl.addEventListener("click", handleTableClick);

if (btnFiltrar) {
  btnFiltrar.addEventListener("click", () => {
    filtros.mes = filtroMesEl?.value || "";
    filtros.categoria = (filtroCategoriaEl?.value || "").toLowerCase().trim();
    renderizar();
  });
}

if (btnLimpar) {
  btnLimpar.addEventListener("click", () => {
    filtros = { mes: "", categoria: "" };
    if (filtroMesEl) filtroMesEl.value = "";
    if (filtroCategoriaEl) filtroCategoriaEl.value = "";
    renderizar();
  });
}

/********* INICIALIZAÇÃO + SERVICE WORKER *********/

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(console.error);
  });
}

window.addEventListener("load", () => {
  if (isLoggedIn()) {
    mostrarApp();
    renderizar();
  } else {
    mostrarLogin();
  }
});
