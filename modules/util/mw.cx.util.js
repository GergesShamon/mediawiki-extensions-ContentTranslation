/**
 * A set of utility methods for Content Translation
 */

'use strict';

/**
 * Align two sections horizontally
 *
 * @param {jQuery} $sourceSection Source section
 * @param {jQuery} $targetSection Target section
 */
mw.cx.alignSections = function ( $sourceSection, $targetSection ) {
	var steps = 0;

	// Remove min-heights
	$sourceSection.css( 'min-height', '' );
	$targetSection.css( 'min-height', '' );

	var sourceHeight = +$sourceSection[ 0 ].scrollHeight;
	var targetHeight = +$targetSection[ 0 ].scrollHeight;

	while ( sourceHeight !== targetHeight ) {
		if ( targetHeight > sourceHeight ) {
			$sourceSection.css( 'min-height', targetHeight );
		} else {
			$targetSection.css( 'min-height', sourceHeight );
		}
		sourceHeight = +$sourceSection[ 0 ].scrollHeight;
		targetHeight = +$targetSection[ 0 ].scrollHeight;
		if ( steps++ === 5 ) {
			mw.track( 'Alignment attempt is not succeeding. Aborting.' );
			break;
		}
	}
};

/**
 * Get the title after changing its namespace to new one.
 * Expects valid title, if not, will throw exception.
 *
 * @param {string} currentTitle Original title string
 * @param {number} newNamespaceId New namespace id
 * @return {string} New title with changed namespace
 */
mw.cx.getTitleForNamespace = function ( currentTitle, newNamespaceId ) {
	var currentTitleObj = new mw.Title( currentTitle );
	var currentNamespace = currentTitleObj.getNamespaceId();
	if ( newNamespaceId === currentNamespace ) {
		// No change.
		return currentTitle;
	}

	// Get the current title string
	currentTitle = currentTitleObj.getMainText();
	if ( currentNamespace === mw.config.get( 'wgNamespaceIds' ).user ) {
		// User namespace. Get the title part alone after removing User:username/ part
		currentTitle = currentTitle.slice( currentTitle.indexOf( '/' ) + 1 );
	}

	if ( newNamespaceId === mw.config.get( 'wgNamespaceIds' ).user ) {
		var username = mw.user.getName();
		currentTitle = mw.Title.newFromText( username + '/' + currentTitle, newNamespaceId ).toText();
	}
	return mw.Title.newFromText( currentTitle, newNamespaceId ).toText();
};

/**
 * Get the default publishing target namespace
 *
 * @return {number} Target namespace id
 */
mw.cx.getDefaultTargetNamespace = function () {
	var config = require( '../config.json' ),
		targetNamespace = config.TargetNamespace;

	// Validate the configuration.
	if ( !( targetNamespace in mw.config.get( 'wgFormattedNamespaces' ) ) ) {
		mw.log.error( '[CX] Invalid publishing namespace configuration. Namespace does not exist: ' + targetNamespace );
		targetNamespace = 0;
	}

	return targetNamespace;
};

/**
 * Given a section Id, get the section number for it.
 * Section id is like cxSourceSection15 or cxTargetSection15. 15 is the section number.
 *
 * @param {string} sectionId Section id
 * @return {number} section number
 */
mw.cx.getSectionNumberFromSectionId = function ( sectionId ) {
	return Number( sectionId.match( /^cx(Target|Source)Section([0-9]+)$/ )[ 2 ] );
};

mw.cx.getCXVersion = function () {
	var config = require( '../config.json' );
	return Number( config.Version );
};

/**
 * Get the parent section model for the given seletion in the surface.
 *
 * @param {ve.dm.Surface} surface
 * @param {ve.dm.LinearSelection} selection
 * @return {ve.dm.CXSectionNode}
 */
mw.cx.getParentSectionForSelection = function ( surface, selection ) {
	var documentModel = surface.getModel().getDocument();
	var parentBranchNode = documentModel.getBranchNodeFromOffset( selection.getRange().start );

	var section;
	while ( parentBranchNode ) {
		if ( parentBranchNode.type === 'cxSection' ) {
			section = parentBranchNode;
			break;
		}

		parentBranchNode = parentBranchNode.parent;
	}

	return section;
};

/**
 * @return {string} Login href.
 */
mw.cx.getLoginHref = function () {
	var currentUri = new mw.Uri();

	// Remove the title from return-to query parameters, so duplication is avoided
	delete currentUri.query.title;

	return mw.util.getUrl( 'Special:UserLogin', {
		returnto: 'Special:ContentTranslation',
		returntoquery: currentUri.getQueryString()
	} );
};
