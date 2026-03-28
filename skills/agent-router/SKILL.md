---
name: agent-router
description: >
  Úsalo cuando el usuario pregunte cuál agente de IA usar para una tarea de desarrollo, o cuando mencione Claude Code, Codex o Gemini en el contexto de decidir qué herramienta usar. También actívalo cuando el usuario describa una tarea técnica y quiera saber cómo distribuir el trabajo entre agentes para optimizar tokens. Ejemplos de triggers: "¿con qué agente hago esto?", "¿uso Claude o Codex para X?", "quiero distribuir el trabajo entre agentes", "¿qué modelo me conviene para esta tarea?".
---

# Agent Router — Perfil del usuario

## Agentes disponibles
- **Claude Code** — suscripción Anthropic (tokens con costo)
- **Codex** — tier gratuito de OpenAI
- **Gemini Pro** — cuenta Google (gratuito)

## Stack de trabajo
- eCommerce / WordPress (temas, plugins, WooCommerce, Elementor)
- Frontend / UI (React, CSS, componentes)
- Backend / APIs (REST, autenticación, lógica de negocio)
- Scripts / Automatización (bash, CLI, tareas repetitivas)
- Contenido (guiones, documentación, textos)
- Diseño (maquetas, prompts para imágenes, briefs visuales)

## Filosofía de enrutamiento
Cada agente tiene un nicho donde rinde al máximo. El objetivo es asignar cada tarea al agente correcto: ni desperdiciar tokens de Claude en tareas simples, ni pedirle a Codex lo que no puede manejar bien. El resultado es calidad óptima al menor costo posible.

## Lógica de decisión

### → Claude Code
La mejor opción cuando la tarea requiere:
- Razonamiento sobre múltiples archivos simultáneos (refactoring, migración, arquitectura)
- Autonomía larga sin supervisión constante
- Backend complejo: autenticación, middleware, lógica entre capas
- Debug de producción: race conditions, memory leaks, errores difíciles de reproducir
- Orquestación multi-agente, CI/CD, pipelines complejos
- Tareas ambiguas que pueden crecer en complejidad inesperadamente

### → Codex (gratuito)
La mejor opción cuando la tarea sea:
- Scripts bash, automatizaciones, cron jobs, CLI
- Snippets rápidos, código repetitivo (CRUD básico, casos de prueba, funciones aisladas)
- Fixes pequeños y bien definidos con alcance claro
- Prototipado rápido
- Funciones PHP para WordPress/WooCommerce con instrucciones específicas
- Modificaciones puntuales a plugins o temas
- Iteraciones rápidas de componentes React o CSS

### → Gemini Pro (gratuito)
La mejor opción cuando la tarea involucre:
- Frontend sin lógica de estado compleja (landing pages, componentes UI, CSS)
- WordPress: maquetación básica, Elementor, estilos, ajustes visuales
- Documentación, READMEs, comentar código existente
- Guiones de videos, textos educativos, narración
- Textos de marketing, descripciones de productos eCommerce, SEO
- Prompts para generación de imágenes (Midjourney, DALL-E, Canva AI)
- Briefs visuales, paletas de color, decisiones de diseño
- Tareas que requieren información en tiempo real (tiene búsqueda web integrada)
- Complementar arquitectura que Claude ya definió

## Casos especiales

| Situación | Decisión |
|-----------|----------|
| WordPress: plugin complejo con hooks avanzados | Claude Code |
| WordPress: ajuste de tema, CSS, shortcode simple | Codex |
| WooCommerce: flujo de pago personalizado | Claude Code |
| WooCommerce: descripciones de productos, SEO | Gemini Pro |
| React: componente con estado complejo | Claude Code |
| React: componente visual sin lógica | Codex o Gemini |
| Script bash en contexto de proyecto grande | Codex |
| Guión de video educativo | Gemini Pro |
| Prompt para imagen o diseño | Gemini Pro |
| Tarea pequeña en proyecto activo de Claude | Codex para no interrumpir contexto |

## Formato de respuesta esperado
1. **Agente recomendado** — nombre directo
2. **Por qué** — 2-3 líneas con razonamiento basado en el perfil y la tarea
3. **Rol de los otros agentes** — una línea sobre cómo pueden complementar si aplica

No usar bullet points excesivos. Respuesta concisa y directa.
