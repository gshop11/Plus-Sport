# Patrones Algorítmicos y Estructuras de Datos

Guía completa de algoritmia para el curso: desde estructuras de datos hasta técnicas avanzadas.

---

## Estructuras de Datos

### Arrays

```java
// Crear
int[] arr = new int[10];
int[] arr = {5, 3, 8, 1, 9};

// Operaciones básicas
arr.length;           // Tamaño
arr[0];               // Acceder
arr[2] = 42;          // Modificar

// Recorrer
for (int i = 0; i < arr.length; i++) {
    System.out.println(arr[i]);
}
```

### ArrayList — Lista dinámica

```java
import java.util.ArrayList;

ArrayList<Integer> lista = new ArrayList<>();
lista.add(10);            // Agregar al final
lista.add(0, 5);          // Agregar en posición 0
lista.get(0);             // Obtener elemento
lista.set(1, 20);         // Modificar
lista.remove(0);          // Eliminar por índice
lista.size();             // Tamaño
lista.contains(10);       // Buscar
lista.indexOf(20);        // Índice de elemento
lista.isEmpty();          // ¿Está vacía?
lista.clear();            // Vaciar

// Recorrer
for (int i = 0; i < lista.size(); i++) {
    System.out.println(lista.get(i));
}
for (int elem : lista) {
    System.out.println(elem);
}
```

### Stack — Pila (LIFO: último en entrar, primero en salir)

```java
import java.util.Stack;

Stack<Integer> pila = new Stack<>();
pila.push(10);        // Apilar
pila.push(20);
pila.push(30);
pila.pop();           // Desapilar → 30
pila.peek();          // Ver tope sin sacar → 20
pila.isEmpty();       // ¿Está vacía?
pila.size();          // Tamaño
```

**Usos:** Deshacer/rehacer, paréntesis balanceados, evaluación de expresiones.

### Queue — Cola (FIFO: primero en entrar, primero en salir)

```java
import java.util.LinkedList;
import java.util.Queue;

Queue<String> cola = new LinkedList<>();
cola.offer("A");      // Encolar
cola.offer("B");
cola.offer("C");
cola.poll();          // Desencolar → "A"
cola.peek();          // Ver frente → "B"
cola.isEmpty();
cola.size();
```

**Usos:** Turnos, procesos en espera, BFS.

### HashMap — Diccionario clave-valor

```java
import java.util.HashMap;

HashMap<String, Integer> mapa = new HashMap<>();
mapa.put("Juan", 90);
mapa.put("María", 85);
mapa.get("Juan");              // 90
mapa.containsKey("Pedro");     // false
mapa.remove("María");
mapa.size();

// Recorrer
for (String clave : mapa.keySet()) {
    System.out.println(clave + ": " + mapa.get(clave));
}
```

**Usos:** Contar frecuencias, cachés, búsqueda O(1).

### LinkedList — Lista enlazada

```java
import java.util.LinkedList;

LinkedList<Integer> lista = new LinkedList<>();
lista.addFirst(10);       // Al inicio
lista.addLast(30);        // Al final
lista.add(1, 20);         // En posición
lista.getFirst();         // Primer elemento
lista.getLast();           // Último elemento
lista.removeFirst();
lista.removeLast();
```

---

## Algoritmos de Ordenamiento

### Bubble Sort — Burbuja

```
//PSEUDOCÓDIGO
para i = 0 hasta n-2 hacer
    para j = 0 hasta n-2-i hacer
        si (arr[j] > arr[j+1]) entonces
            intercambiar(arr[j], arr[j+1])
        fin si
    fin para
fin para
```

```java
public static void bubbleSort(int[] arr) {
    int n = arr.length;
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - 1 - i; j++) {
            if (arr[j] > arr[j + 1]) {
                // Intercambiar
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
}
```

**Complejidad:** O(n²) — Lento, pero fácil de entender.

### Selection Sort — Selección

```
//PSEUDOCÓDIGO
para i = 0 hasta n-2 hacer
    minIdx = i
    para j = i+1 hasta n-1 hacer
        si (arr[j] < arr[minIdx]) entonces
            minIdx = j
        fin si
    fin para
    intercambiar(arr[i], arr[minIdx])
fin para
```

```java
public static void selectionSort(int[] arr) {
    int n = arr.length;
    for (int i = 0; i < n - 1; i++) {
        int minIdx = i;
        for (int j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIdx]) {
                minIdx = j;
            }
        }
        int temp = arr[i];
        arr[i] = arr[minIdx];
        arr[minIdx] = temp;
    }
}
```

**Complejidad:** O(n²) — Menos intercambios que Bubble Sort.

### Insertion Sort — Inserción

```java
public static void insertionSort(int[] arr) {
    for (int i = 1; i < arr.length; i++) {
        int clave = arr[i];
        int j = i - 1;
        while (j >= 0 && arr[j] > clave) {
            arr[j + 1] = arr[j];
            j--;
        }
        arr[j + 1] = clave;
    }
}
```

**Complejidad:** O(n²) — Eficiente para arrays casi ordenados.

### Merge Sort — Mezcla (Divide y vencerás)

```java
public static void mergeSort(int[] arr, int inicio, int fin) {
    if (inicio < fin) {
        int medio = (inicio + fin) / 2;
        mergeSort(arr, inicio, medio);
        mergeSort(arr, medio + 1, fin);
        merge(arr, inicio, medio, fin);
    }
}

private static void merge(int[] arr, int inicio, int medio, int fin) {
    int[] izq = new int[medio - inicio + 1];
    int[] der = new int[fin - medio];

    System.arraycopy(arr, inicio, izq, 0, izq.length);
    System.arraycopy(arr, medio + 1, der, 0, der.length);

    int i = 0, j = 0, k = inicio;
    while (i < izq.length && j < der.length) {
        if (izq[i] <= der[j]) {
            arr[k++] = izq[i++];
        } else {
            arr[k++] = der[j++];
        }
    }
    while (i < izq.length) arr[k++] = izq[i++];
    while (j < der.length) arr[k++] = der[j++];
}
```

**Complejidad:** O(n log n) — Rápido y estable.

### Quick Sort — Rápido

```java
public static void quickSort(int[] arr, int inicio, int fin) {
    if (inicio < fin) {
        int pivote = partition(arr, inicio, fin);
        quickSort(arr, inicio, pivote - 1);
        quickSort(arr, pivote + 1, fin);
    }
}

private static int partition(int[] arr, int inicio, int fin) {
    int pivote = arr[fin];
    int i = inicio - 1;
    for (int j = inicio; j < fin; j++) {
        if (arr[j] < pivote) {
            i++;
            int temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        }
    }
    int temp = arr[i + 1];
    arr[i + 1] = arr[fin];
    arr[fin] = temp;
    return i + 1;
}
```

**Complejidad:** O(n log n) promedio, O(n²) peor caso.

### Comparación de algoritmos de ordenamiento

| Algoritmo | Mejor | Promedio | Peor | Espacio | Estable |
|---|---|---|---|---|---|
| Bubble Sort | O(n) | O(n²) | O(n²) | O(1) | Sí |
| Selection Sort | O(n²) | O(n²) | O(n²) | O(1) | No |
| Insertion Sort | O(n) | O(n²) | O(n²) | O(1) | Sí |
| Merge Sort | O(n log n) | O(n log n) | O(n log n) | O(n) | Sí |
| Quick Sort | O(n log n) | O(n log n) | O(n²) | O(log n) | No |

---

## Algoritmos de Búsqueda

### Búsqueda Lineal

```
//PSEUDOCÓDIGO
para i = 0 hasta n-1 hacer
    si (arr[i] == buscado) entonces
        retornar i
    fin si
fin para
retornar -1
```

```java
public static int busquedaLineal(int[] arr, int buscado) {
    for (int i = 0; i < arr.length; i++) {
        if (arr[i] == buscado) {
            return i;
        }
    }
    return -1; // No encontrado
}
```

**Complejidad:** O(n)

### Búsqueda Binaria (array ordenado)

```
//PSEUDOCÓDIGO
inicio = 0
fin = n - 1
mientras (inicio <= fin) hacer
    medio = (inicio + fin) / 2
    si (arr[medio] == buscado) entonces
        retornar medio
    sino si (arr[medio] < buscado) entonces
        inicio = medio + 1
    sino
        fin = medio - 1
    fin si
fin mientras
retornar -1
```

```java
public static int busquedaBinaria(int[] arr, int buscado) {
    int inicio = 0, fin = arr.length - 1;
    while (inicio <= fin) {
        int medio = (inicio + fin) / 2;
        if (arr[medio] == buscado) {
            return medio;
        } else if (arr[medio] < buscado) {
            inicio = medio + 1;
        } else {
            fin = medio - 1;
        }
    }
    return -1;
}
```

**Complejidad:** O(log n) — Requiere array ordenado.

---

## Recursión

### Concepto

Una función que se llama a sí misma. Siempre necesita:
1. **Caso base:** condición de parada
2. **Caso recursivo:** la función se llama con un problema más pequeño

### Factorial

```
//PSEUDOCÓDIGO
funcion factorial(n)
    si (n <= 1) entonces
        retornar 1
    sino
        retornar n * factorial(n - 1)
    fin si
fin funcion
```

```java
public static int factorial(int n) {
    if (n <= 1) return 1;           // Caso base
    return n * factorial(n - 1);     // Caso recursivo
}
// factorial(5) = 5 * 4 * 3 * 2 * 1 = 120
```

### Fibonacci

```java
public static int fibonacci(int n) {
    if (n <= 0) return 0;
    if (n == 1) return 1;
    return fibonacci(n - 1) + fibonacci(n - 2);
}
// 0, 1, 1, 2, 3, 5, 8, 13, 21, 34...
```

**Complejidad:** O(2ⁿ) — Muy lento. Mejorar con programación dinámica.

### Potencia

```java
public static int potencia(int base, int exp) {
    if (exp == 0) return 1;
    return base * potencia(base, exp - 1);
}
```

### Torres de Hanói

```java
public static void hanoi(int n, char origen, char destino, char auxiliar) {
    if (n == 1) {
        System.out.println("Mover disco 1 de " + origen + " a " + destino);
        return;
    }
    hanoi(n - 1, origen, auxiliar, destino);
    System.out.println("Mover disco " + n + " de " + origen + " a " + destino);
    hanoi(n - 1, auxiliar, destino, origen);
}
```

---

## Técnicas Algorítmicas

### Acumuladores y Contadores

```java
// Sumar elementos de un array
int suma = 0;
for (int i = 0; i < arr.length; i++) {
    suma += arr[i];    // Acumulador
}

// Contar pares
int contPares = 0;
for (int i = 0; i < arr.length; i++) {
    if (arr[i] % 2 == 0) {
        contPares++;   // Contador
    }
}

// Encontrar máximo
int max = arr[0];
for (int i = 1; i < arr.length; i++) {
    if (arr[i] > max) {
        max = arr[i];
    }
}

// Encontrar mínimo
int min = arr[0];
for (int i = 1; i < arr.length; i++) {
    if (arr[i] < min) {
        min = arr[i];
    }
}

// Promedio
double promedio = (double) suma / arr.length;
```

### Two Pointers (Dos punteros)

```java
// Verificar si un String es palíndromo
public static boolean esPalindromo(String s) {
    int izq = 0, der = s.length() - 1;
    while (izq < der) {
        if (s.charAt(izq) != s.charAt(der)) {
            return false;
        }
        izq++;
        der--;
    }
    return true;
}
```

### Programación Dinámica — Memoización

```java
// Fibonacci con memoización (O(n) en vez de O(2ⁿ))
static int[] memo;

public static int fibMemo(int n) {
    if (n <= 0) return 0;
    if (n == 1) return 1;
    if (memo[n] != 0) return memo[n];  // Ya calculado
    memo[n] = fibMemo(n - 1) + fibMemo(n - 2);
    return memo[n];
}

// Uso:
memo = new int[n + 1];
System.out.println(fibMemo(n));
```

### Programación Dinámica — Tabulación

```java
// Fibonacci con tabulación (bottom-up)
public static int fibTab(int n) {
    if (n <= 1) return n;
    int[] dp = new int[n + 1];
    dp[0] = 0;
    dp[1] = 1;
    for (int i = 2; i <= n; i++) {
        dp[i] = dp[i - 1] + dp[i - 2];
    }
    return dp[n];
}
```

### Backtracking

```java
// Generar todas las permutaciones de un array
public static void permutaciones(int[] arr, int inicio) {
    if (inicio == arr.length - 1) {
        System.out.println(Arrays.toString(arr));
        return;
    }
    for (int i = inicio; i < arr.length; i++) {
        // Intercambiar
        int temp = arr[inicio];
        arr[inicio] = arr[i];
        arr[i] = temp;

        permutaciones(arr, inicio + 1);  // Recursión

        // Deshacer intercambio (backtrack)
        temp = arr[inicio];
        arr[inicio] = arr[i];
        arr[i] = temp;
    }
}
```

### Greedy (Voraz)

```java
// Problema del cambio: mínimas monedas
public static int cambioMonedas(int monto, int[] monedas) {
    Arrays.sort(monedas);  // Ordenar descendente
    int count = 0;
    for (int i = monedas.length - 1; i >= 0; i--) {
        while (monto >= monedas[i]) {
            monto -= monedas[i];
            count++;
        }
    }
    return count;
}
```

---

## Análisis de Complejidad (Big O)

### Tabla de referencia

| Notación | Nombre | Ejemplo |
|---|---|---|
| O(1) | Constante | Acceder a `arr[i]`, `HashMap.get()` |
| O(log n) | Logarítmica | Búsqueda binaria |
| O(n) | Lineal | Búsqueda lineal, recorrer array |
| O(n log n) | Linealítmica | Merge Sort, Quick Sort |
| O(n²) | Cuadrática | Bubble Sort, dos for anidados |
| O(n³) | Cúbica | Tres for anidados |
| O(2ⁿ) | Exponencial | Fibonacci recursivo sin memo |
| O(n!) | Factorial | Permutaciones |

### Cómo analizar

```java
// O(1) - Constante
int x = arr[0];

// O(n) - Un ciclo
for (int i = 0; i < n; i++) { ... }

// O(n²) - Dos ciclos anidados
for (int i = 0; i < n; i++) {
    for (int j = 0; j < n; j++) { ... }
}

// O(n * m) - Dos ciclos con diferentes tamaños
for (int i = 0; i < n; i++) {
    for (int j = 0; j < m; j++) { ... }
}

// O(log n) - Dividir por 2 en cada paso
while (n > 0) {
    n = n / 2;
}

// O(n log n) - Ciclo lineal con operación logarítmica
for (int i = 0; i < n; i++) {       // O(n)
    busquedaBinaria(arr, i);          // O(log n)
}
```

### Reglas para calcular Big O

1. **Ignorar constantes:** O(3n) → O(n)
2. **Quedarse con el término dominante:** O(n² + n) → O(n²)
3. **Secuencial = sumar:** O(n) + O(m) = O(n + m)
4. **Anidado = multiplicar:** O(n) * O(m) = O(n * m)

---

## Ejercicios Clásicos de Algoritmia

### Verificar si un número es primo

```java
public static boolean esPrimo(int n) {
    if (n <= 1) return false;
    for (int i = 2; i <= Math.sqrt(n); i++) {
        if (n % i == 0) return false;
    }
    return true;
}
```

### MCD (Máximo Común Divisor) — Algoritmo de Euclides

```java
public static int mcd(int a, int b) {
    while (b != 0) {
        int temp = b;
        b = a % b;
        a = temp;
    }
    return a;
}
```

### Invertir un array

```java
public static void invertir(int[] arr) {
    int izq = 0, der = arr.length - 1;
    while (izq < der) {
        int temp = arr[izq];
        arr[izq] = arr[der];
        arr[der] = temp;
        izq++;
        der--;
    }
}
```

### Contar frecuencia de elementos

```java
public static void frecuencia(int[] arr) {
    HashMap<Integer, Integer> freq = new HashMap<>();
    for (int num : arr) {
        freq.put(num, freq.getOrDefault(num, 0) + 1);
    }
    for (int clave : freq.keySet()) {
        System.out.println(clave + " aparece " + freq.get(clave) + " veces");
    }
}
```

### Serie de Fibonacci hasta N

```java
public static void fibHasta(int n) {
    int a = 0, b = 1;
    while (a <= n) {
        System.out.print(a + " ");
        int temp = a + b;
        a = b;
        b = temp;
    }
}
```

### Suma de dígitos

```java
public static int sumaDigitos(int n) {
    int suma = 0;
    n = Math.abs(n);
    while (n > 0) {
        suma += n % 10;
        n /= 10;
    }
    return suma;
}
```

### Número palíndromo

```java
public static boolean esPalindromo(int n) {
    int original = n;
    int invertido = 0;
    while (n > 0) {
        invertido = invertido * 10 + n % 10;
        n /= 10;
    }
    return original == invertido;
}
```
