/**
 * Virtual Disk Emulation
 *
 * Emulates floppy disk drives for HEXDOS
 * Supports save/load to browser localStorage
 */

class VirtualDisk {
    constructor(tracks = 40, sectorsPerTrack = 8, bytesPerSector = 256) {
        this.tracks = tracks;
        this.sectorsPerTrack = sectorsPerTrack;
        this.bytesPerSector = bytesPerSector;
        this.totalSize = tracks * sectorsPerTrack * bytesPerSector;

        // Disk data
        this.data = new Uint8Array(this.totalSize);

        // Current head position
        this.currentTrack = 0;

        // Disk label
        this.label = 'HEXDOS DISK';

        // Initialize with empty disk
        this.format();
    }

    format() {
        // Clear disk
        this.data.fill(0);

        // Initialize directory track (track 0)
        // HEXDOS uses a simple directory structure
        this.currentTrack = 0;
    }

    seek(track) {
        if (track < 0 || track >= this.tracks) {
            throw new Error(`Track ${track} out of range`);
        }
        this.currentTrack = track;
    }

    readTrack(track) {
        if (track === undefined) {
            track = this.currentTrack;
        }

        const offset = track * this.sectorsPerTrack * this.bytesPerSector;
        const length = this.sectorsPerTrack * this.bytesPerSector;

        return this.data.slice(offset, offset + length);
    }

    writeTrack(track, data) {
        if (track === undefined) {
            track = this.currentTrack;
        }

        const offset = track * this.sectorsPerTrack * this.bytesPerSector;
        const length = Math.min(data.length, this.sectorsPerTrack * this.bytesPerSector);

        this.data.set(data.slice(0, length), offset);
    }

    readSector(track, sector) {
        const offset = (track * this.sectorsPerTrack + sector) * this.bytesPerSector;
        return this.data.slice(offset, offset + this.bytesPerSector);
    }

    writeSector(track, sector, data) {
        const offset = (track * this.sectorsPerTrack + sector) * this.bytesPerSector;
        const length = Math.min(data.length, this.bytesPerSector);
        this.data.set(data.slice(0, length), offset);
    }

    save(name) {
        try {
            const diskImage = {
                label: this.label,
                tracks: this.tracks,
                sectorsPerTrack: this.sectorsPerTrack,
                bytesPerSector: this.bytesPerSector,
                data: Array.from(this.data)
            };

            localStorage.setItem(`hexdos_disk_${name}`, JSON.stringify(diskImage));
            return true;
        } catch (e) {
            console.error('Failed to save disk:', e);
            return false;
        }
    }

    load(name) {
        try {
            const stored = localStorage.getItem(`hexdos_disk_${name}`);
            if (!stored) {
                return false;
            }

            const diskImage = JSON.parse(stored);
            this.label = diskImage.label;
            this.tracks = diskImage.tracks;
            this.sectorsPerTrack = diskImage.sectorsPerTrack;
            this.bytesPerSector = diskImage.bytesPerSector;
            this.data = new Uint8Array(diskImage.data);

            return true;
        } catch (e) {
            console.error('Failed to load disk:', e);
            return false;
        }
    }

    export() {
        return {
            label: this.label,
            tracks: this.tracks,
            sectorsPerTrack: this.sectorsPerTrack,
            bytesPerSector: this.bytesPerSector,
            data: this.data
        };
    }

    import(diskImage) {
        this.label = diskImage.label;
        this.tracks = diskImage.tracks;
        this.sectorsPerTrack = diskImage.sectorsPerTrack;
        this.bytesPerSector = diskImage.bytesPerSector;
        this.data = new Uint8Array(diskImage.data);
    }
}

class DiskController {
    constructor() {
        // Up to 4 disk drives
        this.drives = [
            new VirtualDisk(),
            new VirtualDisk(),
            new VirtualDisk(),
            new VirtualDisk()
        ];

        // Current drive
        this.currentDrive = 0;

        // I/O registers
        this.statusRegister = 0;
        this.commandRegister = 0;
        this.trackRegister = 0;
        this.sectorRegister = 0;
        this.dataRegister = 0;

        // Track buffer for HEXDOS
        this.trackBuffer = new Uint8Array(2048);
    }

    getCurrentDisk() {
        return this.drives[this.currentDrive];
    }

    selectDrive(drive) {
        if (drive >= 0 && drive < this.drives.length) {
            this.currentDrive = drive;
        }
    }

    readStatus() {
        // Bit 7: Not ready (0 = ready)
        // Bit 6: Write protect (0 = not protected)
        // Bit 5: Head loaded
        // Bit 4: Seek error
        // Bit 3-0: Reserved
        return 0x00; // Always ready
    }

    seek(track) {
        this.trackRegister = track;
        this.getCurrentDisk().seek(track);
        this.statusRegister = 0x00; // Seek complete
    }

    readTrackToBuffer() {
        const disk = this.getCurrentDisk();
        const data = disk.readTrack(this.trackRegister);
        this.trackBuffer.set(data);
        return this.trackBuffer;
    }

    writeTrackFromBuffer() {
        const disk = this.getCurrentDisk();
        disk.writeTrack(this.trackRegister, this.trackBuffer);
    }

    readSector() {
        const disk = this.getCurrentDisk();
        return disk.readSector(this.trackRegister, this.sectorRegister);
    }

    writeSector(data) {
        const disk = this.getCurrentDisk();
        disk.writeSector(this.trackRegister, this.sectorRegister, data);
    }

    saveDisk(drive, name) {
        return this.drives[drive].save(name);
    }

    loadDisk(drive, name) {
        return this.drives[drive].load(name);
    }

    formatDisk(drive) {
        this.drives[drive].format();
    }

    listSavedDisks() {
        const disks = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('hexdos_disk_')) {
                disks.push(key.substring(12));
            }
        }
        return disks;
    }

    downloadDisk(drive) {
        const disk = this.drives[drive];
        const diskImage = disk.export();

        const blob = new Blob([diskImage.data], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${diskImage.label}.dsk`;
        a.click();
        URL.revokeObjectURL(url);
    }

    uploadDisk(drive, file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const data = new Uint8Array(e.target.result);
                const disk = this.drives[drive];
                disk.data = data;
                resolve();
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }
}
