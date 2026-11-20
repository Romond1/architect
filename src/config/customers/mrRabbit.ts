import type { CustomerProfile } from '../../framework/types';

export const MR_RABBIT_CUSTOMER: CustomerProfile = {
  id: 'mr-rabbit',
  name: 'Mr. Rabbit',
  subtitle: 'Thoughtful Homeowner & Carrot Connoisseur',
  personalityTraits: [
    'Friendly',
    'Curious',
    'Expressive',
    'Appreciative',
    'Loves Carrots',
  ],
  bio: 'Mr. Rabbit recently bought a sunny meadow plot and wants to grow a cozy home one careful step at a time — starting from a simple blueprint all the way to a furnished retreat with proper carrot storage.',
  awaitingReviewDialogues: [
    "Ooh, a fresh architectural packet! Let me put on my reading spectacles and take a careful look.",
    "Thank you, architect! I'm inspecting every line and corner right now.",
    "How exciting! Let's review your design together with your teacher.",
  ],
  scriptedRevisionTemplates: [
    {
      id: 'rev-clearer-details',
      label: 'Ask for clearer plan details',
      message:
        "You're on a wonderful track, architect! Could we adjust a couple of details so every requirement shines clearly before we build?",
      expression: 'curious',
    },
    {
      id: 'rev-dimensions-check',
      label: 'Double-check measurements',
      message:
        'Oh my whiskers — I want to be quite sure my room measurements and labels match our plan! Let us refine those and try again.',
      expression: 'concerned',
    },
    {
      id: 'rev-budget-care',
      label: 'Mind the construction budget',
      message:
        "I adore how cozy this looks, though my carrot savings can't quite stretch past the construction budget! Shall we tune the plan together?",
      expression: 'concerned',
    },
    {
      id: 'rev-missing-item',
      label: 'Add a missing requested element',
      message:
        'Almost there! One or two items on my wish list seem to be missing from this version. Check the highlighted notes and bring it right back!',
      expression: 'thinking',
    },
  ],
  scriptedApprovalTemplates: [
    {
      id: 'app-signature',
      label: 'Use this commission’s signature success message',
      message: '',
      expression: 'celebrating',
    },
    {
      id: 'app-impressed',
      label: 'Impressed & delighted',
      message:
        'Bravo! Look at the craftsmanship and care in your work. Not only is my home coming together, your studio software is extraordinary!',
      expression: 'impressed',
    },
    {
      id: 'app-carrot-toast',
      label: 'Celebrate with a carrot toast',
      message:
        "Three cheers and a crunch of fresh carrot! That turned out even better than I pictured in my burrow.",
      expression: 'extremelyHappy',
    },
  ],
};

export const CUSTOMERS_BY_ID: Record<string, CustomerProfile> = {
  [MR_RABBIT_CUSTOMER.id]: MR_RABBIT_CUSTOMER,
};
