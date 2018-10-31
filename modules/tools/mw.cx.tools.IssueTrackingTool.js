'use strict';

/**
 * Issue tracking tool class
 *
 * @class
 * @constructor
 * @extends mw.cx.tools.TranslationTool
 *
 * @param {Mixed[]} nodesWithIssues IDs of nodes with issues
 */
mw.cx.tools.IssueTrackingTool = function CXIssueTrackingTool( nodesWithIssues ) {
	this.nodesWithIssues = nodesWithIssues;

	// Parent constructor
	mw.cx.tools.IssueTrackingTool.super.call( this, null, {} ); // Third param is empty object to avoid JS errors

	this.icon = new OO.ui.IconWidget( { icon: 'close' } );
	this.actionButtons = new OO.ui.ButtonGroupWidget();

	this.veTarget = ve.init.target;

	this.numberOfIssues = 0;
	this.numberOfWarnings = 0;
	this.numberOfErrors = 0;

	// Array of plain objects with ID and translation issue model
	this.allIssues = [];
	this.processAllIssues();

	this.currentIssue = 1;

	this.viewDetailsButton = new OO.ui.ButtonWidget( {
		framed: false,
		label: mw.msg( 'cx-tools-linter-view-details' ),
		classes: [ 'cx-tools-linter-view-details' ],
		flags: [ 'progressive' ]
	} );
	this.numberOfIssuesLabel = new OO.ui.LabelWidget( {
		label: mw.msg( 'cx-tools-linter-issues-count', 1, this.numberOfIssues )
	} );
	this.previousButton = new OO.ui.ButtonWidget( {
		framed: false,
		disabled: true,
		icon: 'previous'
	} );
	this.nextButton = new OO.ui.ButtonWidget( {
		framed: false,
		icon: 'next'
	} );

	this.issuesLayout = new OO.ui.IndexLayout( {
		expanded: false,
		scrollable: false,
		autoFocus: false,
		classes: [ 'cx-tools-linter-issues-layout' ]
	} );
	this.warningsCount = new OO.ui.ButtonWidget( {
		framed: false,
		disabled: true,
		classes: [ 'cx-tools-linter-warnings-count' ],
		label: mw.msg( 'cx-tools-linter-warnings-count', this.numberOfWarnings )
	} );
	this.errorsCount = new OO.ui.ButtonWidget( {
		framed: false,
		disabled: true,
		classes: [ 'cx-tools-linter-errors-count' ],
		label: mw.msg( 'cx-tools-linter-errors-count', this.numberOfErrors )
	} );

	// Events
	this.viewDetailsButton.connect( this, {
		click: 'onViewDetails'
	} );
	this.previousButton.connect( this, { click: [ 'navigateIssues', -1 ] } );
	this.nextButton.connect( this, { click: [ 'navigateIssues', 1 ] } );

	this.icon.$element.prop( 'tabindex', 0 );
	this.icon.$element.on( {
		click: this.showCollapsed.bind( this ),
		keydown: function ( e ) {
			if ( e.which === OO.ui.Keys.SPACE || e.which === OO.ui.Keys.ENTER ) {
				$( this ).click();
				e.preventDefault();
			}
		}
	} );

	this.card = this.getCard();
	this.card.$header
		.addClass( 'mw-cx-tools-IssueTracking-head' )
		.empty()
		.append( this.getHeader() );
	this.card.$element
		.addClass( 'mw-cx-tools-IssueTracking' )
		.on( 'mousedown', false );
	this.card.$information.addClass( 'mw-cx-tools-IssueTracking-body' );

	this.init();
};

/* Inheritance */

OO.inheritClass( mw.cx.tools.IssueTrackingTool, mw.cx.tools.TranslationTool );

/* Static properties */

mw.cx.tools.IssueTrackingTool.static.name = 'issues';
mw.cx.tools.IssueTrackingTool.static.label = OO.ui.deferMsg( 'cx-tools-linter-issues' );

/* Methods */

/**
 * Initialize the card as collapsed or expanded and show the current panel, if possible.
 */
mw.cx.tools.IssueTrackingTool.prototype.init = function () {
	var currentPanel = this.getCurrentPanel();

	if ( !currentPanel ) {
		this.showCollapsed();
	} else {
		this.currentIssue = currentPanel;
		this.showDetails();
		this.openCurrentPanel();
	}
};

/**
 * @inheritDoc
 */
mw.cx.tools.IssueTrackingTool.prototype.getContent = function () {
	return this.getBody();
};

/**
 * Get the index for the first issue of the current focused node.
 *
 * @return {number|boolean} Index of current panel or false
 */
mw.cx.tools.IssueTrackingTool.prototype.getCurrentPanel = function () {
	var i, length, issue, number,
		id = this.getCurrentNodeId();

	if ( !id ) {
		return false;
	}

	if ( id === 'title' ) {
		number = id;
	} else {
		number = mw.cx.getSectionNumberFromSectionId( id );
	}

	for ( i = 0, length = this.allIssues.length; i < length; i++ ) {
		issue = this.allIssues[ i ];

		if ( issue.id === number ) {
			return i + 1;
		}
	}

	return false;
};

/**
 * Get ID of currently active node
 *
 * @return {string}
 */
mw.cx.tools.IssueTrackingTool.prototype.getCurrentNodeId = function () {
	var activeElement = document.activeElement;

	while ( activeElement ) {
		if ( activeElement.classList.contains( 've-ce-cxSectionNode' ) ) {
			return activeElement.id;
		}

		if ( activeElement.type === 'textarea' && !activeElement.readOnly ) {
			return 'title';
		}

		activeElement = activeElement.parentElement;
	}

	return null;
};

/**
 * Create elements for card header.
 *
 * @return {jQuery[]}
 */
mw.cx.tools.IssueTrackingTool.prototype.getHeader = function () {
	var $title, $actions;

	$title = $( '<div>' )
		.addClass( 'mw-cx-tools-IssueTracking-title' )
		.append(
			this.icon.$element,
			new OO.ui.LabelWidget( { label: this.constructor.static.label } ).$element
		);

	$actions = $( '<div>' )
		.addClass( 'mw-cx-tools-IssueTracking-actions' )
		.append( this.actionButtons.$element );

	return [ $title, $actions ];
};

/**
 * @inheritdoc
 */
mw.cx.tools.IssueTrackingTool.prototype.getData = function () {
	return this.constructor.static.name;
};

/**
 * Render the body.
 *
 * @return {jQuery[]}
 */
mw.cx.tools.IssueTrackingTool.prototype.getBody = function () {
	var issues = this.allIssues.map( function ( element, index ) {
		return new mw.cx.ui.TranslationIssueWidget( index, element.issue );
	} );

	this.issuesLayout
		.toggleMenu( false ) // IndexLayout offers config option showMenu, but does not respect setting it to false
		.addTabPanels( issues );

	return [ this.errorsCount.$element, this.warningsCount.$element, this.issuesLayout.$element ];
};

/**
 * Register mousedown and blur events for nodes with issues.
 *
 * @param {ve.ce.CXLintableNode} node
 */
mw.cx.tools.IssueTrackingTool.prototype.registerEvents = function ( node ) {
	node.getFocusableElement()
		.off( 'mousedown blur' )
		.on( {
			mousedown: OO.ui.debounce( this.init.bind( this ) ),
			blur: OO.ui.debounce( this.onBlur.bind( this ) )
		} );
};

/**
 * Display the card as collapsed.
 */
mw.cx.tools.IssueTrackingTool.prototype.showCollapsed = function () {
	this.actionButtons.clearItems().addItems( [ this.viewDetailsButton ] );

	this.icon.toggle( false );
	this.issuesLayout.toggle( false );
	this.warningsCount.toggle( this.numberOfWarnings > 0 );
	this.errorsCount.toggle( this.numberOfErrors > 0 );
};

/**
 * Display expanded card.
 */
mw.cx.tools.IssueTrackingTool.prototype.showDetails = function () {
	this.actionButtons.clearItems();
	if ( this.numberOfIssues > 1 ) {
		this.actionButtons.addItems( [ this.numberOfIssuesLabel, this.previousButton, this.nextButton ] );
	}

	this.icon.toggle( true );
	this.issuesLayout.toggle( true );
	this.warningsCount.toggle( false );
	this.errorsCount.toggle( false );
};

/**
 * Navigate to the next or previous issue.
 *
 * @param {number} increment +1 for next issue or -1 for the previous one
 */
mw.cx.tools.IssueTrackingTool.prototype.navigateIssues = function ( increment ) {
	this.currentIssue += increment;
	this.focusCurrentElement();
	this.openCurrentPanel();

	this.correctFocus( increment );
};

/**
 * Open current panel, which is determined by this.currentIssue.
 * Set disabled state for previous/next button, as needed.
 */
mw.cx.tools.IssueTrackingTool.prototype.openCurrentPanel = function () {
	this.issuesLayout.setTabPanel( this.currentIssue - 1 );
	this.numberOfIssuesLabel.setLabel(
		mw.msg( 'cx-tools-linter-issues-count', this.currentIssue, this.numberOfIssues )
	);

	this.previousButton.setDisabled( false );
	this.nextButton.setDisabled( false );
	if ( this.currentIssue === 1 ) {
		this.previousButton.setDisabled( true );
	}
	if ( this.currentIssue === this.numberOfIssues ) {
		this.nextButton.setDisabled( true );
	}
};

/**
 * Show detailed version of a card and focus on a current element.
 */
mw.cx.tools.IssueTrackingTool.prototype.onViewDetails = function () {
	this.showDetails();
	this.focusCurrentElement();

	// HACK: Used to avoid problems described in the comments for this.correctFocus()
	OO.ui.debounce( function () {
		this.focusCurrentElement();
	} ).call( this );
};

/**
 * Show collapsed version of a card if current focused element doesn't have a translation issue.
 */
mw.cx.tools.IssueTrackingTool.prototype.onBlur = function () {
	if ( !this.getCurrentPanel() ) {
		this.showCollapsed();
	}
};

mw.cx.tools.IssueTrackingTool.prototype.focusCurrentElement = function () {
	var node, id = this.allIssues[ this.currentIssue - 1 ].id;

	// If issue is global, i.e. not attached to any DOM node, we have nothing to focus
	if ( id === 'global' ) {
		return;
	}

	node = this.getNodeForId( id );
	if ( node ) {
		node.getFocusableElement().focus();
	}
};

/**
 * This method is a trick used to give focus to the correct element, when focus goes from blurred
 * state to focus of some section inside VE editing surface. VE surface gives focus to the first
 * section in that case. See ve.ce.Surface#onDocumentFocus.
 *
 * This method essentially focuses the same node that tries to get focus in
 * this.focusCurrentElement, but gets its focus stolen by VE code.
 *
 * @param {number} increment +1 or -1 indicating what was the previous issue in navigation
 */
mw.cx.tools.IssueTrackingTool.prototype.correctFocus = function ( increment ) {
	var previousNode, currentNode, bluring, focusableElement,
		previousIssueId = this.allIssues[ this.currentIssue - increment - 1 ].id,
		currentIssueId = this.allIssues[ this.currentIssue - 1 ].id;

	// If current issue is global, we don't steal focus from the previous node, because
	// we don't have any node which we can focus for unattached issues.
	if ( currentIssueId === 'global' ) {
		return;
	}

	previousNode = this.getNodeForId( previousIssueId );
	currentNode = this.getNodeForId( currentIssueId );

	// If previous issue was global, i.e. not attached to any DOM node, that is considerred
	// as case of blurred context, so correction of focus might be needed.
	bluring = ( previousIssueId === 'global' ) || ( previousNode && previousNode.blursEditingSurface() );
	focusableElement = currentNode && currentNode.getFocusableElement();

	if ( bluring && focusableElement ) {
		OO.ui.debounce( function () {
			focusableElement.focus();
			this.showDetails();
			this.openCurrentPanel();
		} ).call( this );
	}
};

/**
 * @param {number|string} id Section number or special values of 'title' and 'global'
 * @return {ve.ce.CXLintableNode|mw.cx.dm.Translation|null}
 */
mw.cx.tools.IssueTrackingTool.prototype.getNodeForId = function ( id ) {
	var node = this.veTarget.getTargetSectionElementFromSectionNumber( id );

	if ( !node && id === 'title' ) {
		node = this.veTarget.translationView.targetColumn.getTitleWidget();
	}

	if ( !node && id === 'global' ) {
		node = this.veTarget.getTranslation();
	}

	return node;
};

/**
 * Go through the list of IDs of nodes with issues,
 * extract the translation issues and process them:
 * - Set number of warnings/errors and total issue count
 * - Register events for nodes with issues
 * - Set array of all issues, which is array of plain
 * objects, that have ID and model properties.
 */
mw.cx.tools.IssueTrackingTool.prototype.processAllIssues = function () {
	var i, length, j, numOfIssues, id, node, issue, issues, allIssues = [];

	for ( i = 0, length = this.nodesWithIssues.length; i < length; i++ ) {
		id = this.nodesWithIssues[ i ];
		node = this.getNodeForId( id );

		if ( !node ) {
			continue;
		}

		// If there are issues not stored to any DOM element, they're stored
		// in mw.cx.dm.Translation
		if ( id === 'global' ) {
			issues = node.getTranslationIssues();
		} else {
			issues = node.getModel().getTranslationIssues();
		}

		numOfIssues = issues.length;
		this.numberOfIssues += numOfIssues;

		for ( j = 0; j < numOfIssues; j++ ) {
			issue = issues[ j ];

			if ( issue.getType() === 'error' ) {
				this.numberOfErrors++;
			} else if ( issue.getType() === 'warning' ) {
				this.numberOfWarnings++;
			}

			allIssues.push( {
				id: id,
				issue: issue
			} );
		}

		// Global issues aren't attached to any DOM node, so we cannot register events
		if ( id !== 'global' ) {
			this.registerEvents( node );
		}
	}

	this.allIssues = allIssues;
};

/**
 * Open the details panel for translation issue with a given name.
 *
 * @param {string} name
 */
mw.cx.tools.IssueTrackingTool.prototype.openIssueByName = function ( name ) {
	var i, length, issueObj, index;

	for ( i = 0, length = this.allIssues.length; i < length; i++ ) {
		issueObj = this.allIssues[ i ];

		if ( issueObj.issue.getName() === name ) {
			index = i;
			break;
		}
	}

	if ( index === undefined ) {
		return;
	}

	this.currentIssue = index + 1;
	this.showDetails();
	this.openCurrentPanel();
};

/* Register */
mw.cx.tools.translationToolFactory.register( mw.cx.tools.IssueTrackingTool );
