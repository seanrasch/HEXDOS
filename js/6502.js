/**
 * MOS 6502 CPU Emulator
 *
 * A JavaScript implementation of the 6502 microprocessor
 * for running historical software in the browser.
 */

class CPU6502 {
    constructor() {
        // Registers
        this.PC = 0;      // Program Counter
        this.SP = 0;      // Stack Pointer
        this.A = 0;       // Accumulator
        this.X = 0;       // X Index Register
        this.Y = 0;       // Y Index Register
        this.P = 0;       // Processor Status

        // Status flags
        this.FLAG_C = 0x01;  // Carry
        this.FLAG_Z = 0x02;  // Zero
        this.FLAG_I = 0x04;  // Interrupt Disable
        this.FLAG_D = 0x08;  // Decimal Mode
        this.FLAG_B = 0x10;  // Break
        this.FLAG_U = 0x20;  // Unused (always 1)
        this.FLAG_V = 0x40;  // Overflow
        this.FLAG_N = 0x80;  // Negative

        // Memory
        this.memory = new Uint8Array(65536);

        // Cycle counter
        this.cycles = 0;

        // Halt flag
        this.halted = false;

        // Memory-mapped I/O callbacks
        this.readCallbacks = {};
        this.writeCallbacks = {};
    }

    reset() {
        this.A = 0;
        this.X = 0;
        this.Y = 0;
        this.SP = 0xFD;
        this.P = this.FLAG_U | this.FLAG_I;
        this.PC = this.read16(0xFFFC);
        this.cycles = 0;
        this.halted = false;
    }

    // Memory access
    read(addr) {
        addr &= 0xFFFF;
        if (this.readCallbacks[addr]) {
            return this.readCallbacks[addr]();
        }
        return this.memory[addr];
    }

    write(addr, value) {
        addr &= 0xFFFF;
        value &= 0xFF;
        if (this.writeCallbacks[addr]) {
            this.writeCallbacks[addr](value);
        }
        this.memory[addr] = value;
    }

    read16(addr) {
        const lo = this.read(addr);
        const hi = this.read(addr + 1);
        return (hi << 8) | lo;
    }

    // Stack operations
    push(value) {
        this.write(0x0100 | this.SP, value);
        this.SP = (this.SP - 1) & 0xFF;
    }

    pop() {
        this.SP = (this.SP + 1) & 0xFF;
        return this.read(0x0100 | this.SP);
    }

    push16(value) {
        this.push((value >> 8) & 0xFF);
        this.push(value & 0xFF);
    }

    pop16() {
        const lo = this.pop();
        const hi = this.pop();
        return (hi << 8) | lo;
    }

    // Flag operations
    setFlag(flag, value) {
        if (value) {
            this.P |= flag;
        } else {
            this.P &= ~flag;
        }
    }

    getFlag(flag) {
        return (this.P & flag) !== 0;
    }

    updateZN(value) {
        this.setFlag(this.FLAG_Z, (value & 0xFF) === 0);
        this.setFlag(this.FLAG_N, (value & 0x80) !== 0);
    }

    // Addressing modes
    immediate() {
        return this.PC++;
    }

    zeroPage() {
        return this.read(this.PC++);
    }

    zeroPageX() {
        return (this.read(this.PC++) + this.X) & 0xFF;
    }

    zeroPageY() {
        return (this.read(this.PC++) + this.Y) & 0xFF;
    }

    absolute() {
        const addr = this.read16(this.PC);
        this.PC += 2;
        return addr;
    }

    absoluteX(extraCycle = true) {
        const base = this.read16(this.PC);
        this.PC += 2;
        const addr = (base + this.X) & 0xFFFF;
        if (extraCycle && (addr & 0xFF00) !== (base & 0xFF00)) {
            this.cycles++;
        }
        return addr;
    }

    absoluteY(extraCycle = true) {
        const base = this.read16(this.PC);
        this.PC += 2;
        const addr = (base + this.Y) & 0xFFFF;
        if (extraCycle && (addr & 0xFF00) !== (base & 0xFF00)) {
            this.cycles++;
        }
        return addr;
    }

    indirect() {
        const ptr = this.read16(this.PC);
        this.PC += 2;
        // 6502 bug: page boundary wrap
        if ((ptr & 0xFF) === 0xFF) {
            const lo = this.read(ptr);
            const hi = this.read(ptr & 0xFF00);
            return (hi << 8) | lo;
        }
        return this.read16(ptr);
    }

    indexedIndirect() {
        const ptr = (this.read(this.PC++) + this.X) & 0xFF;
        return this.read16(ptr);
    }

    indirectIndexed(extraCycle = true) {
        const ptr = this.read(this.PC++);
        const base = this.read16(ptr);
        const addr = (base + this.Y) & 0xFFFF;
        if (extraCycle && (addr & 0xFF00) !== (base & 0xFF00)) {
            this.cycles++;
        }
        return addr;
    }

    relative() {
        let offset = this.read(this.PC++);
        if (offset & 0x80) {
            offset -= 256;
        }
        return (this.PC + offset) & 0xFFFF;
    }

    // Execute one instruction
    step() {
        if (this.halted) {
            return 1;
        }

        const opcode = this.read(this.PC++);
        this.cycles = 0;

        this.execute(opcode);

        return this.cycles;
    }

    execute(opcode) {
        switch (opcode) {
            // LDA
            case 0xA9: this.cycles = 2; this.A = this.read(this.immediate()); this.updateZN(this.A); break;
            case 0xA5: this.cycles = 3; this.A = this.read(this.zeroPage()); this.updateZN(this.A); break;
            case 0xB5: this.cycles = 4; this.A = this.read(this.zeroPageX()); this.updateZN(this.A); break;
            case 0xAD: this.cycles = 4; this.A = this.read(this.absolute()); this.updateZN(this.A); break;
            case 0xBD: this.cycles = 4; this.A = this.read(this.absoluteX()); this.updateZN(this.A); break;
            case 0xB9: this.cycles = 4; this.A = this.read(this.absoluteY()); this.updateZN(this.A); break;
            case 0xA1: this.cycles = 6; this.A = this.read(this.indexedIndirect()); this.updateZN(this.A); break;
            case 0xB1: this.cycles = 5; this.A = this.read(this.indirectIndexed()); this.updateZN(this.A); break;

            // LDX
            case 0xA2: this.cycles = 2; this.X = this.read(this.immediate()); this.updateZN(this.X); break;
            case 0xA6: this.cycles = 3; this.X = this.read(this.zeroPage()); this.updateZN(this.X); break;
            case 0xB6: this.cycles = 4; this.X = this.read(this.zeroPageY()); this.updateZN(this.X); break;
            case 0xAE: this.cycles = 4; this.X = this.read(this.absolute()); this.updateZN(this.X); break;
            case 0xBE: this.cycles = 4; this.X = this.read(this.absoluteY()); this.updateZN(this.X); break;

            // LDY
            case 0xA0: this.cycles = 2; this.Y = this.read(this.immediate()); this.updateZN(this.Y); break;
            case 0xA4: this.cycles = 3; this.Y = this.read(this.zeroPage()); this.updateZN(this.Y); break;
            case 0xB4: this.cycles = 4; this.Y = this.read(this.zeroPageX()); this.updateZN(this.Y); break;
            case 0xAC: this.cycles = 4; this.Y = this.read(this.absolute()); this.updateZN(this.Y); break;
            case 0xBC: this.cycles = 4; this.Y = this.read(this.absoluteX()); this.updateZN(this.Y); break;

            // STA
            case 0x85: this.cycles = 3; this.write(this.zeroPage(), this.A); break;
            case 0x95: this.cycles = 4; this.write(this.zeroPageX(), this.A); break;
            case 0x8D: this.cycles = 4; this.write(this.absolute(), this.A); break;
            case 0x9D: this.cycles = 5; this.write(this.absoluteX(false), this.A); break;
            case 0x99: this.cycles = 5; this.write(this.absoluteY(false), this.A); break;
            case 0x81: this.cycles = 6; this.write(this.indexedIndirect(), this.A); break;
            case 0x91: this.cycles = 6; this.write(this.indirectIndexed(false), this.A); break;

            // STX
            case 0x86: this.cycles = 3; this.write(this.zeroPage(), this.X); break;
            case 0x96: this.cycles = 4; this.write(this.zeroPageY(), this.X); break;
            case 0x8E: this.cycles = 4; this.write(this.absolute(), this.X); break;

            // STY
            case 0x84: this.cycles = 3; this.write(this.zeroPage(), this.Y); break;
            case 0x94: this.cycles = 4; this.write(this.zeroPageX(), this.Y); break;
            case 0x8C: this.cycles = 4; this.write(this.absolute(), this.Y); break;

            // Transfer
            case 0xAA: this.cycles = 2; this.X = this.A; this.updateZN(this.X); break; // TAX
            case 0x8A: this.cycles = 2; this.A = this.X; this.updateZN(this.A); break; // TXA
            case 0xA8: this.cycles = 2; this.Y = this.A; this.updateZN(this.Y); break; // TAY
            case 0x98: this.cycles = 2; this.A = this.Y; this.updateZN(this.A); break; // TYA
            case 0xBA: this.cycles = 2; this.X = this.SP; this.updateZN(this.X); break; // TSX
            case 0x9A: this.cycles = 2; this.SP = this.X; break; // TXS

            // Stack
            case 0x48: this.cycles = 3; this.push(this.A); break; // PHA
            case 0x68: this.cycles = 4; this.A = this.pop(); this.updateZN(this.A); break; // PLA
            case 0x08: this.cycles = 3; this.push(this.P | this.FLAG_B | this.FLAG_U); break; // PHP
            case 0x28: this.cycles = 4; this.P = this.pop() | this.FLAG_U; break; // PLP

            // Logic
            case 0x29: this.cycles = 2; this.A &= this.read(this.immediate()); this.updateZN(this.A); break; // AND imm
            case 0x25: this.cycles = 3; this.A &= this.read(this.zeroPage()); this.updateZN(this.A); break;
            case 0x35: this.cycles = 4; this.A &= this.read(this.zeroPageX()); this.updateZN(this.A); break;
            case 0x2D: this.cycles = 4; this.A &= this.read(this.absolute()); this.updateZN(this.A); break;
            case 0x3D: this.cycles = 4; this.A &= this.read(this.absoluteX()); this.updateZN(this.A); break;
            case 0x39: this.cycles = 4; this.A &= this.read(this.absoluteY()); this.updateZN(this.A); break;
            case 0x21: this.cycles = 6; this.A &= this.read(this.indexedIndirect()); this.updateZN(this.A); break;
            case 0x31: this.cycles = 5; this.A &= this.read(this.indirectIndexed()); this.updateZN(this.A); break;

            // ORA
            case 0x09: this.cycles = 2; this.A |= this.read(this.immediate()); this.updateZN(this.A); break;
            case 0x05: this.cycles = 3; this.A |= this.read(this.zeroPage()); this.updateZN(this.A); break;
            case 0x15: this.cycles = 4; this.A |= this.read(this.zeroPageX()); this.updateZN(this.A); break;
            case 0x0D: this.cycles = 4; this.A |= this.read(this.absolute()); this.updateZN(this.A); break;
            case 0x1D: this.cycles = 4; this.A |= this.read(this.absoluteX()); this.updateZN(this.A); break;
            case 0x19: this.cycles = 4; this.A |= this.read(this.absoluteY()); this.updateZN(this.A); break;
            case 0x01: this.cycles = 6; this.A |= this.read(this.indexedIndirect()); this.updateZN(this.A); break;
            case 0x11: this.cycles = 5; this.A |= this.read(this.indirectIndexed()); this.updateZN(this.A); break;

            // EOR
            case 0x49: this.cycles = 2; this.A ^= this.read(this.immediate()); this.updateZN(this.A); break;
            case 0x45: this.cycles = 3; this.A ^= this.read(this.zeroPage()); this.updateZN(this.A); break;
            case 0x55: this.cycles = 4; this.A ^= this.read(this.zeroPageX()); this.updateZN(this.A); break;
            case 0x4D: this.cycles = 4; this.A ^= this.read(this.absolute()); this.updateZN(this.A); break;
            case 0x5D: this.cycles = 4; this.A ^= this.read(this.absoluteX()); this.updateZN(this.A); break;
            case 0x59: this.cycles = 4; this.A ^= this.read(this.absoluteY()); this.updateZN(this.A); break;
            case 0x41: this.cycles = 6; this.A ^= this.read(this.indexedIndirect()); this.updateZN(this.A); break;
            case 0x51: this.cycles = 5; this.A ^= this.read(this.indirectIndexed()); this.updateZN(this.A); break;

            // BIT
            case 0x24: this.cycles = 3; this.bit(this.read(this.zeroPage())); break;
            case 0x2C: this.cycles = 4; this.bit(this.read(this.absolute())); break;

            // ADC
            case 0x69: this.cycles = 2; this.adc(this.read(this.immediate())); break;
            case 0x65: this.cycles = 3; this.adc(this.read(this.zeroPage())); break;
            case 0x75: this.cycles = 4; this.adc(this.read(this.zeroPageX())); break;
            case 0x6D: this.cycles = 4; this.adc(this.read(this.absolute())); break;
            case 0x7D: this.cycles = 4; this.adc(this.read(this.absoluteX())); break;
            case 0x79: this.cycles = 4; this.adc(this.read(this.absoluteY())); break;
            case 0x61: this.cycles = 6; this.adc(this.read(this.indexedIndirect())); break;
            case 0x71: this.cycles = 5; this.adc(this.read(this.indirectIndexed())); break;

            // SBC
            case 0xE9: this.cycles = 2; this.sbc(this.read(this.immediate())); break;
            case 0xE5: this.cycles = 3; this.sbc(this.read(this.zeroPage())); break;
            case 0xF5: this.cycles = 4; this.sbc(this.read(this.zeroPageX())); break;
            case 0xED: this.cycles = 4; this.sbc(this.read(this.absolute())); break;
            case 0xFD: this.cycles = 4; this.sbc(this.read(this.absoluteX())); break;
            case 0xF9: this.cycles = 4; this.sbc(this.read(this.absoluteY())); break;
            case 0xE1: this.cycles = 6; this.sbc(this.read(this.indexedIndirect())); break;
            case 0xF1: this.cycles = 5; this.sbc(this.read(this.indirectIndexed())); break;

            // CMP
            case 0xC9: this.cycles = 2; this.compare(this.A, this.read(this.immediate())); break;
            case 0xC5: this.cycles = 3; this.compare(this.A, this.read(this.zeroPage())); break;
            case 0xD5: this.cycles = 4; this.compare(this.A, this.read(this.zeroPageX())); break;
            case 0xCD: this.cycles = 4; this.compare(this.A, this.read(this.absolute())); break;
            case 0xDD: this.cycles = 4; this.compare(this.A, this.read(this.absoluteX())); break;
            case 0xD9: this.cycles = 4; this.compare(this.A, this.read(this.absoluteY())); break;
            case 0xC1: this.cycles = 6; this.compare(this.A, this.read(this.indexedIndirect())); break;
            case 0xD1: this.cycles = 5; this.compare(this.A, this.read(this.indirectIndexed())); break;

            // CPX
            case 0xE0: this.cycles = 2; this.compare(this.X, this.read(this.immediate())); break;
            case 0xE4: this.cycles = 3; this.compare(this.X, this.read(this.zeroPage())); break;
            case 0xEC: this.cycles = 4; this.compare(this.X, this.read(this.absolute())); break;

            // CPY
            case 0xC0: this.cycles = 2; this.compare(this.Y, this.read(this.immediate())); break;
            case 0xC4: this.cycles = 3; this.compare(this.Y, this.read(this.zeroPage())); break;
            case 0xCC: this.cycles = 4; this.compare(this.Y, this.read(this.absolute())); break;

            // INC
            case 0xE6: this.cycles = 5; this.incMem(this.zeroPage()); break;
            case 0xF6: this.cycles = 6; this.incMem(this.zeroPageX()); break;
            case 0xEE: this.cycles = 6; this.incMem(this.absolute()); break;
            case 0xFE: this.cycles = 7; this.incMem(this.absoluteX(false)); break;

            // DEC
            case 0xC6: this.cycles = 5; this.decMem(this.zeroPage()); break;
            case 0xD6: this.cycles = 6; this.decMem(this.zeroPageX()); break;
            case 0xCE: this.cycles = 6; this.decMem(this.absolute()); break;
            case 0xDE: this.cycles = 7; this.decMem(this.absoluteX(false)); break;

            // INX, INY, DEX, DEY
            case 0xE8: this.cycles = 2; this.X = (this.X + 1) & 0xFF; this.updateZN(this.X); break;
            case 0xC8: this.cycles = 2; this.Y = (this.Y + 1) & 0xFF; this.updateZN(this.Y); break;
            case 0xCA: this.cycles = 2; this.X = (this.X - 1) & 0xFF; this.updateZN(this.X); break;
            case 0x88: this.cycles = 2; this.Y = (this.Y - 1) & 0xFF; this.updateZN(this.Y); break;

            // Shifts
            case 0x0A: this.cycles = 2; this.A = this.asl(this.A); break; // ASL A
            case 0x06: this.cycles = 5; this.aslMem(this.zeroPage()); break;
            case 0x16: this.cycles = 6; this.aslMem(this.zeroPageX()); break;
            case 0x0E: this.cycles = 6; this.aslMem(this.absolute()); break;
            case 0x1E: this.cycles = 7; this.aslMem(this.absoluteX(false)); break;

            case 0x4A: this.cycles = 2; this.A = this.lsr(this.A); break; // LSR A
            case 0x46: this.cycles = 5; this.lsrMem(this.zeroPage()); break;
            case 0x56: this.cycles = 6; this.lsrMem(this.zeroPageX()); break;
            case 0x4E: this.cycles = 6; this.lsrMem(this.absolute()); break;
            case 0x5E: this.cycles = 7; this.lsrMem(this.absoluteX(false)); break;

            case 0x2A: this.cycles = 2; this.A = this.rol(this.A); break; // ROL A
            case 0x26: this.cycles = 5; this.rolMem(this.zeroPage()); break;
            case 0x36: this.cycles = 6; this.rolMem(this.zeroPageX()); break;
            case 0x2E: this.cycles = 6; this.rolMem(this.absolute()); break;
            case 0x3E: this.cycles = 7; this.rolMem(this.absoluteX(false)); break;

            case 0x6A: this.cycles = 2; this.A = this.ror(this.A); break; // ROR A
            case 0x66: this.cycles = 5; this.rorMem(this.zeroPage()); break;
            case 0x76: this.cycles = 6; this.rorMem(this.zeroPageX()); break;
            case 0x6E: this.cycles = 6; this.rorMem(this.absolute()); break;
            case 0x7E: this.cycles = 7; this.rorMem(this.absoluteX(false)); break;

            // Branches
            case 0x10: this.branch(!this.getFlag(this.FLAG_N)); break; // BPL
            case 0x30: this.branch(this.getFlag(this.FLAG_N)); break;  // BMI
            case 0x50: this.branch(!this.getFlag(this.FLAG_V)); break; // BVC
            case 0x70: this.branch(this.getFlag(this.FLAG_V)); break;  // BVS
            case 0x90: this.branch(!this.getFlag(this.FLAG_C)); break; // BCC
            case 0xB0: this.branch(this.getFlag(this.FLAG_C)); break;  // BCS
            case 0xD0: this.branch(!this.getFlag(this.FLAG_Z)); break; // BNE
            case 0xF0: this.branch(this.getFlag(this.FLAG_Z)); break;  // BEQ

            // Jumps
            case 0x4C: this.cycles = 3; this.PC = this.absolute(); break; // JMP abs
            case 0x6C: this.cycles = 5; this.PC = this.indirect(); break; // JMP ind

            // JSR, RTS
            case 0x20: this.cycles = 6; { const addr = this.absolute(); this.push16(this.PC - 1); this.PC = addr; } break;
            case 0x60: this.cycles = 6; this.PC = this.pop16() + 1; break;

            // RTI
            case 0x40: this.cycles = 6; this.P = this.pop() | this.FLAG_U; this.PC = this.pop16(); break;

            // BRK
            case 0x00: this.cycles = 7; this.push16(this.PC + 1); this.push(this.P | this.FLAG_B | this.FLAG_U); this.setFlag(this.FLAG_I, true); this.PC = this.read16(0xFFFE); break;

            // Flag operations
            case 0x18: this.cycles = 2; this.setFlag(this.FLAG_C, false); break; // CLC
            case 0x38: this.cycles = 2; this.setFlag(this.FLAG_C, true); break;  // SEC
            case 0x58: this.cycles = 2; this.setFlag(this.FLAG_I, false); break; // CLI
            case 0x78: this.cycles = 2; this.setFlag(this.FLAG_I, true); break;  // SEI
            case 0xB8: this.cycles = 2; this.setFlag(this.FLAG_V, false); break; // CLV
            case 0xD8: this.cycles = 2; this.setFlag(this.FLAG_D, false); break; // CLD
            case 0xF8: this.cycles = 2; this.setFlag(this.FLAG_D, true); break;  // SED

            // NOP
            case 0xEA: this.cycles = 2; break;

            default:
                console.warn(`Unknown opcode: 0x${opcode.toString(16).toUpperCase().padStart(2, '0')} at PC=0x${(this.PC-1).toString(16).toUpperCase().padStart(4, '0')}`);
                this.cycles = 2;
                break;
        }
    }

    // Helper functions
    bit(value) {
        this.setFlag(this.FLAG_Z, (this.A & value) === 0);
        this.setFlag(this.FLAG_V, (value & 0x40) !== 0);
        this.setFlag(this.FLAG_N, (value & 0x80) !== 0);
    }

    adc(value) {
        const result = this.A + value + (this.getFlag(this.FLAG_C) ? 1 : 0);
        this.setFlag(this.FLAG_C, result > 0xFF);
        this.setFlag(this.FLAG_V, ((this.A ^ result) & (value ^ result) & 0x80) !== 0);
        this.A = result & 0xFF;
        this.updateZN(this.A);
    }

    sbc(value) {
        this.adc(value ^ 0xFF);
    }

    compare(reg, value) {
        const result = reg - value;
        this.setFlag(this.FLAG_C, result >= 0);
        this.updateZN(result & 0xFF);
    }

    incMem(addr) {
        const value = (this.read(addr) + 1) & 0xFF;
        this.write(addr, value);
        this.updateZN(value);
    }

    decMem(addr) {
        const value = (this.read(addr) - 1) & 0xFF;
        this.write(addr, value);
        this.updateZN(value);
    }

    asl(value) {
        this.setFlag(this.FLAG_C, (value & 0x80) !== 0);
        value = (value << 1) & 0xFF;
        this.updateZN(value);
        return value;
    }

    aslMem(addr) {
        this.write(addr, this.asl(this.read(addr)));
    }

    lsr(value) {
        this.setFlag(this.FLAG_C, (value & 0x01) !== 0);
        value = (value >> 1) & 0xFF;
        this.updateZN(value);
        return value;
    }

    lsrMem(addr) {
        this.write(addr, this.lsr(this.read(addr)));
    }

    rol(value) {
        const carry = this.getFlag(this.FLAG_C) ? 1 : 0;
        this.setFlag(this.FLAG_C, (value & 0x80) !== 0);
        value = ((value << 1) | carry) & 0xFF;
        this.updateZN(value);
        return value;
    }

    rolMem(addr) {
        this.write(addr, this.rol(this.read(addr)));
    }

    ror(value) {
        const carry = this.getFlag(this.FLAG_C) ? 0x80 : 0;
        this.setFlag(this.FLAG_C, (value & 0x01) !== 0);
        value = ((value >> 1) | carry) & 0xFF;
        this.updateZN(value);
        return value;
    }

    rorMem(addr) {
        this.write(addr, this.ror(this.read(addr)));
    }

    branch(condition) {
        this.cycles = 2;
        const addr = this.relative();
        if (condition) {
            if ((addr & 0xFF00) !== (this.PC & 0xFF00)) {
                this.cycles++;
            }
            this.cycles++;
            this.PC = addr;
        }
    }
}
