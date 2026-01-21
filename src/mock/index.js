import Mock from 'mockjs'

// 使用 Mock.Random 生成随机数据
const Random = Mock.Random

/**
 * 生成模拟数据
 * items: 包含 20-30 个物品的数组
 * id: 自增 ID
 * name: 随机中文标题
 * needScore: 需求度评分 1-10
 * meaningScore: 意义评分 1-10
 */
export const generateMockData = () => {
  const data = Mock.mock({
    'items|50-100': [{
      'id|+1': 1,
      'name': () => Random.ctitle(2, 5) + '物品',
      'description': () => Random.cparagraph(1, 3),
      'needScore|1-10': 1,
      'meaningScore|1-10': 1,
      'isDiscarded': false
    }]
  })
  return data.items
}
