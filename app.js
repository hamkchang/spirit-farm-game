(function () {
  "use strict";

  const STORAGE_KEY = "spirit-farm-game.v1";
  const PLOT_COUNT = 9;
  const MAX_STAGE = 4;
  const stageNames = ["種子", "幼芽", "小樹", "盛葉", "祝福樹"];

  const treeTypes = {
    olive: {
      id: "olive",
      name: "平安橄欖樹",
      shortName: "橄欖",
      leaf: "#6f9f56",
      accent: "#c8d96b",
      mood: "安定",
    },
    cedar: {
      id: "cedar",
      name: "勇氣香柏樹",
      shortName: "香柏",
      leaf: "#2f6f57",
      accent: "#7fc6a4",
      mood: "堅定",
    },
    sakura: {
      id: "sakura",
      name: "感恩櫻花樹",
      shortName: "櫻花",
      leaf: "#d76d8b",
      accent: "#ffc4d3",
      mood: "感謝",
    },
    lemon: {
      id: "lemon",
      name: "喜樂檸檬樹",
      shortName: "檸檬",
      leaf: "#6f9f56",
      accent: "#e8c846",
      mood: "明亮",
    },
    pine: {
      id: "pine",
      name: "盼望松樹",
      shortName: "松樹",
      leaf: "#3f7d7a",
      accent: "#84c7bd",
      mood: "盼望",
    },
  };

  const taskList = [
    {
      id: "song-stillness",
      title: "聽一首歌靜坐靈修",
      kind: "timer",
      seconds: 30,
      reward: 1,
      rewardName: "靜心肥料",
      body: "安靜坐下，讓一首歌陪你把注意力放回心裡。原型使用 30 秒倒數。",
    },
    {
      id: "daily-reflection",
      title: "寫今日心得",
      kind: "reflection",
      minChars: 24,
      reward: 1,
      rewardName: "沉澱肥料",
      body: "寫下今天最想留下的一句話，或一段你正在學會的事。",
      placeholder: "例如：今天我發現自己在壓力裡仍然可以慢慢呼吸...",
    },
    {
      id: "gratitude-note",
      title: "記下一件感恩",
      kind: "reflection",
      minChars: 12,
      reward: 1,
      rewardName: "感恩肥料",
      body: "把一件微小但真實的感謝寫下來。",
      placeholder: "今天我感謝...",
    },
    {
      id: "breath-prayer",
      title: "呼吸禱告",
      kind: "timer",
      seconds: 20,
      reward: 1,
      rewardName: "平安肥料",
      body: "用幾次深呼吸整理身體，讓今天的節奏慢一點。",
    },
    {
      id: "encourage-someone",
      title: "送出一句鼓勵",
      kind: "check",
      reward: 1,
      rewardName: "連結肥料",
      body: "向一位朋友、家人或同伴送出一句真誠鼓勵。",
      confirm: "我已經把鼓勵送出去了",
    },
  ];

  const app = document.getElementById("app");
  const ui = {
    authMode: "register",
    view: "farm",
    selectedTreeId: "olive",
    selectedPlotId: null,
    selectedVisitUserId: null,
    timer: null,
    timerId: null,
    toastId: null,
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
      console.warn("Unable to read local save.", error);
    }

    const seeded = createSeedState();
    saveState(seeded);
    return seeded;
  }

  function normalizeState(value) {
    const safe = value && typeof value === "object" ? value : {};
    const users = Array.isArray(safe.users) ? safe.users.map(normalizeUser) : [];
    return {
      version: 1,
      currentUserId: safe.currentUserId || null,
      users: users.length ? users : createSeedState().users,
    };
  }

  function normalizeUser(user) {
    const plots = Array.isArray(user.farm && user.farm.plots)
      ? user.farm.plots.slice(0, PLOT_COUNT)
      : [];
    while (plots.length < PLOT_COUNT) {
      plots.push(createEmptyPlot(plots.length));
    }

    return {
      id: user.id || makeId("user"),
      username: user.username || "farmer",
      password: user.password || "",
      farmName: user.farmName || "未命名農場",
      intention: user.intention || "",
      createdAt: user.createdAt || new Date().toISOString(),
      updatedAt: user.updatedAt || new Date().toISOString(),
      fertilizer: Number(user.fertilizer || 0),
      blessings: Number(user.blessings || 0),
      tasksByDate: user.tasksByDate || {},
      taskLog: Array.isArray(user.taskLog) ? user.taskLog.slice(0, 18) : [],
      farm: {
        plots: plots.map((plot, index) => normalizePlot(plot, index)),
      },
    };
  }

  function normalizePlot(plot, index) {
    return {
      id: plot.id || `plot-${index + 1}`,
      treeId: treeTypes[plot.treeId] ? plot.treeId : null,
      stage: clamp(Number(plot.stage || 0), 0, MAX_STAGE),
      plantedAt: plot.plantedAt || null,
      fedCount: Number(plot.fedCount || 0),
      updatedAt: plot.updatedAt || null,
    };
  }

  function saveState(nextState) {
    const payload = nextState || state;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }

  function createSeedState() {
    const users = [
      createUser({
        username: "yuna",
        password: "demo",
        farmName: "晨光果園",
        intention: "今天先把心安放好，再慢慢長大。",
        fertilizer: 1,
        blessings: 2,
        plots: [
          { index: 0, treeId: "olive", stage: 4, fedCount: 4 },
          { index: 1, treeId: "sakura", stage: 2, fedCount: 2 },
          { index: 2, treeId: "lemon", stage: 3, fedCount: 3 },
          { index: 4, treeId: "pine", stage: 1, fedCount: 1 },
        ],
      }),
      createUser({
        username: "kai",
        password: "demo",
        farmName: "山邊靜田",
        intention: "把每一次呼吸都當成新的開始。",
        fertilizer: 2,
        blessings: 1,
        plots: [
          { index: 0, treeId: "cedar", stage: 3, fedCount: 3 },
          { index: 3, treeId: "pine", stage: 4, fedCount: 4 },
          { index: 5, treeId: "olive", stage: 1, fedCount: 1 },
          { index: 8, treeId: "lemon", stage: 2, fedCount: 2 },
        ],
      }),
    ];

    return {
      version: 1,
      currentUserId: null,
      users,
    };
  }

  function createUser(input) {
    const now = new Date().toISOString();
    const user = {
      id: makeId("user"),
      username: input.username.trim(),
      password: input.password,
      farmName: input.farmName.trim(),
      intention: (input.intention || "").trim(),
      createdAt: now,
      updatedAt: now,
      fertilizer: Number(input.fertilizer || 0),
      blessings: Number(input.blessings || 0),
      tasksByDate: {},
      taskLog: [],
      farm: {
        plots: Array.from({ length: PLOT_COUNT }, (_, index) => createEmptyPlot(index)),
      },
    };

    (input.plots || []).forEach((plot) => {
      if (plot.index >= 0 && plot.index < PLOT_COUNT && treeTypes[plot.treeId]) {
        user.farm.plots[plot.index] = {
          id: `plot-${plot.index + 1}`,
          treeId: plot.treeId,
          stage: clamp(Number(plot.stage || 0), 0, MAX_STAGE),
          plantedAt: daysAgoIso(7 - plot.index),
          fedCount: Number(plot.fedCount || plot.stage || 0),
          updatedAt: daysAgoIso(Math.max(0, 5 - plot.stage)),
        };
      }
    });

    return user;
  }

  function createEmptyPlot(index) {
    return {
      id: `plot-${index + 1}`,
      treeId: null,
      stage: 0,
      plantedAt: null,
      fedCount: 0,
      updatedAt: null,
    };
  }

  function render() {
    const user = getCurrentUser();
    if (!user) {
      app.innerHTML = renderAuth();
      return;
    }

    app.innerHTML = `
      ${renderTopbar(user)}
      <main class="workspace">
        ${renderView(user)}
      </main>
      <div class="toast" role="status" aria-live="polite"></div>
    `;
  }

  function renderAuth() {
    const isRegister = ui.authMode === "register";
    return `
      <main class="auth-screen">
        <section class="brand-panel" aria-label="心田農場">
          <div class="brand-copy">
            <div class="brand-mark" aria-hidden="true">
              ${renderBrandIcon()}
            </div>
            <h1>心田農場</h1>
            <p>用每日任務換成肥料，讓自己的樹慢慢長大，也看見朋友的農場正在經歷什麼季節。</p>
          </div>
          <div class="brand-stats" aria-label="遊戲狀態">
            <div class="brand-stat">
              <strong>5</strong>
              <span>種樹苗</span>
            </div>
            <div class="brand-stat">
              <strong>${state.users.length}</strong>
              <span>座農場</span>
            </div>
            <div class="brand-stat">
              <strong>${taskList.length}</strong>
              <span>項任務</span>
            </div>
          </div>
        </section>

        <section class="auth-card" aria-label="帳號">
          <div class="auth-tabs">
            <button class="tab-button ${isRegister ? "is-active" : ""}" type="button" data-action="auth-mode" data-mode="register">註冊</button>
            <button class="tab-button ${!isRegister ? "is-active" : ""}" type="button" data-action="auth-mode" data-mode="login">登入</button>
          </div>
          ${isRegister ? renderRegisterForm() : renderLoginForm()}
          <p class="fine-print">範例帳號：yuna / demo，kai / demo。此原型資料存在本機瀏覽器。</p>
        </section>
        <div class="toast" role="status" aria-live="polite"></div>
      </main>
    `;
  }

  function renderRegisterForm() {
    return `
      <form class="form-stack" data-auth-form="register">
        <div class="field">
          <label for="register-username">玩家名稱</label>
          <input id="register-username" name="username" autocomplete="username" required minlength="2" maxlength="18" />
        </div>
        <div class="field">
          <label for="register-password">密碼</label>
          <input id="register-password" name="password" type="password" autocomplete="new-password" required minlength="4" />
        </div>
        <div class="field">
          <label for="register-farm">農場名稱</label>
          <input id="register-farm" name="farmName" required maxlength="24" />
        </div>
        <div class="field">
          <label for="register-intention">今日心願</label>
          <textarea id="register-intention" name="intention" maxlength="120" placeholder="寫一句你想讓這座農場記得的話"></textarea>
        </div>
        <button class="primary-button" type="submit">建立農場</button>
      </form>
    `;
  }

  function renderLoginForm() {
    return `
      <form class="form-stack" data-auth-form="login">
        <div class="field">
          <label for="login-username">玩家名稱</label>
          <input id="login-username" name="username" autocomplete="username" required />
        </div>
        <div class="field">
          <label for="login-password">密碼</label>
          <input id="login-password" name="password" type="password" autocomplete="current-password" required />
        </div>
        <button class="primary-button" type="submit">進入農場</button>
      </form>
    `;
  }

  function renderTopbar(user) {
    return `
      <header class="topbar">
        <div class="player-chip">
          <span class="avatar" aria-hidden="true">${getInitial(user.username)}</span>
          <div>
            <strong>${escapeHtml(user.farmName)}</strong>
            <span>${escapeHtml(user.username)}</span>
          </div>
        </div>

        <nav class="mode-tabs" aria-label="主要區域">
          <button class="nav-button ${ui.view === "farm" ? "is-active" : ""}" type="button" data-action="change-view" data-view="farm">農場</button>
          <button class="nav-button ${ui.view === "tasks" ? "is-active" : ""}" type="button" data-action="change-view" data-view="tasks">任務</button>
          <button class="nav-button ${ui.view === "world" ? "is-active" : ""}" type="button" data-action="change-view" data-view="world">世界</button>
        </nav>

        <div class="inventory">
          <span class="pill">肥料 ${user.fertilizer}</span>
          <span class="pill">祝福果 ${user.blessings}</span>
          <button class="ghost-button" type="button" data-action="logout">切換帳號</button>
        </div>
      </header>
    `;
  }

  function renderView(user) {
    if (ui.view === "tasks") {
      return renderTasks(user);
    }

    if (ui.view === "world") {
      return renderWorld(user);
    }

    return renderFarm(user);
  }

  function renderFarm(user) {
    return `
      <section class="farm-layout">
        <div class="side-stack">
          ${renderFarmProfile(user)}
          ${renderTreePalette()}
          ${renderSelectedPanel(user)}
        </div>
        <section class="farm-board" aria-label="${escapeAttribute(user.farmName)}">
          <div class="board-top">
            <div>
              <h2>${escapeHtml(user.farmName)}</h2>
              <div class="plot-meta">${plantedCount(user)} / ${PLOT_COUNT} 塊土地已種植</div>
            </div>
            <button class="ghost-button" type="button" data-action="change-view" data-view="tasks">取得肥料</button>
          </div>
          <div class="plot-grid">
            ${user.farm.plots.map((plot) => renderPlot(plot)).join("")}
          </div>
        </section>
      </section>
    `;
  }

  function renderFarmProfile(user) {
    return `
      <section class="panel">
        <div class="panel-header">
          <h2>農場狀態</h2>
          <span class="pill">${todayLabel()}</span>
        </div>
        <div class="metrics">
          <div class="metric">
            <strong>${matureCount(user)}</strong>
            <span>成熟樹</span>
          </div>
          <div class="metric">
            <strong>${completionCountToday(user)}</strong>
            <span>今日任務</span>
          </div>
          <div class="metric">
            <strong>${user.fertilizer}</strong>
            <span>可用肥料</span>
          </div>
          <div class="metric">
            <strong>${user.blessings}</strong>
            <span>祝福果</span>
          </div>
        </div>
        ${user.intention ? `<p class="intention">${escapeHtml(user.intention)}</p>` : ""}
      </section>
    `;
  }

  function renderTreePalette() {
    return `
      <section class="panel">
        <div class="panel-header">
          <h2>樹苗</h2>
          <span class="pill">${treeTypes[ui.selectedTreeId].shortName}</span>
        </div>
        <div class="tree-palette">
          ${Object.values(treeTypes)
            .map(
              (tree) => `
                <button
                  class="seed-button ${ui.selectedTreeId === tree.id ? "is-active" : ""}"
                  type="button"
                  data-action="select-tree"
                  data-tree-id="${tree.id}"
                  title="${escapeAttribute(tree.name)}"
                  style="--seed-color: ${tree.accent}"
                >
                  <span class="seed-dot" aria-hidden="true"></span>
                  <span>${escapeHtml(tree.shortName)}</span>
                </button>
              `,
            )
            .join("")}
        </div>
      </section>
    `;
  }

  function renderSelectedPanel(user) {
    const plot = getSelectedPlot(user);
    if (!plot || !plot.treeId) {
      return `
        <section class="panel selected-panel">
          <div class="panel-header">
            <h2>照料</h2>
            <span class="pill">${treeTypes[ui.selectedTreeId].name}</span>
          </div>
          <div class="empty-state">
            <strong>選取樹苗後，可在空地種下。</strong>
          </div>
        </section>
      `;
    }

    const tree = treeTypes[plot.treeId];
    const isMature = plot.stage >= MAX_STAGE;
    return `
      <section class="panel selected-panel">
        <div class="panel-header">
          <h2>照料</h2>
          <span class="pill">${escapeHtml(stageNames[plot.stage])}</span>
        </div>
        <div class="selected-tree-card">
          ${renderTreeArt(plot.treeId, plot.stage)}
          <div>
            <strong>${escapeHtml(tree.name)}</strong>
            <div class="stage-label">${escapeHtml(tree.mood)}，已施肥 ${plot.fedCount} 次</div>
            ${renderStageDots(plot.stage)}
          </div>
        </div>
        <button class="plot-action" type="button" data-action="feed-plot" data-plot-id="${plot.id}" ${isMature ? "disabled" : ""}>
          ${isMature ? "已長成祝福樹" : "施肥成長"}
        </button>
      </section>
    `;
  }

  function renderPlot(plot) {
    const selectedClass = ui.selectedPlotId === plot.id ? "is-selected" : "";
    if (!plot.treeId) {
      return `
        <button class="plot is-empty ${selectedClass}" type="button" data-action="select-plot" data-plot-id="${plot.id}" aria-label="空地">
          <span class="empty-soil" aria-hidden="true"></span>
          <span class="plot-title">
            <strong>空地</strong>
            <span class="plot-meta">${treeTypes[ui.selectedTreeId].shortName}</span>
          </span>
        </button>
      `;
    }

    const tree = treeTypes[plot.treeId];
    return `
      <button class="plot has-tree ${selectedClass}" type="button" data-action="select-plot" data-plot-id="${plot.id}" aria-label="${escapeAttribute(tree.name)} ${escapeAttribute(stageNames[plot.stage])}">
        ${renderTreeArt(plot.treeId, plot.stage)}
        <span class="plot-title">
          <strong>${escapeHtml(tree.shortName)}</strong>
          <span class="plot-meta">${escapeHtml(stageNames[plot.stage])}</span>
        </span>
      </button>
    `;
  }

  function renderTasks(user) {
    const todayDone = completionCountToday(user);
    return `
      <section class="task-layout">
        <div class="task-grid">
          ${taskList.map((task) => renderTaskCard(user, task)).join("")}
        </div>
        <aside class="panel task-summary">
          <div class="panel-header">
            <h2>今日任務</h2>
            <span class="pill">${todayDone} / ${taskList.length}</span>
          </div>
          <div class="metrics">
            <div class="metric">
              <strong>${user.fertilizer}</strong>
              <span>肥料庫存</span>
            </div>
            <div class="metric">
              <strong>${taskList.length - todayDone}</strong>
              <span>尚未完成</span>
            </div>
          </div>
          <div class="task-log">
            ${renderTaskLog(user)}
          </div>
        </aside>
      </section>
    `;
  }

  function renderTaskCard(user, task) {
    const done = isTaskDoneToday(user, task.id);
    return `
      <article class="task-card ${done ? "is-done" : ""}">
        <div>
          <h3>${escapeHtml(task.title)}</h3>
          <div class="task-meta">
            <span class="pill">+${task.reward} 肥料</span>
            <span class="pill">${escapeHtml(task.rewardName)}</span>
          </div>
        </div>
        <p>${escapeHtml(task.body)}</p>
        ${done ? renderDoneTask(user, task) : renderTaskControl(task)}
      </article>
    `;
  }

  function renderDoneTask(user, task) {
    const record = getTodayRecords(user)[task.id];
    return `
      <div class="timer-box">
        <div class="timer-readout">已完成 ${formatClock(record.completedAt)}</div>
        <button class="ghost-button" type="button" data-action="change-view" data-view="farm">回農場施肥</button>
      </div>
    `;
  }

  function renderTaskControl(task) {
    if (task.kind === "timer") {
      const active = ui.timer && ui.timer.taskId === task.id;
      const progress = active ? Math.round(((task.seconds - ui.timer.remaining) / task.seconds) * 100) : 0;
      return `
        <div class="timer-box">
          <div class="timer-readout" data-timer-readout="${task.id}">${active ? `${ui.timer.remaining} 秒` : `${task.seconds} 秒`}</div>
          <div class="progress" aria-hidden="true">
            <span data-timer-progress="${task.id}" style="--progress: ${progress}%"></span>
          </div>
          <button class="primary-button" type="button" data-action="start-timer" data-task-id="${task.id}" ${ui.timer && !active ? "disabled" : ""}>
            ${active ? "進行中" : "開始"}
          </button>
        </div>
      `;
    }

    if (task.kind === "reflection") {
      return `
        <form class="task-form" data-task-form data-task-id="${task.id}">
          <textarea name="reflection" minlength="${task.minChars}" maxlength="400" placeholder="${escapeAttribute(task.placeholder || "")}"></textarea>
          <button class="primary-button" type="submit">完成任務</button>
        </form>
      `;
    }

    return `
      <div class="task-form">
        <label class="check-row">
          <input type="checkbox" data-confirm-task="${task.id}" />
          <span>${escapeHtml(task.confirm || "我已完成")}</span>
        </label>
        <button class="primary-button" type="button" data-action="complete-check" data-task-id="${task.id}">領取肥料</button>
      </div>
    `;
  }

  function renderTaskLog(user) {
    if (!user.taskLog.length) {
      return `<div class="empty-state">今天完成任務後，紀錄會出現在這裡。</div>`;
    }

    return user.taskLog
      .slice(0, 6)
      .map((item) => {
        const task = taskList.find((entry) => entry.id === item.taskId);
        const title = task ? task.title : "任務";
        return `
          <div class="log-item">
            <strong>${escapeHtml(title)}</strong><br />
            <span>${formatDateTime(item.completedAt)}</span>
          </div>
        `;
      })
      .join("");
  }

  function renderWorld(currentUser) {
    const visitUser = getVisitUser(currentUser);
    return `
      <section class="world-layout">
        <div class="community-list">
          ${state.users.map((user) => renderCommunityCard(user, visitUser && visitUser.id === user.id)).join("")}
        </div>
        ${visitUser ? renderVisitPanel(visitUser, currentUser.id === visitUser.id) : ""}
      </section>
    `;
  }

  function renderCommunityCard(user, active) {
    return `
      <button class="community-card ${active ? "is-active" : ""}" type="button" data-action="visit-user" data-user-id="${user.id}">
        <span class="avatar" aria-hidden="true">${getInitial(user.username)}</span>
        <span class="community-meta">
          <strong>${escapeHtml(user.farmName)}</strong>
          <span>${escapeHtml(user.username)} · ${matureCount(user)} 棵成熟 · ${completionCountToday(user)} 項今日任務</span>
          ${renderMiniFarm(user)}
        </span>
      </button>
    `;
  }

  function renderMiniFarm(user) {
    return `
      <span class="mini-farm" aria-hidden="true">
        ${user.farm.plots
          .map((plot) =>
            plot.treeId
              ? `<span class="mini-plot">${renderTreeArt(plot.treeId, plot.stage, "mini-tree")}</span>`
              : `<span class="mini-plot is-empty"></span>`,
          )
          .join("")}
      </span>
    `;
  }

  function renderVisitPanel(user, isSelf) {
    return `
      <aside class="visit-panel">
        <div class="panel-header">
          <h2>${escapeHtml(user.farmName)}</h2>
          <span class="pill">${isSelf ? "我的農場" : "拜訪中"}</span>
        </div>
        <div class="metrics">
          <div class="metric">
            <strong>${plantedCount(user)}</strong>
            <span>已種植</span>
          </div>
          <div class="metric">
            <strong>${matureCount(user)}</strong>
            <span>成熟樹</span>
          </div>
        </div>
        ${user.intention ? `<p class="visit-note">${escapeHtml(user.intention)}</p>` : ""}
        <div class="visit-grid">
          ${user.farm.plots
            .map(
              (plot) => `
                <div class="visit-plot">
                  ${plot.treeId ? renderTreeArt(plot.treeId, plot.stage) : `<span class="empty-soil" aria-hidden="true"></span>`}
                </div>
              `,
            )
            .join("")}
        </div>
      </aside>
    `;
  }

  function renderTreeArt(treeId, stage, extraClass) {
    const tree = treeTypes[treeId] || treeTypes.olive;
    const safeStage = clamp(Number(stage || 0), 0, MAX_STAGE);
    const className = extraClass ? `tree-art ${extraClass}` : "tree-art";

    if (safeStage === 0) {
      return `
        <svg class="${className}" viewBox="0 0 120 120" role="img" aria-label="${escapeAttribute(tree.name)}種子">
          <ellipse cx="60" cy="88" rx="38" ry="15" fill="#8a634d" opacity="0.8"></ellipse>
          <path d="M58 82 C46 68 49 51 62 42 C76 56 75 72 58 82Z" fill="${tree.accent}"></path>
          <path d="M62 42 C62 58 60 70 58 82" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.55"></path>
        </svg>
      `;
    }

    const canopy = [0, 19, 28, 36, 43][safeStage];
    const trunkHeight = [0, 28, 40, 50, 58][safeStage];
    const trunkWidth = [0, 11, 14, 17, 19][safeStage];
    const y = 88 - trunkHeight;
    const accentOpacity = safeStage >= 3 ? 0.92 : 0.5;

    return `
      <svg class="${className}" viewBox="0 0 120 120" role="img" aria-label="${escapeAttribute(tree.name)}${escapeAttribute(stageNames[safeStage])}">
        <ellipse cx="60" cy="94" rx="38" ry="13" fill="#8a634d" opacity="0.3"></ellipse>
        <rect x="${60 - trunkWidth / 2}" y="${y}" width="${trunkWidth}" height="${trunkHeight}" rx="7" fill="#8a634d"></rect>
        <path d="M60 ${y + 12} C48 ${y + 2} 38 ${y - 10} 31 ${y - 24}" fill="none" stroke="#8a634d" stroke-width="${Math.max(3, trunkWidth / 3)}" stroke-linecap="round"></path>
        <path d="M60 ${y + 10} C72 ${y - 2} 82 ${y - 12} 90 ${y - 28}" fill="none" stroke="#8a634d" stroke-width="${Math.max(3, trunkWidth / 3)}" stroke-linecap="round"></path>
        <circle cx="60" cy="${y - 22}" r="${canopy}" fill="${tree.leaf}"></circle>
        <circle cx="${60 - canopy * 0.72}" cy="${y - 14}" r="${canopy * 0.62}" fill="${tree.leaf}" opacity="0.9"></circle>
        <circle cx="${60 + canopy * 0.72}" cy="${y - 15}" r="${canopy * 0.64}" fill="${tree.leaf}" opacity="0.88"></circle>
        <circle cx="${60 - canopy * 0.2}" cy="${y - 43}" r="${canopy * 0.56}" fill="${tree.leaf}" opacity="0.96"></circle>
        <circle cx="${60 + canopy * 0.38}" cy="${y - 31}" r="${Math.max(4, canopy * 0.18)}" fill="${tree.accent}" opacity="${accentOpacity}"></circle>
        <circle cx="${60 - canopy * 0.5}" cy="${y - 27}" r="${Math.max(3, canopy * 0.14)}" fill="${tree.accent}" opacity="${accentOpacity}"></circle>
        <circle cx="${60 + canopy * 0.08}" cy="${y - 53}" r="${Math.max(3, canopy * 0.13)}" fill="${tree.accent}" opacity="${safeStage === MAX_STAGE ? 0.95 : 0}"></circle>
      </svg>
    `;
  }

  function renderStageDots(stage) {
    return `
      <div class="stage-dots" aria-label="成長階段 ${stage + 1}">
        ${Array.from({ length: MAX_STAGE + 1 }, (_, index) => `<span class="${index <= stage ? "is-on" : ""}"></span>`).join("")}
      </div>
    `;
  }

  function renderBrandIcon() {
    return `
      <svg width="34" height="34" viewBox="0 0 64 64" aria-hidden="true">
        <path d="M31 56V28" stroke="currentColor" stroke-width="6" stroke-linecap="round"></path>
        <path d="M31 35C19 33 11 25 10 12C23 13 31 21 31 35Z" fill="currentColor" opacity="0.78"></path>
        <path d="M33 31C45 30 53 22 54 10C41 11 33 19 33 31Z" fill="currentColor"></path>
        <path d="M13 54H51" stroke="currentColor" stroke-width="6" stroke-linecap="round" opacity="0.7"></path>
      </svg>
    `;
  }

  function handleClick(event) {
    const trigger = event.target.closest("[data-action]");
    if (!trigger || !app.contains(trigger)) {
      return;
    }

    const action = trigger.dataset.action;
    if (action === "auth-mode") {
      ui.authMode = trigger.dataset.mode || "register";
      render();
      return;
    }

    if (action === "logout") {
      clearActiveTimer();
      state.currentUserId = null;
      saveState();
      ui.view = "farm";
      render();
      return;
    }

    if (action === "change-view") {
      ui.view = trigger.dataset.view || "farm";
      render();
      return;
    }

    if (action === "select-tree") {
      ui.selectedTreeId = trigger.dataset.treeId || "olive";
      render();
      return;
    }

    if (action === "select-plot") {
      selectPlot(trigger.dataset.plotId);
      return;
    }

    if (action === "feed-plot") {
      feedPlot(trigger.dataset.plotId);
      return;
    }

    if (action === "start-timer") {
      startTimer(trigger.dataset.taskId);
      return;
    }

    if (action === "complete-check") {
      completeCheckTask(trigger.dataset.taskId);
      return;
    }

    if (action === "visit-user") {
      ui.selectedVisitUserId = trigger.dataset.userId;
      render();
    }
  }

  function handleSubmit(event) {
    const authForm = event.target.closest("[data-auth-form]");
    if (authForm) {
      event.preventDefault();
      submitAuth(authForm);
      return;
    }

    const taskForm = event.target.closest("[data-task-form]");
    if (taskForm) {
      event.preventDefault();
      submitReflectionTask(taskForm);
    }
  }

  function submitAuth(form) {
    const mode = form.dataset.authForm;
    const data = new FormData(form);
    const username = String(data.get("username") || "").trim();
    const password = String(data.get("password") || "");

    if (!username || !password) {
      showToast("請填寫帳號與密碼。");
      return;
    }

    if (mode === "login") {
      const found = state.users.find((user) => normalizeName(user.username) === normalizeName(username));
      if (!found || found.password !== password) {
        showToast("帳號或密碼不正確。");
        return;
      }

      state.currentUserId = found.id;
      saveState();
      ui.view = "farm";
      ui.selectedPlotId = null;
      render();
      showToast(`歡迎回來，${found.username}。`);
      return;
    }

    const exists = state.users.some((user) => normalizeName(user.username) === normalizeName(username));
    const farmName = String(data.get("farmName") || "").trim();
    const intention = String(data.get("intention") || "").trim();

    if (username.length < 2) {
      showToast("玩家名稱至少需要 2 個字。");
      return;
    }

    if (exists) {
      showToast("這個玩家名稱已經被使用。");
      return;
    }

    if (password.length < 4) {
      showToast("密碼至少需要 4 個字。");
      return;
    }

    if (!farmName) {
      showToast("請為農場取一個名字。");
      return;
    }

    const user = createUser({
      username,
      password,
      farmName,
      intention,
      fertilizer: 1,
      blessings: 0,
      plots: [],
    });
    state.users.push(user);
    state.currentUserId = user.id;
    saveState();
    ui.view = "farm";
    ui.selectedPlotId = null;
    render();
    showToast("農場建立好了，已送你 1 份新手肥料。");
  }

  function selectPlot(plotId) {
    const user = getCurrentUser();
    if (!user) {
      return;
    }

    const plot = user.farm.plots.find((item) => item.id === plotId);
    if (!plot) {
      return;
    }

    ui.selectedPlotId = plot.id;
    if (!plot.treeId) {
      plantTree(user, plot, ui.selectedTreeId);
      saveState();
      render();
      showToast(`${treeTypes[ui.selectedTreeId].name} 種下了。`);
      return;
    }

    render();
  }

  function plantTree(user, plot, treeId) {
    const now = new Date().toISOString();
    plot.treeId = treeId;
    plot.stage = 0;
    plot.plantedAt = now;
    plot.updatedAt = now;
    plot.fedCount = 0;
    user.updatedAt = now;
  }

  function feedPlot(plotId) {
    const user = getCurrentUser();
    if (!user) {
      return;
    }

    const plot = user.farm.plots.find((item) => item.id === plotId);
    if (!plot || !plot.treeId) {
      showToast("請先選一棵樹。");
      return;
    }

    if (plot.stage >= MAX_STAGE) {
      showToast("這棵樹已經長成祝福樹。");
      return;
    }

    if (user.fertilizer <= 0) {
      ui.view = "tasks";
      render();
      showToast("先完成任務取得肥料。");
      return;
    }

    user.fertilizer -= 1;
    plot.stage += 1;
    plot.fedCount += 1;
    plot.updatedAt = new Date().toISOString();
    user.updatedAt = plot.updatedAt;

    if (plot.stage === MAX_STAGE) {
      user.blessings += 1;
      showAfterRender("長成祝福樹了，獲得 1 顆祝福果。");
    } else {
      showAfterRender(`${treeTypes[plot.treeId].shortName} 長到「${stageNames[plot.stage]}」。`);
    }

    saveState();
    render();
  }

  function startTimer(taskId) {
    const user = getCurrentUser();
    const task = taskList.find((entry) => entry.id === taskId);
    if (!user || !task || task.kind !== "timer") {
      return;
    }

    if (isTaskDoneToday(user, taskId)) {
      showToast("今天已完成這項任務。");
      return;
    }

    if (ui.timer) {
      showToast("已有任務正在進行。");
      return;
    }

    ui.timer = {
      taskId,
      remaining: task.seconds,
      total: task.seconds,
    };
    render();
    updateTimerElements();

    ui.timerId = window.setInterval(() => {
      if (!ui.timer) {
        clearActiveTimer();
        return;
      }

      ui.timer.remaining -= 1;
      updateTimerElements();

      if (ui.timer.remaining <= 0) {
        const finishedTaskId = ui.timer.taskId;
        clearActiveTimer();
        completeTask(finishedTaskId, { note: "timer" });
        render();
        showToast("任務完成，肥料 +1。");
      }
    }, 1000);
  }

  function updateTimerElements() {
    if (!ui.timer) {
      return;
    }

    const readout = app.querySelector(`[data-timer-readout="${ui.timer.taskId}"]`);
    const progress = app.querySelector(`[data-timer-progress="${ui.timer.taskId}"]`);
    const completed = Math.max(0, ui.timer.total - ui.timer.remaining);
    const percent = Math.round((completed / ui.timer.total) * 100);

    if (readout) {
      readout.textContent = `${Math.max(0, ui.timer.remaining)} 秒`;
    }

    if (progress) {
      progress.style.setProperty("--progress", `${percent}%`);
    }
  }

  function clearActiveTimer() {
    if (ui.timerId) {
      window.clearInterval(ui.timerId);
    }
    ui.timer = null;
    ui.timerId = null;
  }

  function submitReflectionTask(form) {
    const user = getCurrentUser();
    const taskId = form.dataset.taskId;
    const task = taskList.find((entry) => entry.id === taskId);
    const text = String(new FormData(form).get("reflection") || "").trim();

    if (!user || !task || task.kind !== "reflection") {
      return;
    }

    if (isTaskDoneToday(user, taskId)) {
      showToast("今天已完成這項任務。");
      return;
    }

    if (text.length < task.minChars) {
      showToast(`再多寫一點，至少 ${task.minChars} 個字。`);
      return;
    }

    completeTask(taskId, { note: text });
    render();
    showToast("任務完成，肥料 +1。");
  }

  function completeCheckTask(taskId) {
    const user = getCurrentUser();
    const task = taskList.find((entry) => entry.id === taskId);
    const checkbox = app.querySelector(`[data-confirm-task="${taskId}"]`);

    if (!user || !task || task.kind !== "check") {
      return;
    }

    if (isTaskDoneToday(user, taskId)) {
      showToast("今天已完成這項任務。");
      return;
    }

    if (!checkbox || !checkbox.checked) {
      showToast("請先勾選完成確認。");
      return;
    }

    completeTask(taskId, { note: "checked" });
    render();
    showToast("任務完成，肥料 +1。");
  }

  function completeTask(taskId, detail) {
    const user = getCurrentUser();
    const task = taskList.find((entry) => entry.id === taskId);
    if (!user || !task || isTaskDoneToday(user, taskId)) {
      return false;
    }

    const now = new Date().toISOString();
    const date = todayKey();
    user.tasksByDate[date] = user.tasksByDate[date] || {};
    user.tasksByDate[date][taskId] = {
      completedAt: now,
      note: detail && detail.note ? detail.note : "",
      rewardName: task.rewardName,
    };
    user.fertilizer += task.reward;
    user.updatedAt = now;
    user.taskLog.unshift({
      taskId,
      completedAt: now,
      reward: task.reward,
    });
    user.taskLog = user.taskLog.slice(0, 18);
    saveState();
    return true;
  }

  function showAfterRender(message) {
    window.setTimeout(() => showToast(message), 0);
  }

  function showToast(message) {
    const toast = app.querySelector(".toast");
    if (!toast) {
      return;
    }

    window.clearTimeout(ui.toastId);
    toast.textContent = message;
    toast.classList.add("is-visible");
    ui.toastId = window.setTimeout(() => {
      toast.classList.remove("is-visible");
    }, 2600);
  }

  function getCurrentUser() {
    return state.users.find((user) => user.id === state.currentUserId) || null;
  }

  function getSelectedPlot(user) {
    if (!ui.selectedPlotId) {
      return null;
    }
    return user.farm.plots.find((plot) => plot.id === ui.selectedPlotId) || null;
  }

  function getVisitUser(currentUser) {
    let selected = state.users.find((user) => user.id === ui.selectedVisitUserId);
    if (!selected) {
      selected = state.users.find((user) => user.id !== currentUser.id) || currentUser;
      ui.selectedVisitUserId = selected.id;
    }
    return selected;
  }

  function getTodayRecords(user) {
    return user.tasksByDate[todayKey()] || {};
  }

  function isTaskDoneToday(user, taskId) {
    return Boolean(getTodayRecords(user)[taskId]);
  }

  function completionCountToday(user) {
    return Object.keys(getTodayRecords(user)).length;
  }

  function plantedCount(user) {
    return user.farm.plots.filter((plot) => plot.treeId).length;
  }

  function matureCount(user) {
    return user.farm.plots.filter((plot) => plot.treeId && plot.stage >= MAX_STAGE).length;
  }

  function todayKey() {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }

  function todayLabel() {
    return new Intl.DateTimeFormat("zh-Hant", {
      month: "short",
      day: "numeric",
      weekday: "short",
    }).format(new Date());
  }

  function formatClock(iso) {
    return new Intl.DateTimeFormat("zh-Hant", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  }

  function formatDateTime(iso) {
    return new Intl.DateTimeFormat("zh-Hant", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  }

  function daysAgoIso(days) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString();
  }

  function makeId(prefix) {
    const cryptoApi = window.crypto || window.msCrypto;
    if (cryptoApi && cryptoApi.randomUUID) {
      return `${prefix}-${cryptoApi.randomUUID()}`;
    }
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function normalizeName(value) {
    return String(value || "").trim().toLowerCase();
  }

  function getInitial(value) {
    return escapeHtml(String(value || "F").trim().slice(0, 1).toUpperCase() || "F");
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

  function escapeAttribute(value) {
    return escapeHtml(value);
  }
})();
