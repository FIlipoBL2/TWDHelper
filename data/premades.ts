import { Faction, NPC, Skill, SkillExpertise } from "../types";

const emptySkillExpertise = () => Object.fromEntries(Object.values(Skill).map(skill => [skill, SkillExpertise.None])) as Record<Skill, SkillExpertise>;

const parseSkills = (expert: string[], trained: string[]): Record<Skill, SkillExpertise> => {
    const expertise = emptySkillExpertise();
    (expert || []).forEach(skill => {
        if (Object.values(Skill).includes(skill as Skill)) {
            expertise[skill as Skill] = SkillExpertise.Expert;
        }
    });
    (trained || []).forEach(skill => {
        if (Object.values(Skill).includes(skill as Skill)) {
            expertise[skill as Skill] = SkillExpertise.Trained;
        }
    });
    return expertise;
};


export const PREMADE_FACTIONS: Omit<Faction, 'id'>[] = [
  {
    "name": "The Black Hearts",
    "description": "A group of 30 people who were freegans and punk rockers before the outbreak. They live together as a family in a condemned brick building. Half of the current inhabitants are survivors they have taken in, making a clear difference between “the Group” (original members) and “the Newcomers” (not welcome in the council, get worst jobs, seldom enough to eat). They have lost all hope and show suicidal behavior and antipathy towards other groups.",
    "size": 30,
    "type": "Former freegans and punk rockers, now a family-like group with internal divisions.",
    "leadership": "A council where all decisions are made, but Newcomers are excluded.",
    "assets": "Knowledge of survival. Their haven has five cars, an RV, and a lot of gasoline in the basement, intended for burning down the house.",
    "needs": "Need help from the outside to save themselves from imploding.",
    "issues": [
      "About to implode",
      "Violent internal conflicts",
      "Hopelessness",
      "Knowledge of survival"
    ],
    "haven": {
      "name": "Five-story brick building",
      "description": "Just before the outbreak, they prepared the house for a coming attack from the police, securing doors and windows on the bottom floor, and implementing smart traps, getaways, and portholes for defense.",
      "capacity": 3,
      "defense": 3,
      "issues": [
        "No running water inside",
        "No other food source than what you can scavenge"
      ]
    },
    "key_npcs": [
      { "name": "Michelle Turner", "role": "Unofficial leader", "expert_skills": [], "trained_skills": [], "issues": ["Brutal and manipulative"] },
      { "name": "Jay Graffin", "role": "Teacher for the kids", "expert_skills": [], "trained_skills": [], "issues": ["Stubborn", "Brave", "One of the few with hope for the future"] }
    ],
    "endgame_example": "The Black Hearts start a violent conflict with the PCs, then propose a peace treaty and invite them into their enclave, but block the doors and set fire to a gasoline stash in the basement."
  },
  {
    "name": "Sugar Hill",
    "description": "A large community of over a hundred survivors gathered around an old city hall, where soldiers originally protected them. They live by pre-outbreak laws, preserving energy and resources, and preparing for rebuilding the country. They have a doctor’s clinic with equipment, two doctors, and three nurses, but lack food and many are starving.",
    "size": "Over a hundred survivors",
    "type": "Well-structured and functional society, focused on preservation and rebuilding.",
    "leadership": "Not explicitly stated, but implies a structured leadership given their focus on laws and order.",
    "assets": "Doctor’s clinic with equipment, two doctors, three nurses. Sturdy walls and guards. Functional flamethrowers.",
    "needs": "Food.",
    "issues": [
      "Starvation",
      "Aggressive towards newcomers",
      "Won’t believe the truth (about no rescue teams coming)"
    ],
    "haven": {
      "name": "Old city hall",
      "description": "Walls are tall and strong, guarded by people with guns. Large gate reinforced by a truck. Only way in or out is climbing walls via a rope.",
      "capacity": 2,
      "defense": 4,
      "issues": []
    },
    "key_npcs": [
      { "name": "Sandy Debra Galovski", "role": "Community priest and leader", "expert_skills": [], "trained_skills": [], "issues": ["Most certain help will come soon"] },
      { "name": "Jennie Heights", "role": "Ex-soldier", "expert_skills": [], "trained_skills": [], "issues": ["Desperate to get others to understand no rescue teams are coming"] }
    ],
    "endgame_example": "Sugar Hill's leaders' belief in rescue is seemingly confirmed when soldiers and tanks arrive, but the soldiers plunder Sugar Hill, kill everyone, and take it as their new base."
  },
  {
    "name": "The Living",
    "description": "A group of about 50 violent and disorganized people who settled in a bombed-out factory. They used to opportunistically scavenge and steal from strangers. Disputes are settled in 'The Hole', a fighting pit with chained walkers. They have a radio transmitter to lure survivors, whom they then kill or enslave.",
    "size": 50,
    "type": "Chaotic murderers who idealize brute strength.",
    "leadership": "Whoever is strongest makes the decisions.",
    "assets": "A radio transmitter. Well-armed (spears, baseball bats, Molotov cocktails).",
    "needs": "Desperately short on ammunition. Want to conquer and plunder.",
    "issues": [
      "Can’t be trusted",
      "Idealize brute strength",
      "Want to conquer and plunder",
      "Will do almost anything to get ammunition",
      "Badly organized"
    ],
    "haven": {
      "name": "Ruins of a large factory",
      "description": "Filled with traps. Faction members live in small groups, hiding from each other and intruders.",
      "capacity": 3,
      "defense": 2,
      "issues": []
    },
    "key_npcs": [
      { "name": "Nate Miller", "role": "Leader of The Living", "expert_skills": ["Close Combat", "Mobility", "Manipulation"], "trained_skills": ["Stealth", "Ranged Combat"], "issues": ["Manipulative", "Unpredictable", "Loves this new world"] },
      { "name": "Robert Lehman", "role": "Surgeon", "expert_skills": ["Medicine"], "trained_skills": [], "issues": ["Wants to flee but does not know how", "Cynic"] },
      { "name": "Chloe Barnes", "role": "DJ", "expert_skills": ["Manipulation"], "trained_skills": ["Tech", "Leadership"], "issues": ["In charge of the radio transmitter", "Visionary", "Has people fighting for her"] }
    ],
    "endgame_example": "The School starts trading with The Living, giving them ammunition. The Living then use these weapons to attack and burn down The School, taking prisoners, and expanding their control over the area."
  },
  {
    "name": "The Reborn",
    "description": "A group of 14 people who sought refuge in a church after the outbreak, believing Father Jack Morgan's death without reanimating proved his Second Coming. They are determined to build a New Jerusalem, using the Bible to make decisions. They are well-equipped and highly disciplined, and like to contact strangers to spread their word.",
    "size": 14,
    "type": "A cult following a leader, dedicated to building a new world based on religious beliefs.",
    "leadership": "No single leader after Father Morgan's death; decisions are made based on interpreting the Bible.",
    "assets": "Well-defended military bunker with lots of food, gasoline, and ammunition. Several army trucks and jeeps.",
    "needs": "Looking for a radio transmitter.",
    "issues": [
      "The Holy words will lead us to paradise",
      "Well-trained and well-equipped",
      "Prepared to sacrifice their own lives for their beliefs",
      "Everyone must take a stand, for good or for evil"
    ],
    "haven": {
      "name": "Well-defended military bunker",
      "description": "Placed in the forest, near Father Jack Morgan's grave, where the group prays daily.",
      "capacity": 3,
      "defense": 3,
      "issues": []
    },
    "key_npcs": [
      { "name": "Lucy Brown", "role": "Soldier", "expert_skills": ["Ranged Combat"], "trained_skills": ["Close Combat", "Leadership", "Manipulation", "Stealth", "Scout"], "issues": ["Father Morgan’s closest disciple", "Sinners should burn", "Silver tongue"] },
      { "name": "Arnold Grant", "role": "Police officer (former)", "expert_skills": [], "trained_skills": ["Ranged Combat", "Close Combat", "Scout", "Mobility"], "issues": ["True believer", "Longs for his friends and wife at Grady Memorial Hospital"] },
      { "name": "Roy Harris", "role": "Construction worker", "expert_skills": ["Close Combat", "Endurance", "Force"], "trained_skills": ["Survival", "Medicine", "Scout"], "issues": ["Struggles with his beliefs (regarding Father Morgan's burial)"] }
    ],
    "endgame_example": "The Reborn grow in size, challenging The Living and The School. The leader of The Reborn murders The Living's leader, gaining power over them and using it to attack and defeat The School, spreading their faith far and wide."
  },
  {
    "name": "The School",
    "description": "A gathering point for pupils and teachers after the fall, where soldiers fought off walkers and died. The teachers and students took weapons and transformed the campus into a haven with a working farm, laws, and courts. It has a Council of fifteen former teachers/staff who make decisions. Younger kids (7-16) must abide by strict rules and work ethic. Security members are carefully selected students with aggressive/anti-social tendencies.",
    "size": "132",
    "type": "Well-structured and functional society, with a focus on education and community, but with a harsh underlying system.",
    "leadership": "The Council (15 former teachers and staff members) makes all decisions.",
    "assets": "Working farm, laws, courts. A battle tank (broken engine, limited ammo).",
    "needs": "Searching for other settlements to trade with for vital equipment.",
    "issues": [
      "The Council recklessly consumes resources for monthly parties, forcing students to fend for themselves",
      "The Council is paranoid",
      "Searches for a trade partner but feels threatened by large settlements",
      "Individual needs are sacrificed for the common good",
      "A stash of heavy weapons that will be used if needed"
    ],
    "haven": {
      "name": "Three-story school building",
      "description": "Red brick with a black roof. Schoolyard surrounded by a high wall. Farmland inside, guard towers.",
      "capacity": 4,
      "defense": 4,
      "issues": []
    },
    "key_npcs": [
      { "name": "Margaret Hicks", "role": "Former biology teacher and Council member", "expert_skills": ["Manipulation"], "trained_skills": ["Leadership", "Tech"], "issues": ["Cruel and hateful", "Scared of the Security and will do anything to please them", "Sees other adults as rivals"] },
      { "name": "Alice Day", "role": "Leader of the Security", "expert_skills": ["Ranged Combat"], "trained_skills": ["Mobility", "Close Combat", "Leadership"], "issues": ["Sociopath"] },
      { "name": "Leo Duncan", "role": "Recent graduate", "expert_skills": [], "trained_skills": ["Close Combat", "Ranged Combat", "Stealth", "Scout"], "issues": ["Traumatized from defending himself and fellow students", "Fed up with the Council, but watched by friends"] }
    ],
    "endgame_example": "The School starts trading with The Living, giving them ammunition. The Living then use these weapons to attack and burn down The School, taking prisoners, and expanding their control over the area."
  },
  {
    "name": "Civic Republic",
    "description": "An example of a bigger and more advanced community, based in what was once Philadelphia, Pennsylvania. Initially collaborated with other secure cities, but turned on allies when resources became scarce.",
    "size": "Large",
    "type": "Advanced community / Formerly civilized society.",
    "leadership": "Unknown",
    "assets": "Advanced Technology",
    "needs": "Resources.",
    "issues": ["Turned on allies for resources."],
    "haven": { "name": "Philadelphia, Pennsylvania", "description": "A fortified city." },
    "endgame_example": "Wipes out other major settlements to secure its dominance."
  },
  {
    "name": "The Juggernauts",
    "description": "Mentioned as an example of a hostile faction in an endgame scenario. Their nihilistic mission is to wipe out every haven they come across.",
    "size": "Unknown",
    "type": "Elite soldiers who have abandoned all hope after their haven was destroyed by a ruthless faction.",
    "leadership": "Unknown",
    "assets": "Military hardware.",
    "needs": "Destruction.",
    "issues": ["Nihilistic mission to wipe out every haven."],
    "endgame_example": "The Juggernauts defeat all other factions and enslave their members, building an underground fortress for themselves while surface workers are exposed to risks."
  }
];


export const PREMADE_NPCS: Omit<NPC, 'id' | 'health' | 'maxHealth'>[] = [
    { name: 'Anthony Brooks', archetype: 'Teacher', issues: ['Stubborn', 'sleeps with Abigail'], inventory: ['Car', 'revolver', 'map with a safe house marked out'], skillExpertise: parseSkills([], ["Survival", "Tech"]) },
    { name: 'Melissa Anderson', archetype: 'Screenplay writer', issues: ['Easily scared', 'looks to others for protection'], inventory: ['Kitchen knife', 'big flashlight', 'taser'], skillExpertise: parseSkills([], ["Manipulation"]) },
    { name: 'Robert Young', archetype: 'Kid', issues: ['Thinks he can take care of himself', 'asthmatic'], inventory: [], skillExpertise: parseSkills([], ["Stealth", "Mobility"]) },
    { name: 'Bobby Miller', archetype: 'Boxer and thief', issues: ['Wants to be top dog', 'secretly in love with Melissa'], inventory: ['Hammer', 'Vespa'], skillExpertise: parseSkills(["Close Combat"], ["Mobility"]) },
    { name: 'Abigail Miller', archetype: 'Farmer', issues: ['Will protect her son Bobby at any cost', 'sleeps with Anthony', 'broken foot that healed badly'], inventory: ['Shotgun', 'pitchfork', 'seeds that can be planted'], skillExpertise: parseSkills([], ["Tech", "Endure"]) },
    { name: 'George Lee', archetype: 'Plumber', issues: ['Only one eye'], inventory: ['Axe', 'tent', 'survival gear', 'canned food'], skillExpertise: parseSkills([], ["Scout", "Tech"]) },
    { name: 'Kayla Clark', archetype: 'Dancer', issues: ['Easily insulted', 'wants to know what is happening'], inventory: ['Spear', 'bicycle', 'American football helmet'], skillExpertise: parseSkills([], ["Close Combat", "Mobility"]) },
    { name: 'Doris Young', archetype: 'Elderly', issues: ['Sick and frail', 'keeps to the old morals and laws'], inventory: ['Wheelchair', 'bottle of schnapps'], skillExpertise: parseSkills(["Tech"], ["Leadership"]) },
    { name: 'Elijah Flores', archetype: 'Politician', issues: ['Has a way with words', 'visionary', 'dislikes Doris Young'], inventory: ['Dog named Rosa', 'small revolver'], skillExpertise: parseSkills([], ["Manipulation"]) },
    { name: 'Amber King', archetype: 'Soldier', issues: ['Protects Elijah Flores and believes every word he says'], inventory: ['Assault rifle', 'three hand grenades', 'bayonet', 'camouflage gear', 'survival equipment', 'good maps', 'compass', 'wind up radio'], skillExpertise: parseSkills([], ["Ranged Combat", "Close Combat"]) },
    { name: 'Betty “Anvil” Hall', archetype: 'Teen punk rocker', issues: ['Won’t talk about what happened to her'], inventory: ['Knife'], skillExpertise: parseSkills([], ["Survival", "Stealth"]) },
    { name: 'Daniel Perez', archetype: 'Stockbroker', issues: ['Exaggerates his own ability', 'wants to keep the group together'], inventory: ['Pistol'], skillExpertise: parseSkills([], ["Leadership", "Manipulation"]) },
    { name: 'Nicole Perez', archetype: 'Immigrant/domestic worker', issues: ['Trusts no one'], inventory: ['Pistol', 'basic medical supplies'], skillExpertise: parseSkills([], ["Medicine", "Scout"]) },
    { name: 'Samuel Carter', archetype: 'Construction worker', issues: ['Looks out for his daughter Denise', 'will follow the strongest leader'], inventory: ['Hammer', 'rifle'], skillExpertise: parseSkills(["Close Combat"], ["Endure"]) },
    { name: 'Denise Carter', archetype: 'Kid', issues: ['Traumatized', 'emotionally sensitive and empathetic'], inventory: ['Hidden revolver'], skillExpertise: parseSkills([], ["Stealth"]) },
    { name: 'Raymond Green', archetype: 'Doctor', issues: ['Depressed', 'mourns his family'], inventory: ['Advanced medical gear'], skillExpertise: parseSkills(["Medicine"], ["Manipulation"]) },
    { name: 'Emma Wilson', archetype: 'Athlete', issues: ['Injured', 'God-fearing'], inventory: ['Bow and arrows', 'tent'], skillExpertise: parseSkills([], ["Endure", "Mobility"]) },
    { name: 'Ryan Smith', archetype: 'Senior citizen', issues: ['Taciturn', 'plans for the worst'], inventory: ['Mobile home', 'toolkit', 'rifle'], skillExpertise: parseSkills([], ["Tech", "Survival"]) },
    { name: 'Sharon Smith', archetype: 'Senior citizen', issues: ['Careless', 'wants everyone to feel good', 'loud'], inventory: ['Revolver', '3 liquor bottles'], skillExpertise: parseSkills([], ["Ranged Combat"]) },
    { name: 'Anna Jones', archetype: 'Spiritualistic medium', issues: ['Believes she will save mankind', 'dissociates'], inventory: ['Bludgeon', 'holy symbols', 'dream catchers', 'incense', 'magic mushrooms'], skillExpertise: parseSkills([], ["Medicine", "Manipulation"]) },
    { name: 'Nicolas White', archetype: 'Criminal', issues: ['Only respects strength', 'loves to tease and harass others'], inventory: ['Machete', 'revolver'], skillExpertise: parseSkills([], ["Close Combat", "Ranged Combat"]) },
    { name: 'Amy Hall', archetype: 'Soldier', issues: ['Rules with an iron fist', 'macho'], inventory: ['Assault rifle', 'explosive paste', 'pistol', 'knife', 'night-googles', 'camouflage gear', 'survival equipment'], skillExpertise: parseSkills(["Ranged Combat"], ["Force"]) },
    { name: 'Ronald Green', archetype: 'Engineer', issues: ['Tries to not get in anyone’s way', 'dependent on others for protection', 'a poet'], inventory: ['Toolkit', 'hand wired radio'], skillExpertise: parseSkills([], ["Tech", "Scout"]) },
    { name: 'Ki Wilson', archetype: 'Nurse', issues: ['Will do whatever it takes'], inventory: ['Basic medical gear'], skillExpertise: parseSkills([], ["Medicine", "Manipulation"]) },
    { name: 'Demián Vergara', archetype: 'Drifter', issues: ['Searches for something to believe in', 'does not take shit from anyone'], inventory: ['Revolver', 'screwdriver'], skillExpertise: parseSkills([], ["Survival"]) },
    { name: 'Gael Barraza', archetype: 'Psychotherapist', issues: ['Eager to make hard decisions', 'empathically exhausted'], inventory: ['Rifle', 'a pair of sharp scissors', 'several packs of cigarettes'], skillExpertise: parseSkills(["Leadership"], ["Manipulation"]) },
    { name: 'Angela Flores', archetype: 'Medical student', issues: ['Does not share her pains and concerns', 'takes care of her baby'], inventory: ['Basic medical gear'], skillExpertise: parseSkills([], ["Medicine", "Tech", "Manipulation"]) },
    { name: 'Jacob Flores', archetype: 'Baby', issues: ['Unwanted baby to a young mother', 'screams when scared, hungry, tired, or sick'], inventory: [], skillExpertise: emptySkillExpertise() },
    { name: 'Jason Lee', archetype: 'Farmer', issues: ['Thinks he is responsible for the others', 'wants to keep everyone happy'], inventory: ['Sniper rifle', 'big knife', 'guitar', 'hidden stash of marshmallows'], skillExpertise: parseSkills([], ["Survival", "Endure"]) },
    { name: 'Barbara Ferrara', archetype: 'Runaway teen', issues: ['Secretly in love with Angela Flores', 'wants to protect the others from the harsh realities in the world', 'likes to take risks'], inventory: ['Big axe', 'stiletto', 'revolver', 'motorbike'], skillExpertise: parseSkills([], ["Close Combat", "Stealth"]) },
    { name: 'Liam Graham', archetype: 'Nurse', issues: ['Coward'], inventory: ['Basic medical gear', 'knife', 'guitar'], skillExpertise: parseSkills([], ["Medicine", "Scout"]) },
    { name: 'Alicia Gonzalez', archetype: 'Pilot', issues: ['Lonely', 'constant arguments with her teenage son Daniel Gonzalez'], inventory: ['Shotgun', 'small dog named Donald', 'scooter'], skillExpertise: parseSkills([], ["Mobility", "Ranged Combat"]) },
    { name: 'Mildred Cobb', archetype: 'Wildlife tourist guide', issues: ['Taciturn', 'Secretly plans to abandon the group'], inventory: ['Tent', 'wildlife equipment', 'small revolver'], skillExpertise: parseSkills(["Survival"], ["Ranged Combat"]) },
    { name: 'Daniel Gonzalez', archetype: 'Teenager', issues: ['Smothered by his mother’s attempts to keep him safe', 'overconfident', 'says the wrong thing at the wrong time'], inventory: ['A well–read copy of the book Walden', 'knife', 'diary'], skillExpertise: parseSkills([], ["Manipulation"]) },
    { name: 'Ann Hiller', archetype: 'Social worker', issues: ['Reliable and loyal', 'trigger happy'], inventory: ['Pistol', 'seeds for planting', 'cigarette packs', 'lighter'], skillExpertise: parseSkills([], ["Endure"]) },
    { name: 'Jason Brooks', archetype: 'Hunter', issues: ['Wounded and alone', 'cool–headed', 'Secretly a manipulative sadist'], inventory: ['Hunting rifle', '6 rations', 'big knife'], skillExpertise: parseSkills(["Survival", "Ranged Combat"], ["Mobility", "Close Combat", "Stealth"]) },
    { name: 'Rita, Danny, and Rosalynn Harvey', archetype: 'Kids', issues: ['Loyal to each other', 'saw their parents get murdered', 'do not trust anyone'], inventory: ['Bikes', 'machetes', '3 rations'], skillExpertise: parseSkills([], ["Stealth", "Mobility"]) },
    { name: 'Santiago Perez', archetype: 'Surgeon', issues: ['Coward', 'Secretly a pills addict'], inventory: ['Basic medical gear', 'drugs', 'Vespa scooter', '4 rations'], skillExpertise: parseSkills(["Medicine"], ["Tech"]) },
    { name: 'Paula Rodriguez', archetype: 'Teacher', issues: ['Diabetic'], inventory: ['Sports car', 'insulin shots', 'gun without bullets', '4 rations'], skillExpertise: parseSkills([], ["Tech", "Survival"]) },
    { name: 'Lenny Smith and Ross Brown', archetype: 'Musicians and lovers', issues: ['Cannot handle the fear'], inventory: ['Violins', 'machine guns', '6 rations', 'watch dog named Lennon', 'small car'], skillExpertise: parseSkills([], ["Ranged Combat"]) },
    { name: 'Joey Chard', archetype: 'Construction worker', issues: ['Shy', 'out to get revenge for his dead daughter', 'Secretly falls in love easily'], inventory: ['Sledgehammer', '6 rations', 'pickup truck low on gasoline'], skillExpertise: parseSkills(["Endurance"], ["Force", "Close Combat"]) },
    { name: 'Peter Sloan and Patricia Anderson', archetype: 'Teens', issues: ['Starving', 'Secretly thieves and murderers'], inventory: ['Hidden knives', 'pepper spray', 'shovel each'], skillExpertise: parseSkills([], ["Stealth", "Close Combat", "Manipulation"]) },
    { name: 'Zoe Valdez', archetype: 'Police officer', issues: ['Likes to take command'], inventory: ['Revolver', 'hat', 'badge', 'police car', '6 rations', 'a shotgun', 'knife', 'a newly killed animal', '5 bottles of wine'], skillExpertise: parseSkills(["Ranged Combat"], ["Stealth", "Leadership", "Close Combat"]) },
    { name: 'Harry Lee', archetype: 'Elite athlete', issues: ['Lives by the old world’s morals'], inventory: ['Motorcycle', 'revolver', 'hand axe', '4 rations', '6 ID–cards taken from his dead friends'], skillExpertise: parseSkills(["Mobility"], ["Close Combat", "Scout"]) },
    { name: 'Angelina Banich', archetype: 'Housewife', issues: ['Mentally unstable', 'loner', 'Secretly killed her old gang'], inventory: ['Pistol', 'knife', '2 rations'], skillExpertise: parseSkills(["Ranged Combat"], ["Survival", "Stealth", "Close Combat"]) },
    { name: 'Viviane and James Moore', archetype: 'Husband and wife', issues: ['Dream of finding a safe place', 'Viviane is pregnant', 'desperate'], inventory: ['2 rations', '2 handguns', 'a car'], skillExpertise: parseSkills([], ["Close Combat", "Survival"]) },
    { name: 'Lucas Resick', archetype: 'Psychologist', issues: ['Does whatever it takes to survive'], inventory: ['Shotgun', '2 rations', 'a car', 'a tent'], skillExpertise: parseSkills(["Manipulation"], ["Scout"]) },
    { name: 'Kai Patel', archetype: 'Car mechanic', issues: ['Stays out of conflicts', 'Secretly loyal to the strongest'], inventory: ['Jeep filled with tools', 'machine gun', 'axe', '6 rations', 'several gasoline tanks'], skillExpertise: parseSkills(["Tech"], ["Close Combat"]) },
    { name: 'Roger Hammond and Kit Wilson', archetype: 'Soldiers', issues: ['Traumatized', 'carrying their mortally wounded friend'], inventory: ['Assault rifle', 'pistols', 'knives', '12 rations', 'survival gear'], skillExpertise: parseSkills(["Ranged Combat"], ["Close Combat", "Survival", "Endurance", "Mobility"]) },
    { name: 'Melissa Jackson', archetype: 'Ex–drug addict', issues: ['Thinks the worst of people'], inventory: ['Basic medical gear', 'pick-axe', '2 rations', '1 hand grenade'], skillExpertise: parseSkills([], ["Stealth", "Medicine"]) },
    { name: 'Ellen Kay', archetype: 'Professor', issues: ['Good at making others fight for her', 'cool–headed', 'Secretly never forgets an injustice'], inventory: ['Kitchen knife', 'riot shield', '4 rations', 'another survivor who fights for her'], skillExpertise: parseSkills(["Tech"], ["Manipulation"]) },
    { name: 'Ming–Na Ho', archetype: 'Firefighter', issues: ['Depressed', 'Secretly has latent tuberculosis'], inventory: ['Fire axe', '10 rations', 'motorbike', 'tent'], skillExpertise: parseSkills(["Endurance"], ["Survival", "Close Combat", "Force"]) },
    { name: 'Kayd and Scott Pierson', archetype: 'Father and son', issues: ['Ready to do anything to survive'], inventory: ['Knife', 'axe', 'garrote', '2 rations'], skillExpertise: parseSkills([], ["Scout", "Stealth", "Mobility"]) },
    { name: 'Madeline Rivera', archetype: 'Stock broker', issues: ['Over–confident', 'trader', 'Secretly blames the weakest'], inventory: ['Car', '20 rations', 'shotgun'], skillExpertise: parseSkills(["Manipulation"], []) },
    { name: 'Stu Harrison', archetype: 'Cartoon writer', issues: ['Relies on luck', 'Secretly puts others in harm’s way'], inventory: ['2 rations', 'gored up poncho to blend in among the dead', 'a horn to call on the dead for protection'], skillExpertise: emptySkillExpertise() },
    { name: 'Ezra Faheem', archetype: 'Nurse', issues: ['Trust issues'], inventory: ['Basic medical gear', 'small car', '10 rations', 'speargun'], skillExpertise: parseSkills([], ["Medicine", "Close Combat"]) },
    { name: 'Eliot Harper', archetype: 'Engineer', issues: ['Soft spot for children', 'Secretly will sacrifice anything to save a child'], inventory: ['Shovel', 'survival gear', '2 rations'], skillExpertise: parseSkills(["Tech"], []) },
    { name: 'Wayne Vo', archetype: 'Landlord', issues: ['Alcoholic'], inventory: [], skillExpertise: emptySkillExpertise() },
    { name: 'Anne Jackson', archetype: 'Actor', issues: ['Never sleeps', 'Secretly hears voices'], inventory: ['Sword', '2 rations'], skillExpertise: parseSkills([], ["Stealth", "Close Combat"]) },
    { name: 'Zane Sparks', archetype: 'Animal handler', issues: ['Never changes his opinion about anything'], inventory: ['Animal control pole', 'protective gloves', 'nets', 'shovel', 'taser', '5 rations'], skillExpertise: parseSkills([], ["Ranged Combat", "Survival"]) },
    { name: 'Jessica Fryers', archetype: 'Pilot', issues: ['Stubborn', 'wounded', 'Secretly a member of a secret faction'], inventory: ['Carbine rifle', 'propeller plane with no gas', 'knife'], skillExpertise: parseSkills(["Mobility"], ["Close Combat", "Manipulation"]) },
    { name: 'Luke McGowan', archetype: 'Assassin', issues: ['Never plays by the rules', 'Secretly only loyal to himself'], inventory: ['Hunting rifle', 'shovel', 'knife', 'Vespa scooter', '4 rations', 'pet cat named Cindy'], skillExpertise: parseSkills(["Ranged Combat", "Close Combat"], ["Stealth"]) },
    { name: 'Mira Bello', archetype: 'Factory worker', issues: ['Lonely and afraid'], inventory: ['Two–handed axe', '1 ration'], skillExpertise: parseSkills([], ["Endurance"]) },
    { name: 'Selena and Eva Cabello', archetype: 'Sisters', issues: ['Never let anyone in', 'fight dirty', 'Secretly Selena recently lost her baby twins'], inventory: ['Baseball bats', 'spears', 'equipment to set up traps', '2 grenades', '8 rations'], skillExpertise: parseSkills([], ["Survival"]) },
    { name: 'Jacky Hearts', archetype: 'Influencer', issues: ['Picks on the weak', 'Secretly a thief and a murderer'], inventory: ['Sports bicycle', 'revolver', 'hammer', 'handheld camera with batteries', 'a boyfriend named Claude who never utters a word', '8 rations'], skillExpertise: emptySkillExpertise() },
    { name: 'Esmerelda Rains', archetype: 'Bus driver', issues: ['Knows about a safe place, but can’t get there without help', 'Secretly a pathological liar'], inventory: ['Sheriff’s badge', 'revolver', 'fake diamond ring', 'bandage on her arm that hides an ugly tattoo'], skillExpertise: parseSkills([], ["Mobility"]) },
    { name: 'Oscar Lahm', archetype: 'Waste collector', issues: ['Thinks the worst of people'], inventory: ['Garbage truck filled with random equipment', 'rifle', 'nunchaku', 'sharpened screwdriver', '20 rations'], skillExpertise: parseSkills([], ["Endurance", "Close Combat"]) },
    { name: 'Sheila Barboza', archetype: 'Cleaning lady', issues: ['Has been hiding in a prepper’s bunker until recently', 'practically useless around walkers', 'Secretly the prepper wouldn’t let her leave'], inventory: ['Hunting rifle', 'survival gear', 'first aid kits', '10 rations', 'an axe', 'a tent', 'a sun powered battery–charger', 'a radio transmitter', 'a car with two flat tires'], skillExpertise: emptySkillExpertise() },
    { name: '“The Major”', archetype: 'Prison guard', issues: ['Over–confident', 'fearless', 'Secretly wants underlings to control and seeks revenge'], inventory: ['Two guns with silencers', 'body armor', 'jeep', 'a hide-out', 'binoculars', '10 rations'], skillExpertise: parseSkills(["Manipulation", "Ranged Combat"], ["Scout", "Survival", "Close Combat"]) },
    { name: 'Adam Stark', archetype: 'Butcher', issues: ['Too kind for his own good'], inventory: ['Butcher’s cleaver', 'butcher’s knife', 'revolver', '6 rations', 'tent', 'horse'], skillExpertise: parseSkills(["Close Combat"], []) },
    { name: 'Dax Heinz', archetype: 'Car salesman', issues: ['Taking care of his mortally wounded brother'], inventory: ['Survival gear', '6 rations', '3 Molotov cocktails', 'axe'], skillExpertise: parseSkills([], ["Manipulation", "Stealth"]) }
];

// Premade Animals from TWD RPG Official Animal Table
export const PREMADE_ANIMALS: Omit<NPC, 'id' | 'health' | 'maxHealth'>[] = [
    { name: 'Alligator', archetype: 'Alligator (Animal)', issues: ['Powerful predator', 'Territorial'], inventory: [], skillExpertise: emptySkillExpertise(), isAnimal: true, attackDice: 6, damage: '2' },
    { name: 'Bear', archetype: 'Bear (Animal)', issues: ['Massive strength', 'Protective of territory'], inventory: [], skillExpertise: emptySkillExpertise(), isAnimal: true, attackDice: 8, damage: '2' },
    { name: 'Dog', archetype: 'Dog (Animal)', issues: ['Loyal companion', 'Protective'], inventory: [], skillExpertise: emptySkillExpertise(), isAnimal: true, attackDice: 4, damage: '1' },
    { name: 'Eagle', archetype: 'Eagle (Animal)', issues: ['Sharp eyes', 'Aerial hunter'], inventory: [], skillExpertise: emptySkillExpertise(), isAnimal: true, attackDice: 4, damage: '1' },
    { name: 'Elk', archetype: 'Elk (Animal)', issues: ['Large herbivore', 'Powerful charge'], inventory: [], skillExpertise: emptySkillExpertise(), isAnimal: true, attackDice: 5, damage: '1' },
    { name: 'Venomous snake', archetype: 'Venomous snake (Animal)', issues: ['Deadly venom', 'Stealthy strike'], inventory: [], skillExpertise: emptySkillExpertise(), isAnimal: true, attackDice: 5, damage: '1 (+poison)' },
    { name: 'Tiger', archetype: 'Tiger (Animal)', issues: ['Apex predator', 'Solitary hunter'], inventory: [], skillExpertise: emptySkillExpertise(), isAnimal: true, attackDice: 8, damage: '2' },
    { name: 'Trained watchdog', archetype: 'Trained watchdog (Animal)', issues: ['Well-trained', 'Alert guardian'], inventory: [], skillExpertise: emptySkillExpertise(), isAnimal: true, attackDice: 6, damage: '1' },
    { name: 'Wolf', archetype: 'Wolf (Animal)', issues: ['Pack hunter', 'Wild instincts'], inventory: [], skillExpertise: emptySkillExpertise(), isAnimal: true, attackDice: 6, damage: '1' },
    { name: 'Wolverine', archetype: 'Wolverine (Animal)', issues: ['Fierce fighter', 'Relentless'], inventory: [], skillExpertise: emptySkillExpertise(), isAnimal: true, attackDice: 5, damage: '1' }
];
