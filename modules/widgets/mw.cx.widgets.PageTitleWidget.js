'use strict';

/**
 * Page title widget. This is the header for source and translation columns.
 * It is editable (contenteditable) for translation and readonly for source page.
 * Supports validation of values.
 * @class
 * @param {Object} [config] Configuration object
 */
mw.cx.widgets.PageTitleWidget = function ( config ) {
	// Configuration initialization
	config = $.extend( config, {
		classes: [ 'cx-pagetitle' ],
		multiline: true,
		type: 'text',
		autosize: true,
		disable: !this.editable
	} );
	this.editable = config.editable;
	// Parent constructor
	mw.cx.widgets.PageTitleWidget.parent.call( this, config );
	this.setDisabled( !this.editable );
	if ( this.editable ) {
		this.setValidation( this.validate );
	}
};

/* Setup */

OO.inheritClass( mw.cx.widgets.PageTitleWidget, OO.ui.TextInputWidget );

mw.cx.widgets.PageTitleWidget.prototype.validate = function( value ) {
	if ( value === undefined || value === null || value === '' ) {
		return false;
	}
	// TODO: Add more title validation here
	return true;
};

/**
 * Handle key press events. Disable enter key presses.
 *
 * @private
 * @param {jQuery.Event} e Key press event
 * @fires enter If enter key is pressed and input is not multiline
 * @return {boolean}
 */
mw.cx.widgets.PageTitleWidget.prototype.onKeyPress = function ( e ) {
	if ( e.which === OO.ui.Keys.ENTER ) {
		this.emit( 'enter', e );
		return false;
	}
};
