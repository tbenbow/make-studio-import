<template>
  <div class="area-row">
    <div class="main">
      <NuxtLink class="state-link" :to="censusLink">
        <State :code="stateCode" />
      </NuxtLink>
      <div class="content">
        <h5 class="title">
          <NuxtLink class="title-link" :to="censusLink">
            {{ stateName
            }}<font-awesome-icon
              :icon="['fal', 'chevron-right']"
              class="icon"
            />
          </NuxtLink>
        </h5>
        <div class="relative">
          <component
            :is="acresProtected ? 'button' : 'div'"
            class="acres-protected"
            @click="
              acresProtected && (showAcresProtected = !showAcresProtected)
            "
          >
            <font-awesome-icon :icon="['fal', 'shield-plus']" class="icon" />
            <span>
              <strong>{{ $filters.number(acres, '0,0') }}</strong>
              total acres protected
            </span>
            <font-awesome-icon
              v-if="acresProtected"
              :icon="['fal', showAcresProtected ? 'angle-up' : 'angle-down']"
              class="icon-popover"
            />
          </component>
          <transition name="appear-down" leave-to-class="appear-up-leave-to">
            <Popover
              v-show="showAcresProtected"
              class="right-0 sm:right-auto sm:left-0 top-8"
              :active="showAcresProtected"
              @close="showAcresProtected = false"
            >
              <p v-html="acresProtected" />
            </Popover>
          </transition>
        </div>
      </div>
    </div>
    <aside v-if="counties && counties.length" class="aside">
      <div class="relative">
        <ButtonComponent
          name="Counties of operation"
          variation="link"
          :icon="showCounties ? 'angle-up' : 'angle-down'"
          size="small"
          @click="showCounties = !showCounties"
        />
        <transition name="appear-down" leave-to-class="appear-up-leave-to">
          <Popover
            v-show="showCounties"
            class="left-0 sm:left-auto sm:right-0 top-8"
            :active="showCounties"
            @close="showCounties = false"
          >
            <p>{{ countyList }}</p>
          </Popover>
        </transition>
      </div>
    </aside>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { useSettingsStore } from '@/stores/settings'

export default {
  props: {
    stateCode: String,
    stateName: String,
    acres: Number,
    acresDetails: Object,
    counties: Array,
    _editable: String
  },
  data() {
    return {
      showAcresProtected: false,
      showCounties: false
    }
  },
  computed: {
    ...mapState(useSettingsStore, ['getSettingLinkUrl']),
    censusLink() {
      const stateLowerDash = this.stateName.split(' ').join('-').toLowerCase()
      return `${this.getSettingLinkUrl('rootGainingGround')}/${stateLowerDash}`
    },
    countyList() {
      return this.counties.map((county) => county.name).join(', ')
    },
    acresProtected() {
      if (typeof this.acresDetails !== 'object') {
        return
      }

      const acres = []

      if (this.acresDetails.owned) {
        acres.push(
          `${this.$filters.number(
            this.acresDetails.owned,
            '0,0'
          )} acres owned`
        )
      }

      if (this.acresDetails.easement) {
        acres.push(
          `${this.$filters.number(
            this.acresDetails.easement,
            '0,0'
          )} acres under easement`
        )
      }

      if (this.acresDetails.acquired) {
        acres.push(
          `${this.$filters.number(
            this.acresDetails.acquired,
            '0,0'
          )} acres acquired and reconveyed`
        )
      }

      if (this.acresDetails.other) {
        acres.push(
          `${this.$filters.number(
            this.acresDetails.other,
            '0,0'
          )} acres protected by other means`
        )
      }

      return acres.join('<br>')
    }
  }
}
</script>

<style lang="postcss" scoped>
.area-row {
  @apply flex flex-wrap gap-x-12 gap-y-3;

  .main {
    @apply flex-1;
  }
}

.main {
  @apply flex gap-6;
}

:deep(.state) {
  @apply relative block h-16 w-20 text-green-dark text-center;
  @apply transition-colors duration-200;
}

.state-link:hover :deep(.state) {
  @apply text-accent;
}

.content {
  @apply grow;

  .icon {
    @apply mr-1;
  }
}

.title {
  @apply mb-2 text-body;

  .icon {
    @apply relative top-px ml-2 text-accent;
  }

  &-link {
    @apply hover:text-accent;
    @apply transition-colors duration-200;
  }
}

.acres-protected {
  @apply inline-flex items-center text-accent;

  .icon {
    @apply mr-2 text-lg;
  }

  .icon-popover {
    @apply ml-2;
  }
}
</style>
