import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  onValue,
  update
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

import { setupAuth } from "./auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyD17d36hUtlzfNXbcKCJ_cay-crcC382W8",
  authDomain: "scales-e4215.firebaseapp.com",
  projectId: "scales-e4215",
  storageBucket: "scales-e4215.firebasestorage.app",
  messagingSenderId: "504039906176",
  appId: "1:504039906176:web:ee9c90441a272de64e3f65"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

/* ---------- AUTH ---------- */
const user = localStorage.user;
if (!user) {
  document.getElementById("auth").hidden = false;
  document.getElementById("app").hidden = true;
  setupAuth(db);
  throw new Error("Not logged in");
}

document.getElementById("auth").hidden = true;
document.getElementById("app").hidden = false;

/* ---------- SCALES ---------- */
let currentScale = null;

const scalesRef = ref(db, "scales");
const weightsRef = ref(db, "weights");

onValue(scalesRef, snap => {
  scaleSelect.innerHTML = "";
  snap.forEach(s => {
    if (s.val().owner !== user) return;
    const opt = document.createElement("option");
    opt.value = s.key;
    opt.textContent = s.val().name;
    scaleSelect.appendChild(opt);
  });
  currentScale ||= scaleSelect.value;
});

scaleSelect.onchange = () => currentScale = scaleSelect.value;

document.getElementById("newScaleBtn").onclick = () => {
  const name = prompt("Scale name");
  if (!name) return;

  push(scalesRef, {
    name,
    owner: user
  });
};

/* ---------- WEIGHTS ---------- */
document.getElementById("addWeightBtn").onclick = () => {
  if (!currentScale) return alert("Create a scale first");

  push(weightsRef, {
    scale: currentScale,
    name: wName.value,
    value: Number(wValue.value),
    side: "left"
  });
};

onValue(weightsRef, snap => render(snap));

function render(snap) {
  leftList.innerHTML = rightList.innerHTML = "";
  let L = 0, R = 0;

  snap.forEach(w => {
    if (w.val().scale !== currentScale) return;

    const li = document.createElement("li");
    li.textContent = `${w.val().name} (${w.val().value})`;
    li.draggable = true;
    li.ondragstart = e => e.dataTransfer.setData("id", w.key);

    if (w.val().side === "left") {
      L += w.val().value;
      leftList.appendChild(li);
    } else {
      R += w.val().value;
      rightList.appendChild(li);
    }
  });

  leftSum.textContent = "Sum: " + L;
  rightSum.textContent = "Sum: " + R;

  scale.className = "scale " + (L > R ? "left" : R > L ? "right" : "");
  decision.textContent =
    L === R ? "Balanced" :
    `Decision leans ${L > R ? "LEFT" : "RIGHT"} (${Math.abs(L - R)})`;
}

/* ---------- DRAG & DROP ---------- */
[leftPan, rightPan].forEach((pan, i) => {
  pan.ondragover = e => e.preventDefault();
  pan.ondrop = e => {
    update(ref(db, "weights/" + e.dataTransfer.getData("id")), {
      side: i === 0 ? "left" : "right"
    });
  };
});
