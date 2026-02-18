var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key2, value) => key2 in obj ? __defProp(obj, key2, { enumerable: true, configurable: true, writable: true, value }) : obj[key2] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __objRest = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};
import { h, resolveDynamicComponent, isVNode, createTextVNode, defineComponent, inject } from "vue";
import { NodeTypes, LinkTypes, isTextNode, isBlockNode, isComponentNode } from "@marvr/storyblok-rich-text-types";
const componentResolvers = {
  button1: ({ _uid, id, component, fields }) => h("div", { _uid, id, component }, fields.title)
};
const defaultResolvers = {
  [NodeTypes.DOCUMENT]: ({ children }) => children,
  [NodeTypes.HEADING]: ({ children, attrs }) => h(`h${attrs.level}`, children),
  [NodeTypes.PARAGRAPH]: ({ children }) => h("p", children),
  [NodeTypes.QUOTE]: ({ children }) => h("blockquote", children),
  [NodeTypes.OL_LIST]: ({ children }) => h("ol", children),
  [NodeTypes.UL_LIST]: ({ children }) => h("ul", children),
  [NodeTypes.LIST_ITEM]: ({ children }) => h("li", children),
  [NodeTypes.CODE_BLOCK]: ({ children, attrs }) => h("pre", attrs, children),
  [NodeTypes.HR]: () => h("hr"),
  [NodeTypes.BR]: () => h("br"),
  [NodeTypes.IMAGE]: ({ attrs }) => h("img", attrs),
  [NodeTypes.EMOJI]: ({ attrs }) => {
    const props = {
      "data-type": "emoji",
      "data-name": attrs.name,
      emoji: attrs.emoji
    };
    const fallbackProps = {
      src: attrs.fallbackImage,
      draggable: "false",
      loading: "lazy",
      align: "absmiddle",
      alt: attrs.name,
      style: `height: 1em; width: 1em;`,
      height: 16,
      width: 16
    };
    const fallback = h("img", fallbackProps);
    return h("span", props, attrs.emoji || fallback);
  },
  [NodeTypes.BOLD]: ({ text }) => h("b", text),
  [NodeTypes.STRONG]: ({ text }) => h("strong", text),
  [NodeTypes.STRIKE]: ({ text }) => h("s", text),
  [NodeTypes.UNDERLINE]: ({ text }) => h("u", text),
  [NodeTypes.ITALIC]: ({ text }) => h("i", text),
  [NodeTypes.CODE]: ({ text }) => h("code", text),
  [NodeTypes.LINK]: ({ text, attrs }) => {
    let href = "";
    switch (attrs.linktype) {
      case LinkTypes.ASSET:
      case LinkTypes.URL:
        href = attrs.href;
        break;
      case LinkTypes.EMAIL:
        href = `mailto:${attrs.href}`;
        break;
      case LinkTypes.STORY: {
        const RouterLink = getRouterLinkComponent();
        if (!RouterLink)
          return h("a", { href, target: attrs.target }, text);
        return h(RouterLink, { to: attrs.href, target: attrs.target }, { default: () => text });
      }
    }
    return h("a", { href: href || attrs.href, target: attrs.target }, text);
  },
  [NodeTypes.ANCHOR]: ({ text, attrs }) => h("span", attrs, text),
  [NodeTypes.SUPERSCRIPT]: ({ text }) => h("sup", text),
  [NodeTypes.SUBSCRIPT]: ({ text }) => h("sub", text),
  [NodeTypes.STYLED]: ({ text, attrs }) => h("span", attrs, text),
  [NodeTypes.TEXT_STYLE]: ({ text, attrs }) => h("span", { style: attrs.color ? `color: ${attrs.color};` : void 0 }, text),
  [NodeTypes.HIGHLIGHT]: ({ text, attrs }) => h("mark", {
    style: attrs.color ? `background-color: ${attrs.color};` : void 0
  }, text),
  [NodeTypes.COMPONENT]: () => h("div", "fallback: component is not handled")
};
function getRouterLinkComponent() {
  const component = resolveDynamicComponent("RouterLink");
  return typeof component === "string" ? false : component;
}
function createRenderer(options) {
  const {
    resolvers = (options == null ? void 0 : options.resolvers) || __spreadProps(__spreadValues({}, defaultResolvers), { components: {} }),
    omitParagraphInListItems = false
  } = options || {};
  const renderNode = (node) => {
    if (isTextNode(node)) {
      if (!node.marks)
        return renderTextNode(node);
      return node.marks.reduce((text, mark) => renderMarkNode(mark, text), renderTextNode(node));
    } else if (isBlockNode(node)) {
      return renderBlockNode(node);
    } else if (isComponentNode(node)) {
      return renderComponentNode(node);
    }
    return h("span", `fallback: the node "${node.type}" is not handled`);
  };
  const renderNodeList = (nodes) => {
    const nodeList = [];
    nodes.forEach((node) => {
      const renderedNode = renderNode(node);
      if (Array.isArray(renderedNode)) {
        renderedNode.forEach((childNode) => {
          nodeList.push(childNode);
        });
      } else {
        nodeList.push(renderedNode);
      }
    });
    return nodeList;
  };
  function renderBlockNode(node) {
    switch (node.type) {
      case NodeTypes.DOCUMENT:
      case NodeTypes.PARAGRAPH:
      case NodeTypes.QUOTE:
      case NodeTypes.UL_LIST:
      case NodeTypes.LIST_ITEM:
        return resolveBlockNodeWithContent(node);
      case NodeTypes.HEADING:
      case NodeTypes.OL_LIST:
      case NodeTypes.CODE_BLOCK:
        return resolveBlockNodeWithContentAndAttributes(node);
      case NodeTypes.HR:
      case NodeTypes.BR:
        return resolveBlockNodeWithoutOptions(node);
      case NodeTypes.IMAGE:
      case NodeTypes.EMOJI:
        return resolveBlockNodeWithAttributes(node);
      default:
        return h("span", `fallback: block "${node.type}" is not handled`);
    }
  }
  function renderMarkNode(node, text) {
    switch (node.type) {
      case NodeTypes.BOLD:
      case NodeTypes.STRONG:
      case NodeTypes.STRIKE:
      case NodeTypes.UNDERLINE:
      case NodeTypes.ITALIC:
      case NodeTypes.CODE:
      case NodeTypes.SUPERSCRIPT:
      case NodeTypes.SUBSCRIPT:
        return resolveMarkNode(node, text);
      case NodeTypes.LINK:
      case NodeTypes.ANCHOR:
      case NodeTypes.STYLED:
      case NodeTypes.TEXT_STYLE:
      case NodeTypes.HIGHLIGHT:
        return resolveMarkNodeWithAttributes(node, text);
      default:
        return h("span", `fallback: the mark "${node.type}" is not handled`);
    }
  }
  function renderComponentNode(node) {
    const components = [];
    node.attrs.body.forEach((body) => {
      const { component } = body;
      const resolver = resolvers.components[component];
      if (resolver) {
        components.push(h(resolver, body));
      } else {
        components.push(resolvers[NodeTypes.COMPONENT]());
      }
    });
    return components;
  }
  function renderTextNode(node) {
    return createTextVNode(node.text);
  }
  const renderChildren = (node) => node.content && node.content.length ? renderNodeList(node.content) : [];
  function resolveBlockNodeWithContent(node) {
    const resolver = resolvers[node.type];
    let children = renderChildren(node);
    if (omitParagraphInListItems && node.type === NodeTypes.LIST_ITEM && node.content.length === 1 && node.content[0].content) {
      children = renderNodeList(node.content[0].content);
    }
    if (isComponentResolver(resolver))
      return h(resolver, null, { default: () => children });
    return resolver({ children });
  }
  function resolveBlockNodeWithAttributes(node) {
    const resolver = resolvers[node.type];
    if (isComponentResolver(resolver))
      return h(resolver, node.attrs);
    return resolver({ attrs: node.attrs });
  }
  function resolveBlockNodeWithContentAndAttributes(node) {
    const resolver = resolvers[node.type];
    const children = renderChildren(node);
    if (isComponentResolver(resolver))
      return h(resolver, node.attrs, { default: () => children });
    return resolver({
      children,
      attrs: node.attrs
    });
  }
  function resolveBlockNodeWithoutOptions(node) {
    const resolver = resolvers[node.type];
    if (isComponentResolver(resolver))
      return h(resolver);
    return resolver();
  }
  function resolveMarkNode(node, text) {
    const resolver = resolvers[node.type];
    if (isComponentResolver(resolver))
      return h(resolver, { default: () => text });
    return resolver({ text });
  }
  function resolveMarkNodeWithAttributes(node, text) {
    const resolver = resolvers[node.type];
    if (isComponentResolver(resolver))
      return h(resolver, node.attrs, { default: () => text });
    return resolver({ text, attrs: node.attrs });
  }
  const renderDocument = (node) => {
    if (Array.isArray(node))
      return renderNodeList(node);
    return renderNode(node);
  };
  return { renderDocument };
}
function isComponentResolver(resolver) {
  return typeof resolver !== "function" && !isVNode(resolver);
}
var RichTextRenderer = defineComponent({
  name: "RichTextRenderer",
  props: {
    document: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const renderer = useRenderer();
    return () => renderer.renderDocument(props.document);
  }
});
const key = Symbol("Rich Text Renderer");
const plugin = (options) => ({
  install(app) {
    const renderer = createRenderer(options);
    app.provide(key, renderer);
  }
});
function useRenderer() {
  const renderer = inject(key);
  if (!renderer)
    throw new Error("Rich Text Renderer not provided.");
  return renderer;
}
function defineResolvers(resolvers) {
  const _a = resolvers, { components = {} } = _a, rest = __objRest(_a, ["components"]);
  return __spreadValues(__spreadProps(__spreadValues({}, defaultResolvers), { components }), rest);
}
export { RichTextRenderer, componentResolvers, createRenderer, defaultResolvers, defineResolvers, getRouterLinkComponent, isComponentResolver, plugin, useRenderer };
