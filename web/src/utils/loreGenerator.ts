export interface LoreProfile {
  fieldNotes: string;
  insightTitle: string;
  insightText: string;
  insightIcon: 'Flame' | 'Zap' | 'Shield' | 'Dna' | 'Activity';
}

export function generateLore(creature: any): LoreProfile {
  const { diet, movement, kills = 0, foodEaten = 0, age = 0, baseStats, generation = 1 } = creature;

  // 1. Generate Field Notes (The Story)
  const notes: string[] = [];
  if (diet === 'CARNIVORE') {
    if (kills > 5) notes.push("A fierce predator that dominated the terrarium, striking fear into the hearts of many.");
    else notes.push("A scrappy little carnivore always on the prowl for a quick snack.");
  } else if (diet === 'HERBIVORE') {
    if (foodEaten > 10) notes.push("This peaceful giant spent its days happily munching on enormous amounts of greenery.");
    else notes.push("A gentle creature that loves to graze quietly in the tall grass.");
  } else {
    notes.push("An opportunistic omnivore that isn't picky about what's for dinner.");
  }

  if (movement === 'HOPPER') notes.push("It bounces around with boundless energy!");
  else if (movement === 'CRAWLER') notes.push("It prefers to scuttle slowly and methodically along the ground.");
  else notes.push("It sprints across the landscape with surprising speed.");

  if (age > 200) notes.push("A true veteran, it survived against all odds to a ripe old age.");
  else if (age < 30) notes.push("It tragically perished at a very young age before reaching its full potential.");
  
  const fieldNotes = notes.join(' ');

  // 2. Generate Educational Insight (The Science)
  let insightTitle = "";
  let insightText = "";
  let insightIcon: LoreProfile['insightIcon'] = 'Dna';

  const size = baseStats?.renderScale || 1;
  const speed = baseStats?.speed || 100;

  if (generation > 2) {
    insightIcon = 'Dna';
    insightTitle = "Natural Selection";
    insightText = `As a Generation ${generation} descendant, this creature inherited highly adapted traits that allowed its lineage to survive longer than its ancestors.`;
  } else if (size > 1.5 && diet === 'CARNIVORE') {
    insightIcon = 'Flame';
    insightTitle = "Massive Caloric Drain";
    insightText = "Because of its giant body mass and carnivorous diet, this apex predator burned huge amounts of energy and constantly risked starvation.";
  } else if (size < 0.8 && speed > 130) {
    insightIcon = 'Zap';
    insightTitle = "Evolutionary Evasion";
    insightText = "By evolving a tiny body, it sacrificed defensive strength for an incredibly fast metabolism and sprint speed, allowing it to outrun heavy predators.";
  } else if (size > 1.5 && diet === 'HERBIVORE') {
    insightIcon = 'Shield';
    insightTitle = "Biological Tank";
    insightText = "Its immense size acted as a natural defense mechanism, making it nearly impossible for small predators to hunt it successfully.";
  } else {
    insightIcon = 'Activity';
    insightTitle = "Balanced Adaptability";
    insightText = "This creature evolved a highly balanced set of traits, allowing it to adapt to changing weather conditions without extreme vulnerabilities.";
  }

  return {
    fieldNotes,
    insightTitle,
    insightText,
    insightIcon
  };
}
