/**
 * 6502 Assembler
 *
 * Assembles 6502 assembly language source code into binary
 * Supports the syntax used in HEXDOS.ASM
 */

class Assembler6502 {
    constructor() {
        // Opcode table: mnemonic -> { mode -> opcode }
        this.opcodes = this.initOpcodes();

        // Symbol table
        this.symbols = {};

        // Current address
        this.pc = 0;

        // Output binary
        this.binary = [];

        // Errors
        this.errors = [];

        // Pass number
        this.pass = 1;
    }

    initOpcodes() {
        return {
            // Load/Store
            'LDA': { 'IMM': 0xA9, 'ZP': 0xA5, 'ZPX': 0xB5, 'ABS': 0xAD, 'ABX': 0xBD, 'ABY': 0xB9, 'IDX': 0xA1, 'IDY': 0xB1 },
            'LDX': { 'IMM': 0xA2, 'ZP': 0xA6, 'ZPY': 0xB6, 'ABS': 0xAE, 'ABY': 0xBE },
            'LDY': { 'IMM': 0xA0, 'ZP': 0xA4, 'ZPX': 0xB4, 'ABS': 0xAC, 'ABX': 0xBC },
            'STA': { 'ZP': 0x85, 'ZPX': 0x95, 'ABS': 0x8D, 'ABX': 0x9D, 'ABY': 0x99, 'IDX': 0x81, 'IDY': 0x91 },
            'STX': { 'ZP': 0x86, 'ZPY': 0x96, 'ABS': 0x8E },
            'STY': { 'ZP': 0x84, 'ZPX': 0x94, 'ABS': 0x8C },

            // Transfer
            'TAX': { 'IMP': 0xAA }, 'TAY': { 'IMP': 0xA8 }, 'TXA': { 'IMP': 0x8A }, 'TYA': { 'IMP': 0x98 },
            'TSX': { 'IMP': 0xBA }, 'TXS': { 'IMP': 0x9A },

            // Stack
            'PHA': { 'IMP': 0x48 }, 'PHP': { 'IMP': 0x08 }, 'PLA': { 'IMP': 0x68 }, 'PLP': { 'IMP': 0x28 },

            // Logic
            'AND': { 'IMM': 0x29, 'ZP': 0x25, 'ZPX': 0x35, 'ABS': 0x2D, 'ABX': 0x3D, 'ABY': 0x39, 'IDX': 0x21, 'IDY': 0x31 },
            'EOR': { 'IMM': 0x49, 'ZP': 0x45, 'ZPX': 0x55, 'ABS': 0x4D, 'ABX': 0x5D, 'ABY': 0x59, 'IDX': 0x41, 'IDY': 0x51 },
            'ORA': { 'IMM': 0x09, 'ZP': 0x05, 'ZPX': 0x15, 'ABS': 0x0D, 'ABX': 0x1D, 'ABY': 0x19, 'IDX': 0x01, 'IDY': 0x11 },
            'BIT': { 'ZP': 0x24, 'ABS': 0x2C },

            // Arithmetic
            'ADC': { 'IMM': 0x69, 'ZP': 0x65, 'ZPX': 0x75, 'ABS': 0x6D, 'ABX': 0x7D, 'ABY': 0x79, 'IDX': 0x61, 'IDY': 0x71 },
            'SBC': { 'IMM': 0xE9, 'ZP': 0xE5, 'ZPX': 0xF5, 'ABS': 0xED, 'ABX': 0xFD, 'ABY': 0xF9, 'IDX': 0xE1, 'IDY': 0xF1 },
            'CMP': { 'IMM': 0xC9, 'ZP': 0xC5, 'ZPX': 0xD5, 'ABS': 0xCD, 'ABX': 0xDD, 'ABY': 0xD9, 'IDX': 0xC1, 'IDY': 0xD1 },
            'CPX': { 'IMM': 0xE0, 'ZP': 0xE4, 'ABS': 0xEC },
            'CPY': { 'IMM': 0xC0, 'ZP': 0xC4, 'ABS': 0xCC },

            // Inc/Dec
            'INC': { 'ZP': 0xE6, 'ZPX': 0xF6, 'ABS': 0xEE, 'ABX': 0xFE },
            'INX': { 'IMP': 0xE8 }, 'INY': { 'IMP': 0xC8 },
            'DEC': { 'ZP': 0xC6, 'ZPX': 0xD6, 'ABS': 0xCE, 'ABX': 0xDE },
            'DEX': { 'IMP': 0xCA }, 'DEY': { 'IMP': 0x88 },

            // Shifts
            'ASL': { 'ACC': 0x0A, 'ZP': 0x06, 'ZPX': 0x16, 'ABS': 0x0E, 'ABX': 0x1E },
            'LSR': { 'ACC': 0x4A, 'ZP': 0x46, 'ZPX': 0x56, 'ABS': 0x4E, 'ABX': 0x5E },
            'ROL': { 'ACC': 0x2A, 'ZP': 0x26, 'ZPX': 0x36, 'ABS': 0x2E, 'ABX': 0x3E },
            'ROR': { 'ACC': 0x6A, 'ZP': 0x66, 'ZPX': 0x76, 'ABS': 0x6E, 'ABX': 0x7E },

            // Jumps/Branches
            'JMP': { 'ABS': 0x4C, 'IND': 0x6C },
            'JSR': { 'ABS': 0x20 },
            'RTS': { 'IMP': 0x60 },
            'BCC': { 'REL': 0x90 }, 'BCS': { 'REL': 0xB0 }, 'BEQ': { 'REL': 0xF0 }, 'BMI': { 'REL': 0x30 },
            'BNE': { 'REL': 0xD0 }, 'BPL': { 'REL': 0x10 }, 'BVC': { 'REL': 0x50 }, 'BVS': { 'REL': 0x70 },

            // System
            'BRK': { 'IMP': 0x00 }, 'RTI': { 'IMP': 0x40 }, 'NOP': { 'IMP': 0xEA },

            // Flags
            'CLC': { 'IMP': 0x18 }, 'CLD': { 'IMP': 0xD8 }, 'CLI': { 'IMP': 0x58 }, 'CLV': { 'IMP': 0xB8 },
            'SEC': { 'IMP': 0x38 }, 'SED': { 'IMP': 0xF8 }, 'SEI': { 'IMP': 0x78 }
        };
    }

    assemble(source) {
        // Reset state
        this.symbols = {};
        this.errors = [];
        this.binary = [];

        // First pass: collect symbols
        this.pass = 1;
        this.pc = 0;
        this.processSource(source);

        // Second pass: generate code
        this.pass = 2;
        this.pc = 0;
        this.binary = [];
        this.processSource(source);

        if (this.errors.length > 0) {
            console.error('Assembly errors:', this.errors);
            return null;
        }

        return new Uint8Array(this.binary);
    }

    processSource(source) {
        const lines = source.split('\n');

        for (let lineNum = 0; lineNum < lines.length; lineNum++) {
            let line = lines[lineNum].trim();

            // Remove comments
            const commentIndex = line.indexOf(';');
            if (commentIndex >= 0) {
                line = line.substring(0, commentIndex).trim();
            }

            if (line.length === 0) continue;

            try {
                this.processLine(line, lineNum + 1);
            } catch (e) {
                this.errors.push({ line: lineNum + 1, message: e.message });
            }
        }
    }

    processLine(line, lineNum) {
        // Check for label
        let label = null;
        if (line.match(/^[A-Za-z_][A-Za-z0-9_]*:/)) {
            const colonIndex = line.indexOf(':');
            label = line.substring(0, colonIndex);
            line = line.substring(colonIndex + 1).trim();

            if (this.pass === 1) {
                this.symbols[label] = this.pc;
            }
        }

        // Check for label without colon (common in 6502 assembly)
        const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s+(.+)$/);
        if (match && !this.opcodes[match[1]]) {
            label = match[1];
            line = match[2];

            if (this.pass === 1) {
                this.symbols[label] = this.pc;
            }
        }

        if (line.length === 0) return;

        // Check for directives
        if (line.startsWith('*=') || line.startsWith('ORG')) {
            const addrStr = line.split(/[=\s]+/)[1];
            this.pc = this.parseNumber(addrStr);
            return;
        }

        if (line.startsWith('.BYTE') || line.startsWith('DCB')) {
            const data = line.substring(line.indexOf(' ')).trim();
            const bytes = data.split(',').map(b => this.parseNumber(b.trim()));
            if (this.pass === 2) {
                this.binary.push(...bytes);
            }
            this.pc += bytes.length;
            return;
        }

        if (line.startsWith('.WORD') || line.startsWith('DCW')) {
            const data = line.substring(line.indexOf(' ')).trim();
            const words = data.split(',').map(w => this.parseNumber(w.trim()));
            if (this.pass === 2) {
                words.forEach(w => {
                    this.binary.push(w & 0xFF);
                    this.binary.push((w >> 8) & 0xFF);
                });
            }
            this.pc += words.length * 2;
            return;
        }

        // Parse instruction
        const parts = line.split(/\s+/);
        const mnemonic = parts[0].toUpperCase();
        const operand = parts.slice(1).join(' ').trim();

        if (!this.opcodes[mnemonic]) {
            // Check if it's an assignment (label = value)
            if (line.includes('=')) {
                const eqParts = line.split('=');
                const symbol = eqParts[0].trim();
                const value = this.parseNumber(eqParts[1].trim());
                if (this.pass === 1) {
                    this.symbols[symbol] = value;
                }
                return;
            }
            throw new Error(`Unknown mnemonic: ${mnemonic}`);
        }

        this.assembleInstruction(mnemonic, operand);
    }

    assembleInstruction(mnemonic, operand) {
        const { mode, bytes } = this.parseOperand(mnemonic, operand);
        const opcode = this.opcodes[mnemonic][mode];

        if (opcode === undefined) {
            throw new Error(`Invalid addressing mode for ${mnemonic}: ${mode}`);
        }

        if (this.pass === 2) {
            this.binary.push(opcode);
            bytes.forEach(b => this.binary.push(b));
        }

        this.pc += 1 + bytes.length;
    }

    parseOperand(mnemonic, operand) {
        if (!operand || operand.length === 0) {
            return { mode: 'IMP', bytes: [] };
        }

        // Accumulator
        if (operand === 'A') {
            return { mode: 'ACC', bytes: [] };
        }

        // Immediate
        if (operand.startsWith('#')) {
            const value = this.parseNumber(operand.substring(1));
            return { mode: 'IMM', bytes: [value & 0xFF] };
        }

        // Indirect indexed (addr),Y
        if (operand.match(/^\(.+\),Y$/i)) {
            const addr = operand.substring(1, operand.length - 3).trim();
            const value = this.parseNumber(addr);
            return { mode: 'IDY', bytes: [value & 0xFF] };
        }

        // Indexed indirect (addr,X)
        if (operand.match(/^\(.+,X\)$/i)) {
            const addr = operand.substring(1, operand.length - 3).trim();
            const value = this.parseNumber(addr);
            return { mode: 'IDX', bytes: [value & 0xFF] };
        }

        // Indirect (addr)
        if (operand.match(/^\(.+\)$/)) {
            const addr = operand.substring(1, operand.length - 1).trim();
            const value = this.parseNumber(addr);
            return { mode: 'IND', bytes: [value & 0xFF, (value >> 8) & 0xFF] };
        }

        // Indexed ,X or ,Y
        if (operand.match(/,X$/i)) {
            const addr = operand.substring(0, operand.length - 2).trim();
            const value = this.parseNumber(addr);
            if (value < 256) {
                return { mode: 'ZPX', bytes: [value & 0xFF] };
            } else {
                return { mode: 'ABX', bytes: [value & 0xFF, (value >> 8) & 0xFF] };
            }
        }

        if (operand.match(/,Y$/i)) {
            const addr = operand.substring(0, operand.length - 2).trim();
            const value = this.parseNumber(addr);
            if (value < 256) {
                return { mode: 'ZPY', bytes: [value & 0xFF] };
            } else {
                return { mode: 'ABY', bytes: [value & 0xFF, (value >> 8) & 0xFF] };
            }
        }

        // Relative (for branches)
        const branchOps = ['BCC', 'BCS', 'BEQ', 'BMI', 'BNE', 'BPL', 'BVC', 'BVS'];
        if (branchOps.includes(mnemonic)) {
            const target = this.parseNumber(operand);
            const offset = target - (this.pc + 2);
            if (offset < -128 || offset > 127) {
                throw new Error('Branch out of range');
            }
            return { mode: 'REL', bytes: [offset & 0xFF] };
        }

        // Absolute or Zero Page
        const value = this.parseNumber(operand);
        if (value < 256) {
            return { mode: 'ZP', bytes: [value & 0xFF] };
        } else {
            return { mode: 'ABS', bytes: [value & 0xFF, (value >> 8) & 0xFF] };
        }
    }

    parseNumber(str) {
        str = str.trim();

        // Check if it's a symbol
        if (this.symbols[str] !== undefined) {
            return this.symbols[str];
        }

        // Hex with $
        if (str.startsWith('$')) {
            return parseInt(str.substring(1), 16);
        }

        // Hex with 0x
        if (str.startsWith('0x') || str.startsWith('0X')) {
            return parseInt(str.substring(2), 16);
        }

        // Binary with %
        if (str.startsWith('%')) {
            return parseInt(str.substring(1), 2);
        }

        // Decimal
        return parseInt(str, 10);
    }
}
