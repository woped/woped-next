# WoPeD Next - Dokumentation

## Übersicht

```mermaid
graph LR
    subgraph docs
        README[README.md]
        subgraph dev[dev/]
            ARCH[architecture.md]
            DESIGN[design.md]
        end
        subgraph ops[ops/]
            CONFIG[configuration.md]
            DEPLOY[deployment.md]
        end
        subgraph migration[migration/]
            MIG[migrations.md]
        end
    end
```

## Inhaltsverzeichnis

### Development (`dev/`)
- [Architektur](dev/architecture.md) - Systemarchitektur und Komponenten
- [Design](dev/design.md) - UI/UX Design-Richtlinien

### Operations (`ops/`)
- [Konfiguration](ops/configuration.md) - Umgebungsvariablen und Settings
- [Deployment](ops/deployment.md) - Build und Deployment-Prozesse

### Migration (`migration/`)
- [Migrationen](migration/migrations.md) - Änderungshistorie und Migrationsschritte

## Quick Links

| Bereich | Beschreibung |
|---------|--------------|
| [Dev Setup](dev/architecture.md#entwicklungsumgebung) | Lokale Entwicklung starten |
| [Docker Deploy](ops/deployment.md#docker) | Container-Deployment |
| [Changelog](migration/migrations.md) | Versionsänderungen |
