import sys
import json
import trimesh
import os

def export_points(glb_path, json_output, sample_rate=1):
    mesh = trimesh.load(glb_path, force='mesh')

    if not isinstance(mesh, trimesh.Trimesh):
        raise TypeError("Il file non contiene una mesh valida.")

    vertices = mesh.vertices[::sample_rate]
    points = vertices.tolist()

    with open(json_output, 'w') as f:
        json.dump(points, f, indent=2)

    print(f"✅ Salvato {len(points)} punti in {json_output}")

if __name__ == "__main__":
    # Sempre usa i file del progetto (ignora sys.argv[1:2])
    glb_path = os.path.join(os.path.dirname(__file__), "BRAIN.glb")
    json_output = os.path.join(os.path.dirname(__file__), "brain_points.json")

    # Sample rate da terminale, altrimenti 1
    
    rate = 3
    
    export_points(glb_path, json_output, sample_rate=rate)
