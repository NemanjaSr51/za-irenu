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

Captions are optional. Put them in `slike/opisi.json`, keyed by filename:

```json
{
  "5.jpeg": "nasa voznja",
  "WhatsApp Image 2026-11-08 at 10.17.43.jpeg": "ti i ja ♡"
}
```

## Setting the next meeting

Either way works:

- **Secret corner** (`odbrojavanje.html`, bottom button "tajni kutak", password `srecica13`): pick the date, place and a sealed letter, then send her the link it gives you.
- **Edit `vidjanje.json`** on github.com, so it shows without a special link:
  ```json
  { "datum": "2026-12-24T18:00", "mjesto": "kod tebe", "pismo": "otvori me kad se vidimo ♡" }
  ```

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
