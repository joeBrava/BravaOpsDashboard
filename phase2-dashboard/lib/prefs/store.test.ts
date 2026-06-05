import { describe, it, expect, afterEach } from "vitest";
import {
  getPreferencesStore,
  __resetPreferencesStoreForTests,
} from "./store";
import { JsonPreferencesStore } from "./json-store";

afterEach(() => {
  __resetPreferencesStoreForTests();
});

describe("getPreferencesStore", () => {
  it("returns the JSON-file store by default", () => {
    expect(getPreferencesStore()).toBeInstanceOf(JsonPreferencesStore);
  });

  it("returns a memoized singleton", () => {
    expect(getPreferencesStore()).toBe(getPreferencesStore());
  });

  it("exposes the PreferencesStore shape (get/set)", () => {
    const store = getPreferencesStore();
    expect(typeof store.get).toBe("function");
    expect(typeof store.set).toBe("function");
  });
});
