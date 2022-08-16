### Fragment.js - a THREE.js driven UI fracture effect library.
Fragment.js is built with THREE.js, the Ammo.js physics library and html2canvas. 

#### Usage
1. Import Ammo.js in the head element.
```html
<script src="https://cdn.jsdelivr.net/gh/kripken/ammo.js@main/builds/ammo.js"></script>
```

2. Import Fragment.js at the end of your body element. This will also import Three.js and all other dependencies.
```html
<script type="module" src="https://cdn.jsdelivr.net/gh/mlatti/fragment.js@1.0.8/src/fragment.js"></script>
```

3. Add the webgl container. Tag the target element (which will be broken) with the following id-s:
```html
  <div id="webgl-container" style="position: absolute;"></div>
  <div id="fr-canvas" style="width:400px; background:yellow" class="fr-power-h"><div >
```
Make sure these elements are siblings and their parent is relatively positioned.
