/**
 * Rana.bg - Brush Logic
 * Handles HTML5 Canvas operations for manual background editing.
 */

class BrushEditor {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // Configuration
        this.isDrawing = false;
        this.mode = 'erase'; // 'erase' or 'restore'
        this.brushSize = 30;
        this.lastX = 0;
        this.lastY = 0;

        // History for Undo/Redo
        this.history = []; // Array of ImageData
        this.historyIndex = -1;
        this.maxHistory = 10;

        // Images
        this.originalImage = null; // The full original image

        this.setupEvents();
    }

    // Initialize the canvas with an image
    loadImage(img) {
        // High DPI Canvas support
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.parentElement.getBoundingClientRect();

        // Set display size
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';

        // Set actual size in memory (scaled to fit container but keep aspect ratio?)
        // simplified: match the image aspect ratio but fit within container
        // Or just adopt image size? For performance, best to limit max dimension.

        const MAX_DIM = 2000;
        let w = img.width;
        let h = img.height;

        if (w > MAX_DIM || h > MAX_DIM) {
            const ratio = w / h;
            if (w > h) {
                w = MAX_DIM;
                h = MAX_DIM / ratio;
            } else {
                h = MAX_DIM;
                w = MAX_DIM * ratio;
            }
        }

        this.canvas.width = w;
        this.canvas.height = h;

        // Draw the image
        this.ctx.drawImage(img, 0, 0, w, h);

        this.originalImage = img; // Keep reference to original source

        // Save initial state for undo
        this.saveState();
    }

    setupEvents() {
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseout', () => this.stopDrawing());

        // Touch events
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startDrawing(e.touches[0]);
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.draw(e.touches[0]);
        });
        this.canvas.addEventListener('touchend', () => this.stopDrawing());
    }

    getMousePos(evt) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        return {
            x: (evt.clientX - rect.left) * scaleX,
            y: (evt.clientY - rect.top) * scaleY
        };
    }

    startDrawing(e) {
        this.isDrawing = true;
        const pos = this.getMousePos(e);
        this.lastX = pos.x;
        this.lastY = pos.y;

        // Prepare context based on mode
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.lineWidth = this.brushSize;

        if (this.mode === 'erase') {
            this.ctx.globalCompositeOperation = 'destination-out';
            this.ctx.strokeStyle = '#000000'; // Color doesn't matter for erase
        } else if (this.mode === 'restore' && this.originalImage) {
            this.ctx.globalCompositeOperation = 'source-over';
            // Use the original image as a pattern for the stroke
            // Since canvas and image logic is 1:1, this tiles perfectly from 0,0
            const pattern = this.ctx.createPattern(this.originalImage, 'no-repeat');
            this.ctx.strokeStyle = pattern;
        }

        // Dot for single click
        this.ctx.beginPath();
        this.ctx.moveTo(pos.x, pos.y);
        this.ctx.lineTo(pos.x, pos.y);
        this.ctx.stroke();
    }

    draw(e) {
        if (!this.isDrawing) return;
        const pos = this.getMousePos(e);

        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(pos.x, pos.y);
        this.ctx.stroke();

        this.lastX = pos.x;
        this.lastY = pos.y;
    }

    stopDrawing() {
        if (!this.isDrawing) return;
        this.isDrawing = false;
        this.saveState();
    }

    setMode(mode) {
        this.mode = mode;
    }

    setBrushSize(size) {
        this.brushSize = size;
    }

    // History Management
    saveState() {
        // If we undo and then draw, remove future states
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }

        this.history.push(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        } else {
            this.historyIndex++;
        }
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.ctx.putImageData(this.history[this.historyIndex], 0, 0);
        }
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.ctx.putImageData(this.history[this.historyIndex], 0, 0);
        }
    }

    getDownloadURL() {
        return this.canvas.toDataURL('image/png');
    }
}

// Ensure it's available globally even if loaded as a script
window.BrushEditor = BrushEditor;
