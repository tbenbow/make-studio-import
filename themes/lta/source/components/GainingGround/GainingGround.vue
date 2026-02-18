<template>
  <div v-editable="$props" class="gaining-ground">
    <Blocks :root="true">
      <Breadcrumbs
        :description="meta.description || ''"
        :auto-generate-links="false"
      >
        <ButtonComponent
          v-if="hasDownload"
          :link="download.filename"
          download
          name="Download Page"
          icon="file-arrow-down"
          variation="link"
          size="small"
        />
      </Breadcrumbs>
      <Heading
        label="Gaining Ground"
        :title="sys.name"
        title-tag="h1"
        title-class="h0"
        align="center"
      />
      <GainingGroundAcresProtected
        v-if="acresProtected"
        :acres="acresProtected"
        :state="state"
      />
      <Callout
        align="center"
        :image="{ filename: 'https://a.storyblok.com/f/120093/648x360/59f777d137/logo-gaining-ground.png' }"
        :no-wavy-bottom="true"
      >
        <p>
          Land trusts have already conserved 61 million acres of private land
          across the nation — more than all of the national parks combined. Help
          us conserve another 60 million acres by the end of the decade.
        </p>
        <p><strong>Together, let’s keep Gaining Ground.</strong></p>
      </Callout>
      <LinkBar
        :links="[
          {
            link: { linktype: 'url', url: '#community-impact' },
            name: 'Community Impact'
          },
          {
            link: { linktype: 'url', url: '#demographics' },
            name: 'Demographics'
          },
          {
            link: { linktype: 'url', url: '#climate-change' },
            name: 'Climate Change'
          },
          {
            link: { linktype: 'url', url: '#land-protected' },
            name: 'Land Protected'
          },
          hasMakingADifferenceSection
            ? {
                link: { linktype: 'url', url: '#making-a-difference' },
                name: 'Making a Difference'
              }
            : undefined,
          hasLandTrustsSection
            ? {
                link: { linktype: 'url', url: '#land-trusts' },
                name: 'Land Trusts'
              }
            : undefined
        ]"
      />
      <LayoutSection id="community-impact" background-color="green-dark">
        <Banner
          label="Community Impact"
          :title="communityTitle"
          :body="communityDescription"
          :background-image="{
            filename: 'https://a.storyblok.com/f/120093/2880x1120/69ddea32f0/gaining-ground-community-impact.jpg'
          }"
          :background-image-options="{ quality: 60 }"
          size="small"
          align="center"
        />
        <LayoutGrid>
          <Item
            v-if="communityVisitorsLandTrustProperties"
            icon="users"
            label="Visitors to Land Trust Properties"
            :title="communityVisitorsLandTrustProperties"
            :body="communityVisitorsLandTrustPropertiesDescription"
            size="large"
            icon-style="underline"
            title-size="large"
            accent-color="green"
          />
          <Item
            v-if="communityPercentLandTrustsThatProvidePublicAccessTheirLands"
            icon="people"
            label="Percent of Land Trusts That Provide Public Access to Their Lands"
            :title="communityPercentLandTrustsThatProvidePublicAccessTheirLands"
            :body="
              communityPercentLandTrustsThatProvidePublicAccessTheirLandsDescription
            "
            size="large"
            icon-style="underline"
            title-size="large"
            accent-color="green"
          />
        </LayoutGrid>
        <LayoutGrid columns-class="gap-y-24" num-columns="3">
          <ItemCard
            v-if="communityNumberPeopleServed"
            icon="family"
            label="Number of People Served"
            :title="communityNumberPeopleServed"
            :body="communityNumberPeopleServedDescription"
            align="center"
            icon-style="circle"
            title-size="large"
            accent-color="blue"
          />
          <ItemCard
            v-if="communityMilesTrails"
            icon="person-hiking"
            label="Miles of Trails"
            :title="communityMilesTrails"
            :body="communityMilesTrailsDescription"
            align="center"
            icon-style="circle"
            title-size="large"
            accent-color="yellow"
          />
          <ItemCard
            v-if="communityMilesUniversalAccess"
            icon="universal-access"
            label="Miles With Universal Access"
            :title="communityMilesUniversalAccess"
            :body="communityMilesUniversalAccessDescription"
            align="center"
            icon-style="circle"
            title-size="large"
            accent-color="orange"
          />
          <ItemCard
            v-if="
              communityPercentLandTrustsWhoIncreasedCommunityEngagementLastFiveYears
            "
            icon="people-arrows-left-right"
            label="Percent of Land Trusts Who Increased Community Engagement in the Last Five Years"
            align="center"
            icon-style="circle"
            accent-color="green"
          >
            <LazyDoughnutChart
              :value="
                communityPercentLandTrustsWhoIncreasedCommunityEngagementLastFiveYears
              "
            />
          </ItemCard>
          <ItemCard
            v-if="
              communityLandTrustsDeepeningRelationships &&
              communityLandTrustsDeepeningRelationships.length
            "
            icon="chart-user"
            label="Land Trusts Are Deepening Relationships With:"
            align="center"
            icon-style="circle"
            accent-color="stone"
          >
            <List>
              <ListItem
                v-for="(
                  listItem, index
                ) in communityLandTrustsDeepeningRelationships"
                :key="index"
                v-bind="listItem"
                size="small"
              />
            </List>
          </ItemCard>
          <ItemCard
            v-if="
              communityLandTrustsHelpingAddressCommunityNeeds &&
              communityLandTrustsHelpingAddressCommunityNeeds.length
            "
            icon="handshake-simple"
            label="Land Trusts Are Helping Address Community Needs, Including:"
            align="center"
            icon-style="circle"
            accent-color="blue"
          >
            <List>
              <ListItem
                v-for="(
                  listItem, index
                ) in communityLandTrustsHelpingAddressCommunityNeeds"
                :key="index"
                v-bind="listItem"
                size="small"
              />
            </List>
          </ItemCard>
        </LayoutGrid>
      </LayoutSection>
      <LayoutSection id="demographics">
        <Heading
          label="Demographics"
          :title="demographicsTitle"
          :description="demographicsDescription"
          align="center"
        />
        <LayoutGrid num-columns="3">
          <Item
            v-if="demographicsActiveLandTrusts"
            icon="mountains"
            label="Active Land Trusts"
            :title="demographicsActiveLandTrusts"
            :body="demographicsActiveLandTrustsDescription"
            icon-style="underline"
            title-size="large"
            accent-color="green"
          />
          <Item
            v-if="demographicsAllianceMemberLandTrusts"
            icon="alliance"
            label="Alliance Member Land Trusts"
            :title="demographicsAllianceMemberLandTrusts"
            :body="demographicsAllianceMemberLandTrustsDescription"
            icon-style="underline"
            title-size="large"
            accent-color="green"
          />
          <Item
            v-if="demographicsAccreditedLandTrusts"
            icon="accredited"
            label="Accredited Land Trusts"
            :title="demographicsAccreditedLandTrusts"
            :body="demographicsAccreditedLandTrustsDescription"
            icon-style="underline"
            title-size="large"
            accent-color="green"
          />
        </LayoutGrid>
        <LayoutGrid class="mt-18">
          <div
            v-if="
              demographicsMembers ||
              demographicsVolunteers ||
              demographicsFulltimeStaff ||
              demographicsParttimeStaff ||
              demographicsBoardMembers
            "
          >
            <HeadingSimple title="People" />
            <List class="mt-3">
              <ListItem
                v-if="demographicsMembers"
                label="Members/financial supporters"
              >
                <p>{{ demographicsMembers }}</p>
              </ListItem>
              <ListItem v-if="demographicsVolunteers" label="Volunteers">
                <p>{{ demographicsVolunteers }}</p>
              </ListItem>
              <ListItem
                v-if="demographicsFulltimeStaff"
                label="Full-time staff"
              >
                <p>{{ demographicsFulltimeStaff }}</p>
              </ListItem>
              <ListItem
                v-if="demographicsParttimeStaff"
                label="Part-time staff"
              >
                <p>{{ demographicsParttimeStaff }}</p>
              </ListItem>
              <ListItem v-if="demographicsBoardMembers" label="Board members">
                <p>{{ demographicsBoardMembers }}</p>
              </ListItem>
            </List>
          </div>
          <div
            v-if="
              demographicsOldest ||
              demographicsYoungest ||
              demographicsMedianAge
            "
          >
            <HeadingSimple title="Land Trust Longevity" />
            <List class="mt-3">
              <ListItem v-if="demographicsOldest" label="Oldest"
                ><p>
                  {{ ageFromYear(demographicsOldest) }} ({{
                    demographicsOldest
                  }})
                </p></ListItem
              >
              <ListItem v-if="demographicsYoungest" label="Youngest"
                ><p>
                  {{ ageFromYear(demographicsYoungest) }} ({{
                    demographicsYoungest
                  }})
                </p></ListItem
              >
              <ListItem v-if="demographicsMedianAge" label="Median age"
                ><p>{{ ageFromYear(demographicsMedianAge) }}</p></ListItem
              >
            </List>
          </div>
        </LayoutGrid>
        <div
          v-if="demographicsAssociations && demographicsAssociations.length"
          class="mt-18 grid gap-12 grid-cols-1 lg:grid-cols-12"
        >
          <Item
            v-for="(association, index) in demographicsAssociations"
            :key="index"
            class="lg:col-span-6 lg:col-start-4"
            v-bind="association"
            :label="association.label || 'State Association'"
            orientation="horizontal"
            size="small"
          >
            <ButtonComponent
              v-if="association.link"
              name="View website"
              :link="association.link"
              variation="link"
            />
          </Item>
        </div>
      </LayoutSection>
      <LayoutSection id="climate-change" background-color="stone">
        <Banner
          label="Climate Change"
          :title="climateTitle"
          :body="climateDescription"
          :background-image="{
            filename: 'https://a.storyblok.com/f/120093/2880x1120/69ddea32f0/gaining-ground-community-impact.jpg'
          }"
          :background-image-options="{ quality: 60 }"
          size="small"
          align="center"
          :dark-text="true"
        />
        <LayoutGrid num-columns="3" columns-class="gap-y-24">
          <ItemCard
            v-if="
              climatePercentLandTrustsWhoIncreasedClimateChangeLastFiveYears
            "
            icon="temperature-sun"
            label="Percent of Land Trusts Who Increased Focus on Climate Change in the Last Five Years"
            align="center"
            icon-style="circle"
            accent-color="green"
          >
            <LazyDoughnutChart
              :value="
                climatePercentLandTrustsWhoIncreasedClimateChangeLastFiveYears
              "
            />
          </ItemCard>
          <ItemCard
            v-if="climatePercentLandTrustsReceivingFundingAddressClimateChange"
            icon="hand-holding-dollar"
            label="Percent of Land Trusts Receiving Funding to Address Climate Change"
            align="center"
            icon-style="circle"
            accent-color="yellow"
          >
            <LazyDoughnutChart
              :value="
                climatePercentLandTrustsReceivingFundingAddressClimateChange
              "
            />
          </ItemCard>
          <ItemCard
            v-if="
              climateSourcesFundingAddressClimateChange &&
              climateSourcesFundingAddressClimateChange.length
            "
            icon="hands-holding-dollar"
            label="Sources of Funding to Address Climate Change"
            align="center"
            icon-style="circle"
            accent-color="blue"
          >
            <List>
              <ListItem
                v-for="(
                  listItem, index
                ) in climateSourcesFundingAddressClimateChange"
                :key="index"
                v-bind="listItem"
                size="small"
              />
            </List>
          </ItemCard>
        </LayoutGrid>
      </LayoutSection>
      <LayoutSection id="land-protected">
        <Heading
          label="Land Protected"
          :title="landTitle"
          :description="landDescription"
          align="center"
        />
        <div>
          <Table
            :header="['', landTableYear1, landTableYear2, landTableYear3, '']"
            :body="[
              {
                highlight: true,
                cells: [
                  {
                    icon: 'shield-plus',
                    value: 'Total acres protected'
                  },
                  landTotalAcresProtected1
                    ? $filters.number(landTotalAcresProtected1, '0,0')
                    : 'N/A',
                  landTotalAcresProtected2
                    ? $filters.number(landTotalAcresProtected2, '0,0')
                    : 'N/A',
                  landTotalAcresProtected3
                    ? $filters.number(landTotalAcresProtected3, '0,0')
                    : 'N/A',
                  percentChange(
                    landTotalAcresProtected1,
                    landTotalAcresProtected3
                  )
                ]
              },
              {
                cells: [
                  {
                    icon: 'handshake',
                    value: 'Under easement',
                    tooltip:
                      'A conservation easement (also known as a conservation restriction or conservation agreement) is a voluntary, legal agreement between a landowner and a land trust or government agency that permanently limits uses of the land in order to protect its conservation values.'
                  },
                  landUnderEasement1
                    ? $filters.number(landUnderEasement1, '0,0')
                    : 'N/A',
                  landUnderEasement2
                    ? $filters.number(landUnderEasement2, '0,0')
                    : 'N/A',
                  landUnderEasement3
                    ? $filters.number(landUnderEasement3, '0,0')
                    : 'N/A',
                  percentChange(landUnderEasement1, landUnderEasement3)
                ]
              },
              {
                cells: [
                  {
                    icon: 'flag',
                    value: 'Owned'
                  },
                  landOwned1
                    ? $filters.number(landOwned1, '0,0')
                    : 'N/A',
                  landOwned2
                    ? $filters.number(landOwned2, '0,0')
                    : 'N/A',
                  landOwned3
                    ? $filters.number(landOwned3, '0,0')
                    : 'N/A',
                  percentChange(landOwned1, landOwned3)
                ]
              },
              {
                cells: [
                  {
                    icon: 'object-group',
                    value: 'Acquired and reconveyed'
                  },
                  landAcquiredReconveyed1
                    ? $filters.number(landAcquiredReconveyed1, '0,0')
                    : 'N/A',
                  landAcquiredReconveyed2
                    ? $filters.number(landAcquiredReconveyed2, '0,0')
                    : 'N/A',
                  landAcquiredReconveyed3
                    ? $filters.number(landAcquiredReconveyed3, '0,0')
                    : 'N/A',
                  percentChange(
                    landAcquiredReconveyed1,
                    landAcquiredReconveyed3
                  )
                ]
              },
              {
                cells: [
                  {
                    icon: 'fence',
                    value: 'Protected by other means',
                    tooltip:
                      'Acres conserved by other means refers to land protected as a result of the activities of the land trust, but which the land trust did not directly acquire in fee or under easement.'
                  },
                  landProtectedOtherMeans1
                    ? $filters.number(landProtectedOtherMeans1, '0,0')
                    : 'N/A',
                  landProtectedOtherMeans2
                    ? $filters.number(landProtectedOtherMeans2, '0,0')
                    : 'N/A',
                  landProtectedOtherMeans3
                    ? $filters.number(landProtectedOtherMeans3, '0,0')
                    : 'N/A',
                  percentChange(
                    landProtectedOtherMeans1,
                    landProtectedOtherMeans3
                  )
                ]
              }
            ]"
            :column-align="['left', 'right', 'right', 'right', 'right']"
            :column-width="['34%', '18%', '18%', '18%', '12%']"
          />
          <RichText
            v-color:body-2="'black-600'"
            class="mt-4 xl:px-12 text-center"
            size="xsmall"
          >
            <p>
              <strong>Disclaimer:</strong> Land trusts conserve land in many
              different ways and every project is unique. Category totals may
              change depending on how acres are reported by survey respondents
              to reflect the most current data and minimize double-counting. In
              some instances, the total may be greater than the sum of the
              separate categories due to organizations that provided total acres
              not broken down by category.
            </p>
          </RichText>
        </div>
        <LayoutGrid num-columns="3" columns-class="gap-y-24">
          <ItemCard
            v-if="landPercentLandOwnedUnderEasementHeldAccreditedLandTrust"
            icon="hand-holding-seedling"
            label="Percent of Land Owned and Under Easement Held by an Accredited Land Trust"
            :title="landPercentLandOwnedUnderEasementHeldAccreditedLandTrust"
            title-size="large"
            align="center"
            icon-style="circle"
            accent-color="blue"
          >
            <p>Source: 2020 National Land Trust Census</p>
          </ItemCard>
          <ItemCard
            v-if="landTotalPublicFundingConservation19982017"
            icon="landmark-dome"
            label="Total Public Funding for Conservation From 1998-2017"
            :title="landTotalPublicFundingConservation19982017"
            title-size="large"
            align="center"
            icon-style="circle"
            accent-color="yellow"
          >
            <p>Source: Trust for Public Land's Conservation Almanac</p>
          </ItemCard>
          <ItemCard
            v-if="landAcresLandLostDevelopment20122017"
            icon="person-digging"
            label="Acres of Land Lost to Development From 2012-2017"
            :title="landAcresLandLostDevelopment20122017"
            title-size="large"
            align="center"
            icon-style="circle"
            accent-color="orange"
          >
            <p>Source: NRCS - Natural Resources Inventory</p>
          </ItemCard>
        </LayoutGrid>
        <RichText
          v-color:body-2="'black-600'"
          class="mt-12 xl:px-48 text-center"
          size="xsmall"
        >
          <p>
            This information reflects data collected in the National Land Trust
            Census, the longest-running comprehensive survey of private land
            conservation in America.
            <a
              href="https://www.landtrustalliance.org/about/national-land-trust-census"
              target="_blank"
              >Learn more about the Census and see which land trusts
              participated in the 2020 National Land Trust Census.</a
            >
          </p>
        </RichText>
      </LayoutSection>
      <LayoutSection
        v-if="hasMakingADifferenceSection"
        id="making-a-difference"
        top-edge="shadow-top"
      >
        <Heading
          label="Making a Difference"
          :title="makingTitle"
          :description="makingDescription"
          align="center"
        />
        <div
          v-if="facts && facts.length"
          class="grid gap-12 grid-cols-1 lg:grid-cols-12"
        >
          <List class="lg:col-start-3 lg:col-span-8" spacing="loose">
            <ListItem
              v-for="(fact, index) in facts"
              :key="index"
              v-bind="fact"
              :icon="fact.icon || 'circle-check'"
              label=""
            />
          </List>
        </div>
      </LayoutSection>
      <LayoutSection
        v-if="hasLandTrustsSection"
        id="land-trusts"
        background-color="gray"
      >
        <Heading
          :title="
            isNational
              ? 'National Land Trusts'
              : `Land Trusts Working in ${sys.name}`
          "
        >
          <template #description>
            <p>
              Land Trust Alliance member land trusts, listed below, commit to
              adopting Land Trust Standards and Practices as their guiding
              principles.
            </p>
          </template>
        </Heading>
        <LayoutGrid columns-class="gap-y-6">
          <ItemLandTrust
            v-for="(landTrust, index) in landTrusts"
            :key="index"
            type="card-horizontal"
            size="small"
            :source="landTrust"
            :display-acres-protected-in-area="isNational ? undefined : state"
            :display-attributes="false"
          />
        </LayoutGrid>
      </LayoutSection>
      <Next
        :links="[
          {
            title: 'Land conservation in your state.',
            buttonName: 'Gaining Ground',
            link: getSettingLinkUrl('rootGainingGround')
          },
          {
            title: 'Explore land trusts near you.',
            buttonName: 'Explore Land Trusts',
            link: getSettingLinkUrl('rootLandTrust')
          },
          {
            title: 'Make a lasting impact.',
            buttonName: 'Donate',
            link: 'https://donate.lta.org/GainingGround'
          }
        ]"
      />
    </Blocks>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { useSettingsStore } from '@/stores/settings'

export default {
  props: {
    state: String,
    acresProtected: String,
    download: Object,
    communityTitle: String,
    communityDescription: Object,
    communityVisitorsLandTrustProperties: String,
    communityVisitorsLandTrustPropertiesDescription: Object,
    communityPercentLandTrustsThatProvidePublicAccessTheirLands: String,
    communityPercentLandTrustsThatProvidePublicAccessTheirLandsDescription:
      Object,
    communityNumberPeopleServed: String,
    communityNumberPeopleServedDescription: Object,
    communityMilesTrails: String,
    communityMilesTrailsDescription: Object,
    communityMilesUniversalAccess: String,
    communityMilesUniversalAccessDescription: Object,
    communityPercentLandTrustsWhoIncreasedCommunityEngagementLastFiveYears:
      String,
    communityLandTrustsDeepeningRelationships: Array,
    communityLandTrustsHelpingAddressCommunityNeeds: Array,
    demographicsTitle: String,
    demographicsDescription: Object,
    demographicsActiveLandTrusts: String,
    demographicsActiveLandTrustsDescription: Object,
    demographicsAllianceMemberLandTrusts: String,
    demographicsAllianceMemberLandTrustsDescription: Object,
    demographicsAccreditedLandTrusts: String,
    demographicsAccreditedLandTrustsDescription: Object,
    demographicsMembers: String,
    demographicsVolunteers: String,
    demographicsFulltimeStaff: String,
    demographicsParttimeStaff: String,
    demographicsBoardMembers: String,
    demographicsOldest: String,
    demographicsYoungest: String,
    demographicsMedianAge: String,
    demographicsAssociations: Array,
    climateTitle: String,
    climateDescription: Object,
    climatePercentLandTrustsWhoIncreasedClimateChangeLastFiveYears: String,
    climatePercentLandTrustsReceivingFundingAddressClimateChange: String,
    climateSourcesFundingAddressClimateChange: Array,
    landTitle: String,
    landDescription: Object,
    landTableYear1: String,
    landTableYear2: String,
    landTableYear3: String,
    landTotalAcresProtected1: String,
    landTotalAcresProtected2: String,
    landTotalAcresProtected3: String,
    landUnderEasement1: String,
    landUnderEasement2: String,
    landUnderEasement3: String,
    landOwned1: String,
    landOwned2: String,
    landOwned3: String,
    landAcquiredReconveyed1: String,
    landAcquiredReconveyed2: String,
    landAcquiredReconveyed3: String,
    landProtectedOtherMeans1: String,
    landProtectedOtherMeans2: String,
    landProtectedOtherMeans3: String,
    landPercentLandOwnedUnderEasementHeldAccreditedLandTrust: String,
    landTotalPublicFundingConservation19982017: String,
    landAcresLandLostDevelopment20122017: String,
    makingTitle: String,
    makingDescription: Object,
    facts: Array,
    meta: [Object, String],
    sys: Object,
    _editable: String
  },
  async setup(props) {
    const { data: landTrusts } = await useLazyFetch(`/api/land-trusts/state/${props.state}`, {
      server: false
    })
    
    return { landTrusts }
  },
  computed: {
    ...mapState(useSettingsStore, ['getSettingLinkUrl']),
    isNational() {
      return this.state === 'US'
    },
    hasDownload() {
      return typeof this.download === 'object' && this.download.filename
    },
    hasMakingADifferenceSection() {
      return !!(this.facts && this.facts.length)
    },
    hasLandTrustsSection() {
      return !!(this.landTrusts && this.landTrusts.length)
    }
  },
  methods: {
    ageFromYear(year) {
      const currentYear = new Date().getFullYear()
      const age = currentYear - year

      return `${age} year${age === 1 ? '' : 's'} old`
    },
    percentChange(value1, value2) {
      const change = (value2 - value1) / value1

      return isFinite(change) && change > 0
        ? `+${this.$filters.percent(change)}`
        : this.$filters.percent(0)
    }
  }
}
</script>

<style lang="postcss" scoped>
.gaining-ground {
}
</style>
