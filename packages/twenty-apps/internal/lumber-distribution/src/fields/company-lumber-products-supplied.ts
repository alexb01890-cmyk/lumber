import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';
import { LUMBER_OBJECTS } from '../constants/lumber-objects';
import { LUMBER_COMPANY_FIELDS } from '../constants/lumber-company-fields';

export default defineField({
  universalIdentifier: LUMBER_COMPANY_FIELDS.company_lumberProductsSupplied,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company.universalIdentifier,
  name: 'lumberProductsSupplied',
  label: 'Products supplied',
  type: FieldType.RELATION,
  icon: 'IconBox',
  relationTargetObjectMetadataUniversalIdentifier:
    LUMBER_OBJECTS.product.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    LUMBER_OBJECTS.product.fields.supplier,
  universalSettings: { relationType: RelationType.ONE_TO_MANY },
});
