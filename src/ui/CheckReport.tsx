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
  // 🌍 = global ~/.claude/  📁 = project-level .claude/
  return <Text color="gray">{scope === 'global' ? '🌍' : '📁'}</Text>
}

function SkillRow({ item }: { item: CheckItem<SkillEntry> }) {
  return (
    <Box flexDirection="row" gap={1}>
      <StatusIcon installed={item.installed} />
      <Text color={item.installed ? 'white' : 'red'}>{item.name.padEnd(20)}</Text>
      {item.installed ? (
        <Box flexDirection="row" gap={1}>
          <Text color="green">installed</Text>
          <ScopeLabel scope={item.scope} />
        </Box>
      ) : (
        <Text color="red">in baseline but not installed in this project</Text>
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
          <Text color="green">configured</Text>
          <ScopeLabel scope={item.scope} />
        </Box>
      ) : (
        <Text color="red">in baseline but not configured in this project</Text>
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
          <Text color="green">configured</Text>
          <ScopeLabel scope={item.scope} />
        </Box>
      ) : (
        <Text color="red">in baseline but not configured in this project</Text>
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
          <Text color="green">{item.enabled ? 'installed & enabled' : 'installed (disabled)'}</Text>
          <ScopeLabel scope={item.scope} />
        </Box>
      ) : (
        <Text color="red">in baseline but not installed in this project</Text>
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
        Claude Environment Check — {projectDir}
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
        <Text color="gray">Baseline is empty. Run claude-env init to set your preferences.</Text>
      )}

      <Text>{'─'.repeat(40)}</Text>

      {missingCount > 0 ? (
        <Text color="yellow">⚠️  {missingCount} item(s) missing. Install them manually using the list above.</Text>
      ) : (
        <Text color="green">✅ All items are present!</Text>
      )}
    </Box>
  )
}
