document.addEventListener("DOMContentLoaded", () => {

  // === DOM ===
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

  // Sidebar
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
    level: Number(localStorage.getItem("level")) || 0,
    exp: Number(localStorage.getItem("exp")) || 0  // 0–100
  };

  // === SAVE ===
  const saveState = () => {
    localStorage.setItem("transactions", JSON.stringify(state.transactions));
    localStorage.setItem("savingsTarget", JSON.stringify(state.savingsTarget));
    localStorage.setItem("username", state.username);
    localStorage.setItem("level", state.level);
    localStorage.setItem("exp", state.exp);
  };

  // Format Rupiah
  const formatToRupiah = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0
    }).format(amount);
  };

  // === EXP CALCULATION ===
  const calculateExpChange = (type, amount) => {
    if (state.level >= 200) return 0; // FULL MAX

    if (type === "income") {
      return (amount / 1000) * 0.2;   // +0.2%
    }
    if (type === "expense") {
      return -(amount / 1000) * 0.1; // -0.1%
    }
    return 0;
  };

  // === NORMALIZE EXP & LEVEL ===
  const normalizeExpAndLevel = () => {

    // Sudah max level
    if (state.level >= 200) {
      state.level = 200;
      state.exp = 100;
      return;
    }

    // Naik level jika exp >= 100
    while (state.exp >= 100 && state.level < 200) {
      state.level++;
      state.exp -= 100;

      if (state.level >= 200) {
        state.level = 200;
        state.exp = 100;
        break;
      }
    }

    // EXP tidak boleh minus
    if (state.exp < 0) state.exp = 0;
  };

  // === RANK ===
  const getRank = () => {
    if (state.level >= 200) return "Platinum";
    if (state.level >= 100) return "Gold";
    if (state.level >= 50) return "Silver";
    return "Bronze";
  };

  // === UPDATE UI ===
  const updateUserUI = () => {
    userNameEl.textContent = state.username;
    avatarEl.textContent = state.username[0].toUpperCase();
    levelEl.textContent = state.level;

    if (state.level >= 200) {
      expTextEl.textContent = "MAX";
      expBarEl.style.width = "100%";
    } else {
      expTextEl.textContent = state.exp.toFixed(1) + "%";
      expBarEl.style.width = state.exp + "%";
    }

    rankEl.textContent = getRank();
  };

  // === BALANCE ===
  const updateBalance = () => {
    const total = state.transactions.reduce((acc, t) => {
      return t.type === "income" ? acc + t.amount : acc - t.amount;
    }, 0);

    balanceAmountEl.textContent = formatToRupiah(total);
    return total;
  };

  // === RENDER TRANSACTIONS ===
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
          <small style="color:#94a3b8">${new Date(t.date).toLocaleString()}</small>
        </span>
        <div style="display:flex;gap:8px;align-items:center">
          <span class="transaction-amount ${t.type}">${sign}${formatToRupiah(t.amount)}</span>
          <button class="delete-btn" data-index="${i}">Hapus</button>
        </div>
      `;

      transactionListEl.appendChild(li);
    });
  };

  // === SAVINGS PROGRESS ===
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

  // === REPORT ===
  const updateReport = () => {
    const oneWeek = new Date();
    oneWeek.setDate(oneWeek.getDate() - 7);

    const weekly = state.transactions.filter((t) => new Date(t.date) >= oneWeek);

    const inc = weekly.filter((t) => t.type === "income").reduce((a, b) => a + b.amount, 0);
    const exp = weekly.filter((t) => t.type === "expense").reduce((a, b) => a + b.amount, 0);

    weeklyIncomeEl.textContent = formatToRupiah(inc);
    weeklyExpenseEl.textContent = formatToRupiah(exp);
  };

  // === REFRESH ===
  const refresh = () => {
    normalizeExpAndLevel();
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

    state.exp -= tx.expChange;

    if (state.exp < 0) state.exp = 0;

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

  refresh();
});
