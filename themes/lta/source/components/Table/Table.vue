<template>
  <div v-editable="$props" class="table" role="table">
    <h6 v-if="caption" class="caption" role="heading">{{ caption }}</h6>
    <div class="main">
      <header
        v-if="headerComputed && headerComputed.length"
        class="thead"
        role="rowgroup"
      >
        <TableRow
          v-bind="{ cells: headerComputed }"
          :style="{ gridTemplateColumns }"
        >
          <template #default="{ cells }">
            <TableCell
              v-for="(cell, cellIndex) in cells"
              :key="cellIndex"
              v-bind="typeof cell === 'string' ? { value: cell } : cell"
              class="th"
              :align="
                cell.align ||
                (columnAlignArr.indexOf(cellIndex) && columnAlignArr[cellIndex])
              "
              role="columnheader"
            />
          </template>
        </TableRow>
      </header>
      <div
        v-if="bodyComputed && bodyComputed.length"
        class="tbody"
        role="rowgroup"
      >
        <TableRow
          v-for="(row, rowIndex) in bodyComputed"
          :key="rowIndex"
          v-bind="row"
          :style="{ gridTemplateColumns }"
        >
          <template #default="{ cells }">
            <TableCell
              v-for="(cell, cellIndex) in cells"
              :key="cellIndex"
              v-bind="typeof cell === 'string' ? { value: cell } : cell"
              class="td"
              :align="
                cell.align || columnAlignArr.indexOf(cellIndex)
                  ? columnAlignArr[cellIndex]
                  : undefined
              "
            />
          </template>
        </TableRow>
      </div>
      <footer
        v-if="footerComputed && footerComputed.length"
        class="tfoot"
        role="rowgroup"
      >
        <TableRow
          v-bind="{ cells: footerComputed }"
          :style="{ gridTemplateColumns }"
        >
          <template #default="{ cells }">
            <TableCell
              v-for="(cell, cellIndex) in cells"
              :key="cellIndex"
              v-bind="typeof cell === 'string' ? { value: cell } : cell"
              class="td"
              :align="
                cell.align ||
                (columnAlignArr.indexOf(cellIndex) && columnAlignArr[cellIndex])
              "
            />
          </template>
        </TableRow>
      </footer>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    caption: String,
    table: Object,
    tableDisplayLastRowAsFooter: Boolean,
    header: Array,
    body: Array,
    footer: Array,
    columnAlign: {
      type: [Array, String],
      default: () => []
    },
    columnWidth: {
      type: [Array, String],
      default: () => []
    },
    columnMinWidth: {
      type: String,
      default: '144px'
    },
    _editable: String
  },
  computed: {
    tableHeader() {
      return this.table?.thead
    },
    tableBody() {
      return this.table?.tbody?.map((tbodyRow) => {
        const { body, row } = tbodyRow
        return {
          ...row,
          cells: body
        }
      })
    },
    headerComputed() {
      return this.header && this.header.length ? this.header : this.tableHeader
    },
    bodyComputed() {
      if (this.body && this.body.length) {
        return this.body
      }

      return this.tableDisplayLastRowAsFooter && this.tableBody?.length
        ? this.tableBody.slice(0, -1)
        : this.tableBody
    },
    footerComputed() {
      if (this.footer && this.footer.length) {
        return this.footer
      }

      return this.tableDisplayLastRowAsFooter && this.tableBody?.length
        ? this.tableBody.slice(-1)[0].cells
        : undefined
    },
    columnAlignArr() {
      return Array.isArray(this.columnAlign)
        ? this.columnAlign
        : typeof this.columnAlign === 'string' && this.columnAlign
        ? this.columnAlign.replaceAll(' ', '').split(',')
        : []
    },
    columnWidthArr() {
      return Array.isArray(this.columnWidth)
        ? this.columnWidth
        : typeof this.columnWidth === 'string' && this.columnWidth
        ? this.columnWidth.replaceAll(' ', '').split(',')
        : []
    },
    gridTemplateColumns() {
      return this.columnWidthArr.length
        ? this.columnWidthArr
            .map((width) => `minmax(${this.columnMinWidth}, ${width || '1fr'})`)
            .join(' ')
        : undefined
    }
  }
}
</script>

<style lang="postcss" scoped>
.table {
  @apply block border border-black-200 rounded-lg shadow;
}

.caption {
  @apply px-6 py-3 text-left bg-gradient-to-t from-black-100;
}

.main {
  @apply overflow-auto flex flex-col;

  .thead,
  .tbody,
  .tfoot {
    @apply flex-1 min-w-min;
  }
}

.tr {
  @apply grid grid-flow-col;
  grid-auto-columns: minmax(144px, 1fr); /* Instead of auto-cols-fr */

  &.highlight {
    .td,
    & + .tr .td {
      @apply border-transparent;
    }

    .td {
      @apply bg-accent font-bold;
    }
  }
}

.th,
.td {
  @apply flex-1 flex items-center px-6 py-3;

  :deep(.tooltip) {
    @apply flex flex-wrap gap-1 items-center;
  }

  :deep(.icon) {
    @apply flex-shrink-0 text-xl mr-2;
  }

  :deep(.tooltip-icon) {
    @apply text-body-3 text-sm;
  }

  &.align-left {
    @apply justify-start text-left;
  }

  &.align-center {
    @apply justify-center text-center;
  }

  &.align-right {
    @apply justify-end text-right;
  }
}

.th {
  @apply min-h-[48px] text-black-600 text-xs font-bold uppercase tracking-wide;
}

.td {
  @apply min-h-[64px] border-t border-black-100;
}

.tbody:first-child {
  .tr:first-child {
    .td {
      @apply border-t-0;
    }
  }
}

.tfoot {
  .td {
    @apply font-bold;
  }
}
</style>
