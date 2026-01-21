<template>
  <div class="stats-container">
    <div class="main-layout">
        <!-- 左侧：四象限分析 -->
        <div class="left-panel">
            <a-card>
            <template #title>
                <div class="card-header">
                <span>四象限分析</span>
                <a-tag color="gray">总物品: {{ store.totalItems }}</a-tag>
                </div>
            </template>
            <div v-if="store.totalItems === 0" class="empty-container">
                <a-empty description="暂无数据，请先录入物品">
                    <template #extra>
                        <a-button type="primary" @click="$emit('switchView', 'input')">去录入</a-button>
                    </template>
                </a-empty>
            </div>
            <div v-else>
                <div ref="chartRef" class="chart-container"></div>
                
                <div class="quadrant-legend" v-if="store.totalItems > 0">
                    <div class="legend-item q1">
                        <span class="dot"></span> 
                        <strong>保留/珍藏</strong>: 我需要的 & 有意义的
                    </div>
                    <div class="legend-item q2">
                        <span class="dot"></span>
                        <strong>纪念/储存</strong>: 不需要的 & 有意义的
                    </div>
                    <div class="legend-item q3">
                        <span class="dot"></span>
                        <strong>丢弃/断舍离</strong>: 不需要的 & 无意义的
                    </div>
                    <div class="legend-item q4">
                        <span class="dot"></span>
                        <strong>消耗品/工具</strong>: 我需要的 & 无意义的
                    </div>
                </div>
            </div>
            
            <!-- 推荐遗弃清单 -->
            <div class="discard-section">
                <a-divider orientation="left">推荐遗弃清单 ({{ store.discardItems.length }})</a-divider>
                <a-list :data="store.discardItems" :bordered="false">
                    <template #header>
                        以下物品需求度与意义度均较低 (≤3)，建议优先考虑断舍离
                    </template>
                    <template #empty>
                        <div class="empty-list">
                            <a-empty description="暂无推荐遗弃物品" />
                        </div>
                    </template>
                    <template #item="{ item }">
                        <a-list-item :key="item.id">
                            <a-list-item-meta :title="item.name" :description="item.description">
                                <template #avatar>
                                    <a-tag color="red">{{ item.needScore }} / {{ item.meaningScore }}</a-tag>
                                </template>
                            </a-list-item-meta>
                            <template #actions>
                                <a-button type="primary" status="danger" size="small" @click="confirmDiscard(item)">
                                    <template #icon><icon-delete /></template>
                                    丢弃
                                </a-button>
                            </template>
                        </a-list-item>
                    </template>
                </a-list>
            </div>
            </a-card>
        </div>

        <!-- 右侧：物品详情 -->
        <div class="right-panel" v-if="store.totalItems > 0">
            <a-card class="detail-card" title="物品详情">
                <div v-if="selectedItem" class="item-detail">
                    <h3>{{ selectedItem.name }}</h3>
                    <p class="description">{{ selectedItem.description || '暂无描述' }}</p>
                    <a-divider />
                    <div class="scores">
                        <div class="score-item">
                            <div class="score-header">
                                <span class="label">需求度</span>
                                <a-tag :color="getNeedColor(selectedItem.needScore)">{{ selectedItem.needScore }}</a-tag>
                            </div>
                            <a-slider 
                                v-model="selectedItem.needScore" 
                                :min="1" :max="10" 
                                :style="{ width: '100%', marginTop: '10px' }"
                                @change="val => updateScore(selectedItem.id, 'needScore', val)"
                            />
                        </div>
                        <div class="score-item">
                            <div class="score-header">
                                <span class="label">意义度</span>
                                <a-tag :color="getMeaningColor(selectedItem.meaningScore)">{{ selectedItem.meaningScore }}</a-tag>
                            </div>
                            <a-slider 
                                v-model="selectedItem.meaningScore" 
                                :min="1" :max="10" 
                                :style="{ width: '100%', marginTop: '10px' }"
                                @change="val => updateScore(selectedItem.id, 'meaningScore', val)"
                            />
                        </div>
                    </div>
                    <div class="action-area">
                        <a-button type="primary" status="danger" long @click="confirmDiscard(selectedItem)">丢弃</a-button>
                    </div>
                </div>
                <div v-else class="empty-detail">
                    <icon-info-circle class="info-icon" />
                    <p>点击左侧图表中的点<br/>查看物品详情</p>
                </div>
            </a-card>
        </div>
    </div>
  </div>
</template>

<script setup>
import { useItemStore } from '../store/items'
import * as echarts from 'echarts'
import { Message, Modal } from '@arco-design/web-vue'

const store = useItemStore()
const chartRef = ref(null)
let chartInstance = null
const selectedItem = ref(null)

// 监听数据变化，刷新图表
watch(() => store.items, () => {
    if (chartInstance) {
        updateChart()
    } else if (store.totalItems > 0) {
        // 如果之前是空状态，现在有数据了，需要初始化图表
        // 使用 nextTick 确保 DOM 更新
        nextTick(() => {
            initChart()
        })
    }
}, { deep: true })

/**
 * 确认丢弃物品
 * @param {object} item 
 */
const confirmDiscard = (item) => {
    Modal.confirm({
        title: '确认丢弃',
        content: `确定要丢弃"${item.name}"吗？这将把它从统计图和推荐列表中移除。`,
        onOk: () => {
            store.markAsDiscarded(item.id)
            Message.success('已标记为丢弃')
            // 如果丢弃的是当前选中的物品，清空选中状态
            if (selectedItem.value && selectedItem.value.id === item.id) {
                selectedItem.value = null
            }
        }
    })
}

/**
 * 更新评分
 * @param {number} id 
 * @param {string} field 
 * @param {number} value 
 */
const updateScore = (id, field, value) => {
    store.updateItem(id, { [field]: value })
    // 图表会自动更新，因为监听了 store.items
}

onMounted(() => {
    if (store.totalItems > 0) {
        initChart()
    }
})

onActivated(() => {
    if (chartInstance) {
        chartInstance.resize()
    } else if (store.totalItems > 0) {
        initChart()
    }
})

onUnmounted(() => {
    if (chartInstance) {
        chartInstance.dispose()
    }
    window.removeEventListener('resize', handleResize)
})

const handleResize = () => {
    chartInstance && chartInstance.resize()
}

/**
 * 初始化图表
 */
const initChart = () => {
    if (!chartRef.value) return
    
    chartInstance = echarts.init(chartRef.value)
    
    // 监听点击事件
    chartInstance.on('click', (params) => {
        if (params.data && params.data.rawItem) {
            selectedItem.value = params.data.rawItem
        }
    })
    // 监听空白处点击，取消选择
    chartInstance.getZr().on('click', (params) => {
        if (!params.target) {
            selectedItem.value = null
        }
    })

    window.addEventListener('resize', handleResize)
    updateChart()
}

/**
 * 更新图表配置
 */
const updateChart = () => {
    if (!chartInstance) {
        initChart()
        return
    }

    // 处理数据，解决重叠问题
    const processedData = processDataWithJitter(store.activeItems)

    const data = processedData.map(item => {
        return {
            name: item.name,
            value: [item.jitteredNeed, item.jitteredMeaning],
            originalValue: [item.needScore, item.meaningScore],
            itemStyle: {
                color: getItemColor(item.needScore, item.meaningScore)
            },
            rawItem: item
        }
    })

    const option = {
        title: {
            text: '物品分布图',
            left: 'center'
        },
        tooltip: {
            formatter: function (params) {
                const original = params.data.originalValue
                return `<b>${params.name}</b><br/>需求度: ${original[0]}<br/>意义: ${original[1]}`
            }
        },
        grid: {
            left: '10%',
            right: '10%',
            bottom: '10%',
            top: '15%',
            containLabel: true
        },
        xAxis: {
            name: '需求度 (Need)',
            nameLocation: 'middle',
            nameGap: 30,
            type: 'value',
            min: 0,
            max: 11,
            interval: 1,
            splitLine: {
                show: false
            },
            axisLabel: {
                formatter: (value) => (value >= 1 && value <= 10) ? value : ''
            }
        },
        yAxis: {
            name: '意义 (Meaning)',
            nameLocation: 'middle',
            nameGap: 30,
            type: 'value',
            min: 0,
            max: 11,
            interval: 1,
            splitLine: {
                show: false
            },
            axisLabel: {
                formatter: (value) => (value >= 1 && value <= 10) ? value : ''
            }
        },
        series: [
            {
                type: 'scatter',
                symbolSize: 20,
                data: data,
                markLine: {
                    silent: true,
                    lineStyle: {
                        color: '#999',
                        type: 'dashed'
                    },
                    data: [
                        { xAxis: 5.5 },
                        { yAxis: 5.5 }
                    ]
                },
                markArea: {
                    silent: true,
                    itemStyle: {
                        color: 'transparent',
                        borderWidth: 0,
                        opacity: 0.1
                    },
                    data: [
                        // 右上 (Need>5.5, Meaning>5.5)
                        [
                            {
                                name: '保留/珍藏',
                                xAxis: 5.5,
                                yAxis: 5.5,
                                itemStyle: { color: 'rgba(103, 194, 58, 0.2)' },
                                label: {
                                    position: 'inside',
                                    color: '#67C23A',
                                    fontSize: 14,
                                    fontWeight: 'bold'
                                }
                            },
                            { xAxis: 11, yAxis: 11 }
                        ],
                        // 左上 (Need<5.5, Meaning>5.5)
                        [
                            {
                                name: '纪念/储存',
                                xAxis: 0,
                                yAxis: 5.5,
                                itemStyle: { color: 'rgba(230, 162, 60, 0.2)' },
                                label: {
                                    position: 'inside',
                                    color: '#E6A23C',
                                    fontSize: 14,
                                    fontWeight: 'bold'
                                }
                            },
                            { xAxis: 5.5, yAxis: 11 }
                        ],
                        // 左下 (Need<5.5, Meaning<5.5)
                        [
                            {
                                name: '丢弃',
                                xAxis: 0,
                                yAxis: 0,
                                itemStyle: { color: 'rgba(245, 108, 108, 0.2)' },
                                label: {
                                    position: 'inside',
                                    color: '#F56C6C',
                                    fontSize: 14,
                                    fontWeight: 'bold'
                                }
                            },
                            { xAxis: 5.5, yAxis: 5.5 }
                        ],
                        // 右下 (Need>5.5, Meaning<5.5)
                        [
                            {
                                name: '消耗品',
                                xAxis: 5.5,
                                yAxis: 0,
                                itemStyle: { color: 'rgba(64, 158, 255, 0.2)' },
                                label: {
                                    position: 'inside',
                                    color: '#409EFF',
                                    fontSize: 14,
                                    fontWeight: 'bold'
                                }
                            },
                            { xAxis: 11, yAxis: 5.5 }
                        ]
                    ]
                }
            }
        ]
    }

    chartInstance.setOption(option)
}

/**
 * 处理数据，为重叠点添加抖动
 * @param {Array} items 
 */
const processDataWithJitter = (items) => {
    // 按坐标分组
    const groups = {}
    items.forEach(item => {
        const key = `${item.needScore}-${item.meaningScore}`
        if (!groups[key]) {
            groups[key] = []
        }
        groups[key].push(item)
    })

    const result = []
    Object.values(groups).forEach(group => {
        if (group.length === 1) {
            // 只有一个点，不抖动
            result.push({
                ...group[0],
                jitteredNeed: group[0].needScore,
                jitteredMeaning: group[0].meaningScore
            })
        } else {
            // 多个点，圆形分布
            const count = group.length
            // 基础半径，点越多半径稍微越大，但不能超过 0.4 (避免碰到旁边格子)
            const radius = Math.min(0.15 + (count * 0.02), 0.35)
            
            group.forEach((item, index) => {
                const angle = (index / count) * 2 * Math.PI
                // 添加一点随机旋转角度，避免看起来太死板
                const randomRotate = (group[0].needScore + group[0].meaningScore) * 123 
                const finalAngle = angle + randomRotate
                
                result.push({
                    ...item,
                    jitteredNeed: item.needScore + radius * Math.cos(finalAngle),
                    jitteredMeaning: item.meaningScore + radius * Math.sin(finalAngle)
                })
            })
        }
    })
    return result
}

/**
 * 根据象限获取颜色
 * @param {number} x Need
 * @param {number} y Meaning
 */
const getItemColor = (x, y) => {
    // 中心点为 5.5
    if (x > 5.5 && y > 5.5) return '#67C23A' // Green (Q1)
    if (x < 5.5 && y > 5.5) return '#E6A23C' // Orange (Q2)
    if (x < 5.5 && y < 5.5) return '#F56C6C' // Red (Q3)
    return '#409EFF' // Blue (Q4)
}
const getNeedColor = (score) => {
    if (score >= 8) return 'red'
    if (score >= 5) return 'orange'
    return 'green'
}

const getMeaningColor = (score) => {
    if (score >= 8) return 'gold'
    if (score >= 5) return 'blue'
    return 'gray'
}
</script>

<style scoped>
.stats-container {
    width: 1100px;
    margin: 0 auto;
}
.main-layout {
    display: flex;
    gap: 20px;
    align-items: flex-start;
}
.left-panel {
    flex: 1;
    min-width: 0;
}
.right-panel {
    width: 300px;
    flex-shrink: 0;
    position: sticky;
    top: 20px;
}
.detail-card {
    /* height: 100%; */
}
.item-detail h3 {
    margin-top: 0;
    margin-bottom: 10px;
}
.description {
    color: var(--color-text-2);
    font-size: 14px;
    min-height: 40px;
}
.scores {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;
}
.score-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
}
.label {
    font-size: 12px;
    color: var(--color-text-3);
}
.action-area {
    margin-top: 20px;
}
.empty-detail {
    height: 300px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: var(--color-text-3);
    text-align: center;
}
.info-icon {
    font-size: 48px;
    margin-bottom: 10px;
    color: var(--color-text-4);
}
.arco-card {
    width: 100%;
}
.chart-container {
    width: 100%;
    height: 500px;
}
.empty-container {
    width: 100%;
    height: 500px;
    display: flex;
    justify-content: center;
    align-items: center;
}
.quadrant-legend {
    margin-top: 20px;
    padding: 15px;
    background-color: var(--color-fill-2);
    border-radius: 4px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
}
.legend-item {
    font-size: 14px;
    color: var(--color-text-2);
    display: flex;
    align-items: center;
}
.dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    margin-right: 8px;
    display: inline-block;
}
.q1 .dot { background-color: #67C23A; }
.q2 .dot { background-color: #E6A23C; }
.q3 .dot { background-color: #F56C6C; }
.q4 .dot { background-color: #409EFF; }

.card-header {
    display: flex;
    align-items: center;
    gap: 12px;
}

.discard-section {
    margin-top: 20px;
}
.empty-list {
    padding: 20px 0;
}
</style>
