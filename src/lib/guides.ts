export const GUIDE_SLUGS = [
  'how-to-read-a-sun-path-diagram',
  'brisbane-winter-vs-summer-sun-path',
  'east-vs-west-facing-homes-australia',
  'golden-hour-direction-brisbane',
  'solar-azimuth-altitude-worked-example',
  'estimating-shadow-direction-from-solar-angles',
] as const;

export type GuideSlug = (typeof GUIDE_SLUGS)[number];

export const GUIDE_EVIDENCE_KEYS = [
  'sun-path-diagram',
  'seasonal-comparison',
  'facade-orientation-matrix',
  'golden-hour-shot-plan',
  'nrel-spa-benchmark',
  'shadow-direction-model',
] as const;

export type GuideEvidenceKey = (typeof GUIDE_EVIDENCE_KEYS)[number];

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

export interface GuideRelatedToolDefinition {
  href: string;
  label: string;
  description: string;
}

export interface GuideApplicationCaseDefinition {
  task: string;
  assumptions: readonly string[];
  reproduction: {
    toolHref: string;
    toolLabel: string;
    steps: readonly string[];
  };
}

export interface GuideDefinition {
  slug: GuideSlug;
  evidenceKey: GuideEvidenceKey;
  contentTypeLabel: string;
  csvDefinition: {
    filenameStem: string;
    description: string;
    columns: readonly string[];
  };
  evidenceSources: readonly GuideSourceDefinition[];
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
  applicationCase?: GuideApplicationCaseDefinition;
  sectionsAfterExample: readonly GuideSectionDefinition[];
  useCases: readonly string[];
  limitations: readonly string[];
  sources: readonly GuideSourceDefinition[];
  relatedTools?: readonly GuideRelatedToolDefinition[];
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
    evidenceKey: 'sun-path-diagram',
    contentTypeLabel: 'Annotated diagram',
    csvDefinition: {
      filenameStem: 'brisbane-equinox-sun-path',
      description: 'The plotted Brisbane near-equinox points shown in the original diagram and accessible data table.',
      columns: ['local_time', 'azimuth_deg', 'altitude_deg', 'daylight_state'],
    },
    evidenceSources: [{
      label: 'NREL Solar Position Algorithm report',
      url: 'https://docs.nrel.gov/docs/fy08osti/34302.pdf',
      note: 'Independent reference for solar-position inputs and angular conventions; NREL does not endorse this site.',
    }],
    title: 'How to Read a Sun Path Diagram',
    description:
      'Learn how time, solar azimuth, altitude, horizon crossings, and seasonal curves fit together in a practical sun path diagram.',
    author: 'Solar Path Tracker',
    publishedDate: '2026-08-12',
    modifiedDate: '2026-09-06',
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
    relatedTools: [
      {
        href: '/',
        label: 'Open the interactive Sun Path Map',
        description: 'Enter a location, date, and time to read the full solar path alongside azimuth and altitude.',
      },
    ],
    relatedGuides: [
      'solar-azimuth-altitude-worked-example',
      'brisbane-winter-vs-summer-sun-path',
      'estimating-shadow-direction-from-solar-angles',
    ],
  },
  {
    slug: 'brisbane-winter-vs-summer-sun-path',
    evidenceKey: 'seasonal-comparison',
    contentTypeLabel: 'Seasonal comparison',
    csvDefinition: {
      filenameStem: 'brisbane-solstice-comparison',
      description: 'Complete June and December 24-hour solar curves with event and day-length context.',
      columns: ['season', 'date', 'local_time', 'azimuth_deg', 'altitude_deg', 'daylight_state', 'sunrise', 'solar_noon', 'sunset', 'day_length'],
    },
    evidenceSources: [{
      label: 'USNO Astronomical Applications API documentation',
      url: 'https://aa.usno.navy.mil/data/api.html',
      note: 'External event-time reference documented in the site validation registry; USNO does not endorse this site.',
    }],
    title: 'Brisbane Winter vs Summer Sun Path',
    description:
      'Plan a three-time winter-versus-summer site observation in Brisbane using reproducible solar bearings, altitudes, and daylight data.',
    author: 'Solar Path Tracker',
    publishedDate: '2026-08-12',
    modifiedDate: '2026-09-06',
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
      title: 'Seasonal reference comparison at the same Brisbane coordinates',
      description:
        'The June and December dates are fixed to 2026. Event times and angle samples are generated from Solar Path Tracker’s SunCalc-based engine in Australia/Brisbane time.',
      locationName: 'Brisbane, Queensland, Australia',
      latitude: -27.4698,
      longitude: 153.0251,
      timezone: 'Australia/Brisbane',
      dates: [
        { label: 'June reference', dateISO: '2026-06-21', localTimes: ['08:00', '12:00', '16:00'] },
        { label: 'December reference', dateISO: '2026-12-21', localTimes: ['08:00', '12:00', '16:00'] },
      ],
      chartDateISO: '2026-12-21',
      chartView: 'altitude',
      interpretation: [
        'At 12:00 the December altitude is substantially higher than the June altitude. On level ground this produces a much smaller theoretical shadow-length ratio at the same clock time.',
        'The event summary shows the longer summer daylight window. That extra time appears at both ends of the day, which is relevant to east- and west-facing glazing even when midday shading is effective.',
        'The displayed chart is the December curve. Compare its high, broad arc with the June values in the table rather than assuming the same overhang or tree canopy performs identically all year.',
      ],
    },
    applicationCase: {
      task: 'Choose three repeatable observation times for the same Brisbane outdoor space, then compare the astronomical baseline with what is actually visible on site.',
      assumptions: [
        'The observation point and camera direction stay fixed between the winter and summer visits.',
        'The solar engine reports an unobstructed astronomical baseline; it does not simulate indoor daylight, temperature, or shade from buildings, trees, terrain, and weather.',
        '08:00, 12:00, and 16:00 are local clock-time samples. The calculated solar-noon event is reported separately.',
      ],
      reproduction: {
        toolHref: '/',
        toolLabel: 'Open the Sun Path Map',
        steps: [
          'Enter the coordinates shown in the case inputs and select each listed seasonal reference date.',
          'Inspect the solar bearing and altitude at 08:00, 12:00, and 16:00 without changing the observation point.',
          'Use the same viewpoint and camera direction during each field visit.',
          'Record actual obstructions and visible light beside the calculated baseline instead of treating the model as a shading survey.',
        ],
      },
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
      'Fixed reference dates are seasonal anchors, not a complete annual energy or comfort model.',
      'Cloud cover, surface temperatures, glazing properties, and reflected heat are outside the calculation.',
    ],
    sources: SHARED_SOURCES,
    relatedTools: [
      {
        href: '/',
        label: 'Compare a sun path for your own location',
        description: 'Use the live map to inspect seasonal direction, height, and daylight for a place you choose.',
      },
      {
        href: '/sunrise-sunset-calculator',
        label: 'Check sunrise and sunset direction',
        description: 'Calculate the event times, daylight length, and bearings for the same location and date.',
      },
    ],
    relatedGuides: [
      'east-vs-west-facing-homes-australia',
      'how-to-read-a-sun-path-diagram',
      'estimating-shadow-direction-from-solar-angles',
    ],
  },
  {
    slug: 'east-vs-west-facing-homes-australia',
    evidenceKey: 'facade-orientation-matrix',
    contentTypeLabel: 'Orientation matrix',
    csvDefinition: {
      filenameStem: 'australia-east-west-facade-matrix',
      description: 'Darwin, Brisbane, and Hobart winter/summer bearings at 08:00 and 16:00 for geometric facade checks.',
      columns: ['city', 'season', 'date', 'local_time', 'azimuth_deg', 'altitude_deg', 'geometric_facade_exposure'],
    },
    evidenceSources: [{
      label: 'NREL Solar Position Algorithm report',
      url: 'https://docs.nrel.gov/docs/fy08osti/34302.pdf',
      note: 'Independent description of solar-position geometry; the facade labels here are site-authored interpretations of bearing only.',
    }],
    title: 'East vs West-Facing Homes in Australia: Reading the Solar Difference',
    description:
      'Use solar azimuth and altitude to compare morning east-facing exposure with afternoon west-facing exposure in an Australian context.',
    author: 'Solar Path Tracker',
    publishedDate: '2026-08-12',
    modifiedDate: '2026-09-06',
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
    relatedTools: [
      {
        href: '/solar-azimuth-altitude',
        label: 'Calculate a facade sun angle',
        description: 'Check sun direction, azimuth, and altitude for the property location, date, and time that matter.',
      },
    ],
    relatedGuides: [
      'brisbane-winter-vs-summer-sun-path',
      'estimating-shadow-direction-from-solar-angles',
      'solar-azimuth-altitude-worked-example',
    ],
  },
  {
    slug: 'golden-hour-direction-brisbane',
    evidenceKey: 'golden-hour-shot-plan',
    contentTypeLabel: 'Directional shot plan',
    csvDefinition: {
      filenameStem: 'brisbane-golden-hour-shot-plan',
      description: 'Winter and summer boundaries for the site-defined 0 to 6 degree golden-hour windows.',
      columns: ['season', 'window', 'boundary', 'local_time', 'azimuth_deg', 'altitude_deg', 'field_note'],
    },
    evidenceSources: [{
      label: 'USNO Astronomical Applications API documentation',
      url: 'https://aa.usno.navy.mil/data/api.html',
      note: 'Independent event-time reference used by the site validation report; the 0 to 6 degree golden-hour definition is this site’s stated convention.',
    }],
    title: 'Golden Hour Direction in Brisbane',
    description:
      'Place a camera for front, side, or back light using Brisbane’s reproducible winter and summer golden-hour bearings.',
    author: 'Solar Path Tracker',
    publishedDate: '2026-08-12',
    modifiedDate: '2026-09-06',
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
        'The event table calculates exact morning and evening windows for the June and December references. The angle rows add fixed low-light samples so the bearing shift can be inspected alongside the daily chart.',
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
    applicationCase: {
      task: 'Use the winter-reference evening golden-hour bearing to place a camera for front, side, or back light, then compare that setup with the summer direction.',
      assumptions: [
        'The diagrams show relative positions around one subject and are not maps of a real location.',
        'All directions are true-north bearings measured clockwise from north.',
        'The Sun is treated as an unobstructed direction; skyline, terrain, weather, exposure, and lens choice remain field decisions.',
      ],
      reproduction: {
        toolHref: '/golden-hour-calculator',
        toolLabel: 'Open the Golden Hour Calculator',
        steps: [
          'Enter the coordinates shown in the case inputs and select the winter-reference date.',
          'Read the Evening golden hour start and end times, bearings, and altitudes.',
          'Use the winter start bearing to choose the relative camera setup shown in the diagrams.',
          'Check the real horizon before the window begins, then repeat with the summer-reference date rather than reusing the winter direction.',
        ],
      },
    },
    sectionsAfterExample: [
      {
        heading: 'Plan a location check before the shoot',
        paragraphs: [
          'Plot or stand facing the boundary bearing, then inspect whether the horizon is clear. For an evening shoot, arrive before the Sun falls into the 0–6° band so composition and exposure can be tested while the light is still changing.',
          'For front light, place the photographer on the Sun-facing side of the subject, with the Sun generally behind the photographer. For backlight or rim light, place the subject between the camera and the solar bearing. These are compositional starting points, not safety guidance for viewing or photographing the Sun.',
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
    relatedTools: [
      {
        href: '/golden-hour-calculator',
        label: 'Reproduce the golden-hour window',
        description: 'Enter the case coordinates and date to verify the exact evening boundary times and bearings.',
      },
      {
        href: '/',
        label: 'Open the Sun Path Map',
        description: 'Inspect the full solar arc and hourly bearings before checking a golden-hour window.',
      },
      {
        href: '/sunrise-sunset-calculator',
        label: 'Check sunrise and sunset times',
        description: 'Compare exact daylight boundaries and event direction for a selected location and date.',
      },
    ],
    relatedGuides: [
      'how-to-read-a-sun-path-diagram',
      'brisbane-winter-vs-summer-sun-path',
      'solar-azimuth-altitude-worked-example',
    ],
  },
  {
    slug: 'solar-azimuth-altitude-worked-example',
    evidenceKey: 'nrel-spa-benchmark',
    contentTypeLabel: 'Independent benchmark',
    csvDefinition: {
      filenameStem: 'nrel-spa-golden-2003',
      description: 'NREL SPA expected angles, Solar Path Tracker results, and absolute circular differences for the canonical Golden case.',
      columns: ['angle', 'external_expected_deg', 'solar_path_tracker_deg', 'absolute_delta_deg', 'tolerance_deg', 'result'],
    },
    evidenceSources: [{
      label: 'NREL Solar Position Algorithm report',
      url: 'https://docs.nrel.gov/docs/fy08osti/34302.pdf',
      note: 'Published canonical position case used as an external comparison; NREL does not certify or endorse this site.',
    }],
    title: 'Solar Azimuth and Altitude: A Worked Example',
    description:
      'Compare the NREL SPA canonical Golden, Colorado position with Solar Path Tracker azimuth, altitude, and explicit angular differences.',
    author: 'Solar Path Tracker',
    publishedDate: '2026-08-12',
    modifiedDate: '2026-08-24',
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
      title: 'NREL SPA canonical Golden, Colorado case',
      description:
        'The external case fixes Golden at 39.742476, −105.1786 and 19:30:30 UTC on 17 October 2003. The legacy minute sample below remains reproducible while the evidence component uses the exact second.',
      locationName: 'Golden, Colorado, United States',
      latitude: 39.742476,
      longitude: -105.1786,
      timezone: 'America/Denver',
      dates: [
        {
          label: 'NREL SPA reference instant (minute display)',
          dateISO: '2003-10-17',
          localTimes: ['13:30'],
        },
      ],
      chartDateISO: '2003-10-17',
      chartView: 'both',
      interpretation: [
        'The comparison uses external expected values instead of comparing the production engine with another output generated by itself.',
        'Azimuth difference uses circular distance so values near 0° and 360° are compared correctly. Altitude uses ordinary absolute difference.',
        'Passing the 0.5° tolerance supports this fixed angular case only and does not imply NREL approval or surveyed site accuracy.',
      ],
    },
    sectionsAfterExample: [
      {
        heading: 'Reproduce the calculation in the tool',
        paragraphs: [
          'Open the Solar Azimuth & Altitude Calculator, enter 39.742476, −105.1786, choose 17 October 2003, and select 13:30 in America/Denver. The minute-level interface should closely reproduce the evidence table; the validation registry evaluates the exact 19:30:30 UTC instant.',
          'Keep the external expected values separate from the site result. The downloadable benchmark CSV records expected, actual, delta, tolerance, and pass/fail so a dependency upgrade can be checked without silently changing the reference.',
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
    relatedTools: [
      {
        href: '/solar-azimuth-altitude',
        label: 'Use the Sun Position & Angle Calculator',
        description: 'Reproduce the inputs with your own location, date, and local time to inspect the result live.',
      },
    ],
    relatedGuides: [
      'how-to-read-a-sun-path-diagram',
      'estimating-shadow-direction-from-solar-angles',
      'golden-hour-direction-brisbane',
    ],
  },
  {
    slug: 'estimating-shadow-direction-from-solar-angles',
    evidenceKey: 'shadow-direction-model',
    contentTypeLabel: 'Shadow calculation table',
    csvDefinition: {
      filenameStem: 'perth-shadow-direction-model',
      description: 'Perth near-equinox bearings and theoretical shadow lengths for a two-metre vertical object from 08:00 to 16:00.',
      columns: ['date', 'local_time', 'object_height_m', 'solar_azimuth_deg', 'solar_altitude_deg', 'shadow_bearing_deg', 'shadow_length_m', 'availability'],
    },
    evidenceSources: [{
      label: 'NOAA Solar Calculation Details',
      url: 'https://gml.noaa.gov/grad/solcalc/calcdetails.html',
      note: 'Independent background on solar azimuth and elevation conventions; NOAA does not endorse this site.',
    }],
    title: 'Estimating Shadow Direction from Solar Angles',
    description:
      'Calculate a Perth shadow bearing and length step by step from solar azimuth, altitude, and a two-metre object height.',
    author: 'Solar Path Tracker',
    publishedDate: '2026-08-12',
    modifiedDate: '2026-09-06',
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
      title: 'Two-metre shadow bearings through a Perth near-equinox day',
      description:
        'The fixed Perth reference samples five local times. Shadow bearing and a two-metre level-ground length are derived only when solar altitude is above zero.',
      locationName: 'Perth, Western Australia, Australia',
      latitude: -31.9523,
      longitude: 115.8613,
      timezone: 'Australia/Perth',
      dates: [
        {
          label: 'March equinox reference',
          dateISO: '2026-03-20',
          localTimes: ['08:00', '10:00', '12:00', '14:00', '16:00'],
        },
      ],
      chartDateISO: '2026-03-20',
      chartView: 'altitude',
      interpretation: [
        'The Perth shadow bearings remain opposite their corresponding solar bearings and rotate as the Sun crosses the sky. Morning shadows extend toward the western side; afternoon shadows extend toward the eastern side.',
        'The shortest calculated two-metre-object shadow occurs near the highest sampled altitude. The 08:00 and 16:00 values are longer because rays meet level ground more obliquely.',
        'A row with altitude at or below zero never receives a shadow length. The data contract uses an unavailable state instead of a negative or fabricated distance.',
      ],
    },
    applicationCase: {
      task: 'Calculate the direction and level-ground length of a two-metre post’s shadow at 10:00 in Perth, then compare it with morning, noon, and afternoon results.',
      assumptions: [
        'The object is vertical, two metres high, and meets approximately level ground at a right angle.',
        'Direct sunlight reaches the object without terrain, buildings, trees, or other obstructions.',
        'The calculation describes hard geometric direction and length; diffuse light, penumbra, and surface slope are outside the model.',
        'When solar altitude is 0° or lower, this model returns no shadow bearing or length.',
      ],
      reproduction: {
        toolHref: '/solar-azimuth-altitude',
        toolLabel: 'Open the Sun Position & Angle Calculator',
        steps: [
          'Enter the coordinates and date shown in the case inputs, then set the local time to 10:00.',
          'Copy the displayed azimuth and altitude into the two formulas shown in the worked calculation.',
          'Reverse the azimuth for the shadow bearing and divide object height by the tangent of altitude for length.',
          'Stop if altitude is at or below zero, or if the real site does not satisfy the stated assumptions.',
        ],
      },
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
    relatedTools: [
      {
        href: '/solar-azimuth-altitude',
        label: 'Calculate sun position and direction',
        description: 'Use the live azimuth and altitude result as the starting point for a simple shadow-direction check.',
      },
    ],
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
