import THREE from 'three';
import hexRgb from 'hex-rgb';
const glslify = require('glslify');


export default class Sphere extends THREE.Object3D {
  constructor({ normal }) {
    super();
    this.tick = 0;
    this.geom = new THREE.SphereBufferGeometry(20, 72, 72);

    this.uniforms = THREE.UniformsUtils.merge([
      THREE.UniformsLib.common,
      THREE.UniformsLib.aomap,
      THREE.UniformsLib.lightmap,
      THREE.UniformsLib.emissivemap,
      THREE.UniformsLib.bumpmap,
      THREE.UniformsLib.normalmap,
      THREE.UniformsLib.displacementmap,
      THREE.UniformsLib.fog,
      THREE.UniformsLib.lights,
      {
        color: { type: 'c', value: new THREE.Color('rgb(54,57,255)') },
        emissive: { type: 'c', value: new THREE.Color(0x000000) },
        specular: { type: 'c', value: new THREE.Color(0x111111) },
        shininess: { type: '1f', value: 30 },
        tick: { type: 'f', value: this.tick },
        normalScale: { type: 'v2', value: new THREE.Vector2(10, 10) },
        mouse: { type: 'v3', value: new THREE.Vector2(0, 0) },
      },
    ]);

    this.mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: glslify('../shaders/sphere/index.vert'),
      fragmentShader: glslify('../shaders/sphere/index.frag'),
      wireframe: false,
      side: THREE.DoubleSide,
      depthTest: true,
      transparent: true,
      lights: true,
      fog: true,
      shading: THREE.FlatShading,
      extensions: {
        derivatives: true,
      },
      defines: {
        USE_NORMALMAP: true,
      },

    });

    this.mesh = new THREE.Mesh(this.geom, this.mat);
    this.mesh.material.uniforms.normalMap.value = normal;
    this.mesh.material.uniforms.normalMap.needsUpdate = true;
    this.mesh.position.x = Math.cos(0.0015 * 5);
    this.mesh.position.y = Math.sin(0.0015 * 5);

    this.add(this.mesh);

  }
  addGUI(folder) {

  }
  updateMouse(point) {
    TweenMax.to(this.uniforms.mouse.value, 0.8, {
      x: point.x,
      y: point.y,
    });
    // this.uniforms.mouse.value = point;

  }

  update() {
    this.tick += 0.0015;
    this.uniforms.tick.value = this.tick * 5;
    this.mesh.position.x = Math.cos(this.tick * 5);
    this.mesh.position.y = Math.sin(this.tick * 5);

  }
}
