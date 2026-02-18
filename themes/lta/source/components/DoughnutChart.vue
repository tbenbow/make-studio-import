<template>
  <div class="doughnut-chart">
    <DoughnutVueChartJS
      :options="options"
      :data="chartData"
      :height="height || 208"
      :width="width"
      :style="{ maxHeight: '100%', maxWidth: '100%' }"
    />
    <h3 class="value">{{ value }}%</h3>
  </div>
</template>

<script>
import { Doughnut as DoughnutVueChartJS } from 'vue-chartjs'
import { Chart, DoughnutController, ArcElement } from 'chart.js'

Chart.register(DoughnutController, ArcElement)

export default {
  components: { DoughnutVueChartJS },
  props: {
    value: {
      type: [Number, String],
      default: 0
    },
    height: {
      type: Number,
      default: 208
    },
    width: {
      type: Number,
      default: 0
    },
    borderWidth: {
      type: Number,
      default: 16
    }
  },
  data() {
    return {
      accentColor: null
    }
  },
  computed: {
    options() {
      const cutout =
        this.height || this.width
          ? (((this.height || this.width) - this.borderWidth * 2) /
              (this.height || this.width)) *
            100
          : 75

      return {
        cutout: `${cutout}%`,
        borderWidth: 0,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            enabled: false
          }
        }
      }
    },
    chartData() {
      return {
        datasets: [
          {
            data: [parseFloat(this.value), 100 - parseFloat(this.value)],
            backgroundColor: [this.accentColor, 'transparent']
          }
        ]
      }
    }
  },
  mounted() {
    const style = getComputedStyle(this.$el)
    this.accentColor = style.getPropertyValue('--color-accent').trim()
  }
}
</script>

<style lang="postcss" scoped>
.doughnut-chart {
  @apply relative;
}

.value {
  @apply absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2;
}
</style>
