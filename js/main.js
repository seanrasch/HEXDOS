/**
 * Main application controller
 */

let osi = null;
let terminal = null;
let hexdosLoader = null;

// UI elements
let powerBtn, resetBtn, loadHexdosBtn;
let statusText, cpuSpeed;
let overlayMessage;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initUI();
    initEmulator();
});

function initUI() {
    // Get UI elements
    powerBtn = document.getElementById('powerBtn');
    resetBtn = document.getElementById('resetBtn');
    loadHexdosBtn = document.getElementById('loadHexdosBtn');
    statusText = document.getElementById('statusText');
    cpuSpeed = document.getElementById('cpuSpeed');
    overlayMessage = document.getElementById('overlay-message');

    // Attach event listeners
    powerBtn.addEventListener('click', togglePower);
    resetBtn.addEventListener('click', resetSystem);
    loadHexdosBtn.addEventListener('click', loadHEXDOS);

    // Keyboard input
    document.addEventListener('keydown', handleKeyPress);
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
}

function togglePower() {
    if (!osi.running) {
        // Power on
        powerBtn.textContent = 'POWER OFF';
        powerBtn.classList.add('active');
        resetBtn.disabled = false;
        loadHexdosBtn.disabled = false;
        statusText.textContent = 'Running';
        overlayMessage.classList.add('hidden');

        osi.powerOn();
    } else {
        // Power off
        powerBtn.textContent = 'POWER ON';
        powerBtn.classList.remove('active');
        resetBtn.disabled = true;
        loadHexdosBtn.disabled = true;
        statusText.textContent = 'System Off';
        cpuSpeed.textContent = '';
        overlayMessage.classList.remove('hidden');

        osi.powerOff();
        terminal.clear();
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

        // Load HEXDOS binary
        await hexdosLoader.loadFromSource();
        const hexdosData = hexdosLoader.getData();

        // Load into emulator
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

function handleKeyPress(event) {
    if (!osi || !osi.running) {
        return;
    }

    // Prevent default browser behavior for certain keys
    if (['Enter', 'Backspace', 'Tab', 'Escape'].includes(event.key)) {
        event.preventDefault();
    }

    // Send key to emulator
    osi.pressKey(event.key);
}

// Prevent context menu on canvas
document.getElementById('terminal').addEventListener('contextmenu', (e) => {
    e.preventDefault();
});
