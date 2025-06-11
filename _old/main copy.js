// === main.js ===
import { Camera } from '../camera.js';

const canvas = document.getElementById("glcanvas");


const gl = canvas.getContext("webgl");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let aspect = 1.0;
let brainAspect = 1.0;

gl.viewport(0, 0, canvas.width, canvas.height);
gl.clearColor(0.0, 0.0, 0.0, 1);

const NUM_NEURONS = 1100;
const CONNECT_RADIUS = 0.13;
const positions = new Float32Array(NUM_NEURONS * 2);
const activations = new Float32Array(NUM_NEURONS);
const camera = new Camera(canvas);

const vsSource = `
// Vertex Shader
attribute vec2 a_position;
uniform float u_scale;
uniform vec2 u_translate;
uniform float u_aspect;
uniform vec2 u_rotation;

void main() {
  vec2 pos = (a_position + u_translate) * u_scale;

  // rotazione
  pos = vec2(
    pos.x * u_rotation.x - pos.y * u_rotation.y,
    pos.x * u_rotation.y + pos.y * u_rotation.x
  );

  pos.y *= u_aspect;
  gl_PointSize = 3.0;
  gl_Position = vec4(pos, 0, 1);
}
`;

const fsSource = `
precision mediump float;
uniform float u_active;
void main() {
  float glow = smoothstep(0.05, 0.0, length(gl_PointCoord - vec2(0.5)));
  vec3 base = vec3(0.1, 0.5, 1.0);
  vec3 highlight = vec3(1.0, 1.0, 1.0);
  vec3 color = mix(base, highlight, u_active);
  float intensity = mix(0.3, 1.5, u_active); // glow più forte
  gl_FragColor = vec4(color * glow * intensity, 1.0);
}
`;

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    return null;
  }
  return shader;
}

function createProgram(gl, vsSource, fsSource) {
  const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(prog));
    return null;
  }
  return prog;
}

const program = createProgram(gl, vsSource, fsSource);
const positionBuffer = gl.createBuffer();
const positionLocation = gl.getAttribLocation(program, "a_position");
const uActive = gl.getUniformLocation(program, "u_active");
const uAspect = gl.getUniformLocation(program, "u_aspect");
const uRotation = gl.getUniformLocation(program, "u_rotation");

gl.useProgram(program);
gl.enableVertexAttribArray(positionLocation);

canvas.addEventListener("click", (e) => {
  const x = (e.clientX / canvas.width) * 2 - 1;
  const y = -((e.clientY / canvas.height) * 2 - 1);
  for (let i = 0; i < NUM_NEURONS; i++) {
    const dx = x - positions[i * 2];
    const dy = y - positions[i * 2 + 1];
    if (dx * dx + dy * dy < 0.01) {
      activations[i] = 1.0;
    }
  }
});

function update() {
  for (let i = 0; i < NUM_NEURONS; i++) {
    activations[i] *= 0.95;
  }
  for (let i = 0; i < NUM_NEURONS; i++) {
    for (let j = i + 1; j < NUM_NEURONS; j++) {
      const dx = positions[i * 2] - positions[j * 2];
      const dy = positions[i * 2 + 1] - positions[j * 2 + 1];
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < CONNECT_RADIUS) {
        if (activations[i] > 0.8 || activations[j] > 0.8) {
          activations[i] = activations[j] = 1.0;
        }
      }
    }
  }
}

function render() {
  const screenAspect = canvas.height / canvas.width;
  aspect = brainAspect / screenAspect;
  gl.clear(gl.COLOR_BUFFER_BIT);
  update();

  for (let i = 0; i < NUM_NEURONS; i++) {
    gl.useProgram(program);
    camera.apply(gl, program);
    gl.uniform1f(uActive, activations[i]);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      positions[i * 2], positions[i * 2 + 1]
    ]), gl.STREAM_DRAW);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.uniform1f(uAspect, aspect);
    gl.drawArrays(gl.POINTS, 0, 1);
   
    
  }

  const lines = [];
  for (let i = 0; i < NUM_NEURONS; i++) {
    for (let j = i + 1; j < NUM_NEURONS; j++) {
      const dx = positions[i * 2] - positions[j * 2];
      const dy = positions[i * 2 + 1] - positions[j * 2 + 1];
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < CONNECT_RADIUS) {
        lines.push(positions[i * 2], positions[i * 2 + 1]);
        lines.push(positions[j * 2], positions[j * 2 + 1]);
      }
    }
  }

  const lineBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lines), gl.STREAM_DRAW);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(positionLocation);
  gl.useProgram(program);
  camera.apply(gl, program);
  gl.uniform1f(uActive, 0.0);
  gl.uniform1f(uAspect, aspect);
  gl.drawArrays(gl.LINES, 0, lines.length / 2);

  requestAnimationFrame(render);
}

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  gl.viewport(0, 0, canvas.width, canvas.height);
  adjustCameraToBoundingBox();

  render();
});

function computeBoundingBox(positions) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (let i = 0; i < positions.length; i += 2) {
    const x = positions[i];
    const y = positions[i + 1];
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  return { minX, maxX, minY, maxY };
}

loadBrainMask("brain_mask.png", NUM_NEURONS, (loadedPositions) => {
  positions.set(loadedPositions);

  const { minX, maxX, minY, maxY } = computeBoundingBox(positions);
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const sizeX = maxX - minX;
  const sizeY = maxY - minY;

  brainAspect = sizeY / sizeX;
  const screenAspect = canvas.height / canvas.width;
  aspect = brainAspect / screenAspect;
  gl.uniform1f(uAspect, aspect);

  const zoomX = 2 / sizeX;
  const zoomY = 2 / sizeY;
  const zoom = Math.min(zoomX, zoomY) * 0.65;

  camera.translate = [-centerX, -centerY];
  camera.zoom = zoom;

  render();
});
function adjustCameraToBoundingBox() {
  const { minX, maxX, minY, maxY } = computeBoundingBox(positions);
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const sizeX = maxX - minX;
  const sizeY = maxY - minY;

  brainAspect = sizeY / sizeX;
  const screenAspect = canvas.height / canvas.width;
  aspect = brainAspect / screenAspect;
  gl.uniform1f(uAspect, aspect);

  const zoomX = 2 / sizeX;
  const zoomY = 2 / sizeY;
  const zoom = Math.min(zoomX, zoomY) * 0.65;

  camera.translate = [-centerX, -centerY];
  camera.zoom = zoom;
}
