import { Scene } from "phaser";

export class WestOffShore extends Scene {
    private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
    private selector?: Phaser.GameObjects.Sprite;
    private map?: Phaser.Tilemaps.Tilemap;
    private readonly tileSize = 16;
    private readonly moveSpeed = 16;
    private readonly MAX_PATH_LENGTH = 20;
    
    // Path system
    private currentPath: { x: number; y: number; isValid: boolean }[] = [];
    private pathVisuals?: Phaser.GameObjects.Group;
    private isMovingOnPath = false;
    
    // Touch state
    private touchState = {
        isDragging: false,
        dragStartX: 0,
        dragStartY: 0,
        lastX: 0,
        lastY: 0,
        dragThreshold: 10
    };
    private readonly TERRAIN = {
        'Ground Level 2': {
            elevated: [14, 25, 26, 35, 39, 40, 46, 47, 60, 61, 67, 68, 80, 81, 82, 83, 84, 85], // Tiles yang bisa dilewati
            cave: [16, 17], // Cave: terlihat di level 2 tapi termasuk ground 1
            obstacles: [
                6, 7, 8, 9, 10, 13, 15, 20, 21, 22, 23, 24, 27, 28, 29, 30,
                31, 32, 33, 34, 36, 37, 38, 41, 42, 43, 44, 45, 48, 49, 50,
                55, 57, 58, 59, 62, 63, 64, 65, 66, 132, 133, 134, 135, 136, 
                137, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 
                153, 154, 155, 156
            ] // Tebing dan obstacles lain
        },
        'Ground Level 1': {
            obstacles: [-1, 0, 1, 77] // Air dan air dangkal
        }
    };
    
    private levelText?: Phaser.GameObjects.Text; // Text untuk menampilkan level ground
    private readonly MOVE_DELAY = 100; // Delay antara gerakan dalam milidetik
    private lastMoveTime = 0; // Waktu terakhir bergerak
    private lastDirection: 'up' | 'down' | 'left' | 'right' = 'down'; // Arah terakhir karakter

    // Fungsi untuk mendapatkan ground level di posisi tertentu
    private getGroundLevel(x: number, y: number): number {
        if (!this.map) return 1;

        const tileX = Math.floor(x / this.tileSize);
        const tileY = Math.floor(y / this.tileSize);

        // Cek Ground Level 2
        const tileLevel2 = this.map.getTileAt(tileX, tileY, true, 'Ground Level 2');
        if (tileLevel2 && this.TERRAIN['Ground Level 2'].elevated.includes(tileLevel2.index)) {
            return 2; // Elevated terrain di level 2
        }

        return 1; // Default ke level 1
    }

    // Fungsi untuk mengecek apakah posisi tersebut adalah cave
    private isCave(x: number, y: number): boolean {
        if (!this.map) return false;
        const tileX = Math.floor(x / this.tileSize);
        const tileY = Math.floor(y / this.tileSize);
        const tileLevel2 = this.map.getTileAt(tileX, tileY, true, 'Ground Level 2');
        return tileLevel2 !== null && this.TERRAIN['Ground Level 2'].cave.includes(tileLevel2.index);
    }

    // Fungsi untuk mengecek apakah posisi tersebut bisa dilewati
    private canMoveTo(x: number, y: number): boolean {
        if (!this.map) return false;

        const tileX = Math.floor(x / this.tileSize);
        const tileY = Math.floor(y / this.tileSize);

        // Cek tile di kedua level
        const tileLevel1 = this.map.getTileAt(tileX, tileY, true, 'Ground Level 1');
        const tileLevel2 = this.map.getTileAt(tileX, tileY, true, 'Ground Level 2');

        // Cek current position untuk menentukan dari mana kita bergerak
        const currentLevel = this.getGroundLevel(this.selector!.x, this.selector!.y);
        const isCurrentlyCave = this.isCave(this.selector!.x, this.selector!.y);
        const isTargetCave = this.isCave(x, y);

        // Cek obstacles di level 2 jika ada
        if (tileLevel2 && this.TERRAIN['Ground Level 2'].obstacles.includes(tileLevel2.index)) {
            return false; // Tidak bisa lewat jika ada obstacle di level 2
        }

        // Jika kita di Level 2 (elevated)
        if (currentLevel === 2) {
            // Tidak bisa masuk ke cave dari level 2
            if (isTargetCave) {
                return false;
            }
            // Bisa bergerak ke elevated terrain lain
            if (tileLevel2 && this.TERRAIN['Ground Level 2'].elevated.includes(tileLevel2.index)) {
                return true;
            }
            // Atau turun ke Level 1 jika tidak ada obstacle
            return tileLevel1 !== null && !this.TERRAIN['Ground Level 1'].obstacles.includes(tileLevel1.index);
        }

        // Jika kita di cave
        if (isCurrentlyCave) {
            // Hanya bisa ke Level 1 atau cave lain
            return (tileLevel1 !== null && !this.TERRAIN['Ground Level 1'].obstacles.includes(tileLevel1.index)) || isTargetCave;
        }

        // Cek kondisi di Ground Level 1
        if (!tileLevel1 || this.TERRAIN['Ground Level 1'].obstacles.includes(tileLevel1.index)) {
            // Bisa lewat jika ada elevated terrain atau cave
            return (tileLevel2 !== null && 
                   (this.TERRAIN['Ground Level 2'].elevated.includes(tileLevel2.index) || 
                    this.TERRAIN['Ground Level 2'].cave.includes(tileLevel2.index)));
        }

        // Di Level 1, bisa ke mana saja kecuali obstacles
        return true;
    }
    
    constructor() {
        super('WestOffShore');
    }

    private initTouchControls() {
        // Touch events untuk path dan camera control
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            this.touchState.isDragging = false;
            this.touchState.dragStartX = pointer.x;
            this.touchState.dragStartY = pointer.y;
            this.touchState.lastX = pointer.x;
            this.touchState.lastY = pointer.y;
            this.levelText?.setAlpha(0);
        });

        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (!pointer.isDown) return;

            const dragDistance = Phaser.Math.Distance.Between(
                this.touchState.dragStartX,
                this.touchState.dragStartY,
                pointer.x,
                pointer.y
            );

            if (dragDistance > this.touchState.dragThreshold) {
                this.touchState.isDragging = true;
                
                // Move camera
                const dx = pointer.x - this.touchState.lastX;
                const dy = pointer.y - this.touchState.lastY;
                
                this.cameras.main.scrollX -= dx / this.cameras.main.zoom;
                this.cameras.main.scrollY -= dy / this.cameras.main.zoom;

                // Keep camera within bounds
                const cam = this.cameras.main;
                const mapWidth = this.map!.width * this.tileSize;
                const mapHeight = this.map!.height * this.tileSize;
                
                cam.scrollX = Phaser.Math.Clamp(cam.scrollX, 0, mapWidth - cam.width / cam.zoom);
                cam.scrollY = Phaser.Math.Clamp(cam.scrollY, 0, mapHeight - cam.height / cam.zoom);
            }

            this.touchState.lastX = pointer.x;
            this.touchState.lastY = pointer.y;
        });

        this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
            if (!this.touchState.isDragging && !this.isMovingOnPath) {
                const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
                const tileX = Math.floor(worldPoint.x / this.tileSize);
                const tileY = Math.floor(worldPoint.y / this.tileSize);
                
                // Calculate and show path
                this.calculatePath(tileX, tileY);
            }
            this.touchState.isDragging = false;
        });
    }

    private findPathStep(
        currentX: number, 
        currentY: number, 
        targetX: number, 
        targetY: number, 
        visited: Set<string>
    ): { x: number; y: number }[] {
        // Cek arah yang mungkin (4 arah: atas, kanan, bawah, kiri)
        const directions = [
            { dx: 0, dy: -1 }, // atas
            { dx: 1, dy: 0 },  // kanan
            { dx: 0, dy: 1 },  // bawah
            { dx: -1, dy: 0 }  // kiri
        ];

        // Cari arah yang paling dekat dengan target
        return directions
            .map(dir => ({
                x: currentX + dir.dx,
                y: currentY + dir.dy,
                distance: Math.abs(targetX - (currentX + dir.dx)) + Math.abs(targetY - (currentY + dir.dy))
            }))
            .sort((a, b) => a.distance - b.distance)
            .filter(pos => {
                const key = `${pos.x},${pos.y}`;
                return !visited.has(key) && 
                       this.canMoveTo(pos.x * this.tileSize, pos.y * this.tileSize);
            })
            .map(pos => ({ x: pos.x, y: pos.y }));
    }

    private calculatePath(targetX: number, targetY: number) {
        if (!this.selector) return;

        // Clear existing path
        this.clearPath();

        // Start from current position
        const startX = Math.floor(this.selector.x / this.tileSize);
        const startY = Math.floor(this.selector.y / this.tileSize);

        const distance = Math.abs(targetX - startX) + Math.abs(targetY - startY);

        // If path is too long, show X
        if (distance > this.MAX_PATH_LENGTH) {
            this.showInvalidPath(targetX, targetY);
            return;
        }

        // Find path using backtracking
        const path: { x: number; y: number; isValid: boolean }[] = [];
        const visited = new Set<string>();
        let currentX = startX;
        let currentY = startY;

        while (path.length < this.MAX_PATH_LENGTH) {
            visited.add(`${currentX},${currentY}`);

            // Jika sudah sampai target
            if (currentX === targetX && currentY === targetY) {
                break;
            }

            // Cari langkah berikutnya
            const nextSteps = this.findPathStep(currentX, currentY, targetX, targetY, visited);
            
            // Jika tidak ada langkah valid
            if (nextSteps.length === 0) {
                // Jika belum ada path atau path terakhir tidak valid, tunjukkan X
                if (path.length === 0 || !path[path.length - 1].isValid) {
                    this.showInvalidPath(targetX, targetY);
                }
                break;
            }

            // Ambil langkah pertama (yang paling dekat ke target)
            const nextStep = nextSteps[0];
            currentX = nextStep.x;
            currentY = nextStep.y;
            path.push({ 
                x: currentX, 
                y: currentY, 
                isValid: this.canMoveTo(currentX * this.tileSize, currentY * this.tileSize)
            });
        }

        this.currentPath = path;
        this.showPath();

        // Start moving if path is valid
        if (path.length > 0 && path.every(p => p.isValid)) {
            this.isMovingOnPath = true;
            this.moveAlongPath();
        }
    }

    private clearPath() {
        this.currentPath = [];
        if (this.pathVisuals) {
            this.pathVisuals.clear(true, true);
        }
    }

    private showPath() {
        if (!this.pathVisuals) {
            this.pathVisuals = this.add.group();
        }

        // @ts-ignore
        this.currentPath.forEach((point, index) => {
            const visual = this.add.rectangle(
                Math.floor(point.x) * this.tileSize,
                Math.floor(point.y) * this.tileSize,
                this.tileSize,
                this.tileSize,
                point.isValid ? 0x00ff00 : 0xff0000,
                0.3
            );
            visual.setOrigin(0, 0); // Set origin ke top-left untuk snap ke grid
            this.pathVisuals?.add(visual);
        });
    }

    private showInvalidPath(x: number, y: number) {
        if (!this.pathVisuals) {
            this.pathVisuals = this.add.group();
        }

        // Show X mark sebagai rectangle merah yang snap ke grid
        const visual = this.add.rectangle(
            Math.floor(x) * this.tileSize,
            Math.floor(y) * this.tileSize,
            this.tileSize,
            this.tileSize,
            0xff0000,
            0.3
        );
        visual.setOrigin(0, 0);
        this.pathVisuals?.add(visual);
    }

    private moveAlongPath() {
        if (!this.selector || this.currentPath.length === 0) {
            this.isMovingOnPath = false;
            this.clearPath();
            return;
        }

        const nextPoint = this.currentPath[0];
        const targetX = nextPoint.x * this.tileSize;
        const targetY = nextPoint.y * this.tileSize;

        // Move selector to next point
        this.selector.setPosition(targetX, targetY);
        
        // Remove this point from path
        this.currentPath.shift();

        // Continue with next point or finish
        if (this.currentPath.length > 0) {
            this.time.delayedCall(100, () => this.moveAlongPath(), [], this);
        } else {
            this.isMovingOnPath = false;
            this.clearPath();
        }
    }

    create() {
        // Buat tilemap
        this.map = this.make.tilemap({ key: 'WestOffshoreMap' });
        
        // Load semua tileset yang dibutuhkan
        const grassTileset = this.map.addTilesetImage('Grass', 'grass');
        const cliffTileset = this.map.addTilesetImage('Cliff', 'cliff');
        const cliffWaterTileset = this.map.addTilesetImage('CliffWater', 'cliff-water');
        const deadGrassTileset = this.map.addTilesetImage('DeadGrass', 'dead-grass');
        const shoreTileset = this.map.addTilesetImage('Shore', 'shore');
        const texturedGrassTileset = this.map.addTilesetImage('TexturedGrass', 'textured-grass');
        const winterGrassTileset = this.map.addTilesetImage('Winter', 'winter-grass');
        const cactusTileset = this.map.addTilesetImage('Cactus', 'cactus');
        const coconutTreesTileset = this.map.addTilesetImage('CoconutTrees', 'coconut-trees');
        const deadTreesTileset = this.map.addTilesetImage('DeadTrees', 'dead-trees');
        const pineTreesTileset = this.map.addTilesetImage('PineTrees', 'pine-trees');
        const rocksTileset = this.map.addTilesetImage('Rocks', 'rocks');
        const treesTileset = this.map.addTilesetImage('Trees', 'trees');
        const tumbleweedTileset = this.map.addTilesetImage('Tumbleweed', 'tumbleweed');
        const wheatfieldTileset = this.map.addTilesetImage('Wheatfield', 'wheatfield');

        if (!grassTileset || !cliffTileset || !cliffWaterTileset || !deadGrassTileset || !shoreTileset || !texturedGrassTileset || !winterGrassTileset || !cactusTileset || !coconutTreesTileset || !deadTreesTileset || !pineTreesTileset || !rocksTileset || !treesTileset || !tumbleweedTileset || !wheatfieldTileset || !this.map) {
            console.error('Failed to load tilesets or map');
            return;
        }
        
        // Gabungkan tileset untuk digunakan di layer
        const allTilesets = [grassTileset, cliffTileset, cliffWaterTileset, deadGrassTileset, shoreTileset, texturedGrassTileset, winterGrassTileset, cactusTileset, coconutTreesTileset, deadTreesTileset, pineTreesTileset, rocksTileset, treesTileset, tumbleweedTileset, wheatfieldTileset];

        // Debug info
        // console.log('Available layers:', this.map.layers.map(l => l.name));
        // console.log('Layer data:', this.map.layers);
        // console.log('Tileset info:', this.map.tilesets);

        // Buat layer dan simpan referensinya
        const layer1 = this.map.createLayer('Ground Level 1', allTilesets, 0, 0);
        const layer2 = this.map.createLayer('Ground Level 2', allTilesets, 0, 0);

        if (!layer1 || !layer2) {
            console.error('Failed to create layers');
            return;
        }

        // Set depth agar layer2 tampil di atas layer1
        layer1.setDepth(0);
        layer2.setDepth(1);

        // Buat sprite karakter
        this.selector = this.add.sprite(0, 0, 'borg', 0);
        this.selector.setOrigin(0); // Set origin ke pojok kiri atas

        // Konfigurasi animasi
        const idleFrameRate = 4;
        const walkFrameRate = 8;

        // Buat animasi idle
        this.anims.create({
            key: 'borg-down-idle',
            frames: this.anims.generateFrameNumbers('borg', { start: 0, end: 1 }),
            frameRate: idleFrameRate,
            repeat: -1,
            yoyo: true
        });

        this.anims.create({
            key: 'borg-left-idle',
            frames: this.anims.generateFrameNumbers('borg', { start: 12, end: 13 }),
            frameRate: idleFrameRate,
            repeat: -1,
            yoyo: true
        });

        this.anims.create({
            key: 'borg-right-idle',
            frames: this.anims.generateFrameNumbers('borg', { start: 18, end: 19 }),
            frameRate: idleFrameRate,
            repeat: -1,
            yoyo: true
        });

        this.anims.create({
            key: 'borg-up-idle',
            frames: this.anims.generateFrameNumbers('borg', { start: 6, end: 7 }),
            frameRate: idleFrameRate,
            repeat: -1,
            yoyo: true
        });

        // Buat animasi berjalan
        this.anims.create({
            key: 'borg-down',
            frames: this.anims.generateFrameNumbers('borg', { start: 0, end: 4 }),
            frameRate: walkFrameRate,
            repeat: -1
        });

        this.anims.create({
            key: 'borg-left',
            frames: this.anims.generateFrameNumbers('borg', { start: 12, end: 16 }),
            frameRate: walkFrameRate,
            repeat: -1
        });

        this.anims.create({
            key: 'borg-right',
            frames: this.anims.generateFrameNumbers('borg', { start: 18, end: 22 }),
            frameRate: walkFrameRate,
            repeat: -1
        });

        this.anims.create({
            key: 'borg-up',
            frames: this.anims.generateFrameNumbers('borg', { start: 6, end: 10 }),
            frameRate: walkFrameRate,
            repeat: -1
        });

        // Mainkan animasi idle
        this.selector.play('borg-down-idle');

        // Buat text untuk level
        this.levelText = this.add.text(0, 0, 'L1', {
            fontSize: '10px',
            color: '#00FF00',
            backgroundColor: '#000000'
        });
        this.levelText.setOrigin(0).setAlpha(0);

        // Set posisi awal
        this.selector.setPosition(
            Math.floor(1024 / 2 / this.tileSize) * this.tileSize,
            Math.floor(768 / 2 / this.tileSize) * this.tileSize
        );

        // Setup input keyboard
        //@ts-ignore
        this.cursors = this.input.keyboard.createCursorKeys();

        // Setup kamera
        this.cameras.main.setZoom(2); // Zoom in 2x
        
        // Set batas kamera sesuai ukuran map
        const mapWidth = this.map.width * this.tileSize;
        const mapHeight = this.map.height * this.tileSize;
        this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);

        // Mulai mengikuti selector
        this.cameras.main.startFollow(this.selector, true);

        // Initialize touch controls
        this.initTouchControls();
    }

    private updateMovement(time: number) {
        if (!this.map || !this.selector || !this.cursors) return false;

        // Hitung batas map
        const maxX = this.map.width * this.tileSize - this.tileSize;
        const maxY = this.map.height * this.tileSize - this.tileSize;

        // Cek apakah sudah waktunya untuk gerakan baru
        const canMove = time - this.lastMoveTime >= this.MOVE_DELAY;
        if (!canMove) return false;

        let newX = this.selector.x;
        let newY = this.selector.y;
        let moved = false;

        // Cek pergerakan horizontal
        if (this.cursors.left.isDown) {
            const targetX = Math.max(0, this.selector.x - this.moveSpeed);
            if (this.canMoveTo(targetX, this.selector.y)) {
                newX = targetX;
                this.lastDirection = 'left';
                moved = true;
            }
        }
        else if (this.cursors.right.isDown) {
            const targetX = Math.min(maxX, this.selector.x + this.moveSpeed);
            if (this.canMoveTo(targetX, this.selector.y)) {
                newX = targetX;
                this.lastDirection = 'right';
                moved = true;
            }
        }

        // Cek pergerakan vertikal
        if (this.cursors.up.isDown) {
            const targetY = Math.max(0, this.selector.y - this.moveSpeed);
            if (this.canMoveTo(this.selector.x, targetY)) {
                newY = targetY;
                this.lastDirection = 'up';
                moved = true;
            }
        }
        else if (this.cursors.down.isDown) {
            const targetY = Math.min(maxY, this.selector.y + this.moveSpeed);
            if (this.canMoveTo(this.selector.x, targetY)) {
                newY = targetY;
                this.lastDirection = 'down';
                moved = true;
            }
        }

        // Update posisi jika bergerak
        if (moved) {
            this.selector.setPosition(newX, newY);
            this.lastMoveTime = time;
        }

        return moved;
    }

    private updateAnimation() {
        if (!this.selector || !this.cursors) return;

        const isMoving = this.cursors.left.isDown || 
                        this.cursors.right.isDown || 
                        this.cursors.up.isDown || 
                        this.cursors.down.isDown;

        const currentAnim = this.selector.anims.getName();
        
        // Jika sedang bergerak
        if (isMoving) {
            const walkAnim = `borg-${this.lastDirection}`;
            // Mainkan animasi jalan hanya jika belum dimainkan
            if (currentAnim !== walkAnim) {
                this.selector.play(walkAnim);
            }
        } 
        // Jika berhenti
        else {
            const idleAnim = `borg-${this.lastDirection}-idle`;
            // Mainkan animasi idle hanya jika sedang tidak idle
            if (!currentAnim.includes('idle')) {
                this.selector.play(idleAnim);
            }
        }
    }

    update(time: number) {
        if (!this.map || !this.selector || !this.cursors || this.isMovingOnPath) return;

        // Update movement dan animation secara terpisah
        const moved = this.updateMovement(time);
        
        // Update level text jika bergerak
        if (moved && this.levelText) {
            const currentLevel = this.getGroundLevel(this.selector.x, this.selector.y);
            const isEnteringCave = this.isCave(this.selector.x, this.selector.y);
            const wasInCave = this.isCave(this.selector.x, this.selector.y);

            // Update text dan depth
            this.levelText.setText(isEnteringCave ? 'CAVE' : `L${currentLevel}`);
            this.levelText.setPosition(this.selector.x, this.selector.y - 12)
                .setDepth(1 + currentLevel)
                .setAlpha(1);
            this.selector.setDepth(1 + currentLevel);

            // Log saat masuk atau keluar cave
            if (isEnteringCave && !wasInCave) {
                console.log('Entering cave...');
            } else if (!isEnteringCave && wasInCave) {
                console.log('Exiting cave...');
            }
        }

        // Update animasi
        this.updateAnimation();
    }
}