# Patrones de Datos Realistas

## Distribuciones comunes por tipo de variable

### Numéricas
```python
import numpy as np

# Ingresos, precios, montos → Log-normal (sesgada a la derecha)
ingresos = np.random.lognormal(mean=10, sigma=0.5, size=1000)

# Edades, temperaturas → Normal
edades = np.random.normal(loc=35, scale=12, size=1000)
edades = np.clip(edades, 18, 80)

# Conteos (visitas, clics) → Poisson
visitas = np.random.poisson(lam=15, size=1000)

# Tiempos de espera → Exponencial
tiempos = np.random.exponential(scale=5, size=1000)

# Proporciones, tasas → Beta
tasas = np.random.beta(a=2, b=5, size=1000)

# Datos uniformes (IDs, coordenadas)
coords = np.random.uniform(low=-180, high=180, size=1000)
```

### Categóricas
```python
# Con distribución realista (no uniforme)
# Usar probabilidades que reflejen el mundo real
genero = np.random.choice(["M", "F", "Otro"], size=1000, p=[0.48, 0.49, 0.03])
nivel_edu = np.random.choice(
    ["secundaria", "universidad", "maestria", "doctorado"],
    size=1000,
    p=[0.30, 0.45, 0.20, 0.05],
)
```

## Correlaciones realistas

### Crear variables correlacionadas
```python
from numpy.random import multivariate_normal

# Definir matriz de correlación
correlacion = [
    [1.0, 0.7, -0.3],   # Variable 1
    [0.7, 1.0, -0.2],   # Variable 2 (correlacionada con 1)
    [-0.3, -0.2, 1.0],  # Variable 3 (anti-correlación leve)
]

medias = [50, 30, 100]
desviaciones = [10, 5, 20]

# Generar datos correlacionados
cov = np.outer(desviaciones, desviaciones) * correlacion
datos = multivariate_normal(medias, cov, size=1000)

# Verificar
import pandas as pd
df = pd.DataFrame(datos, columns=["var1", "var2", "var3"])
print(df.corr())
```

### Relación no lineal
```python
x = np.random.uniform(0, 10, 1000)
# Relación cuadrática con ruido
y = 2 * x**2 - 5 * x + np.random.normal(0, 5, 1000)
```

## Datos sucios intencionales

### Valores nulos con patrón
```python
import pandas as pd

# MCAR (Missing Completely At Random)
mask = np.random.random(len(df)) < 0.05  # 5% aleatorio
df.loc[mask, "columna"] = np.nan

# MAR (Missing At Random) - depende de otra variable
# Ejemplo: personas mayores tienden a no reportar ingreso
mask_mar = (df["edad"] > 60) & (np.random.random(len(df)) < 0.3)
df.loc[mask_mar, "ingreso"] = np.nan

# MNAR (Missing Not At Random) - depende del valor mismo
# Ejemplo: ingresos altos tienden a no reportarse
mask_mnar = (df["ingreso"] > 100000) & (np.random.random(len(df)) < 0.4)
df.loc[mask_mnar, "ingreso"] = np.nan
```

### Outliers realistas
```python
# Outliers naturales (distribución con cola pesada)
datos = np.random.lognormal(5, 1, 1000)

# Outliers intencionales (errores de entrada)
n_outliers = int(len(df) * 0.02)  # 2%
indices = np.random.choice(len(df), n_outliers, replace=False)
df.loc[indices, "edad"] = np.random.choice([0, -1, 150, 999], n_outliers)
df.loc[indices, "monto"] = df.loc[indices, "monto"] * 100  # Error de decimal
```

### Datos duplicados
```python
# Duplicados exactos
n_dups = int(len(df) * 0.03)  # 3%
duplicados = df.sample(n_dups)
df = pd.concat([df, duplicados], ignore_index=True)
df = df.sample(frac=1, random_state=42).reset_index(drop=True)
```

### Inconsistencias de formato
```python
# Fechas en formatos mixtos
formatos = ["%Y-%m-%d", "%d/%m/%Y", "%m-%d-%Y", "%d %b %Y"]
df["fecha_str"] = df["fecha"].apply(
    lambda x: x.strftime(np.random.choice(formatos))
)

# Texto con variaciones
df["ciudad"] = df["ciudad"].apply(
    lambda x: np.random.choice([x, x.upper(), x.lower(), f" {x} "])
)
```

## Datos temporales

### Estacionalidad
```python
import pandas as pd

dias = 365 * 2
fechas = pd.date_range("2023-01-01", periods=dias)
t = np.arange(dias)

# Tendencia + estacionalidad + ruido
tendencia = 0.1 * t
estacionalidad = 20 * np.sin(2 * np.pi * t / 365)  # Ciclo anual
semanal = 5 * np.sin(2 * np.pi * t / 7)              # Ciclo semanal
ruido = np.random.normal(0, 3, dias)

ventas = 100 + tendencia + estacionalidad + semanal + ruido
ventas = np.maximum(ventas, 0)

df_temporal = pd.DataFrame({
    "fecha": fechas,
    "ventas": np.round(ventas, 0),
    "dia_semana": fechas.day_name(),
    "mes": fechas.month,
})
```

## Datos desbalanceados

### Para clasificación
```python
# Clase minoritaria al 5%
n_total = 5000
n_positivos = int(n_total * 0.05)
n_negativos = n_total - n_positivos

# Generar features para cada clase con distribuciones diferentes
positivos = pd.DataFrame({
    "feature_1": np.random.normal(5, 1, n_positivos),
    "feature_2": np.random.normal(3, 0.5, n_positivos),
    "target": 1,
})

negativos = pd.DataFrame({
    "feature_1": np.random.normal(3, 1.5, n_negativos),
    "feature_2": np.random.normal(5, 1, n_negativos),
    "target": 0,
})

df = pd.concat([positivos, negativos]).sample(frac=1, random_state=42).reset_index(drop=True)
```

## Función helper: agregar ruido a datos limpios

```python
def agregar_ruido(df, pct_nulos=0.05, pct_outliers=0.02, pct_duplicados=0.03, seed=42):
    """
    Ensucia un dataset limpio para ejercicios de limpieza de datos.

    Parámetros:
    - pct_nulos: porcentaje de valores nulos por columna numérica
    - pct_outliers: porcentaje de outliers a introducir
    - pct_duplicados: porcentaje de filas duplicadas
    """
    np.random.seed(seed)
    df_sucio = df.copy()

    # Agregar nulos
    for col in df_sucio.select_dtypes(include=[np.number]).columns:
        mask = np.random.random(len(df_sucio)) < pct_nulos
        df_sucio.loc[mask, col] = np.nan

    # Agregar outliers
    num_cols = df_sucio.select_dtypes(include=[np.number]).columns
    if len(num_cols) > 0:
        col = np.random.choice(num_cols)
        n_out = int(len(df_sucio) * pct_outliers)
        indices = np.random.choice(len(df_sucio), n_out, replace=False)
        df_sucio.loc[indices, col] = df_sucio[col].mean() + 5 * df_sucio[col].std()

    # Agregar duplicados
    n_dups = int(len(df_sucio) * pct_duplicados)
    dups = df_sucio.sample(n_dups, random_state=seed)
    df_sucio = pd.concat([df_sucio, dups], ignore_index=True)

    return df_sucio.sample(frac=1, random_state=seed).reset_index(drop=True)
```
