import test from "node:test";
import assert from "node:assert/strict";
import {
  createContract,
  checkIn,
  statusOf,
  validateState,
  freshState,
  attempts,
  clockParts,
  addDays,
} from "../public/core.mjs";
const at = (s) => new Date(s);
const created = at("2026-09-01T22:00:00.000Z");
const make = (days = 3) =>
  createContract(
    { reward: "iPhone", goal: "7:30 前起床", days, deadline: "07:30" },
    created,
    "Asia/Shanghai",
  );
test("creation switches to tomorrow exactly at the deadline", () => {
  assert.equal(make().startDate, "2026-09-02");
  const c = createContract(
    { reward: "旅行", goal: "早起", days: 30, deadline: "07:30" },
    at("2026-09-01T23:30:00.000Z"),
    "Asia/Shanghai",
  );
  assert.equal(c.startDate, "2026-09-03");
  assert.equal(statusOf(c, at("2026-09-02T01:00:00.000Z")).kind, "scheduled");
});
test("deadline accepts a last millisecond and rejects exact boundary", () => {
  assert.equal(
    checkIn(make(), at("2026-09-01T23:29:59.999Z")).checkins.length,
    1,
  );
  assert.throws(() => checkIn(make(), at("2026-09-01T23:30:00.000Z")), /截止/);
});
test("same day double click does not increment twice", () => {
  const c = checkIn(make(), created);
  assert.throws(() => checkIn(c, created));
  assert.equal(statusOf(c, created).count, 1);
});
test("one-day goal unlocks immediately and no further checkins are allowed", () => {
  const c = checkIn(make(1), created);
  assert.equal(c.status, "achieved");
  assert.equal(statusOf(c, at("2027-01-01T00:00:00.000Z")).kind, "achieved");
  assert.throws(() => checkIn(c, at("2026-09-02T22:00:00.000Z")));
});
test("a missed day resets immediately, next day starts from 1 and history stays", () => {
  let c = checkIn(make(), created);
  c = checkIn(c, at("2026-09-02T22:00:00.000Z"));
  assert.equal(statusOf(c, at("2026-09-03T23:29:00.000Z")).count, 2);
  const missed = statusOf(c, at("2026-09-03T23:30:00.000Z"));
  assert.equal(missed.count, 0);
  assert.equal(missed.previousCount, 2);
  c = checkIn(c, at("2026-09-04T22:00:00.000Z"));
  assert.equal(statusOf(c, at("2026-09-04T22:01:00.000Z")).count, 1);
  assert.deepEqual(
    attempts(c).map((a) => a.count),
    [2, 1],
  );
});
test("multi-day absence does not accumulate fictitious progress", () => {
  const c = checkIn(make(), created);
  assert.equal(statusOf(c, at("2026-10-01T22:00:00.000Z")).count, 0);
  assert.equal(statusOf(c, at("2026-10-01T22:00:00.000Z")).restarted, true);
});
test("three consecutive days unlock, completed state never resets", () => {
  let c = make();
  for (const time of [
    "2026-09-01T22:00:00.000Z",
    "2026-09-02T22:00:00.000Z",
    "2026-09-03T22:00:00.000Z",
  ])
    c = checkIn(c, at(time));
  assert.equal(c.status, "achieved");
  assert.equal(statusOf(c, at("2026-10-01T22:00:00.000Z")).count, 3);
  assert.doesNotThrow(() =>
    validateState(
      { version: 1, contracts: [c] },
      at("2026-10-01T22:00:00.000Z"),
    ),
  );
});
test("fixed timezone and DST preserve calendar days", () => {
  assert.equal(
    clockParts(at("2026-03-08T07:00:00.000Z"), "America/New_York").minute,
    "03:00",
  );
  assert.equal(
    clockParts(at("2026-03-08T06:59:00.000Z"), "America/New_York").minute,
    "01:59",
  );
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  const c = createContract(
    { reward: "休假", goal: "早起", days: 3, deadline: "07:30" },
    at("2026-03-07T11:00:00.000Z"),
    "America/New_York",
  );
  const first = checkIn(c, at("2026-03-07T11:00:00.000Z"));
  const second = checkIn(first, at("2026-03-08T10:00:00.000Z"));
  assert.equal(statusOf(second, at("2026-03-08T10:00:00.000Z")).count, 2);
});
test("backup roundtrip strips unknown fields without changing records", () => {
  const c = checkIn(make(), created);
  const source = { version: 1, contracts: [c], unknown: "ignored" };
  assert.deepEqual(
    validateState(
      JSON.parse(JSON.stringify(source)),
      at("2026-09-10T00:00:00.000Z"),
    ),
    { version: 1, contracts: [c] },
  );
  assert.deepEqual(validateState(freshState()), freshState());
});
test("rejects malformed, duplicate, future, late and multiple active backup records", () => {
  const now = at("2026-09-10T00:00:00.000Z");
  const c = checkIn(make(), created);
  const wrap = (value) => ({ version: 1, contracts: [value] });
  assert.throws(() => validateState({ version: 9, contracts: [] }));
  assert.throws(() =>
    validateState(
      { version: 1, contracts: [c, { ...make(), id: "other" }] },
      now,
    ),
  );
  assert.throws(() =>
    validateState(
      wrap({ ...c, checkins: [c.checkins[0], c.checkins[0]] }),
      now,
    ),
  );
  assert.throws(() =>
    validateState(
      wrap({
        ...c,
        checkins: [{ date: "2026-09-02", at: "2026-09-02T00:00:00.000Z" }],
      }),
      now,
    ),
  );
  assert.throws(() =>
    validateState(
      wrap({
        ...c,
        checkins: [{ date: "2026-10-01", at: "2026-09-30T22:00:00.000Z" }],
      }),
      now,
    ),
  );
  assert.throws(() =>
    validateState(
      wrap({ ...c, status: "achieved", achievedAt: c.checkins[0].at }),
      now,
    ),
  );
  assert.throws(() =>
    validateState(wrap({ ...c, timeZone: "invalid-zone" }), now),
  );
});
test("reward and goal boundaries, impossible zero-minute daily window", () => {
  assert.throws(() =>
    createContract({ reward: "", goal: "a", days: 1, deadline: "07:30" }),
  );
  assert.throws(() =>
    createContract({ reward: "a", goal: "a", days: 0, deadline: "07:30" }),
  );
  assert.throws(() =>
    createContract({ reward: "a", goal: "a", days: 1.5, deadline: "07:30" }),
  );
  assert.throws(() =>
    createContract({ reward: "a", goal: "a", days: 1, deadline: "00:00" }),
  );
});
