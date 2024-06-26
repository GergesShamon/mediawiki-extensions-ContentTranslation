'use strict';

/*!
 * Content Translation UserInterface TranslationAction class.
 * @copyright See AUTHORS.txt
 * @license GPL-2.0-or-later
 */

/**
 * Translation action.
 *
 * @class
 * @extends ve.ui.Action
 * @constructor
 * @param {ve.ui.Surface} surface Surface to act on
 */
ve.ui.CXTranslationAction = function VeUiCXTranslationAction() {
	// Parent constructor
	ve.ui.CXTranslationAction.super.apply( this, arguments );
};

/* Inheritance */

OO.inheritClass( ve.ui.CXTranslationAction, ve.ui.Action );

/* Static Properties */

ve.ui.CXTranslationAction.static.name = 'translation';

/**
 * List of allowed methods for the action.
 *
 * @static
 * @property {string[]}
 */
ve.ui.CXTranslationAction.static.methods = [ 'translate', 'savePreference' ];

/* Methods */

/**
 * Find the currently active section and request to change the source.
 *
 * @param {string} source Selected MT provider or `source` or `scratch`
 * @return {boolean|undefined} False if action is cancelled.
 */
ve.ui.CXTranslationAction.prototype.translate = function ( source ) {
	var target = ve.init.target,
		selection = this.surface.getModel().getSelection();

	if ( !( selection instanceof ve.dm.LinearSelection ) ) {
		return false;
	}

	var section = mw.cx.getParentSectionForSelection( this.surface, selection );

	if ( !section ) {
		mw.log.error( '[CX] Could not find a CX Section as parent for the context.' );
		return false;
	}

	var originalSource = section.getOriginalContentSource();

	// Emit Pre-translate event
	section.emit( 'beforeTranslation' );

	var promise;
	if ( source === 'reset-translation' ) {
		promise = target.changeContentSource( section, null, originalSource, { noCache: true } );
	} else {
		promise = target.changeContentSource( section, originalSource, source );
	}

	promise
		.always( function () {
			// Recalculate the section, since the instance got destroyed in content change
			section = target.getTargetSectionNode( section.getSectionId() );
			if ( section ) {
				// Emit Post-translate event
				section.emit( 'afterTranslation' );
			}
		} ).fail( function () {
			mw.notify( mw.msg( 'cx-mt-failed' ) );
			this.surface.getModel().emit( 'contextChange' );
		}.bind( this ) );
};

/**
 * Save the currently selected provider as the preferred provider for new sections.
 *
 * @return {boolean|undefined} False if action is cancelled.
 */
ve.ui.CXTranslationAction.prototype.savePreference = function () {
	var mtManager = ve.init.target.config.MTManager,
		mtToolbar = ve.init.target.mtToolbar,
		mtProviderTools = {},
		selection = this.surface.getModel().getSelection();

	if ( !( selection instanceof ve.dm.LinearSelection ) ) {
		return false;
	}

	var section = mw.cx.getParentSectionForSelection( this.surface, selection );

	if ( !section ) {
		mw.log.error( '[CX] Could not find a CX Section as parent for the context.' );
		return false;
	}

	var currentMTProvider = section.getOriginalContentSource();
	mtManager.setPreferredProvider( currentMTProvider );

	// Fix up the default provider indicator in the MT menu.
	mtProviderTools = mtToolbar.getToolGroupByName( 'cx-mt' ).tools;
	for ( var toolName in mtProviderTools ) {
		if ( mtProviderTools[ toolName ].setIsPreferred ) {
			mtProviderTools[ toolName ].setIsPreferred( toolName === currentMTProvider );
		}
	}
	// Toggle the tool
	mtToolbar.getToolGroupByName( 'cx-mt-set-default' ).tools[ 'save-mt-preference' ].toggle();
};

/* Registration */

ve.ui.actionFactory.register( ve.ui.CXTranslationAction );
