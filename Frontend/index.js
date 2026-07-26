const chatWindow = document.getElementById("chat-window");
const emptyState = document.getElementById("empty-state");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");

const threadId=Date.now().toString(36)+Math.random().toString(12).substring(2,8);
console.log(threadId);
// Auto-grow the textarea as the user types.
userInput.addEventListener("input", () => {
  userInput.style.height = "auto";
  userInput.style.height = Math.min(userInput.scrollHeight, 160) + "px";
});

userInput.addEventListener("keyup", handleSend);
sendBtn.addEventListener("click", handleSend);

async function handleSend(e) {
  // Only proceed on a click, or on Enter (but not Shift+Enter, which should
  // just insert a new line like a normal textarea).
  if (e.type === "click" || (e.key === "Enter" && !e.shiftKey)) {
    const text = userInput.value.trim();
    if (!text) return;

    // Show the user's message immediately.
    addMessage("user", text);
    userInput.value = "";
    userInput.style.height = "auto";

    // Lock the UI while we wait for a reply, so the user can't send twice.
    sendBtn.disabled = true;
    userInput.disabled = true;
    showTypingIndicator();

    try {
      const response = await fetch("/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text ,threadId}),
      });

      // fetch() doesn't throw on 404/500 — only on network failure — so
      // check response.ok yourself and treat a bad status as an error too.
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const reply = await response.json();
      removeTypingIndicator();
      addMessage("bot", reply.message);
    } catch (err) {
      removeTypingIndicator();
      addMessage("bot", "Something went wrong talking to the model: " + err.message);
    } finally {
      // Runs whether the try succeeded or failed — always unlock the UI.
      sendBtn.disabled = false;
      userInput.disabled = false;
      userInput.focus();
    }
  }
}

function addMessage(role, text) {
  if (emptyState) emptyState.remove();

  const row = document.createElement("div");
  row.className = "message-row " + (role === "user" ? "user" : "bot");

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;

  if (role === "user") {
    row.appendChild(bubble);
  } else {
    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = "B";
    row.appendChild(avatar);
    row.appendChild(bubble);
  }

  chatWindow.appendChild(row);

  // Keep the newest message in view.
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Shows the three-dot "bot is typing" bubble while we wait on the API.
function showTypingIndicator() {
  const row = document.createElement("div");
  row.className = "message-row bot";
  row.id = "typing-row"; // so we can find and remove just this one element

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = "B";

  const bubble = document.createElement("div");
  bubble.className = "bubble typing";
  bubble.innerHTML = "<span></span><span></span><span></span>";

  row.appendChild(avatar);
  row.appendChild(bubble);
  chatWindow.appendChild(row);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function removeTypingIndicator() {
  const row = document.getElementById("typing-row");
  if (row) row.remove();
}