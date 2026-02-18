<template>
  <footer id="footer" v-editable="$props" class="site-footer">
    <div class="container">
      <div class="main">
        <Item title="Connect with Us" icon="compass" body-size="small">
          <p>1250 H Street NW, Suite 600<br />Washington, DC 20005</p>
          <p>
            <a href="/about/connect-with-us/">Contact us</a>
            • <a href="mailto:info@lta.org">info@lta.org</a> • 202-638-4725
          </p>
          <Socials
            class="text-lg mt-4"
            :social-links="[
              'https://facebook.com/landtrustalliance',
              'https://twitter.com/ltalliance',
              'https://linkedin.com/company/land-trust-alliance',
              'https://youtube.com/user/LandTrustAlliance',
              'https://instagram.com/ltalliance'
            ]"
          />
        </Item>
        <Item
          title="Save the land"
          icon="hand-holding-seedling"
          body-size="small"
        >
          <p>
            When you support the Land Trust Alliance, your contribution helps to
            save more of the land you love.
          </p>
          <ButtonComponent
            name="Donate"
            link="https://gaininggroundusa.donorsupport.co/-/XXYZQDKS"
            icon="arrow-right"
          />
        </Item>
        <Item title="Subscribe" icon="envelope" body-size="small">
          <p>
            Learn how you can help land trusts gain ground — sign up for our
            newsletter.
          </p>
          <Form
            ref="formSubscribe"
            class="form-subscribe"
            page="/about/connect-with-us"
            :content="[
              {
                component: 'FormField',
                inputs: [
                  {
                    component: 'FormText',
                    type: 'email',
                    name: 'email',
                    placeholder: 'Email address…',
                    required: true,
                    rules: 'email'
                  },
                  {
                    component: 'FormSubmit',
                    icon: 'arrow-right'
                  }
                ],
                inputsInline: true
              }
            ]"
          />
        </Item>
      </div>

      <ul
        v-if="showMenuPrimary && menuPrimary && menuPrimary.length"
        class="menu-primary"
      >
        <li v-for="menuItem in menuPrimary" :key="menuItem._uid">
          <Menu
            :title="menuItem.name"
            :title-link="menuItem.link"
            :items="getMenuItems(menuItem.menu)"
            :tight="true"
          />
        </li>
      </ul>

      <div v-if="relatedSites && relatedSites.length" class="related-sites">
        <div class="title">Related Websites</div>
        <LogoGrid
          v-for="(relatedSite, index) in relatedSites"
          :key="index"
          v-bind="relatedSite"
        />
      </div>

      <div v-if="noticeIsValid" class="notice">
        <RichText :document="notice" />
      </div>

      <div class="footer">
        <div class="copyright">
          &copy; 2017–{{ new Date().getFullYear() }} Land Trust Alliance, Inc.
          All rights reserved.
        </div>
        <ul v-if="menuSecondary && menuSecondary.length" class="menu-secondary">
          <li v-for="menuItem in menuSecondary" :key="menuItem._uid">
            <LinkComponent :link="menuItem.link" :name="menuItem.name" />
          </li>
        </ul>
      </div>
    </div>
  </footer>
</template>

<script>
import { documentIsValid } from '@/components/RichText'

export default {
  props: {
    menuPrimary: Array,
    showMenuPrimary: Boolean,
    menuSecondary: Array,
    relatedSites: Array,
    notice: Object,
    _editable: String
  },
  computed: {
    noticeIsValid() {
      return documentIsValid(this.notice)
    }
  },
  methods: {
    getMenuItems(menus = []) {
      return menus.map((menu) => {
        const { isValid } = useLinkHelper(menu.titleLink)

        return {
          name: menu.title || menu.root?.name,
          link:
            (isValid.value && menu.titleLink) ||
            (menu.root?.full_slug && `/${menu.root?.full_slug}`)
        }
      })
    }
  }
}
</script>

<style lang="postcss" scoped>
.site-footer {
  --color-heading: theme('colors.white.DEFAULT');
  --color-body: theme('colors.white.DEFAULT');
  --color-body-2: theme('colors.white.700');
  --color-body-3: theme('colors.white.700');
  --color-line: theme('colors.white.200');
  @apply pt-24 pb-12 border-t bg-black;
}

.main {
  @apply grid gap-12 grid-cols-1 md:grid-cols-3 pb-18;

  :deep(.form-subscribe) {
    .form-field {
      .field {
        @apply flex;

        .inputs {
          @apply flex-1 flex-row gap-0;

          .form-text {
            @apply rounded-r-none border-none;
          }

          .form-submit {
            @apply grow-0 rounded-l-none m-0;
            flex-basis: theme('width.14');

            .name {
              @apply hidden;
            }
          }
        }
      }
    }
  }
}

.menu-primary {
  @apply grid gap-12 lg:grid-flow-col lg:auto-cols-fr pb-18;

  .items {
    @apply leading-normal;
  }
}

.related-sites {
  @apply relative py-8 text-body-2 text-sm text-center border-t border-line;

  .title {
    @apply absolute block left-1/2 whitespace-nowrap -translate-x-1/2 -top-3 py-1 px-4 text-2xs uppercase font-bold tracking-wide text-white-300 bg-black;
  }

  a {
    @apply transition-opacity hover:opacity-60;
  }
}

.notice {
  :deep(.rich-text) {
    @apply flex flex-wrap gap-3 items-center justify-center py-6 text-body-2 text-sm text-center border-t border-line;

    .button {
      @apply -mt-px;
    }
  }
}

.footer {
  @apply flex flex-col flex-wrap gap-4 items-center justify-center pt-12 text-body-2 text-sm text-center border-t border-line lg:flex-row;

  .copyright {
  }

  a {
    @apply text-body hover:text-accent;
  }

  .menu-secondary {
    @apply flex flex-wrap items-center gap-4;

    &:before {
      @apply lg:content-['•'];
    }
  }
}
</style>
