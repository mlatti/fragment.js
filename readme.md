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
<script type="module" src="https://cdn.jsdelivr.net/gh/mlatti/fragment.js/src/fragment.js"></script>
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

`.fr-power-h` - high-impulse break. Default value is medium.

`.fr-power-m` - medium-impulse break. Default value is medium.

`.fr-power-l` - low-impulse break. Default value is medium.

`.fr-behind` - impulse will hit the wall from behind. By default, impulse comes from the front.

`.fr-visible-ball` - the wrecking ball is visible. Default value is invisible.

`.fr-backgroundcolor-red` - sets background color to red. Change red to any css color value. Default vlaue is transparent.

`.fr-bordercolor-red` - sets the color of non-textured sides of fragments to red. Change red to any css color value. Default value is a lighter shade of the background color of `#fr-canvas`.

#### Examples
[Basic usage](https://jsfiddle.net/mlatti/3od7a0L2/18/) 

[Ball hits the wall from behind](https://jsfiddle.net/mlatti/3od7a0L2/19/) 

[Using a button as trigger](https://jsfiddle.net/mlatti/246aw019/99/)

[Customised background, border and visible ball](https://jsfiddle.net/mlatti/246aw019/97/)
