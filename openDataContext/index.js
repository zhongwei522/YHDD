// 开放数据域：渲染好友排行榜到 sharedCanvas
// 注意：此文件运行在独立 JS 上下文，只能访问 wx 的关系链与 sharedCanvas。

const sharedCanvas = wx.getSharedCanvas();
const ctx = sharedCanvas.getContext('2d');

let W = 320;
let H = 440;
let DPR = 1;

try {
    DPR = wx.getSystemInfoSync().pixelRatio || 1;
} catch (e) {}

function applySize() {
    sharedCanvas.width = Math.round(W * DPR);
    sharedCanvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}

applySize();

wx.onMessage((msg) => {
    if (!msg || msg.type !== 'showFriends') return;
    if (msg.width && msg.height) {
        W = msg.width;
        H = msg.height;
        applySize();
    }
    renderFriends();
});

function drawPlaceholder(text) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#e94560';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏆 好友排行榜', W / 2, 30);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '16px sans-serif';
    ctx.fillText(text, W / 2, H / 2);
}

function renderFriends() {
    ctx.clearRect(0, 0, W, H);
    drawPlaceholder('加载中…');

    wx.getFriendCloudStorage({
        keyList: ['score'],
        success: (res) => {
            let list = (res.data || []).map((f) => {
                let score = 0;
                if (f.KVDataList) {
                    const kv = f.KVDataList.find((k) => k.key === 'score');
                    if (kv) score = parseInt(kv.value, 10) || 0;
                }
                return { name: f.nickname || '匿名', avatar: f.avatarUrl, score };
            }).sort((a, b) => b.score - a.score);

            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = '#e94560';
            ctx.font = 'bold 22px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🏆 好友排行榜', W / 2, 30);

            if (list.length === 0) {
                ctx.fillStyle = 'rgba(255,255,255,0.6)';
                ctx.font = '16px sans-serif';
                ctx.fillText('暂无好友数据（发布后可见）', W / 2, H / 2);
                return;
            }

            const rowH = 42;
            const maxRows = Math.max(1, Math.floor((H - 58) / rowH));
            const top = list.slice(0, maxRows);

            top.forEach((f, i) => {
                const y = 58 + i * rowH;
                ctx.fillStyle = i === 0 ? 'rgba(255,217,61,0.15)' : (i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0)');
                ctx.fillRect(8, y - 20, W - 16, rowH - 6);

                ctx.fillStyle = '#fff';
                ctx.font = 'bold 20px sans-serif';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                ctx.fillText(`${i + 1}`, 22, y);

                ctx.fillStyle = '#fff';
                ctx.font = '17px sans-serif';
                ctx.fillText((f.name && f.name.length > 8) ? f.name.slice(0, 8) + '…' : f.name, 58, y);

                ctx.fillStyle = '#ffd93d';
                ctx.font = 'bold 17px sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText(`${f.score} 关`, W - 16, y);

                if (f.avatar) {
                    const img = wx.createImage();
                    img.onload = () => ctx.drawImage(img, 18, y - 18, 36, 36);
                    img.src = f.avatar;
                }
            });
        },
        fail: () => {
            drawPlaceholder('暂无好友数据');
        }
    });
}
