# Templates de Animación — Ciencia de Datos

## Tabla de contenidos
1. [Gráfico de barras animado](#gráfico-de-barras-animado)
2. [Scatter plot con puntos progresivos](#scatter-plot)
3. [Línea de regresión que se ajusta](#línea-de-regresión)
4. [Histograma con distribución normal](#histograma)
5. [Matriz de confusión](#matriz-de-confusión)
6. [Curva ROC](#curva-roc)
7. [Box plot comparativo](#box-plot)
8. [Heatmap de correlación](#heatmap-de-correlación)

---

## Gráfico de barras animado

```python
from manim import *

FONDO = "#1A1A2E"
AZUL = "#2196F3"
VERDE = "#4CAF50"
NARANJA = "#FF9800"
ROJO = "#F44336"

class GraficoBarras(Scene):
    def construct(self):
        self.camera.background_color = FONDO

        # Título de la visualización
        titulo = Text("Ventas por Trimestre", font_size=36, color=WHITE)
        titulo.to_edge(UP, buff=0.5)

        # Crear gráfico de barras con valores iniciales
        chart = BarChart(
            values=[3, 5, 7, 4],
            bar_names=["Q1", "Q2", "Q3", "Q4"],
            y_range=[0, 10, 2],
            y_length=4,
            x_length=8,
            bar_colors=[AZUL, VERDE, NARANJA, ROJO],
            bar_fill_opacity=0.8,
        )

        # Animación: mostrar título y luego el gráfico
        self.play(Write(titulo))
        self.play(Create(chart), run_time=2)
        self.wait(1)

        # Animar cambio de valores (por ejemplo, año siguiente)
        etiqueta = Text("Proyección 2025", font_size=24, color=VERDE)
        etiqueta.next_to(chart, DOWN, buff=0.5)

        self.play(
            chart.animate.change_bar_values([6, 8, 5, 9]),
            FadeIn(etiqueta),
            run_time=2,
            rate_func=smooth,
        )
        self.wait(2)

# Renderizar: manim -pql archivo.py GraficoBarras
```

## Scatter plot

```python
from manim import *
import numpy as np

FONDO = "#1A1A2E"
AZUL = "#2196F3"
VERDE = "#4CAF50"

class ScatterPlot(Scene):
    def construct(self):
        self.camera.background_color = FONDO

        # Crear ejes
        ejes = Axes(
            x_range=[0, 10, 1],
            y_range=[0, 10, 1],
            x_length=7,
            y_length=5,
            axis_config={"include_numbers": True, "font_size": 20},
        )
        etiquetas = ejes.get_axis_labels(
            x_label=Text("Horas de estudio", font_size=20),
            y_label=Text("Calificación", font_size=20),
        )

        # Generar datos simulados
        np.random.seed(42)
        x_datos = np.random.uniform(1, 9, 15)
        y_datos = 0.8 * x_datos + np.random.normal(0, 1, 15)
        y_datos = np.clip(y_datos, 0, 10)

        # Crear puntos como Dots
        puntos = VGroup(*[
            Dot(
                ejes.coords_to_point(x, y),
                color=AZUL,
                radius=0.08,
                fill_opacity=0.8,
            )
            for x, y in zip(x_datos, y_datos)
        ])

        # Animación: ejes primero, luego puntos uno a uno
        self.play(Create(ejes), Write(etiquetas), run_time=1.5)
        self.play(
            LaggedStart(*[GrowFromCenter(p) for p in puntos], lag_ratio=0.1),
            run_time=2,
        )
        self.wait(2)

# Renderizar: manim -pql archivo.py ScatterPlot
```

## Línea de regresión

```python
from manim import *
import numpy as np

FONDO = "#1A1A2E"
AZUL = "#2196F3"
VERDE = "#4CAF50"
NARANJA = "#FF9800"
ROJO = "#F44336"

class RegresionLineal(Scene):
    def construct(self):
        self.camera.background_color = FONDO

        # Crear ejes
        ejes = Axes(
            x_range=[0, 10, 1],
            y_range=[0, 10, 1],
            x_length=7,
            y_length=5,
            axis_config={"include_numbers": True, "font_size": 20},
        )

        # Datos de ejemplo
        np.random.seed(42)
        x_datos = np.array([1, 2, 3, 4, 5, 6, 7, 8])
        y_datos = np.array([1.5, 3.2, 2.8, 5.1, 4.5, 6.8, 6.2, 8.0])

        # Puntos
        puntos = VGroup(*[
            Dot(ejes.coords_to_point(x, y), color=AZUL, radius=0.08)
            for x, y in zip(x_datos, y_datos)
        ])

        # ValueTracker para animar la pendiente y la intersección
        pendiente = ValueTracker(0.2)   # Empieza con una mala línea
        intercepto = ValueTracker(1.0)

        # Línea de regresión que se actualiza dinámicamente
        linea_regresion = always_redraw(lambda:
            ejes.plot(
                lambda x: pendiente.get_value() * x + intercepto.get_value(),
                x_range=[0, 9],
                color=NARANJA,
                stroke_width=3,
            )
        )

        # Líneas de error (residuos) que se actualizan
        residuos = always_redraw(lambda: VGroup(*[
            Line(
                ejes.coords_to_point(x, y),
                ejes.coords_to_point(
                    x, pendiente.get_value() * x + intercepto.get_value()
                ),
                color=ROJO,
                stroke_width=1.5,
                stroke_opacity=0.6,
            )
            for x, y in zip(x_datos, y_datos)
        ]))

        # Fórmula
        formula = MathTex(r"y = mx + b", font_size=36, color=WHITE)
        formula.to_corner(UR, buff=0.5)

        # Animación
        self.play(Create(ejes), run_time=1)
        self.play(LaggedStart(*[GrowFromCenter(p) for p in puntos], lag_ratio=0.15))
        self.wait(0.5)

        self.play(Write(formula))
        self.add(linea_regresion, residuos)
        self.play(FadeIn(linea_regresion))
        self.wait(0.5)

        # Calcular regresión real con numpy
        m_real = np.polyfit(x_datos, y_datos, 1)[0]
        b_real = np.polyfit(x_datos, y_datos, 1)[1]

        # Animar el ajuste de la línea hacia los valores óptimos
        self.play(
            pendiente.animate.set_value(m_real),
            intercepto.animate.set_value(b_real),
            run_time=3,
            rate_func=smooth,
        )

        # Mostrar ecuación final
        ecuacion_final = MathTex(
            f"y = {m_real:.2f}x + {b_real:.2f}",
            font_size=32,
            color=VERDE,
        )
        ecuacion_final.next_to(formula, DOWN, buff=0.3)
        self.play(Write(ecuacion_final))
        self.wait(2)

# Renderizar: manim -pql archivo.py RegresionLineal
```

## Histograma

```python
from manim import *
import numpy as np

FONDO = "#1A1A2E"
AZUL = "#2196F3"
NARANJA = "#FF9800"

class Histograma(Scene):
    def construct(self):
        self.camera.background_color = FONDO

        titulo = Text("Distribución de Alturas", font_size=36, color=WHITE)
        titulo.to_edge(UP, buff=0.5)

        # Simular datos de un histograma (frecuencias por bin)
        # Bins: [150-155, 155-160, 160-165, 165-170, 170-175, 175-180, 180-185]
        frecuencias = [2, 5, 12, 20, 15, 8, 3]
        nombres = ["150", "155", "160", "165", "170", "175", "180"]

        chart = BarChart(
            values=frecuencias,
            bar_names=nombres,
            y_range=[0, 25, 5],
            y_length=4.5,
            x_length=9,
            bar_colors=[AZUL] * len(frecuencias),
            bar_fill_opacity=0.7,
            bar_stroke_width=1,
        )

        # Etiqueta del eje X
        x_label = Text("Altura (cm)", font_size=20, color=WHITE)
        x_label.next_to(chart, DOWN, buff=0.5)

        # Curva normal superpuesta (aproximación visual)
        # Crear puntos que siguen una campana de Gauss
        mu, sigma = 3, 1.2  # Centro del gráfico en índice 3 (165cm)
        curva = chart.plot(
            lambda x: 20 * np.exp(-0.5 * ((x - 3) / 1.2) ** 2),
            x_range=[0, 6],
            color=NARANJA,
            stroke_width=3,
        )

        self.play(Write(titulo))
        self.play(Create(chart), Write(x_label), run_time=2)
        self.wait(1)

        # Superponer la curva normal
        label_normal = Text("Distribución Normal", font_size=20, color=NARANJA)
        label_normal.next_to(chart, RIGHT, buff=0.3).shift(UP)

        self.play(Create(curva), Write(label_normal), run_time=2)
        self.wait(2)

# Renderizar: manim -pql archivo.py Histograma
```

## Matriz de confusión

```python
from manim import *

FONDO = "#1A1A2E"
AZUL = "#2196F3"
VERDE = "#4CAF50"
ROJO = "#F44336"
NARANJA = "#FF9800"

class MatrizConfusion(Scene):
    def construct(self):
        self.camera.background_color = FONDO

        titulo = Text("Matriz de Confusión", font_size=36, color=WHITE)
        titulo.to_edge(UP, buff=0.5)

        # Valores de la matriz: [[TP, FP], [FN, TN]]
        valores = [[85, 10], [15, 90]]
        colores = [[VERDE, ROJO], [NARANJA, AZUL]]
        etiquetas_celda = [["VP: 85", "FP: 10"], ["FN: 15", "VN: 90"]]

        # Crear la cuadrícula de rectángulos
        celdas = VGroup()
        textos = VGroup()
        tam = 2  # Tamaño de cada celda

        for i in range(2):
            for j in range(2):
                # Opacidad proporcional al valor
                opacidad = valores[i][j] / 100 * 0.8
                rect = Square(side_length=tam)
                rect.set_fill(colores[i][j], opacity=opacidad)
                rect.set_stroke(WHITE, width=1)
                rect.move_to([j * tam - tam / 2, -i * tam + tam / 2, 0])

                texto = Text(etiquetas_celda[i][j], font_size=24, color=WHITE)
                texto.move_to(rect.get_center())

                celdas.add(rect)
                textos.add(texto)

        # Etiquetas de filas y columnas
        pred_label = Text("Predicción", font_size=22, color=WHITE)
        pred_label.next_to(celdas, UP, buff=0.8)
        real_label = Text("Real", font_size=22, color=WHITE)
        real_label.next_to(celdas, LEFT, buff=0.8).rotate(PI / 2)

        col_labels = VGroup(
            Text("Positivo", font_size=18, color=WHITE),
            Text("Negativo", font_size=18, color=WHITE),
        )
        col_labels[0].next_to(celdas[0], UP, buff=0.3)
        col_labels[1].next_to(celdas[1], UP, buff=0.3)

        row_labels = VGroup(
            Text("Positivo", font_size=18, color=WHITE),
            Text("Negativo", font_size=18, color=WHITE),
        )
        row_labels[0].next_to(celdas[0], LEFT, buff=0.3)
        row_labels[1].next_to(celdas[2], LEFT, buff=0.3)

        # Animación
        self.play(Write(titulo))
        self.play(
            LaggedStart(*[Create(c) for c in celdas], lag_ratio=0.2),
            run_time=1.5,
        )
        self.play(
            LaggedStart(*[Write(t) for t in textos], lag_ratio=0.2),
            run_time=1.5,
        )
        self.play(
            Write(pred_label), Write(real_label),
            *[Write(l) for l in col_labels],
            *[Write(l) for l in row_labels],
        )

        # Mostrar métricas calculadas
        precision = valores[0][0] / (valores[0][0] + valores[0][1])
        recall = valores[0][0] / (valores[0][0] + valores[1][0])

        metricas = VGroup(
            Text(f"Precisión: {precision:.2f}", font_size=22, color=VERDE),
            Text(f"Recall: {recall:.2f}", font_size=22, color=AZUL),
        )
        metricas.arrange(DOWN, buff=0.3)
        metricas.next_to(celdas, RIGHT, buff=1)

        self.play(LaggedStart(*[Write(m) for m in metricas], lag_ratio=0.5))
        self.wait(2)

# Renderizar: manim -pql archivo.py MatrizConfusion
```

## Curva ROC

```python
from manim import *
import numpy as np

FONDO = "#1A1A2E"
AZUL = "#2196F3"
VERDE = "#4CAF50"
NARANJA = "#FF9800"

class CurvaROC(Scene):
    def construct(self):
        self.camera.background_color = FONDO

        titulo = Text("Curva ROC", font_size=36, color=WHITE)
        titulo.to_edge(UP, buff=0.5)

        # Ejes
        ejes = Axes(
            x_range=[0, 1, 0.2],
            y_range=[0, 1, 0.2],
            x_length=5.5,
            y_length=5.5,
            axis_config={"include_numbers": True, "font_size": 18},
        ).shift(LEFT * 0.5)

        etiquetas = ejes.get_axis_labels(
            x_label=Text("FPR", font_size=20),
            y_label=Text("TPR", font_size=20),
        )

        # Línea diagonal (clasificador aleatorio)
        diagonal = ejes.plot(
            lambda x: x,
            x_range=[0, 1],
            color=GREY,
            stroke_width=2,
            stroke_opacity=0.5,
        )
        label_random = Text("Aleatorio", font_size=16, color=GREY)
        label_random.move_to(ejes.coords_to_point(0.7, 0.6))

        # Curva ROC (simulada con función sigmoide inversa)
        curva_roc = ejes.plot(
            lambda x: 1 - (1 - x) ** 3 if x < 0.3 else min(1, 0.85 + 0.15 * (x - 0.3) / 0.7),
            x_range=[0, 1],
            color=AZUL,
            stroke_width=3,
        )

        # Área bajo la curva (AUC)
        area = ejes.get_area(
            curva_roc,
            x_range=[0, 1],
            color=AZUL,
            opacity=0.2,
        )

        # Etiqueta AUC
        auc_label = Text("AUC = 0.92", font_size=24, color=VERDE)
        auc_label.next_to(ejes, RIGHT, buff=0.5).shift(UP)

        # Animación
        self.play(Write(titulo))
        self.play(Create(ejes), Write(etiquetas), run_time=1.5)
        self.play(Create(diagonal), Write(label_random))
        self.wait(0.5)

        # Dibujar la curva ROC progresivamente
        self.play(Create(curva_roc), run_time=3)
        self.play(FadeIn(area), run_time=1)
        self.play(Write(auc_label))
        self.wait(2)

# Renderizar: manim -pql archivo.py CurvaROC
```

## Box plot

```python
from manim import *

FONDO = "#1A1A2E"
AZUL = "#2196F3"
VERDE = "#4CAF50"
NARANJA = "#FF9800"

class BoxPlot(Scene):
    def construct(self):
        self.camera.background_color = FONDO

        titulo = Text("Comparación de Salarios por Área", font_size=32, color=WHITE)
        titulo.to_edge(UP, buff=0.5)

        def crear_boxplot(q1, mediana, q3, minimo, maximo, color, x_pos):
            """Crea un box plot manualmente con rectángulos y líneas"""
            # Escala: 1 unidad = 0.05 en pantalla
            escala = 0.08

            # Caja (Q1 a Q3)
            caja = Rectangle(
                width=0.8,
                height=(q3 - q1) * escala,
                fill_color=color,
                fill_opacity=0.5,
                stroke_color=color,
            )
            caja.move_to([x_pos, (q1 + q3) / 2 * escala - 3, 0])

            # Línea de mediana
            mediana_line = Line(
                start=[x_pos - 0.4, mediana * escala - 3, 0],
                end=[x_pos + 0.4, mediana * escala - 3, 0],
                color=WHITE,
                stroke_width=3,
            )

            # Bigotes (whiskers)
            bigote_sup = Line(
                start=[x_pos, q3 * escala - 3, 0],
                end=[x_pos, maximo * escala - 3, 0],
                color=color,
            )
            bigote_inf = Line(
                start=[x_pos, q1 * escala - 3, 0],
                end=[x_pos, minimo * escala - 3, 0],
                color=color,
            )

            # Tapas de los bigotes
            tapa_sup = Line(
                start=[x_pos - 0.2, maximo * escala - 3, 0],
                end=[x_pos + 0.2, maximo * escala - 3, 0],
                color=color,
            )
            tapa_inf = Line(
                start=[x_pos - 0.2, minimo * escala - 3, 0],
                end=[x_pos + 0.2, minimo * escala - 3, 0],
                color=color,
            )

            return VGroup(caja, mediana_line, bigote_sup, bigote_inf, tapa_sup, tapa_inf)

        # Datos: (Q1, Mediana, Q3, Min, Max)
        datos = {
            "DS": (50, 65, 80, 35, 95),
            "ML": (60, 75, 90, 40, 110),
            "DE": (45, 58, 72, 30, 88),
        }
        colores = [AZUL, VERDE, NARANJA]
        posiciones = [-2.5, 0, 2.5]

        boxplots = VGroup()
        labels = VGroup()

        for (nombre, vals), color, x_pos in zip(datos.items(), colores, posiciones):
            bp = crear_boxplot(*vals, color, x_pos)
            boxplots.add(bp)
            label = Text(nombre, font_size=22, color=color)
            label.move_to([x_pos, -3.5, 0])
            labels.add(label)

        self.play(Write(titulo))
        self.play(
            LaggedStart(*[Create(bp) for bp in boxplots], lag_ratio=0.3),
            run_time=2,
        )
        self.play(*[Write(l) for l in labels])
        self.wait(2)

# Renderizar: manim -pql archivo.py BoxPlot
```

## Heatmap de correlación

```python
from manim import *
import numpy as np

FONDO = "#1A1A2E"

class HeatmapCorrelacion(Scene):
    def construct(self):
        self.camera.background_color = FONDO

        titulo = Text("Matriz de Correlación", font_size=36, color=WHITE)
        titulo.to_edge(UP, buff=0.5)

        # Datos: matriz de correlación simulada
        variables = ["Edad", "Ingreso", "Gasto", "Ahorro"]
        correlaciones = [
            [1.00, 0.65, 0.42, 0.30],
            [0.65, 1.00, 0.78, 0.55],
            [0.42, 0.78, 1.00, -0.20],
            [0.30, 0.55, -0.20, 1.00],
        ]

        n = len(variables)
        tam_celda = 1.2
        offset_x = -(n - 1) * tam_celda / 2
        offset_y = (n - 1) * tam_celda / 2

        celdas = VGroup()
        textos_valor = VGroup()

        for i in range(n):
            for j in range(n):
                val = correlaciones[i][j]

                # Color: azul para positivo, rojo para negativo
                if val >= 0:
                    color = interpolate_color(WHITE, BLUE, val)
                else:
                    color = interpolate_color(WHITE, RED, abs(val))

                rect = Square(side_length=tam_celda)
                rect.set_fill(color, opacity=0.7)
                rect.set_stroke(WHITE, width=0.5)
                rect.move_to([
                    offset_x + j * tam_celda,
                    offset_y - i * tam_celda,
                    0
                ])
                celdas.add(rect)

                texto = Text(f"{val:.2f}", font_size=16, color=WHITE)
                texto.move_to(rect.get_center())
                textos_valor.add(texto)

        # Etiquetas de filas y columnas
        labels_col = VGroup(*[
            Text(v, font_size=16, color=WHITE).move_to([
                offset_x + i * tam_celda,
                offset_y + tam_celda * 0.7,
                0
            ])
            for i, v in enumerate(variables)
        ])
        labels_fila = VGroup(*[
            Text(v, font_size=16, color=WHITE).move_to([
                offset_x - tam_celda * 0.9,
                offset_y - i * tam_celda,
                0
            ])
            for i, v in enumerate(variables)
        ])

        # Animación
        self.play(Write(titulo))
        self.play(
            LaggedStart(*[FadeIn(c, scale=0.5) for c in celdas], lag_ratio=0.03),
            run_time=2,
        )
        self.play(
            LaggedStart(*[FadeIn(t) for t in textos_valor], lag_ratio=0.03),
            run_time=1.5,
        )
        self.play(Write(labels_col), Write(labels_fila))
        self.wait(2)

# Renderizar: manim -pql archivo.py HeatmapCorrelacion
```
