// The Sufra demo world (fictional): its published line, the people who work it, the jobs on it on Sunday
// 1 November, the orders before them and the clients they are for. Shared by every screen of the app, so all of
// them show the same line, the same jobs and the same history.
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
        // the line's own reminder carries the words it sends; jobs.js fill() writes in the order (Clients, Build and
        // Ask Watar all show this text)
        { id: 'approval', name: 'Client approval', steps: [step('held', 'The client approves', 'The client'), step('rest', 'Wait two days', 'Two days'),
          Object.assign(step('run', 'Remind the client', 'Remind'), { msg: 'Hi {client.name}, a reminder: Sufra’s quote for your {order.title} on {order.due} is waiting for your answer. Approve it or ask for a change: {quote.link}' })] },
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

  // `role` is what each person does (Overview and Today show it); `access` is what they may change in Settings: an
  // owner changes everything, billing included; a member does the steps the line gives them. Emails use the
  // reserved .example domain, as sign-up's demo does.
  const people = {
    reem: { name: 'Reem', role: 'Quotes and new orders', email: 'reem@sufra.example', access: 'member' },
    salma: { name: 'Salma', role: 'Kitchen', email: 'salma@sufra.example', access: 'member' },
    yusuf: { name: 'Yusuf', role: 'Delivery', email: 'yusuf@sufra.example', access: 'member' },
    hala: { name: 'Hala', role: 'Owner, buying', email: 'hala@sufra.example', access: 'owner' },
  };

  // where each job stands: its station and the index of the step it is on
  const jobs = [
    { code: 'SFR-26-0031', title: 'Lunch for Nakhla', people: 40, due: 'Thu 5 Nov, 13:00', iso: '2026-11-05T13:00', client: 'Maha', of: 'Nakhla Co.', at: 'quote', step: 0,
      asked: 'Two guests with no nuts',
      draft: { items: ['Musakhan rolls', 'Maqluba with chicken', 'Three salads', 'Kunafa trays'], note: 'Delivered at 12:30, with plates and cutlery for 40.', total: '[TOTAL]' } },
    { code: 'SFR-26-0034', title: 'Board breakfast', people: 12, due: 'Tue 3 Nov, 08:30', iso: '2026-11-03T08:30', client: 'Rami', of: 'Wadi Partners', at: 'quote', step: 0,
      draft: { items: ['Manakish, zaatar and cheese', 'Labneh and olives', 'Fruit', 'Coffee and tea'], note: 'Set up by 08:15 in their meeting room.', total: '[TOTAL]' } },
    { code: 'SFR-26-0032', title: 'Graduation dinner', people: 25, due: 'Sat 7 Nov, 19:00', iso: '2026-11-07T19:00', client: 'Aseel Haddad', of: 'a private order', at: 'quote', step: 1 },
    { code: 'SFR-26-0035', title: 'Engagement lunch', people: 60, due: 'Fri 13 Nov, 14:00', iso: '2026-11-13T14:00', client: 'Lina Saleh', of: 'a private order', at: 'request', step: 1 },
    { code: 'SFR-26-0030', title: 'Office lunch', people: 18, due: 'Mon 2 Nov, 12:30', iso: '2026-11-02T12:30', client: 'Omar', of: 'Darb Studio', at: 'approval', step: 0 },
    { code: 'SFR-26-0029', title: 'Wedding lunch', people: 120, due: 'Sat 14 Nov, 13:00', iso: '2026-11-14T13:00', client: 'Huda Nasser', of: 'a private order', at: 'wholesale', step: 0 },
    { code: 'SFR-26-0028', title: 'Family dinner', people: 30, due: 'Mon 2 Nov, 20:00', iso: '2026-11-02T20:00', client: 'Sami Khoury', of: 'a private order', at: 'prepare', step: 1 },
    { code: 'SFR-26-0027', title: 'Meetup coffee break', people: 24, due: 'Sun 1 Nov, 16:00', iso: '2026-11-01T16:00', client: 'Yara', of: 'Majal Hub', at: 'deliver', step: 1 },
    { code: 'SFR-26-0033', title: 'Charity dinner', people: 70, due: 'Thu 12 Nov, 19:30', iso: '2026-11-12T19:30', client: 'Rania Odeh', of: 'Hayat Association', at: 'approval', step: 0 },
    { code: 'SFR-26-0026', title: 'Book launch reception', people: 50, due: 'Sat 31 Oct, 18:00', iso: '2026-10-31T18:00', client: 'Karim', of: 'Dar Qalam', at: 'invoice', step: 1 },
    { code: 'SFR-26-0025', title: 'Clinic team lunch', people: 22, due: 'Thu 29 Oct, 13:00', iso: '2026-10-29T13:00', client: 'Dr Nadia', of: 'Al-Shifa Clinic', finished: 'Thu 29 Oct, 16:40' },
    { code: 'SFR-26-0024', title: 'Birthday dinner', people: 15, due: 'Wed 28 Oct, 20:00', iso: '2026-10-28T20:00', client: 'Samer Haddad', of: 'a private order', finished: 'Thu 29 Oct, 10:15' },
    { code: 'SFR-26-0023', title: 'Workshop lunch', people: 35, due: 'Mon 26 Oct, 12:30', iso: '2026-10-26T12:30', client: 'Lama', of: 'Bina Studio', finished: 'Tue 27 Oct, 09:30' },
  ];
  // when each order came in: the shared clock (jobs.js) writes the first step then, and spreads the rest up to now
  const opened = { '0023': '2026-10-19T10:00', '0024': '2026-10-21T15:20', '0025': '2026-10-22T09:10', '0026': '2026-10-20T11:45',
    '0027': '2026-10-24T12:30', '0028': '2026-10-25T16:00', '0029': '2026-10-26T10:20', '0030': '2026-10-28T13:15', '0031': '2026-10-29T09:30',
    '0032': '2026-10-30T14:10', '0033': '2026-10-27T11:00', '0034': '2026-10-31T17:45', '0035': '2026-11-01T09:12' };
  jobs.forEach((j) => { j.opened = opened[j.code.slice(-4)]; });

  // what passed between Sufra and each client. rounds: one per quote the client saw — sent; reminded (the line's
  // reminder, two days after sent, only when no answer came); answer; change (that answer asked for a change, so the
  // job went back to Quote). arrived: when Yusuf arrived; later than iso is late.
  const logs = {
    '0023': { rounds: [{ sent: '2026-10-20T11:30', answer: '2026-10-20T13:10' }], arrived: '2026-10-26T12:10' },
    '0024': { rounds: [{ sent: '2026-10-22T12:00', answer: '2026-10-22T20:45' }], arrived: '2026-10-28T19:35' },
    '0025': { rounds: [{ sent: '2026-10-23T10:30', answer: '2026-10-24T09:05' }], arrived: '2026-10-29T12:40' },
    '0026': { rounds: [{ sent: '2026-10-22T10:30', answer: '2026-10-22T16:45' }], arrived: '2026-10-31T17:20' },
    '0027': { rounds: [{ sent: '2026-10-26T10:00', answer: '2026-10-26T11:20' }] },
    '0028': { rounds: [{ sent: '2026-10-28T12:30', answer: '2026-10-28T21:40' }] },
    '0029': { rounds: [{ sent: '2026-10-29T13:15', answer: '2026-10-30T10:00' }] },
    '0030': { rounds: [{ sent: '2026-11-01T08:52' }] },
    '0033': { rounds: [{ sent: '2026-10-31T11:30' }] },
  };
  jobs.forEach((j) => { const l = logs[j.code.slice(-4)]; if (l) j.log = l; });

  // the quote each client saw, once Reem sent it (the client's link, quote.html, shows it); prices are not set in
  // the demo, so every total stays in brackets
  const quotes = {
    '0023': { items: ['Chicken shawarma platters', 'Rice with vermicelli', 'Two salads', 'Lemon-mint juice'], note: 'Delivered at 12:15, with plates and cutlery for 35.' },
    '0024': { items: ['Mixed grill', 'Hummus and mutabbal', 'Fattoush', 'Birthday cake'], note: 'Served at 20:00; Sufra sets up and clears.' },
    '0025': { items: ['Chicken and rice', 'Lentil soup', 'Two salads', 'Fruit'], note: 'Delivered at 12:45, boxed one per person.' },
    '0026': { items: ['Mini fatayer, cheese and spinach', 'Zaatar and halloumi bites', 'Fruit skewers', 'Juice and coffee'], note: 'Standing reception; set up by 17:30, two servers until 20:00.' },
    '0027': { items: ['Coffee and tea', 'Kaak with zaatar', 'Mini sandwiches', 'Date cookies'], note: 'Set up by 15:45 in their hall.' },
    '0028': { items: ['Stuffed chicken with rice and nuts', 'Kibbeh', 'Three salads', 'Muhallabia'], note: 'Delivered hot at 19:30, with serving dishes.' },
    '0029': { items: ['Mansaf with rice and almonds', 'Maqluba', 'Four salads', 'Wedding sweets'], note: 'Buffet for 120, set up by 12:30 with six servers.' },
    '0030': { items: ['Chicken musakhan wraps', 'Mujaddara with yogurt', 'Fattoush and tabbouleh', 'Fruit and mint lemonade'], note: 'Delivered at 12:15, with plates and cutlery for 18.' },
    '0033': { items: ['Mansaf with rice and almonds', 'Stuffed vine leaves', 'Three salads', 'Kunafa trays'], note: 'Buffet for 70, set up by 19:00 with three servers.' },
  };
  jobs.forEach((j) => { const q = quotes[j.code.slice(-4)]; if (q) j.quote = Object.assign({ total: '[TOTAL]' }, q); });

  // A client's answer from their link (quote.html), kept for the visit in sessionStorage 'iqaa-answers', moves the
  // job as the line moves it, so every screen reads it as it would read the server: approved goes on to the next
  // station (the branch, for a big order) past the steps that run by themselves; a change goes back to Quote by the
  // line's way back, and Watar's next draft carries the client's note for Reem.
  let answers = {};
  try { answers = JSON.parse(sessionStorage.getItem('iqaa-answers') || '{}') || {}; } catch (e) { /* storage blocked: no answers */ }
  if (Object.keys(answers).length) {
    // read the line without spending step ids: Build keeps its own copy of the line keyed by them
    const ids = n, ln = line();
    n = ids;
    const approval = ln.stations.findIndex((s) => s.id === 'approval');
    jobs.forEach((j) => {
      const a = answers[j.code];
      if (!a || j.at !== 'approval' || !j.log) return;
      const round = j.log.rounds[j.log.rounds.length - 1];
      round.answer = new Date(a.t).toISOString().slice(0, 16);
      if (a.a === 'change') {
        round.change = a.note;
        Object.assign(j, { at: 'quote', step: 0, asked: a.note });
        if (j.quote) j.draft = Object.assign({}, j.quote, { note: `For the client’s note, “${a.note}”: ${j.quote.note}` });
        return;
      }
      const br = ln.routes.find((r) => r.type === 'branch' && r.from === 'approval' && j.people > r.over);
      const next = br ? br.stations[0] : ln.stations[approval + 1];
      Object.assign(j, { at: next.id, step: Math.max(0, next.steps.findIndex((x) => x.kind !== 'run')) });
    });
  }

  // the orders before today's: SFR-26-0001 to 0022, the codes today's jobs follow (the demo history starts on 26 Aug)
  const past = [
    { code: 'SFR-26-0001', title: 'Board breakfast', people: 12, due: 'Tue 1 Sep, 08:30', iso: '2026-09-01T08:30', client: 'Rami', of: 'Wadi Partners', opened: '2026-08-26T10:15', finished: 'Wed 2 Sep, 10:00', log: { rounds: [{ sent: '2026-08-27T11:00', answer: '2026-08-27T11:40' }], arrived: '2026-09-01T08:10' } },
    { code: 'SFR-26-0002', title: 'Clinic team lunch', people: 20, due: 'Thu 3 Sep, 13:00', iso: '2026-09-03T13:00', client: 'Dr Nadia', of: 'Al-Shifa Clinic', opened: '2026-08-27T09:20', finished: 'Fri 4 Sep, 09:30', log: { rounds: [{ sent: '2026-08-28T10:30', answer: '2026-08-29T09:15' }], arrived: '2026-09-03T12:40' } },
    { code: 'SFR-26-0003', title: 'Meetup coffee break', people: 24, due: 'Sun 6 Sep, 16:00', iso: '2026-09-06T16:00', client: 'Yara', of: 'Majal Hub', opened: '2026-08-30T12:00', finished: 'Mon 7 Sep, 10:15', log: { rounds: [{ sent: '2026-08-31T10:15', answer: '2026-08-31T13:30' }], arrived: '2026-09-06T15:40' } },
    { code: 'SFR-26-0004', title: 'Office lunch', people: 16, due: 'Mon 7 Sep, 12:30', iso: '2026-09-07T12:30', client: 'Omar', of: 'Darb Studio', opened: '2026-09-01T14:00', finished: 'Tue 8 Sep, 10:30', log: { rounds: [{ sent: '2026-09-02T10:40', reminded: '2026-09-04T10:40', answer: '2026-09-04T16:05' }], arrived: '2026-09-07T12:10' } },
    { code: 'SFR-26-0005', title: 'Team lunch', people: 35, due: 'Thu 10 Sep, 13:00', iso: '2026-09-10T13:00', client: 'Maha', of: 'Nakhla Co.', opened: '2026-09-04T10:00', finished: 'Fri 11 Sep, 09:45', log: { rounds: [{ sent: '2026-09-05T12:30', answer: '2026-09-05T14:10' }], arrived: '2026-09-10T12:35' } },
    { code: 'SFR-26-0006', title: 'Workshop lunch', people: 30, due: 'Mon 14 Sep, 12:30', iso: '2026-09-14T12:30', client: 'Lama', of: 'Bina Studio', opened: '2026-09-08T10:30', finished: 'Tue 15 Sep, 09:40', log: { rounds: [{ sent: '2026-09-09T09:50', answer: '2026-09-09T12:20' }], arrived: '2026-09-14T12:05' } },
    { code: 'SFR-26-0007', title: 'Clinic team lunch', people: 22, due: 'Thu 17 Sep, 13:00', iso: '2026-09-17T13:00', client: 'Dr Nadia', of: 'Al-Shifa Clinic', opened: '2026-09-11T09:30', finished: 'Fri 18 Sep, 09:20', log: { rounds: [{ sent: '2026-09-12T10:00', answer: '2026-09-13T08:50' }], arrived: '2026-09-17T12:45' } },
    { code: 'SFR-26-0008', title: 'Family lunch', people: 20, due: 'Fri 18 Sep, 13:30', iso: '2026-09-18T13:30', client: 'Sami Khoury', of: 'a private order', opened: '2026-09-12T19:10', finished: 'Sat 19 Sep, 10:00', log: { rounds: [{ sent: '2026-09-14T10:20', answer: '2026-09-14T21:05' }], arrived: '2026-09-18T13:10' } },
    { code: 'SFR-26-0009', title: 'Meetup coffee break', people: 24, due: 'Sun 20 Sep, 16:00', iso: '2026-09-20T16:00', client: 'Yara', of: 'Majal Hub', opened: '2026-09-14T12:20', finished: 'Mon 21 Sep, 09:50', log: { rounds: [{ sent: '2026-09-15T09:30', answer: '2026-09-15T11:05' }], arrived: '2026-09-20T15:45' } },
    { code: 'SFR-26-0010', title: 'Volunteer lunch', people: 45, due: 'Sat 26 Sep, 13:00', iso: '2026-09-26T13:00', client: 'Rania Odeh', of: 'Hayat Association', opened: '2026-09-19T10:30', finished: 'Sun 27 Sep, 10:10', log: { rounds: [{ sent: '2026-09-21T12:00', answer: '2026-09-22T18:20', change: 'A vegetarian main for 10 guests' }, { sent: '2026-09-23T10:00', answer: '2026-09-24T17:40' }], arrived: '2026-09-26T12:35' } },
    { code: 'SFR-26-0011', title: 'Workshop lunch', people: 35, due: 'Mon 28 Sep, 12:30', iso: '2026-09-28T12:30', client: 'Lama', of: 'Bina Studio', opened: '2026-09-22T10:00', finished: 'Tue 29 Sep, 09:30', log: { rounds: [{ sent: '2026-09-23T09:40', answer: '2026-09-23T12:15' }], arrived: '2026-09-28T12:05' } },
    { code: 'SFR-26-0012', title: 'Clinic team lunch', people: 22, due: 'Thu 1 Oct, 13:00', iso: '2026-10-01T13:00', client: 'Dr Nadia', of: 'Al-Shifa Clinic', opened: '2026-09-24T11:00', finished: 'Fri 2 Oct, 09:15', log: { rounds: [{ sent: '2026-09-25T10:15', answer: '2026-09-26T09:30' }], arrived: '2026-10-01T12:40' } },
    { code: 'SFR-26-0013', title: 'Meetup coffee break', people: 24, due: 'Sun 4 Oct, 16:00', iso: '2026-10-04T16:00', client: 'Yara', of: 'Majal Hub', opened: '2026-09-27T13:00', finished: 'Mon 5 Oct, 10:00', log: { rounds: [{ sent: '2026-09-28T10:00', answer: '2026-09-28T12:40' }], arrived: '2026-10-04T16:15' } },
    { code: 'SFR-26-0014', title: 'Office lunch', people: 18, due: 'Mon 5 Oct, 12:30', iso: '2026-10-05T12:30', client: 'Omar', of: 'Darb Studio', opened: '2026-09-29T13:30', finished: 'Tue 6 Oct, 10:20', log: { rounds: [{ sent: '2026-09-30T11:10', reminded: '2026-10-02T11:10', answer: '2026-10-03T09:25' }], arrived: '2026-10-05T12:15' } },
    { code: 'SFR-26-0015', title: 'Board breakfast', people: 12, due: 'Tue 6 Oct, 08:30', iso: '2026-10-06T08:30', client: 'Rami', of: 'Wadi Partners', opened: '2026-09-30T16:40', finished: 'Wed 7 Oct, 09:40', log: { rounds: [{ sent: '2026-10-01T10:05', answer: '2026-10-01T10:50', change: 'No dairy for two guests' }, { sent: '2026-10-01T13:20', answer: '2026-10-01T14:30' }], arrived: '2026-10-06T08:05' } },
    { code: 'SFR-26-0016', title: 'Team lunch', people: 38, due: 'Thu 8 Oct, 13:00', iso: '2026-10-08T13:00', client: 'Maha', of: 'Nakhla Co.', opened: '2026-10-02T09:45', finished: 'Fri 9 Oct, 09:30', log: { rounds: [{ sent: '2026-10-03T11:30', answer: '2026-10-03T13:05' }], arrived: '2026-10-08T12:30' } },
    { code: 'SFR-26-0017', title: 'Poetry evening', people: 40, due: 'Sat 10 Oct, 18:30', iso: '2026-10-10T18:30', client: 'Karim', of: 'Dar Qalam', opened: '2026-10-03T12:00', finished: 'Sun 11 Oct, 10:30', log: { rounds: [{ sent: '2026-10-04T15:00', answer: '2026-10-04T18:20' }], arrived: '2026-10-10T18:00' } },
    { code: 'SFR-26-0018', title: 'Workshop lunch', people: 35, due: 'Mon 12 Oct, 12:30', iso: '2026-10-12T12:30', client: 'Lama', of: 'Bina Studio', opened: '2026-10-06T09:50', finished: 'Tue 13 Oct, 09:30', log: { rounds: [{ sent: '2026-10-07T10:30', answer: '2026-10-07T11:45' }], arrived: '2026-10-12T12:50' } },
    { code: 'SFR-26-0019', title: 'Clinic team lunch', people: 22, due: 'Thu 15 Oct, 13:00', iso: '2026-10-15T13:00', client: 'Dr Nadia', of: 'Al-Shifa Clinic', opened: '2026-10-08T10:40', finished: 'Fri 16 Oct, 09:20', log: { rounds: [{ sent: '2026-10-09T10:00', answer: '2026-10-10T09:10' }], arrived: '2026-10-15T12:40' } },
    { code: 'SFR-26-0020', title: 'Fundraising breakfast', people: 30, due: 'Sat 17 Oct, 09:00', iso: '2026-10-17T09:00', client: 'Rania Odeh', of: 'Hayat Association', opened: '2026-10-10T11:00', finished: 'Sun 18 Oct, 10:00', log: { rounds: [{ sent: '2026-10-12T10:15', reminded: '2026-10-14T10:15', answer: '2026-10-14T19:30' }], arrived: '2026-10-17T08:35' } },
    { code: 'SFR-26-0021', title: 'Meetup coffee break', people: 24, due: 'Sun 18 Oct, 16:00', iso: '2026-10-18T16:00', client: 'Yara', of: 'Majal Hub', opened: '2026-10-11T12:45', finished: 'Mon 19 Oct, 09:45', log: { rounds: [{ sent: '2026-10-12T09:45', answer: '2026-10-12T10:30' }], arrived: '2026-10-18T15:40' } },
    { code: 'SFR-26-0022', title: 'Tasting for the wedding lunch', people: 6, due: 'Sat 17 Oct, 17:00', iso: '2026-10-17T17:00', client: 'Huda Nasser', of: 'a private order', opened: '2026-10-12T18:30', finished: 'Sun 18 Oct, 11:00', log: { rounds: [{ sent: '2026-10-13T10:00', answer: '2026-10-13T10:40' }], arrived: '2026-10-17T16:45' } },
  ];

  // the clients, keyed by the company, or by the person for a private order; contact details stay in brackets and
  // emails use reserved example domains. `by` is the channel Sufra's messages go by: every message of version 3 goes
  // by email (Build's seed) and email is the one channel Sufra has connected (`channels`, shown in Settings).
  const clients = {
    'nakhla-co': { name: 'Nakhla Co.', contact: 'Maha', by: 'Email', phone: '[PHONE]', email: 'maha@nakhla.example', address: '[ADDRESS], Ramallah' },
    'wadi-partners': { name: 'Wadi Partners', contact: 'Rami', by: 'Email', phone: '[PHONE]', email: 'rami@wadi.example', address: '[ADDRESS], Ramallah' },
    'darb-studio': { name: 'Darb Studio', contact: 'Omar', by: 'Email', phone: '[PHONE]', email: 'omar@darb.example', address: '[ADDRESS], Ramallah' },
    'majal-hub': { name: 'Majal Hub', contact: 'Yara', by: 'Email', phone: '[PHONE]', email: 'yara@majal.example', address: '[ADDRESS], Ramallah' },
    'hayat-association': { name: 'Hayat Association', contact: 'Rania Odeh', by: 'Email', phone: '[PHONE]', email: 'rania@hayat.example', address: '[ADDRESS], Ramallah' },
    'dar-qalam': { name: 'Dar Qalam', contact: 'Karim', by: 'Email', phone: '[PHONE]', email: 'karim@darqalam.example', address: '[ADDRESS], Ramallah' },
    'al-shifa-clinic': { name: 'Al-Shifa Clinic', contact: 'Dr Nadia', by: 'Email', phone: '[PHONE]', email: 'nadia@alshifa.example', address: '[ADDRESS], Ramallah' },
    'bina-studio': { name: 'Bina Studio', contact: 'Lama', by: 'Email', phone: '[PHONE]', email: 'lama@bina.example', address: '[ADDRESS], Ramallah' },
    'aseel-haddad': { name: 'Aseel Haddad', private: true, by: 'Email', phone: '[PHONE]', email: 'aseel.haddad@example.com', address: '[ADDRESS]' },
    'lina-saleh': { name: 'Lina Saleh', private: true, by: 'Email', phone: '[PHONE]', email: 'lina.saleh@example.com', address: '[ADDRESS]' },
    'huda-nasser': { name: 'Huda Nasser', private: true, by: 'Email', phone: '[PHONE]', email: 'huda.nasser@example.com', address: '[ADDRESS]' },
    'sami-khoury': { name: 'Sami Khoury', private: true, by: 'Email', phone: '[PHONE]', email: 'sami.khoury@example.com', address: '[ADDRESS]' },
    'samer-haddad': { name: 'Samer Haddad', private: true, by: 'Email', phone: '[PHONE]', email: 'samer.haddad@example.com', address: '[ADDRESS]' },
  };
  // every order knows its client: 'Nakhla Co.' -> 'nakhla-co'; a private order by its person ('Lina Saleh' -> 'lina-saleh')
  const keyOf = (j) => (j.of === 'a private order' ? j.client : j.of).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  jobs.concat(past).forEach((j) => { j.ck = keyOf(j); });

  // what each person finished this morning, before the screen opened, in order: Today and Overview draw each
  // person's entries in this order, and the shared clock pins each step (and the steps it set off) at its time
  const done = [
    { who: 'Reem', code: 'SFR-26-0034', title: 'Board breakfast', step: 'Reem logs the order', time: '08:30', then: 'Iqaa sent Rami a receipt', to: 'Quote', kinds: ['struck', 'run'] },
    { who: 'Reem', code: 'SFR-26-0030', title: 'Office lunch', step: 'Reem checks the prices', time: '08:52', then: 'Iqaa sent the quote link to Omar', to: 'Client approval', kinds: ['struck', 'run'] },
    { who: 'Reem', code: 'SFR-26-0035', title: 'Engagement lunch', step: 'Reem logs the order', time: '09:20', then: 'Iqaa is sending Lina a receipt', to: '', kinds: ['struck', 'run'] },
    { who: 'Salma', code: 'SFR-26-0027', title: 'Meetup coffee break', step: 'Salma prepares', time: '09:05', then: 'Iqaa sent Yara the arrival time', to: 'Deliver', kinds: ['struck', 'run'] },
  ];

  // asked to join and not joined yet; the link works for seven days from `sent` (Fri 30 Oct -> Fri 6 Nov)
  const invites = [
    { name: 'Nour', email: 'nour@sufra.example', role: 'Kitchen', access: 'member', sent: '2026-10-30T16:20', by: 'Hala' },
  ];

  // the organization as Settings shows it; its working day is `hours` below, the one every screen's clock reads
  const org = { name: 'Sufra', address: 'sufra.iqaa.app', field: 'Catering', zone: 'Asia/Hebron', clientLanguage: 'English', mark: 'initial', logo: null };

  // how the line reaches clients: every message of version 3 goes by email, as Build seeds it; nothing else is connected
  const channels = {
    email: { on: true, from: 'Sufra', replyTo: 'orders@sufra.example' },
    whatsapp: { on: false, number: '' },
    sms: { on: false, number: '' },
  };

  // what each sending step of the line says, for Settings' preview. {org} is the organization's name; {client} the
  // client's short name; {title} {people} {due} {time} {link} come from the job; {deliverer} is who does the person
  // step at Deliver. The reminder's words are the line's own (its step's msg), so they are not repeated here.
  const messages = {
    'Send the client a receipt': { to: 'client', by: 'Email', subject: '{org} has your order',
      body: 'Hi {client}, {org} has your order: {title} for {people} people on {due}. Your quote comes next.' },
    'Send the quote link': { to: 'client', by: 'Email', subject: 'Your quote for {title}',
      body: 'Hi {client}, your quote is ready. Approve it or ask for a change from this link; you don’t need an account.', button: 'Open the quote', link: true },
    'Remind the client': { to: 'client', by: 'Email', subject: 'Your quote for {title} is waiting', button: 'Open the quote', link: true },
    'Remind the kitchen a day before': { to: 'team', by: null },
    'Send the arrival time': { to: 'client', by: 'Email', subject: '{org} is on its way',
      body: 'Hi {client}, {title} is ready. {deliverer} brings it to you for {time} today.' },
    'Send the invoice': { to: 'client', by: 'Email', subject: 'Your invoice for {title}',
      body: 'Hi {client}, thank you for having {org}. Your invoice for {title} is attached. Total [TOTAL].' },
  };

  // what Sufra pays Iqaa: no plan or price exists yet, so both stay in brackets; Iqaa has made no invoice
  const billing = { plan: '[PLAN]', price: '[PRICE]', email: 'hala@sufra.example', billTo: { name: 'Sufra', address: '[ADDRESS], Ramallah' }, invoices: [] };

  // now: the demo's moment, once, for the clock every page shares (jobs.js views); version: the line's published
  // version, the one every job today walks; hours: Sufra's working day, over which the clock spreads unrecorded steps
  window.SUFRA = { day: 'Sunday 1 November', dayIso: '2026-11-01', now: '2026-11-01T09:41', version: 3, hours: { open: '08:00', close: '18:00' },
    line, people, jobs, done, past, clients, invites, org, channels, messages, billing };
})();
