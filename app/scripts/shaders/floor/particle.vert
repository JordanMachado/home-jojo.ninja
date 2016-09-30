
uniform float tick;
uniform vec3 mouse;
uniform float repeat;
uniform float noiseScale;
uniform float timeScale;
uniform float pointSizeScale;
uniform float size;

attribute float pointSize;
attribute vec3 color;

varying vec3 vColor;
#pragma glslify: snoise2 = require(glsl-noise/simplex/2d)
void main() {

  vec2 pos = uv * repeat;
  vColor = color;
  float noise = snoise2(vec2(pos.x, pos.y + (tick * timeScale))) * noiseScale;
  vec3 newPosition = position;
  newPosition.z += noise;
  float grow = size  - distance(mouse, newPosition);
  gl_PointSize = pointSize * pointSizeScale + max(grow,0.0);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);

}
