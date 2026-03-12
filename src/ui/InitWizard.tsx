import React, { useState } from 'react'
import { Box, Text, useInput, useApp } from 'ink'
import type { CatalogItem } from '../catalog/loader.js'
import type { PluginEntry } from '../detectors/index.js'
import { EnhancedCheckboxList } from './EnhancedCheckboxList.js'

type Props = {
  skillsCatalog: CatalogItem[]
  mcpsCatalog: CatalogItem[]
  detectedPlugins: PluginEntry[]
  defaultSelectedSkills: string[]
  defaultSelectedMcps: string[]
  defaultSelectedPlugins: string[]
  onComplete: (selectedSkills: string[], selectedMcps: string[], selectedPlugins: string[]) => void
}

type Phase = 'skills' | 'mcps' | 'plugins' | 'confirm'

export function InitWizard({
  skillsCatalog,
  mcpsCatalog,
  detectedPlugins,
  defaultSelectedSkills,
  defaultSelectedMcps,
  defaultSelectedPlugins,
  onComplete,
}: Props) {
  const { exit } = useApp()

  const [phase, setPhase] = useState<Phase>('skills')
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set(defaultSelectedSkills))
  const [selectedMcps, setSelectedMcps] = useState<Set<string>>(new Set(defaultSelectedMcps))
  const [selectedPlugins, setSelectedPlugins] = useState<Set<string>>(
    new Set(defaultSelectedPlugins),
  )

  const hasPlugins = detectedPlugins.length > 0
  const totalSteps = hasPlugins ? 3 : 2

  const pluginItems = detectedPlugins.map((p) => ({
    name: p.fullKey,
    description: `${p.name}（${p.marketplace}）`,
    source: undefined as 'official' | 'community' | undefined,
  }))

  const phaseBeforeConfirm: Phase = hasPlugins ? 'plugins' : 'mcps'

  // confirm phase input is handled here; list phases are handled inside EnhancedCheckboxList
  useInput(
    (input, key) => {
      if (key.return || input === 'y') {
        onComplete(
          Array.from(selectedSkills),
          Array.from(selectedMcps),
          Array.from(selectedPlugins),
        )
      } else if (input === 'n' || key.escape) {
        setPhase(phaseBeforeConfirm)
      } else if (input === 'q') {
        exit()
      }
    },
    { isActive: phase === 'confirm' },
  )

  if (phase === 'skills') {
    return (
      <Box flexDirection="column" gap={1} padding={1}>
        <Text bold color="cyan">
          Claude Env Init — Step 1/{totalSteps}: Skills
        </Text>
        <EnhancedCheckboxList
          key="skills"
          items={skillsCatalog}
          selected={selectedSkills}
          isActive={true}
          onToggle={(name) => toggle(setSelectedSkills, name)}
          onNext={() => setPhase('mcps')}
          onBack={exit}
          onQuit={exit}
        />
      </Box>
    )
  }

  if (phase === 'mcps') {
    return (
      <Box flexDirection="column" gap={1} padding={1}>
        <Text bold color="cyan">
          Claude Env Init — Step 2/{totalSteps}: MCPs
        </Text>
        <EnhancedCheckboxList
          key="mcps"
          items={mcpsCatalog}
          selected={selectedMcps}
          isActive={true}
          onToggle={(name) => toggle(setSelectedMcps, name)}
          onNext={() => setPhase(hasPlugins ? 'plugins' : 'confirm')}
          onBack={() => setPhase('skills')}
          onQuit={exit}
        />
      </Box>
    )
  }

  if (phase === 'plugins') {
    return (
      <Box flexDirection="column" gap={1} padding={1}>
        <Text bold color="cyan">
          Claude Env Init — Step 3/{totalSteps}: Plugins
        </Text>
        {pluginItems.length === 0 ? (
          <Text color="gray">No installed plugins detected. Press Enter to skip.</Text>
        ) : (
          <EnhancedCheckboxList
            key="plugins"
            items={pluginItems}
            selected={selectedPlugins}
            isActive={true}
            onToggle={(name) => toggle(setSelectedPlugins, name)}
            onNext={() => setPhase('confirm')}
            onBack={() => setPhase('mcps')}
            onQuit={exit}
          />
        )}
      </Box>
    )
  }

  // confirm
  return (
    <Box flexDirection="column" gap={1} padding={1}>
      <Text bold color="cyan">
        Confirm baseline profile
      </Text>
      <Box flexDirection="column">
        <Text>
          Skills ({selectedSkills.size}):{' '}
          <Text color="green">{Array.from(selectedSkills).join(', ') || '(none)'}</Text>
        </Text>
        <Text>
          MCPs ({selectedMcps.size}):{' '}
          <Text color="green">{Array.from(selectedMcps).join(', ') || '(none)'}</Text>
        </Text>
        <Text>
          Plugins ({selectedPlugins.size}):{' '}
          <Text color="green">
            {Array.from(selectedPlugins)
              .map((k) => k.split('@')[0])
              .join(', ') || '(none)'}
          </Text>
        </Text>
      </Box>
      <Text color="gray">Enter/y save  n/Esc go back  q quit</Text>
    </Box>
  )
}

function toggle(setter: React.Dispatch<React.SetStateAction<Set<string>>>, key: string) {
  setter((prev) => {
    const next = new Set(prev)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    return next
  })
}
