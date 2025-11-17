# HEXDOS

Source for HEXDOS 4, courtesy of Steve Hendrix

## What is HEXDOS?

HEXDOS 4.0 is a disk operating system developed for the Ohio Scientific Challenger 1P (C1P) computer in the early 1980s. Written entirely in 6502 assembly language, it fits in exactly 2K of memory and provides disk file management capabilities by patching into ROM BASIC.

## Browser-Based Emulation

**NEW!** HEXDOS has been resurrected for historical preservation through browser-based emulation. You can now run HEXDOS directly in your web browser without any original hardware.

### Quick Start

1. Open `index.html` in a modern web browser
2. Click "POWER ON" to boot the OSI C1P emulator
3. Click "LOAD HEXDOS" to load the operating system
4. Use your keyboard to interact with the system

For detailed documentation, see [BROWSER-EMULATION.md](BROWSER-EMULATION.md)

## Repository Contents

- **HEXDOS.ASM** - Original HEXDOS 4.0 assembly source code
- **HEXDOS2.A65** - Alternate format source code
- **HEXASM.BAS** - BASIC assembler for HEXDOS
- **hexdos.pdf** - Original documentation
- **index.html** - Browser-based emulator interface
- **js/** - JavaScript emulator components (6502 CPU, OSI C1P hardware)

## License

HEXDOS is copyright (c) 1980-2015 Steven P. Hendrix. Used with permission for non-commercial hobbyist purposes. See the source files for full license details.

The browser emulation is provided for historical preservation and educational purposes only.
