export function generateNeuron(origin = [0, 0, 0], options = {}) {
  const somaRadius = options.somaRadius || 0.08;
  const dendriteCount = options.dendriteCount || 8;
  const dendriteDepth = options.dendriteDepth || 4;
  const assoneSegments = options.assoneSegments || 6; // ridotto per accorciare l'assone

  const positions = [];
  const normals = [];

  addSphere(origin, somaRadius, 10, 10, positions, normals);

  for (let i = 0; i < dendriteCount; i++) {
    const dir = perturbVector3(randomUnitVector3(), Math.random() * 90 + 30);
    const depth = dendriteDepth + Math.floor(Math.random() * 2 - 1);
    const length = 0.1 + Math.random() * 0.1;
    generateBranchWithCylinders(origin, dir, depth, length, 0.02, positions, normals);
  }

  const assoneDir = [0, -1, 0];
  let current = [...origin];

  for (let i = 0; i < assoneSegments; i++) {
    const next = [
      current[0] + assoneDir[0] * 0.2 + (Math.random() - 0.5) * 0.02,
      current[1] + assoneDir[1] * 0.2 + (Math.random() - 0.5) * 0.02,
      current[2] + assoneDir[2] * 0.2 + (Math.random() - 0.5) * 0.02
    ];
    addCylinder(current, next, 0.025, 12, positions, normals);
    current = next;
  }

  const assoneEnd = current;

  for (let i = 0; i < 6; i++) {
    const dir = perturbVector3([0.3, -0.1, 0.3], 60);
    generateBranchWithCylinders(assoneEnd, dir, 4, 0.15, 0.015, positions, normals);
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals)
  };
}

function addSphere(center, radius, latBands, longBands, positions, normals) {
  for (let lat = 0; lat < latBands; lat++) {
    const theta1 = lat * Math.PI / latBands;
    const theta2 = (lat + 1) * Math.PI / latBands;

    for (let lon = 0; lon < longBands; lon++) {
      const phi1 = lon * 2 * Math.PI / longBands;
      const phi2 = (lon + 1) * 2 * Math.PI / longBands;

      const p1 = sphericalToCartesian(radius, theta1, phi1, center);
      const p2 = sphericalToCartesian(radius, theta1, phi2, center);
      const p3 = sphericalToCartesian(radius, theta2, phi2, center);
      const p4 = sphericalToCartesian(radius, theta2, phi1, center);

      positions.push(...p1, ...p2, ...p3, ...p1, ...p3, ...p4);

      const n1 = normalize(sub(p1, center));
      const n2 = normalize(sub(p2, center));
      const n3 = normalize(sub(p3, center));
      const n4 = normalize(sub(p4, center));

      normals.push(...n1, ...n2, ...n3, ...n1, ...n3, ...n4);
    }
  }
}

function sphericalToCartesian(r, theta, phi, center) {
  return [
    center[0] + r * Math.sin(theta) * Math.cos(phi),
    center[1] + r * Math.cos(theta),
    center[2] + r * Math.sin(theta) * Math.sin(phi)
  ];
}

function addCylinder(start, end, radius, segments, positions, normals) {
  const axis = normalize([
    end[0] - start[0],
    end[1] - start[1],
    end[2] - start[2]
  ]);
  const base = orthogonalVector(axis);
  const angleStep = (2 * Math.PI) / segments;

  for (let i = 0; i < segments; i++) {
    const theta = i * angleStep;
    const nextTheta = (i + 1) * angleStep;

    const dir1 = rotateAround(base, axis, theta);
    const dir2 = rotateAround(base, axis, nextTheta);

    const p1 = addScaled(start, dir1, radius);
    const p2 = addScaled(start, dir2, radius);
    const p3 = addScaled(end, dir1, radius);
    const p4 = addScaled(end, dir2, radius);

    positions.push(...p1, ...p2, ...p3, ...p3, ...p2, ...p4);
    normals.push(...dir1, ...dir2, ...dir1, ...dir1, ...dir2, ...dir2);
  }
}

function generateBranchWithCylinders(origin, dir, depth, length, radius, positions, normals) {
  if (depth === 0) return;
  const end = [
    origin[0] + dir[0] * length,
    origin[1] + dir[1] * length,
    origin[2] + dir[2] * length
  ];
  addCylinder(origin, end, radius, 8, positions, normals);
  const branches = 1 + Math.floor(Math.random() * 2);
  for (let i = 0; i < branches; i++) {
    const newDir = perturbVector3(dir, 40);
    generateBranchWithCylinders(end, newDir, depth - 1, length * 0.7, radius * 0.7, positions, normals);
  }
}

function rotateAround(v, axis, angle) {
  const cosA = Math.cos(angle), sinA = Math.sin(angle);
  const dot = v[0]*axis[0] + v[1]*axis[1] + v[2]*axis[2];
  const cross = [
    axis[1]*v[2] - axis[2]*v[1],
    axis[2]*v[0] - axis[0]*v[2],
    axis[0]*v[1] - axis[1]*v[0]
  ];
  return [
    v[0]*cosA + cross[0]*sinA + axis[0]*dot*(1 - cosA),
    v[1]*cosA + cross[1]*sinA + axis[1]*dot*(1 - cosA),
    v[2]*cosA + cross[2]*sinA + axis[2]*dot*(1 - cosA)
  ];
}

function addScaled(base, dir, scale) {
  return [
    base[0] + dir[0]*scale,
    base[1] + dir[1]*scale,
    base[2] + dir[2]*scale
  ];
}

function sub(a, b) {
  return [a[0]-b[0], a[1]-b[1], a[2]-b[2]];
}

function normalize(v) {
  const len = Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
  return [v[0]/len, v[1]/len, v[2]/len];
}

function orthogonalVector(v) {
  return Math.abs(v[0]) < 0.5 ? normalize([0, -v[2], v[1]]) : normalize([-v[1], v[0], 0]);
}

function randomUnitVector3() {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  return [
    Math.sin(phi) * Math.cos(theta),
    Math.sin(phi) * Math.sin(theta),
    Math.cos(phi)
  ];
}

function perturbVector3(v, maxAngleDeg) {
  const angle = (Math.random() * maxAngleDeg * Math.PI) / 180;
  const axis = randomUnitVector3();
  const sinA = Math.sin(angle), cosA = Math.cos(angle);
  const dot = v[0]*axis[0] + v[1]*axis[1] + v[2]*axis[2];
  const cross = [
    axis[1]*v[2] - axis[2]*v[1],
    axis[2]*v[0] - axis[0]*v[2],
    axis[0]*v[1] - axis[1]*v[0]
  ];
  return [
    v[0]*cosA + cross[0]*sinA + axis[0]*dot*(1 - cosA),
    v[1]*cosA + cross[1]*sinA + axis[1]*dot*(1 - cosA),
    v[2]*cosA + cross[2]*sinA + axis[2]*dot*(1 - cosA)
  ];
}
