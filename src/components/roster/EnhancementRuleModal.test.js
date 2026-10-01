import { describe, it, expect, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import EnhancementRuleModal from './EnhancementRuleModal.vue'

let w = null
afterEach(() => { w?.unmount(); document.body.innerHTML = '' })

// The faction bundles are dynamic imports; wait for the lookup to finish, then read what it found.
async function open(factionSlug, name) {
  w = mount(EnhancementRuleModal, { props: { factionSlug, name }, attachTo: document.body })
  await vi.waitFor(() => expect(w.vm.$.setupState.loaded).toBe(true), { timeout: 15000 })
  return w.vm.$.setupState.enh
}

describe('EnhancementRuleModal', () => {
  it('reads an enhancement of the faction’s own detachment', async () => {
    expect((await open('space-marines', 'Artificer Armour'))?.name).toBe('Artificer Armour')
  })

  // A Chapter fields the Codex: Space Marines detachments, which live in the Space Marines file
  // (a player's report, 2026-10-01: "no description of the enhancements in some detachments, the
  // Blood Angels for one").
  it('reads a Codex detachment’s enhancement for a Chapter', async () => {
    expect((await open('blood-angels', 'Artificer Armour'))?.name).toBe('Artificer Armour')
  })
})
