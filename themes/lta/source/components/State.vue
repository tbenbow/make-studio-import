<template>
  <span class="state font-stateface" :class="{ invisible: !fontIsReady }">
    <template v-if="translatedState">{{ translatedState }}</template>
    <template v-else>&nbsp;</template>
  </span>
</template>

<script>
export default {
  props: {
    code: String
  },
  data() {
    return {
      fontIsReady: false
    }
  },
  computed: {
    translatedState() {
      const stateKey = {
        al: 'B',
        ak: 'A',
        az: 'D',
        ar: 'C',
        ca: 'E',
        co: 'F',
        ct: 'G',
        de: 'H',
        dc: 'y',
        fl: 'I',
        ga: 'J',
        hi: 'K',
        id: 'M',
        il: 'N',
        in: 'O',
        ia: 'L',
        ks: 'P',
        ky: 'Q',
        la: 'R',
        me: 'U',
        md: 'T',
        ma: 'S',
        mi: 'V',
        mn: 'W',
        ms: 'Y',
        mo: 'X',
        mt: 'Z',
        ne: 'c',
        nv: 'g',
        nh: 'd',
        nj: 'e',
        nm: 'f',
        ny: 'h',
        nc: 'a',
        nd: 'b',
        oh: 'i',
        ok: 'j',
        or: 'k',
        pa: 'l',
        pr: '3',
        ri: 'm',
        sc: 'n',
        sd: 'o',
        tn: 'p',
        tx: 'q',
        us: 'z',
        ut: 'r',
        vt: 't',
        va: 's',
        wa: 'u',
        wv: 'w',
        wi: 'v',
        wy: 'x'
      }

      return stateKey[this.code.toLowerCase()]
    }
  },
  mounted() {
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => (this.fontIsReady = true))
    } else {
      setTimeout(() => (this.fontIsReady = true), 2000)
    }
  }
}
</script>

<style lang="postcss" scoped>
.state {
  @apply text-4xl leading-none;
}
</style>
