export class CanvasUI {
  constructor(canvas, width, height) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.width = width;
      this.height = height;
      this.uiRegions = {};
  }
  
  draw(gameData) {
      this.clearCanvas();
      this.drawGameBoard(gameData);
      this.drawUI(gameData);
  }
  
  clearCanvas() {
      this.ctx.fillStyle = '#1a1a2e';
      this.ctx.fillRect(0, 0, this.width, this.height);
  }
  
  drawGameBoard(gameData) {
      const { rows, cols, nodes, startId, endId, currentPath, isGameStarted, isGameFinished, gameArea } = gameData;
      
      if (rows === 0 || cols === 0) return;
      
      const { x: areaX, y: areaY, width: areaW, height: areaH } = gameArea;
      const cellW = areaW / cols;
      const cellH = areaH / rows;
      
      // 绘制游戏区域背景（圆角矩形）
      this.ctx.fillStyle = '#16213e';
      this.ctx.shadowBlur = 0;
      this.ctx.fillRect(areaX - 2, areaY - 2, areaW + 4, areaH + 4);
      
      // 1. 绘制方格
      for (let id in nodes) {
          const node = nodes[id];
          const x = areaX + node.col * cellW;
          const y = areaY + node.row * cellH;
          
          // 确定格子颜色
          let bgColor;
          if (node.id === startId) {
              bgColor = '#2ed573';  // 起点绿色
          } else if (node.id === endId) {
              // 终点：如果还没到最后一步，显示为锁定状态
              const visitedCount = Object.values(nodes).filter(n => n.visited).length;
              const totalCount = Object.keys(nodes).length;
              const isLastStep = (visitedCount + 1 === totalCount);
              
              if (node.visited) {
                  bgColor = '#ff4757';  // 已访问红色
              } else if (!isLastStep && isGameStarted && !isGameFinished) {
                  bgColor = '#57606f';  // 锁定的灰色（还不能进终点）
              } else {
                  bgColor = '#ff4757';  // 正常红色
              }
          } else if (node.visited) {
              bgColor = '#ffa502';  // 已访问橙色
          } else {
              bgColor = '#70a1ff';  // 未访问蓝色
          }
          
          // 绘制方格（圆角）
          const radius = Math.min(cellW, cellH) * 0.1;
          this.roundRect(x, y, cellW - 2, cellH - 2, radius);
          this.ctx.fillStyle = bgColor;
          this.ctx.fill();
          
          // 绘制边框
          this.ctx.strokeStyle = '#0f3460';
          this.ctx.lineWidth = 1.5;
          this.roundRect(x, y, cellW - 2, cellH - 2, radius);
          this.ctx.stroke();
          
          // 绘制文字
          this.ctx.fillStyle = '#fff';
          this.ctx.font = `bold ${Math.min(cellW, cellH) * 0.35}px Arial`;
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          
          if (node.id === startId) {
              this.ctx.fillText('S', x + cellW/2, y + cellH/2);
          } else if (node.id === endId) {
              this.ctx.fillText('E', x + cellW/2, y + cellH/2);
          } else if (node.visited) {
              this.ctx.fillText('✓', x + cellW/2, y + cellH/2);
          }
      }
      
      // 2. 绘制连接线
      this.drawConnections(gameData, areaX, areaY, cellW, cellH);
      
      // 3. 绘制当前路径高亮
      this.drawPathOverlay(gameData, areaX, areaY, cellW, cellH);
      
      // 4. 如果地图较小，绘制外发光效果
      if (rows <= 8 && cols <= 8) {
          this.ctx.shadowBlur = 15;
          this.ctx.shadowColor = '#70a1ff';
          this.ctx.strokeRect(areaX - 2, areaY - 2, areaW + 4, areaH + 4);
          this.ctx.shadowBlur = 0;
      }
  }
  
  // 圆角矩形辅助函数
  roundRect(x, y, w, h, r) {
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
  
  drawConnections(gameData, areaX, areaY, cellW, cellH) {
      const { edges, nodes } = gameData;
      
      for (let key in edges) {
          const edge = edges[key];
          if (!edge.used) continue;
          
          const fromNode = nodes[edge.from];
          const toNode = nodes[edge.to];
          
          if (!fromNode || !toNode) continue;
          
          const fromX = areaX + (fromNode.col + 0.5) * cellW;
          const fromY = areaY + (fromNode.row + 0.5) * cellH;
          const toX = areaX + (toNode.col + 0.5) * cellW;
          const toY = areaY + (toNode.row + 0.5) * cellH;
          
          // 绘制连接线
          this.ctx.beginPath();
          this.ctx.moveTo(fromX, fromY);
          this.ctx.lineTo(toX, toY);
          this.ctx.strokeStyle = '#f9ca24';
          this.ctx.lineWidth = Math.max(4, Math.min(cellW, cellH) * 0.15);
          this.ctx.lineCap = 'round';
          this.ctx.stroke();
          
          // 添加发光效果
          this.ctx.beginPath();
          this.ctx.moveTo(fromX, fromY);
          this.ctx.lineTo(toX, toY);
          this.ctx.strokeStyle = '#ffda79';
          this.ctx.lineWidth = Math.max(2, Math.min(cellW, cellH) * 0.08);
          this.ctx.stroke();
      }
  }
  
  drawPathOverlay(gameData, areaX, areaY, cellW, cellH) {
      const { currentPath } = gameData;
      
      if (currentPath.length < 2) return;
      
      // 绘制路径上的节点高亮边框
      for (let i = 0; i < currentPath.length; i++) {
          const node = currentPath[i];
          const x = areaX + node.col * cellW;
          const y = areaY + node.row * cellH;
          
          this.ctx.strokeStyle = '#fff';
          this.ctx.lineWidth = 3;
          this.roundRect(x + 2, y + 2, cellW - 6, cellH - 6, Math.min(cellW, cellH) * 0.08);
          this.ctx.stroke();
      }
      
      // 在已走过的路径上绘制小圆点
      this.ctx.fillStyle = '#fff9c4';
      for (let i = 0; i < currentPath.length; i++) {
          const node = currentPath[i];
          const cx = areaX + (node.col + 0.5) * cellW;
          const cy = areaY + (node.row + 0.5) * cellH;
          
          this.ctx.beginPath();
          this.ctx.arc(cx, cy, Math.min(cellW, cellH) * 0.1, 0, Math.PI * 2);
          this.ctx.fill();
      }
  }
  
  drawUI(gameData) {
      const { currentLevel, totalLevels, dailyShareCount, maxDailyShare, isGameStarted, isGameFinished, rows, cols, nodes, startId, endId, gameArea } = gameData;
      
      // 顶部背景
      this.ctx.fillStyle = '#0f3460';
      this.ctx.fillRect(0, 0, this.width, 70);
      
      // 顶部边框装饰
      this.ctx.fillStyle = '#e94560';
      this.ctx.fillRect(0, 65, this.width, 5);
      
      // 关卡信息
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 24px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`第 ${currentLevel} / ${totalLevels} 关`, this.width / 2, 45);
      
      // 分享求助按钮
      const shareX = this.width - 110;
      const shareY = 15;
      const shareW = 100;
      const shareH = 42;
      
      this.ctx.fillStyle = '#2ed573';
      this.ctx.fillRect(shareX, shareY, shareW, shareH);
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 14px Arial';
      this.ctx.fillText(`💬 求助 ${dailyShareCount}/${maxDailyShare}`, shareX + shareW/2, shareY + shareH/2 + 4);
      
      // 重置按钮
      const resetX = 10;
      const resetY = 15;
      const resetW = 80;
      const resetH = 42;
      
      this.ctx.fillStyle = '#ff4757';
      this.ctx.fillRect(resetX, resetY, resetW, resetH);
      this.ctx.fillStyle = '#fff';
      this.ctx.fillText('🔄 重置', resetX + resetW/2, resetY + resetH/2 + 4);
      
      // 保存按钮区域
      this.uiRegions = {
          share: { x: shareX, y: shareY, w: shareW, h: shareH },
          reset: { x: resetX, y: resetY, w: resetW, h: resetH }
      };
      
      // 底部状态栏
      this.ctx.fillStyle = '#0f3460';
      this.ctx.fillRect(0, this.height - 45, this.width, 45);
      
      // 游戏状态文字
      if (isGameFinished) {
          this.ctx.fillStyle = '#2ed573';
          this.ctx.font = 'bold 18px Arial';
          this.ctx.fillText('🎉 通关成功！点击下一关 🎉', this.width / 2, this.height - 15);
      } else if (!isGameStarted) {
          this.ctx.fillStyle = '#70a1ff';
          this.ctx.font = '16px Arial';
          
          // 找到起点位置提示
          const startNode = nodes[startId];
          if (startNode && gameArea) {
              const cellW = gameArea.width / cols;
              const cellH = gameArea.height / rows;
              const startX = gameArea.x + (startNode.col + 0.5) * cellW;
              const startY = gameArea.y + (startNode.row + 0.5) * cellH;
              
              // 绘制闪烁的指示箭头
              this.ctx.fillStyle = '#2ed573';
              this.ctx.font = 'bold 24px Arial';
              this.ctx.fillText('👇', startX - 15, startY - 15);
          }
          
          this.ctx.fillText('按住绿色起点 S 拖动连线', this.width / 2, this.height - 15);
      } else {
          const visitedCount = Object.values(nodes).filter(n => n.visited).length;
          const totalCount = Object.keys(nodes).length;
          const progress = Math.floor(visitedCount / totalCount * 100);
          
          // 进度条
          const progressBarWidth = 200;
          const progressBarX = this.width / 2 - progressBarWidth / 2;
          const progressBarY = this.height - 35;
          
          this.ctx.fillStyle = '#57606f';
          this.ctx.fillRect(progressBarX, progressBarY, progressBarWidth, 8);
          this.ctx.fillStyle = '#2ed573';
          this.ctx.fillRect(progressBarX, progressBarY, progressBarWidth * visitedCount / totalCount, 8);
          
          this.ctx.fillStyle = '#70a1ff';
          this.ctx.font = '12px Arial';
          this.ctx.fillText(`${visitedCount}/${totalCount}`, this.width / 2, this.height - 38);
      }
      
      // 终点提示（如果不是最后一步）
      if (isGameStarted && !isGameFinished && gameArea) {
          const visitedCount = Object.values(nodes).filter(n => n.visited).length;
          const totalCount = Object.keys(nodes).length;
          const isLastStep = (visitedCount + 1 === totalCount);
          
          if (!isLastStep) {
              const endNode = nodes[endId];
              if (endNode && !endNode.visited) {
                  const cellW = gameArea.width / cols;
                  const cellH = gameArea.height / rows;
                  const endX = gameArea.x + (endNode.col + 0.5) * cellW;
                  const endY = gameArea.y + (endNode.row + 0.5) * cellH;
                  
                  // 绘制锁的图标
                  this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
                  this.ctx.beginPath();
                  this.ctx.arc(endX, endY, Math.min(cellW, cellH) * 0.28, 0, Math.PI * 2);
                  this.ctx.fill();
                  
                  this.ctx.fillStyle = '#fff';
                  this.ctx.font = `${Math.min(cellW, cellH) * 0.24}px Arial`;
                  this.ctx.fillText('🔒', endX - 4, endY + 4);
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