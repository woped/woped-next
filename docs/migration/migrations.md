# Migrationen

## Übersicht

```mermaid
timeline
    title WoPeD Next Versionshistorie
    section v1.0
        Initial Release : Vue.js 3 Setup
                       : Vite Build
                       : Docker Support
```

## Changelog

### v1.0.0 (Initial Release)

```mermaid
gitGraph
    commit id: "init"
    commit id: "vue-setup"
    commit id: "docker"
    commit id: "docs"
    commit id: "v1.0.0" tag: "v1.0.0"
```

#### Features
- Vue.js 3 mit Vite initialisiert
- Docker-Unterstützung mit Multi-Stage Build
- nginx als Produktions-Webserver
- Cursor Rules für Entwicklung

#### Dateien
| Aktion | Datei |
|--------|-------|
| ➕ Added | `src/`, `public/`, `index.html` |
| ➕ Added | `Dockerfile`, `docker-compose.yml` |
| ➕ Added | `nginx.conf` |
| ➕ Added | `.cursor/rules/` |
| ➕ Added | `docs/` |

---

## Migrations-Template

### Version X.Y.Z

```markdown
#### Breaking Changes
- [ ] Beschreibung

#### Migrationsschritte
1. Schritt 1
2. Schritt 2

#### Rollback
- Anleitung für Rollback
```

## Abhängigkeiten-Updates

```mermaid
graph TD
    subgraph Current
        VUE3[Vue 3.x]
        VITE6[Vite 6.x]
        NODE22[Node 22]
    end
```

| Paket | Aktuelle Version | Update-Zyklus |
|-------|------------------|---------------|
| vue | 3.x | Minor releases |
| vite | 6.x | Minor releases |
| node | 22.x LTS | LTS releases |
