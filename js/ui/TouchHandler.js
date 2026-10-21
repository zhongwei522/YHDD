export class TouchHandler {
  constructor(canvas, game, ui) {
      this.canvas = canvas;
      this.game = game;
      this.ui = ui;

      this.isDragging = false;

      this.initTouchEvents();
  }

  initTouchEvents() {
    wx.onTouchStart((event) => {
        const touch = event.touches[0];
        const x = touch.clientX;
        const y = touch.clientY;

        const button = this.ui.checkUIButton(x, y);

        // 1) 胜利结算面板：只响应结算按钮
        if (this.game.isGameFinished) {
            if (button === 'win_next') this.game.nextLevel();
            else if (button === 'win_retry') this.game.retryLevel();
            else if (button === 'win_share') this.game.shareResult();
            return;
        }

        // 2) 主题商店面板
        if (this.ui.showThemePanel) {
            if (button === 'closeTheme') this.ui.toggleThemePanel();
            else if (button && button.startsWith('theme_')) {
                const id = button.slice(6);
                const theme = this.game.getThemes().find((t) => t.id === id);
                if (theme) {
                    if (theme.unlocked) this.game.setActiveTheme(id);
                    else {
                        const res = this.game.unlockTheme(id);
                        if (!res.ok && res.reason === '金币不足') {
                            wx.showToast({ title: '金币不足，多通关赚金币吧', icon: 'none' });
                        }
                    }
                }
            }
            return;
        }

        // 3) 排行榜面板
        if (this.ui.showLeaderboardPanel) {
            if (button === 'closeRank') this.ui.toggleLeaderboardPanel();
            return;
        }

        // 4) 通关记录面板
        if (this.ui.showLevelPanel) {
            if (button === 'closePanel') this.ui.toggleLevelPanel();
            else if (button === 'current_level') {
                this.game.backToCurrentProgress();
                this.ui.toggleLevelPanel();
            } else if (button && button.startsWith('level_')) {
                const level = parseInt(button.split('_')[1]);
                this.game.replayLevel(level);
                this.ui.toggleLevelPanel();
            }
            return;
        }

        // 5) 顶部功能按钮
        if (button === 'history') { this.ui.toggleLevelPanel(); return; }
        if (button === 'hint' || button === 'share') { this.game.shareForHelp(); return; }
        if (button === 'daily') { this.game.startDailyChallenge(); return; }
        if (button === 'theme') { this.ui.toggleThemePanel(); return; }
        if (button === 'rank') { this.ui.toggleLeaderboardPanel(); return; }
        if (button === 'reset') { this.game.resetLevel(); return; }

        // 6) 画板拖拽
        const started = this.game.startDrag(x, y);
        if (started) {
            this.isDragging = true;
            wx.vibrateShort({ type: 'light' });
        }
    });

      wx.onTouchMove((event) => {
          if (!this.isDragging) return;
          if (this.ui.showLevelPanel || this.ui.showThemePanel || this.ui.showLeaderboardPanel) return;

          const touch = event.touches[0];
          const x = touch.clientX;
          const y = touch.clientY;

          this.game.dragMove(x, y);
      });

      wx.onTouchEnd((event) => {
          if (this.isDragging) {
              this.game.endDrag();
              this.isDragging = false;
          }
      });

      wx.onTouchCancel((event) => {
          if (this.isDragging) {
              this.game.endDrag();
              this.isDragging = false;
          }
      });
  }
}
