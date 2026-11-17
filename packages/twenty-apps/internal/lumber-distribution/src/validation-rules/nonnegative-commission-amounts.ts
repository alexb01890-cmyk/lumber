import { defineValidationRule } from 'twenty-sdk/define';
import { LUMBER_OBJECTS } from '../constants/lumber-objects';

export default defineValidationRule({
  universalIdentifier: '0fad7014-13a5-4dd4-8e3c-c61463103c7e',
  objectUniversalIdentifier: LUMBER_OBJECTS.commission.universalIdentifier,
  name: 'nonnegative-commission-amounts',
  expression:
    '(not isDefined(eligibleAmount.amountMicros) or eligibleAmount.amountMicros >= 0) and (not isDefined(receivedCommission.amountMicros) or receivedCommission.amountMicros >= 0) and (not isDefined(yourPaid.amountMicros) or yourPaid.amountMicros >= 0) and (not isDefined(partnerPoolPaid.amountMicros) or partnerPoolPaid.amountMicros >= 0)',
  message:
    'Commission receipts, eligible amount and payouts cannot be negative.',
  errorFieldUniversalIdentifier:
    LUMBER_OBJECTS.commission.fields.receivedCommission,
});
