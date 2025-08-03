import { Scene, GameObjects } from 'phaser';

export class MainMenu extends Scene
{
    background: GameObjects.Image;
    logo: GameObjects.Image;
    title: GameObjects.Text;

    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        // Get center coordinates
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;

        // Add welcome text
        this.add.text(centerX, centerY - 100, 'Welcome', {
            fontFamily: 'Arial Black', 
            fontSize: 64,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5);

        // Create play button
        const buttonWidth = 200;
        const buttonHeight = 80;
        const button = this.add.graphics();

        // Draw button shape
        button
            .lineStyle(2, 0x000000)
            .fillStyle(0x4a90e2)
            .fillRoundedRect(centerX - buttonWidth/2, centerY, buttonWidth, buttonHeight, 16)
            .strokeRoundedRect(centerX - buttonWidth/2, centerY, buttonWidth, buttonHeight, 16);

        // Add play text
        this.add.text(centerX, centerY + buttonHeight/2, 'PLAY', {
            fontFamily: 'Arial Black',
            fontSize: 32,
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        // Make button interactive
        const hitArea = new Phaser.Geom.Rectangle(centerX - buttonWidth/2, centerY, buttonWidth, buttonHeight);
        button.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

        // Add hover effect
        button.on('pointerover', () => {
            button.clear()
                .lineStyle(2, 0x000000)
                .fillStyle(0x357abd)
                .fillRoundedRect(centerX - buttonWidth/2, centerY, buttonWidth, buttonHeight, 16)
                .strokeRoundedRect(centerX - buttonWidth/2, centerY, buttonWidth, buttonHeight, 16);
        });

        button.on('pointerout', () => {
            button.clear()
                .lineStyle(2, 0x000000)
                .fillStyle(0x4a90e2)
                .fillRoundedRect(centerX - buttonWidth/2, centerY, buttonWidth, buttonHeight, 16)
                .strokeRoundedRect(centerX - buttonWidth/2, centerY, buttonWidth, buttonHeight, 16);
        });

        // Add click handler
        button.on('pointerdown', () => {
            this.scene.start('WestOffShore');
        });
    }
}
