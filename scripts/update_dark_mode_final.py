#!/usr/bin/env python3
"""
Script final para actualizar clases de Tailwind CSS con soporte dark mode
Incluye todos los patrones necesarios
"""
import re
import sys
from pathlib import Path

# Patrones de reemplazo más completos
REPLACEMENTS = [
    # Articles y sections con fondos translúcidos
    (r'border-white/40 bg-white/95(?! dark:)', r'border-white/40 dark:border-gray-700/40 bg-white/95 dark:bg-gray-800/95'),
    (r'border-white/30 bg-white/95(?! dark:)', r'border-white/30 dark:border-gray-700/30 bg-white/95 dark:bg-gray-800/95'),
    (r'border-white/40 bg-white/90(?! dark:)', r'border-white/40 dark:border-gray-700/40 bg-white/90 dark:bg-gray-800/90'),
    (r'border-white/40 bg-white/85(?! dark:)', r'border-white/40 dark:border-gray-700/40 bg-white/85 dark:bg-gray-800/85'),
    (r'border-white/40 bg-white/80(?! dark:)', r'border-white/40 dark:border-gray-700/40 bg-white/80 dark:bg-gray-800/80'),
    (r'border-white/40 bg-white/75(?! dark:)', r'border-white/40 dark:border-gray-700/40 bg-white/75 dark:bg-gray-800/75'),
    (r'bg-white/90(?! dark:)', r'bg-white/90 dark:bg-gray-800/90'),
    (r'bg-white/80(?! dark:)', r'bg-white/80 dark:bg-gray-800/80'),
    (r'bg-white/75(?! dark:)', r'bg-white/75 dark:bg-gray-800/75'),
    (r'bg-white/70(?! dark:)', r'bg-white/70 dark:bg-gray-700/70'),
    
    # Backgrounds sólidos (excepto cuando está en clases de variantes o ya tiene dark:)
    (r'(?<!["\'])bg-white(?![/\w-]| dark:)', r'bg-white dark:bg-gray-800'),
    
    # Textos
    (r'text-gray-900(?! dark:)(?!["\'\w-])', r'text-gray-900 dark:text-white'),
    (r'text-gray-800(?! dark:)(?!["\'\w-])', r'text-gray-800 dark:text-gray-200'),
    (r'text-gray-700(?! dark:)(?!["\'\w-])', r'text-gray-700 dark:text-gray-300'),
    (r'text-gray-600(?! dark:)(?!["\'\w-])', r'text-gray-600 dark:text-gray-400'),
    (r'text-gray-500(?! dark:)(?!["\'\w-])', r'text-gray-500 dark:text-gray-400'),
    
    # Fondos grises
    (r'bg-gray-100(?! dark:)(?!["\'\w-])', r'bg-gray-100 dark:bg-gray-700'),
    (r'bg-gray-50(?! dark:)(?!["\'\w-])', r'bg-gray-50 dark:bg-gray-700'),
    
    # Bordes
    (r'border-gray-300(?! dark:)(?!["\'\w-])', r'border-gray-300 dark:border-gray-600'),
    (r'border-gray-200(?! dark:)(?!["\'\w-])', r'border-gray-200 dark:border-gray-600'),
    (r'border-gray-100(?! dark:)(?!["\'\w-])', r'border-gray-100 dark:border-gray-700'),
    (r'border-gray-100/60(?! dark:)', r'border-gray-100/60 dark:border-gray-700/60'),
    
    # Hover states
    (r'hover:bg-white(?! dark:)(?![/\w-])', r'hover:bg-white dark:hover:bg-gray-700'),
]

def update_file(file_path):
    """Actualiza un archivo con los patrones de dark mode"""
    print(f"Procesando: {file_path}")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"❌ Error leyendo: {file_path} - {e}")
        return False
    
    original_content = content
    changes_count = 0
    
    for pattern, replacement in REPLACEMENTS:
        matches = re.findall(pattern, content)
        if matches:
            content = re.sub(pattern, replacement, content)
            changes_count += len(matches)
    
    if content != original_content:
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ Actualizado: {file_path} ({changes_count} cambios)")
            return True
        except Exception as e:
            print(f"❌ Error escribiendo: {file_path} - {e}")
            return False
    else:
        print(f"⏭️  Sin cambios: {file_path}")
        return False

def main():
    """Función principal"""
    files_to_update = [
        'src/pages/Settings.tsx',
        'src/pages/Profile.tsx',
        'src/pages/Candidates.tsx',
        'src/pages/Calls.tsx',
        'src/pages/ReportsWeekly.tsx',
        'src/components/ContactSelectorModal.tsx',
        'src/components/CandidateForm.tsx',
        'src/components/Table.tsx',
        'src/components/KanbanBoard.tsx',
    ]
    
    base_path = Path(__file__).parent
    updated = 0
    
    print(f"\n🚀 Iniciando actualización de {len(files_to_update)} archivos...\n")
    
    for file_rel_path in files_to_update:
        file_path = base_path / file_rel_path
        if file_path.exists():
            if update_file(file_path):
                updated += 1
        else:
            print(f"⚠️  No encontrado: {file_path}")
    
    print(f"\n✨ Resumen: {updated}/{len(files_to_update)} archivos actualizados\n")

if __name__ == '__main__':
    main()
