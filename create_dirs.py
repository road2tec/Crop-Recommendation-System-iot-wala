import os

base_path = r"e:\Crop_recommandation_R2T"

directories = [
    "ml-model",
    "backend/controllers",
    "backend/routes",
    "backend/models",
    "backend/services",
    "backend/middleware",
    "frontend/src/components",
    "frontend/src/pages",
    "frontend/src/services",
    "frontend/src/context",
    "frontend/public"
]

for directory in directories:
    full_path = os.path.join(base_path, directory)
    os.makedirs(full_path, exist_ok=True)
    print(f"Created: {full_path}")

print("\nAll directories created successfully!")
print("\nNow creating placeholder files...")

# Create placeholder files to ensure directories exist
placeholders = {
    "ml-model/.gitkeep": "",
    "backend/.gitkeep": "",
    "frontend/.gitkeep": ""
}

for file_path, content in placeholders.items():
    full_path = os.path.join(base_path, file_path)
    with open(full_path, 'w') as f:
        f.write(content)
    print(f"Created file: {full_path}")
