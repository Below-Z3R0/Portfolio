#!/usr/bin/env python3
"""Re-aplica los edges manuales del theming v2 después de que Graphify regenere el grafo.

Por qué: graphify extract/cluster sobreescribe graph.json y descarta nuestros edges manuales.
Este script se ejecuta después de cada regeneración para mantener las relaciones semánticas
que el LLM no puede inferir (porque involucran tipos abstractos como 'Theme' y 'globals.css').

Uso:
    cd ~/Documents/Github/Portfolio-v2
    source .venv/bin/activate
    graphify extract src/ --out docs/graph/
    graphify cluster-only docs/graph/
    python3 docs/graph/restore-theming-edges.py
"""
import json
import sys
from pathlib import Path

G_PATH = Path(__file__).parent / "graphify-out" / "graph.json"


def main():
    if not G_PATH.exists():
        print(f"❌ No graph.json en {G_PATH}")
        print("   Ejecutá primero: graphify extract src/ --out docs/graph/ && graphify cluster-only docs/graph/")
        sys.exit(1)

    data = json.loads(G_PATH.read_text())
    existing = {n['id'] for n in data['nodes']}
    added_nodes = 0
    added_edges = 0

    # 1. Nodo conceptual: globals.css (no procesado por Graphify porque es .css)
    if 'app_globals.css' not in existing:
        data['nodes'].append({
            'id': 'app_globals.css',
            'label': 'globals.css',
            'name': 'globals.css',
            'source_file': 'app/globals.css',
            'community': -1,
            'rationale': 'Sistema de theming v2 — 36 vars por paleta × 4 paletas + @theme + utility classes custom. NO procesado por Graphify porque es CSS. Concept node agregado manualmente.',
            'type': 'concept',
            'kind': 'concept',
        })
        existing.add('app_globals.css')
        added_nodes += 1

    # 2. Nodo conceptual: theming.v2.ts (proxy TypeScript que no es importado por nadie)
    # Ya existe porque Graphify lo procesa como .ts, pero verifico
    if 'components_hooks_theming_v2' not in existing:
        # El archivo está en src/ como .ts, Graphify lo procesa automáticamente
        print(f"⚠ Componente 'theming.v2.ts' no encontrado — ejecutar graphify extract primero")
        sys.exit(1)

    # 3. Edges manuales del sistema v2
    edges_to_add = [
        # ... (10 edges semánticas)
        ('components_hooks_theming_v2', 'components_hooks_usetheme',
         'validates-type-of',
         'Theme type exportado en ambos archivos'),
        ('components_hooks_theming_v2', 'components_hooks_themeprovider',
         'documents-config-of',
         'themes list en themeProvider.tsx documentado en theming.v2.ts'),
        ('components_hooks_theming_v2', 'components_atoms_themeswitcher',
         'documents-ui-of',
         'ThemeSwitcher lista ThemeData (origen de las 4 paletas)'),
        ('components_hooks_theming_v2', 'components_atoms_backgroundfx',
         'documents-utility-of',
         'BackgroundFX usa .bg-grid, .bg-fx__noise, .bg-fx__vignette (utility classes custom)'),
        ('components_hooks_theming_v2', 'app_globals.css',
         'represents-system-of',
         'theming.v2.ts es el proxy TypeScript del sistema descrito en globals.css'),
        ('app_globals.css', 'components_hooks_theming_v2',
         'is-proxied-by',
         'globals.css describe el sistema, theming.v2.ts expone los tipos'),
        ('app_layout', 'components_hooks_theming_v2',
         'mounts-system-of',
         'layout.tsx monta <ThemeProvider> que activa el sistema v2'),
        ('components_molecules_projectcard_projectcard', 'components_hooks_theming_v2',
         'uses-conventions-of',
         'ProjectCard usa bg-card, border border-border, hover:border-ring'),
        ('components_molecules_projectcard', 'components_hooks_theming_v2',
         'uses-conventions-of',
         'Archivo del proyecto, usa convenciones del sistema v2'),
        ('components_atoms_themeswitcher_themeswitcher', 'components_hooks_usetheme_usetheme',
         'consumes',
         'ThemeSwitcher llama useTheme() para obtener setTheme'),
    ]

    for src, tgt, relation, rationale in edges_to_add:
        if src in existing and tgt in existing:
            exists = any(
                e.get('source') == src and e.get('target') == tgt and e.get('relation') == relation
                for e in data['links']
            )
            if not exists:
                data['links'].append({
                    'source': src,
                    'target': tgt,
                    'relation': relation,
                    'weight': 0.5,
                    'confidence': 'INFERRED',
                    'kind': 'manual',
                    'rationale': rationale,
                })
                added_edges += 1

    G_PATH.write_text(json.dumps(data, indent=2))

    print(f"✓ Script ejecutado:")
    print(f"  Nodos agregados: {added_nodes}")
    print(f"  Edges restaurados: {added_edges}")
    print(f"  Total: {len(data['nodes'])} nodos, {len(data['links'])} edges")
    print(f"  path: {G_PATH}")


if __name__ == '__main__':
    main()
