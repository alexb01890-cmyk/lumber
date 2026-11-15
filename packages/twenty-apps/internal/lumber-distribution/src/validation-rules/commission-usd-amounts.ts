import { defineValidationRule } from 'twenty-sdk/define';
import { LUMBER_OBJECTS } from '../constants/lumber-objects';

export default defineValidationRule({
  universalIdentifier: '5a0dda84-a711-4025-8af6-7edccfb7fe8b',
  objectUniversalIdentifier: LUMBER_OBJECTS.commission.universalIdentifier,
  name: 'commission-usd-amounts',
  expression:
    '(not isDefined(eligibleAmount.amountMicros) or eligibleAmount.currencyCode == "USD") and (not isDefined(expectedCommission.amountMicros) or expectedCommission.currencyCode == "USD") and (not isDefined(receivedCommission.amountMicros) or receivedCommission.currencyCode == "USD") and (not isDefined(yourExpectedShare.amountMicros) or yourExpectedShare.currencyCode == "USD") and (not isDefined(partnerPoolExpectedShare.amountMicros) or partnerPoolExpectedShare.currencyCode == "USD") and (not isDefined(yourPaid.amountMicros) or yourPaid.currencyCode == "USD") and (not isDefined(partnerPoolPaid.amountMicros) or partnerPoolPaid.currencyCode == "USD")',
  message:
    'Use USD for all amounts in this first version. Currency conversion is not supported.',
  errorFieldUniversalIdentifier:
    LUMBER_OBJECTS.commission.fields.eligibleAmount,
});
