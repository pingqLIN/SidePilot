# 🧪 SidePilot E2E 使用測試計畫

**日期:** 2025年2月8日  
**目的:** 實際使用測試驗證所有功能的正確性  
**範圍:** 後端 API、前端互動、錯誤處理

---

## 📋 測試環境設定

### 後端服務啟動
```bash
cd scripts/github-copilot-proxy
npm run dev
# 服務運行在 http://localhost:3000
```

### 擴展加載
```
Chrome → Extensions → Load unpacked
位置: C:\Dev\Projects\SidePilot\extension
```

### 測試工具
- **API 測試**: curl / Postman / Playwright
- **擴展測試**: Chrome DevTools / Console
- **驗證**: 實時觀察 HTTP 狀態碼和響應體

---

## 🔬 測試用例

### 模組 1: 後端 API 驗證 (`/chat/completions`)

#### 測試 1.1: 有效請求 (成功)
**目標:** 驗證合法的 API 請求通過驗證

**步驟:**
```bash
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "model": "gpt-4",
    "messages": [
      {"role": "user", "content": "Hello, how are you?"}
    ]
  }'
```

**預期:**
- ✅ 狀態碼: 200 或 503 (服務不可用，但驗證通過)
- ✅ 無驗證錯誤

**測試結果:** `[ ] Pass  [ ] Fail`

---

#### 測試 1.2: 缺少 messages 欄位
**目標:** 驗證缺少必要欄位時返回 400

**步驟:**
```bash
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "model": "gpt-4"
  }'
```

**預期:**
- ✅ 狀態碼: **400**
- ✅ 錯誤信息包含: "messages"
- ✅ 響應體: `{"error": "Invalid request: 'messages' must be a non-empty array"}`

**測試結果:** `[ ] Pass  [ ] Fail`

---

#### 測試 1.3: 空的 messages 陣列
**目標:** 驗證空陣列被拒絕

**步驟:**
```bash
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "model": "gpt-4",
    "messages": []
  }'
```

**預期:**
- ✅ 狀態碼: **400**
- ✅ 錯誤信息包含: "non-empty"

**測試結果:** `[ ] Pass  [ ] Fail`

---

#### 測試 1.4: 缺少 model 欄位
**目標:** 驗證缺少模型時返回 400

**步驟:**
```bash
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "messages": [
      {"role": "user", "content": "test"}
    ]
  }'
```

**預期:**
- ✅ 狀態碼: **400**
- ✅ 錯誤信息包含: "model"

**測試結果:** `[ ] Pass  [ ] Fail`

---

#### 測試 1.5: 無效的 message role
**目標:** 驗證非法的角色被拒絕

**步驟:**
```bash
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "model": "gpt-4",
    "messages": [
      {"role": "admin", "content": "test"}
    ]
  }'
```

**預期:**
- ✅ 狀態碼: **400**
- ✅ 錯誤信息包含: "role"
- ✅ 提示允許的值: "user", "assistant", "system"

**測試結果:** `[ ] Pass  [ ] Fail`

---

#### 測試 1.6: 缺少 message content
**目標:** 驗證沒有內容的消息被拒絕

**步驟:**
```bash
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "model": "gpt-4",
    "messages": [
      {"role": "user"}
    ]
  }'
```

**預期:**
- ✅ 狀態碼: **400**
- ✅ 錯誤信息包含: "content"

**測試結果:** `[ ] Pass  [ ] Fail`

---

#### 測試 1.7: 多個有效的角色
**目標:** 驗證支持所有三個角色

**步驟:**
```bash
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "model": "gpt-4",
    "messages": [
      {"role": "system", "content": "You are helpful"},
      {"role": "user", "content": "Hello"},
      {"role": "assistant", "content": "Hi there"}
    ]
  }'
```

**預期:**
- ✅ 狀態碼: 200 或 503 (驗證通過，可能服務不可用)
- ✅ 無驗證錯誤

**測試結果:** `[ ] Pass  [ ] Fail`

---

### 模組 2: 認證處理

#### 測試 2.1: 缺少 Authorization 標頭
**目標:** 驗證無效的認證返回 401

**步驟:**
```bash
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4",
    "messages": [
      {"role": "user", "content": "test"}
    ]
  }'
```

**預期:**
- ✅ 狀態碼: **401**
- ✅ 錯誤信息包含: "Unauthorized" 或 "Token"

**測試結果:** `[ ] Pass  [ ] Fail`

---

#### 測試 2.2: 有效的 Bearer Token
**目標:** 驗證正確格式的 token 被接受

**步驟:**
```bash
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer my-valid-token-12345" \
  -d '{
    "model": "gpt-4",
    "messages": [
      {"role": "user", "content": "test"}
    ]
  }'
```

**預期:**
- ✅ 狀態碼: 503 或更高級別的錯誤 (驗證通過，可能是 Copilot 連接失敗)
- ✅ **不是** 401

**測試結果:** `[ ] Pass  [ ] Fail`

---

### 模組 3: 錯誤分類

#### 測試 3.1: 401 Unauthorized 錯誤
**目標:** 驗證無效 token 返回 401

**步驟:**
```bash
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid-token" \
  -d '{
    "model": "gpt-4",
    "messages": [
      {"role": "user", "content": "test"}
    ]
  }' -v
```

**預期:**
- ✅ 狀態碼: **401**
- ✅ 響應體包含: "Unauthorized" 和 "Token"

**測試結果:** `[ ] Pass  [ ] Fail`

---

#### 測試 3.2: 422 Unprocessable Entity (無效模型)
**目標:** 驗證無效模型返回 422

**步驟:**
```bash
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "model": "invalid-model-xyz",
    "messages": [
      {"role": "user", "content": "test"}
    ]
  }' -v
```

**預期:**
- ✅ 狀態碼: **422** 或 **503** (取決於 Copilot 服務響應)
- ✅ 錯誤信息清晰

**測試結果:** `[ ] Pass  [ ] Fail`

---

#### 測試 3.3: 429 Rate Limit (限流)
**目標:** 驗證快速連續請求的限流

**步驟:**
```bash
# 快速發送 10 個請求
for i in {1..10}; do
  curl -X POST http://localhost:3000/v1/chat/completions \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer test-token" \
    -d '{"model":"gpt-4","messages":[{"role":"user","content":"test"}]}' \
    -w "HTTP %{http_code}\n" &
done
wait
```

**預期:**
- ✅ 某些請求可能返回 **429**
- ✅ 響應包含 `retryAfter` 欄位

**測試結果:** `[ ] Pass  [ ] Fail`

---

#### 測試 3.4: 500 內部伺服器錯誤
**目標:** 驗證未捕獲的錯誤返回 500

**步驟:**
```bash
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "model": "gpt-4",
    "messages": "invalid"
  }' -v
```

**預期:**
- ✅ 狀態碼: **400** (驗證錯誤) 或 **500** (意外錯誤)
- ✅ 錯誤信息有用

**測試結果:** `[ ] Pass  [ ] Fail`

---

### 模組 4: 串流支持

#### 測試 4.1: 非串流請求
**目標:** 驗證 stream=false 返回完整響應

**步驟:**
```bash
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "model": "gpt-4",
    "stream": false,
    "messages": [
      {"role": "user", "content": "test"}
    ]
  }' -v
```

**預期:**
- ✅ 響應是單個 JSON 對象 (非串流)
- ✅ 包含 `choices` 陣列

**測試結果:** `[ ] Pass  [ ] Fail`

---

#### 測試 4.2: 串流請求
**目標:** 驗證 stream=true 返回 SSE 流

**步驟:**
```bash
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "model": "gpt-4",
    "stream": true,
    "messages": [
      {"role": "user", "content": "test"}
    ]
  }' -v
```

**預期:**
- ✅ Content-Type: text/event-stream
- ✅ 響應包含 `data:` 行 (SSE 格式)
- ✅ 最後一行: `[DONE]`

**測試結果:** `[ ] Pass  [ ] Fail`

---

## 🖼️ Chrome 擴展 UI 測試 (手動)

### 測試 5.1: 加載擴展
**步驟:**
1. Chrome → Extensions → Load unpacked
2. 選擇 `C:\Dev\Projects\SidePilot\extension`
3. 確認擴展已啟用

**預期:**
- ✅ 擴展加載無誤
- ✅ SidePilot 圖標出現在工具欄
- ✅ 無紅色錯誤指示

**結果:** `[ ] Pass  [ ] Fail`

---

### 測試 5.2: 打開 Side Panel
**步驟:**
1. 點擊 SidePilot 擴展圖標
2. 等待 Side Panel 開啟

**預期:**
- ✅ Side Panel 在右側打開
- ✅ UI 正確加載
- ✅ 不出現任何 JavaScript 錯誤

**結果:** `[ ] Pass  [ ] Fail`

---

### 測試 5.3: VS Code 發送按鈕
**步驟:**
1. 創建一個記憶條目
2. 點擊 "Send to VS Code" 按鈕
3. 檢查 console 日誌

**預期:**
- ✅ 按鈕點擊不會導致 JavaScript 錯誤
- ✅ 消息被正確路由
- ✅ VS Code 嘗試啟動 (如果已安裝)

**結果:** `[ ] Pass  [ ] Fail`

---

## 📊 測試結果總結

| 測試編號 | 名稱 | 預期 | 實際 | 備註 |
|---------|------|------|------|------|
| 1.1 | 有效請求 | ✅ Pass | [ ] | |
| 1.2 | 缺少 messages | ✅ 400 | [ ] | |
| 1.3 | 空 messages | ✅ 400 | [ ] | |
| 1.4 | 缺少 model | ✅ 400 | [ ] | |
| 1.5 | 無效 role | ✅ 400 | [ ] | |
| 1.6 | 缺少 content | ✅ 400 | [ ] | |
| 1.7 | 多角色 | ✅ Pass | [ ] | |
| 2.1 | 無 Token | ✅ 401 | [ ] | |
| 2.2 | 有效 Token | ✅ Pass | [ ] | |
| 3.1 | 401 錯誤 | ✅ 401 | [ ] | |
| 3.2 | 422 錯誤 | ✅ 422/503 | [ ] | |
| 3.3 | 429 限流 | ✅ 429 | [ ] | |
| 3.4 | 500 錯誤 | ✅ 500 | [ ] | |
| 4.1 | 非串流 | ✅ JSON | [ ] | |
| 4.2 | 串流 | ✅ SSE | [ ] | |
| 5.1 | 加載擴展 | ✅ Pass | [ ] | |
| 5.2 | 打開面板 | ✅ Pass | [ ] | |
| 5.3 | VS Code 按鈕 | ✅ Pass | [ ] | |

---

## 🐛 發現的問題

| 編號 | 問題 | 嚴重性 | 解決狀態 | 備註 |
|------|------|--------|---------|------|
| | | | | |

---

## 📝 測試執行日誌

### 日期: ___________

**執行者:** ___________

**備註:**

```
[粘貼測試執行的詳細日誌]
```

---

## ✅ 測試簽核

- [ ] 所有測試用例已執行
- [ ] 發現的所有問題已報告
- [ ] 修復已驗證

**簽署:** ________________  
**日期:** ________________

---

## 📚 參考資源

### 有用的命令

```bash
# 启动后端服务
cd scripts/github-copilot-proxy && npm run dev

# 發送 JSON 請求
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '@request.json'

# 查看詳細的 HTTP 響應頭
curl -X POST ... -v

# 測試多個請求
seq 1 5 | xargs -I {} curl ...

# 保存到文件
curl ... > response.json
```

### 擴展 DevTools
- F12 打開 DevTools
- `chrome://extensions` 查看已加載的擴展
- 查看 Background Script 日誌: Extensions 頁面 → SidePilot 詳情 → "錯誤"

---

*由 SidePilot 自動化測試系統生成*
