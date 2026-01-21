import { defineStore } from 'pinia'
import { generateMockData } from '../mock/index.js'

/**
 * 物品状态管理 Store
 * @typedef {Object} Item
 * @property {string} name - 物品名称
 * @property {string} [description] - 物品描述
 * @property {number} needScore - 需求度 (0-10)
 * @property {number} meaningScore - 意义度 (0-10)
 * @property {boolean} [isDiscarded] - 是否已丢弃
 */
export const useItemStore = defineStore('items', {
  state: () => ({
    /** @type {Item[]} */
    items: []
  }),
  actions: {
    /**
     * 初始化数据
     * 如果列表为空，则加载 Mock 数据
     */
    initData() {
      if (this.items.length === 0) {
        this.items = generateMockData()
      }
    },
    /**
     * 添加新物品
     * @param {Omit<Item, 'id'>} item - 新物品对象
     */
    addItem(item) {
      // 简单的 ID 生成策略：最大 ID + 1
      const maxId = this.items.length > 0 ? Math.max(...this.items.map(i => i.id)) : 0
      this.items.push({
        id: maxId + 1,
        isDiscarded: false,
        ...item
      })
    },
    /**
     * 更新物品信息
     * @param {number} id 
     * @param {Partial<Item>} updates 
     */
    updateItem(id, updates) {
      const item = this.items.find(i => i.id === id)
      if (item) {
        Object.assign(item, updates)
      }
    },
    /**
     * 标记物品为已丢弃
     * @param {number} id 
     */
    markAsDiscarded(id) {
      const item = this.items.find(i => i.id === id)
      if (item) {
        item.isDiscarded = true
      }
    },
    /**
     * 清空所有数据
     */
    clearItems() {
      this.items = []
    },
    /**
     * 设置所有数据 (用于导入)
     * @param {Item[]} items 
     */
    setItems(items) {
      this.items = items
    }
  },
  getters: {
    /**
     * 获取未丢弃的总数 (用于图表展示)
     */
    activeItems: (state) => state.items.filter(item => !item.isDiscarded),
    /**
     * 获取总数
     */
    totalItems: (state) => state.items.length,
    /**
     * 获取推荐遗弃的物品 (第三象限：低需求 & 低意义 & 未丢弃)
     * 定义：需求度 <= 3 且 意义度 <= 3 且 未丢弃
     */
    discardItems: (state) => state.items.filter(item => item.needScore <= 3 && item.meaningScore <= 3 && !item.isDiscarded)
  }
})
