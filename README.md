# HEXDOS

Source for HEXDOS 4, courtesy of Steve Hendrix

## What is HEXDOS?

HEXDOS 4.0 is a disk operating system developed for the Ohio Scientific Challenger 1P (C1P) computer in the early 1980s. Written entirely in 6502 assembly language, it fits in exactly 2K of memory and provides disk file management capabilities by patching into ROM BASIC.

## Browser-Based Emulation

**NEW!** HEXDOS has been resurrected for historical preservation through browser-based emulation. You can now run HEXDOS directly in your web browser without any original hardware.

### Quick Start

**Basic Emulator:**
1. Open `index.html` in a modern web browser
2. Click "POWER ON" to boot the OSI C1P emulator
3. Click "LOAD HEXDOS" to load the operating system
4. Use your keyboard to interact with the system

**Enhanced Emulator (with debugging tools):**
1. Open `index-enhanced.html` in a modern web browser
2. Full debugging interface with:
   - CPU register display and status flags
   - Memory viewer with hex/ASCII dump
   - 6502 disassembler
   - Breakpoints and step-through execution
   - Virtual disk drives with save/load
   - 6502 assembler

For detailed documentation:
- Basic emulator: [BROWSER-EMULATION.md](BROWSER-EMULATION.md)
- Enhanced features: [ENHANCED-FEATURES.md](ENHANCED-FEATURES.md)

## Repository Contents

### Original HEXDOS Files
- **HEXDOS.ASM** - Original HEXDOS 4.0 assembly source code
- **HEXDOS2.A65** - Alternate format source code
- **HEXASM.BAS** - BASIC assembler for HEXDOS
- **hexdos.pdf** - Original documentation

### Browser Emulator Files
- **index.html** - Basic browser emulator interface
- **index-enhanced.html** - Enhanced emulator with debugging tools
- **style.css** / **style-enhanced.css** - Styling
- **js/6502.js** - Complete 6502 CPU emulator
- **js/assembler.js** - 6502 assembler (NEW!)
- **js/disk.js** - Virtual floppy disk emulation (NEW!)
- **js/debugger.js** - Debugging tools (NEW!)
- **js/osi-c1p.js** - OSI C1P hardware emulation
- **js/terminal.js** - Terminal display rendering
- **js/hexdos-loader.js** - HEXDOS binary loader
- **js/main.js** / **js/main-enhanced.js** - Application controllers

### Documentation
- **BROWSER-EMULATION.md** - Browser emulator documentation
- **ENHANCED-FEATURES.md** - Enhanced emulator features guide

## License

HEXDOS is copyright (c) 1980-2015 Steven P. Hendrix. Used with permission for non-commercial hobbyist purposes. See the source files for full license details.

The browser emulation is provided for historical preservation and educational purposes only.
