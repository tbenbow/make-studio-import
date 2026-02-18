<template>
  <div class="account">
    <section v-if="user?.profile" class="account-profile">
      <Content position="right">
        <template #sidebar>
          <Heading title="Personal Account" title-tag="h4" description-size="small">
            <template #description>
              <p>
                To make changes to your personal account details, including your
                Land Trust Alliance email preferences, click
                <em>Manage Profile</em>.
              </p>
              <ButtonComponent
                class="!mt-0"
                v-if="user.profile.url"
                :link="user.profile.url"
                name="Manage Profile"
                icon="arrow-up-right-from-square"
                size="small"
              />
            </template>
          </Heading>
        </template>
        <div>
          <div class="space-y-8 lg:pt-2">
            <Field icon="user" label="Name" :display-inline="true">
              {{ user.profile.name }}
            </Field>
            <Field v-if="user.profile.nickname" icon="face-smile" label="Informal Name" :display-inline="true">
              {{ user.profile.nickname }}
            </Field>
            <Field icon="envelope" label="Email" :display-inline="true">
              {{ user.profile.email }}<template v-if="user.profile.emailType"> ({{ user.profile.emailType }})</template>
            </Field>
            <Field icon="phone" label="Phone" :display-inline="true">
              <template v-if="user.profile.phone">
                {{ user.profile.phone }}<template v-if="user.profile.phoneType"> ({{ user.profile.phoneType }})</template>
              </template>
              <template v-else>—</template>
            </Field>
          </div>
        </div>
      </Content>
    </section>
    <section v-if="user?.organization" class="account-organization">
      <Content class="pt-12 border-t border-t-line" position="right">
        <template #sidebar>
          <Heading
            title="Organization Account"
            title-tag="h4"
            description-size="small"
          >
            <template #description>
              <template v-if="user.organization.userIsAdmin">
                <p>
                  To make changes to your organization, including adding, updating or removing volunteers, staff or board members, click <em>Manage Organization</em>.
                </p>
                <ButtonComponent
                  class="!mt-0 !mb-8"
                  :link="user.organization.url"
                  name="Manage Organization"
                  icon="arrow-up-right-from-square"
                  size="small"
                />
                <p>
                  To learn more about or renew your organization's membership, click <em>Manage Membership</em>.
                </p>
                <ButtonComponent
                  class="!mt-0"
                  :link="user.organization.membershipUrl"
                  name="Manage Membership"
                  icon="arrow-up-right-from-square"
                  size="small"
                />
              </template>
              <template v-else>
                <p>
                  To make changes to your organization, contact your administrator.
                </p>
              </template>
            </template>
          </Heading>
        </template>
        <div>
          <div class="space-y-8 lg:pt-2">
            <Field
              v-if="user.organization.name"
              icon="building"
              label="Organization Name"
              :display-inline="true"
            >
              {{ user.organization.name }}
            </Field>
            <Field
              v-if="user.organization.membershipType"
              icon="id-card"
              :label="`Organization Membership${user.organization.membershipStatus ? ` (Status: ${user.organization.membershipStatus})` : ''}`"
              :display-inline="true"
            >
              {{ user.organization.membershipType }}<br>
              <small v-if="user.organization.membershipExpiration">Expires {{ user.organization.membershipExpiration }}</small>
            </Field>
            <Field
              v-if="user.organization.administrators"
              icon="user"
              label="Organization Administrator(s)"
              :display-inline="true"
            >
              {{ user.organization.administrators }}
            </Field>
            <Field
              v-if="user.organization.region"
              icon="map"
              label="Organization Land Trust Alliance Region"
              :display-inline="true"
            >
              {{ user.organization.region }}
            </Field>
            <Field
              v-if="user.organization.accreditationExpiration"
              icon="accredited"
              label="Land Trust Accreditation Expiration Date"
              :display-inline="true"
            >
              {{ user.organization.accreditationExpiration }}
            </Field>
            <template v-if="user.organization.lastTerrafirmaPolicyYear">
              <Field
                icon="calendar"
                label="Last Terrafirma Policy Year"
                :display-inline="true"
              >
                {{ user.organization.lastTerrafirmaPolicyYear }}
              </Field>
              <Field
                v-if="user.organization.terrafirmaRegion"
                icon="map"
                label="Organization Terrafirma Region"
                :display-inline="true"
              >
                {{ user.organization.terrafirmaRegion }}
              </Field>
            </template>
          </div>
        </div>
      </Content>
    </section>
  </div>
</template>

<script>
export default {
  setup() {
    const { user } = useLtaAuth()

    return {
      user
    }
  },
  head() {
    return {
      title: 'Profile'
    }
  }
}
</script>

<style lang="postcss" scoped>
.account {
  @apply space-y-12;
}
</style>
