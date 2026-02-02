#!/usr/bin/env python3
"""
Script para actualizar clases de Tailwind CSS con soporte dark mode
"""
import re
import sys
from pathlib import Path

# Patrones de reemplazo
REPLACEMENTS = [
    # Articles y cards
    (r'border-white/40 bg-white/95', r'border-white/40 dark:border-gray-700/40 bg-white/95 dark:bg-gray-800/95'),
    (r'bg-white/90', r'bg-white/90 dark:bg-gray-800/90'),
    (r'bg-white/80', r'bg-white/80 dark:bg-gray-800/80'),
    (r'bg-white/70', r'bg-white/70 dark:bg-gray-700/70'),
    
    # Textos
    (r'text-gray-900(?!["\'\w-])', r'text-gray-900 dark:text-white'),
    (r'text-gray-800(?!["\'\w-])', r'text-gray-800 dark:text-gray-200'),
    (r'text-gray-700(?!["\'\w-])', r'text-gray-700 dark:text-gray-300'),
    (r'text-gray-600(?!["\'\w-])', r'text-gray-600 dark:text-gray-400'),
    (r'text-gray-500(?!["\'\w-])', r'text-gray-500 dark:text-gray-400'),
    
    # Fondos
    (r'bg-gray-100(?!["\'\w-])', r'bg-gray-100 dark:bg-gray-700'),
    (r'bg-gray-50(?!["\'\w-])', r'bg-gray-50 dark:bg-gray-700'),
    
    # Bordes
    (r'border-gray-200(?!["\'\w-])', r'border-gray-200 dark:border-gray-600'),
    (r'border-gray-100(?!["\'\w-])', r'border-gray-100 dark:border-gray-700'),
]

def update_file(file_path):
    """Actualiza un archivo con los patrones de dark mode"""
    print(f"Procesando: {file_path}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    for pattern, replacement in REPLACEMENTS:
        content = re.sub(pattern, replacement, content)
    
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ Actualizado: {file_path}")
        return True
    else:
        print(f"⏭️  Sin cambios: {file_path}")
        return False

def main():
    """Función principal"""
    files_to_update = [
        'src/pages/DistributorDetail.tsx',
        'src/pages/Visits.tsx',
        'src/pages/Dashboard.tsx',
        'src/components/VisitForm.tsx',
        'src/components/SaleForm.tsx',
        'src/components/DistributorForm.tsx',
        'src/components/ui/Modal.tsx',
        'src/components/ui/Button.tsx',
    ]
    
    base_path = Path(__file__).parent
    updated = 0
    
    for file_rel_path in files_to_update:
        file_path = base_path / file_rel_path
        if file_path.exists():
            if update_file(file_path):
                updated += 1
        else:
            print(f"⚠️  No encontrado: {file_path}")
    
    print(f"\n✨ Archivos actualizados: {updated}/{len(files_to_update)}")

if __name__ == '__main__':
    main()
