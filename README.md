# 🏆 Mundial 2026 - Simulador del Camino al Campeón

Este proyecto es una aplicación web interactiva que permite a los usuarios visualizar el posible recorrido de cualquier selección nacional en el **Mundial FIFA 2026**. A diferencia de un simulador estático, esta herramienta calcula dinámicamente los cruces desde Dieciseisavos de Final hasta la Gran Final.

🔗 **Demo en vivo:** [https://icompsoluciones-dev.github.io/mundial2026/](https://icompsoluciones-dev.github.io/mundial2026/)

## 🚀 Características Principales

- **Búsqueda Inteligente:** Autocompletado para las 48 selecciones clasificadas.
- **Doble Visualización:** 
    - **Línea de Tiempo:** Un recorrido vertical detallado con fechas, estadios y oponentes.
    - **Bracket (Cuadro):** Una visión global del torneo estilo "llave" de eliminación directa.
- **Lógica Dinámica:** Los resultados no están predefinidos; se calculan en tiempo real según el criterio seleccionado.
- **Diseño Premium:** Interfaz oscura con estética *Glassmorphism*, efectos *Glow* y totalmente responsiva.
- **SEO & Analytics:** Optimizado para motores de búsqueda y configurado para medir conversiones de clientes potenciales.

## 🧠 Lógica de Simulación

La simulación utiliza los datos oficiales del **Ranking FIFA** para determinar la probabilidad de éxito de cada selección. 

Para garantizar que el usuario pueda ver el camino completo de su equipo favorito, el sistema aplica un concepto de **"Plot Armor" (Protección de Protagonista)**: el equipo seleccionado por el usuario siempre avanzará en su llave, mientras que el resto de los partidos del torneo se resuelven según el criterio de simulación elegido.

### Los 3 Criterios de Simulación

La aplicación permite alternar entre tres algoritmos distintos para resolver los encuentros donde no participa el equipo seleccionado:

1.  **⭐ Favoritos (Mejor Ranking FIFA):** El sistema compara el ranking de ambos equipos. El equipo con el número de ranking más bajo (más cerca del #1) se declara ganador. Es la simulación más lógica y conservadora.
2.  **⚡ Sorpresas (Underdogs):** Invierte la lógica del ranking. El equipo con el ranking más alto (teóricamente el más débil) se impone al favorito. Ideal para visualizar escenarios donde los gigantes caen temprano.
3.  **🎲 Aleatorio (50/50):** Ignora las estadísticas y otorga una probabilidad equitativa a ambos contendientes. Cada vez que cambias a este modo, el cuadro del mundial se reconfigura de forma distinta.

## 🛠️ Tecnologías Utilizadas

- **Frontend:** HTML5, CSS3 (Custom Variables, Flexbox, Grid), JavaScript (Vanilla ES6+).
- **Iconografía:** FontAwesome 6.
- **Tipografía:** Google Fonts (Inter & Outfit).
- **Datos:** JSON (Estructuras de datos complejas para grupos y rankings).
- **Despliegue:** GitHub Pages.

## 📈 SEO y Conversión

El proyecto está diseñado para funcionar como una herramienta de **captación de clientes (Lead Generation)**:
- **Google Search Console:** Verificado e indexado con `sitemap.xml` y `robots.txt`.
- **GA4 (Google Analytics):** Implementación de eventos personalizados (`generate_lead`) para medir clics en los enlaces de contacto de **iComp Soluciones C.A**.
- **Metadatos Open Graph:** Optimizado para compartir en WhatsApp, Facebook y Twitter con tarjetas visuales atractivas.

## 📂 Estructura del Proyecto

```text
├── index.html          # Estructura principal y Meta Tags SEO
├── style.css           # Estilos, animaciones y diseño responsivo
├── app.js              # Lógica de simulación, DOM y Tracking
├── mundial2026-data.json # Base de datos de equipos y grupos
├── sitemap.xml         # Mapa del sitio para Google
├── robots.txt          # Instrucciones para rastreadores
└── assets/             # Imágenes y recursos multimedia
```

## 🔧 Instalación Local

Debido a que el proyecto realiza peticiones `fetch` para cargar los datos JSON, se requiere un servidor local para evitar bloqueos de CORS:

1. Clona el repositorio.
2. Abre una terminal en la carpeta del proyecto.
3. Ejecuta:
   ```bash
   npx http-server
   ```
4. Abre `http://localhost:8080` en tu navegador.

---
## 📄 Licencia

Este proyecto se distribuye bajo la **Licencia MIT**. 

Esto significa que puedes usar, copiar y modificar el código libremente, siempre que mantengas el aviso de copyright original y la atribución a **iComp Soluciones C.A**. El software se proporciona "tal cual", sin garantía de ningún tipo.

© 2026 **iComp Soluciones C.A** - Todos los derechos reservados.
```
