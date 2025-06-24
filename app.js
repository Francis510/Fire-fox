// ✅ Firebase Config (fire-network)
const firebaseConfig = {
  apiKey: "AIzaSyDhC8Fsd2G5lLPlyji3Ww-NkvLK0TT01Yw",
  authDomain: "fire-network-84c30.firebaseapp.com",
  projectId: "fire-network-84c30",
  storageBucket: "fire-network-84c30.appspot.com",
  messagingSenderId: "71829024264",
  appId: "1:71829024264:web:a5a3fe61ca2c536510abbd"
};

// ✅ Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ✅ Send email login confirmation
function sendLoginCode() {
  const email = document.getElementById("email").value.trim();
  if (!email) return alert("Enter your email!");

  const actionCodeSettings = {
    url: window.location.href,
    handleCodeInApp: true
  };

  auth.sendSignInLinkToEmail(email, actionCodeSettings)
    .then(() => {
      window.localStorage.setItem("emailForSignIn", email);
      alert("✅ Link sent! Check your email.");
    })
    .catch((error) => {
      console.error("Send error:", error);
      alert("❌ Failed to send email");
    });
}

// ✅ Handle user login from email link
if (auth.isSignInWithEmailLink(window.location.href)) {
  let email = localStorage.getItem("emailForSignIn");
  if (!email) {
    email = window.prompt("Enter your email to confirm login");
  }

  auth.signInWithEmailLink(email, window.location.href)
    .then(() => {
      localStorage.removeItem("emailForSignIn");

      document.getElementById("app").classList.add("hidden");
      document.getElementById("username-setup").classList.remove("hidden");
    })
    .catch((error) => {
      console.error("Login error:", error);
    });
}

// ✅ Save username to Firestore and setup referral
function submitUsername() {
  const username = document.getElementById("username-input").value.trim();
  if (!/^[a-zA-Z]+$/.test(username)) {
    alert("❌ Only letters allowed!");
    return;
  }

  const user = auth.currentUser;
  if (!user) return alert("Not logged in.");

  const referrerId = getReferralIdFromURL();

  db.collection("users").doc(user.uid).set({
    username: username,
    referredBy: referrerId || null,
    balance: 0,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    alert("✅ Username saved.");

    document.getElementById("username-setup").classList.add("hidden");
    document.getElementById("mining-section").classList.remove("hidden");

    const refLink = `${window.location.origin}?ref=${user.uid}`;
    document.getElementById("referral-link").value = refLink;

    // Reward referrer 10% (once)
    if (referrerId) {
      db.collection("users").doc(referrerId).update({
        balance: firebase.firestore.FieldValue.increment(3.6) // 10% of 36
      });
    }

  }).catch((error) => {
    console.error("Save error:", error);
    alert("❌ Failed to save username.");
  });
}

// ✅ Start Mining
function startMining() {
  const progress = document.getElementById("progress");
  const status = document.getElementById("mining-status");

  let mined = 0;
  const total = 100;
  const duration = 2 * 60 * 1000; // 2 mins for demo (use 24hr = 86400000)
  const interval = duration / total;

  status.textContent = "⛏️ Mining started...";

  const timer = setInterval(() => {
    mined++;
    progress.style.width = `${mined}%`;
    status.textContent = `Mining... ${mined}%`;

    if (mined >= 100) {
      clearInterval(timer);
      status.textContent = "✅ Mined 36 Fire";

      const user = auth.currentUser;
      if (!user) return;

      db.collection("users").doc(user.uid).update({
        balance: firebase.firestore.FieldValue.increment(36)
      });
    }
  }, interval);
}

// ✅ Copy Referral Link
function copyReferral() {
  const input = document.getElementById("referral-link");
  input.select();
  document.execCommand("copy");
  alert("📋 Link copied!");
}

// ✅ Get referral ID from URL
function getReferralIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("ref") || null;
}