import Phaser from 'phaser';
import './style.css';
import { BattleScene } from './scenes/BattleScene';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  backgroundColor: '#040b1b',
  scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH, width: window.innerWidth, height: window.innerHeight },
  render: { antialias: true, pixelArt: false },
  scene: [BattleScene],
  input: { activePointers: 3 }
});
