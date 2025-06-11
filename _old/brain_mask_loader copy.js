// === brain_mask_loader.js ===

/**
 * Carica un'immagine e campiona punti dove i pixel sono sufficientemente chiari e spazialmente distribuiti
 * @param {string} imagePath - path all'immagine (cervello su sfondo nero)
 * @param {number} numPoints - numero massimo di neuroni da generare
 * @param {function} callback - funzione che riceve Float32Array con punti [x1, y1, x2, y2, ...]
 */
function loadBrainMask(imagePath, numPoints, callback) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imagePath;

    img.onload = () => {
        const canvas2d = document.createElement("canvas");
        const ctx = canvas2d.getContext("2d");
        canvas2d.width = img.width;
        canvas2d.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imgData = ctx.getImageData(0, 0, img.width, img.height);
        const data = imgData.data;

        const validPixels = [];
        for (let y = 0; y < img.height; y++) {
            for (let x = 0; x < img.width; x++) {
                const index = (y * img.width + x) * 4;
                const r = data[index];
                const g = data[index + 1];
                const b = data[index + 2];

                const brightness = (r + g + b) / 3;
                if (brightness > 80) { // soglia di luminosità
                    validPixels.push({ x, y });
                }
            }
        }

        // Algoritmo tipo Poisson Disk: evita punti troppo vicini
        const minDistance = 6; // distanza minima in pixel
        const selected = [];

        while (selected.length < numPoints * 2 && validPixels.length > 0) {
            const i = Math.floor(Math.random() * validPixels.length);
            const candidate = validPixels[i];

            let tooClose = false;
            for (let j = 0; j < selected.length; j += 2) {
                const dx = candidate.x - ((selected[j] + 1) * img.width / 2);
                const dy = candidate.y - ((-selected[j + 1] + 1) * img.height / 2);
                if (dx * dx + dy * dy < minDistance * minDistance) {
                    tooClose = true;
                    break;
                }
            }

            if (!tooClose) {
                const normX = (candidate.x / img.width) * 2 - 1;
                const normY = -((candidate.y / img.height) * 2 - 1);

                const warpedX = normX + 0.015 * Math.sin(normY * 10);
                const warpedY = normY + 0.015 * Math.cos(normX * 10);
                const jitterX = warpedX + (Math.random() - 0.5) * 0.01;
                const jitterY = warpedY + (Math.random() - 0.5) * 0.01;

                selected.push(jitterX, jitterY);
            }

            validPixels.splice(i, 1); // rimuovi il punto usato
        }

        callback(new Float32Array(selected));
    };

    img.onerror = () => {
        console.error("Impossibile caricare l'immagine:", imagePath);
    };
}
