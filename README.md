# Za Irenu ♡

A little website for Irena: a password gate, a home page, the love page, the countdown to the next meeting and a photo wall.

Every push to `main` rebuilds and publishes the site with GitHub Pages (`.github/workflows/objavi.yml`).

## Pages

| File | What it is |
| --- | --- |
| `index.html` | The gate (one input, password `16.8.2026`) and the home page behind it |
| `za-irenu.html` | The original love page: heart notes and reasons |
| `odbrojavanje.html` | Countdown to the next meeting, the road between us, the sealed letter |
| `slike.html` | Photo wall with a full-screen viewer (swipe, double-tap for a heart) |

Once she enters the password, that phone remembers it. "zakljucaj" on the home page locks it again.

## Adding photos

Drop photos (JPG, PNG or WEBP) into `slike/` and push, or upload them on github.com into the `slike` folder.
The build makes small, phone-friendly copies, turns them the right way up, crops the black/grey bars off story screenshots and strips location data.
Newest photos come first; the date is read from the filename (`WhatsApp Image 2026-11-08 ...`, `IMG_20260816_...`) or from the camera data.

iPhone HEIC photos are not supported; export them as JPG first.

To fix a photo's date or add a caption, edit `slike/opisi.json` (keyed by filename):

```json
{
  "5.jpeg": { "datum": "16.8.2026", "opis": "nasa voznja" },
  "6.jpeg": { "datum": "" }
}
```

- `datum`: `16.8.2026` or `2026-08-16`; `""` hides the date; leave it out to use the automatic one.
- `opis`: the caption under the photo (optional).
- Photos are sorted by these dates, newest first.

## Setting the next meeting

The date lives in one shared file, `vidjanje.json`, so everyone sees the same countdown. Pages read it straight from the repo through the GitHub API, so a change shows up as soon as the page is opened (open pages re-check every 3 minutes).

- **Secret corner** (`odbrojavanje.html`, bottom button "tajni kutak", password `srecica13`): pick the date, place and a sealed letter and press "Sacuvaj za oboje". The page commits `vidjanje.json` for you.
  The first time, it asks for a GitHub token (fine-grained, only the `za-irenu` repo, Contents: Read and write; create it at https://github.com/settings/personal-access-tokens/new).
  The token is stored in `kljuc.json`, encrypted with the corner password (AES-GCM, PBKDF2 600k), so after that any phone that knows the password can save. When the token expires, the corner asks for a new one.
- **Or edit `vidjanje.json`** on github.com:
  ```json
  { "datum": "2026-12-24T18:00", "mjesto": "kod tebe", "pismo": "otvori me kad se vidimo ♡" }
  ```

Because `kljuc.json` is public (encrypted), use a corner password that is hard to guess. Changing it: run `hashLozinke('new')` in the console, paste the number as `ADMIN_HASH` in `odbrojavanje.html`, then reconnect the token once.

## Changing the passwords

The passwords are stored as hashes. In the browser console (F12) on the countdown page, run `hashLozinke('new password')` and paste the number:

- gate: `PASS_HASH` in `index.html` **and** `OK` in `assets/guard.js` + `assets/site.js` (the stored key)
- secret corner: `ADMIN_HASH` in `odbrojavanje.html`

The gate is a cute lock, not real security: the site is static, so anyone who finds the files can see them.

## Building locally

```bash
npm install
npm run build
```

The finished site is in `_site/`.
