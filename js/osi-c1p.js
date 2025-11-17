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
        this.DISK_STATUS = 0xC000;
        this.DISK_DATA = 0xC010;

        // Keyboard state
        this.keyBuffer = [];
        this.lastKey = 0;

        // Disk controller
        this.diskController = new DiskController();

        // Debugger
        this.debugger = new Debugger(this.cpu);

        // Display cursor position for improved output
        this.cursorPos = 0;

        // ROM
        this.loadBasicROM();

        // Setup memory-mapped I/O
        this.setupIO();

        // Running state
        this.running = false;
        this.cyclesPerFrame = 16666; // ~1MHz at 60fps
    }

    setupIO() {
        // Screen memory write with cursor tracking
        for (let addr = this.SCREEN_START; addr <= this.SCREEN_END; addr++) {
            this.cpu.writeCallbacks[addr] = ((a) => {
                return (value) => {
                    this.cpu.memory[a] = value;
                    const offset = a - this.SCREEN_START;
                    if (offset < 1024) { // 32x32 screen
                        this.terminal.screen[offset] = value;
                        // Update cursor position
                        this.cursorPos = offset;
                        const x = offset % 32;
                        const y = Math.floor(offset / 32);
                        this.terminal.setCursor(x, y);
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

        // Disk controller I/O
        this.cpu.readCallbacks[this.DISK_STATUS] = () => {
            return this.diskController.readStatus();
        };

        this.cpu.readCallbacks[this.DISK_DATA] = () => {
            return this.diskController.dataRegister;
        };

        this.cpu.writeCallbacks[this.DISK_DATA] = (value) => {
            this.diskController.dataRegister = value;
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

        // Screen cursor position (zero page)
        this.cpu.memory[0xD0] = 0;  // Cursor X
        this.cpu.memory[0xD1] = 0;  // Cursor Y

        // Simple BASIC cold start at 0xBD00
        let addr = 0xBD00;

        // Clear screen and print welcome message
        const code = [
            0xA9, 0x03,       // LDA #$03 (clear screen char)
            0x20, 0x10, 0xBD, // JSR CHROUT
            0xA2, 0x00,       // LDX #$00
            // Print loop at $BD08
            0xBD, 0x50, 0xBD, // LDA MESSAGE,X
            0xF0, 0x08,       // BEQ DONE
            0x20, 0x10, 0xBD, // JSR CHROUT
            0xE8,             // INX
            0x4C, 0x08, 0xBD, // JMP LOOP (back to $BD08)
            // DONE - infinite loop waiting for HEXDOS
            0x4C, 0x13, 0xBD, // JMP DONE

            // CHROUT routine at 0xBD10
            // Input: A = character to output
            0x48,             // PHA - save character

            // Check for special characters
            0xC9, 0x03,       // CMP #$03 (clear screen)
            0xD0, 0x1D,       // BNE NOT_CLEAR (+29 bytes)
            // Clear screen - fill with spaces
            0xA9, 0x20,       // LDA #$20 (space character)
            0xA2, 0x00,       // LDX #$00
            0xA0, 0x04,       // LDY #$04 (4 pages = 1024 bytes)
            // CLEAR_LOOP at $BD1B
            0x9D, 0x00, 0xD0, // STA $D000,X
            0x9D, 0x00, 0xD1, // STA $D100,X
            0x9D, 0x00, 0xD2, // STA $D200,X
            0x9D, 0x00, 0xD3, // STA $D300,X
            0xE8,             // INX
            0xD0, 0xF1,       // BNE CLEAR_LOOP
            // Reset cursor
            0xA9, 0x00,       // LDA #$00
            0x85, 0xD0,       // STA $D0 (cursor X = 0)
            0x85, 0xD1,       // STA $D1 (cursor Y = 0)
            0x68,             // PLA
            0x60,             // RTS

            // NOT_CLEAR at $BD32
            0xC9, 0x0D,       // CMP #$0D (carriage return)
            0xD0, 0x06,       // BNE NOT_CR
            0xA9, 0x00,       // LDA #$00
            0x85, 0xD0,       // STA $D0 (cursor X = 0)
            0x68,             // PLA
            0x60,             // RTS

            // NOT_CR at $BD3A
            0xC9, 0x0A,       // CMP #$0A (line feed)
            0xD0, 0x0A,       // BNE NOT_LF
            0xA5, 0xD1,       // LDA $D1 (cursor Y)
            0xC9, 0x1F,       // CMP #$1F (max row)
            0xB0, 0x02,       // BCS SKIP_INC
            0xE6, 0xD1,       // INC $D1
            0x68,             // PLA
            0x60,             // RTS

            // NOT_LF at $BD46 - normal character output
            0x68,             // PLA - restore character
            0x48,             // PHA - save it again

            // Calculate screen address: Y * 32 + X
            0xA5, 0xD1,       // LDA $D1 (cursor Y)
            0x0A,             // ASL (Y * 2)
            0x0A,             // ASL (Y * 4)
            0x0A,             // ASL (Y * 8)
            0x0A,             // ASL (Y * 16)
            0x0A,             // ASL (Y * 32)
            0x85, 0xD2,       // STA $D2 (temp)

            0x18,             // CLC
            0x65, 0xD0,       // ADC $D0 (add cursor X)
            0x85, 0xD3,       // STA $D3 (low byte of offset)
            0xA9, 0x00,       // LDA #$00
            0x85, 0xD4,       // STA $D4 (high byte of offset)

            // Add screen base ($D000)
            0x18,             // CLC
            0xA5, 0xD3,       // LDA $D3
            0x69, 0x00,       // ADC #$00
            0x85, 0xD3,       // STA $D3
            0xA5, 0xD4,       // LDA $D4
            0x69, 0xD0,       // ADC #$D0
            0x85, 0xD4,       // STA $D4

            // Write character to screen using indirect addressing
            0x68,             // PLA - restore character
            0xA0, 0x00,       // LDY #$00
            0x91, 0xD3,       // STA ($D3),Y

            // Advance cursor
            0xE6, 0xD0,       // INC $D0 (cursor X)
            0xA5, 0xD0,       // LDA $D0
            0xC9, 0x20,       // CMP #$20 (32 columns)
            0x90, 0x08,       // BCC NO_WRAP
            // Wrap to next line
            0xA9, 0x00,       // LDA #$00
            0x85, 0xD0,       // STA $D0 (cursor X = 0)
            0xE6, 0xD1,       // INC $D1 (cursor Y)

            // NO_WRAP
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
