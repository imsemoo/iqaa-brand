// The Sufra demo world (fictional): its published line, the people who work it and the jobs on it on Sunday
// 1 November. Shared by the Line and Today screens, so both show the same line and the same jobs.
(function () {
  let n = 0;
  const step = (kind, name, who, check) => Object.assign({ id: `s${++n}`, kind, name, who }, check ? { check } : {});

  // version 3: the catering template's stations, a way back for a client's change, and a branch for big orders
  function line() {
    return {
      stations: [
        { id: 'request', name: 'Request', steps: [
          step('struck', 'Reem logs the order', 'Reem', ['Date, time and address', 'Number of people', 'Who to call on the day']),
          step('run', 'Send the client a receipt', 'Send')] },
        { id: 'quote', name: 'Quote', steps: [
          step('held', 'Watar drafts the quote', 'Reem'),
          step('struck', 'Reem checks the prices', 'Reem', ['Prices match the November list', 'Delivery is on the quote', 'Plates and cutlery are counted']),
          step('run', 'Send the quote link', 'Send')] },
        { id: 'approval', name: 'Client approval', steps: [step('held', 'The client approves', 'The client'), step('rest', 'Wait two days', 'Two days'), step('run', 'Remind the client', 'Remind')] },
        { id: 'buy', name: 'Buy materials', steps: [
          step('run', 'Create the shopping list', 'Create'),
          step('struck', 'Buy the materials', 'Hala', ['Everything on the list is bought', 'Receipts are photographed'])] },
        { id: 'prepare', name: 'Prepare', steps: [
          step('run', 'Remind the kitchen a day before', 'Remind'),
          step('struck', 'Salma prepares', 'Salma', ['The menu matches the approved quote', 'Allergies are labelled', 'Packed and counted'])] },
        { id: 'deliver', name: 'Deliver', steps: [
          step('run', 'Send the arrival time', 'Send'),
          step('struck', 'Yusuf delivers', 'Yusuf', ['Arrived on time', 'The client signed for it'])] },
        { id: 'invoice', name: 'Invoice', steps: [step('run', 'Create the invoice', 'Create'), step('run', 'Send the invoice', 'Send')] },
      ],
      routes: [
        { id: 'back1', type: 'back', from: 'approval', to: 'quote', when: 'The client asks for a change' },
        { id: 'branch1', type: 'branch', from: 'approval', to: 'prepare', over: 30, stations: [
          { id: 'wholesale', name: 'Wholesale order', steps: [
            step('struck', 'Hala orders from the wholesaler', 'Hala', ['The order is placed', 'Delivery day is confirmed']),
            step('rest', 'Wait for the delivery', 'A day')] }] },
      ],
    };
  }

  const people = {
    reem: { name: 'Reem', role: 'Quotes and new orders' },
    salma: { name: 'Salma', role: 'Kitchen' },
    yusuf: { name: 'Yusuf', role: 'Delivery' },
    hala: { name: 'Hala', role: 'Owner, buying' },
  };

  // where each job stands: its station and the index of the step it is on
  const jobs = [
    { code: 'SFR-26-0031', title: 'Lunch for Nakhla', people: 40, due: 'Thu 5 Nov, 13:00', iso: '2026-11-05T13:00', client: 'Maha', of: 'Nakhla Co.', at: 'quote', step: 0,
      draft: { items: ['Musakhan rolls', 'Maqluba with chicken', 'Three salads', 'Kunafa trays'], note: 'Delivered at 12:30, with plates and cutlery for 40.', total: '[TOTAL]' } },
    { code: 'SFR-26-0034', title: 'Board breakfast', people: 12, due: 'Tue 3 Nov, 08:30', iso: '2026-11-03T08:30', client: 'Rami', of: 'Wadi Partners', at: 'quote', step: 0,
      draft: { items: ['Manakish, zaatar and cheese', 'Labneh and olives', 'Fruit', 'Coffee and tea'], note: 'Set up by 08:15 in their meeting room.', total: '[TOTAL]' } },
    { code: 'SFR-26-0032', title: 'Graduation dinner', people: 25, due: 'Sat 7 Nov, 19:00', iso: '2026-11-07T19:00', client: 'Aseel Haddad', of: 'a private order', at: 'quote', step: 1 },
    { code: 'SFR-26-0035', title: 'Engagement lunch', people: 60, due: 'Fri 13 Nov, 14:00', iso: '2026-11-13T14:00', client: 'Lina Saleh', of: 'a private order', at: 'request', step: 1 },
    { code: 'SFR-26-0030', title: 'Office lunch', people: 18, due: 'Mon 2 Nov, 12:30', iso: '2026-11-02T12:30', client: 'Omar', of: 'Darb Studio', at: 'approval', step: 1 },
    { code: 'SFR-26-0029', title: 'Wedding lunch', people: 120, due: 'Sat 14 Nov, 13:00', iso: '2026-11-14T13:00', client: 'Huda Nasser', of: 'a private order', at: 'wholesale', step: 0 },
    { code: 'SFR-26-0028', title: 'Family dinner', people: 30, due: 'Mon 2 Nov, 20:00', iso: '2026-11-02T20:00', client: 'Sami Khoury', of: 'a private order', at: 'prepare', step: 1 },
    { code: 'SFR-26-0027', title: 'Meetup coffee break', people: 24, due: 'Sun 1 Nov, 16:00', iso: '2026-11-01T16:00', client: 'Yara', of: 'Majal Hub', at: 'deliver', step: 1 },
    { code: 'SFR-26-0033', title: 'Charity dinner', people: 70, due: 'Thu 12 Nov, 19:30', iso: '2026-11-12T19:30', client: 'Rania Odeh', of: 'Hayat Association', at: 'approval', step: 0 },
    { code: 'SFR-26-0026', title: 'Book launch reception', people: 50, due: 'Sat 31 Oct, 18:00', iso: '2026-10-31T18:00', client: 'Karim', of: 'Dar Qalam', at: 'invoice', step: 1 },
    { code: 'SFR-26-0025', title: 'Clinic team lunch', people: 22, due: 'Thu 29 Oct, 13:00', iso: '2026-10-29T13:00', client: 'Dr Nadia', of: 'Al-Shifa Clinic', finished: 'Thu 29 Oct, 16:40' },
    { code: 'SFR-26-0024', title: 'Birthday dinner', people: 15, due: 'Wed 28 Oct, 20:00', iso: '2026-10-28T20:00', client: 'Samer Haddad', of: 'a private order', finished: 'Thu 29 Oct, 10:15' },
    { code: 'SFR-26-0023', title: 'Workshop lunch', people: 35, due: 'Mon 26 Oct, 12:30', iso: '2026-10-26T12:30', client: 'Lama', of: 'Bina Studio', finished: 'Tue 27 Oct, 09:30' },
  ];
  // when each order came in: the order page spreads its finished steps between then and now
  const opened = { '0023': '2026-10-19T10:00', '0024': '2026-10-21T15:20', '0025': '2026-10-22T09:10', '0026': '2026-10-20T11:45',
    '0027': '2026-10-24T12:30', '0028': '2026-10-25T16:00', '0029': '2026-10-26T10:20', '0030': '2026-10-28T13:15', '0031': '2026-10-29T09:30',
    '0032': '2026-10-30T14:10', '0033': '2026-10-27T11:00', '0034': '2026-10-31T17:45', '0035': '2026-11-01T09:12' };
  jobs.forEach((j) => { j.opened = opened[j.code.slice(-4)]; });

  // what each person finished this morning, before the screen opened
  const done = [
    { who: 'Reem', code: 'SFR-26-0030', title: 'Office lunch', step: 'Reem checks the prices', time: '08:52', then: 'Iqaa sent the quote link to Omar', to: 'Client approval', kinds: ['struck', 'run'] },
    { who: 'Reem', code: 'SFR-26-0035', title: 'Engagement lunch', step: 'Reem logs the order', time: '09:20', then: 'Iqaa is sending Lina a receipt', to: '', kinds: ['struck', 'run'] },
    { who: 'Salma', code: 'SFR-26-0027', title: 'Meetup coffee break', step: 'Salma prepares', time: '09:05', then: 'Iqaa sent Yara the arrival time', to: 'Deliver', kinds: ['struck', 'run'] },
  ];

  window.SUFRA = { day: 'Sunday 1 November', dayIso: '2026-11-01', line, people, jobs, done };
})();
