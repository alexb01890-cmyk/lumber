import {
  definePageLayout,
  PageLayoutTabLayoutMode,
  PageLayoutType,
} from 'twenty-sdk/define';

export default definePageLayout({
  universalIdentifier: 'ee9ce168-9cee-4d69-bb08-31e74bb690a5',
  name: 'Default Shipment lot Layout',
  type: PageLayoutType.RECORD_PAGE,
  objectUniversalIdentifier: '0826c666-a73a-4052-a44a-0853dac469c8',
  tabs: [
    {
      universalIdentifier: '1233637f-40ba-44d3-922a-44067f7c12da',
      title: 'Home',
      position: 10,
      icon: 'IconHome',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: 'bbf7dd0f-ef5a-4730-935e-b1d7c6d88a02',
          title: 'Fields',
          type: 'FIELDS',
          configuration: {
            configurationType: 'FIELDS',
            viewUniversalIdentifier: 'fad56390-7b85-4ceb-a31c-22c82150f28b',
          },
        },
      ],
    },
    {
      universalIdentifier: 'f9fd4b88-0ebc-482c-b1c9-25214035f827',
      title: 'Timeline',
      position: 20,
      icon: 'IconTimelineEvent',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: 'd2b9e72e-6619-4302-a192-762701316029',
          title: 'Timeline',
          type: 'TIMELINE',
          configuration: {
            configurationType: 'TIMELINE',
          },
        },
      ],
    },
  ],
});
