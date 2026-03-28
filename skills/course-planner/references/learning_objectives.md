# Objetivos de Aprendizaje por Nivel

## Cómo escribir buenos objetivos

Usa la fórmula: **"El estudiante será capaz de"** + **verbo medible** + **contenido** + **condición**

### Verbos por nivel cognitivo

| Nivel | Buenos verbos | Evitar |
|-------|--------------|--------|
| Recordar | Definir, listar, nombrar, identificar | "Saber", "conocer" |
| Comprender | Explicar, describir, interpretar, parafrasear | "Entender" |
| Aplicar | Implementar, calcular, usar, resolver | "Poder usar" |
| Analizar | Comparar, contrastar, diferenciar, examinar | "Ver las diferencias" |
| Evaluar | Seleccionar, justificar, argumentar, criticar | "Opinar" |
| Crear | Diseñar, construir, proponer, desarrollar | "Hacer algo" |

---

## Objetivos por Nivel

### Nivel 1: Fundamentos

#### Módulo: Python desde cero
- Instalar Python y configurar un entorno de desarrollo
- Declarar variables y usar los tipos de datos fundamentales (int, float, str, bool)
- Implementar estructuras de control (if/elif/else, for, while)
- Crear funciones con parámetros y valores de retorno
- Manipular listas, diccionarios y tuplas
- Leer y escribir archivos CSV

#### Módulo: Matemáticas esenciales
- Realizar operaciones con vectores y matrices usando NumPy
- Calcular derivadas parciales de funciones simples
- Interpretar probabilidades condicionales y el teorema de Bayes
- Explicar conceptos de álgebra lineal relevantes para ML (producto punto, transposición, determinante)

#### Módulo: Estadística
- Calcular e interpretar medidas de tendencia central y dispersión
- Distinguir entre distribuciones de probabilidad comunes (normal, binomial, Poisson)
- Formular e interpretar pruebas de hipótesis
- Calcular intervalos de confianza
- Identificar correlación vs causalidad

#### Módulo: Visualización de datos
- Crear gráficos básicos con Matplotlib (línea, barras, scatter, histograma)
- Personalizar gráficos (colores, etiquetas, leyendas, títulos)
- Usar Seaborn para visualizaciones estadísticas
- Seleccionar el tipo de gráfico adecuado según los datos

#### Módulo: Pandas
- Cargar datos desde CSV, Excel y SQL
- Filtrar, ordenar y agrupar DataFrames
- Manejar valores nulos (identificar, eliminar, imputar)
- Realizar joins y merges entre DataFrames
- Aplicar funciones con apply, map y transform

#### Módulo: SQL básico
- Escribir consultas SELECT con WHERE, ORDER BY y LIMIT
- Usar funciones de agregación (COUNT, SUM, AVG, MAX, MIN)
- Realizar JOINs entre tablas
- Agrupar datos con GROUP BY y HAVING

---

### Nivel 2: Machine Learning

#### Módulo: Introducción a ML
- Diferenciar entre aprendizaje supervisado, no supervisado y por refuerzo
- Explicar el problema de overfitting vs underfitting
- Dividir datos en train/validation/test correctamente
- Describir el flujo de trabajo de un proyecto de ML

#### Módulo: Regresión
- Implementar regresión lineal simple y múltiple
- Interpretar coeficientes de regresión
- Aplicar regularización L1 (Lasso) y L2 (Ridge)
- Evaluar modelos de regresión con MSE, RMSE, MAE y R²

#### Módulo: Clasificación
- Implementar regresión logística para clasificación binaria
- Usar SVM para clasificación con diferentes kernels
- Aplicar KNN y explicar el impacto de K
- Evaluar clasificadores con accuracy, precision, recall y F1

#### Módulo: Árboles y ensembles
- Construir un árbol de decisión e interpretar sus splits
- Implementar Random Forest y explicar por qué reduce varianza
- Usar Gradient Boosting y XGBoost
- Tunear hiperparámetros con GridSearch y RandomSearch

#### Módulo: Clustering
- Implementar K-means y seleccionar K con el método del codo
- Aplicar DBSCAN para datos con formas irregulares
- Evaluar clusters con silhouette score
- Reducir dimensionalidad con PCA para visualización

#### Módulo: Feature Engineering
- Codificar variables categóricas (one-hot, label, target encoding)
- Normalizar y estandarizar variables numéricas
- Crear features a partir de datos de fecha/hora
- Manejar variables con alta cardinalidad

#### Módulo: Evaluación de modelos
- Interpretar una matriz de confusión
- Graficar e interpretar curvas ROC y PR
- Implementar validación cruzada k-fold
- Seleccionar métricas apropiadas según el problema de negocio

---

### Nivel 3: Deep Learning

#### Módulo: Redes neuronales
- Explicar cómo funciona un perceptrón
- Implementar una red neuronal desde cero con NumPy
- Describir el algoritmo de backpropagation
- Seleccionar funciones de activación apropiadas (ReLU, Sigmoid, Softmax)

#### Módulo: PyTorch/TensorFlow
- Crear tensores y realizar operaciones básicas
- Construir un modelo con nn.Module (PyTorch) o Sequential (TF)
- Entrenar un modelo con optimizador y función de pérdida
- Implementar early stopping y learning rate scheduling

#### Módulo: CNN
- Explicar operaciones de convolución y pooling
- Construir una CNN para clasificación de imágenes
- Aplicar transfer learning con modelos preentrenados (ResNet, VGG)
- Implementar data augmentation para mejorar generalización

#### Módulo: RNN y series temporales
- Explicar el problema del vanishing gradient en RNNs
- Implementar LSTM para predicción de secuencias
- Preparar datos temporales con ventanas deslizantes
- Evaluar modelos de series temporales

#### Módulo: NLP
- Tokenizar y preprocesar texto
- Crear embeddings de palabras (Word2Vec, GloVe)
- Implementar clasificación de texto con modelos preentrenados
- Usar Hugging Face Transformers para tareas de NLP

#### Módulo: Transformers
- Explicar el mecanismo de self-attention
- Describir la arquitectura encoder-decoder
- Fine-tunear BERT para clasificación
- Usar modelos generativos (GPT) para generación de texto

---

### Nivel 4: Especialización

#### Módulo: MLOps
- Rastrear experimentos con MLflow
- Versionar datos con DVC
- Crear pipelines automatizados de entrenamiento
- Implementar monitoreo de drift del modelo

#### Módulo: LLMs
- Diseñar prompts efectivos (zero-shot, few-shot, chain-of-thought)
- Implementar RAG con bases vectoriales
- Construir agentes de IA con herramientas
- Fine-tunear un LLM para un dominio específico

#### Módulo: Despliegue
- Crear una API REST con FastAPI para servir modelos
- Containerizar aplicaciones con Docker
- Desplegar en servicios cloud (AWS, GCP)
- Implementar CI/CD para modelos ML
