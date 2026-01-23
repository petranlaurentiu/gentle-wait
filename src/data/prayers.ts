/**
 * Prayer library for GentleWait
 * Christian/Catholic prayers for moments of pause and reflection
 */

export interface Prayer {
  id: string;
  name: string;
  text: string;
  category: "traditional" | "short" | "gratitude" | "peace";
  durationSec: number; // Estimated time to pray slowly
  icon: string;
  attribution?: string;
}

// Traditional Christian/Catholic prayers
export const PRAYERS: Prayer[] = [
  // Traditional prayers
  {
    id: "our-father",
    name: "The Lord's Prayer",
    text: "Our Father, who art in heaven, hallowed be thy name. Thy kingdom come, thy will be done, on earth as it is in heaven. Give us this day our daily bread, and forgive us our trespasses, as we forgive those who trespass against us. And lead us not into temptation, but deliver us from evil. Amen.",
    category: "traditional",
    durationSec: 30,
    icon: "🙏",
    attribution: "Matthew 6:9-13",
  },
  {
    id: "hail-mary",
    name: "Hail Mary",
    text: "Hail Mary, full of grace, the Lord is with thee. Blessed art thou among women, and blessed is the fruit of thy womb, Jesus. Holy Mary, Mother of God, pray for us sinners, now and at the hour of our death. Amen.",
    category: "traditional",
    durationSec: 20,
    icon: "🙏",
    attribution: "Traditional Catholic Prayer",
  },
  {
    id: "glory-be",
    name: "Glory Be",
    text: "Glory be to the Father, and to the Son, and to the Holy Spirit. As it was in the beginning, is now, and ever shall be, world without end. Amen.",
    category: "traditional",
    durationSec: 15,
    icon: "✨",
    attribution: "Traditional Doxology",
  },
  {
    id: "serenity-prayer",
    name: "Serenity Prayer",
    text: "God, grant me the serenity to accept the things I cannot change, courage to change the things I can, and wisdom to know the difference.",
    category: "peace",
    durationSec: 15,
    icon: "☮️",
    attribution: "Reinhold Niebuhr",
  },
  {
    id: "st-francis",
    name: "Prayer of St. Francis",
    text: "Lord, make me an instrument of your peace. Where there is hatred, let me sow love. Where there is injury, pardon. Where there is doubt, faith. Where there is despair, hope. Where there is darkness, light. Where there is sadness, joy.",
    category: "peace",
    durationSec: 30,
    icon: "🕊️",
    attribution: "Prayer of St. Francis",
  },

  // Short prayers for quick moments
  {
    id: "jesus-prayer",
    name: "The Jesus Prayer",
    text: "Lord Jesus Christ, Son of God, have mercy on me, a sinner.",
    category: "short",
    durationSec: 10,
    icon: "✝️",
    attribution: "Eastern Orthodox Tradition",
  },
  {
    id: "angel-of-god",
    name: "Angel of God",
    text: "Angel of God, my guardian dear, to whom God's love commits me here, ever this day be at my side, to light and guard, to rule and guide. Amen.",
    category: "traditional",
    durationSec: 20,
    icon: "👼",
    attribution: "Traditional Catholic Prayer",
  },
  {
    id: "act-of-faith",
    name: "Act of Faith",
    text: "O my God, I firmly believe that you are one God in three divine Persons: Father, Son, and Holy Spirit. I believe that your divine Son became man and died for our sins, and that he will come to judge the living and the dead. I believe these and all the truths which the Holy Catholic Church teaches, because you have revealed them, who can neither deceive nor be deceived. Amen.",
    category: "traditional",
    durationSec: 40,
    icon: "🙏",
    attribution: "Traditional Catholic Prayer",
  },
  {
    id: "act-of-hope",
    name: "Act of Hope",
    text: "O my God, relying on your infinite goodness and promises, I hope to obtain pardon of my sins, the help of your grace, and life everlasting, through the merits of Jesus Christ, my Lord and Redeemer. Amen.",
    category: "traditional",
    durationSec: 25,
    icon: "⭐",
    attribution: "Traditional Catholic Prayer",
  },
  {
    id: "act-of-love",
    name: "Act of Love",
    text: "O my God, I love you above all things, with my whole heart and soul, because you are all good and worthy of all my love. I love my neighbor as myself for the love of you. I forgive all who have injured me, and I ask pardon of all whom I have injured. Amen.",
    category: "traditional",
    durationSec: 30,
    icon: "❤️",
    attribution: "Traditional Catholic Prayer",
  },

  // Gratitude prayers
  {
    id: "gratitude-simple",
    name: "Prayer of Thanks",
    text: "Gracious God, I thank you for this moment of pause. Help me to remember that in stillness, I can find you. In silence, I can hear your voice. Thank you for your constant presence. Amen.",
    category: "gratitude",
    durationSec: 20,
    icon: "🙏",
  },
  {
    id: "morning-offering",
    name: "Morning Offering",
    text: "O Jesus, through the Immaculate Heart of Mary, I offer you my prayers, works, joys, and sufferings of this day for all the intentions of your Sacred Heart. Amen.",
    category: "gratitude",
    durationSec: 20,
    icon: "🌅",
    attribution: "Traditional Catholic Prayer",
  },
  {
    id: "breath-prayer",
    name: "Breath Prayer",
    text: "Lord Jesus Christ, have mercy on me. (Breathe in: 'Lord Jesus Christ', Breathe out: 'have mercy on me')",
    category: "short",
    durationSec: 15,
    icon: "💨",
    attribution: "Ancient Christian Meditation",
  },

  // Peace and guidance
  {
    id: "psalm-23",
    name: "The Lord is My Shepherd",
    text: "The Lord is my shepherd; I shall not want. He maketh me to lie down in green pastures: he leadeth me beside the still waters. He restoreth my soul.",
    category: "peace",
    durationSec: 20,
    icon: "🐑",
    attribution: "Psalm 23:1-3",
  },
  {
    id: "memorare",
    name: "Memorare",
    text: "Remember, O most gracious Virgin Mary, that never was it known that anyone who fled to thy protection, implored thy help, or sought thy intercession, was left unaided. Inspired with this confidence, I fly unto thee, O Virgin of virgins, my Mother. To thee do I come; before thee I stand, sinful and sorrowful. O Mother of the Word Incarnate, despise not my petitions, but in thy mercy hear and answer me. Amen.",
    category: "traditional",
    durationSec: 45,
    icon: "🙏",
    attribution: "Traditional Marian Prayer",
  },
  {
    id: "st-michael",
    name: "St. Michael Prayer",
    text: "St. Michael the Archangel, defend us in battle. Be our protection against the wickedness and snares of the devil. May God rebuke him, we humbly pray. And do thou, O Prince of the Heavenly Host, by the power of God, cast into hell Satan and all the evil spirits who prowl about the world seeking the ruin of souls. Amen.",
    category: "traditional",
    durationSec: 30,
    icon: "⚔️",
    attribution: "Pope Leo XIII",
  },
  {
    id: "peace-prayer",
    name: "Prayer for Peace",
    text: "Lord, calm my anxious heart. In this moment of pause, help me to let go of the urgency and find rest in your presence. Give me peace that surpasses understanding. Amen.",
    category: "peace",
    durationSec: 20,
    icon: "🕊️",
  },
  {
    id: "guidance-prayer",
    name: "Prayer for Guidance",
    text: "Loving Father, guide my steps today. Help me to use my time wisely and to be present with those around me. Free me from distractions and help me focus on what truly matters. Amen.",
    category: "peace",
    durationSec: 25,
    icon: "🧭",
  },

  // Brief aspirations (very short prayers)
  {
    id: "kyrie",
    name: "Kyrie Eleison",
    text: "Lord, have mercy. Christ, have mercy. Lord, have mercy.",
    category: "short",
    durationSec: 10,
    icon: "✝️",
    attribution: "Ancient Christian Prayer",
  },
  {
    id: "thanks-be",
    name: "Thanks Be to God",
    text: "Thanks be to God for this moment of rest. May I use it to return to you. Amen.",
    category: "gratitude",
    durationSec: 10,
    icon: "🙏",
  },
  {
    id: "present-moment",
    name: "Prayer of Presence",
    text: "God, you are here with me now. Help me to be fully present in this moment, aware of your loving presence. Amen.",
    category: "peace",
    durationSec: 15,
    icon: "🌟",
  },
];

// Helper functions
export function getRandomPrayer(): Prayer {
  return PRAYERS[Math.floor(Math.random() * PRAYERS.length)];
}

export function getPrayersByCategory(
  category: Prayer["category"]
): Prayer[] {
  return PRAYERS.filter((prayer) => prayer.category === category);
}

/**
 * Get a prayer that fits within a given duration
 * @param durationSec - Target duration in seconds (e.g., 10, 15, 20, 30)
 */
export function getPrayerForDuration(durationSec: number): Prayer {
  // Filter prayers that fit within the duration
  const suitablePrayers = PRAYERS.filter(
    (prayer) => prayer.durationSec <= durationSec
  );

  // If we have suitable prayers, pick one randomly
  if (suitablePrayers.length > 0) {
    return suitablePrayers[
      Math.floor(Math.random() * suitablePrayers.length)
    ];
  }

  // If no prayer fits, return the shortest one
  const shortestPrayer = PRAYERS.reduce((prev, current) =>
    prev.durationSec < current.durationSec ? prev : current
  );

  return shortestPrayer;
}

/**
 * Get a prayer by specific category, adjusted for duration
 */
export function getPrayerByCategoryForDuration(
  category: Prayer["category"],
  durationSec: number
): Prayer {
  const categoryPrayers = getPrayersByCategory(category);
  const suitablePrayers = categoryPrayers.filter(
    (prayer) => prayer.durationSec <= durationSec
  );

  if (suitablePrayers.length > 0) {
    return suitablePrayers[
      Math.floor(Math.random() * suitablePrayers.length)
    ];
  }

  // Fallback to shortest in category
  return categoryPrayers.reduce((prev, current) =>
    prev.durationSec < current.durationSec ? prev : current
  );
}
