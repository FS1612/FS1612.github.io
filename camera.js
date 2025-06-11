import { mat4 } from 'https://cdn.skypack.dev/gl-matrix';

export class Camera {
  constructor(canvas) {
    this.canvas = canvas;
    this.yaw = 0;
    this.pitch = 0;
    this.distance = 3;
    this.dragging = false;
    this.last = { x: 0, y: 0 };

    this.setupEvents();
  }

  setupEvents() {
    this.canvas.addEventListener("mousedown", (e) => {
      if (e.ctrlKey && e.button === 0) {
        this.dragging = true;
        this.last.x = e.clientX;
        this.last.y = e.clientY;
      }
    });
    this.canvas.addEventListener("mouseup", () => this.dragging = false);
    this.canvas.addEventListener("mousemove", (e) => {
      if (!this.dragging) return;
      this.yaw += (e.clientX - this.last.x) * 0.005;
      this.pitch += (e.clientY - this.last.y) * 0.005;
      this.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.pitch));
      this.last.x = e.clientX;
      this.last.y = e.clientY;
    });
    this.canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      this.distance *= e.deltaY > 0 ? 1.1 : 0.9;
    });
  }

  getViewMatrix() {
    const view = mat4.create();
    const eye = [
      this.distance * Math.cos(this.pitch) * Math.sin(this.yaw),
      this.distance * Math.sin(this.pitch),
      this.distance * Math.cos(this.pitch) * Math.cos(this.yaw)
    ];
    mat4.lookAt(view, eye, [0, 0, 0], [0, 1, 0]);
    return view;
  }
}
