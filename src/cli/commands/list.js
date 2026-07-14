import { readFileSync, existsSync, readdirSync, statSync } from "fs"
import { join, resolve } from "path"
import { fileURLToPath } from "url"
import { copyRulesFlat } from "../utils.js"

const __dirname = fileURLToPath(new URL(".", import.meta.url))
const PKG_ROOT = resolve(__dirname, "../../..")

export function listSkills() {
  const skillsDir = resolve(PKG_ROOT, "skills")

  console.log("\n📦 包含的规则：")
  const rulesSrc = resolve(PKG_ROOT, "rules")
  const allRules = copyRulesFlat(rulesSrc, "", true)
  console.log(`  共 ${allRules.length} 个规则（含 ${resolve(PKG_ROOT, "rules", "knowledge")} 目录下的经验知识库）`)
  for (const f of allRules.sort()) console.log(`    - ${f}`)

  console.log("\n🧠 包含的技能：")
  if (existsSync(skillsDir)) {
    for (const d of readdirSync(skillsDir).filter(f => statSync(join(skillsDir, f)).isDirectory()).sort()) {
      const skillMd = join(skillsDir, d, "SKILL.md")
      let desc = ""
      if (existsSync(skillMd)) {
        const firstLine = readFileSync(skillMd, "utf-8").split("\n").find(l => l.startsWith("description:"))
        if (firstLine) desc = firstLine.replace("description: ", "").trim()
      }
      console.log(`  ${d}/  ${desc ? "— " + desc : ""}`)
    }
  }
}
