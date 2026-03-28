# Fundamentos de Java

Guía completa de fundamentos de Java para el curso de algoritmia.

---

## Mapeo Pseudocódigo → Java

### Formato del curso

El pseudocódigo del curso sigue esta estructura:

```
//INICIO

//DECLARACIÓN DE VARIABLES
tipo nombre;

//ENTRADA DE DATOS
variable = leerDato();

//OPERACIONES
resultado = expresión;

//MOSTRAR LOS RESULTADOS
imprimir(resultado);

//FIN
```

### Tabla de conversión completa

| Pseudocódigo | Java (Consola) | Java (GUI Swing) |
|---|---|---|
| **Estructura** | | |
| `//INICIO` | `public static void main(String[] args) {` | Constructor / `actionPerformed()` |
| `//FIN` | `}` | `}` |
| **Tipos de datos** | | |
| `entero x;` | `int x;` | `int x;` |
| `real y;` | `double y;` | `double y;` |
| `cadena s;` | `String s;` | `String s;` |
| `logico b;` | `boolean b;` | `boolean b;` |
| `caracter c;` | `char c;` | `char c;` |
| **Entrada de datos** | | |
| `x = leerEntero();` | `x = sc.nextInt();` | `x = Integer.parseInt(txtX.getText());` |
| `y = leerReal();` | `y = sc.nextDouble();` | `y = Double.parseDouble(txtY.getText());` |
| `s = leerCadena();` | `s = sc.nextLine();` | `s = txtS.getText();` |
| `c = leerCaracter();` | `c = sc.next().charAt(0);` | `c = txtC.getText().charAt(0);` |
| **Salida de datos** | | |
| `imprimir(x)` | `System.out.println(x);` | `lblRes.setText("" + x);` |
| `imprimir("texto")` | `System.out.println("texto");` | `lblRes.setText("texto");` |
| **Condicionales** | | |
| `si (cond) entonces` | `if (cond) {` | `if (cond) {` |
| `sino` | `} else {` | `} else {` |
| `sino si (cond) entonces` | `} else if (cond) {` | `} else if (cond) {` |
| `fin si` | `}` | `}` |
| `segun (var)` | `switch (var) {` | `switch (var) {` |
| `caso valor:` | `case valor:` | `case valor:` |
| `defecto:` | `default:` | `default:` |
| **Ciclos** | | |
| `mientras (cond) hacer` | `while (cond) {` | `while (cond) {` |
| `hacer...mientras (cond)` | `do { } while (cond);` | `do { } while (cond);` |
| `para i=1 hasta n hacer` | `for (int i=1; i<=n; i++) {` | `for (int i=1; i<=n; i++) {` |
| `fin mientras/para` | `}` | `}` |
| **Operaciones** | | |
| `x mod y` | `x % y` | `x % y` |
| `raiz(x)` | `Math.sqrt(x)` | `Math.sqrt(x)` |
| `potencia(x, n)` | `Math.pow(x, n)` | `Math.pow(x, n)` |
| `absoluto(x)` | `Math.abs(x)` | `Math.abs(x)` |
| `redondear(x)` | `Math.round(x)` | `Math.round(x)` |

---

## Tipos de Datos Primitivos

| Tipo | Tamaño | Rango | Uso |
|---|---|---|---|
| `byte` | 8 bits | -128 a 127 | Números muy pequeños |
| `short` | 16 bits | -32,768 a 32,767 | Números pequeños |
| `int` | 32 bits | ±2.1 billones | Números enteros (más usado) |
| `long` | 64 bits | Muy grande | Números enteros grandes |
| `float` | 32 bits | 7 decimales | Decimales (poco preciso) |
| `double` | 64 bits | 15 decimales | Decimales (más usado) |
| `boolean` | 1 bit | `true` / `false` | Verdadero o falso |
| `char` | 16 bits | Un carácter | Letras, símbolos |

### Tipos objeto (wrapper classes)

| Primitivo | Objeto | Cuándo usar el objeto |
|---|---|---|
| `int` | `Integer` | ArrayList, HashMap, parseo |
| `double` | `Double` | ArrayList, HashMap, parseo |
| `boolean` | `Boolean` | ArrayList, HashMap |
| `char` | `Character` | ArrayList, HashMap |

### Conversiones (casting)

```java
// Implícito (automático) - de menor a mayor
int entero = 10;
double decimal = entero;          // 10.0

// Explícito (manual) - de mayor a menor
double decimal = 9.7;
int entero = (int) decimal;       // 9 (trunca, no redondea)

// String a número
int n = Integer.parseInt("42");
double d = Double.parseDouble("3.14");

// Número a String
String s1 = String.valueOf(42);
String s2 = "" + 42;              // Concatenación (más simple)
String s3 = Integer.toString(42);
```

---

## Variables y Constantes

```java
// Declarar variable
int edad;
edad = 25;

// Declarar e inicializar
int edad = 25;
double precio = 19.99;
String nombre = "Juan";
boolean activo = true;

// Constante (no cambia)
final double PI = 3.14159;
final int MAX_INTENTOS = 3;

// Múltiples variables del mismo tipo
int a, b, c;
int x = 1, y = 2, z = 3;
```

---

## Operadores

### Aritméticos

```java
int a = 10, b = 3;
a + b;    // 13 - suma
a - b;    // 7  - resta
a * b;    // 30 - multiplicación
a / b;    // 3  - división entera (ambos int → resultado int)
a % b;    // 1  - módulo (residuo)

// CUIDADO: división entera vs decimal
10 / 3;       // = 3     (ambos int)
10.0 / 3;     // = 3.333 (al menos uno double)
(double) 10 / 3;  // = 3.333 (casting)
```

### Comparación

```java
a == b;   // igual a
a != b;   // diferente de
a > b;    // mayor que
a < b;    // menor que
a >= b;   // mayor o igual
a <= b;   // menor o igual
```

### Lógicos

```java
a && b;   // AND - ambos verdaderos
a || b;   // OR  - al menos uno verdadero
!a;       // NOT - niega el valor
```

### Incremento/Decremento

```java
i++;      // i = i + 1
i--;      // i = i - 1
i += 5;   // i = i + 5
i -= 3;   // i = i - 3
i *= 2;   // i = i * 2
i /= 4;   // i = i / 4
```

---

## Strings (Cadenas de texto)

```java
// Crear
String nombre = "Juan";
String vacia = "";

// Longitud
nombre.length();              // 4

// Acceder a un carácter
nombre.charAt(0);             // 'J'

// Subcadena
nombre.substring(0, 2);      // "Ju"

// Buscar
nombre.indexOf("ua");        // 1
nombre.contains("an");       // true

// Comparar (NUNCA usar == para Strings)
nombre.equals("Juan");       // true
nombre.equalsIgnoreCase("juan"); // true

// Mayúsculas/Minúsculas
nombre.toUpperCase();        // "JUAN"
nombre.toLowerCase();        // "juan"

// Reemplazar
nombre.replace("J", "L");   // "Luan"

// Dividir
"a,b,c".split(",");         // ["a", "b", "c"]

// Quitar espacios
"  hola  ".trim();           // "hola"

// Concatenar
"Hola " + nombre;            // "Hola Juan"
```

---

## Arrays

### Unidimensionales

```java
// Declarar y crear
int[] numeros = new int[5];          // [0, 0, 0, 0, 0]
int[] notas = {90, 85, 70, 95, 88}; // Con valores

// Acceder
notas[0];        // 90 (primer elemento)
notas[4];        // 88 (último elemento)
notas.length;    // 5 (tamaño)

// Modificar
notas[2] = 75;

// Recorrer con for
for (int i = 0; i < notas.length; i++) {
    System.out.println("Nota " + i + ": " + notas[i]);
}

// Recorrer con for-each
for (int nota : notas) {
    System.out.println(nota);
}
```

### Bidimensionales (Matrices)

```java
// Crear matriz 3x3
int[][] matriz = new int[3][3];

// Con valores
int[][] matriz = {
    {1, 2, 3},
    {4, 5, 6},
    {7, 8, 9}
};

// Acceder
matriz[0][0];    // 1 (fila 0, columna 0)
matriz[1][2];    // 6 (fila 1, columna 2)

// Recorrer
for (int i = 0; i < matriz.length; i++) {           // filas
    for (int j = 0; j < matriz[i].length; j++) {    // columnas
        System.out.print(matriz[i][j] + " ");
    }
    System.out.println();
}
```

---

## Métodos (Funciones)

```java
// Método sin retorno
public static void saludar(String nombre) {
    System.out.println("Hola " + nombre);
}

// Método con retorno
public static int sumar(int a, int b) {
    return a + b;
}

// Método con retorno double
public static double areaCirculo(double radio) {
    return Math.PI * radio * radio;
}

// Método booleano
public static boolean esPar(int n) {
    return n % 2 == 0;
}

// Llamar métodos
saludar("Juan");
int resultado = sumar(5, 3);
double area = areaCirculo(5.0);
```

### Sobrecarga de métodos

```java
// Mismo nombre, diferentes parámetros
public static int sumar(int a, int b) {
    return a + b;
}

public static double sumar(double a, double b) {
    return a + b;
}

public static int sumar(int a, int b, int c) {
    return a + b + c;
}
```

---

## Entrada de Datos

### Con Scanner (Consola)

```java
import java.util.Scanner;

Scanner sc = new Scanner(System.in);

System.out.print("Ingrese su nombre: ");
String nombre = sc.nextLine();

System.out.print("Ingrese su edad: ");
int edad = sc.nextInt();

System.out.print("Ingrese su altura: ");
double altura = sc.nextDouble();

sc.close();
```

**Problema común: nextInt() + nextLine()**

```java
int edad = sc.nextInt();
sc.nextLine();               // Consumir el salto de línea pendiente
String nombre = sc.nextLine(); // Ahora funciona correctamente
```

### Con JOptionPane (Diálogos GUI)

```java
import javax.swing.JOptionPane;

// Entrada con diálogo
String nombre = JOptionPane.showInputDialog("Ingrese su nombre:");
int edad = Integer.parseInt(JOptionPane.showInputDialog("Ingrese su edad:"));

// Mensaje
JOptionPane.showMessageDialog(null, "Hola " + nombre);

// Confirmación (Sí/No)
int opcion = JOptionPane.showConfirmDialog(null, "¿Desea continuar?");
if (opcion == JOptionPane.YES_OPTION) {
    // Sí
}
```

---

## Convenciones de Nombrado Java

| Elemento | Convención | Ejemplo |
|---|---|---|
| Clases | PascalCase | `AreasCilindro`, `MiCalculadora` |
| Métodos | camelCase | `calcularArea()`, `esPrimo()` |
| Variables | camelCase | `areaBase`, `nombreCompleto` |
| Constantes | UPPER_SNAKE | `PI`, `MAX_INTENTOS` |
| Paquetes | minúsculas | `gui`, `logica`, `modelo` |
| Componentes GUI | prefijo + PascalCase | `btnCalcular`, `txtRadio`, `lblResultado` |

### Prefijos para componentes GUI

| Prefijo | Componente | Ejemplo |
|---|---|---|
| `btn` | JButton | `btnCalcular`, `btnLimpiar` |
| `txt` | JTextField | `txtRadio`, `txtAltura` |
| `lbl` | JLabel | `lblResultado`, `lblTitulo` |
| `cmb` | JComboBox | `cmbOpciones`, `cmbCiudades` |
| `chk` | JCheckBox | `chkAceptar`, `chkActivo` |
| `rb` | JRadioButton | `rbMasculino`, `rbFemenino` |
| `tbl` | JTable | `tblDatos`, `tblAlumnos` |
| `pnl` | JPanel | `pnlPrincipal`, `pnlBotones` |

---

## Errores Comunes del Principiante

### Errores de compilación

| Error | Causa | Solución |
|---|---|---|
| `';' expected` | Falta punto y coma | Agregar `;` al final |
| `cannot find symbol` | Variable no declarada o typo | Verificar nombre y declaración |
| `incompatible types` | Tipo incorrecto | Usar casting o cambiar tipo |
| `missing return statement` | Método no retorna en todos los caminos | Agregar `return` en cada rama |
| `unreachable statement` | Código después de `return` | Mover o eliminar código |
| `class not found` | Nombre de archivo ≠ nombre de clase | El archivo debe llamarse igual que la clase pública |

### Errores de ejecución

| Error | Causa | Solución |
|---|---|---|
| `NullPointerException` | Objeto no inicializado | Verificar `new` antes de usar |
| `ArrayIndexOutOfBoundsException` | Índice fuera del array | Verificar `i < array.length` |
| `NumberFormatException` | Texto no es número en parseInt | Usar try-catch |
| `ArithmeticException` | División por cero | Verificar divisor ≠ 0 |
| `StackOverflowError` | Recursión infinita | Verificar caso base |
| `StringIndexOutOfBoundsException` | Índice fuera del String | Verificar `i < s.length()` |

### Errores lógicos (el programa corre pero da resultado incorrecto)

| Error | Ejemplo | Solución |
|---|---|---|
| Usar `=` en vez de `==` | `if (x = 5)` → error | Usar `if (x == 5)` |
| Comparar Strings con `==` | `if (s == "hola")` | Usar `s.equals("hola")` |
| División entera | `int r = 10/3;` → 3 | Usar `double r = 10.0/3;` |
| Off-by-one | `for (i=0; i<=n; i++)` | Verificar límites del ciclo |
| Variable no actualizada | `sum` no se acumula en el ciclo | Agregar `sum += valor;` dentro del ciclo |

---

## Clase Math (Funciones Matemáticas)

```java
Math.PI;              // 3.141592653589793
Math.E;               // 2.718281828459045

Math.abs(-5);         // 5 (valor absoluto)
Math.sqrt(16);        // 4.0 (raíz cuadrada)
Math.pow(2, 3);       // 8.0 (potencia: 2³)
Math.max(3, 7);       // 7 (máximo)
Math.min(3, 7);       // 3 (mínimo)
Math.round(3.7);      // 4 (redondear)
Math.ceil(3.1);       // 4.0 (redondear arriba)
Math.floor(3.9);      // 3.0 (redondear abajo)
Math.random();        // 0.0 a 0.999... (aleatorio)

// Número aleatorio entre min y max
int aleatorio = (int)(Math.random() * (max - min + 1)) + min;
```
