# HEXDOS Enhanced Emulator Features

This document details all the enhanced features added to the HEXDOS browser emulator.

## Overview

The enhanced version (`index-enhanced.html`) provides a complete development and debugging environment for the Ohio Scientific C1P and HEXDOS, making it possible to:

- Debug 6502 assembly code step-by-step
- Inspect memory and CPU state in real-time
- Manage virtual floppy disks
- Assemble 6502 source code
- Set breakpoints and analyze program flow

## Feature Details

### 1. 6502 Assembler (`js/assembler.js`)

A complete 6502 assembler implemented in JavaScript that can assemble authentic 6502 assembly language source code.

**Capabilities:**
- All standard 6502 opcodes
- All addressing modes (Immediate, Zero Page, Absolute, Indexed, Indirect, etc.)
- Symbols and labels
- Two-pass assembly
- Hex ($), decimal, and binary (%) number formats
- Directives: ORG/*=, .BYTE/DCB, .WORD/DCW

**Example Usage:**
```assembly
START = $0300
      *=$0300
      LDA #$03
      JSR CHROUT
      JMP START
CHROUT = $BD10
```

**Integration:**
- Accessible via "ASSEMBLE SOURCE" button
- Future: will assemble HEXDOS.ASM directly in browser

### 2. Virtual Disk Emulation (`js/disk.js`)

Complete floppy disk drive emulation with persistent storage.

**Specifications:**
- 4 virtual disk drives (0-3)
- 40 tracks per disk
- 8 sectors per track
- 256 bytes per sector
- Total capacity: 81,920 bytes per disk

**Features:**
- **Format Disk**: Initialize a blank disk
- **Save/Load**: Persist disk images to browser localStorage
- **Download**: Export disk images as files
- **Upload**: Import disk images from files
- **Track/Sector Access**: Compatible with HEXDOS disk operations

**Memory-Mapped I/O:**
- $C000: Disk status register
- $C010: Disk data register

**Storage Management:**
- Disk images saved in browser localStorage
- Key format: `hexdos_disk_<name>`
- JSON format with metadata
- List, load, and delete saved disks

### 3. Debugging Tools (`js/debugger.js`)

Comprehensive debugging interface for 6502 development.

#### CPU Register Display

Real-time display of all CPU registers:
- **PC** (Program Counter): Current instruction address
- **SP** (Stack Pointer): Current stack position
- **A** (Accumulator): Main data register
- **X** (X Index): Index register
- **Y** (Y Index): Index register
- **P** (Processor Status): Status flags

Status flags visualized individually:
- **N** - Negative
- **V** - Overflow
- **B** - Break
- **D** - Decimal mode
- **I** - Interrupt disable
- **Z** - Zero
- **C** - Carry

#### Memory Viewer

Inspect any memory location with hex and ASCII display.

**Features:**
- Hexadecimal address input
- 16 bytes per row display
- Hex values with ASCII translation
- View 256 bytes at a time
- Real-time memory updates

**Example Output:**
```
0300: A9 03 20 10 BD A2 00 BD  50 BD F0 08 20 10 BD E8  .. .....P... ...
0310: 4C 09 03 4C 13 BD 8D 00  D0 60 00 00 00 00 00 00  L..L.....`......
```

#### Disassembler

Full 6502 disassembler for code analysis.

**Features:**
- Disassemble from any address
- "From PC" quick button
- Symbolic instruction display
- Address and hex byte display
- Configurable instruction count

**Example Output:**
```
0300: A9 03       LDA #$03
0302: 20 10 BD   JSR $BD10
0305: A2 00      LDX #$00
0307: BD 50 BD   LDA $BD50,X
030A: F0 08      BEQ $0314
```

#### Breakpoints

Set breakpoints at any memory address to pause execution.

**Features:**
- Add breakpoints by address
- Remove individual breakpoints
- Clear all breakpoints
- Visual breakpoint list
- Automatic pause on hit

**Workflow:**
1. Set breakpoint at address (e.g., $0300)
2. Run program
3. Execution pauses when PC reaches breakpoint
4. Inspect registers and memory
5. Step through code or continue

#### Step-Through Execution

Execute code one instruction at a time.

**Controls:**
- **Step**: Execute next instruction
- **Pause**: Pause execution
- **Continue**: Resume normal execution
- **Real-time Updates**: Registers update after each step

### 4. Enhanced User Interface

The enhanced UI provides a professional development environment.

**Layout:**
- Left panel: Terminal and main controls
- Right panel: Tabbed debugging interface
- Responsive design for different screen sizes

**Control Buttons:**
- **POWER ON/OFF**: System power control
- **RESET**: Soft reset without losing disk state
- **LOAD HEXDOS**: Load HEXDOS operating system
- **ASSEMBLE SOURCE**: Assemble and load HEXDOS
- **Show/Hide Debug Panel**: Toggle debugging interface
- **Step/Pause/Continue**: Execution control

**Debug Panel Tabs:**
1. **Registers**: CPU state display
2. **Memory**: Memory inspection
3. **Disassembly**: Code disassembler
4. **Disk**: Disk management
5. **Breakpoints**: Breakpoint management

### 5. Improved Hardware Emulation

Enhanced OSI C1P hardware emulation for better accuracy.

**Improvements:**
- Better cursor position tracking
- Enhanced screen memory handling
- Disk controller I/O integration
- Debugger integration with CPU
- More accurate timing

**Memory Map:**
```
$0000-$00FF   Zero Page
$0100-$01FF   Stack
$0200-$02FF   System Variables
$0300-$0AFF   HEXDOS Code (2K)
$0B00-$1FFF   Free RAM
$C000         Disk Status Register
$C010         Disk Data Register
$D000-$D3FF   Video RAM (32x32)
$DF00         Keyboard Input
$BD00-$BFFF   ROM BASIC
$FFFC-$FFFD   Reset Vector
$FFFE-$FFFF   IRQ Vector
```

## Usage Examples

### Example 1: Setting a Breakpoint

1. Open `index-enhanced.html`
2. Click "POWER ON"
3. Click "Show Debug Panel"
4. Switch to "Breakpoints" tab
5. Enter "0300" in address field
6. Click "Add"
7. Click "LOAD HEXDOS"
8. Execution will pause at $0300

### Example 2: Stepping Through Code

1. Set breakpoint at desired address
2. Wait for breakpoint to hit
3. Click "Step" to execute one instruction
4. Observe register changes in "Registers" tab
5. View next instruction in "Disassembly" tab
6. Click "Continue" to resume

### Example 3: Saving a Disk Image

1. Format a disk (optional)
2. Write data to disk (via HEXDOS or direct memory)
3. Switch to "Disk" tab
4. Enter name (e.g., "mydisk")
5. Click "Save to Browser"
6. Disk is now saved in localStorage

### Example 4: Inspecting Memory

1. Switch to "Memory" tab
2. Enter address (e.g., "D000" for screen memory)
3. Click "View"
4. See hex dump with ASCII translation
5. Watch memory change in real-time

### Example 5: Analyzing Code

1. Switch to "Disassembly" tab
2. Enter address or click "From PC"
3. View disassembled instructions
4. Identify code flow and logic
5. Set breakpoints at key locations

## Technical Implementation

### Assembler

The assembler uses a two-pass algorithm:

**Pass 1:**
- Build symbol table
- Resolve labels
- Calculate addresses

**Pass 2:**
- Generate opcodes
- Resolve operands
- Output binary

### Disk Emulation

Disk storage uses JavaScript Uint8Array for binary data and localStorage for persistence.

**Format:**
```javascript
{
  label: "HEXDOS DISK",
  tracks: 40,
  sectorsPerTrack: 8,
  bytesPerSector: 256,
  data: [0, 0, 0, ...] // Array of bytes
}
```

### Debugger

The debugger wraps the CPU with monitoring hooks:

- Intercept instruction execution
- Check breakpoints before each instruction
- Provide read/write access to CPU state
- Generate formatted output

## Performance Considerations

- Register display updates at 10 Hz (100ms interval)
- Memory viewer updates on demand
- Disassembler generates output instantly
- Disk I/O is synchronous (instant access)
- No performance impact when debug panel hidden

## Browser Compatibility

Tested and working on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Requirements:**
- HTML5 Canvas
- ES6 JavaScript
- localStorage API
- Uint8Array support

## Future Enhancements

Planned additions:

1. **Source-level Debugging**
   - Load .ASM files
   - Show source alongside disassembly
   - Symbolic debugging

2. **File System Browser**
   - View HEXDOS directory
   - Extract files from disk images
   - Inject files into disks

3. **Performance Profiling**
   - Cycle counting
   - Hot spot analysis
   - Execution statistics

4. **Watch Points**
   - Memory watch points
   - Conditional breakpoints
   - Break on read/write

5. **Tape Emulation**
   - Cassette tape interface
   - Save/load programs
   - Audio generation

## License

All enhanced features are provided for non-commercial historical preservation and educational purposes, consistent with the HEXDOS license.

---

For basic usage, see [BROWSER-EMULATION.md](BROWSER-EMULATION.md)

For HEXDOS source code, see HEXDOS.ASM
