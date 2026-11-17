import { defineValidationRule } from 'twenty-sdk/define';
import { LUMBER_OBJECTS } from '../constants/lumber-objects';

export default defineValidationRule({
  universalIdentifier: '71f5c2b6-4349-40af-ae33-b9474bbe5b0a',
  objectUniversalIdentifier: LUMBER_OBJECTS.commission.universalIdentifier,
  name: 'commission-percentage-ranges',
  expression:
    '(not isDefined(commissionRate) or (commissionRate >= 0 and commissionRate <= 100)) and (not isDefined(yourSharePercent) or (yourSharePercent >= 0 and yourSharePercent <= 100)) and (not isDefined(partnerPoolSharePercent) or (partnerPoolSharePercent >= 0 and partnerPoolSharePercent <= 100))',
  message: 'Commission and split percentages must be between 0 and 100.',
  errorFieldUniversalIdentifier:
    LUMBER_OBJECTS.commission.fields.commissionRate,
});
