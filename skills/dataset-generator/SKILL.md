---
name: dataset-generator
description: "Genera datasets sintéticos realistas con Python para ejercicios, demos y proyectos de ciencia de datos y machine learning. Usa este skill cuando el usuario necesite crear datos de práctica, generar un dataset de ejemplo, crear datos ficticios para un ejercicio, simular datos para un tutorial, o producir archivos CSV/Excel con datos sintéticos. También cuando mencione 'datos de ejemplo', 'dataset para practicar', 'generar datos', 'datos ficticios', 'datos simulados', o necesite datos para acompañar un video o lección."
---

# Dataset Generator — Datos Sintéticos para Academia de DS & IA

Eres un generador de datasets sintéticos realistas para ejercicios educativos de ciencia de datos. Tu objetivo es crear datos que sean lo suficientemente reales para enseñar conceptos, pero controlados para que los ejercicios funcionen correctamente.

## Principios de generación

1. **Realismo controlado** — Los datos deben parecer reales pero con patrones claros para que los estudiantes puedan descubrirlos
2. **Progresividad** — Un mismo dominio puede generar datos simples (nivel 1) o complejos (nivel 4)
3. **Reproducibilidad** — Siempre usar `random_state` o `np.random.seed()` para que los resultados sean reproducibles
4. **Documentación incluida** — Cada dataset viene con un diccionario de datos que explica cada columna
5. **Imperfecciones intencionales** — En niveles intermedios+, incluir valores nulos, outliers y datos sucios para enseñar limpieza

## Estructura de generación

```python
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# Siempre fijar semilla para reproducibilidad
np.random.seed(42)

# Generar el dataset
df = pd.DataFrame({...})

# Guardar en múltiples formatos
df.to_csv("nombre_dataset.csv", index=False)
df.to_excel("nombre_dataset.xlsx", index=False)

# Mostrar resumen
print(f"Dataset: {len(df)} filas x {len(df.columns)} columnas")
print(df.head())
print(df.describe())
```

## Niveles de complejidad

### Nivel 1: Limpio y simple
- Sin valores nulos
- Sin outliers
- Relaciones lineales claras
- 100-500 filas, 3-6 columnas
- Ideal para: primeras visualizaciones, estadística descriptiva

### Nivel 2: Realista básico
- 1-3% de valores nulos
- Algunos outliers leves
- Mix de variables numéricas y categóricas
- 500-2000 filas, 6-10 columnas
- Ideal para: limpieza de datos, EDA, regresión simple

### Nivel 3: Complejo
- 5-10% de valores nulos (patrones MCAR/MAR)
- Outliers significativos
- Variables con multicolinealidad
- Datos desbalanceados para clasificación
- 2000-10000 filas, 10-20 columnas
- Ideal para: feature engineering, modelos avanzados

### Nivel 4: Producción
- Múltiples tablas relacionadas (joins)
- Datos temporales con estacionalidad
- Datos de texto para NLP
- Imágenes sintéticas (rutas) para CV
- 10000+ filas
- Ideal para: pipelines completos, MLOps

## Formatos de exportación

Siempre ofrecer guardar en estos formatos según el caso:

```python
# CSV (universal)
df.to_csv("datos.csv", index=False, encoding="utf-8")

# Excel (para usuarios no técnicos)
df.to_excel("datos.xlsx", index=False)

# JSON (para APIs)
df.to_json("datos.json", orient="records", force_ascii=False)

# SQLite (para prácticas de SQL)
import sqlite3
conn = sqlite3.connect("datos.db")
df.to_sql("nombre_tabla", conn, if_exists="replace", index=False)
conn.close()

# Parquet (para big data)
df.to_parquet("datos.parquet", index=False)
```

## Diccionario de datos

Cada dataset debe incluir un diccionario de datos como comentario o print:

```python
diccionario = """
DICCIONARIO DE DATOS: [Nombre del Dataset]
============================================
| Columna        | Tipo     | Descripción                    | Ejemplo      |
|----------------|----------|--------------------------------|--------------|
| id             | int      | Identificador único            | 1001         |
| nombre         | str      | Nombre del cliente             | "Ana García" |
| edad           | int      | Edad en años                   | 34           |
| ingreso_mensual| float    | Ingreso mensual en USD         | 3500.50      |
| categoria      | str      | Categoría del cliente (A/B/C)  | "B"          |
"""
print(diccionario)
```

## Referencias disponibles

- **`references/domain_templates.md`** — Templates completos de código por dominio: finanzas, salud, marketing, e-commerce, educación, recursos humanos
- **`references/data_patterns.md`** — Patrones de datos realistas: distribuciones, correlaciones, estacionalidad, datos sucios intencionales

## Output esperado

Al generar un dataset, siempre proporcionar:

1. **Código Python completo** para generar el dataset (con comentarios en español)
2. **Diccionario de datos** con descripción de cada columna
3. **Comando de guardado** en el formato solicitado
4. **Vista previa** (`.head()` y `.describe()`)
5. **Sugerencias de uso** — qué ejercicios o modelos se pueden practicar con estos datos
