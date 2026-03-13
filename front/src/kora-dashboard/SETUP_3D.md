# Setup 3D Viewer — Three.js

Ajoute ce script dans ton `index.html` (dans le `<head>`) :

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
```

Exemple de `index.html` complet :

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>KÔRÂ</title>
    <!-- Three.js pour le viewer 3D -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

## Ce que fait le viewer 3D

- 🖱 **Drag** pour tourner la maison
- ⚲ **Scroll** pour zoomer / dézoomer  
- ● **Cliquer sur un point coloré** pour voir les infos de la pièce
- 🔄 **Auto-rotation** au chargement
- Bouton **"3D View"** dans le hero du AdminDashboard pour ouvrir le viewer
- Bouton **"Back to Dashboard"** pour revenir
