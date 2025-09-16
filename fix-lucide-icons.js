const fs = require('fs');
const path = require('path');

// Function to recursively find all .tsx files
function findTsxFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules') {
      findTsxFiles(fullPath, files);
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Function to fix title props on Lucide icons
function fixLucideIcons(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Pattern to match Lucide icon components with title props
  // This looks for components that end with "Icon" or common Lucide icon names
  const lucideIconPattern = /(<(?:[A-Z][a-zA-Z]*(?:Icon)?|Bold|Italic|Underline|Strikethrough|Code|Link|Unlink|List|ListOrdered|Quote|Heading[1-6]?|Eye|EyeOff|Mic|MicOff|Save|Download|Upload|Search|Settings|Plus|Minus|X|Check|ChevronUp|ChevronDown|ChevronLeft|ChevronRight|Home|User|Users|MapPin|Clock|Calendar|BarChart3|FileText|FolderOpen|BookOpen|Edit|Trash|Copy|Move|Maximize|Minimize|RefreshCw|AlertTriangle|Shield|Crown|Brain|Heart|Star|Moon|Sun|Zap|Target|Navigation|Compass|Globe|Mountain|Layers|Network|Radio|Wifi|Signal|Satellite|Rocket|Plane|Ship|Anchor|Timer|Stopwatch|Activity|Pulse|TrendingUp|Package|Image|Video|Music|Phone|Mail|MessageCircle|Send|Paperclip|Camera|Headphones|Speaker|Volume|VolumeX|Play|Pause|Stop|SkipForward|SkipBack|Repeat|Shuffle|Filter|SortAsc|SortDesc|Grid|List|Table|Columns|Rows|Archive|Bookmark|Tag|Flag|Bell|BellOff|Lock|Unlock|Key|Database|Server|Cloud|HardDrive|Cpu|Memory|Battery|Power|PowerOff|Wifi|WifiOff|Bluetooth|Usb|Monitor|Smartphone|Tablet|Laptop|Printer|Scanner|Keyboard|Mouse|Gamepad|Joystick|Headset|Webcam|Microphone|Speaker|Volume|VolumeX|Thermometer|Gauge|Speedometer|Ruler|Calculator|PieChart|LineChart|AreaChart|ScatterChart|Histogram|Funnel|TreePine|Flower|Leaf|Bug|Butterfly|Cat|Dog|Fish|Bird|Rabbit|Elephant|Lion|Tiger|Bear|Wolf|Fox|Deer|Horse|Cow|Pig|Sheep|Chicken|Duck|Penguin|Owl|Eagle|Hawk|Dove|Parrot|Flamingo|Peacock|Swan|Crane|Heron|Pelican|Albatross|Seagull|Puffin|Toucan|Woodpecker|Hummingbird|Robin|Sparrow|Finch|Canary|Cardinal|BlueBird|Blackbird|Crow|Raven|Magpie|Jay|Woodpecker|Kingfisher|Swallow|Swift|Wren|Thrush|Warbler|Flycatcher|Vireo|Tanager|Grosbeak|Bunting|Oriole|Redstart|Wheatear|Chat|Pipit|Wagtail|Lark|Martin|Swallow|Swift|Nightjar|Cuckoo|Hoopoe|Bee-eater|Roller|Hornbill|Barbet|Honeyguide|Jacamar|Puffbird|Trogon|Motmot|Kingfisher|Toddy|Broadbill|Pitta|Asity|Sapayoa|Manakin|Cotinga|Tityra|Becard|Flycatcher|Shrike|Vireo|Oriole|Drongo|Fantail|Monarch|Crow|Jay|Magpie|Treepie|Chough|Nutcracker|Raven|Jackdaw|Rook|Carrion|Hooded|Grey|Pied|Azure|Siberian|Pinyon|Clark|Mexican|Brown|White|Black|Red|Blue|Green|Yellow|Orange|Purple|Pink|Gray|Grey|Silver|Gold|Bronze|Copper|Platinum|Diamond|Ruby|Emerald|Sapphire|Topaz|Amethyst|Opal|Pearl|Coral|Turquoise|Jade|Onyx|Marble|Granite|Slate|Limestone|Sandstone|Shale|Basalt|Obsidian|Pumice|Lava|Magma|Ash|Dust|Sand|Clay|Mud|Dirt|Soil|Rock|Stone|Pebble|Boulder|Mountain|Hill|Valley|Canyon|Cliff|Cave|Tunnel|Bridge|Road|Path|Trail|Track|Lane|Street|Avenue|Boulevard|Highway|Freeway|Interstate|Route|Way|Drive|Court|Circle|Square|Plaza|Park|Garden|Forest|Woods|Jungle|Desert|Beach|Ocean|Sea|Lake|River|Stream|Creek|Pond|Pool|Waterfall|Spring|Well|Oasis|Island|Peninsula|Cape|Bay|Harbor|Port|Dock|Pier|Wharf|Marina|Lighthouse|Buoy|Anchor|Ship|Boat|Yacht|Sailboat|Speedboat|Motorboat|Canoe|Kayak|Raft|Ferry|Cruise|Submarine|Aircraft|Airplane|Jet|Helicopter|Drone|Balloon|Parachute|Glider|Rocket|Shuttle|Satellite|Station|Telescope|Observatory|Planetarium|Museum|Library|School|University|College|Hospital|Clinic|Pharmacy|Store|Shop|Market|Mall|Restaurant|Cafe|Bar|Hotel|Motel|Inn|Lodge|Resort|Spa|Gym|Stadium|Theater|Cinema|Concert|Opera|Ballet|Circus|Carnival|Fair|Festival|Parade|Party|Wedding|Birthday|Anniversary|Graduation|Retirement|Funeral|Memorial|Cemetery|Church|Temple|Mosque|Synagogue|Cathedral|Chapel|Monastery|Convent|Shrine|Altar|Cross|Star|Crescent|Wheel|Lotus|Om|Yin|Yang|Peace|Love|Hope|Faith|Joy|Happiness|Sadness|Anger|Fear|Surprise|Disgust|Contempt|Pride|Shame|Guilt|Envy|Jealousy|Greed|Lust|Gluttony|Sloth|Wrath|Vanity|Humility|Kindness|Patience|Charity|Temperance|Diligence|Chastity|Honesty|Integrity|Loyalty|Courage|Wisdom|Justice|Mercy|Forgiveness|Compassion|Empathy|Sympathy|Understanding|Tolerance|Acceptance|Respect|Trust|Friendship|Love|Romance|Passion|Desire|Attraction|Beauty|Grace|Elegance|Style|Fashion|Trend|Classic|Modern|Contemporary|Vintage|Retro|Antique|Ancient|Old|New|Fresh|Young|Mature|Adult|Child|Baby|Infant|Toddler|Kid|Teen|Teenager|Youth|Adolescent|Senior|Elder|Elderly|Aged|Wise|Smart|Intelligent|Clever|Brilliant|Genius|Talented|Gifted|Skilled|Expert|Professional|Amateur|Beginner|Novice|Student|Teacher|Professor|Doctor|Nurse|Engineer|Architect|Designer|Artist|Writer|Author|Poet|Musician|Singer|Dancer|Actor|Director|Producer|Editor|Photographer|Filmmaker|Journalist|Reporter|Anchor|Host|Presenter|Speaker|Lecturer|Instructor|Trainer|Coach|Mentor|Guide|Leader|Manager|Boss|CEO|President|King|Queen|Prince|Princess|Duke|Duchess|Earl|Count|Baron|Lord|Lady|Sir|Dame|Knight|Warrior|Soldier|General|Admiral|Captain|Lieutenant|Sergeant|Corporal|Private|Scout|Spy|Agent|Detective|Police|Sheriff|Judge|Lawyer|Attorney|Prosecutor|Defender|Witness|Jury|Court|Trial|Case|Evidence|Proof|Fact|Truth|Lie|Fiction|Story|Tale|Legend|Myth|Fable|Fairy|Fantasy|Dream|Nightmare|Vision|Hallucination|Illusion|Reality|Fact|Fiction|True|False|Right|Wrong|Good|Bad|Evil|Pure|Innocent|Guilty|Crime|Sin|Virtue|Vice|Moral|Immoral|Ethical|Unethical|Legal|Illegal|Lawful|Unlawful|Just|Unjust|Fair|Unfair|Equal|Unequal|Same|Different|Similar|Opposite|Contrast|Compare|Match|Fit|Suit|Appropriate|Suitable|Perfect|Ideal|Best|Worst|Better|Worse|Good|Bad|Great|Terrible|Excellent|Poor|Fine|Okay|Alright|Wrong|Correct|Accurate|Precise|Exact|Approximate|Close|Far|Near|Distant|Remote|Local|Global|Universal|Specific|General|Particular|Special|Unique|Common|Rare|Unusual|Normal|Abnormal|Regular|Irregular|Ordinary|Extraordinary|Amazing|Incredible|Fantastic|Wonderful|Marvelous|Magnificent|Spectacular|Stunning|Beautiful|Gorgeous|Pretty|Lovely|Cute|Adorable|Charming|Attractive|Handsome|Elegant|Graceful|Stylish|Fashionable|Trendy|Cool|Hot|Warm|Cold|Freezing|Boiling|Burning|Fire|Ice|Snow|Rain|Storm|Thunder|Lightning|Wind|Breeze|Gale|Hurricane|Tornado|Cyclone|Typhoon|Monsoon|Drought|Flood|Tsunami|Earthquake|Volcano|Avalanche|Landslide|Mudslide|Rockslide|Erosion|Weathering|Climate|Weather|Season|Spring|Summer|Autumn|Fall|Winter|January|February|March|April|May|June|July|August|September|October|November|December|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Morning|Afternoon|Evening|Night|Dawn|Dusk|Sunrise|Sunset|Noon|Midnight|Hour|Minute|Second|Millisecond|Microsecond|Nanosecond|Time|Clock|Watch|Timer|Stopwatch|Alarm|Calendar|Date|Day|Week|Month|Year|Decade|Century|Millennium|Past|Present|Future|History|Prehistory|Ancient|Medieval|Renaissance|Modern|Contemporary|Future|Tomorrow|Yesterday|Today|Now|Then|When|Where|What|Who|Why|How|Which|Whose|Whom)\s+[^>]*?)title="([^"]*)"([^>]*>)/g;

  content = content.replace(lucideIconPattern, (match, beforeTitle, titleContent, afterTitle) => {
    modified = true;
    return `${beforeTitle}aria-label="${titleContent}"${afterTitle}`;
  });

  // Also fix cases where title is on the wrapper element but should be on the icon
  const wrapperWithTitlePattern = /(<(?:div|span|button)[^>]*?)title="([^"]*)"([^>]*>[\s\S]*?<[A-Z][a-zA-Z]*(?:Icon)?\s+[^>]*?\/?>)/g;
  
  content = content.replace(wrapperWithTitlePattern, (match, beforeTitle, titleContent, afterTitle) => {
    // Only apply if this looks like a Lucide icon wrapper
    if (afterTitle.includes('className="h-') || afterTitle.includes('size="')) {
      modified = true;
      return `${beforeTitle}aria-label="${titleContent}"${afterTitle}`;
    }
    return match;
  });

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed Lucide icon title props in: ${filePath}`);
  }
}

// Main execution
const clientSrcPath = path.join(__dirname, 'client', 'src');
if (fs.existsSync(clientSrcPath)) {
  const tsxFiles = findTsxFiles(clientSrcPath);
  console.log(`Found ${tsxFiles.length} TypeScript files to check...`);
  
  let fixedFiles = 0;
  tsxFiles.forEach(file => {
    const originalContent = fs.readFileSync(file, 'utf8');
    fixLucideIcons(file);
    const newContent = fs.readFileSync(file, 'utf8');
    if (originalContent !== newContent) {
      fixedFiles++;
    }
  });
  
  console.log(`Fixed Lucide icon title props in ${fixedFiles} files.`);
} else {
  console.log('Client src directory not found.');
}

