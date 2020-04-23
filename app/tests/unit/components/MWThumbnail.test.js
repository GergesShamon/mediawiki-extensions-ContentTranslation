import { shallowMount } from "@vue/test-utils";
import MwThumbnail from "@/lib/mediawiki.ui/components/MWThumbnail";

describe("MwThumbnail.vue", () => {
  it("renders image when passed", () => {
    const wrapper = shallowMount(MwThumbnail, {
      propsData: { thumbnail: { src: "randomimage.png" } }
    });
    expect(wrapper.contains("img")).toBe(true);
    expect(wrapper.element).toMatchSnapshot();
  });

  it("use fallback icon when image not passed", () => {
    const wrapper = shallowMount(MwThumbnail, {
      propsData: {}
    });

    expect(wrapper.contains("img")).toBe(false);
    expect(wrapper.contains(".mw-ui-thumbnail--missing")).toBe(true);
  });
});