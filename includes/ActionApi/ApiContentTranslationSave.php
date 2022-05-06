<?php
/**
 * @copyright See AUTHORS.txt
 * @license GPL-2.0-or-later
 */

namespace ContentTranslation\ActionApi;

use ApiBase;
use ContentTranslation\AbuseFilterCheck;
use ContentTranslation\CategoriesStorageManager;
use ContentTranslation\RestbaseClient;
use ContentTranslation\SiteMapper;
use ContentTranslation\Translation;
use ContentTranslation\TranslationStorageManager;
use ContentTranslation\TranslationUnit;
use ContentTranslation\TranslationWork;
use ContentTranslation\Translator;
use Deflate;
use Exception;
use FormatJson;
use Language;
use MediaWiki\MediaWikiServices;
use Wikimedia\ParamValidator\ParamValidator;
use Wikimedia\ParamValidator\TypeDef\IntegerDef;
use Wikimedia\ParamValidator\TypeDef\StringDef;

class ApiContentTranslationSave extends ApiBase {
	/**
	 * 64KB
	 */
	private const SQL_BLOB_MAX_SIZE = 65535;

	public function execute() {
		$params = $this->extractRequestParams();

		$lb = MediaWikiServices::getInstance()->getService( 'ContentTranslation.LoadBalancer' );
		if ( $lb->getConnection( DB_PRIMARY )->isReadOnly() ) {
			$this->dieReadOnly();
		}

		$user = $this->getUser();
		$block = $user->getBlock();
		if ( $block && $block->isSitewide() ) {
			$this->dieBlocked( $block );
		}

		if ( !Language::isKnownLanguageTag( $params['from'] ) ) {
			$this->dieWithError( 'apierror-cx-invalidsourcelanguage', 'invalidsourcelanguage' );
		}

		if ( !Language::isKnownLanguageTag( $params['to'] ) ) {
			$this->dieWithError( 'apierror-cx-invalidtargetlanguage', 'invalidtargetlanguage' );
		}

		$progress = FormatJson::decode( $params['progress'], true );
		if ( !is_array( $progress ) ) {
			$this->dieWithError( 'apierror-cx-invalidprogress', 'invalidprogress' );
		}

		if ( $user->pingLimiter( 'cxsave' ) ) {
			$this->dieWithError( 'apierror-ratelimited' );
		}

		$sourceCategories = $params['sourcecategories'];
		$targetCategories = $params['targetcategories'];
		if ( !$this->isValidCategoriesJSON( $sourceCategories ) ) {
			$this->dieWithError( 'apierror-cx-invalidsourcecategories', 'invalidsourcecategories' );
		}
		if ( !$this->isValidCategoriesJSON( $targetCategories ) ) {
			$this->dieWithError( 'apierror-cx-invalidtargetcategories', 'invalidtargetcategories' );
		}

		$translator = new Translator( $user );
		$translation = $this->saveTranslation( $params, $translator );
		$translationId = $translation->getTranslationId();

		$content = Deflate::inflate( $params['content'] );
		if ( !$content->isGood() ) {
			$this->dieWithError( 'deflate-invaliddeflate', 'invaliddeflate' );
		}
		$translationUnits = $this->getTranslationUnits(
			$content->getValue(),
			$translationId
		);
		$this->saveTranslationUnits( $translationUnits, $translation );
		$validationResults = $this->validateTranslationUnits( $translationUnits, $translation );

		$this->saveCategories( $sourceCategories, $targetCategories, $translation );

		$result = [
			'result' => 'success',
			'validations' => $validationResults,
			'translationid' => $translationId
		];
		$this->getResult()->addValue( null, $this->getModuleName(), $result );
	}

	protected function validateTranslationUnits( $translationUnits, Translation $translation ) {
		$validationResults = [];

		$title = \Title::newFromText( $translation->getData()['targetTitle'] );
		if ( !$title ) {
			return $validationResults;
		}

		$checker = new AbuseFilterCheck( $this->getUser(), $title );

		foreach ( $translationUnits as $translationUnit ) {
			if ( !$translationUnit->getValidate() ) {
				continue;
			}
			$sectionId = $translationUnit->getSectionId();
			if ( $sectionId === 'mwcx-source-title' ) {
				$validationResults[$sectionId] =
					$checker->checkTitle();
			} else {
				$validationResults[$sectionId] =
					$this->validateTranslationUnit( $checker, $title, $translationUnit );
			}
		}

		return $validationResults;
	}

	/**
	 * Validate the section content using AbuseFilterCheck
	 * @param AbuseFilterCheck $checker
	 * @param \Title $title Target title
	 * @param TranslationUnit $translationUnit
	 * @return array List of any rule violations
	 */
	protected function validateTranslationUnit(
		AbuseFilterCheck $checker, \Title $title, TranslationUnit $translationUnit
	) {
		$restbaseClient = new RestbaseClient( $this->getConfig() );
		$sectionHTML = $translationUnit->getContent();
		$results = [];
		// We need to catch any exceptions here - For example, if restbase is down
		// it should not affect the saving of translations.
		try {
			// The section content is HTML. AbuseFilter need wikitext.
			$text = $restbaseClient->convertHtmlToWikitext( $title, $sectionHTML );
			$results = $checker->checkSection( $text );
		} catch ( Exception $e ) {
			// Validation failed. But proceed.
		}
		return $results;
	}

	/**
	 * @param array $params
	 * @param Translator $translator
	 * @return Translation
	 */
	protected function saveTranslation( array $params, Translator $translator ) {
		global $wgContentTranslationVersion;

		$work = new TranslationWork( $params['sourcetitle'], $params['from'], $params['to'] );
		$existingTranslation = Translation::findForTranslator( $work, $translator );

		if ( $existingTranslation ) {
			$data = $existingTranslation->getData();
		} else {
			$translations = Translation::getConflictingTranslations( $work );

			if ( $translations !== [] ) {
				$this->dieWithError( 'apierror-cx-inuse', 'noaccess' );
			}

			// First time save, add relevant fields
			$data = [
				'sourceTitle' => $work->getPage(),
				'sourceLanguage' => $work->getSourceLanguage(),
				'targetLanguage' => $work->getTargetLanguage(),
				'sourceURL' => SiteMapper::getPageURL(
					$work->getSourceLanguage(),
					$work->getPage()
				),
			];
		}

		// Update updateable fields
		$data['targetTitle'] = $params['title'];
		$data['sourceRevisionId'] = $params['sourcerevision'];
		$data['status'] = 'draft';
		$data['progress'] = $params['progress'];
		$data['cxVersion'] = $params['cxversion'] ?? $wgContentTranslationVersion;

		// Save the translation
		$translation = new Translation( $data );
		$translation->save( $translator );

		// Associate the translation with the translator
		$translationId = $translation->getTranslationId();
		$translator->addTranslation( $translationId );

		return $translation;
	}

	protected function getTranslationUnits( $content, $translationId ) {
		$translationUnits = [];
		if ( trim( $content ) === '' ) {
			$this->dieWithError( [ 'apierror-paramempty', 'content' ], 'invalidcontent' );
		}

		$units = json_decode( $content, true );
		foreach ( $units as $tuData ) {
			if ( !isset( $tuData['sectionId'] ) || !isset( $tuData['origin'] ) ) {
				$this->dieWithError( 'apierror-cx-invalidsectiondata', 'invalidcontent' );
			}
			'@phan-var array $tuData';

			// Make sure all translation unit fields are defined.
			if ( !isset( $tuData['sequenceId'] ) ) {
				$tuData['sequenceId'] = null;
			}
			if ( !isset( $tuData['content'] ) ) {
				// Content can be null in case translator clear the section.
				$tuData['content'] = null;
			}
			if ( !isset( $tuData['validate'] ) ) {
				$tuData['validate'] = false;
			}
			$tuData['translationId'] = $translationId;
			$translationUnits[] = new TranslationUnit( $tuData );
		}

		return $translationUnits;
	}

	/**
	 * @param array $translationUnits
	 * @param Translation $translation Recently saved parent translation object
	 */
	protected function saveTranslationUnits( $translationUnits, Translation $translation ) {
		$newTranslation = $translation->lastSaveWasCreate();
		foreach ( $translationUnits as $translationUnit ) {
			TranslationStorageManager::save( $translationUnit, $newTranslation );
		}
	}

	/**
	 * Validate categories JSON param.
	 *
	 * @param string $categories JSON encoded array of categories
	 * @return bool
	 */
	protected function isValidCategoriesJSON( $categories ) {
		// Categories are optional, so empty categories param is valid.
		if ( $categories === null || $categories === '' ) {
			return true;
		}

		$parsedCategories = FormatJson::parse( $categories );
		return $parsedCategories->isGood();
	}

	/**
	 * Save categories in cx_corpora table, if any are supplied.
	 *
	 * @param string $sourceCategories JSON encoded array of source categories
	 * @param string $targetCategories JSON encoded array of target categories
	 * @param Translation $translation Recently saved parent translation object
	 */
	protected function saveCategories(
		$sourceCategories, $targetCategories, Translation $translation
	) {
		if ( !$sourceCategories && !$targetCategories ) {
			return;
		}

		$translationId = $translation->getTranslationId();
		$newTranslation = $translation->lastSaveWasCreate();

		CategoriesStorageManager::save(
			$translationId,
			$sourceCategories,
			$targetCategories,
			$newTranslation
		);
	}

	public function getAllowedParams() {
		return [
			'from' => [
				ParamValidator::PARAM_REQUIRED => true,
			],
			'to' => [
				ParamValidator::PARAM_REQUIRED => true,
			],
			'sourcetitle' => [
				ParamValidator::PARAM_REQUIRED => true,
			],
			'title' => [
				ParamValidator::PARAM_REQUIRED => true,
			],
			'content' => [
				ParamValidator::PARAM_REQUIRED => true,
			],
			'sourcerevision' => [
				ParamValidator::PARAM_TYPE => 'integer',
				ParamValidator::PARAM_REQUIRED => true,
			],
			'progress' => [
				ParamValidator::PARAM_REQUIRED => true,
			],
			'cxversion' => [
				ParamValidator::PARAM_TYPE => 'integer',
				// Making this required immediately would cause issues for ongoing translations
				// during deployment. Maybe this doesn't ever need to be required.
				ParamValidator::PARAM_REQUIRED => false,
				ApiBase::PARAM_RANGE_ENFORCE => true,
				IntegerDef::PARAM_MIN => 1,
				IntegerDef::PARAM_MAX => 2,
			],
			'sourcecategories' => [
				ParamValidator::PARAM_TYPE => 'string',
				// We don't always save categories when saving translation. Only save
				// categories when user changes target categories by reordering,
				// removing or adding. Source categories are saved only once per
				// session and target categories are saved for every change.
				ParamValidator::PARAM_REQUIRED => false,
				// Source and target categories are saved in cx_corpora table, whose
				// content column is MEDIUMBLOB, which has 16MB limit, but we limit
				// the size of categories at BLOB limit, which is 64KB.
				StringDef::PARAM_MAX_BYTES => self::SQL_BLOB_MAX_SIZE
			],
			'targetcategories' => [
				ParamValidator::PARAM_TYPE => 'string',
				ParamValidator::PARAM_REQUIRED => false,
				StringDef::PARAM_MAX_BYTES => self::SQL_BLOB_MAX_SIZE
			]
		];
	}

	public function needsToken() {
		return 'csrf';
	}

	public function isWriteMode() {
		return true;
	}

	public function isInternal() {
		return true;
	}
}