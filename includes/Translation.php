<?php

namespace ContentTranslation;

use MediaWiki\MediaWikiServices;
use MediaWiki\Storage\NameTableAccessException;
use Wikimedia\Rdbms\IDatabase;

class Translation {
	private bool $isNew = false;

	/** @var array */
	public $translation;

	public function __construct( $translation ) {
		$this->translation = $translation;
	}

	/**
	 * @return bool Whether the last CRUD operation on this translation was "create"
	 */
	public function isNew(): bool {
		return $this->isNew;
	}

	public function setIsNew( bool $isNew ): void {
		$this->isNew = $isNew;
	}

	/**
	 * Get the stats for all translations in draft or published status.
	 * @return array
	 */
	public static function getStats() {
		return array_merge( self::getDraftStats(), self::getPublishedStats() );
	}

	/**
	 * Get the stats for all translations in draft status and not having
	 * any published URL.
	 * If the translation is with draft status and has a target_url it
	 * was published atleast once.
	 * @return array
	 */
	public static function getDraftStats() {
		$lb = MediaWikiServices::getInstance()->getService( 'ContentTranslation.LoadBalancer' );
		$dbr = $lb->getConnection( DB_REPLICA );

		$rows = $dbr->newSelectQueryBuilder()
			->select( [
				'sourceLanguage' => 'translation_source_language',
				'targetLanguage' => 'translation_target_language',
				'status' => 'translation_status',
				'count' => 'COUNT(*)',
				'translators' => 'COUNT(DISTINCT translation_started_by)',
			] )
			->from( 'cx_translations' )
			->where( [
				'translation_status' => 'draft',
				'translation_target_url' => null,
			] )
			->caller( __METHOD__ )
			->groupBy( [
				'translation_source_language',
				'translation_target_language',
			] )
			->fetchResultSet();

		$result = [];

		foreach ( $rows as $row ) {
			$result[] = (array)$row;
		}

		return $result;
	}

	/**
	 * Get the stats for all translations in published status or having
	 * a published URL.
	 * If the translation has a target_url it was published atleast once.
	 * @return array
	 */
	public static function getPublishedStats() {
		$lb = MediaWikiServices::getInstance()->getService( 'ContentTranslation.LoadBalancer' );
		$dbr = $lb->getConnection( DB_REPLICA );

		$rows = $dbr->newSelectQueryBuilder()
			->select( [
				'sourceLanguage' => 'translation_source_language',
				'targetLanguage' => 'translation_target_language',
				// A published translation can be in deleted state too. But for the purpose
				// of stats, it should be counted as published. 'deleted' here just means
				// the soft deletion of entry from CX tables. Not the article deletion.
				// For this, use hard coded quoted value 'published' as status.
				"'published' as status",
				'count' => 'COUNT(*)',
				'translators' => 'COUNT(DISTINCT translation_started_by)',
			] )
			->from( 'cx_translations' )
			->where( self::getPublishedCondition( $dbr ) )
			->groupBy( [
				'translation_source_language',
				'translation_target_language',
			] )
			->caller( __METHOD__ )
			->fetchResultSet();

		$result = [];
		foreach ( $rows as $row ) {
			$result[] = (array)$row;
		}

		return $result;
	}

	/**
	 * Get time-wise cumulative number of deletions for given
	 * language pairs, with given interval.
	 *
	 * @param string $interval
	 * @return array<string,array>
	 */
	public static function getDeletionTrend( $interval ): array {
		$lb = MediaWikiServices::getInstance()->getDBLoadBalancer();
		$dbr = $lb->getConnection( DB_REPLICA );

		$conditions = [];

		$changeTagDefStore = MediaWikiServices::getInstance()->getChangeTagDefStore();
		try {
			$conditions['ct_tag_id'] = $changeTagDefStore->getId( 'contenttranslation' );
		} catch ( NameTableAccessException $exception ) {
			// No translations published yet, so can skip query
			return [];
		}

		$groupBy = [];
		if ( $interval === 'week' ) {
			$groupBy = [
				'YEARWEEK(ar_timestamp, 3)',
			];
		} elseif ( $interval === 'month' ) {
			$groupBy = [
				'YEAR(ar_timestamp)',
				'MONTH(ar_timestamp)',
			];
		}

		$rows = $dbr->newSelectQueryBuilder()
			->select( [ 'ar_timestamp', 'count' => 'COUNT(ar_page_id)' ] )
			->from( 'change_tag' )
			->join( 'archive', null, 'ar_rev_id = ct_rev_id' )
			->where( $conditions )
			->groupBy( $groupBy )
			->caller( __METHOD__ )
			->fetchResultSet();

		$count = 0;
		$result = [];
		$dm = new DateManipulator( $interval );
		foreach ( $rows as $row ) {
			$count += (int)$row->count;
			$time = $dm->getIntervalIdentifier( $row->ar_timestamp )->format( 'U' );
			$result[$time] = [
				'count' => $count,
				'delta' => (int)$row->count,
			];
		}

		return $result;
	}

	/**
	 * Get time-wise cumulative number of translations for given
	 * language pairs, with given interval.
	 *
	 * @param string|null $source Source language code
	 * @param string|null $target Target language code
	 * @param string $status Status of translation. Either 'published' or 'draft'
	 * @param string $interval 'weekly' or 'monthly' trend
	 * @param int|null $translatorId
	 * @return array
	 */
	public static function getTrendByStatus(
		$source, $target, $status, $interval, $translatorId
	) {
		$lb = MediaWikiServices::getInstance()->getService( 'ContentTranslation.LoadBalancer' );
		$dbr = $lb->getConnection( DB_REPLICA );

		$conditions = [];
		if ( $status === 'published' ) {
			$conditions[] = self::getPublishedCondition( $dbr );
		} else {
			$conditions[] = $dbr->makeList(
				[
					'translation_status' => 'draft',
					'translation_target_url' => null,
				],
				LIST_AND
			);
		}

		if ( $source !== null ) {
			$conditions['translation_source_language'] = $source;
		}
		if ( $target !== null ) {
			$conditions['translation_target_language'] = $target;
		}
		if ( $translatorId !== null ) {
			$conditions['translation_last_update_by'] = $translatorId;
		}
		$groupBy = [];
		if ( $interval === 'week' ) {
			$groupBy = [
				'YEARWEEK(translation_last_updated_timestamp, 3)',
			];
		} elseif ( $interval === 'month' ) {
			$groupBy = [
				'YEAR(translation_last_updated_timestamp)',
				'MONTH(translation_last_updated_timestamp)',
			];
		}

		$rows = $dbr->newSelectQueryBuilder()
			->select( [ 'date' => 'translation_last_updated_timestamp', 'count' => 'COUNT(translation_id)' ] )
			->from( 'cx_translations' )
			->where( $conditions )
			->groupBy( $groupBy )
			->caller( __METHOD__ )
			->fetchResultSet();

		$count = 0;
		$result = [];
		$dm = new DateManipulator( $interval );
		foreach ( $rows as $row ) {
			$count += (int)$row->count;
			$time = $dm->getIntervalIdentifier( $row->date )->format( 'U' );
			$result[$time] = [
				'count' => $count,
				'delta' => (int)$row->count,
			];
		}

		return $result;
	}

	public function getTranslationId() {
		return $this->translation['id'];
	}

	public function getSourceTitle(): string {
		return $this->translation['sourceTitle'];
	}

	public function getSourceLanguage(): string {
		return $this->translation['sourceLanguage'];
	}

	public function getTargetLanguage(): string {
		return $this->translation['targetLanguage'];
	}

	/**
	 * Return the underlying data fields.
	 *
	 * @return array
	 */
	public function getData() {
		return $this->translation;
	}

	public static function getPublishedCondition( IDatabase $db ) {
		return $db->makeList(
			[
				'translation_status' => 'published',
				'translation_target_url IS NOT NULL',
			],
			LIST_OR
		);
	}

	/**
	 * Get all published translation records.
	 *
	 * @param string $from Source language code
	 * @param string $to Target language code
	 * @param int $limit Number of records to fetch atmost
	 * @param int $offset Offset from which at most $limit records to fetch
	 * @return array
	 */
	public static function getAllPublishedTranslations( $from, $to, $limit, $offset ) {
		$lb = MediaWikiServices::getInstance()->getService( 'ContentTranslation.LoadBalancer' );
		$dbr = $lb->getConnection( DB_REPLICA );
		$conditions = [];
		$conditions[] = self::getPublishedCondition( $dbr );

		if ( $from ) {
			$conditions['translation_source_language'] = $from;
		}

		if ( $to ) {
			$conditions['translation_target_language'] = $to;
		}

		$queryBuilder = $dbr->newSelectQueryBuilder()
			->select( [
				'translationId' => 'translation_id',
				'sourceTitle' => 'translation_source_title',
				'targetTitle' => 'translation_target_title',
				'sourceLanguage' => 'translation_source_language',
				'sourceRevisionId' => 'translation_source_revision_id',
				'targetRevisionId' => 'translation_target_revision_id',
				'targetLanguage' => 'translation_target_language',
				'sourceURL' => 'translation_source_url',
				'targetURL' => 'translation_target_url',
				'publishedDate' => 'translation_last_updated_timestamp',
				'stats' => 'translation_progress',
			] )
			->from( 'cx_translations' )
			->where( $conditions )
			->limit( $limit )
			->caller( __METHOD__ );

		if ( $offset ) {
			$queryBuilder->offset( $offset );
		}

		$rows = $queryBuilder->fetchResultSet();

		$result = [];

		foreach ( $rows as $row ) {
			$translation = (array)$row;
			$translation['stats'] = json_decode( $translation['stats'] );
			$result[] = $translation;
		}

		return $result;
	}

	/**
	 * @param \stdClass $row
	 * @return Translation
	 */
	public static function newFromRow( $row ) {
		$fields = [
			'id' => (int)$row->translation_id,
			'sourceTitle' => $row->translation_source_title,
			'targetTitle' => $row->translation_target_title,
			'sourceLanguage' => $row->translation_source_language,
			'targetLanguage' => $row->translation_target_language,
			'sourceRevisionId' => $row->translation_source_revision_id,
			'targetRevisionId' => $row->translation_target_revision_id,
			'sourceURL' => $row->translation_source_url,
			'targetURL' => $row->translation_target_url,
			'status' => $row->translation_status,
			'startTimestamp' => $row->translation_start_timestamp,
			'lastUpdateTimestamp' => $row->translation_last_updated_timestamp,
			'progress' => $row->translation_progress,
			'startedTranslator' => $row->translation_started_by,
			'lastUpdatedTranslator' => $row->translation_last_update_by,
			'cxVersion' => 1,
		];

		// BC code to gracefully handle lack of schema change
		if ( isset( $row->translation_cx_version ) ) {
			$fields['cxVersion'] = (int)$row->translation_cx_version;
		}

		return new Translation( $fields );
	}
}
