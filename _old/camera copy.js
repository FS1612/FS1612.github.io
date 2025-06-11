export class Camera {
  constructor(canvas) {
    this.canvas = canvas;
    this._zoom = 1;
    this._translation = { x: 0, y: 0 };
    this._rotation = 0;

    this.dragging = false;
    this.mode = null;
    this.last = { x: 0, y: 0 };

    this.setupEvents();
  }

  get zoom() {
    return this._zoom;
  }

  set zoom(val) {
    this._zoom = val;
  }

  get translate() {
    return [this._translation.x, this._translation.y];
  }

  set translate([x, y]) {
    this._translation.x = x;
    this._translation.y = y;
  }

  get rotation() {
    return this._rotation;
  }

  set rotation(angle) {
    this._rotation = angle;
  }

  setupEvents() {
    this.canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      const scaleFactor = 1.1;
      if (e.deltaY < 0) {
        this._zoom *= scaleFactor;
      } else {
        this._zoom /= scaleFactor;
      }
    });

    this.canvas.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return; // solo mouse sinistro

      if (e.ctrlKey) {
        this.dragging = true;
        this.mode = "pan";
      } else if (e.shiftKey) {
        this.dragging = true;
        this.mode = "rotate";
      } else {
        this.dragging = false;
        this.mode = null;
      }

      this.last.x = e.clientX;
      this.last.y = e.clientY;
    });

    this.canvas.addEventListener("mouseup", () => {
      this.dragging = false;
      this.mode = null;
    });

    this.canvas.addEventListener("mousemove", (e) => {
      if (!this.dragging || !this.mode) return;

      const dx = e.clientX - this.last.x;
      const dy = e.clientY - this.last.y;

      if (this.mode === "pan") {
        this._translation.x += dx / this.canvas.width * 2;
        this._translation.y -= dy / this.canvas.height * 2;
      }

      if (this.mode === "rotate") {
        const delta = dx / this.canvas.width;
        this._rotation += delta * 2 * Math.PI;
      }

      this.last.x = e.clientX;
      this.last.y = e.clientY;
    });
  }

  apply(gl, program) {
    const uScale = gl.getUniformLocation(program, "u_scale");
    const uTranslate = gl.getUniformLocation(program, "u_translate");
    const uRotation = gl.getUniformLocation(program, "u_rotation");

    gl.uniform1f(uScale, this._zoom);
    gl.uniform2f(uTranslate, this._translation.x, this._translation.y);

    const cosA = Math.cos(this._rotation);
    const sinA = Math.sin(this._rotation);
    gl.uniform2f(uRotation, cosA, sinA);
  }
}
