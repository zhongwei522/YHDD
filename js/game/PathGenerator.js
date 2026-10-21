// 多样化的路径生成器 —— 解决"关卡重复"与"障碍物挤成一团"
// 核心思路：先采样一组"分散"的障碍物位置，再在剩余网格上 DFS 找覆盖所有非障碍格的路径。
// 这样障碍物由采样控制、天然分散，而 DFS 只负责保证有解。

import { getNeighbors } from '../utils/gameUtils.js';

function dirOf(from, to, cols) {
    const d = to - from;
    if (d === 1) return 0;      // 右
    if (d === -1) return 1;     // 左
    if (d === cols) return 2;   // 下
    if (d === -cols) return 3;  // 上
    return -1;
}

function shuffle(arr, rng) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
}

function hasObstacleNeighbor(cell, obstacles, rows, cols) {
    const ns = getNeighbors(cell, rows, cols);
    for (let i = 0; i < ns.length; i++) if (obstacles.has(ns[i])) return true;
    return false;
}

export class PathGenerator {
    // 蛇形：S 型折线，随机横/纵 + 随机反转
    static snake(rows, cols, rng) {
        const path = [];
        if (rng() < 0.5) {
            for (let i = 0; i < rows; i++) {
                if (i % 2 === 0) {
                    for (let j = 0; j < cols; j++) path.push(i * cols + j);
                } else {
                    for (let j = cols - 1; j >= 0; j--) path.push(i * cols + j);
                }
            }
        } else {
            for (let j = 0; j < cols; j++) {
                if (j % 2 === 0) {
                    for (let i = 0; i < rows; i++) path.push(i * cols + j);
                } else {
                    for (let i = rows - 1; i >= 0; i--) path.push(i * cols + j);
                }
            }
        }
        if (rng() < 0.5) path.reverse();
        return path;
    }

    // 螺旋：由外向内环绕
    static spiral(rows, cols, rng) {
        const path = [];
        let top = 0, bottom = rows - 1, left = 0, right = cols - 1;
        while (top <= bottom && left <= right) {
            for (let j = left; j <= right; j++) path.push(top * cols + j);
            top++;
            for (let i = top; i <= bottom; i++) path.push(i * cols + right);
            right--;
            if (top <= bottom) {
                for (let j = right; j >= left; j--) path.push(bottom * cols + j);
                bottom--;
            }
            if (left <= right) {
                for (let i = bottom; i >= top; i--) path.push(i * cols + left);
                left++;
            }
        }
        if (rng() < 0.5) path.reverse();
        return path;
    }

    // 随机回溯 DFS + Warnsdorff 启发式 + 转向偏好
    // blocked：视为"已访问"的格子（即障碍物），DFS 会绕开它们。
    // targetLength：目标覆盖的格子数（不含 blocked）。
    static dfs(rows, cols, targetLength, rng, startPositions, turniness, blocked = null, stepLimit = 20000) {
        const total = rows * cols;
        const visited = new Uint8Array(total);
        if (blocked) for (const b of blocked) visited[b] = 1;

        const dirAt = new Int8Array(total);
        const path = [];

        let startNode = null;
        const validStarts = startPositions.filter((s) => s >= 0 && s < total && !visited[s]);
        if (validStarts.length > 0) {
            startNode = validStarts[Math.floor(rng() * validStarts.length)];
        } else {
            const free = [];
            for (let i = 0; i < total; i++) if (!visited[i]) free.push(i);
            if (free.length === 0) return path;
            startNode = free[Math.floor(rng() * free.length)];
        }
        visited[startNode] = 1;
        path.push(startNode);

        // 记录探索过程中达到的最长路径（用于"找不全时退回次优解"）
        let bestPath = [startNode];
        let steps = 0;

        const degree = (n) => {
            const ns = getNeighbors(n, rows, cols);
            let c = 0;
            for (let i = 0; i < ns.length; i++) if (!visited[ns[i]]) c++;
            return c;
        };

        const step = (node) => {
            if (++steps > stepLimit) return false; // 防穷举，保证手机端耗时可控
            if (path.length >= targetLength) return true;
            if (path.length > bestPath.length) bestPath = path.slice();
            const ns = getNeighbors(node, rows, cols).filter((n) => !visited[n]);
            if (ns.length === 0) return false;

            const dir = dirAt[node];
            ns.sort((a, b) => {
                const da = degree(a);
                const db = degree(b);
                const ta = dir === dirOf(node, a, cols) ? 0 : 1;
                const tb = dir === dirOf(node, b, cols) ? 0 : 1;
                const sa = da + turniness * ta;
                const sb = db + turniness * tb;
                if (sa !== sb) return sa - sb;
                return rng() - 0.5;
            });

            for (let i = 0; i < ns.length; i++) {
                const n = ns[i];
                visited[n] = 1;
                dirAt[n] = dirOf(node, n, cols);
                path.push(n);
                if (step(n)) return true;
                path.pop();
                visited[n] = 0;
            }
            return false;
        };

        step(startNode);
        return (path.length >= targetLength) ? path : bestPath;
    }

    // 计算障碍物的最大连通块大小（4 连通），用于评估"分散度"
    static maxCluster(obstacles, rows, cols) {
        const seen = new Set();
        let best = 0;
        for (const o of obstacles) {
            if (seen.has(o)) continue;
            const stack = [o];
            let size = 0;
            seen.add(o);
            while (stack.length) {
                const cur = stack.pop();
                size++;
                const r = Math.floor(cur / cols);
                const c = cur % cols;
                const ns = getNeighbors(cur, rows, cols);
                for (let i = 0; i < ns.length; i++) {
                    const id = ns[i];
                    if (obstacles.has(id) && !seen.has(id)) { seen.add(id); stack.push(id); }
                }
            }
            if (size > best) best = size;
        }
        return best;
    }

    // 采样一组"分散"的障碍物：排斥采样，保证障碍物两两不共享边（完全打散）
    static scatterObstacles(rows, cols, count, rng) {
        const total = rows * cols;
        const obstacles = new Set();

        const order = [];
        for (let i = 0; i < total; i++) order.push(i);
        shuffle(order, rng);

        // 第一遍：只放"与已放障碍物不共享边"的孤立位（15% 密度下绰绰有余）
        for (let i = 0; i < order.length && obstacles.size < count; i++) {
            const c = order[i];
            if (!hasObstacleNeighbor(c, obstacles, rows, cols)) obstacles.add(c);
        }

        // 第二遍：极少情况下放不下时，补充剩余位置
        for (let i = 0; i < order.length && obstacles.size < count; i++) {
            if (!obstacles.has(order[i])) obstacles.add(order[i]);
        }
        return obstacles;
    }
}
