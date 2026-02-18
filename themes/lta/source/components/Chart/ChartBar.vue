<template>
  <div v-editable="$props" class="chart-bar">
    <BarVueChartJS
      :options="options"
      :data="chartData"
      :height="height || 400"
      :style="{ maxHeight: '100%', maxWidth: '100%' }"
    />
  </div>
</template>

<script>
import { Bar as BarVueChartJS } from 'vue-chartjs'
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  Filler,
  LinearScale,
  LineElement,
  LineController,
  PointElement,
  Tooltip,
  Legend,
  Title
} from 'chart.js'
import { theme } from '#tailwind-config'

Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  Filler,
  LinearScale,
  LineElement,
  LineController,
  PointElement,
  Tooltip,
  Legend,
  Title
)

Chart.defaults.color = theme.colors.black[900]
Chart.defaults.borderColor = theme.colors.black[100]
Chart.defaults.font.lineHeight = theme.lineHeight.tight
Chart.defaults.font.size = parseFloat(theme.fontSize['2xs']) * 16

export default {
  components: { BarVueChartJS },
  props: {
    chartTitle: {
      type: String,
      default: ''
    },
    dataset: Array,
    labels: Array,
    xAxisTitle: String,
    yAxisTitle: String,
    height: {
      type: [String, Number],
      default: 400
    },
    horizontal: {
      type: Boolean,
      default: () => false
    },
    stacked: {
      type: Boolean,
      default: () => false
    },
    formatValuesAsCurrency: {
      type: Boolean,
      default: () => false
    },
    _editable: String
  },
  data() {
    return {
      colors: [
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
  },
  computed: {
    options() {
      return {
        aspectRatio: 1,
        maxBarThickness: 30,
        indexAxis: this.horizontal ? 'y' : 'x',
        scales: {
          x: {
            stacked: this.stacked,
            title: {
              display: !!this.xAxisTitle,
              text: this.xAxisTitle,
              font: {
                weight: 'bold'
              }
            }
          },
          y: {
            stacked: this.stacked,
            title: {
              display: !!this.yAxisTitle,
              text: this.yAxisTitle,
              font: {
                weight: 'bold'
              }
            },
            ticks: {
              // Include a dollar sign in the ticks

              callback: (value) => {
                return this.formatValuesAsCurrency === true
                  ? this.$filters.currency(value, '$', 0)
                  : value
              }
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          title: {
            display: !!this.chartTitle,
            text: this.chartTitle,
            font: {
              size: parseFloat(this.$theme.fontSize.sm) * 16
            }
          },
          tooltip: {
            enabled: true,
            callbacks: {
              label: (context) => {
                const yValue =
                  this.formatValuesAsCurrency === true
                    ? this.$filters.currency(context.parsed.y, '$', 0)
                    : context.parsed.y
                return context.dataset.label + ': ' + yValue
              }
            }
          }
        }
      }
    },
    getTheLabels() {
      const theLabelsArray = this.labels
      const theLabels = []
      for (let i = 0; i < theLabelsArray.length; i++) {
        const currentLabel = theLabelsArray[i].label
        theLabels.push(currentLabel)
      }
      return theLabels
    },
    getTheData() {
      const theDatasets = []
      for (let i = 0; i < this.dataset.length; i++) {
        theDatasets[i] = {
          backgroundColor: this.colors[i],
          borderColor: this.colors[i],
          borderWidth: this.dataset[i].displayAsLine === true ? 2 : 0,
          borderDash: this.dataset[i].dashed ? [5, 5] : [],
          fill: this.dataset[i].filled,
          stack:
            this.stacked && this.dataset[i].groupName
              ? this.dataset[i].groupName
              : this.dataset[i].label,
          type: this.dataset[i].displayAsLine === true ? 'line' : 'bar',
          data: [],
          label: this.dataset[i].datasetLabel
            ? this.dataset[i].datasetLabel
            : 'Label Needed'
        }
        const theDatasetArray = this.dataset[i].data
        const theDataset = theDatasets[i].data
        for (let i = 0; i < theDatasetArray.length; i++) {
          const currentDatum = theDatasetArray[i].datapoint
          theDataset.push(currentDatum)
        }
      }
      return theDatasets
    },
    chartData() {
      return {
        labels: this.getTheLabels,
        datasets: this.getTheData
      }
    }
  }
}
</script>

<style lang="postcss" scoped>
.chart-bar {
  @apply relative;
}
</style>
