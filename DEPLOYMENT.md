# 🚀 Deployment Guide for 3Dshop (Startup Scale)

This guide follows the **Best Approach** used by real startups: One backend serving both Web and Mobile.

## 🏗️ Final Architecture
- **Frontend (Website)**: [Vercel](https://vercel.com) (React + Three.js)
- **Mobile App**: [Expo](https://expo.dev) (React Native + WebView)
- **Backend API**: [Render](https://render.com) (Node.js)
- **Database**: [MongoDB Atlas](https://www.mongodb.com/atlas) (Cloud)

---

## ☁️ 1. Database Setup (MongoDB Atlas)
1. Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register).
2. Create a **Free Cluster**.
3. Under **Network Access**, add `0.0.0.0/0` (Allow all for deployment).
4. Under **Database Access**, create a user and copy the password.
5. Get your connection string: `mongodb+srv://<user>:<password>@cluster.mongodb.net/3dshop`.

---

## ⚙️ 2. Backend Deployment (Render)
1. Push your code to GitHub.
2. Go to [Render.com](https://render.com/) and create a **New Web Service**.
3. Connect your GitHub repo.
4. Settings:
   - **Root Directory**: `Backend`
   - **Build Command**: `npm install && npm run build` (if using TS) or `npm install`
   - **Start Command**: `node dist/index.js` (or your entry point)
5. **Environment Variables**:
   | Key | Value |
   | :--- | :--- |
   | `MONGODB_URI` | Your MongoDB Atlas String |
   | `JWT_SECRET` | Your Secret |
   | `PORT` | `10000` (Render handles this) |
   | `FRONTEND_URL` | `https://3dshop-tawny.vercel.app` |

---

## 🌐 3. Frontend Deployment (Vercel)
1. Go to [Vercel.com](https://vercel.com/).
2. Import repo and select **Frontend** as the root directory.
3. **Environment Variables**:
   | Key | Value |
   | :--- | :--- |
   | `API_URL` | `https://your-backend.onrender.com/api` |

---

## 📱 4. Mobile App (Expo)
We use Expo for a fast, "Hybrid" mobile experience.

### Step 1: Initialize
```bash
npx create-expo-app 3dshop-app
cd 3dshop-app
npm install react-native-webview
```

### Step 2: Configuration
The `App.js` is configured to load your live Vercel website inside the mobile app.

### Step 3: Run & Preview
```bash
npx expo start
```
Scan the QR code with the **Expo Go** app on your phone.

### Step 4: Build APK (Android)
```bash
npx expo build:android
```

---

### 🚀 Performance Tip
Render free tier "sleeps" after 15 mins of inactivity. The first request might be slow. Consider a $7/mo starter plan for production.

