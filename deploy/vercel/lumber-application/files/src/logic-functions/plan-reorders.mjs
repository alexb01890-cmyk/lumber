import { createRequire as __createRequire } from 'module';
const require = __createRequire(import.meta.url);

// twenty-sdk-define-stub:__twenty-sdk-define-stub__
var __defineFactoryStub = (config) => ({
  success: true,
  config,
  errors: []
});
var __anyHandler = {
  get(_target, prop) {
    if (prop === "__esModule") return true;
    if (prop === Symbol.toPrimitive) return () => "";
    if (typeof prop === "symbol") return void 0;
    return new Proxy(() => void 0, __anyHandler);
  },
  apply() {
    return new Proxy(() => void 0, __anyHandler);
  }
};
var __anyStub = new Proxy(() => void 0, __anyHandler);
var defineLogicFunction = __defineFactoryStub;

// src/utils/preview-reorders.util.ts
var previewReorders = (payload) => {
  if (typeof payload !== "object" || payload === null || !("records" in payload) || !Array.isArray(payload.records) || payload.records.length > 500) {
    throw new Error(
      "Provide records as an array of at most 500 reorder inputs."
    );
  }
  const records = payload.records.map((record) => {
    if (typeof record !== "object" || record === null) {
      throw new Error("Each reorder input must be an object.");
    }
    const input = record;
    if (typeof input.id !== "string" || input.id.trim().length === 0) {
      throw new Error("Each reorder input needs an id.");
    }
    if (typeof input.nextNeedDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(input.nextNeedDate)) {
      throw new Error("nextNeedDate must be a valid YYYY-MM-DD date.");
    }
    const needDate = /* @__PURE__ */ new Date(`${input.nextNeedDate}T00:00:00.000Z`);
    if (!Number.isFinite(needDate.getTime()) || needDate.toISOString().slice(0, 10) !== input.nextNeedDate) {
      throw new Error("nextNeedDate must be a valid YYYY-MM-DD date.");
    }
    const repeatMonths = input.repeatMonths;
    const leadTimeDays = input.leadTimeDays;
    const reviewBufferDays = input.reviewBufferDays;
    if (typeof repeatMonths !== "number" || !Number.isSafeInteger(repeatMonths) || repeatMonths <= 0) {
      throw new Error("repeatMonths must be a positive whole number.");
    }
    if (typeof leadTimeDays !== "number" || !Number.isSafeInteger(leadTimeDays) || leadTimeDays < 0 || typeof reviewBufferDays !== "number" || !Number.isSafeInteger(reviewBufferDays) || reviewBufferDays < 0) {
      throw new Error(
        "leadTimeDays and reviewBufferDays must be nonnegative whole numbers."
      );
    }
    const reviewDate = new Date(needDate);
    reviewDate.setUTCDate(
      needDate.getUTCDate() - leadTimeDays - reviewBufferDays
    );
    const followingNeedDate = new Date(needDate);
    followingNeedDate.setUTCDate(1);
    followingNeedDate.setUTCMonth(
      followingNeedDate.getUTCMonth() + repeatMonths
    );
    const monthEnd = new Date(followingNeedDate);
    monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1);
    monthEnd.setUTCDate(0);
    followingNeedDate.setUTCDate(
      Math.min(needDate.getUTCDate(), monthEnd.getUTCDate())
    );
    if (!Number.isFinite(reviewDate.getTime()) || !Number.isFinite(followingNeedDate.getTime()) || reviewDate.getUTCFullYear() < 1e3 || followingNeedDate.getUTCFullYear() > 9999) {
      throw new Error(
        "The reorder interval or lead time is outside the supported date range."
      );
    }
    return {
      id: input.id,
      nextNeedDate: input.nextNeedDate,
      reviewDate: reviewDate.toISOString().slice(0, 10),
      followingNeedDate: followingNeedDate.toISOString().slice(0, 10)
    };
  });
  return { previewOnly: true, records };
};

// src/logic-functions/plan-reorders.ts
var plan_reorders_default = defineLogicFunction({
  universalIdentifier: "8888fbe0-3eba-4dd2-9298-1864e95f5da8",
  name: "plan-reorders",
  description: "Preview reorder review dates and calendar-month intervals without creating orders.",
  timeoutSeconds: 5,
  handler: async (event) => {
    try {
      return previewReorders(event.body);
    } catch (error) {
      return {
        __twentyHttpResponse: true,
        status: 400,
        body: {
          error: error instanceof Error ? error.message : "Invalid preview inputs."
        }
      };
    }
  },
  httpRouteTriggerSettings: {
    path: "/plan-reorders",
    httpMethod: "POST",
    isAuthRequired: true
  }
});
export {
  plan_reorders_default as default
};
//# sourceMappingURL=plan-reorders.mjs.map
