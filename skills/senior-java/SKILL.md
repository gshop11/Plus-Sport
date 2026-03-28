---
name: "senior-java"
description: Skill para desarrollo Java enfocado en algoritmia, interfaces gráficas Swing y Eclipse. Cubre desde fundamentos hasta algoritmia avanzada. Sigue el flujo pseudocódigo → diseño GUI (WindowBuilder/Swing) → implementar lógica. Incluye componentes Swing (JFrame, JButton, JTextField, JComboBox, ActionListener), patrones algorítmicos, OOP y debugging. Ideal para cursos de algoritmia con Java y Eclipse.
---

# Senior Java — Algoritmia, Swing GUI y Eclipse

Skill completo para desarrollo Java: desde pseudocódigo hasta implementación con interfaces gráficas Swing en Eclipse.

## Table of Contents

- [Quick Start](#quick-start)
- [Pseudocódigo → Código Java](#pseudocódigo--código-java)
- [Diseño GUI → Lógica](#diseño-gui--lógica)
- [Proyecto Java con GUI en Eclipse](#proyecto-java-con-gui-en-eclipse)
- [Resolver Ejercicio de Algoritmia](#resolver-ejercicio-de-algoritmia)
- [Debugging](#debugging)
- [Quick Reference](#quick-reference)
- [Integración Eclipse + Claude Code](#integración-eclipse--claude-code)

---

## Quick Start

### Compilar y ejecutar desde terminal

```bash
# Compilar un archivo
javac Main.java

# Ejecutar
java Main

# Compilar y ejecutar en un paso
javac Main.java && java Main

# Compilar con paquetes
javac -d bin src/gui/AreasCilindro.java
java -cp bin gui.AreasCilindro
```

### Crear archivo Java mínimo

```java
public class Main {
    public static void main(String[] args) {
        System.out.println("Hola mundo");
    }
}
```

---

## Pseudocódigo → Código Java

### Flujo principal del curso

El método de trabajo es:
1. **Diseñar** el algoritmo en pseudocódigo (en español)
2. **Traducir** el pseudocódigo a Java respetando la misma estructura
3. **Implementar** la GUI si el ejercicio lo requiere

### Formato de pseudocódigo

```
//INICIO

//DECLARACIÓN DE VARIABLES
entero r, h;
real AB, AL, AT;

//ENTRADA DE DATOS
r = leerRadio();
h = leerAltura();

//OPERACIONES
AB = 3.1416 * (r * r);
AL = 2 * 3.1416 * r * h;
AT = 2 * AB + AL;

//MOSTRAR LOS RESULTADOS
imprimir(AB);
imprimir(AL);
imprimir(AT);

//FIN
```

### Traducción a Java (versión consola)

```java
import java.util.Scanner;

public class AreasCilindro {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        // DECLARACIÓN DE VARIABLES
        int r, h;
        double AB, AL, AT;

        // ENTRADA DE DATOS
        System.out.print("Ingrese el radio: ");
        r = sc.nextInt();
        System.out.print("Ingrese la altura: ");
        h = sc.nextInt();

        // OPERACIONES
        AB = 3.1416 * (r * r);
        AL = 2 * 3.1416 * r * h;
        AT = 2 * AB + AL;

        // MOSTRAR LOS RESULTADOS
        System.out.println("Área base: " + AB);
        System.out.println("Área lateral: " + AL);
        System.out.println("Área total: " + AT);

        sc.close();
    }
}
```

### Traducción a Java (versión GUI Swing)

```java
import javax.swing.*;
import java.awt.event.*;

public class AreasCilindro extends JFrame {
    private JTextField txtRadio, txtAltura;
    private JLabel lblAreaBase, lblAreaLateral, lblAreaTotal;
    private JButton btnCalcular;

    public AreasCilindro() {
        setTitle("Áreas de un cilindro");
        setSize(400, 300);
        setDefaultCloseOperation(EXIT_ON_CLOSE);
        setLayout(null);

        // Componentes de entrada
        add(new JLabel("Radio:")).setBounds(20, 20, 80, 25);
        txtRadio = new JTextField();
        txtRadio.setBounds(100, 20, 150, 25);
        add(txtRadio);

        add(new JLabel("Altura:")).setBounds(20, 60, 80, 25);
        txtAltura = new JTextField();
        txtAltura.setBounds(100, 60, 150, 25);
        add(txtAltura);

        // Botón calcular
        btnCalcular = new JButton("Calcular");
        btnCalcular.setBounds(100, 100, 150, 30);
        add(btnCalcular);

        // Labels de resultado
        lblAreaBase = new JLabel("Área base: ");
        lblAreaBase.setBounds(20, 150, 300, 25);
        add(lblAreaBase);

        lblAreaLateral = new JLabel("Área lateral: ");
        lblAreaLateral.setBounds(20, 180, 300, 25);
        add(lblAreaLateral);

        lblAreaTotal = new JLabel("Área total: ");
        lblAreaTotal.setBounds(20, 210, 300, 25);
        add(lblAreaTotal);

        // ActionListener del botón
        btnCalcular.addActionListener(new ActionListener() {
            public void actionPerformed(ActionEvent e) {
                // ENTRADA DE DATOS
                int r = Integer.parseInt(txtRadio.getText());
                int h = Integer.parseInt(txtAltura.getText());

                // OPERACIONES
                double AB = 3.1416 * (r * r);
                double AL = 2 * 3.1416 * r * h;
                double AT = 2 * AB + AL;

                // MOSTRAR RESULTADOS
                lblAreaBase.setText("Área base: " + AB);
                lblAreaLateral.setText("Área lateral: " + AL);
                lblAreaTotal.setText("Área total: " + AT);
            }
        });
    }

    public static void main(String[] args) {
        new AreasCilindro().setVisible(true);
    }
}
```

### Mapeo completo Pseudocódigo → Java

| Pseudocódigo | Java (Consola) | Java (GUI Swing) |
|---|---|---|
| `//INICIO` | `public static void main(String[] args) {` | Constructor o `actionPerformed()` |
| `entero x;` | `int x;` | `int x;` |
| `real y;` | `double y;` | `double y;` |
| `cadena s;` | `String s;` | `String s;` |
| `logico b;` | `boolean b;` | `boolean b;` |
| `x = leerEntero();` | `x = sc.nextInt();` | `x = Integer.parseInt(txtX.getText());` |
| `y = leerReal();` | `y = sc.nextDouble();` | `y = Double.parseDouble(txtY.getText());` |
| `s = leerCadena();` | `s = sc.nextLine();` | `s = txtS.getText();` |
| `imprimir(x)` | `System.out.println(x);` | `lblResultado.setText("" + x);` |
| `si (cond) entonces` | `if (cond) {` | `if (cond) {` |
| `sino` | `} else {` | `} else {` |
| `mientras (cond) hacer` | `while (cond) {` | `while (cond) {` |
| `para i=1 hasta n hacer` | `for (int i=1; i<=n; i++) {` | `for (int i=1; i<=n; i++) {` |
| `segun (var)` | `switch (var) {` | `switch (var) {` |
| `//FIN` | `}` | `}` |

---

## Diseño GUI → Lógica

### Flujo con WindowBuilder en Eclipse

1. **Crear clase JFrame:** `File` → `New` → `Other` → `WindowBuilder` → `Swing Designer` → `JFrame`
2. **Modo Design:** Hacer clic en la pestaña `Design` en la parte inferior del editor
3. **Arrastrar componentes** desde la paleta (Palette) al formulario:
   - `JLabel` para etiquetas
   - `JTextField` para entrada de datos
   - `JButton` para acciones
   - `JComboBox` para listas desplegables
4. **Configurar propiedades** en el panel Properties (Variable name, text, bounds)
5. **Cambiar a Source** para agregar la lógica

### Agregar lógica a un botón (ActionListener)

**Patrón con clase anónima (más común en el curso):**

```java
btnCalcular.addActionListener(new ActionListener() {
    public void actionPerformed(ActionEvent e) {
        // 1. Leer datos de los campos de texto
        int valor = Integer.parseInt(txtValor.getText());

        // 2. Realizar operaciones
        int resultado = valor * 2;

        // 3. Mostrar resultado
        lblResultado.setText("Resultado: " + resultado);
    }
});
```

**Patrón con lambda (Java 8+):**

```java
btnCalcular.addActionListener(e -> {
    int valor = Integer.parseInt(txtValor.getText());
    int resultado = valor * 2;
    lblResultado.setText("Resultado: " + resultado);
});
```

### Obtener valores de diferentes componentes

```java
// JTextField → String o número
String texto = txtNombre.getText();
int numero = Integer.parseInt(txtEdad.getText());
double decimal = Double.parseDouble(txtPrecio.getText());

// JComboBox → elemento seleccionado
String seleccion = (String) cmbOpciones.getSelectedItem();
int indice = cmbOpciones.getSelectedIndex();

// JCheckBox → booleano
boolean marcado = chkAceptar.isSelected();

// JRadioButton → booleano
boolean elegido = rbOpcion1.isSelected();

// JTextArea → texto multilínea
String contenido = txtArea.getText();
```

### Mostrar resultados

```java
// En JLabel
lblResultado.setText("El resultado es: " + valor);

// En JTextField
txtSalida.setText(String.valueOf(resultado));

// En JTextArea (agregar línea)
txtArea.append("Línea nueva\n");

// En diálogo emergente
JOptionPane.showMessageDialog(this, "El resultado es: " + valor);

// Diálogo de error
JOptionPane.showMessageDialog(this, "Error: ingrese un número válido",
    "Error", JOptionPane.ERROR_MESSAGE);
```

### Validar entrada del usuario

```java
btnCalcular.addActionListener(new ActionListener() {
    public void actionPerformed(ActionEvent e) {
        try {
            int radio = Integer.parseInt(txtRadio.getText());
            int altura = Integer.parseInt(txtAltura.getText());

            // Operaciones...
            double area = 3.1416 * (radio * radio);
            lblResultado.setText("Área: " + area);

        } catch (NumberFormatException ex) {
            JOptionPane.showMessageDialog(null,
                "Por favor ingrese números válidos",
                "Error de entrada", JOptionPane.ERROR_MESSAGE);
        }
    }
});
```

---

## Proyecto Java con GUI en Eclipse

### Estructura recomendada de proyecto

```
MiProyecto/
├── src/
│   ├── gui/
│   │   └── VentanaPrincipal.java     # JFrame con la interfaz
│   ├── logica/
│   │   └── Calculadora.java          # Lógica de negocio
│   └── modelo/
│       └── Cilindro.java             # Clases de datos
└── bin/                              # Archivos .class compilados
```

### Ejemplo: separar GUI de lógica

**modelo/Cilindro.java:**
```java
package modelo;

public class Cilindro {
    private double radio;
    private double altura;

    public Cilindro(double radio, double altura) {
        this.radio = radio;
        this.altura = altura;
    }

    public double areaBase() {
        return Math.PI * radio * radio;
    }

    public double areaLateral() {
        return 2 * Math.PI * radio * altura;
    }

    public double areaTotal() {
        return 2 * areaBase() + areaLateral();
    }
}
```

**gui/VentanaCilindro.java:**
```java
package gui;

import modelo.Cilindro;
import javax.swing.*;
import java.awt.event.*;

public class VentanaCilindro extends JFrame {
    // ... componentes GUI ...

    btnCalcular.addActionListener(new ActionListener() {
        public void actionPerformed(ActionEvent e) {
            double r = Double.parseDouble(txtRadio.getText());
            double h = Double.parseDouble(txtAltura.getText());

            Cilindro c = new Cilindro(r, h);

            lblAreaBase.setText("Área base: " + c.areaBase());
            lblAreaLateral.setText("Área lateral: " + c.areaLateral());
            lblAreaTotal.setText("Área total: " + c.areaTotal());
        }
    });
}
```

---

## Resolver Ejercicio de Algoritmia

### Workflow paso a paso

1. **Analizar el problema:** ¿Qué datos de entrada necesito? ¿Qué resultado debo obtener?
2. **Escribir pseudocódigo:** Usar el formato del curso (INICIO → VARIABLES → ENTRADA → OPERACIONES → RESULTADOS → FIN)
3. **Traducir a Java:** Seguir la tabla de mapeo pseudocódigo → Java
4. **Implementar GUI** (si aplica): Diseñar la interfaz en WindowBuilder y conectar la lógica
5. **Probar:** Ejecutar con datos conocidos y verificar resultados
6. **Analizar complejidad:** Determinar Big O del algoritmo

### Ejemplo completo: Números primos

**Pseudocódigo:**
```
//INICIO
//DECLARACIÓN DE VARIABLES
entero n, i;
logico esPrimo;

//ENTRADA DE DATOS
n = leerNumero();

//OPERACIONES
esPrimo = verdadero;
si (n <= 1) entonces
    esPrimo = falso;
sino
    para i = 2 hasta raiz(n) hacer
        si (n mod i == 0) entonces
            esPrimo = falso;
        fin si
    fin para
fin si

//MOSTRAR RESULTADOS
si (esPrimo) entonces
    imprimir(n + " es primo");
sino
    imprimir(n + " no es primo");
fin si
//FIN
```

**Java:**
```java
public static boolean esPrimo(int n) {
    if (n <= 1) return false;
    for (int i = 2; i <= Math.sqrt(n); i++) {
        if (n % i == 0) return false;
    }
    return true;
}
```

**Complejidad:** O(√n)

---

## Debugging

### Errores comunes y soluciones

| Error | Causa | Solución |
|---|---|---|
| `cannot find symbol` | Variable no declarada o typo | Verificar nombre y declaración |
| `incompatible types` | Asignar tipo incorrecto | Usar casting: `(int)`, `(double)` |
| `NullPointerException` | Usar objeto no inicializado | Verificar que el objeto se creó con `new` |
| `ArrayIndexOutOfBoundsException` | Índice fuera del array | Verificar que `i < array.length` |
| `NumberFormatException` | Texto no numérico en parseInt | Validar con try-catch antes de parsear |
| `StackOverflowError` | Recursión sin caso base | Agregar condición de parada |
| `;` expected | Falta punto y coma | Agregar `;` al final de la línea |
| `reached end of file while parsing` | Falta `}` de cierre | Contar llaves de apertura y cierre |

### Leer un stacktrace

```
Exception in thread "main" java.lang.NumberFormatException: For input string: "abc"
    at java.base/java.lang.Integer.parseInt(Integer.java:652)
    at gui.AreasCilindro$1.actionPerformed(AreasCilindro.java:45)
```

Lectura: En `AreasCilindro.java`, **línea 45**, dentro del `actionPerformed`, se intentó convertir `"abc"` a entero con `parseInt`.

### Técnica de debugging con prints

```java
System.out.println("DEBUG: valor de x = " + x);
System.out.println("DEBUG: entró al if");
System.out.println("DEBUG: iteración i = " + i + ", acumulador = " + sum);
```

---

## Quick Reference

### Tipos de datos

| Tipo | Tamaño | Ejemplo | Pseudocódigo |
|---|---|---|---|
| `int` | 32 bits | `int edad = 25;` | `entero` |
| `double` | 64 bits | `double precio = 19.99;` | `real` |
| `boolean` | 1 bit | `boolean activo = true;` | `logico` |
| `char` | 16 bits | `char letra = 'A';` | `caracter` |
| `String` | variable | `String nombre = "Juan";` | `cadena` |

### Operadores

| Operador | Descripción | Ejemplo |
|---|---|---|
| `+`, `-`, `*`, `/` | Aritméticos | `a + b` |
| `%` | Módulo (residuo) | `10 % 3` → `1` |
| `==`, `!=` | Igualdad | `a == b` |
| `<`, `>`, `<=`, `>=` | Comparación | `a > b` |
| `&&`, `\|\|`, `!` | Lógicos | `a && b` |
| `++`, `--` | Incremento/decremento | `i++` |

### Estructuras de control

```java
// if-else
if (nota >= 60) {
    System.out.println("Aprobado");
} else {
    System.out.println("Reprobado");
}

// switch
switch (opcion) {
    case 1: System.out.println("Uno"); break;
    case 2: System.out.println("Dos"); break;
    default: System.out.println("Otro");
}

// for
for (int i = 0; i < 10; i++) {
    System.out.println(i);
}

// while
while (condicion) {
    // código
}

// do-while
do {
    // código
} while (condicion);
```

### Componentes Swing

| Componente | Uso | Crear |
|---|---|---|
| `JFrame` | Ventana principal | `new JFrame("Título")` |
| `JPanel` | Contenedor | `new JPanel()` |
| `JLabel` | Etiqueta de texto | `new JLabel("Texto")` |
| `JTextField` | Campo de texto | `new JTextField()` |
| `JButton` | Botón | `new JButton("Clic")` |
| `JComboBox` | Lista desplegable | `new JComboBox<>(opciones)` |
| `JCheckBox` | Casilla de verificación | `new JCheckBox("Opción")` |
| `JRadioButton` | Botón de radio | `new JRadioButton("Opción")` |
| `JTextArea` | Área de texto | `new JTextArea(filas, cols)` |
| `JTable` | Tabla de datos | `new JTable(modelo)` |
| `JOptionPane` | Diálogos | `JOptionPane.showMessageDialog(...)` |

### Eventos

| Evento | Componente | Cuándo se dispara |
|---|---|---|
| `ActionListener` | JButton, JTextField, JComboBox | Clic en botón o Enter en campo |
| `ItemListener` | JComboBox, JCheckBox | Cambio de selección |
| `KeyListener` | Cualquiera | Tecla presionada/soltada |
| `MouseListener` | Cualquiera | Clic, entrada/salida del mouse |

### Collections

```java
// ArrayList - lista dinámica
ArrayList<String> lista = new ArrayList<>();
lista.add("elemento");
lista.get(0);
lista.size();
lista.remove(0);

// HashMap - diccionario clave-valor
HashMap<String, Integer> mapa = new HashMap<>();
mapa.put("clave", 100);
mapa.get("clave");
mapa.containsKey("clave");
```

---

## Integración Eclipse + Claude Code

### Instalación de Claude Code

```powershell
# En PowerShell (una sola vez)
winget install Anthropic.ClaudeCode
```

### Configurar terminal en Eclipse

1. Instalar **TM Terminal**: `Help` → `Eclipse Marketplace` → buscar "TM Terminal" → instalar
2. Abrir terminal: `Window` → `Show View` → `Terminal` (o `Ctrl+Alt+T`)
3. Configurar shell: seleccionar `bash` o `Git Bash`

### Flujo de trabajo diario

1. **Diseñar GUI** en Eclipse con WindowBuilder (modo Design)
2. **Abrir terminal** integrado en Eclipse
3. **Ejecutar** `claude` en el terminal
4. **Pedir ayuda:** "agrega la lógica al ActionListener del botón calcular"
5. **Refrescar** archivos en Eclipse: `F5` o activar auto-refresh:
   - `Window` → `Preferences` → `General` → `Workspace` → marcar "Refresh using native hooks or polling"

### Comandos útiles en Claude Code

```bash
claude                    # Iniciar sesión interactiva
claude -p "pregunta"      # Pregunta rápida sin sesión
```

---

## Resources

- Java Fundamentals: `references/java_fundamentals.md`
- Swing GUI Patterns: `references/swing_gui_patterns.md`
- Algorithmia Patterns: `references/algorithmia_patterns.md`
- OOP Design Patterns: `references/oop_design_patterns.md`
- Testing & Debugging: `references/testing_debugging.md`
