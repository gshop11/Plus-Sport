# Template de Lección

## Template rellenable

Copia y completa este template para cada lección individual:

```markdown
# Lección: [TÍTULO]

## Metadatos
- **Módulo:** [Nombre del módulo padre]
- **Nivel:** [1-4]
- **Posición:** Lección [X] de [Y] en este módulo
- **Duración estimada:** [X] minutos
- **Prerrequisitos:** [Lecciones o conceptos previos necesarios]

## Objetivo de aprendizaje
Al terminar esta lección, el estudiante será capaz de:
- [Verbo medible] + [contenido] + [condición]

## Temas a cubrir
1. [Tema principal]
   - [Subtema A]
   - [Subtema B]
2. [Tema secundario]
   - [Subtema C]

## Estructura del video

### Hook [00:00 - 00:30]
- **Tipo de hook:** [Pregunta / Problema / Demo / Mito]
- **Idea:** [Descripción breve]

### Contexto [00:30 - 01:00]
- ¿Por qué importa este tema?
- ¿Dónde se usa en el mundo real?

### Desarrollo [01:00 - XX:00]
| Sección | Tiempo | Contenido | Animación Manim |
|---------|--------|-----------|-----------------|
| Sección 1 | 01:00-03:00 | [Explicación] | [Tipo de animación] |
| Sección 2 | 03:00-05:00 | [Explicación] | [Tipo de animación] |
| Sección 3 | 05:00-07:00 | [Explicación] | [Tipo de animación] |

### Demo/Código [XX:00 - XX:00]
- **Lenguaje:** Python
- **Librerías:** [Lista]
- **Qué se construye:** [Descripción]

### Resumen [XX:00 - XX:30]
3 puntos clave:
1. [Punto 1]
2. [Punto 2]
3. [Punto 3]

### CTA [XX:30 - XX:00]
- Siguiente video: [Título]
- Material descargable: [PDF/Notebook/Dataset]

## Ejercicio práctico
- **Tipo:** [Código / Quiz / Proyecto mini]
- **Descripción:** [Qué debe hacer el estudiante]
- **Dificultad:** [Fácil / Medio / Difícil]
- **Tiempo estimado:** [X] minutos

## Recursos adicionales
- [Link o referencia 1]
- [Link o referencia 2]

## Notas de producción
- **Dataset necesario:** [Sí/No - cuál]
- **Complejidad de animación:** [Baja / Media / Alta]
- **Código de ejemplo:** [Sí/No]
```

## Ejemplo completado

```markdown
# Lección: Regresión Lineal Simple

## Metadatos
- **Módulo:** Regresión
- **Nivel:** 2
- **Posición:** Lección 1 de 5 en este módulo
- **Duración estimada:** 14 minutos
- **Prerrequisitos:** Estadística descriptiva, scatter plots, concepto de correlación

## Objetivo de aprendizaje
Al terminar esta lección, el estudiante será capaz de:
- Implementar una regresión lineal simple en Python usando Scikit-learn
- Interpretar los coeficientes (pendiente e intercepto) en contexto de negocio
- Calcular y explicar el R² como medida de ajuste

## Temas a cubrir
1. ¿Qué es la regresión lineal?
   - Intuición geométrica (la mejor línea)
   - Ecuación: y = mx + b
2. Mínimos cuadrados ordinarios
   - Función de costo (MSE)
   - Minimización visual
3. Implementación con Scikit-learn
   - LinearRegression().fit()
   - .predict(), .coef_, .intercept_
4. Interpretación de resultados
   - Qué significa la pendiente
   - R² y su interpretación

## Estructura del video

### Hook [00:00 - 00:25]
- **Tipo de hook:** Problema relatable
- **Idea:** "Si te digo que una casa tiene 120m², ¿podrías predecir su precio? Hoy te enseño cómo una computadora hace exactamente eso."

### Contexto [00:25 - 01:00]
- La regresión lineal es el algoritmo más fundamental de ML
- Se usa en finanzas, salud, marketing, ciencia

### Desarrollo [01:00 - 10:00]
| Sección | Tiempo | Contenido | Animación Manim |
|---------|--------|-----------|-----------------|
| Intuición | 01:00-03:00 | Scatter plot + dibujar líneas a mano | Scatter plot con múltiples líneas que se prueban |
| MSE | 03:00-05:30 | Residuos y minimización | Líneas de error (residuos) que se acortan |
| Fórmula | 05:30-07:00 | y = mx + b con interpretación | Fórmula animada con colores por variable |
| Gradiente | 07:00-08:30 | Gradiente descendente simplificado | Parábola con punto bajando al mínimo |
| R² | 08:30-10:00 | Medida de bondad de ajuste | Comparación visual R²=0.3 vs R²=0.95 |

### Demo/Código [10:00 - 12:30]
- **Lenguaje:** Python
- **Librerías:** sklearn, matplotlib, pandas, numpy
- **Qué se construye:** Modelo que predice precios de casas con datos sintéticos

### Resumen [12:30 - 13:15]
1. La regresión lineal encuentra la mejor línea recta para tus datos
2. Minimiza la suma de errores cuadrados (MSE)
3. R² te dice qué tan bien se ajusta el modelo (más cerca de 1 = mejor)

### CTA [13:15 - 14:00]
- Siguiente video: "Regresión Lineal Múltiple"
- Material: Notebook + dataset de precios de casas

## Ejercicio práctico
- **Tipo:** Código
- **Descripción:** Dado un dataset de horas de estudio vs calificaciones, implementar regresión lineal, graficar la línea de ajuste, e interpretar el R²
- **Dificultad:** Fácil
- **Tiempo estimado:** 20 minutos

## Notas de producción
- **Dataset necesario:** Sí - datos de casas (generar con dataset-generator)
- **Complejidad de animación:** Media (scatter + regresión + residuos)
- **Código de ejemplo:** Sí - notebook completo
```

## Tips para planificar lecciones

1. **Una lección = un concepto principal** — No intentes cubrir demasiado en un solo video
2. **El ejercicio refuerza el objetivo** — Si el objetivo es "implementar", el ejercicio debe ser implementar algo similar
3. **Las animaciones no son decoración** — Cada animación debe explicar algo que sería difícil de entender solo con palabras
4. **Prerrequisitos explícitos** — Si necesitas que el estudiante sepa algo, dilo; no asumas
5. **El hook conecta con el mundo real** — No empezar con "Hoy vamos a aprender X"; empezar con por qué X importa
