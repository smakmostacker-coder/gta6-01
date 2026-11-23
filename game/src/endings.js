// Multiple endings: the finale resolves from the choices Vera made and the way she played.
// Six endings, decided in priority order by resolveEnding: a betrayal always surfaces first,
// then a record of busts, then ruthless wealth, then a spotless ghost run, then empty pockets,
// and finally the clean getaway a fair, loyal Vera earns.
export const ENDINGS = [
  {
    id: 'clean', name: 'CLEAN GETAWAY', tag: 'GOOD ENDING', color: '#55efc4',
    lines: [
      'The ledger burns in a beach fire pit while Lucia pours two drinks.',
      'Debts settled, cut shared fairly, name intact - Vera walks out of the life she owed,',
      'or stays in it on her own terms. Palm Cove keeps spinning, and for once it owes HER.',
    ],
  },
  {
    id: 'kingpin', name: 'KINGPIN OF PALM COVE', tag: 'POWER ENDING', color: '#fdcb6e',
    lines: [
      'Lucia reads the body count and the bank balance, and quietly steps aside.',
      'The docks, the bookies, the taxi ranks - they all answer to Vera Solano now.',
      'She came to Palm Cove owing money. She ends up owning the cove.',
    ],
  },
  {
    id: 'betrayed', name: 'BETRAYED', tag: 'BAD ENDING', color: '#ff7675',
    lines: [
      'Dante Vale never pays traitors twice. The bag was a plant, the money is marked,',
      'and Lucia - who always knows - lets the police find Vera holding all of it.',
      'A deal with a rival is a loan, and Palm Cove always collects.',
    ],
  },
  {
    id: 'busted', name: 'BUSTED FOR GOOD', tag: 'BAD ENDING', color: '#74b9ff',
    lines: [
      'One bust too many. This time there is no $150 walk-free: the judge has Vera\'s',
      'whole highlight reel, and Palm Cove PD finally gets its favourite courier',
      'a long stay at the county facility up the coast. The sunset looks great from the yard.',
    ],
  },
  {
    id: 'ghost', name: 'GHOST', tag: 'LEGEND ENDING', color: '#dfe6e9',
    lines: [
      'No bodies. No busts. No footage worth a frame. Detectives will argue for years',
      'about whether the courier who emptied Palm Cove\'s underworld ever existed.',
      'Lucia just smiles: "What courier?" Vera was never here.',
    ],
  },
  {
    id: 'broke', name: 'BROKE AND BURNED', tag: 'BAD ENDING', color: '#e17055',
    lines: [
      'Square with Lucia - and flat broke. Fines, fees and one too many hospital',
      'breakfasts ate every dollar the jobs ever paid. Vera leaves Palm Cove the way',
      'she arrived: on foot, in debt to the bus driver, under a beautiful sunset.',
    ],
  },
];

export function endingById(id) { return ENDINGS.find((e) => e.id === id) || ENDINGS[0]; }

// Decide the ending from tracked choices (game.choices) and lifetime stats (game.stats).
export function resolveEnding(game) {
  const s = game.stats, c = game.choices;
  if (c.rivalDeal) return endingById('betrayed');
  if (s.busts >= 2) return endingById('busted');
  if (s.kills >= 3 && game.player.money >= 1800) return endingById('kingpin');
  if (s.kills === 0 && s.busts === 0 && c.sparedRico) return endingById('ghost');
  if (game.player.money < 400) return endingById('broke');
  return endingById('clean');
}

// One-line summary of the record that produced an ending, shown on the ending screen.
export function endingRecordLine(game) {
  const s = game.stats, c = game.choices;
  const bits = [
    `$${s.earned} earned`, `${s.kills} taken out`, `${s.knockouts} knocked out`,
    `${s.busts} busts`, `${game.side.done} side jobs`,
    c.sparedRico ? 'Rico spared' : 'Rico not spared',
    c.sharedCut ? 'Lucia paid fairly' : 'Lucia shorted',
    c.rivalDeal ? 'Dante\'s deal taken' : 'Dante refused',
  ];
  return bits.join('  -  ');
}
