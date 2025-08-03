import { Scene } from "phaser";

export class WestOffShore extends Scene {
    private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
    private selector?: Phaser.GameObjects.Rectangle;
    private map?: Phaser.Tilemaps.Tilemap;
    private readonly tileSize = 16;
    private readonly moveSpeed = 16;
    private readonly OBSTACLES = {
        'Ground Level 1': [
            1,      // WATER
            77,     // SHALLOW WATER
        ],
        'Ground Level 2': [
            6,       // CLIFF
            7,       // CLIFF
            8,       // CLIFF
            9,       // CLIFF
            10,      // CLIFF
            13,      // CLIFF
            15,      // CLIFF
            20,      // CLIFF
            21,      // CLIFF
            22,      // CLIFF
            23,      // CLIFF
            24,      // CLIFF
            27,      // CLIFF
            28,      // CLIFF
            29,      // CLIFF
            30,      // CLIFF
            31,      // CLIFF
            32,      // CLIFF
            33,      // CLIFF
            34,      // CLIFF
            36,      // CLIFF
            37,      // CLIFF
            38,      // CLIFF
            41,      // CLIFF
            42,      // CLIFF
            43,      // CLIFF
            44,      // CLIFF
            45,      // CLIFF
            48,      // CLIFF
            49,      // CLIFF
            50,      // CLIFF
            55,      // CLIFF
            57,      // CLIFF
            58,      // CLIFF
            59,      // CLIFF
            62,      // CLIFF
            63,      // CLIFF
            64,      // CLIFF
            65,      // CLIFF
            66,      // CLIFF
        ]
    };
    private readonly MOVE_DELAY = 100; // Delay antara gerakan dalam milidetik
    private lastMoveTime = 0; // Waktu terakhir bergerak

    // Fungsi untuk mengecek apakah posisi tersebut adalah obstacle
    private isObstacles(x: number, y: number): boolean {
        if (!this.map) return true; // Anggap true jika map belum load untuk safety
        
        // Dapatkan tile di posisi tersebut (dalam koordinat tile, bukan pixel)
        const tileX = Math.floor(x / this.tileSize);
        const tileY = Math.floor(y / this.tileSize);
        
        // Cek setiap layer untuk obstacles
        for (const [layerName, obstacleIds] of Object.entries(this.OBSTACLES)) {
            const tile = this.map.getTileAt(tileX, tileY, true, layerName);
            if (tile && obstacleIds.includes(tile.index)) {
                return true; // Ada obstacle di salah satu layer
            }
        }
        
        return false; // Tidak ada obstacle di semua layer
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

        if (!grassTileset || !cliffTileset || !cliffWaterTileset || !deadGrassTileset || !shoreTileset || !texturedGrassTileset || !winterGrassTileset || !this.map) {
            console.error('Failed to load tilesets or map');
            return;
        }
        
        // Gabungkan tileset untuk digunakan di layer
        const allTilesets = [grassTileset, cliffTileset, cliffWaterTileset, deadGrassTileset, shoreTileset, texturedGrassTileset, winterGrassTileset];

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
            // Hanya pindah jika bukan obstacle
            if (!this.isObstacles(targetX, this.selector.y)) {
                newX = targetX;
                this.lastMoveTime = time;
            }
        }
        else if (this.cursors.right.isDown && canMove) {
            const targetX = Math.min(maxX, this.selector.x + this.moveSpeed);
            if (!this.isObstacles(targetX, this.selector.y)) {
                newX = targetX;
                this.lastMoveTime = time;
            }
        }

        // Cek pergerakan vertikal
        if (this.cursors.up.isDown && canMove) {
            const targetY = Math.max(0, this.selector.y - this.moveSpeed);
            if (!this.isObstacles(this.selector.x, targetY)) {
                newY = targetY;
                this.lastMoveTime = time;
            }
        }
        else if (this.cursors.down.isDown && canMove) {
            const targetY = Math.min(maxY, this.selector.y + this.moveSpeed);
            if (!this.isObstacles(this.selector.x, targetY)) {
                newY = targetY;
                this.lastMoveTime = time;
            }
        }

        // Update posisi selector jika posisi baru valid
        if (newX !== this.selector.x || newY !== this.selector.y) {
            // Debug: tampilkan info tile
            const tileX = Math.floor(newX / this.tileSize);
            const tileY = Math.floor(newY / this.tileSize);
            const tileGround1 = this.map.getTileAt(tileX, tileY, true, 'Ground Level 1');
            const tileGround2 = this.map.getTileAt(tileX, tileY, true, 'Ground Level 2');
            
            if (tileGround2?.index) {
                console.log(`Moving to tile [${tileX},${tileY}] on Ground Level 2 with index: ${tileGround2.index}`);
            } else if (tileGround1?.index) {
                console.log(`Moving to tile [${tileX},${tileY}] on Ground Level 1 with index: ${tileGround1.index}`);
            }
            
            this.selector.setPosition(newX, newY);
        }
    }
}