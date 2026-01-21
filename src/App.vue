<template>
  <div class="common-layout">
    <a-layout>
      <a-layout-header>
        <a-menu
          :selected-keys="[currentView]"
          mode="horizontal"
          @menu-item-click="handleMenuClick"
        >
          <a-menu-item key="input">
            <template #icon><icon-edit /></template>
            物品管理
          </a-menu-item>
          <a-menu-item key="stats">
            <template #icon><icon-bar-chart /></template>
            四象限统计
          </a-menu-item>
        </a-menu>
      </a-layout-header>
      <a-layout-content>
        <keep-alive>
          <component :is="currentViewComponent" @switch-view="handleSwitchView" />
        </keep-alive>
      </a-layout-content>
    </a-layout>
  </div>
</template>

<script setup>
import InputView from './views/InputView.vue'
import StatsView from './views/StatsView.vue'

// 当前激活的视图
const currentView = ref('input')

// 计算当前显示的组件
const currentViewComponent = computed(() => {
  return currentView.value === 'input' ? InputView : StatsView
})

// 处理菜单点击
const handleMenuClick = (key) => {
  currentView.value = key
}

// 处理视图切换请求
const handleSwitchView = (viewKey) => {
  currentView.value = viewKey
}
</script>

<style>
.arco-layout-header {
  padding: 0;
}
.arco-layout-content {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}
</style>
