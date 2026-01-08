import { initializeApp } from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getDatabase, ref, push, onValue, update
} from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

import { setupAuth } from "./auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyD17d36hUtlzfNXbcKCJ_cay-crcC382W8",
  authDomain: "scales-e4215.firebaseapp.com",
  projectId: "scales-e4215",
  storageBucket: "scales-e4215.firebasestorage.app",
  messagingSenderId: "504039906176",
  appId: "1:504039906176:web:ee9c90441a272de64e3f65"
};

initializeApp(firebaseConfig);
const db = getDatabase();

const user = localStorage.getItem("user");
if (!user) {
  auth.hidden = false;
  app.hidden = true;
  setupAuth(db);
  throw "";
}

auth.hidden = true;
app.hidden = false;

/* SCALES */
let currentScale = null;
const scalesRef = ref(db, "scales");
const weightsRef = ref(db, "weights");

onValue(scalesRef, snap => {
  scaleSelect.innerHTML = "";
  snap.forEach(s => {
    if (s.val().owner !== user) return;
    const o = document.createElement("option");
    o.value = s.key;
    o.textContent = s.val().name;
    scaleSelect.appendChild(o);
  });
  currentScale ||= scaleSelect.value;
});

newScaleBtn.onclick = () => {
  const name = prompt("Scale name");
  if (!name) return;
  push(scalesRef, { name, owner: user });
};

scaleSelect.onchange = () => currentScale = scaleSelect.value;

/* WEIGHTS */
addWeightBtn.onclick = () => {
  push(weightsRef, {
    scale: currentScale,
    name: wName.value,
    value: +wValue.value,
    side: "tray"
  });
};

onValue(weightsRef, snap => render(snap));

function render(snap) {
  leftList.innerHTML = rightList.innerHTML = tray.innerHTML = "";
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
    } else if (w.val().side === "right") {
      R += w.val().value;
      rightList.appendChild(li);
    } else {
      tray.appendChild(li);
    }
  });

  leftSum.textContent = L;
  rightSum.textContent = R;

  const diff = L - R;
  const MAX_TILT = 12;
  const slope = Math.max(-MAX_TILT,
    Math.min(MAX_TILT, diff));

  beam.style.transform =
    `translateX(-50%) rotate(${slope}deg)`;

  decision.textContent =
    diff === 0 ? "Balanced" :
    `Leans ${diff > 0 ? "LEFT" : "RIGHT"} (${Math.abs(diff)})`;
}

/* DRAG TARGETS */
[leftPan, rightPan, tray].forEach((el, i) => {
  el.ondragover = e => e.preventDefault();
  el.ondrop = e => {
    const side =
      el === leftPan ? "left" :
      el === rightPan ? "right" : "tray";

    update(ref(db, "weights/" + e.dataTransfer.getData("id")), { side });
  };
});
