import { Leaderboard } from '../game/Leaderboard.js';

export class CanvasUI {
  constructor(canvas, width, height, dpr) {
      this.canvas = canvas;
      this.dpr = dpr || 1;
      this.ctx = canvas.getContext('2d');
      this.ctx.scale(this.dpr, this.dpr);
      this.width = width;
      this.height = height;
      this.uiRegions = {};

      this.showLevelPanel = false;
      this.panelScrollOffset = 0;
      this.showThemePanel = false;
      this.showLeaderboardPanel = false;
      this.rankRenderKey = '';

      this.cloudOffset = 0;
      this.starTwinkle = 0;

      this.backgroundType = 0;

      this.backgroundCache = {};
      this.lastCachedBackground = -1;

      this.startAnimations();
  }
  
  startAnimations() {
      const animate = () => {
          this.cloudOffset = (this.cloudOffset + 0.15) % (this.width * 2);
          this.starTwinkle = (this.starTwinkle + 0.03) % (Math.PI * 2);
          if (!this.showLevelPanel) {
              requestAnimationFrame(animate);
          } else {
              setTimeout(() => requestAnimationFrame(animate), 100);
          }
      };
      requestAnimationFrame(animate);
  }
  
  draw(gameData) {
      this.uiRegions = {};
      this.backgroundType = (gameData.activeBg !== undefined) ? gameData.activeBg : 0;
      this.drawBackground();
      this.drawGameBoard(gameData);
      this.drawUI(gameData);

      if (this.showLevelPanel) this.drawLevelPanel(gameData);
      if (this.showThemePanel) this.drawThemePanel(gameData);
      if (this.showLeaderboardPanel) this.drawLeaderboardPanel(gameData);
      if (gameData.isGameFinished && gameData.winResult) this.drawWinPanel(gameData);
      this.drawAchievementToast(gameData);
  }
  
  drawBackground() {
      if (!this.backgroundCache[this.backgroundType]) {
          this.cacheStaticBackground(this.backgroundType);
      }
      
      this.ctx.drawImage(this.backgroundCache[this.backgroundType], 0, 0, this.width, this.height);
      
      this.drawDynamicBackgroundElements();
  }
  
  cacheStaticBackground(type) {
      const cacheCanvas = wx.createCanvas();
      cacheCanvas.width = this.width * this.dpr;
      cacheCanvas.height = this.height * this.dpr;
      const cacheCtx = cacheCanvas.getContext('2d');
      cacheCtx.scale(this.dpr, this.dpr);
      
      const originalCtx = this.ctx;
      this.ctx = cacheCtx;
      
      switch(type) {
          case 0: this.drawSkyStaticBackground(); break;
          case 1: this.drawCatStaticBackground(); break;
          case 2: this.drawRainbowStaticBackground(); break;
          case 3: this.drawStarStaticBackground(); break;
          case 4: this.drawHeartStaticBackground(); break;
          case 5: this.drawForestStaticBackground(); break;
          default: this.drawSkyStaticBackground();
      }
      
      this.ctx = originalCtx;
      this.backgroundCache[type] = cacheCanvas;
  }
  
  drawDynamicBackgroundElements() {
      switch(this.backgroundType) {
          case 0:
              this.drawCloudsLoop();
              this.drawFlowers();
              break;
          case 1:
              this.drawFloatingPawPrints();
              break;
          case 2:
              this.drawCloudsLoop();
              break;
          case 3:
              this.drawTwinklingStars();
              break;
          case 4:
              this.drawFloatingHearts();
              break;
          case 5:
              this.drawCloudsLoop();
              break;
      }
  }
  
  // ========== 背景1：蓝天白云（优化循环） ==========
  drawSkyStaticBackground() {
      const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
      gradient.addColorStop(0, '#87CEEB');
      gradient.addColorStop(0.5, '#B0E0E6');
      gradient.addColorStop(1, '#E0F7FA');
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(0, 0, this.width, this.height);
      
      this.ctx.fillStyle = '#7CBA3F';
      this.ctx.fillRect(0, this.height - 60, this.width, 60);
      
      this.drawSun();
  }
  
  drawFlowers() {
      for (let i = 0; i < 15; i++) {
          const x = (i * 50 + this.cloudOffset * 0.8) % (this.width + 50) - 25;
          const y = this.height - 55;
          this.ctx.fillStyle = ['#FF6B6B', '#FFE66D', '#FF9F4A'][i % 3];
          this.ctx.beginPath();
          this.ctx.arc(x, y, 4, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.fillStyle = '#5A9E2E';
          this.ctx.fillRect(x - 1, y, 2, 8);
      }
  }
  
  drawCloudsLoop() {
      const cloudPositions = [0, 0.3, 0.6, 0.8, 0.15];
      const cloudYs = [60, 120, 40, 150, 180];
      const cloudSizes = [60, 50, 45, 55, 40];
      
      for (let i = 0; i < cloudPositions.length; i++) {
          let x = (this.width * cloudPositions[i] + this.cloudOffset * (0.2 + i * 0.1)) % (this.width + 200) - 100;
          if (x < -100) x = this.width + 100;
          this.drawCloud(x, cloudYs[i], cloudSizes[i]);
      }
  }
  
  drawCloud(x, y, size) {
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
      this.ctx.beginPath();
      this.ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
      this.ctx.arc(x + size * 0.4, y - size * 0.2, size * 0.4, 0, Math.PI * 2);
      this.ctx.arc(x + size * 0.7, y, size * 0.45, 0, Math.PI * 2);
      this.ctx.arc(x - size * 0.3, y - size * 0.1, size * 0.35, 0, Math.PI * 2);
      this.ctx.arc(x + size * 0.2, y + size * 0.1, size * 0.3, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      this.ctx.beginPath();
      this.ctx.arc(x - size * 0.2, y - size * 0.15, size * 0.2, 0, Math.PI * 2);
      this.ctx.fill();
  }
  
  drawSun() {
      const sunX = this.width - 50;
      const sunY = 50;
      const sunR = 30;
      
      // 光晕
      for (let i = 3; i > 0; i--) {
          this.ctx.fillStyle = `rgba(255, 200, 100, ${0.1 / i})`;
          this.ctx.beginPath();
          this.ctx.arc(sunX, sunY, sunR + i * 8, 0, Math.PI * 2);
          this.ctx.fill();
      }
      
      this.ctx.fillStyle = '#FFD93D';
      this.ctx.beginPath();
      this.ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
      this.ctx.fill();
      
      // 光芒
      for (let i = 0; i < 12; i++) {
          const angle = i * Math.PI * 2 / 12;
          const x1 = sunX + Math.cos(angle) * (sunR + 3);
          const y1 = sunY + Math.sin(angle) * (sunR + 3);
          const x2 = sunX + Math.cos(angle) * (sunR + 15);
          const y2 = sunY + Math.sin(angle) * (sunR + 15);
          this.ctx.beginPath();
          this.ctx.moveTo(x1, y1);
          this.ctx.lineTo(x2, y2);
          this.ctx.strokeStyle = '#FFD93D';
          this.ctx.lineWidth = 2;
          this.ctx.stroke();
      }
  }
  
  // ========== 背景2：布偶猫背景 ==========
  drawCatStaticBackground() {
      const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
      gradient.addColorStop(0, '#E8D5E0');
      gradient.addColorStop(0.5, '#F0E6EE');
      gradient.addColorStop(1, '#FAF0F5');
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(0, 0, this.width, this.height);
      
      this.ctx.fillStyle = '#D4B8C4';
      this.ctx.fillRect(0, this.height - 80, this.width, 80);
      
      for (let i = 0; i < 30; i++) {
          this.ctx.fillStyle = `rgba(200, 170, 180, ${0.3 + Math.random() * 0.3})`;
          this.ctx.beginPath();
          this.ctx.ellipse(i * 35, this.height - 75, 12, 5, 0, 0, Math.PI * 2);
          this.ctx.fill();
      }
      
      this.drawRagdollCat(70, this.height - 95, 45);
      this.drawRagdollCat(this.width - 85, this.height - 110, 40);
      this.drawRagdollCat(this.width / 2 + 20, this.height - 85, 35);
      
      this.drawCatToy(this.width - 45, this.height - 45, 18);
  }
  
  drawRagdollCat(x, y, size) {
      // 身体（浅色）
      this.ctx.fillStyle = '#F5E6E8';
      this.ctx.beginPath();
      this.ctx.ellipse(x, y, size * 0.9, size * 0.75, 0, 0, Math.PI * 2);
      this.ctx.fill();
      
      // 头部
      this.ctx.fillStyle = '#F5E6E8';
      this.ctx.beginPath();
      this.ctx.ellipse(x, y - size * 0.55, size * 0.7, size * 0.65, 0, 0, Math.PI * 2);
      this.ctx.fill();
      
      // 布偶猫特有的深色面部
      this.ctx.fillStyle = '#C4A0A8';
      this.ctx.beginPath();
      this.ctx.ellipse(x, y - size * 0.45, size * 0.5, size * 0.4, 0, 0, Math.PI * 2);
      this.ctx.fill();
      
      // 耳朵
      this.ctx.fillStyle = '#D4A8B0';
      this.ctx.beginPath();
      this.ctx.moveTo(x - size * 0.5, y - size * 0.95);
      this.ctx.lineTo(x - size * 0.75, y - size * 1.25);
      this.ctx.lineTo(x - size * 0.3, y - size * 1.05);
      this.ctx.fill();
      this.ctx.beginPath();
      this.ctx.moveTo(x + size * 0.5, y - size * 0.95);
      this.ctx.lineTo(x + size * 0.75, y - size * 1.25);
      this.ctx.lineTo(x + size * 0.3, y - size * 1.05);
      this.ctx.fill();
      
      // 耳朵内侧
      this.ctx.fillStyle = '#FFB6C1';
      this.ctx.beginPath();
      this.ctx.moveTo(x - size * 0.5, y - size * 0.98);
      this.ctx.lineTo(x - size * 0.65, y - size * 1.15);
      this.ctx.lineTo(x - size * 0.4, y - size * 1.02);
      this.ctx.fill();
      this.ctx.beginPath();
      this.ctx.moveTo(x + size * 0.5, y - size * 0.98);
      this.ctx.lineTo(x + size * 0.65, y - size * 1.15);
      this.ctx.lineTo(x + size * 0.4, y - size * 1.02);
      this.ctx.fill();
      
      // 蓝色眼睛（布偶猫特征）
      this.ctx.fillStyle = '#6B9EC7';
      this.ctx.beginPath();
      this.ctx.arc(x - size * 0.25, y - size * 0.65, size * 0.12, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.beginPath();
      this.ctx.arc(x + size * 0.25, y - size * 0.65, size * 0.12, 0, Math.PI * 2);
      this.ctx.fill();
      
      // 瞳孔
      this.ctx.fillStyle = '#2C3E50';
      this.ctx.beginPath();
      this.ctx.arc(x - size * 0.25, y - size * 0.65, size * 0.06, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.beginPath();
      this.ctx.arc(x + size * 0.25, y - size * 0.65, size * 0.06, 0, Math.PI * 2);
      this.ctx.fill();
      
      // 高光
      this.ctx.fillStyle = '#fff';
      this.ctx.beginPath();
      this.ctx.arc(x - size * 0.29, y - size * 0.68, size * 0.03, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.beginPath();
      this.ctx.arc(x + size * 0.21, y - size * 0.68, size * 0.03, 0, Math.PI * 2);
      this.ctx.fill();
      
      // 粉色鼻子
      this.ctx.fillStyle = '#FF8FAB';
      this.ctx.beginPath();
      this.ctx.ellipse(x, y - size * 0.5, size * 0.07, size * 0.05, 0, 0, Math.PI * 2);
      this.ctx.fill();
      
      // 胡须
      this.ctx.beginPath();
      this.ctx.moveTo(x - size * 0.35, y - size * 0.52);
      this.ctx.lineTo(x - size * 0.65, y - size * 0.58);
      this.ctx.moveTo(x - size * 0.35, y - size * 0.48);
      this.ctx.lineTo(x - size * 0.65, y - size * 0.48);
      this.ctx.moveTo(x + size * 0.35, y - size * 0.52);
      this.ctx.lineTo(x + size * 0.65, y - size * 0.58);
      this.ctx.moveTo(x + size * 0.35, y - size * 0.48);
      this.ctx.lineTo(x + size * 0.65, y - size * 0.48);
      this.ctx.strokeStyle = '#C4A0A8';
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
      
      // 尾巴
      this.ctx.beginPath();
      this.ctx.moveTo(x + size * 0.8, y);
      this.ctx.quadraticCurveTo(x + size * 1.1, y - size * 0.2, x + size * 0.9, y - size * 0.5);
      this.ctx.strokeStyle = '#F5E6E8';
      this.ctx.lineWidth = size * 0.3;
      this.ctx.stroke();
  }
  
  drawCatToy(x, y, size) {
      this.ctx.fillStyle = '#FF8FAB';
      this.ctx.beginPath();
      this.ctx.arc(x, y, size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.fillStyle = '#fff';
      for (let i = 0; i < 3; i++) {
          this.ctx.beginPath();
          this.ctx.arc(x - size * 0.3 + i * size * 0.3, y - size * 0.2, size * 0.15, 0, Math.PI * 2);
          this.ctx.fill();
      }
      // 绳子
      this.ctx.beginPath();
      this.ctx.moveTo(x, y - size);
      this.ctx.lineTo(x, y - size - 15);
      this.ctx.stroke();
      // 羽毛
      for (let i = 0; i < 3; i++) {
          this.ctx.beginPath();
          this.ctx.moveTo(x, y - size - 15);
          this.ctx.quadraticCurveTo(x + 5 + i * 3, y - size - 20, x + 8 + i * 2, y - size - 12);
          this.ctx.strokeStyle = '#E8A0B0';
          this.ctx.stroke();
      }
  }
  
  drawFloatingPawPrints() {
      for (let i = 0; i < 8; i++) {
          const x = (i * 70 + this.cloudOffset * 0.4) % (this.width + 100) - 50;
          const y = 30 + (i % 3) * 40;
          this.ctx.fillStyle = `rgba(200, 150, 170, ${0.15 + Math.sin(this.starTwinkle + i) * 0.05})`;
          this.drawPawPrint(x, y, 10);
      }
  }
  
  drawPawPrint(x, y, size) {
      this.ctx.beginPath();
      this.ctx.ellipse(x, y, size * 0.4, size * 0.5, 0, 0, Math.PI * 2);
      this.ctx.ellipse(x - size * 0.35, y - size * 0.4, size * 0.2, size * 0.25, 0, 0, Math.PI * 2);
      this.ctx.ellipse(x + size * 0.35, y - size * 0.4, size * 0.2, size * 0.25, 0, 0, Math.PI * 2);
      this.ctx.ellipse(x - size * 0.5, y - size * 0.15, size * 0.16, size * 0.2, 0, 0, Math.PI * 2);
      this.ctx.ellipse(x + size * 0.5, y - size * 0.15, size * 0.16, size * 0.2, 0, 0, Math.PI * 2);
      this.ctx.fill();
  }
  
  // ========== 背景3：彩虹（优化） ==========
  drawRainbowStaticBackground() {
      const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
      gradient.addColorStop(0, '#FF9A9E');
      gradient.addColorStop(0.3, '#FECFEF');
      gradient.addColorStop(0.6, '#A1C4FD');
      gradient.addColorStop(1, '#C2E9FB');
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(0, 0, this.width, this.height);
      
      const rainbowColors = ['#FF6B6B', '#FFB347', '#FFE66D', '#4ECDC4', '#45B7D1', '#9B59B6', '#FF9FF3'];
      for (let i = 0; i < rainbowColors.length; i++) {
          this.ctx.beginPath();
          this.ctx.arc(this.width / 2, this.height + 40, 140 - i * 12, Math.PI, 0, true);
          this.ctx.strokeStyle = rainbowColors[i];
          this.ctx.lineWidth = 10;
          this.ctx.stroke();
      }
  }
  
  // ========== 背景4：星空（真实感） ==========
  drawStarStaticBackground() {
      const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
      gradient.addColorStop(0, '#0B0C10');
      gradient.addColorStop(0.4, '#1A1A2E');
      gradient.addColorStop(0.7, '#16213E');
      gradient.addColorStop(1, '#0F3460');
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(0, 0, this.width, this.height);
      
      this.ctx.fillStyle = 'rgba(100, 80, 150, 0.15)';
      for (let i = 0; i < 5; i++) {
          this.ctx.beginPath();
          this.ctx.ellipse(this.width / 2 + Math.sin(i) * 50, this.height / 2, this.width * 0.6, this.height * 0.3, 0.3, 0, Math.PI * 2);
          this.ctx.fill();
      }
      
      this.ctx.fillStyle = '#FFEAA7';
      this.ctx.beginPath();
      this.ctx.arc(this.width - 60, 70, 35, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = 'rgba(200, 170, 120, 0.2)';
      this.ctx.beginPath();
      this.ctx.arc(this.width - 70, 60, 8, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.beginPath();
      this.ctx.arc(this.width - 50, 80, 6, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.beginPath();
      this.ctx.arc(this.width - 55, 55, 4, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = 'rgba(255, 235, 180, 0.08)';
      this.ctx.beginPath();
      this.ctx.arc(this.width - 60, 70, 55, 0, Math.PI * 2);
      this.ctx.fill();
  }
  
  drawTwinklingStars() {
      const stars = [
          { x: 50, y: 80, size: 2.5, brightness: 0.9 },
          { x: 150, y: 45, size: 2, brightness: 0.8 },
          { x: 250, y: 120, size: 3, brightness: 1 },
          { x: 320, y: 60, size: 1.8, brightness: 0.7 },
          { x: 400, y: 90, size: 2.2, brightness: 0.85 },
          { x: 480, y: 40, size: 2.8, brightness: 0.95 },
          { x: 550, y: 130, size: 2, brightness: 0.75 },
          { x: 620, y: 70, size: 2.5, brightness: 0.9 },
          { x: 700, y: 100, size: 1.5, brightness: 0.65 },
          { x: 60, y: 200, size: 1.8, brightness: 0.7 },
          { x: 180, y: 250, size: 2.2, brightness: 0.85 },
          { x: 350, y: 220, size: 1.5, brightness: 0.6 },
          { x: 520, y: 260, size: 2, brightness: 0.8 },
          { x: 680, y: 210, size: 1.8, brightness: 0.7 },
          { x: 750, y: 280, size: 2.5, brightness: 0.9 },
      ];
      
      for (const star of stars) {
          const twinkle = Math.sin(this.starTwinkle * 2 + star.x) * 0.2;
          this.ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness + twinkle})`;
          this.drawStarShape(star.x, star.y, star.size);
      }
      
      for (let i = 0; i < 120; i++) {
          const x = (i * 131) % this.width;
          const y = (i * 253) % (this.height - 150);
          const size = 0.8 + (i % 3) * 0.5;
          const twinkle = Math.sin(this.starTwinkle + i) * 0.3;
          this.ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + (i % 5) / 15 + twinkle})`;
          this.ctx.beginPath();
          this.ctx.arc(x, y, size, 0, Math.PI * 2);
          this.ctx.fill();
      }
  }
  
  drawStarShape(x, y, size) {
      const spikes = 4;
      const outerRadius = size * 2;
      const innerRadius = size * 0.8;
      let rot = Math.PI / 2;
      const step = Math.PI / spikes;
      this.ctx.beginPath();
      for (let i = 0; i < spikes; i++) {
          const x1 = x + Math.cos(rot) * outerRadius;
          const y1 = y + Math.sin(rot) * outerRadius;
          this.ctx.lineTo(x1, y1);
          rot += step;
          const x2 = x + Math.cos(rot) * innerRadius;
          const y2 = y + Math.sin(rot) * innerRadius;
          this.ctx.lineTo(x2, y2);
          rot += step;
      }
      this.ctx.closePath();
      this.ctx.fill();
  }
  
  // ========== 背景5：爱心 ==========
  drawHeartStaticBackground() {
      const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
      gradient.addColorStop(0, '#FFDEE9');
      gradient.addColorStop(1, '#B5FFFC');
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(0, 0, this.width, this.height);
      
      for (let i = 0; i < 25; i++) {
          const x = (i * 63) % (this.width + 60) - 30;
          const y = (i * 37) % (this.height - 100) + 50;
          const size = 10 + (i % 6);
          this.ctx.fillStyle = `rgba(255, 105, 180, ${0.15 + (i % 7) / 20})`;
          this.drawHeart(x, y, size);
      }
  }
  
  drawFloatingHearts() {
      for (let i = 0; i < 6; i++) {
          const x = (this.width * 0.2 + i * 60 + this.cloudOffset * 0.6) % (this.width + 120) - 60;
          const y = 40 + i * 35;
          this.ctx.fillStyle = `rgba(255, 120, 180, 0.35)`;
          this.drawHeart(x, y, 18);
      }
  }
  
  drawHeart(x, y, size) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, y + size * 0.3);
      this.ctx.bezierCurveTo(x - size, y - size * 0.7, x - size * 1.3, y + size * 0.3, x, y + size);
      this.ctx.bezierCurveTo(x + size * 1.3, y + size * 0.3, x + size, y - size * 0.7, x, y + size * 0.3);
      this.ctx.fill();
  }
  
  // ========== 背景6：森林 ==========
  drawForestStaticBackground() {
      const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
      gradient.addColorStop(0, '#87CEEB');
      gradient.addColorStop(0.4, '#98D8C8');
      gradient.addColorStop(1, '#6B8E23');
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(0, 0, this.width, this.height);
      
      this.ctx.fillStyle = '#8FBC8F';
      this.ctx.beginPath();
      this.ctx.moveTo(0, this.height - 120);
      this.ctx.lineTo(100, this.height - 180);
      this.ctx.lineTo(250, this.height - 140);
      this.ctx.lineTo(400, this.height - 200);
      this.ctx.lineTo(550, this.height - 150);
      this.ctx.lineTo(this.width, this.height - 190);
      this.ctx.lineTo(this.width, this.height - 120);
      this.ctx.fill();
      
      for (let i = 0; i < 9; i++) {
          const x = i * (this.width / 8) + 20;
          this.drawTree(x, this.height - 95, 30);
      }
      
      this.drawMushroom(45, this.height - 70, 10);
      this.drawMushroom(this.width - 60, this.height - 75, 9);
      this.drawMushroom(this.width / 2 + 50, this.height - 65, 8);
      
      this.drawSun();
  }
  
  drawTree(x, y, size) {
      this.ctx.fillStyle = '#8B5A2B';
      this.ctx.fillRect(x - size * 0.12, y - size * 0.4, size * 0.24, size * 0.7);
      
      this.ctx.fillStyle = '#3CB371';
      this.ctx.beginPath();
      this.ctx.moveTo(x, y - size);
      this.ctx.lineTo(x - size * 0.35, y - size * 0.25);
      this.ctx.lineTo(x - size * 0.15, y - size * 0.25);
      this.ctx.lineTo(x - size * 0.25, y);
      this.ctx.lineTo(x, y - size * 0.35);
      this.ctx.lineTo(x + size * 0.25, y);
      this.ctx.lineTo(x + size * 0.15, y - size * 0.25);
      this.ctx.lineTo(x + size * 0.35, y - size * 0.25);
      this.ctx.fill();
  }
  
  drawMushroom(x, y, size) {
      this.ctx.fillStyle = '#E8A87C';
      this.ctx.beginPath();
      this.ctx.ellipse(x, y, size * 0.6, size * 0.4, 0, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.fillStyle = '#F5DEB3';
      this.ctx.fillRect(x - size * 0.12, y, size * 0.24, size * 0.45);
      this.ctx.fillStyle = '#fff';
      for (let i = 0; i < 4; i++) {
          this.ctx.beginPath();
          this.ctx.arc(x - size * 0.25 + i * size * 0.12, y - size * 0.08, size * 0.06, 0, Math.PI * 2);
          this.ctx.fill();
      }
  }
  
  // ========== 以下为游戏核心方法（保持不变） ==========
  
  drawGameBoard(gameData) {
    const { rows, cols, nodes, startId, endId, currentPath, isGameStarted, isGameFinished, gameArea, edges } = gameData;
    
    if (rows === 0 || cols === 0) return;
    
    const { x: areaX, y: areaY, width: areaW, height: areaH } = gameArea;
    const cellW = areaW / cols;
    const cellH = areaH / rows;
    
    // 游戏区域外发光
    this.ctx.shadowBlur = 15;
    this.ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.fillRect(areaX - 3, areaY - 3, areaW + 6, areaH + 6);
    this.ctx.shadowBlur = 0;
    
    // 游戏区域边框（渐变）
    const borderGradient = this.ctx.createLinearGradient(areaX - 2, areaY - 2, areaX + areaW + 2, areaY + areaH + 2);
    borderGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
    borderGradient.addColorStop(1, 'rgba(255, 255, 255, 0.3)');
    this.ctx.strokeStyle = borderGradient;
    this.ctx.lineWidth = 2.5;
    this.ctx.strokeRect(areaX - 2, areaY - 2, areaW + 4, areaH + 4);
    
    // 内阴影效果
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    this.ctx.fillRect(areaX - 1, areaY - 1, areaW + 2, areaH + 2);
    
    for (let id in nodes) {
        const node = nodes[id];
        const x = areaX + node.col * cellW;
        const y = areaY + node.row * cellH;
        
        const radius = Math.min(cellW, cellH) * 0.2;
        
        this.ctx.shadowBlur = 3;
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        
        let bgColor;
        let gradient;
        
        const rows = this.getRowsFromNodes(nodes);
        const cols = this.getColsFromNodes(nodes);
        const allDirections = this.getAllPossibleDirectionsForNode(node.id, nodes, edges, rows, cols);
        const expectedDirections = this.getExpectedDirectionCount(node.row, node.col, rows, cols);
        const hasRestrictedDirections = allDirections.length < expectedDirections && !node.isObstacle && node.id !== startId;
        
        if (node.isObstacle) {
            gradient = this.ctx.createLinearGradient(x, y, x + cellW, y + cellH);
            gradient.addColorStop(0, 'rgba(150, 155, 170, 0.85)');
            gradient.addColorStop(1, 'rgba(120, 125, 140, 0.8)');
            bgColor = gradient;
        } else if (node.id === startId) {
            gradient = this.ctx.createLinearGradient(x, y, x + cellW, y + cellH);
            gradient.addColorStop(0, '#a8e6cf');
            gradient.addColorStop(1, '#88d8b0');
            bgColor = gradient;
        } else if (node.id === endId) {
            const visitedCount = Object.values(nodes).filter(n => n.visited && !n.isObstacle).length;
            const totalCount = Object.values(nodes).filter(n => !n.isObstacle).length;
            const isLastStep = (visitedCount + 1 === totalCount);
            
            if (node.visited) {
                gradient = this.ctx.createLinearGradient(x, y, x + cellW, y + cellH);
                gradient.addColorStop(0, '#ffb3ba');
                gradient.addColorStop(1, '#ff8fa3');
                bgColor = gradient;
            } else if (!isLastStep && isGameStarted && !isGameFinished) {
                gradient = this.ctx.createLinearGradient(x, y, x + cellW, y + cellH);
                gradient.addColorStop(0, 'rgba(150, 155, 170, 0.8)');
                gradient.addColorStop(1, 'rgba(120, 125, 140, 0.75)');
                bgColor = gradient;
            } else {
                gradient = this.ctx.createLinearGradient(x, y, x + cellW, y + cellH);
                gradient.addColorStop(0, '#ffb3ba');
                gradient.addColorStop(1, '#ff8fa3');
                bgColor = gradient;
            }
        } else if (node.visited) {
            gradient = this.ctx.createLinearGradient(x, y, x + cellW, y + cellH);
            gradient.addColorStop(0, '#ffd3a5');
            gradient.addColorStop(1, '#ffb878');
            bgColor = gradient;
        } else if (node.isCheckpoint) {
            gradient = this.ctx.createLinearGradient(x, y, x + cellW, y + cellH);
            gradient.addColorStop(0, '#d4a5ff');
            gradient.addColorStop(1, '#b886e0');
            bgColor = gradient;
        } else {
            gradient = this.ctx.createLinearGradient(x, y, x + cellW, y + cellH);
            gradient.addColorStop(0, 'rgba(178, 215, 255, 0.9)');
            gradient.addColorStop(1, 'rgba(148, 185, 235, 0.85)');
            bgColor = gradient;
        }
        
        this.roundRect(x, y, cellW - 2, cellH - 2, radius);
        this.ctx.fillStyle = bgColor;
        this.ctx.fill();
        
        this.ctx.shadowBlur = 0;
        this.ctx.beginPath();
        this.roundRect(x + 1, y + 1, cellW - 4, 3, radius * 0.5);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fill();
        
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 1.5;
        this.roundRect(x, y, cellW - 2, cellH - 2, radius);
        this.ctx.stroke();
        
        if (hasRestrictedDirections) {
            this.drawDirectionalMarks(x, y, cellW, cellH, allDirections, radius);
        }
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = `bold ${Math.min(cellW, cellH) * 0.3}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.shadowBlur = 2;
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        
        if (node.isObstacle) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            this.ctx.font = `bold ${Math.min(cellW, cellH) * 0.4}px Arial`;
            this.ctx.fillText('☁', x + cellW/2, y + cellH/2);
        } else if (node.id === startId) {
            this.ctx.font = `bold ${Math.min(cellW, cellH) * 0.35}px Arial`;
            this.ctx.fillText('🌟', x + cellW/2, y + cellH/2);
        } else if (node.id === endId) {
            this.ctx.font = `bold ${Math.min(cellW, cellH) * 0.35}px Arial`;
            this.ctx.fillText('🏁', x + cellW/2, y + cellH/2);
        } else if (node.visited) {
            this.ctx.font = `bold ${Math.min(cellW, cellH) * 0.35}px Arial`;
            this.ctx.fillText('⭐', x + cellW/2, y + cellH/2);
        } else if (node.isCheckpoint) {
            this.ctx.font = `bold ${Math.min(cellW, cellH) * 0.3}px Arial`;
            this.ctx.fillStyle = '#fff';
            this.ctx.fillText(`${node.checkpointIndex}`, x + cellW/2, y + cellH/2);
        }
        
        this.ctx.shadowBlur = 0;
    }
    
    this.drawConnections(gameData, areaX, areaY, cellW, cellH);
    this.drawPathOverlay(gameData, areaX, areaY, cellW, cellH);
}
  
  getExpectedDirectionCount(row, col, rows, cols) {
      let count = 0;
      if (row > 0) count++;
      if (row < rows - 1) count++;
      if (col > 0) count++;
      if (col < cols - 1) count++;
      return count;
  }
  
  getAllPossibleDirectionsForNode(nodeId, nodes, edges, rows, cols) {
      const node = nodes[nodeId];
      if (!node) return [];
      const directions = [];
      if (node.row > 0) {
          const upId = (node.row - 1) * cols + node.col;
          const key = `${Math.min(nodeId, upId)}-${Math.max(nodeId, upId)}`;
          if (edges[key]) directions.push('up');
      }
      if (node.row + 1 < rows) {
          const downId = (node.row + 1) * cols + node.col;
          const key = `${Math.min(nodeId, downId)}-${Math.max(nodeId, downId)}`;
          if (edges[key]) directions.push('down');
      }
      if (node.col > 0) {
          const leftId = node.row * cols + (node.col - 1);
          const key = `${Math.min(nodeId, leftId)}-${Math.max(nodeId, leftId)}`;
          if (edges[key]) directions.push('left');
      }
      if (node.col + 1 < cols) {
          const rightId = node.row * cols + (node.col + 1);
          const key = `${Math.min(nodeId, rightId)}-${Math.max(nodeId, rightId)}`;
          if (edges[key]) directions.push('right');
      }
      return directions;
  }
  
  getAvailableDirectionsForNode(nodeId, nodes, edges) {
      const node = nodes[nodeId];
      if (!node) return [];
      const rows = this.getRowsFromNodes(nodes);
      const cols = this.getColsFromNodes(nodes);
      const directions = [];
      
      if (node.row > 0) {
          const upId = (node.row - 1) * cols + node.col;
          const key = `${Math.min(nodeId, upId)}-${Math.max(nodeId, upId)}`;
          const edge = edges[key];
          if (edge && !edge.used && nodes[upId] && !nodes[upId].visited && !nodes[upId].isObstacle) {
              directions.push('up');
          }
      }
      if (node.row + 1 < rows) {
          const downId = (node.row + 1) * cols + node.col;
          const key = `${Math.min(nodeId, downId)}-${Math.max(nodeId, downId)}`;
          const edge = edges[key];
          if (edge && !edge.used && nodes[downId] && !nodes[downId].visited && !nodes[downId].isObstacle) {
              directions.push('down');
          }
      }
      if (node.col > 0) {
          const leftId = node.row * cols + (node.col - 1);
          const key = `${Math.min(nodeId, leftId)}-${Math.max(nodeId, leftId)}`;
          const edge = edges[key];
          if (edge && !edge.used && nodes[leftId] && !nodes[leftId].visited && !nodes[leftId].isObstacle) {
              directions.push('left');
          }
      }
      if (node.col + 1 < cols) {
          const rightId = node.row * cols + (node.col + 1);
          const key = `${Math.min(nodeId, rightId)}-${Math.max(nodeId, rightId)}`;
          const edge = edges[key];
          if (edge && !edge.used && nodes[rightId] && !nodes[rightId].visited && !nodes[rightId].isObstacle) {
              directions.push('right');
          }
      }
      return directions;
  }
  
  getRowsFromNodes(nodes) {
      let maxRow = 0;
      for (let id in nodes) if (nodes[id].row > maxRow) maxRow = nodes[id].row;
      return maxRow + 1;
  }
  
  getColsFromNodes(nodes) {
      let maxCol = 0;
      for (let id in nodes) if (nodes[id].col > maxCol) maxCol = nodes[id].col;
      return maxCol + 1;
  }
  
  drawArrow(x, y, size, rotation, color, opacity = 1) {
      this.ctx.save();
      this.ctx.translate(x, y);
      this.ctx.rotate(rotation);
      this.ctx.beginPath();
      this.ctx.moveTo(size, 0);
      this.ctx.lineTo(-size, -size * 0.6);
      this.ctx.lineTo(-size * 0.3, 0);
      this.ctx.lineTo(-size, size * 0.6);
      this.ctx.closePath();
      this.ctx.fillStyle = color;
      this.ctx.globalAlpha = opacity;
      this.ctx.fill();
      this.ctx.globalAlpha = 1;
      this.ctx.restore();
  }
  
  roundRect(x, y, w, h, r) {
    if (r === undefined) r = Math.min(w, h) * 0.1;
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.ctx.beginPath();
    this.ctx.moveTo(x + r, y);
    this.ctx.lineTo(x + w - r, y);
    this.ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    this.ctx.lineTo(x + w, y + h - r);
    this.ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.ctx.lineTo(x + r, y + h);
    this.ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    this.ctx.lineTo(x, y + r);
    this.ctx.quadraticCurveTo(x, y, x + r, y);
    this.ctx.closePath();
    return this.ctx;
}

drawDirectionalMarks(x, y, cellW, cellH, availableDirections, radius) {
    const allSides = ['up', 'down', 'left', 'right'];
    const blockedSides = allSides.filter(s => !availableDirections.includes(s));
    
    this.ctx.save();
    
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    
    for (const side of blockedSides) {
        this.ctx.beginPath();
        switch(side) {
            case 'up':
                this.ctx.rect(x, y, cellW, cellH * 0.15);
                break;
            case 'down':
                this.ctx.rect(x, y + cellH * 0.85, cellW, cellH * 0.15);
                break;
            case 'left':
                this.ctx.rect(x, y, cellW * 0.15, cellH);
                break;
            case 'right':
                this.ctx.rect(x + cellW * 0.85, y, cellW * 0.15, cellH);
                break;
        }
        this.ctx.fill();
    }
    
    this.ctx.restore();
}
  
  drawConnections(gameData, areaX, areaY, cellW, cellH) {
    const { edges, nodes } = gameData;
    
    for (let key in edges) {
        const edge = edges[key];
        if (!edge.used) continue;
        
        const fromNode = nodes[edge.from];
        const toNode = nodes[edge.to];
        
        if (!fromNode || !toNode) continue;
        if (fromNode.isObstacle || toNode.isObstacle) continue;
        
        const fromX = areaX + (fromNode.col + 0.5) * cellW;
        const fromY = areaY + (fromNode.row + 0.5) * cellH;
        const toX = areaX + (toNode.col + 0.5) * cellW;
        const toY = areaY + (toNode.row + 0.5) * cellH;
        
        // 连线发光效果
        this.ctx.shadowBlur = 6;
        this.ctx.shadowColor = '#f9ca24';
        
        this.ctx.beginPath();
        this.ctx.moveTo(fromX, fromY);
        this.ctx.lineTo(toX, toY);
        this.ctx.strokeStyle = '#f9ca24';
        this.ctx.lineWidth = Math.max(5, Math.min(cellW, cellH) * 0.18);
        this.ctx.lineCap = 'round';
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(fromX, fromY);
        this.ctx.lineTo(toX, toY);
        this.ctx.strokeStyle = '#ffda79';
        this.ctx.lineWidth = Math.max(3, Math.min(cellW, cellH) * 0.1);
        this.ctx.stroke();
        
        this.ctx.shadowBlur = 0;
    }
}
  
  drawPathOverlay(gameData, areaX, areaY, cellW, cellH) {
    const { currentPath } = gameData;
    if (currentPath.length < 2) return;
    
    for (let i = 0; i < currentPath.length; i++) {
        const node = currentPath[i];
        if (node.isObstacle) continue;
        
        const x = areaX + node.col * cellW;
        const y = areaY + node.row * cellH;
        
        // 路径高光边框
        this.ctx.shadowBlur = 4;
        this.ctx.shadowColor = '#fff9c4';
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 3.5;
        this.roundRect(x + 2, y + 2, cellW - 6, cellH - 6, Math.min(cellW, cellH) * 0.1);
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
    }
    
    // 路径节点小圆点
    for (let i = 0; i < currentPath.length; i++) {
        const node = currentPath[i];
        if (node.isObstacle) continue;
        
        const cx = areaX + (node.col + 0.5) * cellW;
        const cy = areaY + (node.row + 0.5) * cellH;
        
        this.ctx.shadowBlur = 3;
        this.ctx.shadowColor = '#fff';
        this.ctx.fillStyle = '#fff9c4';
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, Math.min(cellW, cellH) * 0.12, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#f9ca24';
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, Math.min(cellW, cellH) * 0.07, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
    }
}

  
  drawUI(gameData) {
    const { currentLevel, totalLevels, dailyShareCount, maxDailyShare, isGameStarted, isGameFinished, rows, cols, nodes, startId, endId, gameArea, isReplaying, isDailyMode, coins, combo, currentLevelBestStars, dailyCompletedToday } = gameData;

    // 顶部栏
    const topBarHeight = 70;
    const topGradient = this.ctx.createLinearGradient(0, 0, 0, topBarHeight);
    topGradient.addColorStop(0, 'rgba(15, 52, 96, 0.95)');
    topGradient.addColorStop(1, 'rgba(15, 52, 96, 0.85)');
    this.ctx.fillStyle = topGradient;
    this.ctx.fillRect(0, 0, this.width, topBarHeight);

    this.ctx.fillStyle = '#e94560';
    this.ctx.fillRect(0, topBarHeight - 5, this.width, 5);

    // 标题
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 22px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    let levelText = totalLevels === '∞' ? `第 ${currentLevel} 关` : `第 ${currentLevel} / ${totalLevels} 关`;
    if (isDailyMode) levelText = '📅 每日挑战';
    else if (isReplaying) levelText = `⭐ 重玩第 ${currentLevel} 关 ⭐`;
    this.ctx.fillText(levelText, this.width / 2, 34);

    // 第二行：金币 / 最佳星级 / 连击
    this.ctx.font = '13px Arial';
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`🪙 ${coins}`, 14, 60);

    this.ctx.textAlign = 'right';
    this.ctx.fillText(combo >= 2 ? `🔥 连击 x${combo}` : '', this.width - 14, 60);

    if (currentLevelBestStars > 0) {
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '12px Arial';
        this.ctx.fillText(`最佳 ${'★'.repeat(currentLevelBestStars)}`, this.width / 2, 60);
    }

    // 按钮行
    const buttonY = 78;
    const buttonH = 34;
    const buttons = [
        { key: 'reset',   label: '🔄 重置', color: '#ff4757' },
        { key: 'hint',    label: '💡 提示', color: '#2ed573' },
        { key: 'daily',   label: dailyCompletedToday ? '📅 每日✓' : '📅 每日', color: '#ffa502' },
        { key: 'theme',   label: '🎨 主题', color: '#9b59b6' },
        { key: 'rank',    label: '🏆 排行', color: '#e67e22' },
        { key: 'history', label: '📜 记录', color: '#1e90ff' }
    ];
    const gap = 4, marginX = 8;
    const btnW = (this.width - marginX * 2 - gap * (buttons.length - 1)) / buttons.length;
    buttons.forEach((b, i) => {
        const bx = marginX + i * (btnW + gap);
        this.drawButton(bx, buttonY, btnW, buttonH, b.label, b.color, b.key);
    });

    // 底部栏
    const bottomGradient = this.ctx.createLinearGradient(0, this.height - 40, 0, this.height);
    bottomGradient.addColorStop(0, 'rgba(15, 52, 96, 0.85)');
    bottomGradient.addColorStop(1, 'rgba(15, 52, 96, 0.95)');
    this.ctx.fillStyle = bottomGradient;
    this.ctx.fillRect(0, this.height - 40, this.width, 40);

    if (isGameFinished) {
        // 胜利面板覆盖，这里不画文字
    } else if (!isGameStarted) {
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'alphabetic';
        this.ctx.fillText('按住绿色起点 S 拖动连线', this.width / 2, this.height - 12);
    } else {
        const visitedCount = Object.values(nodes).filter(n => n.visited && !n.isObstacle).length;
        const totalCount = Object.values(nodes).filter(n => !n.isObstacle).length;
        const progress = Math.floor(visitedCount / totalCount * 100);
        const progressBarWidth = 150, progressBarX = this.width / 2 - progressBarWidth / 2, progressBarY = this.height - 28;

        this.roundRect(progressBarX, progressBarY, progressBarWidth, 6, 3);
        this.ctx.fillStyle = 'rgba(87, 96, 111, 0.8)';
        this.ctx.fill();

        const progressGradient = this.ctx.createLinearGradient(progressBarX, progressBarY, progressBarX + progressBarWidth * visitedCount / totalCount, progressBarY);
        progressGradient.addColorStop(0, '#2ed573');
        progressGradient.addColorStop(1, '#26b865');
        this.ctx.fillStyle = progressGradient;
        this.roundRect(progressBarX, progressBarY, progressBarWidth * visitedCount / totalCount, 6, 3);
        this.ctx.fill();

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '11px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'alphabetic';
        this.ctx.fillText(`${visitedCount}/${totalCount} (${progress}%)`, this.width / 2, this.height - 10);
    }

    if (isGameStarted && !isGameFinished && gameArea) {
        const visitedCount = Object.values(nodes).filter(n => n.visited && !n.isObstacle).length;
        const totalCount = Object.values(nodes).filter(n => !n.isObstacle).length;
        const isLastStep = (visitedCount + 1 === totalCount);
        if (!isLastStep) {
            const endNode = nodes[endId];
            if (endNode && !endNode.visited && !endNode.isObstacle) {
                const cellW = gameArea.width / cols, cellH = gameArea.height / rows;
                const endX = gameArea.x + (endNode.col + 0.5) * cellW;
                const endY = gameArea.y + (endNode.row + 0.5) * cellH;

                this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
                this.ctx.beginPath();
                this.ctx.arc(endX, endY, Math.min(cellW, cellH) * 0.28, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.fillStyle = '#fff';
                this.ctx.font = `${Math.min(cellW, cellH) * 0.24}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText('🔒', endX, endY);
            }
        }
    }
}

  
drawLevelPanel(gameData) {
  const completedLevels = gameData.completedLevels || [];
  const currentProgress = gameData.progress || 1;
  const currentLevel = gameData.currentLevel;
  this.ctx.textBaseline = 'alphabetic';
  
  this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
  this.ctx.fillRect(0, 0, this.width, this.height);
  
  const panelW = this.width - 30, panelH = this.height - 80, panelX = 15, panelY = 40;
  
  this.ctx.fillStyle = '#16213e';
  this.ctx.fillRect(panelX, panelY, panelW, panelH);
  this.ctx.strokeStyle = '#e94560';
  this.ctx.lineWidth = 2;
  this.ctx.strokeRect(panelX, panelY, panelW, panelH);
  
  this.ctx.fillStyle = '#fff';
  this.ctx.font = 'bold 18px Arial';
  this.ctx.textAlign = 'center';
  this.ctx.fillText('📜 通关记录', this.width / 2, panelY + 30);
  
  this.ctx.fillStyle = '#aaa';
  this.ctx.font = '10px Arial';
  this.ctx.fillText('点击关卡可重新挑战', this.width / 2, panelY + 52);
  
  const listStartY = panelY + 70, itemHeight = 36, itemsPerRow = 5;
  const itemW = (panelW - 40) / itemsPerRow, itemMargin = 5, leftMargin = 12;
  let idx = 0;
  const sortedLevels = [...completedLevels].sort((a, b) => a - b);
  
  // 先移除旧的 level_ 区域，避免重复
  for (let key in this.uiRegions) {
      if (key.startsWith('level_')) {
          delete this.uiRegions[key];
      }
  }
  
  for (let level of sortedLevels) {
      if (level === currentProgress) continue;
      const col = idx % itemsPerRow, row = Math.floor(idx / itemsPerRow);
      const itemX = panelX + leftMargin + col * (itemW + itemMargin);
      const itemY = listStartY + row * (itemHeight + itemMargin);
      if (itemY + itemHeight > panelY + panelH - 50) break;
      let bgColor = '#70a1ff';
      if (level === gameData.currentLevel && gameData.isReplaying) bgColor = '#ffa502';
      this.ctx.fillStyle = bgColor;
      this.ctx.fillRect(itemX, itemY, itemW, itemHeight);
      this.ctx.strokeStyle = '#fff';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(itemX, itemY, itemW, itemHeight);
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 13px Arial';
      this.ctx.fillText(`${level}`, itemX + itemW/2, itemY + itemHeight/2 + 4);
      this.uiRegions[`level_${level}`] = { x: itemX, y: itemY, w: itemW, h: itemHeight };
      idx++;
  }
  
  const currentCol = idx % itemsPerRow, currentRow = Math.floor(idx / itemsPerRow);
  let currentItemX = panelX + leftMargin + currentCol * (itemW + itemMargin);
  let currentItemY = listStartY + currentRow * (itemHeight + itemMargin);
  if (currentItemY + itemHeight > panelY + panelH - 50) {
      currentItemX = panelX + leftMargin;
      currentItemY = currentItemY + itemHeight + itemMargin;
  }
  
  this.ctx.fillStyle = '#2ed573';
  this.ctx.fillRect(currentItemX, currentItemY, itemW, itemHeight);
  this.ctx.strokeStyle = '#fff';
  this.ctx.strokeRect(currentItemX, currentItemY, itemW, itemHeight);
  this.ctx.fillStyle = '#fff';
  this.ctx.font = 'bold 11px Arial';
  this.ctx.fillText(`当前 ${currentProgress} 关`, currentItemX + itemW/2, currentItemY + itemHeight/2 + 4);
  
  // 确保 current_level 区域被正确注册（先删除旧的再添加）
  if (this.uiRegions['current_level']) {
      delete this.uiRegions['current_level'];
  }
  this.uiRegions['current_level'] = { x: currentItemX, y: currentItemY, w: itemW, h: itemHeight };
  
  if (sortedLevels.filter(l => l !== currentProgress).length === 0) {
      this.ctx.fillStyle = '#aaa';
      this.ctx.font = '11px Arial';
      this.ctx.fillText('通关更多关卡后会显示在这里', panelX + leftMargin, listStartY + itemHeight + itemMargin + 20);
  }
  
  this.ctx.fillStyle = '#aaa';
  this.ctx.font = '10px Arial';
  this.ctx.fillText('当前进度: 第 ' + currentProgress + ' 关', this.width / 2, panelY + panelH - 50);
  
  const closeW = 60, closeH = 28, closeX = this.width / 2 - closeW / 2, closeY = panelY + panelH - closeH - 8;
  this.ctx.fillStyle = '#ff4757';
  this.ctx.fillRect(closeX, closeY, closeW, closeH);
  this.ctx.fillStyle = '#fff';
  this.ctx.font = 'bold 12px Arial';
  this.ctx.fillText('关闭', closeX + closeW/2, closeY + closeH/2 + 4);
  
  if (this.uiRegions['closePanel']) {
      delete this.uiRegions['closePanel'];
  }
  this.uiRegions['closePanel'] = { x: closeX, y: closeY, w: closeW, h: closeH };
}
  
  // ========== 通用绘制辅助 ==========
  shade(hex, p) {
      const n = parseInt(hex.slice(1), 16);
      const r = Math.max(0, Math.min(255, Math.round(((n >> 16) & 255) * p)));
      const g = Math.max(0, Math.min(255, Math.round(((n >> 8) & 255) * p)));
      const b = Math.max(0, Math.min(255, Math.round((n & 255) * p)));
      return `rgb(${r},${g},${b})`;
  }

  drawStars(x, y, stars, size) {
      const gap = size * 1.3;
      const startX = x - (gap * 3) / 2 + gap / 2;
      this.ctx.font = `${size}px Arial`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      for (let i = 0; i < 3; i++) {
          this.ctx.fillStyle = i < stars ? '#ffd93d' : 'rgba(255,255,255,0.18)';
          this.ctx.fillText('★', startX + i * gap, y);
      }
  }

  drawButton(x, y, w, h, label, color, key, fontSize = 11) {
      const g = this.ctx.createLinearGradient(x, y, x + w, y + h);
      g.addColorStop(0, color);
      g.addColorStop(1, this.shade(color, 0.82));
      this.ctx.fillStyle = g;
      this.roundRect(x, y, w, h, 8);
      this.ctx.fill();
      this.ctx.fillStyle = '#fff';
      this.ctx.font = `bold ${fontSize}px Arial`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(label, x + w / 2, y + h / 2 + 1);
      this.uiRegions[key] = { x, y, w, h };
  }

  themePreviewColor(bg) {
      return ['#87CEEB', '#E8D5E0', '#FF9A9E', '#0B0C10', '#FFDEE9', '#6B8E23'][bg] || '#87CEEB';
  }

  // ========== 胜利结算面板 ==========
  drawWinPanel(gameData) {
      const r = gameData.winResult;
      if (!r) return;

      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      this.ctx.fillRect(0, 0, this.width, this.height);

      const pw = this.width - 50, ph = 360, px = 25, py = (this.height - ph) / 2;
      this.ctx.fillStyle = '#16213e';
      this.roundRect(px, py, pw, ph, 16);
      this.ctx.fill();
      this.ctx.strokeStyle = '#e94560';
      this.ctx.lineWidth = 2;
      this.roundRect(px, py, pw, ph, 16);
      this.ctx.stroke();

      this.ctx.fillStyle = '#ffd93d';
      this.ctx.font = 'bold 26px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(r.isDaily ? '🎉 每日挑战完成！' : '🎉 通关成功！', this.width / 2, py + 42);

      this.drawStars(this.width / 2, py + 100, r.stars, 42);

      this.ctx.fillStyle = '#fff';
      this.ctx.font = '20px Arial';
      let coinText = `+${r.coins} 🪙`;
      if (r.dailyBonus > 0) coinText += `（含每日奖励 +${r.dailyBonus}）`;
      this.ctx.fillText(coinText, this.width / 2, py + 152);

      if (r.combo >= 2) {
          this.ctx.fillStyle = '#ff9f4a';
          this.ctx.font = 'bold 18px Arial';
          this.ctx.fillText(`🔥 三星连击 x${r.combo}`, this.width / 2, py + 184);
      }

      const btnW = (pw - 60) / 2;
      this.drawButton(px + 20, py + ph - 112, pw - 40, 40, '📤 炫耀一下', '#e67e22', 'win_share', 15);
      this.drawButton(px + 20, py + ph - 58, btnW, 42, r.isDaily ? '返回闯关' : '下一关', '#2ed573', 'win_next', 16);
      this.drawButton(px + 20 + btnW + 20, py + ph - 58, btnW, 42, '🔁 重玩', '#1e90ff', 'win_retry', 16);
  }

  // ========== 主题商店 ==========
  drawThemePanel(gameData) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
      this.ctx.fillRect(0, 0, this.width, this.height);

      const pw = this.width - 30, ph = this.height - 120, px = 15, py = 60;
      this.ctx.fillStyle = '#16213e';
      this.ctx.fillRect(px, py, pw, ph);
      this.ctx.strokeStyle = '#e94560';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(px, py, pw, ph);

      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 20px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText('🎨 主题皮肤', this.width / 2, py + 30);

      this.ctx.fillStyle = '#ffd93d';
      this.ctx.font = 'bold 16px Arial';
      this.ctx.fillText(`🪙 ${gameData.coins}`, this.width / 2, py + 58);

      const themes = gameData.themes || [];
      const itemH = 56;
      const listY = py + 84;

      themes.forEach((t, i) => {
          const y = listY + i * (itemH + 6);
          if (y + itemH > py + ph - 60) return;
          const x = px + 12, w = pw - 24;

          this.ctx.fillStyle = t.active ? 'rgba(46,213,115,0.25)' : 'rgba(255,255,255,0.06)';
          this.ctx.fillRect(x, y, w, itemH);
          this.ctx.strokeStyle = t.active ? '#2ed573' : 'rgba(255,255,255,0.2)';
          this.ctx.lineWidth = t.active ? 2 : 1;
          this.ctx.strokeRect(x, y, w, itemH);

          this.ctx.fillStyle = this.themePreviewColor(t.bg);
          this.ctx.fillRect(x + 6, y + 6, itemH - 12, itemH - 12);

          this.ctx.fillStyle = '#fff';
          this.ctx.textAlign = 'left';
          this.ctx.textBaseline = 'middle';
          this.ctx.font = 'bold 16px Arial';
          this.ctx.fillText(t.name, x + itemH + 6, y + 20);
          this.ctx.font = '12px Arial';
          if (t.active) { this.ctx.fillStyle = '#2ed573'; this.ctx.fillText('使用中', x + itemH + 6, y + 40); }
          else if (t.unlocked) { this.ctx.fillStyle = '#70a1ff'; this.ctx.fillText('点击使用', x + itemH + 6, y + 40); }
          else { this.ctx.fillStyle = '#ffd93d'; this.ctx.fillText(`🔒 ${t.price} 金币解锁`, x + itemH + 6, y + 40); }

          this.uiRegions[`theme_${t.id}`] = { x, y, w, h: itemH };
      });

      this.drawButton(this.width / 2 - 40, py + ph - 48, 80, 36, '关闭', '#ff4757', 'closeTheme', 14);
  }

  toggleThemePanel() {
      this.showThemePanel = !this.showThemePanel;
  }

  // ========== 排行榜 ==========
  drawLeaderboardPanel(gameData) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
      this.ctx.fillRect(0, 0, this.width, this.height);

      const pw = this.width - 30, ph = this.height - 150, px = 15, py = 70;
      this.ctx.fillStyle = '#16213e';
      this.ctx.fillRect(px, py, pw, ph);
      this.ctx.strokeStyle = '#e94560';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(px, py, pw, ph);

      const iw = pw - 20, ih = ph - 70;
      const renderKey = `${Math.round(iw)}x${Math.round(ih)}`;
      if (this.rankRenderKey !== renderKey) {
          this.rankRenderKey = renderKey;
          Leaderboard.requestRender(iw, ih);
      }

      const shared = Leaderboard.getSharedCanvas();
      if (shared) {
          this.ctx.drawImage(shared, px + 10, py + 10, iw, ih);
      } else {
          this.ctx.fillStyle = 'rgba(255,255,255,0.6)';
          this.ctx.font = '16px Arial';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText('排行榜需发布后可见', this.width / 2, py + ph / 2);
      }

      this.drawButton(this.width / 2 - 40, py + ph - 48, 80, 36, '关闭', '#ff4757', 'closeRank', 14);
  }

  toggleLeaderboardPanel() {
      this.showLeaderboardPanel = !this.showLeaderboardPanel;
      if (this.showLeaderboardPanel) Leaderboard.requestRender();
  }

  // ========== 成就提示 ==========
  drawAchievementToast(gameData) {
      const t = gameData.achievementToast;
      if (!t) return;
      const elapsed = Date.now() - t.at;
      if (elapsed > 2600) return;

      const alpha = elapsed < 300 ? elapsed / 300 : (elapsed > 2100 ? (2600 - elapsed) / 500 : 1);
      const w = this.width - 60, h = 56, x = 30, y = this.height - 150;
      this.ctx.globalAlpha = Math.max(0, alpha);
      this.ctx.fillStyle = '#1f2a44';
      this.roundRect(x, y, w, h, 12);
      this.ctx.fill();
      this.ctx.strokeStyle = '#ffd93d';
      this.ctx.lineWidth = 2;
      this.roundRect(x, y, w, h, 12);
      this.ctx.stroke();
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 18px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(`${t.icon} 成就达成：${t.name}`, this.width / 2, y + h / 2);
      this.ctx.globalAlpha = 1;
  }

  toggleLevelPanel() {
      this.showLevelPanel = !this.showLevelPanel;
      if (!this.showLevelPanel) {
          for (let key in this.uiRegions) {
              if (key.startsWith('level_') || key === 'closePanel' || key === 'current_level') {
                  delete this.uiRegions[key];
              }
          }
      }
  }
  
  checkUIButton(x, y) {
      for (let key in this.uiRegions) {
          const btn = this.uiRegions[key];
          if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
              return key;
          }
      }
      return null;
  }
}