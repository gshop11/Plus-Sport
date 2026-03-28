# OOP y Patrones de Diseño en Java

Guía de Programación Orientada a Objetos y patrones básicos de diseño.

---

## Pilares de la OOP

### 1. Encapsulamiento

Proteger los datos internos de una clase usando `private` y acceder con getters/setters.

```java
public class Persona {
    // Atributos privados
    private String nombre;
    private int edad;

    // Constructor
    public Persona(String nombre, int edad) {
        this.nombre = nombre;
        this.edad = edad;
    }

    // Getter
    public String getNombre() {
        return nombre;
    }

    // Setter con validación
    public void setEdad(int edad) {
        if (edad >= 0 && edad <= 150) {
            this.edad = edad;
        }
    }

    public int getEdad() {
        return edad;
    }
}
```

### 2. Herencia

Una clase hija hereda atributos y métodos de una clase padre.

```java
// Clase padre
public class Animal {
    protected String nombre;

    public Animal(String nombre) {
        this.nombre = nombre;
    }

    public void comer() {
        System.out.println(nombre + " está comiendo");
    }
}

// Clase hija
public class Perro extends Animal {
    private String raza;

    public Perro(String nombre, String raza) {
        super(nombre);   // Llamar constructor del padre
        this.raza = raza;
    }

    public void ladrar() {
        System.out.println(nombre + " dice: ¡Guau!");
    }
}

// Uso
Perro p = new Perro("Rex", "Labrador");
p.comer();   // Heredado de Animal
p.ladrar();  // Propio de Perro
```

### 3. Polimorfismo

Un mismo método se comporta diferente según la clase que lo implemente.

```java
public class Animal {
    public void hacerSonido() {
        System.out.println("...");
    }
}

public class Perro extends Animal {
    @Override
    public void hacerSonido() {
        System.out.println("¡Guau!");
    }
}

public class Gato extends Animal {
    @Override
    public void hacerSonido() {
        System.out.println("¡Miau!");
    }
}

// Polimorfismo en acción
Animal[] animales = { new Perro(), new Gato(), new Perro() };
for (Animal a : animales) {
    a.hacerSonido();  // Cada uno hace su propio sonido
}
// ¡Guau! ¡Miau! ¡Guau!
```

### 4. Abstracción

Ocultar los detalles de implementación y mostrar solo lo esencial.

```java
// Clase abstracta (no se puede instanciar)
public abstract class Figura {
    protected String nombre;

    public Figura(String nombre) {
        this.nombre = nombre;
    }

    // Método abstracto (sin implementación)
    public abstract double area();
    public abstract double perimetro();

    // Método concreto (con implementación)
    public void mostrar() {
        System.out.println(nombre + ": área=" + area() + ", perímetro=" + perimetro());
    }
}

// Clase concreta
public class Circulo extends Figura {
    private double radio;

    public Circulo(double radio) {
        super("Círculo");
        this.radio = radio;
    }

    @Override
    public double area() {
        return Math.PI * radio * radio;
    }

    @Override
    public double perimetro() {
        return 2 * Math.PI * radio;
    }
}

public class Rectangulo extends Figura {
    private double base, altura;

    public Rectangulo(double base, double altura) {
        super("Rectángulo");
        this.base = base;
        this.altura = altura;
    }

    @Override
    public double area() {
        return base * altura;
    }

    @Override
    public double perimetro() {
        return 2 * (base + altura);
    }
}
```

---

## Interfaces

Una interface define un contrato: qué métodos debe implementar una clase.

```java
// Interface
public interface Calculable {
    double calcularArea();
    double calcularPerimetro();
}

// Implementar interface
public class Triangulo implements Calculable {
    private double base, altura, lado1, lado2, lado3;

    public Triangulo(double base, double altura, double l1, double l2, double l3) {
        this.base = base;
        this.altura = altura;
        this.lado1 = l1;
        this.lado2 = l2;
        this.lado3 = l3;
    }

    @Override
    public double calcularArea() {
        return (base * altura) / 2;
    }

    @Override
    public double calcularPerimetro() {
        return lado1 + lado2 + lado3;
    }
}
```

### Clase abstracta vs Interface

| Característica | Clase abstracta | Interface |
|---|---|---|
| Herencia | `extends` (solo una) | `implements` (múltiples) |
| Métodos | Abstractos y concretos | Solo abstractos (Java < 8) |
| Atributos | Cualquier tipo | Solo `public static final` |
| Constructor | Sí | No |
| Cuándo usar | "Es un" (Perro ES un Animal) | "Puede hacer" (Perro PUEDE nadar) |

---

## Constructores

```java
public class Producto {
    private String nombre;
    private double precio;
    private int cantidad;

    // Constructor vacío
    public Producto() {
        this.nombre = "Sin nombre";
        this.precio = 0;
        this.cantidad = 0;
    }

    // Constructor con parámetros
    public Producto(String nombre, double precio) {
        this.nombre = nombre;
        this.precio = precio;
        this.cantidad = 1;
    }

    // Constructor completo
    public Producto(String nombre, double precio, int cantidad) {
        this.nombre = nombre;
        this.precio = precio;
        this.cantidad = cantidad;
    }

    // Método
    public double total() {
        return precio * cantidad;
    }

    @Override
    public String toString() {
        return nombre + " - $" + precio + " x" + cantidad;
    }
}
```

---

## Modificadores de Acceso

| Modificador | Clase | Paquete | Subclase | Todo |
|---|---|---|---|---|
| `public` | ✓ | ✓ | ✓ | ✓ |
| `protected` | ✓ | ✓ | ✓ | ✗ |
| (default) | ✓ | ✓ | ✗ | ✗ |
| `private` | ✓ | ✗ | ✗ | ✗ |

**Regla general:**
- Atributos: `private`
- Métodos públicos: `public`
- Métodos internos: `private`
- Métodos para subclases: `protected`

---

## static y final

### static — Pertenece a la clase, no a la instancia

```java
public class Contador {
    private static int total = 0;  // Compartido entre todas las instancias

    public Contador() {
        total++;
    }

    public static int getTotal() {  // Se llama con Contador.getTotal()
        return total;
    }
}

new Contador();
new Contador();
System.out.println(Contador.getTotal());  // 2
```

### final — No se puede cambiar

```java
final double PI = 3.14159;          // Constante
final String TITULO = "Mi App";    // No se puede reasignar

// Clase final: no se puede heredar
public final class Utilidades { }

// Método final: no se puede sobrescribir
public final void metodo() { }
```

---

## Enums

```java
public enum DiaSemana {
    LUNES, MARTES, MIERCOLES, JUEVES, VIERNES, SABADO, DOMINGO
}

// Uso
DiaSemana hoy = DiaSemana.LUNES;

switch (hoy) {
    case LUNES:
    case MARTES:
    case MIERCOLES:
    case JUEVES:
    case VIERNES:
        System.out.println("Día laboral");
        break;
    case SABADO:
    case DOMINGO:
        System.out.println("Fin de semana");
        break;
}

// Enum con atributos
public enum Mes {
    ENERO(31), FEBRERO(28), MARZO(31), ABRIL(30);

    private int dias;

    Mes(int dias) {
        this.dias = dias;
    }

    public int getDias() {
        return dias;
    }
}
```

---

## Principios SOLID

### S — Single Responsibility (Responsabilidad Única)

Cada clase debe tener una sola responsabilidad.

```java
// MAL: una clase hace todo
public class Empleado {
    public double calcularSueldo() { ... }
    public void guardarEnBaseDeDatos() { ... }
    public void generarReporte() { ... }
}

// BIEN: cada clase una responsabilidad
public class Empleado {
    public double calcularSueldo() { ... }
}
public class EmpleadoDAO {
    public void guardar(Empleado e) { ... }
}
public class ReporteEmpleado {
    public void generar(Empleado e) { ... }
}
```

### O — Open/Closed (Abierto/Cerrado)

Abierto para extensión, cerrado para modificación.

```java
// BIEN: agregar nuevas figuras sin modificar código existente
public abstract class Figura {
    public abstract double area();
}

public class Circulo extends Figura {
    public double area() { return Math.PI * r * r; }
}

// Agregar nueva figura sin tocar las anteriores
public class Hexagono extends Figura {
    public double area() { return (3 * Math.sqrt(3) / 2) * lado * lado; }
}
```

### L — Liskov Substitution (Sustitución de Liskov)

Las subclases deben poder sustituir a su clase padre sin romper el programa.

### I — Interface Segregation (Segregación de Interfaces)

Mejor muchas interfaces pequeñas que una grande.

```java
// MAL
public interface Trabajador {
    void programar();
    void diseñar();
    void testear();
}

// BIEN
public interface Programador { void programar(); }
public interface Diseñador { void diseñar(); }
public interface Tester { void testear(); }

public class Desarrollador implements Programador, Tester {
    public void programar() { ... }
    public void testear() { ... }
}
```

### D — Dependency Inversion (Inversión de Dependencias)

Depender de abstracciones, no de implementaciones concretas.

```java
// BIEN: depender de la interface
public class Notificador {
    private MensajeService servicio;  // Interface

    public Notificador(MensajeService servicio) {
        this.servicio = servicio;
    }

    public void notificar(String msg) {
        servicio.enviar(msg);
    }
}

// Se puede cambiar la implementación sin tocar Notificador
new Notificador(new EmailService());
new Notificador(new SMSService());
```

---

## Composición vs Herencia

```java
// Herencia: "ES UN" — Perro ES UN Animal
public class Perro extends Animal { }

// Composición: "TIENE UN" — Auto TIENE UN Motor
public class Auto {
    private Motor motor;  // Composición

    public Auto() {
        this.motor = new Motor();
    }

    public void encender() {
        motor.arrancar();
    }
}
```

**Preferir composición sobre herencia** cuando la relación no es estrictamente "es un".

---

## Generics Básicos

```java
// Clase genérica
public class Caja<T> {
    private T contenido;

    public void guardar(T item) {
        this.contenido = item;
    }

    public T obtener() {
        return contenido;
    }
}

// Uso
Caja<String> cajaTexto = new Caja<>();
cajaTexto.guardar("Hola");
String texto = cajaTexto.obtener();

Caja<Integer> cajaNumero = new Caja<>();
cajaNumero.guardar(42);
int numero = cajaNumero.obtener();

// Método genérico
public static <T> void imprimir(T[] arr) {
    for (T elem : arr) {
        System.out.println(elem);
    }
}
```

---

## Patrones Básicos de Diseño

### Singleton — Una sola instancia

```java
public class Configuracion {
    private static Configuracion instancia;
    private String idioma;

    private Configuracion() {  // Constructor privado
        this.idioma = "es";
    }

    public static Configuracion getInstancia() {
        if (instancia == null) {
            instancia = new Configuracion();
        }
        return instancia;
    }

    public String getIdioma() { return idioma; }
}

// Uso
Configuracion config = Configuracion.getInstancia();
```

### Factory — Crear objetos sin especificar la clase exacta

```java
public class FiguraFactory {
    public static Figura crear(String tipo) {
        switch (tipo.toLowerCase()) {
            case "circulo": return new Circulo(5);
            case "rectangulo": return new Rectangulo(4, 6);
            case "triangulo": return new Triangulo(3, 4, 5);
            default: throw new IllegalArgumentException("Tipo desconocido: " + tipo);
        }
    }
}

// Uso
Figura f = FiguraFactory.crear("circulo");
System.out.println(f.area());
```

### Observer — Notificar cambios

```java
public interface Observador {
    void actualizar(String mensaje);
}

public class Canal {
    private List<Observador> suscriptores = new ArrayList<>();

    public void suscribir(Observador o) {
        suscriptores.add(o);
    }

    public void notificar(String mensaje) {
        for (Observador o : suscriptores) {
            o.actualizar(mensaje);
        }
    }
}

public class Usuario implements Observador {
    private String nombre;

    public Usuario(String nombre) { this.nombre = nombre; }

    @Override
    public void actualizar(String mensaje) {
        System.out.println(nombre + " recibió: " + mensaje);
    }
}
```

### Strategy — Cambiar algoritmo en tiempo de ejecución

```java
public interface OrdenStrategy {
    void ordenar(int[] arr);
}

public class BubbleSortStrategy implements OrdenStrategy {
    public void ordenar(int[] arr) { /* bubble sort */ }
}

public class QuickSortStrategy implements OrdenStrategy {
    public void ordenar(int[] arr) { /* quick sort */ }
}

public class Ordenador {
    private OrdenStrategy strategy;

    public void setStrategy(OrdenStrategy strategy) {
        this.strategy = strategy;
    }

    public void ordenar(int[] arr) {
        strategy.ordenar(arr);
    }
}
```
