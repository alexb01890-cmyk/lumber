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

// node_modules/twenty-client-sdk/dist/rolldown-runtime-DF993M8W.mjs
var t = (e2, t3) => () => (t3 || (e2((t3 = { exports: {} }).exports, t3), e2 = null), t3.exports);

// node_modules/twenty-client-sdk/dist/DefaultInternalApiUrlName-CHjUJKek.mjs
var e = "TWENTY_API_URL";
var t2 = "TWENTY_INTERNAL_API_URL";

// node_modules/twenty-client-sdk/dist/rest.mjs
var r = "TWENTY_APP_ACCESS_TOKEN";
var i = "TWENTY_APP_APPLICATION_ACCESS_TOKEN";
var a = "TWENTY_FUNCTIONS_URL";
var o = /* @__PURE__ */ t(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: true }), e2.isSymbol = e2.isBigInt = e2.isString = e2.isNumber = e2.isBoolean = e2.isUndefined = void 0, e2.isUndefined = (e3) => e3 === void 0, e2.isBoolean = (e3) => typeof e3 == "boolean", e2.isNumber = (e3) => typeof e3 == "number" && !Number.isNaN(e3), e2.isString = (e3) => typeof e3 == "string", e2.isBigInt = (e3) => typeof e3 == "bigint", e2.isSymbol = (e3) => typeof e3 == "symbol";
}));
var s = /* @__PURE__ */ t(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: true }), e2.isDate = e2.isWeakSet = e2.isWeakMap = e2.isSet = e2.isMap = e2.isArray = e2.isObject = e2.isFunction = e2.isNull = void 0, e2.isNull = (e3) => e3 === null, e2.isFunction = (e3) => typeof e3 == "function", e2.isObject = (t3) => !e2.isNull(t3) && typeof t3 == "object", e2.isArray = (e3) => Array.isArray(e3), e2.isMap = (e3) => e3 instanceof Map, e2.isSet = (e3) => e3 instanceof Set, e2.isWeakMap = (e3) => e3 instanceof WeakMap, e2.isWeakSet = (e3) => e3 instanceof WeakSet, e2.isDate = (e3) => e3 instanceof Date;
}));
var c = /* @__PURE__ */ t(((e2) => {
  Object.defineProperty(e2, "__esModule", { value: true }), e2.isNegativeInteger = e2.isNonNegativeInteger = e2.isPositiveInteger = e2.isInteger = e2.isNumberOrNaN = e2.isNonEmptyString = e2.isNonEmptyArray = e2.isObjectOrNull = void 0;
  var t3 = o(), n = s();
  e2.isObjectOrNull = (e3) => typeof e3 == "object", e2.isNonEmptyArray = (e3) => n.isArray(e3) && e3.length > 0, e2.isNonEmptyString = (e3) => t3.isString(e3) && e3.length > 0, e2.isNumberOrNaN = (e3) => typeof e3 == "number", e2.isInteger = (e3) => t3.isNumber(e3) && Number.isInteger(e3), e2.isPositiveInteger = (t4) => e2.isInteger(t4) && t4 > 0, e2.isNonNegativeInteger = (t4) => e2.isInteger(t4) && t4 >= 0, e2.isNegativeInteger = (t4) => e2.isInteger(t4) && t4 < 0;
}));
var l = (/* @__PURE__ */ t(((e2) => {
  var t3 = e2 && e2.__createBinding || (Object.create ? (function(e3, t4, n2, r3) {
    r3 === void 0 && (r3 = n2), Object.defineProperty(e3, r3, {
      enumerable: true,
      get: function() {
        return t4[n2];
      }
    });
  }) : (function(e3, t4, n2, r3) {
    r3 === void 0 && (r3 = n2), e3[r3] = t4[n2];
  })), n = e2 && e2.__setModuleDefault || (Object.create ? (function(e3, t4) {
    Object.defineProperty(e3, "default", {
      enumerable: true,
      value: t4
    });
  }) : function(e3, t4) {
    e3.default = t4;
  }), r2 = e2 && e2.__importStar || function(e3) {
    if (e3 && e3.__esModule) return e3;
    var r3 = {};
    if (e3 != null) for (var i3 in e3) i3 !== "default" && Object.prototype.hasOwnProperty.call(e3, i3) && t3(r3, e3, i3);
    return n(r3, e3), r3;
  }, i2 = e2 && e2.__exportStar || function(e3, n2) {
    for (var r3 in e3) r3 !== "default" && !Object.prototype.hasOwnProperty.call(n2, r3) && t3(n2, e3, r3);
  };
  Object.defineProperty(e2, "__esModule", { value: true }), e2.structural = e2.primitives = e2.convenience = void 0, e2.convenience = r2(c()), i2(c(), e2), e2.primitives = r2(o()), i2(o(), e2), e2.structural = r2(s()), i2(s(), e2);
})))();
var u = (e2) => {
  let r2 = e2[t2];
  return (0, l.isNonEmptyString)(r2) ? r2 : e2[e];
};
var d = (e2) => e2 != null;
var f = class extends Error {
  constructor(e2, t3) {
    super(e2), this.name = "RestApiClientError", this.status = t3?.status, this.statusText = t3?.statusText, this.url = t3?.url, this.body = t3?.body;
  }
};
var p = () => globalThis.process?.env ?? {};
var m = (e2) => /^\/?s\//.test(e2);
var h = (e2) => e2.replace(/^(\/?)s\//, "$1");
var g = (e2, t3, n) => {
  let r2 = /^https?:\/\//i.test(t3) ? t3 : `${e2}${t3.startsWith("/") ? "" : "/"}${t3}`;
  if (!d(n)) return r2;
  let i2 = new URLSearchParams();
  for (let [e3, t4] of Object.entries(n)) d(t4) && i2.append(e3, String(t4));
  let a2 = i2.toString();
  return a2.length === 0 ? r2 : r2.includes("?") ? `${r2}&${a2}` : `${r2}?${a2}`;
};
var _ = class {
  constructor(e2) {
    this.refreshAccessTokenPromise = null, this.baseUrl = e2?.baseUrl, this.token = e2?.token, this.defaultHeaders = e2?.defaultHeaders, this.fetchImplementation = e2?.fetch ?? globalThis.fetch ?? null, this.authorizationToken = e2?.token ?? null, this.runAs = e2?.runAs;
  }
  request(e2, t3, n) {
    return this.execute(e2, t3, n?.body, n);
  }
  get(e2, t3) {
    return this.execute("GET", e2, void 0, t3);
  }
  resolveUrl(e2, t3) {
    let n = this.resolveTarget(e2);
    return g(n.baseUrl, n.path, t3?.query);
  }
  post(e2, t3, n) {
    return this.execute("POST", e2, t3, n);
  }
  put(e2, t3, n) {
    return this.execute("PUT", e2, t3, n);
  }
  patch(e2, t3, n) {
    return this.execute("PATCH", e2, t3, n);
  }
  delete(e2, t3) {
    return this.execute("DELETE", e2, void 0, t3);
  }
  resolveBaseUrl() {
    let e2 = this.baseUrl ?? u(p());
    if (!d(e2) || e2.trim().length === 0) throw new f(`Missing API url. Set the \`${e}\` environment variable or pass \`baseUrl\` to \`RestApiClient\`.`);
    return e2.replace(/\/+$/, "");
  }
  resolveFunctionsBaseUrl() {
    let e2 = p()[a];
    if (!(!d(e2) || e2.trim().length === 0)) return e2.trim().replace(/\/+$/, "");
  }
  resolveTarget(e2) {
    return d(this.baseUrl) || !m(e2) ? {
      baseUrl: this.resolveBaseUrl(),
      path: e2
    } : {
      baseUrl: this.resolveFunctionsBaseUrl() ?? `${this.resolveBaseUrl()}/s`,
      path: h(e2)
    };
  }
  resolveToken() {
    let e2 = this.runAs === "application" ? i : r;
    if (!d(this.authorizationToken)) {
      let t3 = p();
      this.authorizationToken = this.token ?? t3[e2] ?? t3.TWENTY_API_KEY ?? null;
    }
    if (!d(this.authorizationToken) || this.authorizationToken.length === 0) throw new f(`Missing application access token. Set the \`${e2}\` environment variable or pass \`token\` to \`RestApiClient\`.`);
    return this.authorizationToken;
  }
  async requestRefreshedAccessToken() {
    let e2 = globalThis.frontComponentHostCommunicationApi?.requestAccessTokenRefresh;
    return typeof e2 == "function" ? (this.refreshAccessTokenPromise ||= e2().then((e3) => typeof e3 != "string" || e3.length === 0 ? null : (this.authorizationToken = e3, p()[r] = e3, e3)).catch((e3) => (console.error("Twenty REST client: token refresh failed", e3), null)).finally(() => {
      this.refreshAccessTokenPromise = null;
    }), this.refreshAccessTokenPromise) : null;
  }
  sendRequest(e2, t3, n, r2, i2) {
    if (!d(this.fetchImplementation)) throw new f("Global `fetch` function is not available, pass a fetch implementation to `RestApiClient`.");
    let a2 = new Headers(this.defaultHeaders);
    d(i2?.headers) && new Headers(i2.headers).forEach((e3, t4) => a2.set(t4, e3));
    let o2 = typeof FormData < "u" && n instanceof FormData, s2 = d(n) && !o2 && typeof n != "string";
    o2 ? a2.delete("Content-Type") : s2 && a2.set("Content-Type", "application/json"), a2.set("Authorization", `Bearer ${r2}`);
    let c2 = d(n) ? o2 || typeof n == "string" ? n : JSON.stringify(n) : void 0;
    return this.fetchImplementation.call(globalThis, e2, {
      method: t3,
      headers: a2,
      body: c2,
      signal: i2?.signal
    });
  }
  async parseResponse(e2, t3) {
    let n = await e2.text(), r2;
    if (n.trim().length > 0) try {
      r2 = JSON.parse(n);
    } catch {
      r2 = n;
    }
    if (!e2.ok) throw new f(`Request to ${t3} failed with status ${e2.status} ${e2.statusText}`, {
      status: e2.status,
      statusText: e2.statusText,
      url: t3,
      body: r2
    });
    return r2;
  }
  async execute(e2, t3, n, r2) {
    let i2 = this.resolveTarget(t3), a2 = g(i2.baseUrl, i2.path, r2?.query), o2 = this.resolveToken(), s2 = await this.sendRequest(a2, e2, n, o2, r2);
    if (s2.status === 401) {
      let t4 = await this.requestRefreshedAccessToken();
      d(t4) && (s2 = await this.sendRequest(a2, e2, n, t4, r2));
    }
    return this.parseResponse(s2, a2);
  }
};

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

// src/utils/recompute-commissions.util.ts
var recomputeCommissions = async (client, recordIds) => {
  for (const id of new Set(recordIds)) {
    for (let attempt = 0; attempt <= 3; attempt++) {
      const path = `/rest/lumberCommissions/${encodeURIComponent(id)}`;
      const response = await client.get(path);
      const record = response.data?.lumberCommission;
      if (!record) {
        throw new Error(
          `Commission ${id} could not be read for recalculation.`
        );
      }
      const amountMicros = record.eligibleAmount?.amountMicros;
      if (typeof amountMicros === "number" && !Number.isSafeInteger(amountMicros)) {
        throw new Error(
          "The commission basis exceeds safe numeric precision; supply amountMicros as an integer string."
        );
      }
      const splitConfirmed = record.splitConfirmed === true && typeof record.splitTerms === "string" && record.splitTerms.trim().length > 0 && record.yourSharePercent !== null && record.yourSharePercent !== void 0 && record.partnerPoolSharePercent !== null && record.partnerPoolSharePercent !== void 0 && Math.abs(
        record.yourSharePercent + record.partnerPoolSharePercent - 100
      ) < 1e-6;
      const preview = previewCommissions({
        records: [
          {
            id,
            eligibleAmountMicros: amountMicros === null || amountMicros === void 0 ? null : String(amountMicros),
            currencyCode: amountMicros === null || amountMicros === void 0 ? "USD" : record.eligibleAmount?.currencyCode ?? "USD",
            commissionRate: record.commissionRate ?? null,
            termsConfirmed: record.status === "CONFIRMED" && typeof record.eligibleBasis === "string" && record.eligibleBasis.trim().length > 0,
            splitConfirmed,
            yourSharePercent: record.yourSharePercent ?? null
          }
        ]
      }).records[0];
      const desiredAmounts = {
        expectedCommission: preview.expectedCommissionMicros,
        yourExpectedShare: preview.yourExpectedShareMicros,
        partnerPoolExpectedShare: preview.partnerPoolExpectedShareMicros
      };
      const changes = {};
      for (const field of Object.keys(desiredAmounts)) {
        const desiredAmount = desiredAmounts[field];
        const current = record[field];
        const currentAmount = current?.amountMicros === null || current?.amountMicros === void 0 ? null : String(current.amountMicros);
        if (currentAmount === desiredAmount && (desiredAmount === null || current?.currencyCode === "USD")) {
          continue;
        }
        changes[field] = desiredAmount === null ? null : { amountMicros: desiredAmount, currencyCode: "USD" };
      }
      if (Object.keys(changes).length === 0) {
        break;
      }
      if (attempt === 3) {
        throw new Error(
          `Commission ${id} changed repeatedly during recalculation; retry with the latest terms.`
        );
      }
      await client.patch(path, changes);
    }
  }
};

// src/logic-functions/on-commission-updated.ts
var on_commission_updated_default = defineLogicFunction({
  universalIdentifier: "0053afbd-4a6f-44b8-9a57-ca3f4346737e",
  name: "on-commission-updated",
  description: "Recalculate confirmed commissions from the current saved terms, leaving unknown earnings blank.",
  timeoutSeconds: 30,
  databaseEventTriggerSettings: {
    eventName: "lumberCommission.updated",
    batchMode: true,
    updatedFields: [
      "status",
      "commissionRate",
      "eligibleBasis",
      "eligibleAmount",
      "splitConfirmed",
      "splitTerms",
      "yourSharePercent",
      "partnerPoolSharePercent"
    ]
  },
  handler: async (batch) => {
    const ids = batch.events.map((event) => event.properties.after?.id ?? event.recordId).filter((id) => typeof id === "string" && id.length > 0);
    await recomputeCommissions(
      new _({ runAs: "application" }),
      ids
    );
  }
});
export {
  on_commission_updated_default as default
};
//# sourceMappingURL=on-commission-updated.mjs.map
