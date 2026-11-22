/* ============================================================================
   Barks & Purrs Co. — STORE CATALOGUE (structured, editable data source)
   ----------------------------------------------------------------------------
   ⚠ SAMPLE DATA. Names, prices (EGP), sizes, materials, popularity and dates are
   placeholders for the prototype and must be replaced with the house's confirmed
   catalogue. Metal finishes are described as "gold-tone" / "silver-tone" because
   the metal content has not been confirmed.

   To add a product: append an object to PRODUCTS. To add or remove a category:
   edit CATEGORIES (a category with no products is hidden automatically).
   Images live in img/<id>.webp, videos in vid/<id>.mp4 (+ .webp poster).
   ========================================================================== */
window.BP_CATALOG = (function () {
  const CATEGORIES = [
    { id: 'collars-leads', name: 'Collars & Leads', img: 'p26', blurb: 'Full-grain leather, made to their measurements.' },
    { id: 'tags', name: 'Personalised Tags', img: 'p02', blurb: 'Their name on the front. Yours on the reverse.' },
    { id: 'apparel', name: 'Apparel & Bandanas', img: 'p27', blurb: 'Cotton, satin and knit, cut for comfort.' },
    { id: 'beds', name: 'Beds & Comfort', img: 'p05', blurb: 'Somewhere soft to land.' },
    { id: 'play', name: 'Play & Enrichment', img: 't01', blurb: 'Made to be chased, tugged and carried.' },
    { id: 'feeding', name: 'Feeding Accessories', img: 'p20', blurb: 'Bowls sized for whiskers and appetites.' },
    { id: 'travel', name: 'Travel', img: 'p28', blurb: 'For journeys long and short.' },
    { id: 'grooming', name: 'Grooming & Care', img: 'p04', blurb: 'Rituals for coats, paws and noses.' },
    { id: 'gifts', name: 'Gifts & Sets', img: 'p24', blurb: 'Considered together, boxed by the house.' }
  ];

  const MATERIALS = ['Leather', 'Metal finish', 'Velvet', 'Cotton', 'Knit & corduroy', 'Rubber', 'Steel', 'Mixed'];
  const C = { emerald: { name: 'Emerald', hex: '#163028' }, saddle: { name: 'Saddle', hex: '#6e4428' }, ivory: { name: 'Ivory', hex: '#F5EFE2' }, ink: { name: 'Ink', hex: '#17130F' }, gold: { name: 'Gold-tone', hex: '#C3984C' }, silver: { name: 'Silver-tone', hex: '#9AA1A3' }, stone: { name: 'Stone', hex: '#cbbfa8' }, 'em-iv': { name: 'Emerald & Ivory', hex: 'linear-gradient(90deg,#163028 50%,#F5EFE2 50%)' } };
  const col = (...k) => k.map((x) => C[x]);
  const P = (o) => Object.assign({ gallery: [], sizes: [], colours: [], video: '', personalise: null, availability: 'ready', bundle: null, hover: null }, o);

  const PRODUCTS = [
    P({ id: 'estate-collar', name: 'The Estate Collar', nature: ['dog'], category: 'collars-leads', price: 3450, img: 'p26', hover: 'p02', gallery: ['p26', 'p02', 'p08'], material: 'Leather', detail: 'Full-grain leather · gold-tone or silver-tone hardware', desc: 'The everyday classic: a 25 mm full-grain leather collar with an engraved tag, made to their measurements.', craft: 'Edges are bevelled and burnished by hand; the tag is engraved with their name and struck with the house hallmark.', colours: col('emerald', 'saddle', 'ivory', 'ink'), sizes: ['XS', 'S', 'M', 'L', 'XL'], care: 'Wipe with a soft, dry cloth. Condition every few months.', personalise: 'estate', availability: 'made', added: '2026-05-02', pop: 98 }),
    P({ id: 'heritage-collar', name: 'The Heritage Wide Collar', nature: ['dog'], category: 'collars-leads', price: 3900, img: 'p25', hover: 'p26', gallery: ['p25', 'p26'], material: 'Leather', detail: 'Full-grain leather, 40 mm · embossed symbol', desc: 'A broader collar for larger breeds, with the ampersand embossed at the front.', craft: 'Cut wider for even pressure on strong necks; stitched with waxed thread along both edges.', colours: col('emerald', 'saddle', 'ink'), sizes: ['M', 'L', 'XL'], care: 'Wipe clean. Condition regularly.', personalise: 'heritage', availability: 'made', added: '2026-04-11', pop: 71 }),
    P({ id: 'signature-cat-collar', name: 'The Signature Cat Collar', nature: ['cat'], category: 'collars-leads', price: 2950, img: 'p03', hover: 'p32', gallery: ['p03', 'p32'], material: 'Leather', detail: 'Soft leather, 12 mm · quick-release safety buckle', desc: 'A slim collar with a breakaway safety buckle and an engraved tag.', craft: 'The quick-release buckle opens under pressure, so a curious cat is never caught.', colours: col('ivory', 'emerald', 'saddle', 'ink'), sizes: ['S', 'M', 'L'], care: 'Wipe with a dry cloth. Check the fit every few weeks.', personalise: 'signature', availability: 'made', added: '2026-05-20', pop: 94 }),
    P({ id: 'estate-lead', name: 'Estate Lead & Pouch', nature: ['dog'], category: 'collars-leads', price: 3200, img: 'p16', hover: 'p23', gallery: ['p16', 'p23'], video: 'leash', material: 'Leather', detail: 'Full-grain leather · gold-tone clasp', desc: 'A matching leather lead with a clip-on pouch for the essentials.', craft: 'The pouch clips to the lead or to a belt, and holds treats, keys or bags.', colours: col('emerald'), sizes: ['120 cm', '150 cm'], care: 'Wipe clean. Condition regularly.', added: '2026-03-15', pop: 88 }),
    P({ id: 'ivory-lead', name: 'Ivory Rope Lead', nature: ['dog'], category: 'collars-leads', price: 2400, img: 'p21', gallery: ['p21'], material: 'Cotton', detail: 'Braided cord · gold-tone clasp', desc: 'A braided rope lead, presented in the house box.', craft: 'Braided for a soft hand-feel that does not burn when they pull.', colours: col('ivory'), sizes: ['150 cm'], care: 'Spot clean.', added: '2026-02-01', pop: 52 }),
    P({ id: 'name-tag', name: 'Engraved Name Tag', nature: ['dog', 'cat'], category: 'tags', price: 1850, img: 'p02', hover: 'p03', gallery: ['p02', 'p03', 'p32'], material: 'Metal finish', detail: 'Gold-tone or silver-tone finish · bone, round or oval', desc: 'Their name on the front, your details on the reverse. For a collar they already love.', craft: 'Engraved, not printed, then struck on the reverse with the house hallmark.', colours: col('gold', 'silver'), care: 'Polish gently with a soft cloth.', personalise: 'tag', availability: 'made', added: '2026-05-28', pop: 100 }),
    P({ id: 'ivory-bandana', name: 'The Ivory Bandana', nature: ['dog', 'cat'], category: 'apparel', price: 1150, img: 'p27', hover: 'p30', gallery: ['p27', 'p30'], video: 'cat-groom', material: 'Cotton', detail: 'Cotton twill · printed house name', desc: 'A soft cotton bandana printed with the house name.', craft: 'Cut on the bias so it drapes rather than sits.', colours: col('ivory'), sizes: ['S', 'M', 'L'], care: 'Machine wash cold.', added: '2026-04-28', pop: 83 }),
    P({ id: 'estate-bandana', name: 'The Estate Bandana', nature: ['dog'], category: 'apparel', price: 1250, img: 'p17', gallery: ['p17'], video: 'dachshund', material: 'Cotton', detail: 'Satin weave · ampersand pattern', desc: 'An emerald bandana patterned with the symbol.', craft: 'A satin weave with a soft sheen, hemmed on all sides.', colours: col('emerald'), sizes: ['S', 'M', 'L'], care: 'Hand wash cold.', added: '2026-03-30', pop: 76 }),
    P({ id: 'cable-knit', name: 'Cable Knit Jumper', nature: ['dog'], category: 'apparel', price: 3200, img: 'p01', gallery: ['p01'], video: 'dog-chair', material: 'Knit & corduroy', detail: 'Wool blend · roll neck', desc: 'A roll-neck cable knit for cooler Cairo evenings.', craft: 'Knitted with a deep roll neck and a short back for easy walking.', colours: col('ivory'), sizes: ['XS', 'S', 'M', 'L'], care: 'Hand wash cold. Dry flat.', added: '2026-06-02', pop: 67 }),
    P({ id: 'velvet-bed', name: 'The Velvet Round Bed', nature: ['cat', 'dog'], category: 'beds', price: 6800, img: 'p05', hover: 'p34', gallery: ['p05'], video: 'cat-bed2', material: 'Velvet', detail: 'Cotton velvet · removable cushion', desc: 'A deep, bolstered bed in emerald velvet, embroidered with the house name.', craft: 'High bolsters to lean on, a removable cushion, and the name embroidered at the front.', colours: col('emerald'), sizes: ['S', 'M', 'L'], care: 'Remove the cover and hand wash cold.', added: '2026-01-20', pop: 91 }),
    P({ id: 'atelier-lounger', name: 'The Atelier Lounger', nature: ['cat', 'dog'], category: 'beds', price: 14500, img: 'p33', hover: 'p34', gallery: ['p33', 'p34'], material: 'Velvet', detail: 'Velvet upholstery · gold-tone legs', desc: 'A raised velvet lounger on brushed gold-tone legs, for cats and small dogs.', craft: 'A furniture piece first: upholstered over a solid frame and raised off cool floors.', colours: col('emerald'), sizes: ['One size'], care: 'Vacuum gently. Spot clean.', availability: 'made', added: '2026-06-10', pop: 64 }),
    P({ id: 'ampersand-plush', name: 'The Ampersand Plush', nature: ['dog', 'cat'], category: 'play', price: 1450, img: 't07', hover: 't05', gallery: ['t07', 't05', 't06', 't04'], video: 'paw-ball', material: 'Knit & corduroy', detail: 'Emerald corduroy · name stitched on the label', desc: 'Our symbol in emerald corduroy, ears and all. Made to order, with their name stitched on the label.', craft: 'Cut and sewn in corduroy, filled softly enough to sleep on, with a woven label for their name.', colours: col('emerald'), sizes: ['Small', 'Large'], care: 'Hand wash cold. Reshape and air dry.', personalise: 'label', availability: 'made', added: '2026-09-25', pop: 97 }),
    P({ id: 'ampersand-tug', name: 'The Ampersand Rope Tug', nature: ['dog'], category: 'play', price: 1250, img: 't02', hover: 't01', gallery: ['t02', 't01', 't03'], material: 'Knit & corduroy', detail: 'Chunky knit · cotton rope tail', desc: 'A chunky knit ampersand with a cotton rope tail, for tugging and carrying.', craft: 'A dense knit that holds its shape, with a knotted cotton rope for grip.', colours: col('em-iv'), sizes: ['One size'], care: 'Hand wash. Replace when worn.', added: '2026-09-25', pop: 86 }),
    P({ id: 'signature-ball', name: 'The Signature Ball', nature: ['dog'], category: 'play', price: 650, img: 'p19', gallery: ['p19'], material: 'Rubber', detail: 'Natural rubber · embossed panels', desc: 'A panelled ball marked with the symbol. Soft to carry, made to be chased.', craft: 'Soft enough on the mouth, bouncy enough to be worth chasing.', colours: col('ivory'), sizes: ['S', 'M'], care: 'Rinse with warm water.', added: '2026-02-14', pop: 79 }),
    P({ id: 'gold-bowl', name: 'The Gilded Bowl', nature: ['cat'], category: 'feeding', price: 2750, img: 'p20', gallery: ['p20'], material: 'Steel', detail: 'Stainless steel, gold-tone finish', desc: 'A shallow bowl sized for whiskers, the symbol at its base.', craft: 'Shallow and wide to avoid whisker fatigue; weighted so it stays put.', colours: col('gold'), care: 'Hand wash.', added: '2026-04-02', pop: 81 }),
    P({ id: 'silver-bowl', name: 'The Silver Bowl', nature: ['dog'], category: 'feeding', price: 2450, img: 'p31', gallery: ['p31'], material: 'Steel', detail: 'Stainless steel · weighted base', desc: 'A weighted steel bowl that stays where it is put.', craft: 'A weighted base and a non-slip ring underneath.', colours: col('silver'), sizes: ['M', 'L'], care: 'Dishwasher safe.', added: '2026-04-02', pop: 69 }),
    P({ id: 'double-feeder', name: 'The Double Feeder', nature: ['cat', 'dog'], category: 'feeding', price: 4600, img: 'p29', gallery: ['p29'], material: 'Mixed', detail: 'Composite stand · gold-tone bowls', desc: 'Two gold-tone bowls set in a stone-coloured stand.', craft: 'Raised for a better posture at mealtimes; the bowls lift out to wash.', colours: col('stone'), care: 'Bowls lift out for washing.', added: '2026-05-08', pop: 60 }),
    P({ id: 'carrier', name: 'The Travel Carrier', nature: ['cat', 'dog'], category: 'travel', price: 8900, img: 'p28', gallery: ['p28'], material: 'Mixed', detail: 'Coated canvas · leather handles', desc: 'A structured carrier with ventilated sides and leather handles.', craft: 'Holds its shape when lifted, with mesh panels on three sides.', colours: col('emerald'), care: 'Wipe clean.', added: '2026-03-01', pop: 58 }),
    P({ id: 'car-bed', name: 'Velvet Car Seat Bed', nature: ['dog', 'cat'], category: 'travel', price: 5900, img: 'p09', gallery: ['p09'], material: 'Velvet', detail: 'Velvet · seat-belt straps', desc: 'A cushioned seat bed that straps into the back seat.', craft: 'Straps around the headrest and through the seat belt to stay level.', colours: col('emerald'), care: 'Removable cover, hand wash.', added: '2026-03-01', pop: 55 }),
    P({ id: 'signature-comb', name: 'The Signature Comb', nature: ['cat', 'dog'], category: 'grooming', price: 950, img: 'p04', gallery: ['p04'], material: 'Steel', detail: 'Brushed steel · engraved spine', desc: 'A fine-toothed comb with an engraved spine, for long and medium coats.', craft: 'Rounded tips that glide rather than scratch.', colours: col('silver'), care: 'Wash and dry after use.', added: '2026-01-10', pop: 90 }),
    P({ id: 'grooming-canister', name: 'Grooming Canister Set', nature: ['cat', 'dog'], category: 'grooming', price: 4200, img: 'p07', hover: 'p12', gallery: ['p07', 'p12'], material: 'Mixed', detail: 'Wood, natural bristle, steel · leather canister', desc: 'Brush, comb and trimming essentials in a lidded leather canister.', craft: 'Everything for a weekly ritual, in one lidded canister.', colours: col('emerald'), care: 'Clean tools after each use.', added: '2026-02-20', pop: 62 }),
    P({ id: 'paw-balm', name: 'Paw & Nose Balm', nature: ['dog'], category: 'grooming', price: 780, img: 'p11', gallery: ['p11'], material: 'Mixed', detail: 'Balm stick · ingredients on packaging', desc: 'A balm stick for paws after long walks.', craft: 'A twist-up stick that goes on without mess.', care: 'Store below 25°C.', added: '2026-02-20', pop: 74 }),
    P({ id: 'comfort-balm', name: 'The Comfort Balm', nature: ['cat', 'dog'], category: 'grooming', price: 890, img: 'p37', gallery: ['p37'], material: 'Mixed', detail: 'Glass jar · ingredients on packaging', desc: 'A soothing balm in a glass jar.', craft: 'A small jar for dry spots, kept on the shelf by the door.', care: 'Store below 25°C.', added: '2026-02-20', pop: 57 }),
    P({ id: 'welcome-set-dog', name: 'The Welcome Home Set · Dog', nature: ['dog'], category: 'gifts', price: 6900, img: 'p08', gallery: ['p08', 't07', 'p31'], material: 'Mixed', detail: 'Three pieces, boxed', desc: 'Estate Collar (personalised after purchase), Ampersand Plush and Silver Bowl, boxed together.', craft: 'Presented in the house box with a handwritten card.', care: 'See individual pieces.', bundle: ['estate-collar', 'ampersand-plush', 'silver-bowl'], added: '2026-06-15', pop: 73 }),
    P({ id: 'welcome-set-cat', name: 'The Welcome Home Set · Cat', nature: ['cat'], category: 'gifts', price: 6600, img: 'p35', gallery: ['p35', 't05', 'p20'], material: 'Mixed', detail: 'Three pieces, boxed', desc: 'Signature Cat Collar (personalised after purchase), Ampersand Plush and Gilded Bowl, boxed together.', craft: 'Presented in the house box with a handwritten card.', care: 'See individual pieces.', bundle: ['signature-cat-collar', 'ampersand-plush', 'gold-bowl'], added: '2026-06-15', pop: 70 }),
    P({ id: 'birthday-box', name: 'The Birthday Box', nature: ['dog', 'cat'], category: 'gifts', price: 3400, img: 'p24', gallery: ['p24', 'p13', 't07'], material: 'Mixed', detail: 'Ribboned house box · handwritten card', desc: 'Ampersand Plush, Ivory Bandana and a handwritten card, ribboned in the house box.', craft: 'Tied with house ribbon; the card is written by hand.', care: 'See individual pieces.', bundle: ['ampersand-plush', 'ivory-bandana'], added: '2026-08-30', pop: 84 }),
    P({ id: 'walk-set', name: 'The Walk Set', nature: ['dog'], category: 'gifts', price: 4300, img: 'p23', gallery: ['p23', 'p16', 'p19'], material: 'Mixed', detail: 'Three pieces, boxed', desc: 'Estate Lead & Pouch, Signature Ball and Paw & Nose Balm.', craft: 'Everything for the walk, in one box.', care: 'See individual pieces.', bundle: ['estate-lead', 'signature-ball', 'paw-balm'], added: '2026-07-04', pop: 66 }),
    P({ id: 'grooming-ritual', name: 'The Grooming Ritual', nature: ['cat', 'dog'], category: 'gifts', price: 5600, img: 'p12', gallery: ['p12', 'p04', 'p37'], material: 'Mixed', detail: 'Three pieces, boxed', desc: 'Grooming Canister Set, Signature Comb and Comfort Balm.', craft: 'A weekly ritual, gift-boxed.', care: 'See individual pieces.', bundle: ['grooming-canister', 'signature-comb', 'comfort-balm'], added: '2026-07-04', pop: 59 })
  ];

  /* Saddle and Stone are real product material colours (catalogue data), not interface colours.
     Personalisation configurator — only options the catalogue offers. */
  const CONFIG = {
    types: {
      dog: [
        { id: 'estate', product: 'estate-collar', name: 'The Estate Collar', width: '25 mm', img: 'p26', base: 3450, note: 'The everyday classic', collar: true },
        { id: 'heritage', product: 'heritage-collar', name: 'The Heritage Wide Collar', width: '40 mm', img: 'p25', base: 3900, note: 'For larger breeds', collar: true, sizes: ['M', 'L', 'XL'], leathers: ['emerald', 'saddle', 'ink'] },
        { id: 'tag', product: 'name-tag', name: 'Engraved Name Tag', width: '', img: 'p02', base: 1850, note: 'For a collar they already love', collar: false }
      ],
      cat: [
        { id: 'signature', product: 'signature-cat-collar', name: 'The Signature Cat Collar', width: '12 mm', img: 'p03', base: 2950, note: 'Quick-release safety buckle', collar: true },
        { id: 'tag', product: 'name-tag', name: 'Engraved Name Tag', width: '', img: 'p03', base: 1850, note: 'For a collar they already love', collar: false }
      ]
    },
    sizes: { dog: [['XS', 20, 26], ['S', 26, 32], ['M', 32, 40], ['L', 40, 48], ['XL', 48, 56]], cat: [['S', 18, 22], ['M', 22, 26], ['L', 26, 30]] },
    leathers: [
      { id: 'emerald', name: 'Emerald', hex: '#163028', edge: '#17130F', stitch: '#C3984C' },
      { id: 'saddle', name: 'Saddle', hex: '#6e4428', edge: '#17130F', stitch: '#FCEFD5' },
      { id: 'ivory', name: 'Ivory', hex: '#F5EFE2', edge: '#9AA1A3', stitch: '#9AA1A3' },
      { id: 'ink', name: 'Ink', hex: '#17130F', edge: '#17130F', stitch: '#9AA1A3' }
    ],
    finishes: [
      { id: 'gold', name: 'Gold-tone', add: 1200, desc: 'Gold-tone tag, buckle, D-ring and keeper.' },
      { id: 'silver', name: 'Silver-tone', add: 600, desc: 'Silver-tone tag, buckle, D-ring and keeper.' }
    ],
    tags: { dog: [{ id: 'bone', name: 'Bone' }, { id: 'round', name: 'Round' }, { id: 'oval', name: 'Hallmark oval' }], cat: [{ id: 'round', name: 'Round' }, { id: 'oval', name: 'Hallmark oval' }] },
    contactAdd: 250, nameMax: 12, lineMax: 20, labelMax: 12
  };


  /* Detail hotspots, keyed by image id. x / y are % positions on the photograph; z is the zoom used
     by the detail viewers. Copy only restates materials listed in the catalogue above. */
  const HOTSPOTS = {
    p02: [
      { x: 31, y: 47, z: 2.3, t: 'Full-grain leather', d: 'Cut from full-grain leather, edges bevelled and burnished by hand.' },
      { x: 10, y: 47, z: 2.8, t: 'The buckle', d: 'Gold-tone buckle, D-ring and keeper, matched to the tag.' },
      { x: 64, y: 52, z: 2.4, t: 'The house name', d: 'Barks & Purrs Co., debossed into the leather.' },
      { x: 37, y: 66, z: 2.9, t: 'The engraving', d: 'Their name engraved, not printed, on a bone tag.' }
    ],
    p26: [
      { x: 52, y: 39, z: 2.6, t: 'Hardware', d: 'Gold-tone rivets and buckle, set by hand.' },
      { x: 46, y: 60, z: 2.2, t: 'Debossed name', d: 'The house name pressed into the leather.' },
      { x: 30, y: 72, z: 2.5, t: 'Burnished edge', d: 'Bevelled and burnished so the edge stays smooth.' }
    ],
    p03: [
      { x: 16, y: 47, z: 2.8, t: 'Safety buckle', d: 'A quick-release buckle that opens under pressure.' },
      { x: 55, y: 49, z: 2.6, t: 'The symbol', d: 'Our ampersand, embossed at the front.' },
      { x: 54, y: 64, z: 2.8, t: 'The tag', d: 'Silver-tone, engraved with their name.' }
    ],
    p16: [
      { x: 25, y: 79, z: 2.6, t: 'Gold-tone clasp', d: 'A trigger clasp that clips to any D-ring.' },
      { x: 25, y: 45, z: 2.2, t: 'The pouch', d: 'Clips to the lead or a belt; holds treats, keys or bags.' },
      { x: 88, y: 55, z: 2.4, t: 'Stitched lead', d: 'Full-grain leather, stitched along both edges.' }
    ],
    p05: [
      { x: 60, y: 84, z: 2.4, t: 'Embroidered name', d: 'The house name, embroidered at the front.' },
      { x: 24, y: 76, z: 2.2, t: 'Velvet bolster', d: 'Cotton velvet over high bolsters to lean on.' }
    ],
    t07: [
      { x: 83, y: 66, z: 2.8, t: 'Their label', d: 'A woven label, stitched with their name.' },
      { x: 30, y: 42, z: 2.2, t: 'Corduroy', d: 'Emerald corduroy, cut and sewn.' },
      { x: 76, y: 22, z: 2.4, t: 'Two natures', d: 'One ear for the dogs, one for the cats.' }
    ],
    p20: [
      { x: 55, y: 80, z: 2.4, t: 'The symbol', d: 'The ampersand at the base of a shallow, whisker-friendly bowl.' }
    ],
    p25: [
      { x: 60, y: 34, z: 2.4, t: 'Embossed symbol', d: 'The ampersand, embossed at the front.' },
      { x: 40, y: 47, z: 2.4, t: 'Wide cut', d: '40 mm of full-grain leather for strong necks.' }
    ]
  };

  /* Integration points — all null in the prototype. */
  const INTEGRATIONS = {
    currency: 'EGP',
    inventory: null,   // e.g. Shopify Storefront API / headless commerce stock levels
    shipping: null,    // carrier rates & delivery estimates (no estimates are shown until configured)
    payments: null,    // payment provider (e.g. Paymob / Stripe) — checkout is a demo until connected
    orders: null,      // order management / fulfilment
    newsletter: null,  // email platform
    discounts: null    // no discount codes are offered until a real system exists
  };

  return { CATEGORIES, MATERIALS, PRODUCTS, CONFIG, INTEGRATIONS, HOTSPOTS };
})();
