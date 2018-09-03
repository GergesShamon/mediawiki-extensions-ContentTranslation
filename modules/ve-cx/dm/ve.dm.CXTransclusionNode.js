'use strict';

/**
 * Handling of unadapted templates in translations.
 *
 * @copyright See AUTHORS.txt
 * @license GPL-2.0-or-later
 * @file
 */

/**
 * This class exists to override inlineType and blockType. Those actually inherit
 * the ve.dm.MW* classes, so this is not part of the inheritance tree. Also the
 * static methods are partially "inherited" from this class.
 *
 * @class
 * @extends ve.dm.MWTransclusionNode
 * @constructor
 */
ve.dm.CXTransclusionNode = function VeDmCXTransclusionNode() {
	// Parent constructor
	ve.dm.CXTransclusionNode.super.apply( this, arguments );
};

/* Inheritance */

OO.inheritClass( ve.dm.CXTransclusionNode, ve.dm.MWTransclusionNode );

/* Static Properties */

ve.dm.CXTransclusionNode.static.name = 'cxTransclusion';
ve.dm.CXTransclusionNode.static.inlineType = 'cxTransclusionInline';
ve.dm.CXTransclusionNode.static.blockType = 'cxTransclusionBlock';

/* Static Methods */

ve.dm.CXTransclusionNode.static.toDataElement = function ( domElements ) {
	var dataElement,
		cxDataJSON = domElements[ 0 ].getAttribute( 'data-cx' ),
		cxData = cxDataJSON ? JSON.parse( cxDataJSON ) : {};

	// Parent method
	dataElement = ve.dm.CXTransclusionNode.super.static.toDataElement.apply( this, arguments );
	dataElement.attributes.cx = cxData;
	return dataElement;
};

ve.dm.CXTransclusionNode.static.toDomElements = function ( dataElement ) {
	var elements = ve.dm.CXTransclusionNode.super.static.toDomElements.apply( this, arguments );
	elements[ 0 ].setAttribute( 'data-cx', JSON.stringify( dataElement.attributes.cx ) );
	return elements;
};

/**
 * Communicate warnings about unadapted templates.
 *
 * @class
 * @extends ve.dm.MWTransclusionBlockNode
 *
 * @constructor
 * @param {Object} [element] Reference to element in linear model
 */
ve.dm.CXTransclusionBlockNode = function VeDmCXTransclusionBlockNode() {
	// Parent constructor
	ve.dm.CXTransclusionBlockNode.super.apply( this, arguments );

	// attach is fired when section is filled with MT, but not on restoring.
	this.connect( this, {
		attach: 'onAttach',
		detach: 'onDetach'
	} );
};

/* Inheritance */

OO.inheritClass( ve.dm.CXTransclusionBlockNode, ve.dm.MWTransclusionBlockNode );

/* Static Properties */

ve.dm.CXTransclusionBlockNode.static.name = 'cxTransclusionBlock';

/* Methods */

ve.dm.CXTransclusionBlockNode.prototype.getId = function () {
	// Block templates take a whole section. "Attach" issues to the parent section.
	return this.findParent( ve.dm.CXSectionNode ).getId();
};

ve.dm.CXTransclusionBlockNode.prototype.onAttach = function () {
	var cxData = this.getAttribute( 'cx' ) || {},
		sectionNode = this.findParent( ve.dm.CXSectionNode );

	// When section content is replaced, this happens:
	// 1) attach is called with VeDmSectionNode and we cannot access VeDmCXSectionNode
	// 2) detach is called with VeDmCXSectionNode and we unregister our warning
	if ( !sectionNode ) {
		return;
	}

	// This is just a sanity check, since source column does not have data-cx
	if ( !sectionNode.isTargetSection() ) {
		return;
	}

	// TODO: What about multi-part templates?
	if ( cxData[ 0 ].adapted === true ) {
		return;
	}

	if ( cxData[ 0 ].adapted !== false ) {
		mw.log.warn( '[CX] Template adaptation status is missing for a block tempalte in section ' + this.getId() );
		return;
	}

	// TODO: Add help link
	// TODO: Implement resolving
	sectionNode.addTranslationIssues( [ {
		name: 'block-template',
		message: mw.msg( 'cx-tools-linter-template-block-message' ),
		messageInfo: {
			title: mw.msg( 'cx-tools-linter-template' ),
			resolvable: true
		}
	} ] );
};

ve.dm.CXTransclusionBlockNode.prototype.onDetach = function ( parent ) {
	if ( parent instanceof ve.dm.CXSectionNode && parent.isTargetSection() ) {
		parent.resolveTranslationIssues( [ 'block-template' ] );
	}
};

/**
 * TODO: Implement
 *
 * @class
 * @extends ve.dm.MWTransclusionInlineNode
 *
 * @constructor
 * @param {Object} [element] Reference to element in linear model
 */
ve.dm.CXTransclusionInlineNode = function VeDmCXTransclusionInlineNode() {
	// Parent constructor
	ve.dm.CXTransclusionInlineNode.super.apply( this, arguments );
};

/* Inheritance */

OO.inheritClass( ve.dm.CXTransclusionInlineNode, ve.dm.MWTransclusionInlineNode );

/* Static Properties */

ve.dm.CXTransclusionInlineNode.static.name = 'cxTransclusionInline';

/* Registration */

ve.dm.modelRegistry.register( ve.dm.CXTransclusionNode );
ve.dm.modelRegistry.register( ve.dm.CXTransclusionBlockNode );
ve.dm.modelRegistry.register( ve.dm.CXTransclusionInlineNode );