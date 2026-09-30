// Events section: draws this month and next as small calendars beside the
// list, and drops events that have passed. The list itself is rendered by
// Jekyll, so without this script the section still works — just as a list
// that is as current as the last build.

(function () {
  var section = document.getElementById('events');
  if (!section) return;

  var layout = section.querySelector('.events-layout');
  var cals = section.querySelector('.event-calendars');
  var empty = section.querySelector('.event-empty');
  var legend = section.querySelector('.event-key');

  function pad(n) {
    return (n < 10 ? '0' : '') + n;
  }

  function iso(y, m, d) {
    return y + '-' + pad(m + 1) + '-' + pad(d);
  }

  var now = new Date();
  var today = iso(now.getFullYear(), now.getMonth(), now.getDate());
  // The last day of next month: the list covers what the two calendars do.
  var horizonDay = new Date(now.getFullYear(), now.getMonth() + 2, 0);
  var horizon = iso(horizonDay.getFullYear(), horizonDay.getMonth(), horizonDay.getDate());

  // --- Drop what has passed since the last build, and what is further out ---
  var items = [].slice.call(section.querySelectorAll('.event')).filter(function (li) {
    var last = li.getAttribute('data-end') || li.getAttribute('data-date');
    if (last < today || li.getAttribute('data-date') > horizon) {
      li.remove();
      return false;
    }
    return true;
  });

  [].forEach.call(section.querySelectorAll('.event-month'), function (group) {
    if (!group.querySelector('.event')) group.remove();
  });

  if (!items.length) {
    layout.hidden = true;
    legend.hidden = true;
    empty.hidden = false;
    return;
  }

  // The key keeps only the hosts still on the list.
  [].forEach.call(legend.querySelectorAll('[data-key]'), function (entry) {
    var host = entry.getAttribute('data-key');
    entry.hidden = !items.some(function (li) { return li.getAttribute('data-host') === host; });
  });

  // A multi-day event is marked on every day it runs.
  var byDate = {};
  items.forEach(function (li) {
    var p = li.getAttribute('data-date').split('-');
    var day = new Date(+p[0], p[1] - 1, +p[2]);
    var end = li.getAttribute('data-end') || li.getAttribute('data-date');
    for (var d = li.getAttribute('data-date'); d <= end;
         day.setDate(day.getDate() + 1), d = iso(day.getFullYear(), day.getMonth(), day.getDate())) {
      (byDate[d] = byDate[d] || []).push(li);
    }
  });

  // --- Calendars ---
  var monthName = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });
  var dayName = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric' });
  var weekdays = [
    ['S', 'Sunday'], ['M', 'Monday'], ['T', 'Tuesday'], ['W', 'Wednesday'],
    ['T', 'Thursday'], ['F', 'Friday'], ['S', 'Saturday']
  ];

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function describe(li) {
    var title = li.querySelector('.event-title').textContent.trim();
    var host = li.querySelector('.event-host').textContent.trim();
    return title + ' (' + host + ')';
  }

  function month(y, m) {
    var table = el('table', 'event-cal');
    table.appendChild(el('caption', null, monthName.format(new Date(y, m, 1))));

    var head = el('tr');
    weekdays.forEach(function (w) {
      var th = el('th', null, w[0]);
      th.setAttribute('scope', 'col');
      th.setAttribute('abbr', w[1]);
      head.appendChild(th);
    });
    table.appendChild(el('thead')).appendChild(head);

    var body = table.appendChild(el('tbody'));
    var upcoming = 0;
    var lead = new Date(y, m, 1).getDay();
    var days = new Date(y, m + 1, 0).getDate();
    var row;

    for (var i = 0; i < lead + days; i++) {
      if (i % 7 === 0) row = body.appendChild(el('tr'));
      var td = row.appendChild(el('td'));
      if (i < lead) continue;

      var d = i - lead + 1;
      var key = iso(y, m, d);
      var events = byDate[key];
      var cell;

      if (events) {
        upcoming += events.length;
        cell = el('a', 'cal-day has-events');
        cell.href = '#' + events[0].id;
        cell.setAttribute('aria-label', dayName.format(new Date(y, m, d)) + ': ' +
          events.map(describe).join('; '));
        cell.appendChild(el('span', 'cal-num', d));
        var marks = cell.appendChild(el('span', 'cal-marks'));
        events.slice(0, 3).forEach(function (li) {
          var mark = marks.appendChild(el('span', 'event-mark'));
          mark.setAttribute('data-host', li.getAttribute('data-host'));
          // Lets hovering an event in the list point back at its days.
          (li.calDays = li.calDays || []).push(cell);
        });
      } else {
        cell = el('span', 'cal-day');
        cell.appendChild(el('span', 'cal-num', d));
      }

      if (key < today) cell.classList.add('is-past');
      if (key === today) {
        cell.classList.add('is-today');
        if (!events) cell.setAttribute('aria-label', 'Today, ' + dayName.format(new Date(y, m, d)));
      }
      td.appendChild(cell);
    }
    // Pad the last week so the grid keeps its shape.
    while (row.children.length < 7) row.appendChild(el('td'));
    // On a phone a month with nothing ahead in it is a screenful of dead grid.
    if (!upcoming) table.classList.add('is-quiet');

    return table;
  }

  var y = now.getFullYear();
  var m = now.getMonth();
  cals.appendChild(month(y, m));
  cals.appendChild(month(m === 11 ? y + 1 : y, (m + 1) % 12));

  items.forEach(function (li) {
    if (!li.calDays) return;
    function on() { li.calDays.forEach(function (c) { c.classList.add('is-linked'); }); }
    function off() { li.calDays.forEach(function (c) { c.classList.remove('is-linked'); }); }
    li.addEventListener('mouseenter', on);
    li.addEventListener('mouseleave', off);
    li.addEventListener('focusin', on);
    li.addEventListener('focusout', off);
  });
})();
