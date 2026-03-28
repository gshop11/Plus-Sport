# Guía de Estilo Visual — Academia DS & IA

## Paleta de colores principal

Colores diseñados para fondo oscuro, con buen contraste y accesibilidad.

### Colores base
```python
# Fondo
FONDO_OSCURO = "#1A1A2E"      # Azul muy oscuro (fondo principal)
FONDO_SECCION = "#16213E"      # Variante para secciones

# Primarios
AZUL_PRINCIPAL = "#2196F3"     # Datos, ejes, elementos principales
VERDE_ACENTO = "#4CAF50"       # Éxito, positivo, resultados correctos
NARANJA_DESTAQUE = "#FF9800"   # Destacar, advertencia, elementos importantes
ROJO_ALERTA = "#F44336"        # Error, negativo, elementos incorrectos

# Secundarios
MORADO = "#9C27B0"             # Modelos, algoritmos
AMARILLO = "#FFEB3B"           # Datos fluyendo, highlights temporales
CYAN = "#00BCD4"               # Información complementaria
ROSA = "#E91E63"               # Elementos especiales

# Neutros
GRIS_TEXTO = "#ECEFF1"        # Texto principal
GRIS_MEDIO = "#90A4AE"        # Texto secundario, líneas de cuadrícula
GRIS_SUTIL = "#37474F"        # Bordes sutiles, fondos de sección
```

### Uso por contexto
```python
# Ciencia de datos
COLOR_DATOS = AZUL_PRINCIPAL       # Puntos de datos, gráficos
COLOR_PREDICCION = NARANJA_DESTAQUE # Líneas de predicción
COLOR_ERROR = ROJO_ALERTA          # Residuos, errores
COLOR_EXITO = VERDE_ACENTO         # Métricas positivas

# Redes neuronales
COLOR_INPUT = AZUL_PRINCIPAL       # Capa de entrada
COLOR_HIDDEN = VERDE_ACENTO        # Capas ocultas
COLOR_OUTPUT = NARANJA_DESTAQUE    # Capa de salida
COLOR_ACTIVACION = AMARILLO        # Señal de activación
COLOR_PESO = GRIS_MEDIO            # Conexiones/pesos

# Flujos y pipelines
COLOR_FLUJO = AMARILLO             # Dato moviéndose por el pipeline
COLOR_PROCESO = MORADO             # Etapa de procesamiento
COLOR_RESULTADO = VERDE_ACENTO     # Resultado final
```

## Tipografía

### Tamaños de texto
```python
# Títulos de escena (aparecen al inicio)
TITULO_PRINCIPAL = 48    # Nombre del tema
TITULO_SECCION = 36      # Subtítulo o nombre de sección

# Contenido
TEXTO_GRANDE = 32        # Explicaciones principales
TEXTO_NORMAL = 24        # Texto de apoyo, descripciones
TEXTO_PEQUENO = 20       # Etiquetas de ejes, notas
TEXTO_MINI = 16          # Valores en tablas, anotaciones pequeñas

# Fórmulas
FORMULA_GRANDE = 42      # Fórmula principal del tema
FORMULA_NORMAL = 32      # Fórmulas de apoyo
FORMULA_PEQUENA = 24     # Fórmulas inline
```

### Patrones de texto
```python
# Título con subtítulo
titulo = Text("Regresión Lineal", font_size=48, color=WHITE)
subtitulo = Text("Encontrando la mejor línea", font_size=28, color=GRIS_MEDIO)
subtitulo.next_to(titulo, DOWN, buff=0.3)

# Bullet points
bullets = VGroup(
    Text("• Minimiza el error", font_size=22, color=GRIS_TEXTO),
    Text("• Usa mínimos cuadrados", font_size=22, color=GRIS_TEXTO),
    Text("• Produce ecuación lineal", font_size=22, color=GRIS_TEXTO),
)
bullets.arrange(DOWN, aligned_edge=LEFT, buff=0.3)
```

## Layouts estándar

### Layout 1: Título + Contenido centrado
```python
# Para explicaciones con una visualización principal
titulo.to_edge(UP, buff=0.5)
contenido.move_to(ORIGIN)     # Centro de la pantalla
nota.to_edge(DOWN, buff=0.5)  # Nota al pie
```

### Layout 2: Fórmula izquierda + Gráfico derecha
```python
# Para mostrar la matemática junto a su visualización
formula.to_edge(LEFT, buff=1).shift(UP * 0.5)
grafico.to_edge(RIGHT, buff=0.5)
```

### Layout 3: Comparación lado a lado
```python
# Para comparar dos conceptos
panel_izq = VGroup(titulo_izq, contenido_izq)
panel_der = VGroup(titulo_der, contenido_der)
panel_izq.move_to(LEFT * 3)
panel_der.move_to(RIGHT * 3)
linea_division = Line(UP * 3, DOWN * 3, color=GRIS_SUTIL, stroke_width=1)
```

### Layout 4: Pipeline horizontal
```python
# Para mostrar flujos de procesos
bloques.arrange(RIGHT, buff=0.6)
bloques.move_to(ORIGIN)
```

## Transiciones entre secciones

### Fade completo (más usado)
```python
# Limpiar todo y empezar nueva sección
self.play(*[FadeOut(mob) for mob in self.mobjects], run_time=0.8)
self.wait(0.3)
```

### Transición con título de sección
```python
# Mostrar brevemente el nombre de la nueva sección
seccion = Text("2. Entrenamiento", font_size=36, color=AZUL_PRINCIPAL)
self.play(FadeIn(seccion, scale=0.8))
self.wait(0.8)
self.play(FadeOut(seccion))
```

### Zoom a detalle
```python
# Enfocar una parte específica
self.play(
    self.camera.frame.animate.set_width(4).move_to(punto_interes),
    run_time=1.5,
)
# ... mostrar detalle ...
self.play(
    self.camera.frame.animate.set_width(14).move_to(ORIGIN),
    run_time=1,
)
```

## Timing recomendado

```
Título de escena:        1.5 - 2 segundos
Aparición de elemento:   0.5 - 1 segundo
Transición:              0.8 - 1.2 segundos
Pausa para leer texto:   1 - 2 segundos
Pausa para leer fórmula: 2 - 3 segundos
Animación de datos:      2 - 4 segundos
Espera final:            2 - 3 segundos
```

## Marca de agua / Branding

```python
# Agregar marca de agua sutil en la esquina
marca = Text("Tu Academia", font_size=14, color=WHITE)
marca.set_opacity(0.3)
marca.to_corner(DR, buff=0.3)
self.add(marca)  # Usar add (sin animación) para que esté siempre
```

## Template completo de escena

```python
from manim import *

# --- Colores de la academia ---
FONDO = "#1A1A2E"
AZUL = "#2196F3"
VERDE = "#4CAF50"
NARANJA = "#FF9800"
ROJO = "#F44336"
GRIS = "#ECEFF1"

class PlantillaEscena(Scene):
    def construct(self):
        # Configuración inicial
        self.camera.background_color = FONDO

        # Marca de agua (opcional)
        marca = Text("Mi Academia", font_size=14, color=WHITE, opacity=0.3)
        marca.to_corner(DR, buff=0.3)
        self.add(marca)

        # --- SECCIÓN 1: Título ---
        titulo = Text("Nombre del Tema", font_size=48, color=WHITE)
        subtitulo = Text("Descripción breve", font_size=28, color=GRIS)
        subtitulo.next_to(titulo, DOWN, buff=0.3)

        self.play(Write(titulo), run_time=1.5)
        self.play(FadeIn(subtitulo, shift=UP * 0.2))
        self.wait(1.5)
        self.play(FadeOut(titulo, subtitulo))

        # --- SECCIÓN 2: Contenido principal ---
        # [Tu contenido aquí]

        # --- SECCIÓN 3: Resumen ---
        # [Puntos clave]

        self.wait(2)

# Renderizar:
# Prueba:     manim -pql archivo.py PlantillaEscena
# Producción: manim -pqh archivo.py PlantillaEscena
```
