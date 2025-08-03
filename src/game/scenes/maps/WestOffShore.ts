import { Scene } from "phaser";

export class WestOffShore extends Scene {
    private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
    private selector?: Phaser.GameObjects.Rectangle;
    private map?: Phaser.Tilemaps.Tilemap;
    private readonly tileSize = 16;
    private readonly moveSpeed = 16;

    constructor() {
        super('WestOffShore');
    }

    create() {
        // Buat tilemap
        this.map = this.make.tilemap({ key: 'WestOffshoreMap' });
        
        // Load semua tileset yang dibutuhkan
        const grassTileset = this.map.addTilesetImage('Grass', 'grass');
        const cliffTileset = this.map.addTilesetImage('Cliff', 'cliff');
        
        if (!grassTileset || !cliffTileset || !this.map) {
            console.error('Failed to load tilesets or map');
            return;
        }
        
        // Gabungkan tileset untuk digunakan di layer
        const allTilesets = [grassTileset, cliffTileset];

        // Debug info
        console.log('Available layers:', this.map.layers.map(l => l.name));
        console.log('Layer data:', this.map.layers);
        console.log('Tileset info:', this.map.tilesets);

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

        // Set posisi awal di tengah layar
        this.selector.setPosition(
            Math.floor(this.cameras.main.width / 2 / this.tileSize) * this.tileSize,
            Math.floor(this.cameras.main.height / 2 / this.tileSize) * this.tileSize
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

    update() {
        if (!this.map || !this.selector || !this.cursors) return;

        // Hitung batas map
        const maxX = this.map.width * this.tileSize - this.tileSize;
        const maxY = this.map.height * this.tileSize - this.tileSize;

        // Gerakkan selector berdasarkan input dengan batasan
        let newX = this.selector.x;
        let newY = this.selector.y;

        if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
            newX = Math.max(0, this.selector.x - this.moveSpeed);
        }
        else if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
            newX = Math.min(maxX, this.selector.x + this.moveSpeed);
        }

        if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
            newY = Math.max(0, this.selector.y - this.moveSpeed);
        }
        else if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
            newY = Math.min(maxY, this.selector.y + this.moveSpeed);
        }

        // Update posisi selector
        this.selector.setPosition(newX, newY);
    }
}