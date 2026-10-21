// 好友排行榜：主域负责上传分数 + 通知开放数据域渲染 + 取 sharedCanvas
export const Leaderboard = {
    // 上传玩家进度到微信云端（好友可见的 KV 数据）
    upload(score) {
        try {
            if (typeof wx.setUserCloudStorage !== 'function') return;
            wx.setUserCloudStorage({
                KVDataList: [{ key: 'score', value: String(score) }],
                success: () => {},
                fail: () => {}
            });
        } catch (e) {}
    },

    // 通知开放数据域绘制好友榜，并传入面板逻辑尺寸（用于高清适配）
    requestRender(width, height) {
        try {
            const odc = wx.getOpenDataContext();
            if (odc && odc.postMessage) odc.postMessage({ type: 'showFriends', width, height });
        } catch (e) {}
    },

    // 获取开放数据域的共享画布
    getSharedCanvas() {
        try {
            const odc = wx.getOpenDataContext();
            return (odc && odc.canvas) ? odc.canvas : null;
        } catch (e) {
            return null;
        }
    }
};
