'use strict';

/**
 * Poem translation unit
 *
 * @class
 * @param {mw.cx.dm.TranslationUnit} model
 * @param {mw.cx.ui.TranslationView} view
 * @param {Object} config
 */
mw.cx.ui.PoemTranslationUnit = function PoemTranslationUnit( model, view, config ) {
	mw.cx.ui.PoemTranslationUnit.parent.call( this, model, view, config );
};

/* Setup */
OO.inheritClass( mw.cx.ui.PoemTranslationUnit, mw.cx.ui.TranslationUnit );

mw.cx.ui.PoemTranslationUnit.static.name = 'poem';
mw.cx.ui.PoemTranslationUnit.static.matchRdfaTypes = [ 'mw:Extension/poem' ];

mw.cx.ui.PoemTranslationUnit.static.highlightClass = 'cx-highlight--lightblue';

mw.cx.ui.PoemTranslationUnit.prototype.init = function () {
	// XXX: Why does this need to be repeated in every subclass?
	this.$sourceSection = $( this.model.sourceDocument );
	this.$translationSection = this.parentTranslationUnit.$translationSection.find( '#' + this.model.sourceDocument.id );

	this.adapt();
	this.listen();
};

mw.cx.ui.PoemTranslationUnit.prototype.adapt = function () {
	this.model.adapt();
};

mw.cx.ui.translationUnitFactory.register( mw.cx.ui.PoemTranslationUnit );
