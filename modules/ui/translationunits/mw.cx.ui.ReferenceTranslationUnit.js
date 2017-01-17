'use strict';

/**
 * Reference translation unit
 *
 * @class
 * @param {mw.cx.dm.TranslationUnit} translationUnitModel
 * @param {mw.cx.ui.TranslationView} view
 * @param {Object} config
 */
mw.cx.ui.ReferenceTranslationUnit = function ReferenceTranslationUnit( translationUnitModel, view, config ) {
	// Parent constructor
	mw.cx.ui.ReferenceTranslationUnit.parent.call( this, translationUnitModel, view, config );
};

/* Setup */
OO.inheritClass( mw.cx.ui.ReferenceTranslationUnit, mw.cx.ui.TranslationUnit );

mw.cx.ui.ReferenceTranslationUnit.static.name = 'reference';
mw.cx.ui.ReferenceTranslationUnit.static.matchTagNames = [ 'span' ];
mw.cx.ui.ReferenceTranslationUnit.static.matchRdfaTypes = [ 'dc:references', 'mw:Extension/ref' ];
mw.cx.ui.ReferenceTranslationUnit.static.highlightClass = 'cx-highlight--lightblue';
mw.cx.ui.ReferenceTranslationUnit.static.tools = [ 'reference' ];

mw.cx.ui.ReferenceTranslationUnit.prototype.init = function () {
	if ( !this.translationUnitModel.sourceDocument.id ) {
		throw Error( '[CX] Invalid source document' );
	}
	this.$sourceSection = $( this.translationUnitModel.sourceDocument );
	this.$translationSection = this.getTranslationSection();
	this.adapt();
	this.listen();
};

/**
 * @inheritDoc
 */
mw.cx.ui.ReferenceTranslationUnit.prototype.onParentTranslationStarted = function () {
	this.init();
};

mw.cx.ui.ReferenceTranslationUnit.prototype.getTranslationSection = function () {
	return this.parentTranslationUnit.$translationSection.find( '#' + this.translationUnitModel.sourceDocument.id );
};

mw.cx.ui.ReferenceTranslationUnit.prototype.isEditable = function () {
	return true;
};

mw.cx.ui.ReferenceTranslationUnit.prototype.adapt = function () {
	// Adapt in general will be asynchronous operation
	this.translationUnitModel.adapt();
	this.setContent( this.translationUnitModel.targetDocument );
};

mw.cx.ui.ReferenceTranslationUnit.prototype.setContent = function ( content ) {
	var attributes, self = this;

	if ( !content ) {
		return;
	}
	attributes = $( content ).prop( 'attributes' );
	// loop through attributes and apply them.
	$.each( attributes, function() {
		self.$translationSection.attr( this.name, this.value );
	} );
	this.translated = true;
	this.emit( 'translationStarted' );
	this.emit( 'change' );
};

mw.cx.ui.ReferenceTranslationUnit.prototype.onChange = function () {
	if ( this.parentTranslationUnit ) {
		this.parentTranslationUnit.emit( 'change' );
	}
};

mw.cx.ui.translationUnitFactory.register( mw.cx.ui.ReferenceTranslationUnit );
