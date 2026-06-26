(function () {
  "use strict";

  const STORAGE_KEY = "spirit-farm-al.v2";
  const summitMerit = 550000;
  const maxTreeStage = 5;
  const app = document.getElementById("alApp");

  const trees = {
    health: {
      key: "health",
      name: "健康樹樹",
      fertilizer: "健康數數",
      task: "乾坤棒",
      color: "#3ead64",
      light: "#a6ef83",
      al: "GE 檢查身體任務與健康養分是否平衡，OP 控制每日節奏。",
    },
    wisdom: {
      key: "wisdom",
      name: "智慧樹樹",
      fertilizer: "智慧數數",
      task: "靈修",
      color: "#4f85dc",
      light: "#a7d9ff",
      al: "GPT5.5 強化敘事與反思感，GE 檢查心得品質。",
    },
    wealth: {
      key: "wealth",
      name: "財富樹樹",
      fertilizer: "財富數數",
      task: "點香",
      color: "#e6aa31",
      light: "#ffe48a",
      al: "OP 管理獎勵與防濫用，GPT5.5 維持儀式感。",
    },
  };

  const tasks = [
    {
      key: "wisdom",
      title: "靈修",
      reward: "智慧數數",
      body: "安靜完成一段沉澱，把今日的理解轉成智慧養分。",
    },
    {
      key: "health",
      title: "乾坤棒",
      reward: "健康數數",
      body: "完成一段身體操練，讓健康樹樹吸收穩定能量。",
    },
    {
      key: "wealth",
      title: "點香",
      reward: "財富數數",
      body: "完成祈願儀式，將專注與祝福累積成財富養分。",
    },
  ];

  const ui = {
    authMode: "login",
    view: "oasis",
    toastTimer: null,
  };

  let state = loadState();

  app.addEventListener("click", handleClick);
  app.addEventListener("submit", handleSubmit);
  render();

  function loadState() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return normalizeState(JSON.parse(raw));
      }
    } catch (error) {
      console.warn("Unable to load AL save.", error);
    }

    const seeded = createSeedState();
    saveState(seeded);
    return seeded;
  }

  function normalizeState(value) {
    const safe = value && typeof value === "object" ? value : {};
    const users = Array.isArray(safe.users) ? safe.users.map(normalizeUser) : [];
    const normalized = {
      version: 2,
      currentUserId: typeof safe.currentUserId === "string" ? safe.currentUserId : null,
      users: users.length ? users : createSeedState().users,
    };

    if (normalized.currentUserId && !normalized.users.some((user) => user.id === normalized.currentUserId)) {
      normalized.currentUserId = null;
    }

    return normalized;
  }

  function normalizeUser(user) {
    const now = new Date().toISOString();
    return {
      id: user.id || makeId("user"),
      username: String(user.username || "farmer"),
      password: String(user.password || ""),
      role: user.role === "gm" ? "gm" : "player",
      oasisName: String(user.oasisName || user.farmName || "未命名綠洲"),
      intention: String(user.intention || ""),
      color: user.color || randomColor(user.username || "farmer"),
      selectedTree: trees[user.selectedTree] ? user.selectedTree : "health",
      createdAt: user.createdAt || now,
      updatedAt: user.updatedAt || now,
      resources: normalizeResources(user.resources),
      treeStages: normalizeTreeStages(user.treeStages),
      tasksByDate: user.tasksByDate && typeof user.tasksByDate === "object" ? user.tasksByDate : {},
      taskLog: Array.isArray(user.taskLog) ? user.taskLog.slice(0, 30) : [],
    };
  }

  function normalizeResources(resources) {
    const safe = resources && typeof resources === "object" ? resources : {};
    return {
      health: toInt(safe.health, 0),
      wisdom: toInt(safe.wisdom, 0),
      wealth: toInt(safe.wealth, 0),
      merit: clamp(toInt(safe.merit, 0), 0, summitMerit),
    };
  }

  function normalizeTreeStages(stages) {
    const safe = stages && typeof stages === "object" ? stages : {};
    return {
      health: clamp(toInt(safe.health, 1), 1, maxTreeStage),
      wisdom: clamp(toInt(safe.wisdom, 1), 1, maxTreeStage),
      wealth: clamp(toInt(safe.wealth, 1), 1, maxTreeStage),
    };
  }

  function createSeedState() {
    const users = [
      createUser({
        username: "yuna",
        password: "demo",
        oasisName: "晨光綠洲",
        intention: "今天先照顧好心，再讓樹慢慢長大。",
        resources: { health: 5, wisdom: 7, wealth: 3, merit: 186000 },
        treeStages: { health: 3, wisdom: 4, wealth: 2 },
        color: "#ff8a4f",
      }),
      createUser({
        username: "kai",
        password: "demo",
        oasisName: "山風綠洲",
        intention: "用穩定節奏累積公德數數。",
        resources: { health: 4, wisdom: 2, wealth: 6, merit: 320000 },
        treeStages: { health: 4, wisdom: 2, wealth: 3 },
        color: "#5eb2df",
      }),
      createUser({
        username: "mei",
        password: "demo",
        oasisName: "花泉綠洲",
        intention: "讓每一個任務都有一點祝福。",
        resources: { health: 6, wisdom: 5, wealth: 5, merit: 455000 },
        treeStages: { health: 5, wisdom: 3, wealth: 4 },
        color: "#e06db3",
      }),
      createUser({
        username: "gm",
        password: "demo",
        role: "gm",
        oasisName: "聖山管理所",
        intention: "GM 可發放公德數數並觀察排行。",
        resources: { health: 9, wisdom: 9, wealth: 9, merit: 548000 },
        treeStages: { health: 5, wisdom: 5, wealth: 5 },
        color: "#68c96b",
      }),
    ];

    return {
      version: 2,
      currentUserId: null,
      users,
    };
  }

  function createUser(input) {
    const now = new Date().toISOString();
    return normalizeUser({
      id: makeId("user"),
      username: input.username,
      password: input.password,
      role: input.role || "player",
      oasisName: input.oasisName,
      intention: input.intention || "",
      selectedTree: input.selectedTree || "health",
      resources: input.resources || { health: 1, wisdom: 1, wealth: 1, merit: 0 },
      treeStages: input.treeStages || { health: 1, wisdom: 1, wealth: 1 },
      color: input.color || randomColor(input.username),
      createdAt: now,
      updatedAt: now,
    });
  }

  function saveState(nextState) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState || state));
  }

  function render() {
    const user = getCurrentUser();
    if (!user) {
      app.innerHTML = renderAuth();
      return;
    }

    if (ui.view === "gm" && user.role !== "gm") {
      ui.view = "oasis";
    }

    app.innerHTML = `
      <div class="app">
        <div class="shell">
          ${renderHud(user)}
          <main class="stage">${renderView(user)}</main>
        </div>
        <div class="toast" aria-live="polite"></div>
      </div>
    `;
  }

  function renderAuth() {
    const isRegister = ui.authMode === "register";
    return `
      <main class="auth-scene">
        <section class="auth-copy">
          <span class="brand-mark">${icon("al")}</span>
          <div>
            <p class="eyebrow">AL · OP + GE + GPT5.5</p>
            <h1>綠洲聖山</h1>
            <p>完成每日任務取得健康、智慧、財富數數，培育三棵生命樹；GM 發放公德數數後，玩家角色會在聖山路線上前進。</p>
          </div>
        </section>
        <section class="auth-card">
          <div class="auth-tabs">
            <button class="auth-tab ${!isRegister ? "is-active" : ""}" type="button" data-action="auth-mode" data-mode="login">登入</button>
            <button class="auth-tab ${isRegister ? "is-active" : ""}" type="button" data-action="auth-mode" data-mode="register">註冊</button>
          </div>
          ${isRegister ? renderRegisterForm() : renderLoginForm()}
          <p class="auth-hint">玩家範例：yuna / demo、kai / demo。GM 後台：gm / demo。</p>
        </section>
        <div class="toast" aria-live="polite"></div>
      </main>
    `;
  }

  function renderLoginForm() {
    return `
      <form class="auth-form" data-auth-form="login">
        <label>
          <span>玩家名稱</span>
          <input name="username" autocomplete="username" required />
        </label>
        <label>
          <span>密碼</span>
          <input name="password" type="password" autocomplete="current-password" required />
        </label>
        <button class="action-button" type="submit">${icon("spark")}進入綠洲</button>
      </form>
    `;
  }

  function renderRegisterForm() {
    return `
      <form class="auth-form" data-auth-form="register">
        <label>
          <span>玩家名稱</span>
          <input name="username" autocomplete="username" minlength="2" maxlength="18" required />
        </label>
        <label>
          <span>密碼</span>
          <input name="password" type="password" autocomplete="new-password" minlength="4" required />
        </label>
        <label>
          <span>綠洲名稱</span>
          <input name="oasisName" maxlength="24" required />
        </label>
        <label>
          <span>今日心願</span>
          <input name="intention" maxlength="80" placeholder="例如：今天照顧健康樹樹" />
        </label>
        <button class="action-button" type="submit">${icon("leaf")}建立綠洲</button>
      </form>
    `;
  }

  function renderHud(user) {
    const nav = [
      ["oasis", "綠洲", icon("leaf")],
      ["tasks", "任務", icon("scroll")],
      ["mountain", "聖山", icon("mountain")],
      ["leaderboard", "排行", icon("rank")],
    ];
    if (user.role === "gm") {
      nav.push(["gm", "GM", icon("star")]);
    }

    return `
      <header class="hud">
        <section class="brand">
          <span class="brand-mark">${icon("al")}</span>
          <div>
            <strong>${escapeHtml(user.oasisName)}</strong>
            <span>${escapeHtml(user.username)} · ${user.role === "gm" ? "GM" : "玩家"}</span>
          </div>
        </section>
        <nav class="nav" aria-label="遊戲區塊">
          ${nav
            .map(
              ([key, label, svg]) => `
                <button class="nav-button ${ui.view === key ? "is-active" : ""}" type="button" data-action="view" data-view="${key}">
                  ${svg}
                  <span>${label}</span>
                </button>
              `,
            )
            .join("")}
        </nav>
        <section class="resource-bar" aria-label="資源">
          ${resource("health", user.resources.health)}
          ${resource("wisdom", user.resources.wisdom)}
          ${resource("wealth", user.resources.wealth)}
          ${resource("merit", compact(user.resources.merit))}
          <button class="logout-button" type="button" data-action="logout">切換</button>
        </section>
      </header>
    `;
  }

  function renderView(user) {
    if (ui.view === "tasks") return renderTasks(user);
    if (ui.view === "mountain") return renderMountain(user);
    if (ui.view === "leaderboard") return renderLeaderboard();
    if (ui.view === "gm") return renderGm();
    return renderOasis(user);
  }

  function renderOasis(user) {
    const tree = trees[user.selectedTree];
    return `
      <section class="scene oasis">
        <div class="scene-content">
          <aside class="panel">
            <div class="panel-head">
              <h2>AL 架構</h2>
              <span class="tag">正式 UI</span>
            </div>
            <div class="agent-row">
              ${agentChip("OP", "流程控制", "任務、施肥、GM 權限與資料保存")}
              ${agentChip("GE", "平衡校正", "三種數數與三種樹不可混用")}
              ${agentChip("GPT5.5", "敘事美術", "全站維持精緻綠洲與聖山風格")}
            </div>
          </aside>

          <section class="hero-tree-area" aria-label="綠洲種樹主畫面">
            ${treeArt(tree.key, "hero-tree", Math.max(4, user.treeStages[tree.key]))}
            <div class="tree-selector">
              ${Object.values(trees).map((entry) => renderTreeOption(user, entry)).join("")}
            </div>
          </section>

          <aside class="panel">
            <div class="panel-head">
              <h2>${tree.name}</h2>
              <span class="tag">第 ${user.treeStages[tree.key]} 階</span>
            </div>
            <div class="metric-grid">
              ${metric(tree.key, user.resources[tree.key], tree.fertilizer)}
              ${metric("merit", compact(user.resources.merit), "公德數數")}
              ${metric("wisdom", `${completedCountToday(user)} / 3`, "今日任務")}
            </div>
            <p>${escapeHtml(user.intention || tree.al)}</p>
            <div class="action-stack">
              <button class="action-button" type="button" data-action="feed">${icon("spark")}對應施肥</button>
              <button class="action-button secondary" type="button" data-action="view" data-view="tasks">${icon("scroll")}取得肥料</button>
            </div>
          </aside>
        </div>
      </section>
    `;
  }

  function renderTreeOption(user, tree) {
    return `
      <button class="tree-option ${user.selectedTree === tree.key ? "is-active" : ""}" type="button" data-action="tree" data-tree="${tree.key}">
        ${treeArt(tree.key, "tree-icon", 2)}
        <span>
          <strong>${tree.name}</strong>
          <span>${tree.task} 產出 ${tree.fertilizer}</span>
        </span>
      </button>
    `;
  }

  function renderTasks(user) {
    return `
      <section class="scene tasks">
        <div class="scene-content two-col task-layout">
          <section class="task-grid">
            ${tasks.map((task) => renderTaskCard(user, task)).join("")}
          </section>
          <aside class="panel">
            <div class="panel-head">
              <h2>今日任務節奏</h2>
              <span class="tag">${completedCountToday(user)} / 3</span>
            </div>
            <div class="metric-grid">
              ${tasks.map((task) => metric(task.key, isTaskDoneToday(user, task.key) ? "+1" : "0", task.reward)).join("")}
            </div>
            <p>每天三個任務各領一次。健康數數只能餵健康樹樹，智慧數數只能餵智慧樹樹，財富數數只能餵財富樹樹。</p>
          </aside>
        </div>
      </section>
    `;
  }

  function renderTaskCard(user, task) {
    const done = isTaskDoneToday(user, task.key);
    return `
      <article class="task-card ${done ? "is-done" : ""}">
        <div class="panel-head">
          <span class="task-icon">${taskGlyph(task.key)}</span>
          <span class="tag">${task.reward}</span>
        </div>
        <div class="task-copy">
          <h3>${task.title}</h3>
          <p>${task.body}</p>
        </div>
        <button class="action-button" type="button" data-action="task" data-task="${task.key}">
          ${done ? `${icon("check")}今日已領取` : `${icon("spark")}完成領取`}
        </button>
      </article>
    `;
  }

  function renderMountain(user) {
    const ranked = rankedUsers();
    return `
      <section class="scene mountain">
        <div class="scene-content two-col">
          <section class="mountain-overlay" aria-label="聖山登山路線">
            ${ranked.map(renderClimber).join("")}
          </section>
          <aside class="panel">
            <div class="panel-head">
              <h2>聖山進度</h2>
              <span class="tag">55萬登頂</span>
            </div>
            <div class="metric-grid">
              ${metric("merit", compact(user.resources.merit), "我的公德數數")}
              ${metric("wisdom", `${Math.floor(progress(user.resources.merit) * 100)}%`, "目前山路比例")}
            </div>
            <div class="leader-list">
              ${ranked.slice(0, 4).map((entry, index) => leaderRow(entry, index)).join("")}
            </div>
          </aside>
        </div>
      </section>
    `;
  }

  function renderLeaderboard() {
    const ranked = rankedUsers();
    const podium = [ranked[1], ranked[0], ranked[2]].filter(Boolean);
    return `
      <section class="scene observatory">
        <div class="scene-content two-col">
          <section class="panel">
            <div class="panel-head">
              <h2>聖山登頂排行榜</h2>
              <span class="tag">全玩家</span>
            </div>
            <div class="podium-grid">
              ${podium
                .map((user) => {
                  const rank = ranked.indexOf(user) + 1;
                  const className = rank === 1 ? "first" : rank === 2 ? "second" : "third";
                  return `
                    <div class="podium ${className}">
                      ${character(user.color, "avatar")}
                      <strong>#${rank} ${escapeHtml(user.username)}</strong>
                      <span class="leader-sub">${format(user.resources.merit)} 公德數數</span>
                    </div>
                  `;
                })
                .join("")}
            </div>
          </section>
          <aside class="panel">
            <div class="panel-head">
              <h2>進度明細</h2>
              <span class="tag">比例制</span>
            </div>
            <div class="leader-list">
              ${ranked.map((entry, index) => leaderRow(entry, index)).join("")}
            </div>
          </aside>
        </div>
      </section>
    `;
  }

  function renderGm() {
    const ranked = rankedUsers();
    return `
      <section class="scene observatory">
        <div class="scene-content two-col">
          <section class="panel">
            <div class="panel-head">
              <h2>GM 公德後台</h2>
              <span class="tag">AL Gate</span>
            </div>
            <div class="gm-list">
              ${ranked
                .map(
                  (user, index) => `
                    <div class="gm-row">
                      <span class="rank">${index + 1}</span>
                      <div>
                        <strong>${escapeHtml(user.username)}</strong>
                        <span class="leader-sub">${format(user.resources.merit)} · ${Math.floor(progress(user.resources.merit) * 100)}%</span>
                      </div>
                      <input name="${user.id}" type="number" min="0" step="1000" placeholder="公德" />
                      <button class="icon-button" type="button" data-action="grant" data-user-id="${user.id}">${icon("spark")}發放</button>
                    </div>
                  `,
                )
                .join("")}
            </div>
          </section>
          <aside class="panel">
            <div class="panel-head">
              <h2>發放規則</h2>
              <span class="tag">OP 控管</span>
            </div>
            <p>GM 發放公德數數後，玩家角色會按照公德數數 / 550000 的比例在聖山路線上前進。前端原型會即時保存到本機資料。</p>
            <div class="metric-grid">
              ${metric("merit", "550,000", "登頂門檻")}
              ${metric("health", "即時", "角色位置更新")}
            </div>
          </aside>
        </div>
      </section>
    `;
  }

  function handleClick(event) {
    const trigger = event.target.closest("[data-action]");
    if (!trigger) return;

    const action = trigger.dataset.action;
    if (action === "auth-mode") {
      ui.authMode = trigger.dataset.mode || "login";
      render();
      return;
    }

    if (action === "logout") {
      state.currentUserId = null;
      ui.view = "oasis";
      saveState();
      render();
      return;
    }

    if (action === "view") {
      ui.view = trigger.dataset.view || "oasis";
      render();
      return;
    }

    if (action === "tree") {
      const user = getCurrentUser();
      if (!user || !trees[trigger.dataset.tree]) return;
      user.selectedTree = trigger.dataset.tree;
      user.updatedAt = new Date().toISOString();
      saveState();
      render();
      return;
    }

    if (action === "feed") {
      feedTree();
      return;
    }

    if (action === "task") {
      completeTask(trigger.dataset.task);
      return;
    }

    if (action === "grant") {
      grantMerit(trigger);
    }
  }

  function handleSubmit(event) {
    const form = event.target.closest("[data-auth-form]");
    if (!form) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    const mode = form.dataset.authForm;
    const data = new FormData(form);
    const username = String(data.get("username") || "").trim();
    const password = String(data.get("password") || "");

    if (!username || !password) {
      showToast("請輸入玩家名稱與密碼。");
      return;
    }

    if (mode === "login") {
      const found = state.users.find((user) => normalizeName(user.username) === normalizeName(username));
      if (!found || found.password !== password) {
        showToast("帳號或密碼不正確。");
        return;
      }

      state.currentUserId = found.id;
      ui.view = "oasis";
      saveState();
      render();
      showToast(`歡迎回來，${found.username}`);
      return;
    }

    if (state.users.some((user) => normalizeName(user.username) === normalizeName(username))) {
      showToast("這個玩家名稱已經被使用。");
      return;
    }

    const oasisName = String(data.get("oasisName") || "").trim();
    if (username.length < 2 || password.length < 4 || !oasisName) {
      showToast("請確認名稱、密碼與綠洲名稱。");
      return;
    }

    const user = createUser({
      username,
      password,
      oasisName,
      intention: String(data.get("intention") || "").trim(),
      resources: { health: 1, wisdom: 1, wealth: 1, merit: 0 },
      treeStages: { health: 1, wisdom: 1, wealth: 1 },
    });
    state.users.push(user);
    state.currentUserId = user.id;
    ui.view = "oasis";
    saveState();
    render();
    showToast("綠洲建立完成，已送三種新手數數。");
  }

  function feedTree() {
    const user = getCurrentUser();
    if (!user) return;

    const key = user.selectedTree;
    if (user.treeStages[key] >= maxTreeStage) {
      showToast(`${trees[key].name} 已經長成滿階。`);
      return;
    }

    if (user.resources[key] <= 0) {
      ui.view = "tasks";
      render();
      showToast(`需要 ${trees[key].fertilizer}`);
      return;
    }

    user.resources[key] -= 1;
    user.treeStages[key] += 1;
    user.updatedAt = new Date().toISOString();
    saveState();
    render();
    showToast(`${trees[key].name} 已吸收 ${trees[key].fertilizer}`);
  }

  function completeTask(key) {
    const user = getCurrentUser();
    if (!user || !trees[key]) return;

    if (isTaskDoneToday(user, key)) {
      showToast("今日已領取。");
      return;
    }

    const now = new Date().toISOString();
    const date = todayKey();
    user.tasksByDate[date] = user.tasksByDate[date] || {};
    user.tasksByDate[date][key] = {
      completedAt: now,
      reward: trees[key].fertilizer,
    };
    user.resources[key] += 1;
    user.updatedAt = now;
    user.taskLog.unshift({ key, completedAt: now });
    user.taskLog = user.taskLog.slice(0, 30);
    saveState();
    render();
    showToast(`獲得 ${trees[key].fertilizer}`);
  }

  function grantMerit(trigger) {
    const gm = getCurrentUser();
    if (!gm || gm.role !== "gm") {
      showToast("只有 GM 可以發放公德數數。");
      return;
    }

    const row = trigger.closest(".gm-row");
    const input = row ? row.querySelector("input") : null;
    const amount = Math.max(0, toInt(input && input.value ? input.value : 10000, 10000));
    const user = state.users.find((entry) => entry.id === trigger.dataset.userId);
    if (!user || amount <= 0) {
      showToast("請輸入有效公德數數。");
      return;
    }

    user.resources.merit = clamp(user.resources.merit + amount, 0, summitMerit);
    user.updatedAt = new Date().toISOString();
    saveState();
    render();
    showToast(`${user.username} +${format(amount)} 公德數數`);
  }

  function resource(key, value) {
    const labels = {
      health: "健康數數",
      wisdom: "智慧數數",
      wealth: "財富數數",
      merit: "公德數數",
    };
    return `
      <div class="resource">
        ${token(key)}
        <span>
          <strong>${value}</strong>
          <small>${labels[key]}</small>
        </span>
      </div>
    `;
  }

  function metric(key, value, label) {
    return `
      <div class="metric">
        ${key === "merit" ? token(key) : treeArt(key, "tree-icon", 2)}
        <div>
          <strong>${value}</strong>
          <span class="muted">${label}</span>
        </div>
      </div>
    `;
  }

  function agentChip(id, role, text) {
    return `
      <div class="agent-chip">
        <span class="agent-badge">${id === "GPT5.5" ? "GPT" : id}</span>
        <span>
          <strong>${id} · ${role}</strong>
          <span>${text}</span>
        </span>
      </div>
    `;
  }

  function token(key) {
    const letters = {
      health: "健",
      wisdom: "智",
      wealth: "財",
      merit: "德",
    };
    return `<span class="token ${key}">${letters[key]}</span>`;
  }

  function leaderRow(user, index) {
    const percent = Math.round(progress(user.resources.merit) * 100);
    return `
      <div class="leader-row">
        <span class="rank">${index + 1}</span>
        <div>
          <strong>${escapeHtml(user.username)}</strong>
          <span class="leader-sub">${format(user.resources.merit)} 公德數數</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="--progress: ${percent}%"></div>
        </div>
      </div>
    `;
  }

  function renderClimber(user) {
    const point = routePoint(progress(user.resources.merit));
    return `
      <div class="climber" style="left:${point.x}%; top:${point.y}%">
        ${character(user.color, "")}
        <span class="climber-label">${escapeHtml(user.username)}</span>
      </div>
    `;
  }

  function rankedUsers() {
    return state.users.slice().sort((a, b) => b.resources.merit - a.resources.merit);
  }

  function getCurrentUser() {
    return state.users.find((user) => user.id === state.currentUserId) || null;
  }

  function getTodayRecords(user) {
    return user.tasksByDate[todayKey()] || {};
  }

  function isTaskDoneToday(user, key) {
    return Boolean(getTodayRecords(user)[key]);
  }

  function completedCountToday(user) {
    return Object.keys(getTodayRecords(user)).length;
  }

  function progress(merit) {
    return Math.max(0, Math.min(1, merit / summitMerit));
  }

  function routePoint(ratio) {
    const points = [
      [10, 83],
      [28, 76],
      [49, 69],
      [37, 61],
      [59, 53],
      [45, 45],
      [62, 37],
      [49, 29],
      [56, 21],
      [51, 11],
    ];
    const max = points.length - 1;
    const scaled = ratio * max;
    const index = Math.min(max - 1, Math.floor(scaled));
    const local = scaled - index;
    const current = points[index];
    const next = points[index + 1] || current;
    return {
      x: current[0] + (next[0] - current[0]) * local,
      y: current[1] + (next[1] - current[1]) * local,
    };
  }

  function compact(value) {
    return value >= 10000 ? `${Math.round(value / 10000)}萬` : String(value);
  }

  function format(value) {
    return new Intl.NumberFormat("zh-Hant").format(value);
  }

  function todayKey() {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }

  function showToast(message) {
    const toast = app.querySelector(".toast");
    if (!toast) return;
    clearTimeout(ui.toastTimer);
    toast.textContent = message;
    toast.classList.add("is-visible");
    ui.toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2200);
  }

  function treeArt(key, className, stage) {
    const tree = trees[key] || trees.health;
    const size = Math.max(1, Math.min(5, stage || 1));
    const canopy = 22 + size * 7;
    const trunkHeight = 36 + size * 8;
    const y = 128 - trunkHeight;
    return `
      <svg class="${className}" viewBox="0 0 170 170" role="img" aria-label="${tree.name}">
        <ellipse cx="85" cy="146" rx="54" ry="16" fill="#5e4327" opacity=".23"></ellipse>
        <rect x="74" y="${y}" width="22" height="${trunkHeight}" rx="11" fill="#8d5b31"></rect>
        <path d="M85 ${y + 21} C61 ${y + 5} 48 ${y - 16} 39 ${y - 35}" fill="none" stroke="#8d5b31" stroke-width="9" stroke-linecap="round"></path>
        <path d="M89 ${y + 18} C108 ${y + 3} 123 ${y - 18} 133 ${y - 38}" fill="none" stroke="#8d5b31" stroke-width="9" stroke-linecap="round"></path>
        <circle cx="85" cy="${y - 26}" r="${canopy}" fill="${tree.color}"></circle>
        <circle cx="${85 - canopy * 0.8}" cy="${y - 12}" r="${canopy * 0.72}" fill="${tree.color}" opacity=".94"></circle>
        <circle cx="${85 + canopy * 0.78}" cy="${y - 15}" r="${canopy * 0.7}" fill="${tree.color}" opacity=".92"></circle>
        <circle cx="${85 - canopy * 0.15}" cy="${y - 58}" r="${canopy * 0.58}" fill="${tree.color}" opacity=".98"></circle>
        <circle cx="${85 + canopy * 0.34}" cy="${y - 38}" r="${Math.max(8, canopy * 0.2)}" fill="${tree.light}"></circle>
        <circle cx="${85 - canopy * 0.46}" cy="${y - 32}" r="${Math.max(7, canopy * 0.16)}" fill="${tree.light}" opacity=".92"></circle>
        <circle cx="${85 + canopy * 0.04}" cy="${y - 62}" r="${Math.max(6, canopy * 0.13)}" fill="#fff6c9" opacity=".78"></circle>
      </svg>
    `;
  }

  function character(color, className) {
    return `
      <svg class="${className}" viewBox="0 0 86 108" role="img" aria-label="玩家角色">
        <ellipse cx="43" cy="99" rx="26" ry="8" fill="#5e4327" opacity=".22"></ellipse>
        <circle cx="43" cy="27" r="19" fill="#ffd6a0" stroke="#7b4d28" stroke-width="4"></circle>
        <path d="M20 78 C22 49 64 49 66 78 L70 98 H16Z" fill="${color}" stroke="#7b4d28" stroke-width="5" stroke-linejoin="round"></path>
        <path d="M26 24 C32 8 56 9 62 25 C51 18 39 18 26 24Z" fill="#654025"></path>
        <circle cx="36" cy="30" r="3" fill="#3c2d20"></circle>
        <circle cx="50" cy="30" r="3" fill="#3c2d20"></circle>
        <path d="M34 42 C39 47 48 47 53 42" fill="none" stroke="#8e4a32" stroke-width="3" stroke-linecap="round"></path>
      </svg>
    `;
  }

  function taskGlyph(key) {
    if (key === "wisdom") return icon("meditation");
    if (key === "health") return icon("staff");
    return icon("incense");
  }

  function icon(type) {
    const common = 'viewBox="0 0 40 40" aria-hidden="true"';
    if (type === "al") {
      return `<svg ${common}><path d="M20 5 24.6 15.2 36 16.4 27.4 24 30 35 20 29.2 10 35 12.6 24 4 16.4 15.4 15.2Z" fill="#fff2a6" stroke="#6e461d" stroke-width="3" stroke-linejoin="round"/><circle cx="20" cy="20" r="5" fill="#5ec5de"/></svg>`;
    }
    if (type === "leaf") {
      return `<svg ${common}><path d="M20 34V17" stroke="#7a4b23" stroke-width="4" stroke-linecap="round"/><path d="M19 20C10 18 6 12 6 5c10 1 15 6 13 15Z" fill="#48b766"/><path d="M21 18C30 17 35 10 35 4c-10 1-15 6-14 14Z" fill="#70cf68"/></svg>`;
    }
    if (type === "scroll") {
      return `<svg ${common}><rect x="9" y="7" width="23" height="28" rx="6" fill="#fff8d9" stroke="#6e461d" stroke-width="3"/><path d="M15 17h12M15 24h10" stroke="#6e461d" stroke-width="3" stroke-linecap="round"/></svg>`;
    }
    if (type === "mountain") {
      return `<svg ${common}><path d="M4 33 15 12l5 9 6-14 10 26Z" fill="#8ca1ad" stroke="#6e461d" stroke-width="3" stroke-linejoin="round"/><path d="m26 7-4 10 5-3 4 4Z" fill="#fff"/></svg>`;
    }
    if (type === "rank") {
      return `<svg ${common}><rect x="6" y="21" width="8" height="13" rx="3" fill="#d99a31"/><rect x="16" y="10" width="8" height="24" rx="3" fill="#ffd56d"/><rect x="26" y="16" width="8" height="18" rx="3" fill="#e8b14a"/></svg>`;
    }
    if (type === "star") {
      return `<svg ${common}><path d="m20 5 4 10 11 1-8 7 3 11-10-6-10 6 3-11-8-7 11-1Z" fill="#b87ce8" stroke="#6e461d" stroke-width="3" stroke-linejoin="round"/></svg>`;
    }
    if (type === "spark") {
      return `<svg ${common}><path d="M20 4 24 16 36 20 24 24 20 36 16 24 4 20 16 16Z" fill="#fff2a6" stroke="#8a5b25" stroke-width="3" stroke-linejoin="round"/></svg>`;
    }
    if (type === "check") {
      return `<svg ${common}><circle cx="20" cy="20" r="15" fill="#59bd66" stroke="#386d34" stroke-width="3"/><path d="m12 20 5 5 11-12" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    }
    if (type === "meditation") {
      return `<svg ${common}><circle cx="20" cy="12" r="7" fill="#ffd6a0"/><path d="M12 27c5-8 11-8 16 0l3 7H9Z" fill="#4f85dc"/><path d="M8 33c6-6 18-6 24 0" fill="none" stroke="#7b4d28" stroke-width="4" stroke-linecap="round"/></svg>`;
    }
    if (type === "staff") {
      return `<svg ${common}><rect x="19" y="5" width="4" height="30" rx="2" fill="#8d5b31" transform="rotate(-32 21 20)"/><circle cx="16" cy="14" r="7" fill="#ffd6a0"/><path d="M10 31c5-9 17-9 22 0Z" fill="#3ead64"/></svg>`;
    }
    return `<svg ${common}><path d="M20 6c-8 8-3 14 0 18 5-6 7-11 0-18Z" fill="#ff8a4f"/><rect x="17" y="21" width="6" height="13" rx="3" fill="#8d5b31"/><path d="M12 27c-6-8-4-15 1-20M28 27c6-8 4-15-1-20" fill="none" stroke="#e6aa31" stroke-width="3" stroke-linecap="round"/></svg>`;
  }

  function makeId(prefix) {
    const cryptoApi = window.crypto || window.msCrypto;
    if (cryptoApi && cryptoApi.randomUUID) {
      return `${prefix}-${cryptoApi.randomUUID()}`;
    }
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function randomColor(seed) {
    const colors = ["#ff8a4f", "#68c96b", "#e06db3", "#5eb2df", "#b681e8", "#e7aa31"];
    const text = String(seed || "");
    const sum = text.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
    return colors[sum % colors.length];
  }

  function normalizeName(value) {
    return String(value || "").trim().toLowerCase();
  }

  function toInt(value, fallback) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, (character) => {
      const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      };
      return entities[character];
    });
  }
})();
