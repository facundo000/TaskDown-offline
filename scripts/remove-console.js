#!/usr/bin/env node
/**
 * Script to remove debug console statements from the project
 * Removes: console.log, console.warn, console.debug, console.info
 * Keeps: console.error (for production debugging)
 */

const fs = require('fs');
const path = require('path');

// Files to process
const files = [
    // Extension files
    'extension/popup/popup.js',
    'extension/background.js',
    'extension/content.js',
    'extension/content.sync.js',

    // Web app files
    'src/app/shared/components/toast-container/toast-container.ts',
    'src/app/shared/components/sync-button/sync-button.ts',
    'src/app/features/task/task-form/task-form.ts',
    'src/app/features/task/task-detail/task-detail.ts',
    'src/app/features/dashboard/dashboard.component.ts',
    'src/app/core/services/toast.service.ts',
    'src/app/core/services/local-storage.service.ts',
    'src/app/core/services/chrome-sync.service.ts'
];

// Regex patterns to match console statements (excluding console.error)
const patterns = [
    /^\s*console\.(log|warn|debug|info)\(.*?\);?\s*$/gm,  // Single line
    /^\s*console\.(log|warn|debug|info)\([^)]*$[\s\S]*?^\s*\);?\s*$/gm  // Multi-line
];

let totalRemoved = 0;

console.log('🧹 Removing debug console statements...\n');

files.forEach(filePath => {
    const fullPath = path.join(process.cwd(), filePath);

    if (!fs.existsSync(fullPath)) {
        console.log(`⚠️  Skipping ${filePath} (not found)`);
        return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    const originalLength = content.split('\n').length;

    // Remove console statements line by line to handle multi-line cases
    const lines = content.split('\n');
    const newLines = [];
    let inConsoleStatement = false;
    let buffer = '';
    let removed = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Check if this line starts a console statement
        if (trimmed.match(/^console\.(log|warn|debug|info)\(/)) {
            inConsoleStatement = true;
            buffer = line;

            // Check if it's a complete single-line statement
            if (trimmed.match(/^console\.(log|warn|debug|info)\(.*\);?$/)) {
                inConsoleStatement = false;
                buffer = '';
                removed++;
                continue;
            }
        } else if (inConsoleStatement) {
            // Continue collecting the multi-line console statement
            buffer += '\n' + line;

            // Check if this line closes the statement
            if (trimmed.match(/\);?$/)) {
                inConsoleStatement = false;
                buffer = '';
                removed++;
                continue;
            }
        } else {
            // Not a console statement, keep the line
            newLines.push(line);
        }
    }

    if (removed > 0) {
        fs.writeFileSync(fullPath, newLines.join('\n'), 'utf8');
        const newLength = newLines.length;
        console.log(`✅ ${filePath}: removed ${removed} console statements (${originalLength} → ${newLength} lines)`);
        totalRemoved += removed;
    } else {
        console.log(`✓  ${filePath}: no console statements found`);
    }
});

console.log(`\n🎉 Done! Removed ${totalRemoved} debug console statements total.`);
console.log('⚠️  Console.error statements were preserved for production debugging.');
