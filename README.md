# Display Tools

面向 OLED 显示模组工程师的在线工具库与技术知识库。

## 当前架构

- `src/domain/`：领域模型和工具注册信息，不依赖具体页面。
- `src/views/`：路由页面。工具实现后，每个工具可以继续拆到独立目录。
- `src/App.vue`：全局布局与站点导航。
- `src/styles.css`：当前首版视觉基础。

新增工具时，建议为工具建立独立目录，例如：

```text
src/tools/base-converter/
├── BaseConverterView.vue
├── base-converter.ts
└── index.ts
```

然后在 `src/domain/tools.ts` 注册元数据，并在路由中挂载页面。工具的计算逻辑应保持为纯函数，便于单元测试和后续复用。

## 开发

```bash
npm install
npm run dev
```

生产构建：

```bash
npm run build
```
