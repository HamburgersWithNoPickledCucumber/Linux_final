# Linux 系統資訊擷取與即時監控儀表板

## Linux System Information Collection and Real-Time Monitoring Dashboard

**作者：** Kellen<br>
**單位：** （請填寫學校、系所與班級）<br>
**電子郵件：** kellen931214@gmail.com

---

**【摘要】** 本專題的核心是一支 Bash 系統資訊擷取腳本 `linux_json_api.sh`。腳本直接讀取 Linux 核心提供的 `/proc`、`/sys` 虛擬檔案系統，並搭配 `ps`、`df`、`lscpu`、`sensors`、`systemctl` 等系統指令，取得 CPU 使用率與溫度、記憶體、磁碟、網路及程序資訊，再以 `awk`、`sed`、`grep` 將文字轉換為 JSON。Node.js 後端依前端指定的模組名稱執行對應 Bash 函式，最後透過 WebSocket 或 HTTP 將資料交給 React 儀表板顯示。本專題不需要資料庫或額外監控代理程式，重點在於理解 Linux 如何公開系統狀態，以及如何將底層數值轉換成可供網頁使用的監控資料。

**【關鍵詞】** Linux、Bash、系統資訊擷取、Procfs、即時監控

## 1. 專題核心

主要程式位於：

```text
app/server/linux_json_api.sh
```

這支腳本不是持續在背景執行的監控代理程式，而是採用「呼叫一個模組、擷取一次資料」的方式運作。例如：

```bash
./app/server/linux_json_api.sh cpu_utilization
./app/server/linux_json_api.sh current_ram
./app/server/linux_json_api.sh disk_partitions
```

每個參數對應腳本中的同名 Bash 函式。函式完成資料讀取與運算後，只輸出 JSON；前端定期重複呼叫，便形成即時監控效果。

> [!IMPORTANT]
> 目前專案尚未實作 GPU 資訊擷取。程式中沒有 `gpu` 模組，也沒有呼叫 `nvidia-smi`、`rocm-smi` 或其他顯示卡工具。README 後面的 GPU 章節說明可採用的擴充方式，不代表目前已提供 GPU 監控。

## 2. 資料擷取流程

```mermaid
flowchart LR
    A[React 監控卡片] -->|模組名稱| B[WebSocket 或 HTTP]
    B --> C[Node.js Server]
    C -->|spawn 腳本與參數| D[linux_json_api.sh]
    D --> E{同名 Bash 函式}
    E --> F[/proc 核心資料]
    E --> G[/sys 裝置資料]
    E --> H[Linux 系統指令]
    F --> I[awk / sed / grep]
    G --> I
    H --> I
    I -->|JSON| C
    C --> A
```

完整流程如下：

1. 前端卡片從 `src/dashboardConfig.js` 取得模組名稱，例如 `cpu_utilization`。
2. `dashboardClient` 透過 WebSocket 傳送模組名稱；連線不可用時改用 HTTP。
3. `app/server/index.js` 使用 `child_process.spawn()` 執行腳本：

   ```js
   spawn('linux_json_api.sh', ['cpu_utilization', ''])
   ```

4. 腳本檢查參數是否為已定義的 Bash 函式，再執行同名函式。
5. 函式從 `/proc`、`/sys` 或系統指令取得原始資料。
6. `awk` 負責欄位選取、數值運算及 JSON 組合，`sed`、`grep` 與 `tr` 負責過濾及清理文字。
7. Node.js 將腳本的標準輸出傳回瀏覽器。
8. React 將 JSON 顯示為數值卡、折線圖或表格。

## 3. CPU 資訊如何擷取

### 3.1. CPU 使用率：`cpu_utilization`

CPU 使用率來自：

```text
/proc/stat
```

檔案第一行包含 CPU 從開機至今累積的時間計數：

```text
cpu  user nice system idle iowait irq softirq steal guest guest_nice
```

腳本使用以下指令只取出總 CPU 的數值，不處理各核心的 `cpu0`、`cpu1`：

```bash
sed -n 's/^cpu\s//p' /proc/stat
```

因為 `/proc/stat` 提供的是累積值，單次讀取無法直接得到當下使用率。腳本採樣 2 次，中間等待 1 秒，再比較兩次差值：

```text
總時間差 = 第 2 次總時間 - 第 1 次總時間
閒置差值 = 第 2 次 idle - 第 1 次 idle
CPU 使用率 = (總時間差 - 閒置差值) / 總時間差 × 100%
```

對應的 Bash 整數運算為：

```bash
DIFF_USAGE=(1000*(DIFF_TOTAL-DIFF_IDLE)/DIFF_TOTAL+5)/10
```

乘以 1000 並在最後除以 10，是為了在 Bash 整數運算中完成百分比計算與四捨五入。函式最後輸出單一數字：

```json
25
```

目前計算只將 `idle` 欄位視為閒置時間，沒有把 `iowait` 一併算入；因此它代表本專案採用的 CPU 忙碌度定義。

### 3.2. CPU 平均負載：`load_avg`

負載資料來自：

```text
/proc/loadavg
```

前三個值分別代表最近 1、5、15 分鐘內，處於可執行或不可中斷等待狀態的平均工作數。腳本另外從 `/proc/cpuinfo` 計算處理器數量：

```bash
grep -c 'processor' /proc/cpuinfo
```

接著將負載除以核心數並乘以 100：

```text
正規化負載 = load average ÷ CPU 邏輯核心數 × 100
```

輸出範例：

```json
{
  "1_min_avg": 12.5,
  "5_min_avg": 9.375,
  "15_min_avg": 6.25
}
```

此數值是依核心數正規化的 load average，不等同於 `/proc/stat` 算出的 CPU 使用率。

### 3.3. CPU 型號與硬體資訊：`cpu_info`

腳本執行：

```bash
lscpu
```

`lscpu` 會整合 `/proc/cpuinfo` 與系統架構資訊。腳本以冒號分隔每一行，再轉換成 JSON 鍵值，例如：

```json
{
  "Architecture": " x86_64",
  "CPU(s)": " 8",
  "Model name": " Intel(R) Core(TM) ..."
}
```

### 3.4. CPU 溫度：`cpu_temp`

腳本先讀取 `/etc/os-release` 判斷發行版。

Raspberry Pi OS 使用：

```text
/sys/class/thermal/thermal_zone0/temp
```

核心提供的值通常以千分之一攝氏度表示，因此腳本除以 1000：

```text
42000 ÷ 1000 = 42°C
```

其他 Linux 系統則呼叫 `lm-sensors` 套件提供的：

```bash
sensors
```

腳本辨識 AMD `k10` 或 Intel `coretemp` 區段，再用 `cut` 擷取溫度。若系統未安裝 `sensors`，回傳空陣列：

```json
[]
```

這段解析依賴 `sensors` 的輸出格式，因此不同硬體或語系可能需要調整欄位規則。

### 3.5. CPU 高用量程序：`cpu_intensive_processes`

腳本透過 `ps` 取得程序資料：

```bash
ps axo pid,user,pcpu,rss,vsz,comm --sort -pcpu,-rss,-vsz
```

欄位意義：

| 欄位 | 意義 |
| --- | --- |
| `pid` | 程序識別碼 |
| `user` | 程序擁有者 |
| `pcpu` | CPU 使用百分比 |
| `rss` | 實際占用的實體記憶體，單位通常為 KiB |
| `vsz` | 虛擬記憶體大小，單位通常為 KiB |
| `comm` | 執行檔名稱 |

結果依 CPU、RSS、VSZ 由高至低排序，並用 `head -n 15` 限制輸出數量。

## 4. 記憶體資訊如何擷取

### 4.1. 即時 RAM 用量：`current_ram`

記憶體資料來自：

```text
/proc/meminfo
```

腳本取出 `MemTotal`、`MemFree`、`Buffers` 與 `Cached`，並採用以下公式：

```text
可用記憶體 = MemFree + Buffers + Cached
已用記憶體 = MemTotal - 可用記憶體
```

`/proc/meminfo` 原始單位是 KiB，腳本除以 1024 後以 MiB 輸出：

```json
{
  "total": 15936,
  "used": 8240,
  "available": 7696
}
```

這是本腳本採用的傳統估算方式，沒有直接使用較新核心提供的 `MemAvailable` 欄位，因此結果可能與 `free` 指令略有差異。

### 4.2. 完整記憶體資訊：`memory_info`

此模組讀取完整的 `/proc/meminfo`，把每一行冒號左側設為 JSON 欄名，右側保留為值。它不進行用量計算，主要用於顯示核心提供的完整記憶體統計。

### 4.3. RAM 高用量程序：`ram_intensive_processes`

```bash
ps axo pid,user,pmem,rss,vsz,comm --sort -pmem,-rss,-vsz
```

其原理與 CPU 程序模組相同，但排序優先使用 `pmem`，因此最耗記憶體的程序會排在前面。

### 4.4. Swap：`swap`

Swap 資料直接來自：

```text
/proc/swaps
```

腳本略過標題列，輸出交換空間的檔名、類型、容量、已使用量與優先權。若沒有設定 Swap，輸出空陣列。

## 5. 磁碟資訊如何擷取

### 5.1. 磁碟分割區：`disk_partitions`

腳本執行：

```bash
df -Ph
```

`-P` 使用可預測的 POSIX 單行格式，`-h` 將容量轉成人類可讀單位。腳本略過標題後，把每個掛載點轉為 JSON：

```json
[
  {
    "file_system": "/dev/sda2",
    "size": "100G",
    "used": "45G",
    "avail": "55G",
    "used%": "45%",
    "mounted": "/"
  }
]
```

### 5.2. 磁碟 I/O：`io_stats`

原始資料來自：

```text
/proc/diskstats
```

腳本使用的主要欄位為：

| `/proc/diskstats` 欄位 | 腳本輸出 | 意義 |
| --- | --- | --- |
| 第 3 欄 | `device` | 裝置名稱 |
| 第 4 欄 | `reads` | 已完成讀取次數 |
| 第 8 欄 | `writes` | 已完成寫入次數 |
| 第 12 欄 | `in_prog.` | 目前進行中的 I/O 數量 |
| 第 13 欄 | `time` | 執行 I/O 所花費的毫秒數 |

腳本會排除上述統計全部為 0 的裝置，減少無效資料。

## 6. 網路資訊如何擷取

### 6.1. 即時上傳與下載速率

每個網路介面的累積位元組數位於：

```text
/sys/class/net/<介面>/statistics/rx_bytes
/sys/class/net/<介面>/statistics/tx_bytes
```

`download_transfer_rate` 讀取 `rx_bytes`，`upload_transfer_rate` 讀取 `tx_bytes`。兩個函式皆採樣 2 次並等待 1 秒：

```text
每秒傳輸量 = 第 2 次累積位元組 - 第 1 次累積位元組
KB/s = 每秒傳輸量 ÷ 1024
```

輸出會包含每個介面：

```json
{
  "eth0": 128,
  "lo": 0
}
```

### 6.2. 累積介面流量：`bandwidth`

此模組讀取 `/proc/net/dev`，提供各介面從開機至今的累積接收與傳送位元組數。

目前腳本將第 2 欄輸出為 `tx`、第 10 欄輸出為 `rx`；依 Linux `/proc/net/dev` 的欄位定義，第 2 欄實際是接收位元組，第 10 欄才是傳送位元組。因此目前 `bandwidth` 回傳的 `tx` 與 `rx` 名稱相反，使用資料時必須注意。即時速率模組讀取的是正確的 `rx_bytes` 與 `tx_bytes` 路徑，不受此問題影響。

### 6.3. IP 與連線資訊

- `ip_addresses`：使用 `ifconfig` 取得各介面 IP，並以 `dig` 向 OpenDNS 查詢外部 IP。
- `network_connections`：使用 `netstat -ntu` 取得 TCP/UDP 遠端位址，再以 `sort`、`uniq -c` 統計連線數。
- `arp_cache`：使用 `arp` 取得區域網路內 IP 與 MAC 位址對照。
- `ping`：讀取 `app/server/config/ping_hosts`，對每個目標執行 2 次 Ping 並擷取平均延遲。

## 7. 其他系統資訊來源

| 模組 | 資料來源 | 擷取內容 |
| --- | --- | --- |
| `general_info` | `lsb_release`、`uname`、`hostname`、`/proc/uptime` | 作業系統、Kernel、主機名稱、運作時間 |
| `docker_processes` | `docker ps`、`docker top` | 容器中的高用量程序 |
| `user_accounts` | `/etc/passwd`、`getent passwd` | 系統與一般使用者帳號 |
| `logged_in_users` | `w` | 目前登入使用者 |
| `recent_account_logins` | `lastlog` | 最近 365 天登入紀錄 |
| `scheduled_crons` | `/etc/crontab`、`/etc/cron.d`、`crontab` | 系統與使用者排程 |
| `cron_history` | `/var/log/syslog` | 最近 Cron 執行紀錄 |
| `systemd_failed` | `systemctl` | 失敗的 systemd units |
| `firewall_overview` | `iptables` | Chain、規則數與預設政策 |
| `ssl_certificates` | 憑證目錄、`openssl x509` | 憑證主體、簽發者與到期日 |
| `pending_updates` | `yum check-update` | 可更新套件數量 |
| `common_applications` | `whereis` | 常用程式是否存在及其路徑 |
| `memcached` | `nc` 連接 11211 埠 | Memcached 統計 |
| `redis` | `redis-cli INFO` | Redis 版本、記憶體及連線統計 |
| `pm2_stats` | `pm2 list` | PM2 管理的程序狀態 |

部分模組依賴特定發行版。例如 `pending_updates` 目前只使用 `yum`，在 Ubuntu/Debian 上不會自動改用 `apt`。Cron 日誌也固定讀取 `/var/log/syslog`，使用 journald 或其他日誌路徑時需修改腳本。

## 8. 文字如何轉換成 JSON

Linux 虛擬檔案與系統指令大多輸出純文字，因此每個模組主要使用以下工具進行轉換：

- `grep`：只保留需要的行，例如從 `/proc/meminfo` 取出指定欄位。
- `awk`：切割欄位、計算數值並組合 JSON 的鍵與值。
- `sed`：移除陣列最後一筆多餘的逗號，或選取特定行。
- `tr`：移除換行或轉換字元。
- `_parseAndPrint`：統一移除反斜線與換行，使結果成為單行輸出。

例如 `disk_partitions` 的主要處理方式是：

```bash
df -Ph |
awk 'NR>1 {
  print "{\"file_system\": \"" $1 "\", " \
        "\"size\": \"" $2 "\", " \
        "\"used\": \"" $3 "\", " \
        "\"avail\": \"" $4 "\", " \
        "\"used%\": \"" $5 "\", " \
        "\"mounted\": \"" $6 "\"},"
}'
```

這種方式不需要額外 JSON 套件，但若原始文字包含引號、反斜線或特殊字元，就必須正確跳脫。後續可考慮改用 `jq` 組合 JSON，以降低格式錯誤風險。

## 9. GPU 資訊擷取現況與擴充方向

目前專案沒有 GPU 監控。若要加入，必須先依硬體平台選擇資料來源：

| GPU 平台 | 建議資料來源 | 可取得資訊 |
| --- | --- | --- |
| NVIDIA | `nvidia-smi --query-gpu=... --format=csv,noheader,nounits` | 型號、使用率、顯示記憶體、溫度、功耗 |
| AMD | `rocm-smi --showuse --showmemuse --showtemp` | 使用率、記憶體、溫度、功耗 |
| Intel | `intel_gpu_top` 或對應 sysfs/debugfs | 引擎使用率、頻率、功耗 |

以 NVIDIA 為例，預期的原始查詢方式可為：

```bash
nvidia-smi \
  --query-gpu=index,name,utilization.gpu,memory.used,memory.total,temperature.gpu,power.draw \
  --format=csv,noheader,nounits
```

要正式整合至專案，仍需完成以下工作：

1. 在 `linux_json_api.sh` 新增 `gpu_info()` 函式並將 CSV 安全轉成 JSON。
2. 處理沒有 GPU、驅動未安裝、多張 GPU 與不同廠牌的情況。
3. 在 `src/dashboardConfig.js` 新增 GPU 卡片設定。
4. 執行 `npm run build` 並測試輸出。

## 10. 執行與驗證

### 10.1. 環境需求

- Linux 作業系統。
- Node.js `^20.19.0` 或 `>=22.12.0`。
- Bash、`awk`、`sed`、`grep`、`ps` 等基本工具。
- CPU 溫度需要 `lm-sensors`；其他模組可能需要 `net-tools`、`dnsutils`、Docker、OpenSSL、iptables 等工具。

### 10.2. 直接測試腳本

先直接執行模組，確認底層擷取正常：

```bash
./app/server/linux_json_api.sh cpu_utilization
./app/server/linux_json_api.sh cpu_temp
./app/server/linux_json_api.sh load_avg
./app/server/linux_json_api.sh current_ram
./app/server/linux_json_api.sh disk_partitions
./app/server/linux_json_api.sh download_transfer_rate
```

可使用 `jq` 驗證輸出是否為合法 JSON：

```bash
./app/server/linux_json_api.sh current_ram | jq .
```

若直接執行腳本失敗，問題通常位於系統工具、檔案權限或硬體支援；若腳本成功但網頁沒有資料，再檢查 Node.js API 與瀏覽器連線。

### 10.3. 啟動完整系統

```bash
npm ci
LINUX_DASH_SERVER_PORT=2800 npm start
```

完成後開啟 <http://localhost:2800>。若不設定連接埠，後端預設使用 80 埠，通常需要系統管理員權限。

開發模式需分別啟動後端與 Vite：

```bash
# 終端機 1
LINUX_DASH_SERVER_PORT=2800 npm run serve

# 終端機 2
npm run dev
```

## 11. 權限、安全性與限制

- `/proc` 與 `/sys` 多數檔案可由一般使用者讀取，但防火牆、其他使用者的 Cron、系統日誌與部分硬體感測器可能需要額外權限。
- 應以最小權限執行服務，不建議只為取得更多資料而直接以 root 啟動整個網頁服務。
- 儀表板會揭露程序、帳號、網路與服務資訊，不應直接暴露於公網。
- 後端目前沒有登入驗證、授權、速率限制與長期資料儲存。
- 腳本依賴不同指令的文字格式，發行版、工具版本、語系或硬體不同都可能影響解析結果。
- CPU 與網路速率需要等待約 1 秒完成兩次採樣；同時大量請求會建立多個腳本程序並增加負載。

## 12. 結論

本專題的主要技術價值不是單純製作儀表板，而是將 Linux 核心與系統工具提供的底層文字資料轉換成一致的 JSON API。CPU 使用率透過 `/proc/stat` 的時間差計算，記憶體來自 `/proc/meminfo`，磁碟與網路則分別整合 `/proc/diskstats`、`/proc/net/dev`、sysfs 與相關系統指令。前端只負責定期請求及視覺化，因此新的監控能力可以從新增 Bash 模組開始逐步擴充。GPU 目前尚未實作，是後續最直接的功能擴充方向。

## 參考文獻

1. The Linux Kernel Organization.（無日期）。*The /proc Filesystem*。<https://docs.kernel.org/filesystems/proc.html>
2. The Linux Kernel Organization.（無日期）。*ABI testing symbols under /sys/class/net*。<https://docs.kernel.org/ABI/testing/sysfs-class-net.html>
3. Michael Kerrisk.（無日期）。*proc_stat(5) — Linux manual page*。<https://man7.org/linux/man-pages/man5/proc_stat.5.html>
4. Michael Kerrisk.（無日期）。*proc_meminfo(5) — Linux manual page*。<https://man7.org/linux/man-pages/man5/proc_meminfo.5.html>
5. NVIDIA Corporation.（無日期）。*NVIDIA System Management Interface*。<https://developer.nvidia.com/system-management-interface>

## 授權

本專案採用 [MIT License](LICENSE.md)。前後端架構與新增卡片方式請參閱 [DOCS.md](DOCS.md)。
