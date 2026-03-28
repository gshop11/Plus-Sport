# Testing y Debugging en Java

Guía de pruebas, depuración y resolución de errores.

---

## JUnit 5 — Testing

### Setup básico

Para usar JUnit 5 en Eclipse:
1. Click derecho en el proyecto → `Build Path` → `Add Libraries` → `JUnit` → `JUnit 5`
2. Crear clase de test: `New` → `JUnit Test Case`

### Estructura de un test

```java
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import static org.junit.jupiter.api.Assertions.*;

public class CalculadoraTest {

    private Calculadora calc;

    @BeforeEach
    void setUp() {
        calc = new Calculadora();  // Se ejecuta antes de cada test
    }

    @Test
    void testSumar() {
        assertEquals(5, calc.sumar(2, 3));
    }

    @Test
    void testDividir() {
        assertEquals(2.5, calc.dividir(5, 2), 0.001);
    }

    @Test
    void testDividirPorCero() {
        assertThrows(ArithmeticException.class, () -> {
            calc.dividir(5, 0);
        });
    }
}
```

### Assertions comunes

```java
// Igualdad
assertEquals(esperado, actual);
assertEquals(3.14, valor, 0.01);     // Con tolerancia para doubles

// Verdadero/Falso
assertTrue(condicion);
assertFalse(condicion);

// Nulo/No nulo
assertNull(objeto);
assertNotNull(objeto);

// Excepciones
assertThrows(NumberFormatException.class, () -> {
    Integer.parseInt("abc");
});

// Arrays iguales
assertArrayEquals(new int[]{1, 2, 3}, resultado);
```

### Test para algoritmos

```java
public class OrdenamientoTest {

    @Test
    void testBubbleSort() {
        int[] arr = {5, 3, 8, 1, 9};
        Ordenamiento.bubbleSort(arr);
        assertArrayEquals(new int[]{1, 3, 5, 8, 9}, arr);
    }

    @Test
    void testBubbleSortVacio() {
        int[] arr = {};
        Ordenamiento.bubbleSort(arr);
        assertArrayEquals(new int[]{}, arr);
    }

    @Test
    void testBubbleSortUnElemento() {
        int[] arr = {42};
        Ordenamiento.bubbleSort(arr);
        assertArrayEquals(new int[]{42}, arr);
    }

    @Test
    void testBubbleSortYaOrdenado() {
        int[] arr = {1, 2, 3, 4, 5};
        Ordenamiento.bubbleSort(arr);
        assertArrayEquals(new int[]{1, 2, 3, 4, 5}, arr);
    }

    @Test
    void testBubbleSortInverso() {
        int[] arr = {5, 4, 3, 2, 1};
        Ordenamiento.bubbleSort(arr);
        assertArrayEquals(new int[]{1, 2, 3, 4, 5}, arr);
    }
}
```

### Test parametrizado

```java
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

public class PrimoTest {

    @ParameterizedTest
    @CsvSource({
        "2, true",
        "3, true",
        "4, false",
        "7, true",
        "9, false",
        "11, true",
        "1, false",
        "0, false",
        "-1, false"
    })
    void testEsPrimo(int numero, boolean esperado) {
        assertEquals(esperado, Matematica.esPrimo(numero));
    }
}
```

---

## Debugging en Eclipse

### Puntos de interrupción (Breakpoints)

1. **Agregar breakpoint:** Doble clic en el margen izquierdo de la línea
2. **Ejecutar en modo Debug:** Click derecho → `Debug As` → `Java Application`
3. **Controles de debug:**
   - **F5 (Step Into):** Entrar a un método
   - **F6 (Step Over):** Ejecutar línea sin entrar al método
   - **F7 (Step Return):** Salir del método actual
   - **F8 (Resume):** Continuar hasta el siguiente breakpoint
4. **Ver variables:** Panel `Variables` muestra valores actuales
5. **Evaluar expresiones:** Panel `Expressions` → agregar expresión a evaluar

### Debugging con prints

```java
// Técnica básica: imprimir valores en puntos clave
System.out.println("DEBUG: valor de x = " + x);
System.out.println("DEBUG: entró al if de la línea 42");
System.out.println("DEBUG: iteración i=" + i + ", suma=" + suma);
System.out.println("DEBUG: array = " + Arrays.toString(arr));

// Para matrices
System.out.println("DEBUG: matriz = " + Arrays.deepToString(matriz));

// Marcar inicio/fin de método
System.out.println(">>> Entrando a calcularArea()");
System.out.println("<<< Saliendo de calcularArea(), resultado = " + area);
```

---

## Errores Comunes y Soluciones

### Errores de compilación

| Error | Ejemplo | Causa | Solución |
|---|---|---|---|
| `';' expected` | `int x = 5` | Falta `;` | Agregar `;` al final |
| `cannot find symbol` | `system.out.println` | Typo o no declarado | `System` con S mayúscula |
| `incompatible types` | `int x = "hola"` | Tipo incorrecto | Verificar tipos |
| `missing return` | Método sin `return` | Falta retorno | Agregar `return` en todos los caminos |
| `unreachable statement` | Código después de `return` | Código muerto | Eliminar o mover |
| `variable might not have been initialized` | `int x; println(x);` | Sin valor inicial | Inicializar: `int x = 0;` |
| `non-static method cannot be referenced from a static context` | Llamar método de instancia desde `main` | `main` es static | Crear instancia o hacer método static |

### Errores de ejecución

| Error | Causa | Solución |
|---|---|---|
| `NullPointerException` | Usar objeto sin inicializar | Verificar `!= null` o inicializar con `new` |
| `ArrayIndexOutOfBoundsException` | `arr[arr.length]` | Usar `arr.length - 1` para último |
| `StringIndexOutOfBoundsException` | `s.charAt(s.length())` | Usar `s.length() - 1` |
| `NumberFormatException` | `Integer.parseInt("abc")` | Validar con try-catch |
| `ArithmeticException` | `10 / 0` | Verificar divisor `!= 0` |
| `StackOverflowError` | Recursión sin caso base | Agregar/verificar caso base |
| `ConcurrentModificationException` | Modificar lista mientras se recorre | Usar iterador o recorrer copia |
| `ClassCastException` | Cast incorrecto | Verificar tipo con `instanceof` |

### Errores lógicos

| Problema | Ejemplo | Solución |
|---|---|---|
| Off-by-one | `for (i=0; i<=arr.length; i++)` | `i < arr.length` |
| División entera | `int promedio = suma / n;` | `double promedio = (double) suma / n;` |
| Strings con `==` | `if (s == "hola")` | `if (s.equals("hola"))` |
| Variable no acumulada | `suma = arr[i];` dentro del for | `suma += arr[i];` |
| Scope incorrecto | Declarar dentro de `if`/`for` | Declarar antes del bloque |
| Condición invertida | `if (x > 5)` cuando debería ser `<` | Revisar la lógica |
| Break faltante en switch | `case 1: ...; case 2: ...;` | Agregar `break;` en cada case |

---

## Leer Stacktraces

### Estructura de un stacktrace

```
Exception in thread "main" java.lang.NumberFormatException: For input string: "abc"
    at java.base/java.lang.Integer.parseInt(Integer.java:652)
    at java.base/java.lang.Integer.parseInt(Integer.java:770)
    at gui.AreasCilindro$1.actionPerformed(AreasCilindro.java:45)
    at javax.swing.AbstractButton.fireActionPerformed(AbstractButton.java:1967)
```

**Cómo leerlo (de arriba a abajo):**

1. **Línea 1:** Tipo de error y mensaje → `NumberFormatException: "abc"` no es número
2. **Líneas siguientes:** Pila de llamadas (de la más interna a la más externa)
3. **Buscar TU código:** La primera línea que menciona TU paquete/clase
   → `gui.AreasCilindro$1.actionPerformed(AreasCilindro.java:45)` = línea 45
4. **`$1`** = clase anónima (el ActionListener)

### Stacktraces comunes

**NullPointerException:**
```
Exception in thread "main" java.lang.NullPointerException
    at MiClase.metodo(MiClase.java:15)
```
→ En línea 15, algún objeto es `null`. Verificar qué variable se usa ahí.

**ArrayIndexOutOfBoundsException:**
```
Exception: ArrayIndexOutOfBoundsException: Index 5 out of bounds for length 5
    at MiClase.metodo(MiClase.java:22)
```
→ El array tiene 5 elementos (índices 0-4), pero se accede al índice 5.

---

## Edge Cases (Casos Borde)

### Checklist para probar algoritmos

Siempre probar con estos casos:

| Caso | Ejemplo | Por qué importa |
|---|---|---|
| **Vacío** | Array `[]`, String `""` | Puede causar excepciones |
| **Un solo elemento** | `[42]`, `"a"` | Loops pueden no ejecutarse |
| **Dos elementos** | `[3, 1]` | Mínimo para comparar |
| **Ya ordenado** | `[1, 2, 3, 4]` | Algoritmo puede fallar o ser ineficiente |
| **Orden inverso** | `[4, 3, 2, 1]` | Peor caso para muchos algoritmos |
| **Todos iguales** | `[5, 5, 5, 5]` | Puede causar loops infinitos |
| **Negativos** | `[-3, -1, -2]` | Aritmética puede fallar |
| **Cero** | `n = 0`, `arr[0] = 0` | División por cero, índice 0 |
| **Valores grandes** | `n = Integer.MAX_VALUE` | Overflow |
| **null** | `arr = null` | NullPointerException |

### Patrón de validación robusto

```java
public static int buscar(int[] arr, int buscado) {
    // Validar entrada
    if (arr == null || arr.length == 0) {
        return -1;
    }

    // Algoritmo
    for (int i = 0; i < arr.length; i++) {
        if (arr[i] == buscado) {
            return i;
        }
    }
    return -1;
}
```

---

## Validación de Entrada en GUI

### Patrón try-catch completo

```java
btnCalcular.addActionListener(new ActionListener() {
    public void actionPerformed(ActionEvent e) {
        // Validar que los campos no estén vacíos
        if (txtRadio.getText().trim().isEmpty()) {
            JOptionPane.showMessageDialog(null,
                "El campo Radio no puede estar vacío",
                "Error", JOptionPane.ERROR_MESSAGE);
            txtRadio.requestFocus();
            return;
        }

        try {
            double radio = Double.parseDouble(txtRadio.getText().trim());

            // Validar rango
            if (radio <= 0) {
                JOptionPane.showMessageDialog(null,
                    "El radio debe ser mayor que cero",
                    "Error", JOptionPane.ERROR_MESSAGE);
                return;
            }

            // Operaciones
            double area = Math.PI * radio * radio;
            lblResultado.setText(String.format("Área: %.2f", area));

        } catch (NumberFormatException ex) {
            JOptionPane.showMessageDialog(null,
                "Por favor ingrese un número válido en Radio",
                "Error de formato", JOptionPane.ERROR_MESSAGE);
            txtRadio.requestFocus();
            txtRadio.selectAll();
        }
    }
});
```

### Método reutilizable para validar

```java
// Método auxiliar para validar entrada numérica
private double leerDouble(JTextField campo, String nombreCampo) throws Exception {
    String texto = campo.getText().trim();
    if (texto.isEmpty()) {
        throw new Exception("El campo " + nombreCampo + " no puede estar vacío");
    }
    try {
        return Double.parseDouble(texto);
    } catch (NumberFormatException e) {
        throw new Exception("El campo " + nombreCampo + " debe ser un número válido");
    }
}

// Uso en ActionListener
btnCalcular.addActionListener(e -> {
    try {
        double radio = leerDouble(txtRadio, "Radio");
        double altura = leerDouble(txtAltura, "Altura");

        // Operaciones...
        double area = Math.PI * radio * radio;
        lblResultado.setText("Área: " + String.format("%.2f", area));

    } catch (Exception ex) {
        JOptionPane.showMessageDialog(null, ex.getMessage(),
            "Error", JOptionPane.ERROR_MESSAGE);
    }
});
```

---

## Manejo de Excepciones

### try-catch-finally

```java
try {
    // Código que puede fallar
    int resultado = Integer.parseInt(texto);
} catch (NumberFormatException e) {
    // Manejar error específico
    System.out.println("No es un número: " + e.getMessage());
} catch (Exception e) {
    // Manejar cualquier otro error
    System.out.println("Error inesperado: " + e.getMessage());
} finally {
    // Se ejecuta SIEMPRE (con o sin error)
    System.out.println("Fin del proceso");
}
```

### Lanzar excepciones

```java
public static double dividir(double a, double b) {
    if (b == 0) {
        throw new ArithmeticException("No se puede dividir por cero");
    }
    return a / b;
}

public static void validarEdad(int edad) {
    if (edad < 0 || edad > 150) {
        throw new IllegalArgumentException("Edad inválida: " + edad);
    }
}
```

### Excepciones personalizadas

```java
public class EdadInvalidaException extends Exception {
    public EdadInvalidaException(String mensaje) {
        super(mensaje);
    }
}

// Uso
public static void validarEdad(int edad) throws EdadInvalidaException {
    if (edad < 0 || edad > 150) {
        throw new EdadInvalidaException("La edad " + edad + " no es válida");
    }
}
```
