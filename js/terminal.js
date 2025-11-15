/**
 * Terminal Display Emulator for OSI C1P
 *
 * Renders a 32x32 character grid display
 */

class Terminal {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Display parameters
        this.cols = 32;
        this.rows = 32;
        this.charWidth = 16;
        this.charHeight = 15;

        // Colors
        this.bgColor = '#000000';
        this.fgColor = '#00FF00';

        // Screen memory
        this.screen = new Uint8Array(this.cols * this.rows);

        // Cursor
        this.cursorX = 0;
        this.cursorY = 0;
        this.cursorVisible = true;
        this.cursorBlink = false;

        // Character ROM (simplified 8x8 ASCII set)
        this.initCharROM();

        // Start cursor blink
        this.blinkInterval = setInterval(() => {
            this.cursorBlink = !this.cursorBlink;
            this.drawCursor();
        }, 500);

        this.clear();
    }

    initCharROM() {
        // Simplified character ROM - we'll use canvas text rendering
        // for simplicity in this historical emulation
        this.ctx.font = '13px "Courier New", monospace';
        this.ctx.textBaseline = 'top';
    }

    clear() {
        this.screen.fill(32); // Fill with spaces
        this.cursorX = 0;
        this.cursorY = 0;
        this.render();
    }

    writeChar(ch) {
        if (ch === 13) { // CR
            this.cursorX = 0;
            return;
        }

        if (ch === 10) { // LF
            this.cursorY++;
            if (this.cursorY >= this.rows) {
                this.scroll();
                this.cursorY = this.rows - 1;
            }
            return;
        }

        if (ch === 8) { // Backspace
            if (this.cursorX > 0) {
                this.cursorX--;
            }
            return;
        }

        if (ch === 3) { // Clear screen (OSI specific)
            this.clear();
            return;
        }

        // Write character
        const addr = this.cursorY * this.cols + this.cursorX;
        this.screen[addr] = ch;

        this.cursorX++;
        if (this.cursorX >= this.cols) {
            this.cursorX = 0;
            this.cursorY++;
            if (this.cursorY >= this.rows) {
                this.scroll();
                this.cursorY = this.rows - 1;
            }
        }
    }

    scroll() {
        // Scroll up one line
        for (let i = 0; i < (this.rows - 1) * this.cols; i++) {
            this.screen[i] = this.screen[i + this.cols];
        }
        // Clear last line
        for (let i = (this.rows - 1) * this.cols; i < this.rows * this.cols; i++) {
            this.screen[i] = 32;
        }
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = this.bgColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw characters
        this.ctx.fillStyle = this.fgColor;

        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                const ch = this.screen[y * this.cols + x];
                if (ch !== 32) { // Don't draw spaces
                    const char = String.fromCharCode(ch);
                    this.ctx.fillText(
                        char,
                        x * this.charWidth + 2,
                        y * this.charHeight + 2
                    );
                }
            }
        }

        this.drawCursor();
    }

    drawCursor() {
        if (this.cursorVisible && this.cursorBlink) {
            this.ctx.fillStyle = this.fgColor;
            this.ctx.fillRect(
                this.cursorX * this.charWidth + 2,
                this.cursorY * this.charHeight + 2,
                this.charWidth - 4,
                this.charHeight - 4
            );
        } else {
            // Redraw character at cursor position
            const ch = this.screen[this.cursorY * this.cols + this.cursorX];
            if (ch !== 32) {
                this.ctx.fillStyle = this.bgColor;
                this.ctx.fillRect(
                    this.cursorX * this.charWidth,
                    this.cursorY * this.charHeight,
                    this.charWidth,
                    this.charHeight
                );
                this.ctx.fillStyle = this.fgColor;
                const char = String.fromCharCode(ch);
                this.ctx.fillText(
                    char,
                    this.cursorX * this.charWidth + 2,
                    this.cursorY * this.charHeight + 2
                );
            } else {
                this.ctx.fillStyle = this.bgColor;
                this.ctx.fillRect(
                    this.cursorX * this.charWidth,
                    this.cursorY * this.charHeight,
                    this.charWidth,
                    this.charHeight
                );
            }
        }
    }

    setCursor(x, y) {
        this.cursorX = x;
        this.cursorY = y;
    }

    getCursor() {
        return { x: this.cursorX, y: this.cursorY };
    }

    destroy() {
        if (this.blinkInterval) {
            clearInterval(this.blinkInterval);
        }
    }
}
