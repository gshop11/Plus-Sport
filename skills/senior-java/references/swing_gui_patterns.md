# Java Swing GUI — Patrones y Componentes

Guía completa de interfaces gráficas con Java Swing para Eclipse/WindowBuilder.

---

## Componentes Básicos

### JFrame — Ventana Principal

```java
import javax.swing.*;

public class MiVentana extends JFrame {

    public MiVentana() {
        setTitle("Mi Aplicación");
        setSize(500, 400);
        setDefaultCloseOperation(EXIT_ON_CLOSE);
        setLocationRelativeTo(null);  // Centrar en pantalla
        setResizable(false);          // No redimensionar
        setLayout(null);              // Layout absoluto (WindowBuilder)
    }

    public static void main(String[] args) {
        new MiVentana().setVisible(true);
    }
}
```

### JLabel — Etiqueta de texto

```java
JLabel lblTitulo = new JLabel("Calculadora de Áreas");
lblTitulo.setBounds(100, 10, 200, 25);
lblTitulo.setFont(new Font("Arial", Font.BOLD, 16));
lblTitulo.setForeground(Color.BLUE);
lblTitulo.setHorizontalAlignment(SwingConstants.CENTER);
add(lblTitulo);

// Label para mostrar resultado
JLabel lblResultado = new JLabel("Resultado: ");
lblResultado.setBounds(20, 200, 300, 25);
add(lblResultado);
```

### JTextField — Campo de texto

```java
JTextField txtRadio = new JTextField();
txtRadio.setBounds(100, 50, 150, 25);
add(txtRadio);

// Con texto por defecto
JTextField txtNombre = new JTextField("Escriba su nombre");
txtNombre.setBounds(100, 80, 200, 25);
add(txtNombre);

// Leer valor
String texto = txtRadio.getText();
int numero = Integer.parseInt(txtRadio.getText());
double decimal = Double.parseDouble(txtRadio.getText());

// Escribir valor
txtRadio.setText("42");
txtRadio.setText("");  // Limpiar

// Solo lectura
txtResultado.setEditable(false);
```

### JPasswordField — Campo de contraseña

```java
JPasswordField txtPassword = new JPasswordField();
txtPassword.setBounds(100, 110, 150, 25);
add(txtPassword);

// Leer contraseña
String password = new String(txtPassword.getPassword());
```

### JButton — Botón

```java
JButton btnCalcular = new JButton("Calcular");
btnCalcular.setBounds(100, 140, 150, 30);
add(btnCalcular);

// Con ícono
// btnCalcular.setIcon(new ImageIcon("icono.png"));

// Deshabilitar/habilitar
btnCalcular.setEnabled(false);
btnCalcular.setEnabled(true);
```

### JComboBox — Lista desplegable

```java
// Con array de opciones
String[] opciones = {"Seleccione...", "Opción 1", "Opción 2", "Opción 3"};
JComboBox<String> cmbOpciones = new JComboBox<>(opciones);
cmbOpciones.setBounds(100, 50, 150, 25);
add(cmbOpciones);

// Agregar opciones dinámicamente
cmbOpciones.addItem("Nueva opción");

// Leer selección
String seleccion = (String) cmbOpciones.getSelectedItem();
int indice = cmbOpciones.getSelectedIndex();

// Seleccionar por índice
cmbOpciones.setSelectedIndex(0);
```

### JCheckBox — Casilla de verificación

```java
JCheckBox chkAceptar = new JCheckBox("Acepto los términos");
chkAceptar.setBounds(20, 100, 200, 25);
add(chkAceptar);

// Verificar si está marcado
boolean marcado = chkAceptar.isSelected();

// Marcar/desmarcar
chkAceptar.setSelected(true);
```

### JRadioButton — Botón de radio

```java
JRadioButton rbMasculino = new JRadioButton("Masculino");
rbMasculino.setBounds(20, 100, 100, 25);
JRadioButton rbFemenino = new JRadioButton("Femenino");
rbFemenino.setBounds(130, 100, 100, 25);

// Agrupar (solo uno seleccionado a la vez)
ButtonGroup grupo = new ButtonGroup();
grupo.add(rbMasculino);
grupo.add(rbFemenino);

add(rbMasculino);
add(rbFemenino);

// Verificar cuál está seleccionado
if (rbMasculino.isSelected()) {
    // masculino
} else if (rbFemenino.isSelected()) {
    // femenino
}
```

### JTextArea — Área de texto multilínea

```java
JTextArea txtArea = new JTextArea();
txtArea.setLineWrap(true);          // Ajuste de línea
txtArea.setWrapStyleWord(true);     // Cortar por palabras

// Con scroll
JScrollPane scroll = new JScrollPane(txtArea);
scroll.setBounds(20, 150, 300, 100);
add(scroll);

// Agregar texto
txtArea.append("Nueva línea\n");
txtArea.setText("");  // Limpiar
```

### JTable — Tabla de datos

```java
import javax.swing.table.DefaultTableModel;

// Columnas
String[] columnas = {"Nombre", "Edad", "Ciudad"};

// Modelo (permite agregar/eliminar filas)
DefaultTableModel modelo = new DefaultTableModel(columnas, 0);

// Crear tabla
JTable tblDatos = new JTable(modelo);
JScrollPane scrollTabla = new JScrollPane(tblDatos);
scrollTabla.setBounds(20, 50, 400, 200);
add(scrollTabla);

// Agregar fila
modelo.addRow(new Object[]{"Juan", 25, "Lima"});

// Leer fila seleccionada
int fila = tblDatos.getSelectedRow();
if (fila >= 0) {
    String nombre = (String) modelo.getValueAt(fila, 0);
    int edad = (int) modelo.getValueAt(fila, 1);
}

// Eliminar fila seleccionada
if (fila >= 0) {
    modelo.removeRow(fila);
}

// Limpiar tabla
modelo.setRowCount(0);
```

### JOptionPane — Diálogos

```java
// Mensaje informativo
JOptionPane.showMessageDialog(this, "Operación exitosa");

// Mensaje de error
JOptionPane.showMessageDialog(this, "Error: dato inválido",
    "Error", JOptionPane.ERROR_MESSAGE);

// Mensaje de advertencia
JOptionPane.showMessageDialog(this, "¡Atención!",
    "Advertencia", JOptionPane.WARNING_MESSAGE);

// Entrada de datos
String nombre = JOptionPane.showInputDialog(this, "Ingrese su nombre:");

// Confirmación (Sí/No)
int resp = JOptionPane.showConfirmDialog(this, "¿Desea guardar?");
if (resp == JOptionPane.YES_OPTION) {
    // guardar
}

// Opciones personalizadas
String[] opciones = {"Guardar", "Descartar", "Cancelar"};
int resp = JOptionPane.showOptionDialog(this, "¿Qué desea hacer?",
    "Confirmar", JOptionPane.DEFAULT_OPTION,
    JOptionPane.QUESTION_MESSAGE, null, opciones, opciones[0]);
```

---

## Layouts (Administradores de Diseño)

### null — Posicionamiento absoluto (WindowBuilder)

```java
setLayout(null);
// Cada componente se posiciona con setBounds(x, y, ancho, alto)
btnCalcular.setBounds(100, 200, 150, 30);
```

**Ventaja:** Control total sobre posición (lo que usa WindowBuilder).
**Desventaja:** No se adapta al redimensionar la ventana.

### BorderLayout

```java
setLayout(new BorderLayout());
add(panelNorte, BorderLayout.NORTH);
add(panelCentro, BorderLayout.CENTER);
add(panelSur, BorderLayout.SOUTH);
add(panelIzq, BorderLayout.WEST);
add(panelDer, BorderLayout.EAST);
```

### FlowLayout

```java
JPanel panel = new JPanel(new FlowLayout(FlowLayout.CENTER));
panel.add(btn1);
panel.add(btn2);
panel.add(btn3);  // Se acomodan en fila
```

### GridLayout

```java
JPanel panel = new JPanel(new GridLayout(3, 2, 5, 5));
// 3 filas, 2 columnas, 5px gap horizontal, 5px gap vertical
panel.add(lbl1);
panel.add(txt1);
panel.add(lbl2);
panel.add(txt2);
panel.add(lbl3);
panel.add(txt3);
```

---

## Eventos y ActionListeners

### ActionListener — Evento de clic

**Patrón 1: Clase anónima (más común en el curso)**

```java
btnCalcular.addActionListener(new ActionListener() {
    public void actionPerformed(ActionEvent e) {
        // Código que se ejecuta al hacer clic
        String texto = txtEntrada.getText();
        lblSalida.setText("Resultado: " + texto);
    }
});
```

**Patrón 2: Lambda (Java 8+)**

```java
btnCalcular.addActionListener(e -> {
    String texto = txtEntrada.getText();
    lblSalida.setText("Resultado: " + texto);
});
```

**Patrón 3: Implementar interfaz (la clase implementa ActionListener)**

```java
public class MiVentana extends JFrame implements ActionListener {

    JButton btnCalcular;

    public MiVentana() {
        btnCalcular = new JButton("Calcular");
        btnCalcular.addActionListener(this);
        add(btnCalcular);
    }

    @Override
    public void actionPerformed(ActionEvent e) {
        if (e.getSource() == btnCalcular) {
            // Código del botón calcular
        }
    }
}
```

### ItemListener — Cambio de selección en JComboBox

```java
cmbOpciones.addItemListener(new ItemListener() {
    public void itemStateChanged(ItemEvent e) {
        if (e.getStateChange() == ItemEvent.SELECTED) {
            String seleccion = (String) cmbOpciones.getSelectedItem();
            lblInfo.setText("Seleccionó: " + seleccion);
        }
    }
});
```

### KeyListener — Eventos de teclado

```java
txtEntrada.addKeyListener(new KeyAdapter() {
    @Override
    public void keyPressed(KeyEvent e) {
        if (e.getKeyCode() == KeyEvent.VK_ENTER) {
            // Enter presionado
            calcular();
        }
    }
});
```

---

## Flujo WindowBuilder → Lógica

### Paso a paso

1. **Crear clase JFrame en Eclipse:**
   - `File` → `New` → `Other` → `WindowBuilder` → `Swing Designer` → `JFrame`
   - Nombre: `VentanaCilindro`
   - Paquete: `gui`

2. **Modo Design (pestaña inferior):**
   - Desde la **Palette**, arrastrar componentes al formulario
   - En **Properties**, configurar:
     - `Variable`: nombre descriptivo (ej: `txtRadio`, `btnCalcular`)
     - `text`: texto visible
     - `bounds`: posición y tamaño (x, y, ancho, alto)

3. **Eclipse genera código automáticamente:**
   ```java
   txtRadio = new JTextField();
   txtRadio.setBounds(100, 50, 150, 25);
   contentPane.add(txtRadio);
   ```

4. **Cambiar a modo Source (pestaña inferior):**
   - Localizar los botones en el código
   - Agregar ActionListeners

5. **Implementar la lógica dentro del ActionListener**

### Ejemplo completo: Calculadora de áreas de cilindro

```java
package gui;

import javax.swing.*;
import java.awt.*;
import java.awt.event.*;

public class AreasCilindro extends JFrame {

    private JTextField txtRadio;
    private JTextField txtAltura;
    private JLabel lblAreaBase;
    private JLabel lblAreaLateral;
    private JLabel lblAreaTotal;

    public AreasCilindro() {
        setTitle("Áreas de un cilindro");
        setSize(420, 350);
        setDefaultCloseOperation(EXIT_ON_CLOSE);
        setLocationRelativeTo(null);
        getContentPane().setLayout(null);

        // === COMPONENTES DE ENTRADA ===
        JLabel lblTitulo = new JLabel("Calculadora de Áreas - Cilindro");
        lblTitulo.setFont(new Font("Arial", Font.BOLD, 14));
        lblTitulo.setBounds(80, 10, 300, 25);
        getContentPane().add(lblTitulo);

        JLabel lblRadioLabel = new JLabel("Radio:");
        lblRadioLabel.setBounds(30, 50, 80, 25);
        getContentPane().add(lblRadioLabel);

        txtRadio = new JTextField();
        txtRadio.setBounds(120, 50, 150, 25);
        getContentPane().add(txtRadio);

        JLabel lblAlturaLabel = new JLabel("Altura:");
        lblAlturaLabel.setBounds(30, 90, 80, 25);
        getContentPane().add(lblAlturaLabel);

        txtAltura = new JTextField();
        txtAltura.setBounds(120, 90, 150, 25);
        getContentPane().add(txtAltura);

        // === BOTONES ===
        JButton btnCalcular = new JButton("Calcular");
        btnCalcular.setBounds(120, 130, 150, 30);
        getContentPane().add(btnCalcular);

        JButton btnLimpiar = new JButton("Limpiar");
        btnLimpiar.setBounds(280, 130, 100, 30);
        getContentPane().add(btnLimpiar);

        // === RESULTADOS ===
        lblAreaBase = new JLabel("Área base: ");
        lblAreaBase.setBounds(30, 180, 350, 25);
        getContentPane().add(lblAreaBase);

        lblAreaLateral = new JLabel("Área lateral: ");
        lblAreaLateral.setBounds(30, 210, 350, 25);
        getContentPane().add(lblAreaLateral);

        lblAreaTotal = new JLabel("Área total: ");
        lblAreaTotal.setFont(new Font("Arial", Font.BOLD, 12));
        lblAreaTotal.setBounds(30, 240, 350, 25);
        getContentPane().add(lblAreaTotal);

        // === LÓGICA: ActionListener del botón Calcular ===
        btnCalcular.addActionListener(new ActionListener() {
            public void actionPerformed(ActionEvent e) {
                try {
                    // ENTRADA DE DATOS
                    double r = Double.parseDouble(txtRadio.getText());
                    double h = Double.parseDouble(txtAltura.getText());

                    // OPERACIONES
                    double AB = Math.PI * (r * r);
                    double AL = 2 * Math.PI * r * h;
                    double AT = 2 * AB + AL;

                    // MOSTRAR RESULTADOS
                    lblAreaBase.setText(String.format("Área base: %.2f", AB));
                    lblAreaLateral.setText(String.format("Área lateral: %.2f", AL));
                    lblAreaTotal.setText(String.format("Área total: %.2f", AT));

                } catch (NumberFormatException ex) {
                    JOptionPane.showMessageDialog(null,
                        "Por favor ingrese números válidos",
                        "Error", JOptionPane.ERROR_MESSAGE);
                }
            }
        });

        // === LÓGICA: ActionListener del botón Limpiar ===
        btnLimpiar.addActionListener(new ActionListener() {
            public void actionPerformed(ActionEvent e) {
                txtRadio.setText("");
                txtAltura.setText("");
                lblAreaBase.setText("Área base: ");
                lblAreaLateral.setText("Área lateral: ");
                lblAreaTotal.setText("Área total: ");
                txtRadio.requestFocus();
            }
        });
    }

    public static void main(String[] args) {
        new AreasCilindro().setVisible(true);
    }
}
```

---

## Patrones Comunes en Ejercicios

### 1. Formulario de cálculo

Entrada → Operación → Resultado

```java
btnCalcular.addActionListener(e -> {
    try {
        double dato1 = Double.parseDouble(txt1.getText());
        double dato2 = Double.parseDouble(txt2.getText());
        double resultado = dato1 * dato2; // operación
        lblResultado.setText("Resultado: " + resultado);
    } catch (NumberFormatException ex) {
        JOptionPane.showMessageDialog(null, "Ingrese números válidos");
    }
});
```

### 2. Conversor (unidades, monedas, temperatura)

```java
btnConvertir.addActionListener(e -> {
    double valor = Double.parseDouble(txtValor.getText());
    String unidad = (String) cmbUnidad.getSelectedItem();
    double resultado;

    switch (unidad) {
        case "Celsius a Fahrenheit":
            resultado = (valor * 9.0 / 5.0) + 32;
            break;
        case "Fahrenheit a Celsius":
            resultado = (valor - 32) * 5.0 / 9.0;
            break;
        default:
            resultado = 0;
    }
    lblResultado.setText("Resultado: " + String.format("%.2f", resultado));
});
```

### 3. Login con validación

```java
btnLogin.addActionListener(e -> {
    String usuario = txtUsuario.getText();
    String password = new String(txtPassword.getPassword());

    if (usuario.equals("admin") && password.equals("1234")) {
        JOptionPane.showMessageDialog(null, "Bienvenido " + usuario);
    } else {
        JOptionPane.showMessageDialog(null, "Usuario o contraseña incorrectos",
            "Error", JOptionPane.ERROR_MESSAGE);
    }
});
```

### 4. CRUD con JTable

```java
// Agregar
btnAgregar.addActionListener(e -> {
    String nombre = txtNombre.getText();
    int edad = Integer.parseInt(txtEdad.getText());
    modelo.addRow(new Object[]{nombre, edad});
    txtNombre.setText("");
    txtEdad.setText("");
});

// Eliminar
btnEliminar.addActionListener(e -> {
    int fila = tblDatos.getSelectedRow();
    if (fila >= 0) {
        modelo.removeRow(fila);
    } else {
        JOptionPane.showMessageDialog(null, "Seleccione una fila");
    }
});

// Buscar
btnBuscar.addActionListener(e -> {
    String buscar = txtBuscar.getText().toLowerCase();
    for (int i = 0; i < modelo.getRowCount(); i++) {
        String nombre = ((String) modelo.getValueAt(i, 0)).toLowerCase();
        if (nombre.contains(buscar)) {
            tblDatos.setRowSelectionInterval(i, i);
            break;
        }
    }
});
```

### 5. Calculadora básica con operaciones

```java
btnIgual.addActionListener(e -> {
    double n1 = Double.parseDouble(txtNum1.getText());
    double n2 = Double.parseDouble(txtNum2.getText());
    String op = (String) cmbOperacion.getSelectedItem();
    double resultado = 0;

    switch (op) {
        case "+": resultado = n1 + n2; break;
        case "-": resultado = n1 - n2; break;
        case "*": resultado = n1 * n2; break;
        case "/":
            if (n2 != 0) {
                resultado = n1 / n2;
            } else {
                JOptionPane.showMessageDialog(null, "No se puede dividir por cero");
                return;
            }
            break;
    }
    lblResultado.setText("= " + resultado);
});
```

---

## Buenas Prácticas GUI

### Nombrar variables descriptivamente

```java
// MAL
JTextField t1, t2;
JButton b1;
JLabel l1;

// BIEN
JTextField txtRadio, txtAltura;
JButton btnCalcular;
JLabel lblResultado;
```

### Separar GUI de lógica

```java
// En el ActionListener, llamar métodos de la clase lógica
btnCalcular.addActionListener(e -> {
    double r = Double.parseDouble(txtRadio.getText());
    double h = Double.parseDouble(txtAltura.getText());

    Cilindro cilindro = new Cilindro(r, h);  // Clase separada con la lógica
    lblAreaBase.setText("AB: " + cilindro.areaBase());
    lblAreaTotal.setText("AT: " + cilindro.areaTotal());
});
```

### Siempre validar entrada

```java
try {
    int valor = Integer.parseInt(txtCampo.getText());
    // operaciones con valor...
} catch (NumberFormatException ex) {
    JOptionPane.showMessageDialog(null,
        "Ingrese un número válido en el campo",
        "Error de entrada", JOptionPane.ERROR_MESSAGE);
}
```

### Usar String.format para decimales

```java
double pi = 3.14159265;

// Mostrar con 2 decimales
lblResultado.setText(String.format("Valor: %.2f", pi));  // "Valor: 3.14"

// Mostrar con 4 decimales
lblResultado.setText(String.format("Valor: %.4f", pi));  // "Valor: 3.1416"
```
