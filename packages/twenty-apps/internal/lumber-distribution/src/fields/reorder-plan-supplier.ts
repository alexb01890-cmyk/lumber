import {
  defineField,
  FieldType,
  RelationType,
  OnDeleteAction,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';
import { LUMBER_OBJECTS } from '../constants/lumber-objects';
import { LUMBER_COMPANY_FIELDS } from '../constants/lumber-company-fields';

export default defineField({
  universalIdentifier: LUMBER_OBJECTS.reorder.fields.supplier,
  objectUniversalIdentifier: LUMBER_OBJECTS.reorder.universalIdentifier,
  name: 'supplier',
  label: 'Preferred supplier',
  type: FieldType.RELATION,
  icon: 'IconBuildingSkyscraper',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    LUMBER_COMPANY_FIELDS.company_lumberSupplierReorderPlans,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'supplierId',
  },
});
