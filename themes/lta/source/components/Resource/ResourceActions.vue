<template>
  <div class="resource-actions">
    <!-- Condensed view -->
    <template v-if="condensedView">
      <!-- View button -->
      <div class="action">
        <!-- Content link -->
        <template v-if="hasContentLink">
          <!-- External link -->
          <template v-if="contentLinkIsExternal">
            <ButtonComponent
              class="min-w-36"
              :name="`Open ${resourceType.label}`"
              :link="contentLink"
              icon="arrow-up-right-from-square"
              :size="size"
              @click="algoliaSendConversion('External Link Clicked')"
            />
            <div class="action-description">
              On
              <strong>{{ urlHostname(contentLink.url) }}</strong>
            </div>
          </template>
          <!-- Internal link -->
          <ButtonComponent
            v-else-if="contentLinkIsInternal"
            :name="`Open ${resourceType.label}`"
            :link="contentLink"
            icon="arrow-right"
            :size="size"
            @click="algoliaSendConversion('Internal Link Clicked')"
          />
        </template>
        <!-- Internal link -->
        <ButtonComponent
          v-else
          v-tooltip="
            accessIsLimited && !userHasAccess
              ? 'Membership Required'
              : undefined
          "
          class="min-w-36"
          :name="`View ${resourceType.label}`"
          :icon="accessIsLimited && !userHasAccess ? 'lock' : undefined"
          :link="link"
          :size="size"
          @click="algoliaSendConversion('View Clicked')"
        />
      </div>
      <template v-if="accessIsLimited && !userHasAccess"></template>
      <template v-else>
        <!-- Registrations -->
        <template v-if="hasRegistrations">
          <template v-for="(registration, index) in registrations" :key="index">
            <!-- Purchased registration -->
            <Notice
              v-if="userHasRegistration(registration.salesforceId)"
              :key="index"
              icon="circle-check"
              :size="size"
              :display-inline="true"
            >
              Registered
            </Notice>
            <!-- Not purchased registration -->
            <div
              v-else-if="
                !startOrEndDateIsPast &&
                registration.open &&
                registrationUrl(registration.salesforceId)
              "
              class="action"
            >
              <!-- Pricing -->
              <ResourcePricing
                class="action-description"
                :price="registration.price"
                :price-member="registration.priceMember"
                :format-price="formatPrice"
                :webinar-pass="webinarPass"
                :webinar-pass-label="webinarPassLabel"
              />
            </div>
          </template>
        </template>
        <!-- Products -->
        <template v-if="hasAvailableProducts">
          <template v-for="(product, index) in products" :key="index">
            <!-- Purchased product, included with Webinar Pass, or included with registration -->
            <Notice
              v-if="
                userPurchasedAccessViaWebinarPass ||
                userPurchasedRegistration ||
                userHasProduct(product.salesforceId)
              "
              :key="index"
              icon="circle-check"
              :size="size"
              :display-inline="true"
            >
              <template v-if="userPurchasedAccessViaWebinarPass">Webinar Pass</template>
              <template v-else>Purchased</template>
            </Notice>
            <!-- Not purchased product -->
            <div
              v-else-if="productUrl(product.salesforceId)"
              class="action"
            >
              <!-- Pricing -->
              <ResourcePricing
                class="action-description"
                :price="product.price"
                :price-member="product.priceMember"
                :format-price="formatPrice"
                :webinar-pass="webinarPass"
                :webinar-pass-label="webinarPassLabel"
              />
            </div>
          </template>
        </template>
      </template>
    </template>

    <!-- Expanded view -->
    <template v-else>
      <!-- Membership required message -->
      <template v-if="accessIsLimited && !userHasAccess">
        <Notice
          icon="lock"
          description="Membership required to view this resource."
          >Membership Required</Notice
        >
        <div class="action">
          <ButtonComponent
            v-if="!loggedIn"
            link="/login"
            name="Log In"
            icon="arrow-right"
            :size="size"
            @click.prevent="
              () => {
                algoliaSendClick('Log In Clicked')
                signIn()
              }
            "
          />
          <div class="action-description">
            <ButtonComponent
              v-if="getSettingLinkUrl('rootMembership')"
              :link="getSettingLinkUrl('rootMembership')"
              name="Learn about membership"
              variation="link"
              :size="size"
            />
            <ButtonComponent
              v-if="getSettingLinkUrl('rootDonate')"
              :link="getSettingLinkUrl('rootDonate')"
              name="Become a donor"
              variation="link"
              :size="size"
            />
          </div>
        </div>
      </template>
      <!-- Actions -->
      <template v-else>
        <!-- Registrations -->
        <div v-if="hasRegistrations" class="action-group">
          <template v-for="(registration, index) in registrations" :key="index">
            <!-- Purchased registration -->
            <template v-if="userHasRegistration(registration.salesforceId)">
              <Notice icon="circle-check" :size="size">
                Registered
                <template v-if="registration.salesforceId && userGetRegistrationDate(registration.salesforceId)">
                  on {{ userGetRegistrationDate(registration.salesforceId) }}
                </template>
                <template #footer>
                  <ButtonComponent
                    v-if="
                      registrationUrl(registration.salesforceId) &&
                      !startOrEndDateIsPast
                    "
                    name="Manage registration"
                    :link="registrationUrl(registration.salesforceId)"
                    icon="arrow-up-right-from-square"
                    size="small"
                    variation="link"
                  />
                </template>
              </Notice>
              <div
                v-if="
                  !hasContent &&
                  registration.content &&
                  registration.content.length
                "
                :key="`registration-${index}-content`"
                class="action"
              >
                <ButtonComponent
                  :name="`${resourceType.label} details`"
                  :link="contentAnchorLink"
                  icon="eye"
                  :size="size"
                  @click="algoliaSendClick('Registration View Clicked')"
                />
              </div>
            </template>

            <!-- Registration closed because event has passed -->
            <div v-else-if="startOrEndDateIsPast" class="action">
              <div class="action-description">
                <strong class="text-accent"
                  >Registration for this {{ rootType.label.toLowerCase() }} is
                  closed.</strong
                >
              </div>
              <!-- Keep pricing visible when registration is closed for audit purposes, except when a product is available -->
              <ResourcePricing
                v-if="!hasAvailableProducts"
                class="action-description"
                :price="registration.price"
                :price-member="registration.priceMember"
                :format-price="formatPrice"
                :webinar-pass="webinarPass"
                :webinar-pass-label="webinarPassLabel"
              />
            </div>

            <!-- Registration not open-->
            <div v-else-if="!registration.open" class="action">
              <div class="action-description">
                <strong class="text-accent"
                  >Registration for this {{ rootType.label.toLowerCase() }} is not
                  open.</strong
                >
              </div>
            </div>

            <!-- Not purchased registration -->
            <div
              v-else-if="registrationUrl(registration.salesforceId)"
              class="action"
            >
              <!-- Register button -->
              <ButtonComponent
                :tag="!loggedIn ? 'button' : 'a'"
                name="Register"
                :link="registrationUrl(registration.salesforceId)"
                icon="arrow-up-right-from-square"
                :size="size"
                :disabled="!loggedIn"
                @click="algoliaSendConversion('Register Clicked')"
              />
              <!-- Pricing -->
              <ResourcePricing
                class="action-description"
                :price="registration.price"
                :price-member="registration.priceMember"
                :format-price="formatPrice"
                :webinar-pass="webinarPass"
                :webinar-pass-label="webinarPassLabel"
              />
              <!-- Free for members message -->
              <div
                v-if="
                  !isFree(registration.price) &&
                  isFree(registration.priceMember)
                "
                class="action-description"
              >
                This {{ resourceType.label }} is available
                <strong>free</strong> to Alliance members thanks to the
                generosity of our individual donors.
              </div>
              <!-- Log In / Register buttons -->
              <template v-if="!loggedIn">
                <hr />
                <div class="action-description">
                  <ButtonComponent
                    link="/login"
                    name="Log In to Register"
                    icon="chevron-right"
                    size="small"
                    variation="link"
                    @click.prevent="
                      () => {
                        algoliaSendClick('Log In Clicked')
                        signIn()
                      }
                    "
                  />
                  <div>&mdash; or &mdash;</div>
                  <ButtonComponent
                    link="/signup"
                    name="Create Free Account"
                    icon="chevron-right"
                    size="small"
                    variation="link"
                    @click.prevent="showAccountDialog = true"
                  />
                </div>
              </template>
            </div>
          </template>
        </div>
        <!-- Products -->
        <div v-if="hasAvailableProducts" class="action-group">
          <template v-for="(product, index) in products" :key="index">
            <!-- Purchased product, included with Webinar Pass, or included with registration -->
            <template
              v-if="
                userPurchasedAccessViaWebinarPass ||
                userPurchasedRegistration ||
                userHasProduct(product.salesforceId)
              "
            >
              <template v-if="userPurchasedAccessViaWebinarPass">
                <Notice  v-if="userPurchasedAccessViaWebinarPass" icon="circle-check" :size="size">
                  Webinar Pass
                </Notice>
                <div class="action">
                  <div class="action-description">
                    Access to this {{ resourceType.label.toLowerCase() }} is included with your {{ webinarPassLabel || 'Webinar Pass' }}.
                  </div>
                </div>
              </template>
              <div v-else-if="userPurchasedRegistration" class="action">
                <div class="action-description">
                  <strong class="text-accent">Your registration includes {{ resourceType.label.toLowerCase() }} purchase.</strong>
                  <template v-if="product.priceMember || product.price">
                    <br /><em
                      >Normal price:
                      {{
                        formatPrice(product.priceMember || product.price)
                      }}</em
                    >
                  </template>
                </div>
              </div>
              <Notice v-else icon="circle-check" :size="size">
                Purchased
                <template v-if="product.salesforceId && userGetProductDate(product.salesforceId)">
                  on {{ userGetProductDate(product.salesforceId) }}
                </template>
                <template #footer>
                  <ButtonComponent
                    v-if="productIsRepurchasable(product.salesforceId)"
                    name="Buy again"
                    :link="productUrl(product.salesforceId)"
                    icon="arrow-up-right-from-square"
                    size="small"
                    variation="link"
                  />
                </template>
              </Notice>
              <div
                v-if="product.content && product.content.length"
                :key="`product-${index}-content`"
                class="action"
              >
                <ButtonComponent
                  :name="`View ${resourceType.label}`"
                  :link="contentAnchorLink"
                  icon="eye"
                  :size="size"
                  @click="algoliaSendClick('Product View Clicked')"
                />
              </div>
              <template v-if="product.assets && product.assets.length">
                <div
                  v-for="(asset, assetIndex) in product.assets"
                  :key="`asset-${assetIndex}`"
                  class="action"
                >
                  <ButtonComponent
                    :name="`Download ${asset.title || resourceType.label}`"
                    :link="asset.filename"
                    :icon="assetTypeIcon(asset.filename)"
                    :size="size"
                    :disabled="!asset.filename"
                    download
                    @click="algoliaSendClick('Product Asset Downloaded')"
                  />
                  <div v-if="asset.name" class="action-description">
                    {{ asset.name }}
                  </div>
                </div>
              </template>
            </template>
            <!-- Not purchased product -->
            <div
              v-else-if="productUrl(product.salesforceId)"
              class="action"
            >
              <!-- Buy button -->
              <ButtonComponent
                :tag="!loggedIn ? 'button' : 'a'"
                name="Buy"
                :link="productUrl(product.salesforceId)"
                icon="arrow-up-right-from-square"
                :size="size"
                :disabled="!loggedIn"
                @click="algoliaSendConversion('Buy Clicked')"
              />
              <!-- Pricing -->
              <ResourcePricing
                class="action-description"
                :price="product.price"
                :price-member="product.priceMember"
                :format-price="formatPrice"
                :webinar-pass="webinarPass"
                :webinar-pass-label="webinarPassLabel"
              />
              <!-- Free for members message -->
              <div
                v-if="!isFree(product.price) && isFree(product.priceMember)"
                class="action-description"
              >
                This {{ resourceType.label }} is available
                <strong>free</strong> to Alliance members thanks to the
                generosity of our individual donors.
              </div>
              <!-- Log In / Register buttons -->
              <template v-if="!loggedIn">
                <hr />
                <div class="action-description">
                  <ButtonComponent
                    link="/login"
                    name="Log In to Buy"
                    icon="chevron-right"
                    size="small"
                    variation="link"
                    @click.prevent="
                      () => {
                        algoliaSendClick('Log In Clicked')
                        signIn()
                      }
                    "
                  />
                  <div>&mdash; or &mdash;</div>
                  <ButtonComponent
                    link="/signup"
                    name="Create Free Account"
                    icon="chevron-right"
                    size="small"
                    variation="link"
                    @click.prevent="showAccountDialog = true"
                  />
                </div>
              </template>
            </div>
            <div v-else class="action">
              <div class="action-description">
                <strong class="text-accent">Currently not available for purchase.</strong>
              </div>
            </div>
          </template>
        </div>

        <!-- Content link button -->
        <div v-else-if="hasContentLink" class="action">
          <!-- External link -->
          <template v-if="contentLinkIsExternal">
            <ButtonComponent
              :name="`Open ${resourceType.label}`"
              :link="contentLink"
              icon="arrow-up-right-from-square"
              :size="size"
              @click="algoliaSendConversion('External Link Clicked')"
            />
            <div class="action-description">
              Resource is on
              <strong>{{ urlHostname(contentLink.url) }}</strong>
            </div>
          </template>
          <!-- Internal link -->
          <ButtonComponent
            v-else-if="contentLinkIsInternal"
            :name="`Open ${resourceType.label}`"
            :link="contentLink"
            icon="arrow-right"
            :size="size"
            @click="algoliaSendConversion('Internal Link Clicked')"
          />
        </div>

        <!-- Jump to content button -->
        <div v-else-if="hasContent || hasContentAssetsPDF" class="action">
          <ButtonComponent
            :name="
              isEvent || isWebinar
                ? `${resourceType.label} details`
                : `View ${resourceType.label}`
            "
            :link="contentAnchorLink"
            icon="arrow-turn-down"
            :size="size"
            @click="algoliaSendConversion('View Clicked')"
          />
        </div>
        <slot />
        <transition name="fade">
          <Overlay
            v-if="showAccountDialog"
            :active="showAccountDialog"
            @close="showAccountDialog = false"
          >
            <Dialog
              title="Create your account"
              @close="showAccountDialog = false"
            >
              <RichText>
                <p><strong>PLEASE NOTE:</strong> Land Trust Alliance members and non-members can create an account to register for events, purchase publications and more.</p>
                <p>If your organization has an active membership, you'll be able to search for it to link your account with your organization.</p>
                <p>
                  Not a member?
                  <NuxtLink :to="getSettingLinkUrl('rootMembershipApply')"
                    >Learn more about membership benefits.</NuxtLink
                  >
                  If you are not a member, you still need to create an account
                  to make a purchase.
                </p>
                <p>Please email <a href="mailto:loginhelp@lta.org">loginhelp@lta.org</a> with any questions.</p>
                <Notice :display-inline="true">
                  After creating your account, return to this window and log in
                  with your new account information.
                </Notice>
              </RichText>
              <template #footer>
                <ButtonComponent
                  link="/signup"
                  name="Continue"
                  icon="arrow-up-right-from-square"
                  :open-in-new-window="true"
                  @click="
                    () => {
                      algoliaSendClick('Create Account Clicked')
                      showAccountDialog = false
                      showLogInDialog = true
                    }
                  "
                />
              </template>
            </Dialog>
          </Overlay>
        </transition>
        <transition name="fade">
          <Overlay
            v-if="showLogInDialog"
            :active="showLogInDialog"
            @close="showLogInDialog = false"
          >
            <Dialog title="Log in" @close="showLogInDialog = false">
              <RichText>
                <p>
                  After creating your account, click the
                  <strong>Log In</strong> button below.
                </p>
                <h6>Having trouble?</h6>
                <p>
                  If you're having trouble creating an account or logging in,
                  please
                  <NuxtLink :to="getSettingLinkUrl('rootContact')"
                    >contact us</NuxtLink
                  >.
                </p>
              </RichText>
              <template #footer>
                <ButtonComponent
                  link="/login"
                  name="Log In"
                  icon="arrow-right"
                  @click="
                    () => {
                      algoliaSendClick('Log In Clicked')
                      signIn()
                    }
                  "
                />
              </template>
            </Dialog>
          </Overlay>
        </transition>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { type ResourceProps, types } from '~/composables/content-types/useResource'
import { useSettingsStore } from '~/stores/settings'

const props = withDefaults(defineProps<ResourceProps & {
  size?: 'small'
}>(), {
  type: types.DOCUMENT.key
})
const attrs = useAttrs()
const emit = defineEmits(['algolia-send-event'])

const route = useRoute()

const { loggedIn, user, signIn } = useLtaAuth()

const {
  hasProduct: userHasProduct,
  getProduct: userGetProduct,
  getProductDate: userGetProductDate,
  hasRegistration: userHasRegistration,
  getRegistration: userGetRegistration,
  getRegistrationDate: userGetRegistrationDate
} = useUser(user.value)

const {
  accessIsLimited,
  userHasAccess
} = useAccess({ access: props.access, accessGroups: props.accessGroups }, user.value)

const {
  webinarPass,

  // Computed
  rootType,
  resourceType,
  isEvent,
  isWebinar,
  hasContent,
  hasContentLink,
  hasContentAssetsPDF,
  hasRegistrations,
  hasAvailableProducts,
  userPurchasedAccessViaWebinarPass,
  userPurchasedRegistration,
  contentLinkIsExternal,
  contentLinkIsInternal,
  link,
  startOrEndDateIsPast,
  webinarPassLabel,

  // Functions
  assetTypeIcon,
  urlHostname,
  registrationUrl,
  productUrl,
  productIsRepurchasable,
  isFree,
  formatPrice,
  algoliaSendClick,
  algoliaSendConversion
} = useResource(props, { attrs, emit })

const { getSettingLinkUrl } = storeToRefs(useSettingsStore())

const showAccountDialog = ref(false)
const showLogInDialog = ref(false)

const condensedView = computed(() => {
  return props.size === 'small'
})

const expandedView = computed(() => {
  return props.size !== 'small'
})

const contentAnchorLink = computed(() => {
  return route.path === link.value
    ? '#content'
    : `${link.value}#content`
})
</script>
