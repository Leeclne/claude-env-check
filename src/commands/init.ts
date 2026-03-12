import React from 'react'
import { render } from 'ink'
import { detectAll } from '../detectors/index.js'
import { loadSkillsCatalog, loadMcpsCatalog } from '../catalog/index.js'
import { readProfile, writeProfile, profileExists, type Profile } from '../config/profile.js'
import { InitWizard } from '../ui/InitWizard.js'

export async function runInit(): Promise<void> {
  const exists = await profileExists()

  if (exists) {
    const profile = await readProfile()
    console.log(`\n已存在基线配置（创建于 ${profile?.createdAt ?? '未知'}），将重新配置...\n`)
  }

  const detected = await detectAll()
  const localSkillNames = detected.skills.map((s) => s.name)
  const localMcpNames = detected.mcps.map((m) => m.name)
  const localPluginKeys = detected.plugins.map((p) => p.fullKey)

  const existingProfile = await readProfile()

  const defaultSkills = Array.from(new Set([...localSkillNames, ...(existingProfile?.skills ?? [])]))
  const defaultMcps = Array.from(new Set([...localMcpNames, ...(existingProfile?.mcps ?? [])]))
  const defaultPlugins = Array.from(new Set([...localPluginKeys, ...(existingProfile?.plugins ?? [])]))

  const skillsCatalog = loadSkillsCatalog()
  const mcpsCatalog = loadMcpsCatalog()

  return new Promise((resolve) => {
    const { unmount } = render(
      React.createElement(InitWizard, {
        skillsCatalog: skillsCatalog.items,
        mcpsCatalog: mcpsCatalog.items,
        detectedPlugins: detected.plugins,
        defaultSelectedSkills: defaultSkills,
        defaultSelectedMcps: defaultMcps,
        defaultSelectedPlugins: defaultPlugins,
        onComplete: async (selectedSkills, selectedMcps, selectedPlugins) => {
          unmount()

          const now = new Date().toISOString()
          const profile: Profile = {
            skills: selectedSkills,
            mcps: selectedMcps,
            hooks: existingProfile?.hooks ?? [],
            plugins: selectedPlugins,
            createdAt: existingProfile?.createdAt ?? now,
            updatedAt: now,
          }

          await writeProfile(profile)

          console.log('\n✅ 基线配置已保存！')
          console.log(`   Skills (${selectedSkills.length}): ${selectedSkills.join(', ') || '（无）'}`)
          console.log(`   MCPs   (${selectedMcps.length}): ${selectedMcps.join(', ') || '（无）'}`)
          console.log(`   Plugins(${selectedPlugins.length}): ${selectedPlugins.map((k) => k.split('@')[0]).join(', ') || '（无）'}`)
          console.log('')

          resolve()
        },
      })
    )
  })
}
