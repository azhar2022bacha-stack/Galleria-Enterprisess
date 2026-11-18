// Auto-generated 5,000 country shoppers imported from 5000_English_Names_5_Countries.csv
// Pakistan (1,000), India (1,000), USA (1,000), Canada (1,000), UK (1,000)
import countryShoppersJson from './countryShoppers.json';

export type ShopperCountry = 'Pakistan' | 'India' | 'USA' | 'Canada' | 'UK';

export interface CountryShopper {
  id: string;
  country: ShopperCountry;
  number: number;
  name: string;
  gender: 'Male' | 'Female';
  email: string;
}

export const COUNTRY_TABS: { key: ShopperCountry; label: string; count: number; flag: string }[] = [
  { key: 'Pakistan', label: 'Pakistan', count: 1000, flag: '🇵🇰' },
  { key: 'India', label: 'India', count: 1000, flag: '🇮🇳' },
  { key: 'USA', label: 'USA', count: 1000, flag: '🇺🇸' },
  { key: 'Canada', label: 'Canada', count: 1000, flag: '🇨🇦' },
  { key: 'UK', label: 'UK', count: 1000, flag: '🇬🇧' },
];

export const COUNTRY_SHOPPERS: Record<ShopperCountry, CountryShopper[]> = countryShoppersJson as Record<ShopperCountry, CountryShopper[]>;

export const ALL_COUNTRY_SHOPPERS: CountryShopper[] = [
  ...COUNTRY_SHOPPERS.Pakistan,
  ...COUNTRY_SHOPPERS.India,
  ...COUNTRY_SHOPPERS.USA,
  ...COUNTRY_SHOPPERS.Canada,
  ...COUNTRY_SHOPPERS.UK,
];

export const TOTAL_SHOPPERS_COUNT = ALL_COUNTRY_SHOPPERS.length; // 5,000

export interface ShopperShippingAddress {
  recipient: string;
  phone: string;
  email: string;
  street: string;
  apt: string;
  city: string;
  state: string;
  postalCode: string;
  countryCode: string;
}

export function generateShopperShipping(shopper: CountryShopper): ShopperShippingAddress {
  const num = shopper.number || 1;
  const country = shopper.country || 'Pakistan';

  if (country === 'Pakistan') {
    const pkLocations = [
      {
        city: 'Islamabad',
        state: 'Islamabad Capital Territory',
        zip: '44000',
        streets: [
          `House No. ${10 + (num % 90)}-B, Street 14-A, Sector F-${6 + (num % 5)}/${1 + (num % 4)}, Near Jinnah Super Market & Blue Area Commercial Center`,
          `Flat No. ${100 + (num % 700)}, Executive Heights, Block 8, Sector E-11/3, Main Double Road, Near Golra Mor Interchange`,
          `Villa No. ${12 + (num % 50)}, Street 7, Sector G-13/4, Opposite G-13 Markaz Shopping Plaza, Near Kashmir Highway Link`,
          `House No. ${120 + (num % 80)}, Margalla Road, Sector F-6/3, Near Super Market & Shalimar Cricket Stadium`,
          `Plot No. ${40 + (num % 70)}, Street 19, Sector I-8/4, Near Tipu Sultan Road, Behind I-8 Markaz Business Hub`,
          `Apartment No. ${200 + (num % 600)}, Royal Residency, Multi Gardens, Sector B-17, Main GT Road Commercial Zone`,
        ],
        apt: `Apt ${1 + (num % 25)}`,
      },
      {
        city: 'Karachi',
        state: 'Sindh',
        zip: '74200',
        streets: [
          `Bungalow No. C-${20 + (num % 80)}, 12th Commercial Street, Phase 2 Extension, DHA, Near Sunset Boulevard & Gold Mark Plaza`,
          `Flat No. ${401 + (num % 600)}, 4th Floor, Ocean View Luxury Heights, Block 4, Clifton, Near Bilawal Chowrangi & Boat Basin`,
          `House No. ${14 + (num % 70)}-B, KDA Scheme No. 1, Main Miran Mohammad Shah Road, Near Karsaz Naval Flyover`,
          `Plot No. ${35 + (num % 90)}-C, Badar Commercial Area, Street 5, DHA Phase 5, Near Saba Avenue & 26th Street`,
          `Apartment No. ${202 + (num % 500)}, Al-Rauf Classic Heights, Block 13-D, Gulshan-e-Iqbal, Near Sir Syed University of Engineering`,
          `House No. ${80 + (num % 90)}, Sector 11-B, North Karachi Township, Near Nagan Chowrangi & Power House Roundabout`,
          `Plot No. ${110 + (num % 70)}, Block A, North Nazimabad, Near Five Star Chowrangi & Hydri Super Market Complex`,
        ],
        apt: `Flat ${100 + (num % 800)}`,
      },
      {
        city: 'Lahore',
        state: 'Punjab',
        zip: '54000',
        streets: [
          `House No. ${150 + (num % 800)}, Block G-3, Phase 5, Defence Housing Authority (DHA), Near Ring Road Interchange & Jalal Sons`,
          `Flat No. ${301 + (num % 500)}, Pace Towers, Block H, Gulberg 2, Main Boulevard, Near Siddique Trade Center & Liberty Market`,
          `House No. ${45 + (num % 150)}, Central Commercial Area, Street 9, Sector C, Bahria Town, Near Grand Jamia Mosque`,
          `House No. ${18 + (num % 80)}-A, Street 4, Model Town Society, Circular Road, Near Model Town Central Park Gate No. 2`,
          `Plot No. ${50 + (num % 80)}-B, Sector Y, Commercial Zone, Phase 3, DHA, Near Y-Block Market & Al-Fatah Mall`,
          `House No. ${65 + (num % 90)}, Block C, Johar Town, Near Doctors Hospital & Emporium Mall Canal Road`,
          `House No. ${28 + (num % 70)}, Street 11, Cavalry Ground Extension Cantt, Near Shami Road Junction & Cantt Station`,
        ],
        apt: `Suite ${10 + (num % 40)}`,
      },
      {
        city: 'Rawalpindi',
        state: 'Punjab',
        zip: '46000',
        streets: [
          `House No. ${180 + (num % 600)}, Street 16, Sector 4, Gulraiz Housing Scheme, Near High Court Road & Bahria Town Phase 7`,
          `Bungalow No. ${45 + (num % 80)}-A, Circular Peshawar Road, Westridge 1, Near Railway Officers Colony & Cantt Post Office`,
          `House No. ${14 + (num % 80)}, Street 5, Safari Villas 2, Phase 7, Bahria Town, Near Clock Tower Chowk & Grand Mall`,
          `Flat No. ${205 + (num % 400)}, Civic Center Heights, Phase 4, Bahria Town, Near River View Commercial Area`,
        ],
        apt: `Floor ${1 + (num % 4)}`,
      },
      {
        city: 'Peshawar',
        state: 'Khyber Pakhtunkhwa',
        zip: '25000',
        streets: [
          `House No. ${80 + (num % 150)}, Street 8, Sector F-3, Phase 6, Hayatabad, Near Tatara Park & Ring Road Junction`,
          `Bungalow No. ${22 + (num % 70)}-B, Circular Road, University Town, Near Khyber Medical College & Khyber Teaching Hospital`,
          `Plot No. ${55 + (num % 80)}, Sector D-2, Phase 1, Hayatabad, Near Jamrud Road Interchange & Deans Complex`,
        ],
        apt: `Unit ${1 + (num % 20)}`,
      },
      {
        city: 'Faisalabad',
        state: 'Punjab',
        zip: '38000',
        streets: [
          `House No. ${30 + (num % 80)}, Street 5, Civil Lines Residential Area, Near Chenab Club & Commissioner House, Mall Road`,
          `Bungalow No. ${15 + (num % 70)}-B, Canal View Housing Scheme, East Canal Road, Near Abdullahpur Flyover Junction`,
          `Plot No. ${75 + (num % 90)}, Peoples Colony No. 1, D-Ground Commercial Market, Near ChenOne Center & Stadium`,
        ],
        apt: `Apt ${1 + (num % 15)}`,
      },
      {
        city: 'Multan',
        state: 'Punjab',
        zip: '60000',
        streets: [
          `House No. ${60 + (num % 140)}, Block A, Phase 1, DHA Multan, Main Bosan Road, Near Bahauddin Zakariya University Campus`,
          `Bungalow No. ${25 + (num % 60)}, Officers Colony, Near Chungi No. 9, Khanewal Road, Multan Cantt Commercial Hub`,
        ],
        apt: `Unit ${1 + (num % 10)}`,
      },
      {
        city: 'Sialkot',
        state: 'Punjab',
        zip: '51310',
        streets: [
          `House No. ${35 + (num % 80)}, Street 3, Paris Road Commercial Zone, Near Chamber of Commerce & Sialkot Cantt Gate`,
          `Bungalow No. ${18 + (num % 60)}, Model Town Society, Daska Road, Near Sialkot International Airport Link Road`,
        ],
        apt: `Apt ${1 + (num % 12)}`,
      },
    ];

    const loc = pkLocations[num % pkLocations.length];
    const street = loc.streets[num % loc.streets.length];
    const phonePrefixes = ['300', '301', '321', '333', '345', '312'];
    const pfx = phonePrefixes[num % phonePrefixes.length];
    const pTail = String(1000000 + ((num * 7393) % 9000000));

    return {
      recipient: shopper.name,
      phone: `+92 ${pfx} ${pTail.substring(0, 3)} ${pTail.substring(3)}`,
      email: shopper.email,
      street,
      apt: loc.apt,
      city: loc.city,
      state: loc.state,
      postalCode: loc.zip,
      countryCode: 'PK',
    };
  }

  if (country === 'India') {
    const inLocations = [
      {
        city: 'Mumbai',
        state: 'Maharashtra',
        zip: '400050',
        streets: [
          `Flat No. ${701 + (num % 600)}, 7th Floor, Sea Face Heritage Towers, Linking Road, Bandra West, Near Carter Road Promenade`,
          `Apartment No. ${1102 + (num % 800)}, Lodha Bellissimo, Wing B, N.M. Joshi Marg, Lower Parel, Near Phoenix Palladium Mall`,
          `Flat No. ${402 + (num % 500)}, Runwal Greens, Rannapratap Road, Mulund West, Near Eastern Express Highway Flyover`,
          `B-${301 + (num % 400)}, Palm Springs Residency, New Link Road, Oshiwara, Andheri West, Near Mega Mall & Metro Station`,
          `Flat No. ${1204 + (num % 600)}, Hiranandani Gardens, Powai Lake Boulevard, Powai, Near Galleria Shopping Complex`,
          `Plot No. ${42 + (num % 80)}, 14th Road, TPS III, Khar West, Near Khar Gymkhana & Swami Vivekananda Road Junction`,
        ],
        apt: `Flat ${100 + (num % 900)}`,
      },
      {
        city: 'New Delhi',
        state: 'Delhi',
        zip: '110001',
        streets: [
          `House No. C-${40 + (num % 70)}, Third Floor, Greater Kailash Part 1 (GK-1), Near M-Block Market & Archana Shopping Arcade`,
          `Flat No. ${502 + (num % 500)}, Tower 4, DLF Capital Greens, Shivaji Marg, Moti Nagar, Near Shadipur Metro Station`,
          `House No. B-${15 + (num % 60)}, Vasant Vihar, Poorvi Marg, Near Basant Lok Community Centre & Priya Cinema Complex`,
          `Plot No. ${82 + (num % 90)}, Pocket 2, Sector 19, Dwarka, Near Sector 19 Metro Station & Vardhman City Mall`,
          `House No. ${135 + (num % 80)}, Block C, Defence Colony, Near Flyover Market & Lajpat Nagar Ring Road Junction`,
          `Flat No. ${304 + (num % 400)}, Tower B, Godrej South Estate, Pocket B, Okhla Industrial Area Phase 1, Near Crowne Plaza`,
        ],
        apt: `Floor ${1 + (num % 4)}`,
      },
      {
        city: 'Bengaluru',
        state: 'Karnataka',
        zip: '560038',
        streets: [
          `Flat No. ${402 + (num % 500)}, Prestige Shantiniketan, Tower 12, ITPL Main Road, Whitefield, Near Big Bazaar & Tech Park`,
          `Villa No. ${25 + (num % 40)}, Palm Meadows Phase 2, Airport Varthur Road, Ramagondanahalli, Whitefield Cyber Corridor`,
          `Apartment No. B-${501 + (num % 400)}, Sobha Malabar, 100 Feet Road, Indiranagar, Near BDA Complex & Metro Pillar No. 92`,
          `Plot No. ${140 + (num % 90)}, 5th Main, 7th Sector, HSR Layout, Near Silk Board Flyover & BDA Civic Park`,
          `Flat No. ${304 + (num % 600)}, Brigade Gateway, Dr. Rajkumar Road, Malleshwaram West, Near World Trade Centre & Orion Mall`,
          `House No. ${85 + (num % 80)}, 4th Cross Road, 3rd Block, Koramangala, Near Sony World Junction & Wipro Corporate Park`,
        ],
        apt: `Suite ${100 + (num % 500)}`,
      },
      {
        city: 'Hyderabad',
        state: 'Telangana',
        zip: '500033',
        streets: [
          `Flat No. ${601 + (num % 600)}, My Home Bhooja, Block A, Knowledge City, Hitec City, Near Cyber Towers & Mindspace IT Park`,
          `Villa No. ${18 + (num % 40)}, Aparna Cyber County, Gopanpally, Financial District, Gachibowli, Near Wipro Circle`,
          `House No. 8-2-${200 + (num % 500)}/82, Road No. 36, Jubilee Hills, Near Peddamma Temple & Jubilee Hills Metro Station`,
          `Flat No. ${405 + (num % 400)}, Rainbow Vistas Rock Garden, IDL Road, Moosapet, Near Kukatpally Y-Junction`,
        ],
        apt: `Tower ${['A', 'B', 'C'][num % 3]}-${1 + (num % 18)}`,
      },
      {
        city: 'Pune',
        state: 'Maharashtra',
        zip: '411001',
        streets: [
          `Flat No. ${802 + (num % 500)}, Tower 5, Amanora Park Town, Hadapsar-Kharadi Bypass Road, Hadapsar, Near Amanora Mall`,
          `Apartment No. ${405 + (num % 300)}, Marvel Basilo, Lane 5, Koregaon Park, Near South Main Road & German Bakery`,
          `B-${401 + (num % 300)}, Rohan Mithila, New Airport Road, Viman Nagar, Near Symbiosis International School Campus`,
          `Flat No. ${202 + (num % 400)}, Blue Ridge Township, Tower 16, Hinjawadi Phase 1, Near Cognizant Tech Campus`,
        ],
        apt: `Flat ${10 + (num % 80)}`,
      },
      {
        city: 'Chennai',
        state: 'Tamil Nadu',
        zip: '600028',
        streets: [
          `Flat No. ${402 + (num % 500)}, Ceebros Boulevard, Rajiv Gandhi IT Expressway, Thoraipakkam, OMR, Near Cognizant Tech Park`,
          `House No. ${32 + (num % 60)}, 4th Main Road, Besant Nagar, Near Elliot's Beach Promenade & Velankanni Church`,
          `Apartment No. ${3 + (num % 12)}B, Olympia Opaline, Navalur, Old Mahabalipuram Road (OMR), Near Vivira Shopping Mall`,
        ],
        apt: `Block ${['1', '2', '3'][num % 3]}`,
      },
      {
        city: 'Ahmedabad',
        state: 'Gujarat',
        zip: '380015',
        streets: [
          `Flat No. ${602 + (num % 500)}, Gala Haven, Near Vaishno Devi Circle, SG Highway, Chandkheda, Near Nirma University`,
          `House No. ${22 + (num % 70)}, Goyal Intercity, Drive In Road, Memnagar, Near Himalaya Mall & Doordarshan Kendra`,
        ],
        apt: `Tower ${['G', 'H', 'J'][num % 3]}`,
      },
      {
        city: 'Jaipur',
        state: 'Rajasthan',
        zip: '302001',
        streets: [
          `Plot No. ${130 + (num % 80)}, Block B, Vaishali Nagar, Near Amrapali Circle & National Handloom Commercial Emporium`,
          `Bungalow No. ${52 + (num % 60)}, Malviya Nagar, Sector 4, Calgiri Marg, Near World Trade Park (WTP) Commercial Hub`,
        ],
        apt: `Villa ${1 + (num % 30)}`,
      },
    ];

    const loc = inLocations[num % inLocations.length];
    const street = loc.streets[num % loc.streets.length];
    const phonePrefixes = ['98200', '98101', '98450', '98490', '98900', '98711'];
    const pfx = phonePrefixes[num % phonePrefixes.length];
    const pTail = String(10000 + ((num * 4721) % 90000));

    return {
      recipient: shopper.name,
      phone: `+91 ${pfx} ${pTail}`,
      email: shopper.email,
      street,
      apt: loc.apt,
      city: loc.city,
      state: loc.state,
      postalCode: loc.zip,
      countryCode: 'IN',
    };
  }

  if (country === 'USA') {
    const usLocations = [
      {
        city: 'San Francisco',
        state: 'CA',
        zip: '94107',
        streets: [
          `1244 Market Street, Suite ${300 + (num % 600)}, Mid-Market Tech Corridor, Near Civic Center Plaza & UN Plaza`,
          `555 Mission Street, Floor ${12 + (num % 25)}, Financial District, Near Transbay Transit Center & Salesforce Tower`,
          `742 Evergreen Terrace, Outer Sunset District, Near Golden Gate Park Meadow & Ocean Beach Promenade`,
          `350 Sutter Street, 4th Floor, Union Square Historic Shopping District, Near Powell Street Cable Car Turnaround`,
          `2100 Chestnut Street, Marina District, Near Palace of Fine Arts & Marina Green Waterfront`,
          `1450 4th Street, Unit ${200 + (num % 500)}, Mission Bay Innovation Quarter, Near UCSF Medical Center Complex`,
        ],
        apt: `Apt ${1 + (num % 50)}`,
      },
      {
        city: 'New York',
        state: 'NY',
        zip: '10001',
        streets: [
          `350 5th Avenue, Suite ${5000 + (num % 4000)}, Empire State Building Complex, Midtown Manhattan, Near Herald Square`,
          `150 West 85th Street, Apartment ${2 + (num % 14)}B, Upper West Side Historic District, Near Central Park West`,
          `484 Broome Street, 3rd Floor Loft, SoHo Cast Iron Historic District, Near Broadway & West Broadway`,
          `200 Park Avenue, Floor ${18 + (num % 30)}, MetLife Building, Midtown East, Directly Above Grand Central Terminal`,
          `111 8th Avenue, 8th Floor, Chelsea Tech Hub, Near High Line Elevated Park & Chelsea Market Concourse`,
          `400 East 54th Street, Apartment ${8 + (num % 18)}E, Sutton Place Neighborhood, Near East River Esplanade`,
        ],
        apt: `Suite ${100 + (num % 800)}`,
      },
      {
        city: 'Los Angeles',
        state: 'CA',
        zip: '90024',
        streets: [
          `10880 Wilshire Boulevard, Suite ${1100 + (num % 800)}, Westwood Financial Center, Near UCLA Campus & Westwood Village`,
          `90210 Wilshire Boulevard, 3rd Floor, Beverly Hills Historic District, Near Rodeo Drive Luxury Shopping Quarter`,
          `1600 Vine Street, Apartment ${500 + (num % 400)}, Hollywood & Vine District, Near Pantages Theatre & Walk of Fame`,
          `1200 South Grand Avenue, Penthouse ${1 + (num % 8)}, South Park District, Downtown Los Angeles, Near Crypto.com Arena`,
          `1300 Ocean Avenue, Suite ${200 + (num % 300)}, Santa Monica Beachfront Promenade, Near Santa Monica Pier Pavilion`,
        ],
        apt: `Unit ${1 + (num % 30)}`,
      },
      {
        city: 'Chicago',
        state: 'IL',
        zip: '60611',
        streets: [
          `875 North Michigan Avenue, Suite ${2800 + (num % 2000)}, John Hancock Center, Magnificent Mile District, Near Water Tower Place`,
          `233 South Wacker Drive, Floor ${35 + (num % 40)}, Willis Tower Complex, Loop Financial District, Near Chicago River Concourse`,
          `1600 North Wells Street, Unit ${400 + (num % 300)}, Old Town Historic Neighborhood, Near Lincoln Park Zoo Grounds`,
        ],
        apt: `Ste ${100 + (num % 400)}`,
      },
      {
        city: 'Austin',
        state: 'TX',
        zip: '78701',
        streets: [
          `301 Congress Avenue, Suite ${1500 + (num % 800)}, Downtown Business Corridor, Near Lady Bird Lake & Colorado River Trail`,
          `1100 South Congress Avenue, Suite ${100 + (num % 300)}, SoCo Commercial District, Near State Capitol Vista Point`,
          `11601 Domain Drive, Unit ${300 + (num % 400)}, The Domain Technology Park, Near IBM Innovation Campus & Rock Rose Ave`,
        ],
        apt: `Apt ${1 + (num % 40)}`,
      },
      {
        city: 'Seattle',
        state: 'WA',
        zip: '98101',
        streets: [
          `400 Pine Street, Suite ${400 + (num % 400)}, Downtown Retail Core, Near Westlake Center & Historic Pike Place Market`,
          `2111 7th Avenue, Floor ${12 + (num % 20)}, South Lake Union Tech Corridor, Near Amazon Doppler Tower & Urban Center`,
          `1900 1st Avenue, Suite ${600 + (num % 400)}, Belltown Waterfront District, Near Space Needle & Olympic Sculpture Park`,
        ],
        apt: `Unit ${1 + (num % 25)}`,
      },
      {
        city: 'Miami',
        state: 'FL',
        zip: '33101',
        streets: [
          `1450 Brickell Avenue, Suite ${1800 + (num % 1000)}, Brickell Financial District, Near Biscayne Bay Waterfront Promenade`,
          `1100 Ocean Drive, Suite ${200 + (num % 300)}, South Beach Art Deco Historic District, Near Lummus Park Beachfront`,
        ],
        apt: `Suite ${100 + (num % 300)}`,
      },
      {
        city: 'Boston',
        state: 'MA',
        zip: '02108',
        streets: [
          `200 Clarendon Street, Floor ${25 + (num % 30)}, Copley Square, Back Bay Historic District, Near Boston Public Library`,
          `500 Boylston Street, Suite ${800 + (num % 500)}, Back Bay Business Corridor, Near Newbury Street Fashion District`,
        ],
        apt: `Floor ${1 + (num % 5)}`,
      },
    ];

    const loc = usLocations[num % usLocations.length];
    const street = loc.streets[num % loc.streets.length];
    const phoneAreaCodes = ['212', '310', '415', '312', '512', '206', '305', '617'];
    const area = phoneAreaCodes[num % phoneAreaCodes.length];
    const pTail = String(1000 + ((num * 3829) % 9000));

    return {
      recipient: shopper.name,
      phone: `+1 ${area} 555 ${pTail}`,
      email: shopper.email,
      street,
      apt: loc.apt,
      city: loc.city,
      state: loc.state,
      postalCode: loc.zip,
      countryCode: 'US',
    };
  }

  if (country === 'Canada') {
    const caLocations = [
      {
        city: 'Toronto',
        state: 'ON',
        zip: 'M5H 1J8',
        streets: [
          `100 King Street West, Suite ${4800 + (num % 2000)}, First Canadian Place, Downtown Financial District, Near Union Station Hub`,
          `161 Bay Street, 27th Floor, Brookfield Place, Downtown Toronto Core, Near Hockey Hall of Fame Concourse`,
          `180 Bloor Street West, Suite ${600 + (num % 500)}, Yorkville Luxury Shopping Corridor, Near Royal Ontario Museum`,
          `250 Front Street West, Unit ${1100 + (num % 600)}, Entertainment District, Near Rogers Centre & CN Tower Plaza`,
          `50 Yonge Street, 12th Floor, Downtown Yonge Commercial Corridor, Near Toronto Eaton Centre Shopping Mall`,
        ],
        apt: `Suite ${100 + (num % 500)}`,
      },
      {
        city: 'Vancouver',
        state: 'BC',
        zip: 'V6Z 1X9',
        streets: [
          `1055 West Georgia Street, Suite ${1400 + (num % 600)}, Royal Centre, Downtown Financial District, Near Burrard SkyTrain Station`,
          `745 Thurlow Street, 22nd Floor, Downtown Core, Near Robson Street High-Street Shopping Promenade`,
          `1199 West Pender Street, Suite ${700 + (num % 400)}, Coal Harbour Waterfront District, Near Vancouver Convention Centre`,
          `1000 Beach Avenue, Penthouse ${1 + (num % 5)}, False Creek North Waterfront, Near Sunset Beach Coastal Park`,
        ],
        apt: `Apt ${200 + (num % 400)}`,
      },
      {
        city: 'Montreal',
        state: 'QC',
        zip: 'H3B 4W5',
        streets: [
          `1000 Rue de la Gauchetière Ouest, Bureau ${2100 + (num % 600)}, Centre-Ville de Montréal, Près de la Gare Centrale de Montréal`,
          `1 Place Ville Marie, Suite ${3200 + (num % 800)}, Quartier des Affaires, Centre-Ville, Près du Complexe Centre Eaton`,
          `400 Rue Saint-Jacques, Suite ${400 + (num % 300)}, Vieux-Montréal Historic Quarter, Près de la Basilique Notre-Dame`,
        ],
        apt: `Bureau ${100 + (num % 400)}`,
      },
      {
        city: 'Calgary',
        state: 'AB',
        zip: 'T2P 1G1',
        streets: [
          `525 8th Avenue SW, Suite ${2800 + (num % 1000)}, Eighth Avenue Place, Downtown Commercial Core, Near Stephen Avenue Walk`,
          `215 9th Avenue SW, Floor ${12 + (num % 15)}, Palliser Square Complex, Near Historic Calgary Tower & Glenbow Museum`,
        ],
        apt: `Suite ${200 + (num % 400)}`,
      },
      {
        city: 'Ottawa',
        state: 'ON',
        zip: 'K1P 1J1',
        streets: [
          `50 O'Connor Street, Suite ${900 + (num % 500)}, Financial Precinct, Downtown Ottawa, Near Parliament Hill Precinct`,
          `150 Elgin Street, Suite ${600 + (num % 400)}, Centre-Town Business Corridor, Near National Arts Centre & Rideau Canal`,
        ],
        apt: `Unit ${1 + (num % 30)}`,
      },
      {
        city: 'Edmonton',
        state: 'AB',
        zip: 'T5J 0N3',
        streets: [
          `10180 101 Street NW, Suite ${1500 + (num % 600)}, Manulife Place, Downtown Edmonton Core, Near Rogers Place & ICE District`,
        ],
        apt: `Suite ${100 + (num % 300)}`,
      },
    ];

    const loc = caLocations[num % caLocations.length];
    const street = loc.streets[num % loc.streets.length];
    const phoneAreaCodes = ['416', '604', '514', '403', '613', '780', '905'];
    const area = phoneAreaCodes[num % phoneAreaCodes.length];
    const pTail = String(1000 + ((num * 5179) % 9000));

    return {
      recipient: shopper.name,
      phone: `+1 ${area} 555 ${pTail}`,
      email: shopper.email,
      street,
      apt: loc.apt,
      city: loc.city,
      state: loc.state,
      postalCode: loc.zip,
      countryCode: 'CA',
    };
  }

  // UK
  const ukLocations = [
    {
      city: 'London',
      state: 'Greater London',
      zip: 'NW1 6XE',
      streets: [
        `221B Baker Street, Suite ${2 + (num % 8)}, Marylebone Historic Quarter, City of Westminster, Near Regent's Park Outer Circle`,
        `30 St Mary Axe, 24th Floor, The Gherkin, City of London Financial District, Near Liverpool Street Railway Station`,
        `100 Bishopsgate, 17th Floor, Broadgate Financial Corridor, City of London, Near Historic Spitalfields Market`,
        `125 Old Broad Street, Suite ${600 + (num % 400)}, Bank Financial District, Near Bank of England & Royal Exchange Buildings`,
        `45 Oxford Street, 3rd Floor, West End Retail District, City of Westminster, Near Tottenham Court Road Underground Station`,
        `10 Downing Street Approach, Whitehall Government Quarter, Westminster, Near St James's Park & Foreign Office`,
        `25 Canary Wharf, Level ${12 + (num % 20)}, One Canada Square Tower, Docklands Financial Centre, Near Jubilee Line Concourse`,
        `75 High Street Kensington, Apartment ${8 + (num % 20)}, Royal Borough of Kensington and Chelsea, Near Kensington Palace Gardens`,
      ],
      apt: `Flat ${1 + (num % 30)}`,
    },
    {
      city: 'Manchester',
      state: 'Greater Manchester',
      zip: 'M3 2BW',
      streets: [
        `100 Barbirolli Square, 5th Floor, City Centre Commercial Quarter, Near St Peter's Square & Bridgewater Hall Concourse`,
        `1 The Avenue, Suite ${200 + (num % 300)}, Spinningfields Financial & Professional District, Near Deansgate Corridor`,
        `40 Spring Gardens, 4th Floor, Central Business District, Near Market Street Retail Core & Piccadilly Gardens`,
        `50 Peter Street, Apartment ${300 + (num % 200)}, Deansgate Historic Conservation Area, Near Albert Hall Cultural Center`,
      ],
      apt: `Apartment ${10 + (num % 40)}`,
    },
    {
      city: 'Birmingham',
      state: 'West Midlands',
      zip: 'B3 2QD',
      streets: [
        `Two Snowhill, 6th Floor, Snow Hill Commercial District, Colmore Business Quarter, Near Cathedral Square Gardens`,
        `1 Colmore Square, Suite ${600 + (num % 400)}, City Centre Financial Core, Near Birmingham New Street Grand Central Station`,
        `10 Brindleyplace, 3rd Floor, Canalside Waterfront Development, Near National Sea Life Centre & Symphony Hall`,
      ],
      apt: `Suite ${1 + (num % 15)}`,
    },
    {
      city: 'Edinburgh',
      state: 'Midlothian',
      zip: 'EH2 2PQ',
      streets: [
        `14 George Street, Suite ${100 + (num % 300)}, New Town Georgian Conservation Area, Near St Andrew Square Gardens`,
        `50 Lothian Road, 5th Floor, Exchange Financial District, Near Historic Edinburgh Castle & Usher Hall Concert Center`,
        `10 Princes Street, Apartment ${2 + (num % 10)}B, Central Edinburgh Core, Directly Opposite The Balmoral Hotel & Waverley Station`,
      ],
      apt: `Flat ${1 + (num % 15)}`,
    },
    {
      city: 'Glasgow',
      state: 'Lanarkshire',
      zip: 'G1 2DH',
      streets: [
        `141 Bothwell Street, 7th Floor, International Financial Services District (IFSD), Near Glasgow Central Railway Station`,
        `110 Queen Street, Suite ${400 + (num % 300)}, Merchant City Historic Quarter, Near George Square & Gallery of Modern Art`,
      ],
      apt: `Floor ${1 + (num % 5)}`,
    },
    {
      city: 'Leeds',
      state: 'West Yorkshire',
      zip: 'LS1 5HD',
      streets: [
        `1 City Square, 4th Floor, Financial & Legal Quarter, Directly Opposite Leeds City Central Railway Station`,
        `10 Wellington Place, Suite ${200 + (num % 300)}, Wellington Business Quarter, Near River Aire Waterfront Corridor`,
      ],
      apt: `Suite ${10 + (num % 30)}`,
    },
  ];

  const loc = ukLocations[num % ukLocations.length];
  const street = loc.streets[num % loc.streets.length];
  const pTail = String(100 + ((num * 6197) % 900));

  return {
    recipient: shopper.name,
    phone: `+44 20 7946 0${pTail}`,
    email: shopper.email,
    street,
    apt: loc.apt,
    city: loc.city,
    state: loc.state,
    postalCode: loc.zip,
    countryCode: 'GB',
  };
}
