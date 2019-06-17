/*!
 * @copyright See AUTHORS.txt
 * @license GPL-2.0-or-later
 */
( function () {
	'use strict';

	/**
	 * Get the list of target languages that should be suggested to the current user:
	 * - The MediaWiki user interface language.
	 * - Accept-Language.
	 * - Browser interface language.
	 *
	 * @return {string[]} target languages
	 */
	function getSuggestedTargetLanguages() {
		var splitCode, splitCodes, specialCodeIndex,
			possibleTargetLanguages = [],
			pageLanguage = mw.config.get( 'wgPageContentLanguage' ).split( '-' )[ 0 ];

		possibleTargetLanguages.push( mw.config.get( 'wgUserLanguage' ) );
		possibleTargetLanguages.push( mw.uls.getBrowserLanguage() );

		Array.prototype.push.apply( possibleTargetLanguages, mw.uls.getAcceptLanguageList() );
		Array.prototype.push.apply( possibleTargetLanguages, mw.uls.getPreviousLanguages() );

		// Language codes can have country extensions like en-US.
		// Remove them so that it is like domain code format.
		possibleTargetLanguages = possibleTargetLanguages.map( function ( language ) {
			return language.split( '-' )[ 0 ];
		} );

		// Replace possibly non-standard, macro and duplicate language codes
		// with normalized counterparts
		splitCodes = {
			// Suggest both varieties of Belarusian when requesting 'be'
			be: [ 'be', 'be-tarask' ],
			// Suggest both varieties of Norwegian when requesting 'no'
			no: [ 'nb', 'nn' ]
		};

		for ( splitCode in splitCodes ) {
			specialCodeIndex = possibleTargetLanguages.indexOf( splitCode );
			if ( specialCodeIndex > -1 ) {
				possibleTargetLanguages.splice( specialCodeIndex, 1 );
				Array.prototype.push.apply( possibleTargetLanguages, splitCodes[ splitCode ] );
			}
		}

		return possibleTargetLanguages.filter( function ( language ) {
			return language !== pageLanguage;
		} );
	}

	/**
	 * Checks if there is a page in the target language.
	 *
	 * @param {string} code
	 * @return {boolean}
	 */
	function pageInLanguageExists( code ) {
		var domainCode = mw.cx.siteMapper.getWikiDomainCode( code );
		return $( 'li.interlanguage-link.interwiki-' + domainCode ).length === 1;
	}

	function prepareCXInterLanguageLinks( suggestedTargetLanguages ) {
		var $newItem, $pLangList,
			count = 0,
			maxListSize = 3;

		// Remove duplicates
		suggestedTargetLanguages = mw.cx.unique( suggestedTargetLanguages );
		$pLangList = $( '#p-lang ul' );
		suggestedTargetLanguages.some( function ( code ) {
			// Code should not be a language in which page exists.
			// Also it should be a known language for ULS.
			if ( !pageInLanguageExists( code ) && code !== $.uls.data.getAutonym( code ) ) {
				$newItem = mw.cx.createCXInterlanguageItem( code );
				$pLangList.prepend( $newItem );
				// Array.prototype.some breaks the iteration first time `true` is returned
				return ++count === maxListSize;
			}
		} );
	}

	function init() {
		var suggestedTargetLanguages = getSuggestedTargetLanguages();

		if ( !suggestedTargetLanguages.length ) {
			return;
		}

		mw.loader.using( 'ext.cx.interlanguagelink' ).then( function () {
			mw.cx.siteMapper = new mw.cx.SiteMapper( mw.config.get( 'wgContentTranslationSiteTemplates' ) );
			prepareCXInterLanguageLinks( suggestedTargetLanguages );
		} );
	}

	// Early execute of init
	if ( document.readyState === 'interactive' ) {
		init();
	} else {
		$( init );
	}
}() );