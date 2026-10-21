// 轻量持久化封装：wx storage 原生支持对象，这里只做容错与默认值
export const storage = {
    get(key, fallback = null) {
        try {
            const v = wx.getStorageSync(key);
            return (v === '' || v === undefined || v === null) ? fallback : v;
        } catch (e) {
            return fallback;
        }
    },

    set(key, value) {
        try {
            wx.setStorageSync(key, value);
        } catch (e) {
            // 存储失败（如空间不足）静默忽略，不打断游戏
        }
    },

    remove(key) {
        try {
            wx.removeStorageSync(key);
        } catch (e) {}
    }
};
