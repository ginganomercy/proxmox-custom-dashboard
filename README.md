# 🖥️ Proxmox Custom Dashboard (Frontend)

The main User Interface repository for the **Proxmox Custom Dashboard**. It is designed as a high-performance Monolithic Single Page Application (SPA) that communicates with multiple underlying Microservices (Golang Core API & Rust VNC Proxy).

## 🚀 Tech Stack

- **React v19**: The latest bleeding-edge version of React for rendering the UI.
- **Vite v8**: Blazing fast next-generation frontend tooling and bundler.
- **Tailwind CSS v4**: Utility-first CSS framework natively integrated via PostCSS for lightning-fast styling.
- **TypeScript**: Ensures strict type safety and a robust Developer Experience.
- **Framer Motion**: Powers the smooth micro-animations and page transitions.
- **noVNC (@novnc/novnc)**: Core library for rendering raw Proxmox VNC streams directly into an HTML5 Canvas element.
- **Recharts**: Renders beautiful, interactive telemetry data (CPU/RAM usage) in real-time.
- **Lucide React & Sonner**: Minimalist icon set and elegant toast notifications.

---

## 📂 Folder Structure

```text
frontend-vite/
├── .github/workflows/       # CI/CD Deployment pipelines (Trivy & Tailscale)
├── public/                  # Static assets (Favicons, static SVGs)
├── src/
│   ├── assets/              # Bundled assets (Hero images, logos)
│   ├── components/          # Reusable UI Components
│   │   ├── ui/              # Base primitive components (e.g., GlassCard)
│   │   ├── ConsoleViewer.tsx     # The noVNC integration component
│   │   ├── DataTable.tsx         # Reusable table component
│   │   ├── MetricChart.tsx       # Recharts integration for node metrics
│   │   └── ...
│   ├── lib/                 # Utility functions and API clients
│   │   ├── api.ts           # Axios instance configured with JWT interceptors
│   │   └── utils.ts         # Tailwind-merge and clsx utilities
│   ├── pages/               # Main route views
│   │   ├── Dashboard.tsx    # Core authenticated dashboard
│   │   ├── LandingPage.tsx  # Public landing page
│   │   └── Login.tsx        # Authentication page
│   ├── App.tsx              # React Router setup
│   └── main.tsx             # React DOM entrypoint
├── Dockerfile               # Nginx-based multi-stage Docker build
├── package.json             # NPM dependencies
├── tailwind.config.js       # Tailwind theme configuration
├── tsconfig.json            # TypeScript configuration
└── vite.config.ts           # Vite bundler configuration
```

---

## 🛠️ Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ginganomercy/proxmox-custom-dashboard.git
   cd proxmox-custom-dashboard
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   *Vite will start the server instantly, usually on `http://localhost:5173`.*

---

## 🔒 CI/CD & Deployment

This service utilizes an **Enterprise-Grade GitHub Actions Pipeline**:
1. **Lint & Type Check**: Enforces code quality via `eslint` and `tsc --noEmit`.
2. **Docker Build**: Compiles the React app into static files and packages them inside an Alpine Nginx container (`ghcr.io`).
3. **DevSecOps**: Scans the Docker image using **Trivy** to block critical CVEs from reaching production.
4. **Zero-Trust Deployment**: Connects to your private Swarm Manager via **Tailscale** and automatically issues a `docker service update` using SSH.
