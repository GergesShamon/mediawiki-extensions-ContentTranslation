'use strict';

/**
 * CX Translation model
 *
 * @abstract
 * @mixins OO.EventEmitter
 *
 * @constructor
 * @param {mw.cx.dm.WikiPage} sourceWikiPage Details of source wiki page
 * @param {mw.cx.dm.WikiPage} targetWikiPage Details of target wiki page
 * @param {string} sourceHtml Segmented source HTML
 * @param {Object} [draft] Saved translation
 */
mw.cx.dm.Translation = function MwCxDmTranslation( sourceWikiPage, targetWikiPage, sourceHtml, draft ) {
	// Mixin constructor
	OO.EventEmitter.call( this );

	this.sourceWikiPage = sourceWikiPage;
	this.targetWikiPage = targetWikiPage;
	this.id = null;
	this.sourceCategories = null;
	this.targetCategories = null;
	// TODO get/set the following three sourceWikiPage/targetWikiPage properties
	this.targetTitle = this.targetWikiPage.getTitle();
	this.sourceRevisionId = this.sourceWikiPage.getRevision();
	this.targetRevisionId = this.targetWikiPage.getRevision();
	this.translator = null;
	this.startDate = null;
	this.status = 'draft';
	this.progress = {
		any: 0,
		human: 0,
		mt: 0,
		mtSectionsCount: 0
	};
	this.topTranslationUnits = [];
	this.translationUnitById = {};

	if ( draft ) {
		this.setSavedTranslation( draft );
	}

	this.sourceDoc = ve.dm.converter.getModelFromDom(
		this.constructor.static.getSourceDom( sourceHtml, false ),
		{ lang: this.sourceWikiPage.getLanguage(), dir: this.sourceWikiPage.getDirection() }
	);

	this.targetDoc = ve.dm.converter.getModelFromDom(
		this.constructor.static.getSourceDom( sourceHtml, true, this.savedTranslationUnits ),
		{ lang: this.targetWikiPage.getLanguage(), dir: this.targetWikiPage.getDirection() }
	);

	this.buildTranslationUnits( this.sourceDoc.getDocumentNode(), null );
};

/* Inheritance */

OO.mixinClass( mw.cx.dm.Translation, OO.EventEmitter );

/* Static methods */

/**
 * Parse and restructure the source HTML, wrapping top-level translatable nodes into sections
 *
 * @param {string} sourceHtml The source HTML
 * @param {boolean} forTarget Replace each top-level wrapper section with an empty placeholder?
 * @param {Object} [savedTranslationUnits] Saved translation units if any
 * @return {HTMLDocument} Restructured source DOM
 */
mw.cx.dm.Translation.static.getSourceDom = function ( sourceHtml, forTarget, savedTranslationUnits ) {
	var lastAboutGroup,
		nextSectionId = 1,
		sectionIdPrefix = forTarget ? 'cxTargetSection' : 'cxSourceSection',
		domDoc = ve.init.target.parseDocument( sourceHtml, 'visual' ),
		articleNode = domDoc.createElement( 'article' ),
		baseNodes;

	if ( forTarget ) {
		// Remove any and all <base> tags pointing to the source wiki
		baseNodes = domDoc.getElementsByTagName( 'base' );
		while ( baseNodes.length ) {
			baseNodes[ 0 ].parentNode.removeChild( baseNodes[ 0 ] );
		}
		// Rerun fixBase, which will add a <base> tag pointing to the current wiki
		ve.init.mw.CXTarget.static.fixBase( domDoc );
	}

	// Wrap each top-level element with a <section rel='cx:Placeholder' id='xxx'>
	// TODO: it would be better to do section wrapping on the CX server
	Array.prototype.forEach.call( domDoc.body.childNodes, function ( node ) {
		var sectionNode, aboutGroup;
		if ( forTarget && savedTranslationUnits && savedTranslationUnits[ nextSectionId ] ) {
			sectionNode = this.getSavedTranslation( savedTranslationUnits[ nextSectionId ] );
			nextSectionId++;
		} else {
			if ( node.nodeType !== Node.ELEMENT_NODE ) {
				return;
			}
			sectionNode = domDoc.createElement( 'section' );
			aboutGroup = node.getAttribute( 'about' );

			// For about-grouped siblings of block level templates don't give them
			// a section ID
			if ( !aboutGroup || aboutGroup !== lastAboutGroup ) {
				sectionNode.setAttribute( 'id', sectionIdPrefix + nextSectionId );
				sectionNode.setAttribute( 'rel', forTarget ? 'cx:Placeholder' : 'cx:Section' );
				nextSectionId++;
			}

			lastAboutGroup = aboutGroup;
		}
		if ( forTarget ) {
			node.parentNode.removeChild( node );
		} else {
			sectionNode.appendChild( node );
		}
		articleNode.appendChild( sectionNode );
	}.bind( this ) );

	// TODO: We need to see if all savedTranslationUnit items were restored or not.
	// Based on that we should inform user/create orphan sections/load original source
	// article used for translation.
	domDoc.body.appendChild( articleNode );

	return domDoc;
};

/**
 * Get HTML content of a translation unit to restore.
 *
 * @param {Object} translationUnit
 * @return {Element} Document element corresponding to the saved HTML of the section.
 */
mw.cx.dm.Translation.static.getSavedTranslation = function ( translationUnit ) {
	var translation;

	// If the translator has manual translation from scratch or on top of MT use that.
	if ( translationUnit.user && translationUnit.user.content ) {
		translation = translationUnit.user.content;
	} else if ( translationUnit.mt ) { // Machine translation, unmodified.
		translation = translationUnit.mt.content;
	} else if ( translationUnit.source ) { // Unmodified source copy.
		translation = translationUnit.source.content;
	}

	return $.parseHTML( translation )[ 0 ];
};

/* Methods */

mw.cx.dm.Translation.prototype.getTargetPage = function () {
	return this.targetPage;
};

/**
 * Get Translation id
 *
 * @return {string} Translation Id
 */
mw.cx.dm.Translation.prototype.getId = function () {
	return this.id;
};

/**
 * Set Translation id
 *
 * @param {string} id Translation Id
 */
mw.cx.dm.Translation.prototype.setId = function ( id ) {
	this.id = id;
};

mw.cx.dm.Translation.prototype.setTargetURL = function ( targetURL ) {
	this.targetURL = targetURL;
};

/**
 * Get revision id
 *
 * @return {string} revision Id
 */
mw.cx.dm.Translation.prototype.getSourceRevisionId = function () {
	return this.sourceRevisionId;
};

/**
 * Set revision id
 *
 * @param {string} revisionId revision Id
 */
mw.cx.dm.Translation.prototype.setSourceRevisionId = function ( revisionId ) {
	this.sourceRevisionId = revisionId;
};

/**
 * Set target revision id
 *
 * @param {string} revisionId revision Id
 */
mw.cx.dm.Translation.prototype.setTargetRevisionId = function ( revisionId ) {
	this.targetRevisionId = revisionId;
};

/**
 * Set Translation title
 *
 * @param {string} title Translation Id
 */
mw.cx.dm.Translation.prototype.setTargetTitle = function ( title ) {
	if ( title === this.targetTitle ) {
		// No title change
		return;
	}
	this.targetTitle = title;
	// Translation title change is a change trigger for translation.
	this.emit( 'change' );
};

/**
 * Get Translation title
 * @return {string} Target title
 */
mw.cx.dm.Translation.prototype.getTargetTitle = function () {
	return this.targetTitle;
};

mw.cx.dm.Translation.prototype.setStatus = function ( status ) {
	this.status = status;
};

mw.cx.dm.Translation.prototype.setProgress = function ( progress ) {
	this.progress = progress;
};

/**
 * Extract translation metadata from the draft translation fetched
 * and set to this model.
 * @param {Object} draft Saved translation.
 */
mw.cx.dm.Translation.prototype.setSavedTranslation = function ( draft ) {
	this.setTargetURL( draft.targetURL );
	this.setStatus( draft.status );
	this.setTargetRevisionId( draft.targetRevisionId );
	this.setProgress( JSON.parse( draft.progress ) );
	this.setId( draft.id );
	this.setTargetTitle( draft.targetTitle );
	this.savedTranslationUnits = draft.translationUnits;
};

/**
 * Build a translation unit from the source ve.dm.Node or ve.dm.Annotation, if one matches
 *
 * @param {ve.dm.Node|ve.dm.Annotation} sourceModel Source node or annotation
 * @param {mw.cx.dm.TranslationUnit|null} parentUnit Parent translation unit
 * @return {mw.cx.dm.TranslationUnit|null} The translation unit, or null
 */
mw.cx.dm.Translation.prototype.matchTranslationUnit = function ( sourceModel, parentUnit ) {
	var id, type;
	if (
		!sourceModel.getTranslationUnitId ||
		!( id = sourceModel.getTranslationUnitId() ) ||
		!( type = mw.cx.dm.translationUnitFactory.match( sourceModel ) )
	) {
		return null;
	}
	return mw.cx.dm.translationUnitFactory.create( type, this, id, sourceModel, parentUnit );
};

/**
 * Build and initialize sub-translation units recursively.
 *
 * @param {ve.dm.Node} parentNode Document node to search
 * @param {mw.cx.dm.TranslationUnit|null} parentUnit Parent translation unit
 */
mw.cx.dm.Translation.prototype.buildTranslationUnits = function ( parentNode, parentUnit ) {
	var unitList, i, len, node, unit;

	if ( parentNode instanceof ve.dm.ContentBranchNode ) {
		this.buildAnnotationTranslationUnits( parentNode.getRange(), parentUnit );
		return;
	}

	if ( !parentNode.children || !parentNode.children.length ) {
		return;
	}

	unitList = parentUnit ? parentUnit.translationUnits : this.topTranslationUnits;
	for ( i = 0, len = parentNode.children.length; i < len; i++ ) {
		node = parentNode.children[ i ];
		unit = this.matchTranslationUnit( node, parentUnit );
		if ( unit ) {
			unitList.push( unit );
			this.translationUnitById[ unit.getId() ] = unit;
		}
		// Recurse, whether or not we just built a translation unit
		this.buildTranslationUnits( node, unit || parentUnit );
	}
};

/**
 * Build and initialize translation units for annotations.
 *
 * @param {ve.Range} range Document range to search
 * @param {mw.cx.dm.TranslationUnit} parentUnit Parent translation unit
 */
mw.cx.dm.Translation.prototype.buildAnnotationTranslationUnits = function ( range, parentUnit ) {
	var i, current, opened, closed, j, jLen, ann, unit,
		data = this.sourceDoc.data,
		previous = new ve.dm.AnnotationSet( data.store ),
		translationUnitIdBySetIndex = {};

	for ( i = range.start; i < range.end; i++ ) {
		current = data.getAnnotationsFromOffset( i );
		opened = current.clone();
		opened.removeSet( previous );
		closed = previous.clone();
		closed.removeSet( current );
		for ( j = 0, jLen = opened.getLength(); j < jLen; j++ ) {
			ann = opened.get( j );
			unit = this.matchTranslationUnit( ann, parentUnit );
			if ( unit ) {
				parentUnit.translationUnits.push( unit );
				this.translationUnitById[ unit.getId() ] = unit;
				translationUnitIdBySetIndex[ opened.getIndex( j ) ] = unit.getId();
				unit.setStart( i );
			}
		}
		for ( j = 0, jLen = closed.getLength(); j < jLen; j++ ) {
			unit = this.translationUnitById[
				translationUnitIdBySetIndex[ closed.getIndex( j ) ]
			];
			if ( unit ) {
				unit.setEnd( i );
			}
		}
		previous = current;
	}
};

/**
 * Get a translation unit by ID
 *
 * @param {string} id Translation unit ID
 * @return {mw.cx.dm.TranslationUnit|undefined} The translation unit
 */
mw.cx.dm.Translation.prototype.getTranslationUnit = function ( id ) {
	return this.translationUnitById[ id ];
};

/**
 * Get a translation units
 *
 * @return {mw.cx.dm.TranslationUnit[]} The translation units
 */
mw.cx.dm.Translation.prototype.getTranslationUnits = function () {
	return this.topTranslationUnits;
};

mw.cx.dm.Translation.prototype.getProgress = function () {
	return this.progress;
};
