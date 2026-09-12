export const VERSION = 1;
export const STORAGE_KEY = "self-covenant.v1";
export const freshState = () => ({ version: VERSION, contracts: [] });
const DAY = 86400000;
const formatterCache = new Map();
export function clockParts(
  now = new Date(),
  zone = Intl.DateTimeFormat().resolvedOptions().timeZone,
) {
  if (!formatterCache.has(zone))
    formatterCache.set(
      zone,
      new Intl.DateTimeFormat("en-CA", {
        timeZone: zone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
      }),
    );
  const p = Object.fromEntries(
    formatterCache
      .get(zone)
      .formatToParts(now)
      .map((x) => [x.type, x.value]),
  );
  return {
    date: `${p.year}-${p.month}-${p.day}`,
    time: `${p.hour}:${p.minute}:${p.second}`,
    minute: `${p.hour}:${p.minute}`,
  };
}
export function addDays(date, n) {
  return new Date(Date.parse(date + "T00:00:00Z") + n * DAY)
    .toISOString()
    .slice(0, 10);
}
export function dayDiff(a, b) {
  return Math.round(
    (Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / DAY,
  );
}
export const activeContract = (state) =>
  state.contracts.find((c) => c.status === "active" || c.status === "achieved");
export function streakEnding(c, date) {
  const dates = new Set(c.checkins.map((x) => x.date));
  let count = 0;
  while (dates.has(date)) {
    count++;
    date = addDays(date, -1);
  }
  return count;
}
export function attempts(c) {
  const groups = [];
  for (const log of c.checkins) {
    const previous = groups.at(-1);
    if (previous && addDays(previous.end, 1) === log.date) {
      previous.end = log.date;
      previous.count++;
    } else groups.push({ start: log.date, end: log.date, count: 1 });
  }
  return groups;
}
export function statusOf(c, now = new Date()) {
  const p = clockParts(now, c.timeZone);
  const todayLog = c.checkins.find((x) => x.date === p.date);
  const previous = c.checkins.at(-1);
  if (c.status !== "active")
    return {
      kind: c.status,
      count:
        c.status === "ended"
          ? previous
            ? streakEnding(c, previous.date)
            : 0
          : c.days,
      ...p,
    };
  if (p.date < c.startDate) return { kind: "scheduled", count: 0, ...p };
  if (todayLog)
    return { kind: "done", count: streakEnding(c, p.date), todayLog, ...p };
  const count = streakEnding(c, addDays(p.date, -1));
  if (p.time >= c.deadline + ":00")
    return {
      kind: "missed",
      count: 0,
      previousCount: count,
      nextDate: addDays(p.date, 1),
      ...p,
    };
  return {
    kind: "pending",
    count,
    restarted: p.date > c.startDate && count === 0,
    ...p,
  };
}
export function createContract(
  values,
  now = new Date(),
  timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone,
) {
  const reward = String(values.reward || "").trim();
  const goal = String(values.goal || "").trim();
  const days = Number(values.days);
  const deadline = String(values.deadline || "");
  if (!reward || reward.length > 60)
    throw new Error("请填写 1–60 字的奖励名称。");
  if (!goal || goal.length > 200)
    throw new Error("请填写 1–200 字的目标说明。");
  if (!Number.isInteger(days) || days < 1 || days > 365)
    throw new Error("连续天数需要是 1–365 之间的整数。");
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(deadline) || deadline === "00:00")
    throw new Error("请选择 00:01–23:59 之间的每日截止时间。");
  const p = clockParts(now, timeZone);
  return {
    id: globalThis.crypto.randomUUID(),
    reward,
    goal,
    days,
    deadline,
    timeZone,
    createdAt: now.toISOString(),
    startDate: p.time >= deadline + ":00" ? addDays(p.date, 1) : p.date,
    status: "active",
    checkins: [],
  };
}
export function checkIn(c, now = new Date()) {
  const status = statusOf(c, now);
  if (status.kind !== "pending")
    throw new Error(
      status.kind === "missed"
        ? "已过今日截止时间，本轮进度已归零。"
        : "当前不能打卡，请查看最新状态。",
    );
  const updated = structuredClone(c);
  updated.checkins.push({ date: status.date, at: now.toISOString() });
  if (streakEnding(updated, status.date) >= c.days) {
    updated.status = "achieved";
    updated.achievedAt = now.toISOString();
  }
  return updated;
}
const validDate = (x) =>
  typeof x === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(x) &&
  Number.isFinite(Date.parse(x)) &&
  new Date(x + "T00:00:00Z").toISOString().slice(0, 10) === x;
const timestamp = (x) =>
  typeof x === "string" &&
  Number.isFinite(Date.parse(x)) &&
  new Date(x).toISOString() === x;
function assert(ok, message = "备份内容不完整或格式不正确。") {
  if (!ok) throw new Error(message);
}
export function validateState(raw, now = new Date()) {
  assert(
    raw && typeof raw === "object" && raw.version === VERSION,
    "备份版本不兼容，请使用本应用导出的备份。",
  );
  assert(Array.isArray(raw.contracts) && raw.contracts.length <= 1000);
  const ids = new Set();
  let open = 0;
  const contracts = raw.contracts.map((c) => {
    assert(
      c &&
        typeof c === "object" &&
        typeof c.id === "string" &&
        c.id.length > 0 &&
        c.id.length <= 100 &&
        !ids.has(c.id),
    );
    ids.add(c.id);
    assert(
      typeof c.reward === "string" &&
        c.reward.trim().length > 0 &&
        c.reward.length <= 60,
    );
    assert(
      typeof c.goal === "string" &&
        c.goal.trim().length > 0 &&
        c.goal.length <= 200,
    );
    assert(Number.isInteger(c.days) && c.days >= 1 && c.days <= 365);
    assert(
      typeof c.deadline === "string" &&
        /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(c.deadline) &&
        c.deadline !== "00:00",
    );
    assert(typeof c.timeZone === "string" && c.timeZone.length < 100);
    let p;
    try {
      p = clockParts(now, c.timeZone);
    } catch {
      throw new Error("备份包含无法识别的时区。");
    }
    assert(
      timestamp(c.createdAt) && Date.parse(c.createdAt) <= now.getTime(),
      "备份含未来时间，请检查设备日期。",
    );
    assert(validDate(c.startDate));
    const created = clockParts(new Date(c.createdAt), c.timeZone);
    assert(
      c.startDate ===
        (created.time >= c.deadline + ":00"
          ? addDays(created.date, 1)
          : created.date),
    );
    assert(["active", "achieved", "redeemed", "ended"].includes(c.status));
    if (c.status === "active" || c.status === "achieved") open++;
    assert(Array.isArray(c.checkins) && c.checkins.length <= 50000);
    let last = "";
    const checkins = c.checkins.map((log) => {
      assert(
        log &&
          validDate(log.date) &&
          log.date > last &&
          log.date >= c.startDate &&
          log.date <= p.date,
      );
      assert(
        timestamp(log.at) &&
          Date.parse(log.at) >= Date.parse(c.createdAt) &&
          Date.parse(log.at) <= now.getTime(),
      );
      const moment = clockParts(new Date(log.at), c.timeZone);
      assert(
        moment.date === log.date && moment.time < c.deadline + ":00",
        "备份含超过截止时间的打卡。",
      );
      last = log.date;
      return { date: log.date, at: log.at };
    });
    const clean = {
      id: c.id,
      reward: c.reward,
      goal: c.goal,
      days: c.days,
      deadline: c.deadline,
      timeZone: c.timeZone,
      createdAt: c.createdAt,
      startDate: c.startDate,
      status: c.status,
      checkins,
    };
    const groups = attempts(clean);
    const achieved = c.status === "achieved" || c.status === "redeemed";
    assert(
      groups.every(
        (g, i) =>
          g.count < c.days ||
          (achieved && i === groups.length - 1 && g.count === c.days),
      ),
    );
    if (achieved) {
      assert(
        groups.at(-1)?.count === c.days && c.achievedAt === checkins.at(-1)?.at,
      );
      clean.achievedAt = c.achievedAt;
    }
    if (c.status === "redeemed" || c.status === "ended") {
      assert(
        timestamp(c.closedAt) &&
          Date.parse(c.closedAt) <= now.getTime() &&
          Date.parse(c.closedAt) >=
            Date.parse(checkins.at(-1)?.at || c.createdAt),
      );
      clean.closedAt = c.closedAt;
    }
    return clean;
  });
  assert(open <= 1, "备份包含多个进行中的契约，无法导入。");
  return { version: VERSION, contracts };
}
