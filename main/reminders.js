const Store = require("electron-store");
const { randomUUID } = require("crypto");

const store = new Store({ name: "reminders" });

function parseTime(hours, minutes) {
  const h = Number(hours);
  const m = Number(minutes);
  if (!Number.isInteger(h) || h < 0 || h > 23) return null;
  if (!Number.isInteger(m) || m < 0 || m > 59) return null;
  return { hours: h, minutes: m };
}

function todayAt(hours, minutes) {
  const d = new Date();
  d.setSeconds(0, 0);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function nextFireDate(reminder, from = new Date()) {
  const { hours, minutes } = reminder;
  let candidate = todayAt(hours, minutes);

  if (reminder.repeat === "none") {
    if (candidate <= from) return null;
    return candidate;
  }

  if (candidate <= from) {
    candidate = new Date(candidate);
    candidate.setDate(candidate.getDate() + 1);
  }
  return candidate;
}

function sameLocalDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

class ReminderScheduler {
  constructor(onFire) {
    this.onFire = onFire;
    this.interval = null;
    this.firedToday = new Map();
  }

  list() {
    return store.get("items", []);
  }

  save(items) {
    store.set("items", items);
  }

  add({ message, hours, minutes, repeat }) {
    const time = parseTime(hours, minutes);
    if (!time) throw new Error("Invalid time");
    const trimmed = String(message || "").trim();
    if (!trimmed) throw new Error("Message is required");

    const item = {
      id: randomUUID(),
      message: trimmed.slice(0, 200),
      hours: time.hours,
      minutes: time.minutes,
      repeat: repeat === "daily" ? "daily" : "none",
      enabled: true,
      createdAt: Date.now(),
    };

    const items = this.list();
    items.push(item);
    this.save(items);
    return item;
  }

  remove(id) {
    const items = this.list().filter((r) => r.id !== id);
    this.save(items);
    this.firedToday.delete(id);
  }

  toggle(id, enabled) {
    const items = this.list().map((r) =>
      r.id === id ? { ...r, enabled: Boolean(enabled) } : r
    );
    this.save(items);
    if (!enabled) this.firedToday.delete(id);
  }

  tick() {
    const now = new Date();
    const items = this.list();

    for (const reminder of items) {
      if (!reminder.enabled) continue;

      const due =
        now.getHours() === reminder.hours &&
        now.getMinutes() === reminder.minutes &&
        now.getSeconds() < 2;

      if (!due) continue;

      const last = this.firedToday.get(reminder.id);
      if (last && sameLocalDay(last, now)) continue;

      this.firedToday.set(reminder.id, now);
      this.onFire(reminder);

      if (reminder.repeat === "none") {
        this.toggle(reminder.id, false);
      }
    }
  }

  start() {
    if (this.interval) return;
    this.interval = setInterval(() => this.tick(), 1000);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}

module.exports = { ReminderScheduler, nextFireDate };
