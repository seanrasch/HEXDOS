/**
 * HEXDOS Binary Loader
 *
 * Handles loading and preparation of HEXDOS binary
 */

class HEXDOSLoader {
    constructor() {
        // HEXDOS binary will be assembled from source
        this.hexdosData = null;
    }

    async loadFromSource() {
        // For this demo, we'll create a minimal HEXDOS stub
        // In a full implementation, this would assemble the .ASM file

        // Create a simple program that prints "HEXDOS 4.0" and waits
        const program = [];

        // Clear screen
        program.push(0xA9, 0x03);       // LDA #$03
        program.push(0x20, 0x30, 0x03); // JSR CHROUT

        // Print "HEXDOS 4.0" message
        program.push(0xA2, 0x00);       // LDX #$00
        // Loop: LDA MESSAGE,X
        program.push(0xBD, 0x50, 0x03); // LDA $0350,X
        program.push(0xF0, 0x08);       // BEQ DONE (+8)
        program.push(0x20, 0x30, 0x03); // JSR CHROUT
        program.push(0xE8);             // INX
        program.push(0x4C, 0x09, 0x03); // JMP LOOP

        // DONE: Wait for input loop
        program.push(0xAD, 0x00, 0xDF); // LDA KEYBOARD
        program.push(0x10, 0xFB);       // BPL WAIT (-5)
        program.push(0x29, 0x7F);       // AND #$7F
        program.push(0x20, 0x30, 0x03); // JSR CHROUT
        program.push(0x4C, 0x15, 0x03); // JMP INPUT_LOOP

        // CHROUT routine at $0330
        program.push(...new Array(0x30 - program.length).fill(0xEA)); // Fill with NOPs
        program.push(0x48);             // PHA
        program.push(0x8A);             // TXA
        program.push(0x48);             // PHA
        program.push(0x68);             // PLA
        program.push(0xAA);             // TAX
        program.push(0x68);             // PLA

        // Simple character output
        program.push(0xC9, 0x0D);       // CMP #$0D (carriage return)
        program.push(0xD0, 0x04);       // BNE NOT_CR
        program.push(0xA9, 0x0D);       // LDA #$0D
        program.push(0xA9, 0x0A);       // LDA #$0A (add linefeed)

        // Write to screen memory
        program.push(0x8D, 0x00, 0xD0); // STA $D000
        program.push(0x60);             // RTS

        // Message at $0350
        program.push(...new Array(0x50 - program.length).fill(0x00));
        const message = "\r\n\rHEXDOS 4.0\r\nCOPYRIGHT (C) 1980-2015\r\nSTEVEN P. HENDRIX\r\n\r\nREADY\r\n\r";
        for (let i = 0; i < message.length; i++) {
            program.push(message.charCodeAt(i));
        }
        program.push(0x00); // Null terminator

        this.hexdosData = new Uint8Array(program);
        return this.hexdosData;
    }

    getData() {
        return this.hexdosData;
    }

    // Future: implement actual 6502 assembler for the .ASM files
    async assembleSource(sourceFile) {
        // This would parse the HEXDOS.ASM file and assemble it
        // For now, we return the stub
        return this.loadFromSource();
    }
}
