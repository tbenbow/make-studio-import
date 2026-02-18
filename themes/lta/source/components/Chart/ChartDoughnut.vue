<template>
  <div v-editable="$props" class="chart-doughnut">
    <DoughnutVueChartJS
      :options="options"
      :data="chartData"
      :height="height || 400"
      :style="{ maxHeight: '100%', maxWidth: '100%' }"
    />
  </div>
</template>

<script>
import { Doughnut as DoughnutVueChartJS } from 'vue-chartjs'
import {
  Chart,
  DoughnutController,
  ArcElement,
  Tooltip,
  Legend,
  Title
} from 'chart.js'
import { theme } from '#tailwind-config'

Chart.register(DoughnutController, ArcElement, Tooltip, Legend, Title)

Chart.defaults.color = theme.colors.black[900]
Chart.defaults.borderColor = theme.colors.black[100]
Chart.defaults.font.lineHeight = theme.lineHeight.tight
Chart.defaults.font.size = parseFloat(theme.fontSize['2xs']) * 16

export default {
  components: { DoughnutVueChartJS },
  props: {
    chartTitle: String,
    dataset: Array,
    labels: Array,
    height: {
      type: [String, Number],
      default: 400
    },
    doughnut: {
      type: Boolean,
      default: () => false
    },
    _editable: String
  },
  computed: {
    options() {
      const cutout = this.doughnut ? 50 : 0

      return {
        cutout: `${cutout}%`,
        borderWidth: 0,
        plugins: {
          legend: {
            display: true,
            labels: {
              boxHeight: 14
            }
          },
          title: {
            display: !!this.chartTitle,
            text: this.chartTitle,
            font: {
              size: parseFloat(this.$theme.fontSize.sm) * 16
            }
          }
        }
      }
    },
    getTheData() {
      const theDatasetArray = this.dataset?.[0]?.data || []
      const theDataset = []
      for (let i = 0; i < theDatasetArray.length; i++) {
        const currentDatum = theDatasetArray[i].datapoint
        theDataset.push(currentDatum)
      }
      return theDataset
    },
    getTheLabels() {
      const theLabelsArray = this.labels || []
      const theLabels = []
      for (let i = 0; i < theLabelsArray.length; i++) {
        const currentLabel = theLabelsArray[i].label
        theLabels.push(currentLabel)
      }
      return theLabels
    },
    chartData() {
      return {
        labels: this.getTheLabels,
        datasets: [
          {
            data: this.getTheData,
            backgroundColor: [
              this.$theme.colors.green.DEFAULT,
              this.$theme.colors.orange.DEFAULT,
              this.$theme.colors.green.dark,
              this.$theme.colors.blue,
              this.$theme.colors.extra['2'],
              this.$theme.colors.yellow,
              this.$theme.colors.extra['1'],
              this.$theme.colors.extra['3']
            ]
          }
        ]
      }
    }
  }
}
</script>

<style lang="postcss" scoped>
.chart-doughnut {
  @apply relative;
}
</style>
