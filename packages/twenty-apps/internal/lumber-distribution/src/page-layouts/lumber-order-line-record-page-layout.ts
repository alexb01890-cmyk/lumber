import {
  definePageLayout,
  PageLayoutTabLayoutMode,
  PageLayoutType,
} from 'twenty-sdk/define';

export default definePageLayout({
  universalIdentifier: '4a3ed2fe-5b9d-4e30-b385-45056840b81a',
  name: 'Default Order line Layout',
  type: PageLayoutType.RECORD_PAGE,
  objectUniversalIdentifier: 'e8c6c6a5-cc62-4bbf-be0a-0dc66dcec419',
  tabs: [
    {
      universalIdentifier: '3b3d854e-6fb3-454a-8f65-94c2efa6c99f',
      title: 'Home',
      position: 10,
      icon: 'IconHome',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: '8610f33d-9f45-47d9-976c-88126d10ec4d',
          title: 'Fields',
          type: 'FIELDS',
          configuration: {
            configurationType: 'FIELDS',
            viewUniversalIdentifier: 'adea96ff-41cf-423d-9285-c6774dcf789e',
          },
        },
      ],
    },
    {
      universalIdentifier: '0d2081bc-dd86-4993-a88d-09a2d800054f',
      title: 'Timeline',
      position: 20,
      icon: 'IconTimelineEvent',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: '3c59d92a-7789-44b6-a3b5-32b0ab0056ef',
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
