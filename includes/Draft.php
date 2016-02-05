<?php
/**
 * ContentTranslation Translation Draft
 * Database access method for cx_drafts table.
 */
namespace ContentTranslation;

class Draft {
	public static function save( $translationId, $content ) {
		$dbw = Database::getConnection( DB_MASTER );
		$values = array(
			'draft_id' => $translationId,
			'draft_content' => $content,
			'draft_timestamp' => $dbw->timestamp(),
		);
		$dbw->upsert(
			'cx_drafts',
			$values,
			array( 'draft_id' ),
			$values,
			__METHOD__
		);
	}

	/**
	 * Delete the draft for the given draftId
	 * @param {int} $draftId
	 */
	public static function delete( $draftId ) {
		$dbw = Database::getConnection( DB_MASTER );
		$dbw->delete(
			'cx_drafts',
			array(
				'draft_id' => $draftId,
			),
			__METHOD__
		);
	}

	/**
	 * Fetch the draft for the given draftId
	 * @param {int} $draftId
	 * @return array|null
	 */
	public static function fetch( $draftId ) {
		$dbw = Database::getConnection( DB_MASTER );
		$row = $dbw->selectRow(
			'cx_drafts',
			'*',
			array(
				'draft_id' => $draftId,
			),
			__METHOD__
		);

		if ( $row ) {
			return array(
				'draftId' => $row->draft_id,
				'draftContent' => $row->draft_content,
				'draftTimestamp' => $row->draft_timestamp,
			);
		}

		return null;
	}
}
