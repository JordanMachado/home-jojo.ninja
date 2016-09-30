uniform sampler2D texture;
varying vec3 vColor;

void main() {

  vec4 mask = texture2D( texture, gl_PointCoord );
  gl_FragColor = vec4(vColor, mask.a);

}
