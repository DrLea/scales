import {
  ref,
  get,
  set
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

async function hash(text) {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text)
  );
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

export function setupAuth(db) {
  const nick = document.getElementById("nick");
  const pass = document.getElementById("pass");

  document.getElementById("loginBtn").onclick = async () => {
    const snap = await get(ref(db, "users/" + nick.value));
    if (!snap.exists()) return alert("User not found");

    if (snap.val().password !== await hash(pass.value))
      return alert("Wrong password");

    localStorage.user = nick.value;
    location.reload();
  };

  document.getElementById("registerBtn").onclick = async () => {
    const userRef = ref(db, "users/" + nick.value);

    if ((await get(userRef)).exists())
      return alert("User already exists");

    await set(userRef, {
      password: await hash(pass.value),
      createdAt: Date.now()
    });

    localStorage.user = nick.value;
    location.reload();
  };

  document.getElementById("logoutBtn").onclick = () => {
    localStorage.clear();
    location.reload();
  };
}
