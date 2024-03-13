import mtValidator from "../../../utils/mtValidator";
import cxTranslatorApi from "../../../wiki/cx/api/translator";
import PublishFeedbackMessage from "../../../wiki/cx/models/publishFeedbackMessage";
import { validateParallelCorporaPayload } from "../../../utils/parallelCorporaValidator";
import translator from "@/wiki/cx/api/translator";

/**
 * This action initially clears all existing MT publish feedback
 * messages. Then, it validates the application/currentSourceSection
 * state variable for Machine Translation abuse, using mtValidator module.
 * If the validation status is "success", it returns null. If not,
 * it returns the appropriate warning or error (depending on the validation
 * status) publish feedback message.
 *
 * @param {object} context
 * @param {object} context.rootState
 * @return {Promise<PublishFeedbackMessage|null>}
 */
function validateMT({ rootState }) {
  /** @var {PageSection} */
  const { currentSourceSection: section, targetLanguage } =
    rootState.application;
  /**
   * Percentage of modified MT for current source section
   * as integer from 1 to 100
   * @type {number}
   */
  const mtValidationScore = mtValidator.getMTScoreForPageSection(
    section,
    targetLanguage
  );

  /**
   * Status for the given MT validation score
   * @type {"failure"|"warning"|"success"}
   */
  const mtValidationStatus = mtValidator.getScoreStatus(mtValidationScore);

  // If machine translation has been modified above threshold percentage
  // the method returns without adding any MT feedback message
  if (mtValidationStatus === "success") {
    return null;
  }

  // If validation status is "failure" or "warning", then add an MT feedback
  // message containing the related warnings/errors
  const unmodifiedPercentage = 100 - mtValidationScore;
  const status = mtValidationStatus === "failure" ? "error" : "warning";
  let title, messageBody;

  if (status === "warning") {
    title = mw
      .message("cx-sx-publisher-mt-abuse-message-title", unmodifiedPercentage)
      .plain();
    messageBody = mw.message("cx-sx-publisher-mt-abuse-message-body").plain();
  } else {
    title = mw
      .message("cx-sx-publisher-mt-abuse-error-title", unmodifiedPercentage)
      .plain();
    messageBody = mw.message("cx-sx-publisher-mt-abuse-error-body").plain();
  }

  return new PublishFeedbackMessage({
    title,
    text: messageBody,
    status,
    type: "mt",
  });
}

/**
 * This action is called:
 * a. after each segment translation (either by clicking on the "Apply the translation" button
 * or by editing a segment in the Visual Editor),
 * b. just before publishing a section translation
 * It basically sends a request to the "sxsave" with the proper payload, to store the parallel
 * corpora and create/update the translation in the "cx_translations" and "cx_section_translations"
 * database tables.
 *
 * @param {object} context
 * @param {object} context.rootState
 * @param {object} context.rootGetters
 * @return {Promise<number|PublishFeedbackMessage|null>}
 */
function saveTranslation({ rootState, rootGetters }) {
  const sourcePage = rootGetters["application/getCurrentPage"];
  const {
    /** @type {PageSection} */
    currentSourceSection,
    /** @type {SectionSuggestion} */
    sourceLanguage,
    targetLanguage,
  } = rootState.application;

  const sourceTitle = sourcePage.title;
  const targetTitle =
    rootGetters["application/getTargetPageTitleForPublishing"];

  const supportedMTProviders = rootGetters["mediawiki/getSupportedMTProviders"](
    sourceLanguage,
    targetLanguage
  );

  const baseSectionId = rootGetters["application/getParallelCorporaBaseId"];
  const units = currentSourceSection.getParallelCorporaUnits(baseSectionId);
  units.forEach((unit) =>
    validateParallelCorporaPayload(unit, supportedMTProviders)
  );

  const progress = currentSourceSection.getTranslationProgress(targetLanguage);
  const isSandbox = rootGetters["application/isSandboxTarget"];

  /**
   * saveTranslation api method returns null on success and a PublishFeedbackMessage upon failure
   * @type {Promise<number|PublishFeedbackMessage>}
   */
  return cxTranslatorApi.saveTranslation({
    sourceTitle,
    targetTitle,
    // pass a dummy string to be stored as "cxsx_source_section_title" inside "cx_section_translations" table for lead sections
    sourceSectionTitle: currentSourceSection.sourceSectionTitleForPublishing,
    // pass a dummy string to be stored as "cxsx_target_section_title" inside "cx_section_translations" table for lead sections
    targetSectionTitle: currentSourceSection.targetSectionTitleForPublishing,
    sourceLanguage,
    targetLanguage,
    revision: rootGetters["application/getCurrentRevision"],
    units: units.map((unit) => unit.payload),
    // section id to be stored as "cxsx_section_id" inside "cx_section_translations"
    sectionId: baseSectionId,
    isSandbox,
    progress,
  });
}

/**
 * Translates HTML content for a given MT provider and the
 * application's source/target language pair, and returns
 * a promise that resolves to a string containing the translation.
 *
 * @param {object} context
 * @param {object} context.rootGetters
 * @param {function} context.dispatch
 * @param {object} context.rootState
 * @param {object} payload
 * @param {string} payload.provider
 * @param {string} payload.originalContent
 * @return {Promise<String>}
 */
async function translateContent(
  { rootGetters, dispatch, rootState },
  { provider, originalContent }
) {
  const { sourceLanguage, targetLanguage } = rootState.application;
  const isValidProvider = rootGetters[
    "mediawiki/isValidProviderForTranslation"
  ](sourceLanguage, targetLanguage, provider);

  if (!isValidProvider) {
    return Promise.resolve();
  }

  try {
    const token = await dispatch(
      "application/getCXServerToken",
      {},
      { root: true }
    );

    return await cxTranslatorApi.fetchSegmentTranslation(
      sourceLanguage,
      targetLanguage,
      provider,
      originalContent,
      token
    );
  } catch (error) {
    mw.log.error("Error while translating segment", error);

    // Fall back to original content
    return originalContent;
  }
}

async function fetchTranslatorStats({ commit }) {
  const translatorStats = await translator.fetchTranslatorStats();

  commit("setTranslatorStats", translatorStats);
}

export default {
  validateMT,
  saveTranslation,
  translateContent,
  fetchTranslatorStats,
};
