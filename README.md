# QR Code Tools

A small web app to generate QR codes and read them from images or a live camera. Everything runs in the browser, so nothing you type or scan is sent to a server.

**Live demo:** https://izaan-qr-scanner.web.app

## Features

### Generate QR codes
- Turn any text or URL into a QR code that updates as you type.
- Add an optional **title** and **description**. They're printed above the QR code so the image explains what it's for.
- Download the result as a high-resolution PNG (1152px wide, with the QR code at 1024×1024). The file is named after the title when one is given.

### Read QR codes
- **From an image:** upload a photo or screenshot and the decoded value is shown.
- **From a live camera:** scan with your device camera. It starts on the back camera and stops automatically once a code is found.
- **Multiple cameras:** if more than one camera is available, pick one from a dropdown. The list updates when cameras are plugged in or removed.
- **Copy to clipboard:** one click copies the decoded value.

## Tech stack

- [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org)
- [Vite](https://vite.dev) for development and builds
- [qrcode.react](https://github.com/zpao/qrcode.react) to generate QR codes
- [jsQR](https://github.com/cozmo/jsQR) to decode QR codes from images and camera frames
- [Firebase Hosting](https://firebase.google.com/docs/hosting) for deployment

## Getting started

Requires [Node.js](https://nodejs.org) 20.19+ or 22.12+.

```bash
git clone https://github.com/izaanjahangir/qr-scanner.git
cd qr-scanner
npm install
npm run dev
```

Then open http://localhost:5173.

> **Camera access** only works on `https://` or `localhost`. To test the camera on a phone over your local network, serve the dev server over HTTPS (for example with [`@vitejs/plugin-basic-ssl`](https://github.com/vitejs/vite-plugin-basic-ssl)) or use the live demo.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Type-check and build for production into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Lint the code with Oxlint |
| `npm run deploy` | Build and deploy to Firebase Hosting |

## Deployment

The app is deployed to Firebase Hosting (project `izaan-qr-scanner`). The config is in [`firebase.json`](firebase.json):

- `npm run build` runs automatically before each deploy.
- All routes are served by `index.html`.
- Built assets in `/assets` are cached for a year, and pages are always revalidated so new deploys show up right away.

To deploy:

```bash
npx firebase login   # first time only
npm run deploy
```

## Project structure

```
src/
├── components/
│   ├── QRGenerator.tsx    # Text → QR code with optional title/description, PNG export
│   ├── QRReader.tsx       # Image upload, camera toggle, result + copy to clipboard
│   └── CameraScanner.tsx  # Live camera feed, frame scanning, camera selection
├── App.tsx
├── App.css
├── index.css
└── main.tsx
```
