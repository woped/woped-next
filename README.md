# 🔄 WoPeD Next

**The modern web-based Petri Net Editor for workflow modeling and analysis.**

[![Vue.js](https://img.shields.io/badge/Vue.js-3.x-42b883?style=flat-square&logo=vue.js)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646cff?style=flat-square&logo=vite)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-LGPL--3.0-blue?style=flat-square)](LICENSE)

> 🎓 **Built for Education** — WoPeD Next brings Petri net modeling to the browser, making workflow analysis accessible to students, researchers, and professionals alike.

---

## ✨ Features

### 🎨 Intuitive Editor
- **Drag & Drop** — Create places, transitions, and arcs with ease
- **Workflow Operators** — AND/XOR split & join for complex routing
- **Subprocesses** — Hierarchical modeling with drill-down navigation
- **Smart Grid** — Snap-to-grid alignment for clean diagrams

### 🎮 Token Game
- **Animated Simulation** — Watch tokens flow through your process
- **Step-by-Step** — Manual or automatic execution
- **Conflict Resolution** — Handle non-deterministic choices
- **Statistics** — Track firings, states, and deadlocks

### 📊 Analysis & Simulation
- **Qualitative Analysis** — Soundness checking, structure validation
- **Quantitative Simulation** — Time-based discrete event simulation
- **Process Metrics** — Complexity, density, and quality metrics
- **Bottleneck Detection** — Identify performance issues

### 📁 File Operations
- **PNML Import/Export** — Standard Petri net format
- **JSON Support** — Full model serialization
- **Image Export** — SVG and PNG for documentation
- **10 Templates** — Educational example nets to get started

### 🌐 Modern UI/UX
- **Dark & Light Mode** — Easy on the eyes, day or night
- **Multilingual** — English and German
- **Responsive Panels** — Collapsible sidebar for maximum canvas space
- **Keyboard Shortcuts** — Power user productivity

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/TaminoFischer/woped-next.git
cd woped-next

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and start modeling!

---

## 🐳 Docker

```bash
# Build and run with Docker Compose
docker compose up --build

# Access at http://localhost:8080
```

---

## 📸 Screenshots

| Editor | Token Game | Analysis |
|--------|------------|----------|
| ![Editor](docs/assets/editor.png) | ![Token Game](docs/assets/token-game.png) | ![Analysis](docs/assets/analysis.png) |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Vue.js 3, Composition API |
| **Canvas** | Konva.js via vue-konva |
| **State** | Pinia |
| **i18n** | vue-i18n |
| **Build** | Vite |
| **Deploy** | GitHub Pages, Docker + nginx |

---

## 📖 Documentation

- [Architecture](docs/dev/architecture.md) — System design and patterns
- [Migration Status](docs/migration/migrations.md) — Feature implementation progress
- [Deployment](docs/ops/deployment.md) — Build and deploy instructions

---

## 🎓 What is WoPeD?

**WoPeD** (Workflow Petri Net Designer) is an educational tool for modeling and analyzing workflow processes using Petri nets. Originally developed as a Java Swing application at DHBW Karlsruhe, **WoPeD Next** is the modern web-based successor.

### Petri Net Basics

```
    (●)  ───►  [ T1 ]  ───►  ( )
   Place    Transition    Place
  (1 token)              (0 tokens)
```

- **Places** (circles) represent states or conditions
- **Transitions** (rectangles) represent activities or events
- **Tokens** (dots) represent the current state of the system
- **Arcs** connect places to transitions and vice versa

---

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests.

---

## 📄 License

This project is licensed under the [LGPL-3.0 License](LICENSE).

---

## 🔗 Links

- [Live Demo](https://taminofischer.github.io/woped-next/) — Try it in your browser
- [Original WoPeD](http://woped.dhbw-karlsruhe.de/) — The legacy Java application
- [Petri Nets World](https://www.informatik.uni-hamburg.de/TGI/PetriNets/) — Learn more about Petri nets

---

<p align="center">
  Made with ❤️ for the Petri net community
</p>
