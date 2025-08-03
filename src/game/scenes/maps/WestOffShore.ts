import { Scene } from "phaser";

export class WestOffShore extends Scene {
    private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
    private selector?: Phaser.GameObjects.Rectangle;
    private map?: Phaser.Tilemaps.Tilemap;
    private readonly tileSize = 16;
    private readonly moveSpeed = 16;
    private readonly TERRAIN = {
        'Ground Level 2': {
            elevated: [14, 25, 26, 35, 39, 40, 46, 47, 60, 61, 67, 68, 80, 81, 82, 83, 84, 85], // Tiles yang bisa dilewati
            cave: [16, 17], // Cave: terlihat di level 2 tapi termasuk ground 1
            obstacles: [
                6, 7, 8, 9, 10, 13, 15, 20, 21, 22, 23, 24, 27, 28, 29, 30,
                31, 32, 33, 34, 36, 37, 38, 41, 42, 43, 44, 45, 48, 49, 50,
                55, 57, 58, 59, 62, 63, 64, 65, 66, 132, 133, 134, 135, 136, 137, , 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156
            ] // Tebing dan obstacles lain
        },
        'Ground Level 1': {
            obstacles: [-1, 0, 1, 77] // Air dan air dangkal
        }
    };
    
    private levelText?: Phaser.GameObjects.Text; // Text untuk menampilkan level ground
    private readonly MOVE_DELAY = 100; // Delay antara gerakan dalam milidetik
    private lastMoveTime = 0; // Waktu terakhir bergerak

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

        // Buat kotak selector
        this.selector = this.add.rectangle(0, 0, this.tileSize, this.tileSize, 0xFFFFFF, 0);
        this.selector.setStrokeStyle(2, 0x00FF00); // Outline hijau
        this.selector.setOrigin(0); // Set origin ke pojok kiri atas

        // Buat text untuk level
        this.levelText = this.add.text(0, 0, 'L1', {
            fontSize: '10px',
            color: '#00FF00',
            backgroundColor: '#000000'
        });
        this.levelText.setOrigin(0);

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
    }

    update(time: number) {
        if (!this.map || !this.selector || !this.cursors) return;

        // Hitung batas map
        const maxX = this.map.width * this.tileSize - this.tileSize;
        const maxY = this.map.height * this.tileSize - this.tileSize;

        // Gerakkan selector berdasarkan input dengan batasan
        let newX = this.selector.x;
        let newY = this.selector.y;

        // Cek apakah sudah waktunya untuk gerakan baru
        const canMove = time - this.lastMoveTime >= this.MOVE_DELAY;

        // Cek pergerakan horizontal
        if (this.cursors.left.isDown && canMove) {
            const targetX = Math.max(0, this.selector.x - this.moveSpeed);
            if (this.canMoveTo(targetX, this.selector.y)) {
                newX = targetX;
                this.lastMoveTime = time;
            }
        }
        else if (this.cursors.right.isDown && canMove) {
            const targetX = Math.min(maxX, this.selector.x + this.moveSpeed);
            if (this.canMoveTo(targetX, this.selector.y)) {
                newX = targetX;
                this.lastMoveTime = time;
            }
        }

        // Cek pergerakan vertikal
        if (this.cursors.up.isDown && canMove) {
            const targetY = Math.max(0, this.selector.y - this.moveSpeed);
            if (this.canMoveTo(this.selector.x, targetY)) {
                newY = targetY;
                this.lastMoveTime = time;
            }
        }
        else if (this.cursors.down.isDown && canMove) {
            const targetY = Math.min(maxY, this.selector.y + this.moveSpeed);
            if (this.canMoveTo(this.selector.x, targetY)) {
                newY = targetY;
                this.lastMoveTime = time;
            }
        }

        // Update posisi selector jika posisi baru valid
        if (newX !== this.selector.x || newY !== this.selector.y) {
            // Update posisi selector
            this.selector.setPosition(newX, newY);
            
            // Update level text dan cek cave
            const currentLevel = this.getGroundLevel(newX, newY);
            const isEnteringCave = this.isCave(newX, newY);
            const wasInCave = this.isCave(this.selector.x, this.selector.y);

            if (this.levelText) {
                // Update text dan depth
                this.levelText.setText(isEnteringCave ? 'CAVE' : `L${currentLevel}`);
                this.levelText.setPosition(newX, newY - 12).setDepth(1 + currentLevel);
                this.selector.setDepth(1 + currentLevel);

                // Log saat masuk atau keluar cave
                if (isEnteringCave && !wasInCave) {
                    console.log('Entering cave...');
                } else if (!isEnteringCave && wasInCave) {
                    console.log('Exiting cave...');
                }
            }

            // Debug info
            // const tileX = Math.floor(newX / this.tileSize);
            // const tileY = Math.floor(newY / this.tileSize);
            // const tileGround1 = this.map.getTileAt(tileX, tileY, true, 'Ground Level 1');
            // const tileGround2 = this.map.getTileAt(tileX, tileY, true, 'Ground Level 2');
            
            // console.log(`Position [${tileX},${tileY}] Level ${currentLevel}`);
            // console.log(`Ground1: ${tileGround1?.index}, Ground2: ${tileGround2?.index}`);
        }
    }
}