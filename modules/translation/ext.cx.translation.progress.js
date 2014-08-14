/**
 * ContentTranslation - Calculate the progress
 * A tool that allows editors to translate pages from one language
 * to another with the help of machine translation and other translation tools
 *
 * @file
 * @ingroup Extensions
 * @copyright See AUTHORS.txt
 * @license GPL-2.0+
 */
( function ( $, mw ) {
	'use strict';

	var totalSourceWeight = 0,
		translationThreshold = 0.05;

	/**
	 * Get the total source weight.
	 * This is only calculated once per session and cached, because the source doesn't change.
	 * @return {int} Total source weight
	 */
	function getTotalSourceWeight() {
		var $sourceContainer, $sections;

		// Return the cached value
		if ( totalSourceWeight ) {
			return totalSourceWeight;
		}

		$sourceContainer = $( '.cx-column--source .cx-column__content' );
		$sections = $sourceContainer.children( mw.cx.getSectionSelector() );

		$sections.each( function () {
			totalSourceWeight += $( this ).text().length;
		} );

		return totalSourceWeight;
	}

	/**
	 * Calculate the translation progress.
	 */
	function showProgress() {
		var percentage = getTranslationProgress(),
			mtPercentage = getMachineTranslationPercentage();

		mw.hook( 'mw.cx.progress' ).fire( percentage, mtPercentage );
	}

	/**
	 * Calculate the percentage of machine translation.
	 * @return {float} percentage
	 */
	function getMachineTranslationPercentage() {
		var sourceWeight, percentage, completedTranslation;

		sourceWeight = getTotalSourceWeight();
		if ( sourceWeight === 0 ) {
			return 0;
		}

		completedTranslation = 0;

		// Sum the weight of all translated sections that have machine-translated text
		$( '.cx-column--translation [data-cx-weight]' ).each( function () {
			var $section = $( this );

			if ( $section.data( 'cx-mt' ) === true ) {
				completedTranslation += $section.data( 'cx-weight' );
			}
		} );

		percentage = ( completedTranslation / sourceWeight ) * 100;

		return percentage;
	}

	/**
	 * Calculate the translation progress.
	 * @return {float} percentage
	 */
	function getTranslationProgress() {
		var sourceWeight, percentage, completedTranslation;

		sourceWeight = getTotalSourceWeight();
		if ( sourceWeight === 0 ) {
			return 0;
		}

		completedTranslation = 0;

		// Sum the weight of all translated sections that have any text
		$( '.cx-column--translation [data-cx-weight]' ).each( function () {
			var $section = $( this );

			if ( $section.data( 'cx-mt' ) === false ) {
				completedTranslation += $section.data( 'cx-weight' );
			}
		} );

		percentage = ( completedTranslation / sourceWeight ) * 100;

		return percentage;
	}

	/**
	 * Update/Change handler for section.
	 * @param {jQuery} $section The source section
	 */
	function onSectionUpdate( $section ) {
		var $sourceSection, translationLength, sourceLength;

		if ( !$section ) {
			return;
		}

		$sourceSection = $( '#' + $section.data( 'source' ) );
		translationLength = $section.text().length;
		sourceLength = $sourceSection.text().length;

		// Check if the translation is above the defined threshold to count
		if ( translationLength / sourceLength < translationThreshold ) {
			// Do not count the section as translated
			$section.removeAttr( 'data-cx-weight' );
		} else {
			$section.attr( 'data-cx-weight', sourceLength );
		}

		// Calculate the total translation progress
		showProgress();
	}

	$( function () {
		mw.hook( 'mw.cx.translation.change' ).add( onSectionUpdate );
		window.onbeforeunload = function () {
			// Check if the progress is greater than 1%
			if ( parseInt( getTranslationProgress(), 10 ) > 0 ||
				parseInt( getMachineTranslationPercentage(), 10 ) > 0
			) {
				return mw.msg( 'cx-warning-unsaved-translation' );
			}
		};
	} );
}( jQuery, mediaWiki ) );
