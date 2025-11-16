# HEXDOS Browser-Based Emulation

## Overview

This project resurrects HEXDOS 4.0 for historical preservation through browser-based emulation. HEXDOS was a disk operating system developed by Steven P. Hendrix for the Ohio Scientific Challenger 1P (C1P) computer in the early 1980s.

## What's Included

### Emulator Components

1. **6502 CPU Emulator** (`js/6502.js`)
   - Complete MOS 6502 microprocessor emulation
   - All documented opcodes implemented
   - Cycle-accurate timing
   - Memory-mapped I/O support

2. **OSI C1P Hardware Emulation** (`js/osi-c1p.js`)
   - Ohio Scientific C1P system emulation
   - 8K RAM configuration
   - ROM BASIC stub
   - Memory-mapped display ($D000-$D3FF)
   - Keyboard input ($DF00)

3. **Terminal Display** (`js/terminal.js`)
   - 32x32 character text mode display
   - Classic green-on-black terminal aesthetic
   - Blinking cursor
   - Authentic retro rendering

4. **HEXDOS Loader** (`js/hexdos-loader.js`)
   - Loads HEXDOS binary into emulated memory
   - Future: will support assembling from source

5. **Main Application** (`js/main.js`)
   - User interface controller
   - System initialization and control

## How to Use

### Basic Emulator (index.html)

1. **Open in Browser**
   ```bash
   # Simply open index.html in a modern web browser
   # Or use a local web server:
   python3 -m http.server 8000
   # Then navigate to http://localhost:8000
   ```

2. **Power On the System**
   - Click the "POWER ON" button
   - The OSI C1P will boot into ROM BASIC

3. **Load HEXDOS**
   - Click "LOAD HEXDOS" to load the operating system
   - HEXDOS will initialize and display the ready prompt

4. **Interact**
   - Use your keyboard to type commands
   - The terminal supports standard ASCII input

### Enhanced Emulator (index-enhanced.html)

The enhanced version includes all basic features plus:

1. **Debug Panel**
   - Click "Show Debug Panel" to open the debugging tools
   - Switch between tabs: Registers, Memory, Disassembly, Disk, Breakpoints

2. **Using the Debugger**
   - **Step Mode**: Click "Step" to execute one instruction at a time
   - **Breakpoints**: Enter an address (e.g., "0300") and click "Add" in the Breakpoints tab
   - **Memory Inspection**: Enter an address in the Memory tab and click "View"
   - **Disassembly**: Click "From PC" to disassemble from current program counter

3. **Disk Management**
   - Select a drive (0-3) from the Disk tab
   - Format a disk with "Format"
   - Save disk to browser storage with a name
   - Load previously saved disks
   - Download disk images to your computer

4. **Assembler**
   - Click "Assemble Source" to assemble HEXDOS from source code
   - (Currently uses pre-assembled version; full source assembly coming soon)

### Browser Compatibility

- **Recommended:** Modern Chrome, Firefox, Safari, or Edge
- **Requirements:**
  - HTML5 Canvas support
  - ES6 JavaScript support
  - RequestAnimationFrame API

## Technical Details

### Memory Map

```
$0000-$00FF   Zero Page
$0100-$01FF   Stack
$0200-$02FF   System Variables
$0300-$0AFF   HEXDOS Code (2K)
$0B00-$1FFF   Free RAM
$D000-$D3FF   Video RAM (32x32 text display)
$DF00         Keyboard Input
$BD00-$BFFF   ROM BASIC (partial)
$FFFC-$FFFD   Reset Vector
$FFFE-$FFFF   IRQ Vector
```

### Performance

- Emulated CPU Speed: ~1 MHz (authentic 6502 speed)
- Display Refresh: 60 FPS
- Real-time cycle counting for accurate timing

## Historical Context

### About HEXDOS

HEXDOS 4.0 was developed between 1980-1983 for the Ohio Scientific C1P computer. Key features:

- Exactly 2048 bytes (2K) in size
- Patches into ROM BASIC
- Provides disk file management
- Innovative space-saving techniques
- Well-documented source code

### About the OSI C1P

The Ohio Scientific Challenger 1P was a popular 6502-based home computer featuring:

- MOS 6502 CPU at 1 MHz
- 4-32K RAM configurations
- Microsoft BASIC in ROM
- 32x32 character display
- Floppy disk support (with HEXDOS)

## Development

### Project Structure

```
HEXDOS/
├── index.html                 # Basic HTML interface
├── index-enhanced.html        # Enhanced interface with debugging
├── style.css                  # Basic styling
├── style-enhanced.css         # Enhanced styling
├── js/
│   ├── 6502.js               # CPU emulator core
│   ├── assembler.js          # 6502 assembler
│   ├── disk.js               # Virtual disk emulation
│   ├── debugger.js           # Debugging tools
│   ├── osi-c1p.js            # Hardware emulation
│   ├── terminal.js           # Display rendering
│   ├── hexdos-loader.js      # Binary loader
│   ├── main.js               # Basic application controller
│   └── main-enhanced.js      # Enhanced application controller
├── HEXDOS.ASM                # Original HEXDOS source
├── HEXDOS2.A65               # Alternate source format
├── HEXASM.BAS                # BASIC assembler
├── hexdos.pdf                # Documentation
└── BROWSER-EMULATION.md      # This file
```

## Enhanced Version

An **enhanced version** of the emulator is now available with full debugging and development tools!

### Enhanced Features

The enhanced emulator (`index-enhanced.html`) includes:

1. **Full 6502 Assembler**
   - Complete JavaScript implementation of 6502 assembler
   - Supports all standard addressing modes
   - Can assemble original HEXDOS source code
   - Symbol table and two-pass assembly

2. **Virtual Disk Emulation**
   - Up to 4 virtual floppy disk drives
   - 40 tracks, 8 sectors per track, 256 bytes per sector
   - Save/load disk images to browser localStorage
   - Download/upload disk images as files
   - Format and manage virtual disks

3. **Advanced Debugging Tools**
   - **Memory Viewer**: Inspect any memory location with hex/ASCII display
   - **CPU Register Display**: Real-time register and flag status
   - **Disassembler**: Disassemble code from any address
   - **Breakpoints**: Set breakpoints at any address
   - **Step-through Execution**: Step one instruction at a time
   - **Pause/Continue**: Full execution control

4. **Improved Hardware Emulation**
   - Enhanced ROM BASIC implementation
   - Better cursor tracking and display updates
   - Disk controller I/O at $C000-$C010
   - Cycle-accurate timing

## License and Attribution

### HEXDOS License

HEXDOS source code is used under permission for non-commercial hobbyist purposes:

- Copyright (c) 1980-2015 Steven P. Hendrix
- All Rights Reserved
- Used with permission for non-commercial historical preservation
- See HEXDOS.ASM for full license text

### Emulator Code

The browser-based emulator code (JavaScript, HTML, CSS) created for this project:

- Created for historical preservation and educational purposes
- Non-commercial hobbyist use only
- Based on HEXDOS by Steven P. Hendrix

## Resources

### Learn More

- Original HEXDOS documentation in `hexdos.pdf`
- Source code with detailed comments in `HEXDOS.ASM` and `HEXDOS2.A65`
- 6502 documentation: http://www.6502.org/
- OSI documentation: http://www.osiweb.org/

### Contributing

This is a historical preservation project. Contributions welcome for:

- Bug fixes in the emulator
- Accuracy improvements
- Documentation enhancements
- Additional OSI software to run

Please maintain the non-commercial, educational nature of this project.

## Acknowledgments

- **Steven P. Hendrix** - Original HEXDOS developer
- **Ohio Scientific** - C1P computer platform
- **6502 Community** - Extensive documentation and resources
- **Retro Computing Community** - Preservation efforts

---

*This emulator preserves HEXDOS 4.0 as a piece of computing history, allowing new generations to experience 1980s operating system development and the elegant simplicity of 6502 assembly programming.*
