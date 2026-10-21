import { OneStrokeGame } from './game/OneStrokeGame.js';
import { CanvasUI } from './ui/CanvasUI.js';
import { TouchHandler } from './ui/TouchHandler.js';

const systemInfo = wx.getSystemInfoSync();
const screenWidth = systemInfo.windowWidth;
const screenHeight = systemInfo.windowHeight;
const dpr = systemInfo.pixelRatio || 1;

const canvas = wx.createCanvas();
canvas.width = screenWidth * dpr;
canvas.height = screenHeight * dpr;

const game = new OneStrokeGame(screenWidth, screenHeight);
const ui = new CanvasUI(canvas, screenWidth, screenHeight, dpr);
const touchHandler = new TouchHandler(canvas, game, ui);

// 开启被动分享菜单（分享裂变）
if (wx.showShareMenu) wx.showShareMenu({ withShareTicket: false });
if (wx.onShareAppMessage) {
    wx.onShareAppMessage(() => ({
        title: `我在「一划向前」闯到第 ${game.meta.progress} 关了，来挑战我！`
    }));
}

function gameLoop() {
    ui.draw(game.getGameData());
    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

export { game };
