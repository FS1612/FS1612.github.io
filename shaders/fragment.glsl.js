export const fsSource = `
precision mediump float;
uniform float u_active;

void main() {
  // distanza dal centro del punto per il glow
  float dist = length(gl_PointCoord - vec2(0.5));
  float glow = 1.0 - smoothstep(0.0, 0.5, dist);

  // colori: inattivo (blu scuro) → attivo (ciano acceso) → superattivo (bianco)
  vec3 cold = vec3(0.0, 0.1, 0.1);
  vec3 warm = vec3(0.0, 1.0, 1.0);
  vec3 hot  = vec3(1.5, 1.5, 1.5);

  vec3 midColor = mix(cold, warm, min(u_active * 2.0, 1.0));
  vec3 finalColor = mix(midColor, hot, max(u_active - 0.5, 0.0));

  float intensity = mix(0.2, 2.2, u_active); // controllo glow
  gl_FragColor = vec4(finalColor * glow * intensity, 1.0);
}


`;
