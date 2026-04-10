import os
import subprocess

base_path = r"e:\Crop_recommandation_R2T"

directories = [
    "ml-model",
    "backend/controllers",
    "backend/routes",
    "backend/models",
    "backend/services",
    "backend/middleware"
]

print("=== Running create_dirs.py ===")
for directory in directories:
    full_path = os.path.join(base_path, directory)
    os.makedirs(full_path, exist_ok=True)
    print(f"Created: {full_path}")

print("\nAll directories created successfully!")

print("\n=== Directory Contents ===")
for item in os.listdir(base_path):
    item_path = os.path.join(base_path, item)
    if os.path.isdir(item_path):
        print(f"[DIR]  {item}")
    else:
        print(f"[FILE] {item}")
