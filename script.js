document.addEventListener("DOMContentLoaded", () => {
  // === DOM ELEMENTS ===
  const balanceAmountEl = document.getElementById("balance-amount");
  const transactionForm = document.getElementById("transaction-form");
  const descriptionInput = document.getElementById("description");
  const amountInput = document.getElementById("amount");
  const transactionListEl = document.getElementById("transaction-list");

  const setTargetBtn = document.getElementById("set-target-btn");
  const targetModal = document.getElementById("target-modal");
  const closeModalBtn = document.querySelector(".close-btn");
  const targetForm = document.getElementById("target-form");
  const targetAmountInput = document.getElementById("target-amount");
  const savingsProgressTextEl = document.getElementById("savings-progress-text");
  const savingsTargetTextEl = document.getElementById("savings-target-text");
  const savingsProgressBar = document.getElementById("savings-progress-bar");

  const weeklyIncomeEl = document.getElementById("weekly-income");
  const weeklyExpenseEl = document.getElementById("weekly-expense");

  // SIDEBAR USER
  const userNameEl = document.getElementById("user-name");
  const avatarEl = document.querySelector(".avatar");
  const levelEl = document.getElementById("user-level");
  const expBarEl = document.getElementById("exp-bar");
  const expTextEl = document.getElementById("exp-text");
  const rankEl = document.querySelector(".rank");

  // === STATE ===
  let state = {
    transactions: JSON.parse(localStorage.getItem("transactions")) || [],
    savingsTarget: JSON.parse(localStorage.getItem("savingsTarget")) || 0,
    username: localStorage.getItem("username") || "Pengguna",
    level: Number(localStorage.getItem("level")) || 1,
    exp: Number(localStorage.getItem("exp")) || 0 // 0–99
  };

  // === HELPERS ===
  const saveState = () => {
    localStorage.setItem("transactions", JSON.stringify(state.transactions));
    localStorage.setItem("savingsTarget", JSON.stringify(state.savingsTarget));
    localStorage.setItem("username", state.username);
    localStorage.setItem("level", state.level);
    localStorage.setItem("exp", state.exp);
  };

  const formatToRupiah = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0
    }).format(amount);
  };

  const calculateExpChange = (type, amount) => {
    if (type === "income") return Math.floor(amount / 1000);
    if (type === "expense") return -Math.floor(amount / 2000);
    return 0;
  };

  const normalizeExp = () => {
    // LEVEL UP
    if (state.exp >= 100) {
      const lvUp = Math.floor(state.exp / 100);
      state.level += lvUp;
      state.exp = state.exp % 100;
    }
    if (state.exp < 0) state.exp = 0;
  };

  const getRank = () => {
    if (state.level >= 20) return "Platinum";
    if (state.level >= 10) return "Gold";
    if (state.level >= 5) return "Silver";
    return "Bronze";
  };

  // === UI UPDATE ===
  const updateUserUI = () => {
    userNameEl.textContent = state.username;
    avatarEl.textContent = state.username[0].toUpperCase();

    levelEl.textContent = state.level;
    expBarEl.style.width = state.exp + "%";
    expTextEl.textContent = state.exp + "%";

    rankEl.textContent = getRank();
  };

  const updateBalance = () => {
    const total = state.transactions.reduce((acc, t) => {
      return t.type === "income" ? acc + t.amount : acc - t.amount;
    }, 0);
    balanceAmountEl.textContent = formatToRupiah(total);
    return total;
  };

  const renderTransactions = () => {
    transactionListEl.innerHTML = "";

    if (state.transactions.length === 0) {
      transactionListEl.innerHTML = `<li class="no-transactions">Belum ada transaksi.</li>`;
      return;
    }

    state.transactions.forEach((t, i) => {
      const li = document.createElement("li");
      const sign = t.type === "income" ? "+" : "-";
      li.innerHTML = `
        <span class="transaction-desc">${t.description}<br>
          <small style="color:#94a3b8">${new Date(t.date).toLocaleString()}</small></span>
        <div style="display:flex;gap:8px;align-items:center">
          <span class="transaction-amount ${t.type}">${sign}${formatToRupiah(t.amount)}</span>
          <button class="delete-btn" data-index="${i}">Hapus</button>
        </div>
      `;
      transactionListEl.appendChild(li);
    });
  };

  const updateSavingsProgress = (balance) => {
    savingsTargetTextEl.textContent = `Target: ${formatToRupiah(state.savingsTarget)}`;
    savingsProgressTextEl.textContent = `Tersimpan: ${formatToRupiah(balance)}`;

    if (state.savingsTarget > 0) {
      const progress = Math.min(100, (balance / state.savingsTarget) * 100);
      savingsProgressBar.style.width = progress + "%";
    } else {
      savingsProgressBar.style.width = "0%";
    }
  };

  const updateReport = () => {
    const oneWeek = new Date();
    oneWeek.setDate(oneWeek.getDate() - 7);
    const weekly = state.transactions.filter((t) => new Date(t.date) >= oneWeek);

    const inc = weekly.filter((t) => t.type === "income").reduce((a, b) => a + b.amount, 0);
    const exp = weekly.filter((t) => t.type === "expense").reduce((a, b) => a + b.amount, 0);

    weeklyIncomeEl.textContent = formatToRupiah(inc);
    weeklyExpenseEl.textContent = formatToRupiah(exp);
  };

  const refresh = () => {
    normalizeExp();
    updateUserUI();

    const bal = updateBalance();
    updateSavingsProgress(bal);
    renderTransactions();
    updateReport();

    saveState();
  };

  // === ADD TRANSACTION ===
  transactionForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const desc = descriptionInput.value.trim();
    const amount = parseInt(amountInput.value);
    const type = document.querySelector("input[name='type']:checked").value;

    if (!desc || !amount || amount <= 0) return alert("Isi data dengan benar");

    const expChange = calculateExpChange(type, amount);

    state.transactions.unshift({
      description: desc,
      amount,
      type,
      date: new Date().toISOString(),
      expChange
    });

    state.exp += expChange;

    descriptionInput.value = "";
    amountInput.value = "";
    refresh();
  });

  // === DELETE TRANSACTION ===
  transactionListEl.addEventListener("click", (e) => {
    if (!e.target.matches(".delete-btn")) return;

    const idx = e.target.dataset.index;
    const tx = state.transactions[idx];

    // reverse saldo + reverse exp
    state.exp -= tx.expChange;
    state.transactions.splice(idx, 1);

    refresh();
  });

  // === TARGET MODAL ===
  setTargetBtn.addEventListener("click", () => {
    targetModal.style.display = "flex";
    targetAmountInput.value = state.savingsTarget || "";
  });

  closeModalBtn.addEventListener("click", () => (targetModal.style.display = "none"));
  document.querySelectorAll(".close-modal").forEach((b) =>
    b.addEventListener("click", () => (targetModal.style.display = "none"))
  );

  targetForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const val = Number(targetAmountInput.value);
    if (isNaN(val) || val < 0) return alert("Target tidak valid");

    state.savingsTarget = val;
    targetModal.style.display = "none";
    refresh();
  });

  // === USERNAME CHANGE ===
  const askName = () => {
    const name = prompt("Masukkan nama kamu:", state.username);
    if (!name) return;
    state.username = name.trim();
    saveState();
    refresh();
  };

   if (userNameEl) userNameEl.onclick = askName;
   if (avatarEl) avatarEl.onclick = askName;


  // INIT FIRST LOAD
  refresh();
});
