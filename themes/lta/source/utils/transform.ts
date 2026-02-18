/**
 * Transform functions to convert data from one format to another.
 * 
 * Note: Not sure if this is where these will ultimately live — maybe a
 * composable? — but for now, this is where they are. Needed a place that
 * did not have other dependencies like the current mixins because they will be
 * used on the server and app side.
 */

import * as transfrom from './transform/index'

export default transfrom
