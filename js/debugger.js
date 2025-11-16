/**
 * Debugging Tools
 *
 * Memory viewer, register display, disassembler, breakpoints
 */

class Disassembler {
    constructor() {
        this.opcodeNames = this.initOpcodeNames();
    }

    initOpcodeNames() {
        const names = new Array(256).fill('???');

        // Load/Store
        names[0xA9] = 'LDA #$%02X'; names[0xA5] = 'LDA $%02X'; names[0xB5] = 'LDA $%02X,X';
        names[0xAD] = 'LDA $%04X'; names[0xBD] = 'LDA $%04X,X'; names[0xB9] = 'LDA $%04X,Y';
        names[0xA1] = 'LDA ($%02X,X)'; names[0xB1] = 'LDA ($%02X),Y';

        names[0xA2] = 'LDX #$%02X'; names[0xA6] = 'LDX $%02X'; names[0xB6] = 'LDX $%02X,Y';
        names[0xAE] = 'LDX $%04X'; names[0xBE] = 'LDX $%04X,Y';

        names[0xA0] = 'LDY #$%02X'; names[0xA4] = 'LDY $%02X'; names[0xB4] = 'LDY $%02X,X';
        names[0xAC] = 'LDY $%04X'; names[0xBC] = 'LDY $%04X,X';

        names[0x85] = 'STA $%02X'; names[0x95] = 'STA $%02X,X'; names[0x8D] = 'STA $%04X';
        names[0x9D] = 'STA $%04X,X'; names[0x99] = 'STA $%04X,Y';
        names[0x81] = 'STA ($%02X,X)'; names[0x91] = 'STA ($%02X),Y';

        names[0x86] = 'STX $%02X'; names[0x96] = 'STX $%02X,Y'; names[0x8E] = 'STX $%04X';
        names[0x84] = 'STY $%02X'; names[0x94] = 'STY $%02X,X'; names[0x8C] = 'STY $%04X';

        // Transfer
        names[0xAA] = 'TAX'; names[0xA8] = 'TAY'; names[0x8A] = 'TXA'; names[0x98] = 'TYA';
        names[0xBA] = 'TSX'; names[0x9A] = 'TXS';

        // Stack
        names[0x48] = 'PHA'; names[0x08] = 'PHP'; names[0x68] = 'PLA'; names[0x28] = 'PLP';

        // Logic
        names[0x29] = 'AND #$%02X'; names[0x25] = 'AND $%02X'; names[0x35] = 'AND $%02X,X';
        names[0x2D] = 'AND $%04X'; names[0x3D] = 'AND $%04X,X'; names[0x39] = 'AND $%04X,Y';
        names[0x21] = 'AND ($%02X,X)'; names[0x31] = 'AND ($%02X),Y';

        names[0x49] = 'EOR #$%02X'; names[0x45] = 'EOR $%02X'; names[0x55] = 'EOR $%02X,X';
        names[0x4D] = 'EOR $%04X'; names[0x5D] = 'EOR $%04X,X'; names[0x59] = 'EOR $%04X,Y';
        names[0x41] = 'EOR ($%02X,X)'; names[0x51] = 'EOR ($%02X),Y';

        names[0x09] = 'ORA #$%02X'; names[0x05] = 'ORA $%02X'; names[0x15] = 'ORA $%02X,X';
        names[0x0D] = 'ORA $%04X'; names[0x1D] = 'ORA $%04X,X'; names[0x19] = 'ORA $%04X,Y';
        names[0x01] = 'ORA ($%02X,X)'; names[0x11] = 'ORA ($%02X),Y';

        names[0x24] = 'BIT $%02X'; names[0x2C] = 'BIT $%04X';

        // Arithmetic
        names[0x69] = 'ADC #$%02X'; names[0x65] = 'ADC $%02X'; names[0x75] = 'ADC $%02X,X';
        names[0x6D] = 'ADC $%04X'; names[0x7D] = 'ADC $%04X,X'; names[0x79] = 'ADC $%04X,Y';
        names[0x61] = 'ADC ($%02X,X)'; names[0x71] = 'ADC ($%02X),Y';

        names[0xE9] = 'SBC #$%02X'; names[0xE5] = 'SBC $%02X'; names[0xF5] = 'SBC $%02X,X';
        names[0xED] = 'SBC $%04X'; names[0xFD] = 'SBC $%04X,X'; names[0xF9] = 'SBC $%04X,Y';
        names[0xE1] = 'SBC ($%02X,X)'; names[0xF1] = 'SBC ($%02X),Y';

        names[0xC9] = 'CMP #$%02X'; names[0xC5] = 'CMP $%02X'; names[0xD5] = 'CMP $%02X,X';
        names[0xCD] = 'CMP $%04X'; names[0xDD] = 'CMP $%04X,X'; names[0xD9] = 'CMP $%04X,Y';
        names[0xC1] = 'CMP ($%02X,X)'; names[0xD1] = 'CMP ($%02X),Y';

        names[0xE0] = 'CPX #$%02X'; names[0xE4] = 'CPX $%02X'; names[0xEC] = 'CPX $%04X';
        names[0xC0] = 'CPY #$%02X'; names[0xC4] = 'CPY $%02X'; names[0xCC] = 'CPY $%04X';

        // Inc/Dec
        names[0xE6] = 'INC $%02X'; names[0xF6] = 'INC $%02X,X';
        names[0xEE] = 'INC $%04X'; names[0xFE] = 'INC $%04X,X';
        names[0xE8] = 'INX'; names[0xC8] = 'INY';

        names[0xC6] = 'DEC $%02X'; names[0xD6] = 'DEC $%02X,X';
        names[0xCE] = 'DEC $%04X'; names[0xDE] = 'DEC $%04X,X';
        names[0xCA] = 'DEX'; names[0x88] = 'DEY';

        // Shifts
        names[0x0A] = 'ASL A'; names[0x06] = 'ASL $%02X'; names[0x16] = 'ASL $%02X,X';
        names[0x0E] = 'ASL $%04X'; names[0x1E] = 'ASL $%04X,X';

        names[0x4A] = 'LSR A'; names[0x46] = 'LSR $%02X'; names[0x56] = 'LSR $%02X,X';
        names[0x4E] = 'LSR $%04X'; names[0x5E] = 'LSR $%04X,X';

        names[0x2A] = 'ROL A'; names[0x26] = 'ROL $%02X'; names[0x36] = 'ROL $%02X,X';
        names[0x2E] = 'ROL $%04X'; names[0x3E] = 'ROL $%04X,X';

        names[0x6A] = 'ROR A'; names[0x66] = 'ROR $%02X'; names[0x76] = 'ROR $%02X,X';
        names[0x6E] = 'ROR $%04X'; names[0x7E] = 'ROR $%04X,X';

        // Branches
        names[0x10] = 'BPL $%04X'; names[0x30] = 'BMI $%04X'; names[0x50] = 'BVC $%04X';
        names[0x70] = 'BVS $%04X'; names[0x90] = 'BCC $%04X'; names[0xB0] = 'BCS $%04X';
        names[0xD0] = 'BNE $%04X'; names[0xF0] = 'BEQ $%04X';

        // Jumps
        names[0x4C] = 'JMP $%04X'; names[0x6C] = 'JMP ($%04X)';
        names[0x20] = 'JSR $%04X'; names[0x60] = 'RTS'; names[0x40] = 'RTI';

        // System
        names[0x00] = 'BRK'; names[0xEA] = 'NOP';

        // Flags
        names[0x18] = 'CLC'; names[0xD8] = 'CLD'; names[0x58] = 'CLI'; names[0xB8] = 'CLV';
        names[0x38] = 'SEC'; names[0xF8] = 'SED'; names[0x78] = 'SEI';

        return names;
    }

    disassemble(cpu, addr, count = 1) {
        const instructions = [];

        for (let i = 0; i < count; i++) {
            const opcode = cpu.read(addr);
            const format = this.opcodeNames[opcode];
            let instruction = format;
            let bytes = [opcode];
            let length = 1;

            // Determine instruction length and format operands
            if (format.includes('%04X')) {
                // 16-bit operand
                const lo = cpu.read(addr + 1);
                const hi = cpu.read(addr + 2);
                const value = (hi << 8) | lo;
                bytes.push(lo, hi);
                length = 3;

                // For branches, calculate target
                if (format.includes('B') && format.length < 10) {
                    const offset = lo > 127 ? lo - 256 : lo;
                    const target = (addr + 2 + offset) & 0xFFFF;
                    instruction = format.replace('%04X', target.toString(16).toUpperCase().padStart(4, '0'));
                } else {
                    instruction = format.replace('%04X', value.toString(16).toUpperCase().padStart(4, '0'));
                }
            } else if (format.includes('%02X')) {
                // 8-bit operand
                const value = cpu.read(addr + 1);
                bytes.push(value);
                length = 2;
                instruction = format.replace('%02X', value.toString(16).toUpperCase().padStart(2, '0'));
            }

            instructions.push({
                addr: addr,
                opcode: opcode,
                bytes: bytes,
                instruction: instruction,
                length: length
            });

            addr += length;
        }

        return instructions;
    }

    disassembleToString(cpu, addr, count = 1) {
        const instructions = this.disassemble(cpu, addr, count);
        return instructions.map(inst => {
            const addrStr = inst.addr.toString(16).toUpperCase().padStart(4, '0');
            const bytesStr = inst.bytes.map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ').padEnd(9);
            return `${addrStr}: ${bytesStr} ${inst.instruction}`;
        }).join('\n');
    }
}

class Debugger {
    constructor(cpu) {
        this.cpu = cpu;
        this.disassembler = new Disassembler();

        // Breakpoints
        this.breakpoints = new Set();

        // Execution control
        this.stepMode = false;
        this.running = true;

        // Callbacks
        this.onBreakpoint = null;
        this.onStep = null;
    }

    addBreakpoint(addr) {
        this.breakpoints.add(addr);
    }

    removeBreakpoint(addr) {
        this.breakpoints.delete(addr);
    }

    toggleBreakpoint(addr) {
        if (this.breakpoints.has(addr)) {
            this.breakpoints.delete(addr);
        } else {
            this.breakpoints.add(addr);
        }
    }

    clearBreakpoints() {
        this.breakpoints.clear();
    }

    hasBreakpoint(addr) {
        return this.breakpoints.has(addr);
    }

    checkBreakpoint() {
        if (this.breakpoints.has(this.cpu.PC)) {
            this.running = false;
            if (this.onBreakpoint) {
                this.onBreakpoint(this.cpu.PC);
            }
            return true;
        }
        return false;
    }

    step() {
        if (!this.running && this.onStep) {
            this.onStep();
        }
        const cycles = this.cpu.step();
        this.checkBreakpoint();
        return cycles;
    }

    continue() {
        this.running = true;
    }

    pause() {
        this.running = false;
    }

    getRegisters() {
        return {
            PC: this.cpu.PC,
            SP: this.cpu.SP,
            A: this.cpu.A,
            X: this.cpu.X,
            Y: this.cpu.Y,
            P: this.cpu.P,
            flags: {
                C: this.cpu.getFlag(this.cpu.FLAG_C),
                Z: this.cpu.getFlag(this.cpu.FLAG_Z),
                I: this.cpu.getFlag(this.cpu.FLAG_I),
                D: this.cpu.getFlag(this.cpu.FLAG_D),
                B: this.cpu.getFlag(this.cpu.FLAG_B),
                V: this.cpu.getFlag(this.cpu.FLAG_V),
                N: this.cpu.getFlag(this.cpu.FLAG_N)
            }
        };
    }

    getMemoryDump(addr, length) {
        const data = [];
        for (let i = 0; i < length; i++) {
            data.push(this.cpu.read(addr + i));
        }
        return data;
    }

    formatMemoryDump(addr, length, bytesPerRow = 16) {
        const lines = [];
        for (let i = 0; i < length; i += bytesPerRow) {
            const rowAddr = addr + i;
            const rowLength = Math.min(bytesPerRow, length - i);
            const bytes = this.getMemoryDump(rowAddr, rowLength);

            const addrStr = rowAddr.toString(16).toUpperCase().padStart(4, '0');
            const hexStr = bytes.map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
            const asciiStr = bytes.map(b => (b >= 32 && b < 127) ? String.fromCharCode(b) : '.').join('');

            lines.push(`${addrStr}: ${hexStr.padEnd(bytesPerRow * 3)} ${asciiStr}`);
        }
        return lines.join('\n');
    }

    getStack() {
        const stack = [];
        for (let i = 0xFF; i > this.cpu.SP; i--) {
            stack.push(this.cpu.read(0x0100 | i));
        }
        return stack;
    }

    disassembleAt(addr, count = 10) {
        return this.disassembler.disassemble(this.cpu, addr, count);
    }

    disassembleAtToString(addr, count = 10) {
        return this.disassembler.disassembleToString(this.cpu, addr, count);
    }
}
