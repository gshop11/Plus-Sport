# Guía de ManimCE desde Cero

## Tabla de contenidos
1. [Instalación](#instalación)
2. [Estructura básica](#estructura-básica)
3. [Objetos (Mobjects)](#objetos-mobjects)
4. [Animaciones](#animaciones)
5. [Posicionamiento](#posicionamiento)
6. [Grupos](#grupos)
7. [Texto y fórmulas](#texto-y-fórmulas)
8. [Ejes y gráficos](#ejes-y-gráficos)
9. [Colores y estilos](#colores-y-estilos)
10. [Cámara y 3D](#cámara-y-3d)
11. [Updaters y ValueTracker](#updaters-y-valuetracker)
12. [Renderizado](#renderizado)

---

## Instalación

```bash
pip install manim
# Para LaTeX (necesario para MathTex):
# Windows: instalar MiKTeX desde https://miktex.org/
# Mac: brew install --cask mactex
# Linux: sudo apt install texlive-full
```

## Estructura básica

Todo en Manim ocurre dentro de una clase que hereda de `Scene`. El método `construct()` es donde va toda la lógica:

```python
from manim import *

class MiPrimeraEscena(Scene):
    def construct(self):
        # Crear un círculo azul
        circulo = Circle(color=BLUE, fill_opacity=0.5)

        # Mostrarlo en pantalla con animación
        self.play(Create(circulo))

        # Esperar 2 segundos
        self.wait(2)
```

**Renderizar:** `manim -pql mi_archivo.py MiPrimeraEscena`

## Objetos (Mobjects)

Los Mobjects son todos los objetos visuales en Manim.

### Formas geométricas
```python
circulo = Circle(radius=1, color=BLUE, fill_opacity=0.5)
cuadrado = Square(side_length=2, color=RED)
rectangulo = Rectangle(width=4, height=2, color=GREEN)
linea = Line(start=LEFT * 2, end=RIGHT * 2, color=WHITE)
flecha = Arrow(start=LEFT, end=RIGHT, color=YELLOW)
punto = Dot(point=ORIGIN, color=WHITE, radius=0.08)
triangulo = Triangle(color=PURPLE)
```

### Constantes de dirección
```python
UP    = [0, 1, 0]   # Arriba
DOWN  = [0, -1, 0]  # Abajo
LEFT  = [-1, 0, 0]  # Izquierda
RIGHT = [1, 0, 0]   # Derecha
ORIGIN = [0, 0, 0]  # Centro
UL = UP + LEFT       # Arriba-izquierda
UR = UP + RIGHT      # Arriba-derecha
DL = DOWN + LEFT     # Abajo-izquierda
DR = DOWN + RIGHT    # Abajo-derecha
```

## Animaciones

### Crear y mostrar objetos
```python
self.play(Create(circulo))          # Dibuja el contorno y rellena
self.play(DrawBorderThenFill(obj))  # Dibuja borde, luego rellena
self.play(Write(texto))             # Efecto de escritura (ideal para texto)
self.play(FadeIn(obj))              # Aparece gradualmente
self.play(FadeIn(obj, shift=UP))    # Aparece deslizándose desde abajo
self.play(GrowFromCenter(obj))      # Crece desde el centro
```

### Quitar objetos
```python
self.play(FadeOut(obj))             # Desaparece gradualmente
self.play(FadeOut(obj, shift=DOWN)) # Desaparece deslizándose hacia abajo
self.play(Uncreate(obj))            # Inverso de Create
```

### Transformar objetos
```python
# Transform: obj1 se convierte en obj2, pero obj1 sigue siendo la referencia
self.play(Transform(obj1, obj2))

# ReplacementTransform: obj1 se convierte en obj2, y obj2 es la nueva referencia
self.play(ReplacementTransform(obj1, obj2))
```

### Animar propiedades con .animate
```python
self.play(cuadrado.animate.shift(UP * 2))           # Mover
self.play(cuadrado.animate.scale(2))                 # Escalar
self.play(cuadrado.animate.rotate(PI / 4))           # Rotar 45°
self.play(cuadrado.animate.set_color(RED))           # Cambiar color
self.play(cuadrado.animate.set_fill(BLUE, opacity=0.8))  # Rellenar

# Encadenar múltiples cambios
self.play(cuadrado.animate.shift(RIGHT).scale(0.5).set_color(GREEN))
```

### Controlar timing
```python
self.play(Create(obj), run_time=2)         # Duración de 2 segundos
self.play(Create(obj), rate_func=smooth)   # Función de velocidad
self.play(Create(obj), rate_func=linear)   # Velocidad constante
self.wait(1.5)                             # Pausa de 1.5 segundos
```

### Múltiples animaciones
```python
# Simultáneas
self.play(Create(obj1), FadeIn(obj2))

# Con retraso en cascada
self.play(LaggedStart(
    Create(obj1), Create(obj2), Create(obj3),
    lag_ratio=0.3
))

# Secuenciales en un solo play
self.play(Succession(
    Create(obj1), Create(obj2), Create(obj3)
))

# AnimationGroup con lag_ratio
self.play(AnimationGroup(
    *[Create(obj) for obj in lista_objetos],
    lag_ratio=0.2
))
```

## Posicionamiento

```python
# Posición absoluta
obj.move_to(ORIGIN)            # Centro de la pantalla
obj.move_to([2, 1, 0])         # Coordenadas específicas

# Relativo a otro objeto
obj2.next_to(obj1, RIGHT, buff=0.5)   # A la derecha con espacio de 0.5
obj2.next_to(obj1, DOWN, buff=0.3)    # Debajo con espacio de 0.3

# Bordes de la pantalla
obj.to_edge(UP, buff=0.5)     # Borde superior
obj.to_edge(LEFT)             # Borde izquierdo
obj.to_corner(UR)             # Esquina superior derecha

# Desplazar
obj.shift(RIGHT * 2)          # Mover 2 unidades a la derecha
obj.shift(UP * 1 + LEFT * 0.5)  # Combinación de movimientos

# Alinear
obj2.align_to(obj1, UP)       # Alinear bordes superiores
```

## Grupos

```python
# Agrupar objetos
grupo = VGroup(obj1, obj2, obj3)

# Organizar en fila o columna
grupo.arrange(RIGHT, buff=0.5)    # Fila horizontal
grupo.arrange(DOWN, buff=0.3)     # Columna vertical

# Cuadrícula
grupo.arrange_in_grid(rows=2, cols=3, buff=0.5)

# Operaciones sobre el grupo completo
self.play(Create(grupo))          # Crear todo el grupo
grupo.shift(UP)                   # Mover todo el grupo
grupo.scale(0.8)                  # Escalar todo

# Acceder a elementos individuales
grupo[0].set_color(RED)           # Primer elemento
grupo[-1].set_color(BLUE)         # Último elemento
```

## Texto y fórmulas

### Texto simple
```python
# Texto normal (no necesita LaTeX)
texto = Text("Hola Mundo", font_size=48, color=WHITE)
texto_chico = Text("subtítulo", font_size=24, color=GREY)

# Con formato
texto_bold = Text("Importante", weight=BOLD, font_size=36)
texto_italic = Text("nota", slant=ITALIC, font_size=28)
```

### Fórmulas LaTeX
```python
# Fórmula matemática
formula = MathTex(r"E = mc^2", font_size=48)

# Fórmula con partes coloreables (usar {{ }})
formula = MathTex(r"{{ y }} = {{ m }}{{ x }} + {{ b }}")
formula.set_color_by_tex("y", BLUE)
formula.set_color_by_tex("m", GREEN)

# Texto con LaTeX inline
texto_latex = Tex(r"La fórmula es $E = mc^2$", font_size=36)
```

### MarkupText (formato HTML-like)
```python
texto = MarkupText(
    'Esto es <span foreground="red">rojo</span> y '
    '<b>negrita</b>',
    font_size=36
)
```

## Ejes y gráficos

### Ejes 2D
```python
ejes = Axes(
    x_range=[-1, 10, 1],      # [min, max, paso]
    y_range=[-1, 10, 1],
    x_length=8,                 # Longitud visual del eje X
    y_length=5,                 # Longitud visual del eje Y
    axis_config={
        "include_numbers": True,
        "font_size": 24,
    },
    tips=True,                  # Flechas en los extremos
)

# Etiquetas de ejes
etiquetas = ejes.get_axis_labels(
    x_label="x",
    y_label="f(x)"
)

# Graficar una función
grafica = ejes.plot(
    lambda x: x**2,
    color=BLUE,
    x_range=[0, 3],
)

# Área bajo la curva
area = ejes.get_area(grafica, x_range=[0, 2], color=BLUE, opacity=0.3)

self.play(Create(ejes), Write(etiquetas))
self.play(Create(grafica))
self.play(FadeIn(area))
```

### Gráfico de barras
```python
chart = BarChart(
    values=[3, 5, 2, 8, 4],
    bar_names=["A", "B", "C", "D", "E"],
    y_range=[0, 10, 2],
    y_length=5,
    x_length=8,
    bar_colors=[BLUE, GREEN, RED, YELLOW, PURPLE],
)

self.play(Create(chart))

# Animar cambio de valores
self.play(chart.animate.change_bar_values([5, 3, 7, 2, 9]))
```

### NumberPlane (plano cartesiano con cuadrícula)
```python
plano = NumberPlane(
    x_range=[-5, 5, 1],
    y_range=[-5, 5, 1],
    background_line_style={
        "stroke_opacity": 0.4,
    }
)
self.play(Create(plano))
```

### Puntos en ejes (para scatter plots)
```python
datos = [(1, 2), (2, 4), (3, 3), (4, 7), (5, 5)]
puntos = VGroup(*[
    Dot(ejes.coords_to_point(x, y), color=BLUE, radius=0.08)
    for x, y in datos
])

# Aparecer uno a uno con efecto cascada
self.play(LaggedStart(*[Create(p) for p in puntos], lag_ratio=0.2))
```

## Colores y estilos

### Colores predefinidos
```python
# Básicos
RED, GREEN, BLUE, YELLOW, PURPLE, ORANGE, WHITE, BLACK, GREY

# Variantes
BLUE_A, BLUE_B, BLUE_C, BLUE_D, BLUE_E  # De claro a oscuro
# Igual para RED, GREEN, YELLOW, etc.

# Especiales
TEAL, MAROON, GOLD, PINK
```

### Colores personalizados
```python
from manim import ManimColor

mi_color = ManimColor.from_hex("#2196F3")
otro_color = ManimColor.from_rgb([0.5, 0.8, 0.2])  # Valores 0.0 a 1.0
```

### Aplicar estilos
```python
obj.set_color(RED)                          # Color general
obj.set_fill(BLUE, opacity=0.5)             # Relleno
obj.set_stroke(WHITE, width=2)              # Contorno
obj.set_opacity(0.7)                        # Transparencia general
```

## Cámara y 3D

### Escenas 3D
```python
class Escena3D(ThreeDScene):
    def construct(self):
        # Ejes 3D
        ejes = ThreeDAxes(
            x_range=[-3, 3, 1],
            y_range=[-3, 3, 1],
            z_range=[-3, 3, 1],
        )

        # Superficie
        superficie = Surface(
            lambda u, v: ejes.c2p(u, v, u**2 + v**2),
            u_range=[-2, 2],
            v_range=[-2, 2],
            resolution=(30, 30),
        )
        superficie.set_style(fill_opacity=0.7)
        superficie.set_fill_by_value(
            axes=ejes, colorscale=[(BLUE, -1), (GREEN, 0), (RED, 1)]
        )

        # Posicionar cámara
        self.set_camera_orientation(phi=60 * DEGREES, theta=-45 * DEGREES)

        self.play(Create(ejes), Create(superficie))

        # Rotación automática de cámara
        self.begin_ambient_camera_rotation(rate=0.2)
        self.wait(5)
        self.stop_ambient_camera_rotation()
```

## Updaters y ValueTracker

Permiten crear animaciones dinámicas donde los objetos se actualizan automáticamente.

```python
class AnimacionDinamica(Scene):
    def construct(self):
        # ValueTracker controla un valor numérico
        tracker = ValueTracker(0)

        # always_redraw recrea el objeto en cada frame
        punto = always_redraw(lambda:
            Dot(point=[tracker.get_value(), tracker.get_value()**2, 0], color=RED)
        )

        # Etiqueta que se actualiza
        etiqueta = always_redraw(lambda:
            Text(f"x = {tracker.get_value():.1f}", font_size=24)
            .next_to(punto, UP)
        )

        self.add(punto, etiqueta)

        # Animar el cambio de valor
        self.play(tracker.animate.set_value(3), run_time=3)
        self.play(tracker.animate.set_value(-2), run_time=2)
```

### Updater manual
```python
def actualizar_posicion(obj):
    obj.move_to([tracker.get_value(), 0, 0])

objeto.add_updater(actualizar_posicion)
# ... hacer animaciones ...
objeto.remove_updater(actualizar_posicion)  # Cuando ya no se necesite
```

## Renderizado

### Comandos de renderizado
```bash
# Calidad baja (pruebas rápidas): 854x480, 15fps
manim -pql archivo.py NombreEscena

# Calidad media (vista previa): 1280x720, 30fps
manim -pqm archivo.py NombreEscena

# Calidad alta (producción): 1920x1080, 60fps
manim -pqh archivo.py NombreEscena

# 4K (máxima calidad): 3840x2160, 60fps
manim -pqk archivo.py NombreEscena

# Sin abrir automáticamente (-p = preview)
manim -ql archivo.py NombreEscena

# Guardar como GIF
manim -ql --format gif archivo.py NombreEscena

# Renderizar todas las escenas del archivo
manim -ql archivo.py
```

### Ubicación de los archivos generados
Los videos se guardan en: `media/videos/<nombre_archivo>/<calidad>/`
