#!/usr/bin/env node

import fs from "node:fs"
import path from "node:path"
import process from "node:process"
import ts from "typescript"

const FRONTEND_ROOT = path.resolve(process.cwd())
const EN_PATH = path.join(FRONTEND_ROOT, "locales", "en.json")
const VI_PATH = path.join(FRONTEND_ROOT, "locales", "vi.json")

const SOURCE_DIRS = ["app", "components", "hooks", "lib"].map((segment) =>
  path.join(FRONTEND_ROOT, segment),
)
const EXCLUDED_DIRS = new Set([".next", "node_modules", "dist", "build", "__tests__", ".git"])
const EXCLUDED_APP_TEST_PREFIX = path.join("app", "test") + path.sep
const EXCLUDED_APP_API_PREFIX = path.join("app", "api") + path.sep
const ALIAS = {
  coi: "dashboard.coi",
}

function rel(filePath) {
  return path.relative(FRONTEND_ROOT, filePath)
}

function walk(dir, out) {
  if (!fs.existsSync(dir)) {
    return
  }
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry.name)) {
        continue
      }
      walk(fullPath, out)
      continue
    }
    out.push(fullPath)
  }
}

function listSourceFiles() {
  const files = []
  for (const sourceDir of SOURCE_DIRS) {
    walk(sourceDir, files)
  }
  return files.filter((filePath) => {
    const relative = rel(filePath)
    if (!/\.(ts|tsx|js|jsx)$/.test(filePath)) {
      return false
    }
    if (relative.startsWith(EXCLUDED_APP_TEST_PREFIX)) {
      return false
    }
    if (relative.startsWith(EXCLUDED_APP_API_PREFIX)) {
      return false
    }
    if (/[/\\]route\.(ts|tsx|js|jsx)$/.test(relative)) {
      return false
    }
    if (/[/\\]layout\.(ts|tsx|js|jsx)$/.test(relative)) {
      return false
    }
    return true
  })
}

function collectLeafPaths(value, prefix = "", out = new Map()) {
  if (Array.isArray(value)) {
    out.set(prefix, { type: "array", value })
    return out
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      const next = prefix ? `${prefix}.${key}` : key
      collectLeafPaths(child, next, out)
    }
    return out
  }
  out.set(prefix, { type: typeof value, value })
  return out
}

function setNestedValue(target, key, value) {
  const segments = key.split(".")
  let current = target
  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index]
    const isLast = index === segments.length - 1
    if (isLast) {
      current[segment] = value
      break
    }
    if (!current[segment] || typeof current[segment] !== "object" || Array.isArray(current[segment])) {
      current[segment] = {}
    }
    current = current[segment]
  }
}

function buildTemplatePattern(templateExpression, sourceFile) {
  if (ts.isNoSubstitutionTemplateLiteral(templateExpression)) {
    return templateExpression.text
  }
  if (!ts.isTemplateExpression(templateExpression)) {
    return null
  }
  let pattern = templateExpression.head.text
  for (const span of templateExpression.templateSpans) {
    pattern += `\${${span.expression.getText(sourceFile)}}${span.literal.text}`
  }
  return pattern
}

function expandDynamicPattern(pattern, filePath) {
  if (pattern === "auth.forgotPassword.steps.${step}.title") {
    return [
      "auth.forgotPassword.steps.email.title",
      "auth.forgotPassword.steps.verify.title",
      "auth.forgotPassword.steps.reset.title",
    ]
  }
  if (pattern === "auth.forgotPassword.steps.${step}.subtitle") {
    return [
      "auth.forgotPassword.steps.email.subtitle",
      "auth.forgotPassword.steps.verify.subtitle",
      "auth.forgotPassword.steps.reset.subtitle",
    ]
  }
  if (pattern === "auth.register.passwordHints.rules.${rule}") {
    return [
      "auth.register.passwordHints.rules.length",
      "auth.register.passwordHints.rules.lower",
      "auth.register.passwordHints.rules.upper",
      "auth.register.passwordHints.rules.number",
      "auth.register.passwordHints.rules.special",
    ]
  }
  if (
    pattern === "dashboard.roles.reviewer.papers.statusValues.${paper.assignment_status}" ||
    pattern === "dashboard.roles.reviewer.papers.statusValues.${assignmentStatus}"
  ) {
    return [
      "dashboard.roles.reviewer.papers.statusValues.not_started",
      "dashboard.roles.reviewer.papers.statusValues.in_progress",
      "dashboard.roles.reviewer.papers.statusValues.completed",
      "dashboard.roles.reviewer.papers.statusValues.pending",
      "dashboard.roles.reviewer.papers.statusValues.accepted",
      "dashboard.roles.reviewer.papers.statusValues.declined",
      "dashboard.roles.reviewer.papers.statusValues.submitted",
    ]
  }
  if (
    filePath.endsWith(path.join("components", "language-switcher.tsx")) &&
    (pattern === "${currentOption.labelKey}" || pattern === "${option.labelKey}")
  ) {
    return [
      "common.messages.languages.vietnamese",
      "common.messages.languages.english",
    ]
  }
  return []
}

function expandDynamicExpression(exprText, filePath) {
  const relative = rel(filePath)

  if (
    relative === path.join("components", "dashboard-sidebar.tsx") &&
    exprText === "item.labelKey"
  ) {
    return [
      "dashboard.sidebar.nav.author.conferences",
      "dashboard.sidebar.nav.author.mySubmissions",
      "dashboard.sidebar.nav.reviewer.dashboard",
      "dashboard.sidebar.nav.reviewer.conferences",
      "dashboard.sidebar.nav.reviewer.invitations",
      "dashboard.sidebar.nav.reviewer.completed",
      "dashboard.sidebar.nav.chair.dashboard",
      "dashboard.sidebar.nav.chair.conferences",
      "dashboard.sidebar.nav.chair.schedules",
      "dashboard.sidebar.nav.common.dashboard",
      "dashboard.sidebar.nav.common.notifications",
    ]
  }

  if (
    relative === path.join("components", "reviewer", "assigned-dashboard.tsx") &&
    exprText === "statusLabelKeys[status]"
  ) {
    return [
      "runtime.components.reviewer.assigned-dashboard.filters.all",
      "runtime.components.reviewer.assigned-dashboard.filters.notStarted",
      "runtime.components.reviewer.assigned-dashboard.filters.inProgress",
      "runtime.components.reviewer.assigned-dashboard.filters.completed",
    ]
  }

  if (
    relative === path.join("components", "reviewer", "assigned-dashboard.tsx") &&
    exprText.includes("assignmentStatusLabelKeys[paper.assignment_status]")
  ) {
    return [
      "dashboard.roles.reviewer.papers.statusValues.not_started",
      "dashboard.roles.reviewer.papers.statusValues.in_progress",
      "dashboard.roles.reviewer.papers.statusValues.completed",
      "dashboard.roles.reviewer.papers.statusValues.pending",
      "dashboard.roles.reviewer.papers.statusValues.accepted",
      "dashboard.roles.reviewer.papers.statusValues.declined",
      "dashboard.roles.reviewer.papers.statusValues.submitted",
    ]
  }

  return []
}

function expandAliasCandidates(key) {
  const [first, ...rest] = key.split(".")
  const alias = ALIAS[first]
  if (!alias) {
    return [key]
  }
  const suffix = rest.length > 0 ? `.${rest.join(".")}` : ""
  return [key, `${alias}${suffix}`]
}

function collectUsage(files) {
  const tKeys = new Set()
  const tListKeys = new Set()

  for (const filePath of files) {
    const sourceText = fs.readFileSync(filePath, "utf8")
    const scriptKind = filePath.endsWith(".tsx")
      ? ts.ScriptKind.TSX
      : filePath.endsWith(".jsx")
        ? ts.ScriptKind.JSX
        : ts.ScriptKind.TS
    const sourceFile = ts.createSourceFile(
      filePath,
      sourceText,
      ts.ScriptTarget.Latest,
      true,
      scriptKind,
    )

    function visit(node) {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
        const fn = node.expression.text
        if (fn === "t" || fn === "tList") {
          const firstArg = node.arguments[0]
          const target = fn === "t" ? tKeys : tListKeys
          if (!firstArg) {
            ts.forEachChild(node, visit)
            return
          }
          if (ts.isStringLiteral(firstArg) || ts.isNoSubstitutionTemplateLiteral(firstArg)) {
            target.add(firstArg.text)
            ts.forEachChild(node, visit)
            return
          }
          if (ts.isTemplateExpression(firstArg)) {
            const pattern = buildTemplatePattern(firstArg, sourceFile)
            const expanded = expandDynamicPattern(pattern, filePath)
            expanded.forEach((key) => target.add(key))
            ts.forEachChild(node, visit)
            return
          }
          const exprText = firstArg.getText(sourceFile)
          if (
            rel(filePath) === path.join("components", "language-switcher.tsx") &&
            (exprText === "currentOption.labelKey" || exprText === "option.labelKey")
          ) {
            target.add("common.messages.languages.vietnamese")
            target.add("common.messages.languages.english")
          } else {
            const expandedByExpression = expandDynamicExpression(exprText, filePath)
            expandedByExpression.forEach((key) => target.add(key))
          }
        }
      }
      ts.forEachChild(node, visit)
    }

    visit(sourceFile)
  }

  return { tKeys, tListKeys }
}

function extractPlaceholders(input) {
  if (typeof input !== "string") {
    return []
  }
  const set = new Set()
  const patterns = [/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, /\{\s*([a-zA-Z0-9_]+)\s*\}/g]
  for (const pattern of patterns) {
    let match = pattern.exec(input)
    while (match) {
      set.add(match[1])
      match = pattern.exec(input)
    }
  }
  return [...set].sort()
}

function collectStringMap(enJson, viJson) {
  const map = new Map()
  function walkPair(enValue, viValue) {
    if (typeof enValue === "string" && typeof viValue === "string") {
      if (!map.has(enValue)) {
        map.set(enValue, viValue)
      }
      return
    }
    if (Array.isArray(enValue) || Array.isArray(viValue)) {
      return
    }
    if (enValue && viValue && typeof enValue === "object" && typeof viValue === "object") {
      for (const [key, child] of Object.entries(enValue)) {
        if (Object.prototype.hasOwnProperty.call(viValue, key)) {
          walkPair(child, viValue[key])
        }
      }
    }
  }
  walkPair(enJson, viJson)
  return map
}

function viFallback(enValue, existingMap) {
  if (existingMap.has(enValue)) {
    return existingMap.get(enValue)
  }
  return enValue
}

function syncLocales() {
  const enJson = JSON.parse(fs.readFileSync(EN_PATH, "utf8"))
  const viJson = JSON.parse(fs.readFileSync(VI_PATH, "utf8"))
  const enLeaves = collectLeafPaths(enJson)
  const viLeaves = collectLeafPaths(viJson)
  const existingMap = collectStringMap(enJson, viJson)

  const files = listSourceFiles()
  const usage = collectUsage(files)

  const seedKeys = {
    "dashboard.sidebar.nav.author.conferences": { en: "Conferences", vi: "Hội nghị" },
    "dashboard.sidebar.nav.author.mySubmissions": { en: "My Submissions", vi: "Bài nộp của tôi" },
    "dashboard.sidebar.nav.reviewer.dashboard": { en: "Dashboard", vi: "Bảng điều khiển" },
    "dashboard.sidebar.nav.reviewer.conferences": { en: "Conferences", vi: "Hội nghị" },
    "dashboard.sidebar.nav.reviewer.invitations": { en: "Invitations", vi: "Lời mời" },
    "dashboard.sidebar.nav.reviewer.completed": { en: "Completed", vi: "Đã hoàn thành" },
    "dashboard.sidebar.nav.chair.dashboard": { en: "Dashboard", vi: "Bảng điều khiển" },
    "dashboard.sidebar.nav.chair.conferences": { en: "Conferences", vi: "Hội nghị" },
    "dashboard.sidebar.nav.chair.schedules": { en: "Schedules", vi: "Lịch trình" },
    "dashboard.sidebar.nav.common.dashboard": { en: "Dashboard", vi: "Bảng điều khiển" },
    "dashboard.sidebar.nav.common.notifications": { en: "Notifications", vi: "Thông báo" },
    "runtime.components.reviewer.assigned-dashboard.filters.all": { en: "All", vi: "Tất cả" },
    "runtime.components.reviewer.assigned-dashboard.filters.notStarted": {
      en: "Pending",
      vi: "Đang chờ",
    },
    "runtime.components.reviewer.assigned-dashboard.filters.inProgress": {
      en: "Draft",
      vi: "Bản nháp",
    },
    "runtime.components.reviewer.assigned-dashboard.filters.completed": {
      en: "Done",
      vi: "Hoàn tất",
    },
  }

  for (const [key, value] of Object.entries(seedKeys)) {
    setNestedValue(enJson, key, value.en)
    setNestedValue(viJson, key, value.vi)
    enLeaves.set(key, { type: "string", value: value.en })
    viLeaves.set(key, { type: "string", value: value.vi })
  }

  const tUsageResolved = new Set()
  const tListUsageResolved = new Set()

  for (const key of usage.tKeys) {
    const candidates = expandAliasCandidates(key)
    const resolved = candidates.find((candidate) => enLeaves.has(candidate))
    tUsageResolved.add(resolved || key)
  }

  for (const key of usage.tListKeys) {
    const candidates = expandAliasCandidates(key)
    const resolved = candidates.find((candidate) => enLeaves.has(candidate))
    tListUsageResolved.add(resolved || key)
  }

  const nextEn = {}
  const nextVi = {}

  for (const key of [...tUsageResolved].sort()) {
    const enEntry = enLeaves.get(key)
    const viEntry = viLeaves.get(key)
    const enValue =
      enEntry && enEntry.type === "string" ? enEntry.value : key
    const viValue =
      viEntry && viEntry.type === "string" ? viEntry.value : viFallback(enValue, existingMap)

    const enPlaceholders = extractPlaceholders(enValue)
    const viPlaceholders = extractPlaceholders(viValue)
    const safeViValue =
      enPlaceholders.join(",") === viPlaceholders.join(",") ? viValue : enValue

    setNestedValue(nextEn, key, enValue)
    setNestedValue(nextVi, key, safeViValue)
  }

  for (const key of [...tListUsageResolved].sort()) {
    const enEntry = enLeaves.get(key)
    const viEntry = viLeaves.get(key)
    const enValue = enEntry && enEntry.type === "array" ? enEntry.value : []
    const viValue = viEntry && viEntry.type === "array" ? viEntry.value : enValue

    setNestedValue(nextEn, key, enValue)
    setNestedValue(nextVi, key, viValue)
  }

  fs.writeFileSync(EN_PATH, `${JSON.stringify(nextEn, null, 2)}\n`)
  fs.writeFileSync(VI_PATH, `${JSON.stringify(nextVi, null, 2)}\n`)

  console.log(
    JSON.stringify(
      {
        tKeys: tUsageResolved.size,
        tListKeys: tListUsageResolved.size,
        totalKeys: tUsageResolved.size + tListUsageResolved.size,
      },
      null,
      2,
    ),
  )
}

syncLocales()
