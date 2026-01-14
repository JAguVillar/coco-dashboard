import { Temporal } from "temporal-polyfill";

export default defineNuxtPlugin(() => {
  globalThis.Temporal = Temporal;
});
