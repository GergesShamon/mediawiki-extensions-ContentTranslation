import PageSection from "@/wiki/cx/models/pageSection";
import SubSection from "@/wiki/cx/models/subSection";
import SectionSentence from "@/wiki/cx/models/sectionSentence";
import cxTranslatorApi from "@/wiki/cx/api/translator";
import Page from "@/wiki/mw/models/page";
import PublishFeedbackMessage from "@/wiki/cx/models/publishFeedbackMessage";
import applicationGetters from "@/store/modules/application/getters";
import { createStore } from "vuex";
import { createApp } from "vue";
import useTranslationPublish from "@/components/SXPublisher/useTranslationPublish";

const mockErrorResult = {
  publishFeedbackMessage: new PublishFeedbackMessage({
    text: "Test publishing error",
    status: "publishing error",
  }),
  targetUrl: null,
};

const mockErrorPublishFeedbackMessageForSaving = new PublishFeedbackMessage({
  text: "Test saving error",
  status: "saving error",
});

jest.mock("@/wiki/cx/api/translator", () => ({
  publishTranslation: jest.fn(({ targetTitle }) => {
    console.log("target title", targetTitle);

    // successful publishing
    if (targetTitle === "Test target article title 1") {
      return Promise.resolve({
        publishFeedbackMessage: null,
        targetUrl: "success_url",
      });
    } else if (targetTitle === "Test target article title 2") {
      return Promise.resolve(mockErrorResult);
    }
  }),
}));

const createSentenceNode = () => {
  const sectionSentenceNode = document.createElement("span");
  sectionSentenceNode.className = "cx-segment";
  sectionSentenceNode.innerHTML = "Target original sentence 1";

  return sectionSentenceNode;
};

const sectionSentenceNode = createSentenceNode();

const createSubSectionNode = (sectionSentenceNode) => {
  const subSectionNode = document.createElement("section");
  subSectionNode.setAttribute("id", "cxSourceSection1");
  subSectionNode.append(sectionSentenceNode);

  return subSectionNode;
};

const subSectionNode = createSubSectionNode(sectionSentenceNode);

const sectionSentence = new SectionSentence({
  node: sectionSentenceNode,
  originalContent: "Target original sentence 1",
  translatedContent: "Target translated sentence 1",
});
sectionSentence.mtProviderUsed = "empty";

const currentSourceSection = new PageSection({
  id: 1,
  title: "Test section title 1",
  subSections: [
    new SubSection({ node: subSectionNode, sentences: [sectionSentence] }),
  ],
});
currentSourceSection.translatedTitle = "Test target section title 1";

const applicationModule = {
  namespaced: true,
  state: {
    sourceLanguage: "en",
    targetLanguage: "es",
    currentSourceSection,
    testTargetPageTitleForPublishing: "Test target article title 1",
  },
  getters: {
    getCurrentPage: () =>
      new Page({
        lastrevid: 11,
        title: "Test source title 1",
      }),
    getTargetPageTitleForPublishing: (state) =>
      state.testTargetPageTitleForPublishing,
    isSandboxTarget: () => false,
    getCurrentRevision: applicationGetters.getCurrentRevision,
  },
  mutations: {
    setTargetPageTitleForPublishing: (state, title) => {
      state.testTargetPageTitleForPublishing = title;
    },
  },
};

const translatorModule = {
  namespaced: true,
  actions: {
    saveTranslation: jest.fn(() => {
      if (
        store.getters["application/getTargetPageTitleForPublishing"] ===
        "Test target article title 3"
      ) {
        return mockErrorPublishFeedbackMessageForSaving;
      } else {
        return 1234;
      }
    }),
  },
};

const store = createStore({
  modules: { application: applicationModule, translator: translatorModule },
});

const mockLoadComposableInApp = (composable) => {
  let result;
  const app = createApp({
    setup() {
      result = composable();

      // suppress missing template warning
      return () => {};
    },
  });
  app.use(store);
  app.mount(document.createElement("div"));

  return { result, app };
};

describe(" test `useTranslationPublish` composable", () => {
  const data = mockLoadComposableInApp(() => useTranslationPublish());
  const { doPublish } = data.result;

  it("should dispatch 'saveTranslation' action", async () => {
    await doPublish();

    expect(translatorModule.actions.saveTranslation).toHaveBeenCalledTimes(1);
  });

  it("should call api publishTranslation method with the proper payload", async () => {
    await doPublish();

    expect(cxTranslatorApi.publishTranslation).toHaveBeenCalledWith({
      html: '<span class="cx-segment">Target translated sentence 1</span>',
      sourceTitle: "Test source title 1",
      targetTitle: "Test target article title 1",
      sourceSectionTitle: "Test section title 1",
      targetSectionTitle: "Test target section title 1",
      sourceLanguage: "en",
      targetLanguage: "es",
      revision: 11,
      isSandbox: false,
      sectionTranslationId: 1234,
    });
  });

  it("should return an object with filled target URL and null publishFeedbackMessage on successful publishing", async () => {
    const feedbackMessage = await doPublish();

    expect(feedbackMessage).toStrictEqual({
      publishFeedbackMessage: null,
      targetUrl: "success_url",
    });
  });

  it("should resolve to an object containing the publish feedback message that is returned by publishTranslation api method and an empty target URL, when publishing fails", async () => {
    store.commit(
      "application/setTargetPageTitleForPublishing",
      "Test target article title 2"
    );
    currentSourceSection.subSections = [];

    const result = await doPublish();

    expect(cxTranslatorApi.publishTranslation).toHaveReturnedWith(
      Promise.resolve(mockErrorResult)
    );
    expect(result).toStrictEqual(mockErrorResult);
  });

  it("should resolve to an object containing the publish feedback message that is returned by saveTranslation api method and an empty targetTitle, when saving fails", async () => {
    store.commit(
      "application/setTargetPageTitleForPublishing",
      "Test target article title 3"
    );
    const result = await doPublish();

    expect(translatorModule.actions.saveTranslation).toHaveReturnedWith(
      mockErrorPublishFeedbackMessageForSaving
    );
    expect(result).toStrictEqual({
      publishFeedbackMessage: mockErrorPublishFeedbackMessageForSaving,
      targetUrl: null,
    });
  });
});
