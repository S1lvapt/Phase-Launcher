type Season = `${string}`;

const seasonDescriptions: Record<Season, string> = {
  "1": "Battle Royale mode launched with a simple island map and basic weapons. Players explored a vibrant world with iconic locations like Pleasant Park and Retail Row. Building mechanics became a core feature, setting the stage for Fortnite’s rise.",
  "2": "Medieval themes introduced knights, castles, and the first Battle Pass. New locations like Tilted Towers added variety. Daily challenges and skins like Black Knight became fan favorites.",
  "4": "Superheroes and villains clashed with comic book-inspired skins and a massive meteor event. Risky Reels and other new POIs appeared. The blockbuster narrative included a rocket launch that shaped future seasons.",
  "5": "Worlds collided, blending desert biomes, rifts, and historical elements across the map. New locations like Paradise Palms and Lazy Links emerged. The All-Terrain Kart and rifts added fresh mobility options.",
  "6": "Darkness and corruption took over with haunted areas, ghost skins, and a spooky Cube event. Fortnitemares introduced Cube Monsters and eerie map changes. Kevin the Cube’s journey across the island captivated players.",
  "7": "Winter blanketed the map with snow, introducing Polar Peak and Frosty Flights. Planes like the X-4 Stormwing added aerial combat. Ice storms and festive skins brought holiday cheer to the island.",
  "8": "Pirates and volcanoes reshaped the map with Lazy Lagoon and Sunny Steps. A volcanic eruption altered the landscape dramatically. Treasure maps and pirate cannons added swashbuckling flair.",
  "9": "Relive Chapter 1 Season 9 with Project Diamond",
  "10": "Time travel warped the map with Rift Zones, reviving old locations like Moisty Mire with new twists. The B.R.U.T.E. mech sparked intense gameplay debates. A black hole event closed the chapter, shocking the community.",
  "11": "A new island debuted with simpler mechanics, focusing on exploration, swimming, and fishing. Locations like Sweaty Sands and Misty Meadows offered fresh vibes. Boats and a slower pace marked the Chapter 2 reset.",
  "12": "Espionage themes introduced secret agents, henchmen, and phone booth disguises. Shadow and Ghost factions let players choose sides. New POIs like The Agency and spy tech gadgets shook up strategies.",
  "13": "Flooded maps brought water-based gameplay with whirlpools and Marauders. Aquaman and coral-themed skins tied into the aquatic vibe. Cars finally arrived, adding new ways to traverse the island.",
  "14": "Marvel heroes like Iron Man and Thor dominated with mythic abilities. Stark Industries and other superhero POIs reshaped the map. The Nexus War storyline culminated in a Galactus showdown.",
  "15": "The Zero Point exposed a desert-like map core, with hunters like The Mandalorian joining the fray. Exotic weapons and new NPCs offered quests and bounties. Crystal-powered mechanics added a mystical twist.",
  "16": "Primal themes introduced crafting, wildlife, and primitive weapons like bows. Dinosaurs and Spire Guardians roamed new POIs like Boney Burbs. The Zero Point’s instability drove a wild, untamed narrative.",
  "17": "Aliens invaded with UFOs, abductions, and cosmic weapons. IO bases and high-tech gadgets like Rail Guns defined combat. Mothership encounters and a vibrant alien aesthetic shook up the island.",
  "18": "Cubes powered a dark, corrupted map with Sideways anomalies and monstrous foes. Fortnitemares returned with horror skins and cube-driven chaos. The Cube Queen’s rise hinted at looming threats.",
  "19": "The Loop is broken and a new island rises from the wreckage. Explore snowy peaks, rolling fields and the return of Tilted Towers. Swing across the map with Spider-Man's Web-Shooters and forge your legend on Chapter 3's first battlefield.",
  "20": "The Resistance fights back against the Imagined Order's occupation. Storm the IO Blimps, command Armored Battle Buses and Titan Tanks, and rally alongside iconic fighters. The season ends with The Collision — a massive live event that decides the island's fate.",
  "21": "A party vibe introduced Reality Trees and new mobility like sprinting and mantling. Tilted Towers returned alongside new spots like Sanctuary. Rideable wildlife and a colorful aesthetic defined the season’s energy.",
  "22": "Chrome spread across the map, transforming POIs and enabling phasing mechanics. Evolving weapons like the EvoChrome Shotgun added strategic depth. The Herald’s arrival set the stage for a chaotic finale.",
  "23": "A new beginning brought fractured landscapes with Oathbound quests and medieval-inspired POIs like The Citadel. Dirt bikes and Reality Augments enhanced mobility. The Ageless Champion’s story tied into the multiverse.",
  "24": "Neo-Tokyo aesthetics introduced Mega City with grind rails and katanas. Heist elements and futuristic weapons like the Kinetic Blade defined gameplay. The Syndicate storyline added intrigue to the neon-lit map.",
  "25": "Jungles overtook the map with Rumble Ruins and new wildlife like raptors. Transformable weapons and mud-based stealth added tactical options. The Wilds storyline explored ancient ruins and mysteries.",
  "26": "Heist themes dominated with vampire Kado Thorne and luxurious estates. New items like Rocket Ram and business turrets enhanced infiltration. Eclipse effects and a team of thieves focused on stealing treasures from guarded POIs.",
  "27": "OG vibes revived Chapter 1 with the original island and classic loot. Iconic POIs like Tilted Towers and Pleasant Park returned. Unvaulted weapons and vehicles brought back nostalgic gameplay for a limited time.",
  "28": "Underground resistance fought against The Society with trains and weapon mods. New POIs like Grand Glacier and Lavish Lair added criminal flair. Medallions and moving while healing revolutionized combat strategies.",
  "29": "Greek mythology erupted from Pandora's Box with Olympus and Underworld POIs. Gods like Zeus offered mythic powers like lightning bolts. Cerberus and other mythical creatures deepened the epic narrative.",
  "30": "Post-apocalyptic wasteland brought nitro-fueled vehicles and custom mods. Wastelander challenges and bosses like Megalo Don sowed chaos. A sandstorm transformed the map, with collaborations like Pirates of the Caribbean adding mid-season adventures.",
};

const seasonImages: Record<Season, string> = {
  "1": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRPfSAKrQkN0PNgBxsLdsioSUHQ4N6S9bW93Tf0G9NeQtNqijk3xBdyzh3lkb2xYwJOkPI&usqp=CAU",
  "2": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRqgfvESPyFP65d6pG1BHm5OVvihemeMW4GWQ&sg",
  "4": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT9jbBS1uCTH9JqB_t6ZgouwDv_xJoABV2A7A&s",
  "5": "https://blogs-images.forbes.com/erikkain/files/2018/09/week-9-loading-screen.png",
  "6": "https://cdn2.unrealengine.com/Fortnite%2Fpatch-notes%2Fv6-00%2Fbr-header-v6-00%2FBR06_News_Featured_16_9_ReleaseNotes-1920x1080-9a66a68e6061577160f354858e3e13d80eda6886.jpg",
  "7": "https://i.redd.it/2495nyuc1t381.png",
  "8": "https://i.insider.com/5c7837c3bde70f61536b8f21?width=800&format=jpeg&auto=webp",
  "9": "https://imgs.search.brave.com/63iPHpmwpQrdNL0DGGCT6nblUZwdYoudriAX4X_b_oQ/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93YWxs/cGFwZXJjYXZlLmNv/bS93cC93cDQzMjU3/NDkuanBn",
  "10": "https://w0.peakpx.com/wallpaper/141/86/HD-wallpaper-fortnite-chapter-2-fortnite-chapter-2-fortnite-games-2019-games.jpg",
  "11": "https://w0.peakpx.com/wallpaper/391/1010/HD-wallpaper-fortnite-chapter-2-game.jpg",
  "12": "https://assets1.ignimgs.com/thumbs/userUploaded/2020/2/20/fortnite-battlepass-chapter-2-season-2-blog-thumb-1582190454248.jpg",
  "13": "https://w0.peakpx.com/wallpaper/690/54/HD-wallpaper-fortnite-chapter-2-season-3-fortnite-chapter-2-fortnite-games-2020-games.jpg",
  "14": "https://www.nme.com/wp-content/uploads/2020/08/082720-Fortnite-Season-4-Nexus-War-YouTube.jpg",
  "15": "https://gamerjournalist.com/wp-content/uploads/2020/12/Fortnite-Chapter-2-Season-5-Milestones.jpg",
  "16": "https://w0.peakpx.com/wallpaper/121/696/HD-wallpaper-fortnite-chapter-2-season-6.jpg",
  "17": "https://images.immediate.co.uk/production/volatile/sites/3/2021/06/Screenshot-2021-06-08-at-10.33.35-6778e88.png?quality=90&resize=980,654",
  "18": "https://assets.nintendo.com/image/upload/q_auto/f_auto/c_fill,w_1200/ncom/en_US/articles/2021/Cross%20into%20the%20Sideways%20in%20Fortnite%20Chapter%202%20Season%208%20Cubed/18BR_S18_KeyArt_NintendoUpdate_Landscape_1200x675",
  "19": "https://w0.peakpx.com/wallpaper/986/433/HD-wallpaper-fortnite-chapter-3-gaming-cool.jpg",
  "20": "https://www.pcgamesn.com/wp-content/sites/pcgamesn/2022/03/fortnite-chapter-3-season-2-battle-pass.jpg",
  "21": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRcMPC6yWx3vZ5DfLfsVtTa5drLQZ056fYQ1lDPYALesM-0o2fym4jpjblZ2Ifs1yjaoSg&usqp=CAU",
  "22": "https://www.pcgamesn.com/wp-content/sites/pcgamesn/2022/11/fortnite-chapter-4-season-1-release-date.jpg",
  "23": "https://thegamehaus.com/wp-content/uploads/2023/03/fortnite-chapter-4-season-1-end-date_feature.jpg.webp",
  "24": "https://cdn.cgmagonline.com/wp-content/uploads/2023/03/fortnite-chapter-4-season-2-mega-features-huge-cyberpunk-aesthetic-23031003-1-1200x675.jpg",
  "25": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTvTQGvGSQC8BoE1Hw4YXLK1We8gZxlRELQPA&s",
  "26": "https://static.wikia.nocookie.net/fortnite/images/2/2c/Chapter_4_Season_4_-_Keyart_-_Fortnite.jpg/revision/latest/scale-to-width-down/1200?cb=20230825072336",
  "27": "https://static.wikia.nocookie.net/fortnite/images/3/3f/The_Return_%28Full%29_-_Loading_Screen_-_Fortnite.png/revision/latest/scale-to-width-down/1000?cb=20211013154842",
  "28": "https://cdn2.unrealengine.com/fortnite-competitive-chapter-5-season-1-1920x1080-36ba08147fff.jpg",
  "29": "https://images.immediate.co.uk/production/volatile/sites/3/2024/03/fortnite-chapter-5-2-0f18cc3.jpg?resize=900%2C471",
  "30": "https://i.ytimg.com/vi/hF_y018XCA8/maxresdefault.jpg",
};

function translateSeason(season: number) {
  if (season >= 1 && season <= 10) return `Chapter 1, Season ${season}`;
  if (season >= 11 && season <= 18) return `Chapter 2, Season ${season - 10}`;
  if (season >= 19 && season <= 22) return `Chapter 3, Season ${season - 18}`;
  if (season >= 23 && season <= 26) return `Chapter 4, Season ${season - 22}`;
  if (season === 27) return `Chapter OG, Season OG`;
  if (season >= 28 && season <= 30) return `Chapter 5, Season ${season - 27}`;
  return `Season ${season}`;
}

function getSeasonDescription(season: Season): string {
  return (
    seasonDescriptions[season] || "Description not available for this season."
  );
}

function getSeasonImage(season: Season): string {
  return seasonImages[season] || "";
}

export function SeasonInfo(season: Season) {
  const num = Number(season);
  return {
    readableSeason: translateSeason(num),
    description: getSeasonDescription(season),
    image: getSeasonImage(season),
  };
}
