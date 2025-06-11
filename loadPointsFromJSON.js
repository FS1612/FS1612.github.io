export function loadPointsFromJSON(url, callback) {
  fetch(url)
    .then(res => res.json())
    .then(data => {
      const flat = data.flat(); // da [[x,y,z], ...] a [x1,y1,z1,x2,y2,z2,...]
      callback(new Float32Array(flat));
    })
    .catch(err => console.error("Errore nel caricamento JSON:", err));
}
