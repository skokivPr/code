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
    }

    const iconElement = document.getElementById('darkModeIcon');
    if (iconElement) {
        iconElement.className = isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
    }
}

function toggleTheme() {
    const currentTheme = getCurrentTheme();
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    saveToLocalStorage();
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

    editor = monaco.editor.create(document.getElementById('editor'), {
        value: importedCode,  // ← Tu jest zaimportowany kod z app.js
        language: 'html',
        theme: 'vs-light',
        automaticLayout: true,
        wordWrap: 'on',
    });

    // Load saved state after editor is ready
    loadFromLocalStorage();

    // Auto-save with debouncing
    let saveTimeout;
    editor.onDidChangeModelContent(() => {
        updatePreview();

        // Debounced save
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(saveToLocalStorage, 1000);
    });

    updatePreview(); // Initial preview
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

// --- Local Storage Functions ---
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
            'https://raw.githubusercontent.com/skokivPr/code/refs/heads/main/tlo/delete.png'
        ).then((result) => {
            if (result.isConfirmed) {
                monaco.editor.setModelLanguage(editor.getModel(), language);
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
            'https://raw.githubusercontent.com/skokivPr/code/refs/heads/main/tlo/format.png'
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
            url("tlo/${backgroundImage}")
            center center
            no-repeat
        `,
        customClass: {
            popup: 'swal-custom-popup',
            title: 'swal-custom-title',
            htmlContainer: 'swal-custom-text'
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
            'https://raw.githubusercontent.com/skokivPr/code/refs/heads/main/tlo/file.png'
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
            'https://raw.githubusercontent.com/skokivPr/code/refs/heads/main/tlo/folder.png'
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
        'https://raw.githubusercontent.com/skokivPr/code/refs/heads/main/tlo/file.png'
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

        // Add status color based on status
        footerStatus.className = 'status-indicator';
        if (status.includes('Error')) {
            footerStatus.classList.add('status-error');
        } else if (status.includes('Success')) {
            footerStatus.classList.add('status-success');
        } else {
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

