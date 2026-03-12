import React, { useEffect } from 'react'
import { Box, Text, useApp } from 'ink'
import type { SkillEntry, McpEntry, HookEntry, PluginEntry } from '../detectors/index.js'

type CheckItem<T> = T & {
  installed: boolean
}

type Props = {
  projectDir: string
  skills: CheckItem<SkillEntry>[]
  mcps: CheckItem<McpEntry>[]
  hooks: CheckItem<HookEntry>[]
  plugins: CheckItem<PluginEntry>[]
}

function StatusIcon({ installed }: { installed: boolean }) {
  return <Text color={installed ? 'green' : 'red'}>{installed ? '✅' : '❌'}</Text>
}

function ScopeLabel({ scope }: { scope: 'global' | 'project' }) {
  // 🌍 = 全局 ~/.claude/  📁 = 项目级 .claude/
  return <Text color="gray">{scope === 'global' ? '🌍' : '📁'}</Text>
}

function SkillRow({ item }: { item: CheckItem<SkillEntry> }) {
  return (
    <Box flexDirection="row" gap={1}>
      <StatusIcon installed={item.installed} />
      <Text color={item.installed ? 'white' : 'red'}>{item.name.padEnd(20)}</Text>
      {item.installed ? (
        <Box flexDirection="row" gap={1}>
          <Text color="green">已安装</Text>
          <ScopeLabel scope={item.scope} />
        </Box>
      ) : (
        <Text color="red">基线中存在，但此项目未安装</Text>
      )}
    </Box>
  )
}

function McpRow({ item }: { item: CheckItem<McpEntry> }) {
  return (
    <Box flexDirection="row" gap={1}>
      <StatusIcon installed={item.installed} />
      <Text color={item.installed ? 'white' : 'red'}>{item.name.padEnd(20)}</Text>
      {item.installed ? (
        <Box flexDirection="row" gap={1}>
          <Text color="green">已配置</Text>
          <ScopeLabel scope={item.scope} />
        </Box>
      ) : (
        <Text color="red">基线中存在，但此项目未配置</Text>
      )}
    </Box>
  )
}

function HookRow({ item }: { item: CheckItem<HookEntry> }) {
  return (
    <Box flexDirection="row" gap={1}>
      <StatusIcon installed={item.installed} />
      <Text color={item.installed ? 'white' : 'red'}>
        {`${item.event}: ${item.name}`.padEnd(30)}
      </Text>
      {item.installed ? (
        <Box flexDirection="row" gap={1}>
          <Text color="green">已配置</Text>
          <ScopeLabel scope={item.scope} />
        </Box>
      ) : (
        <Text color="red">基线中存在，但此项目未配置</Text>
      )}
    </Box>
  )
}

function PluginRow({ item }: { item: CheckItem<PluginEntry> }) {
  return (
    <Box flexDirection="row" gap={1}>
      <StatusIcon installed={item.installed} />
      <Text color={item.installed ? 'white' : 'red'}>{item.name.padEnd(20)}</Text>
      {item.installed ? (
        <Box flexDirection="row" gap={1}>
          <Text color="green">{item.enabled ? '已安装并启用' : '已安装（未启用）'}</Text>
          <ScopeLabel scope={item.scope} />
        </Box>
      ) : (
        <Text color="red">基线中存在，但此项目未安装</Text>
      )}
    </Box>
  )
}

export function CheckReport({ projectDir, skills, mcps, hooks, plugins }: Props) {
  const { exit } = useApp()

  const missingCount =
    skills.filter((s) => !s.installed).length +
    mcps.filter((m) => !m.installed).length +
    hooks.filter((h) => !h.installed).length +
    plugins.filter((p) => !p.installed).length

  useEffect(() => {
    const timer = setTimeout(() => exit(), 100)
    return () => clearTimeout(timer)
  }, [exit])

  const hasAny = skills.length > 0 || mcps.length > 0 || hooks.length > 0 || plugins.length > 0

  return (
    <Box flexDirection="column" gap={1} padding={1}>
      <Text bold color="cyan">
        Claude 环境检测 — {projectDir}
      </Text>

      {skills.length > 0 && (
        <Box flexDirection="column">
          <Text bold color="white">Skills</Text>
          {skills.map((item) => <SkillRow key={item.name} item={item} />)}
        </Box>
      )}

      {plugins.length > 0 && (
        <Box flexDirection="column">
          <Text bold color="white">Plugins</Text>
          {plugins.map((item) => <PluginRow key={item.fullKey} item={item} />)}
        </Box>
      )}

      {mcps.length > 0 && (
        <Box flexDirection="column">
          <Text bold color="white">MCPs</Text>
          {mcps.map((item) => <McpRow key={item.name} item={item} />)}
        </Box>
      )}

      {hooks.length > 0 && (
        <Box flexDirection="column">
          <Text bold color="white">Hooks</Text>
          {hooks.map((item, i) => <HookRow key={`${item.event}:${item.name}:${i}`} item={item} />)}
        </Box>
      )}

      {!hasAny && (
        <Text color="gray">基线为空，请先运行 claude-env init 设置偏好。</Text>
      )}

      <Text>{'─'.repeat(40)}</Text>

      {missingCount > 0 ? (
        <Text color="yellow">⚠️  {missingCount} 项缺失，请参考上方清单手动安装。</Text>
      ) : (
        <Text color="green">✅ 所有配置完整！</Text>
      )}
    </Box>
  )
}
