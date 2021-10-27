/**
 * This class represents warning/error messages
 * that should be displayed to the user as feedback
 * after unsuccessful publishing attempt. It is
 * used inside PublishResult model to encapsulate
 * warning/error messages, provided either by API
 * response or by MT validation.
 */
export default class PublishFeedbackMessage {
  /**
   * @param {Object} options
   * @param {string} [options.text]
   * @param {string} [options.title]
   */
  constructor({ text = null, title = null }) {
    this.text = text;
    this.title = title;
  }
}
