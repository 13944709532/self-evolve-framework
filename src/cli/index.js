import { init } from "./commands/init.js"
import { listSkills } from "./commands/list.js"
import { authCommand } from "./commands/auth.js"
import { showHelp } from "./utils.js"

const COMMANDS = {
  init: {
    desc: "一键安装全部 CodeBuddy skill + 规则到当前项目",
    run: (args) => init(args),
  },
  sync: {
    desc: "从框架项目同步最新的 skill + 规则到当前项目",
    run: (args) => init(args, true),
  },
  list: {
    desc: "列出包含的 skill 和规则",
    run: () => listSkills(),
  },
  auth: {
    desc: "GitHub 设备认证（自动获取 Issues 权限 token）",
    run: (args) => authCommand(args),
  },
  help: {
    desc: "显示帮助信息",
    run: () => showHelp(),
  },
}

export function run() {
  const first = process.argv[2]
  let cmd = first
  let argvStart = 3

  // 无参数 / 以 -- 开头 / 不是已知命令 → 默认 init
  if (!first || first.startsWith("--") || !COMMANDS[first]) {
    cmd = "init"
    argvStart = first && first.startsWith("--") ? 2 : 3
  }

  const fn = COMMANDS[cmd]
  const args = parseArgs(process.argv.slice(argvStart))
  const result = fn.run(args)
  Promise.resolve(result).catch((err) => {
    console.error("❌ 错误:", err.message)
    process.exit(1)
  })
}

function parseArgs(argv) {
  const args = {}
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg.startsWith("--")) {
      const next = argv[i + 1]
      if (next && !next.startsWith("--")) {
        args[arg] = next
        i++
      } else {
        args[arg] = true
      }
    }
  }
  return args
}
