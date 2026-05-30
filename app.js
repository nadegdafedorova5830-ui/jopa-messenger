import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

import {
  getFirestore, collection, addDoc,
  onSnapshot, doc, updateDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

import {
  getDatabase, ref, set, onDisconnect, onValue
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

/* CONFIG */
const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "YOUR_DOMAIN",
  projectId: "YOUR_ID",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const rtdb = getDatabase(app);

/* UI */
const authUI = document.getElementById("auth");
const dash = document.getElementById("dashboard");

let user = null;

/* AUTH */
login.onclick = () =>
  signInWithEmailAndPassword(auth, email.value, password.value);

register.onclick = () =>
  createUserWithEmailAndPassword(auth, email.value, password.value);

logout.onclick = () => signOut(auth);

/* STATE */
onAuthStateChanged(auth, async (u) => {
  if (!u) return;

  user = u;
  authUI.classList.add("hidden");
  dash.classList.remove("hidden");

  setupPresence();
  loadTasks();
});

/* PRESENCE (ONLINE USERS) */
function setupPresence() {
  const userRef = ref(rtdb, "online/" + user.uid);

  set(userRef, true);
  onDisconnect(userRef).remove();

  onValue(ref(rtdb, "online"), (snap) => {
    document.getElementById("online").innerText =
      snap.exists() ? Object.keys(snap.val()).length : 0;
  });
}

/* CREATE TASK */
add.onclick = async () => {
  await addDoc(collection(db, "items"), {
    title: title.value,
    description: desc.value,
    status: status.value,
    createdAt: Date.now(),
    userId: user.uid
  });
};

/* LOAD */
function loadTasks() {
  onSnapshot(collection(db, "items"), (snap) => {
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .filter(i => i.userId === user.uid);

    render(items);
    updateStats(items);
  });
}

/* STATS */
function updateStats(items) {
  total.innerText = items.length;
  active.innerText = items.filter(i => i.status==="active").length;
  done.innerText = items.filter(i => i.status==="done").length;
}

/* RENDER KANBAN */
function render(items) {
  activeCol.innerHTML = "";
  doneCol.innerHTML = "";

  items.forEach(i => {
    const el = document.createElement("div");
    el.className = "task";
    el.draggable = true;
    el.innerText = i.title;

    el.ondragstart = () => {
      window.dragged = i;
    };

    const target = i.status === "active" ? activeCol : doneCol;
    target.appendChild(el);
  });
}

/* DROP */
document.querySelectorAll(".dropzone").forEach(zone => {
  zone.ondragover = e => e.preventDefault();

  zone.ondrop = async () => {
    await updateDoc(doc(db, "items", window.dragged.id), {
      status: zone.id === "doneCol" ? "done" : "active"
    });
  };
});

/* DARK MODE */
darkMode.onclick = () => document.body.classList.toggle("dark");

/* AI ASSISTANT (simple smart generator) */
aiBtn.onclick = async () => {
  const text = aiInput.value;

  const ideas = [
    "Research competitors",
    "Create roadmap",
    "Write documentation",
    "Build prototype",
    "Test users feedback"
  ];

  for (let i = 0; i < 5; i++) {
    await addDoc(collection(db,"items"), {
      title: text + " - " + ideas[i],
      description: "AI generated task",
      status: "active",
      createdAt: Date.now(),
      userId: user.uid
    });
  }
};