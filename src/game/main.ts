import { Boot } from './scenes/Boot';
import { GameOver } from './scenes/GameOver';
import { Game as MainGame } from './scenes/Game';
import { MainMenu } from './scenes/MainMenu';
import { AUTO, Game } from 'phaser';
import { Preloader } from './scenes/Preloader';
import { WestOffShore } from './scenes/maps/WestOffShore';

//  Find out more information about the Game Config at:
//  https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const width = window.innerWidth;
const height = window.innerHeight;
const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    width: width,
    height: height,
    parent: 'game-container',
    backgroundColor: '#028af8',
    pixelArt: true,
    banner: false,
    scene: [
        Boot,
        Preloader,
        MainMenu,
        MainGame,
        GameOver,
        WestOffShore,
    ]
};

const StartGame = (parent: string) => {

    return new Game({ ...config, parent });

}

export default StartGame;
