import type { CommissionConfig } from '../../framework/types';

export const INITIAL_COMMISSIONS: CommissionConfig[] = [
  {
    id: 'commission-1',
    order: 1,
    title: 'My First Room',
    customerId: 'mr-rabbit',
    customerDialogue:
      "Hello, architect! I've bought a lovely little piece of land, and I would like to build my very first room. Can you draw a plan so I can see how big it will be?",
    successDialogue:
      "Wonderful! Now I can finally imagine how much space I'll have. You're off to a fantastic start!",
    initialExpression: 'greeting',
    dimensions: [
      { id: 'c1-dim-width', label: 'Width', value: '4 metres' },
      { id: 'c1-dim-length', label: 'Length', value: '5 metres' },
    ],
    requirements: [
      { id: 'c1-req-1', text: 'One rectangular room' },
      { id: 'c1-req-2', text: 'Four walls' },
      { id: 'c1-req-3', text: 'Width: 4 metres' },
      { id: 'c1-req-4', text: 'Length: 5 metres' },
      { id: 'c1-req-5', text: 'Clearly visible dimensions' },
      { id: 'c1-req-6', text: 'A 2D architectural floor plan' },
    ],
    constructionBudget: 1000,
    architectPayment: 100,
    achievementId: 'junior-architect',
  },
  {
    id: 'commission-2',
    order: 2,
    title: 'How Do I Get Inside?',
    customerId: 'mr-rabbit',
    customerDialogue:
      "Oh dear! I've just noticed something. You've designed a beautiful room, but how am I supposed to get inside? And I would love to see my carrot garden from the window!",
    successDialogue:
      "Excellent! I can get inside, and I can keep an eye on my carrots. That's very important rabbit business.",
    initialExpression: 'curious',
    dimensions: [
      { id: 'c2-dim-width', label: 'Width', value: '4 metres' },
      { id: 'c2-dim-length', label: 'Length', value: '5 metres' },
    ],
    requirements: [
      { id: 'c2-req-1', text: 'Preserve the original room dimensions' },
      { id: 'c2-req-2', text: 'Add at least one door' },
      { id: 'c2-req-3', text: 'Add two windows' },
      { id: 'c2-req-4', text: 'Show the openings clearly in the architectural plan' },
      { id: 'c2-req-5', text: 'Provide an estimated construction cost' },
    ],
    constructionBudget: 1500,
    architectPayment: 200,
    achievementId: 'building-designer',
  },
  {
    id: 'commission-3',
    order: 3,
    title: 'Bring It to Life',
    customerId: 'mr-rabbit',
    customerDialogue:
      "I like your drawings, but rabbits aren't particularly good at reading blueprints. Could you show me what my room would actually look like in three dimensions?",
    successDialogue:
      "Wow! It looks like a real building! I can almost imagine hopping around inside.",
    initialExpression: 'thinking',
    dimensions: [
      { id: 'c3-dim-width', label: 'Width', value: '4 metres' },
      { id: 'c3-dim-length', label: 'Length', value: '5 metres' },
      { id: 'c3-dim-height', label: 'Wall height', value: '3 metres' },
    ],
    requirements: [
      { id: 'c3-req-1', text: 'Preserve the existing floor plan' },
      { id: 'c3-req-2', text: 'Create a 3D representation of the same room' },
      { id: 'c3-req-3', text: 'Wall height: 3 metres' },
      { id: 'c3-req-4', text: 'Include the existing door and windows' },
      { id: 'c3-req-5', text: 'Allow the design to be viewed from different angles' },
    ],
    constructionBudget: 2000,
    architectPayment: 350,
    achievementId: '3d-architect',
  },
  {
    id: 'commission-4',
    order: 4,
    title: 'Make It Beautiful',
    customerId: 'mr-rabbit',
    customerDialogue:
      "Hmm. Everything looks a little plain. I don't want to live inside a grey cardboard box! Can you make my room beautiful?",
    successDialogue:
      "That's much better! The colors are lovely, and the sunlight makes everything feel warm and welcoming.",
    initialExpression: 'thinking',
    dimensions: [
      { id: 'c4-dim-width', label: 'Width', value: '4 metres' },
      { id: 'c4-dim-length', label: 'Length', value: '5 metres' },
      { id: 'c4-dim-height', label: 'Wall height', value: '3 metres' },
    ],
    requirements: [
      { id: 'c4-req-1', text: 'Preserve the existing room geometry' },
      { id: 'c4-req-2', text: 'Add wooden flooring' },
      { id: 'c4-req-3', text: 'Add soft green wall colors' },
      { id: 'c4-req-4', text: 'Introduce attractive lighting' },
      {
        id: 'c4-req-5',
        text: "Allow the customer to appreciate the room's appearance through a rendered view",
      },
    ],
    constructionBudget: 3000,
    architectPayment: 500,
    achievementId: 'creative-architect',
  },
  {
    id: 'commission-5',
    order: 5,
    title: 'My Wonderful Home',
    customerId: 'mr-rabbit',
    customerDialogue:
      'My room is beautiful, but I still have nowhere to sleep, eat or store my precious carrots. Could you turn it into a proper home?',
    successDialogue:
      "It's perfect! I finally have a home of my own. Thank you for building not only my room, but an amazing architecture studio!",
    initialExpression: 'curious',
    dimensions: [
      { id: 'c5-dim-width', label: 'Width', value: '4 metres' },
      { id: 'c5-dim-length', label: 'Length', value: '5 metres' },
      { id: 'c5-dim-height', label: 'Wall height', value: '3 metres' },
    ],
    requirements: [
      { id: 'c5-req-1', text: 'Preserve the existing architectural design' },
      { id: 'c5-req-2', text: 'Add a bed' },
      { id: 'c5-req-3', text: 'Add a table' },
      { id: 'c5-req-4', text: 'Add a carrot storage area' },
      { id: 'c5-req-5', text: 'Arrange the objects thoughtfully' },
      { id: 'c5-req-6', text: 'Stay within the available budget' },
      { id: 'c5-req-7', text: 'Deliver an attractive final rendered image' },
    ],
    constructionBudget: 5000,
    architectPayment: 850,
    achievementId: 'master-architect',
    isGrandFinale: true,
  },
];
