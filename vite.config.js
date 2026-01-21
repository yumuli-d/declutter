import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ArcoResolver } from "unplugin-vue-components/resolvers";

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        vue(),
        AutoImport({
            imports: ["vue", "pinia"],
            resolvers: [ArcoResolver()],
            eslintrc: {
                enabled: true // 生成 .eslintrc-auto-import.json
            }
        }),
        Components({
            resolvers: [
                ArcoResolver({
                    sideEffect: true,
                    resolveIcons: true
                })
            ]
        })
    ],
    base: "./",
    build: {
        rollupOptions: {
            output: {
                manualChunks: (filePath) => {
                    const basePath = __dirname.replace(/\\/g, "/") + "/node_modules/";
                    if (!filePath.includes(basePath)) return;

                    const path = filePath.replace(basePath, "");
                    const moduleName = path.split("/")[0].toString();

                    // 基础依赖包
                    const baseModules = ["@vue", "echarts"];
                    // 检查基础依赖包
                    if (baseModules.includes(moduleName)) {
                        return moduleName;
                    }

                    // arco 相关依赖包规则
                    const arcoRules = {
                        core: {
                            patterns: [
                                "@arco-design/web-vue/es/index.js",
                                "@arco-design/web-vue/es/_virtual"
                            ],
                            chunk: "@arco-design-core"
                        },
                        icon: {
                            patterns: ["@arco-design/web-vue/es/icon/"],
                            chunk: "@arco-design-icon"
                        },
                        components: {
                            patterns: ["@arco-design/web-vue/es/"],
                            chunk: "@arco-design-components"
                        }
                    };

                    // 检查是否匹配 arco 规则（按照特定顺序检查）
                    const ruleOrder = ["core", "icon", "components"];
                    for (const key of ruleOrder) {
                        const rule = arcoRules[key];
                        if (rule.patterns.some((pattern) => path.includes(pattern))) {
                            return rule.chunk;
                        }
                    }

                    // 其他依赖打包到 vendor
                    return "vendor";
                }
            }
        }
    }
});
