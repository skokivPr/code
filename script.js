let editor;

// --- Initialize theme ---
if (!document.documentElement.getAttribute('theme')) {
    document.documentElement.setAttribute('theme', 'light');
}

// --- Theme helper functions ---
function getCurrentTheme() {
    return document.documentElement.getAttribute('theme') || 'light';
}

function setTheme(theme) {
    document.documentElement.setAttribute('theme', theme);
    const isDarkMode = theme === 'dark';

    if (editor) {
        monaco.editor.setTheme(isDarkMode ? 'vs-dark' : 'vs-light');

        // Update line highlighting colors
        updateLineColors(isDarkMode);
    }

    const iconElement = document.getElementById('darkModeIcon');
    if (iconElement) {
        iconElement.className = isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
    }
}

function updateLineColors(isDarkMode) {
    if (!editor) return;

    // Force Monaco to update its styles by triggering a layout
    setTimeout(() => {
        editor.layout();

        // Update current line decoration
        const model = editor.getModel();
        if (model) {
            const position = editor.getPosition();
            if (position) {
                // Trigger a small change to refresh decorations
                editor.setPosition(position);
            }
        }
    }, 50);
}

function toggleTheme() {
    const currentTheme = getCurrentTheme();
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);

    // Update Monaco Editor theme with custom syntax colors if available
    if (editor && typeof applyCustomSyntaxTheme === 'function' && customSyntaxEnabled) {
        applyCustomSyntaxTheme();
    } else if (editor) {
        const monacoTheme = newTheme === 'dark' ? 'vs-dark' : 'vs-light';
        monaco.editor.setTheme(monacoTheme);
    }

    saveToLocalStorage();

    // Update footer status to show theme change
    updateFooterStatus(`Switched to ${newTheme} theme`, 'paint-brush');
    setTimeout(() => updateFooterStatus('Ready', 'circle'), 2000);
}

// Make theme functions globally available
window.getCurrentTheme = getCurrentTheme;
window.setTheme = setTheme;
window.toggleTheme = toggleTheme;

/* Theme API usage:
 * getCurrentTheme() - returns 'light' or 'dark'
 * setTheme('dark') - sets dark theme
 * setTheme('light') - sets light theme  
 * toggleTheme() - toggles between themes
 */

// --- Monaco Editor Initialization ---
function initializeEditor() {
    // Import code directly from app.js
    let importedCode = `<!DOCTYPE html>
<html>
<head>
    <title>Hello, World!</title>
    <style>
        body { font-family: sans-serif; text-align: center; padding-top: 50px; }
    </style>
</head>
<body>
    <h1>Hello, World!</h1>
    <p>This is a live preview.</p>
</body>
</html>`;

    try {
        // Use appHtmlContent from app.js
        if (typeof appHtmlContent !== 'undefined') {
            importedCode = appHtmlContent;
        } else {
            console.warn('appHtmlContent not found in app.js');
        }
    } catch (error) {
        console.error('Error importing from app.js:', error);
    }

    // Load saved theme before creating editor
    loadSavedTheme();

    editor = monaco.editor.create(document.getElementById('editor'), {
        value: importedCode,  // ← Tu jest zaimportowany kod z app.js
        language: 'html',
        theme: getCurrentTheme() === 'dark' ? 'vs-dark' : 'vs-light', // Will be overridden by custom theme
        automaticLayout: true,
        wordWrap: 'on',
        // Line highlighting options
        renderLineHighlight: 'all',
        lineNumbers: 'on',
        lineNumbersMinChars: 3,
        cursorBlinking: 'blink',
        highlightActiveIndentGuide: true,
        renderIndentGuides: true,
        // Additional visual improvements
        renderWhitespace: 'selection',
        occurrencesHighlight: true,
        selectionHighlight: true,
        foldingHighlight: true,
        matchBrackets: 'always',

        guides: {
            bracketPairs: true,
            indentation: true
        },
        // Enable color decorations
        colorDecorators: true,
        // Enable syntax validation and diagnostics
        validate: true,
        diagnostics: {
            noSemanticValidation: false,
            noSyntaxValidation: false
        },

        // Quick fixes and code actions
        lightbulb: {
            enabled: true
        },
        // Enhanced hover
        hover: {
            enabled: true,
            delay: 300,
            sticky: true
        },
        // Bracket and indentation guides
        guides: {
            bracketPairs: true,
            indentation: true
        },
        // Enhanced suggestions
        suggest: {
            enabled: true,
            showSnippets: true,
            showKeywords: true,
            showColors: true,
            showConstants: true,
            showClasses: true,
            showFields: true,
            showFunctions: true,
            showMethods: true,
            showProperties: true,
            showVariables: true,
            showWords: true
        },
        // Quick suggestions in all contexts
        quickSuggestions: {
            other: true,
            comments: true,
            strings: true
        },
        // Minimap for large files
        minimap: {
            enabled: true,
            side: 'right',
            showSlider: 'always',
            renderCharacters: true
        }
    });

    // Apply custom syntax theme if initialization is complete
    setTimeout(() => {
        if (typeof applyCustomSyntaxTheme === 'function') {
            applyCustomSyntaxTheme();
        }
    }, 100);

    // Add cursor position tracking
    editor.onDidChangeCursorPosition((e) => {
        const position = e.position;
        const totalLines = editor.getModel().getLineCount();
        updateFooterStatus(`Line ${position.lineNumber}, Column ${position.column} (${totalLines} lines total)`, 'map-marker-alt');

        // Clear status after 3 seconds
        setTimeout(() => {
            updateFooterStatus('Ready', 'circle');
        }, 3000);
    });

    // Add selection tracking
    editor.onDidChangeCursorSelection((e) => {
        const selection = e.selection;
        if (!selection.isEmpty()) {
            const selectedText = editor.getModel().getValueInRange(selection);
            const lines = selectedText.split('\n').length;
            const chars = selectedText.length;
            updateFooterStatus(`Selected: ${chars} chars, ${lines} lines`, 'highlighter');

            setTimeout(() => {
                updateFooterStatus('Ready', 'circle');
            }, 3000);
        }
    });

    // Auto-save with debouncing
    let saveTimeout;
    editor.onDidChangeModelContent(() => {
        // Auto-preview disabled - use Run button to update preview

        // Debounced save
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(saveToLocalStorage, 1000);
    });

    // Initialize additional features
    initializeRainbowCSV();
    initializeColorDecorations();
    initializeBracketGuides();
    initializeSyntaxTools();
    initializeCustomSyntaxColors();
}

if (typeof monaco !== 'undefined') {
    // Monaco is already loaded
    initializeEditor();
} else {
    // Load Monaco Editor loader dynamically
    const loaderScript = document.createElement('script');
    loaderScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.34.0/min/vs/loader.min.js';
    loaderScript.onload = function () {
        require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.34.0/min/vs' } });
        require(['vs/editor/editor.main'], initializeEditor);
    };
    loaderScript.onerror = function () {
        console.error('Failed to load Monaco Editor loader');
    };
    document.head.appendChild(loaderScript);
}

// Rainbow CSV functionality
let rainbowCSVEnabled = false;
let csvDecorations = [];

function initializeRainbowCSV() {
    // Check if current content has CSV-like structure
    if (editor && editor.getValue().includes(',')) {
        setTimeout(() => toggleRainbowCSV(), 1000);
    }
}

function toggleRainbowCSV() {
    if (!editor) return;

    rainbowCSVEnabled = !rainbowCSVEnabled;

    if (rainbowCSVEnabled) {
        applyRainbowCSV();
        updateFooterStatus('Rainbow CSV enabled', 'palette');
    } else {
        clearRainbowCSV();
        updateFooterStatus('Rainbow CSV disabled', 'palette');
    }

    setTimeout(() => updateFooterStatus('Ready', 'circle'), 2000);
}

function applyRainbowCSV() {
    if (!editor) return;

    const model = editor.getModel();
    const text = model.getValue();
    const lines = text.split('\n');

    const decorations = [];

    lines.forEach((line, lineIndex) => {
        if (line.includes(',')) {
            const columns = line.split(',');
            let columnStart = 1;

            columns.forEach((column, columnIndex) => {
                const colorIndex = columnIndex % 6;

                decorations.push({
                    range: new monaco.Range(
                        lineIndex + 1,
                        columnStart,
                        lineIndex + 1,
                        columnStart + column.length
                    ),
                    options: {
                        inlineClassName: `csv-column-${colorIndex}`
                    }
                });

                columnStart += column.length + 1; // +1 for comma
            });
        }
    });

    csvDecorations = editor.deltaDecorations(csvDecorations, decorations);
}

function clearRainbowCSV() {
    if (!editor) return;
    csvDecorations = editor.deltaDecorations(csvDecorations, []);
}

// Color picker decorations
let colorDecorations = [];

function initializeColorDecorations() {
    if (!editor) return;

    // Listen for content changes to update color decorations
    editor.onDidChangeModelContent(() => {
        setTimeout(updateColorDecorations, 150);
    });

    // Initial update
    setTimeout(updateColorDecorations, 500);
}

function updateColorDecorations() {
    if (!editor) return;

    const model = editor.getModel();
    const text = model.getValue();

    // Color patterns to match
    const colorPatterns = [
        /#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})\b/g,              // Hex colors
        /rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/g,       // RGB colors
        /rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([0-9.]+)\s*\)/g, // RGBA colors
    ];

    const decorations = [];
    const lines = text.split('\n');

    lines.forEach((line, lineIndex) => {
        colorPatterns.forEach(pattern => {
            let match;
            pattern.lastIndex = 0; // Reset regex

            while ((match = pattern.exec(line)) !== null) {
                const color = match[0];
                const startColumn = match.index + 1;
                const endColumn = startColumn + color.length;

                decorations.push({
                    range: new monaco.Range(lineIndex + 1, startColumn, lineIndex + 1, endColumn),
                    options: {
                        inlineClassName: 'color-decoration-text',
                        glyphMarginClassName: 'color-glyph',
                        overviewRuler: {
                            color: color,
                            position: monaco.editor.OverviewRulerLane.Right
                        }
                    }
                });
            }
        });
    });

    colorDecorations = editor.deltaDecorations(colorDecorations, decorations);
}

// Bracket guides toggle
let bracketGuidesEnabled = true;

function initializeBracketGuides() {
    // Bracket guides are enabled by default in Monaco config
    updateFooterStatus('Bracket guides enabled', 'code');
    setTimeout(() => updateFooterStatus('Ready', 'circle'), 2000);
}

function toggleBracketGuides() {
    if (!editor) return;

    bracketGuidesEnabled = !bracketGuidesEnabled;

    editor.updateOptions({
        renderIndentGuides: bracketGuidesEnabled,
        highlightActiveIndentGuide: bracketGuidesEnabled,
        guides: {
            bracketPairs: bracketGuidesEnabled,
            indentation: bracketGuidesEnabled
        }
    });

    if (bracketGuidesEnabled) {
        updateFooterStatus('Bracket guides enabled', 'code');
    } else {
        updateFooterStatus('Bracket guides disabled', 'code');
    }

    setTimeout(() => updateFooterStatus('Ready', 'circle'), 2000);
}

// Function to get current bracket guides state
function getBracketGuidesState() {
    if (!editor) return null;

    const options = editor.getOptions();
    return {
        bracketPairs: options.get(monaco.editor.EditorOption.guides)?.bracketPairs || false,
        indentation: options.get(monaco.editor.EditorOption.guides)?.indentation || false,
        renderIndentGuides: options.get(monaco.editor.EditorOption.renderIndentGuides),
        highlightActiveIndentGuide: options.get(monaco.editor.EditorOption.highlightActiveIndentGuide)
    };
}

// Function to toggle only bracket pairs guides
function toggleBracketPairsOnly() {
    if (!editor) return;

    const currentState = getBracketGuidesState();
    const newState = !currentState.bracketPairs;

    editor.updateOptions({
        guides: {
            bracketPairs: newState,
            indentation: currentState.indentation
        }
    });

    updateFooterStatus(`Bracket pairs guides ${newState ? 'enabled' : 'disabled'}`, 'code');
    setTimeout(() => updateFooterStatus('Ready', 'circle'), 2000);
}

// Function to toggle only indentation guides
function toggleIndentationOnly() {
    if (!editor) return;

    const currentState = getBracketGuidesState();
    const newState = !currentState.indentation;

    editor.updateOptions({
        guides: {
            bracketPairs: currentState.bracketPairs,
            indentation: newState
        },
        renderIndentGuides: newState,
        highlightActiveIndentGuide: newState
    });

    updateFooterStatus(`Indentation guides ${newState ? 'enabled' : 'disabled'}`, 'indent');
    setTimeout(() => updateFooterStatus('Ready', 'circle'), 2000);
}

// Function to set specific bracket guides configuration
function setBracketGuidesConfig(bracketPairs, indentation) {
    if (!editor) return;

    editor.updateOptions({
        guides: {
            bracketPairs: bracketPairs,
            indentation: indentation
        },
        renderIndentGuides: indentation,
        highlightActiveIndentGuide: indentation
    });

    updateFooterStatus(`Guides: Brackets(${bracketPairs}), Indent(${indentation})`, 'cogs');
    setTimeout(() => updateFooterStatus('Ready', 'circle'), 2000);
}

// Function to show current bracket guides status in console (for debugging)
function showBracketGuidesStatus() {
    if (!editor) {
        console.log('❌ Editor not initialized');
        return;
    }

    const state = getBracketGuidesState();
    console.log('🔧 Bracket Guides Status:');
    console.log('  📐 Bracket Pairs:', state.bracketPairs ? '✅ ON' : '❌ OFF');
    console.log('  📏 Indentation:', state.indentation ? '✅ ON' : '❌ OFF');
    console.log('  🎯 Render Indent Guides:', state.renderIndentGuides ? '✅ ON' : '❌ OFF');
    console.log('  ✨ Highlight Active:', state.highlightActiveIndentGuide ? '✅ ON' : '❌ OFF');

    updateFooterStatus('Guide status logged to console', 'info-circle');
    setTimeout(() => updateFooterStatus('Ready', 'circle'), 2000);

    return state;
}

// Custom Syntax Colors functionality
let customSyntaxEnabled = true;
let currentColorScheme = 'vibrant';

function initializeCustomSyntaxColors() {
    if (!monaco) return;

    // Define custom themes with rich syntax coloring
    defineCustomThemes();

    // Apply initial theme
    applyCustomSyntaxTheme();

    updateFooterStatus('Custom syntax colors initialized', 'palette');
    setTimeout(() => updateFooterStatus('Ready', 'circle'), 2000);
}

function defineCustomThemes() {
    // Vibrant Light Theme
    monaco.editor.defineTheme('vibrant-light', {
        base: 'vs',
        inherit: true,
        rules: [
            // Keywords (if, else, function, var, let, const, etc.)
            { token: 'keyword', foreground: '#d73a49', fontStyle: 'bold' },
            { token: 'keyword.control', foreground: '#d73a49', fontStyle: 'bold' },
            { token: 'keyword.operator', foreground: '#d73a49' },
            { token: 'keyword.other', foreground: '#6f42c1' },

            // Strings
            { token: 'string', foreground: '#032f62' },
            { token: 'string.quoted', foreground: '#032f62' },
            { token: 'string.regexp', foreground: '#22863a' },

            // Numbers
            { token: 'number', foreground: '#005cc5' },
            { token: 'number.hex', foreground: '#005cc5' },
            { token: 'number.float', foreground: '#005cc5' },

            // Comments
            { token: 'comment', foreground: '#6a737d', fontStyle: 'italic' },
            { token: 'comment.line', foreground: '#6a737d', fontStyle: 'italic' },
            { token: 'comment.block', foreground: '#6a737d', fontStyle: 'italic' },

            // Functions
            { token: 'entity.name.function', foreground: '#6f42c1', fontStyle: 'bold' },
            { token: 'support.function', foreground: '#e36209' },
            { token: 'entity.name.method', foreground: '#6f42c1' },

            // Variables
            { token: 'variable', foreground: '#24292e' },
            { token: 'variable.parameter', foreground: '#e36209' },
            { token: 'variable.other', foreground: '#005cc5' },

            // Types
            { token: 'entity.name.type', foreground: '#6f42c1', fontStyle: 'bold' },
            { token: 'support.type', foreground: '#6f42c1' },
            { token: 'storage.type', foreground: '#d73a49' },

            // HTML Tags
            { token: 'entity.name.tag', foreground: '#22863a', fontStyle: 'bold' },
            { token: 'entity.other.attribute-name', foreground: '#6f42c1' },

            // CSS Properties
            { token: 'support.type.property-name', foreground: '#005cc5' },
            { token: 'support.constant.property-value', foreground: '#032f62' },

            // Operators
            { token: 'keyword.operator.arithmetic', foreground: '#d73a49' },
            { token: 'keyword.operator.comparison', foreground: '#d73a49' },
            { token: 'keyword.operator.logical', foreground: '#d73a49' },

            // Punctuation
            { token: 'punctuation.definition.string', foreground: '#032f62' },
            { token: 'punctuation.separator', foreground: '#586069' },
            { token: 'punctuation.terminator', foreground: '#586069' },

            // Brackets
            { token: 'punctuation.section.brackets', foreground: '#24292e' },
            { token: 'punctuation.section.parens', foreground: '#24292e' },
            { token: 'punctuation.section.braces', foreground: '#24292e' }
        ],
        colors: {
            'editor.foreground': '#24292e',
            'editor.background': '#ffffff',
            'editor.selectionBackground': '#0366d625',
            'editor.lineHighlightBackground': '#f6f8fa',
            'editorCursor.foreground': '#044289',
            'editorWhitespace.foreground': '#d1d5da'
        }
    });

    // Vibrant Dark Theme
    monaco.editor.defineTheme('vibrant-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
            // Keywords
            { token: 'keyword', foreground: '#ff7b72', fontStyle: 'bold' },
            { token: 'keyword.control', foreground: '#ff7b72', fontStyle: 'bold' },
            { token: 'keyword.operator', foreground: '#ff7b72' },
            { token: 'keyword.other', foreground: '#d2a8ff' },

            // Strings
            { token: 'string', foreground: '#a5d6ff' },
            { token: 'string.quoted', foreground: '#a5d6ff' },
            { token: 'string.regexp', foreground: '#7ee787' },

            // Numbers
            { token: 'number', foreground: '#79c0ff' },
            { token: 'number.hex', foreground: '#79c0ff' },
            { token: 'number.float', foreground: '#79c0ff' },

            // Comments
            { token: 'comment', foreground: '#8b949e', fontStyle: 'italic' },
            { token: 'comment.line', foreground: '#8b949e', fontStyle: 'italic' },
            { token: 'comment.block', foreground: '#8b949e', fontStyle: 'italic' },

            // Functions
            { token: 'entity.name.function', foreground: '#d2a8ff', fontStyle: 'bold' },
            { token: 'support.function', foreground: '#ffa657' },
            { token: 'entity.name.method', foreground: '#d2a8ff' },

            // Variables
            { token: 'variable', foreground: '#f0f6fc' },
            { token: 'variable.parameter', foreground: '#ffa657' },
            { token: 'variable.other', foreground: '#79c0ff' },

            // Types
            { token: 'entity.name.type', foreground: '#d2a8ff', fontStyle: 'bold' },
            { token: 'support.type', foreground: '#d2a8ff' },
            { token: 'storage.type', foreground: '#ff7b72' },

            // HTML Tags
            { token: 'entity.name.tag', foreground: '#7ee787', fontStyle: 'bold' },
            { token: 'entity.other.attribute-name', foreground: '#d2a8ff' },

            // CSS Properties
            { token: 'support.type.property-name', foreground: '#79c0ff' },
            { token: 'support.constant.property-value', foreground: '#a5d6ff' },

            // Operators
            { token: 'keyword.operator.arithmetic', foreground: '#ff7b72' },
            { token: 'keyword.operator.comparison', foreground: '#ff7b72' },
            { token: 'keyword.operator.logical', foreground: '#ff7b72' },

            // Punctuation
            { token: 'punctuation.definition.string', foreground: '#a5d6ff' },
            { token: 'punctuation.separator', foreground: '#7d8590' },
            { token: 'punctuation.terminator', foreground: '#7d8590' },

            // Brackets
            { token: 'punctuation.section.brackets', foreground: '#f0f6fc' },
            { token: 'punctuation.section.parens', foreground: '#f0f6fc' },
            { token: 'punctuation.section.braces', foreground: '#f0f6fc' }
        ],
        colors: {
            'editor.foreground': '#f0f6fc',
            'editor.background': '#0d1117',
            'editor.selectionBackground': '#264f78',
            'editor.lineHighlightBackground': '#161b22',
            'editorCursor.foreground': '#79c0ff',
            'editorWhitespace.foreground': '#484f58'
        }
    });

    // Neon Theme
    monaco.editor.defineTheme('neon-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
            // Keywords - Bright Pink
            { token: 'keyword', foreground: '#ff0080', fontStyle: 'bold' },
            { token: 'keyword.control', foreground: '#ff0080', fontStyle: 'bold' },
            { token: 'keyword.operator', foreground: '#ff0080' },

            // Strings - Cyan
            { token: 'string', foreground: '#00ffff' },
            { token: 'string.quoted', foreground: '#00ffff' },

            // Numbers - Electric Blue
            { token: 'number', foreground: '#0080ff' },

            // Comments - Gray
            { token: 'comment', foreground: '#808080', fontStyle: 'italic' },

            // Functions - Yellow
            { token: 'entity.name.function', foreground: '#ffff00', fontStyle: 'bold' },
            { token: 'support.function', foreground: '#ffff00' },

            // Variables - Green
            { token: 'variable', foreground: '#00ff00' },
            { token: 'variable.parameter', foreground: '#80ff80' },

            // Types - Purple
            { token: 'entity.name.type', foreground: '#8000ff', fontStyle: 'bold' },
            { token: 'support.type', foreground: '#8000ff' },

            // HTML Tags - Orange
            { token: 'entity.name.tag', foreground: '#ff8000', fontStyle: 'bold' },
            { token: 'entity.other.attribute-name', foreground: '#ffff00' },

            // CSS Properties - Light Blue
            { token: 'support.type.property-name', foreground: '#80ffff' },
            { token: 'support.constant.property-value', foreground: '#00ffff' }
        ],
        colors: {
            'editor.foreground': '#ffffff',
            'editor.background': '#000000',
            'editor.selectionBackground': '#404040',
            'editor.lineHighlightBackground': '#202020',
            'editorCursor.foreground': '#ff0080',
            'editorWhitespace.foreground': '#404040'
        }
    });

    // Rainbow Theme
    monaco.editor.defineTheme('rainbow-light', {
        base: 'vs',
        inherit: true,
        rules: [
            // Each token type gets a different color from the rainbow
            { token: 'keyword', foreground: '#ff0000', fontStyle: 'bold' }, // Red
            { token: 'string', foreground: '#ff8000' }, // Orange
            { token: 'number', foreground: '#ffff00' }, // Yellow
            { token: 'comment', foreground: '#00ff00', fontStyle: 'italic' }, // Green
            { token: 'entity.name.function', foreground: '#0000ff', fontStyle: 'bold' }, // Blue
            { token: 'variable', foreground: '#8000ff' }, // Purple
            { token: 'entity.name.type', foreground: '#ff00ff', fontStyle: 'bold' }, // Magenta
            { token: 'entity.name.tag', foreground: '#00ffff', fontStyle: 'bold' }, // Cyan
            { token: 'support.function', foreground: '#ff0080' },
            { token: 'punctuation', foreground: '#404040' }
        ],
        colors: {
            'editor.foreground': '#000000',
            'editor.background': '#ffffff',
            'editor.selectionBackground': '#e0e0e0',
            'editor.lineHighlightBackground': '#f8f8f8'
        }
    });
}

function applyCustomSyntaxTheme() {
    if (!editor) return;

    const isDark = getCurrentTheme() === 'dark';
    let themeName;

    switch (currentColorScheme) {
        case 'vibrant':
            themeName = isDark ? 'vibrant-dark' : 'vibrant-light';
            break;
        case 'neon':
            themeName = 'neon-dark';
            break;
        case 'rainbow':
            themeName = 'rainbow-light';
            break;
        default:
            themeName = isDark ? 'vs-dark' : 'vs-light';
    }

    monaco.editor.setTheme(themeName);

    // Update body data-theme for CSS styling
    document.body.setAttribute('data-theme', currentColorScheme);

    updateFooterStatus(`Applied ${currentColorScheme} color scheme`, 'palette');
    setTimeout(() => updateFooterStatus('Ready', 'circle'), 2000);
}

function toggleSyntaxColors() {
    customSyntaxEnabled = !customSyntaxEnabled;

    if (customSyntaxEnabled) {
        applyCustomSyntaxTheme();
        updateFooterStatus('Custom syntax colors enabled', 'palette');
    } else {
        const isDark = getCurrentTheme() === 'dark';
        monaco.editor.setTheme(isDark ? 'vs-dark' : 'vs-light');
        updateFooterStatus('Default syntax colors restored', 'palette');
    }

    setTimeout(() => updateFooterStatus('Ready', 'circle'), 2000);
}

function cycleSyntaxColorScheme() {
    const schemes = ['vibrant', 'neon', 'rainbow', 'default'];
    const currentIndex = schemes.indexOf(currentColorScheme);
    const nextIndex = (currentIndex + 1) % schemes.length;

    currentColorScheme = schemes[nextIndex];

    if (customSyntaxEnabled && currentColorScheme !== 'default') {
        applyCustomSyntaxTheme();
    } else if (currentColorScheme === 'default') {
        const isDark = getCurrentTheme() === 'dark';
        monaco.editor.setTheme(isDark ? 'vs-dark' : 'vs-light');
    }

    updateFooterStatus(`Switched to ${currentColorScheme} colors`, 'palette');
    setTimeout(() => updateFooterStatus('Ready', 'circle'), 2000);
}

function setSyntaxColorScheme(scheme) {
    if (['vibrant', 'neon', 'rainbow', 'default'].includes(scheme)) {
        currentColorScheme = scheme;

        if (scheme === 'default') {
            const isDark = getCurrentTheme() === 'dark';
            monaco.editor.setTheme(isDark ? 'vs-dark' : 'vs-light');
            document.body.setAttribute('data-theme', 'default');
        } else {
            customSyntaxEnabled = true;
            applyCustomSyntaxTheme();
        }

        updateFooterStatus(`Set ${scheme} color scheme`, 'palette');
        setTimeout(() => updateFooterStatus('Ready', 'circle'), 2000);
    }
}

function showSyntaxColorStatus() {
    console.log('🎨 Syntax Color Status:');
    console.log('  🎯 Current Scheme:', currentColorScheme);
    console.log('  ✨ Custom Colors:', customSyntaxEnabled ? '✅ ON' : '❌ OFF');
    console.log('  🌙 Theme Mode:', getCurrentTheme());
    console.log('  🎭 Body Data-Theme:', document.body.getAttribute('data-theme'));

    const currentTheme = monaco.editor.getOptions().get(monaco.editor.EditorOption.theme);
    console.log('  🎪 Monaco Theme:', currentTheme);

    updateFooterStatus('Color status logged to console', 'info-circle');
    setTimeout(() => updateFooterStatus('Ready', 'circle'), 2000);

    return {
        scheme: currentColorScheme,
        enabled: customSyntaxEnabled,
        mode: getCurrentTheme(),
        bodyTheme: document.body.getAttribute('data-theme'),
        monacoTheme: currentTheme
    };
}

// Syntax Tools functionality
let syntaxValidationEnabled = true;
let syntaxMarkers = [];
let problemsPanel = null;

function initializeSyntaxTools() {
    if (!editor) return;

    // Configure language services
    configureLangaugeServices();

    // Listen for model changes to validate syntax
    editor.onDidChangeModelContent(() => {
        if (syntaxValidationEnabled) {
            setTimeout(validateSyntax, 300);
        }
    });

    // Listen for marker changes
    monaco.editor.onDidChangeMarkers(() => {
        updateProblemsCount();
    });

    // Initial validation
    setTimeout(validateSyntax, 500);

    updateFooterStatus('Syntax tools initialized', 'tools');
    setTimeout(() => updateFooterStatus('Ready', 'circle'), 2000);
}

function configureLangaugeServices() {
    const language = document.getElementById('language-selector').value;

    // Configure HTML
    if (language === 'html') {
        monaco.languages.html.htmlDefaults.setOptions({
            validate: true,
            lint: {
                compatibleVendorPrefixes: 'ignore',
                vendorPrefix: 'warning',
                duplicateProperties: 'warning',
                emptyDeclaration: 'warning',
                importStatement: 'ignore',
                boxModel: 'ignore',
                universalSelector: 'ignore',
                zeroUnits: 'ignore',
                fontFaceProperties: 'warning',
                hexColorLength: 'error',
                argumentsInColorFunction: 'error',
                unknownProperties: 'warning',
                ieHack: 'ignore',
                unknownVendorSpecificProperties: 'ignore',
                propertyIgnoredDueToDisplay: 'warning',
                important: 'ignore',
                float: 'ignore',
                idSelector: 'ignore'
            }
        });
    }

    // Configure CSS
    if (language === 'css') {
        monaco.languages.css.cssDefaults.setOptions({
            validate: true,
            lint: {
                compatibleVendorPrefixes: 'ignore',
                vendorPrefix: 'warning',
                duplicateProperties: 'warning',
                emptyDeclaration: 'warning',
                importStatement: 'ignore',
                boxModel: 'ignore',
                universalSelector: 'ignore',
                zeroUnits: 'ignore',
                fontFaceProperties: 'warning',
                hexColorLength: 'error',
                argumentsInColorFunction: 'error',
                unknownProperties: 'warning',
                ieHack: 'ignore',
                unknownVendorSpecificProperties: 'ignore',
                propertyIgnoredDueToDisplay: 'warning',
                important: 'ignore',
                float: 'ignore',
                idSelector: 'ignore'
            }
        });
    }

    // Configure JavaScript/TypeScript
    if (language === 'javascript' || language === 'typescript') {
        monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
            noSemanticValidation: false,
            noSyntaxValidation: false,
            noSuggestionDiagnostics: false
        });

        monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
            target: monaco.languages.typescript.ScriptTarget.ES2020,
            allowNonTsExtensions: true,
            moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
            module: monaco.languages.typescript.ModuleKind.CommonJS,
            noEmit: true,
            esModuleInterop: true,
            jsx: monaco.languages.typescript.JsxEmit.React,
            reactNamespace: 'React',
            allowJs: true,
            typeRoots: ['node_modules/@types']
        });
    }
}

function validateSyntax() {
    if (!editor || !syntaxValidationEnabled) return;

    const model = editor.getModel();
    const language = model.getLanguageId();
    const code = model.getValue();

    // Custom validation for different languages
    switch (language) {
        case 'html':
            validateHTML(model, code);
            break;
        case 'css':
            validateCSS(model, code);
            break;
        case 'javascript':
            validateJavaScript(model, code);
            break;
        case 'json':
            validateJSON(model, code);
            break;
        default:
            // Basic validation for other languages
            validateBasicSyntax(model, code);
    }
}

function validateHTML(model, code) {
    const markers = [];
    const lines = code.split('\n');

    // Check for unclosed tags
    const tagStack = [];
    const selfClosingTags = ['img', 'br', 'hr', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr'];

    lines.forEach((line, lineIndex) => {
        // Find opening tags
        const openTags = line.match(/<(\w+)(?:\s[^>]*)?(?<!\/)>/g);
        if (openTags) {
            openTags.forEach(tag => {
                const tagName = tag.match(/<(\w+)/)[1].toLowerCase();
                if (!selfClosingTags.includes(tagName)) {
                    tagStack.push({ name: tagName, line: lineIndex + 1, col: line.indexOf(tag) + 1 });
                }
            });
        }

        // Find closing tags
        const closeTags = line.match(/<\/(\w+)>/g);
        if (closeTags) {
            closeTags.forEach(tag => {
                const tagName = tag.match(/<\/(\w+)>/)[1].toLowerCase();
                const lastOpen = tagStack.pop();

                if (!lastOpen) {
                    markers.push({
                        severity: monaco.MarkerSeverity.Error,
                        startLineNumber: lineIndex + 1,
                        startColumn: line.indexOf(tag) + 1,
                        endLineNumber: lineIndex + 1,
                        endColumn: line.indexOf(tag) + tag.length + 1,
                        message: `Unexpected closing tag </${tagName}>`,
                        source: 'HTML Validator'
                    });
                } else if (lastOpen.name !== tagName) {
                    markers.push({
                        severity: monaco.MarkerSeverity.Error,
                        startLineNumber: lineIndex + 1,
                        startColumn: line.indexOf(tag) + 1,
                        endLineNumber: lineIndex + 1,
                        endColumn: line.indexOf(tag) + tag.length + 1,
                        message: `Expected closing tag </${lastOpen.name}> but found </${tagName}>`,
                        source: 'HTML Validator'
                    });
                }
            });
        }

        // Check for missing alt attributes on img tags
        if (line.includes('<img') && !line.includes('alt=')) {
            const imgIndex = line.indexOf('<img');
            markers.push({
                severity: monaco.MarkerSeverity.Warning,
                startLineNumber: lineIndex + 1,
                startColumn: imgIndex + 1,
                endLineNumber: lineIndex + 1,
                endColumn: imgIndex + 5,
                message: 'Missing alt attribute for accessibility',
                source: 'HTML Validator'
            });
        }
    });

    // Check for unclosed tags
    tagStack.forEach(tag => {
        markers.push({
            severity: monaco.MarkerSeverity.Error,
            startLineNumber: tag.line,
            startColumn: tag.col,
            endLineNumber: tag.line,
            endColumn: tag.col + tag.name.length + 2,
            message: `Unclosed tag <${tag.name}>`,
            source: 'HTML Validator'
        });
    });

    monaco.editor.setModelMarkers(model, 'html-validator', markers);
}

function validateCSS(model, code) {
    const markers = [];
    const lines = code.split('\n');

    lines.forEach((line, lineIndex) => {
        // Check for missing semicolons
        if (line.includes(':') && !line.includes(';') && !line.includes('{') && !line.includes('}') && line.trim() !== '') {
            const colonIndex = line.indexOf(':');
            if (colonIndex > 0) {
                markers.push({
                    severity: monaco.MarkerSeverity.Warning,
                    startLineNumber: lineIndex + 1,
                    startColumn: line.length,
                    endLineNumber: lineIndex + 1,
                    endColumn: line.length + 1,
                    message: 'Missing semicolon',
                    source: 'CSS Validator'
                });
            }
        }

        // Check for unknown properties (basic check)
        const propertyMatch = line.match(/^\s*([a-zA-Z-]+)\s*:/);
        if (propertyMatch) {
            const property = propertyMatch[1].toLowerCase();
            const commonProperties = ['color', 'background', 'font-size', 'margin', 'padding', 'border', 'width', 'height', 'display', 'position', 'top', 'left', 'right', 'bottom', 'z-index', 'opacity', 'transform', 'transition'];

            if (!commonProperties.some(prop => property.includes(prop)) && !property.startsWith('-')) {
                markers.push({
                    severity: monaco.MarkerSeverity.Info,
                    startLineNumber: lineIndex + 1,
                    startColumn: line.indexOf(property) + 1,
                    endLineNumber: lineIndex + 1,
                    endColumn: line.indexOf(property) + property.length + 1,
                    message: `Unknown CSS property '${property}'`,
                    source: 'CSS Validator'
                });
            }
        }
    });

    monaco.editor.setModelMarkers(model, 'css-validator', markers);
}

function validateJavaScript(model, code) {
    const markers = [];
    const lines = code.split('\n');

    lines.forEach((line, lineIndex) => {
        // Check for console.log (warning)
        if (line.includes('console.log')) {
            const consoleIndex = line.indexOf('console.log');
            markers.push({
                severity: monaco.MarkerSeverity.Info,
                startLineNumber: lineIndex + 1,
                startColumn: consoleIndex + 1,
                endLineNumber: lineIndex + 1,
                endColumn: consoleIndex + 11,
                message: 'Consider removing console.log in production',
                source: 'JS Linter'
            });
        }

        // Check for missing var/let/const
        const varMatch = line.match(/^\s*(\w+)\s*=/);
        if (varMatch && !line.includes('var ') && !line.includes('let ') && !line.includes('const ')) {
            const varName = varMatch[1];
            if (!['window', 'document', 'this'].includes(varName)) {
                markers.push({
                    severity: monaco.MarkerSeverity.Warning,
                    startLineNumber: lineIndex + 1,
                    startColumn: line.indexOf(varName) + 1,
                    endLineNumber: lineIndex + 1,
                    endColumn: line.indexOf(varName) + varName.length + 1,
                    message: `Variable '${varName}' should be declared with let, const, or var`,
                    source: 'JS Linter'
                });
            }
        }
    });

    monaco.editor.setModelMarkers(model, 'js-linter', markers);
}

function validateJSON(model, code) {
    const markers = [];

    try {
        JSON.parse(code);
    } catch (error) {
        const match = error.message.match(/position (\d+)/);
        if (match) {
            const position = parseInt(match[1]);
            const lines = code.substring(0, position).split('\n');
            const lineNumber = lines.length;
            const column = lines[lines.length - 1].length + 1;

            markers.push({
                severity: monaco.MarkerSeverity.Error,
                startLineNumber: lineNumber,
                startColumn: column,
                endLineNumber: lineNumber,
                endColumn: column + 1,
                message: error.message,
                source: 'JSON Validator'
            });
        }
    }

    monaco.editor.setModelMarkers(model, 'json-validator', markers);
}

function validateBasicSyntax(model, code) {
    const markers = [];
    const lines = code.split('\n');

    // Basic bracket matching
    const brackets = { '(': ')', '[': ']', '{': '}' };
    const stack = [];

    lines.forEach((line, lineIndex) => {
        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (brackets[char]) {
                stack.push({ char: char, line: lineIndex + 1, col: i + 1 });
            } else if (Object.values(brackets).includes(char)) {
                const last = stack.pop();
                if (!last || brackets[last.char] !== char) {
                    markers.push({
                        severity: monaco.MarkerSeverity.Error,
                        startLineNumber: lineIndex + 1,
                        startColumn: i + 1,
                        endLineNumber: lineIndex + 1,
                        endColumn: i + 2,
                        message: `Unmatched closing bracket '${char}'`,
                        source: 'Syntax Validator'
                    });
                }
            }
        }
    });

    // Check for unmatched opening brackets
    stack.forEach(bracket => {
        markers.push({
            severity: monaco.MarkerSeverity.Error,
            startLineNumber: bracket.line,
            startColumn: bracket.col,
            endLineNumber: bracket.line,
            endColumn: bracket.col + 1,
            message: `Unmatched opening bracket '${bracket.char}'`,
            source: 'Syntax Validator'
        });
    });

    monaco.editor.setModelMarkers(model, 'syntax-validator', markers);
}

function toggleSyntaxValidation() {
    syntaxValidationEnabled = !syntaxValidationEnabled;

    if (syntaxValidationEnabled) {
        validateSyntax();
        updateFooterStatus('Syntax validation enabled', 'check-circle');
    } else {
        // Clear all markers
        const model = editor.getModel();
        monaco.editor.setModelMarkers(model, 'html-validator', []);
        monaco.editor.setModelMarkers(model, 'css-validator', []);
        monaco.editor.setModelMarkers(model, 'js-linter', []);
        monaco.editor.setModelMarkers(model, 'json-validator', []);
        monaco.editor.setModelMarkers(model, 'syntax-validator', []);

        updateFooterStatus('Syntax validation disabled', 'times-circle');
    }

    setTimeout(() => updateFooterStatus('Ready', 'circle'), 2000);
}

function updateProblemsCount() {
    if (!editor) return;

    const model = editor.getModel();
    const markers = monaco.editor.getModelMarkers({ resource: model.uri });

    const errors = markers.filter(m => m.severity === monaco.MarkerSeverity.Error).length;
    const warnings = markers.filter(m => m.severity === monaco.MarkerSeverity.Warning).length;
    const infos = markers.filter(m => m.severity === monaco.MarkerSeverity.Info).length;

    if (errors + warnings + infos > 0) {
        let message = '';
        if (errors > 0) message += `${errors} errors `;
        if (warnings > 0) message += `${warnings} warnings `;
        if (infos > 0) message += `${infos} infos`;

        updateFooterStatus(`Problems: ${message.trim()}`, 'exclamation-triangle');
    }
}

function showProblemsPanel() {
    if (!editor) return;

    const model = editor.getModel();
    const markers = monaco.editor.getModelMarkers({ resource: model.uri });

    if (markers.length === 0) {
        updateFooterStatus('No problems found', 'check-circle');
        setTimeout(() => updateFooterStatus('Ready', 'circle'), 2000);
        return;
    }

    // Create problems list
    let problemsHTML = '<h3>Problems (' + markers.length + ')</h3><ul class="problems-list">';

    markers.forEach(marker => {
        const severityIcon = marker.severity === monaco.MarkerSeverity.Error ? '❌' :
            marker.severity === monaco.MarkerSeverity.Warning ? '⚠️' : 'ℹ️';

        problemsHTML += `
            <li class="problem-item" onclick="goToLine(${marker.startLineNumber})">
                <span class="problem-icon">${severityIcon}</span>
                <span class="problem-message">${marker.message}</span>
                <span class="problem-location">Line ${marker.startLineNumber}, Column ${marker.startColumn}</span>
                <span class="problem-source">[${marker.source || 'Unknown'}]</span>
            </li>
        `;
    });

    problemsHTML += '</ul>';

    // Show in a SweetAlert modal
    Swal.fire({
        title: 'Syntax Problems',
        html: problemsHTML,
        width: '80%',
        showCloseButton: true,
        showConfirmButton: false,
        customClass: {
            popup: 'problems-popup'
        }
    });
}

function goToLine(lineNumber) {
    if (!editor) return;

    editor.setPosition({ lineNumber: lineNumber, column: 1 });
    editor.revealLineInCenter(lineNumber);
    editor.focus();

    // Close the problems panel
    Swal.close();
}

// Global functions
window.toggleRainbowCSV = toggleRainbowCSV;
window.toggleBracketGuides = toggleBracketGuides;
window.toggleBracketPairsOnly = toggleBracketPairsOnly;
window.toggleIndentationOnly = toggleIndentationOnly;
window.setBracketGuidesConfig = setBracketGuidesConfig;
window.getBracketGuidesState = getBracketGuidesState;
window.showBracketGuidesStatus = showBracketGuidesStatus;
window.toggleSyntaxColors = toggleSyntaxColors;
window.cycleSyntaxColorScheme = cycleSyntaxColorScheme;
window.setSyntaxColorScheme = setSyntaxColorScheme;
window.showSyntaxColorStatus = showSyntaxColorStatus;
window.toggleSyntaxValidation = toggleSyntaxValidation;
window.showProblemsPanel = showProblemsPanel;
window.goToLine = goToLine;

// --- Local Storage Functions ---
function loadSavedTheme() {
    const savedState = localStorage.getItem('monaco_editor_state');
    if (savedState) {
        try {
            const state = JSON.parse(savedState);
            if (state.isDarkMode !== undefined) {
                const themeName = state.isDarkMode ? 'dark' : 'light';
                setTheme(themeName);
                console.log('Saved theme loaded:', themeName);

                // Update footer status after a brief delay to show the theme was loaded
                setTimeout(() => {
                    updateFooterStatus(`${themeName.charAt(0).toUpperCase() + themeName.slice(1)} theme restored`, 'paint-brush');
                    setTimeout(() => updateFooterStatus('Ready', 'circle'), 2000);
                }, 500);
            }
        } catch (error) {
            console.error('Error loading saved theme:', error);
            // Fallback to light theme
            setTheme('light');
        }
    } else {
        // No saved state, use light theme as default  
        setTheme('light');
        console.log('No saved theme found, using light theme');

        // Show default theme message
        setTimeout(() => {
            updateFooterStatus('Light theme (default)', 'paint-brush');
            setTimeout(() => updateFooterStatus('Ready', 'circle'), 2000);
        }, 500);
    }
}

function saveToLocalStorage() {
    const state = {
        code: editor.getValue(),
        language: document.getElementById('language-selector').value,
        isDarkMode: getCurrentTheme() === 'dark',
        timestamp: new Date().toISOString()
    };
    localStorage.setItem('monaco_editor_state', JSON.stringify(state));
    console.log('State saved to localStorage');
}

function clearLocalStorage() {
    showConfirmationModal(
        'Clear Local Storage',
        'Are you sure you want to clear all saved data from local storage? This action cannot be undone.',
        'Yes, clear storage',
        'Cancel',
        'delete.png'
    ).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem('monaco_editor_state');
            console.log('Local storage cleared');
            updateStatus('Local storage cleared successfully', 'success');

            // Show success notification
            Swal.fire({
                title: 'Cleared!',
                text: 'Your local storage has been cleared.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false,
                customClass: {
                    popup: 'swal-success-popup',
                    title: 'swal-success-title',
                    htmlContainer: 'swal-success-text'
                }
            });
        }
    });
}

function loadFromLocalStorage() {
    const savedState = localStorage.getItem('monaco_editor_state');
    if (savedState) {
        try {
            const state = JSON.parse(savedState);
            const currentCode = editor.getValue();

            // If there's current code and this is a manual load, show confirmation
            if (currentCode.trim() !== '' && event && event.type === 'click') {
                showConfirmationModal(
                    'Load from Local Storage',
                    'Are you sure you want to load the saved state? All unsaved changes will be lost.',
                    'Yes, load saved state',
                    'Cancel',
                    'file.png'
                ).then((result) => {
                    if (result.isConfirmed) {
                        loadStateFromStorage(state);
                    }
                });
            } else {
                // Auto-load or no current code
                loadStateFromStorage(state);
            }
        } catch (error) {
            console.error('Error loading state from localStorage:', error);
            if (event && event.type === 'click') {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to load state from localStorage',
                });
            }
        }
    } else if (event && event.type === 'click') {
        Swal.fire({
            icon: 'info',
            title: 'No saved state',
            text: 'No saved state found in localStorage',
        });
    }
}

function loadStateFromStorage(state) {
    // Restore code
    if (state.code) {
        editor.setValue(state.code);
    }

    // Restore theme
    setTheme(state.isDarkMode ? 'dark' : 'light');

    console.log('State loaded from localStorage');

    // Show notification when manually loaded
    if (event && event.type === 'click') {
        Swal.fire({
            icon: 'success',
            title: 'Loaded!',
            text: `State loaded from ${new Date(state.timestamp).toLocaleString()}`,
            timer: 2000,
            showConfirmButton: false
        });
        updateFooterStatus('State loaded', 'download');
        setTimeout(() => updateFooterStatus('Ready', 'circle'), 2000);
    }
}

// --- Core Functions ---
function updatePreview() {
    const code = editor.getValue();
    const previewFrame = document.getElementById('preview');

    try {
        // Completely reload the iframe to avoid variable redeclaration errors
        previewFrame.src = 'about:blank';

        // Wait a moment for the iframe to reload, then set the content
        setTimeout(() => {
            const preview = previewFrame.contentDocument || previewFrame.contentWindow.document;
            preview.open();
            preview.write(code);
            preview.close();
        }, 10);
    } catch (error) {
        console.error('Error updating preview:', error);

        // Fallback: try direct write
        try {
            const preview = previewFrame.contentDocument || previewFrame.contentWindow.document;
            preview.open();
            preview.write(code);
            preview.close();
        } catch (fallbackError) {
            console.error('Fallback preview update failed:', fallbackError);
            updateFooterStatus('Preview update failed', 'exclamation-triangle');
        }
    }
}

function stopPreview() {
    const previewFrame = document.getElementById('preview');

    try {
        // Stop loading by setting src to blank
        previewFrame.src = 'about:blank';

        // Clear any pending operations
        const preview = previewFrame.contentDocument || previewFrame.contentWindow.document;
        if (preview) {
            preview.open();
            preview.close();
        }

        updateFooterStatus('Preview stopped', 'stop');
        setTimeout(() => updateFooterStatus('Ready', 'circle'), 2000);

    } catch (error) {
        console.error('Error stopping preview:', error);
        updateFooterStatus('Stop failed', 'exclamation-triangle');
    }
}

function changeLanguage(language) {
    const currentLanguage = editor.getModel().getLanguageId();
    const currentCode = editor.getValue();

    // If switching to different language and has code, show confirmation
    if (currentLanguage !== language && currentCode.trim() !== '') {
        showConfirmationModal(
            'Change Language',
            `Are you sure you want to change the language from ${currentLanguage.toUpperCase()} to ${language.toUpperCase()}? The code will remain but syntax highlighting will change.`,
            'Yes, change language',
            'Cancel',
            'delete.png'
        ).then((result) => {
            if (result.isConfirmed) {
                monaco.editor.setModelLanguage(editor.getModel(), language);

                // Reconfigure language services for new language
                configureLangaugeServices();

                // Re-validate syntax for new language
                setTimeout(validateSyntax, 300);

                saveToLocalStorage();
                updateFooterStatus(`Language changed to ${language.toUpperCase()}`, 'code');
                setTimeout(() => updateFooterStatus('Ready', 'circle'), 2000);
            } else {
                // Reset select to current language
                document.getElementById('language-selector').value = currentLanguage;
            }
        });
    } else {
        // Same language or no code, just change
        monaco.editor.setModelLanguage(editor.getModel(), language);

        // Reconfigure language services for new language
        configureLangaugeServices();

        // Re-validate syntax for new language
        setTimeout(validateSyntax, 300);

        saveToLocalStorage();
        updateFooterStatus(`Language set to ${language.toUpperCase()}`, 'code');
        setTimeout(() => updateFooterStatus('Ready', 'circle'), 2000);
    }
}

async function formatCode() {
    const code = editor.getValue();
    const language = document.getElementById('language-selector').value;
    let parser;

    // Check if code is empty
    if (code.trim() === '') {
        Swal.fire({
            icon: 'info',
            title: 'Nothing to format',
            text: 'Please write some code first.',
            timer: 2000,
            showConfirmButton: false
        });
        return;
    }

    switch (language) {
        case 'html':
            parser = 'html';
            break;
        case 'css':
            parser = 'css';
            break;
        case 'javascript':
            parser = 'babel';
            break;
        default:
            Swal.fire({
                icon: 'warning',
                title: 'Formatting not supported',
                text: `Formatting is not supported for ${language.toUpperCase()} yet. Only HTML, CSS, and JavaScript are supported.`,
                timer: 3000,
                showConfirmButton: false
            });
            return;
    }

    // Show confirmation for large code blocks
    if (code.length > 1000) {
        showConfirmationModal(
            'Format Code',
            'You are about to format a large code block. This action cannot be undone. Are you sure you want to continue?',
            'Yes, format code',
            'Cancel',
            'format.png'
        ).then(async (result) => {
            if (result.isConfirmed) {
                await performFormatting(code, parser);
            }
        });
    } else {
        await performFormatting(code, parser);
    }
}

async function performFormatting(code, parser) {
    try {
        const formattedCode = await prettier.format(code, {
            parser: parser,
            plugins: prettierPlugins,
        });
        editor.setValue(formattedCode);

        Swal.fire({
            icon: 'success',
            title: 'Code formatted!',
            text: 'Your code has been successfully formatted.',
            timer: 2000,
            showConfirmButton: false
        });
    } catch (error) {
        console.error("Formatting error:", error);
        Swal.fire({
            icon: 'error',
            title: 'Formatting Error',
            text: 'Could not format the code. Please check for syntax errors.',
            footer: 'Make sure your code is valid before formatting.'
        });
    }
}

function toggleComment() {
    const selection = editor.getSelection();
    const selectedText = editor.getModel().getValueInRange(selection);

    if (selectedText.trim() === '') {
        // No selection, comment current line
        editor.trigger('source', 'editor.action.commentLine');
        updateFooterStatus('Line comment toggled', 'comment');
    } else {
        // Selection exists, comment selected lines
        editor.trigger('source', 'editor.action.commentLine');
        updateFooterStatus('Selection comment toggled', 'comment');
    }

    setTimeout(() => updateFooterStatus('Ready', 'circle'), 2000);
}

function copyCode() {
    const code = editor.getValue();

    if (code.trim() === '') {
        Swal.fire({
            icon: 'info',
            title: 'Nothing to copy',
            text: 'Please write some code first.',
            timer: 2000,
            showConfirmButton: false
        });
        return;
    }

    navigator.clipboard.writeText(code).then(() => {
        const lineCount = code.split('\n').length;
        const charCount = code.length;

        Swal.fire({
            icon: 'success',
            title: 'Copied!',
            text: `${lineCount} lines (${charCount} characters) copied to clipboard.`,
            timer: 2000,
            showConfirmButton: false
        });

        updateFooterStatus('Code copied to clipboard', 'clipboard');
        setTimeout(() => updateFooterStatus('Ready', 'circle'), 2000);
    }).catch(() => {
        Swal.fire({
            icon: 'error',
            title: 'Copy failed',
            text: 'Could not copy to clipboard. Please try again.',
            timer: 2000,
            showConfirmButton: false
        });
    });
}

// --- Confirmation Modal ---
function showConfirmationModal(title, text, confirmText, cancelText = 'Cancel', backgroundImage = 'file.png') {
    // Try multiple CDN sources for better reliability
    const imageUrls = [
        `https://cdn.jsdelivr.net/gh/skokivPr/code@skokivPr-patch-3/tlo/${backgroundImage}`,
        `https://raw.githack.com/skokivPr/code/skokivPr-patch-3/tlo/${backgroundImage}`,
        `https://rawcdn.githack.com/skokivPr/code/skokivPr-patch-3/tlo/${backgroundImage}`
    ];
    const primaryImageUrl = imageUrls[0];

    return Swal.fire({
        title: title,
        text: text,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#fd810d',
        cancelButtonColor: '#495057',
        confirmButtonText: confirmText,
        cancelButtonText: cancelText,
        reverseButtons: true,
        backdrop: `
            rgba(0,0,0,0.7)
            url("${primaryImageUrl}")
            center center
            no-repeat
        `,
        customClass: {
            popup: 'swal-custom-popup',
            title: 'swal-custom-title',
            htmlContainer: 'swal-custom-text'
        },
        didOpen: () => {
            // Progressive fallback system
            let currentUrlIndex = 0;

            const tryNextImage = () => {
                if (currentUrlIndex < imageUrls.length) {
                    const img = new Image();
                    img.onload = () => {
                        const backdrop = document.querySelector('.swal2-backdrop');
                        if (backdrop) {
                            backdrop.style.backgroundImage = `url("${imageUrls[currentUrlIndex]}")`;
                        }
                    };
                    img.onerror = () => {
                        currentUrlIndex++;
                        if (currentUrlIndex < imageUrls.length) {
                            tryNextImage();
                        } else {
                            // Final fallback to local
                            const backdrop = document.querySelector('.swal2-backdrop');
                            if (backdrop) {
                                backdrop.style.backgroundImage = `url("tlo/${backgroundImage}")`;
                            }
                        }
                    };
                    img.src = imageUrls[currentUrlIndex];
                } else {
                    // Final fallback to local
                    const backdrop = document.querySelector('.swal2-backdrop');
                    if (backdrop) {
                        backdrop.style.backgroundImage = `url("tlo/${backgroundImage}")`;
                    }
                }
            };

            // Start trying images
            tryNextImage();
        }
    });
}

// --- File Operations ---
function newFile() {
    const currentCode = editor.getValue();

    if (currentCode.trim() !== '') {
        showConfirmationModal(
            'Create New File',
            'Are you sure you want to create a new file? All unsaved changes will be lost.',
            'Yes, create new file',
            'Cancel',
            'file.png'
        ).then((result) => {
            if (result.isConfirmed) {
                editor.setValue('');
                updateFooterStatus('New file created', 'file-plus');
                setTimeout(() => updateFooterStatus('Ready', 'circle'), 2000);
            }
        });
    } else {
        editor.setValue('');
        updateFooterStatus('New file created', 'file-plus');
        setTimeout(() => updateFooterStatus('Ready', 'circle'), 2000);
    }
}

function openFile() {
    const currentCode = editor.getValue();

    if (currentCode.trim() !== '') {
        showConfirmationModal(
            'Open File',
            'Are you sure you want to open a file? All unsaved changes will be lost.',
            'Yes, open file',
            'Cancel',
            'folder.png'
        ).then((result) => {
            if (result.isConfirmed) {
                openFileDialog();
            }
        });
    } else {
        openFileDialog();
    }
}

function openFileDialog() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.html,.css,.js,.txt,.json,.xml,.md,.py,.java,.cpp,.c,.php,.rb,.go,.ts,.jsx,.tsx,.vue,.scss,.sass,.less,.styl';
    input.onchange = e => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = event => {
                editor.setValue(event.target.result);
                updateFooterStatus(`File opened: ${file.name}`, 'folder-open');
                setTimeout(() => updateFooterStatus('Ready', 'circle'), 3000);
            };
            reader.readAsText(file);
        }
    };
    input.click();
}

function saveFile() {
    const code = editor.getValue();
    const language = document.getElementById('language-selector').value;

    if (code.trim() === '') {
        Swal.fire({
            icon: 'info',
            title: 'Nothing to save',
            text: 'Please write some code first.',
            timer: 2000,
            showConfirmButton: false
        });
        return;
    }

    // Determine file extension based on language
    const extensions = {
        'html': 'html',
        'css': 'css',
        'javascript': 'js',
        'python': 'py',
        'typescript': 'ts',
        'java': 'java',
        'csharp': 'cs',
        'php': 'php'
    };

    const extension = extensions[language] || 'txt';
    const filename = `code.${extension}`;

    // Show confirmation modal before saving
    showConfirmationModal(
        'Save File',
        `Are you sure you want to save the file as "${filename}"?`,
        'Yes, save file',
        'Cancel',
        'file.png'
    ).then((result) => {
        if (result.isConfirmed) {
            const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);

            // Show success notification
            const lineCount = code.split('\n').length;
            const charCount = code.length;

            Swal.fire({
                icon: 'success',
                title: 'File saved!',
                text: `${filename} saved with ${lineCount} lines (${charCount} characters).`,
                timer: 2000,
                showConfirmButton: false,
                customClass: {
                    popup: 'swal-success-popup',
                    title: 'swal-success-title',
                    htmlContainer: 'swal-success-text'
                }
            });

            updateStatus(`File saved as ${filename}`, 'success');
        }
    });
}

// --- UI Toggles ---
document.getElementById('darkModeToggle').addEventListener('click', toggleTheme);

document.getElementById('run').addEventListener('click', updatePreview);
document.getElementById('stop').addEventListener('click', stopPreview);

function setPreviewMode(mode) {
    const editorContainer = document.getElementById('editor-container');
    const previewContainer = document.getElementById('preview-container');

    if (mode === 'split') {
        editorContainer.style.display = 'block';
        previewContainer.style.display = 'block';
        editorContainer.style.width = '50%';
        previewContainer.style.width = '50%';
    } else if (mode === 'editor') {
        editorContainer.style.display = 'block';
        previewContainer.style.display = 'none';
        editorContainer.style.width = '100%';
    } else if (mode === 'full') {
        editorContainer.style.display = 'none';
        previewContainer.style.display = 'block';
        previewContainer.style.width = '100%';
    }
}

// --- Info Modal Functions ---
function createInfoModal() {
    const modalHTML = `
        <div id="infoModal" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h2><i class="fas fa-info-circle"></i> Advanced Code Editor - Help & Info</h2>
                    <button class="modal-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="info-section">
                        <h3><i class="fas fa-keyboard"></i> Keyboard Shortcuts</h3>
                        <div class="shortcuts-grid">
                            <div class="shortcut-item">
                                <span class="shortcut-key">Ctrl + N</span>
                                <span class="shortcut-desc">New File</span>
                            </div>
                            <div class="shortcut-item">
                                <span class="shortcut-key">Ctrl + O</span>
                                <span class="shortcut-desc">Open File</span>
                            </div>
                            <div class="shortcut-item">
                                <span class="shortcut-key">Ctrl + S</span>
                                <span class="shortcut-desc">Save File</span>
                            </div>
                            <div class="shortcut-item">
                                <span class="shortcut-key">Ctrl + Z</span>
                                <span class="shortcut-desc">Undo</span>
                            </div>
                            <div class="shortcut-item">
                                <span class="shortcut-key">Ctrl + Y</span>
                                <span class="shortcut-desc">Redo</span>
                            </div>
                            <div class="shortcut-item">
                                <span class="shortcut-key">Ctrl + F</span>
                                <span class="shortcut-desc">Find</span>
                            </div>
                            <div class="shortcut-item">
                                <span class="shortcut-key">Ctrl + H</span>
                                <span class="shortcut-desc">Replace</span>
                            </div>
                            <div class="shortcut-item">
                                <span class="shortcut-key">Ctrl + /</span>
                                <span class="shortcut-desc">Toggle Comment</span>
                            </div>
                            <div class="shortcut-item">
                                <span class="shortcut-key">Alt + Shift + F</span>
                                <span class="shortcut-desc">Format Code</span>
                            </div>
                            <div class="shortcut-item">
                                <span class="shortcut-key">Ctrl + .</span>
                                <span class="shortcut-desc">Stop Preview</span>
                            </div>
                            <div class="shortcut-item">
                                <span class="shortcut-key">Ctrl + Shift + R</span>
                                <span class="shortcut-desc">Toggle Rainbow CSV</span>
                            </div>
                            <div class="shortcut-item">
                                <span class="shortcut-key">Ctrl + Shift + B</span>
                                <span class="shortcut-desc">Toggle All Bracket Guides</span>
                            </div>
                            <div class="shortcut-item">
                                <span class="shortcut-key">Alt + Shift + B</span>
                                <span class="shortcut-desc">Toggle Bracket Pairs Only</span>
                            </div>
                            <div class="shortcut-item">
                                <span class="shortcut-key">Alt + Shift + I</span>
                                <span class="shortcut-desc">Toggle Indentation Only</span>
                            </div>
                            <div class="shortcut-item">
                                <span class="shortcut-key">Ctrl + Shift + S</span>
                                <span class="shortcut-desc">Toggle Syntax Validation</span>
                            </div>
                            <div class="shortcut-item">
                                <span class="shortcut-key">Ctrl + Shift + P</span>
                                <span class="shortcut-desc">Show Problems Panel</span>
                            </div>
                            <div class="shortcut-item">
                                <span class="shortcut-key">Ctrl + Shift + C</span>
                                <span class="shortcut-desc">Cycle Color Schemes</span>
                            </div>
                            <div class="shortcut-item">
                                <span class="shortcut-key">Alt + Shift + C</span>
                                <span class="shortcut-desc">Toggle Custom Colors</span>
                            </div>
                            <div class="shortcut-item">
                                <span class="shortcut-key">F1</span>
                                <span class="shortcut-desc">Help & Info</span>
                            </div>
                            <div class="shortcut-item">
                                <span class="shortcut-key">F11</span>
                                <span class="shortcut-desc">Fullscreen</span>
                            </div>
                            <div class="shortcut-item">
                                <span class="shortcut-key">Ctrl + Space</span>
                                <span class="shortcut-desc">IntelliSense</span>
                            </div>
                        </div>
                    </div>

                    <div class="info-section">
                        <h3><i class="fas fa-tools"></i> Features</h3>
                        <ul class="features-list">
                            <li><strong>Monaco Editor:</strong> Full-featured code editor with syntax highlighting</li>
                            <li><strong>Multi-language Support:</strong> HTML, CSS, JavaScript, Python, TypeScript, Java, C#, PHP</li>
                            <li><strong>Live Preview:</strong> Real-time preview for HTML code</li>
                            <li><strong>Code Formatting:</strong> Prettier integration for HTML, CSS, and JavaScript</li>
                            <li><strong>Dark/Light Theme:</strong> Toggle between themes</li>
                            <li><strong>Local Storage:</strong> Automatically saves your work</li>
                            <li><strong>File Operations:</strong> New, Open, Save files</li>
                            <li><strong>View Modes:</strong> Split view, Editor only, Preview only</li>
                            <li><strong>IntelliSense:</strong> Auto-completion and code suggestions</li>
                            <li><strong>Error Detection:</strong> Real-time syntax error highlighting</li>
                            <li><strong>Rainbow CSV:</strong> Colorful column highlighting for CSV data</li>
                            <li><strong>Color Decorations:</strong> Visual color previews for hex, RGB, and HSL values</li>
                            <li><strong>Bracket Guides:</strong> Toggle-able indent guides for better code structure</li>
                            <li><strong>Bracket Pairs Guides:</strong> Visual guides connecting matching bracket pairs</li>
                            <li><strong>Indentation Guides:</strong> Vertical lines showing code indentation levels</li>
                            <li><strong>Granular Control:</strong> Toggle guides separately or together</li>
                            <li><strong>Syntax Validation:</strong> Real-time syntax checking for HTML, CSS, JavaScript, and JSON</li>
                            <li><strong>Problems Panel:</strong> Centralized view of all syntax errors, warnings, and info messages</li>
                            <li><strong>Language Services:</strong> Enhanced IntelliSense and diagnostics for each language</li>
                            <li><strong>Error Markers:</strong> Visual indicators for syntax problems with hover tooltips</li>
                            <li><strong>Custom Syntax Colors:</strong> Rich color schemes for different code elements</li>
                            <li><strong>Color Schemes:</strong> Vibrant, Neon, Rainbow, and Default themes</li>
                            <li><strong>Theme Integration:</strong> Color schemes adapt to light/dark mode automatically</li>
                            <li><strong>Per-Token Coloring:</strong> Keywords, strings, numbers, comments, functions each have distinct colors</li>
                        </ul>
                    </div>

                    <div class="info-section">
                        <h3><i class="fas fa-lightbulb"></i> Tips & Tricks</h3>
                        <ul class="tips-list">
                            <li>Use <strong>Ctrl + Space</strong> to trigger IntelliSense suggestions</li>
                            <li>Press <strong>Ctrl + K Ctrl + C</strong> to comment multiple lines</li>
                            <li>Use <strong>Alt + Up/Down</strong> to move lines up or down</li>
                            <li>Hold <strong>Alt</strong> and click to create multiple cursors</li>
                            <li>Press <strong>Ctrl + D</strong> to select next occurrence of current word</li>
                            <li>Use <strong>Ctrl + G</strong> to go to specific line number</li>
                            <li>Right-click in editor for context menu with more options</li>
                            <li>Your work is automatically saved to local storage</li>
                            <li>Use the language selector to switch between different programming languages</li>
                            <li>Format your code regularly for better readability</li>
                        </ul>
                    </div>

                    <div class="info-section">
                        <h3><i class="fas fa-book"></i> About</h3>
                        <p>Advanced Code Editor is a web-based code editor built with Monaco Editor (the editor that powers VS Code). It provides a powerful coding environment with syntax highlighting, IntelliSense, and live preview capabilities.</p>
                        <p><strong>Version:</strong> 1.0.0</p>
                        <p><strong>Technologies:</strong> Monaco Editor, Bootstrap, SweetAlert2, Prettier</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Create modal element
    const modalElement = document.createElement('div');
    modalElement.innerHTML = modalHTML;
    document.body.appendChild(modalElement.firstElementChild);

    return document.getElementById('infoModal');
}

function showInfoModal() {
    let modal = document.getElementById('infoModal');

    // Create modal if it doesn't exist
    if (!modal) {
        modal = createInfoModal();

        // Add event listeners
        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.addEventListener('click', hideInfoModal);

        // Close modal when clicking outside
        modal.addEventListener('click', function (e) {
            if (e.target === modal) {
                hideInfoModal();
            }
        });
    }

    // Show modal
    modal.classList.add('show');

    // Disable scrolling on body
    document.body.style.overflow = 'hidden';

    // Focus on modal for accessibility
    modal.focus();
}

function hideInfoModal() {
    const modal = document.getElementById('infoModal');
    if (modal) {
        modal.classList.remove('show');

        // Re-enable scrolling on body
        document.body.style.overflow = 'auto';

        // Return focus to editor
        if (editor) {
            editor.focus();
        }

        // Remove modal from DOM after animation
        setTimeout(() => {
            if (modal && !modal.classList.contains('show')) {
                modal.remove();
            }
        }, 300);
    }
}

// Global keyboard shortcuts
document.addEventListener('DOMContentLoaded', function () {
    document.addEventListener('keydown', function (e) {
        const modal = document.getElementById('infoModal');

        // Close modal with Escape key
        if (e.key === 'Escape' && modal && modal.classList.contains('show')) {
            hideInfoModal();
            return;
        }

        // F1 - Show help modal
        if (e.key === 'F1') {
            e.preventDefault();
            showInfoModal();
            return;
        }

        // Only process shortcuts if modal is not open
        if (modal && modal.classList.contains('show')) {
            return;
        }

        // Ctrl+N - New file
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            newFile();
        }

        // Ctrl+O - Open file
        if (e.ctrlKey && e.key === 'o') {
            e.preventDefault();
            openFile();
        }

        // Ctrl+S - Save file
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            saveFile();
        }

        // Alt+Shift+F - Format code
        if (e.altKey && e.shiftKey && e.key === 'F') {
            e.preventDefault();
            formatCode();
        }

        // Ctrl+. - Stop preview
        if (e.ctrlKey && e.key === '.') {
            e.preventDefault();
            stopPreview();
        }

        // Ctrl+Shift+R - Toggle Rainbow CSV
        if (e.ctrlKey && e.shiftKey && e.key === 'R') {
            e.preventDefault();
            toggleRainbowCSV();
        }

        // Ctrl+Shift+B - Toggle Bracket Guides
        if (e.ctrlKey && e.shiftKey && e.key === 'B') {
            e.preventDefault();
            toggleBracketGuides();
        }

        // Alt+Shift+B - Toggle Bracket Pairs Only
        if (e.altKey && e.shiftKey && e.key === 'B') {
            e.preventDefault();
            toggleBracketPairsOnly();
        }

        // Alt+Shift+I - Toggle Indentation Only
        if (e.altKey && e.shiftKey && e.key === 'I') {
            e.preventDefault();
            toggleIndentationOnly();
        }

        // Ctrl+Shift+S - Toggle Syntax Validation
        if (e.ctrlKey && e.shiftKey && e.key === 'S') {
            e.preventDefault();
            toggleSyntaxValidation();
        }

        // Ctrl+Shift+P - Show Problems Panel
        if (e.ctrlKey && e.shiftKey && e.key === 'P') {
            e.preventDefault();
            showProblemsPanel();
        }

        // Ctrl+Shift+C - Cycle Syntax Color Schemes
        if (e.ctrlKey && e.shiftKey && e.key === 'C') {
            e.preventDefault();
            cycleSyntaxColorScheme();
        }

        // Alt+Shift+C - Toggle Custom Syntax Colors
        if (e.altKey && e.shiftKey && e.key === 'C') {
            e.preventDefault();
            toggleSyntaxColors();
        }

        // F11 - Toggle fullscreen
        if (e.key === 'F11') {
            e.preventDefault();
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                document.documentElement.requestFullscreen();
            }
        }
    });
});

// --- Footer Functions ---
function toggleFooter() {
    const footerContent = document.getElementById('footer-content');
    const footerToggle = document.getElementById('footer-toggle');

    if (footerContent && footerToggle) {
        const isExpanded = footerContent.classList.contains('expanded');

        if (isExpanded) {
            // Collapse
            footerContent.classList.remove('expanded');
            footerToggle.classList.remove('rotated');
            footerToggle.innerHTML = '<i class="fas fa-chevron-up"></i>';
        } else {
            // Expand
            footerContent.classList.add('expanded');
            footerToggle.classList.add('rotated');
            footerToggle.innerHTML = '<i class="fas fa-chevron-down"></i>';
        }
    }
}

function updateFooterStatus(status, icon = 'circle') {
    const footerStatus = document.getElementById('footer-status');
    if (footerStatus) {
        footerStatus.innerHTML = `<i class="fas fa-${icon}"></i> ${status}`;

        // Add status color based on status and icon
        footerStatus.className = 'status-indicator';

        // Run related statuses (green)
        if (status.includes('Preview updated') ||
            status.includes('Updating preview') ||
            status.toLowerCase().includes('preview') && (icon === 'check' || icon === 'spinner')) {
            footerStatus.classList.add('status-run');
        }
        // Stop related statuses (red)  
        else if (status.includes('Preview stopped') ||
            status.includes('Stop') ||
            icon === 'stop') {
            footerStatus.classList.add('status-stop');
        }
        // Error statuses (red)
        else if (status.includes('Error') || status.includes('error') || status.includes('failed')) {
            footerStatus.classList.add('status-error');
        }
        // Success statuses (green)
        else if (status.includes('Success') || status.includes('success')) {
            footerStatus.classList.add('status-success');
        }
        // Default ready status
        else {
            footerStatus.classList.add('status-ready');
        }
    }
}

// Update status when actions are performed
document.addEventListener('DOMContentLoaded', function () {
    // Update status on various actions
    const originalFormatCode = window.formatCode;
    window.formatCode = async function () {
        updateFooterStatus('Formatting...', 'spinner');
        try {
            await originalFormatCode();
            updateFooterStatus('Code formatted', 'check');
            setTimeout(() => updateFooterStatus('Ready', 'circle'), 2000);
        } catch (error) {
            updateFooterStatus('Format error', 'exclamation-triangle');
            setTimeout(() => updateFooterStatus('Ready', 'circle'), 3000);
        }
    };

    const originalSaveFile = window.saveFile;
    window.saveFile = function () {
        updateFooterStatus('Saving...', 'spinner');
        originalSaveFile();
        updateFooterStatus('File saved', 'check');
        setTimeout(() => updateFooterStatus('Ready', 'circle'), 2000);
    };

    const originalUpdatePreview = window.updatePreview;
    window.updatePreview = function () {
        updateFooterStatus('Updating preview...', 'spinner');
        try {
            originalUpdatePreview();
            setTimeout(() => {
                updateFooterStatus('Preview updated', 'check');
                setTimeout(() => updateFooterStatus('Ready', 'circle'), 1000);
            }, 100);
        } catch (error) {
            updateFooterStatus('Preview error', 'exclamation-triangle');
            setTimeout(() => updateFooterStatus('Ready', 'circle'), 2000);
        }
    };
});

// Auto-update current year in footer
function updateCurrentYear() {
    const yearElement = document.getElementById('current-year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
}

// Update year on page load and every year
document.addEventListener('DOMContentLoaded', updateCurrentYear);
setInterval(updateCurrentYear, 365 * 24 * 60 * 60 * 1000); // Update every year

