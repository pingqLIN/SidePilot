# SidePilot 核心觀念

> 幫你快速建立 SidePilot 的心智模型：模式差異、上下文從哪裡來，以及本地 bridge 為什麼存在。

---

## 核心概念

| 概念 | 摘要 | 延伸閱讀 |
| --- | --- | --- |
| 模式 | `iframe` 立即可用；`SDK` 可程式化且更懂上下文 | [../../FEATURES.md](../../FEATURES.md) |
| Memory 與 Rules | Memory 保存事實；Rules 形塑行為 | [../../USAGE.zh-TW.md#-記憶庫](../../USAGE.zh-TW.md#-記憶庫) |
| 本機優先 bridge | SDK 模式走 localhost 控制平面，而不是遠端 relay | [../API.zh-TW.md](../API.zh-TW.md) |
| 頁面擷取 | 把瀏覽器當下內容更快帶進 prompt | [../../SCREENSHOTS.md](../../SCREENSHOTS.md) |

## 最好理解的方式

1. **iframe 模式** 是最快開始的方法
2. **SDK 模式** 是長成完整工作流後的主力模式
3. **Memory** 負責保存專案事實
4. **Rules** 負責規範助理行為
5. **Capture** 負責把即時頁面內容帶入對話

## 建議下一步

- 設定路線： [../getting-started/README.zh-TW.md](../getting-started/README.zh-TW.md)
- 端點導覽： [../api/README.zh-TW.md](../api/README.zh-TW.md)
- 完整功能巡覽： [../../FEATURES.md](../../FEATURES.md)
