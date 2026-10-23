(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const money = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  const shortMoney = (value) =>
    value.toLocaleString("pt-BR", {
      notation: "compact",
      maximumFractionDigits: 1,
      style: "currency",
      currency: "BRL",
    });
  const COLORS = [
    "#36df9b",
    "#63a8ff",
    "#ffb45f",
    "#e98bd7",
    "#9e91ff",
    "#ff777f",
    "#8dd4c3",
    "#d6dc73",
    "#7d8bff",
    "#f1d06b",
  ];
  const CATEGORY_ICONS = {
    Moradia: "⌂",
    Alimentação: "◉",
    Transporte: "↗",
    "Compras pessoais": "▣",
    Saúde: "+",
    "Contas e dívidas": "▤",
    Lazer: "☆",
    Educação: "▱",
    Outros: "•••",
    Salário: "↙",
    "Renda extra": "✳",
    Rendimentos: "↗",
    "Outras receitas": "+",
  };
  const state = {
    month: localMonth(),
    type: "expense",
    categoryChart: null,
    historyChart: null,
    toastTimer: null,
  };
  const transactionDialog = $("transactionDialog");
  const categoriesDialog = $("categoriesDialog");

  function localMonth(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }
  function localDate(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }
  function monthDate(month) {
    return new Date(
      Number(month.slice(0, 4)),
      Number(month.slice(5, 7)) - 1,
      1,
    );
  }
  function monthLabel(month) {
    return monthDate(month).toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });
  }
  function previousMonth(month) {
    const d = monthDate(month);
    d.setMonth(d.getMonth() - 1);
    return localMonth(d);
  }
  function formatMoney(value) {
    return money.format(value);
  }
  function getData() {
    return FinanceStorage.getState();
  }
  function inMonth(t, month) {
    return t.date && t.date.slice(0, 7) === month;
  }
  function monthTransactions(month) {
    return getData().transactions.filter((t) => inMonth(t, month));
  }
  function total(transactions, type) {
    return transactions
      .filter((t) => t.type === type)
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }
  function escapeHtml(value) {
    return String(value).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  }
  function toast(message) {
    const el = $("toast");
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => el.classList.remove("show"), 2800);
  }
  function categoryFor(id) {
    return getData().categories.find((c) => c.id === id);
  }

  function render() {
    $("monthPicker").value = state.month;
    $("monthHeading").textContent = `Resumo de ${monthLabel(state.month)}`;
    $("categoryMonthLabel").textContent = monthLabel(state.month);
    const transactions = monthTransactions(state.month);
    const income = total(transactions, "income");
    const expenses = total(transactions, "expense");
    const balance = income - expenses;
    $("balanceValue").textContent = formatMoney(balance);
    $("balanceValue").className =
      `summary-value ${balance < 0 ? "negative" : "positive"}`;
    $("balanceFoot").textContent =
      balance < 0
        ? "Você gastou mais do que recebeu"
        : "Receitas menos despesas";
    $("incomeValue").textContent = formatMoney(income);
    $("expenseValue").textContent = formatMoney(expenses);
    $("expenseCount").textContent =
      `${transactions.filter((t) => t.type === "expense").length} despesas`;
    $("transactionCount").textContent = transactions.length;
    renderTransactions();
    renderCategoryChart(transactions);
    renderHistoryChart();
    renderComparison(expenses);
  }

  function renderTransactions() {
    const search = $("searchInput").value.trim().toLocaleLowerCase("pt-BR");
    const filterType = $("typeFilter").value;
    const transactions = monthTransactions(state.month)
      .filter((t) => filterType === "all" || t.type === filterType)
      .filter((t) =>
        `${t.description} ${t.notes || ""} ${(categoryFor(t.categoryId) || {}).name || ""}`
          .toLocaleLowerCase("pt-BR")
          .includes(search),
      )
      .sort(
        (a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt,
      );
    const container = $("transactionList");
    if (!transactions.length) {
      container.innerHTML = `<div class="empty-state"><span class="empty-icon" aria-hidden="true">↗</span><strong>${search || filterType !== "all" ? "Nenhum resultado encontrado" : "Nenhum lançamento por aqui"}</strong><p>${search || filterType !== "all" ? "Experimente alterar a busca ou o filtro." : "Adicione uma receita ou despesa para começar seu controle."}</p></div>`;
      return;
    }
    container.innerHTML = transactions
      .map((t) => {
        const category = categoryFor(t.categoryId);
        const categoryName = category ? category.name : "Categoria removida";
        const icon = category
          ? category.icon || CATEGORY_ICONS[category.name] || "•"
          : "•";
        const amountClass = t.type === "income" ? "positive" : "negative";
        const sign = t.type === "income" ? "+" : "−";
        const date = new Date(`${t.date}T12:00:00`).toLocaleDateString(
          "pt-BR",
          { day: "2-digit", month: "short" },
        );
        return `<article class="transaction">
        <div class="transaction-icon" aria-hidden="true">${escapeHtml(icon)}</div>
        <div><div class="transaction-description">${escapeHtml(t.description)}</div><div class="transaction-meta">${escapeHtml(categoryName)} · ${date}</div></div>
        <div class="transaction-right"><div class="transaction-amount ${amountClass}">${sign} ${formatMoney(t.amount)}</div><div class="transaction-actions"><button class="text-button" data-edit="${escapeHtml(t.id)}">Editar</button><button class="text-button" data-delete="${escapeHtml(t.id)}">Excluir</button></div></div>
      </article>`;
      })
      .join("");
  }

  function renderCategoryChart(transactions) {
    const expenses = transactions.filter((t) => t.type === "expense");
    const totals = {};
    expenses.forEach((t) => {
      totals[t.categoryId] = (totals[t.categoryId] || 0) + Number(t.amount);
    });
    const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    $("donutTotal").textContent = shortMoney(
      expenses.reduce((s, t) => s + Number(t.amount), 0),
    );
    const legend = $("categoryLegend");
    if (!entries.length) {
      legend.innerHTML =
        '<p class="muted small">Registre despesas para visualizar o gráfico.</p>';
    } else {
      legend.innerHTML = entries
        .map(([id, value], i) => {
          const c = categoryFor(id);
          const name = c ? c.name : "Outra categoria";
          const percent = expenses.length
            ? (value / expenses.reduce((s, t) => s + Number(t.amount), 0)) * 100
            : 0;
          return `<div class="legend-item"><span class="legend-dot" style="background:${COLORS[i % COLORS.length]}"></span><span>${escapeHtml(name)} · ${percent.toFixed(0)}%</span><strong>${formatMoney(value)}</strong></div>`;
        })
        .join("");
    }
    if (!window.Chart) return;
    if (state.categoryChart) state.categoryChart.destroy();
    state.categoryChart = new Chart($("categoryChart"), {
      type: "doughnut",
      data: {
        labels: entries.map(
          ([id]) => (categoryFor(id) || {}).name || "Outra categoria",
        ),
        datasets: [
          {
            data: entries.map(([, value]) => value),
            backgroundColor: entries.map((_, i) => COLORS[i % COLORS.length]),
            borderColor: "#101715",
            borderWidth: 4,
            hoverOffset: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "74%",
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.label}: ${formatMoney(ctx.raw)}`,
            },
          },
        },
      },
    });
  }

  function renderHistoryChart() {
    const labels = [],
      incomes = [],
      expenses = [];
    const d = monthDate(state.month);
    for (let i = 5; i >= 0; i--) {
      const date = new Date(d.getFullYear(), d.getMonth() - i, 1);
      const month = localMonth(date);
      const tx = monthTransactions(month);
      labels.push(
        date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
      );
      incomes.push(total(tx, "income"));
      expenses.push(total(tx, "expense"));
    }
    if (!window.Chart) return;
    if (state.historyChart) state.historyChart.destroy();
    state.historyChart = new Chart($("historyChart"), {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Receitas",
            data: incomes,
            backgroundColor: "#36df9b",
            borderRadius: 6,
            maxBarThickness: 24,
          },
          {
            label: "Despesas",
            data: expenses,
            backgroundColor: "#ff777f",
            borderRadius: 6,
            maxBarThickness: 24,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: "#91a198" },
            border: { display: false },
          },
          y: {
            beginAtZero: true,
            grid: { color: "#ffffff0c" },
            ticks: { color: "#91a198", callback: (v) => shortMoney(v) },
            border: { display: false },
          },
        },
        plugins: {
          legend: {
            labels: {
              color: "#d5e0d8",
              usePointStyle: true,
              boxWidth: 7,
              boxHeight: 7,
            },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${formatMoney(ctx.raw)}`,
            },
          },
        },
      },
    });
  }

  function renderComparison(currentExpenses) {
    const prevMonth = previousMonth(state.month);
    const prevExpenses = total(monthTransactions(prevMonth), "expense");
    $("currentCompareLabel").textContent = monthLabel(state.month);
    $("previousCompareLabel").textContent = monthLabel(prevMonth);
    $("currentCompareValue").textContent = formatMoney(currentExpenses);
    $("previousCompareValue").textContent = formatMoney(prevExpenses);
    const message = $("comparisonMessage");
    if (currentExpenses === 0 && prevExpenses === 0)
      message.textContent =
        "Registre despesas em dois meses para comparar os resultados.";
    else if (prevExpenses === 0)
      message.textContent =
        "Ainda não há despesas no mês anterior para calcular a variação.";
    else {
      const diff = currentExpenses - prevExpenses;
      const pct = (diff / prevExpenses) * 100;
      if (diff < 0)
        message.textContent = `Você gastou ${formatMoney(Math.abs(diff))} a menos (${Math.abs(pct).toFixed(1).replace(".", ",")}% de redução) em relação ao mês anterior.`;
      else if (diff > 0)
        message.textContent = `Você gastou ${formatMoney(diff)} a mais (${pct.toFixed(1).replace(".", ",")}% de aumento) em relação ao mês anterior.`;
      else
        message.textContent =
          "Suas despesas ficaram iguais às do mês anterior.";
    }
  }

  function fillCategorySelect(type, selectedId) {
    const categories = getData().categories.filter((c) => c.type === type);
    $("category").innerHTML = categories
      .map(
        (c) =>
          `<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)}</option>`,
      )
      .join("");
    if (selectedId && categories.some((c) => c.id === selectedId))
      $("category").value = selectedId;
  }
  function setType(type) {
    state.type = type;
    document.querySelectorAll(".type-toggle button").forEach((button) => {
      const active = button.dataset.type === type;
      button.classList.toggle("selected", active);
      button.setAttribute("aria-pressed", String(active));
    });
    $("formTitle").textContent =
      `${$("transactionId").value ? "Editar" : "Adicionar"} ${type === "expense" ? "despesa" : "receita"}`;
    fillCategorySelect(type);
  }
  function openNew(type) {
    $("transactionForm").reset();
    $("transactionId").value = "";
    $("transactionDate").value = localDate();
    $("formError").textContent = "";
    setType(type);
    transactionDialog.showModal();
    $("description").focus();
  }
  function openEdit(id) {
    const t = getData().transactions.find((item) => item.id === id);
    if (!t) return;
    $("transactionForm").reset();
    $("transactionId").value = t.id;
    $("description").value = t.description;
    $("amount").value = Number(t.amount).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    $("transactionDate").value = t.date;
    $("notes").value = t.notes || "";
    $("formError").textContent = "";
    setType(t.type);
    fillCategorySelect(t.type, t.categoryId);
    transactionDialog.showModal();
    $("description").focus();
  }
  function parseAmount(raw) {
    let value = String(raw).trim().replace(/\s/g, "").replace(/^R\$/i, "");
    if (value.includes(",")) value = value.replace(/\./g, "").replace(",", ".");
    const number = Number(value);
    if (!Number.isFinite(number) || number <= 0 || number > 999999999)
      return null;
    return Math.round(number * 100) / 100;
  }
  function saveTransaction(event) {
    event.preventDefault();
    const id = $("transactionId").value;
    const description = $("description").value.trim();
    const amount = parseAmount($("amount").value);
    const date = $("transactionDate").value;
    const categoryId = $("category").value;
    if (!description) {
      $("formError").textContent = "Informe uma descrição.";
      return;
    }
    if (amount === null) {
      $("formError").textContent =
        "Informe um valor válido maior que zero. Ex.: 125,90";
      return;
    }
    if (!date || Number.isNaN(new Date(`${date}T12:00:00`).getTime())) {
      $("formError").textContent = "Informe uma data válida.";
      return;
    }
    const category = categoryFor(categoryId);
    if (!category || category.type !== state.type) {
      $("formError").textContent =
        "Selecione uma categoria válida para esse tipo.";
      return;
    }
    const data = getData();
    const old = id ? data.transactions.find((t) => t.id === id) : null;
    const transaction = {
      id: id || crypto.randomUUID(),
      description,
      amount,
      type: state.type,
      date,
      categoryId,
      notes: $("notes").value.trim(),
      createdAt: old?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
    const transactions = id
      ? data.transactions.map((t) => (t.id === id ? transaction : t))
      : [...data.transactions, transaction];
    if (!FinanceStorage.setTransactions(transactions)) {
      $("formError").textContent =
        "Não foi possível salvar. Verifique o espaço disponível no navegador.";
      return;
    }
    state.month = date.slice(0, 7);
    $("searchInput").value = "";
    $("typeFilter").value = "all";
    transactionDialog.close();
    render();
    toast(id ? "Lançamento atualizado." : "Lançamento salvo.");
  }

  function deleteTransaction(id) {
    const data = getData();
    const t = data.transactions.find((item) => item.id === id);
    if (!t) return;
    if (
      !confirm(
        `Excluir "${t.description}" (${formatMoney(t.amount)})? Essa ação não pode ser desfeita.`,
      )
    )
      return;
    if (
      !FinanceStorage.setTransactions(
        data.transactions.filter((item) => item.id !== id),
      )
    ) {
      toast("Não foi possível excluir o lançamento.");
      return;
    }
    render();
    toast("Lançamento excluído.");
  }

  function renderCategoryManager() {
    const categories = getData().categories;
    const transactions = getData().transactions;
    $("categoryManagerList").innerHTML = categories
      .map((c) => {
        const used = transactions.some((t) => t.categoryId === c.id);
        return `<div class="category-manager-row"><div><strong>${escapeHtml(c.name)}</strong><small>${c.type === "expense" ? "Despesa" : "Receita"}${used ? " · em uso" : ""}</small></div><button type="button" data-remove-category="${escapeHtml(c.id)}" ${used ? "disabled title='Categoria utilizada'" : ""} aria-label="Remover ${escapeHtml(c.name)}" ${used ? 'style="opacity:.35;cursor:not-allowed"' : ""}>Remover</button></div>`;
      })
      .join("");
  }
  function addCategory() {
    const name = $("newCategoryName").value.trim();
    const type = $("newCategoryType").value;
    if (!name) {
      toast("Digite o nome da categoria.");
      return;
    }
    const data = getData();
    if (
      data.categories.some(
        (c) =>
          c.name.toLocaleLowerCase("pt-BR") ===
            name.toLocaleLowerCase("pt-BR") && c.type === type,
      )
    ) {
      toast("Essa categoria já existe.");
      return;
    }
    const id = `custom-${crypto.randomUUID()}`;
    const next = [...data.categories, { id, name, type, icon: "•" }];
    if (!FinanceStorage.setCategories(next)) {
      toast("Não foi possível salvar a categoria.");
      return;
    }
    $("newCategoryName").value = "";
    renderCategoryManager();
    render();
    toast("Categoria adicionada.");
  }
  function removeCategory(id) {
    const data = getData();
    if (data.transactions.some((t) => t.categoryId === id)) {
      toast("Esta categoria está em uso e não pode ser removida.");
      return;
    }
    const category = data.categories.find((c) => c.id === id);
    if (!category || !confirm(`Remover a categoria "${category.name}"?`))
      return;
    FinanceStorage.setCategories(data.categories.filter((c) => c.id !== id));
    renderCategoryManager();
    render();
    toast("Categoria removida.");
  }

  function exportBackup() {
    const data = getData();
    const backup = {
      app: "Meu Controle",
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      transactions: data.transactions,
      categories: data.categories,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `meu-controle-backup-${localDate()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast("Backup exportado.");
  }
  async function importBackup(file) {
    if (!file) return;
    try {
      const backup = JSON.parse(await file.text());
      if (
        !backup ||
        !Array.isArray(backup.transactions) ||
        !Array.isArray(backup.categories)
      )
        throw new Error(
          "O arquivo não parece ser um backup válido do Meu Controle.",
        );
      const validTransactions = backup.transactions.every(
        (t) =>
          t &&
          typeof t.id === "string" &&
          typeof t.description === "string" &&
          Number.isFinite(Number(t.amount)) &&
          Number(t.amount) > 0 &&
          ["income", "expense"].includes(t.type) &&
          /^\d{4}-\d{2}-\d{2}$/.test(t.date) &&
          typeof t.categoryId === "string",
      );
      const validCategories = backup.categories.every(
        (c) =>
          c &&
          typeof c.id === "string" &&
          typeof c.name === "string" &&
          ["income", "expense"].includes(c.type),
      );
      if (!validTransactions || !validCategories)
        throw new Error("O backup contém registros inválidos.");
      if (
        !confirm(
          `Importar ${backup.transactions.length} lançamentos e substituir os dados atuais? Exporte um backup atual antes, se quiser preservá-lo.`,
        )
      )
        return;
      FinanceStorage.replaceAll({
        transactions: backup.transactions,
        categories: backup.categories,
      });
      render();
      renderCategoryManager();
      toast("Backup importado com sucesso.");
    } catch (error) {
      alert(error.message || "Não foi possível importar o arquivo.");
    } finally {
      $("importFile").value = "";
    }
  }

  $("monthPicker").value = state.month;
  $("monthPicker").addEventListener("change", (e) => {
    if (/^\d{4}-\d{2}$/.test(e.target.value)) {
      state.month = e.target.value;
      render();
    }
  });
  $("addExpense").addEventListener("click", () => openNew("expense"));
  $("addIncome").addEventListener("click", () => openNew("income"));
  $("navAdd").addEventListener("click", () => openNew("expense"));
  document
    .querySelectorAll(".type-toggle button")
    .forEach((button) =>
      button.addEventListener("click", () => setType(button.dataset.type)),
    );
  $("transactionForm").addEventListener("submit", saveTransaction);
  document
    .querySelectorAll(".close-dialog")
    .forEach((button) =>
      button.addEventListener("click", () => button.closest("dialog").close()),
    );
  $("transactionList").addEventListener("click", (e) => {
    const edit = e.target.closest("[data-edit]");
    const del = e.target.closest("[data-delete]");
    if (edit) openEdit(edit.dataset.edit);
    if (del) deleteTransaction(del.dataset.delete);
  });
  $("searchInput").addEventListener("input", renderTransactions);
  $("typeFilter").addEventListener("change", renderTransactions);
  $("exportButton").addEventListener("click", exportBackup);
  $("importButton").addEventListener("click", () => $("importFile").click());
  $("importFile").addEventListener("change", (e) =>
    importBackup(e.target.files[0]),
  );
  $("manageCategoriesButton").addEventListener("click", () => {
    renderCategoryManager();
    categoriesDialog.showModal();
  });
  $("addCategoryButton").addEventListener("click", addCategory);
  $("categoryManagerList").addEventListener("click", (e) => {
    const button = e.target.closest("[data-remove-category]");
    if (button && !button.disabled)
      removeCategory(button.dataset.removeCategory);
  });
  window.addEventListener("storage", (e) => {
    if (e.key === "meu-controle-financeiro-v1") render();
  });
  if (
    "serviceWorker" in navigator &&
    (location.protocol === "https:" ||
      location.hostname === "localhost" ||
      location.hostname === "127.0.0.1")
  ) {
    window.addEventListener("load", () =>
      navigator.serviceWorker
        .register("./service-worker.js")
        .catch((err) => console.warn("PWA indisponível:", err)),
    );
  }
  let installPrompt = null;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    installPrompt = e;
    $("installButton").hidden = false;
  });
  $("installButton").addEventListener("click", async () => {
    if (!installPrompt) {
      toast(
        "No iPhone, use Compartilhar → Adicionar à Tela de Início no Safari.",
      );
      return;
    }
    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    $("installButton").hidden = true;
  });
  if (getData().readError)
    toast(
      "Não foi possível ler os dados anteriores. Verifique se há um backup.",
    );
  render();
})();
