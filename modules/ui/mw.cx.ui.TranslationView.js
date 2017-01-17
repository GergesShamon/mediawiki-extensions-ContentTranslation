'use strict';
/**
 * TranslationView
 *
 * @class
 * @param {Object} [config] Configuration object
 */

mw.cx.ui.TranslationView = function ( config ) {
	this.header = new mw.cx.ui.Header( config );
	this.columns = new mw.cx.ui.Columns( config );
	// Configuration initialization
	this.config = $.extend( {}, config, {
		continuous: true,
		expanded: false,
		items: [ this.header, this.columns ],
		classes: [ 'cx-widget' ],
		scrollable: false,
		padded: false
	} );
	// Parent constructor
	mw.cx.ui.TranslationView.parent.call( this, this.config );
	this.publishButton = null;
	this.connect( this, {
		change: 'onChange'
	} );
	this.init();
};

/* Setup */

OO.inheritClass( mw.cx.ui.TranslationView, OO.ui.StackLayout );
OO.mixinClass( mw.cx.ui.TranslationUnit, OO.EventEmitter );

mw.cx.ui.TranslationView.prototype.init = function () {
	var self = this;

	if ( mw.user.isAnon() ) {
		mw.hook( 'mw.cx.error.anonuser' ).fire();
		return;
	}

	if ( !this.config.sourceTitle ||
		!this.config.sourceLanguage ||
		!this.config.targetLanguage ||
		( mw.Title.newFromText( this.config.sourceTitle ) === null )
	) {
		this.showDashboard();
		return;
	}
	if ( this.config.campaign ) {
		mw.hook( 'mw.cx.cta.accept' ).fire( this.config.campaign, this.config.sourceLanguage, this.config.targetLanguage );
	}

	this.translation = new mw.cx.dm.Translation( this.config );
	this.translation.init().then( function () {
		self.loadTranslation();
		self.showInstructions();
	} );
	this.preparePublishButton();
};

/**
 * Present the source article and section placeholders
 */
mw.cx.ui.TranslationView.prototype.loadTranslation = function () {
	var i, j, translationUnits, subTranslationUnits, subTranslationUnit, translationUnit;

	translationUnits = this.translation.getTranslationUnits();
	for ( i = 0; i < translationUnits.length; i++ ) {
		translationUnit = mw.cx.ui.translationUnitFactory.create( 'section', translationUnits[ i ], this, this.config );
		translationUnit.render( i );
		subTranslationUnits = translationUnits[ i ].getTranslationUnits();
		for ( j = 0; j < subTranslationUnits.length; j++ ) {
			subTranslationUnit = mw.cx.ui.translationUnitFactory.create(
				subTranslationUnits[ j ].constructor.static.name,
				subTranslationUnits[ j ], this, this.config
			);
			subTranslationUnit.setParentTranslationUnit( translationUnit );
		}
	}
};

mw.cx.ui.TranslationView.prototype.showDashboard = function () {
	location.href = mw.util.getUrl( 'Special:ContentTranslation' );
};

mw.cx.ui.TranslationView.prototype.preparePublishButton = function () {
	this.setupPublishButton();
	this.attachPublishButton();
};

/**
 * Show the instructions card when translation is loaded.
 */
mw.cx.ui.TranslationView.prototype.showInstructions = function () {
	var instructions = mw.cx.tools.translationToolFactory.create(
		'instructions', null, this,	this.config
	);

	this.columns.ToolsColumn.showTool( instructions );
};

mw.cx.ui.TranslationView.prototype.setupPublishButton = function () {
	var self = this;

	this.publishButton = new OO.ui.ButtonWidget( {
		disabled: true,
		flags: [ 'progressive', 'primary' ],
		classes: [ 'cx-header__publish-button' ],
		label: mw.msg( 'cx-publish-button' )
	} );
	this.publishButton.connect( this, {
		click: 'onPublishButtonClick'
	} );
	mw.hook( 'mw.cx.progress' ).add( function ( weights ) {
		self.publishButton.setDisabled( weights.any === 0 );
	} );
};

mw.cx.ui.TranslationView.prototype.onChange = function () {
	this.publishButton.setDisabled( false );
};

/**
 * Add the publish button to the user interface.
 */
mw.cx.ui.TranslationView.prototype.attachPublishButton = function () {
	this.header.$headerBar.append( new OO.ui.Element( {
		classes: [ 'cx-header__publish' ],
		$content: this.publishButton.$element
	} ).$element );
};

mw.cx.ui.TranslationView.prototype.onPublishButtonClick = function () {
	this.publish();
};

/**
 * Publish the translation
 */
mw.cx.ui.TranslationView.prototype.publish = function () {
	var publisher, self = this;

	// Disable the trigger button
	this.publishButton.setDisabled( true ).setLabel( mw.msg( 'cx-publish-button-publishing' ) );
	publisher = new mw.cx.Publish( this.publishButton, this.config.siteMapper );
	publisher.publish().always( function () {
		self.publishButton.setDisabled( true ).setLabel( mw.msg( 'cx-publish-button' ) );
	} );
};
