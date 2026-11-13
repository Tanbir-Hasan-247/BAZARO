# BAZARO Web Client (React + Vite) — Apnar Desher Bazaar

The Quiet Luxury web flagship for **BAZARO**, built with **React 19**, **Vite 6**, **Tailwind CSS 4**, **Three.js / React Three Fiber**, **Framer Motion**, and **Axios**.

---

## 🌐 Live Links

* **Web Storefront:** [https://bazaro-lime.vercel.app](https://bazaro-lime.vercel.app)
* **Backend API:** [https://apibazaro-alpha.vercel.app/api/v1/](https://apibazaro-alpha.vercel.app/api/v1/)
* **GitHub Repository:** [https://github.com/Tanbir-Hasan-247/BAZARO](https://github.com/Tanbir-Hasan-247/BAZARO)

---

## 🛠️ Setup & Run

```bash
git clone https://github.com/Tanbir-Hasan-247/BAZARO.git
cd BAZARO/frontend
npm install
```

Create `.env` from `.env.example` (defaults to the live Vercel API):

```env
VITE_API_BASE_URL=https://apibazaro-alpha.vercel.app/api/v1
# For local Django server:
# VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

Start development server or build for production:

```bash
npm run dev      # http://localhost:5173
npm run build    # outputs to dist/
```
