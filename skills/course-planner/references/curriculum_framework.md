# Marco Curricular — Academia de Data Science & IA

## Taxonomía de Bloom para DS/IA

Cada lección debe apuntar a un nivel cognitivo. Los niveles inferiores se cubren en módulos básicos, los superiores en avanzados.

### Niveles cognitivos (de menor a mayor)

| Nivel | Verbo | Ejemplo en DS/IA |
|-------|-------|-------------------|
| **1. Recordar** | Definir, listar, identificar | "Define qué es una variable categórica" |
| **2. Comprender** | Explicar, describir, resumir | "Explica cómo funciona la regresión lineal" |
| **3. Aplicar** | Implementar, usar, calcular | "Implementa un modelo de regresión con Scikit-learn" |
| **4. Analizar** | Comparar, diferenciar, examinar | "Compara Random Forest vs Gradient Boosting para este dataset" |
| **5. Evaluar** | Juzgar, argumentar, seleccionar | "Selecciona el mejor modelo basándote en métricas de negocio" |
| **6. Crear** | Diseñar, construir, proponer | "Diseña un pipeline completo de ML para detección de fraude" |

### Mapeo por nivel de la academia

- **Nivel 1 (Fundamentos):** Recordar + Comprender + Aplicar básico
- **Nivel 2 (Intermedio):** Aplicar + Analizar
- **Nivel 3 (Avanzado):** Analizar + Evaluar
- **Nivel 4 (Especialización):** Evaluar + Crear

## Secuenciación de temas

### Regla de dependencias

Nunca introducir un tema sin haber cubierto sus prerrequisitos. El mapa de dependencias principal:

```
Python básico
├── Estructuras de datos → Pandas → Feature Engineering
├── Funciones → Clases → PyTorch/TensorFlow
├── Visualización (Matplotlib) → EDA → Storytelling con datos
│
Matemáticas
├── Álgebra lineal → PCA → Embeddings → Transformers
├── Cálculo → Gradiente descendente → Backpropagation
├── Probabilidad → Estadística inferencial → Tests A/B
│   └── Bayes → Naive Bayes → Modelos generativos
│
Machine Learning
├── Regresión lineal → Regularización → Regresión avanzada
├── Clasificación → Árboles → Ensembles → XGBoost
├── Clustering → K-means → DBSCAN → Jerárquico
├── Evaluación → Validación cruzada → Selección de modelos
│
Deep Learning
├── Perceptrón → MLP → Backpropagation
├── CNN → Transfer Learning → Object Detection
├── RNN → LSTM → Seq2Seq
├── Attention → Transformers → BERT → GPT → LLMs
│
Producción
├── MLflow → Registro de modelos → CI/CD para ML
├── FastAPI → Docker → Kubernetes
├── LLMs → Prompt Engineering → RAG → Agentes
```

## Diseño de módulos

### Template de módulo

```markdown
# Módulo: [Nombre]

## Metadatos
- **Nivel:** [1-4]
- **Posición en el nivel:** [X de Y módulos]
- **Prerrequisitos:** [Módulos anteriores necesarios]
- **Duración:** [X lecciones, ~Y horas de video]

## Objetivo general
Al completar este módulo, el estudiante será capaz de [OBJETIVO MEDIBLE].

## Lecciones
[Lista ordenada de lecciones con dependencias]

## Proyecto integrador
[Descripción del proyecto que demuestra dominio del módulo]

## Evaluación
- Quiz de conceptos (10 preguntas)
- Ejercicios de código (3-5)
- Proyecto entregable
```

### Duración recomendada por tipo de lección

| Tipo de contenido | Duración video | Ejercicio |
|-------------------|---------------|-----------|
| Concepto teórico | 8-12 min | Quiz |
| Tutorial de código | 12-18 min | Replicar + modificar |
| Matemáticas | 10-15 min | Resolver problemas |
| Proyecto guiado | 15-25 min | Extender el proyecto |
| Resumen/revisión | 5-8 min | Ninguno |

## Proyectos integradores por nivel

### Nivel 1: Análisis exploratorio completo
- Dataset: Datos públicos (Kaggle, datos.gob)
- Entregable: Notebook con EDA, visualizaciones, conclusiones
- Herramientas: Python, Pandas, Matplotlib, SQL

### Nivel 2: Pipeline de ML end-to-end
- Dataset: Problema de clasificación o regresión
- Entregable: Notebook + modelo entrenado + reporte de métricas
- Herramientas: Scikit-learn, XGBoost, validación cruzada

### Nivel 3: Aplicación de Deep Learning
- Dataset: Imágenes o texto
- Entregable: Modelo entrenado + demo funcional
- Herramientas: PyTorch, transfer learning, Hugging Face

### Nivel 4: Sistema ML en producción
- Entregable: API desplegada + monitoreo + documentación
- Herramientas: FastAPI, Docker, MLflow, CI/CD
