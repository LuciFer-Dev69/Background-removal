/**
 * Rana.bg - Main Application Logic
 * Orchestrates upload, processing simulation, and editor initialization.
 */

// Custom Backend API Endpoint
const API_URL = "http://localhost:8000/remove-bg";

document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const uploadStage = document.getElementById('upload-stage');
    const processingStage = document.getElementById('processing-stage');
    const editorStage = document.getElementById('editor-stage');

    const fileInput = document.getElementById('file-input');
    const uploadBtn = uploadStage.querySelector('.btn-primary');

    const btnErase = document.getElementById('btn-erase');
    const btnRestore = document.getElementById('btn-restore');
    const brushSizeSlider = document.getElementById('brush-size');
    const btnUndo = document.getElementById('btn-undo');
    const btnRedo = document.getElementById('btn-redo');
    const btnDownload = document.getElementById('btn-download');

    // State for swapping images
    let originalImageBlob = null;
    let processedImageBlob = null;

    // Tools Toggle
    const btnToggleEdit = document.getElementById('btn-toggle-edit');
    const manualTools = document.getElementById('manual-tools');

    if (btnToggleEdit && manualTools) {
        btnToggleEdit.addEventListener('click', () => {
            manualTools.classList.toggle('hidden');
            const isActive = !manualTools.classList.contains('hidden');
            btnToggleEdit.style.background = isActive ? 'var(--color-bg-surface-hover)' : 'transparent';

            // Logic: 
            // - If Active (Manual Mode): Load Original Image (for manual removal)
            // - If Inactive (Result Mode): Reload AI Result (resetting manual changes if any, acts as "Cancel Manual")
            // This satisfies the user request to see the original image when clicking manual.

            if (isActive && originalImageBlob) {
                const url = URL.createObjectURL(originalImageBlob);
                const img = new Image();
                img.onload = () => {
                    editor.loadImage(img);
                    URL.revokeObjectURL(url);
                };
                img.src = url;
            } else if (!isActive && processedImageBlob) {
                const url = URL.createObjectURL(processedImageBlob);
                const img = new Image();
                img.onload = () => {
                    editor.loadImage(img);
                    URL.revokeObjectURL(url);
                };
                img.src = url;
            }
        });
    }

    // Mobile Menu Toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileNav = document.getElementById('mobile-nav');

    if (mobileMenuBtn && mobileNav) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileNav.classList.toggle('active');
            mobileMenuBtn.classList.toggle('active');
        });
    }

    // Editor Instance
    const editor = new window.BrushEditor('main-canvas');

    // Drag & Drop
    uploadStage.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadStage.classList.add('drag-active');
    });

    uploadStage.addEventListener('dragleave', () => {
        uploadStage.classList.remove('drag-active');
    });

    uploadStage.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadStage.classList.remove('drag-active');
        if (e.dataTransfer.files.length) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    // Button Click
    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFile(e.target.files[0]);
        }
    });

    async function handleFile(file) {
        if (!file.type.match('image.*')) {
            alert('Please upload a valid image file (PNG, JPG, WebP).');
            return;
        }

        // Store Original
        originalImageBlob = file;

        // Show Processing
        uploadStage.classList.add('hidden');
        processingStage.classList.remove('hidden');

        try {
            // Prepare FormData for Backend
            const formData = new FormData();
            formData.append('file', file);

            // Call Python Backend
            const response = await fetch(API_URL, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Backend API error');
            }

            // Get Blob from Response
            const blob = await response.blob();
            processedImageBlob = blob;

            // Blob to Image
            const url = URL.createObjectURL(blob);
            const img = new Image();
            img.onload = () => {
                // Transition to Editor
                processingStage.classList.add('hidden');
                editorStage.classList.remove('hidden');

                editor.loadImage(img);

                // Update Original Preview
                const previewContainer = document.getElementById('original-preview-container');
                const previewImg = document.getElementById('original-preview-img');
                if (previewContainer && previewImg) {
                    previewImg.src = URL.createObjectURL(file); // file is the original blob
                    previewContainer.classList.remove('hidden');
                }

                // Ensure Manual Tools are hidden by default
                manualTools.classList.add('hidden');
                btnToggleEdit.style.background = 'transparent';

                // Trigger AdSense refresh/push if needed
                if (window.AdsLogic) window.AdsLogic.refreshAds();

                // Clean up memory
                URL.revokeObjectURL(url);
            };
            img.src = url;

        } catch (error) {
            console.error('Removal failed:', error);
            alert('Background removal failed. Is the Python backend running? (http://localhost:8000)');
            processingStage.classList.add('hidden');
            uploadStage.classList.remove('hidden');
        }
    }

    // Tool Controls
    btnErase.addEventListener('click', () => {
        editor.setMode('erase');
        btnErase.classList.add('active');
        btnRestore.classList.remove('active');
    });

    btnRestore.addEventListener('click', () => {
        editor.setMode('restore');
        btnRestore.classList.add('active');
        btnErase.classList.remove('active');
    });

    brushSizeSlider.addEventListener('input', (e) => {
        editor.setBrushSize(e.target.value);
    });

    btnUndo.addEventListener('click', () => editor.undo());
    btnRedo.addEventListener('click', () => editor.redo());

    btnDownload.addEventListener('click', () => {
        // Download Flow
        const originalText = btnDownload.innerText;
        btnDownload.innerText = 'Preparing Download...';
        btnDownload.disabled = true;

        // Trigger Ad Interstitial or wait
        // Simulating ad-supported unlock delay

        setTimeout(() => {
            const link = document.createElement('a');
            link.download = 'rana-bg-edited.png';
            link.href = editor.getDownloadURL();
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            btnDownload.innerText = originalText;
            btnDownload.disabled = false;
        }, 1000); // 1s delay
    });
});
