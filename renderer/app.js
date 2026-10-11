function pad(n) {
  return String(n).padStart(2, "0");
}

function formatTime(hours, minutes) {
  const h12 = hours % 12 || 12;
  const ampm = hours < 12 ? "AM" : "PM";
  return `${h12}:${pad(minutes)} ${ampm}`;
}

function fillTimeSelects() {
  const hoursEl = document.getElementById("hours");
  const minutesEl = document.getElementById("minutes");
  for (let h = 0; h < 24; h++) {
    const opt = document.createElement("option");
    opt.value = h;
    opt.textContent = pad(h);
    hoursEl.appendChild(opt);
  }
  for (let m = 0; m < 60; m += 1) {
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = pad(m);
    minutesEl.appendChild(opt);
  }
  const now = new Date();
  hoursEl.value = now.getHours();
  minutesEl.value = now.getMinutes();
}

function repeatLabel(repeat) {
  return repeat === "daily" ? "Daily" : "Once";
}

async function renderList() {
  const list = document.getElementById("reminder-list");
  const items = await window.bolt.listReminders();
  list.innerHTML = "";

  for (const item of items) {
    const li = document.createElement("li");
    li.className = "reminder-item" + (item.enabled ? "" : " disabled");

    const body = document.createElement("div");
    body.className = "reminder-body";
    body.innerHTML = `
      <p class="reminder-message">${escapeHtml(item.message)}</p>
      <p class="reminder-meta">${formatTime(item.hours, item.minutes)} · ${repeatLabel(item.repeat)}</p>
    `;

    const actions = document.createElement("div");
    actions.className = "reminder-actions";

    const toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.className = "icon-btn";
    toggleBtn.textContent = item.enabled ? "Pause" : "Resume";
    toggleBtn.addEventListener("click", async () => {
      await window.bolt.toggleReminder(item.id, !item.enabled);
      await renderList();
    });

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "icon-btn danger";
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", async () => {
      await window.bolt.removeReminder(item.id);
      await renderList();
    });

    actions.append(toggleBtn, delBtn);
    li.append(body, actions);
    list.appendChild(li);
  }
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function showError(msg) {
  const el = document.getElementById("form-error");
  if (!msg) {
    el.hidden = true;
    el.textContent = "";
    return;
  }
  el.hidden = false;
  el.textContent = msg;
}

document.getElementById("test-now").addEventListener("click", async () => {
  showError("");
  const message =
    document.getElementById("message").value.trim() ||
    "Time to drink water! 💧";
  try {
    await window.bolt.testReminder(message);
  } catch (err) {
    showError(err.message || "Could not run test");
  }
});

document.getElementById("reminder-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  showError("");
  const message = document.getElementById("message").value;
  const hours = document.getElementById("hours").value;
  const minutes = document.getElementById("minutes").value;
  const repeat = document.getElementById("repeat").value;

  try {
    await window.bolt.addReminder({ message, hours, minutes, repeat });
    document.getElementById("message").value = "";
    await renderList();
  } catch (err) {
    showError(err.message || "Could not save reminder");
  }
});

fillTimeSelects();
renderList();
