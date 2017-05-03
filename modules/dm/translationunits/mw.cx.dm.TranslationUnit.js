/**
 * ContentTranslation TranslationUnit class
 *
 * A translation unit in ContentTranslation is a translatable element. A paragraph
 * is translatable element. It has a source content in source language and to be
 * translated to target language. The same paragraph can have a reference, a link,
 * a template and all of these sub elements are also translatable. That means,
 * A translation unit can be a child of another translation unit. A MediaWiki template
 * is a translation unit. At the same time, template paramters are also translatable units.
 * mw.cx.dm.TranslationUnit class abstracts the data manipulation over such a translation
 * unit during a translation.
 */

'use strict';

/**
 * CX TranslationUnit
 *
 * @abstract
 * @mixins OO.EventEmitter
 *
 * @constructor
 * @param {Object} config
 * @param {mw.cx.dm.Translation} translation The translation context
 * @param {Element} sourceDocument
 * @param {Element} [targetDocument]
 */
mw.cx.dm.TranslationUnit = function TranslationUnit( config, translation, sourceDocument, targetDocument ) {
	// Mixin constructor
	OO.EventEmitter.call( this );
	this.config = config;
	this.translation = translation;
	this.sourceDocument = sourceDocument;
	this.targetDocument = targetDocument;
	this.translationUnits = [];
	this.subTranslationUnitModels = {};
	this.requestManager = config.requestManager;
	this.sourceLanguage = config.sourceLanguage;
	this.targetLanguage = config.targetLanguage;
	this.parentTranslationUnit = null;
	// Source of the translation. Can be source, user, Apertium, Yandex etc
	this.translationSource = null;
	// Parent constructor
	mw.cx.dm.TranslationUnit.super.call( this );
	this.connect( this, {
		change: 'onChange'
	} );
};

/* Inheritance */
OO.inheritClass( mw.cx.dm.TranslationUnit, mw.cx.dm.Model );
OO.mixinClass( mw.cx.dm.TranslationUnit, OO.EventEmitter );

/**
 * Adapt the translation unit for target langauge.
 */
mw.cx.dm.TranslationUnit.prototype.adapt = null;

/**
 * Change handler
 */
mw.cx.dm.TranslationUnit.prototype.onChange = function() {
	var parentTranslationUnit;

	parentTranslationUnit = this.getParentTranslationUnit();

	if ( parentTranslationUnit ) {
		parentTranslationUnit.emit( 'change' );
	} else {
		this.translation.emit( 'change', this );
	}
};

/**
 * Change the element id of the translation copy. We follow a format where
 * 'cx' is prefixed to the source element id.
 */
mw.cx.dm.TranslationUnit.prototype.setTargetId = function () {
	if ( !this.targetDocument ) {
		throw new Error( 'Target document not set for translation unit : ' + this.toString() );
	}
	this.targetDocument.id = this.getTranslationSectionId();
};

/**
 * Section is the top most translation unit. Build and initialize its sub translation units.
 *
 * @param {Element} [sourceDocument] Source section DOM Element
 * @param {Element} [targetDocument] Target section DOM Element
 */
mw.cx.dm.TranslationUnit.prototype.buildSubTranslationUnits = function ( sourceDocument, targetDocument ) {
	var i, sourceChildren, targetChildren;

	if ( !sourceDocument && !targetDocument ) {
		throw new Error( '[CX] Both source and target documents can not be null' );
	}

	if ( sourceDocument ) {
		sourceChildren = sourceDocument.children || [];
		for ( i = 0; i < sourceChildren.length; i++ ) {
			this.buildSubTranslationUnit( sourceChildren[ i ] );
			// Recursively search for sub translation units.
			this.buildSubTranslationUnits( sourceChildren[ i ] );
		}
	}

	if ( targetDocument ) {
		// Scan target document
		targetChildren = targetDocument.children || [];
		for ( i = 0; i < targetChildren.length; i++ ) {
			this.buildSubTranslationUnit( null, targetChildren[ i ] );
			// Recursively search for sub translation units.
			this.buildSubTranslationUnits( null, targetChildren[ i ] );
		}
	}
};

/**
 * Build a sub translation unit for given source, target element pair
 *
 * @param {Element} [source] Source DOM Element
 * @param {Element} [target] Target DOM Element
 */
mw.cx.dm.TranslationUnit.prototype.buildSubTranslationUnit = function ( source, target ) {
	var key, subTranslationUnit, model;

	key = this.getKeyForModelMap( source || target );

	model = mw.cx.dm.modelRegistry.matchElement( source || target );
	// Check if there is a translation unit defined for this child
	if ( !model ) {
		return;
	}
	if ( !key ) {
		throw new Error( '[CX] Could not find any unique key for sub translation unit of: ' + this.toString() );
	}

	subTranslationUnit = this.subTranslationUnitModels[ key ];
	if ( subTranslationUnit ) {
		subTranslationUnit.setTargetDocument( target );
	} else {
		if ( !source ) {
			mw.log( '[CX] No source element for ' + target.id );
		}
		subTranslationUnit = mw.cx.dm.translationUnitFactory.create(
			model, this.config, this.translation, source, target
		);
		// Keep a map of DOM ids and translation units
		this.subTranslationUnitModels[ key ] = subTranslationUnit;
		this.translationUnits.push( subTranslationUnit );
		subTranslationUnit.setParentTranslationUnit( this );
	}
};

/**
 * Get a key for translation units based on id or such unique attributes.
 * TODO: This id calculation is also present in multiple translation unit dms.
 * Consolidate?
 *
 * @param  {Element} node
 * @return {string}
 */
mw.cx.dm.TranslationUnit.prototype.getKeyForModelMap = function ( node ) {
	var id = node.id || node.dataset.linkid || node.dataset.segmentid ||
		( node.attributes[ 'about' ] && node.attributes[ 'about' ].value ) ||
		( node.attributes[ 'href' ] && node.attributes[ 'href' ].value );
	return id && id.replace( /^(cx)/, '' );
};

/**
 * Get the sub translation units in this translation unit.
 *
 * @return {mw.cx.dm.TranslationUnit[]} Array of sub translation units
 */
mw.cx.dm.TranslationUnit.prototype.getTranslationUnits = function() {
	return this.translationUnits;
};

mw.cx.dm.TranslationUnit.prototype.getSourceDocument = function () {
	return this.sourceDocument;
};

mw.cx.dm.TranslationUnit.prototype.setTargetDocument = function ( targetDocument ) {
	this.targetDocument = targetDocument;
	this.buildSubTranslationUnits( this.sourceDocument, this.targetDocument );
};

mw.cx.dm.TranslationUnit.prototype.getTargetDocument = function () {
	return this.targetDocument;
};

mw.cx.dm.TranslationUnit.prototype.getParentTranslationUnit = function () {
	return this.parentTranslationUnit;
};

mw.cx.dm.TranslationUnit.prototype.setParentTranslationUnit = function ( translationUnit ) {
	this.parentTranslationUnit = translationUnit;
};

/**
 * Whether the translation unit is editable
 * @return {boolean}
 */
mw.cx.dm.TranslationUnit.prototype.isEditable = function () {
	return true;
};

/**
 * Remove the translation unit.
 */
mw.cx.dm.TranslationUnit.prototype.remove = function () {
	if ( this.targetDocument ) {
		this.targetDocument.remove();
		this.emit( 'change' );
		this.emit( 'remove' );
	}
};

/**
 * Get a unique id for this translation unit
 * @return {string}
 */
mw.cx.dm.TranslationUnit.prototype.getId = function () {
	return this.constructor.static.name + '::' + this.getSectionId();
};

/**
 * Get the id of the section
 * @return {string}
 */
mw.cx.dm.TranslationUnit.prototype.getSectionId = function () {
	// Make sure that there is an id for the unit even if id attribute is not present.
	return this.sourceDocument.id || OO.ui.generateElementId();
};

/**
 * Get the id of the section
 * @return {string}
 */
mw.cx.dm.TranslationUnit.prototype.getTranslationSectionId = function () {
	if ( this.getSectionId().indexOf( 'cx' ) === 0 ) {
		return this.getSectionId();
	}

	return 'cx' + this.getSectionId();
};

mw.cx.dm.TranslationUnit.prototype.getTranslationSource = function () {
	return this.translationSource;
};

mw.cx.dm.TranslationUnit.prototype.setTranslationSource = function ( translationSource ) {
	this.translationSource = translationSource;
};

/**
 * String representation of the translation unit instance. Useful for debugging.
 *
 * @return {string} String identified for the instance
 */
mw.cx.dm.TranslationUnit.prototype.toString = function() {
	return this.constructor.name + '::' + this.getId();
};
