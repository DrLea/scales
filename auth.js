import { ref, get, set } from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

  
async function hash(t) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t));
  return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("");
}

export function initAuth(db) {
  loginBtn.onclick = async () => {
    const s = await get(ref(db,"users/"+nick.value));
    if (!s.exists()) return alert("No user");
    if (s.val().password !== await hash(pass.value)) return alert("Wrong");
    localStorage.user = nick.value;
    location.reload();
  };

  registerBtn.onclick = async () => {
    const r = ref(db,"users/"+nick.value);
    if ((await get(r)).exists()) return alert("Exists");
    await set(r,{ password: await hash(pass.value) });
    localStorage.user = nick.value;
    location.reload();
  };

  logoutBtn.onclick = () => {
    localStorage.clear();
    location.reload();
  };
}
