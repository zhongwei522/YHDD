/**
 * 哈密顿路径生成器
 * 在矩形网格上生成一条访问所有节点的路径
 */
export class HamiltonianPathGenerator {
    
  /**
   * 生成一条哈密顿路径
   * @param {number} rows - 行数
   * @param {number} cols - 列数
   * @returns {Array} 路径节点ID列表（顺序）
   */
  static generate(rows, cols) {
      // 对于矩形网格，使用蛇形走法作为基础路径
      // 这是最简单的保证哈密顿路径存在的方法
      const path = [];
      
      for (let i = 0; i < rows; i++) {
          if (i % 2 === 0) {
              // 偶数行：从左到右
              for (let j = 0; j < cols; j++) {
                  path.push(i * cols + j);
              }
          } else {
              // 奇数行：从右到左
              for (let j = cols - 1; j >= 0; j--) {
                  path.push(i * cols + j);
              }
          }
      }
      
      return path;
  }
  
  /**
   * 生成随机起点和终点的哈密顿路径
   * @param {number} rows 
   * @param {number} cols 
   * @returns {Object} { path: 节点ID数组, startId: 起点ID, endId: 终点ID }
   */
  static generateRandomPath(rows, cols) {
      // 先生成蛇形路径
      let path = this.generate(rows, cols);
      
      // 随机选择是否反转路径（改变起点终点）
      if (Math.random() > 0.5) {
          path = path.reverse();
      }
      
      // 对于偶数行的情况，可能需要微调让起点和终点在合适的位置
      // 这里简单处理：保持蛇形路径
      
      return {
          path: path,
          startId: path[0],
          endId: path[path.length - 1]
      };
  }
  
  /**
   * 判断两个节点是否相邻（上下左右）
   */
  static isAdjacent(node1, node2, cols) {
      const row1 = Math.floor(node1 / cols);
      const col1 = node1 % cols;
      const row2 = Math.floor(node2 / cols);
      const col2 = node2 % cols;
      
      return (Math.abs(row1 - row2) + Math.abs(col1 - col2)) === 1;
  }
}