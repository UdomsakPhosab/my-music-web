import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { firebaseConfig, adminUid } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const allowedHosts = ["youtube.com", "youtu.be", "spotify.com", "soundcloud.com"];

const authForm = document.querySelector("#auth-form");
const signOutButton = document.querySelector("#sign-out");
const authStatus = document.querySelector("#auth-status");
const adminPanel = document.querySelector("#admin-panel");
const songForm = document.querySelector("#song-form");
const songsList = document.querySelector("#songs-list");
const songsEmpty = document.querySelector("#songs-empty");

let currentUser = null;
let isAdmin = false;

function getPlatform(url) {
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "YouTube";
  if (url.includes("spotify.com")) return "Spotify";
  if (url.includes("soundcloud.com")) return "SoundCloud";
  return "Link";
}

function isAllowedSongUrl(urlText) {
  try {
    const parsed = new URL(urlText);
    const host = parsed.hostname.toLowerCase();
    return allowedHosts.some((allowedHost) => host === allowedHost || host.endsWith(`.${allowedHost}`));
  } catch {
    return false;
  }
}

function updateAuthUI() {
  adminPanel.classList.toggle("hidden", !isAdmin);
  authStatus.textContent = isAdmin
    ? `Signed in as admin (${currentUser.email})`
    : currentUser
    ? `Signed in as ${currentUser.email} (read-only)`
    : "Public mode";
}

function renderSongs(docs) {
  songsList.innerHTML = "";

  if (!docs.length) {
    songsEmpty.textContent = "No songs yet.";
    return;
  }

  songsEmpty.textContent = "";

  docs.forEach((songDoc) => {
    const data = songDoc.data();
    const li = document.createElement("li");
    li.className = "song-item";

    const main = document.createElement("div");
    main.className = "song-main";

    const title = document.createElement("div");
    title.className = "song-title";
    title.textContent = data.title;

    const link = document.createElement("a");
    link.className = "song-link";
    link.href = data.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = `Open on ${data.platform}`;

    main.appendChild(title);
    main.appendChild(link);
    li.appendChild(main);

    if (isAdmin) {
      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "delete";
      deleteButton.textContent = "Delete";
      deleteButton.addEventListener("click", async () => {
        await deleteDoc(doc(db, "songs", songDoc.id));
      });
      li.appendChild(deleteButton);
    }

    songsList.appendChild(li);
  });
}

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = document.querySelector("#email").value.trim();
  const password = document.querySelector("#password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch {
    authStatus.textContent = "Sign-in failed. Check credentials.";
  }
});

signOutButton.addEventListener("click", async () => {
  await signOut(auth);
});

songForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!isAdmin) {
    return;
  }

  const titleInput = document.querySelector("#song-title");
  const urlInput = document.querySelector("#song-url");
  const title = titleInput.value.trim();
  const url = urlInput.value.trim();

  if (!title || !isAllowedSongUrl(url)) {
    authStatus.textContent = "Please add a title and a valid YouTube/Spotify/SoundCloud URL.";
    return;
  }

  await addDoc(collection(db, "songs"), {
    title,
    url,
    platform: getPlatform(url),
    createdAt: serverTimestamp(),
  });

  songForm.reset();
});

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  isAdmin = Boolean(user && user.uid === adminUid);
  updateAuthUI();
});

const songsQuery = query(collection(db, "songs"), orderBy("createdAt", "desc"));
onSnapshot(
  songsQuery,
  (snapshot) => {
    renderSongs(snapshot.docs);
  },
  () => {
    songsEmpty.textContent = "Unable to load songs. Check Firebase setup and rules.";
  },
);
