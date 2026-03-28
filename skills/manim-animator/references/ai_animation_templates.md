# Templates de Animación — Inteligencia Artificial & Machine Learning

## Tabla de contenidos
1. [Red neuronal con capas](#red-neuronal)
2. [Forward propagation](#forward-propagation)
3. [Gradiente descendente 2D](#gradiente-descendente-2d)
4. [Gradiente descendente 3D](#gradiente-descendente-3d)
5. [Árbol de decisión](#árbol-de-decisión)
6. [K-means clustering](#k-means-clustering)
7. [Pipeline de ML](#pipeline-de-ml)
8. [Attention mechanism](#attention-mechanism)

---

## Red neuronal

```python
from manim import *

FONDO = "#1A1A2E"
AZUL = "#2196F3"
VERDE = "#4CAF50"
NARANJA = "#FF9800"
GRIS = "#ECEFF1"

class RedNeuronal(Scene):
    def construct(self):
        self.camera.background_color = FONDO

        titulo = Text("Red Neuronal Feedforward", font_size=36, color=WHITE)
        titulo.to_edge(UP, buff=0.5)

        # Definir arquitectura: [entradas, capa_oculta_1, capa_oculta_2, salida]
        capas = [3, 4, 4, 2]
        colores_capa = [AZUL, VERDE, VERDE, NARANJA]

        # Crear neuronas (círculos)
        neuronas = VGroup()
        posiciones = {}  # Guardar posiciones para las conexiones
        espacio_x = 2.5
        start_x = -(len(capas) - 1) * espacio_x / 2

        for i, n_neuronas in enumerate(capas):
            capa = VGroup()
            espacio_y = 1.2
            start_y = (n_neuronas - 1) * espacio_y / 2

            for j in range(n_neuronas):
                neurona = Circle(
                    radius=0.25,
                    color=colores_capa[i],
                    fill_opacity=0.3,
                    stroke_width=2,
                )
                x = start_x + i * espacio_x
                y = start_y - j * espacio_y
                neurona.move_to([x, y, 0])
                capa.add(neurona)
                posiciones[(i, j)] = [x, y, 0]

            neuronas.add(capa)

        # Crear conexiones entre capas
        conexiones = VGroup()
        for i in range(len(capas) - 1):
            for j in range(capas[i]):
                for k in range(capas[i + 1]):
                    linea = Line(
                        posiciones[(i, j)],
                        posiciones[(i + 1, k)],
                        color=GRIS,
                        stroke_width=0.8,
                        stroke_opacity=0.4,
                    )
                    conexiones.add(linea)

        # Etiquetas de capas
        nombres_capas = ["Entrada", "Oculta 1", "Oculta 2", "Salida"]
        etiquetas = VGroup(*[
            Text(nombre, font_size=18, color=colores_capa[i])
            .move_to([start_x + i * espacio_x, -3.2, 0])
            for i, nombre in enumerate(nombres_capas)
        ])

        # Animación
        self.play(Write(titulo))
        self.play(FadeIn(conexiones), run_time=1)

        # Neuronas aparecen por capa con efecto cascada
        for capa in neuronas:
            self.play(
                LaggedStart(*[GrowFromCenter(n) for n in capa], lag_ratio=0.15),
                run_time=0.8,
            )

        self.play(
            LaggedStart(*[Write(e) for e in etiquetas], lag_ratio=0.2),
            run_time=1,
        )
        self.wait(2)

# Renderizar: manim -pql archivo.py RedNeuronal
```

## Forward propagation

```python
from manim import *

FONDO = "#1A1A2E"
AZUL = "#2196F3"
VERDE = "#4CAF50"
NARANJA = "#FF9800"
AMARILLO = "#FFEB3B"

class ForwardPropagation(Scene):
    def construct(self):
        self.camera.background_color = FONDO

        titulo = Text("Forward Propagation", font_size=36, color=WHITE)
        titulo.to_edge(UP, buff=0.5)

        # Red simplificada: 2 → 3 → 1
        capas = [2, 3, 1]
        espacio_x = 3
        start_x = -(len(capas) - 1) * espacio_x / 2

        # Crear neuronas y guardar referencias
        todas_neuronas = []
        for i, n in enumerate(capas):
            capa_neuronas = []
            espacio_y = 1.5
            start_y = (n - 1) * espacio_y / 2
            for j in range(n):
                neurona = Circle(
                    radius=0.35,
                    color=AZUL if i == 0 else (VERDE if i < len(capas)-1 else NARANJA),
                    fill_opacity=0.2,
                    stroke_width=2,
                )
                neurona.move_to([start_x + i * espacio_x, start_y - j * espacio_y, 0])
                capa_neuronas.append(neurona)
            todas_neuronas.append(capa_neuronas)

        # Conexiones
        conexiones = VGroup()
        conexiones_por_capa = []
        for i in range(len(capas) - 1):
            capa_conex = []
            for j in range(capas[i]):
                for k in range(capas[i + 1]):
                    linea = Line(
                        todas_neuronas[i][j].get_center(),
                        todas_neuronas[i + 1][k].get_center(),
                        color=WHITE,
                        stroke_width=1,
                        stroke_opacity=0.3,
                    )
                    conexiones.add(linea)
                    capa_conex.append(linea)
            conexiones_por_capa.append(capa_conex)

        # Mostrar red estática
        todas_vgroup = VGroup(*[n for capa in todas_neuronas for n in capa])
        self.play(Write(titulo))
        self.play(FadeIn(conexiones), FadeIn(todas_vgroup), run_time=1.5)
        self.wait(0.5)

        # Valores de entrada
        inputs = ["0.5", "0.8"]
        for idx, val in enumerate(inputs):
            texto = Text(val, font_size=20, color=AMARILLO)
            texto.move_to(todas_neuronas[0][idx].get_center())
            self.play(FadeIn(texto, scale=1.5), run_time=0.3)

        # Animar propagación capa por capa
        for i in range(len(capas) - 1):
            # Iluminar conexiones de esta capa
            pulsos = []
            for conex in conexiones_por_capa[i]:
                pulso = conex.copy()
                pulso.set_stroke(AMARILLO, width=3, opacity=1)
                pulsos.append(pulso)

            self.play(
                *[Create(p) for p in pulsos],
                run_time=0.8,
            )

            # Activar neuronas de la siguiente capa
            for neurona in todas_neuronas[i + 1]:
                self.play(
                    neurona.animate.set_fill(AMARILLO, opacity=0.6),
                    run_time=0.3,
                )

            # Desvanecer pulsos
            self.play(*[FadeOut(p) for p in pulsos], run_time=0.3)

        # Resultado final
        resultado = Text("Predicción: 0.73", font_size=24, color=NARANJA)
        resultado.next_to(todas_neuronas[-1][0], RIGHT, buff=0.5)
        self.play(Write(resultado))
        self.wait(2)

# Renderizar: manim -pql archivo.py ForwardPropagation
```

## Gradiente descendente 2D

```python
from manim import *
import numpy as np

FONDO = "#1A1A2E"
AZUL = "#2196F3"
ROJO = "#F44336"
VERDE = "#4CAF50"

class GradienteDescendente2D(Scene):
    def construct(self):
        self.camera.background_color = FONDO

        titulo = Text("Gradiente Descendente", font_size=36, color=WHITE)
        titulo.to_edge(UP, buff=0.5)

        # Función de costo: f(x) = x^2 + 1
        ejes = Axes(
            x_range=[-4, 4, 1],
            y_range=[0, 10, 2],
            x_length=8,
            y_length=5,
            axis_config={"include_numbers": True, "font_size": 18},
        ).shift(DOWN * 0.3)

        etiquetas = ejes.get_axis_labels(
            x_label=MathTex("w"),
            y_label=MathTex("J(w)"),
        )

        # Graficar función de costo
        funcion = ejes.plot(lambda x: x**2 + 1, color=AZUL, stroke_width=3)

        # Fórmula del gradiente
        formula = MathTex(
            r"w_{nuevo} = w - \alpha \cdot \frac{\partial J}{\partial w}",
            font_size=28,
            color=WHITE,
        )
        formula.to_corner(UR, buff=0.5)

        # Simular pasos del gradiente descendente
        lr = 0.3  # Learning rate
        w = 3.5   # Punto inicial

        # Calcular trayectoria
        trayectoria = [w]
        for _ in range(8):
            grad = 2 * w  # Derivada de x^2 + 1
            w = w - lr * grad
            trayectoria.append(w)

        # Crear punto que se mueve
        punto = Dot(
            ejes.coords_to_point(trayectoria[0], trayectoria[0]**2 + 1),
            color=ROJO,
            radius=0.12,
        )

        # Animación
        self.play(Write(titulo))
        self.play(Create(ejes), Write(etiquetas), run_time=1)
        self.play(Create(funcion), run_time=1.5)
        self.play(Write(formula))
        self.play(GrowFromCenter(punto))
        self.wait(0.5)

        # Animar cada paso del gradiente
        for i in range(len(trayectoria) - 1):
            w_actual = trayectoria[i]
            w_nuevo = trayectoria[i + 1]

            # Línea tangente (visualiza el gradiente)
            tangente = ejes.plot(
                lambda x, w=w_actual: 2 * w * (x - w) + (w**2 + 1),
                x_range=[w_actual - 1, w_actual + 1],
                color=VERDE,
                stroke_width=2,
                stroke_opacity=0.6,
            )

            nuevo_punto = ejes.coords_to_point(w_nuevo, w_nuevo**2 + 1)

            self.play(Create(tangente), run_time=0.3)
            self.play(
                punto.animate.move_to(nuevo_punto),
                FadeOut(tangente),
                run_time=0.5,
            )

        # Indicar el mínimo
        minimo_label = Text("¡Mínimo!", font_size=24, color=VERDE)
        minimo_label.next_to(punto, DOWN, buff=0.3)
        self.play(Write(minimo_label))
        self.wait(2)

# Renderizar: manim -pql archivo.py GradienteDescendente2D
```

## Gradiente descendente 3D

```python
from manim import *
import numpy as np

FONDO = "#1A1A2E"

class GradienteDescendente3D(ThreeDScene):
    def construct(self):
        self.camera.background_color = FONDO

        # Ejes 3D
        ejes = ThreeDAxes(
            x_range=[-3, 3, 1],
            y_range=[-3, 3, 1],
            z_range=[0, 10, 2],
            x_length=6,
            y_length=6,
            z_length=4,
        )

        # Superficie: f(x,y) = x^2 + y^2 (paraboloide)
        superficie = Surface(
            lambda u, v: ejes.c2p(u, v, u**2 + v**2),
            u_range=[-2.5, 2.5],
            v_range=[-2.5, 2.5],
            resolution=(30, 30),
        )
        superficie.set_style(fill_opacity=0.6)
        superficie.set_fill_by_value(
            axes=ejes,
            colorscale=[(BLUE, 0), (GREEN, 3), (YELLOW, 6), (RED, 10)],
        )

        # Posicionar cámara
        self.set_camera_orientation(phi=60 * DEGREES, theta=-45 * DEGREES)

        # Trayectoria del gradiente descendente
        lr = 0.3
        pos = np.array([2.0, 2.0])
        trayectoria = [pos.copy()]
        for _ in range(10):
            grad = 2 * pos  # Gradiente de x^2 + y^2
            pos = pos - lr * grad
            trayectoria.append(pos.copy())

        # Crear puntos de la trayectoria
        puntos_3d = [
            Dot3D(
                ejes.c2p(p[0], p[1], p[0]**2 + p[1]**2),
                color=RED,
                radius=0.08,
            )
            for p in trayectoria
        ]

        # Líneas entre puntos
        lineas = [
            Line3D(
                ejes.c2p(trayectoria[i][0], trayectoria[i][1],
                         trayectoria[i][0]**2 + trayectoria[i][1]**2),
                ejes.c2p(trayectoria[i+1][0], trayectoria[i+1][1],
                         trayectoria[i+1][0]**2 + trayectoria[i+1][1]**2),
                color=YELLOW,
                stroke_width=2,
            )
            for i in range(len(trayectoria) - 1)
        ]

        # Animación
        self.play(Create(ejes), run_time=1)
        self.play(Create(superficie), run_time=2)
        self.wait(0.5)

        # Mostrar trayectoria paso a paso
        self.play(Create(puntos_3d[0]))
        for i in range(len(lineas)):
            self.play(
                Create(lineas[i]),
                Create(puntos_3d[i + 1]),
                run_time=0.4,
            )

        # Rotación para apreciar la superficie
        self.begin_ambient_camera_rotation(rate=0.3)
        self.wait(4)
        self.stop_ambient_camera_rotation()

# Renderizar: manim -pql archivo.py GradienteDescendente3D
```

## Árbol de decisión

```python
from manim import *

FONDO = "#1A1A2E"
AZUL = "#2196F3"
VERDE = "#4CAF50"
NARANJA = "#FF9800"
ROJO = "#F44336"

class ArbolDecision(Scene):
    def construct(self):
        self.camera.background_color = FONDO

        titulo = Text("Árbol de Decisión", font_size=36, color=WHITE)
        titulo.to_edge(UP, buff=0.3)

        # Nodos del árbol
        def crear_nodo(texto, color, pos, es_hoja=False):
            if es_hoja:
                forma = Rectangle(width=1.8, height=0.7, color=color, fill_opacity=0.4)
            else:
                forma = RoundedRectangle(
                    width=2.2, height=0.8, corner_radius=0.15,
                    color=color, fill_opacity=0.3,
                )
            forma.move_to(pos)
            label = Text(texto, font_size=16, color=WHITE)
            label.move_to(forma.get_center())
            return VGroup(forma, label)

        # Estructura del árbol
        raiz = crear_nodo("Edad > 30?", AZUL, [0, 2, 0])
        nodo_izq = crear_nodo("Ingreso > 50k?", VERDE, [-3, 0, 0])
        nodo_der = crear_nodo("Experiencia > 5?", VERDE, [3, 0, 0])
        hoja_1 = crear_nodo("No Aprobado", ROJO, [-4.5, -2, 0], es_hoja=True)
        hoja_2 = crear_nodo("Aprobado", VERDE, [-1.5, -2, 0], es_hoja=True)
        hoja_3 = crear_nodo("Aprobado", VERDE, [1.5, -2, 0], es_hoja=True)
        hoja_4 = crear_nodo("No Aprobado", ROJO, [4.5, -2, 0], es_hoja=True)

        # Conexiones
        def crear_arista(padre, hijo, label_texto, lado):
            linea = Line(
                padre[0].get_bottom(),
                hijo[0].get_top(),
                color=WHITE,
                stroke_width=1.5,
            )
            label = Text(label_texto, font_size=14, color=NARANJA)
            label.move_to(linea.get_center())
            label.shift(LEFT * 0.4 if lado == "izq" else RIGHT * 0.4)
            return VGroup(linea, label)

        arista_1 = crear_arista(raiz, nodo_izq, "Sí", "izq")
        arista_2 = crear_arista(raiz, nodo_der, "No", "der")
        arista_3 = crear_arista(nodo_izq, hoja_1, "No", "izq")
        arista_4 = crear_arista(nodo_izq, hoja_2, "Sí", "der")
        arista_5 = crear_arista(nodo_der, hoja_3, "Sí", "izq")
        arista_6 = crear_arista(nodo_der, hoja_4, "No", "der")

        # Animación: construir el árbol nodo por nodo
        self.play(Write(titulo))
        self.play(Create(raiz), run_time=1)
        self.wait(0.3)

        # Nivel 1
        self.play(Create(arista_1), Create(arista_2), run_time=0.8)
        self.play(Create(nodo_izq), Create(nodo_der), run_time=0.8)
        self.wait(0.3)

        # Nivel 2 (hojas)
        self.play(
            Create(arista_3), Create(arista_4),
            Create(arista_5), Create(arista_6),
            run_time=0.8,
        )
        self.play(
            Create(hoja_1), Create(hoja_2),
            Create(hoja_3), Create(hoja_4),
            run_time=0.8,
        )
        self.wait(2)

# Renderizar: manim -pql archivo.py ArbolDecision
```

## K-means clustering

```python
from manim import *
import numpy as np

FONDO = "#1A1A2E"
AZUL = "#2196F3"
VERDE = "#4CAF50"
ROJO = "#F44336"

class KMeansClustering(Scene):
    def construct(self):
        self.camera.background_color = FONDO

        titulo = Text("K-Means Clustering", font_size=36, color=WHITE)
        titulo.to_edge(UP, buff=0.5)

        ejes = Axes(
            x_range=[-1, 10, 1],
            y_range=[-1, 10, 1],
            x_length=7,
            y_length=5.5,
            axis_config={"include_numbers": False, "font_size": 16},
        )

        # Generar 3 clusters de datos
        np.random.seed(42)
        cluster_1 = np.random.randn(8, 2) * 0.8 + [2, 7]
        cluster_2 = np.random.randn(8, 2) * 0.8 + [7, 7]
        cluster_3 = np.random.randn(8, 2) * 0.8 + [5, 2]
        todos_datos = np.vstack([cluster_1, cluster_2, cluster_3])

        colores_cluster = [AZUL, VERDE, ROJO]

        # Crear puntos (inicialmente todos grises)
        puntos = VGroup(*[
            Dot(ejes.coords_to_point(x, y), color=GREY, radius=0.07)
            for x, y in todos_datos
        ])

        # Centroides iniciales (posiciones aleatorias)
        centroides_pos = [[3, 5], [6, 4], [4, 8]]
        centroides = VGroup(*[
            Dot(ejes.coords_to_point(x, y), color=c, radius=0.15, fill_opacity=0.9)
            .set_stroke(WHITE, width=2)
            for (x, y), c in zip(centroides_pos, colores_cluster)
        ])

        # Animación
        self.play(Write(titulo))
        self.play(Create(ejes), run_time=0.8)
        self.play(
            LaggedStart(*[GrowFromCenter(p) for p in puntos], lag_ratio=0.05),
            run_time=1.5,
        )
        self.wait(0.5)

        # Mostrar centroides iniciales
        cent_label = Text("Centroides iniciales", font_size=20, color=WHITE)
        cent_label.to_edge(DOWN, buff=0.3)
        self.play(
            *[GrowFromCenter(c) for c in centroides],
            Write(cent_label),
            run_time=1,
        )
        self.wait(0.5)

        # Simular 3 iteraciones de K-means
        for iteracion in range(3):
            iter_label = Text(
                f"Iteración {iteracion + 1}", font_size=20, color=WHITE
            )
            iter_label.to_edge(DOWN, buff=0.3)
            self.play(ReplacementTransform(cent_label, iter_label), run_time=0.5)
            cent_label = iter_label

            # Asignar puntos al centroide más cercano (colorear)
            animaciones = []
            asignaciones = []
            for idx, (x, y) in enumerate(todos_datos):
                distancias = [
                    np.sqrt((x - cx)**2 + (y - cy)**2)
                    for cx, cy in centroides_pos
                ]
                cluster_id = np.argmin(distancias)
                asignaciones.append(cluster_id)
                animaciones.append(
                    puntos[idx].animate.set_color(colores_cluster[cluster_id])
                )

            self.play(*animaciones, run_time=1)
            self.wait(0.3)

            # Mover centroides a la media de su cluster
            nuevos_centroides = []
            for k in range(3):
                miembros = todos_datos[[i for i, a in enumerate(asignaciones) if a == k]]
                if len(miembros) > 0:
                    nuevo = miembros.mean(axis=0)
                else:
                    nuevo = np.array(centroides_pos[k])
                nuevos_centroides.append(nuevo.tolist())

            self.play(*[
                centroides[k].animate.move_to(
                    ejes.coords_to_point(nuevos_centroides[k][0], nuevos_centroides[k][1])
                )
                for k in range(3)
            ], run_time=1)

            centroides_pos = nuevos_centroides
            self.wait(0.5)

        # Final
        final_label = Text("¡Convergencia!", font_size=24, color=VERDE)
        final_label.to_edge(DOWN, buff=0.3)
        self.play(ReplacementTransform(cent_label, final_label))
        self.wait(2)

# Renderizar: manim -pql archivo.py KMeansClustering
```

## Pipeline de ML

```python
from manim import *

FONDO = "#1A1A2E"
AZUL = "#2196F3"
VERDE = "#4CAF50"
NARANJA = "#FF9800"
MORADO = "#9C27B0"
ROJO = "#F44336"

class PipelineML(Scene):
    def construct(self):
        self.camera.background_color = FONDO

        titulo = Text("Pipeline de Machine Learning", font_size=32, color=WHITE)
        titulo.to_edge(UP, buff=0.5)

        # Definir etapas del pipeline
        etapas = [
            ("Datos\nCrudos", AZUL),
            ("Limpieza", VERDE),
            ("Feature\nEngineering", NARANJA),
            ("Modelo\nML", MORADO),
            ("Predicción", ROJO),
        ]

        # Crear bloques
        bloques = VGroup()
        for nombre, color in etapas:
            bloque = VGroup()
            rect = RoundedRectangle(
                width=2, height=1.2, corner_radius=0.15,
                color=color, fill_opacity=0.3, stroke_width=2,
            )
            texto = Text(nombre, font_size=16, color=WHITE)
            texto.move_to(rect.get_center())
            bloque.add(rect, texto)
            bloques.add(bloque)

        bloques.arrange(RIGHT, buff=0.6)

        # Flechas entre bloques
        flechas = VGroup()
        for i in range(len(bloques) - 1):
            flecha = Arrow(
                bloques[i][0].get_right(),
                bloques[i + 1][0].get_left(),
                buff=0.1,
                color=WHITE,
                stroke_width=2,
                max_tip_length_to_length_ratio=0.15,
            )
            flechas.add(flecha)

        # Íconos descriptivos debajo de cada etapa
        descripciones = [
            "CSV, API,\nBase de datos",
            "Nulos, outliers,\nduplicados",
            "Normalización,\nencoding, PCA",
            "Entrenar,\nvalidar, tunear",
            "Nuevos datos\n→ resultado",
        ]

        textos_desc = VGroup()
        for i, desc in enumerate(descripciones):
            t = Text(desc, font_size=12, color=GREY)
            t.next_to(bloques[i], DOWN, buff=0.4)
            textos_desc.add(t)

        # Animación: construir el pipeline paso a paso
        self.play(Write(titulo))
        self.wait(0.5)

        for i in range(len(bloques)):
            self.play(Create(bloques[i]), run_time=0.6)
            if i < len(flechas):
                self.play(GrowFromCenter(flechas[i]), run_time=0.3)

        self.play(
            LaggedStart(*[FadeIn(t, shift=UP * 0.2) for t in textos_desc], lag_ratio=0.15),
            run_time=1.5,
        )

        # Animar "flujo de datos" con un punto que recorre el pipeline
        punto_dato = Dot(color=YELLOW, radius=0.1)
        punto_dato.move_to(bloques[0][0].get_left() + LEFT * 0.5)

        self.play(GrowFromCenter(punto_dato))
        for i in range(len(bloques)):
            self.play(
                punto_dato.animate.move_to(bloques[i][0].get_center()),
                bloques[i][0].animate.set_fill(etapas[i][1], opacity=0.6),
                run_time=0.6,
            )
            self.play(
                bloques[i][0].animate.set_fill(etapas[i][1], opacity=0.3),
                run_time=0.3,
            )

        self.play(FadeOut(punto_dato))
        self.wait(2)

# Renderizar: manim -pql archivo.py PipelineML
```

## Attention mechanism

```python
from manim import *

FONDO = "#1A1A2E"
AZUL = "#2196F3"
VERDE = "#4CAF50"
NARANJA = "#FF9800"
ROJO = "#F44336"

class AttentionMechanism(Scene):
    def construct(self):
        self.camera.background_color = FONDO

        titulo = Text("Self-Attention (Transformers)", font_size=32, color=WHITE)
        titulo.to_edge(UP, buff=0.5)

        # Tokens de entrada
        palabras = ["El", "gato", "se", "sentó"]
        tokens = VGroup()
        for palabra in palabras:
            rect = RoundedRectangle(
                width=1.5, height=0.7, corner_radius=0.1,
                color=AZUL, fill_opacity=0.3,
            )
            texto = Text(palabra, font_size=20, color=WHITE)
            texto.move_to(rect.get_center())
            tokens.add(VGroup(rect, texto))

        tokens.arrange(RIGHT, buff=0.5)
        tokens.shift(UP * 1)

        # Pesos de atención para "gato" (segundo token)
        # Simular que "gato" presta atención a todos los tokens
        pesos = [0.1, 0.5, 0.05, 0.35]  # El, gato, se, sentó
        colores_peso = [
            interpolate_color(GREY, ROJO, w * 2) for w in pesos
        ]

        # Flechas de atención desde "gato" a todos
        flechas_atencion = VGroup()
        pesos_labels = VGroup()
        for i, (peso, color) in enumerate(zip(pesos, colores_peso)):
            flecha = Arrow(
                tokens[1][0].get_bottom(),
                tokens[i][0].get_top() if i != 1 else tokens[i][0].get_bottom() + DOWN * 0.5,
                color=color,
                stroke_width=peso * 8,  # Grosor proporcional al peso
                buff=0.1,
                max_tip_length_to_length_ratio=0.2,
            )
            if i == 1:
                # Auto-atención: curva hacia abajo
                flecha = CurvedArrow(
                    tokens[1][0].get_bottom() + LEFT * 0.2,
                    tokens[1][0].get_bottom() + RIGHT * 0.2,
                    angle=-PI,
                    color=color,
                    stroke_width=peso * 8,
                )

            label = Text(f"{peso:.2f}", font_size=14, color=color)
            label.next_to(flecha, DOWN, buff=0.1)

            flechas_atencion.add(flecha)
            pesos_labels.add(label)

        # Fórmula de atención
        formula = MathTex(
            r"\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V",
            font_size=28,
            color=WHITE,
        )
        formula.to_edge(DOWN, buff=0.8)

        # Etiqueta Q, K, V
        qkv_labels = VGroup(
            Text("Query", font_size=16, color=ROJO),
            Text("Key", font_size=16, color=VERDE),
            Text("Value", font_size=16, color=NARANJA),
        )
        qkv_labels.arrange(RIGHT, buff=1)
        qkv_labels.next_to(formula, UP, buff=0.5)

        # Animación
        self.play(Write(titulo))

        # Mostrar tokens
        self.play(
            LaggedStart(*[Create(t) for t in tokens], lag_ratio=0.2),
            run_time=1.5,
        )
        self.wait(0.5)

        # Resaltar "gato" como el token que consulta
        self.play(
            tokens[1][0].animate.set_stroke(ROJO, width=3),
            run_time=0.5,
        )

        consulta_label = Text("← Query", font_size=18, color=ROJO)
        consulta_label.next_to(tokens[1], UP, buff=0.3)
        self.play(Write(consulta_label))

        # Mostrar flechas de atención
        self.play(
            LaggedStart(*[Create(f) for f in flechas_atencion], lag_ratio=0.2),
            run_time=1.5,
        )
        self.play(
            LaggedStart(*[Write(l) for l in pesos_labels], lag_ratio=0.2),
            run_time=1,
        )

        # Mostrar fórmula
        self.play(Write(qkv_labels), run_time=0.8)
        self.play(Write(formula), run_time=1.5)
        self.wait(2)

# Renderizar: manim -pql archivo.py AttentionMechanism
```
