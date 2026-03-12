import { homedir } from 'os'
import { join } from 'path'
import { readFile, writeFile, mkdir, access } from 'fs/promises'

export type Profile = {
  skills: string[]
  mcps: string[]
  hooks: string[]
  plugins: string[]   // fullKey，如 "frontend-design@claude-plugins-official"
  createdAt: string
  updatedAt: string
}

function getProfileDir(): string {
  return join(homedir(), '.claude-env')
}

function getProfilePath(): string {
  return join(getProfileDir(), 'profile.json')
}

export async function readProfile(): Promise<Profile | null> {
  try {
    const raw = await readFile(getProfilePath(), 'utf-8')
    return JSON.parse(raw) as Profile
  } catch {
    return null
  }
}

export async function writeProfile(profile: Profile): Promise<void> {
  const dir = getProfileDir()
  await mkdir(dir, { recursive: true })
  await writeFile(getProfilePath(), JSON.stringify(profile, null, 2), 'utf-8')
}

export async function profileExists(): Promise<boolean> {
  try {
    await access(getProfilePath())
    return true
  } catch {
    return false
  }
}
