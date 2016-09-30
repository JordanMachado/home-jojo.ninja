import THREE from 'three';
import hexRgb from 'hex-rgb';
const glslify = require('glslify');


export default class Floor extends THREE.Object3D {
  constructor({ renderer, phone }) {
    super();

    this.tick = 0;
    this.repeat = 1.4;
    this.size = 0;
    this.animating = false;
    this.noiseScale = 11.7;
    this.mouse = new THREE.Vector3(20000, 20000, 20000);
    this.timeScale = 0.12;
    this.pointSizeScale = 1;
    const loader = new THREE.TextureLoader();
    loader.load('./assets/particle.png', (texture) => {
      this.uniforms.texture.value = texture;
    });

    this.renderer = renderer;
    const width = phone ? 48 : 72;
    const height = phone ? 48 : 72;
    this.data = new Float32Array(width * height * 4);

    this.geom = new THREE.BufferGeometry();
    const vertices = new Float32Array(width * height * 3);
    const uvs = new Float32Array(width * height * 2);
    const pointSize = new Float32Array(width * height);
    const colors = new Float32Array(width * height * 3);
    this.colors = [
      'E63946',
      'F1FAEE',
      'A8DADC',
      '457B9D',
      '1D3557',
    ];
    let count = 0;
    for (let i = 0; i < this.data.length * 4; i += 4) {


      this.data[i] = 0;
      this.data[i + 1] = 0;
      this.data[i + 2] = 0;
      this.data[i + 3] = Math.random();

      pointSize[count] = Math.random() * 10.0;

      uvs[count * 2 + 0] = (count % width) / width;
      uvs[count * 2 + 1] = Math.floor(count / width) / height;


      const color = hexRgb(this.colors[Math.floor(this.colors.length * Math.random())]);
      colors[count * 3 + 0] = color[0] / 255;
      colors[count * 3 + 1] = color[1] / 255;
      colors[count * 3 + 2] = color[2] / 255;


      vertices[count * 3 + 0] = ((count % width) / width - 0.5) * width;
      vertices[count * 3 + 1] = ((count / width) / height - 0.5) * height + (Math.random() * 10);
      vertices[count * 3 + 2] = 0;

      count ++;
    }

    this.geom.addAttribute('position', new THREE.BufferAttribute(vertices, 3));
    this.geom.addAttribute('pointSize', new THREE.BufferAttribute(pointSize, 1));
    this.geom.addAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    this.geom.addAttribute('color', new THREE.BufferAttribute(colors, 3));

    this.uniforms = {
      tMap: {
        type: 't',
        value: this.rtTextureIn,
      },
      texture: {
        type: 't',
        value: new THREE.Texture(),
      },
      tick: {
        type: 'f',
        value: this.tick,
      },
      repeat: {
        type: 'f',
        value: this.repeat,
      },
      noiseScale: {
        type: 'f',
        value: this.noiseScale,
      },
      timeScale: {
        type: 'f',
        value: this.timeScale,
      },
      mouse: {
        type: 'v3',
        value: this.mouse,
      },
      size: {
        type: 'f',
        value: this.size,
      },
      pointSizeScale: {
        type: 'f',
        value: this.pointSizeScale,
      },
    };

    this.mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: glslify('../shaders/floor/particle.vert'),
      fragmentShader: glslify('../shaders/floor/particle.frag'),
      depthWrite: false,
      depthTest: false,
      transparent: true,
    });

    this.system = new THREE.Points(this.geom, this.mat);
    this.system.rotation.x = 90 * Math.PI / 180;
    this.system.position.z = 30;

    this.add(this.system);
    // this.createImage('/assets/yves_klein256.jpg', width, height, -5);

  }
  addGUI(folder) {
    this.folder = folder.addFolder('Floor');

    this.folder.add(this.system.position, 'x').min(-50).max(50);
    this.folder.add(this.system.position, 'y').min(-50).max(50);
    this.folder.add(this.system.position, 'z').min(-50).max(50);

    this.folder.add(this.system.rotation, 'x').min(0).max(Math.PI * 2);
    this.folder.add(this.system.rotation, 'y').min(0).max(Math.PI * 2);
    this.folder.add(this.system.rotation, 'z').min(0).max(Math.PI * 2);
    this.folder.add(this, 'repeat').min(0).max(20).onChange(() => {
      this.uniforms.repeat.value = this.repeat;
    });
    this.folder.add(this, 'noiseScale').min(-50).max(50).onChange(() => {
      this.uniforms.noiseScale.value = this.noiseScale;
    });
    this.folder.add(this, 'timeScale').min(0).max(1).onChange(() => {
      this.uniforms.timeScale.value = this.timeScale;
    });
    this.folder.add(this, 'pointSizeScale').min(0).max(10).onChange(() => {
      this.uniforms.pointSizeScale.value = this.pointSizeScale;
    });
    this.folder.open();

  }

  move(position) {
    this.system.position.set(position.x, position.y, position.z);
  }
  animate() {
    const point = new THREE.Vector3(-100, 0, 0);
    if (this.animating) return;
    this.animating = true;

    TweenMax.to(point, 5, {
      x: 300,
      onUpdate: () => {
        this.uniforms.mouse.value = point;
      },
      ease: Quad.easeOut,
      onComplete: () => {
        this.animating = false;
      },
    });
    TweenMax.to(this, 2.5, {
      size: 20,
      onUpdate: () => {
        this.uniforms.size.value = this.size;
      },
      ease: Quad.easeOut,
    });
    TweenMax.to(this, 2.5, {
      size: 0,
      onUpdate: () => {
        this.uniforms.size.value = this.size;
      },
      ease: Quad.easeOut,
      delay: 2.5,
    });
  }
  update() {
    this.tick += 0.01;
    this.uniforms.tick.value = this.tick;
  }
}
