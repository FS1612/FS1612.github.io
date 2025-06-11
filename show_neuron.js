import { generateNeuron } from './neuron.js';
import { Camera } from './camera.js';
import { mat4 } from 'https://cdn.skypack.dev/gl-matrix';

const canvas = document.getElementById("neuronCanvas");
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

const gl = canvas.getContext("webgl");
gl.viewport(0, 0, canvas.width, canvas.height);
gl.clearColor(0, 0, 0, 1);
gl.enable(gl.DEPTH_TEST);

const vsSource = `
attribute vec3 a_position;
attribute vec3 a_normal;
attribute float a_activation;
uniform mat4 u_modelViewMatrix;
uniform mat4 u_projectionMatrix;
varying vec3 v_normal;
varying float v_activation;
void main() {
  v_normal = mat3(u_modelViewMatrix) * a_normal;
  v_activation = a_activation;
  gl_Position = u_projectionMatrix * u_modelViewMatrix * vec4(a_position, 1.0);
}
`;

const fsSource = `
precision mediump float;
varying vec3 v_normal;
varying float v_activation;
void main() {
  vec3 lightDir = normalize(vec3(0.5, 1.0, 0.3));
  float brightness = max(dot(normalize(v_normal), lightDir), 0.3);
  vec3 baseColor = vec3(0.1, 0.2, 0.3);     // bluastro scuro
  vec3 flashColor = vec3(0.0, 1.0, 1.0);     // ciano brillante (effetto elettrico)
  vec3 color = mix(baseColor, flashColor, v_activation);
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

// === Carica neurone ===
const neuron = generateNeuron();
const vertexCount = neuron.positions.length / 3;

// === Buffer posizioni ===
const posBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
gl.bufferData(gl.ARRAY_BUFFER, neuron.positions, gl.STATIC_DRAW);
const aPosition = gl.getAttribLocation(program, "a_position");
gl.enableVertexAttribArray(aPosition);
gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);

// === Buffer normali ===
const normalBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
gl.bufferData(gl.ARRAY_BUFFER, neuron.normals, gl.STATIC_DRAW);
const aNormal = gl.getAttribLocation(program, "a_normal");
gl.enableVertexAttribArray(aNormal);
gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);

// === Buffer attivazioni ===
const activationData = new Float32Array(vertexCount).fill(0);
const activationBuffer = gl.createBuffer();
const aActivation = gl.getAttribLocation(program, "a_activation");
gl.bindBuffer(gl.ARRAY_BUFFER, activationBuffer);
gl.bufferData(gl.ARRAY_BUFFER, activationData, gl.DYNAMIC_DRAW);
gl.enableVertexAttribArray(aActivation);
gl.vertexAttribPointer(aActivation, 1, gl.FLOAT, false, 0, 0);

// === Matrici e camera ===
const uModelViewMatrix = gl.getUniformLocation(program, "u_modelViewMatrix");
const uProjectionMatrix = gl.getUniformLocation(program, "u_projectionMatrix");
const projectionMatrix = mat4.create();
mat4.perspective(projectionMatrix, Math.PI / 4, canvas.width / canvas.height, 0.1, 100);
const camera = new Camera(canvas);

// === Parametri scarica ===
let currentIndex = 0;
const segmentLength = 100;
const delay = 5;

function pulseEffect() {
  activationData.fill(0);// reset
  const center = currentIndex;
  const waveWidth = 100;

  for (let i = -waveWidth; i <= waveWidth; i++) {
    const idx = center + i;
    if (idx >= 0 && idx < activationData.length) {
      const distance = i / waveWidth;
      const intensity = Math.exp(-distance * distance * 4); // gaussiana
      activationData[idx] = intensity;
    }
  }

  currentIndex += 50;
  if (currentIndex >= activationData.length) currentIndex = 0;
}

let frameCount = 0;

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  const modelViewMatrix = camera.getViewMatrix();
  gl.uniformMatrix4fv(uModelViewMatrix, false, modelViewMatrix);
  gl.uniformMatrix4fv(uProjectionMatrix, false, projectionMatrix);

  if (frameCount % delay === 0) {
    pulseEffect(); // avanza la scarica
  }

  // Decadimento
  for (let i = 0; i < activationData.length; i++) {
    activationData[i] = Math.max(0, activationData[i] - 0.03);
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, activationBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, activationData, gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(aActivation, 1, gl.FLOAT, false, 0, 0);

  gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
  frameCount++;
  requestAnimationFrame(render);
}

render();
