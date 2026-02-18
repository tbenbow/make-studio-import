<template>
  <div v-editable="$props" class="chart-scatter">
    <ScatterVueChartJS
      :options="options"
      :data="chartData"
      :height="height || 400"
      :style="{ maxHeight: '100%', maxWidth: '100%' }"
    />
  </div>
</template>

<script>
import { Scatter as ScatterVueChartJS } from 'vue-chartjs'
import {
  Chart,
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  PointElement,
  LinearScale,
  ScatterController
} from 'chart.js'
import { theme } from '#tailwind-config'

Chart.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  PointElement,
  LinearScale,
  ScatterController
)

Chart.defaults.color = theme.colors.black[900]
Chart.defaults.borderColor = theme.colors.black[100]
Chart.defaults.font.lineHeight = theme.lineHeight.tight
Chart.defaults.font.size = parseFloat(theme.fontSize['2xs']) * 16

export default {
  components: { ScatterVueChartJS },
  props: {
    chartTitle: {
      type: String,
      default: ''
    },
    dataset: [Object, Array],
    formatXAsCurrency: {
      type: Boolean,
      default: () => false
    },
    formatYAsCurrency: {
      type: Boolean,
      default: () => false
    },
    labels: Array,
    height: {
      type: [String, Number],
      default: 400
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
              title: (context) => {
                return context[0].dataset.label
              },
              label: (context) => {
                const xValue =
                  this.formatXAsCurrency === true
                    ? this.$filters.currency(context.parsed.x, '$', 0)
                    : context.parsed.x

                const yValue =
                  this.formatYAsCurrency === true
                    ? this.$filters.currency(context.parsed.y, '$', 0)
                    : context.parsed.y

                return '(' + xValue + ', ' + yValue + ')'
              }
            }
          }
        },
        scales: {
          x: {
            title: {
              display: !!this.xAxisTitle,
              text: this.xAxisTitle,
              font: {
                weight: 'bold'
              }
            },
            ticks: {
              // Include a dollar sign in the ticks
              callback: (value) => {
                return this.formatXAsCurrency === true ? '$' + value : value
              }
            }
          },
          y: {
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
                return this.formatYAsCurrency === true
                  ? this.$filters.currency(value, '$', 0)
                  : value
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
          data: [],
          label: this.dataset[i].datasetLabel
            ? this.dataset[i].datasetLabel
            : 'Label Needed'
        }
        const theDatasetArray = this.dataset[i].data
        const theDataset = theDatasets[i].data
        for (let i = 0; i < theDatasetArray.length; i++) {
          const currentDatumX = theDatasetArray[i].datapoint
          const currentDatumY = theDatasetArray[i].datapointY

          theDataset.push({ x: currentDatumX, y: currentDatumY })
        }
      }
      return theDatasets
    },
    chartData() {
      return {
        datasets: this.getTheData
      }
    },
    xAxisTitle() {
      return this.getTheLabels?.[0]
    },
    yAxisTitle() {
      return this.getTheLabels?.[1]
    }
  }
}
</script>

<style lang="postcss" scoped>
.chart-scatter {
  @apply relative;
}
</style>
