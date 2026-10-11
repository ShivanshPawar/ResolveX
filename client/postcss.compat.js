function hasDeclaration(rule, property) {
  return rule.nodes?.some((node) => node.type === 'decl' && node.prop === property)
}

function appendStandardDeclaration(rule, prefixedProperty, standardProperty) {
  if (hasDeclaration(rule, standardProperty)) return

  const prefixedDeclaration = rule.nodes?.find(
    (node) => node.type === 'decl' && node.prop === prefixedProperty,
  )

  prefixedDeclaration?.cloneAfter({
    prop: standardProperty,
    value: prefixedDeclaration.value,
  })
}

export default function resolveXCssCompat() {
  return {
    postcssPlugin: 'resolvex-css-compat',
    Rule(rule) {
      appendStandardDeclaration(rule, '-webkit-transform', 'transform')
      appendStandardDeclaration(rule, '-webkit-transform-origin', 'transform-origin')
      appendStandardDeclaration(rule, '-webkit-appearance', 'appearance')
      appendStandardDeclaration(rule, '-webkit-user-select', 'user-select')
      appendStandardDeclaration(rule, '-moz-user-select', 'user-select')
      appendStandardDeclaration(rule, '-ms-user-select', 'user-select')
      appendStandardDeclaration(rule, '-webkit-line-clamp', 'line-clamp')
      appendStandardDeclaration(rule, '-ms-zoom', 'zoom')

      const hasBlockDisplay = rule.nodes?.some(
        (node) => node.type === 'decl' && node.prop === 'display' && node.value === 'block',
      )

      if (hasBlockDisplay) {
        rule.nodes
          ?.filter(
            (node) =>
              node.type === 'decl' && node.prop === 'vertical-align' && node.value === 'middle',
          )
          .forEach((node) => node.remove())
      }
    },
  }
}

resolveXCssCompat.postcss = true
