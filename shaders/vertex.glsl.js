// vertex.glsl.js
export const vsSource = `
attribute vec3 a_position;
attribute vec3 a_normal;

uniform mat4 u_modelViewMatrix;
uniform mat4 u_projectionMatrix;

varying vec3 v_normal;

void main() {
  v_normal = mat3(u_modelViewMatrix) * a_normal;
  gl_Position = u_projectionMatrix * u_modelViewMatrix * vec4(a_position, 1.0);
}`;
