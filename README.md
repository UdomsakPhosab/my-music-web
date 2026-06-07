# my-music-web

Production-ready static music list website for GitHub Pages using Firebase as the shared backend.

## Features

- Public visitors can view songs and open links in YouTube / Spotify / SoundCloud.
- Real-time shared song list with Firebase Firestore.
- Secure admin-only add/delete using Firebase Authentication + Firestore Security Rules.
- Mobile-friendly single-page UI.

## Project Structure

- `/index.html` - Single-page UI
- `/styles.css` - Responsive styling
- `/app.js` - Firebase auth + Firestore logic
- `/firebase-config.example.js` - Config template (copy to local config)
- `/firestore.rules` - Firestore security rules template
- `/seed-data.json` - Optional sample songs

## 1) Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a project.
3. Add a **Web App** to the project.
4. Copy the Firebase web config values.

## 2) Enable Required Firebase Services

### Authentication

1. In Firebase Console -> **Authentication** -> **Sign-in method**
2. Enable **Email/Password** provider.
3. Create the admin account in **Users** (email/password).
4. Open the admin user and copy its **UID**.

### Firestore Database

1. In Firebase Console -> **Firestore Database**
2. Create database (production mode recommended).
3. Use a region close to your users.

## 3) Configure Local App

1. Edit `firebase-config.js` and set:
   - `firebaseConfig` values from Firebase web app settings
   - `adminUid` to the admin account UID from Authentication

> Keep `firebase-config.example.js` as the template reference and update `firebase-config.js` for your deployment values.

## 4) Set Firestore Security Rules (Public read, admin write)

In Firestore -> **Rules**, paste this (replace `YOUR_ADMIN_UID`):

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return request.auth != null && request.auth.uid == "YOUR_ADMIN_UID";
    }

    match /songs/{songId} {
      allow read: if true;
      allow create, delete: if isAdmin();
      allow update: if false;
    }
  }
}
```

This enforces security on Firebase backend (not just hidden UI buttons).

## 5) Optional Seed Data

Use `seed-data.json` as starter content and add documents to `songs` collection manually, with fields:

- `title` (string)
- `url` (string)
- `platform` (string, e.g. YouTube/Spotify/SoundCloud)
- `createdAt` (timestamp)

You can add these from Firestore UI or your own import script.

## 6) Run Locally

Because ES module imports are used, run a local static server:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## 7) Deploy to GitHub Pages

1. Push repository to GitHub.
2. Commit your `firebase-config.js` if you want Pages to use production config in this repo.
   - Alternative: create a separate deployment branch/workflow that generates `firebase-config.js` during deploy.
3. In GitHub repo -> **Settings** -> **Pages**:
   - Source: `Deploy from a branch`
   - Branch: `main` (or your publish branch)
   - Folder: `/ (root)`
4. Save and wait for Pages URL.

## Admin Access Flow

- Any visitor can read/list songs.
- Admin signs in with email/password.
- Admin status is verified by matching authenticated UID to `adminUid`.
- Firestore rules independently enforce write permission by UID.
