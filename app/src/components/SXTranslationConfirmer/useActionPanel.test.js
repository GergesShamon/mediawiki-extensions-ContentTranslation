import useActionPanel from "./useActionPanel";
import { createApp, ref } from "vue";
import SectionSuggestion from "@/wiki/cx/models/sectionSuggestion";
import { createStore } from "vuex";
import mediawikiGetters from "@/store/modules/mediawiki/getters";
import LanguageTitleGroup from "@/wiki/mw/models/languageTitleGroup";

jest.mock("@/composables/useURLHandler", () => () => ({
  sourceLanguageURLParameter: { value: "en" },
  targetLanguageURLParameter: { value: "el" },
  pageURLParameter: { value: "Test source title" },
}));

const languageTitleGroup = new LanguageTitleGroup("1", [
  { lang: "en", title: "Test source title" },
  { lang: "el", title: "Test target title" },
]);

const sectionSuggestion = ref(
  new SectionSuggestion({
    targetLanguage: "en",
    targetTitle: "Test target title",
    missing: {
      source2: "target2",
      source1: "target1",
      source3: "target3",
    },
    sourceSections: ["source1", "source2", "source3"],
  })
);

const mockStore = createStore({
  modules: {
    mediawiki: {
      namespaced: true,
      state: { languageTitleGroups: [languageTitleGroup] },
      getters: {
        getLanguageTitleGroup: mediawikiGetters.getLanguageTitleGroup,
      },
    },
  },
});

const mockLoadComposableInApp = () => {
  let result;
  const app = createApp({
    setup() {
      result = useActionPanel(sectionSuggestion);

      // suppress missing template warning
      return () => {};
    },
  });
  app.use(mockStore);
  app.mount(document.createElement("div"));

  return { result, app };
};

describe("actionInformationMessageArgs test", () => {
  const data = mockLoadComposableInApp();
  const { actionInformationMessageArgs } = data.result;
  it("case: missing > 1", () => {
    expect(actionInformationMessageArgs.value).toStrictEqual([
      "cx-sx-existing-translation-additional-info",
      `"source1"`,
      2,
    ]);
  });

  it("case: missing = 1 & present > 0", () => {
    sectionSuggestion.value.missingSections = {
      source1: "target1",
    };

    sectionSuggestion.value.presentSections = {
      "Test present section 1": "test",
    };
    expect(actionInformationMessageArgs.value).toStrictEqual([
      "cx-sx-translation-confirmer-action-message-single-missing-multiple-present",
      `"source1"`,
    ]);
  });

  it("case: missing = 1 & present = 0", () => {
    sectionSuggestion.value.presentSections = {};

    expect(actionInformationMessageArgs.value).toStrictEqual([
      "cx-sx-translation-confirmer-action-message-single-missing-none-present",
      `"source1"`,
    ]);
  });

  it("case: missing = 0 & present > 0", () => {
    sectionSuggestion.value.missingSections = {};
    sectionSuggestion.value.presentSections = {
      "Test present section 1": "test",
    };
    expect(actionInformationMessageArgs.value).toStrictEqual([
      "cx-sx-translation-confirmer-action-message-none-missing-multiple-present",
    ]);
  });

  it("case: missing = 0 & present = 0", () => {
    sectionSuggestion.value.missingSections = {};
    sectionSuggestion.value.presentSections = {};
    expect(actionInformationMessageArgs.value).toStrictEqual([
      "cx-sx-translation-confirmer-action-message-none-missing-none-present",
    ]);
  });
});

describe("getActionButtonLabel test", () => {
  const data = mockLoadComposableInApp();
  const { getActionButtonLabel } = data.result;
  it("case: prefilled section", () => {
    expect(getActionButtonLabel(true)).toBe(
      "cx-sx-translation-confirmer-translate-prefilled-section-button-label"
    );
  });

  it("case: missing > 1", () => {
    sectionSuggestion.value.missingSections = {
      source1: "target1",
      source2: "target2",
    };
    expect(getActionButtonLabel(false)).toBe("cx-sx-select-section");
  });

  it("case: missing = 1 & present > 0", () => {
    sectionSuggestion.value.missingSections = {
      "Test missing section 1": "test",
    };
    sectionSuggestion.value.presentSections = {
      "Test present section 1": "test",
    };
    expect(getActionButtonLabel(false)).toBe("cx-sx-select-section");
  });

  it("case: missing = 1 & present = 0", () => {
    sectionSuggestion.value.presentSections = {};

    expect(getActionButtonLabel(false)).toBe(
      "cx-sx-translation-confirmer-action-view-section"
    );
  });

  it("case: missing = 0 & present > 0", () => {
    sectionSuggestion.value.missingSections = {};
    sectionSuggestion.value.presentSections = {
      "Test present section 1": "test",
    };

    expect(getActionButtonLabel(false)).toBe("cx-sx-select-section");
  });

  it("case: missing = 0 & present = 0", () => {
    sectionSuggestion.value.missingSections = {};
    sectionSuggestion.value.presentSections = {};

    expect(getActionButtonLabel(false)).toBe(
      "cx-sx-translation-confirmer-action-new-translation"
    );
  });

  it("case: translation not exists (target page missing)", () => {
    // Remove "el" entry from language-title group
    mockStore.state.mediawiki.languageTitleGroups = [
      new LanguageTitleGroup("1", [{ lang: "en", title: "Test source title" }]),
    ];

    expect(getActionButtonLabel(false)).toBe(
      "cx-sx-start-translation-button-label"
    );
  });
});
