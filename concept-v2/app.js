(function () {
  "use strict";

  const summitMerit = 550000;
  const app = document.getElementById("alApp");

  const trees = {
    health: {
      key: "health",
      name: "健康樹樹",
      fertilizer: "健康數數",
      task: "乾坤棒",
      color: "#3ead64",
      light: "#a6ef83",
      al: "GE 確認身體任務回饋，OP 控制每日節奏。",
    },
    wisdom: {
      key: "wisdom",
      name: "智慧樹樹",
      fertilizer: "智慧數數",
      task: "靈修",
      color: "#4f85dc",
      light: "#a7d9ff",
      al: "GPT5.5 強化敘事，GE 檢查反思品質。",
    },
    wealth: {
      key: "wealth",
      name: "財富樹樹",
      fertilizer: "財富數數",
      task: "點香",
      color: "#e6aa31",
      light: "#ffe48a",
      al: "OP 管獎勵邏輯，GPT5.5 讓儀式感更清楚。",
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

  const state = {
    view: "oasis",
    selectedTree: "health",
    resources: {
      health: 8,
      wisdom: 6,
      wealth: 4,
      merit: 186000,
    },
    treeStages: {
      health: 3,
      wisdom: 2,
      wealth: 1,
    },
    completedTasks: {
      health: false,
      wisdom: false,
      wealth: false,
    },
    players: [
      { id: "self", name: "阿光", merit: 186000, color: "#ff8a4f" },
      { id: "yun", name: "雲青", merit: 548000, color: "#68c96b" },
      { id: "mei", name: "小梅", merit: 455000, color: "#e06db3" },
      { id: "lin", name: "林山", merit: 320000, color: "#5eb2df" },
      { id: "po", name: "伯仁", merit: 92000, color: "#b681e8" },
    ],
  };

  let toastTimer = null;

  app.addEventListener("click", handleClick);
  app.addEventListener("submit", (event) => event.preventDefault());
  render();

  function render() {
    app.innerHTML = `
      <div class="app">
        <div class="shell">
          ${renderHud()}
          <main class="stage">${renderView()}</main>
        </div>
        <div class="toast" aria-live="polite"></div>
      </div>
    `;
  }

  function renderHud() {
    const nav = [
      ["oasis", "綠洲", icon("leaf")],
      ["tasks", "任務", icon("scroll")],
      ["mountain", "聖山", icon("mountain")],
      ["leaderboard", "排行", icon("rank")],
      ["gm", "GM", icon("star")],
    ];

    return `
      <header class="hud">
        <section class="brand">
          <span class="brand-mark">${icon("al")}</span>
          <div>
            <strong>AL 精緻版</strong>
            <span>OP + GE + GPT5.5</span>
          </div>
        </section>
        <nav class="nav" aria-label="遊戲區塊">
          ${nav
            .map(
              ([key, label, svg]) => `
                <button class="nav-button ${state.view === key ? "is-active" : ""}" type="button" data-action="view" data-view="${key}">
                  ${svg}
                  <span>${label}</span>
                </button>
              `,
            )
            .join("")}
        </nav>
        <section class="resource-bar" aria-label="資源">
          ${resource("health", state.resources.health)}
          ${resource("wisdom", state.resources.wisdom)}
          ${resource("wealth", state.resources.wealth)}
          ${resource("merit", compact(state.resources.merit))}
        </section>
      </header>
    `;
  }

  function renderView() {
    if (state.view === "tasks") return renderTasks();
    if (state.view === "mountain") return renderMountain();
    if (state.view === "leaderboard") return renderLeaderboard();
    if (state.view === "gm") return renderGm();
    return renderOasis();
  }

  function renderOasis() {
    const tree = trees[state.selectedTree];
    return `
      <section class="scene oasis">
        <div class="scene-content">
          <aside class="panel">
            <div class="panel-head">
              <h2>AL 設計指揮</h2>
              <span class="tag">v2</span>
            </div>
            <div class="agent-row">
              ${agentChip("OP", "規則與流程", "控制施肥、任務、GM 權限")}
              ${agentChip("GE", "成長平衡", "檢查任務與資源對應")}
              ${agentChip("GPT5.5", "美術敘事", "統一綠洲與聖山世界觀")}
            </div>
          </aside>

          <section class="hero-tree-area" aria-label="綠洲種樹主畫面">
            ${treeArt(tree.key, "hero-tree", Math.max(4, state.treeStages[tree.key]))}
            <div class="tree-selector">
              ${Object.values(trees).map(renderTreeOption).join("")}
            </div>
          </section>

          <aside class="panel">
            <div class="panel-head">
              <h2>${tree.name}</h2>
              <span class="tag">第 ${state.treeStages[tree.key]} 階</span>
            </div>
            <div class="metric-grid">
              ${metric(tree.key, state.resources[tree.key], tree.fertilizer)}
              ${metric("merit", compact(state.resources.merit), "公德數數")}
            </div>
            <p>${tree.al}</p>
            <div class="action-stack">
              <button class="action-button" type="button" data-action="feed">${icon("spark")}對應施肥</button>
              <button class="action-button secondary" type="button" data-action="view" data-view="tasks">${icon("scroll")}取得肥料</button>
            </div>
          </aside>
        </div>
      </section>
    `;
  }

  function renderTreeOption(tree) {
    return `
      <button class="tree-option ${state.selectedTree === tree.key ? "is-active" : ""}" type="button" data-action="tree" data-tree="${tree.key}">
        ${treeArt(tree.key, "tree-icon", 2)}
        <span>
          <strong>${tree.name}</strong>
          <span>${tree.task} 產出 ${tree.fertilizer}</span>
        </span>
      </button>
    `;
  }

  function renderTasks() {
    return `
      <section class="scene tasks">
        <div class="scene-content two-col task-layout">
          <section class="task-grid">
            ${tasks.map(renderTaskCard).join("")}
          </section>
          <aside class="panel">
            <div class="panel-head">
              <h2>今日任務節奏</h2>
              <span class="tag">${tasks.filter((task) => state.completedTasks[task.key]).length} / 3</span>
            </div>
            <div class="metric-grid">
              ${tasks.map((task) => metric(task.key, state.completedTasks[task.key] ? "+1" : "0", task.reward)).join("")}
            </div>
            <p>AL 建議任務先保持三條清楚線：身體、心智、財富。玩家每天完成任務後才有對應數數，避免資源混用。</p>
          </aside>
        </div>
      </section>
    `;
  }

  function renderTaskCard(task) {
    const done = state.completedTasks[task.key];
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

  function renderMountain() {
    const ranked = rankedPlayers();
    const self = state.players.find((player) => player.id === "self");
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
              ${metric("merit", compact(self.merit), "我的公德數數")}
              ${metric("wisdom", `${Math.floor(progress(self.merit) * 100)}%`, "目前山路比例")}
            </div>
            <div class="leader-list">
              ${ranked.slice(0, 4).map((player, index) => leaderRow(player, index)).join("")}
            </div>
          </aside>
        </div>
      </section>
    `;
  }

  function renderLeaderboard() {
    const ranked = rankedPlayers();
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
                .map((player) => {
                  const rank = ranked.indexOf(player) + 1;
                  const className = rank === 1 ? "first" : rank === 2 ? "second" : "third";
                  return `
                    <div class="podium ${className}">
                      ${character(player.color, "avatar")}
                      <strong>#${rank} ${player.name}</strong>
                      <span class="leader-sub">${format(player.merit)} 公德數數</span>
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
              ${ranked.map((player, index) => leaderRow(player, index)).join("")}
            </div>
          </aside>
        </div>
      </section>
    `;
  }

  function renderGm() {
    const ranked = rankedPlayers();
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
                  (player, index) => `
                    <div class="gm-row">
                      <span class="rank">${index + 1}</span>
                      <div>
                        <strong>${player.name}</strong>
                        <span class="leader-sub">${format(player.merit)} · ${Math.floor(progress(player.merit) * 100)}%</span>
                      </div>
                      <input name="${player.id}" type="number" min="0" step="1000" placeholder="公德" />
                      <button class="icon-button" type="button" data-action="grant" data-player="${player.id}">${icon("spark")}發放</button>
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
            <p>GM 發放公德數數後，玩家角色會按照公德數數 / 550000 的比例在聖山路線上前進。</p>
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
    if (action === "view") {
      state.view = trigger.dataset.view || "oasis";
      render();
      return;
    }

    if (action === "tree") {
      state.selectedTree = trigger.dataset.tree || "health";
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

  function feedTree() {
    const key = state.selectedTree;
    if (state.resources[key] <= 0) {
      state.view = "tasks";
      render();
      showToast(`需要 ${trees[key].fertilizer}`);
      return;
    }
    state.resources[key] -= 1;
    state.treeStages[key] = Math.min(5, state.treeStages[key] + 1);
    render();
    showToast(`${trees[key].name} 已吸收 ${trees[key].fertilizer}`);
  }

  function completeTask(key) {
    if (state.completedTasks[key]) {
      showToast("今日已領取");
      return;
    }
    state.completedTasks[key] = true;
    state.resources[key] += 1;
    render();
    showToast(`獲得 ${trees[key].fertilizer}`);
  }

  function grantMerit(trigger) {
    const row = trigger.closest(".gm-row");
    const input = row ? row.querySelector("input") : null;
    const amount = Math.max(0, Number(input && input.value ? input.value : 10000));
    const player = state.players.find((entry) => entry.id === trigger.dataset.player);
    if (!player) return;
    player.merit = Math.min(summitMerit, player.merit + amount);
    if (player.id === "self") state.resources.merit = player.merit;
    render();
    showToast(`${player.name} +${format(amount)} 公德數數`);
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

  function leaderRow(player, index) {
    const percent = Math.round(progress(player.merit) * 100);
    return `
      <div class="leader-row">
        <span class="rank">${index + 1}</span>
        <div>
          <strong>${player.name}</strong>
          <span class="leader-sub">${format(player.merit)} 公德數數</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="--progress: ${percent}%"></div>
        </div>
      </div>
    `;
  }

  function renderClimber(player) {
    const point = routePoint(progress(player.merit));
    return `
      <div class="climber" style="left:${point.x}%; top:${point.y}%">
        ${character(player.color, "")}
        <span class="climber-label">${player.name}</span>
      </div>
    `;
  }

  function rankedPlayers() {
    return state.players.slice().sort((a, b) => b.merit - a.merit);
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

  function showToast(message) {
    const toast = app.querySelector(".toast");
    if (!toast) return;
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("is-visible");
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2200);
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
})();
