<template>
    <div class="input-container">
        <!-- 列表展示 -->
        <a-card class="box-card list-card">
            <template #title>
                <div class="card-header">
                    <span>物品管理 ({{ store.totalItems }})</span>
                </div>
            </template>
            <template #extra>
                <a-space>
                    <a-button type="primary" @click="handleOpenModal">
                        <template #icon><icon-plus /></template>
                        录入物品
                    </a-button>
                    <a-button @click="handleInitData">生成测试数据</a-button>
                    <a-button @click="handleExport">导出</a-button>
                    <a-button status="success" @click="triggerImport">导入</a-button>
                    <a-button status="danger" type="text" @click="handleClearItems">清空</a-button>
                </a-space>
                <input
                    type="file"
                    ref="fileInput"
                    style="display: none"
                    accept=".json"
                    @change="handleImportFile" />
            </template>

            <a-table
                :data="store.items"
                :pagination="pagination"
                @page-change="onPageChange"
                @page-size-change="onPageSizeChange"
                style="width: 100%"
                :scroll="{ y: 400 }">
                <template #columns>
                    <a-table-column title="ID" data-index="id" :width="80" />
                    <a-table-column title="名称" data-index="name" />
                    <a-table-column title="需求度" data-index="needScore" sortable>
                        <template #cell="{ record }">
                            <a-popover title="调整需求度" trigger="click">
                                <a-tag :color="getNeedColor(record.needScore)" style="cursor: pointer">
                                    {{ record.needScore }} <icon-edit />
                                </a-tag>
                                <template #content>
                                    <div style="width: 200px; padding: 10px">
                                        <a-slider 
                                            v-model="record.needScore" 
                                            :min="1" 
                                            :max="10" 
                                            show-input
                                            @change="(val) => handleUpdateScore(record, 'needScore', val)"
                                        />
                                    </div>
                                </template>
                            </a-popover>
                        </template>
                    </a-table-column>
                    <a-table-column title="意义" data-index="meaningScore" sortable>
                        <template #cell="{ record }">
                            <a-popover title="调整意义度" trigger="click">
                                <a-tag :color="getMeaningColor(record.meaningScore)" style="cursor: pointer">
                                    {{ record.meaningScore }} <icon-edit />
                                </a-tag>
                                <template #content>
                                    <div style="width: 200px; padding: 10px">
                                        <a-slider 
                                            v-model="record.meaningScore" 
                                            :min="1" 
                                            :max="10" 
                                            show-input
                                            @change="(val) => handleUpdateScore(record, 'meaningScore', val)"
                                        />
                                    </div>
                                </template>
                            </a-popover>
                        </template>
                    </a-table-column>
                    <a-table-column title="状态" data-index="isDiscarded">
                        <template #cell="{ record }">
                            <a-tag v-if="record.isDiscarded" color="gray">已舍弃</a-tag>
                            <a-tag v-else color="arcoblue">拥有</a-tag>
                        </template>
                    </a-table-column>
                    <a-table-column title="操作" :width="120">
                        <template #cell="{ record }">
                            <a-button
                                v-if="!record.isDiscarded"
                                type="primary"
                                status="danger"
                                size="small"
                                @click="confirmDiscard(record)">
                                <template #icon><icon-delete /></template>
                                舍弃
                            </a-button>
                        </template>
                    </a-table-column>
                </template>
            </a-table>
        </a-card>
    </div>
</template>

<script setup>
    import { useItemStore } from "../store/items";
    import { Message, Modal } from "@arco-design/web-vue";
    import { IconPlus, IconDelete, IconEdit } from "@arco-design/web-vue/es/icon";
    import { defineAsyncComponent, h, ref, reactive } from "vue";

    // 异步加载组件
    const ItemInputModal = defineAsyncComponent(
        () => import("../components/modalComponents/ItemInputModal.vue")
    );

    const store = useItemStore();
    const fileInput = ref(null);

    // 分页配置
    const pagination = reactive({
        current: 1,
        pageSize: 10,
        showPageSize: true,
        pageSizeOptions: [10, 20, 50, 100]
    });

    const onPageChange = (current) => {
        pagination.current = current;
    };

    const onPageSizeChange = (pageSize) => {
        pagination.current = 1;
        pagination.pageSize = pageSize;
    };

    /**
     * 打开录入弹窗
     */
    const handleOpenModal = () => {
        const modalRef = ref(null);

        Modal.open({
            title: "录入物品",
            width: "600px",
            okText: "保存并继续",
            content: () => h(ItemInputModal, { ref: modalRef }),
            onBeforeOk: (done) => {
                const formData = modalRef.value?.validateAndGetData();
                if (formData) {
                    store.addItem({
                        name: formData.name,
                        description: formData.description,
                        needScore: formData.needScore,
                        meaningScore: formData.meaningScore
                    });
                    Message.success("添加成功");
                    // 清空表单以便录入下一项
                    modalRef.value?.resetForm();
                }
                done(false);
            }
        });
    };

    /**
     * 确认舍弃物品
     * @param {object} item
     */
    const confirmDiscard = (item) => {
        Modal.confirm({
            title: "确认舍弃",
            content: `确定要舍弃"${item.name}"吗？`,
            onOk: () => {
                store.markAsDiscarded(item.id);
                Message.success("已标记为舍弃");
            }
        });
    };

    /**
     * 清空确认
     */
    const handleClearItems = () => {
        if (store.totalItems === 0) return;

        Modal.warning({
            title: "确认清空",
            content: "确定要清空所有已录入的物品吗？此操作不可恢复。",
            onOk: () => {
                store.clearItems();
                Message.success("已清空");
            }
        });
    };

    /**
     * 生成测试数据
     */
    const handleInitData = () => {
        store.initData();
        Message.success("已生成测试数据");
    };

    /**
     * 导出 JSON
     */
    const handleExport = () => {
        if (store.totalItems === 0) {
            Message.warning("暂无数据可导出");
            return;
        }
        const data = JSON.stringify(store.items, null, 2);
        const blob = new Blob([data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `declutter-items-${new Date().getTime()}.json`;
        link.click();
        URL.revokeObjectURL(url);
        Message.success("导出成功");
    };

    /**
     * 触发导入
     */
    const triggerImport = () => {
        fileInput.value.click();
    };

    /**
     * 处理文件导入
     */
    const handleImportFile = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (Array.isArray(data)) {
                    // 简单校验
                    const valid = data.every(
                        (item) =>
                            item.name &&
                            item.needScore !== undefined &&
                            item.meaningScore !== undefined
                    );
                    if (valid) {
                        store.setItems(data);
                        Message.success("导入成功");
                    } else {
                        Message.error("数据格式不正确，缺少必要字段");
                    }
                } else {
                    Message.error("数据格式不正确，应为数组");
                }
            } catch (err) {
                console.error(err);
                Message.error("JSON 解析失败");
            }
            // 清空 input，允许重复导入同一文件
            event.target.value = "";
        };
        reader.readAsText(file);
    };

    let updateTimer = null;

    /**
     * 更新评分
     */
    const handleUpdateScore = (item, field, value) => {
        store.updateItem(item.id, { [field]: value });
        
        // 防抖提示，避免频繁弹出
        if (updateTimer) clearTimeout(updateTimer);
        updateTimer = setTimeout(() => {
            Message.success('更新成功');
            updateTimer = null;
        }, 800);
    };

    /**
     * 获取需求度标签颜色
     * @param {number} score
     */
    const getNeedColor = (score) => {
        return score > 5 ? "green" : "gray";
    };

    /**
     * 获取意义标签颜色
     * @param {number} score
     */
    const getMeaningColor = (score) => {
        return score > 5 ? "orange" : "gray";
    };
</script>

<style scoped>
    .input-container {
        display: flex;
        flex-direction: column;
        gap: 20px;
    }

    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
</style>
