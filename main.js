import { createProgramFromSources } from './utils/webgl-utils.js';
import { Camera } from './camera.js';
import { vsSource } from './shaders/vertex.glsl.js';
import { fsSource } from './shaders/fragment.glsl.js';
import { mat4 } from 'https://cdn.skypack.dev/gl-matrix';
import { loadPointsFromJSON } from './loadPointsFromJSON.js';

// === Setup canvas e WebGL ===
const canvas = document.getElementById("glcanvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const gl = canvas.getContext("webgl");
gl.viewport(0, 0, canvas.width, canvas.height);
gl.clearColor(0, 0, 0, 1);
gl.enable(gl.DEPTH_TEST);
gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

// === Setup shaders e attributi ===
const program = createProgramFromSources(gl, vsSource, fsSource);
gl.useProgram(program);

const aPosition = gl.getAttribLocation(program, "a_position");
const uModelViewMatrix = gl.getUniformLocation(program, "u_modelViewMatrix");
const uProjectionMatrix = gl.getUniformLocation(program, "u_projectionMatrix");
const uActive = gl.getUniformLocation(program, "u_active");

gl.enableVertexAttribArray(aPosition);

// === Setup Camera e Matrici ===
const camera = new Camera(canvas);
const projectionMatrix = mat4.create();
mat4.perspective(projectionMatrix, Math.PI / 4, canvas.width / canvas.height, 0.1, 100);

// === Variabili globali ===
const positionBuffer = gl.createBuffer();
const lineBuffer = gl.createBuffer();
let connections = [];
let connectionStates = [];
let activations = [];
let tick = 0;

// === Funzione per generare connessioni ===
function generateConnections(positions, threshold) {
  const conns = [];
  for (let i = 0; i < positions.length; i += 3) {
    for (let j = i + 3; j < positions.length; j += 3) {
      const dx = positions[i] - positions[j];
      const dy = positions[i + 1] - positions[j + 1];
      const dz = positions[i + 2] - positions[j + 2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < threshold) {
        conns.push(
          positions[i], positions[i + 1], positions[i + 2],
          positions[j], positions[j + 1], positions[j + 2]
        );
        connectionStates.push(0);
      }
    }
  }
  return conns;
}

// === Animazioni neurali ===
function applyActivations(count) {
  // Cluster fissi
  if (tick % 100 === 0) {
    activateRange(Math.floor(count * 0.2), 12);
  }

  if (tick % 180 === 0) {
    activateRange(Math.floor(count * 0.7), 8);
  }

  // Pulsazione sinusoidale
  if (tick % 60 === 0) {
    const pulse = Math.abs(Math.sin(tick * 0.02));
    for (let i = 0; i < count; i += 25) {
      activations[i] = pulse;
    }
  }

  // Attivazione casuale
  if (tick % 200 === 0) {
    activateRange(Math.floor(Math.random() * (count - 20)), 15);
  }

  // Propagazione a catena
  if (tick % 140 === 0) {
    const start = Math.floor(Math.random() * (count - 40));
    for (let i = 0; i < 40; i++) {
      setTimeout(() => activations[start + i] = 1.0, i * 20);
    }
  }
}

function activateRange(startIndex, length) {
  for (let i = 0; i < length; i++) {
    if (startIndex + i < activations.length) {
      activations[startIndex + i] = 1.0;
    }
  }
}

// === Logica principale di rendering ===
function render(count) {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const modelViewMatrix = camera.getViewMatrix();
  gl.uniformMatrix4fv(uModelViewMatrix, false, modelViewMatrix);
  gl.uniformMatrix4fv(uProjectionMatrix, false, projectionMatrix);

  tick++;
  applyActivations(count);

  // Decadimento attivazioni
  for (let i = 0; i < count; i++) {
    activations[i] *= 0.96;
  }

  // Aggiornamento stato connessioni
  for (let i = 0; i < connections.length; i += 6) {
    const idx = Math.floor(i / 6) * 2;
    const a = idx;
    const b = idx + 1;

    if (activations[a] > 0.8 || activations[b] > 0.8) {
      activations[a] = activations[b] = 1.0;
      connectionStates[Math.floor(i / 6)] = 1.0;
    } else {
      connectionStates[Math.floor(i / 6)] *= 0.9;
    }
  }

  // === Disegno dei punti ===
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
  for (let i = 0; i < count; i++) {
    gl.uniform1f(uActive, activations[i]);
    gl.drawArrays(gl.POINTS, i, 1);
  }

  // === Disegno delle connessioni ===
  gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer);
  gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
  for (let i = 0; i < connectionStates.length; i++) {
    gl.uniform1f(uActive, connectionStates[i]);
    gl.drawArrays(gl.LINES, i * 2, 2);
  }

  requestAnimationFrame(() => render(count));
}

// === Caricamento dati e avvio ===
loadPointsFromJSON("brain_points.json", (positions) => {
  const numPoints = positions.length / 3;
  activations = new Float32Array(numPoints).fill(0);
  connections = generateConnections(positions, 0.4); // Aumentata la soglia

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(connections), gl.DYNAMIC_DRAW);

  gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
  render(numPoints);
});
