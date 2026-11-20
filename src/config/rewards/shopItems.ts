import type { ShopItemDefinition } from '../../framework/types';

export const INITIAL_SHOP_ITEMS: ShopItemDefinition[] = [
  {
    id: 'rabbit-bow-tie',
    name: 'Rabbit Bow Tie',
    description:
      'A crisp crimson silk bow tie for Mr. Rabbit to wear during studio visits.',
    price: 50,
    category: 'customer_accessory',
    slot: 'rabbit_neck',
    previewEffect: 'Adds a crimson bow tie to Mr. Rabbit’s collar',
  },
  {
    id: 'golden-architect-pencil',
    name: 'Golden Architect Pencil',
    description:
      'A finely balanced brass-and-gold drafting pencil displayed at the top of your studio.',
    price: 75,
    category: 'studio_decor',
    slot: 'desk_pencil',
    previewEffect: 'Displays a golden drafting pencil ornament in your studio header',
  },
  {
    id: 'rabbit-architect-hat',
    name: 'Rabbit Architect Hat',
    description:
      'A dapper studio beret pinned with a tiny golden compass emblem for Mr. Rabbit.',
    price: 100,
    category: 'customer_accessory',
    slot: 'rabbit_head',
    previewEffect: 'Outfits Mr. Rabbit with an architect beret',
  },
  {
    id: 'bronze-studio-trophy',
    name: 'Bronze Studio Trophy',
    description:
      'A sculpted bronze drafting-compass cup celebrating growing studio craftsmanship.',
    price: 150,
    category: 'studio_trophy',
    slot: 'trophy_bronze',
    previewEffect: 'Places a Bronze Trophy on your studio shelf and profile',
  },
  {
    id: 'starry-studio-theme',
    name: 'Starry Studio Theme',
    description:
      'Transforms the studio into a dreamy cosmic lavender galaxy glowing with golden stars and amethyst mist.',
    price: 200,
    category: 'studio_theme',
    slot: 'theme',
    themeValue: 'starry',
    previewEffect: 'Switches the studio to a cosmic lavender & gold starlight theme',
  },
  {
    id: 'elegant-studio-theme',
    name: 'Elegant Studio Theme',
    description:
      'Dresses the studio in deep royal forest-emerald night tones with glowing champagne brass accents.',
    price: 300,
    category: 'studio_theme',
    slot: 'theme',
    themeValue: 'elegant',
    previewEffect: 'Switches the studio to a dark royal emerald & brass aesthetic',
  },
  {
    id: 'royal-rabbit-costume',
    name: 'Royal Rabbit Costume',
    description:
      'A plush velvet royal cloak with gold chain clasp and miniature crown for Mr. Rabbit.',
    price: 400,
    category: 'customer_accessory',
    slot: 'rabbit_outfit',
    previewEffect: 'Dresses Mr. Rabbit in royal ceremonial attire',
  },
  {
    id: 'golden-architect-trophy',
    name: 'Golden Architect Trophy',
    description:
      'The highest studio keepsake — a gleaming golden pavilion trophy awarded for true mastery.',
    price: 600,
    category: 'studio_trophy',
    slot: 'trophy_gold',
    previewEffect: 'Displays the Golden Architect Trophy on your studio shelf',
  },
];

export const SHOP_ITEMS_BY_ID: Record<string, ShopItemDefinition> =
  Object.fromEntries(INITIAL_SHOP_ITEMS.map((item) => [item.id, item]));
