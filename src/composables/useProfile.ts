import { computed, ref, watch } from 'vue'
import { api } from '@/lib/api'

export interface Profile {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

const PROFILES_KEY = 'habitrack_profiles'
const CURRENT_KEY = 'habitrack_profile_id'

function loadProfiles(): Profile[] {
  const raw = localStorage.getItem(PROFILES_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    try { localStorage.setItem(`${PROFILES_KEY}_corrupt_${Date.now()}`, raw) } catch { /* quota */ }
    return []
  }
}

function saveProfiles(list: Profile[]) {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(list))
}

const profiles = ref<Profile[]>(loadProfiles())
const currentProfileId = ref<string | null>(localStorage.getItem(CURRENT_KEY))

// True while no profile exists ; the app gates on this to ask for a
// username and create the first profile instead of defaulting to 'Me'.
const needsUsername = computed(() => profiles.value.length === 0)

let syncing = false
let syncTimer: ReturnType<typeof setTimeout> | null = null

watch(profiles, (val) => saveProfiles(val), { deep: true })

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8)
}

function createProfile(name: string): Profile {
  const now = new Date().toISOString()
  const profile: Profile = {
    id: generateId(),
    name: name.trim() || 'Unnamed',
    createdAt: now,
    updatedAt: now,
  }
  profiles.value.push(profile)
  scheduleSync()
  return profile
}

function selectProfile(id: string) {
  if (!profiles.value.some(p => p.id === id)) return
  currentProfileId.value = id
  localStorage.setItem(CURRENT_KEY, id)
}

function renameProfile(id: string, name: string) {
  const p = profiles.value.find(p => p.id === id)
  if (!p) return
  p.name = name.trim() || p.name
  p.updatedAt = new Date().toISOString()
  scheduleSync()
}

// Keep the selection valid while profiles exist. An empty list stays
// unselected so the username modal can create the first profile; legacy
// habits migrate into it on load.
function ensureSelection() {
  if (profiles.value.length > 0 && !profiles.value.some(p => p.id === currentProfileId.value)) {
    selectProfile(profiles.value[0].id)
  }
}

ensureSelection()

// --- Sync -----------------------------------------------------------------

async function syncProfiles() {
  if (syncing || !navigator.onLine) return
  syncing = true
  try {
    await api.post('/profiles/push', { profiles: profiles.value })
    const { profiles: remote } = await api.get<{ profiles: Profile[] }>('/profiles')
    for (const r of remote) {
      const local = profiles.value.find(p => p.id === r.id)
      if (!local) profiles.value.push(r)
      else if ((r.updatedAt ?? '') > (local.updatedAt ?? '')) Object.assign(local, r)
    }
    ensureSelection()
  } catch {
    // offline or server down ; local list stays authoritative
  } finally {
    syncing = false
  }
}

function scheduleSync() {
  if (syncTimer) clearTimeout(syncTimer)
  syncTimer = setTimeout(syncProfiles, 1000)
}

window.addEventListener('online', syncProfiles)
syncProfiles()

export function useProfile() {
  return {
    profiles,
    currentProfileId,
    needsUsername,
    createProfile,
    selectProfile,
    renameProfile,
    syncProfiles,
  }
}
