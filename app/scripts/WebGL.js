import THREE from 'three';
window.THREE = THREE;
import WAGNER from '@superguigui/wagner';

// Passes
const FXAAPass = require('@superguigui/wagner/src/passes/fxaa/FXAAPASS');
const VignettePass = require('@superguigui/wagner/src/passes/vignette/VignettePass');
const NoisePass = require('@superguigui/wagner/src/passes/noise/noise');
const InvertPass = require('@superguigui/wagner/src/passes/invert/InvertPass');
const Bright = require('@superguigui/wagner/src/passes/brightness-contrast/BrightnessContrastPass');

// Objects
import Floor from './objects/Floor';
import Sphere from './objects/Sphere';

export default class WebGL {
  constructor(params) {
    this.params = {
      name: params.name || 'WebGL',
      device: params.device || 'desktop',
      postProcessing: params.postProcessing || false,
      keyboard: params.keyboard || false,
      mouse: params.mouse || false,
      touch: params.touch || false,
    };
    this.ready = false;
    this.phone = this.params.device === 'phone';

    this.mouse = new THREE.Vector2();
    this.originalMouse = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();
    this.tick = 0;
    this.damping = {
      sphere: {
        x: 0.02,
        y: 0.02,
        z: 0.02,
      },
      mouse: {
        x: 0.3,
        y: 0.3,
        z: 0.3,
      },
    };

    this.scene = new THREE.Scene();
    // this.scene.fog = new THREE.FogExp2(0x00226e, 0.015);
    // this.scene.fog.density = 0;

    this.camera = new THREE.PerspectiveCamera(50, params.size.width / params.size.height, 1, 1000);
    this.camera.position.z = 100;

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(params.size.width, params.size.height);
    this.renderer.setPixelRatio(window.devicePixelRatio ? window.devicePixelRatio : 1);
    this.renderer.setClearColor(0xffffff);
    // this.renderer.setClearColor(0x242424);

    if (window.DEBUG) {
      window.webGL = this;
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    }

    this.composer = null;
    this.initPostprocessing();
    const loader = new THREE.TextureLoader();

    loader.load('./assets/normal.jpg', (texture) => {
      this.initLights();
      this.initObjects(texture);
      this.ready = true;
      TweenMax.to(this.renderer.domElement, 2, {
        autoAlpha: 1,
      });
    });

    if (window.DEBUG || window.DEVMODE) this.initGUI();

  }
  initPostprocessing() {
    this.composer = new WAGNER.Composer(this.renderer);
    this.composer.setSize(window.innerWidth, window.innerHeight);
    window.composer = this.composer;

    // Add pass and automatic gui
    this.passes = [];
    this.fxaaPass = new FXAAPass();
    this.passes.push(this.fxaaPass);
    this.noisePass = new NoisePass();
    this.noisePass.params.amount = 0.04;
    this.noisePass.params.speed = 0.2;
    this.passes.push(this.noisePass);
    // this.invertPass = new Bright({});
    // this.invertPass.params.brightness = 1.05;

    // this.passes.push(this.invertPass);
    this.vignettePass = new VignettePass({});
    this.vignettePass.params.boost = 1.05;
    this.vignettePass.params.reduction = (this.phone) ? 0.2 : 0.5;

    this.passes.push(this.vignettePass);

  }
  initLights() {
    this.lights = new THREE.Group();

    const colors = [
      '#c947f9',
      '#f9b047',
      '#47f9f3',
    ];
    for (let i = 0; i < 8; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const light = new THREE.PointLight(color, 0, 100);
      TweenMax.to(light, 2, {
        intensity: 1,
      });
      light.position.x = Math.random() * (50 - -50) + -50;
      light.position.y = Math.random() * (50 - -50) + -50;
      light.position.z = Math.random() * (50 - -50) + -50;
      light.tick = Math.random() * (1 - -1) + -1;
      light.radius = Math.random() * (30 + -30) + -30;
      light.originalPos = new THREE.Vector3();
      light.originalPos = light.position.clone();
      // light.position.z = -20;
      this.lights.add(light);
    }
    this.scene.add(this.lights);
  }
  initObjects(texture) {

    this.planeRay = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(2000, 2000),
      new THREE.MeshNormalMaterial({ side: THREE.DoubleSide })
    );
    this.planeRay.material.visible = false;
    this.scene.add(this.planeRay);

    this.floor = new Floor({ renderer: this.renderer, phone: this.phone });
    this.sphere = new Sphere({ normal: texture });
    this.scene.add(this.sphere);
  }
  initGUI() {
    this.folder = window.gui.addFolder(this.params.name);
    this.folder.add(this.params, 'postProcessing');
    this.folder.add(this.params, 'keyboard');
    this.folder.add(this.params, 'mouse');
    this.folder.add(this.params, 'touch');


    // init postprocessing GUI
    this.postProcessingFolder = this.folder.addFolder('PostProcessing');
    for (let i = 0; i < this.passes.length; i++) {
      const pass = this.passes[i];
      pass.enabled = true;
      let containsNumber = false;
      for (const key of Object.keys(pass.params)) {
        if (typeof pass.params[key] === 'number') {
          containsNumber = true;
        }
      }
      const folder = this.postProcessingFolder.addFolder(pass.constructor.name);
      folder.add(pass, 'enabled');
      if (containsNumber) {
        for (const key of Object.keys(pass.params)) {
          if (typeof pass.params[key] === 'number') {
            folder.add(pass.params, key);
          }
        }
      }
      folder.open();
    }
    this.postProcessingFolder.open();

    // init scene.child GUI
    for (let i = 0; i < this.scene.children.length; i++) {
      const child = this.scene.children[i];
      if (typeof child.addGUI === 'function') {
        child.addGUI(this.folder);
      }
    }
    this.folder.open();
  }
  render() {
    if (this.params.postProcessing) {
      this.composer.reset();
      this.composer.render(this.scene, this.camera);

      // Passes
      for (let i = 0; i < this.passes.length; i++) {
        if (this.passes[i].enabled) {
          this.composer.pass(this.passes[i]);
        }
      }

      this.composer.toScreen();

    } else {
      this.renderer.render(this.scene, this.camera);
    }
    //  this.camera.lookAt( this.scene.position );
    if (window.DEBUG) this.controls.update();
    this.tick += 0.01;
    if (this.ready) {
      for (let i = 0; i < this.lights.children.length; i++) {
        const light = this.lights.children[i];
        light.position.x = light.originalPos.x + light.radius * Math.cos(this.tick * light.tick);
        light.position.y = light.originalPos.y + light.radius * Math.sin(this.tick * light.tick);
        light.position.z = light.originalPos.z + light.radius * Math.cos(this.tick * light.tick);
      }
      this.sphere.update();
      this.sphere.rotation.x += (this.mouse.y * this.damping.mouse.x - this.sphere.rotation.x)
       * this.damping.sphere.x;
      this.sphere.rotation.y += (-this.mouse.x * this.damping.mouse.y - this.sphere.rotation.y)
       * this.damping.sphere.y;
       this.sphere.rotation.z += (this.mouse.x * this.damping.mouse.z - this.sphere.rotation.z)
       * this.damping.sphere.z;


    }

  }
  hover() {
    this.floor.animate();
  }
  rayCast() {
    if (!this.ready) return;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObject(this.planeRay, true);
    if (intersects.length > 0) {
      this.sphere.updateMouse(intersects[0].point);
    }
  }
  // Events
  resize(width, height) {


    if (this.composer) {
      this.composer.setSize(width, height);
    }

    this.renderer.domElement.width = width * window.devicePixelRatio;
    this.renderer.domElement.height = height * window.devicePixelRatio;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }
  keyPress() {
    if (!this.params.keyboard) return;
  }
  keyDown() {
    if (!this.params.keyboard) return;
  }
  keyUp() {
    if (!this.params.keyboard) return;
  }
  click(x, y, time) {
    if (!this.params.mouse) return;
    this.originalMouse.x = x;
    this.originalMouse.y = y;
    this.mouse.x = (x / window.innerWidth - 0.5) * 2;
    this.mouse.y = (y / window.innerHeight - 0.5) * 2;

  }
  mouseMove(x, y, ime) {
    if (!this.params.mouse) return;
    this.originalMouse.x = x;
    this.originalMouse.y = y;
    this.mouse.x = (x / window.innerWidth - 0.5) * 2;
    this.mouse.y = - (y / window.innerHeight - 0.5) * 2;
    this.rayCast();
  }
  touchStart() {
    if (!this.params.touch) return;
  }
  touchEnd() {
    if (!this.params.touch) return;
  }
  touchMove(touches) {
    if (!this.params.touch) return;
    this.originalMouse.x = touches[0].clientX;
    this.originalMouse.y = touches[0].clientY;
    this.mouse.x = (touches[0].clientX / window.innerWidth - 0.5) * 2;
    this.mouse.y = (touches[0].clientY / window.innerHeight - 0.5) * 2;
  }

}
