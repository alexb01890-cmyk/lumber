import { defineValidationRule } from 'twenty-sdk/define';
import { LUMBER_OBJECTS } from '../constants/lumber-objects';

export default defineValidationRule({
  universalIdentifier: 'acad71ce-689c-43e8-ab5f-ab81ff1ee7a4',
  objectUniversalIdentifier: LUMBER_OBJECTS.commission.universalIdentifier,
  name: 'confirmed-commission-terms',
  expression:
    'status != "CONFIRMED" or (isDefined(commissionRate) and isDefined(eligibleAmount.amountMicros) and eligibleAmount.amountMicros >= 0 and eligibleAmount.currencyCode == "USD" and isNonEmptyString(eligibleBasis))',
  message:
    'Confirm the commission rate, eligible USD amount and basis before confirming terms.',
  errorFieldUniversalIdentifier: LUMBER_OBJECTS.commission.fields.status,
});
