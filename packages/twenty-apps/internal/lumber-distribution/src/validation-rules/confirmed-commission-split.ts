import { defineValidationRule } from 'twenty-sdk/define';
import { LUMBER_OBJECTS } from '../constants/lumber-objects';

export default defineValidationRule({
  universalIdentifier: '0b71bdd8-45c7-48a0-b780-ca8e5ced6e94',
  objectUniversalIdentifier: LUMBER_OBJECTS.commission.universalIdentifier,
  name: 'confirmed-commission-split',
  expression:
    'splitConfirmed != true or (isDefined(yourSharePercent) and isDefined(partnerPoolSharePercent) and yourSharePercent + partnerPoolSharePercent == 100 and isNonEmptyString(splitTerms))',
  message:
    'A confirmed split needs shares totaling 100% and written terms identifying the partner pool.',
  errorFieldUniversalIdentifier:
    LUMBER_OBJECTS.commission.fields.splitConfirmed,
});
