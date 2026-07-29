/**
 * Beteseb Platform Constants
 */

export const RELIGIONS = [
  'Orthodox',
  'Protestant',
  'Catholic',
  'Muslim',
  'Other'
];

export const EDUCATION_LEVELS = [
  'High School',
  'Diploma',
  'Bachelor Degree',
  'Master Degree',
  'PhD',
  'Other'
];

export const MARITAL_STATUS_MALE = [
  'Never Married',
  'Divorced'
];

export const MARITAL_STATUS_FEMALE = [
  'Never Married',
  'Divorced'
];

export const PARTNER_MARITAL_PREF_OPTIONS = [
  'Never Married',
  'Divorced',
  'Does Not Matter'
];

export const HAVE_CHILDREN_OPTIONS = [
  'Yes',
  'No'
];

export const FUTURE_CHILDREN_OPTIONS = [
  'Wants Children',
  'Does Not Want Children',
  'Does Not Matter'
];

export const PARTNER_CHILDREN_PREF_OPTIONS = [
  'Yes',
  'No',
  'Does Not Matter'
];

export const LIVING_ARRANGEMENTS = [
  'Alone',
  'With Family',
  'Shared Apartment'
];

export const FINANCE_HABITS = [
  'Spender',
  'Saver',
  'Balanced',
  'Frugal'
];

export const CONFLICT_RESOLUTIONS = [
  'Direct Discussion',
  'Indirect / Subtle',
  'Silent Treatment',
  'Mediation Required'
];

export const FAMILY_VALUES = [
  'Traditional',
  'Modern',
  'Liberal',
  'Religious-Centric'
];

export const CHILDREN_OPTIONS = [
  '0', '1', '2', '3', '4', '5+'
];

export const GENDERS = [
  'Male',
  'Female'
];

export const LOCATIONS = [
  'Addis Ababa',
  'Dire Dawa',
  'Mekelle',
  'Adama',
  'Bahir Dar',
  'Gondar',
  'Hawassa',
  'Jimma',
  'Jijiga',
  'Other (International)'
];
export const JOB_CATEGORIES = [
  'Technology & IT',
  'Healthcare & Medical',
  'Education & Research',
  'Business & Finance',
  'Arts & Entertainment',
  'Engineering & Construction',
  'Legal & Law Enforcement',
  'Service & Hospitality',
  'Government & Public Service',
  'Agriculture & Nature',
  'Other'
];

export const MARRIAGE_CRITERIA_CATEGORIES = [
  {
    id: 'core_values',
    icon: 'ShieldCheck',
    tags: [
      'Religious Compatibility',
      'Traditional Values',
      'Modern Outlook',
      'Cultural & Heritage Minded',
      'High Moral Integrity'
    ]
  },
  {
    id: 'family_future',
    icon: 'Heart',
    tags: [
      'Family Oriented',
      'Wants Children',
      'Respects In-Laws & Extended Family',
      'Shared Domestic Responsibilities',
      'Open to Relocation'
    ]
  },
  {
    id: 'career_finances',
    icon: 'Briefcase',
    tags: [
      'Career Focused',
      'Financial Stability',
      'Education Priority',
      'Ambition & Mutual Growth',
      'Business Minded'
    ]
  },
  {
    id: 'personality_eq',
    icon: 'Smile',
    tags: [
      'Kind & Empathetic',
      'Good Sense of Humor',
      'Patience & Emotional Maturity',
      'Open Communicator',
      'Calm & Peaceful'
    ]
  },
  {
    id: 'lifestyle_habits',
    icon: 'Sparkles',
    tags: [
      'Healthy Lifestyle',
      'Fitness & Sports Enthusiast',
      'Homebody / Cozy Life',
      'Social & Outgoing',
      'No Smoking / No Alcohol'
    ]
  },
  {
    id: 'interests_leisure',
    icon: 'Compass',
    tags: [
      'Travel Lover',
      'Pet Friendly',
      'Minimalist Living',
      'Art & Culture Enthusiast'
    ]
  }
];

export const SPOUSE_REQUIREMENTS_TAGS = MARRIAGE_CRITERIA_CATEGORIES.flatMap(cat => cat.tags);


export const PARTNER_INTENT_OPTIONS = [
  'Single and No Children',
  'Single and Has Children',
  'Divorced and No Children',
  'Divorced and Has Children',
  'Wants Children in Future',
  'Does Not Want Children'
];

export const PARTNER_RELATIONSHIP_GOAL_OPTIONS = [
  'Serious Partner/Marriage',
  'Serious Relationship/Dating',
  'Normal Friendship',
  'Passing Time/Learning and Understanding Marriage',
  'Others'
];

