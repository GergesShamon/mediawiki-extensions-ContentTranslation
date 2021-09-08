/*!
 * ContentTranslation extension
 * A tool that allows editors to translate pages from one language
 * to another with the help of machine translation and other translation
 *
 * @copyright See AUTHORS.txt
 * @license GPL-2.0-or-later
 */
( function () {
	'use strict';

	/**
	 * Detect if the browser supports position: sticky
	 * Support: IE, Edge<16, Chrome<56, Firefox<32, Safari<6.1
	 *
	 * @return {boolean} True if browser supports position: sticky
	 */
	mw.cx.supportsSticky = function () {
		var style = document.createElement( 'div' ).style;
		style.cssText = 'position:-webkit-sticky;position:sticky;';
		return style.position.indexOf( 'sticky' ) !== -1;
	};

}() );
