(function () {
  "use strict";

  const STORAGE_KEY = "spirit-farm-al.v2";
  const summitMerit = 550000;
  const maxTreeStage = 5;
  const plotCount = 12;
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
    selectedPlotId: "plot-1",
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
      selectedPlotId: user.selectedPlotId || "plot-1",
      createdAt: user.createdAt || now,
      updatedAt: user.updatedAt || now,
      resources: normalizeResources(user.resources),
      treeStages: normalizeTreeStages(user.treeStages),
      plots: normalizePlots(user.plots, user.treeStages),
      tasksByDate: user.tasksByDate && typeof user.tasksByDate === "object" ? user.tasksByDate : {},
      taskLog: Array.isArray(user.taskLog) ? user.taskLog.slice(0, 30) : [],
    };
  }

  function normalizePlots(plots, fallbackStages) {
    const safePlots = Array.isArray(plots) ? plots.slice(0, plotCount) : [];
    const normalized = safePlots.map((plot, index) => normalizePlot(plot, index));

    if (!normalized.length) {
      const stages = normalizeTreeStages(fallbackStages);
      normalized.push(
        normalizePlot({ id: "plot-1", treeKey: "health", stage: stages.health }, 0),
        normalizePlot({ id: "plot-2", treeKey: "wisdom", stage: stages.wisdom }, 1),
        normalizePlot({ id: "plot-3", treeKey: "wealth", stage: stages.wealth }, 2),
      );
    }

    while (normalized.length < plotCount) {
      normalized.push(normalizePlot({}, normalized.length));
    }
    return normalized;
  }

  function normalizePlot(plot, index) {
    const safe = plot && typeof plot === "object" ? plot : {};
    const treeKey = trees[safe.treeKey] ? safe.treeKey : trees[safe.treeId] ? safe.treeId : null;
    return {
      id: safe.id || `plot-${index + 1}`,
      treeKey,
      stage: treeKey ? clamp(toInt(safe.stage, 1), 1, maxTreeStage) : 0,
      plantedAt: safe.plantedAt || null,
      updatedAt: safe.updatedAt || null,
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
      plots: input.plots,
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
    return renderGameBoard(user);
  }

  function renderGameBoard(user) {
    const selectedPlot = getSelectedPlot(user);
    const selectedTree = selectedPlot && selectedPlot.treeKey ? trees[selectedPlot.treeKey] : trees[user.selectedTree];
    const actionLabel = selectedPlot && selectedPlot.treeKey
      ? selectedPlot.stage >= maxTreeStage
        ? "已滿階"
        : "施肥成長"
      : `種下${trees[user.selectedTree].name}`;
    const ranked = rankedUsers();
    return `
      <section class="scene game-board view-${ui.view}">
        <div class="game-map ${ui.view === "mountain" ? "map-mountain" : "map-oasis"}">
          ${ui.view === "mountain" ? renderMountainWorld(ranked) : renderFarmWorld(user)}
        </div>

        <aside class="floating-panel farm-ledger">
          <div class="panel-head">
            <h2>${ui.view === "mountain" ? "聖山入口" : "農場看板"}</h2>
            <span class="tag">${plantedCount(user)} / ${plotCount}</span>
          </div>
          <div class="ledger-grid">
            ${ledgerTile("health", treeCount(user, "health"), "健康樹")}
            ${ledgerTile("wisdom", treeCount(user, "wisdom"), "智慧樹")}
            ${ledgerTile("wealth", treeCount(user, "wealth"), "財富樹")}
            ${ledgerTile("merit", compact(user.resources.merit), "公德")}
          </div>
          <p>${escapeHtml(user.intention || "完成任務、取得數數、種下對應樹木，讓綠洲逐步長成自己的農場。")}</p>
        </aside>

        <aside class="floating-panel action-board">
          ${
            ui.view === "oasis"
              ? renderFarmActionPanel(user, selectedPlot, selectedTree, actionLabel)
              : renderFeaturePanel(user, ranked)
          }
        </aside>

        ${renderActionRail(user)}
        ${ui.view === "oasis" ? renderTreeDock(user) : ""}
        ${ui.view !== "oasis" ? renderDrawer(user, ranked) : ""}
      </section>
    `;
  }

  function renderFarmWorld(user) {
    return `
      <section class="farm-field game-farm-field" aria-label="綠洲農場土地">
        <div class="plot-layer">
          ${user.plots.map((plot, index) => renderFarmPlot(user, plot, index)).join("")}
        </div>
      </section>
    `;
  }

  function renderMountainWorld(ranked) {
    return `
      <section class="mountain-overlay game-mountain-path" aria-label="聖山登山路線">
        ${ranked.map(renderClimber).join("")}
      </section>
    `;
  }

  function renderFarmActionPanel(user, selectedPlot, selectedTree, actionLabel) {
    return `
      <div class="panel-head">
        <h2>${selectedPlot && selectedPlot.treeKey ? selectedTree.name : "選擇土地"}</h2>
        <span class="tag">${selectedPlot && selectedPlot.treeKey ? `Lv.${selectedPlot.stage}` : "空地"}</span>
      </div>
      <div class="focus-tree">
        <img src="${treeAsset(selectedTree.key)}" alt="${selectedTree.name}" />
        <div>
          <strong>${selectedTree.fertilizer}</strong>
          <span>${user.resources[selectedTree.key]} 可用</span>
        </div>
      </div>
      <p>${selectedPlot && selectedPlot.treeKey ? selectedTree.al : `先選樹種，再點空地種下。${selectedTree.task} 會產出 ${selectedTree.fertilizer}。`}</p>
      <div class="action-stack">
        <button class="action-button" type="button" data-action="feed">${icon("spark")}${actionLabel}</button>
        <button class="action-button secondary" type="button" data-action="view" data-view="tasks">${icon("scroll")}去做任務</button>
      </div>
    `;
  }

  function renderFeaturePanel(user, ranked) {
    if (ui.view === "tasks") {
      return `
        <div class="panel-head">
          <h2>今日訂單板</h2>
          <span class="tag">${completedCountToday(user)} / 3</span>
        </div>
        <p>完成每日任務取得數數。數數只能餵對應的樹，這是整個養成循環的入口。</p>
        <div class="mini-list">
          ${tasks.map((task) => miniTaskRow(user, task)).join("")}
        </div>
      `;
    }

    if (ui.view === "mountain") {
      return `
        <div class="panel-head">
          <h2>聖山進度</h2>
          <span class="tag">55萬登頂</span>
        </div>
        <div class="leader-list compact">
          ${ranked.slice(0, 3).map((entry, index) => leaderRow(entry, index)).join("")}
        </div>
      `;
    }

    if (ui.view === "leaderboard") {
      return `
        <div class="panel-head">
          <h2>登頂排行</h2>
          <span class="tag">全玩家</span>
        </div>
        <div class="leader-list compact">
          ${ranked.slice(0, 5).map((entry, index) => leaderRow(entry, index)).join("")}
        </div>
      `;
    }

    return `
      <div class="panel-head">
        <h2>GM 控制台</h2>
        <span class="tag">公德發放</span>
      </div>
      <p>選擇玩家輸入公德數數，角色會依比例往聖山山頂前進。</p>
      <div class="mini-list">
        ${ranked.slice(0, 3).map((entry, index) => `<span>${index + 1}. ${escapeHtml(entry.username)} · ${format(entry.resources.merit)}</span>`).join("")}
      </div>
    `;
  }

  function renderDrawer(user, ranked) {
    const title = {
      tasks: "每日任務",
      mountain: "聖山地圖",
      leaderboard: "排行榜",
      gm: "GM 後台",
    }[ui.view] || "功能";

    return `
      <section class="game-drawer drawer-${ui.view}">
        <div class="drawer-head">
          <h2>${title}</h2>
          <button class="icon-button secondary" type="button" data-action="view" data-view="oasis">${icon("leaf")}回農場</button>
        </div>
        ${renderDrawerContent(user, ranked)}
      </section>
    `;
  }

  function renderDrawerContent(user, ranked) {
    if (ui.view === "tasks") {
      return `
        <div class="task-grid game-task-grid">
          ${tasks.map((task) => renderTaskCard(user, task)).join("")}
        </div>
      `;
    }

    if (ui.view === "mountain") {
      return `
        <div class="mountain-brief">
          ${metric("merit", compact(user.resources.merit), "我的公德數數")}
          ${metric("wisdom", `${Math.floor(progress(user.resources.merit) * 100)}%`, "目前山路比例")}
        </div>
      `;
    }

    if (ui.view === "leaderboard") {
      return `
        <div class="leader-list game-leader-list">
          ${ranked.map((entry, index) => leaderRow(entry, index)).join("")}
        </div>
      `;
    }

    return `
      <div class="gm-list game-gm-list">
        ${ranked
          .map(
            (entry, index) => `
              <div class="gm-row">
                <span class="rank">${index + 1}</span>
                <div>
                  <strong>${escapeHtml(entry.username)}</strong>
                  <span class="leader-sub">${format(entry.resources.merit)} · ${Math.floor(progress(entry.resources.merit) * 100)}%</span>
                </div>
                <input name="${entry.id}" type="number" min="0" step="1000" placeholder="公德" />
                <button class="icon-button" type="button" data-action="grant" data-user-id="${entry.id}">${icon("spark")}發放</button>
              </div>
            `,
          )
          .join("")}
      </div>
    `;
  }

  function renderActionRail(user) {
    const nav = [
      ["oasis", "農場", icon("leaf")],
      ["tasks", "任務", icon("scroll")],
      ["mountain", "聖山", icon("mountain")],
      ["leaderboard", "排行", icon("rank")],
    ];
    if (user.role === "gm") nav.push(["gm", "GM", icon("star")]);
    return `
      <nav class="action-rail" aria-label="遊戲入口">
        ${nav
          .map(
            ([key, label, svg]) => `
              <button class="rail-button ${ui.view === key ? "is-active" : ""}" type="button" data-action="view" data-view="${key}">
                ${svg}
                <span>${label}</span>
              </button>
            `,
          )
          .join("")}
      </nav>
    `;
  }

  function renderTreeDock(user) {
    return `
      <div class="tree-dock">
        ${Object.values(trees).map((entry) => renderTreeOption(user, entry)).join("")}
      </div>
    `;
  }

  function ledgerTile(key, value, label) {
    const visual = key === "merit"
      ? token(key)
      : `<img class="tree-icon tree-icon-img" src="${treeAsset(key)}" alt="${trees[key].name}" />`;
    return `
      <div class="ledger-tile ${key}">
        ${visual}
        <strong>${value}</strong>
        <span>${label}</span>
      </div>
    `;
  }

  function miniTaskRow(user, task) {
    const done = isTaskDoneToday(user, task.key);
    return `
      <span class="mini-row ${done ? "is-done" : ""}">
        <span>${taskGlyph(task.key)}</span>
        <strong>${task.title}</strong>
        <em>${done ? "完成" : task.reward}</em>
      </span>
    `;
  }

  function renderOasis(user) {
    const selectedPlot = getSelectedPlot(user);
    const selectedTree = selectedPlot && selectedPlot.treeKey ? trees[selectedPlot.treeKey] : trees[user.selectedTree];
    const actionLabel = selectedPlot && selectedPlot.treeKey
      ? selectedPlot.stage >= maxTreeStage
        ? "已滿階"
        : "對應施肥"
      : `種下${trees[user.selectedTree].name}`;
    return `
      <section class="scene oasis">
        <div class="scene-content">
          <aside class="panel oasis-summary-panel">
            <div class="panel-head">
              <h2>綠洲總覽</h2>
              <span class="tag">${plantedCount(user)} / ${plotCount}</span>
            </div>
            <div class="metric-grid">
              ${metric("health", treeCount(user, "health"), "健康樹樹")}
              ${metric("wisdom", treeCount(user, "wisdom"), "智慧樹樹")}
              ${metric("wealth", treeCount(user, "wealth"), "財富樹樹")}
              ${metric("merit", compact(user.resources.merit), "公德數數")}
            </div>
            <p>${escapeHtml(user.intention || "在綠洲中種下多棵樹，完成每日任務取得對應數數，讓每一棵樹慢慢成長。")}</p>
          </aside>

          <section class="farm-field" aria-label="綠洲農場土地">
            <div class="plot-layer">
              ${user.plots.map((plot, index) => renderFarmPlot(user, plot, index)).join("")}
            </div>
            <div class="tree-selector">
              ${Object.values(trees).map((entry) => renderTreeOption(user, entry)).join("")}
            </div>
          </section>

          <aside class="panel oasis-action-panel">
            <div class="panel-head">
              <h2>${selectedPlot && selectedPlot.treeKey ? selectedTree.name : "選擇空地"}</h2>
              <span class="tag">${selectedPlot && selectedPlot.treeKey ? `第 ${selectedPlot.stage} 階` : "可種植"}</span>
            </div>
            <div class="metric-grid">
              ${metric(selectedTree.key, user.resources[selectedTree.key], selectedTree.fertilizer)}
              ${metric("merit", compact(user.resources.merit), "公德數數")}
              ${metric("wisdom", `${completedCountToday(user)} / 3`, "今日任務")}
            </div>
            <p>${selectedPlot && selectedPlot.treeKey ? selectedTree.al : `目前選取 ${trees[user.selectedTree].name}。點選空地後可用 ${trees[user.selectedTree].fertilizer} 種下。`}</p>
            <div class="action-stack">
              <button class="action-button" type="button" data-action="feed">${icon("spark")}${actionLabel}</button>
              <button class="action-button secondary" type="button" data-action="view" data-view="tasks">${icon("scroll")}取得肥料</button>
            </div>
          </aside>
        </div>
      </section>
    `;
  }

  function renderFarmPlot(user, plot, index) {
    const selected = getSelectedPlot(user);
    const positionClass = `plot-pos-${index + 1}`;
    const isSelected = selected && selected.id === plot.id;
    const tree = plot.treeKey ? trees[plot.treeKey] : trees[user.selectedTree];
    return `
      <button class="farm-plot ${positionClass} ${isSelected ? "is-selected" : ""} ${plot.treeKey ? "is-planted" : "is-empty"}" type="button" data-action="plot" data-plot-id="${plot.id}" aria-label="${plot.treeKey ? tree.name : "空地"}">
        <span class="plot-base"></span>
        ${
          plot.treeKey
            ? `<img class="plot-tree stage-${plot.stage}" src="${treeAsset(plot.treeKey)}" alt="${tree.name}" />`
            : `<span class="plot-empty-icon">${icon("leaf")}</span>`
        }
        <span class="plot-badge">${plot.treeKey ? `Lv.${plot.stage}` : "空地"}</span>
      </button>
    `;
  }

  function renderTreeOption(user, tree) {
    return `
      <button class="tree-option ${user.selectedTree === tree.key ? "is-active" : ""}" type="button" data-action="tree" data-tree="${tree.key}">
        <img class="tree-icon tree-icon-img" src="${treeAsset(tree.key)}" alt="${tree.name}" />
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

    if (action === "plot") {
      selectPlot(trigger.dataset.plotId);
      return;
    }

    if (action === "feed") {
      handlePlotAction();
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

  function selectPlot(plotId) {
    const user = getCurrentUser();
    if (!user) return;
    const plot = getPlot(user, plotId);
    if (!plot) return;

    user.selectedPlotId = plot.id;
    ui.selectedPlotId = plot.id;
    user.updatedAt = new Date().toISOString();
    saveState();
    render();
  }

  function handlePlotAction() {
    const user = getCurrentUser();
    if (!user) return;

    const plot = getSelectedPlot(user);
    if (!plot) {
      showToast("請先選擇一塊土地。");
      return;
    }

    if (!plot.treeKey) {
      plantSelectedTree(user, plot);
      return;
    }

    upgradePlotTree(user, plot);
  }

  function plantSelectedTree(user, plot) {
    const key = user.selectedTree;
    if (user.resources[key] <= 0) {
      ui.view = "tasks";
      render();
      showToast(`種下 ${trees[key].name} 需要 ${trees[key].fertilizer}`);
      return;
    }

    user.resources[key] -= 1;
    plot.treeKey = key;
    plot.stage = 1;
    plot.plantedAt = new Date().toISOString();
    plot.updatedAt = plot.plantedAt;
    user.updatedAt = plot.plantedAt;
    syncTreeStages(user);
    saveState();
    render();
    showToast(`${trees[key].name} 已種下。`);
  }

  function upgradePlotTree(user, plot) {
    const key = plot.treeKey;
    if (plot.stage >= maxTreeStage) {
      showToast(`${trees[key].name} 已經滿階。`);
      return;
    }

    if (user.resources[key] <= 0) {
      ui.view = "tasks";
      render();
      showToast(`需要 ${trees[key].fertilizer}`);
      return;
    }

    user.resources[key] -= 1;
    plot.stage += 1;
    plot.updatedAt = new Date().toISOString();
    user.updatedAt = plot.updatedAt;
    syncTreeStages(user);
    saveState();
    render();
    showToast(`${trees[key].name} 升到第 ${plot.stage} 階。`);
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
    const visual = key === "merit"
      ? token(key)
      : `<img class="tree-icon tree-icon-img" src="${treeAsset(key)}" alt="${trees[key] ? trees[key].name : label}" />`;
    return `
      <div class="metric">
        ${visual}
        <div>
          <strong>${value}</strong>
          <span class="muted">${label}</span>
        </div>
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

  function getPlot(user, plotId) {
    if (!user || !Array.isArray(user.plots)) return null;
    return user.plots.find((plot) => plot.id === plotId) || null;
  }

  function getSelectedPlot(user) {
    if (!user) return null;
    const selectedId = user.selectedPlotId || ui.selectedPlotId;
    return getPlot(user, selectedId) || (Array.isArray(user.plots) ? user.plots[0] : null);
  }

  function plantedCount(user) {
    return user.plots.filter((plot) => plot.treeKey).length;
  }

  function treeCount(user, key) {
    return user.plots.filter((plot) => plot.treeKey === key).length;
  }

  function syncTreeStages(user) {
    Object.keys(trees).forEach((key) => {
      const stages = user.plots.filter((plot) => plot.treeKey === key).map((plot) => plot.stage || 1);
      user.treeStages[key] = stages.length ? Math.max(...stages) : 1;
    });
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

  function treeAsset(key) {
    const script = document.querySelector ? document.querySelector('script[src*="concept-v2/app.js"]') : null;
    if (script && script.src) {
      return new URL(`../assets/concept-v2/trees/${key}.png`, script.src).toString();
    }
    const prefix = window.location.pathname.includes("/concept-v2/") ? "../" : "./";
    return `${prefix}assets/concept-v2/trees/${key}.png`;
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
