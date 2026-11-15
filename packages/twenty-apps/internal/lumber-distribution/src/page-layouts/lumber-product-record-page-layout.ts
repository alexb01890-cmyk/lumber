import {
  definePageLayout,
  PageLayoutTabLayoutMode,
  PageLayoutType,
} from 'twenty-sdk/define';

export default definePageLayout({
  universalIdentifier: '5340772e-a838-4c92-8b6b-a3295d6d96dd',
  name: 'Default Product Layout',
  type: PageLayoutType.RECORD_PAGE,
  objectUniversalIdentifier: 'dafd6634-2352-4ec8-b3b1-c4b8ed90a686',
  tabs: [
    {
      universalIdentifier: '35fa1cbd-3bba-41fd-9494-f195ba8f581d',
      title: 'Home',
      position: 10,
      icon: 'IconHome',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: '57a737f0-7024-4a3d-ada5-73bda346bc44',
          title: 'Fields',
          type: 'FIELDS',
          configuration: {
            configurationType: 'FIELDS',
            viewUniversalIdentifier: '8db1c164-f773-434b-87e1-2cd7d939cf57',
          },
        },
      ],
    },
    {
      universalIdentifier: '0680efab-86be-41f3-9abb-f87694b0edcb',
      title: 'Timeline',
      position: 20,
      icon: 'IconTimelineEvent',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: '5800e955-89be-4d6b-b9ec-5654ef9bfd26',
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
