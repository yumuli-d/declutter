<template>
  <div class="form-container">
    <a-form :model="form" :label-col-props="{span: 5}" :wrapper-col-props="{span: 19}">
      <a-form-item field="name" label="物品名称">
        <a-input v-model="form.name" placeholder="请输入物品名称" />
      </a-form-item>

      <a-form-item field="description" label="物品描述">
        <a-textarea v-model="form.description" placeholder="请输入物品描述（可选）" :auto-size="{minRows: 2, maxRows: 5}" />
      </a-form-item>
      
      <a-form-item field="needScore" label="需求度">
        <div class="slider-block">
          <span class="slider-label">不需要 (1)</span>
          <a-slider v-model="form.needScore" :min="1" :max="10" show-input />
          <span class="slider-label">非要不可 (10)</span>
        </div>
      </a-form-item>
      
      <a-form-item field="meaningScore" label="意义">
        <div class="slider-block">
          <span class="slider-label">无意义 (1)</span>
          <a-slider v-model="form.meaningScore" :min="1" :max="10" show-input />
          <span class="slider-label">非常有意义 (10)</span>
        </div>
      </a-form-item>
    </a-form>
  </div>
</template>

<script setup>
import { reactive, defineExpose } from 'vue'
import { Message } from '@arco-design/web-vue'

// 表单数据
const form = reactive({
  name: '',
  description: '',
  needScore: 5,
  meaningScore: 5
})

/**
 * 验证并获取数据
 * 供外部调用
 */
const validateAndGetData = () => {
  if (!form.name.trim()) {
    Message.warning('请输入物品名称')
    return null
  }
  return { ...form }
}

/**
 * 重置表单
 */
const resetForm = () => {
  form.name = ''
  form.description = ''
  form.needScore = 5
  form.meaningScore = 5
}

// 暴露方法给 Modal 使用
defineExpose({
  validateAndGetData,
  resetForm
})
</script>

<style scoped>
.slider-block {
    display: flex;
    align-items: center;
    width: 100%;
    gap: 10px;
}

.slider-label {
    font-size: 12px;
    color: #86909c;
    white-space: nowrap;
}

.arco-slider {
    flex: 1;
}
</style>