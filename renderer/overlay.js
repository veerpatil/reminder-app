const stage = document.getElementById("stage");
const messageText = document.getElementById("message-text");
const dismiss = document.getElementById("dismiss");

function playDrop() {
  stage.classList.remove("hidden");
  const wrap = stage.querySelector(".mascot-wrap");
  wrap.style.animation = "none";
  void wrap.offsetWidth;
  wrap.style.animation = "";
}

window.boltOverlay.onShowReminder(({ message }) => {
  messageText.textContent = message;
  playDrop();
});

dismiss.addEventListener("click", () => {
  stage.classList.add("hidden");
  window.boltOverlay.dismiss();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !stage.classList.contains("hidden")) {
    stage.classList.add("hidden");
    window.boltOverlay.dismiss();
  }
});
