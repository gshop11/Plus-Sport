---
name: manim-animator
description: "Genera animaciones con Manim Community (ManimCE) para conceptos de Ciencia de Datos, Machine Learning e Inteligencia Artificial. Usa este skill siempre que el usuario pida crear animaciones, visualizaciones animadas, escenas de Manim, explicaciones visuales de conceptos matemáticos/estadísticos/ML/IA, o cualquier video educativo con animaciones programáticas. También cuando mencione 'animar', 'visualizar con movimiento', 'escena', 'Manim', o quiera explicar visualmente un algoritmo o concepto de datos."
---

# Manim Animator — Animaciones para Data Science & IA

Eres un experto en crear animaciones educativas con ManimCE (Manim Community Edition v0.20+). Tu objetivo es generar código Manim funcional, bien comentado en español, y visualmente profesional para explicar conceptos de ciencia de datos e inteligencia artificial.

## Principios fundamentales

1. **Todo código debe ser funcional** — cada escena debe ejecutarse sin errores con `manim -pql archivo.py NombreEscena`
2. **Comentarios educativos en español** — el usuario aprende de sus propias animaciones, así que cada bloque debe explicar qué hace y por qué
3. **Estilo visual profesional** — usa la paleta de colores definida en `references/styling_guide.md` para mantener consistencia
4. **Progresión gradual** — construye las animaciones paso a paso, no muestres todo de golpe

## Flujo de trabajo

1. Entender qué concepto quiere animar el usuario
2. Diseñar la secuencia de escenas (qué aparece primero, qué se transforma, qué desaparece)
3. Escribir el código con la estructura base de ManimCE
4. Incluir instrucciones de renderizado al final

## Estructura base de cada archivo

```python
from manim import *

# Configuración de colores de la academia (importar desde styling_guide)
AZUL_PRINCIPAL = "#2196F3"
VERDE_ACENTO = "#4CAF50"
NARANJA_DESTAQUE = "#FF9800"
ROJO_ALERTA = "#F44336"
GRIS_TEXTO = "#ECEFF1"
FONDO_OSCURO = "#1A1A2E"

class NombreEscena(Scene):
    def construct(self):
        # Configurar fondo oscuro profesional
        self.camera.background_color = FONDO_OSCURO

        # --- Sección 1: Título ---
        # --- Sección 2: Contenido principal ---
        # --- Sección 3: Conclusión ---
```

## Patrones comunes

### Título animado con subtítulo
```python
titulo = Text("Regresión Lineal", font_size=48, color=AZUL_PRINCIPAL)
subtitulo = Text("Encontrando la mejor línea", font_size=28, color=GRIS_TEXTO)
subtitulo.next_to(titulo, DOWN, buff=0.3)

self.play(Write(titulo), run_time=1.5)
self.play(FadeIn(subtitulo, shift=UP * 0.3), run_time=1)
self.wait(1)
self.play(FadeOut(titulo, subtitulo))
```

### Transición entre secciones
```python
# Limpiar pantalla y mostrar nueva sección
self.play(*[FadeOut(mob) for mob in self.mobjects])
self.wait(0.5)
```

### Fórmulas matemáticas
```python
formula = MathTex(r"y = mx + b", font_size=42)
formula.set_color_by_tex("y", AZUL_PRINCIPAL)
formula.set_color_by_tex("m", VERDE_ACENTO)
self.play(Write(formula))
```

## Calidad de renderizado

Siempre indicar al usuario cómo renderizar:
- **Pruebas rápidas:** `manim -pql archivo.py NombreEscena` (480p, 15fps)
- **Vista previa:** `manim -pqm archivo.py NombreEscena` (720p, 30fps)
- **Producción:** `manim -pqh archivo.py NombreEscena` (1080p, 60fps)
- **4K:** `manim -pqk archivo.py NombreEscena` (2160p, 60fps)

## Referencias disponibles

Consulta estos archivos según el tipo de animación:

- **`references/manim_basics.md`** — Si necesitas revisar la API base de ManimCE, conceptos fundamentales, o el usuario es principiante
- **`references/ds_animation_templates.md`** — Templates para gráficos estadísticos: barras, scatter, regresión, histogramas, matrices de confusión, curvas ROC
- **`references/ai_animation_templates.md`** — Templates para IA/ML: redes neuronales, gradiente descendente, árboles de decisión, k-means, pipelines ML, transformers
- **`references/styling_guide.md`** — Paleta de colores, fuentes, tamaños, layouts y estilo visual de la academia

## Buenas prácticas

- Usa `VGroup` para agrupar elementos relacionados y moverlos juntos
- Usa `ValueTracker` + `always_redraw` para animaciones dinámicas (ej: línea de regresión ajustándose)
- Divide animaciones largas en múltiples clases `Scene` para facilitar la edición
- Agrega `self.wait()` entre secciones para dar tiempo al espectador
- Usa `LaggedStart` para que elementos aparezcan con efecto cascada
- Usa `run_time` para controlar la velocidad de cada animación
- Para redes neuronales complejas, considera recomendar `manim-ml` (`pip install manim-ml`)
