/**
 * Ohio Scientific Challenger 1P Emulator
 *
 * Emulates the OSI C1P computer hardware
 */

class OSIC1P {
    constructor(terminal) {
        this.cpu = new CPU6502();
        this.terminal = terminal;

        // Memory map
        this.SCREEN_START = 0xD000;
        this.SCREEN_END = 0xD3FF;
        this.KEYBOARD = 0xDF00;
        this.KEYBOARD_STATUS = 0xDF00;

        // Keyboard state
        this.keyBuffer = [];
        this.lastKey = 0;

        // ROM
        this.loadBasicROM();

        // Setup memory-mapped I/O
        this.setupIO();

        // Running state
        this.running = false;
        this.cyclesPerFrame = 16666; // ~1MHz at 60fps
    }

    setupIO() {
        // Screen memory write
        for (let addr = this.SCREEN_START; addr <= this.SCREEN_END; addr++) {
            this.cpu.writeCallbacks[addr] = ((a) => {
                return (value) => {
                    this.cpu.memory[a] = value;
                    const offset = a - this.SCREEN_START;
                    if (offset < 1024) { // 32x32 screen
                        this.terminal.screen[offset] = value;
                    }
                };
            })(addr);
        }

        // Keyboard
        this.cpu.readCallbacks[this.KEYBOARD] = () => {
            if (this.keyBuffer.length > 0) {
                this.lastKey = this.keyBuffer.shift() | 0x80; // Set bit 7
            } else {
                this.lastKey &= 0x7F; // Clear bit 7 when no key
            }
            return this.lastKey;
        };
    }

    loadBasicROM() {
        // Load a minimal OSI BASIC ROM stub
        // This is a simplified version for demonstration

        // Reset vector points to BASIC cold start
        this.cpu.memory[0xFFFC] = 0x00;
        this.cpu.memory[0xFFFD] = 0xBD;

        // IRQ vector
        this.cpu.memory[0xFFFE] = 0x00;
        this.cpu.memory[0xFFFF] = 0xFF;

        // Simple BASIC cold start at 0xBD00
        let addr = 0xBD00;

        // Clear screen and print welcome message
        const code = [
            0xA9, 0x03,       // LDA #$03 (clear screen char)
            0x20, 0x10, 0xBD, // JSR CHROUT
            0xA2, 0x00,       // LDX #$00
            // Print loop
            0xBD, 0x50, 0xBD, // LDA MESSAGE,X
            0xF0, 0x08,       // BEQ DONE
            0x20, 0x10, 0xBD, // JSR CHROUT
            0xE8,             // INX
            0x4C, 0x08, 0xBD, // JMP LOOP
            // DONE - infinite loop waiting for HEXDOS
            0x4C, 0x13, 0xBD, // JMP DONE

            // CHROUT routine at 0xBD10
            0x8D, 0x00, 0xD0, // STA $D000 (screen memory)
            0x60,             // RTS
        ];

        for (let i = 0; i < code.length; i++) {
            this.cpu.memory[addr + i] = code[i];
        }

        // Message at 0xBD50
        const message = "OSI BASIC REV 1.0\r\n\rMEMORY SIZE? ";
        addr = 0xBD50;
        for (let i = 0; i < message.length; i++) {
            this.cpu.memory[addr + i] = message.charCodeAt(i);
        }
        this.cpu.memory[addr + message.length] = 0; // Null terminator

        // Install BASIC INPUT/OUTPUT vectors
        // These will be used by HEXDOS
        this.cpu.memory[0xFF69] = 0x10; // CHROUT lo
        this.cpu.memory[0xFF6A] = 0xBD; // CHROUT hi
    }

    reset() {
        this.cpu.reset();
        this.terminal.clear();
        this.keyBuffer = [];
        this.lastKey = 0;
    }

    powerOn() {
        this.reset();
        this.running = true;
        this.lastFrameTime = performance.now();
        this.cycleCount = 0;
        this.frameCount = 0;
        this.run();
    }

    powerOff() {
        this.running = false;
    }

    run() {
        if (!this.running) return;

        const now = performance.now();
        const elapsed = now - this.lastFrameTime;

        // Run CPU cycles for this frame
        let cycles = 0;
        const targetCycles = this.cyclesPerFrame * (elapsed / 16.67);

        while (cycles < targetCycles && this.running) {
            cycles += this.cpu.step();
        }

        this.cycleCount += cycles;
        this.frameCount++;

        // Update display
        this.terminal.render();

        // Update timing
        if (elapsed >= 1000) {
            this.lastFrameTime = now;
            const mhz = (this.cycleCount / elapsed / 1000).toFixed(2);
            const fps = this.frameCount;
            this.onSpeedUpdate && this.onSpeedUpdate(mhz, fps);
            this.cycleCount = 0;
            this.frameCount = 0;
        }

        // Schedule next frame
        requestAnimationFrame(() => this.run());
    }

    pressKey(key) {
        // Convert key to ASCII and add to buffer
        let ascii = 0;

        if (key.length === 1) {
            ascii = key.toUpperCase().charCodeAt(0);
        } else {
            // Handle special keys
            switch (key) {
                case 'Enter': ascii = 13; break;
                case 'Backspace': ascii = 8; break;
                case 'Escape': ascii = 27; break;
                case 'Tab': ascii = 9; break;
                default: return; // Ignore other special keys
            }
        }

        this.keyBuffer.push(ascii);
    }

    loadProgram(data, startAddr) {
        // Load binary data into memory
        for (let i = 0; i < data.length; i++) {
            this.cpu.memory[startAddr + i] = data[i];
        }
    }

    loadHEXDOS(hexdosData) {
        // Load HEXDOS into memory
        // HEXDOS typically loads at $0300
        this.loadProgram(hexdosData, 0x0300);

        // Jump to HEXDOS
        this.cpu.PC = 0x0300;

        console.log('HEXDOS loaded at $0300');
    }
}
