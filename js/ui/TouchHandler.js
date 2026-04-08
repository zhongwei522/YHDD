export class TouchHandler {
  constructor(canvas, game, ui) {
      this.canvas = canvas;
      this.game = game;
      this.ui = ui;
      
      // 拖拽状态
      this.isDragging = false;
      
      this.initTouchEvents();
  }
  
  initTouchEvents() {
      // 触摸开始
      wx.onTouchStart((event) => {
          const touch = event.touches[0];
          const x = touch.clientX;
          const y = touch.clientY;
          
          // 检查UI按钮
          const button = this.ui.checkUIButton(x, y);
          if (button === 'share') {
              this.game.shareForHelp();
              return;
          } else if (button === 'reset') {
              this.game.resetLevel();
              return;
          }
          
          // 开始拖拽划线
          const started = this.game.startDrag(x, y);
          if (started) {
              this.isDragging = true;
              // 震动反馈（可选）
              wx.vibrateShort({ type: 'light' });
          }
      });
      
      // 触摸移动（拖拽划线）
      wx.onTouchMove((event) => {
          if (!this.isDragging) return;
          
          const touch = event.touches[0];
          const x = touch.clientX;
          const y = touch.clientY;
          
          this.game.dragMove(x, y);
      });
      
      // 触摸结束
      wx.onTouchEnd((event) => {
          if (this.isDragging) {
              this.game.endDrag();
              this.isDragging = false;
          }
      });
      
      // 触摸取消（例如被系统打断）
      wx.onTouchCancel((event) => {
          if (this.isDragging) {
              this.game.endDrag();
              this.isDragging = false;
          }
      });
  }
}