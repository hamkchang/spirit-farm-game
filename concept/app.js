(function () {
  "use strict";

  const summitMerit = 550000;
  const app = document.getElementById("conceptApp");

  const treeTypes = {
    health: {
      key: "health",
      name: "健康樹樹",
      fertilizer: "健康數數",
      color: "#45ad57",
      light: "#98e26f",
      rewardTask: "乾坤棒",
    },
    wisdom: {
      key: "wisdom",
      name: "智慧樹樹",
      fertilizer: "智慧數數",
      color: "#4b7fd5",
      light: "#89cdf7",
      rewardTask: "靈修",
    },
    wealth: {
      key: "wealth",
      name: "財富樹樹",
      fertilizer: "財富數數",
      color: "#e5a928",
      light: "#ffe27b",
      rewardTask: "點香",
    },
  };

  const tasks = [
    {
      key: "wisdom",
      name: "靈修",
      reward: "智慧數數",
      body: "靜心、誦讀、沉澱今日心念。",
      art: "meditation",
    },
    {
      key: "health",
      name: "乾坤棒",
      reward: "健康數數",
      body: "完成一段身體操練，喚醒氣力。",
      art: "staff",
    },
    {
      key: "wealth",
      name: "點香",
      reward: "財富數數",
      body: "點燃祈願，累積豐盛能量。",
      art: "incense",
    },
  ];

  const state = {
    view: "oasis",
    selectedTree: "health",
    resources: {
      health: 8,
      wisdom: 6,
      wealth: 4,
      merit: 186000,
    },
    completedTasks: {
      wisdom: false,
      health: false,
      wealth: false,
    },
    trees: {
      health: 3,
      wisdom: 2,
      wealth: 1,
    },
    players: [
      { id: "self", name: "阿光", merit: 186000, color: "#ff8a4f" },
      { id: "mei", name: "小梅", merit: 455000, color: "#e06db3" },
      { id: "lin", name: "林山", merit: 320000, color: "#5eb2df" },
      { id: "yun", name: "雲青", merit: 548000, color: "#7bcf54" },
      { id: "po", name: "伯仁", merit: 92000, color: "#c28be8" },
    ],
  };

  let toastTimer = null;

  app.addEventListener("click", handleClick);
  app.addEventListener("submit", handleSubmit);
  render();

  function render() {
    app.innerHTML = `
      <div class="game">
        ${renderHud()}
        <main class="screen">
          ${renderScreen()}
        </main>
        <div class="toast" aria-live="polite"></div>
      </div>
    `;
  }

  function renderHud() {
    const navItems = [
      ["oasis", "綠洲", iconOasis()],
      ["tasks", "任務", iconTasks()],
      ["mountain", "聖山", iconMountain()],
      ["leaderboard", "排行", iconRank()],
      ["gm", "GM", iconGm()],
    ];

    return `
      <header class="hud">
        <div class="brand">
          <span class="brand-badge">${iconOasis()}</span>
          <div>
            <strong>綠洲聖山</strong>
            <span>畫面原型</span>
          </div>
        </div>
        <nav class="nav" aria-label="畫面">
          ${navItems
            .map(
              ([key, label, icon]) => `
                <button class="nav-button ${state.view === key ? "is-active" : ""}" type="button" data-action="view" data-view="${key}">
                  <span class="nav-icon">${icon}</span>
                  <span>${label}</span>
                </button>
              `,
            )
            .join("")}
        </nav>
        <div class="resource-bar" aria-label="資源">
          ${renderResource("health", state.resources.health)}
          ${renderResource("wisdom", state.resources.wisdom)}
          ${renderResource("wealth", state.resources.wealth)}
          ${renderResource("merit", compactNumber(state.resources.merit))}
        </div>
      </header>
    `;
  }

  function renderScreen() {
    if (state.view === "tasks") return renderTasks();
    if (state.view === "mountain") return renderMountain();
    if (state.view === "leaderboard") return renderLeaderboard();
    if (state.view === "gm") return renderGm();
    return renderOasis();
  }

  function renderOasis() {
    const selected = treeTypes[state.selectedTree];
    return `
      <section class="oasis-layout">
        <aside class="panel side-panel">
          <div class="panel-title">
            <h2>綠洲狀態</h2>
            <span class="tag">Lv. 12</span>
          </div>
          <div class="status-grid">
            ${renderStatusTile("health", state.trees.health, "健康樹樹")}
            ${renderStatusTile("wisdom", state.trees.wisdom, "智慧樹樹")}
            ${renderStatusTile("wealth", state.trees.wealth, "財富樹樹")}
            ${renderStatusTile("merit", compactNumber(state.resources.merit), "公德數數")}
          </div>
        </aside>

        <section class="oasis-stage" aria-label="綠洲主畫面">
          <span class="cloud one"></span>
          <span class="cloud two"></span>
          <span class="palm a">${palmArt()}</span>
          <span class="palm b">${palmArt()}</span>
          <div class="plot-ring">
            ${treeArt(selected.key, "big-tree", 4)}
          </div>
          <div class="tree-choice-row">
            ${Object.values(treeTypes)
              .map(
                (tree) => `
                  <button class="tree-card ${state.selectedTree === tree.key ? "is-selected" : ""}" type="button" data-action="tree" data-tree="${tree.key}">
                    ${treeArt(tree.key, "tree-icon", 2)}
                    <span>
                      <strong>${tree.name}</strong>
                      <p>${tree.fertilizer} · ${tree.rewardTask}</p>
                    </span>
                  </button>
                `,
              )
              .join("")}
          </div>
        </section>

        <aside class="panel side-panel">
          <div class="panel-title">
            <h2>${selected.name}</h2>
            <span class="tag">${selected.fertilizer}</span>
          </div>
          <div class="action-stack">
            <div class="farm-action">
              ${renderToken(selected.key)}
              <div>
                <strong>可用 ${selected.fertilizer}</strong>
                <span>${state.resources[selected.key]} 包</span>
              </div>
            </div>
            <div class="farm-action">
              ${treeArt(selected.key, "tree-icon", state.trees[selected.key])}
              <div>
                <strong>目前階段</strong>
                <span>第 ${state.trees[selected.key]} 階 / 第 5 階</span>
              </div>
            </div>
            <button class="primary-button" type="button" data-action="feed">對應施肥</button>
            <button class="mini-button secondary" type="button" data-action="view" data-view="tasks">前往每日任務</button>
          </div>
        </aside>
      </section>
    `;
  }

  function renderTasks() {
    return `
      <section class="task-screen">
        <div class="task-board">
          <div class="panel-title">
            <h2>每日任務</h2>
            <span class="tag">${tasks.filter((task) => state.completedTasks[task.key]).length} / ${tasks.length}</span>
          </div>
          <div class="task-grid">
            ${tasks.map(renderTaskCard).join("")}
          </div>
        </div>
        <aside class="panel side-panel">
          <div class="panel-title">
            <h2>今日收成</h2>
            <span class="tag">重置 00:00</span>
          </div>
          <div class="status-grid">
            ${tasks
              .map((task) => {
                const done = state.completedTasks[task.key];
                return renderStatusTile(task.key, done ? "+1" : "0", task.reward);
              })
              .join("")}
          </div>
        </aside>
      </section>
    `;
  }

  function renderTaskCard(task) {
    const done = state.completedTasks[task.key];
    return `
      <article class="task-card">
        <div class="task-scene">
          <div class="scene-art">${taskArt(task.art, task.key)}</div>
        </div>
        <div class="task-copy">
          <h3>${task.name}</h3>
          <p>${task.body}</p>
          <div class="reward-strip">
            ${renderToken(task.key)}
            <strong>${task.reward}</strong>
          </div>
        </div>
        <button class="primary-button" type="button" data-action="task" data-task="${task.key}">
          ${done ? "今日已完成" : "完成領取"}
        </button>
      </article>
    `;
  }

  function renderMountain() {
    const sorted = getRankedPlayers();
    const self = state.players.find((player) => player.id === "self");
    return `
      <section class="mountain-layout">
        <div class="mountain-board" aria-label="聖山">
          ${mountainArt()}
          <span class="summit-flag">${summitFlag()}</span>
          ${sorted.map((player) => renderClimber(player)).join("")}
        </div>
        <aside class="mountain-side">
          <section class="panel side-panel">
            <div class="panel-title">
              <h2>聖山進度</h2>
              <span class="tag">55萬登頂</span>
            </div>
            <div class="mountain-stat">
              <div>
                <strong>${formatNumber(self.merit)}</strong>
                <span>我的公德數數</span>
              </div>
              <div>
                <strong>${Math.floor(progressRatio(self.merit) * 100)}%</strong>
                <span>登山比例</span>
              </div>
            </div>
          </section>
          <section class="panel side-panel">
            <div class="panel-title">
              <h2>山路排行</h2>
              <button class="mini-button secondary" type="button" data-action="view" data-view="leaderboard">查看全部</button>
            </div>
            <div class="leader-list">
              ${sorted.slice(0, 4).map((player, index) => renderLeaderRow(player, index)).join("")}
            </div>
          </section>
        </aside>
      </section>
    `;
  }

  function renderLeaderboard() {
    const ranked = getRankedPlayers();
    const top = [ranked[1], ranked[0], ranked[2]].filter(Boolean);
    return `
      <section class="leaderboard-page">
        <div class="leader-hero">
          <div class="panel-title">
            <h2>聖山登頂排行榜</h2>
            <span class="tag">公德數數</span>
          </div>
          <div class="podium">
            ${top
              .map((player) => {
                const rank = ranked.indexOf(player) + 1;
                const className = rank === 1 ? "first" : rank === 2 ? "second" : "third";
                return `
                  <div class="podium-card ${className}">
                    <div class="podium-avatar">${characterArt(player.color)}</div>
                    <strong>#${rank} ${player.name}</strong>
                    <span class="leader-sub">${formatNumber(player.merit)} / ${formatNumber(summitMerit)}</span>
                  </div>
                `;
              })
              .join("")}
          </div>
          <div class="leader-list">
            ${ranked.map((player, index) => renderLeaderRow(player, index)).join("")}
          </div>
        </div>
        <aside class="panel leader-card">
          <div class="panel-title">
            <h3>登頂規則</h3>
            <span class="tag">比例制</span>
          </div>
          <div class="status-grid">
            ${renderStatusTile("merit", "55萬", "公德數數登頂")}
            ${renderStatusTile("wisdom", "100%", "山頂完成度")}
            ${renderStatusTile("health", "全玩家", "排行榜查詢")}
          </div>
        </aside>
      </section>
    `;
  }

  function renderGm() {
    const ranked = getRankedPlayers();
    return `
      <section class="gm-page">
        <div class="panel gm-card">
          <div class="panel-title">
            <h2>GM 後台</h2>
            <span class="tag">發放公德數數</span>
          </div>
          <form class="gm-controls" data-gm-form>
            <div class="gm-list">
              ${ranked
                .map(
                  (player) => `
                    <div class="gm-row">
                      <span class="leader-rank">${ranked.indexOf(player) + 1}</span>
                      <div>
                        <strong>${player.name}</strong>
                        <div class="leader-sub">${formatNumber(player.merit)} · ${Math.floor(progressRatio(player.merit) * 100)}%</div>
                      </div>
                      <input name="${player.id}" type="number" min="0" step="1000" placeholder="公德" />
                      <button class="mini-button" type="button" data-action="grant" data-player="${player.id}">發放</button>
                    </div>
                  `,
                )
                .join("")}
            </div>
          </form>
        </div>
        <aside class="gm-card">
          <div class="gm-preview">
            ${mountainBadge()}
          </div>
          <p class="gm-note">GM 發放後，玩家角色會依照公德數數 / 550000 的比例顯示在聖山迂迴路線上。</p>
        </aside>
      </section>
    `;
  }

  function renderResource(key, value) {
    const labelMap = {
      health: "健康數數",
      wisdom: "智慧數數",
      wealth: "財富數數",
      merit: "公德數數",
    };
    return `
      <div class="resource">
        ${renderToken(key)}
        <span>
          <strong>${value}</strong>
          <small>${labelMap[key]}</small>
        </span>
      </div>
    `;
  }

  function renderStatusTile(key, value, label) {
    return `
      <div class="status-tile">
        ${key === "merit" ? renderToken("merit") : treeArt(key, "tree-icon", 2)}
        <div>
          <strong>${value}</strong>
          <span>${label}</span>
        </div>
      </div>
    `;
  }

  function renderToken(key) {
    const letterMap = {
      health: "健",
      wisdom: "智",
      wealth: "財",
      merit: "德",
    };
    return `<span class="token ${key}">${letterMap[key]}</span>`;
  }

  function renderLeaderRow(player, index) {
    const percent = Math.min(100, Math.round(progressRatio(player.merit) * 100));
    return `
      <div class="leader-row">
        <span class="leader-rank">${index + 1}</span>
        <div>
          <strong>${player.name}</strong>
          <div class="leader-sub">${formatNumber(player.merit)} 公德數數</div>
        </div>
        <div class="progress-track" aria-label="${percent}%">
          <div class="progress-fill" style="--progress: ${percent}%"></div>
        </div>
      </div>
    `;
  }

  function renderClimber(player) {
    const point = routePoint(progressRatio(player.merit));
    return `
      <div class="climber" style="left:${point.x}%; top:${point.y}%">
        ${characterArt(player.color)}
        <span class="climber-label">${player.name}</span>
      </div>
    `;
  }

  function handleClick(event) {
    const trigger = event.target.closest("[data-action]");
    if (!trigger) return;

    const action = trigger.dataset.action;
    if (action === "view") {
      state.view = trigger.dataset.view;
      render();
      return;
    }

    if (action === "tree") {
      state.selectedTree = trigger.dataset.tree;
      render();
      return;
    }

    if (action === "feed") {
      feedSelectedTree();
      return;
    }

    if (action === "task") {
      completeTask(trigger.dataset.task);
      return;
    }

    if (action === "grant") {
      grantMerit(trigger.dataset.player, trigger.closest(".gm-row"));
    }
  }

  function handleSubmit(event) {
    if (event.target.matches("[data-gm-form]")) {
      event.preventDefault();
    }
  }

  function feedSelectedTree() {
    const key = state.selectedTree;
    if (state.resources[key] <= 0) {
      showToast(`需要 ${treeTypes[key].fertilizer}`);
      state.view = "tasks";
      render();
      return;
    }

    state.resources[key] -= 1;
    state.trees[key] = Math.min(5, state.trees[key] + 1);
    render();
    showToast(`${treeTypes[key].name} 已施肥`);
  }

  function completeTask(key) {
    if (state.completedTasks[key]) {
      showToast("今日已完成");
      return;
    }

    state.completedTasks[key] = true;
    state.resources[key] += 1;
    render();
    showToast(`獲得 ${treeTypes[key].fertilizer}`);
  }

  function grantMerit(playerId, row) {
    const input = row ? row.querySelector("input") : null;
    const amount = Math.max(0, Number(input && input.value ? input.value : 10000));
    const player = state.players.find((entry) => entry.id === playerId);
    if (!player) return;

    player.merit = Math.min(summitMerit, player.merit + amount);
    if (player.id === "self") {
      state.resources.merit = player.merit;
    }
    render();
    showToast(`${player.name} +${formatNumber(amount)} 公德數數`);
  }

  function showToast(message) {
    const toast = app.querySelector(".toast");
    if (!toast) return;
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("is-visible");
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 1900);
  }

  function getRankedPlayers() {
    return state.players.slice().sort((a, b) => b.merit - a.merit);
  }

  function progressRatio(merit) {
    return Math.max(0, Math.min(1, merit / summitMerit));
  }

  function routePoint(ratio) {
    const points = [
      [13, 88],
      [82, 81],
      [23, 72],
      [75, 64],
      [30, 55],
      [70, 47],
      [35, 39],
      [64, 31],
      [45, 23],
      [51, 13],
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

  function formatNumber(value) {
    return new Intl.NumberFormat("zh-Hant").format(value);
  }

  function compactNumber(value) {
    if (typeof value !== "number") return value;
    if (value >= 10000) return `${Math.round(value / 10000)}萬`;
    return String(value);
  }

  function treeArt(key, className, stage) {
    const tree = treeTypes[key] || treeTypes.health;
    const size = Math.max(1, Math.min(5, stage || 1));
    const canopy = 18 + size * 7;
    const trunkHeight = 34 + size * 7;
    const y = 112 - trunkHeight;
    return `
      <svg class="${className}" viewBox="0 0 150 150" role="img" aria-label="${tree.name}">
        <ellipse cx="75" cy="127" rx="48" ry="14" fill="#6b4a25" opacity=".23"></ellipse>
        <rect x="65" y="${y}" width="20" height="${trunkHeight}" rx="10" fill="#8a572c"></rect>
        <path d="M75 ${y + 18} C55 ${y + 4} 43 ${y - 15} 35 ${y - 31}" fill="none" stroke="#8a572c" stroke-width="8" stroke-linecap="round"></path>
        <path d="M78 ${y + 16} C96 ${y + 2} 108 ${y - 16} 116 ${y - 33}" fill="none" stroke="#8a572c" stroke-width="8" stroke-linecap="round"></path>
        <circle cx="75" cy="${y - 24}" r="${canopy}" fill="${tree.color}"></circle>
        <circle cx="${75 - canopy * 0.78}" cy="${y - 12}" r="${canopy * 0.7}" fill="${tree.color}" opacity=".94"></circle>
        <circle cx="${75 + canopy * 0.78}" cy="${y - 14}" r="${canopy * 0.7}" fill="${tree.color}" opacity=".92"></circle>
        <circle cx="${75 - canopy * 0.18}" cy="${y - 54}" r="${canopy * 0.6}" fill="${tree.color}" opacity=".98"></circle>
        <circle cx="${75 + canopy * 0.3}" cy="${y - 36}" r="${Math.max(8, canopy * 0.2)}" fill="${tree.light}"></circle>
        <circle cx="${75 - canopy * 0.45}" cy="${y - 30}" r="${Math.max(7, canopy * 0.16)}" fill="${tree.light}" opacity=".92"></circle>
      </svg>
    `;
  }

  function taskArt(type, key) {
    const color = treeTypes[key].color;
    if (type === "meditation") {
      return `
        <svg viewBox="0 0 220 150" width="100%" height="100%">
          <circle cx="110" cy="38" r="23" fill="#ffd59e"></circle>
          <path d="M88 86 C95 58 126 58 133 86 L141 119 H79Z" fill="${color}"></path>
          <path d="M65 118 C89 92 131 92 155 118" fill="none" stroke="#87582c" stroke-width="13" stroke-linecap="round"></path>
          <path d="M54 58 C75 35 94 25 111 18 C127 25 147 36 166 58" fill="none" stroke="#fff8c9" stroke-width="7" stroke-linecap="round"></path>
        </svg>
      `;
    }
    if (type === "staff") {
      return `
        <svg viewBox="0 0 220 150" width="100%" height="100%">
          <rect x="103" y="28" width="14" height="100" rx="7" fill="#8a572c" transform="rotate(-32 110 78)"></rect>
          <circle cx="86" cy="51" r="25" fill="#ffd59e"></circle>
          <path d="M73 80 C89 62 116 65 128 91 L137 123 H69Z" fill="${color}"></path>
          <path d="M46 111 C77 92 143 92 174 111" fill="none" stroke="#87582c" stroke-width="12" stroke-linecap="round"></path>
        </svg>
      `;
    }
    return `
      <svg viewBox="0 0 220 150" width="100%" height="100%">
        <rect x="101" y="68" width="18" height="54" rx="9" fill="#8a572c"></rect>
        <path d="M110 64 C88 43 100 25 113 14 C125 31 135 48 110 64Z" fill="#ff7f4b"></path>
        <path d="M113 60 C104 45 109 34 116 28" fill="none" stroke="#ffd35b" stroke-width="5" stroke-linecap="round"></path>
        <ellipse cx="110" cy="126" rx="48" ry="13" fill="#87582c" opacity=".24"></ellipse>
        <path d="M76 88 C58 69 59 45 72 28" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round" opacity=".5"></path>
        <path d="M146 88 C164 69 163 45 150 28" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round" opacity=".5"></path>
      </svg>
    `;
  }

  function palmArt() {
    return `
      <svg viewBox="0 0 110 150">
        <path d="M52 136 C56 102 54 70 47 40" fill="none" stroke="#9a642c" stroke-width="16" stroke-linecap="round"></path>
        <path d="M54 42 C23 26 13 12 7 2 C37 6 52 17 62 42Z" fill="currentColor"></path>
        <path d="M58 40 C74 14 91 8 107 4 C100 33 80 43 58 40Z" fill="currentColor"></path>
        <path d="M55 46 C31 53 19 66 8 85 C38 82 53 68 55 46Z" fill="currentColor"></path>
        <path d="M57 45 C82 52 96 66 104 86 C76 81 60 67 57 45Z" fill="currentColor"></path>
      </svg>
    `;
  }

  function mountainArt() {
    return `
      <svg class="mountain-svg" viewBox="0 0 1000 760" preserveAspectRatio="none" aria-hidden="true">
        <path d="M-20 760 L260 250 L360 390 L520 120 L670 410 L780 270 L1020 760Z" fill="#7b8b96"></path>
        <path d="M520 120 L435 300 L525 245 L608 310Z" fill="#ffffff" opacity=".96"></path>
        <path d="M260 250 L190 380 L275 335 L340 410Z" fill="#f7fbff" opacity=".88"></path>
        <path d="M780 270 L715 400 L787 356 L850 420Z" fill="#f7fbff" opacity=".88"></path>
        <path d="M-20 760 L210 520 L390 610 L560 490 L750 595 L1020 480 L1020 760Z" fill="#62aa51"></path>
        <path class="route" d="M130 670 C320 646 650 660 820 614 C610 572 322 568 226 526 C360 486 648 490 750 443 C605 405 348 414 300 370 C440 334 650 340 700 296 C585 266 420 270 350 230 C430 202 574 198 640 154 C580 130 525 108 510 80"></path>
        <path class="route-inner" d="M130 670 C320 646 650 660 820 614 C610 572 322 568 226 526 C360 486 648 490 750 443 C605 405 348 414 300 370 C440 334 650 340 700 296 C585 266 420 270 350 230 C430 202 574 198 640 154 C580 130 525 108 510 80"></path>
      </svg>
    `;
  }

  function summitFlag() {
    return `
      <svg viewBox="0 0 90 100">
        <path d="M38 92V12" stroke="#6b4524" stroke-width="9" stroke-linecap="round"></path>
        <path d="M42 14H80L67 34L80 55H42Z" fill="#ff6753" stroke="#7b3d2d" stroke-width="5" stroke-linejoin="round"></path>
        <circle cx="38" cy="14" r="8" fill="#ffd65d" stroke="#7b3d2d" stroke-width="4"></circle>
      </svg>
    `;
  }

  function characterArt(color) {
    return `
      <svg viewBox="0 0 80 100" role="img" aria-label="角色">
        <ellipse cx="40" cy="92" rx="24" ry="7" fill="#6b4a25" opacity=".24"></ellipse>
        <circle cx="40" cy="25" r="18" fill="#ffd59e" stroke="#7b4e28" stroke-width="4"></circle>
        <path d="M18 72 C20 46 60 46 62 72 L66 90 H14Z" fill="${color}" stroke="#7b4e28" stroke-width="5" stroke-linejoin="round"></path>
        <path d="M26 22 C32 7 54 9 58 24 C48 18 38 18 26 22Z" fill="#654025"></path>
        <circle cx="34" cy="27" r="3" fill="#3c2d20"></circle>
        <circle cx="47" cy="27" r="3" fill="#3c2d20"></circle>
        <path d="M31 38 C36 43 45 43 50 38" fill="none" stroke="#8e4a32" stroke-width="3" stroke-linecap="round"></path>
      </svg>
    `;
  }

  function mountainBadge() {
    return `
      <svg viewBox="0 0 300 300" width="260" height="260" role="img" aria-label="聖山徽章">
        <circle cx="150" cy="150" r="130" fill="#fff1bd" stroke="#7b4e28" stroke-width="10"></circle>
        <path d="M48 226 L112 112 L136 150 L172 72 L208 150 L232 116 L254 226Z" fill="#80929c" stroke="#6d4a30" stroke-width="7" stroke-linejoin="round"></path>
        <path d="M172 72 L150 122 L176 106 L198 128Z" fill="#fff"></path>
        <path d="M82 218 C120 188 190 188 224 218" fill="none" stroke="#d0883d" stroke-width="14" stroke-linecap="round"></path>
        <path d="M145 232V95" stroke="#6b4524" stroke-width="8" stroke-linecap="round"></path>
        <path d="M150 96H213L196 124L214 153H150Z" fill="#ff6753" stroke="#7b3d2d" stroke-width="5" stroke-linejoin="round"></path>
      </svg>
    `;
  }

  function iconOasis() {
    return `
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <circle cx="20" cy="25" r="12" fill="#42b7d8"></circle>
        <path d="M9 28 C15 35 26 35 33 28 C28 38 13 38 9 28Z" fill="#45ad57"></path>
        <path d="M20 27V10" stroke="#8a572c" stroke-width="4" stroke-linecap="round"></path>
        <path d="M21 13 C10 9 7 5 5 2 C16 3 21 7 21 13Z" fill="#3f963d"></path>
        <path d="M22 13 C28 5 34 3 38 2 C35 12 28 15 22 13Z" fill="#3f963d"></path>
      </svg>
    `;
  }

  function iconTasks() {
    return `
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <rect x="8" y="7" width="24" height="28" rx="6" fill="#fff8d9" stroke="#6b4524" stroke-width="4"></rect>
        <path d="M14 17H27M14 25H25" stroke="#6b4524" stroke-width="4" stroke-linecap="round"></path>
        <path d="M16 9H24" stroke="#ffbf4e" stroke-width="7" stroke-linecap="round"></path>
      </svg>
    `;
  }

  function iconMountain() {
    return `
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <path d="M4 33 L15 12 L20 21 L26 7 L36 33Z" fill="#80929c" stroke="#6b4524" stroke-width="3" stroke-linejoin="round"></path>
        <path d="M26 7 L22 17 L27 14 L31 18Z" fill="#fff"></path>
      </svg>
    `;
  }

  function iconRank() {
    return `
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <rect x="6" y="20" width="8" height="14" rx="3" fill="#e5a928"></rect>
        <rect x="16" y="10" width="8" height="24" rx="3" fill="#ffdb72"></rect>
        <rect x="26" y="16" width="8" height="18" rx="3" fill="#d0883d"></rect>
      </svg>
    `;
  }

  function iconGm() {
    return `
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <path d="M20 5 L24 16 L36 16 L26 23 L30 35 L20 28 L10 35 L14 23 L4 16 L16 16Z" fill="#b16de0" stroke="#6b4524" stroke-width="3" stroke-linejoin="round"></path>
      </svg>
    `;
  }
})();
