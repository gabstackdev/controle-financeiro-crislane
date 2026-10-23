(() => {
  "use strict";
  const STORAGE_KEY = "meu-controle-financeiro-v1";
  const defaultCategories = [
    { id: "moradia", name: "Moradia", type: "expense", icon: "⌂" },
    { id: "alimentacao", name: "Alimentação", type: "expense", icon: "◉" },
    { id: "transporte", name: "Transporte", type: "expense", icon: "↗" },
    { id: "compras", name: "Compras pessoais", type: "expense", icon: "▣" },
    { id: "saude", name: "Saúde", type: "expense", icon: "+" },
    { id: "contas", name: "Contas e dívidas", type: "expense", icon: "▤" },
    { id: "lazer", name: "Lazer", type: "expense", icon: "☆" },
    { id: "educacao", name: "Educação", type: "expense", icon: "▱" },
    { id: "outros", name: "Outros", type: "expense", icon: "•••" },
    { id: "salario", name: "Salário", type: "income", icon: "↙" },
    { id: "freelance", name: "Renda extra", type: "income", icon: "✳" },
    { id: "investimentos", name: "Rendimentos", type: "income", icon: "↗" },
    {
      id: "outras-receitas",
      name: "Outras receitas",
      type: "income",
      icon: "+",
    },
  ];

  function read() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw)
        return { version: 1, transactions: [], categories: defaultCategories };
      const data = JSON.parse(raw);
      if (
        !data ||
        !Array.isArray(data.transactions) ||
        !Array.isArray(data.categories)
      )
        throw new Error("Formato inválido");
      return data;
    } catch (error) {
      console.error("Não foi possível ler os dados locais:", error);
      return {
        version: 1,
        transactions: [],
        categories: defaultCategories,
        readError: true,
      };
    }
  }
  let state = read();

  function persist() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          version: 1,
          transactions: state.transactions,
          categories: state.categories,
        }),
      );
      return true;
    } catch (error) {
      console.error("Não foi possível salvar os dados:", error);
      return false;
    }
  }
  function getState() {
    return structuredClone(state);
  }
  function setTransactions(transactions) {
    state.transactions = transactions;
    return persist();
  }
  function setCategories(categories) {
    state.categories = categories;
    return persist();
  }
  function replaceAll(next) {
    if (
      !next ||
      !Array.isArray(next.transactions) ||
      !Array.isArray(next.categories)
    )
      throw new Error("Arquivo de backup inválido.");
    state = {
      version: 1,
      transactions: next.transactions,
      categories: next.categories,
    };
    if (!persist())
      throw new Error(
        "Não foi possível salvar os dados importados neste navegador.",
      );
  }
  window.FinanceStorage = {
    getState,
    setTransactions,
    setCategories,
    replaceAll,
    persist,
    defaultCategories,
  };
})();
