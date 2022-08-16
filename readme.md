### Fragment.js - a THREE.js driven UI fracture effect library.
Fragment.js is built with THREE.js, the Ammo.js physics library and html2canvas. 

#### Limitations/TODO
1. Not optimised for mobile
2. Target elements need a certain size/volume. Small elements may not be fractured, just pushed around.
3. Only 1 element may be broken on one page.
4. No respawn by default. If you want to test without reloading the page, resize the screen.

#### Usage
1. Import Ammo.js in the head element.
```html
<script src="https://cdn.jsdelivr.net/gh/kripken/ammo.js@main/builds/ammo.js"></script>
```

2. Import Fragment.js at the end of your body element. This will also import Three.js and all other dependencies.
```html
<script type="module" src="https://cdn.jsdelivr.net/gh/mlatti/fragment.js@1.0.8/src/fragment.js"></script>
```

3. Add the webgl container with the following id: `#webgl-container`. Tag the target element (i.e. the element which will be broken) with the following id: `#fr-canvas`. Make sure these elements are siblings and their parent is relatively positioned.
```html
  <div id="webgl-container" style="position: absolute;"></div>
  <div id="fr-canvas"><div >
```

4. Optional: by default, fracture will be triggered by clicking on the target element. You can add a trigger element (such as a button) by using the following id: `#fr-trigger`. The z-index of this trigger element must be > 1.
```html
  <div id="webgl-container" style="position: absolute;"></div>
  <div id="fr-canvas">
      <a href="#" id="fr-trigger" style="z-index: 2;">
        <div>Click me!</div>
      </a>  
  <div >
```

#### Customisation
You may change the behavior/look 'n feel by adding the following classes to `#webgl-canvas`:

`.fr-power-h` - high-impulse break.
