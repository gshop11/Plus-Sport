# Templates de Datasets por Dominio

## Tabla de contenidos
1. [Finanzas](#finanzas)
2. [Salud](#salud)
3. [Marketing](#marketing)
4. [E-commerce](#e-commerce)
5. [Educación](#educación)
6. [Recursos Humanos](#recursos-humanos)

---

## Finanzas

### Transacciones bancarias (detección de fraude)
```python
import pandas as pd
import numpy as np

np.random.seed(42)
n = 5000

df = pd.DataFrame({
    "id_transaccion": range(1, n + 1),
    "fecha": pd.date_range("2024-01-01", periods=n, freq="h"),
    "monto": np.round(np.abs(np.random.lognormal(4, 1.5, n)), 2),
    "tipo": np.random.choice(["compra", "transferencia", "retiro", "pago"], n, p=[0.4, 0.25, 0.2, 0.15]),
    "canal": np.random.choice(["app", "web", "cajero", "sucursal"], n, p=[0.45, 0.3, 0.15, 0.1]),
    "ciudad": np.random.choice(["CDMX", "Bogotá", "Lima", "Buenos Aires", "Santiago"], n),
    "hora": np.random.randint(0, 24, n),
    "es_fraude": np.random.choice([0, 1], n, p=[0.97, 0.03]),  # 3% fraude
})

# Hacer fraudes más realistas: montos altos, horas raras
mask_fraude = df["es_fraude"] == 1
df.loc[mask_fraude, "monto"] = np.round(np.random.uniform(5000, 50000, mask_fraude.sum()), 2)
df.loc[mask_fraude, "hora"] = np.random.choice([1, 2, 3, 4, 23], mask_fraude.sum())
```

### Precios de acciones (series temporales)
```python
np.random.seed(42)
dias = 252  # Un año de trading

precio_base = 100
retornos = np.random.normal(0.0005, 0.02, dias)  # Retornos diarios
precios = precio_base * np.cumprod(1 + retornos)

df = pd.DataFrame({
    "fecha": pd.bdate_range("2024-01-02", periods=dias),
    "apertura": np.round(precios * np.random.uniform(0.99, 1.01, dias), 2),
    "maximo": np.round(precios * np.random.uniform(1.0, 1.03, dias), 2),
    "minimo": np.round(precios * np.random.uniform(0.97, 1.0, dias), 2),
    "cierre": np.round(precios, 2),
    "volumen": np.random.randint(100000, 5000000, dias),
})
```

### Riesgo crediticio (clasificación)
```python
np.random.seed(42)
n = 3000

edad = np.random.randint(18, 70, n)
ingreso = np.round(np.random.lognormal(10, 0.6, n), 0)
deuda = np.round(ingreso * np.random.uniform(0, 0.8, n), 0)
historial = np.random.randint(0, 10, n)  # Años de historial crediticio

# Target: probabilidad de impago correlacionada con las features
prob_impago = 1 / (1 + np.exp(-(- 2 + 0.02 * (70 - edad) + 0.5 * (deuda / ingreso) - 0.3 * historial)))
impago = np.random.binomial(1, prob_impago)

df = pd.DataFrame({
    "id_cliente": range(1, n + 1),
    "edad": edad,
    "ingreso_anual": ingreso,
    "deuda_total": deuda,
    "ratio_deuda_ingreso": np.round(deuda / ingreso, 3),
    "anos_historial": historial,
    "num_tarjetas": np.random.randint(1, 8, n),
    "impago": impago,
})
```

---

## Salud

### Pacientes (predicción de diabetes)
```python
np.random.seed(42)
n = 2000

edad = np.random.randint(25, 80, n)
imc = np.round(np.random.normal(27, 5, n), 1)
imc = np.clip(imc, 15, 50)
glucosa = np.round(np.random.normal(100, 25, n), 0)
presion = np.round(np.random.normal(120, 15, n), 0)

prob_diabetes = 1 / (1 + np.exp(-(- 6 + 0.03 * edad + 0.1 * imc + 0.02 * glucosa)))
diabetes = np.random.binomial(1, prob_diabetes)

df = pd.DataFrame({
    "id_paciente": range(1, n + 1),
    "edad": edad,
    "sexo": np.random.choice(["M", "F"], n),
    "imc": imc,
    "glucosa_ayuno": glucosa,
    "presion_sistolica": presion,
    "colesterol_total": np.round(np.random.normal(200, 40, n), 0),
    "actividad_fisica": np.random.choice(["baja", "media", "alta"], n, p=[0.4, 0.35, 0.25]),
    "fumador": np.random.choice(["si", "no", "ex"], n, p=[0.2, 0.6, 0.2]),
    "diabetes": diabetes,
})
```

---

## Marketing

### Campañas publicitarias (conversión)
```python
np.random.seed(42)
n = 4000

df = pd.DataFrame({
    "id_campana": range(1, n + 1),
    "canal": np.random.choice(["email", "redes_sociales", "google_ads", "display"], n, p=[0.3, 0.3, 0.25, 0.15]),
    "presupuesto": np.round(np.random.uniform(100, 10000, n), 2),
    "impresiones": np.random.randint(1000, 500000, n),
    "clics": np.random.randint(10, 5000, n),
    "edad_objetivo": np.random.choice(["18-24", "25-34", "35-44", "45-54", "55+"], n),
    "dia_semana": np.random.choice(["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"], n),
    "duracion_dias": np.random.randint(1, 30, n),
})

# CTR y conversión realistas
df["ctr"] = np.round(df["clics"] / df["impresiones"] * 100, 2)
df["conversiones"] = np.round(df["clics"] * np.random.uniform(0.01, 0.15, n)).astype(int)
df["costo_por_conversion"] = np.where(
    df["conversiones"] > 0,
    np.round(df["presupuesto"] / df["conversiones"], 2),
    0,
)
```

### Segmentación de clientes (clustering)
```python
np.random.seed(42)
n = 1500

# Crear 4 segmentos naturales
segmentos = []
for _ in range(375):  # VIP
    segmentos.append([np.random.uniform(50, 100), np.random.uniform(30, 50), np.random.randint(5, 15)])
for _ in range(375):  # Frecuentes
    segmentos.append([np.random.uniform(20, 60), np.random.uniform(15, 35), np.random.randint(10, 30)])
for _ in range(375):  # Ocasionales
    segmentos.append([np.random.uniform(5, 30), np.random.uniform(5, 20), np.random.randint(1, 8)])
for _ in range(375):  # Inactivos
    segmentos.append([np.random.uniform(0, 10), np.random.uniform(0, 5), np.random.randint(0, 3)])

segmentos = np.array(segmentos)
np.random.shuffle(segmentos)

df = pd.DataFrame({
    "id_cliente": range(1, n + 1),
    "gasto_mensual_promedio": np.round(segmentos[:, 0], 2),
    "frecuencia_compra_mensual": np.round(segmentos[:, 1], 1),
    "antiguedad_meses": segmentos[:, 2].astype(int),
    "canal_preferido": np.random.choice(["tienda", "online", "app"], n),
    "ciudad": np.random.choice(["CDMX", "Bogotá", "Lima", "Santiago", "Buenos Aires"], n),
})
```

---

## E-commerce

### Ventas de productos (regresión/análisis)
```python
np.random.seed(42)
n = 3000

categorias = ["electrónica", "ropa", "hogar", "deportes", "libros"]
precios_base = {"electrónica": 500, "ropa": 80, "hogar": 150, "deportes": 120, "libros": 25}

cat = np.random.choice(categorias, n, p=[0.25, 0.3, 0.2, 0.15, 0.1])
precio = np.array([precios_base[c] * np.random.uniform(0.5, 2.0) for c in cat])

df = pd.DataFrame({
    "id_orden": range(1, n + 1),
    "fecha": pd.date_range("2024-01-01", periods=n, freq="3h"),
    "producto": [f"PROD-{np.random.randint(100, 999)}" for _ in range(n)],
    "categoria": cat,
    "precio": np.round(precio, 2),
    "cantidad": np.random.randint(1, 5, n),
    "descuento_pct": np.random.choice([0, 5, 10, 15, 20, 25], n, p=[0.4, 0.2, 0.15, 0.1, 0.1, 0.05]),
    "metodo_pago": np.random.choice(["tarjeta", "transferencia", "efectivo", "paypal"], n, p=[0.45, 0.25, 0.15, 0.15]),
    "calificacion": np.random.choice([1, 2, 3, 4, 5], n, p=[0.05, 0.08, 0.17, 0.35, 0.35]),
})

df["total"] = np.round(df["precio"] * df["cantidad"] * (1 - df["descuento_pct"] / 100), 2)
```

---

## Educación

### Rendimiento estudiantil
```python
np.random.seed(42)
n = 800

horas_estudio = np.round(np.random.uniform(0, 10, n), 1)
asistencia = np.round(np.random.uniform(0.4, 1.0, n) * 100, 0)

# Calificación correlacionada con estudio y asistencia
calificacion = 30 + 4 * horas_estudio + 0.3 * asistencia + np.random.normal(0, 8, n)
calificacion = np.clip(calificacion, 0, 100)

df = pd.DataFrame({
    "id_estudiante": range(1, n + 1),
    "horas_estudio_semanal": horas_estudio,
    "asistencia_pct": asistencia,
    "tareas_completadas": np.random.randint(0, 20, n),
    "participacion": np.random.choice(["baja", "media", "alta"], n, p=[0.3, 0.45, 0.25]),
    "tiene_tutor": np.random.choice([0, 1], n, p=[0.7, 0.3]),
    "calificacion_final": np.round(calificacion, 1),
    "aprobado": (calificacion >= 60).astype(int),
})
```

---

## Recursos Humanos

### Rotación de empleados (clasificación)
```python
np.random.seed(42)
n = 2500

satisfaccion = np.round(np.random.uniform(1, 5, n), 1)
salario = np.round(np.random.lognormal(10.5, 0.4, n), 0)
anos = np.random.randint(0, 30, n)

prob_salida = 1 / (1 + np.exp(-(1 - 0.5 * satisfaccion - 0.00001 * salario + 0.02 * anos)))
salio = np.random.binomial(1, prob_salida)

df = pd.DataFrame({
    "id_empleado": range(1, n + 1),
    "departamento": np.random.choice(["ventas", "tech", "rrhh", "marketing", "finanzas"], n),
    "nivel": np.random.choice(["junior", "mid", "senior", "lead"], n, p=[0.35, 0.3, 0.25, 0.1]),
    "salario_mensual": salario,
    "anos_empresa": anos,
    "satisfaccion": satisfaccion,
    "horas_extra_mes": np.random.randint(0, 40, n),
    "num_proyectos": np.random.randint(1, 10, n),
    "ultima_promocion_anos": np.random.randint(0, 8, n),
    "salio_empresa": salio,
})
```
