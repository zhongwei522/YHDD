import { HamiltonianPathGenerator } from './HamiltonianPath.js';

/**
 * 地图生成器
 * 生成基于哈密顿路径的关卡地图，包含墙壁
 */
export class MapGenerator {
    
    /**
     * 生成关卡地图
     * @param {number} level - 关卡号（1-100）
     * @returns {Object} 地图数据
     */
    static generateLevel(level) {
        // 根据关卡计算地图尺寸
        const dimensions = this.getMapDimensions(level);
        let rows = dimensions.rows;
        let cols = dimensions.cols;
        const totalNodes = rows * cols;
        
        // 根据难度决定墙壁数量
        const wallCount = this.getWallCount(level, rows, cols);
        
        // 生成哈密顿路径（作为解法）
        let pathData = null;
        let walls = [];
        let nodes = null;
        let edges = null;
        let startId = null;
        let endId = null;
        
        let attempts = 0;
        let success = false;
        
        while (!success && attempts < 50) {
            // 生成基础路径
            pathData = HamiltonianPathGenerator.generateRandomPath(rows, cols);
            
            // 随机选择墙壁位置（不能是起点和终点）
            walls = this.generateWalls(rows, cols, wallCount, pathData.startId, pathData.endId);
            
            // 创建节点（标记哪些是墙壁）
            nodes = {};
            let nodeId = 0;
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const isWall = walls.some(w => w.row === r && w.col === c);
                    nodes[nodeId] = {
                        id: nodeId,
                        row: r,
                        col: c,
                        visited: false,
                        isWall: isWall
                    };
                    nodeId++;
                }
            }
            
            // 创建边（只连接非墙壁的相邻节点）
            edges = {};
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const currentId = r * cols + c;
                    if (nodes[currentId].isWall) continue;
                    
                    // 检查右边
                    if (c + 1 < cols) {
                        const rightId = r * cols + (c + 1);
                        if (!nodes[rightId].isWall) {
                            const key = `${Math.min(currentId, rightId)}-${Math.max(currentId, rightId)}`;
                            if (!edges[key]) {
                                edges[key] = {
                                    from: currentId,
                                    to: rightId,
                                    used: false,
                                    isOnPath: false
                                };
                            }
                        }
                    }
                    
                    // 检查下边
                    if (r + 1 < rows) {
                        const downId = (r + 1) * cols + c;
                        if (!nodes[downId].isWall) {
                            const key = `${Math.min(currentId, downId)}-${Math.max(currentId, downId)}`;
                            if (!edges[key]) {
                                edges[key] = {
                                    from: currentId,
                                    to: downId,
                                    used: false,
                                    isOnPath: false
                                };
                            }
                        }
                    }
                }
            }
            
            // 调整起点和终点（确保不是墙壁）
            startId = pathData.startId;
            endId = pathData.endId;
            
            // 如果起点或终点是墙壁，重新选择
            if (nodes[startId]?.isWall || nodes[endId]?.isWall) {
                // 找到第一个非墙壁的节点作为起点
                for (let id in nodes) {
                    if (!nodes[id].isWall) {
                        startId = parseInt(id);
                        break;
                    }
                }
                // 找到最后一个非墙壁的节点作为终点
                for (let id = totalNodes - 1; id >= 0; id--) {
                    if (nodes[id] && !nodes[id].isWall) {
                        endId = id;
                        break;
                    }
                }
            }
            
            // 验证是否还有有效的哈密顿路径（简化验证）
            const reachableCount = this.countReachableNodes(nodes, edges, startId);
            const totalWalkable = Object.values(nodes).filter(n => !n.isWall).length;
            
            if (reachableCount >= totalWalkable) {
                success = true;
            }
            
            attempts++;
        }
        
        // 添加路径上的边（保证有解）
        if (pathData && pathData.path) {
            for (let i = 0; i < pathData.path.length - 1; i++) {
                const from = pathData.path[i];
                const to = pathData.path[i + 1];
                // 检查这两个节点是否都不是墙壁
                if (nodes[from] && !nodes[from].isWall && nodes[to] && !nodes[to].isWall) {
                    const key = `${Math.min(from, to)}-${Math.max(from, to)}`;
                    if (edges[key]) {
                        edges[key].isOnPath = true;
                    } else {
                        edges[key] = {
                            from: from,
                            to: to,
                            used: false,
                            isOnPath: true
                        };
                    }
                }
            }
        }
        
        // 添加额外的干扰边
        const extraEdgeCount = this.getExtraEdgeCount(level, rows, cols, walls.length);
        let addedEdges = 0;
        const maxAttempts = 500;
        let attempts2 = 0;
        
        while (addedEdges < extraEdgeCount && attempts2 < maxAttempts) {
            attempts2++;
            const nodeId1 = Math.floor(Math.random() * totalNodes);
            if (nodes[nodeId1]?.isWall) continue;
            
            const row1 = Math.floor(nodeId1 / cols);
            const col1 = nodeId1 % cols;
            
            const direction = Math.random() > 0.5 ? 'right' : 'down';
            let nodeId2 = null;
            
            if (direction === 'right' && col1 + 1 < cols) {
                nodeId2 = nodeId1 + 1;
            } else if (direction === 'down' && row1 + 1 < rows) {
                nodeId2 = nodeId1 + cols;
            }
            
            if (nodeId2 !== null && nodes[nodeId2] && !nodes[nodeId2].isWall) {
                const key = `${Math.min(nodeId1, nodeId2)}-${Math.max(nodeId1, nodeId2)}`;
                if (!edges[key]) {
                    edges[key] = {
                        from: nodeId1,
                        to: nodeId2,
                        used: false,
                        isOnPath: false
                    };
                    addedEdges++;
                }
            }
        }
        
        return {
            rows: rows,
            cols: cols,
            nodes: nodes,
            edges: edges,
            startId: startId,
            endId: endId,
            walls: walls,
            solutionPath: pathData ? pathData.path : null
        };
    }
    
    /**
     * 统计从起点可到达的节点数
     */
    static countReachableNodes(nodes, edges, startId) {
        const visited = new Set();
        const queue = [startId];
        visited.add(startId);
        
        while (queue.length > 0) {
            const current = queue.shift();
            for (let key in edges) {
                const edge = edges[key];
                let neighbor = null;
                if (edge.from === current) neighbor = edge.to;
                if (edge.to === current) neighbor = edge.from;
                if (neighbor !== null && !visited.has(neighbor) && !nodes[neighbor]?.isWall) {
                    visited.add(neighbor);
                    queue.push(neighbor);
                }
            }
        }
        
        return visited.size;
    }
    
    /**
     * 生成墙壁位置
     */
    static generateWalls(rows, cols, wallCount, startId, endId) {
        const walls = [];
        const totalNodes = rows * cols;
        const forbiddenSet = new Set([startId, endId]);
        
        let attempts = 0;
        while (walls.length < wallCount && attempts < 200) {
            attempts++;
            const row = Math.floor(Math.random() * rows);
            const col = Math.floor(Math.random() * cols);
            const nodeId = row * cols + col;
            
            // 不能是起点、终点，也不能重复
            if (!forbiddenSet.has(nodeId) && !walls.some(w => w.row === row && w.col === col)) {
                // 避免把路径完全切断（简化：不隔离起点或终点）
                walls.push({ row, col, id: nodeId });
            }
        }
        
        return walls;
    }
    
    /**
     * 根据关卡获取地图尺寸
     */
    static getMapDimensions(level) {
        if (level === 1) {
            return { rows: 3, cols: 3 };
        }
        
        let totalNodes;
        
        if (level <= 10) {
            totalNodes = Math.floor(9 + (level - 1) * (25 - 9) / 9);
        } else if (level <= 30) {
            totalNodes = Math.floor(25 + (level - 10) * (64 - 25) / 20);
        } else if (level <= 60) {
            totalNodes = Math.floor(64 + (level - 30) * (144 - 64) / 30);
        } else {
            totalNodes = Math.floor(144 + (level - 60) * (324 - 144) / 40);
            if (totalNodes > 324) totalNodes = 324;
        }
        
        let rows = Math.floor(Math.sqrt(totalNodes));
        let cols = Math.ceil(totalNodes / rows);
        
        while (rows * cols < totalNodes) {
            cols++;
        }
        while ((rows - 1) * cols >= totalNodes && rows > 1) {
            rows--;
        }
        
        if (rows > 18) rows = 18;
        if (cols > 18) cols = 18;
        
        return { rows, cols };
    }
    
    /**
     * 获取墙壁数量
     */
    static getWallCount(level, rows, cols) {
        const totalWalkable = rows * cols;
        
        if (level <= 10) {
            return Math.floor(totalWalkable * 0.05);
        } else if (level <= 30) {
            return Math.floor(totalWalkable * (0.05 + (level - 10) * 0.01));
        } else if (level <= 60) {
            return Math.floor(totalWalkable * (0.25 + (level - 30) * 0.005));
        } else {
            return Math.floor(totalWalkable * (0.4 + (level - 60) * 0.005));
        }
    }
    
    /**
     * 获取额外干扰边的数量
     */
    static getExtraEdgeCount(level, rows, cols, wallCount) {
        const totalPossibleEdges = (rows * (cols - 1) + (rows - 1) * cols);
        const walkableCount = rows * cols - wallCount;
        const pathEdges = walkableCount - 1;
        
        let extraRatio;
        if (level <= 10) {
            extraRatio = 0.1;
        } else if (level <= 30) {
            extraRatio = 0.2 + (level - 10) / 100;
        } else if (level <= 60) {
            extraRatio = 0.4 + (level - 30) / 150;
        } else {
            extraRatio = 0.6 + (level - 60) / 200;
        }
        
        let extraCount = Math.floor((totalPossibleEdges - pathEdges) * Math.min(extraRatio, 0.8));
        return Math.min(extraCount, Math.max(0, totalPossibleEdges - pathEdges));
    }
}