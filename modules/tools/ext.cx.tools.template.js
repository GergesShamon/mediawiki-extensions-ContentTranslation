/*!
 * ContentTranslation Tools
 * A tool that allows editors to translate pages from one language
 * to another with the help of machine translation and other translation tools
 *
 * @ingroup Extensions
 * @copyright See AUTHORS.txt
 * @license GPL-2.0+
 */
( function ( $, mw ) {
	'use strict';

	var targetTemplateNamespaceRequestCache = {},
		cachedTemplateRequests = {};

	/**
	 * TemplateTool encapsulates the handling of templates in translation.
	 *
	 * It determines the best course of action and implements it. Some possible
	 * actions are to make the template non-editable, remove it or expand it as
	 * inline content (destruction).
	 *
	 * @class
	 */
	function TemplateTool( element ) {
		this.$template = $( element );
		this.templateData = null;
		this.templateTitle = null;
		this.templateMapping = null;
	}

	/**
	 * Make it a non-template - treat it as native html.
	 */
	TemplateTool.prototype.deconstruct = function () {
		mw.log( '[CX] Deconstructing template ' + this.templateTitle );
		this.$template.removeAttr( 'typeof about data-mw data-parsoid' );
	};

	/**
	 * Get the template data from source section. Target section
	 * might not have it always.
	 */
	TemplateTool.prototype.getTemplateData = function () {
		var templateData,
			aboutAttr = this.$template.attr( 'about' );

		$( '[about="' + aboutAttr + '"]' ).each( function ( index, fragment ) {
			var $fragment = $( fragment );

			if (
				// Not all fragments are mw:Transclusion
				// See https://phabricator.wikimedia.org/T97220
				$fragment.is( '[typeof*="mw:Transclusion"]' ) &&
				$fragment.attr( 'data-mw' )
			) {
				templateData = $fragment.data( 'mw' );
				// Exit.
				return false;
			}
		} );

		return templateData;
	};

	/**
	 * Get the namespace translation in a wiki.
	 * Uses the canonical name for lookup.
	 *
	 * @param {string} language
	 * @return {jQuery.Promise}
	 */
	function getTemplateNamespaceTranslation( language ) {
		var request;

		if ( targetTemplateNamespaceRequestCache[ language ] ) {
			return targetTemplateNamespaceRequestCache[ language ];
		}

		// TODO: Refactor to avoid global reference
		request = mw.cx.siteMapper.getApi( language ).get( {
			action: 'query',
			meta: 'siteinfo',
			siprop: 'namespaces',
			format: 'json'
		}, {
			dataType: 'jsonp',
			// This prevents warnings about the unrecognized parameter "_"
			cache: true
		} ).then( function ( response ) {
			var namespaceId, namespaceObj;

			for ( namespaceId in response.query.namespaces ) {
				namespaceObj = response.query.namespaces[ namespaceId ];
				if ( namespaceObj.canonical === 'Template' ) {
					return namespaceObj[ '*' ];
				}
			}
		} );
		targetTemplateNamespaceRequestCache[ language ] = request;

		return request;
	}

	/**
	 * Get the template mapping if any set by source.filter module
	 */
	TemplateTool.prototype.getTemplateMapping = function () {
		return this.$template.data( 'template-mapping' );
	};

	/**
	 * Adapt a template using template mapping
	 */
	TemplateTool.prototype.adapt = function () {
		mw.log( '[CX] Adapting template ' + this.templateTitle + ' based on mapping.' );
		// Update the name of the template
		this.templateData.parts[ 0 ].template.target.wt = this.templateMapping.targetname;
		this.templateData.parts[ 0 ].template.params = this.getTargetParams( this.getSourceParams() );
		this.$template.attr( 'data-mw', JSON.stringify( this.templateData ) );

		// Make templates uneditable unless whitelisted
		if ( !this.templateMapping.editable ) {
			this.$template.data( 'editable', false );
		}
	};

	/**
	 * Get the source parameters for the template
	 *
	 * @return {Object} Source parameters - key-value pairs.
	 */
	TemplateTool.prototype.getSourceParams = function () {
		return this.templateData.parts[ 0 ].template.params;
	};

	/**
	 * Get the target parameters for the template after mapping
	 *
	 * @return {Object} Target parameters - key-value pairs.
	 */
	TemplateTool.prototype.getTargetParams = function ( sourceParams ) {
		var targetParams = {},
			self = this;

		// Update the template parameters
		$.each( sourceParams, function ( key, value ) {
			// Drop empty parameters
			// TODO: Shouldn't we only do this if the parameter is named?
			// I can imagine {{Foo||baz}} breaks badly if we remove the one from middle.
			if ( $.trim( value ) === '' ) {
				return;
			}

			// Copy over other parameters, but map known keys
			if ( self.templateMapping.parameters &&
				self.templateMapping.parameters[ key ] !== undefined
			) {
				key = self.templateMapping.parameters[ key ];
			}

			targetParams[ key ] = value;
		} );

		return targetParams;
	};

	/**
	 * Adapt the template name to the equivalent in the target wiki
	 */
	TemplateTool.prototype.adaptTitle = function ( targetTitle ) {
		var self = this;
		// Update the name of the template. We need template name without namespace
		getTemplateNamespaceTranslation( mw.cx.targetLanguage )
			.done( function ( translatedNamespace ) {
				var templateName;

				templateName = targetTitle.replace(
					new RegExp( '^' + mw.RegExp.escape( translatedNamespace + ':' ) ),
					''
				);
				self.templateData.parts[ 0 ].template.target.wt = templateName;
				self.$template.attr( 'data-mw', JSON.stringify( self.templateData ) );
			} );
	};

	/**
	 * Marks template non-editable.
	 */
	TemplateTool.prototype.markReadOnly = function () {
		var templateFragments;

		mw.log( '[CX] Marking template ' + this.templateTitle + ' read only.' );
		templateFragments = this.$template.attr( 'about' );
		if ( templateFragments ) {
			$( '[about="' + templateFragments + '"]' ).prop( 'contenteditable', false );
		}
		// TODO: This will be machine translated content. Do we need to replace it
		// exact copy of source?
	};

	/**
	 * Process the template. Figure out what we can do.
	 *
	 * @return {jQuery.Promise}
	 */
	TemplateTool.prototype.process = function () {
		var self = this;

		this.templateData = this.getTemplateData();
		this.templateMapping = this.getTemplateMapping();

		if ( !this.templateData || ( this.templateData.parts && this.templateData.parts.length > 1 ) ) {
			// Either the template is missing mw data or having multiple parts.
			// At present, we cannot handle them.
			// An example: {{Version |o |1.1}}{{efn-ua |Due to an incident ...<ref name="releases" />}}
			// in enwiki:Debian, Timeline table.
			mw.log( '[CX] Skipping template. Missing template data.' );
			return $.Deferred().resolve().promise();
		}

		this.templateTitle = this.templateData.parts[ 0 ].template.target.wt;

		return this.getTargetTemplate()
			.then( function ( targetTitle ) {
				self.markReadOnly();
				if ( self.templateMapping ) {
					self.adapt();
				} else if ( targetTitle ) {
					self.adaptTitle( targetTitle );
				} else {
					self.deconstruct();
				}
			} )
			.fail( function () {
				self.deconstruct();
			} );
	};

	/**
	 * Fetch the template from target wiki.
	 *
	 * @return {jQuery.Promise}
	 * @return {funtion} return.done
	 * @return {number} return.done.data The page id
	 */
	TemplateTool.prototype.getTargetTemplate = function () {
		var api, request,
			cacheKey = mw.cx.targetLanguage + ':' + this.templateTitle;

		if ( cachedTemplateRequests[ cacheKey ] ) {
			return cachedTemplateRequests[ cacheKey ];
		}

		// TODO: Avoid direct access to globals
		api = mw.cx.siteMapper.getApi( mw.cx.sourceLanguage );

		// Note that we use canonical namespace 'Template' for title.
		request = api.get( {
			action: 'query',
			titles: 'Template:' + this.templateTitle,
			prop: 'langlinks',
			lllang: mw.cx.siteMapper.getWikiDomainCode( mw.cx.targetLanguage ),
			redirects: true,
			format: 'json'
		}, {
			dataType: 'jsonp',
			// This prevents warnings about the unrecognized parameter "_"
			cache: true
		} ).then( function ( response ) {
			var page,
				pageId = Object.keys( response.query.pages )[ 0 ];
			page = response.query.pages[ pageId ];
			if ( page && page.langlinks ) {
				return page.langlinks[ 0 ][ '*' ];
			}
		} );

		cachedTemplateRequests[ cacheKey ] = request;

		return request;
	};

	/**
	 * Processes each template in given section.
	 *
	 * @param {jQuery} $section Content translation section
	 */
	function processTemplates( $section ) {
		var i, template, templates = [];

		if ( $section.is( '[typeof*="mw:Transclusion"]' ) ) {
			templates.push( $section );
		}
		templates = templates.concat(
			// Convert the internal templates to a js array
			$.makeArray( $section.find( '[typeof*="mw:Transclusion"]' ) )
		);
		for ( i = 0; i < templates.length; i++ ) {
			template = new TemplateTool( templates[ i ] );
			template.process();
		}
	}

	if ( typeof QUnit !== undefined ) {
		// Expose this module for unit testing
		mw.cx.TemplateTool = TemplateTool;
	}

	$( function () {
		mw.hook( 'mw.cx.translation.postMT' ).add( processTemplates );
	} );
}( jQuery, mediaWiki ) );
