import {
  STORAGE_KEY,
  freshState,
  activeContract,
  clockParts,
  addDays,
  dayDiff,
  attempts,
  statusOf,
  createContract,
  checkIn,
  validateState,
} from "./core.mjs";
const $ = (s) => document.querySelector(s);
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const dateText = (date) =>
  date ? `${Number(date.slice(5, 7))} 月 ${Number(date.slice(8, 10))} 日` : "—";
const fullDate = (date) =>
  date ? `${date.slice(0, 4)} 年 ${dateText(date)}` : "—";
const icon = (name) =>
  `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${{ arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>', check: '<path d="m5 12 4 4L19 6"/>', clock: '<circle cx="12" cy="13" r="8"/><path d="M12 8v5l3 2M5 3 2 6m17-3 3 3"/>', gift: '<path d="M4 10h16v11H4zM3 6h18v4H3zM12 6v15"/><path d="M12 6C5 6 5 0 9 2c2 1 3 4 3 4Zm0 0c7 0 7-6 3-4-2 1-3 4-3 4Z"/>', back: '<path d="M19 12H5m5-5-5 5 5 5"/>' }[name]}</svg>`;
let state = freshState(),
  storageError = "",
  rawBackup = "",
  draft = {},
  preview = null,
  busy = false,
  noticeTimer,
  lastSignature = "",
  confirmationAction;
function readState() {
  const text = localStorage.getItem(STORAGE_KEY);
  return text ? validateState(JSON.parse(text)) : freshState();
}
try {
  state = readState();
} catch (e) {
  storageError =
    "无法读取本机记录。原始数据没有被覆盖，请先导出原始记录，或选择有效备份恢复。";
  try {
    rawBackup = localStorage.getItem(STORAGE_KEY) || "";
  } catch {
    storageError = "浏览器不允许访问本机存储，请检查浏览器设置后重试。";
  }
}
function notify(text) {
  clearTimeout(noticeTimer);
  $("#notice").textContent = text;
  $("#notice").classList.add("visible");
  noticeTimer = setTimeout(
    () => $("#notice").classList.remove("visible"),
    4500,
  );
}
function route() {
  return location.hash.slice(1) || "home";
}
function go(target) {
  if (route() === target) render(true);
  else location.hash = target;
}
function save(next) {
  const clean = validateState(next);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
  } catch {
    throw new Error(
      "未能保存，可能是浏览器存储受限或空间不足。请腾出空间后重试。",
    );
  }
  state = clean;
  storageError = "";
  rawBackup = "";
}
async function change(mutator, success) {
  if (busy) return;
  busy = true;
  try {
    const work = () => {
      if (storageError) throw new Error(storageError);
      const fresh = readState();
      const next = mutator(fresh);
      save(next);
    };
    if (navigator.locks) await navigator.locks.request(STORAGE_KEY, work);
    else work();
    render();
    if (success) notify(success);
    $("#main")?.classList.add("receipt-arrived");
  } catch (e) {
    render();
    notify(e.message);
  } finally {
    busy = false;
  }
}
function currentHeader(title, description = "") {
  return `<div class="page-heading"><h1 tabindex="-1">${title}</h1>${description ? `<p>${description}</p>` : ""}</div>`;
}
function primary(action, text, disabled = false) {
  return `<button class="primary" data-action="${action}" ${disabled ? "disabled" : ""}>${text}${!disabled ? icon("arrow") : ""}</button>`;
}
function recoveryView() {
  return `${currentHeader("记录暂时无法读取")}<p class="error-message" role="alert">${esc(storageError)}</p><div class="action-stack">${rawBackup ? primary("export-raw", "导出原始记录") : ""}<button class="secondary" data-action="import">从备份恢复</button><button class="text-button" data-action="reload">重新读取</button></div>`;
}
function emptyView() {
  return `<section class="welcome"><h1 tabindex="-1">为想要的生活，<br>立下一份约定。</h1><p class="intro">选一个值得期待的奖励，<br>用连续的行动，兑现给自己。</p><div class="empty-contract"><div><span class="term-label">你想要的奖励</span><span class="empty-line">由你决定</span></div><div><span class="term-label">你愿意坚持的目标</span><span class="empty-line">从一件事开始</span></div></div><p class="pledge">一次一个目标，每天限时打卡。<br>连续达成，奖励解锁；中断一天，从头开始。</p>${primary("new", "创建第一份契约")}<button class="text-button restore-link" data-action="import">已有记录？导入备份</button></section>`;
}
function progressDial(count, total, completed = false) {
  const ticks = Array.from(
    { length: 60 },
    (_, i) =>
      `<line x1="150" y1="${i % 5 === 0 ? 28 : 30}" x2="150" y2="${i % 5 === 0 ? 40 : 36}" transform="rotate(${i * 6} 150 150)" class="${i % 5 === 0 ? "major-tick" : "minor-tick"}"/>`,
  ).join("");
  return `<section class="progress-dial" role="progressbar" aria-label="连续完成天数" aria-valuenow="${count}" aria-valuemin="0" aria-valuemax="${total}"><svg viewBox="0 0 300 300" aria-hidden="true"><circle class="dial-track" cx="150" cy="150" r="138"/><circle class="dial-arc" cx="150" cy="150" r="138" pathLength="100" stroke-dasharray="${(100 * count) / total} 100" transform="rotate(-90 150 150)"/>${ticks}</svg><div class="dial-readout"><span>${completed ? "约定已全部履行" : "已连续完成"}</span><div class="dial-number ${total >= 100 ? "is-long" : ""}"><strong>${count}</strong><span>/ ${total}</span></div><small>天</small></div></section>`;
}
function homeView() {
  const c = activeContract(state);
  if (!c) {
    if (!state.contracts.length) return emptyView();
    return `${currentHeader("下一份约定，留给新的期待。", "过去的努力已保存在记录里。")}<div class="quiet-space"><p>现在没有进行中的契约。<br>准备好后，再为自己选择一个奖励。</p></div>${primary("new", "创建新契约")}<a class="text-link block-link" href="#records">回看履行记录 ${icon("arrow")}</a>`;
  }
  const s = statusOf(c);
  lastSignature = `${c.id}/${s.date}/${s.kind}/${s.count}`;
  const completed = c.status === "achieved";
  let title,
    note,
    action,
    stateClass = "";
  if (completed) {
    title = "契约已完成";
    note = "你履行了约定。现在，可以兑现给自己了。";
    action = primary("redeem", "标记奖励已兑现");
    stateClass = "is-complete";
  } else if (s.kind === "done") {
    title = "今日已完成";
    note = `${clockParts(new Date(s.todayLog.at), c.timeZone).minute} 已记录 · 明天继续`;
    action = primary("", `${icon("check")} 今天的约定已履行`, true);
    stateClass = "is-complete";
  } else if (s.kind === "missed") {
    title = "今日已中断";
    note = `未在 ${c.deadline} 前打卡，进度已归零。${s.previousCount ? `此前连续完成 ${s.previousCount} 天。` : ""}`;
    action = primary("", `${dateText(s.nextDate)}，重新从第 1 天开始`, true);
  } else if (s.kind === "scheduled") {
    title = "等待开始";
    note = `${fullDate(c.startDate)} 开始，首日 ${c.deadline} 前打卡。`;
    action = primary("", "契约将于明天开始", true);
  } else {
    title = "今日待完成";
    note = s.restarted
      ? "新一轮开始。完成今天，就记为第 1 天。"
      : "完成约定后，在截止时间前确认。";
    action = primary("checkin", "确认今日已完成");
  }
  return `<article class="covenant ${stateClass}"><h1 class="instrument-heading" tabindex="-1">${completed ? "约定已达成" : "当前契约"}</h1>${progressDial(s.count, c.days, completed)}<div class="deadline-display"><span>${completed ? "达成日期" : "今日截止"}</span><strong>${completed ? dateText(clockParts(new Date(c.achievedAt), c.timeZone).date) : c.deadline}</strong></div><div class="instrument-status"><span>${title}</span>${!completed ? `<span class="status-date">${dateText(s.date)}</span>` : ""}</div><dl class="instrument-terms"><div><dt>${icon("clock")}<span>目标</span></dt><dd><strong>${esc(c.goal)}</strong><small>每天 ${c.deadline} 前打卡 · 连续 ${c.days} 天</small></dd></div><div><dt>${icon("gift")}<span>${completed ? "已解锁" : "奖励"}</span></dt><dd><strong>${esc(c.reward)}</strong></dd></div></dl><section class="daily-action"><p class="daily-note">${note}</p>${action}<p class="rule-note">${completed ? "兑现后归档，即可开始下一份契约。" : "未按时打卡，连续进度归零。不支持补卡。"}</p></section><a class="text-link contract-history" href="#records">查看履行记录 ${icon("arrow")}</a></article>`;
}
function formView() {
  if (activeContract(state))
    return `${currentHeader("先完成当前约定", "一次只进行一份契约。你可以在设置中结束当前契约。")}<a class="button-link" href="#home">返回当前契约</a>`;
  return `${currentHeader("立下新的约定", "一个奖励，一个目标。条件确定后，按约履行。")}<form id="contract-form" novalidate><div class="field"><label for="reward">完成后，奖励自己什么？</label><input id="reward" name="reward" value="${esc(draft.reward || "")}" maxlength="60" placeholder="例如：一台 iPhone" autocomplete="off" required aria-describedby="reward-error"><p class="field-error" id="reward-error"></p></div><div class="field"><label for="goal">每天要做到什么？</label><textarea id="goal" name="goal" rows="2" maxlength="200" placeholder="例如：早上 7:30 前起床" required aria-describedby="goal-help goal-error">${esc(draft.goal || "")}</textarea><p class="help" id="goal-help">写下可以明确判断是否完成的一件事。</p><p class="field-error" id="goal-error"></p></div><div class="form-pair"><div class="field"><label for="days">连续坚持</label><div class="input-unit"><input id="days" name="days" type="number" min="1" max="365" step="1" inputmode="numeric" value="${esc(draft.days || 30)}" required aria-describedby="days-error"><span>天</span></div><p class="field-error" id="days-error"></p></div><div class="field"><label for="deadline">每日打卡截止</label><input id="deadline" name="deadline" type="time" min="00:01" max="23:59" value="${esc(draft.deadline || "07:30")}" required aria-describedby="deadline-error"><p class="field-error" id="deadline-error"></p></div></div><p class="form-note">每天从 00:00 起可打卡，需早于截止时刻。<br>下一步会展示起始日期和完整规则。</p><button type="submit" class="primary">查看并确认契约 ${icon("arrow")}</button><a class="text-link block-link" href="#home">暂不创建</a></form>`;
}
function previewView() {
  if (!preview) {
    return formView();
  }
  const c = preview;
  return `${currentHeader("确认这份约定", "开始前，再读一遍你为自己定下的条件。")}<div class="confirmation-document"><h2>${esc(c.goal)}</h2><dl class="terms preview-terms"><div><dt>完成奖励</dt><dd>${esc(c.reward)}</dd></div><div><dt>连续天数</dt><dd>${c.days} 天</dd></div><div><dt>每日截止</dt><dd>${c.deadline} 前</dd></div><div><dt>起始日期</dt><dd>${fullDate(c.startDate)}</dd></div><div><dt>固定时区</dt><dd class="zone">${esc(c.timeZone)}</dd></div></dl><ul class="rule-list"><li>中断一天，连续进度归零，次日自动重来。</li><li>不允许补卡；修改条件需结束契约再创建。</li><li>连续完成 ${c.days} 天，才能解锁奖励。</li></ul></div><p class="help before-action">记录仅保存在此浏览器，可在设置中导出备份。</p>${primary("start", "确认并开始契约")}<button class="text-button block-link" data-action="edit-draft">返回修改</button>`;
}
function recordDetail(c) {
  const groups = attempts(c),
    s = statusOf(c);
  const labels = {
    active: "进行中",
    achieved: "奖励已解锁",
    redeemed: "已兑现",
    ended: "已结束",
  };
  const lastLogDate = c.checkins.at(-1)?.date;
  let missedInfo = "";
  if (c.status === "active" && s.date >= c.startDate) {
    const lastEligible = s.kind === "missed" ? s.date : addDays(s.date, -1);
    const from = lastLogDate ? addDays(lastLogDate, 1) : c.startDate;
    if (from <= lastEligible)
      missedInfo = `<p class="gap-note">${dateText(from)}${from !== lastEligible ? " — " + dateText(lastEligible) : ""} 未打卡，连续记录已中断。${s.kind !== "missed" ? "今天可重新开始。" : ""}</p>`;
  }
  return `<article class="record"><div class="record-head"><h2>${esc(c.goal)}</h2><span class="status-label">${labels[c.status]}</span></div><p class="record-reward">奖励：${esc(c.reward)}<span>连续 ${c.days} 天 · 每日 ${c.deadline} 前</span></p>${missedInfo}${
    !groups.length
      ? '<p class="help">还没有打卡记录。第一天完成后，会记在这里。</p>'
      : groups
          .slice()
          .reverse()
          .map((g, reverseIndex) => {
            const i = groups.length - reverseIndex - 1;
            const ongoing =
              i === groups.length - 1 &&
              c.status === "active" &&
              (s.kind === "done" || s.kind === "pending") &&
              s.count > 0;
            const achieved =
              i === groups.length - 1 &&
              ["achieved", "redeemed"].includes(c.status);
            const groupLogs = c.checkins
              .filter((log) => log.date >= g.start && log.date <= g.end)
              .reverse();
            return `<details class="attempt" ${reverseIndex === 0 ? "open" : ""}><summary><span>第 ${i + 1} 次连续记录 <small>${dateText(g.start)}${g.start !== g.end ? " — " + dateText(g.end) : ""}</small></span><span>${g.count} 天 · ${ongoing ? "进行中" : achieved ? "已达成" : "已结束"}</span></summary><ul class="log-list">${groupLogs.map((log) => `<li><span>${fullDate(log.date)}</span><span>${clockParts(new Date(log.at), c.timeZone).minute} ${icon("check")}</span></li>`).join("")}</ul></details>`;
          })
          .join("")
  }</article>`;
}
function recordsView() {
  return `${currentHeader("履行记录", "每一次坚持，都有迹可循。历史天数不计入本轮。")}${state.contracts.length ? state.contracts.slice().reverse().map(recordDetail).join("") : '<div class="quiet-space"><p>还没有记录。<br>创建契约后，这里会保存你的每次履行。</p><a class="text-link" href="#new">创建契约 ' + icon("arrow") + "</a></div>"}`;
}
function settingsView() {
  const c = activeContract(state);
  return `${currentHeader("设置与备份")}<section class="settings-section"><h2>把记录留好</h2><p>记录保存在当前浏览器。清除网站数据、换手机或换浏览器后，需要用备份恢复。</p><div class="setting-actions"><button class="secondary" data-action="export">导出备份 ${icon("arrow")}</button><button class="secondary" data-action="import">导入备份 ${icon("arrow")}</button></div><p class="help">建议每周或完成契约后，存一份到 iPhone「文件」。</p></section><section class="settings-section"><h2>当前约定</h2>${c ? `<dl class="settings-terms"><div><dt>目标</dt><dd>${esc(c.goal)}</dd></div><div><dt>规则时区</dt><dd>${esc(c.timeZone)}</dd></div><div><dt>每日打卡</dt><dd>00:00 至 ${c.deadline} 前</dd></div></dl><p class="help">时区在创建时固定，旅行时也按这个时区判断截止时间。</p>${c.status === "active" ? '<button class="danger-link" data-action="end">结束当前契约</button><p class="help">历史记录保留；更换目标、奖励或时间需重新创建。</p>' : '<a class="text-link" href="#home">奖励已解锁，返回兑现</a>'}` : "<p>当前没有进行中的契约。</p>"}</section><section class="settings-section about"><h2>关于自我契约</h2><p>一个奖励，一份约定。每天按时履行，连续完成后兑现。</p><p class="help">打卡表示你确认已经完成目标。应用按设备时间记录，不验证现实中的行为。</p><span class="version">版本 1.0 · 本机保存</span></section>`;
}
function render(focus = false) {
  const r = route();
  const content = storageError
    ? recoveryView()
    : r === "new"
      ? formView()
      : r === "preview"
        ? previewView()
        : r === "records"
          ? recordsView()
          : r === "settings"
            ? settingsView()
            : homeView();
  $("#app").innerHTML = `<main id="main">${content}</main>`;
  document.querySelectorAll(".header nav a").forEach((a) => {
    const active =
      a.hash === "#" + (["new", "preview"].includes(r) ? "home" : r);
    if (active) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  if (focus) {
    window.scrollTo(0, 0);
    $("#main h1")?.focus({ preventScroll: true });
  }
}
function askConfirm(title, body, actionText, fn, dangerous = false) {
  const dialog = $("#confirm-dialog");
  confirmationAction = fn;
  dialog.innerHTML = `<h2 id="dialog-title">${esc(title)}</h2><p>${esc(body)}</p><div class="dialog-actions"><button class="secondary" data-action="cancel-dialog" autofocus>取消</button><button class="primary ${dangerous ? "danger" : ""}" data-action="confirm-dialog">${esc(actionText)}</button></div>`;
  dialog.showModal();
}
function download(text, filename) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
const actions = {
  new: () => {
    draft = {};
    preview = null;
    go("new");
  },
  "edit-draft": () => go("new"),
  start: () => {
    if (!preview) return;
    const nowPreview = createContract(draft);
    if (nowPreview.startDate !== preview.startDate) {
      preview = nowPreview;
      render();
      notify("已跨过截止时间，起始日期已更新，请重新确认。");
      return;
    }
    change((fresh) => {
      if (activeContract(fresh))
        throw new Error("已有一份进行中的契约，请先完成或结束它。");
      fresh.contracts.push(nowPreview);
      return fresh;
    }, "契约已开始。按约履行，从今天的行动开始。").then(() => {
      if (activeContract(state)) {
        draft = {};
        preview = null;
        go("home");
      }
    });
  },
  checkin: () => {
    const id = activeContract(state)?.id;
    change((fresh) => {
      const c = activeContract(fresh);
      if (!c || c.id !== id) throw new Error("契约已变化，请查看最新状态。");
      fresh.contracts[fresh.contracts.indexOf(c)] = checkIn(c);
      return fresh;
    }, "今日履行已保存。");
  },
  redeem: () => {
    const id = activeContract(state)?.id;
    askConfirm(
      "奖励已经兑现了吗？",
      "确认后，本次契约会归档。你可以开始下一份约定。",
      "确认已兑现",
      () =>
        change((fresh) => {
          const c = activeContract(fresh);
          if (!c || c.id !== id || c.status !== "achieved")
            throw new Error("契约状态已变化，请重新查看。");
          c.status = "redeemed";
          c.closedAt = new Date().toISOString();
          return fresh;
        }, "奖励已兑现，契约已归档。"),
    );
  },
  end: () => {
    const id = activeContract(state)?.id;
    askConfirm(
      "结束当前契约？",
      "本轮进度将结束，奖励不会解锁。历史记录保留，之后可以重新创建契约。",
      "结束契约",
      () =>
        change((fresh) => {
          const c = activeContract(fresh);
          if (!c || c.id !== id || c.status !== "active")
            throw new Error("契约状态已变化，请重新查看。");
          c.status = "ended";
          c.closedAt = new Date().toISOString();
          return fresh;
        }, "契约已结束，历史记录已保留。"),
      true,
    );
  },
  export: () => {
    try {
      const fresh = readState();
      download(
        JSON.stringify(
          { ...fresh, exportedAt: new Date().toISOString() },
          null,
          2,
        ),
        `自我契约-备份-${clockParts().date}.json`,
      );
      notify("备份已生成，请在下载项或「文件」中保存。");
    } catch (e) {
      notify(e.message);
    }
  },
  "export-raw": () => download(rawBackup, "自我契约-原始记录.json"),
  import: () => {
    $("#import-file").value = "";
    $("#import-file").click();
  },
  reload: () => location.reload(),
  "cancel-dialog": () => {
    $("#confirm-dialog").close();
    confirmationAction = null;
  },
  "confirm-dialog": () => {
    const fn = confirmationAction;
    confirmationAction = null;
    $("#confirm-dialog").close();
    fn?.();
  },
};
document.addEventListener("click", (e) => {
  const button = e.target.closest("[data-action]");
  if (button && !button.disabled) actions[button.dataset.action]?.();
});
document.addEventListener("input", (e) => {
  if (e.target.form?.id !== "contract-form") return;
  draft = Object.fromEntries(new FormData(e.target.form));
  const error = document.getElementById(e.target.id + "-error");
  if (error) {
    error.textContent = "";
    e.target.removeAttribute("aria-invalid");
  }
});
document.addEventListener("submit", (e) => {
  if (e.target.id !== "contract-form") return;
  e.preventDefault();
  draft = Object.fromEntries(new FormData(e.target));
  const problems = {
    reward: !draft.reward.trim() ? "请填写想要的奖励。" : "",
    goal: !draft.goal.trim() ? "请写清每天要完成的目标。" : "",
    days:
      !/^\d+$/.test(draft.days) ||
      Number(draft.days) < 1 ||
      Number(draft.days) > 365
        ? "请输入 1–365 之间的整数。"
        : "",
    deadline:
      !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(draft.deadline) ||
      draft.deadline === "00:00"
        ? "请选择 00:01–23:59 之间的时间。"
        : "",
  };
  for (const [key, msg] of Object.entries(problems)) {
    $("#" + key + "-error").textContent = msg;
    $("#" + key).setAttribute("aria-invalid", msg ? "true" : "false");
  }
  const invalid = Object.keys(problems).find((key) => problems[key]);
  if (invalid) {
    $("#" + invalid).focus();
    return;
  }
  try {
    preview = createContract(draft);
    go("preview");
  } catch (error) {
    notify(error.message);
  }
});
$("#import-file").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    if (file.size > 5 * 1024 * 1024) throw new Error("备份文件不能超过 5 MB。");
    let raw;
    try {
      raw = JSON.parse(await file.text());
    } catch {
      throw new Error("无法读取这个文件，请选择应用导出的 JSON 备份。");
    }
    const next = validateState(raw);
    const open = activeContract(next);
    askConfirm(
      "用这份备份恢复？",
      `包含 ${next.contracts.length} 份契约${open ? "，当前目标为“" + open.goal + "”" : ""}。恢复会替换此浏览器的全部记录，漏打卡仍按当前时间核算。建议先导出当前备份。`,
      "替换并恢复",
      () => {
        try {
          save(next);
          draft = {};
          preview = null;
          go("home");
          render(true);
          notify("备份已恢复。");
        } catch (error) {
          notify(error.message);
        }
      },
      true,
    );
  } catch (error) {
    notify(error.message);
  }
});
window.addEventListener("hashchange", () => render(true));
window.addEventListener("storage", (e) => {
  if (e.key === STORAGE_KEY || e.key === null) {
    try {
      state = readState();
      storageError = "";
      render();
      notify("记录已与本浏览器的其他页面更新。");
    } catch {
      storageError = "记录无法读取，请先导出原始记录或使用有效备份恢复。";
      rawBackup = e.newValue || "";
      render();
    }
  }
});
function reconcile() {
  if (document.hidden || storageError || !["home", ""].includes(route()))
    return;
  try {
    const c = activeContract(state);
    if (!c) return;
    const s = statusOf(c);
    const signature = `${c.id}/${s.date}/${s.kind}/${s.count}`;
    if (signature !== lastSignature) render();
  } catch {
    /* Actions report storage errors without interrupting reading. */
  }
}
document.addEventListener("visibilitychange", reconcile);
window.addEventListener("focus", reconcile);
setInterval(reconcile, 1000);
render();
