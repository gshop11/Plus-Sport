# Tips de Narración para Contenido Técnico

## Ritmo y pacing

### La regla 30-60-30
- **30 segundos** de explicación verbal
- **60 segundos** de demostración visual (Manim o código)
- **30 segundos** de conexión (vincular lo que se vio con lo que viene)

Esto evita que el video sea solo "alguien hablando" o solo "animaciones sin contexto".

### Velocidad por nivel
- **Principiante:** ~120 palabras/minuto — pausado, con repeticiones clave
- **Intermedio:** ~150 palabras/minuto — fluido, sin repeticiones
- **Avanzado:** ~170 palabras/minuto — directo, asume vocabulario

### Pausas estratégicas
- **Pausa de 1-2 segundos** después de revelar un concepto nuevo (dejar que se asimile)
- **Pausa de 0.5 segundos** entre oraciones normales
- **Pausa de 2-3 segundos** después de una pregunta retórica (crear expectativa)

## Lenguaje y tono

### Tono conversacional profesional
**Bien:** "Ahora viene la parte interesante: vamos a ver cómo el modelo aprende de sus errores."
**Mal:** "A continuación procederemos a examinar el mecanismo mediante el cual el modelo iterativamente optimiza su función de pérdida."
**Mal:** "Ok entonces básicamente lo que pasa es que... eh... el modelo como que aprende, ¿no?"

### Términos técnicos
- **Mantener en inglés** cuando son estándar: machine learning, dataset, overfitting, feature, pipeline, deploy
- **Traducir** cuando la traducción es clara y usada: modelo, entrenamiento, validación, predicción, sesgo
- **Primera mención:** definir brevemente — "el overfitting, o sobreajuste, es cuando..."
- **Menciones posteriores:** usar directamente sin definir de nuevo

### Conectores narrativos
Usa estos para mantener el flujo entre secciones:

| Para introducir | Para conectar | Para concluir |
|-----------------|---------------|---------------|
| "Lo primero que necesitamos entender es..." | "Ahora que sabemos X, podemos..." | "Entonces, lo que acabamos de ver es..." |
| "Imagina que..." | "Esto se conecta directamente con..." | "En resumen..." |
| "Antes de empezar, una pregunta:" | "Y aquí es donde se pone interesante:" | "El punto clave es..." |
| "Empecemos por lo más básico:" | "Con esto en mente..." | "Para recapitular:" |

### Analogías efectivas

Las analogías conectan conceptos técnicos con experiencias cotidianas:

| Concepto | Analogía |
|----------|----------|
| Overfitting | "Es como estudiar solo las respuestas del examen anterior sin entender la materia" |
| Gradient descent | "Imagina que estás en una montaña con niebla y quieres bajar: solo puedes sentir la pendiente bajo tus pies" |
| Random Forest | "En vez de consultar a un solo experto, preguntas a 100 y te quedas con la respuesta más popular" |
| Regularización | "Es como ponerle un presupuesto a tu modelo: no puede gastar demasiados recursos en detalles" |
| Embeddings | "Es como darle coordenadas GPS a cada palabra, donde palabras similares quedan cerca" |
| Backpropagation | "Es como un profesor que revisa un examen de atrás para adelante y marca dónde están los errores" |
| Learning rate | "Es el tamaño del paso que das al bajar la montaña: muy grande y te pasas, muy pequeño y nunca llegas" |
| Batch size | "Es como estudiar de a capítulos: uno a la vez (batch=1) o todo el libro de golpe (batch=todo)" |

## Errores comunes a evitar

### 1. El monólogo de definiciones
**Mal:** "La regresión lineal es un método estadístico que modela la relación entre una variable dependiente y una o más variables independientes..."

**Bien:** "Si te doy el tamaño de una casa en metros cuadrados, ¿podrías adivinar su precio? Eso es básicamente lo que hace la regresión lineal."

### 2. Asumir conocimiento
**Mal:** "Ahora aplicamos SGD con momentum y learning rate decay..."

**Bien:** "Ahora vamos a usar un optimizador — que es básicamente el algoritmo que decide cómo actualizar los pesos de la red..."

### 3. El "como pueden ver"
Evitar frases como "como pueden ver" o "es obvio que". Si fuera obvio, no necesitarían el video.

### 4. Explicar sin mostrar
Cada concepto debe tener su visualización. Si estás hablando de datos, muéstralos. Si hablas de un gráfico, anímalo.

### 5. Bloques de código demasiado largos
Máximo 8-10 líneas de código a la vez en pantalla. Si el código es más largo, dividirlo en bloques y explicar cada uno por separado.

## Estructura narrativa por tipo de video

### Video conceptual (qué es X)
1. Hook: problema que X resuelve
2. Intuición visual con Manim
3. Formalización (fórmula, si aplica)
4. Ejemplo simple
5. Ejemplo del mundo real
6. Resumen + siguiente video

### Video tutorial (cómo implementar X)
1. Hook: mostrar el resultado final
2. Breve teoría (2 min máx)
3. Setup del código
4. Implementación paso a paso
5. Resultado + interpretación
6. Variaciones y mejoras
7. Resumen + siguiente video

### Video comparativo (X vs Y)
1. Hook: "¿Cuándo usar X y cuándo Y?"
2. Explicar X brevemente
3. Explicar Y brevemente
4. Comparación visual lado a lado
5. Tabla de pros/contras
6. Regla práctica de cuándo usar cada uno
7. Resumen + siguiente video

## Checklist pre-grabación

- [ ] El hook es fuerte y engancha en los primeros 10 segundos
- [ ] Cada sección tiene una animación Manim o visual asociado
- [ ] Los términos técnicos se definen la primera vez que aparecen
- [ ] El código se divide en bloques manejables (max 10 líneas)
- [ ] Hay al menos una analogía del mundo real
- [ ] El resumen tiene exactamente 3 puntos clave
- [ ] El CTA menciona el siguiente video por nombre
- [ ] La duración está dentro del rango recomendado para el nivel
