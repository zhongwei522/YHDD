import { getRow, getCol, getEdgeKey, getNeighbors, shuffleArray } from '../utils/gameUtils.js';
import { GAME_CONFIG, THEMES, THEME_MAP, ACHIEVEMENTS } from '../config/gameConfig.js';
import { PathGenerator } from './PathGenerator.js';
import { storage } from '../utils/storage.js';
import { createRng, todaySeed } from '../utils/random.js';
import { Leaderboard } from './Leaderboard.js';

export class OneStrokeGame {
    constructor(width, height) {
        this.width = width;
        this.height = height;

        this.currentLevel = 1;
        this.isDailyMode = false;
        this.isReplaying = false;

        // 地图数据
        this.rows = 0;
        this.cols = 0;
        this.nodes = {};
        this.edges = {};
        this.startId = null;
        this.endId = null;
        this.solutionPath = null;
        this.obstacles = new Set();

        // 游戏状态
        this.currentPath = [];
        this.isGameStarted = false;
        this.isGameFinished = false;
        this.isDragging = false;
        this.lastHoverNodeId = null;

        // 本关星级追踪
        this.levelHintUsed = false;
        this.levelBacktracks = 0;

        // 结算面板数据
        this.winResult = null;
        this.achievementToast = null;

        this.maxDailyShare = GAME_CONFIG.maxDailyShare;

        // 元数据（留存系统）
        this.meta = this.loadMeta();
        this.dailyShareCount = this.loadShareCount();

        // 兼容旧进度存档
        const oldProgress = storage.get('oneStrokeProgress', null);
        if (oldProgress && oldProgress.level && oldProgress.level > this.meta.progress) {
            this.meta.progress = oldProgress.level;
            this.saveMeta();
        }

        this.currentLevel = this.meta.progress;
        this.generateLevel(this.currentLevel);
        Leaderboard.upload(this.meta.progress);
    }

    // ========== 存档 ==========
    defaultMeta() {
        return {
            progress: 1,
            coins: 0,
            activeTheme: 'sky',
            unlockedThemes: ['sky'],
            bestStars: {},
            combo: 0,
            comboBest: 0,
            stats: { totalWins: 0, perfectWins: 0, dailyWins: 0 },
            achievements: {},
            daily: { date: '', completed: false, stars: 0 }
        };
    }

    loadMeta() {
        const def = this.defaultMeta();
        const saved = storage.get('oneStrokeMeta', null);
        if (!saved || typeof saved !== 'object') return def;
        return {
            ...def,
            ...saved,
            stats: { ...def.stats, ...(saved.stats || {}) },
            daily: { ...def.daily, ...(saved.daily || {}) }
        };
    }

    saveMeta() {
        storage.set('oneStrokeMeta', this.meta);
    }

    loadShareCount() {
        const today = new Date().toDateString();
        const saved = storage.get('shareCount', null);
        if (saved && saved.date === today) return saved.count;
        return 0;
    }

    saveShareCount() {
        const today = new Date().toDateString();
        storage.set('shareCount', { date: today, count: this.dailyShareCount });
    }

    // ========== 关卡生成 ==========
    generateLevel(level, rng = Math.random) {
        // 外层兜底：生成后检查障碍物分散度，不达标就重生成（保证不出现"挤成一团"）
        let mapData = null;
        for (let attempt = 0; attempt < 8; attempt++) {
            const candidate = this.generateLevelMap(level, rng);
            const cluster = PathGenerator.maxCluster(candidate.obstacles, candidate.rows, candidate.cols);
            if (cluster <= 4) { mapData = candidate; break; }
            mapData = candidate;
        }

        this.rows = mapData.rows;
        this.cols = mapData.cols;
        this.nodes = mapData.nodes;
        this.edges = mapData.edges;
        this.startId = mapData.startId;
        this.endId = mapData.endId;
        this.solutionPath = mapData.solutionPath;
        this.obstacles = mapData.obstacles;

        this.resetGameState();
        console.log(`关卡 ${level}: ${this.rows}x${this.cols}, 路径=${this.solutionPath.length}, 障碍=${this.obstacles.size}`);
    }

    generateLevelMap(level, rng) {
        const dims = GAME_CONFIG.getMapDimensionsByLevel(level);
        const rows = dims.rows;
        const cols = dims.cols;
        const totalCells = rows * cols;
        const obstacleRatio = GAME_CONFIG.getObstacleRatio(level);
        const targetLength = GAME_CONFIG.getTargetPathLength(level, rows, cols);
        const startPositions = GAME_CONFIG.getStartPositions(rows, cols, GAME_CONFIG.getStartPositionStrategy(level));
        const strategy = GAME_CONFIG.getPathStrategy(level, rng);

        let path;

        if (obstacleRatio === 0) {
            // 全路径：用形态策略制造视觉差异
            if (strategy === 'snake') path = PathGenerator.snake(rows, cols, rng);
            else if (strategy === 'spiral') path = PathGenerator.spiral(rows, cols, rng);
            else path = PathGenerator.dfs(rows, cols, totalCells, rng, startPositions, rng());
        } else {
            // 部分路径：障碍物数量封顶（保证剩余图几乎必哈密顿），
            // 采样"分散"障碍物后找路径，并给"分散度"打分，取覆盖最长 + 最分散
            const obstacleCount = Math.min(totalCells - targetLength, 8);
            const target = totalCells - obstacleCount;
            let bestPath = null;
            let bestCluster = Infinity;
            for (let attempt = 0; attempt < 80; attempt++) {
                const obs = PathGenerator.scatterObstacles(rows, cols, obstacleCount, rng);
                const p = PathGenerator.dfs(rows, cols, target, rng, startPositions, rng(), obs, 30000);

                // 障碍物 = 路径补集
                const pset = new Set(p);
                const finalObs = new Set();
                for (let i = 0; i < totalCells; i++) if (!pset.has(i)) finalObs.add(i);
                const cluster = PathGenerator.maxCluster(finalObs, rows, cols);

                const longer = !bestPath || p.length > bestPath.length;
                const sameLenBetterCluster = bestPath && p.length === bestPath.length && cluster < bestCluster;
                if (longer || sameLenBetterCluster) {
                    bestPath = p;
                    bestCluster = cluster;
                }
                // 理想：全覆盖且障碍物完全分散，直接停
                if (p.length === target && cluster <= 2) break;
            }
            path = bestPath;
            if (!path || path.length < Math.floor(totalCells * 0.5)) {
                path = PathGenerator.spiral(rows, cols, rng);
            }
        }

        // 障碍物 = 路径补集（保证每个非路径格都是障碍，胜利判定才能成立）
        const pathSet = new Set(path);
        const obstacles = new Set();
        for (let i = 0; i < totalCells; i++) {
            if (!pathSet.has(i)) obstacles.add(i);
        }

        return this.buildMapFromPath(rows, cols, path, path[0], path[path.length - 1], obstacles, level, rng);
    }

    buildMapFromPath(rows, cols, path, startId, endId, obstacles, level, rng = Math.random) {
        const totalCells = rows * cols;
        const checkpointCount = GAME_CONFIG.getCheckpointCount(level);

        const nodes = {};
        for (let i = 0; i < totalCells; i++) {
            nodes[i] = {
                id: i,
                row: getRow(i, cols),
                col: getCol(i, cols),
                visited: false,
                isObstacle: obstacles.has(i),
                isCheckpoint: false,
                checkpointIndex: -1
            };
        }

        const checkpoints = [];
        if (checkpointCount > 0 && path.length > checkpointCount + 2) {
            const step = Math.floor(path.length / (checkpointCount + 1));
            for (let i = 1; i <= checkpointCount; i++) {
                const pos = Math.min(path.length - 2, i * step);
                nodes[path[pos]].isCheckpoint = true;
                nodes[path[pos]].checkpointIndex = i;
                checkpoints.push(path[pos]);
            }
        }

        // 建立所有相邻非障碍边
        const edges = {};
        for (let i = 0; i < totalCells; i++) {
            if (obstacles.has(i)) continue;
            const row = getRow(i, cols);
            const col = getCol(i, cols);
            if (col + 1 < cols && !obstacles.has(i + 1)) {
                const key = getEdgeKey(i, i + 1);
                if (!edges[key]) edges[key] = { from: i, to: i + 1, used: false, isOnPath: false };
            }
            if (row + 1 < rows && !obstacles.has(i + cols)) {
                const key = getEdgeKey(i, i + cols);
                if (!edges[key]) edges[key] = { from: i, to: i + cols, used: false, isOnPath: false };
            }
        }

        // 标记路径边
        for (let i = 0; i < path.length - 1; i++) {
            const key = getEdgeKey(path[i], path[i + 1]);
            if (edges[key]) edges[key].isOnPath = true;
        }

        // 干扰边：随关卡保留更多错路（难度正向递增）
        const possibleExtra = [];
        for (const key in edges) {
            if (!edges[key].isOnPath) possibleExtra.push(key);
        }
        shuffleArray(possibleExtra, rng);
        const keepRatio = GAME_CONFIG.getDistractorKeepRatio(level);
        const removeCount = Math.floor(possibleExtra.length * (1 - keepRatio));
        for (let i = 0; i < removeCount && i < possibleExtra.length; i++) {
            delete edges[possibleExtra[i]];
        }

        return {
            rows,
            cols,
            nodes,
            edges,
            startId,
            endId,
            solutionPath: path,
            obstacles,
            checkpoints
        };
    }

    resetGameState() {
        if (this.nodes) {
            for (const id in this.nodes) this.nodes[id].visited = false;
        }
        if (this.edges) {
            for (const id in this.edges) this.edges[id].used = false;
        }
        this.currentPath = [];
        this.isGameStarted = false;
        this.isGameFinished = false;
        this.isDragging = false;
        this.lastHoverNodeId = null;
        this.winResult = null;
        this.levelHintUsed = false;
        this.levelBacktracks = 0;
    }

    // ========== 交互 ==========
    backtrackToNode(nodeId) {
        if (!this.isGameStarted || this.isGameFinished) return false;

        const index = this.currentPath.findIndex((node) => node.id === nodeId);
        if (index === -1) return false;
        if (index === this.currentPath.length - 1) return false;

        const nodesToRemove = this.currentPath.slice(index + 1);
        for (const node of nodesToRemove) node.visited = false;

        for (let i = index; i < this.currentPath.length - 1; i++) {
            const key = getEdgeKey(this.currentPath[i].id, this.currentPath[i + 1].id);
            if (this.edges[key]) this.edges[key].used = false;
        }

        this.currentPath = this.currentPath.slice(0, index + 1);
        this.levelBacktracks += 1;
        return true;
    }

    startDrag(x, y) {
        if (this.isGameFinished) return false;

        const nodeId = this.getNodeAtPosition(x, y);
        if (nodeId === null) return false;
        if (this.nodes[nodeId] && this.nodes[nodeId].isObstacle) return false;

        if (this.isGameStarted && !this.isGameFinished && this.currentPath.length > 0) {
            const lastNode = this.currentPath[this.currentPath.length - 1];
            if (nodeId !== lastNode.id) {
                const backtracked = this.backtrackToNode(nodeId);
                if (backtracked) {
                    this.isDragging = true;
                    wx.vibrateShort({ type: 'light' });
                    return true;
                }
            }
        }

        if (!this.isGameStarted && nodeId === this.startId) {
            this.isDragging = true;
            this.startGame(this.nodes[nodeId]);
            return true;
        }

        if (this.isGameStarted && !this.isGameFinished && this.currentPath.length > 0) {
            const lastNode = this.currentPath[this.currentPath.length - 1];
            if (nodeId === lastNode.id) {
                this.isDragging = true;
                return true;
            }
        }

        return false;
    }

    dragMove(x, y) {
        if (!this.isDragging || this.isGameFinished) return;

        const nodeId = this.getNodeAtPosition(x, y);
        if (nodeId === null) {
            this.lastHoverNodeId = null;
            return;
        }
        if (this.nodes[nodeId] && this.nodes[nodeId].isObstacle) return;

        if (this.lastHoverNodeId === nodeId) return;
        this.lastHoverNodeId = nodeId;

        const currentNode = this.currentPath[this.currentPath.length - 1];
        if (this.isValidMove(currentNode.id, nodeId)) {
            this.addNodeToPath(currentNode.id, nodeId);
            if (this.checkVictory()) {
                this.gameWin();
                this.endDrag();
            }
        }
    }

    endDrag() {
        this.isDragging = false;
        this.lastHoverNodeId = null;
    }

    getNodeAtPosition(x, y) {
        if (this.rows === 0 || this.cols === 0) return null;

        const gameArea = this.getGameAreaRect();
        if (x < gameArea.x || x > gameArea.x + gameArea.width ||
            y < gameArea.y || y > gameArea.y + gameArea.height) return null;

        const relX = x - gameArea.x;
        const relY = y - gameArea.y;
        const cellW = gameArea.width / this.cols;
        const cellH = gameArea.height / this.rows;

        const col = Math.floor(relX / cellW);
        const row = Math.floor(relY / cellH);

        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return null;
        return row * this.cols + col;
    }

    getGameAreaRect() {
        const maxGameWidth = this.width;
        const maxGameHeight = this.height - 130;

        const idealCellSize = Math.min(65, maxGameHeight / this.rows, maxGameWidth / this.cols);

        const gameWidth = idealCellSize * this.cols;
        const gameHeight = idealCellSize * this.rows;

        const gameX = (this.width - gameWidth) / 2;
        const gameY = 90 + (maxGameHeight - gameHeight) / 2;

        return { x: gameX, y: gameY, width: gameWidth, height: gameHeight };
    }

    startGame(startNode) {
        this.isGameStarted = true;
        this.currentPath = [startNode];
        startNode.visited = true;
    }

    isValidMove(fromId, toId) {
        const toNode = this.nodes[toId];
        if (!toNode) return false;
        if (toNode.isObstacle) return false;
        if (toNode.visited) return false;

        const visitedCount = Object.values(this.nodes).filter((n) => n.visited && !n.isObstacle).length;
        const totalCount = Object.values(this.nodes).filter((n) => !n.isObstacle).length;
        const isLastNode = (visitedCount + 1 === totalCount);

        if (toId === this.endId && !isLastNode) return false;

        const fromRow = getRow(fromId, this.cols);
        const fromCol = getCol(fromId, this.cols);
        const toRow = getRow(toId, this.cols);
        const toCol = getCol(toId, this.cols);
        if ((Math.abs(fromRow - toRow) + Math.abs(fromCol - toCol)) !== 1) return false;

        const edge = this.edges[getEdgeKey(fromId, toId)];
        if (!edge || edge.used) return false;

        return true;
    }

    addNodeToPath(fromId, toId) {
        const key = getEdgeKey(fromId, toId);
        if (this.edges[key]) this.edges[key].used = true;
        const toNode = this.nodes[toId];
        toNode.visited = true;
        this.currentPath.push(toNode);
    }

    checkVictory() {
        const allVisited = Object.values(this.nodes).every((node) => node.isObstacle || node.visited === true);
        if (!allVisited) return false;
        const lastId = this.currentPath[this.currentPath.length - 1].id;
        return lastId === this.endId;
    }

    // ========== 结算 ==========
    computeStars() {
        if (this.levelHintUsed) return this.levelBacktracks === 0 ? 2 : 1;
        if (this.levelBacktracks === 0) return 3;
        if (this.levelBacktracks <= 2) return 2;
        return 1;
    }

    gameWin() {
        this.isGameFinished = true;
        this.isDragging = false;

        const level = this.currentLevel;
        const stars = this.computeStars();
        const isFirstClear = !this.meta.bestStars[level];

        if (!this.meta.bestStars[level] || stars > this.meta.bestStars[level]) {
            this.meta.bestStars[level] = stars;
        }

        if (stars === 3) {
            this.meta.combo += 1;
            this.meta.comboBest = Math.max(this.meta.comboBest, this.meta.combo);
            this.meta.stats.perfectWins += 1;
        } else {
            this.meta.combo = 0;
        }
        this.meta.stats.totalWins += 1;
        const combo = this.meta.combo;

        let coins = 0;
        let dailyBonus = 0;

        if (this.isDailyMode) {
            const today = this.getTodayKey();
            if (this.meta.daily.date !== today || !this.meta.daily.completed) {
                dailyBonus = GAME_CONFIG.getDailyBonus();
                this.meta.daily = { date: today, completed: true, stars };
                this.meta.stats.dailyWins += 1;
            }
            coins = 3 + stars;
        } else {
            coins = GAME_CONFIG.getCoinsForWin(level, stars, combo, isFirstClear);
            if (level === this.meta.progress) this.meta.progress = level + 1;
        }

        this.meta.coins += coins + dailyBonus;

        this.winResult = {
            level,
            stars,
            coins,
            combo,
            isFirstClear,
            isDaily: this.isDailyMode,
            dailyBonus
        };

        this.saveMeta();
        this.checkAchievements();
        Leaderboard.upload(this.meta.progress);
    }

    nextLevel() {
        this.currentLevel = this.meta.progress;
        this.isReplaying = false;
        this.isDailyMode = false;
        this.generateLevel(this.currentLevel);
    }

    retryLevel() {
        this.generateLevel(this.currentLevel);
    }

    resetLevel() {
        this.generateLevel(this.currentLevel);
    }

    replayLevel(level) {
        if (!this.meta.bestStars[level]) {
            wx.showToast({ title: '该关未通关', icon: 'none' });
            return false;
        }
        this.currentLevel = level;
        this.isReplaying = true;
        this.isDailyMode = false;
        this.generateLevel(level);
        return true;
    }

    backToCurrentProgress() {
        this.currentLevel = this.meta.progress;
        this.isReplaying = false;
        this.isDailyMode = false;
        this.generateLevel(this.currentLevel);
    }

    // ========== 每日挑战 ==========
    getTodayKey() {
        const d = new Date();
        return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    }

    isDailyCompletedToday() {
        return this.meta.daily.date === this.getTodayKey() && this.meta.daily.completed;
    }

    startDailyChallenge() {
        this.isDailyMode = true;
        this.isReplaying = false;
        const level = Math.min(this.meta.progress, 12);
        const rng = createRng(todaySeed());
        this.currentLevel = level;
        this.generateLevel(level, rng);
    }

    // ========== 提示 / 分享 ==========
    shareForHelp() {
        if (this.dailyShareCount >= this.maxDailyShare) {
            wx.showToast({ title: `今日已达上限${this.maxDailyShare}次`, icon: 'none' });
            return false;
        }

        wx.shareAppMessage({
            title: `帮我过第${this.currentLevel}关！一笔连接所有方块`,
            success: () => {
                this.dailyShareCount++;
                this.saveShareCount();
                this.showHint();
                wx.showToast({ title: '分享成功！获得提示', icon: 'success' });
            }
        });
        return true;
    }

    shareResult() {
        const r = this.winResult || {};
        wx.shareAppMessage({
            title: `我过了第${r.level || this.currentLevel}关（${r.stars || 0}星）！来挑战我`
        });
    }

    showHint() {
        if (this.currentPath.length === 0) {
            wx.showToast({ title: '从绿色起点开始！', icon: 'none' });
            return;
        }

        if (this.solutionPath) {
            const currentId = this.currentPath[this.currentPath.length - 1].id;
            const currentIndex = this.solutionPath.indexOf(currentId);
            if (currentIndex !== -1 && currentIndex + 1 < this.solutionPath.length) {
                const nextNode = this.nodes[this.solutionPath[currentIndex + 1]];
                this.levelHintUsed = true;
                wx.showToast({ title: `提示：连接 (${nextNode.col + 1}, ${nextNode.row + 1})`, icon: 'none', duration: 2000 });
                return;
            }
        }

        const lastNode = this.currentPath[this.currentPath.length - 1];
        const neighbors = getNeighbors(lastNode.id, this.rows, this.cols);
        for (const neighborId of neighbors) {
            const node = this.nodes[neighborId];
            if (!node || node.isObstacle) continue;
            const edge = this.edges[getEdgeKey(lastNode.id, neighborId)];
            if (edge && !edge.used && !node.visited) {
                this.levelHintUsed = true;
                wx.showToast({ title: `提示：连接 (${node.col + 1}, ${node.row + 1})`, icon: 'none', duration: 2000 });
                return;
            }
        }

        wx.showToast({ title: '没有可走的格子了，点击重置', icon: 'none' });
    }

    // ========== 成就 ==========
    checkAchievements() {
        const newly = [];
        for (const a of ACHIEVEMENTS) {
            if (this.meta.achievements[a.id]) continue;
            if (a.check(this.meta)) {
                this.meta.achievements[a.id] = Date.now();
                newly.push(a);
            }
        }
        if (newly.length > 0) {
            this.saveMeta();
            const a = newly[newly.length - 1];
            this.achievementToast = { icon: a.icon, name: a.name, at: Date.now() };
        }
        return newly;
    }

    // ========== 主题 ==========
    getThemes() {
        return THEMES.map((t) => ({
            ...t,
            unlocked: this.meta.unlockedThemes.includes(t.id),
            active: this.meta.activeTheme === t.id
        }));
    }

    unlockTheme(id) {
        if (this.meta.unlockedThemes.includes(id)) return { ok: false, reason: '已解锁' };
        const theme = THEME_MAP[id];
        if (!theme) return { ok: false, reason: '主题不存在' };
        if (this.meta.coins < theme.price) return { ok: false, reason: '金币不足' };

        this.meta.coins -= theme.price;
        this.meta.unlockedThemes.push(id);
        this.meta.activeTheme = id;
        this.saveMeta();
        this.checkAchievements();
        return { ok: true };
    }

    setActiveTheme(id) {
        if (!this.meta.unlockedThemes.includes(id)) return false;
        this.meta.activeTheme = id;
        this.saveMeta();
        return true;
    }

    // ========== 数据输出 ==========
    getGameData() {
        const gameArea = this.getGameAreaRect();
        const activeTheme = THEME_MAP[this.meta.activeTheme] || THEME_MAP.sky;
        const completedLevels = Object.keys(this.meta.bestStars).map(Number).sort((a, b) => a - b);

        return {
            rows: this.rows,
            cols: this.cols,
            nodes: this.nodes,
            edges: this.edges,
            startId: this.startId,
            endId: this.endId,
            currentPath: this.currentPath,
            currentLevel: this.currentLevel,
            totalLevels: '∞',
            isGameStarted: this.isGameStarted,
            isGameFinished: this.isGameFinished,
            isReplaying: this.isReplaying,
            isDailyMode: this.isDailyMode,
            gameArea,
            obstacles: Array.from(this.obstacles),
            dailyShareCount: this.dailyShareCount,
            maxDailyShare: this.maxDailyShare,
            // 留存系统数据
            coins: this.meta.coins,
            activeTheme: this.meta.activeTheme,
            activeBg: activeTheme.bg,
            combo: this.meta.combo,
            comboBest: this.meta.comboBest,
            progress: this.meta.progress,
            currentLevelBestStars: this.meta.bestStars[this.currentLevel] || 0,
            bestStars: this.meta.bestStars,
            completedLevels,
            themes: this.getThemes(),
            dailyCompletedToday: this.isDailyCompletedToday(),
            winResult: this.winResult,
            achievementToast: this.achievementToast
        };
    }
}
