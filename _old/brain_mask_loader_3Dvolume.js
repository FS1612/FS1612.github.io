export function loadBrainMask3DVolume(imagePath, numPoints, depth = 0.5, callback) {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = imagePath;

  img.onload = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const validPixels = [];

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const i = (y * canvas.width + x) * 4;
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        if (brightness > 80) {
          validPixels.push({ x, y });
        }
      }
    }

    const selected = [];

    while (selected.length / 3 < numPoints && validPixels.length > 0) {
      const idx = Math.floor(Math.random() * validPixels.length);
      const p = validPixels.splice(idx, 1)[0];

      const nx = (p.x / canvas.width) * 2 - 1;
      const ny = -((p.y / canvas.height) * 2 - 1);

      const r2 = nx * nx + ny * ny;
      if (r2 > 1) continue; // fuori dalla cupola

      const z = Math.sqrt(1 - r2) * depth + (Math.random() - 0.5) * 0.03;

      const jitterX = nx + (Math.random() - 0.5) * 0.01;
      const jitterY = ny + (Math.random() - 0.5) * 0.01;

      selected.push(jitterX, jitterY, z);
    }

    callback(new Float32Array(selected));
  };

  img.onerror = () => {
    console.error("Errore nel caricamento della maschera:", imagePath);
  };
}
