<template>
  <div class="support-view">
    <div class="hero">
      <h1 class="hero-title">
        {{ s.title }}
      </h1>
    </div>

    <!-- One grid, two compositions (owner, 2026-10-01). Phone: the case, then one card — the
         button across it (the phone is already in your hand), and under it a small code beside
         the fine print that explains it; a full-width code was a screen of something this
         phone cannot scan. Wide screen: the text in the left column, the payment card on the
         right, the code first (a desktop link cannot reach a bank app) and the button under it. -->
    <div class="support-body">
      <div class="support-case">
        <p>{{ s.intro }}</p>
        <p>{{ s.what }}</p>
      </div>

      <div class="support-pay">
        <a
          class="btn-primary btn-lg pay-btn"
          :href="PAY_URL"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ s.button }}
        </a>
        <img
          class="pay-qr"
          :src="qrSrc"
          :alt="s.qrAlt"
          width="220"
          height="220"
          loading="lazy"
        >
      </div>

      <p class="pay-how">
        {{ s.how }}
      </p>
      <p class="pay-thanks">
        {{ s.thanks }}
      </p>
    </div>
  </div>
</template>

<script setup>
// The donation page (/support), reached from the footer and nowhere else: the audience is a
// player mid-game on a phone, and an ask anywhere in that flow costs more than it collects.
// Copy lives in landing.js's bilingual `footer.support`, like the disclaimer's does, and is
// written in the AUTHOR'S OWN VOICE (first person) — keep it that way when editing.
import { computed } from 'vue'
import { landing } from '../data/landing.js'
import { useLocale } from '../composables/useLocale.js'

// The author's Ozon Bank SBP page — pays from any Russian bank, no fee. The QR encodes this
// exact URL (verified when it was added); replacing one means replacing the other, and the
// image must be RENAMED rather than overwritten (public/images/CLAUDE.md — a stale QR would
// sit in the image cache of everyone who ever opened this page).
const PAY_URL = 'https://finance.ozon.ru/apps/sbp/ozonbankpay/01a09910-df13-7ba4-bf5e-0166fd7b8433'
const qrSrc = '/images/support-qr-ozon.png'

const { locale } = useLocale()
const s = computed(() => landing[locale.value].footer.support)
</script>

<style scoped>
.support-view { padding-top: 0.5rem; }

.hero {
  text-align: center;
  padding: 1rem 0 0.6rem;
  border-bottom: 2px solid var(--accent);
  margin-bottom: 1.4rem;
}
.hero-title {
  font-family: var(--font-display);
  font-size: 2rem;
  font-weight: 500;
  color: var(--text-primary);
  margin: 0;
}

.support-body {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  max-width: 640px;
  margin: 0 auto;
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--text-secondary, var(--text-primary));
}
.support-body p { margin: 0 0 0.9rem; }
.support-case { grid-column: 1 / -1; grid-row: 1; }

/* Phone: the card is a box drawn behind rows 2–3 (the wrapper's ::before — the wrapper itself is
   `display: contents`, so the button and the code are cells of this grid), and the fine print
   sits in the cell beside the code. */
.support-pay { display: contents; }
.support-pay::before {
  content: '';
  grid-column: 1 / -1;
  grid-row: 2 / 4;
  margin-bottom: 0.9rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
}
.pay-btn {
  grid-column: 1 / -1;
  grid-row: 2;
  margin: 0.8rem 0.8rem 0.75rem;
  justify-content: center;
  text-align: center;
  text-decoration: none;
}
/* The QR stays on white whatever the theme: a dark surface under a code is the one way to
   make it unscannable. */
.pay-qr {
  grid-column: 1;
  grid-row: 3;
  align-self: start;
  display: block;
  width: 112px;
  height: auto;
  margin: 0 0 1.7rem 0.8rem;
  background: #fff;
  padding: 0.3rem;
  border: 1px solid var(--border);
}
.support-body .pay-how {
  grid-column: 2;
  grid-row: 3;
  align-self: center;
  margin: 0 0.8rem 1.7rem;
}
.pay-thanks { grid-column: 1 / -1; grid-row: 4; }
.pay-how,
.pay-thanks {
  font-size: 0.85rem;
  line-height: 1.5;
  color: var(--text-muted);
}

/* Wide: text left, the payment card right — code on top, the button under it, as wide as it. */
@media (min-width: 760px) {
  .support-body {
    max-width: 920px;
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-rows: auto auto 1fr;
    column-gap: 2.5rem;
    font-size: 1rem;
  }
  .support-case { grid-column: 1; grid-row: 1; }
  .support-pay {
    grid-column: 2;
    grid-row: 1 / 4;
    align-self: start;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    background: var(--bg-card);
    border: 1px solid var(--border);
  }
  .support-pay::before { content: none; }
  .pay-qr { order: -1; width: 240px; margin: 0; padding: 0.4rem; }
  .pay-btn { margin: 0; }
  .support-body .pay-how { grid-column: 1; grid-row: 2; align-self: start; margin: 0 0 0.9rem; }
  .pay-thanks { grid-column: 1; grid-row: 3; }
}
</style>
