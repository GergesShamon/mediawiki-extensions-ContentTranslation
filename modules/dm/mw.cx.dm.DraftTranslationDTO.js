// This class corresponds with the CXDraftTranslationDTO class in PHP
class MwCxDmDraftTranslationDTO {
	constructor( {
		id,
		targetTitle,
		status,
		progress,
		sectionTranslationId,
		targetURL,
		sourceRevisionId,
		targetRevisionId,
		translationUnits,
		targetCategories
	} ) {
		this.id = id;
		this.targetTitle = targetTitle;
		this.status = status;
		this.progress = progress;
		this.sectionTranslationId = sectionTranslationId;
		this.targetURL = targetURL;
		this.sourceRevisionId = sourceRevisionId;
		this.targetRevisionId = targetRevisionId;
		this.translationUnits = translationUnits;
		this.targetCategories = targetCategories;
	}
}

mw.cx.dm.DraftTranslationDTO = MwCxDmDraftTranslationDTO;
