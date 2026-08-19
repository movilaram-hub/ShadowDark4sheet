# ⚔️ Shadowdark Sheet — Multi-Character Dashboard & Solo Oracle

[Español](#-versión-en-español) | [English](#-english-version)

---

## 🇪🇸 Versión en Español

**Shadowdark Sheet** es una aplicación web ligera, compacta y reactiva diseñada para gestionar de 1 a 4 hojas de personaje simultáneamente en una sola pantalla. Creada especialmente para **Shadowdark RPG** y sistemas OSR / D&D clásico, optimizada tanto para juegos en mesa, partidas en solitario (*Solo RPG*) y uso en dispositivos móviles/tablets (PWA).

### ✨ Características Principales

- **👥 Vista de Grupo (1 a 4 Personajes):** Gestiona hasta 4 fichas en paralelo con diseño columnar independiente y adaptable.
- **📑 4 Pestañas Interactivas por Personaje con Gestos Táctiles (Swipe):**
  1. **Combate & Atributos:** Puntos de Vida gigantes, CA, Puntos de Destino, modificadores automáticos de las 6 habilidades (+FUE, +DES, etc.), armas y estado visual de muerte a 0 PV (💀).
  2. **Info & Trasfondo:** Nivel, seguimiento de XP, Clase, Linaje, Título, Alineamiento, Deidad e historia.
  3. **Equipo & Monedas:** Contador de ORO, PLATA y COBRE, munición con botones rápidos, 20 casillas de inventario y 6 casillas sin peso.
  4. **Magias & Talentos Dinámicos:** Añade o elimina talentos y hechizos sobre la marcha, con botón para agotar/desactivar hechizos tras fallos de lanzamiento.
- **🎲 Lanzador de Dados Integrado:**
  - Tiradas para `d2`, `d4`, `d6`, `d8`, `d10`, `d12`, `d20` y `d100`.
  - Animación de barajado en tiempo real.
  - Efectos visuales explosivos: **Crítico (20 en amarillo)** y **Pifia (1 en rojo)**.
  - Historial con las últimas 10 tiradas.
- **🔮 Oráculo del Destino (Juego en Solitario):**
  - Opciones de probabilidad: *Poco Probable* (menor de 2d20), *50%* (1d20) y *Casi Seguro* (mayor de 2d20).
  - Generador de respuestas completas (*"¡SÍ, Y ADEMÁS...!"*, *"NO, PERO..."*, *"¡GIRO INESPERADO!"*, etc.).
- **💾 Guardado y Carga en JSON:** Exporta e importa el estado de todo tu grupo con un solo clic en un archivo `.json` ligero y sin necesidad de base de datos.
- **📱 Optimizado para Móvil y PWA:** Soporte táctil con arrastre suave (*swipe carousel*), prevención de zoom accidental y opción de "Añadir a la pantalla de inicio" en iOS/Android.

### 🚀 Instalación y Uso

No requiere instalación de dependencias ni servidores complejos:
1. Clona o descarga este repositorio:
   ```bash
   git clone [https://github.com/tu-usuario/shadowdark-sheet.git](https://github.com/tu-usuario/shadowdark-sheet.git)

   Shadowdark Sheet is a lightweight, responsive, and compact web application designed to track and manage from 1 to 4 characters simultaneously on a single screen. Tailored for Shadowdark RPG and classic OSR systems, it is optimized for tabletop gaming, solo roleplaying (Solo RPG), and mobile/tablet usage (PWA).

✨ Key Features
👥 Party Dashboard (1 to 4 PCs): Run up to 4 characters side-by-side with individual columnar scrolling and dynamic grid resizing.

📑 4 Interactive Tabs per Character with Touch Swipe Carousel:

Combat & Stats: Giant Hit Point counters, Armor Class (AC), Luck/Destiny tokens, auto-calculated ability modifiers (STR, DEX, CON, INT, WIS, CHA), weapons, and visual death indicator at 0 HP (💀).

Info & Background: Level, XP tracker, Class, Ancestry, Title, Alignment, Deity, and character background notes.

Gear & Currency: Gold, Silver, and Copper coin counters, ammo tracker with stepper buttons, 20 gear slots, and 6 free-carry slots.

Dynamic Spells & Talents: Add/remove talents and spells on the fly, including a toggle button to mark spells as exhausted/spent upon casting failure.

🎲 Integrated Dice Roller:

Dice support for d2, d4, d6, d8, d10, d12, d20, and d100.

Rolling shake animation.

Explosive visual triggers for Natural 20s (Gold Critical) and Natural 1s (Red Fumble).

Rolling history log (last 10 rolls).

🔮 Fate Oracle (Solo RPG Mode):

Probability modifiers: Unlikely (Disadvantage / keep lowest of 2d20), 50/50 (1d20), and Likely (Advantage / keep highest of 2d20).

Dynamic answers ("YES, AND...!", "NO, BUT...", "UNEXPECTED TWIST!", etc.).

💾 JSON Save & Load: Export and import your entire party state instantly into portable .json files without needing backend databases.

📱 Mobile & PWA Ready: Smooth touch gestures (interactive carousel swipe), anti-zoom protections on iOS/Android, and full offline standalone capability when added to the home screen.

🚀 Getting Started
Zero dependencies and no build steps required:

Clone or download this repository:

Bash
git clone [https://github.com/your-username/shadowdark-sheet.git](https://github.com/your-username/shadowdark-sheet.git)
Open index.html directly in your favorite modern browser or host it via GitHub Pages or Netlify.

⚖️ License & Credits
Built with pure HTML5, CSS3, and Vanilla JavaScript.

Designed for compatibility with Shadowdark RPG (The Arcane Library).
