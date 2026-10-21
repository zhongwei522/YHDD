// 游戏配置：难度曲线 + 路径策略 + 主题皮肤 + 成就 + 经济
// 关键修正：干扰边从"随关卡越删越多"改为"随关卡越留越多"，
// 让高关卡真正变难（错路更多），而不是越到后面越容易。

export const GAME_CONFIG = {
    maxDailyShare: 2,

    getLevelPhase(level) {
        if (level <= 10) return 'beginner';
        if (level <= 25) return 'intermediate';
        if (level <= 45) return 'expert';
        return 'master';
    },

    // 尺寸阶梯：刻意用非正方形、横竖交替，让地图形状也有变化
    getMapDimensionsByLevel(level) {
        // 格子数随关卡平滑增长（每关 +1.5），尺寸随之每 1~2 关递进
        const targetCells = Math.min(200, Math.round(6 + (level - 1) * 1.5));

        let best = { rows: 2, cols: 3, ratio: 1.5 };
        let bestDiff = Infinity;
        for (let rows = 2; rows <= 15; rows++) {
            for (let cols = rows; cols <= 15; cols++) {
                const cells = rows * cols;
                if (cells > 210) continue;
                const ratio = cols / rows;
                if (ratio > 1.7) continue;
                const diff = Math.abs(cells - targetCells);
                if (diff < bestDiff || (diff === bestDiff && Math.abs(ratio - 1) < Math.abs(best.ratio - 1))) {
                    bestDiff = diff;
                    best = { rows, cols, ratio };
                }
            }
        }

        // 偶数关翻转横竖，制造形状变化
        if (level % 2 === 0 && best.rows !== best.cols) {
            return { rows: best.cols, cols: best.rows };
        }
        return { rows: best.rows, cols: best.cols };
    },

    getObstacleRatio(level) {
        // 障碍物比例控制在 ≤15%：比例过高会破坏剩余格子的连通性/哈密顿性，
        // 反而让障碍物聚成大块。真正的难度由"干扰边（错路）"承担。
        const phase = GAME_CONFIG.getLevelPhase(level);

        if (phase === 'beginner') {
            if (level <= 1) return 0;
            return Math.min(0.1, 0.03 + (level - 2) * 0.015);
        }
        if (phase === 'intermediate') {
            return Math.min(0.13, 0.1 + (level - 10) * 0.004);
        }
        if (phase === 'expert') {
            return Math.min(0.15, 0.13 + (level - 25) * 0.002);
        }
        return 0.15;
    },

    getTargetPathLength(level, rows, cols) {
        const totalCells = rows * cols;
        const obstacleRatio = GAME_CONFIG.getObstacleRatio(level);
        const targetLength = Math.floor(totalCells * (1 - obstacleRatio));
        return Math.max(targetLength, Math.floor(totalCells * 0.4));
    },

    // 干扰边保留比例：随关卡升高而增大 → 高关卡错路更多、更难
    getDistractorKeepRatio(level) {
        const phase = GAME_CONFIG.getLevelPhase(level);

        if (phase === 'beginner') {
            if (level <= 4) return 0;
            if (level <= 7) return 0.15;
            return 0.3;
        }
        if (phase === 'intermediate') {
            const t = (level - 10) / 15;
            return 0.3 + t * 0.3;
        }
        if (phase === 'expert') {
            const t = (level - 25) / 20;
            return 0.6 + t * 0.25;
        }
        const t = Math.min(1, (level - 45) / 30);
        return 0.85 + t * 0.15;
    },

    // 路径形态策略：低关卡用可识别的蛇形/螺旋增加视觉变化，高关卡用 DFS 迷宫
    getPathStrategy(level, rng) {
        const phase = GAME_CONFIG.getLevelPhase(level);

        if (phase === 'beginner') {
            const r = rng();
            if (r < 0.45) return 'snake';
            if (r < 0.8) return 'spiral';
            return 'dfs';
        }
        if (phase === 'intermediate') {
            const r = rng();
            if (r < 0.25) return 'spiral';
            if (r < 0.45) return 'dfs';
            return 'dfs';
        }
        return 'dfs';
    },

    getStartPositionStrategy(level) {
        const phase = GAME_CONFIG.getLevelPhase(level);
        if (phase === 'beginner') return 'corner';
        if (phase === 'intermediate') {
            if (level <= 18) return 'edge';
            return 'edge_center';
        }
        if (phase === 'expert') {
            if (level <= 35) return 'edge_center';
            return 'center';
        }
        return 'center';
    },

    getCheckpointCount(level) {
        const phase = GAME_CONFIG.getLevelPhase(level);
        if (phase === 'beginner') return 0;
        if (phase === 'intermediate') {
            if (level <= 20) return 0;
            return 1;
        }
        if (phase === 'expert') {
            if (level <= 35) return 1;
            return 2;
        }
        const t = level - 45;
        return Math.min(4, 2 + Math.floor(t / 10));
    },

    getStartPositions(rows, cols, strategy) {
        const positions = {
            corner: [0, cols - 1, (rows - 1) * cols, rows * cols - 1],
            edge: [
                0, cols - 1, (rows - 1) * cols, rows * cols - 1,
                Math.floor(cols / 2), (rows - 1) * cols + Math.floor(cols / 2),
                Math.floor(rows / 2) * cols, Math.floor(rows / 2) * cols + cols - 1
            ],
            edge_center: [
                Math.floor(cols / 2), (rows - 1) * cols + Math.floor(cols / 2),
                Math.floor(rows / 2) * cols, Math.floor(rows / 2) * cols + cols - 1
            ],
            center: [
                Math.floor(rows / 2) * cols + Math.floor(cols / 2),
                Math.floor(rows / 2) * cols + Math.floor(cols / 2) - 1,
                Math.floor(rows / 2) * cols + Math.floor(cols / 2) + 1,
                (Math.floor(rows / 2) - 1) * cols + Math.floor(cols / 2),
                (Math.floor(rows / 2) + 1) * cols + Math.floor(cols / 2)
            ]
        };
        return positions[strategy] || positions.corner;
    },

    // 通关金币奖励：基础 + 星级加成 + 连击加成 + 首通加成
    getCoinsForWin(level, stars, combo, isFirstClear) {
        let coins = 3 + Math.min(12, Math.floor(level / 4));
        if (stars === 3) coins += 6;
        else if (stars === 2) coins += 3;
        coins += Math.min(10, combo * 2);
        if (isFirstClear) coins += 4;
        return coins;
    },

    getDailyBonus() {
        return 15;
    }
};

// 主题皮肤目录：bg 对应 CanvasUI 里的背景绘制函数索引（0-5）
export const THEMES = [
    { id: 'sky',     name: '晴天',   bg: 0, price: 0 },
    { id: 'cat',     name: '布偶猫', bg: 1, price: 80 },
    { id: 'rainbow', name: '彩虹',   bg: 2, price: 150 },
    { id: 'star',    name: '星空',   bg: 3, price: 220 },
    { id: 'heart',   name: '爱心',   bg: 4, price: 300 },
    { id: 'forest',  name: '森林',   bg: 5, price: 380 }
];

export const THEME_MAP = THEMES.reduce((m, t) => { m[t.id] = t; return m; }, {});

// 成就目录：check 接收 meta 对象，返回是否达成
export const ACHIEVEMENTS = [
    { id: 'first_win', name: '初次通关', desc: '完成第 1 关', icon: '🎉', check: (m) => m.stats.totalWins >= 1 },
    { id: 'win_10', name: '渐入佳境', desc: '累计通关 10 关', icon: '🏅', check: (m) => m.stats.totalWins >= 10 },
    { id: 'win_50', name: '高手', desc: '累计通关 50 关', icon: '🎖', check: (m) => m.stats.totalWins >= 50 },
    { id: 'win_100', name: '大师', desc: '累计通关 100 关', icon: '👑', check: (m) => m.stats.totalWins >= 100 },
    { id: 'level_20', name: '一路向前', desc: '达到第 20 关', icon: '🚀', check: (m) => m.progress >= 20 },
    { id: 'perfect_10', name: '完美主义', desc: '达成 10 次三星', icon: '⭐', check: (m) => m.stats.perfectWins >= 10 },
    { id: 'combo_3', name: '连击高手', desc: '三星连击达到 3', icon: '🔥', check: (m) => m.comboBest >= 3 },
    { id: 'combo_10', name: '连击大师', desc: '三星连击达到 10', icon: '⚡', check: (m) => m.comboBest >= 10 },
    { id: 'daily_1', name: '每日新星', desc: '完成 1 次每日挑战', icon: '📅', check: (m) => m.stats.dailyWins >= 1 },
    { id: 'daily_7', name: '七日之约', desc: '累计 7 次每日挑战', icon: '🗓', check: (m) => m.stats.dailyWins >= 7 },
    { id: 'unlock_theme', name: '收藏家', desc: '解锁一个主题', icon: '🎨', check: (m) => m.unlockedThemes.length >= 2 },
    { id: 'unlock_all', name: '主题大师', desc: '解锁全部主题', icon: '🌈', check: (m) => m.unlockedThemes.length >= THEMES.length }
];

export const ACHIEVEMENT_MAP = ACHIEVEMENTS.reduce((m, a) => { m[a.id] = a; return m; }, {});
