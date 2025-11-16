/**
 * Enhanced main application controller with debugging
 */

let osi = null;
let terminal = null;
let hexdosLoader = null;
let assembler = null;

// UI elements
let powerBtn, resetBtn, loadHexdosBtn, assembleBtn;
let statusText, cpuSpeed;
let overlayMessage;
let debugPanel, debugToggle;
let stepBtn, pauseBtn, continueBtn;

// Debug update interval
let debugUpdateInterval = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initUI();
    initEmulator();
    initDebugPanel();
});

function initUI() {
    // Get UI elements
    powerBtn = document.getElementById('powerBtn');
    resetBtn = document.getElementById('resetBtn');
    loadHexdosBtn = document.getElementById('loadHexdosBtn');
    assembleBtn = document.getElementById('assembleBtn');
    statusText = document.getElementById('statusText');
    cpuSpeed = document.getElementById('cpuSpeed');
    overlayMessage = document.getElementById('overlay-message');
    debugPanel = document.getElementById('debugPanel');
    debugToggle = document.getElementById('debugToggle');
    stepBtn = document.getElementById('stepBtn');
    pauseBtn = document.getElementById('pauseBtn');
    continueBtn = document.getElementById('continueBtn');

    // Attach event listeners
    powerBtn.addEventListener('click', togglePower);
    resetBtn.addEventListener('click', resetSystem);
    loadHexdosBtn.addEventListener('click', loadHEXDOS);
    assembleBtn.addEventListener('click', assembleHEXDOS);
    debugToggle.addEventListener('click', toggleDebugPanel);
    stepBtn.addEventListener('click', stepCPU);
    pauseBtn.addEventListener('click', pauseCPU);
    continueBtn.addEventListener('click', continueCPU);

    // Keyboard input
    document.addEventListener('keydown', handleKeyPress);

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
}

function initEmulator() {
    // Create terminal
    const canvas = document.getElementById('terminal');
    terminal = new Terminal(canvas);

    // Create OSI C1P emulator
    osi = new OSIC1P(terminal);

    // Speed update callback
    osi.onSpeedUpdate = (mhz, fps) => {
        cpuSpeed.textContent = `${mhz} MHz | ${fps} FPS`;
    };

    // Create HEXDOS loader
    hexdosLoader = new HEXDOSLoader();

    // Create assembler
    assembler = new Assembler6502();
}

function initDebugPanel() {
    // Memory viewer
    document.getElementById('memViewBtn').addEventListener('click', viewMemory);

    // Disassembler
    document.getElementById('disasmBtn').addEventListener('click', disassemble);
    document.getElementById('disasmPCBtn').addEventListener('click', disassemblePC);

    // Disk controls
    document.getElementById('formatDiskBtn').addEventListener('click', formatDisk);
    document.getElementById('saveDiskBtn').addEventListener('click', saveDisk);
    document.getElementById('loadDiskBtn').addEventListener('click', loadDisk);
    document.getElementById('downloadDiskBtn').addEventListener('click', downloadDisk);
    document.getElementById('deleteDiskBtn').addEventListener('click', deleteDisk);

    // Breakpoints
    document.getElementById('addBPBtn').addEventListener('click', addBreakpoint);
    document.getElementById('clearBPBtn').addEventListener('click', clearBreakpoints);

    // Update saved disks list
    updateSavedDisksList();
}

function togglePower() {
    if (!osi.running) {
        // Power on
        powerBtn.textContent = 'POWER OFF';
        powerBtn.classList.add('active');
        resetBtn.disabled = false;
        loadHexdosBtn.disabled = false;
        assembleBtn.disabled = false;
        debugToggle.disabled = false;
        stepBtn.disabled = false;
        pauseBtn.disabled = false;
        continueBtn.disabled = false;
        statusText.textContent = 'Running';
        overlayMessage.classList.add('hidden');

        osi.powerOn();

        // Start debug update
        debugUpdateInterval = setInterval(updateDebugDisplay, 100);
    } else {
        // Power off
        powerBtn.textContent = 'POWER ON';
        powerBtn.classList.remove('active');
        resetBtn.disabled = true;
        loadHexdosBtn.disabled = true;
        assembleBtn.disabled = true;
        debugToggle.disabled = true;
        stepBtn.disabled = true;
        pauseBtn.disabled = true;
        continueBtn.disabled = true;
        statusText.textContent = 'System Off';
        cpuSpeed.textContent = '';
        overlayMessage.classList.remove('hidden');

        osi.powerOff();
        terminal.clear();

        // Stop debug update
        if (debugUpdateInterval) {
            clearInterval(debugUpdateInterval);
            debugUpdateInterval = null;
        }
    }
}

function resetSystem() {
    if (osi.running) {
        osi.reset();
        statusText.textContent = 'System Reset';
        setTimeout(() => {
            statusText.textContent = 'Running';
        }, 1000);
    }
}

async function loadHEXDOS() {
    if (!osi.running) {
        alert('Please power on the system first');
        return;
    }

    try {
        statusText.textContent = 'Loading HEXDOS...';

        await hexdosLoader.loadFromSource();
        const hexdosData = hexdosLoader.getData();

        osi.loadHEXDOS(hexdosData);

        statusText.textContent = 'HEXDOS Loaded';
        setTimeout(() => {
            statusText.textContent = 'Running HEXDOS';
        }, 1000);
    } catch (error) {
        console.error('Error loading HEXDOS:', error);
        alert('Failed to load HEXDOS: ' + error.message);
        statusText.textContent = 'Load Failed';
    }
}

async function assembleHEXDOS() {
    if (!osi.running) {
        alert('Please power on the system first');
        return;
    }

    try {
        statusText.textContent = 'Assembling HEXDOS...';

        // For demo, we'll use the pre-built version
        // In future, this would fetch and assemble HEXDOS.ASM
        await hexdosLoader.loadFromSource();
        const hexdosData = hexdosLoader.getData();

        osi.loadHEXDOS(hexdosData);

        statusText.textContent = 'Assembly Complete';
        setTimeout(() => {
            statusText.textContent = 'Running HEXDOS';
        }, 1000);
    } catch (error) {
        console.error('Error assembling HEXDOS:', error);
        alert('Failed to assemble HEXDOS: ' + error.message);
        statusText.textContent = 'Assembly Failed';
    }
}

function handleKeyPress(event) {
    if (!osi || !osi.running) {
        return;
    }

    if (['Enter', 'Backspace', 'Tab', 'Escape'].includes(event.key)) {
        event.preventDefault();
    }

    osi.pressKey(event.key);
}

function toggleDebugPanel() {
    if (debugPanel.style.display === 'none') {
        debugPanel.style.display = 'block';
        debugToggle.textContent = 'Hide Debug Panel';
        updateDebugDisplay();
    } else {
        debugPanel.style.display = 'none';
        debugToggle.textContent = 'Show Debug Panel';
    }
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        }
    });

    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    document.getElementById(tabName + '-tab').classList.add('active');

    // Update content if needed
    if (tabName === 'registers') {
        updateRegisters();
    } else if (tabName === 'disk') {
        updateSavedDisksList();
    } else if (tabName === 'breakpoints') {
        updateBreakpointsList();
    }
}

function updateDebugDisplay() {
    if (!osi || !osi.running || debugPanel.style.display === 'none') {
        return;
    }

    updateRegisters();
}

function updateRegisters() {
    if (!osi || !osi.debugger) return;

    const regs = osi.debugger.getRegisters();

    document.getElementById('reg-pc').textContent = regs.PC.toString(16).toUpperCase().padStart(4, '0');
    document.getElementById('reg-sp').textContent = regs.SP.toString(16).toUpperCase().padStart(2, '0');
    document.getElementById('reg-a').textContent = regs.A.toString(16).toUpperCase().padStart(2, '0');
    document.getElementById('reg-x').textContent = regs.X.toString(16).toUpperCase().padStart(2, '0');
    document.getElementById('reg-y').textContent = regs.Y.toString(16).toUpperCase().padStart(2, '0');
    document.getElementById('reg-p').textContent = regs.P.toString(16).toUpperCase().padStart(2, '0');

    // Update flags
    document.getElementById('flag-n').classList.toggle('active', regs.flags.N);
    document.getElementById('flag-v').classList.toggle('active', regs.flags.V);
    document.getElementById('flag-b').classList.toggle('active', regs.flags.B);
    document.getElementById('flag-d').classList.toggle('active', regs.flags.D);
    document.getElementById('flag-i').classList.toggle('active', regs.flags.I);
    document.getElementById('flag-z').classList.toggle('active', regs.flags.Z);
    document.getElementById('flag-c').classList.toggle('active', regs.flags.C);
}

function viewMemory() {
    if (!osi || !osi.debugger) return;

    const addrStr = document.getElementById('memAddr').value;
    const addr = parseInt(addrStr, 16);

    if (isNaN(addr)) {
        alert('Invalid address');
        return;
    }

    const dump = osi.debugger.formatMemoryDump(addr, 256);
    document.getElementById('memoryDump').textContent = dump;
}

function disassemble() {
    if (!osi || !osi.debugger) return;

    const addrStr = document.getElementById('disasmAddr').value;
    const addr = parseInt(addrStr, 16);

    if (isNaN(addr)) {
        alert('Invalid address');
        return;
    }

    const disasm = osi.debugger.disassembleAtToString(addr, 20);
    document.getElementById('disasmOutput').textContent = disasm;
}

function disassemblePC() {
    if (!osi || !osi.debugger) return;

    const addr = osi.cpu.PC;
    document.getElementById('disasmAddr').value = addr.toString(16).toUpperCase().padStart(4, '0');

    const disasm = osi.debugger.disassembleAtToString(addr, 20);
    document.getElementById('disasmOutput').textContent = disasm;
}

function stepCPU() {
    if (!osi || !osi.debugger) return;

    osi.debugger.step();
    updateDebugDisplay();
}

function pauseCPU() {
    if (!osi || !osi.debugger) return;

    osi.debugger.pause();
    statusText.textContent = 'Paused';
}

function continueCPU() {
    if (!osi || !osi.debugger) return;

    osi.debugger.continue();
    statusText.textContent = 'Running';
}

function addBreakpoint() {
    if (!osi || !osi.debugger) return;

    const addrStr = document.getElementById('bpAddr').value;
    const addr = parseInt(addrStr, 16);

    if (isNaN(addr)) {
        alert('Invalid address');
        return;
    }

    osi.debugger.addBreakpoint(addr);
    updateBreakpointsList();
}

function clearBreakpoints() {
    if (!osi || !osi.debugger) return;

    osi.debugger.clearBreakpoints();
    updateBreakpointsList();
}

function updateBreakpointsList() {
    if (!osi || !osi.debugger) return;

    const list = document.getElementById('bpList');
    list.innerHTML = '';

    osi.debugger.breakpoints.forEach(addr => {
        const item = document.createElement('div');
        item.className = 'bp-item';
        item.innerHTML = `
            <span>$${addr.toString(16).toUpperCase().padStart(4, '0')}</span>
            <button class="bp-remove" data-addr="${addr}">Remove</button>
        `;
        list.appendChild(item);
    });

    // Add remove handlers
    list.querySelectorAll('.bp-remove').forEach(btn => {
        btn.addEventListener('click', () => {
            const addr = parseInt(btn.dataset.addr);
            osi.debugger.removeBreakpoint(addr);
            updateBreakpointsList();
        });
    });
}

function formatDisk() {
    const drive = parseInt(document.getElementById('driveSelect').value);
    if (confirm(`Format drive ${drive}? This will erase all data.`)) {
        osi.diskController.formatDisk(drive);
        alert('Disk formatted');
    }
}

function saveDisk() {
    const drive = parseInt(document.getElementById('driveSelect').value);
    const name = document.getElementById('diskName').value;

    if (!name) {
        alert('Please enter a disk name');
        return;
    }

    if (osi.diskController.saveDisk(drive, name)) {
        alert('Disk saved successfully');
        updateSavedDisksList();
    } else {
        alert('Failed to save disk');
    }
}

function loadDisk() {
    const drive = parseInt(document.getElementById('driveSelect').value);
    const name = document.getElementById('diskName').value;

    if (!name) {
        alert('Please enter a disk name');
        return;
    }

    if (osi.diskController.loadDisk(drive, name)) {
        alert('Disk loaded successfully');
    } else {
        alert('Failed to load disk');
    }
}

function downloadDisk() {
    const drive = parseInt(document.getElementById('driveSelect').value);
    osi.diskController.downloadDisk(drive);
}

function deleteDisk() {
    const list = document.getElementById('savedDisksList');
    const selected = list.value;

    if (!selected) {
        alert('Please select a disk to delete');
        return;
    }

    if (confirm(`Delete disk "${selected}"?`)) {
        localStorage.removeItem(`hexdos_disk_${selected}`);
        updateSavedDisksList();
        alert('Disk deleted');
    }
}

function updateSavedDisksList() {
    if (!osi) return;

    const list = document.getElementById('savedDisksList');
    list.innerHTML = '';

    const disks = osi.diskController.listSavedDisks();
    disks.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        list.appendChild(option);
    });
}

// Prevent context menu on canvas
document.getElementById('terminal').addEventListener('contextmenu', (e) => {
    e.preventDefault();
});
