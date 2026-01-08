import { initializeApp } from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getDatabase, ref, push, onValue, update, remove, get
} from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

import { initAuth } from "./auth.js";


initializeApp({
  apiKey: "AIzaSyD17d36hUtlzfNXbcKCJ_cay-crcC382W8",
  authDomain: "scales-e4215.firebaseapp.com",
  projectId: "scales-e4215",
  storageBucket: "scales-e4215.firebasestorage.app",
  messagingSenderId: "504039906176",
  appId: "1:504039906176:web:ee9c90441a272de64e3f65"
});

const db = getDatabase();
initAuth(db);

if (!localStorage.user) {
  auth.hidden = false;
  throw "";
}
auth.hidden = true;
app.hidden = false;

let currentScale = null;
let weights = {};
let placements = {};

/* LISTENERS */
onValue(ref(db,"weights"), s => { weights = s.val() || {}; render(); });
onValue(ref(db,"placements"), s => { placements = s.val() || {}; render(); });

onValue(ref(db,"scales"), s => {
  scaleSelect.innerHTML="";
  s.forEach(c=>{
    if (c.val().owner!==localStorage.user) return;
    const o=document.createElement("option");
    o.value=c.key; o.textContent=c.val().name;
    scaleSelect.appendChild(o);
  });
  currentScale ||= scaleSelect.value;
  loadLabels();
});

function loadLabels(){
  get(ref(db,"scales/"+currentScale)).then(s=>{
    leftLabel.value=s.val().leftLabel;
    rightLabel.value=s.val().rightLabel;
  });
}

leftLabel.onblur=()=>update(ref(db,"scales/"+currentScale),{leftLabel:leftLabel.value});
rightLabel.onblur=()=>update(ref(db,"scales/"+currentScale),{rightLabel:rightLabel.value});

newScaleBtn.onclick=()=>push(ref(db,"scales"),{
  name:prompt("Scale name"),
  owner:localStorage.user,
  leftLabel:"Left",
  rightLabel:"Right"
});

addWeightBtn.onclick=()=>push(ref(db,"weights"),{
  name:prompt("Weight name"),
  value:+prompt("Value")
});

/* RENDER */
function render(){
  tray.innerHTML="";
  leftPan.innerHTML='<div class="sum" id="leftSum">0</div>';
  rightPan.innerHTML='<div class="sum" id="rightSum">0</div>';

  let L=0, R=0;

  for(const id in weights){
    const w=weights[id];
    const el=document.createElement("div");
    el.className="weight";
    el.textContent=`${w.name} (${w.value})`;
    el.draggable=true;
    el.ondragstart=e=>e.dataTransfer.setData("id",id);

    const side=placements[currentScale]?.[id];
    if(side==="left"){ L+=w.value; leftPan.appendChild(el); }
    else if(side==="right"){ R+=w.value; rightPan.appendChild(el); }
    else tray.appendChild(el);
  }

  leftSum.textContent=L;
  rightSum.textContent=R;

  const diff=L-R;
  beam.style.transform =
  `translateX(-50%) rotate(${Math.max(-12, Math.min(12, -diff))}deg)`;

  winner.textContent =
    diff===0 ? "Balanced" :
    diff>0 ? `${leftLabel.value} wins` :
             `${rightLabel.value} wins`;
}

/* DROP ZONES */
[leftPan,rightPan,tray,trash,duplicate].forEach(el=>{
  el.ondragover=e=>e.preventDefault();
  el.ondrop=e=>{
    const id=e.dataTransfer.getData("id");

    if(el===trash){
      remove(ref(db,"weights/"+id));
      remove(ref(db,"placements/"+currentScale+"/"+id));
      return;
    }

    if(el===duplicate){
      const w=weights[id];
      push(ref(db,"weights"),{ name:w.name, value:w.value });
      return;
    }

    update(ref(db,"placements/"+currentScale),{
      [id]:
        el===leftPan ? "left" :
        el===rightPan ? "right" : null
    });
  };
});
