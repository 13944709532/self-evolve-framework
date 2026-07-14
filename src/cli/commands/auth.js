import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs"
import { join } from "path"
import { homedir } from "os"

// GitHub OAuth App client_id（公开客户端，device flow 不需要 client_secret）
const CLIENT_ID = "Ov23li4mWXoEOhYy9SX6"

const TOKEN_PATH = join(homedir(), ".self-evolve-token")
const GITHUB_DEVICE_URL = "https://github.com/login/device/code"
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"

/** 读取已保存的 token */
export function loadToken() {
  try { return readFileSync(TOKEN_PATH, "utf-8").trim() } catch { return "" }
}

/** 保存 token */
function _saveToken(token) {
  mkdirSync(homedir(), { recursive: true })
  writeFileSync(TOKEN_PATH, token, "utf-8", 0o600)
}

/** 获取有效 token — 优先环境变量，其次本地文件 */
export function getToken() {
  return process.env["GITHUB_TOKEN"] || process.env["SELF_EVOLVE_TOKEN"] || loadToken()
}

/**
 * GitHub Device Flow 认证
 * https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps#device-flow
 */
export async function authCommand(args) {
  const clientId = args["--client-id"] || process.env["SELF_EVOLVE_CLIENT_ID"] || CLIENT_ID

  if (clientId === "Ov23li...") {
    console.log("⚠️  请先设置 OAuth App client_id：")
    console.log("   set SELF_EVOLVE_CLIENT_ID=你的client_id")
    console.log("   self-evolve auth")
    console.log("\n   或在 GitHub Settings → Developer settings → OAuth Apps 找到你的应用")
    return
  }

  // Step 1: 请求设备验证码
  console.log("🔑 正在请求设备验证码...")
  const deviceRes = await fetch(GITHUB_DEVICE_URL, {
    method: "POST",
    headers: { "Accept": "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: clientId, scope: "public_repo" }),
  })
  const device = await deviceRes.json()

  if (device.error) {
    console.log(`❌ 失败: ${device.error_description || device.error}`)
    return
  }

  // Step 2: 自动打开浏览器（验证码预填到 URL）
  const authURL = `${device.verification_uri}?user_code=${device.user_code}`
  const os = process.platform
  const openCmd = os === "win32" ? "start" : os === "darwin" ? "open" : "xdg-open"
  const { execSync } = await import("child_process")
  try {
    execSync(`${openCmd} "${authURL}"`, { timeout: 3000, stdio: "ignore" })
    console.log("🌐 浏览器已自动打开 — 点击 授权 即可")
  } catch {
    console.log(`🌐 请打开: ${authURL}`)
  }
  console.log("⏳  等待授权...\n")

  // Step 3: 轮询 token（按 GitHub 要求的 interval）
  const interval = (device.interval || 5) * 1000
  const deadline = Date.now() + device.expires_in * 1000

  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, interval))

    const tokenRes = await fetch(GITHUB_TOKEN_URL, {
      method: "POST",
      headers: { "Accept": "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        device_code: device.device_code,
        grant_type: "urn:ietf:params:oauth:grant-type:device_code",
      }),
    })
    const tokenData = await tokenRes.json()

    if (tokenData.error === "authorization_pending") {
      continue  // 用户还没确认
    }
    if (tokenData.error === "slow_down") {
      await new Promise(r => setTimeout(r, 5000))  // GitHub 要求慢下来
      continue
    }
    if (tokenData.error) {
      console.log(`❌ 失败: ${tokenData.error_description || tokenData.error}`)
      return
    }

    // Step 4: 成功 — 保存 token
    _saveToken(tokenData.access_token)
    console.log("✅ 认证成功！token 已保存到 ~/.self-evolve-token")
    console.log(`   权限: ${tokenData.scope}`)
    return
  }

  console.log("⏰ 验证码已过期，请重新运行 self-evolve auth")
}
