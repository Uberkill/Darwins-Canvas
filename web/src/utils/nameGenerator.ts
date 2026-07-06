const ADJECTIVES = [
  'Bouncy', 'Sleepy', 'Sparkle', 'Happy', 'Grumpy', 'Silly', 
  'Fluffy', 'Wobbly', 'Tiny', 'Mighty', 'Squishy', 'Zoomy',
  'Speedy', 'Hungry', 'Chunky', 'Derpy', 'Goofy', 'Floppy',
  'Jumpy', 'Fuzzy', 'Shiny', 'Dizzy', 'Zippy', 'Sneaky'
]

const NOUNS = [
  'Bob', 'Steve', 'Toes', 'Bean', 'Noodle', 'Potato',
  'Puff', 'Sprout', 'Peanut', 'Muffin', 'Puddle', 'Bubble',
  'Worm', 'Frog', 'Bug', 'Monster', 'Blob', 'Critter',
  'Buddy', 'Pal', 'Friend', 'Dude', 'Guy', 'Gal'
]

export function generateRandomName(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
  return `${adj} ${noun}`
}
