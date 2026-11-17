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
var defineHealthCheck = __defineFactoryStub;

// src/constants/universal-identifiers.ts
var HEALTH_CHECK_UNIVERSAL_IDENTIFIER = "b9f54630-625d-4834-a01d-f613169946a0";

// src/logic-functions/health-check.ts
var health_check_default = defineHealthCheck({
  universalIdentifier: HEALTH_CHECK_UNIVERSAL_IDENTIFIER,
  name: "health-check",
  handler: async () => {
    return { status: "OK" };
  }
});
export {
  health_check_default as default
};
//# sourceMappingURL=health-check.mjs.map
