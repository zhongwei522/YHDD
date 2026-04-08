import { MapGenerator } from './MapGenerator.js';

export class OneStrokeGame {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        
        // 游戏配置
        this.currentLevel = 1;
        this.totalLevels = 100;
        this.dailyShareCount = 0;
        this.maxDailyShare = 2;
        
        // 地图数据
        this.rows = 0;
        this.cols = 0;
        this.nodes = {};
        this.edges = {};
        this.startId = null;
        this.endId = null;
        this.solutionPath = null;
        
        // 游戏状态
        this.currentPath = [];
        this.isGameStarted = false;
        this.isGameFinished = false;
        
        // 拖拽状态
        this.isDragging = false;
        this.lastHoverNodeId = null;
        
        // 存储关卡数据
        this.levelData = this.loadLevelData();
        
        this.initGame();
    }
    
    loadLevelData() {
        const saved = wx.getStorageSync('oneStrokeLevelData');
        if (saved && saved.version === 2) {
            return saved.data || {};
        }
        return {};
    }
    
    saveLevelData() {
        wx.setStorageSync('oneStrokeLevelData', {
            version: 2,
            data: this.levelData
        });
    }
    
    initGame() {
        this.loadProgress();
        this.loadShareCount();
        this.generateLevel(this.currentLevel);
    }
    
    loadProgress() {
        const saved = wx.getStorageSync('oneStrokeProgress');
        if (saved && saved.level) {
            this.currentLevel = saved.level;
        }
    }
    
    saveProgress() {
        wx.setStorageSync('oneStrokeProgress', {
            level: this.currentLevel,
            updatedAt: Date.now()
        });
    }
    
    loadShareCount() {
        const today = new Date().toDateString();
        const saved = wx.getStorageSync('shareCount');
        if (saved && saved.date === today) {
            this.dailyShareCount = saved.count;
        } else {
            this.dailyShareCount = 0;
            this.saveShareCount();
        }
    }
    
    saveShareCount() {
        const today = new Date().toDateString();
        wx.setStorageSync('shareCount', { date: today, count: this.dailyShareCount });
    }
    
    generateLevel(level) {
        if (this.levelData[level] && this.levelData[level].generatedAt) {
            const saved = this.levelData[level];
            this.rows = saved.rows;
            this.cols = saved.cols;
            this.nodes = saved.nodes;
            this.edges = saved.edges;
            this.startId = saved.startId;
            this.endId = saved.endId;
            this.solutionPath = saved.solutionPath;
        } else {
            let mapData = null;
            
            if (level <= 90) {
                mapData = MapGenerator.generateLevel(level);
            } else {
                const random = Math.random();
                if (random < 0.00001) {
                    mapData = MapGenerator.generateLevel(level);
                } else {
                    mapData = this.generateRandomInsolubleMap(level);
                }
            }
            
            if (mapData) {
                this.rows = mapData.rows;
                this.cols = mapData.cols;
                this.nodes = mapData.nodes;
                this.edges = mapData.edges;
                this.startId = mapData.startId;
                this.endId = mapData.endId;
                this.solutionPath = mapData.solutionPath || null;
            }
            
            this.levelData[level] = {
                rows: this.rows,
                cols: this.cols,
                nodes: this.nodes,
                edges: this.edges,
                startId: this.startId,
                endId: this.endId,
                solutionPath: this.solutionPath,
                generatedAt: Date.now(),
                hasSolution: (level <= 90)
            };
            this.saveLevelData();
        }
        
        this.resetGameState();
    }
    
    generateRandomInsolubleMap(level) {
        const dimensions = MapGenerator.getMapDimensions(level);
        const rows = dimensions.rows;
        const cols = dimensions.cols;
        const totalNodes = rows * cols;
        
        const nodes = {};
        for (let i = 0; i < totalNodes; i++) {
            nodes[i] = {
                id: i,
                row: Math.floor(i / cols),
                col: i % cols,
                visited: false
            };
        }
        
        const edges = {};
        for (let i = 0; i < totalNodes; i++) {
            const row = Math.floor(i / cols);
            const col = i % cols;
            
            if (col + 1 < cols && Math.random() < 0.5) {
                const key = `${i}-${i + 1}`;
                edges[key] = { from: i, to: i + 1, used: false, isOnPath: false };
            }
            if (row + 1 < rows && Math.random() < 0.5) {
                const key = `${i}-${i + cols}`;
                edges[key] = { from: i, to: i + cols, used: false, isOnPath: false };
            }
        }
        
        const startId = Math.floor(Math.random() * totalNodes);
        let endId = Math.floor(Math.random() * totalNodes);
        while (endId === startId) {
            endId = Math.floor(Math.random() * totalNodes);
        }
        
        return { rows, cols, nodes, edges, startId, endId, solutionPath: null };
    }
    
    resetGameState() {
        for (let id in this.nodes) {
            this.nodes[id].visited = false;
        }
        for (let id in this.edges) {
            this.edges[id].used = false;
        }
        this.currentPath = [];
        this.isGameStarted = false;
        this.isGameFinished = false;
        this.isDragging = false;
        this.lastHoverNodeId = null;
    }
    
    // 开始拖拽（触摸开始）
    startDrag(x, y) {
        if (this.isGameFinished) return false;
        
        const nodeId = this.getNodeAtPosition(x, y);
        if (nodeId === null) return false;
        
        // 情况1：游戏未开始，必须从起点开始
        if (!this.isGameStarted && nodeId === this.startId) {
            this.isDragging = true;
            this.startGame(this.nodes[nodeId]);
            return true;
        }
        
        // 情况2：游戏已经开始，允许从当前路径的最后一个节点继续画
        if (this.isGameStarted && !this.isGameFinished) {
            const lastNode = this.currentPath[this.currentPath.length - 1];
            if (nodeId === lastNode.id) {
                // 从当前最后一个节点继续拖拽
                this.isDragging = true;
                return true;
            }
        }
        
        return false;
    }
    
    // 拖拽移动（触摸移动）
    dragMove(x, y) {
        if (!this.isDragging || this.isGameFinished) return;
        
        const nodeId = this.getNodeAtPosition(x, y);
        if (nodeId === null) {
            this.lastHoverNodeId = null;
            return;
        }
        
        // 避免重复处理同一个节点
        if (this.lastHoverNodeId === nodeId) return;
        this.lastHoverNodeId = nodeId;
        
        const currentNode = this.currentPath[this.currentPath.length - 1];
        
        // 检查是否可以移动到该节点
        if (this.isValidMove(currentNode.id, nodeId)) {
            this.addNodeToPath(currentNode.id, nodeId);
            
            if (this.checkVictory()) {
                this.gameWin();
                this.endDrag();
            }
        }
    }
    
    // 结束拖拽（触摸结束）- 不断开连接，可以继续画
    endDrag() {
        this.isDragging = false;
        this.lastHoverNodeId = null;
        // 注意：不重置游戏状态，可以继续从断点画
    }
    
    // 获取触摸位置的节点ID（考虑居中偏移）
    getNodeAtPosition(x, y) {
        if (this.rows === 0 || this.cols === 0) return null;
        
        // 获取游戏区域的实际位置和大小
        const gameArea = this.getGameAreaRect();
        
        // 检查是否在游戏区域内
        if (x < gameArea.x || x > gameArea.x + gameArea.width ||
            y < gameArea.y || y > gameArea.y + gameArea.height) {
            return null;
        }
        
        // 计算在游戏区域内的相对坐标
        const relX = x - gameArea.x;
        const relY = y - gameArea.y;
        
        const cellW = gameArea.width / this.cols;
        const cellH = gameArea.height / this.rows;
        
        const col = Math.floor(relX / cellW);
        const row = Math.floor(relY / cellH);
        
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return null;
        
        return row * this.cols + col;
    }
    
    // 获取游戏区域的实际矩形（用于UI绘制和触摸检测）
    getGameAreaRect() {
        // 最大游戏区域大小（留出顶部80px和底部40px）
        const maxGameWidth = this.width;
        const maxGameHeight = this.height - 120; // 顶部80 + 底部40
        
        // 理想格子大小：最大60px，最小30px
        const idealCellSize = Math.min(60, maxGameHeight / this.rows, maxGameWidth / this.cols);
        
        const gameWidth = idealCellSize * this.cols;
        const gameHeight = idealCellSize * this.rows;
        
        // 居中显示
        const gameX = (this.width - gameWidth) / 2;
        const gameY = 80 + (maxGameHeight - gameHeight) / 2;
        
        return {
            x: gameX,
            y: gameY,
            width: gameWidth,
            height: gameHeight
        };
    }
    
    startGame(startNode) {
        this.isGameStarted = true;
        this.currentPath = [startNode];
        startNode.visited = true;
    }
    
    isValidMove(fromId, toId) {
        const toNode = this.nodes[toId];
        
        // 不能重复访问
        if (toNode.visited) return false;
        
        // 检查是否是终点 - 只有所有格子都走完了才能进入终点
        const visitedCount = Object.values(this.nodes).filter(n => n.visited).length;
        const totalCount = Object.keys(this.nodes).length;
        const isLastNode = (visitedCount + 1 === totalCount);
        
        if (toId === this.endId && !isLastNode) {
            // 终点必须在最后一步才能进入
            return false;
        }
        
        // 检查两个节点是否相邻
        const fromRow = Math.floor(fromId / this.cols);
        const fromCol = fromId % this.cols;
        const toRow = Math.floor(toId / this.cols);
        const toCol = toId % this.cols;
        
        const isAdjacent = (Math.abs(fromRow - toRow) + Math.abs(fromCol - toCol)) === 1;
        if (!isAdjacent) return false;
        
        // 检查边是否存在
        const key = `${Math.min(fromId, toId)}-${Math.max(fromId, toId)}`;
        const edge = this.edges[key];
        
        if (!edge || edge.used) return false;
        
        return true;
    }
    
    addNodeToPath(fromId, toId) {
        const key = `${Math.min(fromId, toId)}-${Math.max(fromId, toId)}`;
        this.edges[key].used = true;
        
        const toNode = this.nodes[toId];
        toNode.visited = true;
        this.currentPath.push(toNode);
    }
    
    checkVictory() {
        const allVisited = Object.values(this.nodes).every(node => node.visited === true);
        const lastId = this.currentPath[this.currentPath.length - 1].id;
        const endAtEnd = (lastId === this.endId);
        
        return allVisited && endAtEnd;
    }
    
    gameWin() {
        this.isGameFinished = true;
        this.isDragging = false;
        
        if (this.currentLevel < this.totalLevels) {
            const nextLevel = this.currentLevel + 1;
            
            wx.showModal({
                title: '🎉 通关成功！',
                content: `恭喜通过第${this.currentLevel}关！\n即将进入第${nextLevel}关`,
                success: (res) => {
                    if (res.confirm) {
                        this.currentLevel = nextLevel;
                        this.saveProgress();
                        this.generateLevel(this.currentLevel);
                    }
                }
            });
        } else {
            wx.showModal({
                title: '🏆 恭喜通关！',
                content: '你已经完成了所有100关！',
                showCancel: false
            });
        }
    }
    
    shareForHelp() {
        if (this.dailyShareCount >= this.maxDailyShare) {
            wx.showToast({
                title: `今日已达上限${this.maxDailyShare}次`,
                icon: 'none'
            });
            return false;
        }
        
        wx.shareAppMessage({
            title: `帮我过第${this.currentLevel}关！一笔连接所有方块`,
            success: () => {
                this.dailyShareCount++;
                this.saveShareCount();
                this.showHint();
                wx.showToast({
                    title: '分享成功！获得提示',
                    icon: 'success'
                });
            }
        });
        
        return true;
    }
    
    showHint() {
        if (this.currentPath.length === 0) {
            wx.showToast({
                title: `从绿色起点开始！`,
                icon: 'none'
            });
            return;
        }
        
        if (this.solutionPath) {
            const currentId = this.currentPath[this.currentPath.length - 1].id;
            const currentIndex = this.solutionPath.indexOf(currentId);
            
            if (currentIndex !== -1 && currentIndex + 1 < this.solutionPath.length) {
                const nextId = this.solutionPath[currentIndex + 1];
                const nextNode = this.nodes[nextId];
                wx.showToast({
                    title: `提示：连接 (${nextNode.col + 1}, ${nextNode.row + 1})`,
                    icon: 'none',
                    duration: 2000
                });
                return;
            }
        }
        
        const lastNode = this.currentPath[this.currentPath.length - 1];
        for (let key in this.edges) {
            const edge = this.edges[key];
            if (!edge.used) {
                let otherId = null;
                if (edge.from === lastNode.id) otherId = edge.to;
                if (edge.to === lastNode.id) otherId = edge.from;
                
                if (otherId !== null && !this.nodes[otherId].visited) {
                    const otherNode = this.nodes[otherId];
                    wx.showToast({
                        title: `试试连接 (${otherNode.col + 1}, ${otherNode.row + 1})`,
                        icon: 'none'
                    });
                    break;
                }
            }
        }
    }
    
    resetLevel() {
        this.resetGameState();
    }
    
    getGameData() {
        const gameArea = this.getGameAreaRect();
        
        return {
            rows: this.rows,
            cols: this.cols,
            nodes: this.nodes,
            edges: this.edges,
            startId: this.startId,
            endId: this.endId,
            currentPath: this.currentPath,
            currentLevel: this.currentLevel,
            totalLevels: this.totalLevels,
            isGameStarted: this.isGameStarted,
            isGameFinished: this.isGameFinished,
            dailyShareCount: this.dailyShareCount,
            maxDailyShare: this.maxDailyShare,
            gameArea: gameArea  // 传递游戏区域给UI
        };
    }
}