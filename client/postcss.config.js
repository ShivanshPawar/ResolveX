import autoprefixer from 'autoprefixer'
import tailwindcss from 'tailwindcss'
import resolveXCssCompat from './postcss.compat.js'

export default {
  plugins: [tailwindcss(), autoprefixer(), resolveXCssCompat()],
}
