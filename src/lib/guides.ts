export const GUIDE_SLUGS = [
  'how-to-read-a-sun-path-diagram',
  'brisbane-winter-vs-summer-sun-path',
  'east-vs-west-facing-homes-australia',
  'golden-hour-direction-brisbane',
  'solar-azimuth-altitude-worked-example',
  'estimating-shadow-direction-from-solar-angles',
] as const;

export type GuideSlug = (typeof GUIDE_SLUGS)[number];

export interface GuideSectionDefinition {
  heading: string;
  paragraphs: readonly string[];
  points?: readonly string[];
}

export interface GuideExampleDate {
  label: string;
  dateISO: string;
  localTimes: readonly string[];
}

export interface GuideSourceDefinition {
  label: string;
  url: string;
  note: string;
}

export interface GuideDefinition {
  slug: GuideSlug;
  title: string;
  description: string;
  author: 'Solar Path Tracker';
  publishedDate: string;
  modifiedDate: string;
  keywords: readonly string[];
  introduction: readonly string[];
  sectionsBeforeExample: readonly GuideSectionDefinition[];
  example: {
    title: string;
    description: string;
    locationName: string;
    latitude: number;
    longitude: number;
    timezone: string;
    dates: readonly GuideExampleDate[];
    chartDateISO: string;
    chartView: 'altitude' | 'azimuth' | 'both';
    interpretation: readonly string[];
  };
  sectionsAfterExample: readonly GuideSectionDefinition[];
  useCases: readonly string[];
  limitations: readonly string[];
  sources: readonly GuideSourceDefinition[];
  relatedGuides: readonly [GuideSlug, GuideSlug, GuideSlug];
}

const SHARED_SOURCES: readonly GuideSourceDefinition[] = [
  {
    label: 'SunCalc',
    url: 'https://github.com/mourner/suncalc',
    note: 'Solar position and astronomical event calculations used by this site.',
  },
  {
    label: 'Luxon',
    url: 'https://moment.github.io/luxon/',
    note: 'IANA timezone-aware conversion between the selected local time and UTC.',
  },
  {
    label: 'Solar Path Tracker methodology',
    url: '/methodology',
    note: 'Definitions, angle normalization, polar handling, precision, and model limits.',
  },
] as const;

export const GUIDES: readonly GuideDefinition[] = [
  {
    slug: 'how-to-read-a-sun-path-diagram',
    title: 'How to Read a Sun Path Diagram',
    description:
      'Learn how time, solar azimuth, altitude, horizon crossings, and seasonal curves fit together in a practical sun path diagram.',
    author: 'Solar Path Tracker',
    publishedDate: '2026-08-12',
    modifiedDate: '2026-08-12',
    keywords: ['how to read a sun path diagram', 'solar azimuth', 'solar altitude', 'sun path chart'],
    introduction: [
      'A sun path diagram compresses a moving three-dimensional relationship into a readable daily curve. The horizontal question is direction: where around the compass is the Sun? The vertical question is height: how far above or below the horizon is it? A useful reading always joins those two angles to a local date and time.',
      'The most common mistake is to read a point on the curve as a promise of visible sunlight. The point describes solar geometry. A hill, neighbouring building, tree canopy, cloud layer, or window reveal can still remove the direct beam. Treat the diagram as the unobstructed sky baseline against which real conditions are checked.',
    ],
    sectionsBeforeExample: [
      {
        heading: 'Start with the coordinate system',
        paragraphs: [
          'Solar Path Tracker reports azimuth clockwise from true north. North is 0°, east is 90°, south is 180°, and west is 270°. An azimuth of 72° therefore places the Sun east-north-east, not 72° above the horizon.',
          'Altitude is a separate angle. Zero degrees is the astronomical horizon, positive values are above it, and negative values are below it. A 15° altitude indicates shallow light and usually long shadows; a 70° altitude indicates a high Sun and shorter shadows on level ground.',
        ],
      },
      {
        heading: 'Follow one date from left to right',
        paragraphs: [
          'Read the local-time labels in sequence rather than comparing disconnected points. Before sunrise the altitude is negative. It crosses the horizon near sunrise, rises to a daily maximum around solar noon, then falls through sunset. Clock noon and solar noon are not guaranteed to coincide because longitude, timezone boundaries, and daylight-saving rules affect the displayed clock.',
          'The azimuth curve should be read at the same timestamp as the altitude curve. This pairing tells you both which side of a site faces the Sun and how steeply the direct rays arrive.',
        ],
      },
    ],
    example: {
      title: 'Worked reading: Brisbane near the September equinox',
      description:
        'The fixed example uses Brisbane coordinates and 23 September 2026. The table is recalculated by the same engine as the interactive tools whenever the page is built.',
      locationName: 'Brisbane, Queensland, Australia',
      latitude: -27.4698,
      longitude: 153.0251,
      timezone: 'Australia/Brisbane',
      dates: [
        {
          label: 'September equinox reference',
          dateISO: '2026-09-23',
          localTimes: ['06:00', '09:00', '12:00', '15:00', '18:00'],
        },
      ],
      chartDateISO: '2026-09-23',
      chartView: 'both',
      interpretation: [
        'The morning readings move from the eastern side of the compass toward the north. That northern arc is expected in Brisbane because the city is in the Southern Hemisphere.',
        'The midday row has the greatest altitude of the selected samples. Its shadow direction is opposite the solar azimuth, while the shadow-length ratio becomes smaller as altitude rises.',
        'The 06:00 and 18:00 samples sit close to the horizon crossings. A one-hour chart interval is useful for orientation, but event calculators should be used when an exact sunrise or sunset timestamp is required.',
      ],
    },
    sectionsAfterExample: [
      {
        heading: 'Turn the chart into a site observation',
        paragraphs: [
          'Choose the date and hour that match the decision, note azimuth and altitude, then stand or orient a plan toward that bearing. Check whether the real horizon is clear. If an obstacle is present, estimate or measure its angular height and compare it with the solar altitude.',
          'Repeat the observation for a winter and summer date. One day can answer a scheduling question; two seasonal references reveal whether a facade, courtyard, or outdoor workspace behaves differently across the year.',
        ],
        points: [
          'Pair azimuth and altitude from the same timestamp.',
          'Use exact event tools for sunrise, sunset, and golden-hour boundaries.',
          'Verify true-north orientation and local obstructions before a consequential decision.',
        ],
      },
    ],
    useCases: [
      'Comparing morning and afternoon exposure before a property inspection.',
      'Selecting useful observation times for a shading or facade survey.',
      'Planning a photography angle around a known compass direction.',
    ],
    limitations: [
      'The diagram does not include terrain, buildings, trees, cloud, haze, or window geometry.',
      'Hourly samples are not substitutes for exact event timestamps between whole hours.',
      'A magnetic compass can differ from true north; account for local magnetic declination when measuring on site.',
    ],
    sources: SHARED_SOURCES,
    relatedGuides: [
      'solar-azimuth-altitude-worked-example',
      'brisbane-winter-vs-summer-sun-path',
      'estimating-shadow-direction-from-solar-angles',
    ],
  },
  {
    slug: 'brisbane-winter-vs-summer-sun-path',
    title: 'Brisbane Winter vs Summer Sun Path',
    description:
      'Compare Brisbane’s June and December solar paths using fixed, reproducible sunrise, sunset, direction, altitude, and daylight data.',
    author: 'Solar Path Tracker',
    publishedDate: '2026-08-12',
    modifiedDate: '2026-08-12',
    keywords: ['Brisbane winter sun path', 'Brisbane summer sun path', 'Brisbane daylight hours', 'seasonal sun angles'],
    introduction: [
      'Brisbane does not experience the extreme seasonal daylight swing of high-latitude cities, but the change is still large enough to alter facade exposure, shade depth, outdoor comfort, and the useful hours for direct sunlight. The difference is not only that summer days are longer: the daily arc also rises much higher in the sky.',
      'This comparison holds latitude, longitude, timezone, and clock time constant. Only the date changes, so the table isolates the seasonal geometry rather than mixing it with a different site or timezone.',
    ],
    sectionsBeforeExample: [
      {
        heading: 'Why the northern sky matters in Brisbane',
        paragraphs: [
          'At Brisbane’s latitude, the midday Sun generally occupies the northern side of the sky. In winter it stays lower, so north-facing surfaces can receive useful direct light at a shallow angle. In summer the path climbs high enough that eaves and other horizontal shading can have a very different effect.',
          'East-facing surfaces receive the early part of both arcs and west-facing surfaces receive the late part. The summer arc begins earlier and ends later, extending exposure on both sides of the day.',
        ],
      },
      {
        heading: 'Separate clock time from solar shape',
        paragraphs: [
          'Queensland uses Australia/Brisbane time without daylight saving. This makes a fixed-clock comparison easier to read, but solar noon still need not be exactly 12:00. The highest point on the hourly chart can fall between samples.',
          'For design questions, compare equivalent local times and also inspect each day’s sunrise and sunset boundaries. The two views answer different questions: clock-time conditions versus total available daylight.',
        ],
      },
    ],
    example: {
      title: 'Solstice comparison at the same Brisbane coordinates',
      description:
        'The June and December dates are fixed to 2026. Event times and angle samples are generated from Solar Path Tracker’s SunCalc-based engine in Australia/Brisbane time.',
      locationName: 'Brisbane, Queensland, Australia',
      latitude: -27.4698,
      longitude: 153.0251,
      timezone: 'Australia/Brisbane',
      dates: [
        { label: 'June solstice', dateISO: '2026-06-21', localTimes: ['08:00', '12:00', '16:00'] },
        { label: 'December solstice', dateISO: '2026-12-21', localTimes: ['08:00', '12:00', '16:00'] },
      ],
      chartDateISO: '2026-12-21',
      chartView: 'altitude',
      interpretation: [
        'At 12:00 the December altitude is substantially higher than the June altitude. On level ground this produces a much smaller theoretical shadow-length ratio at the same clock time.',
        'The event summary shows the longer summer daylight window. That extra time appears at both ends of the day, which is relevant to east- and west-facing glazing even when midday shading is effective.',
        'The displayed chart is the December curve. Compare its high, broad arc with the June values in the table rather than assuming the same overhang or tree canopy performs identically all year.',
      ],
    },
    sectionsAfterExample: [
      {
        heading: 'Practical reading for homes and outdoor spaces',
        paragraphs: [
          'A north-facing opening can be easier to shade from high summer sun while still admitting lower winter sun, but actual performance depends on overhang depth, sill height, surrounding obstacles, and the opening’s orientation. The solar path supplies the angle inputs; it does not complete the building-physics calculation.',
          'For gardens and outdoor areas, winter results help identify locations that may lose direct light behind a fence or building. Summer results help identify prolonged western exposure and places where late-day shade may be valuable.',
        ],
      },
    ],
    useCases: [
      'Comparing seasonal sunlight before choosing a courtyard or living-area orientation.',
      'Selecting dates and times for a winter-versus-summer site-photo record.',
      'Explaining why the same fixed shade structure behaves differently in June and December.',
    ],
    limitations: [
      'The example uses level-horizon astronomy and does not simulate a particular house, eave, or window.',
      'Solstice dates are seasonal anchors, not a complete annual energy or comfort model.',
      'Cloud cover, surface temperatures, glazing properties, and reflected heat are outside the calculation.',
    ],
    sources: SHARED_SOURCES,
    relatedGuides: [
      'east-vs-west-facing-homes-australia',
      'how-to-read-a-sun-path-diagram',
      'estimating-shadow-direction-from-solar-angles',
    ],
  },
  {
    slug: 'east-vs-west-facing-homes-australia',
    title: 'East vs West-Facing Homes in Australia: Reading the Solar Difference',
    description:
      'Use solar azimuth and altitude to compare morning east-facing exposure with afternoon west-facing exposure in an Australian context.',
    author: 'Solar Path Tracker',
    publishedDate: '2026-08-12',
    modifiedDate: '2026-08-12',
    keywords: ['east vs west facing house Australia', 'afternoon sun Australia', 'house orientation sunlight', 'west-facing windows'],
    introduction: [
      '“East-facing” and “west-facing” are useful starting labels, but they do not describe a full property. A facade receives direct sun when the solar bearing falls within its visible half of the sky and no obstacle blocks the rays. Solar altitude then determines how steeply that light arrives and how readily an overhang, neighbouring structure, or vegetation can intercept it.',
      'In practical terms, east-facing openings tend to receive direct morning light and west-facing openings tend to receive direct afternoon light. The afternoon exposure often coincides with a warmer part of the day, but this article describes geometry rather than predicting indoor temperature or energy use.',
    ],
    sectionsBeforeExample: [
      {
        heading: 'Translate orientation into a bearing range',
        paragraphs: [
          'A perfectly east-facing wall points toward 90°; a perfectly west-facing wall points toward 270°. Real walls may face north-east, south-east, north-west, or south-west, which shifts the hours when direct light reaches them. Use the wall’s true bearing instead of relying only on a sales description or street direction.',
          'The Sun’s bearing is only one part of the test. A low morning or afternoon altitude can send light deep beneath a horizontal overhang, whereas a high midday altitude is more easily excluded by that same geometry.',
        ],
      },
      {
        heading: 'Compare equal distances from noon',
        paragraphs: [
          'An 08:00 versus 16:00 comparison is a helpful first pass because the samples sit on opposite sides of midday. They are not guaranteed to be perfect mirror images: the equation of time, local longitude within a timezone, and the chosen date influence the path.',
          'For a real inspection, repeat the calculation at the expected occupancy times. A bedroom, kitchen, office, and outdoor deck can each make a different orientation trade-off.',
        ],
      },
    ],
    example: {
      title: 'Morning and afternoon bearings in Brisbane',
      description:
        'This reproducible example samples 08:00, 12:00, and 16:00 on two fixed seasonal dates. Brisbane is used as a concrete Australian case, not as a substitute for entering the property’s actual coordinates.',
      locationName: 'Brisbane, Queensland, Australia',
      latitude: -27.4698,
      longitude: 153.0251,
      timezone: 'Australia/Brisbane',
      dates: [
        { label: 'Winter reference', dateISO: '2026-06-21', localTimes: ['08:00', '12:00', '16:00'] },
        { label: 'Summer reference', dateISO: '2026-12-21', localTimes: ['08:00', '12:00', '16:00'] },
      ],
      chartDateISO: '2026-12-21',
      chartView: 'azimuth',
      interpretation: [
        'The 08:00 rows occupy the eastern side of the compass, supporting direct-light checks for east-facing and north-east-facing surfaces. The 16:00 rows occupy the western side for west-facing and north-west-facing surfaces.',
        'Summer extends the usable solar arc earlier and later than winter. A west-facing opening can therefore remain exposed late in the day even after a north-facing overhang has blocked high midday sun.',
        'Shadow direction in the table points away from the Sun. It can help identify which side of a fence, balcony, or neighbouring mass is likely to fall into shade at the sampled time.',
      ],
    },
    sectionsAfterExample: [
      {
        heading: 'A property-inspection workflow',
        paragraphs: [
          'Confirm the orientation with a surveyed plan, reliable map, or corrected compass. Enter the actual coordinates and inspection date, then note bearings for the rooms and outdoor spaces that matter. At the property, check the horizon for trees, slopes, towers, balconies, and adjacent buildings.',
          'Record observations at more than one time if sunlight is a major decision factor. A single midday visit can miss both early eastern light and the late western exposure that affects afternoon use.',
        ],
        points: [
          'Use the actual facade bearing, not only the address-facing direction.',
          'Check summer and winter reference dates.',
          'Treat comfort and energy performance as separate assessments requiring building data.',
        ],
      },
    ],
    useCases: [
      'Preparing questions before a home inspection or rental viewing.',
      'Comparing likely morning light in bedrooms with afternoon light in living areas.',
      'Planning where external shade or vegetation observations need the most attention.',
    ],
    limitations: [
      'Solar geometry alone cannot predict indoor temperature, glare, cooling load, or occupant comfort.',
      'The example does not include a facade-normal calculation or any specific building dimensions.',
      'Local terrain, neighbouring development, trees, curtains, glass, and external shading can dominate the visible result.',
    ],
    sources: SHARED_SOURCES,
    relatedGuides: [
      'brisbane-winter-vs-summer-sun-path',
      'estimating-shadow-direction-from-solar-angles',
      'solar-azimuth-altitude-worked-example',
    ],
  },
  {
    slug: 'golden-hour-direction-brisbane',
    title: 'Golden Hour Direction in Brisbane',
    description:
      'Plan Brisbane golden-hour light by combining the exact event window with boundary azimuth, altitude, and seasonal direction.',
    author: 'Solar Path Tracker',
    publishedDate: '2026-08-12',
    modifiedDate: '2026-08-12',
    keywords: ['Brisbane golden hour direction', 'Brisbane photography light', 'golden hour azimuth', 'golden hour calculator Brisbane'],
    introduction: [
      'A golden-hour time without a direction is incomplete planning information. The Sun may be low and warm, yet sit behind the subject, behind the photographer, or behind a blocked horizon. Combining the window with its azimuth explains which side of a scene is geometrically positioned for direct low-angle light.',
      'Solar Path Tracker defines the morning window from sunrise until the Sun reaches +6° altitude, and the evening window from +6° down to sunset. This is an astronomical boundary, not a guarantee of colour. Atmosphere, cloud, smoke, haze, terrain, buildings, trees, and exposure choices shape the visible result.',
    ],
    sectionsBeforeExample: [
      {
        heading: 'Read the beginning and end as two bearings',
        paragraphs: [
          'The Sun continues moving throughout a golden-hour window. The starting bearing and ending bearing therefore form a directional span rather than one fixed compass point. A location with a narrow opening between buildings may receive only part of the calculated window.',
          'Morning light approaches from the eastern side of the sky and evening light from the western side, but the north-south component changes by season. That seasonal movement can decide whether a city street, river edge, facade, or landscape has a clear line of sight.',
        ],
      },
      {
        heading: 'Use altitude to anticipate shadow character',
        paragraphs: [
          'Between 0° and 6°, direct rays meet level ground at a shallow angle. Unobstructed vertical objects cast long shadows, and small changes in terrain or skyline height can remove the direct beam entirely.',
          'The main Solar Path Tracker labels whole-hour samples between 0° and 6° as an approximate golden state. The dedicated Golden Hour Calculator uses the exact SunCalc event boundaries, so it is the appropriate tool for start and end times.',
        ],
      },
    ],
    example: {
      title: 'Seasonal golden-hour bearings for Brisbane',
      description:
        'The event table calculates exact morning and evening windows for the June and December solstices. The angle rows add fixed low-light samples so the bearing shift can be inspected alongside the daily chart.',
      locationName: 'Brisbane, Queensland, Australia',
      latitude: -27.4698,
      longitude: 153.0251,
      timezone: 'Australia/Brisbane',
      dates: [
        { label: 'Winter reference', dateISO: '2026-06-21', localTimes: ['07:00', '17:00'] },
        { label: 'Summer reference', dateISO: '2026-12-21', localTimes: ['05:30', '18:30'] },
      ],
      chartDateISO: '2026-06-21',
      chartView: 'both',
      interpretation: [
        'The event windows start or end at a zero-degree horizon boundary and a +6° boundary. Their azimuths show the compass sector swept during the calculated golden period.',
        'June and December do not share the same sunrise or sunset bearing. Reusing a composition planned in one season can place the Sun outside the intended gap or behind a different part of the skyline in another season.',
        'The fixed clock samples are context points, not replacements for the event boundaries. Use the exact window displayed in the event summary when scheduling arrival and setup.',
      ],
    },
    sectionsAfterExample: [
      {
        heading: 'Plan a location check before the shoot',
        paragraphs: [
          'Plot or stand facing the boundary bearing, then inspect whether the horizon is clear. For an evening shoot, arrive before the Sun falls into the 0–6° band so composition and exposure can be tested while the light is still changing.',
          'If the subject must be front-lit, place the photographer generally opposite the Sun. For backlight or rim light, place the subject between the camera and the solar bearing. These are compositional starting points, not safety guidance for viewing or photographing the Sun.',
        ],
      },
    ],
    useCases: [
      'Checking whether a city-street axis aligns with the low Sun.',
      'Planning front light, side light, or backlight for an outdoor portrait.',
      'Comparing winter and summer horizon access at the same Brisbane location.',
    ],
    limitations: [
      'The model does not forecast cloud, colour, aerosol, smoke, visibility, or camera exposure.',
      'It assumes an unobstructed astronomical horizon and does not use terrain elevation profiles.',
      'Never look directly at the Sun through an optical viewfinder or unapproved equipment.',
    ],
    sources: SHARED_SOURCES,
    relatedGuides: [
      'how-to-read-a-sun-path-diagram',
      'brisbane-winter-vs-summer-sun-path',
      'solar-azimuth-altitude-worked-example',
    ],
  },
  {
    slug: 'solar-azimuth-altitude-worked-example',
    title: 'Solar Azimuth and Altitude: A Worked Example',
    description:
      'Follow a fixed Brisbane example from local time to solar azimuth, altitude, compass direction, daylight state, and practical interpretation.',
    author: 'Solar Path Tracker',
    publishedDate: '2026-08-12',
    modifiedDate: '2026-08-12',
    keywords: ['solar azimuth altitude example', 'calculate sun angle example', 'solar bearing explained', 'sun altitude worked example'],
    introduction: [
      'Solar azimuth and altitude are a coordinate pair. Azimuth locates the Sun around the horizon, while altitude locates it above or below that horizon. A useful worked example keeps the location, date, timezone, and local time explicit so another reader can reproduce the result.',
      'This page demonstrates interpretation, not a hand-derived replacement for an astronomical algorithm. The numeric table is produced by the same calculation functions used by the site’s Solar Azimuth & Altitude Calculator, then rounded only for display.',
    ],
    sectionsBeforeExample: [
      {
        heading: 'Define every input before reading the output',
        paragraphs: [
          'Latitude and longitude anchor the observer. The calendar date establishes the seasonal declination, and the IANA timezone converts the selected local clock time to the instant required by the solar-position calculation. Changing any one of these inputs can change both output angles.',
          'The site normalizes azimuth into 0–360° clockwise from true north. Altitude remains signed: positive above the horizon and negative below it. This convention avoids the ambiguity that occurs when a bearing and an elevation are reported without definitions.',
        ],
      },
      {
        heading: 'Read direction before drawing conclusions',
        paragraphs: [
          'A cardinal label such as north-east is a readable summary of the numeric bearing, but the degree value is more precise. For a facade, street, or camera axis, compare the actual bearings rather than assuming every direction within one cardinal sector is equivalent.',
          'Altitude tells you whether direct rays can clear a level horizon, but not whether they clear the real skyline. The next step is always an obstruction check.',
        ],
      },
    ],
    example: {
      title: 'Brisbane on 11 August 2026',
      description:
        'The example fixes Brisbane at −27.4698, 153.0251 in Australia/Brisbane time and samples the path from morning through late afternoon.',
      locationName: 'Brisbane, Queensland, Australia',
      latitude: -27.4698,
      longitude: 153.0251,
      timezone: 'Australia/Brisbane',
      dates: [
        {
          label: 'Worked-example date',
          dateISO: '2026-08-11',
          localTimes: ['07:00', '09:00', '12:00', '15:00', '17:00'],
        },
      ],
      chartDateISO: '2026-08-11',
      chartView: 'both',
      interpretation: [
        'At the morning samples, the Sun is on the eastern side of the daily arc. Around midday it reaches the northern portion of the sky and a higher altitude. By late afternoon the bearing moves westward while altitude falls.',
        'The shadow bearing is calculated as the opposite direction, 180° from solar azimuth. The shadow-length ratio assumes a vertical object on level ground and shows why low-altitude light creates long shadows.',
        'The daylight state is a site convention: below 0° is night, 0–6° is the approximate hourly golden band, and above 6° is day. Exact sunrise and golden-hour events are calculated separately rather than inferred from a whole-hour row.',
      ],
    },
    sectionsAfterExample: [
      {
        heading: 'Reproduce the calculation in the tool',
        paragraphs: [
          'Open the Solar Azimuth & Altitude Calculator, enter the Brisbane coordinates, choose 11 August 2026, and select one of the listed local times. The result cards should agree with the table apart from display rounding.',
          'Then change one input at a time. Moving the date reveals seasonal change; moving the time traces the daily curve; moving the location reveals the latitude and longitude effect. This controlled comparison is more informative than changing every input together.',
        ],
      },
    ],
    useCases: [
      'Checking the expected direction of direct light at a scheduled observation time.',
      'Teaching the difference between a compass bearing and an elevation angle.',
      'Creating a reproducible baseline before comparing a real skyline or shadow measurement.',
    ],
    limitations: [
      'Displayed values are rounded; do not treat the final decimal place as surveyed precision.',
      'The calculation does not include a digital elevation model, object geometry, weather, or atmospheric visibility.',
      'Solar angles do not by themselves calculate panel energy yield, optimal tilt, glare, or code compliance.',
    ],
    sources: SHARED_SOURCES,
    relatedGuides: [
      'how-to-read-a-sun-path-diagram',
      'estimating-shadow-direction-from-solar-angles',
      'golden-hour-direction-brisbane',
    ],
  },
  {
    slug: 'estimating-shadow-direction-from-solar-angles',
    title: 'Estimating Shadow Direction from Solar Angles',
    description:
      'Learn how to reverse solar azimuth for shadow direction and use solar altitude for a simple level-ground shadow-length estimate.',
    author: 'Solar Path Tracker',
    publishedDate: '2026-08-12',
    modifiedDate: '2026-08-12',
    keywords: ['shadow direction from solar azimuth', 'shadow length solar altitude', 'sun angle shadow calculation', 'estimate building shadow'],
    introduction: [
      'A sun-facing object casts its shadow away from the Sun. On a compass plan, the first estimate is therefore simple: add 180° to solar azimuth and wrap the result back into the 0–360° range. If the Sun is at 70°, the level-plan shadow bearing is approximately 250°.',
      'Length needs another assumption. For a vertical object on level ground, the shadow-length-to-height ratio is 1 ÷ tan(solar altitude). This idealized relationship is useful for scale intuition, but a real result changes with sloped ground, tilted objects, irregular shapes, diffuse light, and intervening obstructions.',
    ],
    sectionsBeforeExample: [
      {
        heading: 'Reverse the bearing, then check altitude',
        paragraphs: [
          'To reverse a solar bearing, add 180°. If the result is 360° or more, subtract 360°. The direction is meaningful for direct sunlight only when the Sun is above the horizon and reaches the object without being blocked.',
          'Altitude controls the theoretical length. At 45°, the level-ground shadow of a vertical object is approximately the same length as the object’s height. Below 45° the ratio grows; above 45° it shrinks. As altitude approaches zero, the ideal ratio becomes extremely large and increasingly sensitive to terrain and skyline assumptions.',
        ],
      },
      {
        heading: 'Keep the geometric model explicit',
        paragraphs: [
          'A shadow estimate needs an object height, a receiver plane, and a solar position for a particular instant. Without those definitions, a direction arrow can be useful but a claimed length is not reproducible.',
          'This guide reports a dimensionless ratio. Multiply it by the object height only when the object is vertical and the receiving ground is approximately level. More complex cases require three-dimensional geometry or site measurement.',
        ],
      },
    ],
    example: {
      title: 'Shadow bearings and ratios through a Brisbane day',
      description:
        'The fixed equinox reference samples the solar angles at five local times. Shadow bearing and the ideal level-ground length ratio are derived from those engine values.',
      locationName: 'Brisbane, Queensland, Australia',
      latitude: -27.4698,
      longitude: 153.0251,
      timezone: 'Australia/Brisbane',
      dates: [
        {
          label: 'March equinox reference',
          dateISO: '2026-03-20',
          localTimes: ['07:00', '09:00', '12:00', '15:00', '17:00'],
        },
      ],
      chartDateISO: '2026-03-20',
      chartView: 'altitude',
      interpretation: [
        'The shadow bearings remain opposite their corresponding solar bearings and rotate as the Sun crosses the sky. Morning shadows generally extend toward the western side; afternoon shadows extend toward the eastern side.',
        'The smallest ratio occurs near the highest sampled altitude. The early and late ratios are larger because the rays meet level ground more obliquely.',
        'A row with the Sun at or below the horizon would not receive a finite direct-sun ratio. The table labels that case unavailable instead of presenting a misleading negative length.',
      ],
    },
    sectionsAfterExample: [
      {
        heading: 'Apply the ratio carefully',
        paragraphs: [
          'For an ideal 2 m vertical post, a displayed ratio of 1.5 implies a 3 m shadow on level ground. Mark that bearing and distance on a plan, then check whether a wall, slope, canopy, or different receiving surface changes the geometry.',
          'For buildings or compliance work, use surveyed dimensions and an appropriate three-dimensional or professional shading analysis. This simplified construction is best used for first-pass reasoning and field-observation planning.',
        ],
        points: [
          'Shadow bearing = normalized solar azimuth + 180°.',
          'Level-ground shadow length = object height ÷ tan(solar altitude).',
          'Do not calculate a direct-sun length when altitude is at or below 0°.',
        ],
      },
    ],
    useCases: [
      'Estimating which side of an object will be shaded at a selected time.',
      'Choosing field-measurement times when shadows are long enough to observe clearly.',
      'Checking whether a simple plan sketch is directionally consistent with the solar bearing.',
    ],
    limitations: [
      'The ratio assumes a vertical object, level receiver, direct sunlight, and no obstruction between Sun and object.',
      'Slopes, facade projections, complex roofs, penumbra, diffuse sky light, and reflected light require a more complete model.',
      'This is not a substitute for surveyed shadow diagrams, development-approval evidence, or safety-critical engineering.',
    ],
    sources: SHARED_SOURCES,
    relatedGuides: [
      'solar-azimuth-altitude-worked-example',
      'how-to-read-a-sun-path-diagram',
      'east-vs-west-facing-homes-australia',
    ],
  },
] as const;

const guideBySlug = new Map<GuideSlug, GuideDefinition>(
  GUIDES.map((guide) => [guide.slug, guide])
);

export function getGuide(slug: string): GuideDefinition | undefined {
  return guideBySlug.get(slug as GuideSlug);
}
