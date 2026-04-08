import { OneStrokeGame } from './game/OneStrokeGame.js';
import { CanvasUI } from './ui/CanvasUI.js';
import { TouchHandler } from './ui/TouchHandler.js';

// 获取系统信息
const systemInfo = wx.getSystemInfoSync();
const screenWidth = systemInfo.windowWidth;
const screenHeight = systemInfo.windowHeight;

// 创建canvas
const canvas = wx.createCanvas();
canvas.width = screenWidth;
canvas.height = screenHeight;

// 创建游戏实例
const game = new OneStrokeGame(screenWidth, screenHeight);
const ui = new CanvasUI(canvas, screenWidth, screenHeight);
const touchHandler = new TouchHandler(canvas, game, ui);

// 游戏循环
function gameLoop() {
    const gameData = game.getGameData();
    ui.draw(gameData);
    requestAnimationFrame(gameLoop);
}

// 启动
requestAnimationFrame(gameLoop);

export { game };