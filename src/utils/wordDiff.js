// Two versions of a rule's text as one run of words, each kept, struck or added — what the patch
// notes page (PatchesView) prints for "was → now". Words, not letters: a rules change reads as a
// phrase replaced ("re-roll" → "add 1 to"), and a letter diff of that is noise.
//
// Longest common subsequence over the two word lists. Rule texts run to a few hundred words, so the
// O(n·m) table is a few hundred thousand cells at most; past CAP the texts are treated as rewritten
// whole rather than spending the page's time on a diff nobody could read anyway.
const CAP = 600 * 600

// → [{ t: 'same' | 'del' | 'ins', s: 'words' }], neighbouring runs of one kind joined.
export function wordDiff(a, b) {
  // A line break is a word of its own, so a rule's paragraphs and list items survive the diff
  // (the page prints it with `white-space: pre-line`).
  const words = (t) => (t || '').match(/\n|[^\s]+/g) || []
  const A = words(a)
  const B = words(b)
  const out = []
  const push = (t, w) => {
    const last = out[out.length - 1]
    if (last?.t === t) last.s += ` ${w}`
    else out.push({ t, s: w })
  }
  if (A.length * B.length > CAP) {
    if (A.length) out.push({ t: 'del', s: a.trim() })
    if (B.length) out.push({ t: 'ins', s: b.trim() })
    return out
  }
  const n = A.length
  const m = B.length
  // L[i][j] = LCS length of A[i..] and B[j..], one flat array.
  const L = new Uint16Array((n + 1) * (m + 1))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      L[i * (m + 1) + j] = A[i] === B[j] ? L[(i + 1) * (m + 1) + j + 1] + 1 : Math.max(L[(i + 1) * (m + 1) + j], L[i * (m + 1) + j + 1])
    }
  }
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (A[i] === B[j]) { push('same', A[i]); i++; j++ } else if (L[(i + 1) * (m + 1) + j] >= L[i * (m + 1) + j + 1]) push('del', A[i++])
    else push('ins', B[j++])
  }
  while (i < n) push('del', A[i++])
  while (j < m) push('ins', B[j++])
  return out
}
