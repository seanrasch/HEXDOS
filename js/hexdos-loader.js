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
        // Loop at $0307: LDA MESSAGE,X
        program.push(0xBD, 0x50, 0x03); // LDA $0350,X
        program.push(0xF0, 0x08);       // BEQ DONE (+8)
        program.push(0x20, 0x30, 0x03); // JSR CHROUT
        program.push(0xE8);             // INX
        program.push(0x4C, 0x07, 0x03); // JMP LOOP (back to $0307)

        // DONE at $0313: Wait for input loop
        program.push(0xAD, 0x00, 0xDF); // LDA KEYBOARD
        program.push(0x10, 0xFB);       // BPL WAIT (-5)
        program.push(0x29, 0x7F);       // AND #$7F
        program.push(0x20, 0x30, 0x03); // JSR CHROUT
        program.push(0x4C, 0x13, 0x03); // JMP INPUT_LOOP (back to $0313)

        // CHROUT routine at $0330
        program.push(...new Array(0x30 - program.length).fill(0xEA)); // Fill with NOPs

        // CHROUT - same implementation as ROM BASIC
        // Input: A = character to output
        program.push(0x48);             // PHA - save character

        // Check for special characters
        program.push(0xC9, 0x03);       // CMP #$03 (clear screen)
        program.push(0xD0, 0x1D);       // BNE NOT_CLEAR (+29 bytes)
        // Clear screen - fill with spaces
        program.push(0xA9, 0x20);       // LDA #$20 (space character)
        program.push(0xA2, 0x00);       // LDX #$00
        program.push(0xA0, 0x04);       // LDY #$04 (4 pages = 1024 bytes)
        // CLEAR_LOOP at $033B
        program.push(0x9D, 0x00, 0xD0); // STA $D000,X
        program.push(0x9D, 0x00, 0xD1); // STA $D100,X
        program.push(0x9D, 0x00, 0xD2); // STA $D200,X
        program.push(0x9D, 0x00, 0xD3); // STA $D300,X
        program.push(0xE8);             // INX
        program.push(0xD0, 0xF1);       // BNE CLEAR_LOOP
        // Reset cursor
        program.push(0xA9, 0x00);       // LDA #$00
        program.push(0x85, 0xD0);       // STA $D0 (cursor X = 0)
        program.push(0x85, 0xD1);       // STA $D1 (cursor Y = 0)
        program.push(0x68);             // PLA
        program.push(0x60);             // RTS

        // NOT_CLEAR - handle carriage return
        program.push(0xC9, 0x0D);       // CMP #$0D (carriage return)
        program.push(0xD0, 0x06);       // BNE NOT_CR
        program.push(0xA9, 0x00);       // LDA #$00
        program.push(0x85, 0xD0);       // STA $D0 (cursor X = 0)
        program.push(0x68);             // PLA
        program.push(0x60);             // RTS

        // NOT_CR - handle line feed
        program.push(0xC9, 0x0A);       // CMP #$0A (line feed)
        program.push(0xD0, 0x0A);       // BNE NOT_LF
        program.push(0xA5, 0xD1);       // LDA $D1 (cursor Y)
        program.push(0xC9, 0x1F);       // CMP #$1F (max row)
        program.push(0xB0, 0x02);       // BCS SKIP_INC
        program.push(0xE6, 0xD1);       // INC $D1
        program.push(0x68);             // PLA
        program.push(0x60);             // RTS

        // NOT_LF - normal character output
        program.push(0x68);             // PLA - restore character
        program.push(0x48);             // PHA - save it again

        // Calculate screen address: Y * 32 + X
        program.push(0xA5, 0xD1);       // LDA $D1 (cursor Y)
        program.push(0x0A);             // ASL (Y * 2)
        program.push(0x0A);             // ASL (Y * 4)
        program.push(0x0A);             // ASL (Y * 8)
        program.push(0x0A);             // ASL (Y * 16)
        program.push(0x0A);             // ASL (Y * 32)
        program.push(0x85, 0xD2);       // STA $D2 (temp)

        program.push(0x18);             // CLC
        program.push(0x65, 0xD0);       // ADC $D0 (add cursor X)
        program.push(0x85, 0xD3);       // STA $D3 (low byte of offset)
        program.push(0xA9, 0x00);       // LDA #$00
        program.push(0x85, 0xD4);       // STA $D4 (high byte of offset)

        // Add screen base ($D000)
        program.push(0x18);             // CLC
        program.push(0xA5, 0xD3);       // LDA $D3
        program.push(0x69, 0x00);       // ADC #$00
        program.push(0x85, 0xD3);       // STA $D3
        program.push(0xA5, 0xD4);       // LDA $D4
        program.push(0x69, 0xD0);       // ADC #$D0
        program.push(0x85, 0xD4);       // STA $D4

        // Write character to screen using indirect addressing
        program.push(0x68);             // PLA - restore character
        program.push(0xA0, 0x00);       // LDY #$00
        program.push(0x91, 0xD3);       // STA ($D3),Y

        // Advance cursor
        program.push(0xE6, 0xD0);       // INC $D0 (cursor X)
        program.push(0xA5, 0xD0);       // LDA $D0
        program.push(0xC9, 0x20);       // CMP #$20 (32 columns)
        program.push(0x90, 0x08);       // BCC NO_WRAP
        // Wrap to next line
        program.push(0xA9, 0x00);       // LDA #$00
        program.push(0x85, 0xD0);       // STA $D0 (cursor X = 0)
        program.push(0xE6, 0xD1);       // INC $D1 (cursor Y)

        // NO_WRAP
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
