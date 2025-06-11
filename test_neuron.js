// test_neuron.js
import { generateNeuron } from './neuron.js';
import { Camera } from './camera.js';
import { mat4 } from 'https://cdn.skypack.dev/gl-matrix';

const canvas = document.getElementById("glcanvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const gl = canvas.getContext("webgl");
gl.viewport(0, 0, canvas.width, canvas.height);
gl.clearColor(0, 0, 0, 1);
gl.enable(gl.DEPTH_TEST);

const vsSource = `
attribute vec3 a_position;
attribute vec3 a_normal;
uniform mat4 u_modelViewMatrix;
uniform mat4 u_projectionMatrix;
varying vec3 v_normal;
void main() {
  v_normal = mat3(u_modelViewMatrix) * a_normal;
  gl_Position = u_projectionMatrix * u_modelViewMatrix * vec4(a_position, 1.0);
}
`;

const fsSource = `
precision mediump float;
varying vec3 v_normal;
void main() {
  vec3 lightDir = normalize(vec3(0.5, 1.0, 0.3));
  float brightness = max(dot(normalize(v_normal), lightDir), 0.2);
  vec3 color = vec3(1.0, 0.9, 0.3);
  gl_FragColor = vec4(color * brightness, 1.0);
}
`;

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
  }
  return shader;
}

function createProgram(gl, vs, fs) {
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
  }
  return program;
}

const vs = compileShader(gl, gl.VERTEX_SHADER, vsSource);
const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);
const program = createProgram(gl, vs, fs);
gl.useProgram(program);

const neuron = generateNeuron();
const posBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
gl.bufferData(gl.ARRAY_BUFFER, neuron.positions, gl.STATIC_DRAW);

const aPosition = gl.getAttribLocation(program, "a_position");
gl.enableVertexAttribArray(aPosition);
gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);

const normalBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
gl.bufferData(gl.ARRAY_BUFFER, neuron.normals, gl.STATIC_DRAW);

const aNormal = gl.getAttribLocation(program, "a_normal");
gl.enableVertexAttribArray(aNormal);
gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);

const uModelViewMatrix = gl.getUniformLocation(program, "u_modelViewMatrix");
const uProjectionMatrix = gl.getUniformLocation(program, "u_projectionMatrix");

const projectionMatrix = mat4.create();
mat4.perspective(projectionMatrix, Math.PI / 4, canvas.width / canvas.height, 0.1, 100);
const camera = new Camera(canvas);

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  const modelViewMatrix = camera.getViewMatrix();
  gl.uniformMatrix4fv(uModelViewMatrix, false, modelViewMatrix);
  gl.uniformMatrix4fv(uProjectionMatrix, false, projectionMatrix);
  gl.drawArrays(gl.TRIANGLES, 0, neuron.positions.length / 3);
  requestAnimationFrame(render);
}

render();
