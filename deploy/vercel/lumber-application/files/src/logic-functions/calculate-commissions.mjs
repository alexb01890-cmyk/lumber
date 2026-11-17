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

// src/utils/preview-commissions.util.ts
var previewCommissions = (payload) => {
  if (typeof payload !== "object" || payload === null || !("records" in payload) || !Array.isArray(payload.records) || payload.records.length > 500) {
    throw new Error(
      "Provide records as an array of at most 500 commission inputs."
    );
  }
  const records = payload.records.map((record) => {
    if (typeof record !== "object" || record === null) {
      throw new Error("Each commission input must be an object.");
    }
    const input = record;
    if (typeof input.id !== "string" || input.id.trim().length === 0) {
      throw new Error("Each commission input needs an id.");
    }
    if (input.currencyCode !== "USD") {
      throw new Error("Commission previews currently support USD only.");
    }
    if (typeof input.termsConfirmed !== "boolean" || typeof input.splitConfirmed !== "boolean") {
      throw new Error(
        "termsConfirmed and splitConfirmed must be explicit booleans."
      );
    }
    const parsePercent = (value, label) => {
      if (value === null) {
        return null;
      }
      if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 100 || !/^\d+(?:\.\d{1,4})?$/.test(String(value))) {
        throw new Error(
          `${label} must be null or a percentage from 0 to 100 with at most four decimal places.`
        );
      }
      const [whole, fraction = ""] = String(value).split(".");
      return BigInt(whole) * 10000n + BigInt(fraction.padEnd(4, "0"));
    };
    const commissionRate = parsePercent(input.commissionRate, "commissionRate");
    const yourSharePercent = parsePercent(
      input.yourSharePercent,
      "yourSharePercent"
    );
    let eligibleAmount = null;
    if (input.eligibleAmountMicros !== null) {
      if (typeof input.eligibleAmountMicros !== "string" || !/^\d{1,30}$/.test(input.eligibleAmountMicros)) {
        throw new Error(
          "eligibleAmountMicros must be null or a nonnegative integer string of at most 30 digits."
        );
      }
      eligibleAmount = BigInt(input.eligibleAmountMicros);
    }
    const preview = {
      id: input.id,
      currencyCode: "USD",
      commissionStatus: "TBD",
      splitStatus: input.splitConfirmed ? "TBD" : "UNCONFIRMED",
      expectedCommissionMicros: null,
      yourExpectedShareMicros: null,
      partnerPoolExpectedShareMicros: null
    };
    if (!input.termsConfirmed || commissionRate === null || eligibleAmount === null) {
      return preview;
    }
    const centsDenominator = 1000000n * 10000n;
    const expectedCommission = (eligibleAmount * commissionRate + centsDenominator / 2n) / centsDenominator * 10000n;
    preview.commissionStatus = "CALCULATED";
    preview.expectedCommissionMicros = expectedCommission.toString();
    if (!input.splitConfirmed || yourSharePercent === null) {
      return preview;
    }
    const yourShare = (expectedCommission * yourSharePercent + centsDenominator / 2n) / centsDenominator * 10000n;
    preview.splitStatus = "CALCULATED";
    preview.yourExpectedShareMicros = yourShare.toString();
    preview.partnerPoolExpectedShareMicros = (expectedCommission - yourShare).toString();
    return preview;
  });
  return { previewOnly: true, records };
};

// src/logic-functions/calculate-commissions.ts
var calculate_commissions_default = defineLogicFunction({
  universalIdentifier: "47acbed0-1321-4ea2-bc02-57115077f07b",
  name: "calculate-commissions",
  description: "Preview USD commissions and confirmed partner-pool splits without changing records.",
  timeoutSeconds: 5,
  handler: async (event) => {
    try {
      return previewCommissions(event.body);
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
    path: "/calculate-commissions",
    httpMethod: "POST",
    isAuthRequired: true
  }
});
export {
  calculate_commissions_default as default
};
//# sourceMappingURL=calculate-commissions.mjs.map
